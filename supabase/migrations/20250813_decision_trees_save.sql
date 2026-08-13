-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: decision_trees — Qarorlar daraxtini Supabase'da saqlash
-- ═══════════════════════════════════════════════════════════════════════════
-- Foydalanuvchi tahrirlagan qarorlar daraxti endi localStorage bilan birga
-- Supabase'da ham saqlanadi — boshqa qurilmada ham davom ettira oladi.
-- Har bir daraxt faqat o'z egasiga tegishli (RLS: auth.uid() = user_id).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.decision_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  case_type TEXT DEFAULT 'huquqiy',
  scenario TEXT DEFAULT '',
  tree JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: faqat o'z daraxtlarini ko'rish/yozish
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

CREATE INDEX IF NOT EXISTS idx_decision_trees_user
  ON public.decision_trees(user_id, updated_at DESC);
