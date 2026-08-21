-- notification_read_status: sintez qilingan bildirishnomalar uchun o'qilgan holati
-- user_notifications jadvalida mavjud bo'lmagan bildirishnomalar (masalan, to'lov holati)
-- shu jadval orqali "o'qilgan" statusini saqlaydi.

CREATE TABLE IF NOT EXISTS public.notification_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.notification_read_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_read_status_own ON public.notification_read_status;
CREATE POLICY notification_read_status_own ON public.notification_read_status
  FOR ALL USING (user_id::text = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_notif_read_status_user
  ON public.notification_read_status(user_id, notification_id);
