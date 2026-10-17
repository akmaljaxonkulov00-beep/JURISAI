-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261017_fix_decision_trees_columns.sql
-- JURISTIV — Ensure all decision_trees columns exist and reload PostgREST schema cache
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'davogar';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS objectives TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS known_facts TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS evidence_docs TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS opposing_party TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS deadlines TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS additional_notes TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS analysis JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS selected_path JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS evidence_state JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.decision_trees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Reload Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
