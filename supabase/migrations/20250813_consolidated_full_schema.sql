-- ═══════════════════════════════════════════════════════════════════════════
-- JURISTIV — TO'LIQ KONSOLIDATSIYALANGAN SXEMA (yagona migratsiya)
-- ═══════════════════════════════════════════════════════════════════════════
-- Ushbu fayl 2024–2025 yillardagi barcha alohida migratsiyalarni birlashtiradi.
-- Yangi (toza) Supabase loyihasida faqat SHU faylni run qilish kifoya.
-- Mavjud loyihada ham xavfsiz: hamma buyruqlar idempotent
-- (IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS).
--
-- QAMRAB OLGAN JADVALLAR:
--   registered_users + auth.users sinxron triggerlari + auto-merge
--   payment_requests, usage_logs, auth_logs, site_settings, pricing_plans
--   categories, articles (qonunlar bazasi)
--   document_templates, template_categories
--   community_* (guruhlar, ekspertlar, vebinarlar, lenta, so'rovlar, guruh postlari)
--   user_notifications, decision_trees
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. REGISTERED USERS — foydalanuvchilar (id UUID, auth.users bilan bir xil)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.registered_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255) DEFAULT '',
  full_name TEXT DEFAULT '',
  role VARCHAR(50) DEFAULT 'USER',
  avatar TEXT DEFAULT '',
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  balance DECIMAL(12, 2) DEFAULT 0,
  blocked BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  provider TEXT DEFAULT 'email',
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eski sxemalardan qolgan bo'lishi mumkin bo'lgan ustunlar
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_registered_users_email ON public.registered_users(email);
CREATE INDEX IF NOT EXISTS idx_registered_users_role ON public.registered_users(role);

-- ── auth.users → registered_users sinxron trigger ────────────────────────
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.registered_users (
    id, email, full_name, name, role, avatar, subscription_plan,
    provider, is_active, created_at, last_login
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'email', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
    COALESCE(NEW.raw_user_meta_data->>'subscription_plan', 'free'),
    'email',
    true,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.last_sign_in_at, NEW.created_at, NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE registered_users.full_name END,
    name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE registered_users.name END,
    last_login = GREATEST(COALESCE(registered_users.last_login, '1970-01-01'), COALESCE(EXCLUDED.last_login, '1970-01-01')),
    is_active = true,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_registered();

CREATE OR REPLACE FUNCTION public.sync_auth_user_delete_from_registered()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.registered_users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_delete_from_registered();

-- ── Avtomatik merge: bir xil email bilan duplicate qator yaratilmasin ────
CREATE OR REPLACE FUNCTION public.auto_merge_registered_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing UUID;
BEGIN
  IF NEW.email IS NULL OR NEW.email = '' OR pg_trigger_depth() > 2 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing
  FROM public.registered_users
  WHERE LOWER(email) = LOWER(NEW.email) AND id <> NEW.id
  ORDER BY
    (CASE WHEN LOWER(COALESCE(role, 'user')) IN ('admin', 'super_admin') THEN 0 ELSE 1 END),
    created_at ASC, id ASC
  LIMIT 1;

  IF v_existing IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.registered_users
  SET
    name = COALESCE(NULLIF(name, ''), NEW.name),
    full_name = COALESCE(NULLIF(full_name, ''), NEW.full_name),
    role = CASE
      WHEN LOWER(COALESCE(NEW.role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      WHEN LOWER(COALESCE(role, 'user')) IN ('admin', 'super_admin') THEN 'ADMIN'
      ELSE COALESCE(NULLIF(role, ''), 'USER')
    END,
    avatar = COALESCE(NULLIF(avatar, ''), NEW.avatar),
    subscription_plan = CASE
      WHEN COALESCE(NEW.subscription_plan, 'free') <> 'free' THEN NEW.subscription_plan
      ELSE subscription_plan
    END,
    subscription_expires_at = COALESCE(subscription_expires_at, NEW.subscription_expires_at),
    last_login = GREATEST(COALESCE(last_login, '1970-01-01'::TIMESTAMPTZ), COALESCE(NEW.last_login, '1970-01-01'::TIMESTAMPTZ)),
    provider = COALESCE(NULLIF(provider, ''), NEW.provider),
    updated_at = NOW()
  WHERE id = v_existing;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_registered_users_auto_merge ON public.registered_users;
CREATE TRIGGER trg_registered_users_auto_merge
BEFORE INSERT ON public.registered_users
FOR EACH ROW EXECUTE FUNCTION public.auto_merge_registered_users();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TO'LOV VA LOG JADVALLARI
-- ═══════════════════════════════════════════════════════════════════════════
-- payment_requests.id UUID (frontend matn ID yuborsa ham serverda UUID yaratiladi)
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_email TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  receipt_image TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON public.payment_requests(user_id);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  name TEXT DEFAULT '',
  tokens NUMERIC DEFAULT 0,
  action TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_email ON public.usage_logs(email);

CREATE TABLE IF NOT EXISTS public.auth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  name TEXT DEFAULT '',
  method TEXT DEFAULT 'email' CHECK (method IN ('email', 'google')),
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  announcement_banner TEXT DEFAULT '',
  announcement_active BOOLEAN DEFAULT TRUE,
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success')),
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  telegram_link TEXT DEFAULT '',
  legal_disclaimer TEXT DEFAULT '',
  system_prompt TEXT DEFAULT '',
  payment_card_number TEXT DEFAULT '',
  payment_details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]',
  case_limit INTEGER DEFAULT -1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. QONUNLAR BAZASI — categories + articles
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'book-open',
  color TEXT DEFAULT 'from-blue-500 to-blue-600',
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT NOT NULL REFERENCES public.categories(code_id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  article_number_int INTEGER,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  chapter TEXT DEFAULT 'Umumiy qoidalar',
  section TEXT DEFAULT '',
  penalties TEXT DEFAULT '',
  cross_references TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, article_number)
);

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS article_number_int INTEGER;

-- Raqamli tartiblash uchun article_number_int ni to'ldirish
UPDATE public.articles
SET article_number_int = CASE
  WHEN article_number ~ '^\d+$' THEN article_number::INTEGER
  ELSE 0
END
WHERE article_number_int IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_content_search
  ON public.articles USING GIN(to_tsvector('simple', content));
CREATE INDEX IF NOT EXISTS idx_articles_number_search ON public.articles(article_number);
CREATE INDEX IF NOT EXISTS idx_articles_code_id ON public.articles(code_id);
CREATE INDEX IF NOT EXISTS idx_articles_code_id_number_int ON public.articles(code_id, article_number_int);
CREATE INDEX IF NOT EXISTS idx_articles_title_content_search
  ON public.articles USING gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. HUJJAT SHABLONLARI
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  law_ref VARCHAR(500) DEFAULT '',
  format VARCHAR(10) DEFAULT 'DOCX' CHECK (format IN ('TXT', 'DOCX', 'PDF')),
  file_size VARCHAR(20) DEFAULT '0 KB',
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(100) DEFAULT 'file-text',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.template_categories (slug, name, icon, sort_order) VALUES
  ('sud', 'Sud hujjatlari', 'scale', 1),
  ('shartnoma', 'Shartnomalar', 'file-signature', 2),
  ('da''vo', 'Da''vo va arizalar', 'file-text', 3),
  ('mehnat', 'Mehnat huquqi', 'briefcase', 4),
  ('vakolat', 'Ishonchnoma va vakolat', 'user-check', 5),
  ('majlis', 'Majlis va bayonnomalar', 'users', 6),
  ('xat', 'Xat va murojaatlar', 'mail', 7),
  ('moliya', 'Moliya va hisobot', 'dollar-sign', 8)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON public.document_templates(category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_active ON public.document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_slug ON public.template_categories(slug);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. JAMIYAT — guruhlar, ekspertlar, vebinarlar
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '👥',
  category TEXT DEFAULT 'Umumiy',
  created_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  reputation INTEGER DEFAULT 0,
  webinars_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES public.community_experts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(expert_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  host TEXT DEFAULT '',
  host_title TEXT DEFAULT '',
  category TEXT DEFAULT 'Umumiy',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 500,
  participants_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  recording_url TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES public.community_webinars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(webinar_id, user_id)
);

-- ── Lenta (feed) ─────────────────────────────────────────────────────────
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
  admin_reply TEXT DEFAULT '',
  reply_at TIMESTAMPTZ,
  assigned_expert_id TEXT DEFAULT '',
  status_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_consultations
  ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_expert_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. BILDIRISHNOMALAR + QARORLAR DARAXTI
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  type TEXT DEFAULT 'info', -- info | success | warning | error
  category TEXT DEFAULT 'system', -- system | payment | legal | profile | ai | community
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '',
  action_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON public.user_notifications(user_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_decision_trees_user
  ON public.decision_trees(user_id, updated_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. REALTIME PUBLIKATSIYALAR
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_group_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════
-- registered_users: admin hammasini ko'radi, user o'zini
ALTER TABLE public.registered_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read all users" ON public.registered_users;
DROP POLICY IF EXISTS "Users can read own data" ON public.registered_users;
DROP POLICY IF EXISTS "Users can update own data" ON public.registered_users;
DROP POLICY IF EXISTS "Admin all access" ON public.registered_users;
CREATE POLICY "Admins can read all users" ON public.registered_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registered_users ru WHERE ru.id = auth.uid() AND ru.role IN ('ADMIN', 'admin', 'super_admin'))
  );
CREATE POLICY "Users can read own data" ON public.registered_users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.registered_users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- payment_requests / logs: admin full access, user o'zini ko'radi
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin all access" ON public.payment_requests;
DROP POLICY IF EXISTS "Admin all access" ON public.usage_logs;
DROP POLICY IF EXISTS "Admin all access" ON public.auth_logs;
CREATE POLICY "Admin all access" ON public.payment_requests FOR ALL USING (true);
CREATE POLICY "Admin all access" ON public.usage_logs FOR ALL USING (true);
CREATE POLICY "Admin all access" ON public.auth_logs FOR ALL USING (true);

-- site_settings / pricing_plans: hamma o'qiydi
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Public read access" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admin all access" ON public.site_settings;
DROP POLICY IF EXISTS "Admin all access" ON public.pricing_plans;
CREATE POLICY "Public read access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Admin all access" ON public.site_settings FOR ALL USING (true);
CREATE POLICY "Admin all access" ON public.pricing_plans FOR ALL USING (true);

-- categories / articles: hamma o'qiydi
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read articles" ON public.articles;
DROP POLICY IF EXISTS "Public read access" ON public.categories;
DROP POLICY IF EXISTS "Public read access" ON public.articles;
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.articles FOR SELECT USING (true);

-- document_templates / template_categories
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active templates" ON public.document_templates;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.template_categories;
CREATE POLICY "Anyone can view active templates" ON public.document_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view categories" ON public.template_categories FOR SELECT USING (true);

-- community: hamma o'qiydi, admin boshqaradi
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view groups" ON public.community_groups;
DROP POLICY IF EXISTS "Everyone can view group members" ON public.community_group_members;
DROP POLICY IF EXISTS "Everyone can view experts" ON public.community_experts;
DROP POLICY IF EXISTS "Everyone can view reviews" ON public.community_expert_reviews;
DROP POLICY IF EXISTS "Everyone can view webinars" ON public.community_webinars;
DROP POLICY IF EXISTS "Everyone can view registrations" ON public.community_webinar_registrations;
DROP POLICY IF EXISTS community_posts_select ON public.community_posts;
DROP POLICY IF EXISTS community_comments_select ON public.community_comments;
DROP POLICY IF EXISTS community_consultations_select ON public.community_consultations;
DROP POLICY IF EXISTS group_posts_select ON public.community_group_posts;

CREATE POLICY "Everyone can view groups" ON public.community_groups FOR SELECT USING (true);
CREATE POLICY "Everyone can view group members" ON public.community_group_members FOR SELECT USING (true);
CREATE POLICY "Everyone can view experts" ON public.community_experts FOR SELECT USING (true);
CREATE POLICY "Everyone can view reviews" ON public.community_expert_reviews FOR SELECT USING (true);
CREATE POLICY "Everyone can view webinars" ON public.community_webinars FOR SELECT USING (true);
CREATE POLICY "Everyone can view registrations" ON public.community_webinar_registrations FOR SELECT USING (true);
CREATE POLICY community_posts_select ON public.community_posts FOR SELECT USING (true);
CREATE POLICY community_comments_select ON public.community_comments FOR SELECT USING (true);
CREATE POLICY community_consultations_select ON public.community_consultations FOR SELECT USING (true);
CREATE POLICY group_posts_select ON public.community_group_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS community_posts_insert ON public.community_posts;
DROP POLICY IF EXISTS community_posts_update ON public.community_posts;
DROP POLICY IF EXISTS community_posts_delete ON public.community_posts;
DROP POLICY IF EXISTS community_comments_insert ON public.community_comments;
DROP POLICY IF EXISTS community_comments_delete ON public.community_comments;
DROP POLICY IF EXISTS community_consultations_insert ON public.community_consultations;
DROP POLICY IF EXISTS community_consultations_update ON public.community_consultations;
DROP POLICY IF EXISTS group_posts_insert ON public.community_group_posts;
DROP POLICY IF EXISTS group_posts_delete ON public.community_group_posts;
CREATE POLICY community_posts_insert ON public.community_posts FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY community_posts_update ON public.community_posts FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY community_posts_delete ON public.community_posts FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY community_comments_insert ON public.community_comments FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY community_comments_delete ON public.community_comments FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY community_consultations_insert ON public.community_consultations FOR INSERT WITH CHECK (true);
CREATE POLICY community_consultations_update ON public.community_consultations FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY group_posts_insert ON public.community_group_posts FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY group_posts_delete ON public.community_group_posts FOR DELETE USING (auth.role() IN ('authenticated', 'service_role'));

-- decision_trees: faqat o'z daraxtlari
ALTER TABLE public.decision_trees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS decision_trees_select ON public.decision_trees;
DROP POLICY IF EXISTS decision_trees_insert ON public.decision_trees;
DROP POLICY IF EXISTS decision_trees_update ON public.decision_trees;
DROP POLICY IF EXISTS decision_trees_delete ON public.decision_trees;
CREATE POLICY decision_trees_select ON public.decision_trees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY decision_trees_insert ON public.decision_trees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY decision_trees_update ON public.decision_trees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY decision_trees_delete ON public.decision_trees FOR DELETE USING (auth.uid() = user_id);

-- user_notifications: foydalanuvchi faqat o'zini
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_notifications_select ON public.user_notifications;
DROP POLICY IF EXISTS user_notifications_insert ON public.user_notifications;
DROP POLICY IF EXISTS user_notifications_update ON public.user_notifications;
DROP POLICY IF EXISTS user_notifications_delete ON public.user_notifications;
CREATE POLICY user_notifications_select ON public.user_notifications FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY user_notifications_insert ON public.user_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY user_notifications_update ON public.user_notifications FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY user_notifications_delete ON public.user_notifications FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. DEFAULT MA'LUMOTLAR (seed) — demo ma'lumotlar YO'Q
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO public.pricing_plans (id, name, price, features, case_limit, sort_order) VALUES
  ('free', 'Bepul', 0, '["To''liq qonunlar bazasi — cheksiz", "10 ta AI chat so''rovi / oy", "3 ta IRAC tahlili / oy", "3 ta hujjat generator / oy", "5 ta ovozli yozuv (STT) / oy", "Asboblar, jamiyat, statistika — cheksiz"]', 5, 1),
  ('standart', 'Standart', 45000, '["200 ta AI chat so''rovi / oy", "Cheksiz IRAC tahlili", "50 ta hujjat generator / oy", "20 ta hujjat tahlili / oy", "20 ta qarorlar daraxti / oy", "100 ta ovozli yozuv (STT) / oy", "5 ta virtual sud sessiyasi / oy", "20 ta senariy va argument tahlili / oy"]', 50, 2),
  ('pro', 'Pro', 140000, '["Cheksiz AI chat so''rovlari", "Cheksiz IRAC, hujjat, daraxt, senariy", "Cheksiz ovozli yozuv (STT)", "Cheksiz virtual sud sessiyalari", "Shaxsiy maslahatchi", "Ekspert konsultatsiyasi"]', -1, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (id, announcement_banner, hero_title, hero_subtitle, contact_email, payment_card_number, payment_details) VALUES
  ('global', 'JURISTIV - Huquqiy AI yordamchingiz!', 'Huquqiy masalalarni AI bilan yeching', 'O''zbekiston qonunchiligi bo''yicha professional AI yordamchi', 'support@juristiv.uz', '8600 1234 5678 9012', 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, code_id, name, description, icon, color) VALUES
  (uuid_generate_v4(), 'constitution', 'O''zbekiston Respublikasi Konstitutsiyasi', 'O''zbekiston Respublikasining Asosiy Qonuni', 'landmark', 'indigo'),
  (uuid_generate_v4(), 'criminal_code', 'O''zbekiston Respublikasi Jinoyat Kodeksi', 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun', 'gavel', 'red'),
  (uuid_generate_v4(), 'civil_code', 'O''zbekiston Respublikasi Fuqarolik Kodeksi', 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun', 'scale', 'blue'),
  (uuid_generate_v4(), 'labor_code', 'O''zbekiston Respublikasi Mehnat Kodeksi', 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun', 'users', 'green'),
  (uuid_generate_v4(), 'family_code', 'O''zbekiston Respublikasi Oila Kodeksi', 'Oila munosabatlarini tartibga soluvchi asosiy qonun', 'users', 'pink'),
  (uuid_generate_v4(), 'tax_code', 'O''zbekiston Respublikasi Soliq Kodeksi', 'Soliq munosabatlarini tartibga soluvchi asosiy qonun', 'dollar-sign', 'purple'),
  (uuid_generate_v4(), 'land_code', 'O''zbekiston Respublikasi Yer Kodeksi', 'Yer munosabatlarini tartibga soluvchi asosiy qonun', 'tree-pine', 'amber'),
  (uuid_generate_v4(), 'admin_code', 'O''zbekiston Respublikasi Ma''muriy Javobgarlik To''g''risidagi Kodeksi', 'Ma''muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun', 'shield', 'slate'),
  (uuid_generate_v4(), 'civil_procedure_code', 'O''zbekiston Respublikasi Fuqarolik Protsessual Kodeksi', 'Fuqarolik ishlarini sudda ko''rish tartibini belgilovchi qonun', 'file-text', 'cyan'),
  (uuid_generate_v4(), 'criminal_procedure_code', 'O''zbekiston Respublikasi Jinoyat Protsessual Kodeksi', 'Jinoyat ishlarini tergov qilish va sudda ko''rish tartibini belgilovchi qonun', 'file-text', 'rose'),
  (uuid_generate_v4(), 'economic_procedure_code', 'O''zbekiston Respublikasi Iqtisodiy Protsessual Kodeksi', 'Iqtisodiy nizolarni sudda ko''rish tartibini belgilovchi qonun', 'dollar-sign', 'teal')
ON CONFLICT (code_id) DO NOTHING;
