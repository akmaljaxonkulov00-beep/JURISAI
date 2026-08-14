-- ═══════════════════════════════════════════════════════════════════════════
-- 20250815_remove_weakness_feature.sql
--
-- "Argument Tahlili" (weakness-detector) funksiyasi IRAC Huquqiy Tahlil bilan
-- takrorlanganligi uchun butunlay olib tashlandi:
--   1. pricing_plans.limits dan "weakness" kaliti o'chirildi
--   2. Standart tarif feature matnida "argument tahlili" olib tashlandi
--   3. Bepul tarifga "3 ta senariy generator / oy" qo'shildi
--
-- Eslatma: pricing_plans.features — text[] (JSON emas), shuning uchun
-- array funksiyalari (array_replace / unnest) ishlatiladi.
--
-- Idempotent: qayta run qilinsa ham xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) limits dan weakness kalitini o'chirish (jsonb - operatori)
UPDATE public.pricing_plans
SET limits = limits - 'weakness'
WHERE limits ? 'weakness';

-- 2) Standart feature matnini yangilash (text[] uchun array_replace)
UPDATE public.pricing_plans
SET features = array_replace(
  features,
  '20 ta senariy va argument tahlili / oy',
  '20 ta senariy generator / oy'
)
WHERE id = 'standart';

-- 3) Bepul tarifga senariy feature'si yo'q bo'lsa qo'shish
UPDATE public.pricing_plans
SET features = features || ARRAY['3 ta senariy generator / oy']
WHERE id = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM unnest(features) AS f WHERE f LIKE '%senariy%'
  );

-- 4) Eski per-user override'larni ham tozalash (weakness feature uchun)
DELETE FROM public.user_usage_limits WHERE feature = 'weakness';

-- 5) Eski usage loglarni o'chirish (ixtiyoriy — tarix saqlansin desangiz bu qatorni o'chiring)
DELETE FROM public.usage_logs WHERE action = 'weakness';
