-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Guruh ichidagi muhokamalar (postlar)
-- Guruh a'zolari guruh ichida yozishlari mumkin bo'ladi
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.community_group_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group
  ON public.community_group_posts(group_id, created_at DESC);

-- Realtime: guruh postlari real vaqtda yangilanadi
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS: hamma o'qiy oladi, yozish autentifikatsiya qilinganlarga (API service_role)
ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_posts_select ON public.community_group_posts;
CREATE POLICY group_posts_select ON public.community_group_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS group_posts_insert ON public.community_group_posts;
CREATE POLICY group_posts_insert ON public.community_group_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS group_posts_delete ON public.community_group_posts;
CREATE POLICY group_posts_delete ON public.community_group_posts
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
