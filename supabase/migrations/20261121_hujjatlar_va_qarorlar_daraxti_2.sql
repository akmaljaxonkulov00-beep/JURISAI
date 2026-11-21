-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261121_hujjatlar_va_qarorlar_daraxti_2.sql
-- JURISTIV: HUJJATLAR KONSTRUKTORI 2.0 + QARORLAR DARAXTI 2.0
-- Ikkala modul mustaqil jadvallari, LexUZ integratsiyasi va rasmiy manbalar
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- QISM 1: HUJJATLAR KONSTRUKTORI 2.0 (RASMIY PDF VA HUJJATLAR KUTUBXONASI)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.official_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'civil', 'criminal', 'administrative', 'family', 'labor', 'contracts', 'inheritance', 'notarial', 'procedural', 'other'
  category_name_uz TEXT NOT NULL,
  official_source_name TEXT NOT NULL, -- 'LexUZ', 'Oliy Sud', 'my.sud.uz', 'Adliya vazirligi', 'gov.uz'
  official_source_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'uz',
  issuing_authority TEXT NOT NULL, -- Masalan: 'O‘zbekiston Respublikasi Oliy sudi'
  publication_date DATE,
  effective_date DATE,
  version_number TEXT NOT NULL DEFAULT '1.0',
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED_OFFICIAL', -- 'VERIFIED_OFFICIAL', 'PENDING_VERIFICATION', 'REJECTED', 'OUTDATED'
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  sha256_checksum TEXT,
  description TEXT DEFAULT '',
  fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
  fillable_type TEXT NOT NULL DEFAULT 'form_fields', -- 'form_fields', 'static_coordinates', 'scanned_ocr'
  legal_basis JSONB NOT NULL DEFAULT '[]'::jsonb, -- LexUZ moddalari va qonuniy asoslar
  is_active BOOLEAN NOT NULL DEFAULT true,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_filled_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES public.official_legal_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filled_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  filled_storage_path TEXT,
  file_format TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'docx'
  status TEXT NOT NULL DEFAULT 'completed', -- 'draft', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_official_docs_category ON public.official_legal_documents(category, verification_status);
CREATE INDEX IF NOT EXISTS idx_official_docs_status ON public.official_legal_documents(verification_status, is_active);
CREATE INDEX IF NOT EXISTS idx_user_filled_docs_user ON public.user_filled_documents(user_id, created_at DESC);

-- RLS
ALTER TABLE public.official_legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_filled_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS official_docs_select ON public.official_legal_documents;
CREATE POLICY official_docs_select ON public.official_legal_documents
  FOR SELECT USING (is_active = true AND verification_status = 'VERIFIED_OFFICIAL');

DROP POLICY IF EXISTS user_filled_docs_policy ON public.user_filled_documents;
CREATE POLICY user_filled_docs_policy ON public.user_filled_documents
  FOR ALL USING (user_id = auth.uid()::text OR auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- QISM 2: QARORLAR DARAXTI 2.0 (LEGAL DECISION SUPPORT SYSTEM)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Kategoriyalar (6 ta rasmiy yo'nalish)
CREATE TABLE IF NOT EXISTS public.legal_decision_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Scale',
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LexUZ Huquqiy Bilimlar Bazasi
CREATE TABLE IF NOT EXISTS public.legal_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_name TEXT NOT NULL, -- 'FK', 'FPK', 'MK', 'OK', 'JK', 'JPK', 'BSK'
  article_number TEXT NOT NULL, -- '732-modda'
  title TEXT NOT NULL,
  official_text TEXT NOT NULL,
  lex_url TEXT NOT NULL,
  effective_date DATE,
  status TEXT NOT NULL DEFAULT 'in_force', -- 'in_force', 'amended', 'repealed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Qarorlar Daraxti (Tree Definition)
CREATE TABLE IF NOT EXISTS public.legal_decision_trees (
  id TEXT PRIMARY KEY, -- masalan: 'civil_debt_recovery'
  category_id TEXT NOT NULL REFERENCES public.legal_decision_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  root_question_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT '2.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Savollar Jadvali (Branching Questions)
CREATE TABLE IF NOT EXISTS public.legal_decision_questions (
  id TEXT PRIMARY KEY,
  tree_id TEXT NOT NULL REFERENCES public.legal_decision_trees(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  explanation TEXT NOT NULL, -- Nega bu savol berilayotgani
  question_type TEXT NOT NULL DEFAULT 'single_choice', -- 'single_choice', 'boolean', 'amount', 'date'
  legal_basis JSONB NOT NULL DEFAULT '[]'::jsonb, -- LexUZ moddalari
  sort_order INTEGER NOT NULL DEFAULT 1
);

-- 5. Javob Variantlari va Tarmoqlanish (Edges / Answers)
CREATE TABLE IF NOT EXISTS public.legal_decision_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES public.legal_decision_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  next_question_id TEXT, -- agar savol davom etsa
  outcome_decision TEXT, -- agar bu javob yakuniy bo'lsa: 'favorable', 'warning', 'not_recommended', 'requires_evidence'
  decision_title TEXT,
  decision_summary TEXT,
  legal_reasoning TEXT,
  suggested_action TEXT,
  risk_level TEXT DEFAULT 'low' -- 'low', 'medium', 'high'
);

-- 6. Foydalanuvchi Ishlari (User Decision Cases)
CREATE TABLE IF NOT EXISTS public.legal_decision_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tree_id TEXT NOT NULL REFERENCES public.legal_decision_trees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  situation_description TEXT DEFAULT '',
  answers_history JSONB NOT NULL DEFAULT '{}'::jsonb, -- { [questionId]: answerId }
  current_question_id TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'archived'
  final_result JSONB DEFAULT NULL,
  ai_analysis JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Audit log
CREATE TABLE IF NOT EXISTS public.legal_decision_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.legal_decision_cases(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexlar
CREATE INDEX IF NOT EXISTS idx_decision_cases_user ON public.legal_decision_cases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_decision_trees_cat ON public.legal_decision_trees(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_decision_questions_tree ON public.legal_decision_questions(tree_id);
CREATE INDEX IF NOT EXISTS idx_decision_answers_question ON public.legal_decision_answers(question_id);

-- RLS
ALTER TABLE public.legal_decision_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_decision_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_decision_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_decision_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_decision_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_decision_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cat_read_all ON public.legal_decision_categories FOR SELECT USING (true);
CREATE POLICY kb_read_all ON public.legal_knowledge_base FOR SELECT USING (true);
CREATE POLICY trees_read_all ON public.legal_decision_trees FOR SELECT USING (true);
CREATE POLICY q_read_all ON public.legal_decision_questions FOR SELECT USING (true);
CREATE POLICY a_read_all ON public.legal_decision_answers FOR SELECT USING (true);

DROP POLICY IF EXISTS cases_user_policy ON public.legal_decision_cases;
CREATE POLICY cases_user_policy ON public.legal_decision_cases
  FOR ALL USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA: 6 TA ASOSIY KATEGORIYA
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.legal_decision_categories (id, name, icon, description, sort_order)
VALUES
  ('civil', 'Fuqarolik Huquqi', 'Scale', 'Qarz undirish, shartnoma buzilishi, mulk va zararni qoplash nizolari', 1),
  ('family', 'Oilaviy Nizolar', 'Users', 'Nikohdan ajratish, aliment undirish, mulkni bo‘lish va bolalar huquqi', 2),
  ('labor', 'Mehnat Huquqi', 'Briefcase', 'Noqonuniy ishdan bo‘shatish, ish haqi undirish va mehnat intizomi', 3),
  ('inheritance', 'Meros Huquqi', 'BookOpen', 'Merosni qabul qilish, vasiyatnoma va merosxo‘rlar ulushi nizolari', 4),
  ('administrative', 'Ma’muriy Huquq', 'ShieldCheck', 'Jarima ustidan shikoyat va davlat organi qarorlariga e’tiroz', 5),
  ('criminal', 'Jinoyat & Himoya', 'ShieldAlert', 'Jabrlanuvchi huquqlari, himoya choralari va protsessual kafolatlar', 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
