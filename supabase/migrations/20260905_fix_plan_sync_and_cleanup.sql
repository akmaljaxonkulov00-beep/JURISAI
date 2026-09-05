-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Admin plan change — root cause fix
--
-- MUAMMO:
--   1) Admin `registered_users.subscription_plan` ni o'zgartirganda, lekin
--      auth.users raw_user_meta_data dagi eski `subscription_plan` ('free')
--      saqlanib qoladi. Har bir login (last_sign_in_at UPDATE) yoki boshqa
--      auth UPDATE da `sync_auth_user_update_to_registered` trigeri eski
--      metadata qiymatini registered_users ustiga YOZIB QO'YADI → admin
--      o'zgartirgan tarif "qaytib" free bo'ladi.
--
--   YECHIM: Sync triggerlar endi metadata qiymati BO'SH/yo'q bo'lsa
--   registered_users dagi mavjud qiymatni SAQLAYDI (NULLIF guard).
--   Admin esa auth.users metadata ni ham yangilaydi (API tomondan),
--   shunda ikkala manba ham bir xil bo'ladi.
--
--   2) Oldingi migration'da site_settings ga YO'Q/TAXMINIY t.me/juristiv,
--      instagram.com/juristiv URL'lari enabled qilib yozilgan edi. Bu
--      yolg'on linklar landing page'da chiqishi mumkin. Tozalanadi —
--      ijtimoiy tarmoqlar DB'da faqat admin haqiqiy URL kiritsagina
--      ko'rinadi.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. auth.users → registered_users UPDATE sync trigger — NULLIF guard ──
CREATE OR REPLACE FUNCTION sync_auth_user_update_to_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.registered_users
  SET
    email = COALESCE(NEW.email, registered_users.email),
    name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), registered_users.name),
    full_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), registered_users.full_name),
    avatar = COALESCE(NULLIF(NEW.raw_user_meta_data->>'avatar', ''), registered_users.avatar),
    role = COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), registered_users.role),
    -- MUHIM: metadata bo'sh bo'lsa mavjud (admin o'rnatgan) tarif SAQLANADI
    subscription_plan = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'subscription_plan', ''),
      registered_users.subscription_plan
    ),
    subscription_expires_at = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'subscription_expires_at', '')::timestamptz,
      registered_users.subscription_expires_at
    ),
    last_login = COALESCE(NEW.last_sign_in_at, registered_users.last_login),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- ── 2. INSERT/UPDATE trigger ham subscription_plan ni buzmasin ──
CREATE OR REPLACE FUNCTION sync_auth_user_to_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registered_users (
    id,
    email,
    name,
    full_name,
    role,
    avatar,
    subscription_plan,
    subscription_expires_at,
    created_at,
    last_login
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, '')),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'USER'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'avatar', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'subscription_plan', ''), 'free'),
    NULLIF(NEW.raw_user_meta_data->>'subscription_expires_at', '')::timestamptz,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.last_sign_in_at, NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = CASE
      WHEN EXCLUDED.name <> '' THEN EXCLUDED.name
      ELSE registered_users.name
    END,
    full_name = CASE
      WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
      ELSE registered_users.full_name
    END,
    role = CASE
      WHEN EXCLUDED.role <> '' AND EXCLUDED.role IS NOT NULL THEN EXCLUDED.role
      ELSE registered_users.role
    END,
    avatar = CASE
      WHEN EXCLUDED.avatar <> '' THEN EXCLUDED.avatar
      ELSE registered_users.avatar
    END,
    -- Tarifni hech qachon eski metadata bilan qayta yozma
    subscription_plan = registered_users.subscription_plan,
    subscription_expires_at = registered_users.subscription_expires_at,
    last_login = CASE
      WHEN EXCLUDED.last_login > registered_users.last_login
      THEN EXCLUDED.last_login
      ELSE registered_users.last_login
    END,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger yana mavjudligini kafolatlash (20250802 migration o'chirib qo'yganda)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_registered();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_update_to_registered();

-- ── 3. Fake/yo'q ijtimoiy tarmoq URL larini tozalash ──
-- Admin haqiqiy URL kiritmaguncha landing'da button ko'rinmaydi
UPDATE public.site_settings SET value = '' WHERE key IN ('social_telegram', 'social_instagram');
UPDATE public.site_settings SET value = 'false' WHERE key IN ('social_telegram_enabled', 'social_instagram_enabled');

-- ── 4. Hijriy bo'lmagan eski tarif qiymatlarini to'g'rilash ──
-- 'premium'/'basic' kabi qiymatlar tizimda 'pro'/'standart' ga tenglashtiriladi
UPDATE public.registered_users
SET subscription_plan = 'pro'
WHERE LOWER(subscription_plan) IN ('premium', 'basic', 'pro');

UPDATE public.registered_users
SET subscription_plan = 'standart'
WHERE LOWER(subscription_plan) = 'standart';

-- ═════════════════════════════════════════════════════════════════════════
-- ── 5. site_settings SCHEMA UNIFIKATSIYASI (ENG MUHIM TUZATISH) ──────────
--
-- MUAMMO: Bazada IKKITA mos kelmaydigan schema bor edi:
--   A) ESKI: bitta qator, kolonnalar bilan (id, announcement_banner, ...)
--      → /api/settings/public, /api/admin/settings ishlatadi
--   B) YANGI: key-value (key TEXT PRIMARY KEY, value TEXT)
--      → /api/settings/contact, /api/settings/logo ishlatadi
--
-- `CREATE TABLE IF NOT EXISTS` eski jadval borligi sababli YANGI schemani
-- yaratmagan → contact/logo API larning barcha SELECT/UPSERT'lari
-- "column key does not exist" xatosi bilan YO'QOLGAN. Shu sababli:
--   - Logo saqlanmasdi
--   - Contact/social linklar saqlanmasdi
--   - Admin panel default (hardcoded) qiymatlarni ko'rsatardi
--
-- YECHIM: jadvalni yagona key-value schemaga o'tkazamiz va eski kolonna
-- qiymatlarini key sifatida ko'chiramiz. Barcha API route'lar ham
-- key-value formatga o'tkaziladi (kod tomonida).
-- ═════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  has_key_col BOOLEAN;
  legacy_row RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = 'key'
  ) INTO has_key_col;

  IF NOT has_key_col THEN
    -- Eski single-row jadvalni backup sifatida saqlaymiz
    DROP TABLE IF EXISTS public.site_settings_legacy_backup;
    ALTER TABLE public.site_settings RENAME TO site_settings_legacy_backup;

    -- Yangi key-value jadval
    CREATE TABLE public.site_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Eski kolonna qiymatlarini key/value sifatida ko'chiramiz
    FOR legacy_row IN EXECUTE 'SELECT to_jsonb(t) AS j FROM public.site_settings_legacy_backup t'
    LOOP
      INSERT INTO public.site_settings (key, value)
      SELECT k, legacy_row.j ->> k
      FROM unnest(ARRAY[
        'announcement_banner', 'hero_title', 'hero_subtitle',
        'contact_email', 'contact_phone', 'telegram_link',
        'legal_disclaimer', 'system_prompt',
        'payment_card_number', 'payment_details',
        'fair_use_limits'
      ]) AS k
      WHERE (legacy_row.j ->> k) IS NOT NULL
        AND (legacy_row.j ->> k) <> ''
      ON CONFLICT (key) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- RLS: hamma o'qiydi, faqat admin yozadi
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS site_settings_select_all ON public.site_settings;
DROP POLICY IF EXISTS site_settings_insert_admin ON public.site_settings;
DROP POLICY IF EXISTS site_settings_update_admin ON public.site_settings;
DROP POLICY IF EXISTS site_settings_delete_admin ON public.site_settings;
DROP POLICY IF EXISTS site_settings_read ON public.site_settings;
DROP POLICY IF EXISTS site_settings_write ON public.site_settings;
DROP POLICY IF EXISTS site_settings_admin_all ON public.site_settings;
DROP POLICY IF EXISTS "Public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Admin all access" ON public.site_settings;

CREATE POLICY site_settings_select_all ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY site_settings_write ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── 6. Kontakt/logo default key'lari mavjudligini kafolatlash ──
INSERT INTO public.site_settings (key, value) VALUES
  ('contact_section_enabled', 'true'),
  ('contact_label', 'Biz bilan bog''lanish'),
  ('contact_heading', 'JURISTIV hamjamiyatiga qo''shiling'),
  ('contact_description', 'Eng so''nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e''lonlardan xabardor bo''lib boring.'),
  ('social_telegram', ''),
  ('social_telegram_enabled', 'false'),
  ('social_instagram', ''),
  ('social_instagram_enabled', 'false'),
  ('social_youtube', ''),
  ('social_youtube_enabled', 'false'),
  ('social_linkedin', ''),
  ('social_linkedin_enabled', 'false'),
  ('social_website', ''),
  ('social_website_enabled', 'false'),
  ('logo_url', ''),
  ('logo_dark_url', ''),
  ('favicon_url', '')
ON CONFLICT (key) DO NOTHING;