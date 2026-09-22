-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20260922_decision_trees_comprehensive.sql
-- JURISTIV — Qarorlar Daraxti (Decision Tree) Professional LegalTech Schema
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.decision_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  case_type TEXT NOT NULL DEFAULT 'fuqarolik',
  user_role TEXT NOT NULL DEFAULT 'davogar',
  objectives TEXT DEFAULT '',
  known_facts TEXT DEFAULT '',
  evidence_docs TEXT DEFAULT '',
  opposing_party TEXT DEFAULT '',
  deadlines TEXT DEFAULT '',
  additional_notes TEXT DEFAULT '',
  tree JSONB NOT NULL,
  analysis JSONB DEFAULT '{}'::jsonb,
  selected_path JSONB DEFAULT '[]'::jsonb,
  evidence_state JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schema yangilanishi uchun qo'shimcha ustunlarni tekshirib qo'shish (agar jadval allaqachon mavjud bo'lsa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='user_role') THEN
    ALTER TABLE public.decision_trees ADD COLUMN user_role TEXT NOT NULL DEFAULT 'davogar';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='objectives') THEN
    ALTER TABLE public.decision_trees ADD COLUMN objectives TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='known_facts') THEN
    ALTER TABLE public.decision_trees ADD COLUMN known_facts TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='evidence_docs') THEN
    ALTER TABLE public.decision_trees ADD COLUMN evidence_docs TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='opposing_party') THEN
    ALTER TABLE public.decision_trees ADD COLUMN opposing_party TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='deadlines') THEN
    ALTER TABLE public.decision_trees ADD COLUMN deadlines TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='additional_notes') THEN
    ALTER TABLE public.decision_trees ADD COLUMN additional_notes TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='analysis') THEN
    ALTER TABLE public.decision_trees ADD COLUMN analysis JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='selected_path') THEN
    ALTER TABLE public.decision_trees ADD COLUMN selected_path JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='evidence_state') THEN
    ALTER TABLE public.decision_trees ADD COLUMN evidence_state JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='notes') THEN
    ALTER TABLE public.decision_trees ADD COLUMN notes TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decision_trees' AND column_name='status') THEN
    ALTER TABLE public.decision_trees ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- RLS: faqat o'z case'larini ko'rish, yaratish, yangilash va o'chirish
ALTER TABLE public.decision_trees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decision_trees_select ON public.decision_trees;
CREATE POLICY decision_trees_select ON public.decision_trees
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decision_trees_insert ON public.decision_trees;
CREATE POLICY decision_trees_insert ON public.decision_trees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decision_trees_update ON public.decision_trees;
CREATE POLICY decision_trees_update ON public.decision_trees
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decision_trees_delete ON public.decision_trees;
CREATE POLICY decision_trees_delete ON public.decision_trees
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_decision_trees_user_updated
  ON public.decision_trees(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_decision_trees_case_type
  ON public.decision_trees(case_type);
