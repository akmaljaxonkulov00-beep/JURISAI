-- FIX RLS POLICIES + VIEWS
-- Muammo: oldingi migrationlar xatolar bilan to'liq ishlamagan.
-- Bu migration barini tuzatadi.

-- 1) is_admin() funksiasi — agar mavjud bo'lmasa yaratiladi
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.registered_users
    WHERE id::text = auth.uid()::text
    AND role IN ('ADMIN', 'SUPER_ADMIN', 'admin')
  );
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2) public_profiles view — statistika leaderboard uchun
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name
  FROM public.registered_users
  WHERE name IS NOT NULL AND name <> '';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 3) registered_users RLS — tozalab qayta yaratish
-- Oldingi policy'larni xavfsiz o'chiramiz
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public read registered_users" ON public.registered_users;
  DROP POLICY IF EXISTS "Public insert registered_users" ON public.registered_users;
  DROP POLICY IF EXISTS "Admin all access" ON public.registered_users;
  DROP POLICY IF EXISTS registered_users_select_owner ON public.registered_users;
  DROP POLICY IF EXISTS registered_users_insert_own ON public.registered_users;
  DROP POLICY IF EXISTS registered_users_update_owner ON public.registered_users;
  DROP POLICY IF EXISTS registered_users_delete_admin ON public.registered_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS yoqilishi kerak
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;

-- SELECT: egasi o'zini ko'radi yoki admin hammasini ko'radi
CREATE POLICY registered_users_select_owner ON public.registered_users
  FOR SELECT USING (
    id::text = auth.uid()::text
    OR public.is_admin()
  );

-- INSERT: service_role orqali (API routes) ishlaydi; client faqat o'zini qo'sha oladi
CREATE POLICY registered_users_insert_own ON public.registered_users
  FOR INSERT WITH CHECK (
    id::text = auth.uid()::text
    OR public.is_admin()
  );

-- UPDATE: egasi o'zini yangilaydi yoki admin
CREATE POLICY registered_users_update_owner ON public.registered_users
  FOR UPDATE USING (
    id::text = auth.uid()::text
    OR public.is_admin()
  );

-- DELETE: faqat admin
CREATE POLICY registered_users_delete_admin ON public.registered_users
  FOR DELETE USING (public.is_admin());

-- 4) usage_logs — user faqat o'zini ko'radi
DO $$ BEGIN
  DROP POLICY IF EXISTS "usage_logs_select_own" ON public.usage_logs;
  DROP POLICY IF EXISTS "usage_logs_insert_own" ON public.usage_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_logs_select_own ON public.usage_logs
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY usage_logs_insert_own ON public.usage_logs
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR public.is_admin());

-- 5) payment_requests — user faqat o'zini ko'radi
DO $$ BEGIN
  DROP POLICY IF EXISTS "payment_requests_select_own" ON public.payment_requests;
  DROP POLICY IF EXISTS "payment_requests_insert_own" ON public.payment_requests;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_requests_select_own ON public.payment_requests
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY payment_requests_insert_own ON public.payment_requests
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY payment_requests_update_admin ON public.payment_requests
  FOR UPDATE USING (public.is_admin());

-- 6) user_notifications — user faqat o'zini ko'radi
DO $$ BEGIN
  DROP POLICY IF EXISTS "user_notifications_select_own" ON public.user_notifications;
  DROP POLICY IF EXISTS "user_notifications_insert_admin" ON public.user_notifications;
  DROP POLICY IF EXISTS "user_notifications_update_own" ON public.user_notifications;
  DROP POLICY IF EXISTS "user_notifications_delete_own" ON public.user_notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_notifications_select_own ON public.user_notifications
  FOR SELECT USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY user_notifications_insert_admin ON public.user_notifications
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY user_notifications_update_own ON public.user_notifications
  FOR UPDATE USING (user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY user_notifications_delete_own ON public.user_notifications
  FOR DELETE USING (user_id::text = auth.uid()::text OR public.is_admin());

-- 7) notification_read_status
DO $$ BEGIN
  DROP POLICY IF EXISTS "notification_read_status_own" ON public.notification_read_status;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_read_status_own ON public.notification_read_status
  FOR ALL USING (user_id::text = auth.uid()::text);

-- 8) site_settings — hamma o'qiy oladi, faqat admin yozadi
DO $$ BEGIN
  DROP POLICY IF EXISTS "site_settings_read" ON public.site_settings;
  DROP POLICY IF EXISTS "site_settings_write" ON public.site_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_settings_read ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY site_settings_write ON public.site_settings
  FOR ALL USING (public.is_admin());

-- 9) pricing_plans — hamma o'qiy oladi, faqat admin yozadi
DO $$ BEGIN
  DROP POLICY IF EXISTS "pricing_plans_read" ON public.pricing_plans;
  DROP POLICY IF EXISTS "pricing_plans_write" ON public.pricing_plans;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY pricing_plans_read ON public.pricing_plans
  FOR SELECT USING (true);

CREATE POLICY pricing_plans_write ON public.pricing_plans
  FOR ALL USING (public.is_admin());

-- 10) auth_logs — faqat admin ko'radi
DO $$ BEGIN
  DROP POLICY IF EXISTS "auth_logs_admin" ON public.auth_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_logs_admin ON public.auth_logs
  FOR SELECT USING (public.is_admin());

-- 11) community_groups — ommaviy o'qish, a'zolar to'liq kirish
DO $$ BEGIN
  DROP POLICY IF EXISTS "community_groups_read" ON public.community_groups;
  DROP POLICY IF EXISTS "community_groups_write" ON public.community_groups;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_groups_read ON public.community_groups
  FOR SELECT USING (true);

CREATE POLICY community_groups_write ON public.community_groups
  FOR ALL USING (public.is_admin() OR created_by::text = auth.uid()::text);

-- 12) community_group_members
DO $$ BEGIN
  DROP POLICY IF EXISTS "community_group_members_read" ON public.community_group_members;
  DROP POLICY IF EXISTS "community_group_members_write" ON public.community_group_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_group_members_read ON public.community_group_members
  FOR SELECT USING (true);

CREATE POLICY community_group_members_write ON public.community_group_members
  FOR ALL USING (public.is_admin() OR user_id::text = auth.uid()::text);

-- 13) community_group_posts
DO $$ BEGIN
  DROP POLICY IF EXISTS "community_group_posts_read" ON public.community_group_posts;
  DROP POLICY IF EXISTS "community_group_posts_write" ON public.community_group_posts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_group_posts_read ON public.community_group_posts
  FOR SELECT USING (true);

CREATE POLICY community_group_posts_write ON public.community_group_posts
  FOR ALL USING (public.is_admin() OR user_id::text = auth.uid()::text);

-- 14) categories va articles — hamma o'qiy oladi, admin yozadi
DO $$ BEGIN
  DROP POLICY IF EXISTS "categories_read" ON public.categories;
  DROP POLICY IF EXISTS "categories_write" ON public.categories;
  DROP POLICY IF EXISTS "articles_read" ON public.articles;
  DROP POLICY IF EXISTS "articles_write" ON public.articles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY categories_read ON public.categories FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY categories_write ON public.categories FOR ALL USING (public.is_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY articles_read ON public.articles FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY articles_write ON public.articles FOR ALL USING (public.is_admin());
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Done
SELECT 'RLS + views fixed successfully' as result;
