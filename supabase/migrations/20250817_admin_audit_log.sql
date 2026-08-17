-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN AUDIT LOG — 2025-08-17
--
-- Admin tomonidan bajarilgan sezgir amallar kundaligi:
--   rol o'zgartirish, foydalanuvchi o'chirish, parol tiklash,
--   to'lov tasdiqlash/rad etish, narx/sozlamalar/limitlarni o'zgartirish.
--
-- Parol, token yoki boshqa maxfiy ma'lumotlar SAQLANMAYDI.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_email text,
  details jsonb DEFAULT '{}'::jsonb,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indekslar — admin panelda tezkor qidiruv
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_id_idx
  ON public.admin_audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_action_idx
  ON public.admin_audit_logs (action);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx
  ON public.admin_audit_logs (created_at DESC);

-- RLS: jadval faqat service-role orqali o'qiladi/yoziladi.
-- Oddiy foydalanuvchi (anon/authenticated) hech qachon kira olmaydi.
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_logs' AND policyname = 'admin_audit_logs_deny_all'
  ) THEN
    CREATE POLICY admin_audit_logs_deny_all
      ON public.admin_audit_logs FOR ALL
      USING (false) WITH CHECK (false);
  END IF;
END $$;
