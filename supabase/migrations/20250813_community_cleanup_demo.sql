-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Jamiyat — demo ma'lumotlarni tozalash va sozlamalar
-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Soxta/demo ekspertlar, vebinarlar va guruhlar o'chiriladi
--    (barchasi bir vaqtda seed qilingan — created_at bo'yicha aniqlanadi)
-- 2) Ekspertlar bo'limi endi bo'sh — foydalanuvchilarga "Tez orada qo'shiladi"
--    ko'rinadi, admin real ekspertlarni qo'shadi
-- 3) Community jadvallari uchun RLS: hamma o'qiy oladi, faqat autentifikatsiya
--    qilingan foydalanuvchi yozadi (API service_role bilan ishlaydi)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Demo ma'lumotlarni o'chirish ──────────────────────────────────────
-- Ekspertlar va vebinarlar — 2026-07-30 da bitta seed'da yaratilgan (demo)
-- Eslatma: community_consultations.expert_id TEXT, community_experts.id UUID —
-- shuning uchun id::TEXT cast qilinadi (aks holda 42883 xatosi chiqadi)
DELETE FROM public.community_consultations
WHERE expert_id IN (SELECT id::TEXT FROM public.community_experts);

DELETE FROM public.community_experts
WHERE created_at::date = '2026-07-30'::date;

DELETE FROM public.community_webinars
WHERE created_at::date = '2026-07-30'::date;

-- Guruhlar — demo (2026-07-30) va test qoldiqlari (LITSEY, rew)
DELETE FROM public.community_groups
WHERE created_at::date = '2026-07-30'::date
   OR name ILIKE 'litsey'
   OR name ILIKE 'rew';

-- ── 2. RLS: community jadvallari ─────────────────────────────────────────
-- Public o'qish (anon + auth), yozish autentifikatsiya qilinganlarga.
-- API route'lar service_role ishlatadi, shuning uchun admin har doim ishlaydi.

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_webinars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_groups_select ON public.community_groups;
CREATE POLICY community_groups_select ON public.community_groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_groups_insert ON public.community_groups;
CREATE POLICY community_groups_insert ON public.community_groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_groups_update ON public.community_groups;
CREATE POLICY community_groups_update ON public.community_groups
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_groups_delete ON public.community_groups;
CREATE POLICY community_groups_delete ON public.community_groups
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_experts_select ON public.community_experts;
CREATE POLICY community_experts_select ON public.community_experts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_experts_insert ON public.community_experts;
CREATE POLICY community_experts_insert ON public.community_experts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_experts_update ON public.community_experts;
CREATE POLICY community_experts_update ON public.community_experts
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_experts_delete ON public.community_experts;
CREATE POLICY community_experts_delete ON public.community_experts
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_webinars_select ON public.community_webinars;
CREATE POLICY community_webinars_select ON public.community_webinars
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_webinars_insert ON public.community_webinars;
CREATE POLICY community_webinars_insert ON public.community_webinars
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_webinars_update ON public.community_webinars;
CREATE POLICY community_webinars_update ON public.community_webinars
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS community_webinars_delete ON public.community_webinars;
CREATE POLICY community_webinars_delete ON public.community_webinars
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ── 3. Tekshiruv ─────────────────────────────────────────────────────────
SELECT 'community_experts' AS tab, COUNT(*) AS qolgan FROM public.community_experts
UNION ALL
SELECT 'community_webinars', COUNT(*) FROM public.community_webinars
UNION ALL
SELECT 'community_groups', COUNT(*) FROM public.community_groups;
