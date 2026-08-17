-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Owner-scoped RLS (IDOR/BOLA himoyasi — database darajasida)
--
-- Maqsad: anon/authenticated client (realtime, to'g'ridan-to'g'ri supabase-js)
-- orqali BOSHQA foydalanuvchining shaxsiy ma'lumotlarini o'qib/yozib bo'lmasin.
-- API route'lar service_role ishlatadi (RLS bypass) — avtorizatsiya API
-- darajasida ham alohida tekshiriladi (session identity).
--
-- Idempotent — qayta RUN xavfsiz (DROP POLICY IF EXISTS + CREATE OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper funksiyalar (SECURITY DEFINER — RLS recursion'siz tekshiruv) ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registered_users
    WHERE id = auth.uid() AND UPPER(role) IN ('ADMIN', 'SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = gid AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_creator(gid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = gid AND g.created_by = auth.uid()
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) payment_requests — FAQAT egasi ko'radi/yozadi
--    (eski "Public read/insert" policy'lar olib tashlanadi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Public read payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Public insert payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can read payment_requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admin all access" ON public.payment_requests;

DROP POLICY IF EXISTS payment_requests_select_owner ON public.payment_requests;
CREATE POLICY payment_requests_select_owner ON public.payment_requests
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT OR public.is_admin());

DROP POLICY IF EXISTS payment_requests_insert_owner ON public.payment_requests;
CREATE POLICY payment_requests_insert_owner ON public.payment_requests
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS payment_requests_update_owner ON public.payment_requests;
CREATE POLICY payment_requests_update_owner ON public.payment_requests
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) user_notifications — FAQAT egasi (realtime "notif-user-*" ham shu policy
--    orqali faqat o'z bildirishnomalarini oladi)
-- ═══════════════════════════════════════════════════════════════════════════
-- Eski permissive policy'lar (avvalgi migratsiyalardan) o'chiriladi:
DROP POLICY IF EXISTS community_posts_select ON public.community_posts;
DROP POLICY IF EXISTS community_posts_insert ON public.community_posts;
DROP POLICY IF EXISTS community_posts_update ON public.community_posts;
DROP POLICY IF EXISTS community_posts_delete ON public.community_posts;
DROP POLICY IF EXISTS community_comments_select ON public.community_comments;
DROP POLICY IF EXISTS community_comments_insert ON public.community_comments;
DROP POLICY IF EXISTS community_comments_delete ON public.community_comments;
DROP POLICY IF EXISTS community_consultations_select ON public.community_consultations;
DROP POLICY IF EXISTS community_consultations_insert ON public.community_consultations;
DROP POLICY IF EXISTS community_consultations_update ON public.community_consultations;
DROP POLICY IF EXISTS group_notif_select ON public.community_group_notifications;
DROP POLICY IF EXISTS group_notif_insert ON public.community_group_notifications;
DROP POLICY IF EXISTS group_notif_update ON public.community_group_notifications;
DROP POLICY IF EXISTS group_notif_delete ON public.community_group_notifications;
DROP POLICY IF EXISTS user_notifications_select ON public.user_notifications;
CREATE POLICY user_notifications_select ON public.user_notifications
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS user_notifications_insert ON public.user_notifications;
CREATE POLICY user_notifications_insert ON public.user_notifications
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS user_notifications_update ON public.user_notifications;
CREATE POLICY user_notifications_update ON public.user_notifications
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS user_notifications_delete ON public.user_notifications;
CREATE POLICY user_notifications_delete ON public.user_notifications
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) community_group_notifications — FAQAT egasi
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_group_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS group_notifications_select ON public.community_group_notifications;
CREATE POLICY group_notifications_select ON public.community_group_notifications
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS group_notifications_insert ON public.community_group_notifications;
CREATE POLICY group_notifications_insert ON public.community_group_notifications
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS group_notifications_update ON public.community_group_notifications;
CREATE POLICY group_notifications_update ON public.community_group_notifications
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS group_notifications_delete ON public.community_group_notifications;
CREATE POLICY group_notifications_delete ON public.community_group_notifications
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) community_group_posts — faqat guruh a'zosi/yaratuvchisi o'qiydi,
--    yozish/o'chirish faqat O'Z postlari
--    (eski "SELECT true" policy'lar almashtiriladi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS group_posts_select ON public.community_group_posts;
DROP POLICY IF EXISTS group_posts_insert ON public.community_group_posts;
DROP POLICY IF EXISTS group_posts_delete ON public.community_group_posts;

DROP POLICY IF EXISTS group_posts_select_member ON public.community_group_posts;
CREATE POLICY group_posts_select_member ON public.community_group_posts
  FOR SELECT USING (
    public.is_group_member(group_id) OR public.is_group_creator(group_id)
  );

DROP POLICY IF EXISTS group_posts_insert_own ON public.community_group_posts;
CREATE POLICY group_posts_insert_own ON public.community_group_posts
  FOR INSERT WITH CHECK (
    user_id::TEXT = auth.uid()::TEXT
    AND (public.is_group_member(group_id) OR public.is_group_creator(group_id))
  );

DROP POLICY IF EXISTS group_posts_update_own ON public.community_group_posts;
CREATE POLICY group_posts_update_own ON public.community_group_posts
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS group_posts_delete_own ON public.community_group_posts;
CREATE POLICY group_posts_delete_own ON public.community_group_posts
  FOR DELETE USING (user_id::TEXT = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) community_group_join_requests — o'z so'rovlari; guruh yaratuvchisi
--    o'z guruhining so'rovlarini ko'radi
--    (eski "SELECT true"/"INSERT true" policy'lar almashtiriladi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS community_group_join_requests_select ON public.community_group_join_requests;
DROP POLICY IF EXISTS community_group_join_requests_insert ON public.community_group_join_requests;
DROP POLICY IF EXISTS community_group_join_requests_update ON public.community_group_join_requests;

DROP POLICY IF EXISTS join_requests_select_own ON public.community_group_join_requests;
CREATE POLICY join_requests_select_own ON public.community_group_join_requests
  FOR SELECT USING (
    user_id::TEXT = auth.uid()::TEXT OR public.is_group_creator(group_id)
  );

DROP POLICY IF EXISTS join_requests_insert_own ON public.community_group_join_requests;
CREATE POLICY join_requests_insert_own ON public.community_group_join_requests
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS join_requests_update_own ON public.community_group_join_requests;
CREATE POLICY join_requests_update_own ON public.community_group_join_requests
  FOR UPDATE USING (user_id::TEXT = auth.uid()::TEXT OR public.is_group_creator(group_id));

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) community_consultations — FAQAT egasi ko'radi/yuboradi
--    (admin service_role orqali ishlaydi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS consultations_select_own ON public.community_consultations;
CREATE POLICY consultations_select_own ON public.community_consultations
  FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

DROP POLICY IF EXISTS consultations_insert_own ON public.community_consultations;
CREATE POLICY consultations_insert_own ON public.community_consultations
  FOR INSERT WITH CHECK (user_id::TEXT = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7) community_posts / community_comments — lenta ommaviy o'qiladi,
--    yozish/tahrirlash/o'chirish faqat O'Z postlari (author jsonb -> 'id')
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS community_posts_select_public ON public.community_posts;
CREATE POLICY community_posts_select_public ON public.community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_posts_insert_own ON public.community_posts;
CREATE POLICY community_posts_insert_own ON public.community_posts
  FOR INSERT WITH CHECK (author->>'id' = auth.uid()::TEXT);

DROP POLICY IF EXISTS community_posts_update_own ON public.community_posts;
CREATE POLICY community_posts_update_own ON public.community_posts
  FOR UPDATE USING (author->>'id' = auth.uid()::TEXT OR public.is_admin());

DROP POLICY IF EXISTS community_posts_delete_own ON public.community_posts;
CREATE POLICY community_posts_delete_own ON public.community_posts
  FOR DELETE USING (author->>'id' = auth.uid()::TEXT OR public.is_admin());

DROP POLICY IF EXISTS community_comments_select_public ON public.community_comments;
CREATE POLICY community_comments_select_public ON public.community_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_comments_insert_own ON public.community_comments;
CREATE POLICY community_comments_insert_own ON public.community_comments
  FOR INSERT WITH CHECK (author->>'id' = auth.uid()::TEXT);

DROP POLICY IF EXISTS community_comments_update_own ON public.community_comments;
CREATE POLICY community_comments_update_own ON public.community_comments
  FOR UPDATE USING (author->>'id' = auth.uid()::TEXT OR public.is_admin());

DROP POLICY IF EXISTS community_comments_delete_own ON public.community_comments;
CREATE POLICY community_comments_delete_own ON public.community_comments
  FOR DELETE USING (author->>'id' = auth.uid()::TEXT OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 8) community_groups — update/delete faqat yaratuvchi yoki admin
--    (eski "authenticated hamma" policy'lar almashtiriladi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS community_groups_update ON public.community_groups;
DROP POLICY IF EXISTS community_groups_delete ON public.community_groups;

DROP POLICY IF EXISTS groups_update_creator ON public.community_groups;
CREATE POLICY groups_update_creator ON public.community_groups
  FOR UPDATE USING (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS groups_delete_creator ON public.community_groups;
CREATE POLICY groups_delete_creator ON public.community_groups
  FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 9) community_experts / community_webinars — yozish FAQAT admin
--    (eski "authenticated hamma yozadi" policy'lar almashtiriladi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS community_experts_insert ON public.community_experts;
DROP POLICY IF EXISTS community_experts_update ON public.community_experts;
DROP POLICY IF EXISTS community_experts_delete ON public.community_experts;

DROP POLICY IF EXISTS experts_insert_admin ON public.community_experts;
CREATE POLICY experts_insert_admin ON public.community_experts
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS experts_update_admin ON public.community_experts;
CREATE POLICY experts_update_admin ON public.community_experts
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS experts_delete_admin ON public.community_experts;
CREATE POLICY experts_delete_admin ON public.community_experts
  FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS community_webinars_insert ON public.community_webinars;
DROP POLICY IF EXISTS community_webinars_update ON public.community_webinars;
DROP POLICY IF EXISTS community_webinars_delete ON public.community_webinars;

DROP POLICY IF EXISTS webinars_insert_admin ON public.community_webinars;
CREATE POLICY webinars_insert_admin ON public.community_webinars
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS webinars_update_admin ON public.community_webinars;
CREATE POLICY webinars_update_admin ON public.community_webinars
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS webinars_delete_admin ON public.community_webinars;
CREATE POLICY webinars_delete_admin ON public.community_webinars
  FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 10) community_group_members — eski "Everyone can view" (select true) o'chiriladi;
--     faqat O'Z a'zolik qatori ko'rinadi (API service_role orqali ro'yxat beradi)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Everyone can view group members" ON public.community_group_members;
