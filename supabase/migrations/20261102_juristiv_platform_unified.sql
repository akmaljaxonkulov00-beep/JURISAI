-- ═══════════════════════════════════════════════════════════════════════════
-- JURISTIV — UNIFIED PLATFORM MIGRATION (2026-11-02)
-- Citizen, Law Student, Advocate, Existing Student, Admin
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Advocate Profiles
CREATE TABLE IF NOT EXISTS public.advocate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  specialties JSONB DEFAULT '[]'::jsonb,
  experience_years INT DEFAULT 1,
  license_number VARCHAR(100) UNIQUE,
  bar_association VARCHAR(255),
  license_documents JSONB DEFAULT '[]'::jsonb,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  verification_rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  languages JSONB DEFAULT '["uz"]'::jsonb,
  consultation_formats JSONB DEFAULT '["online"]'::jsonb,
  location_city VARCHAR(100) DEFAULT 'Toshkent',
  hourly_rate DECIMAL(12, 2) DEFAULT 150000,
  services JSONB DEFAULT '[]'::jsonb,
  availability JSONB DEFAULT '{}'::jsonb,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Law Student Profiles
CREATE TABLE IF NOT EXISTS public.law_student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  university VARCHAR(255) NOT NULL,
  faculty VARCHAR(255),
  study_year INT DEFAULT 1,
  specialization VARCHAR(255),
  student_id_number VARCHAR(100),
  student_id_documents JSONB DEFAULT '[]'::jsonb,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')),
  verification_rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  answers_count INT DEFAULT 0,
  approved_answers_count INT DEFAULT 0,
  reputation_score INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Citizen Legal Questions
CREATE TABLE IF NOT EXISTS public.legal_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  citizen_name VARCHAR(255),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  ai_category_confidence DECIMAL(4, 2),
  urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'escalated')),
  attachments JSONB DEFAULT '[]'::jsonb,
  escalated_to_advocate_id UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  citizen_consent_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Legal Answers (Student & Advocate answers)
CREATE TABLE IF NOT EXISTS public.legal_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.legal_questions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  author_name VARCHAR(255),
  author_role VARCHAR(50) NOT NULL CHECK (author_role IN ('law_student', 'advocate', 'ai')),
  content TEXT NOT NULL,
  legal_basis TEXT,
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'awaiting_review', 'under_review', 'revision_requested', 'approved', 'rejected')),
  is_advocate_verified BOOLEAN DEFAULT false,
  reviewed_by_advocate_id UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  reviewed_by_advocate_name VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  review_feedback TEXT,
  revision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Consultations and Appointments
CREATE TABLE IF NOT EXISTS public.consultation_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  citizen_name VARCHAR(255),
  citizen_phone VARCHAR(50),
  advocate_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  advocate_name VARCHAR(255),
  service_title VARCHAR(255) NOT NULL,
  format VARCHAR(20) DEFAULT 'online' CHECK (format IN ('online', 'offline')),
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'rejected')),
  notes TEXT,
  cancellation_reason TEXT,
  amount DECIMAL(12, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method VARCHAR(50) DEFAULT 'click',
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_advocate_appointment_slot UNIQUE (advocate_id, appointment_date, appointment_time)
);

-- 6. Private Messages
CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  advocate_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('citizen', 'advocate')),
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Advocate Cases (Case management with private notes)
CREATE TABLE IF NOT EXISTS public.advocate_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.registered_users(id) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_email VARCHAR(255),
  case_title VARCHAR(255) NOT NULL,
  case_category VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'pending_court', 'won', 'settled', 'closed')),
  deadline DATE,
  documents JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  private_notes TEXT, -- Maxfiy advokat yozuvlari
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Advocate Reviews
CREATE TABLE IF NOT EXISTS public.advocate_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advocate_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  citizen_name VARCHAR(255) NOT NULL,
  consultation_id UUID REFERENCES public.consultation_appointments(id) ON DELETE CASCADE UNIQUE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  advocate_reply TEXT,
  advocate_reply_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Financial Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.registered_users(id) ON DELETE CASCADE,
  user_name VARCHAR(255),
  consultation_id UUID REFERENCES public.consultation_appointments(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'UZS',
  type VARCHAR(50) NOT NULL CHECK (type IN ('consultation_payment', 'advocate_payout', 'platform_commission', 'refund')),
  provider VARCHAR(50) DEFAULT 'click' CHECK (provider IN ('click', 'payme', 'manual')),
  provider_transaction_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  advocate_share DECIMAL(12, 2) DEFAULT 0,
  platform_share DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_citizen ON public.legal_questions(citizen_id);
CREATE INDEX IF NOT EXISTS idx_questions_visibility ON public.legal_questions(visibility);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.legal_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_author ON public.legal_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_appointments_citizen ON public.consultation_appointments(citizen_id);
CREATE INDEX IF NOT EXISTS idx_appointments_advocate ON public.consultation_appointments(advocate_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.private_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON public.private_messages(citizen_id, advocate_id);
