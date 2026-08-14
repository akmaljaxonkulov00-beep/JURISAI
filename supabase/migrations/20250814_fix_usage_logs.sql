-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: usage_logs tuzatish — limit tizimi ishlamayotgan edi
--
-- MUAMMO: bazadagi usage_logs jadvali `metadata` ustunisiz yaratilgan
-- (20250727_create_admin_tables.sql). Shu sabab checkAndIncrement() dagi
-- har bir yozuv ("metadata" ustuni) xato berib yiqilar, iste'mol sanog'i
-- 0 bo'lib qolar, limitlar hech qachon bloklamas edi.
--
-- YECHIM: metadata ustunini qo'shish + hisoblashni tezlashtiruvchi indeks.
-- Idempotent — qayta RUN xavfsiz.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Yetishmayotgan metadata ustuni (limit tizimi shunga tayanadi)
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2) Iste'mol sanog'ini tezlashtirish: (user, action, oy)
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_action_time
  ON public.usage_logs(user_id, action, created_at);
