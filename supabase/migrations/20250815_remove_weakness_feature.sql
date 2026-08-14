-- ═══════════════════════════════════════════════════════════════════════════
-- 20250815_remove_weakness_feature.sql
--
-- "Argument Tahlili" (weakness-detector) funksiyasi IRAC Huquqiy Tahlil bilan
-- takrorlanganligi uchun butunlay olib tashlandi:
--   1. pricing_plans.limits dan "weakness" kaliti o'chirildi
--   2. Standart tarif feature matnida "argument tahlili" olib tashlandi
--   3. Bepul tarifga "3 ta senariy generator / oy" qo'shildi
--
-- Idempotent: qayta run qilinsa ham xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) limits dan weakness kalitini o'chirish (jsonb - operatori)
UPDATE public.pricing_plans
SET limits = limits - 'weakness'
WHERE limits ? 'weakness';

-- 2) Standart feature matnini yangilash
UPDATE public.pricing_plans
SET features = (
  SELECT jsonb_agg(
    CASE
      WHEN value #>> '{}' = '20 ta senariy va argument tahlili / oy'
      THEN to_jsonb('20 ta senariy generator / oy'::text)
      ELSE value
    END
  )
  FROM jsonb_array_elements(features) AS value
)
WHERE id = 'standart';

-- 3) Bepul tarifga senariy feature'si yo'q bo'lsa qo'shish
UPDATE public.pricing_plans
SET features = features || '["3 ta senariy generator / oy"]'::jsonb
WHERE id = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(features) AS f WHERE f LIKE '%senariy%'
  );

-- 4) Eski per-user override'larni ham tozalash (weakness feature uchun)
DELETE FROM public.user_usage_limits WHERE feature = 'weakness';

-- 5) Eski usage loglarni o'chirish (ixtiyoriy — tarix saqlansin desangiz bu qatorni o'chiring)
DELETE FROM public.usage_logs WHERE feature = 'weakness';
