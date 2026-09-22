-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260922_professional_tools_comprehensive.sql
-- JURISTIV — Professional Legal Toolkit (Asboblar) Schema & Source Registry
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Rasmiy Huquqiy Manbalar Reyestri (Official Legal Source Registry)
CREATE TABLE IF NOT EXISTS public.legal_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key VARCHAR(100) UNIQUE NOT NULL,
  source_name VARCHAR(500) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'law', 'code', 'plenum', 'cbu_rate', 'decree', 'standard_form'
  official_domain VARCHAR(200) NOT NULL, -- 'lex.uz', 'sud.uz', 'cbu.uz', 'adliya.uz'
  url TEXT NOT NULL,
  document_number VARCHAR(100),
  document_title TEXT NOT NULL,
  publication_date DATE,
  effective_date DATE,
  current_rate NUMERIC,
  currency VARCHAR(10) DEFAULT 'UZS',
  verification_status VARCHAR(50) DEFAULT 'verified',
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial verified official sources
INSERT INTO public.legal_sources
  (source_key, source_name, source_type, official_domain, url, document_number, document_title, effective_date, current_rate, metadata)
VALUES
  ('state_fee_law', 'O‘zbekiston Respublikasining "Davlat boji to‘g‘risida"gi Qonuni', 'law', 'lex.uz', 'https://lex.uz/docs/4680888', 'O‘RQ-600', '"Davlat boji to‘g‘risida"gi Qonun va uning ilovalari', '2020-01-06', NULL, '{"legal_domain": "state_duty", "court_types": ["civil", "economic", "administrative"]}'::jsonb),
  ('bhm_rate_current', 'O‘zbekiston Respublikasi Prezidentining Farmoni (BHM stavkasi)', 'decree', 'lex.uz', 'https://lex.uz/docs/7027429', 'PF-108', 'Ish haqi, pensiyalar va nafaqalar miqdorini oshirish to‘g‘risida', '2024-09-01', 375000, '{"type": "BHM", "rate_value": 375000, "status": "amalda"}'::jsonb),
  ('cbu_refinancing_rate', 'O‘zbekiston Respublikasi Markaziy banki Asosiy stavkasi', 'cbu_rate', 'cbu.uz', 'https://cbu.uz/uz/monetary-policy/main-rate/', 'MB-2024', 'Markaziy bank Boshqaruvining asosiy stavka to‘g‘risidagi qarori', '2024-12-12', 13.5, '{"type": "annual_percentage", "rate": 13.5, "legal_basis": "FK 327-moddasi"}'::jsonb),
  ('contract_penalty_law', 'Xo‘jalik yurituvchi subyektlar faoliyatining shartnomaviy-huquqiy bazasi to‘g‘risida', 'law', 'lex.uz', 'https://lex.uz/docs/54641', '670-I', 'Shartnomaviy majburiyatlarni bajarmaganlik uchun javobgarlik (Penya va jarimalar)', '1998-08-29', 0.5, '{"max_limit_percentage": 50, "daily_rate_default": 0.5}'::jsonb),
  ('civil_code_uz', 'O‘zbekiston Respublikasi Fuqarolik Kodeksi', 'code', 'lex.uz', 'https://lex.uz/docs/111189', 'FK', 'Fuqarolik Kodeksi (1- va 2-qismlar)', '1997-03-01', NULL, '{"articles": ["150-162 (Da‘vo muddati)", "327 (Pul mablag‘laridan foydalanganlik foizlari)", "333 (Majburiyat buzilishi)", "382 (Shartnomani bekor qilish)"]}'::jsonb),
  ('labor_code_uz', 'O‘zbekiston Respublikasi Mehnat Kodeksi (Yangi tahrir)', 'code', 'lex.uz', 'https://lex.uz/docs/6257288', 'O‘RQ-798', 'O‘zbekiston Respublikasining Mehnat Kodeksi', '2023-04-30', NULL, '{"articles": ["560 (Mehnat nizolarini ko‘rib chiqish muddatlari)"]}'::jsonb),
  ('supreme_court_plenum_contracts', 'Oliy Sud Plenumi: Shartnoma majburiyatlarini bajarish amaliyoti', 'plenum', 'sud.uz', 'https://sud.uz', 'Plenum No 12', 'Sudlar tomonidan shartnomaviy munosabatlardan kelib chiqadigan nizolarni hal qilish amaliyoti to‘g‘risida', '2003-06-14', NULL, '{"area": "shartnoma"}'::jsonb)
ON CONFLICT (source_key) DO UPDATE SET
  current_rate = EXCLUDED.current_rate,
  url = EXCLUDED.url,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- 2. Foydalanuvchi Vositalari Tarixi (Unified Tool History)
CREATE TABLE IF NOT EXISTS public.tool_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type VARCHAR(50) NOT NULL, -- 'calculator', 'document_generation', 'risk_assessment', 'court_practice'
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  input_data JSONB DEFAULT '{}'::jsonb,
  result_data JSONB DEFAULT '{}'::jsonb,
  legal_references JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_legal_sources_key ON public.legal_sources(source_key);
CREATE INDEX IF NOT EXISTS idx_legal_sources_type ON public.legal_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_tool_history_user_date ON public.tool_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_history_type ON public.tool_history(tool_type);

-- 3. RLS Siyosatlari
ALTER TABLE public.legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_history ENABLE ROW LEVEL SECURITY;

-- Legal sources are public read for verified sources
DROP POLICY IF EXISTS "Anyone can view legal sources" ON public.legal_sources;
CREATE POLICY "Anyone can view legal sources"
  ON public.legal_sources FOR SELECT USING (true);

-- Tool history strictly scoped to owner
DROP POLICY IF EXISTS "Users can view own tool history" ON public.tool_history;
CREATE POLICY "Users can view own tool history"
  ON public.tool_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tool history" ON public.tool_history;
CREATE POLICY "Users can insert own tool history"
  ON public.tool_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tool history" ON public.tool_history;
CREATE POLICY "Users can delete own tool history"
  ON public.tool_history FOR DELETE USING (auth.uid() = user_id);
