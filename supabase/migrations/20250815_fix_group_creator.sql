-- ═══════════════════════════════════════════════════════════════════════════
-- 20250815_fix_group_creator.sql
--
-- Muammo: Foydalanuvchi guruh yaratganda created_by saqlanmas edi
-- (API POST created_by ni yozmagan) — shu sababli yaratuvchi huquqlari
-- (taklif kodi, so'rovlarni tasdiqlash, moderator tayinlash, sozlamalar)
-- ishlamas edi.
--
-- Bu migratsiya:
--   1. created_by = NULL bo'lgan guruhlarga birinchi (eng qadimgi) a'zoni
--      yaratuvchi qilib o'rnatadi
--   2. O'sha a'zoning rolini 'creator' qiladi
--
-- Idempotent: qayta run qilinsa ham xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Birinchi a'zo bo'yicha created_by ni to'ldirish
UPDATE public.community_groups g
SET created_by = m.user_id
FROM (
  SELECT DISTINCT ON (group_id) group_id, user_id
  FROM public.community_group_members
  ORDER BY group_id, joined_at ASC
) m
WHERE g.created_by IS NULL
  AND g.id = m.group_id;

-- 2) Yaratuvchi a'zoning rolini 'creator' qilish
UPDATE public.community_group_members cm
SET role = 'creator'
FROM public.community_groups g
WHERE cm.group_id = g.id
  AND cm.user_id = g.created_by
  AND cm.role <> 'creator';

-- 3) Yaratuvchi a'zo bo'lmasa ham qo'shib qo'yish (to'liq holat uchun)
INSERT INTO public.community_group_members (group_id, user_id, role, joined_at)
SELECT g.id, g.created_by, 'creator', now()
FROM public.community_groups g
WHERE g.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.community_group_members cm
    WHERE cm.group_id = g.id AND cm.user_id = g.created_by
  );
