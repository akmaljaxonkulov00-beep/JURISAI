-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: RLS BARCHA JADVALLARGA YOQISH (Supabase xavfsizlik ogohlantirishi)
--
-- Muammo: Supabase Shield "rls_disabled_in_public" xatosini ko'rsatyapti.
-- Ba'zi jadvallar CREATE TABLE bilan yaratilganda ENABLE ROW LEVEL SECURITY
-- buyrug'i berilmagan yoki keyinroq qayta yaratilganda RLS tushib qolgan.
--
-- Yechim: Barcha public jadvallarga idempotent ravishda RLS yoqish va
-- to'g'ri xavfsizlik policy'lari qo'shish.
--
-- QAYTA RUN XAVFSIZ: DROP POLICY IF EXISTS + CREATE POLICY IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper funksiyalar (xavfsizlik uchun) ──────────────────────────────
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
-- 1. FOYDALANUVCHILAR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS registered_users_select_owner ON public.registered_users;
CREATE POLICY registered_users_select_owner ON public.registered_users
  FOR SELECT USING (id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS registered_users_insert_own ON public.registered_users;
CREATE POLICY registered_users_insert_own ON public.registered_users
  FOR INSERT WITH CHECK (id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS registered_users_update_owner ON public.registered_users;
CREATE POLICY registered_users_update_owner ON public.registered_users
  FOR UPDATE USING (id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS registered_users_delete_admin ON public.registered_users;
CREATE POLICY registered_users_delete_admin ON public.registered_users
  FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TO'LOV TIZIMI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_requests_select_owner ON public.payment_requests;
CREATE POLICY payment_requests_select_owner ON public.payment_requests
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS payment_requests_insert_own ON public.payment_requests;
CREATE POLICY payment_requests_insert_own ON public.payment_requests
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS payment_requests_update_admin ON public.payment_requests;
CREATE POLICY payment_requests_update_admin ON public.payment_requests
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS payment_requests_delete_admin ON public.payment_requests;
CREATE POLICY payment_requests_delete_admin ON public.payment_requests
  FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FOYDALANISH LOGI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usage_logs_select_owner ON public.usage_logs;
CREATE POLICY usage_logs_select_owner ON public.usage_logs
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS usage_logs_insert_own ON public.usage_logs;
CREATE POLICY usage_logs_insert_own ON public.usage_logs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS usage_logs_admin_all ON public.usage_logs;
CREATE POLICY usage_logs_admin_all ON public.usage_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. AUTH LOGI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_logs_select_owner ON public.auth_logs;
CREATE POLICY auth_logs_select_owner ON public.auth_logs
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS auth_logs_insert_own ON public.auth_logs;
CREATE POLICY auth_logs_insert_own ON public.auth_logs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS auth_logs_admin_all ON public.auth_logs;
CREATE POLICY auth_logs_admin_all ON public.auth_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. SAYT SOZLAMALARI (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_settings_select_public ON public.site_settings;
CREATE POLICY site_settings_select_public ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS site_settings_admin_all ON public.site_settings;
CREATE POLICY site_settings_admin_all ON public.site_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. TARIF REJALARI (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_plans_select_public ON public.pricing_plans;
CREATE POLICY pricing_plans_select_public ON public.pricing_plans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS pricing_plans_admin_all ON public.pricing_plans;
CREATE POLICY pricing_plans_admin_all ON public.pricing_plans
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. QONUNLAR BAZASI (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_public ON public.categories;
CREATE POLICY categories_select_public ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS articles_select_public ON public.articles;
CREATE POLICY articles_select_public ON public.articles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS articles_admin_all ON public.articles;
CREATE POLICY articles_admin_all ON public.articles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. HUJJAT SHABLONLARI (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_templates_select_public ON public.document_templates;
CREATE POLICY document_templates_select_public ON public.document_templates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS document_templates_admin_all ON public.document_templates;
CREATE POLICY document_templates_admin_all ON public.document_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS template_categories_select_public ON public.template_categories;
CREATE POLICY template_categories_select_public ON public.template_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS template_categories_admin_all ON public.template_categories;
CREATE POLICY template_categories_admin_all ON public.template_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. JAMIYAT — GURUHLAR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_groups_select_public ON public.community_groups;
CREATE POLICY community_groups_select_public ON public.community_groups
  FOR SELECT USING (
    is_private = false
    OR public.is_group_member(id)
    OR public.is_group_creator(id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS community_groups_insert_own ON public.community_groups;
CREATE POLICY community_groups_insert_own ON public.community_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS community_groups_update_creator ON public.community_groups;
CREATE POLICY community_groups_update_creator ON public.community_groups
  FOR UPDATE USING (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS community_groups_delete_creator ON public.community_groups;
CREATE POLICY community_groups_delete_creator ON public.community_groups
  FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. GURUH A'ZOLARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_members_select_member ON public.community_group_members;
CREATE POLICY community_group_members_select_member ON public.community_group_members
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR public.is_group_creator(group_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS community_group_members_insert_own ON public.community_group_members;
CREATE POLICY community_group_members_insert_own ON public.community_group_members
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_members_delete_own ON public.community_group_members;
CREATE POLICY community_group_members_delete_own ON public.community_group_members
  FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_group_creator(group_id) OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. GURUH POSTLARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_posts_select_member ON public.community_group_posts;
CREATE POLICY community_group_posts_select_member ON public.community_group_posts
  FOR SELECT USING (
    public.is_group_member(group_id)
    OR public.is_group_creator(group_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS community_group_posts_insert_own ON public.community_group_posts;
CREATE POLICY community_group_posts_insert_own ON public.community_group_posts
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text
    AND (public.is_group_member(group_id) OR public.is_group_creator(group_id))
  );

DROP POLICY IF EXISTS community_group_posts_update_own ON public.community_group_posts;
CREATE POLICY community_group_posts_update_own ON public.community_group_posts
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_posts_delete_own ON public.community_group_posts;
CREATE POLICY community_group_posts_delete_own ON public.community_group_posts
  FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. GURUH BILDIRISHNOMALARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_group_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_notifications_select_own ON public.community_group_notifications;
CREATE POLICY community_group_notifications_select_own ON public.community_group_notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_notifications_insert_own ON public.community_group_notifications;
CREATE POLICY community_group_notifications_insert_own ON public.community_group_notifications
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_notifications_update_own ON public.community_group_notifications;
CREATE POLICY community_group_notifications_update_own ON public.community_group_notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_notifications_delete_own ON public.community_group_notifications;
CREATE POLICY community_group_notifications_delete_own ON public.community_group_notifications
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. GURUHGA QO'SHILISH SO'ROVLARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_group_join_requests_select_own ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_select_own ON public.community_group_join_requests
  FOR SELECT USING (
    user_id::text = auth.uid()::text
    OR public.is_group_creator(group_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS community_group_join_requests_insert_own ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_insert_own ON public.community_group_join_requests
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_group_join_requests_update_creator ON public.community_group_join_requests;
CREATE POLICY community_group_join_requests_update_creator ON public.community_group_join_requests
  FOR UPDATE USING (public.is_group_creator(group_id) OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. JAMIYAT LENTASI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_posts_select_public ON public.community_posts;
CREATE POLICY community_posts_select_public ON public.community_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_posts_insert_own ON public.community_posts;
CREATE POLICY community_posts_insert_own ON public.community_posts
  FOR INSERT WITH CHECK (author->>'id' = auth.uid()::text);

DROP POLICY IF EXISTS community_posts_update_own ON public.community_posts;
CREATE POLICY community_posts_update_own ON public.community_posts
  FOR UPDATE USING (author->>'id' = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS community_posts_delete_own ON public.community_posts;
CREATE POLICY community_posts_delete_own ON public.community_posts
  FOR DELETE USING (author->>'id' = auth.uid()::text OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. JAMIYAT IZOH
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_comments_select_public ON public.community_comments;
CREATE POLICY community_comments_select_public ON public.community_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_comments_insert_own ON public.community_comments;
CREATE POLICY community_comments_insert_own ON public.community_comments
  FOR INSERT WITH CHECK (author->>'id' = auth.uid()::text);

DROP POLICY IF EXISTS community_comments_update_own ON public.community_comments;
CREATE POLICY community_comments_update_own ON public.community_comments
  FOR UPDATE USING (author->>'id' = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS community_comments_delete_own ON public.community_comments;
CREATE POLICY community_comments_delete_own ON public.community_comments
  FOR DELETE USING (author->>'id' = auth.uid()::text OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 16. KONSULTATSIYALAR (faqat egasi)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_consultations_select_own ON public.community_consultations;
CREATE POLICY community_consultations_select_own ON public.community_consultations
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS community_consultations_insert_own ON public.community_consultations;
CREATE POLICY community_consultations_insert_own ON public.community_consultations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_consultations_update_own ON public.community_consultations;
CREATE POLICY community_consultations_update_own ON public.community_consultations
  FOR UPDATE USING (user_id::text = auth.uid()::text OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 17. EKSPERTLAR (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_experts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_experts_select_public ON public.community_experts;
CREATE POLICY community_experts_select_public ON public.community_experts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_experts_insert_admin ON public.community_experts;
CREATE POLICY community_experts_insert_admin ON public.community_experts
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS community_experts_update_admin ON public.community_experts;
CREATE POLICY community_experts_update_admin ON public.community_experts
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS community_experts_delete_admin ON public.community_experts;
CREATE POLICY community_experts_delete_admin ON public.community_experts
  FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 18. EKSPERT SHARHLARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_expert_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_expert_reviews_select_public ON public.community_expert_reviews;
CREATE POLICY community_expert_reviews_select_public ON public.community_expert_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_expert_reviews_insert_own ON public.community_expert_reviews;
CREATE POLICY community_expert_reviews_insert_own ON public.community_expert_reviews
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_expert_reviews_delete_own ON public.community_expert_reviews;
CREATE POLICY community_expert_reviews_delete_own ON public.community_expert_reviews
  FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 19. VEBINARLAR (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_webinars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_webinars_select_public ON public.community_webinars;
CREATE POLICY community_webinars_select_public ON public.community_webinars
  FOR SELECT USING (true);

DROP POLICY IF EXISTS community_webinars_insert_admin ON public.community_webinars;
CREATE POLICY community_webinars_insert_admin ON public.community_webinars
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS community_webinars_update_admin ON public.community_webinars;
CREATE POLICY community_webinars_update_admin ON public.community_webinars
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS community_webinars_delete_admin ON public.community_webinars;
CREATE POLICY community_webinars_delete_admin ON public.community_webinars
  FOR DELETE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 20. VEBINAR RO'YXATI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.community_webinar_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_webinar_registrations_select_own ON public.community_webinar_registrations;
CREATE POLICY community_webinar_registrations_select_own ON public.community_webinar_registrations
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS community_webinar_registrations_insert_own ON public.community_webinar_registrations;
CREATE POLICY community_webinar_registrations_insert_own ON public.community_webinar_registrations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS community_webinar_registrations_delete_own ON public.community_webinar_registrations;
CREATE POLICY community_webinar_registrations_delete_own ON public.community_webinar_registrations
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 21. FOYDALANUVCHI BILDIRISHNOMALARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notifications_select_own ON public.user_notifications;
CREATE POLICY user_notifications_select_own ON public.user_notifications
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS user_notifications_insert_own ON public.user_notifications;
CREATE POLICY user_notifications_insert_own ON public.user_notifications
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS user_notifications_update_own ON public.user_notifications;
CREATE POLICY user_notifications_update_own ON public.user_notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS user_notifications_delete_own ON public.user_notifications;
CREATE POLICY user_notifications_delete_own ON public.user_notifications
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 22. QARORLAR DARAXTI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.decision_trees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS decision_trees_select_own ON public.decision_trees;
CREATE POLICY decision_trees_select_own ON public.decision_trees
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS decision_trees_insert_own ON public.decision_trees;
CREATE POLICY decision_trees_insert_own ON public.decision_trees
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS decision_trees_update_own ON public.decision_trees;
CREATE POLICY decision_trees_update_own ON public.decision_trees
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS decision_trees_delete_own ON public.decision_trees;
CREATE POLICY decision_trees_delete_own ON public.decision_trees
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 23. IRAC TAHLILLARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.irac_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS irac_analyses_select_own ON public.irac_analyses;
CREATE POLICY irac_analyses_select_own ON public.irac_analyses
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS irac_analyses_insert_own ON public.irac_analyses;
CREATE POLICY irac_analyses_insert_own ON public.irac_analyses
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS irac_analyses_delete_own ON public.irac_analyses;
CREATE POLICY irac_analyses_delete_own ON public.irac_analyses
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 24. SUDDA SIMULYATSIYA
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.court_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_simulations_select_own ON public.court_simulations;
CREATE POLICY court_simulations_select_own ON public.court_simulations
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS court_simulations_insert_own ON public.court_simulations;
CREATE POLICY court_simulations_insert_own ON public.court_simulations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS court_simulations_update_own ON public.court_simulations;
CREATE POLICY court_simulations_update_own ON public.court_simulations
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS court_simulations_delete_own ON public.court_simulations;
CREATE POLICY court_simulations_delete_own ON public.court_simulations
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 25. AI SUHBAT
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_conversations_select_own ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_select_own ON public.ai_chat_conversations
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_insert_own ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_insert_own ON public.ai_chat_conversations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_update_own ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_update_own ON public.ai_chat_conversations
  FOR UPDATE USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_conversations_delete_own ON public.ai_chat_conversations;
CREATE POLICY ai_chat_conversations_delete_own ON public.ai_chat_conversations
  FOR DELETE USING (user_id::text = auth.uid()::text);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_chat_messages_select_own ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_select_own ON public.ai_chat_messages
  FOR SELECT USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_messages_insert_own ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_insert_own ON public.ai_chat_messages
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS ai_chat_messages_delete_own ON public.ai_chat_messages;
CREATE POLICY ai_chat_messages_delete_own ON public.ai_chat_messages
  FOR DELETE USING (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 26. YORDAM/FIKR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert ON public.feedback
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS feedback_select_own ON public.feedback;
CREATE POLICY feedback_select_own ON public.feedback
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS feedback_update_admin ON public.feedback;
CREATE POLICY feedback_update_admin ON public.feedback
  FOR UPDATE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 27. OBUNALAR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_insert_admin ON public.subscriptions;
CREATE POLICY subscriptions_insert_admin ON public.subscriptions
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS subscriptions_update_admin ON public.subscriptions;
CREATE POLICY subscriptions_update_admin ON public.subscriptions
  FOR UPDATE USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 28. YUTUQLAR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_select_own ON public.achievements;
CREATE POLICY achievements_select_own ON public.achievements
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS achievements_insert_own ON public.achievements;
CREATE POLICY achievements_insert_own ON public.achievements
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 29. HUQUQIY KALKULATSIYALAR
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.legal_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_calculations_select_own ON public.legal_calculations;
CREATE POLICY legal_calculations_select_own ON public.legal_calculations
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS legal_calculations_insert_own ON public.legal_calculations;
CREATE POLICY legal_calculations_insert_own ON public.legal_calculations
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 30. HUJJAT FORMALARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.legal_form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_form_submissions_select_own ON public.legal_form_submissions;
CREATE POLICY legal_form_submissions_select_own ON public.legal_form_submissions
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

DROP POLICY IF EXISTS legal_form_submissions_insert_own ON public.legal_form_submissions;
CREATE POLICY legal_form_submissions_insert_own ON public.legal_form_submissions
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id::text = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 31. HUJJAT KATEGORIYALARI
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.legal_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_categories_select_public ON public.legal_categories;
CREATE POLICY legal_categories_select_public ON public.legal_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS legal_categories_admin_all ON public.legal_categories;
CREATE POLICY legal_categories_admin_all ON public.legal_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 32. HUQUQIY HUJJATLAR (public read, admin write)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS legal_documents_select_public ON public.legal_documents;
CREATE POLICY legal_documents_select_public ON public.legal_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS legal_documents_admin_all ON public.legal_documents;
CREATE POLICY legal_documents_admin_all ON public.legal_documents
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- 33. HUQUQIY BOOKMARKLAR
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'legal_bookmarks' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.legal_bookmarks ENABLE ROW LEVEL SECURITY';
    
    DROP POLICY IF EXISTS legal_bookmarks_select_own ON public.legal_bookmarks;
    EXECUTE 'CREATE POLICY legal_bookmarks_select_own ON public.legal_bookmarks FOR SELECT USING (user_id::text = auth.uid()::text)';
    
    DROP POLICY IF EXISTS legal_bookmarks_insert_own ON public.legal_bookmarks;
    EXECUTE 'CREATE POLICY legal_bookmarks_insert_own ON public.legal_bookmarks FOR INSERT WITH CHECK (user_id::text = auth.uid()::text)';
    
    DROP POLICY IF EXISTS legal_bookmarks_delete_own ON public.legal_bookmarks;
    EXECUTE 'CREATE POLICY legal_bookmarks_delete_own ON public.legal_bookmarks FOR DELETE USING (user_id::text = auth.uid()::text)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 34. QONUNLAR BAZASIDAGI KODEKSLAR (codes jadvali)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'codes' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY';
    
    DROP POLICY IF EXISTS codes_select_public ON public.codes;
    EXECUTE 'CREATE POLICY codes_select_public ON public.codes FOR SELECT USING (true)';
    
    DROP POLICY IF EXISTS codes_admin_all ON public.codes;
    EXECUTE 'CREATE POLICY codes_admin_all ON public.codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 35. SUD ARGUMENTLARI
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'court_arguments' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.court_arguments ENABLE ROW LEVEL SECURITY';
    
    DROP POLICY IF EXISTS court_arguments_select_own ON public.court_arguments;
    EXECUTE 'CREATE POLICY court_arguments_select_own ON public.court_arguments FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin())';
    
    DROP POLICY IF EXISTS court_arguments_insert_own ON public.court_arguments;
    EXECUTE 'CREATE POLICY court_arguments_insert_own ON public.court_arguments FOR INSERT WITH CHECK (user_id::text = auth.uid()::text)';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 36. FOYDALANUVCHI LIMITLARI
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_usage_limits' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY';
    
    DROP POLICY IF EXISTS user_usage_limits_select_own ON public.user_usage_limits;
    EXECUTE 'CREATE POLICY user_usage_limits_select_own ON public.user_usage_limits FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin())';
    
    DROP POLICY IF EXISTS user_usage_limits_admin_all ON public.user_usage_limits;
    EXECUTE 'CREATE POLICY user_usage_limits_admin_all ON public.user_usage_limits FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 37. LITEFSOFT SOZLAMALARI (site_settings dan ajratilgan)
-- ═══════════════════════════════════════════════════════════════════════════
-- site_settings allaqachon yuqorida qo'llanilgan

-- ═══════════════════════════════════════════════════════════════════════════
-- 38. ADMIN AUDIT LOG
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY';
    
    DROP POLICY IF EXISTS admin_audit_log_select_admin ON public.admin_audit_log;
    EXECUTE 'CREATE POLICY admin_audit_log_select_admin ON public.admin_audit_log FOR SELECT USING (public.is_admin())';
    
    DROP POLICY IF EXISTS admin_audit_log_insert_admin ON public.admin_audit_log;
    EXECUTE 'CREATE POLICY admin_audit_log_insert_admin ON public.admin_audit_log FOR INSERT WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 39. ADVOKATLAR/MIJZOZLAR (lawyers, clients, client_cases, client_requests)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lawyers' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS lawyers_select_own ON public.lawyers;
    EXECUTE 'CREATE POLICY lawyers_select_own ON public.lawyers FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin())';
    DROP POLICY IF EXISTS lawyers_insert_own ON public.lawyers;
    EXECUTE 'CREATE POLICY lawyers_insert_own ON public.lawyers FOR INSERT WITH CHECK (user_id::text = auth.uid()::text)';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS clients_select_admin ON public.clients;
    EXECUTE 'CREATE POLICY clients_select_admin ON public.clients FOR SELECT USING (public.is_admin())';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_cases' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.client_cases ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS client_cases_select_admin ON public.client_cases;
    EXECUTE 'CREATE POLICY client_cases_select_admin ON public.client_cases FOR SELECT USING (public.is_admin())';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_requests' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY';
    DROP POLICY IF EXISTS client_requests_select_admin ON public.client_requests;
    EXECUTE 'CREATE POLICY client_requests_select_admin ON public.client_requests FOR SELECT USING (public.is_admin())';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- OXIRGI TEKSHIRUV — har qanday RLS yoqilmagan jadvallarni topish
-- ═══════════════════════════════════════════════════════════════════════════
-- Agar xatolik chiqsa, debug uchun:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — Barcha public jadvallarda RLS YOQILDI
-- ═══════════════════════════════════════════════════════════════════════════
