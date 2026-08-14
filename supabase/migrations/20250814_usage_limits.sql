-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: AI foydalanish limitlari
-- 1) pricing_plans jadvaliga `limits` JSONB ustuni — har bir tarifning
--    har bir funksiya bo'yicha oylik limiti (admin o'zgartira oladi)
-- 2) user_usage_limits jadvali — ayrim foydalanuvchilar uchun shaxsiy limit
--    (admin har bir foydalanuvchiga alohida limit bera oladi)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. pricing_plans.limits JSONB ustuni ─────────────────────────────────
-- Format: { "ai_chat": 10, "irac": 3, "document_generate": 3, ... }
-- -1 = cheksiz
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}'::jsonb;

-- ── 2. Default limitlar (mavjud tariflar uchun) ──────────────────────────
-- Bepul / Standart / Pro
UPDATE public.pricing_plans SET limits = '{
  "ai_chat": 10,
  "irac": 3,
  "document_generate": 3,
  "document_analysis": 2,
  "virtual_court": 2,
  "decision_tree": 2,
  "speech_stt": 5,
  "scenario": 3
}'::jsonb WHERE id = 'free' AND (limits = '{}'::jsonb OR limits IS NULL);

UPDATE public.pricing_plans SET limits = '{
  "ai_chat": 200,
  "irac": -1,
  "document_generate": 50,
  "document_analysis": 20,
  "virtual_court": 5,
  "decision_tree": 20,
  "speech_stt": 100,
  "scenario": 20
}'::jsonb WHERE id = 'standart' AND (limits = '{}'::jsonb OR limits IS NULL);

UPDATE public.pricing_plans SET limits = '{
  "ai_chat": -1,
  "irac": -1,
  "document_generate": -1,
  "document_analysis": -1,
  "virtual_court": -1,
  "decision_tree": -1,
  "speech_stt": -1,
  "scenario": -1
}'::jsonb WHERE id = 'pro' AND (limits = '{}'::jsonb OR limits IS NULL);

-- ── 3. user_usage_limits — per-user override ─────────────────────────────
-- Admin ayrim foydalanuvchiga planidan farqli limit berishi mumkin.
-- feature: ai_chat | irac | document_generate | document_analysis | ...
-- monthly_limit: -1 = cheksiz
CREATE TABLE IF NOT EXISTS public.user_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  email TEXT DEFAULT '',
  feature TEXT NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT -1,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_limits_user
  ON public.user_usage_limits(user_id);

-- RLS: faqat admin/service_role boshqaradi
ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_usage_limits_admin ON public.user_usage_limits;
CREATE POLICY user_usage_limits_admin ON public.user_usage_limits
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS user_usage_limits_select ON public.user_usage_limits;
CREATE POLICY user_usage_limits_select ON public.user_usage_limits
  FOR SELECT USING (true);
