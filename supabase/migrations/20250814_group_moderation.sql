-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Guruh moderatsiyasi — moderatorlar, reaksiya/javoblar, bildirishnomalar
--  • community_group_posts: reactions (JSONB) + parent_id (javoblar)
--  • community_group_notifications: guruh bildirishnomalari (so'rov, moderator, ...)
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) Guruh postlariga reaksiya va javob (reply) ─────────────────────────
ALTER TABLE public.community_group_posts
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.community_group_posts
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_group_posts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_group_posts_parent
  ON public.community_group_posts(parent_id);

-- ── 2) Guruh bildirishnomalari ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,                      -- kimga (qabul qiluvchi)
  type TEXT NOT NULL DEFAULT 'info',          -- join_request | approved | rejected | moderator | demoted | removed | post_deleted
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  actor_id TEXT DEFAULT '',
  actor_name TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_notif_user
  ON public.community_group_notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_notif_group
  ON public.community_group_notifications(group_id, created_at DESC);

ALTER TABLE public.community_group_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_notif_select ON public.community_group_notifications;
CREATE POLICY group_notif_select ON public.community_group_notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS group_notif_insert ON public.community_group_notifications;
CREATE POLICY group_notif_insert ON public.community_group_notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS group_notif_update ON public.community_group_notifications;
CREATE POLICY group_notif_update ON public.community_group_notifications
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS group_notif_delete ON public.community_group_notifications;
CREATE POLICY group_notif_delete ON public.community_group_notifications
  FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));

-- Realtime — bildirishnoma va reaksiya darhol aks etishi uchun
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
