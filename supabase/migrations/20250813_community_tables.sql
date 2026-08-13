-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Jamiyat (Community) jadvallari — posts, comments, consultations
-- ═══════════════════════════════════════════════════════════════════════════
-- community_posts / community_comments — lenta (feed) uchun.
-- community_consultations — ekspertga maslahat/mentorlik so'rovi yuborish.
-- Ustunlar snake_case (PostgREST uchun standart).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY,
  author JSONB NOT NULL DEFAULT '{}'::jsonb,
  content TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'discussion',
  tags JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  disliked_by JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  author JSONB NOT NULL DEFAULT '{}'::jsonb,
  content TEXT NOT NULL DEFAULT '',
  likes INTEGER DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  replies JSONB DEFAULT '[]'::jsonb,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id TEXT,
  expert_name TEXT DEFAULT '',
  user_id TEXT,
  user_name TEXT DEFAULT '',
  user_email TEXT DEFAULT '',
  type TEXT DEFAULT 'consultation', -- consultation | mentorship
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'pending', -- pending | answered | closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Posts/Comments: hamma o'qiy oladi (ochiq lenta), yozish autentifikatsiyalangan
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_posts_select ON public.community_posts;
CREATE POLICY community_posts_select ON public.community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_posts_insert ON public.community_posts;
CREATE POLICY community_posts_insert ON public.community_posts
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS community_posts_update ON public.community_posts;
CREATE POLICY community_posts_update ON public.community_posts
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS community_posts_delete ON public.community_posts;
CREATE POLICY community_posts_delete ON public.community_posts
  FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS community_comments_select ON public.community_comments;
CREATE POLICY community_comments_select ON public.community_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_comments_insert ON public.community_comments;
CREATE POLICY community_comments_insert ON public.community_comments
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

DROP POLICY IF EXISTS community_comments_delete ON public.community_comments;
CREATE POLICY community_comments_delete ON public.community_comments
  FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));

-- Consultations: so'rov yuborish hamma uchun, o'qish o'z so'rovlari
DROP POLICY IF EXISTS community_consultations_select ON public.community_consultations;
CREATE POLICY community_consultations_select ON public.community_consultations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_consultations_insert ON public.community_consultations;
CREATE POLICY community_consultations_insert ON public.community_consultations
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS community_consultations_update ON public.community_consultations;
CREATE POLICY community_consultations_update ON public.community_consultations
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));
