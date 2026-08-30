-- 20260801_add_pricing_discounts.sql
-- Narxlarga chegirma (discount) qo'shish

-- 1. pricing_plans jadvaliga discount_percent ustunini qo'shish
ALTER TABLE pricing_plans
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS discount_label TEXT DEFAULT '';

COMMENT ON COLUMN pricing_plans.discount_percent IS 'Chegirma foizi (0-100). 0 = chegirma yoq';
COMMENT ON COLUMN pricing_plans.discount_label IS 'Chegirma yorligi (masalan: "Yangi yil", "Maxsus taklif")';

-- 2. Agar pricing_plans jadvali bo'lmasa — yaratish
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  case_limit INTEGER DEFAULT -1,
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Default ma'lumotlarni qo'shish (agar jadval bo'sh bo'lsa)
INSERT INTO pricing_plans (id, name, price, features, limits, case_limit, discount_percent, discount_label)
VALUES
  ('free', 'Bepul', 0,
   '["To''liq qonunlar bazasi — cheksiz","10 ta AI chat so''rovi / oy","3 ta IRAC tahlili / oy","3 ta hujjat generator / oy","5 ta ovozli yozuv (STT) / oy","3 ta senariy generator / oy","Asboblar, jamiyat, statistika — cheksiz"]'::jsonb,
   '{"ai_chat":10,"irac":3,"document_generate":3,"document_analysis":2,"virtual_court":2,"decision_tree":2,"speech_stt":5,"scenario":3}'::jsonb,
   5, 0, ''),
  ('standart', 'Standart', 45000,
   '["200 ta AI chat so''rovi / oy","Cheksiz IRAC tahlili","50 ta hujjat generator / oy","20 ta hujjat tahlili / oy","20 ta qarorlar daraxti / oy","100 ta ovozli yozuv (STT) / oy","5 ta virtual sud sessiyasi / oy","20 ta senariy generator / oy"]'::jsonb,
   '{"ai_chat":200,"irac":-1,"document_generate":50,"document_analysis":20,"virtual_court":5,"decision_tree":20,"speech_stt":100,"scenario":20}'::jsonb,
   50, 0, ''),
  ('pro', 'Pro', 140000,
   '["Cheksiz AI chat so''rovlari","Cheksiz IRAC, hujjat, daraxt, senariy","Cheksiz ovozli yozuv (STT)","Cheksiz virtual sud sessiyalari","Shaxsiy maslahatchi","Ekspert konsultatsiyasi"]'::jsonb,
   '{"ai_chat":-1,"irac":-1,"document_generate":-1,"document_analysis":-1,"virtual_court":-1,"decision_tree":-1,"speech_stt":-1,"scenario":-1}'::jsonb,
   -1, 0, '')
ON CONFLICT (id) DO NOTHING;

-- 4. Mavjud qatorlarni yangilash (discount ustunlari NULL bo'lsa default qiymat)
UPDATE pricing_plans SET discount_percent = 0, discount_label = '' WHERE discount_percent IS NULL;
UPDATE pricing_plans SET limits = '{}'::jsonb WHERE limits IS NULL;
