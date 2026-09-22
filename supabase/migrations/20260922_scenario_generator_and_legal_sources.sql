-- ============================================================
-- JURISTIV: SCENARIO GENERATOR & LEGAL SOURCES SCHEMA
-- Production Migration: 2026-09-22
-- ============================================================

-- 1. LEGAL SOURCE REGISTRY & VERSIONING
CREATE TABLE IF NOT EXISTS public.legal_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'law', -- 'code', 'law', 'decree', 'plenum', 'cbu_rate'
  official_domain TEXT NOT NULL DEFAULT 'lex.uz',
  official_url TEXT NOT NULL,
  document_id TEXT,
  document_number TEXT,
  document_title TEXT NOT NULL,
  article TEXT,
  part TEXT,
  paragraph TEXT,
  adoption_date DATE,
  publication_date DATE,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  current_version TEXT NOT NULL DEFAULT '2026.1',
  verification_status TEXT NOT NULL DEFAULT 'verified',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT,
  rate_value NUMERIC,
  currency TEXT DEFAULT 'UZS',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. OFFICIAL DOCUMENT TEMPLATES (Verified source-based templates)
CREATE TABLE IF NOT EXISTS public.official_document_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'civil', 'labor', 'administrative', 'criminal', 'business', 'court'
  subcategory TEXT,
  description TEXT,
  source_key TEXT REFERENCES public.legal_source_registry(source_key) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '2026.1',
  effective_date DATE NOT NULL DEFAULT '2026-01-01',
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'CURRENT',
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  template_structure JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER GENERATED DOCUMENTS
CREATE TABLE IF NOT EXISTS public.user_generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  template_version TEXT NOT NULL DEFAULT '2026.1',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_reference JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendered_text TEXT NOT NULL,
  pdf_url TEXT,
  docx_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SCENARIO TEMPLATES (Verified legal practice simulation templates)
CREATE TABLE IF NOT EXISTS public.scenario_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scenario_type TEXT NOT NULL, -- 'civil', 'criminal', 'family', 'labor', 'administrative', 'business', 'contract', 'inheritance', 'property', 'land', 'ip', 'tax'
  difficulty_level TEXT NOT NULL DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
  user_role TEXT NOT NULL DEFAULT 'advokat',
  objective TEXT NOT NULL,
  background TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  legal_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  applicable_laws JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration INT NOT NULL DEFAULT 45,
  version TEXT NOT NULL DEFAULT '2026.1',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SCENARIO SESSIONS (Active & interactive simulation sessions for users)
CREATE TABLE IF NOT EXISTS public.scenario_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id TEXT,
  scenario_data JSONB NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  total_steps INT NOT NULL DEFAULT 6,
  user_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  discovered_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluated_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT,
  xp_awarded INT DEFAULT 0,
  evaluation JSONB,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gen_docs_user ON public.user_generated_documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_sessions_user ON public.scenario_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_type ON public.scenario_templates(scenario_type, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_legal_sources_key ON public.legal_source_registry(source_key);

-- Enable RLS
ALTER TABLE public.legal_source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for verified sources and templates
CREATE POLICY "Public read verified legal sources"
  ON public.legal_source_registry FOR SELECT
  USING (true);

CREATE POLICY "Public read active templates"
  ON public.official_document_templates FOR SELECT
  USING (status = 'CURRENT');

CREATE POLICY "Public read scenario templates"
  ON public.scenario_templates FOR SELECT
  USING (status = 'active');

-- RLS Policies: User isolation for generated documents and scenario sessions
CREATE POLICY "Users can manage their own generated documents"
  ON public.user_generated_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own scenario sessions"
  ON public.scenario_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
