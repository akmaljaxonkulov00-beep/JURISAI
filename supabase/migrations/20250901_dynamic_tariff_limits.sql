-- ═══════════════════════════════════════════════════════════════════════════
-- DYNAMIC TARIFF LIMITS — pricing_plans.limits formati kengaytirildi
-- Eski format: { "ai_chat": 10, "irac": -1 }
-- Yangi format: { "ai_chat": { "value": 10, "period_type": "monthly" } }
-- Backward compatible: oddiy sonlar hali ham ishlaydi
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Mavjud limits qiymatlarini yangi formatga o'tkazish
-- Har bir feature uchun: number → { value: number, period_type: 'monthly' }

UPDATE public.pricing_plans
SET limits = (
  SELECT jsonb_object_agg(
    key,
    CASE
      WHEN jsonb_typeof(value) = 'number' THEN
        jsonb_build_object('value', value, 'period_type', 'monthly')
      ELSE
        value  -- allaqachon object bo'lsa — teginmaysiz
    END
  )
  FROM jsonb_each(limits)
)
WHERE limits IS NOT NULL AND limits != '{}'::jsonb;

-- 2. Agar pricing_plans jadvali bo'lmasa — yaratish
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

-- 3. Default limitlarni qo'shish (agar jadval bo'sh bo'lsa)
INSERT INTO public.pricing_plans (id, name, price, features, limits, sort_order)
VALUES
  ('free', 'Bepul', 0, ARRAY['AI chat', 'IRAC', 'Qonunlar'], '{
    "ai_chat": {"value": 10, "period_type": "monthly"},
    "irac": {"value": 3, "period_type": "monthly"},
    "document_generate": {"value": 3, "period_type": "monthly"},
    "document_analysis": {"value": 2, "period_type": "monthly"},
    "virtual_court": {"value": 2, "period_type": "monthly"},
    "decision_tree": {"value": 2, "period_type": "monthly"},
    "speech_stt": {"value": 5, "period_type": "monthly"},
    "scenario": {"value": 3, "period_type": "monthly"}
  }'::jsonb, 1),
  ('standart', 'Standart', 45000, ARRAY['AI chat', 'IRAC', 'Qonunlar', 'Hujjatlar'], '{
    "ai_chat": {"value": 200, "period_type": "monthly"},
    "irac": {"value": -1, "period_type": "monthly"},
    "document_generate": {"value": 50, "period_type": "monthly"},
    "document_analysis": {"value": 20, "period_type": "monthly"},
    "virtual_court": {"value": 5, "period_type": "monthly"},
    "decision_tree": {"value": 20, "period_type": "monthly"},
    "speech_stt": {"value": 100, "period_type": "monthly"},
    "scenario": {"value": 20, "period_type": "monthly"}
  }'::jsonb, 2),
  ('pro', 'Pro', 140000, ARRAY['Hammasi'], '{
    "ai_chat": {"value": -1, "period_type": "monthly"},
    "irac": {"value": -1, "period_type": "monthly"},
    "document_generate": {"value": -1, "period_type": "monthly"},
    "document_analysis": {"value": -1, "period_type": "monthly"},
    "virtual_court": {"value": -1, "period_type": "monthly"},
    "decision_tree": {"value": -1, "period_type": "monthly"},
    "speech_stt": {"value": -1, "period_type": "monthly"},
    "scenario": {"value": -1, "period_type": "monthly"}
  }'::jsonb, 3)
ON CONFLICT (id) DO UPDATE SET
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- 4. RLS — hamma o'qiy oladi, faqat admin yozadi
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_plans_read" ON public.pricing_plans;
DROP POLICY IF EXISTS "pricing_plans_write" ON public.pricing_plans;

CREATE POLICY pricing_plans_read ON public.pricing_plans
  FOR SELECT USING (true);

CREATE POLICY pricing_plans_write ON public.pricing_plans
  FOR ALL USING (public.is_admin());

-- 5. Realtime qo'shish
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_plans;
