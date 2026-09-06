-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: site_settings SCHEMA UNIFIKATSIYASI (STANDALONE — AVVAL SHUNI RUN QILING)
--
-- MUAMMO: Live bazada `site_settings` ESKI single-row schema'da yaratilgan:
--   (id, announcement_banner, hero_title, hero_subtitle, contact_email,
--    contact_phone, telegram_link, legal_disclaimer, system_prompt,
--    payment_card_number, payment_details, ...)
-- Ammo /api/settings/contact, /api/settings/logo, /api/settings/public,
-- /api/admin/settings key-value (key, value) formatda o'qiydi/yozadi.
-- `CREATE TABLE IF NOT EXISTS` eski jadval borligi sababli YANGI schemani
-- yaratmagan → "column key does not exist" xatosi.
--
-- YECHIM: Ushbu migration (idempotent — qayta RUN xavfsiz):
--   1) `key` ustuni borligini tekshiradi;
--   2) yo'q bo'lsa — eski jadvalni site_settings_legacy_backup'ga o'tkazib,
--      yangi key-value jadval yaratadi va eski kolonna qiymatlarini
--      key/value sifatida ko'chiradi;
--   3) RLS o'rnatadi (hamma o'qiydi, faqat ADMIN/SUPER_ADMIN yozadi);
--   4) Barcha kerakli default key'larni yozadi.
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. is_admin() funksiyasi mavjud bo'lishini kafolatlash ────────────────
-- (20250818_owner_rls_hardening.sql yaratgan; eski bazada bo'lmasa ham ishlaydi)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registered_users
    WHERE id = auth.uid() AND UPPER(role) IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

-- ── 1. SCHEMA UNIFIKATSIYASI ───────────────────────────────────────────────
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
        'fair_use_limits', 'logo_url', 'logo_dark_url', 'favicon_url'
      ]) AS k
      WHERE (legacy_row.j ->> k) IS NOT NULL
        AND (legacy_row.j ->> k) <> ''
      ON CONFLICT (key) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- ── 2. RLS — hamma o'qiydi, faqat admin yozadi ─────────────────────────────
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

-- ── 3. DEFAULT KEY'LAR ─────────────────────────────────────────────────────
INSERT INTO public.site_settings (key, value) VALUES
  ('announcement_banner', ''),
  ('hero_title', ''),
  ('hero_subtitle', ''),
  ('contact_email', ''),
  ('contact_phone', ''),
  ('telegram_link', ''),
  ('legal_disclaimer', ''),
  ('system_prompt', ''),
  ('payment_card_number', ''),
  ('payment_details', ''),
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