-- ═══════════════════════════════════════════════════════════════════════════
-- JURISTIV.UZ — ADVOCATE, CITIZEN, LAW STUDENT & ADMIN UNIFIED SCHEMA (2026-11-05)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. registered_users qo'shimcha maydonlar (agar yo'q bo'lsa)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registered_users' AND column_name = 'must_change_password') THEN
    ALTER TABLE public.registered_users ADD COLUMN must_change_password BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registered_users' AND column_name = 'phone') THEN
    ALTER TABLE public.registered_users ADD COLUMN phone VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registered_users' AND column_name = 'city') THEN
    ALTER TABLE public.registered_users ADD COLUMN city VARCHAR(100) DEFAULT 'Toshkent';
  END IF;
END $$;

-- 2. Advocate Profiles kengaytirish
CREATE TABLE IF NOT EXISTS public.advocate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  experience_years INT DEFAULT 1,
  license_number VARCHAR(100) UNIQUE,
  license_date DATE,
  bar_association VARCHAR(255),
  workplace VARCHAR(255),
  education TEXT,
  languages JSONB DEFAULT '["Oʻzbekcha"]'::jsonb,
  consultation_formats JSONB DEFAULT '["online"]'::jsonb,
  location_city VARCHAR(100) DEFAULT 'Toshkent',
  pricing_type VARCHAR(50) DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'starting', 'negotiable', 'per_case')),
  hourly_rate DECIMAL(12, 2) DEFAULT 150000,
  starting_rate DECIMAL(12, 2) DEFAULT 100000,
  is_price_public BOOLEAN DEFAULT true,
  services JSONB DEFAULT '[]'::jsonb,
  availability JSONB DEFAULT '{}'::jsonb,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verifying', 'verified', 'manual_review', 'rejected', 'suspended')),
  verification_rejection_reason TEXT,
  official_verification_data JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advocate Profiles mavjud ustunlarini xavfsiz qo'shish
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'pricing_type') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN pricing_type VARCHAR(50) DEFAULT 'fixed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'starting_rate') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN starting_rate DECIMAL(12, 2) DEFAULT 100000;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'is_price_public') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN is_price_public BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'license_date') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN license_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'workplace') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN workplace VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'education') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN education TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'official_verification_data') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN official_verification_data JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advocate_profiles' AND column_name = 'verified_by') THEN
    ALTER TABLE public.advocate_profiles ADD COLUMN verified_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Citizen Profiles & Usage Limits
CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  city VARCHAR(100) DEFAULT 'Toshkent',
  language VARCHAR(20) DEFAULT 'uz',
  free_questions_used INT DEFAULT 0,
  free_questions_reset_month VARCHAR(7) DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  question_credits INT DEFAULT 0,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Law Student Invitations (Admin tomonidan yaratiladigan taklifnomalar)
CREATE TABLE IF NOT EXISTS public.law_student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university VARCHAR(255) NOT NULL,
  faculty VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  student_id_code VARCHAR(100) NOT NULL,
  study_year INT DEFAULT 1,
  email VARCHAR(255),
  phone VARCHAR(50),
  login_identifier VARCHAR(100) UNIQUE NOT NULL,
  temp_password_hash TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Law Student Profiles
CREATE TABLE IF NOT EXISTS public.law_student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  university VARCHAR(255) NOT NULL,
  faculty VARCHAR(255),
  study_year INT DEFAULT 1,
  specialization VARCHAR(255),
  student_id_number VARCHAR(100),
  level VARCHAR(50) DEFAULT 'beginner' CHECK (level IN ('beginner', 'contributor', 'skilled', 'advanced', 'expert')),
  reputation_score INT DEFAULT 50,
  answers_count INT DEFAULT 0,
  approved_answers_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Legal Questions jadvalini qulflash (lock) va yagona javob bilan kengaytirish
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_questions' AND column_name = 'locked_by_student_id') THEN
    ALTER TABLE public.legal_questions ADD COLUMN locked_by_student_id UUID REFERENCES public.registered_users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_questions' AND column_name = 'locked_at') THEN
    ALTER TABLE public.legal_questions ADD COLUMN locked_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_questions' AND column_name = 'lock_expires_at') THEN
    ALTER TABLE public.legal_questions ADD COLUMN lock_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_questions' AND column_name = 'answers_count') THEN
    ALTER TABLE public.legal_questions ADD COLUMN answers_count INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_questions' AND column_name = 'is_paid_question') THEN
    ALTER TABLE public.legal_questions ADD COLUMN is_paid_question BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 7. Legal Answers baholash mezonlari (7 ta mezon + AI review)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'ai_evaluation') THEN
    ALTER TABLE public.legal_answers ADD COLUMN ai_evaluation JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'ai_score') THEN
    ALTER TABLE public.legal_answers ADD COLUMN ai_score INT DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'citizen_rating') THEN
    ALTER TABLE public.legal_answers ADD COLUMN citizen_rating INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'citizen_feedback') THEN
    ALTER TABLE public.legal_answers ADD COLUMN citizen_feedback TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'reward_amount') THEN
    ALTER TABLE public.legal_answers ADD COLUMN reward_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_answers' AND column_name = 'reward_status') THEN
    ALTER TABLE public.legal_answers ADD COLUMN reward_status VARCHAR(50) DEFAULT 'none' CHECK (reward_status IN ('none', 'pending', 'approved', 'paid', 'cancelled'));
  END IF;
END $$;

-- 8. Student Wallet (Talaba hamyoni)
CREATE TABLE IF NOT EXISTS public.student_wallets (
  student_id UUID PRIMARY KEY REFERENCES public.registered_users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) DEFAULT 0 CHECK (balance >= 0),
  pending_balance DECIMAL(12, 2) DEFAULT 0 CHECK (pending_balance >= 0),
  total_earned DECIMAL(12, 2) DEFAULT 0 CHECK (total_earned >= 0),
  total_withdrawn DECIMAL(12, 2) DEFAULT 0 CHECK (total_withdrawn >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Student Payout Requests (Pul yechib olish so'rovlari)
CREATE TABLE IF NOT EXISTS public.student_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 100000),
  payment_method VARCHAR(50) DEFAULT 'card' CHECK (payment_method IN ('card', 'bank_transfer')),
  card_number VARCHAR(50) NOT NULL,
  card_holder_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'processing', 'paid', 'rejected')),
  admin_notes TEXT,
  processed_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 10. Student Rewards Log (Har bir savol uchun mukofot logi)
CREATE TABLE IF NOT EXISTS public.student_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.legal_questions(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES public.legal_answers(id) ON DELETE CASCADE UNIQUE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  ai_score INT,
  citizen_rating INT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Telegram-like Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  advocate_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultation_appointments(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  citizen_unread_count INT DEFAULT 0,
  advocate_unread_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_citizen_advocate_conversation UNIQUE (citizen_id, advocate_id)
);

-- 12. Private Messages kengaytirish
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'message_type') THEN
    ALTER TABLE public.private_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio'));
  END IF;
END $$;

-- 13. Platform Sozlamalari (Monetizatsiya va mukofotlar)
CREATE TABLE IF NOT EXISTS public.platform_monetization_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
  free_questions_per_month INT DEFAULT 2,
  price_single_question DECIMAL(12, 2) DEFAULT 9900,
  price_5_questions_pack DECIMAL(12, 2) DEFAULT 39900,
  price_monthly_subscription DECIMAL(12, 2) DEFAULT 49900,
  monthly_sub_question_limit INT DEFAULT 15,
  min_payout_amount DECIMAL(12, 2) DEFAULT 100000,
  student_reward_share_percent DECIMAL(5, 2) DEFAULT 40.0,
  student_min_reward DECIMAL(12, 2) DEFAULT 5000,
  student_max_reward DECIMAL(12, 2) DEFAULT 15000,
  reward_free_questions BOOLEAN DEFAULT true,
  advocate_platform_commission_percent DECIMAL(5, 2) DEFAULT 15.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.registered_users(id) ON DELETE SET NULL
);

-- Boshlang'ich default sozlamalarni kiritish
INSERT INTO public.platform_monetization_settings (id)
VALUES ('current')
ON CONFLICT (id) DO NOTHING;

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_user ON public.advocate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_status ON public.advocate_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_law_student_invitations_login ON public.law_student_invitations(login_identifier);
CREATE INDEX IF NOT EXISTS idx_questions_lock ON public.legal_questions(locked_by_student_id, lock_expires_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(citizen_id, advocate_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON public.private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_student_rewards_student ON public.student_rewards(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payouts_student ON public.student_payout_requests(student_id);
