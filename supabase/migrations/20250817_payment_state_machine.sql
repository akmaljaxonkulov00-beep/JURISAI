-- ═══════════════════════════════════════════════════════════════════════════
-- TO'LOV STATE MACHINE — 2025-08-17
--
-- payment_requests jadvalini kuchaytirish:
--   1) status faqat: pending | approved | rejected | cancelled | expired
--   2) qayta ishlash metama'lumotlari: processed_at / processed_by / reject_reason
--   3) tarif va to'lov provider ma'lumotlari: plan_id / billing_cycle / currency / provider
--   4) indekslar: user_id+status, status+created_at, provider_transaction_id
-- ═══════════════════════════════════════════════════════════════════════════

-- Yangi ustunlar (mavjud bo'lmasa qo'shiladi)
ALTER TABLE public.payment_requests
  ADD COLUMN IF NOT EXISTS processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS processed_by uuid,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'UZS',
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_transaction_id text;

-- Status check constraint — state machine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_requests_status_check'
  ) THEN
    ALTER TABLE public.payment_requests
      ADD CONSTRAINT payment_requests_status_check
      CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired'));
  END IF;
END $$;

-- provider_transaction_id unikal bo'lsin (Payme takroriy tranzaksiyalarni bloklaydi)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_requests_provider_txn_key'
  ) THEN
    ALTER TABLE public.payment_requests
      ADD CONSTRAINT payment_requests_provider_txn_key UNIQUE (provider_transaction_id);
  END IF;
END $$;

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_status
  ON public.payment_requests (user_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_requests_status_created
  ON public.payment_requests (status, created_at);
