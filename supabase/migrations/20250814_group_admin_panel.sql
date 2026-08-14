-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Moderator harakatlar jurnali + eski xabarlarga reaksiya
--  • Eski postlardagi NULL reactions → '{}' (eski xabarlarga ham reaksiya)
--  • community_moderator_actions — moderator/yaratuvchi harakatlari jurnali
--    (post o'chirish, a'zo chiqarish, so'rov tasdiqlash/rad etish)
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) Eski xabarlardagi NULL reaksiyalar → bo'sh ob'ekt ────────────────
UPDATE public.community_group_posts
SET reactions = '{}'::jsonb
WHERE reactions IS NULL;

-- ── 2) Moderator harakatlar jurnali ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_moderator_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
  moderator_id TEXT DEFAULT '',
  moderator_name TEXT DEFAULT '',
  action TEXT NOT NULL,  -- post_deleted | member_removed | request_approved | request_rejected | moderator_set
  target_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_actions_group
  ON public.community_moderator_actions(group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mod_actions_moderator
  ON public.community_moderator_actions(moderator_id, created_at DESC);

ALTER TABLE public.community_moderator_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mod_actions_select ON public.community_moderator_actions;
CREATE POLICY mod_actions_select ON public.community_moderator_actions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mod_actions_insert ON public.community_moderator_actions;
CREATE POLICY mod_actions_insert ON public.community_moderator_actions
  FOR INSERT WITH CHECK (true);

-- Realtime — panel real vaqtda yangilanadi
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_moderator_actions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
