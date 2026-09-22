-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: User Preferences, Notification Preferences & Extended Profile
-- Date: 2026-09-22
-- Purpose: Complete user settings persistence, theme/i18n preferences, and RLS
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Extend registered_users table with additional profile fields
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255) DEFAULT '';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL;
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) DEFAULT '';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS university VARCHAR(255) DEFAULT '';
ALTER TABLE public.registered_users ADD COLUMN IF NOT EXISTS course_level VARCHAR(50) DEFAULT '';

-- 2. Create user_preferences table (theme, language, timezone)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language VARCHAR(10) DEFAULT 'uz' CHECK (language IN ('uz', 'en', 'ru')),
  timezone VARCHAR(100) DEFAULT 'Asia/Tashkent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- 3. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_system BOOLEAN NOT NULL DEFAULT true,
  email_course BOOLEAN NOT NULL DEFAULT true,
  email_materials BOOLEAN NOT NULL DEFAULT true,
  email_payments BOOLEAN NOT NULL DEFAULT true,
  email_security BOOLEAN NOT NULL DEFAULT true,
  inapp_ai_results BOOLEAN NOT NULL DEFAULT true,
  inapp_case_results BOOLEAN NOT NULL DEFAULT true,
  inapp_virtual_court BOOLEAN NOT NULL DEFAULT true,
  inapp_system BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_preferences_user_id_unique UNIQUE (user_id)
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for user_preferences
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. RLS Policies for notification_preferences
DROP POLICY IF EXISTS "Users can read own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can read own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
