-- MIGRATION: site_settings — Admin panel orqali sayt sozlamalarini saqlash (logo, nom va boshqalar)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Logo URL uchun default qator
INSERT INTO public.site_settings (key, value) VALUES ('logo_url', '')
ON CONFLICT (key) DO NOTHING;

-- RLS — faqat adminlar o'zgartira oladi
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_all" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "site_settings_insert_admin" ON public.site_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "site_settings_update_admin" ON public.site_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.registered_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "site_settings_delete_admin" ON public.site_settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.registered_users WHERE id = auth.uid() AND role = 'admin')
  );
