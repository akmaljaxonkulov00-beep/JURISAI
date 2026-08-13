-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Enable Google Identity Linking + Backfill auth.identities
-- ═══════════════════════════════════════════════════════════════════════════
-- MUAMMO:
--   Firebase'dan ko'chirilgan barcha userlar auth.identities da hech qanday
--   identity yozuviga ega emas edi. Supabase Auth automatic linking (bir xil
--   email bilan ikkinchi provider orqali kirganda yagona user'ga birlashtirish)
--   aynan auth.identities jadvalidagi yozuvlarga tayanadi.
--
--   Identities bo'lmagani uchun:
--     • Google orqali kirishda Supabase mavjud (email/parol) userni topa
--       olmaydi va YANGI user yaratardi (duplicate).
--     • bitta akkaunt ikkala provider bilan kirganda 2 xil profil paydo bo'lardi.
--
-- YECHIM:
--   1) Barcha mavjud auth.users uchun auth.identities ga yozuvlar backfill
--      qilinadi (email provider + Google orqali yaratilganlar uchun google).
--   2) Automatic linking sozlamasi yoqiladi (agar mavjud bo'lsa).
--   3) Duplicate hisoblarni birlashtirish uchun merge funksiyasi yaratiladi.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PHASE 0: Yordamchi — identity mavjudligini tekshirish ─────────────────
-- auth.identities jadvalida kerakli ustunlar borligini tekshirib, yo'q bo'lsa
-- qo'shamiz (har xil GoTrue versiyalari uchun xavfsiz).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'identities'
  ) THEN
    RAISE NOTICE 'auth.identities mavjud — davom etamiz';
  ELSE
    RAISE EXCEPTION 'auth.identities jadvali topilmadi — Supabase Auth versiyasini tekshiring';
  END IF;
END $$;

-- ── PHASE 1: EMAIL identity'larini backfill qilish ──────────────────────
-- Email/parol orqali ro'yxatdan o'tgan barcha userlar uchun 'email'
-- provider identity yozuvi yaratiladi. Bu automatic linking uchun asos.
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.id::TEXT,
  u.id,
  jsonb_build_object(
    'sub', u.id::TEXT,
    'email', u.email,
    'email_verified', COALESCE((u.raw_user_meta_data->>'email_verified')::BOOLEAN, u.email_confirmed_at IS NOT NULL),
    'phone_verified', COALESCE((u.raw_user_meta_data->>'phone_verified')::BOOLEAN, false)
  ),
  'email',
  COALESCE(u.last_sign_in_at, u.created_at, NOW()),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  )
ON CONFLICT DO NOTHING;

-- ── PHASE 2: GOOGLE identity'larini backfill qilish ─────────────────────
-- Google OAuth orqali yaratilgan userlar uchun (raw_user_meta_data->>'sub'
-- Google tomonidan berilgan sub ID) 'google' identity yozuvi yaratiladi.
-- Shunda keyingi Google kirishida Supabase bu identity'ni tanib,
-- mavjud user'ga automatic link qiladi (yangi duplicate yaratmaydi).
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  u.raw_user_meta_data->>'sub',
  u.id,
  jsonb_build_object(
    'sub', u.raw_user_meta_data->>'sub',
    'email', COALESCE(u.raw_user_meta_data->>'email', u.email),
    'email_verified', COALESCE((u.raw_user_meta_data->>'email_verified')::BOOLEAN, u.email_confirmed_at IS NOT NULL),
    'phone_verified', COALESCE((u.raw_user_meta_data->>'phone_verified')::BOOLEAN, false),
    'provider_id', u.raw_user_meta_data->>'sub',
    'full_name', u.raw_user_meta_data->>'full_name',
    'avatar_url', u.raw_user_meta_data->>'avatar_url',
    'picture', u.raw_user_meta_data->>'picture',
    'name', u.raw_user_meta_data->>'name'
  ),
  'google',
  COALESCE(u.last_sign_in_at, u.created_at, NOW()),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
WHERE (u.raw_user_meta_data->>'sub') IS NOT NULL
  AND (u.raw_user_meta_data->>'sub') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'google'
  )
ON CONFLICT DO NOTHING;

-- ── PHASE 3: Automatic linking sozlamasini yoqish ────────────────────────
-- GoTrue'ning auth.config jadvalida automatic/manual linking sozlamalari
-- bor bo'lsa yoqiladi (har xil versiyalar uchun xavfsiz).
DO $$
DECLARE
  col_name TEXT;
BEGIN
  FOR col_name IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'config'
      AND column_name IN ('security_auto_link_user', 'security_autolink', 'enable_auto_linking', 'security_manual_linking_enabled', 'enable_manual_linking')
  LOOP
    EXECUTE format('UPDATE auth.config SET %I = true', col_name);
    RAISE NOTICE 'Yoqildi: auth.config.%', col_name;
  END LOOP;
END $$;

-- ── PHASE 4: Duplicate userlarni birlashtirish funksiyasi ────────────────
-- Agar bir xil email bilan 2 ta auth user mavjud bo'lsa (masalan Google
-- identity'lar backfill qilinishidan oldin yaratilgan duplicate), ularni
-- birlashtirish uchun xavfsiz funksiya. p_keep_id — saqlanadigan user,
-- p_remove_id — o'chiriladigan duplicate.
CREATE OR REPLACE FUNCTION public.merge_duplicate_users(
  p_keep_id UUID,
  p_remove_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_keep_email TEXT;
  v_keep_role TEXT;
  v_keep_name TEXT;
  v_keep_avatar TEXT;
  v_keep_subscription TEXT;
  v_keep_expires TIMESTAMPTZ;
  v_remove_email TEXT;
  v_remove_role TEXT;
BEGIN
  IF p_keep_id IS NULL OR p_remove_id IS NULL OR p_keep_id = p_remove_id THEN
    RETURN p_keep_id;
  END IF;

  -- Saqlanadigan user ma'lumotlarini o'qiymiz
  SELECT email, COALESCE(raw_user_meta_data->>'role', 'USER'),
         COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', raw_user_meta_data->>'email', ''),
         COALESCE(raw_user_meta_data->>'avatar', ''),
         COALESCE(raw_user_meta_data->>'subscription_plan', 'free'),
         COALESCE(raw_user_meta_data->>'subscription_expires_at', NULL)::TIMESTAMPTZ
  INTO v_keep_email, v_keep_role, v_keep_name, v_keep_avatar, v_keep_subscription, v_keep_expires
  FROM auth.users WHERE id = p_keep_id;

  SELECT email, COALESCE(raw_user_meta_data->>'role', 'USER')
  INTO v_remove_email, v_remove_role
  FROM auth.users WHERE id = p_remove_id;

  -- 1) Identity'larni ko'chirish (p_remove → p_keep)
  UPDATE auth.identities
  SET user_id = p_keep_id, updated_at = NOW()
  WHERE user_id = p_remove_id
    AND NOT EXISTS (
      SELECT 1 FROM auth.identities i2
      WHERE i2.user_id = p_keep_id AND i2.provider = auth.identities.provider
    );

  -- 2) app_metadata.providers ro'yxatini yangilash
  UPDATE auth.users
  SET app_metadata = app_metadata || jsonb_build_object(
    'providers', (
      SELECT COALESCE(jsonb_agg(DISTINCT provider), '[]'::jsonb)
      FROM auth.identities WHERE user_id = p_keep_id
    )
  )
  WHERE id = p_keep_id;

  -- 3) registered_users jadvalini birlashtirish
  UPDATE public.registered_users ru_keep
  SET
    email = COALESCE(NULLIF(ru_keep.email, ''), ru_remove.email),
    name = COALESCE(NULLIF(ru_keep.name, ''), ru_remove.name),
    role = CASE
      WHEN LOWER(COALESCE(ru_remove.role, '')) IN ('admin', 'super_admin') THEN 'ADMIN'
      WHEN LOWER(COALESCE(ru_keep.role, '')) IN ('admin', 'super_admin') THEN 'ADMIN'
      ELSE COALESCE(ru_keep.role, 'USER')
    END,
    avatar = COALESCE(NULLIF(ru_keep.avatar, ''), ru_remove.avatar),
    subscription_plan = CASE
      WHEN ru_remove.subscription_plan <> 'free' THEN ru_remove.subscription_plan
      ELSE ru_keep.subscription_plan
    END,
    subscription_expires_at = COALESCE(ru_keep.subscription_expires_at, ru_remove.subscription_expires_at),
    last_login = GREATEST(COALESCE(ru_keep.last_login, '1970-01-01'), COALESCE(ru_remove.last_login, '1970-01-01')),
    updated_at = NOW()
  FROM public.registered_users ru_remove
  WHERE ru_keep.id = p_keep_id
    AND ru_remove.id = p_remove_id;

  -- Agar registered_users da duplicate qator bo'lsa o'chiramiz
  DELETE FROM public.registered_users WHERE id = p_remove_id;

  -- 4) Duplicate auth userni o'chirish
  DELETE FROM auth.users WHERE id = p_remove_id;

  RETURN p_keep_id;
END;
$$;

-- Funksiyani barchaga ruxsat berish (service role orqali RPC chaqirish uchun)
GRANT EXECUTE ON FUNCTION public.merge_duplicate_users(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_users(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_users(UUID, UUID) TO authenticated;

-- ── PHASE 5: Tekshiruv ───────────────────────────────────────────────────
SELECT 'auth.identities' AS tbl, provider, COUNT(*) AS cnt
FROM auth.identities
GROUP BY provider
ORDER BY provider;

SELECT 'auth.users' AS tbl, COUNT(*) AS cnt FROM auth.users;

-- Duplicate email'lar bo'lsa ko'rsatadi (bo'sh bo'lishi kerak)
SELECT email, COUNT(*) AS cnt
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;
