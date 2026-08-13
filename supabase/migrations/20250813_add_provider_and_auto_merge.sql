-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: registered_users.provider ustuni + Avtomatik merge triggerlar
-- ═══════════════════════════════════════════════════════════════════════════
-- 1) registered_users jadvaliga `provider` ustuni qo'shiladi (email/google).
-- 2) Mavjud userlar uchun auth.identities asosida backfill qilinadi.
-- 3) AVTOMATIK MERGE triggerlar:
--    a) registered_users — bir xil email bilan yangi qator kiritilsa, mavjud
--       profil bilan avtomatik birlashtiriladi (ADMIN rol saqlanadi, duplicate
--       qator yaratilmaydi).
--    b) auth.identities — Google OAuth orqali yangi identity yaratilganda,
--       shu email boshqa user'da mavjud bo'lsa, identity shu user'ga
--       ko'chiriladi (keyingi login automatic linking orqali ishlaydi).
--       Xavfsizlik uchun auth user o'chirilmaydi — ortiqcha duplicate'ni
--       ilova merge funksiyasi (link-identity API) tozalaydi.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PHASE 1: provider ustuni ─────────────────────────────────────────────
ALTER TABLE public.registered_users
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

COMMENT ON COLUMN public.registered_users.provider
  IS 'Kirish usuli: email | google | github | facebook | apple';

-- ── PHASE 2: Mavjud userlar uchun backfill ───────────────────────────────
-- auth.identities orqali har bir userning asl kirish provider'ini aniqlaymiz.
-- Bir nechta identity bo'lsa: google birinchi o'rinda (OAuth orqali yaratilgan),
-- aks holda eng eski identity.
UPDATE public.registered_users ru
SET provider = COALESCE(
  (
    SELECT i.provider
    FROM auth.identities i
    WHERE i.user_id = ru.id
    ORDER BY (i.provider = 'google') DESC, i.created_at ASC, i.id ASC
    LIMIT 1
  ),
  'email'
)
WHERE EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = ru.id);

-- ── PHASE 3: Umumiy merge funksiyasi (registered_users) ──────────────────
-- p_keep_id — saqlanadigan user, p_remove_id — o'chiriladigan duplicate.
-- ADMIN rol har qanday holatda saqlanadi; to'lov/usage/log yozuvlari
-- ko'chiriladi; eng to'liq profil ma'lumotlari qoladi.
CREATE OR REPLACE FUNCTION public.merge_duplicate_registered_users(
  p_keep_id UUID,
  p_remove_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_keep_id IS NULL OR p_remove_id IS NULL OR p_keep_id = p_remove_id THEN
    RETURN;
  END IF;

  -- Bog'liq yozuvlarni saqlanadigan user'ga ko'chirish (agar ustunlar mavjud bo'lsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_requests' AND column_name = 'user_id'
  ) THEN
    UPDATE public.payment_requests SET user_id = p_keep_id WHERE user_id = p_remove_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usage_logs' AND column_name = 'user_id'
  ) THEN
    UPDATE public.usage_logs SET user_id = p_keep_id WHERE user_id = p_remove_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'auth_logs' AND column_name = 'user_id'
  ) THEN
    UPDATE public.auth_logs SET user_id = p_keep_id WHERE user_id = p_remove_id;
  END IF;

  -- Profil ma'lumotlarini birlashtirish: ADMIN rol saqlanadi
  UPDATE public.registered_users ru_keep
  SET
    email = COALESCE(NULLIF(ru_keep.email, ''), ru_remove.email),
    name = COALESCE(NULLIF(ru_keep.name, ''), ru_remove.name),
    full_name = COALESCE(NULLIF(ru_keep.full_name, ''), ru_remove.full_name),
    role = CASE
      WHEN LOWER(COALESCE(ru_remove.role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      WHEN LOWER(COALESCE(ru_keep.role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      ELSE COALESCE(NULLIF(ru_keep.role, ''), 'USER')
    END,
    avatar = COALESCE(NULLIF(ru_keep.avatar, ''), ru_remove.avatar),
    subscription_plan = CASE
      WHEN COALESCE(ru_remove.subscription_plan, 'free') <> 'free' THEN ru_remove.subscription_plan
      ELSE ru_keep.subscription_plan
    END,
    subscription_expires_at = COALESCE(ru_keep.subscription_expires_at, ru_remove.subscription_expires_at),
    last_login = GREATEST(
      COALESCE(ru_keep.last_login, '1970-01-01'::TIMESTAMPTZ),
      COALESCE(ru_remove.last_login, '1970-01-01'::TIMESTAMPTZ)
    ),
    provider = COALESCE(NULLIF(ru_keep.provider, ''), ru_remove.provider),
    updated_at = NOW()
  FROM public.registered_users ru_remove
  WHERE ru_keep.id = p_keep_id
    AND ru_remove.id = p_remove_id;

  -- Duplicate qatorni o'chirish
  DELETE FROM public.registered_users WHERE id = p_remove_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_duplicate_registered_users(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_registered_users(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_registered_users(UUID, UUID) TO authenticated;

-- ── PHASE 4: Trigger A — registered_users avtomatik merge ────────────────
-- Bir xil email bilan yangi qator kiritilsa (masalan Google yangi UUID bilan
-- sync qilinsa), mavjud profil bilan birlashtiriladi va insert bekor qilinadi.
CREATE OR REPLACE FUNCTION public.auto_merge_registered_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing UUID;
BEGIN
  -- Email'isiz yozuvlar yoki rekursiya himoyasi
  IF NEW.email IS NULL OR NEW.email = '' OR pg_trigger_depth() > 2 THEN
    RETURN NEW;
  END IF;

  -- Bir xil email bilan mavjud user: ADMIN birinchi o'rinda, keyin eng eski
  SELECT id INTO v_existing
  FROM public.registered_users
  WHERE LOWER(email) = LOWER(NEW.email) AND id <> NEW.id
  ORDER BY
    (CASE WHEN LOWER(COALESCE(role, 'user')) IN ('admin', 'super_admin') THEN 0 ELSE 1 END),
    created_at ASC,
    id ASC
  LIMIT 1;

  IF v_existing IS NULL THEN
    RETURN NEW;
  END IF;

  -- Mavjud profilga yangi ma'lumotlarni birlashtirish.
  -- Eslatma: PostgreSQL'da UPDATE ... FROM o'z jadvalini takrorlash
  -- taqiqlangan ("table name specified more than once") — shuning uchun
  -- SET ichida eski qiymatlar to'g'ridan-to'g'ri ustun nomi bilan olinadi.
  UPDATE public.registered_users
  SET
    name = COALESCE(NULLIF(name, ''), NEW.name),
    full_name = COALESCE(NULLIF(full_name, ''), NEW.full_name),
    role = CASE
      WHEN LOWER(COALESCE(NEW.role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      WHEN LOWER(COALESCE(role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      ELSE COALESCE(NULLIF(role, ''), 'USER')
    END,
    avatar = COALESCE(NULLIF(avatar, ''), NEW.avatar),
    subscription_plan = CASE
      WHEN COALESCE(NEW.subscription_plan, 'free') <> 'free' THEN NEW.subscription_plan
      ELSE subscription_plan
    END,
    subscription_expires_at = COALESCE(subscription_expires_at, NEW.subscription_expires_at),
    last_login = GREATEST(
      COALESCE(last_login, '1970-01-01'::TIMESTAMPTZ),
      COALESCE(NEW.last_login, '1970-01-01'::TIMESTAMPTZ)
    ),
    provider = COALESCE(NULLIF(provider, ''), NEW.provider),
    updated_at = NOW()
  WHERE id = v_existing;

  -- Duplicate insertni bekor qilish
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_registered_users_auto_merge ON public.registered_users;
CREATE TRIGGER trg_registered_users_auto_merge
BEFORE INSERT ON public.registered_users
FOR EACH ROW
EXECUTE FUNCTION public.auto_merge_registered_users();

-- ── PHASE 5: Trigger B — auth.identities avtomatik link ──────────────────
-- Google OAuth orqali yangi identity yaratilganda, shu email mavjud
-- user'ning identity'siga mos kelsa — identity shu mavjud user'ga
-- ko'chiriladi. Xavfsizlik: auth user o'chirilmaydi (GoTrue sessiya
-- yaratish jarayoni buzilmasligi uchun), qolgan duplicate'ni ilova
-- merge logikasi (link-identity API) tozalaydi.
CREATE OR REPLACE FUNCTION public.auto_link_oauth_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_email TEXT;
  v_existing_user UUID;
BEGIN
  -- Email faqat identity_data ichida o'qiladi (auth.identities.email
  -- ustuni har xil Supabase versiyalarida mavjud emas)
  v_email := NEW.identity_data->>'email';

  -- Faqat OAuth identity'lar uchun (email identity'larda email bo'lmaydi),
  -- rekursiya himoyasi bilan
  IF v_email IS NULL OR v_email = '' OR pg_trigger_depth() > 2 THEN
    RETURN NEW;
  END IF;

  -- Shu email bilan boshqa user'da identity mavjudmi?
  SELECT i.user_id INTO v_existing_user
  FROM auth.identities i
  WHERE i.identity_data->>'email' = v_email
    AND i.user_id <> NEW.user_id
  ORDER BY i.created_at ASC, i.user_id ASC
  LIMIT 1;

  IF v_existing_user IS NULL THEN
    RETURN NEW;
  END IF;

  -- Yangi identity'ni mavjud user'ga ko'chirish
  UPDATE auth.identities
  SET user_id = v_existing_user, updated_at = NOW()
  WHERE id = NEW.id;

  -- Mavjud user'ning providers ro'yxatini yangilash
  UPDATE auth.users
  SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || jsonb_build_object(
    'providers', (
      SELECT COALESCE(jsonb_agg(DISTINCT provider), '[]'::jsonb)
      FROM auth.identities WHERE user_id = v_existing_user
    )
  )
  WHERE id = v_existing_user;

  -- registered_users da duplicate profil bo'lsa birlashtirish
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'registered_users'
  ) THEN
    PERFORM public.merge_duplicate_registered_users(v_existing_user, NEW.user_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_identities_auto_link ON auth.identities;
CREATE TRIGGER trg_auth_identities_auto_link
AFTER INSERT ON auth.identities
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_oauth_identity();

-- ── PHASE 6: Tekshiruv ───────────────────────────────────────────────────
SELECT 'registered_users' AS tbl, provider, COUNT(*) AS cnt
FROM public.registered_users
GROUP BY provider
ORDER BY provider;

-- Duplicate email'lar bo'lsa ko'rsatadi (birlashtirilgandan keyin bo'sh bo'lishi kerak)
SELECT email, COUNT(*) AS cnt
FROM public.registered_users
GROUP BY email
HAVING COUNT(*) > 1;
