-- MIGRATION: Contact section + Social links settings
-- site_settings jadvaliga kontakt bo'limi va ijtimoiy tarmoqlar qo'shish

-- Contact section settings
INSERT INTO public.site_settings (key, value) VALUES
  ('contact_section_enabled', 'true'),
  ('contact_label', 'Biz bilan bog''lanish'),
  ('contact_heading', 'JURISTIV hamjamiyatiga qo''shiling'),
  ('contact_description', 'Eng so''nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e''lonlardan xabardor bo''lib boring.'),
  ('social_telegram', ''),
  ('social_telegram_enabled', 'false'),
  ('social_instagram', ''),
  ('social_instagram_enabled', 'false'),
  ('social_youtube', ''),
  ('social_youtube_enabled', 'false'),
  ('social_linkedin', ''),
  ('social_linkedin_enabled', 'false'),
  ('social_website', ''),
  ('social_website_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
