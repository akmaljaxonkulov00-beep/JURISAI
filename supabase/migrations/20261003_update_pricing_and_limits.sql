-- ═══════════════════════════════════════════════════════════════════════════
-- 20261003_update_pricing_and_limits.sql
-- JURISTIV — Pricing Tariflari va Limitlarini Yangilash
-- Bepul: 0 UZS
-- Standart: 29 000 UZS / oy (Eng mashhur)
-- Pro: 79 000 UZS / oy
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Table mavjudligini ta'minlash
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  case_limit INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  discount_label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tariflarni yangi narx va limitlar bilan yangilash / qo'shish
INSERT INTO public.pricing_plans (id, name, price, features, limits, case_limit, sort_order)
VALUES
  (
    'free',
    'Bepul',
    0,
    ARRAY[
      'To''liq qonunlar bazasi — cheksiz',
      '30 ta AI chat so''rovi / oy',
      '10 ta IRAC tahlili / oy',
      '10 ta hujjat generator / oy',
      '10 ta ovozli yozuv (STT) / oy',
      '5 ta senariy generator / oy',
      'Asboblar, jamiyat, statistika — cheksiz'
    ],
    '{
      "ai_chat": {"value": 30, "period_type": "monthly"},
      "irac": {"value": 10, "period_type": "monthly"},
      "document_generate": {"value": 10, "period_type": "monthly"},
      "document_analysis": {"value": 0, "period_type": "monthly"},
      "virtual_court": {"value": 0, "period_type": "monthly"},
      "decision_tree": {"value": 0, "period_type": "monthly"},
      "speech_stt": {"value": 10, "period_type": "monthly"},
      "scenario": {"value": 5, "period_type": "monthly"}
    }'::jsonb,
    5,
    1
  ),
  (
    'standart',
    'Standart',
    29000,
    ARRAY[
      '300 ta AI chat so''rovi / oy',
      '50 ta IRAC tahlili / oy',
      '50 ta hujjat generator / oy',
      '30 ta hujjat tahlili / oy',
      '30 ta qarorlar daraxti / oy',
      '100 ta ovozli yozuv (STT) / oy',
      '15 ta virtual sud sessiyasi / oy',
      '30 ta senariy generator / oy'
    ],
    '{
      "ai_chat": {"value": 300, "period_type": "monthly"},
      "irac": {"value": 50, "period_type": "monthly"},
      "document_generate": {"value": 50, "period_type": "monthly"},
      "document_analysis": {"value": 30, "period_type": "monthly"},
      "decision_tree": {"value": 30, "period_type": "monthly"},
      "speech_stt": {"value": 100, "period_type": "monthly"},
      "virtual_court": {"value": 15, "period_type": "monthly"},
      "scenario": {"value": 30, "period_type": "monthly"}
    }'::jsonb,
    50,
    2
  ),
  (
    'pro',
    'Pro',
    79000,
    ARRAY[
      'AI chat so''rovlari — Fair Use',
      'IRAC — Fair Use',
      'Hujjat — Fair Use',
      'Daraxt — Fair Use',
      'Senariy — Fair Use',
      'Ovozli yozuv (STT) — Fair Use',
      '50 ta virtual sud sessiyasi / oy',
      'Shaxsiy maslahatchi',
      'Ekspert konsultatsiyasi'
    ],
    '{
      "ai_chat": {"value": -1, "period_type": "monthly"},
      "irac": {"value": -1, "period_type": "monthly"},
      "document_generate": {"value": -1, "period_type": "monthly"},
      "document_analysis": {"value": -1, "period_type": "monthly"},
      "decision_tree": {"value": -1, "period_type": "monthly"},
      "speech_stt": {"value": -1, "period_type": "monthly"},
      "virtual_court": {"value": 50, "period_type": "monthly"},
      "scenario": {"value": -1, "period_type": "monthly"}
    }'::jsonb,
    -1,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  case_limit = EXCLUDED.case_limit,
  updated_at = NOW();

-- 3. Agar mavjud yozuvlarda eski narxlar bo'lsa (45000 yoki 140000), ularni ham to'g'rilash
UPDATE public.pricing_plans SET price = 29000 WHERE id = 'standart' AND (price = 45000 OR price IS NULL);
UPDATE public.pricing_plans SET price = 79000 WHERE id = 'pro' AND (price = 140000 OR price IS NULL);
