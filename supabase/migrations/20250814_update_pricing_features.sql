-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Tarif kartalari imkoniyat matnlari yangilandi
-- (pricing_plans.features — haqiqiy limitlar bilan moslashtirildi)
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.pricing_plans SET features = ARRAY[
  'To''liq qonunlar bazasi — cheksiz',
  '10 ta AI chat so''rovi / oy',
  '3 ta IRAC tahlili / oy',
  '3 ta hujjat generator / oy',
  '5 ta ovozli yozuv (STT) / oy',
  'Asboblar, jamiyat, statistika — cheksiz'
] WHERE id = 'free';

UPDATE public.pricing_plans SET features = ARRAY[
  '200 ta AI chat so''rovi / oy',
  'Cheksiz IRAC tahlili',
  '50 ta hujjat generator / oy',
  '20 ta hujjat tahlili / oy',
  '20 ta qarorlar daraxti / oy',
  '100 ta ovozli yozuv (STT) / oy',
  '5 ta virtual sud sessiyasi / oy',
  '20 ta senariy va argument tahlili / oy'
] WHERE id = 'standart';

UPDATE public.pricing_plans SET features = ARRAY[
  'Cheksiz AI chat so''rovlari',
  'Cheksiz IRAC, hujjat, daraxt, senariy',
  'Cheksiz ovozli yozuv (STT)',
  'Cheksiz virtual sud sessiyalari',
  'Shaxsiy maslahatchi',
  'Ekspert konsultatsiyasi'
] WHERE id = 'pro';
