-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Guruh maxfiyligi (Ommaviy / Maxfiy) + taklif kodi
--  • Ommaviy guruh — hamma ko'radi, bir bosishda qo'shiladi
--  • Maxfiy guruh — ro'yxatda ko'rinmaydi, faqat taklif kodi (invite_code)
--    bilan qo'shilish mumkin. Kod guruh yaratuvchisi/admin tomonidan ulashiladi.
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Taklif kodi ustuni (8 belgi, katta harf + raqam, noyob)
ALTER TABLE public.community_groups
  ADD COLUMN IF NOT EXISTS invite_code TEXT DEFAULT NULL;

-- Noyob indeks (NULL lar indekslanmaydi — ommaviy guruhlar ta'sir qilmaydi)
CREATE UNIQUE INDEX IF NOT EXISTS idx_community_groups_invite_code
  ON public.community_groups(invite_code)
  WHERE invite_code IS NOT NULL;

-- 2. Mavjud maxfiy guruhlarga kod qaytarilmaydigan tarzda berish
--    (kod NULL bo'lgan maxfiy guruhlarga tasodifiy kod yoziladi)
UPDATE public.community_groups
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8))
WHERE is_private = true AND invite_code IS NULL;

-- 3. Yangi qatorlar uchun default: kod avtomatik generatsiya qilinsin
--    (faqat maxfiy guruhlar uchun — trigger orqali)
CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  code TEXT;
BEGIN
  IF NEW.is_private AND (NEW.invite_code IS NULL OR NEW.invite_code = '') THEN
    LOOP
      code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
      BEGIN
        NEW.invite_code := code;
        RETURN NEW;
      EXCEPTION WHEN unique_violation THEN
        -- kod band — qaytadan urinamiz
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_community_groups_invite_code ON public.community_groups;
CREATE TRIGGER trg_community_groups_invite_code
  BEFORE INSERT OR UPDATE OF is_private, invite_code ON public.community_groups
  FOR EACH ROW EXECUTE FUNCTION public.generate_group_invite_code();

-- 4. Realtime — guruh o'zgarishlari (a'zolar soni, kod) darhol yangilansin
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_members;

-- 5. Guruh a'zoligi RLS (mavjud bo'lmasa) — a'zolikni o'zi ko'ra oladi
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_members_select ON public.community_group_members;
CREATE POLICY community_group_members_select ON public.community_group_members
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    user_id::TEXT = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS community_group_members_insert ON public.community_group_members;
CREATE POLICY community_group_members_insert ON public.community_group_members
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS community_group_members_delete ON public.community_group_members;
CREATE POLICY community_group_members_delete ON public.community_group_members
  FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));
