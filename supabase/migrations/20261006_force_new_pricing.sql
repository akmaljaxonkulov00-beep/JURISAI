-- ═══════════════════════════════════════════════════════════════════════════
-- 20261006_force_new_pricing.sql
-- Standart va Pro tariflari narxlarini 29 000 va 79 000 UZS ga yangilash
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.pricing_plans
SET price = 29000,
    features = ARRAY[
      '300 ta AI chat so''rovi / oy',
      '50 ta IRAC tahlili / oy',
      '50 ta hujjat generator / oy',
      '30 ta hujjat tahlili / oy',
      '30 ta qarorlar daraxti / oy',
      '100 ta ovozli yozuv (STT) / oy',
      '15 ta virtual sud sessiyasi / oy',
      '30 ta senariy generator / oy'
    ]::text[],
    limits = jsonb_build_object(
      'ai_chat', jsonb_build_object('value', 300, 'period_type', 'monthly'),
      'irac', jsonb_build_object('value', 50, 'period_type', 'monthly'),
      'document_generate', jsonb_build_object('value', 50, 'period_type', 'monthly'),
      'document_analysis', jsonb_build_object('value', 30, 'period_type', 'monthly'),
      'decision_tree', jsonb_build_object('value', 30, 'period_type', 'monthly'),
      'speech_stt', jsonb_build_object('value', 100, 'period_type', 'monthly'),
      'virtual_court', jsonb_build_object('value', 15, 'period_type', 'monthly'),
      'scenario', jsonb_build_object('value', 30, 'period_type', 'monthly')
    ),
    updated_at = NOW()
WHERE id = 'standart';

UPDATE public.pricing_plans
SET price = 79000,
    features = ARRAY[
      'AI chat so''rovlari — Fair Use',
      'IRAC — Fair Use',
      'Hujjat — Fair Use',
      'Daraxt — Fair Use',
      'Senariy — Fair Use',
      'Ovozli yozuv (STT) — Fair Use',
      '50 ta virtual sud sessiyasi / oy',
      'Shaxsiy maslahatchi',
      'Ekspert konsultatsiyasi'
    ]::text[],
    limits = jsonb_build_object(
      'ai_chat', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'irac', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'document_generate', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'document_analysis', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'decision_tree', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'speech_stt', jsonb_build_object('value', -1, 'period_type', 'monthly'),
      'virtual_court', jsonb_build_object('value', 50, 'period_type', 'monthly'),
      'scenario', jsonb_build_object('value', -1, 'period_type', 'monthly')
    ),
    updated_at = NOW()
WHERE id = 'pro';

UPDATE public.pricing_plans
SET price = 0,
    features = ARRAY[
      'To''liq qonunlar bazasi — cheksiz',
      '30 ta AI chat so''rovi / oy',
      '10 ta IRAC tahlili / oy',
      '10 ta hujjat generator / oy',
      '10 ta ovozli yozuv (STT) / oy',
      '5 ta senariy generator / oy',
      'Asboblar, jamiyat, statistika — cheksiz'
    ]::text[],
    limits = jsonb_build_object(
      'ai_chat', jsonb_build_object('value', 30, 'period_type', 'monthly'),
      'irac', jsonb_build_object('value', 10, 'period_type', 'monthly'),
      'document_generate', jsonb_build_object('value', 10, 'period_type', 'monthly'),
      'document_analysis', jsonb_build_object('value', 0, 'period_type', 'monthly'),
      'virtual_court', jsonb_build_object('value', 0, 'period_type', 'monthly'),
      'decision_tree', jsonb_build_object('value', 0, 'period_type', 'monthly'),
      'speech_stt', jsonb_build_object('value', 10, 'period_type', 'monthly'),
      'scenario', jsonb_build_object('value', 5, 'period_type', 'monthly')
    ),
    updated_at = NOW()
WHERE id = 'free';
