-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Guruh xonasi — qo'shilish so'rovlari (tasdiqlash tizimi)
--  • Maxfiy guruhga kod bilan qo'shilishdan tashqari, so'rov yuborib
--    qo'shilish ham mumkin. So'rovni guruh yaratuvchisi/admin tasdiqlaydi.
--  • Guruh a'zolari ro'yxati community_group_members orqali.
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.community_group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  user_email TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group
  ON public.community_group_join_requests(group_id, status);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_user
  ON public.community_group_join_requests(user_id);

-- RLS: so'rov yuborish hamma uchun, o'qish guruh a'zolari/admin uchun (API service_role orqali ishlaydi)
ALTER TABLE public.community_group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_join_requests_select ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_select ON public.community_group_join_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_group_join_requests_insert ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_insert ON public.community_group_join_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS community_group_join_requests_update ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_update ON public.community_group_join_requests
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

-- Realtime — tasdiqlash darhol aks etishi uchun
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_join_requests;
