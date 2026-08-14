-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Tariflar realtime — admin narx/limit o'zgartirganda barcha
-- foydalanuvchilarda (landing, premium, to'lov sahifalari) darhol yangilanadi.
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_plans;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
