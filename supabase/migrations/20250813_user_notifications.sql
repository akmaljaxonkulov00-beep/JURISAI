-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: user_notifications — Foydalanuvchi bildirishnomalari
-- ═══════════════════════════════════════════════════════════════════════════
-- Admin to'lovni tasdiqlaganda/rad etganda foydalanuvchiga bildirishnoma
-- yuboriladi (to'lov holati haqida). Keyinchalik boshqa tizim xabarlari
-- ham shu jadval orqali ishlashi mumkin.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  type TEXT DEFAULT 'info', -- info | success | warning | error
  category TEXT DEFAULT 'system', -- system | payment | legal | profile | ai
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '',
  action_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON public.user_notifications(user_id, created_at DESC);

-- Realtime: bildirishnomalar va to'lov holati real vaqtda yangilanadi
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

-- RLS: foydalanuvchi faqat o'z bildirishnomalarini ko'radi
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notifications_select ON public.user_notifications;
CREATE POLICY user_notifications_select ON public.user_notifications
  FOR SELECT USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS user_notifications_insert ON public.user_notifications;
CREATE POLICY user_notifications_insert ON public.user_notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS user_notifications_update ON public.user_notifications;
CREATE POLICY user_notifications_update ON public.user_notifications
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS user_notifications_delete ON public.user_notifications;
CREATE POLICY user_notifications_delete ON public.user_notifications
  FOR DELETE USING (user_id = auth.uid()::TEXT);
