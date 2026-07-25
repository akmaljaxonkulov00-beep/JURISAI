-- JURISAI: TO'LIQ QONUNLAR BAZASI (SEED DATA)
-- O'zbekiston Respublikasi qonun kodekslari va moddalari

-- Create codes table
CREATE TABLE IF NOT EXISTS codes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  total_articles INTEGER DEFAULT 0,
  effective_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table with unique constraint for conflict handling
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id TEXT REFERENCES codes(id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  penalties TEXT,
  refs TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code_id, article_number)
);

-- Insert codes (8 codes total)
INSERT INTO codes (id, title, short_name, description, category, total_articles, effective_date) VALUES
  ('constitution', 'Ozbekiston Respublikasi Konstitutsiyasi', 'Konstitutsiya', 'Ozbekiston Respublikasining Asosiy Qonuni', 'Konstitutsiya', 155, '08.12.1992'),
  ('criminal_code', 'Ozbekiston Respublikasi Jinoyat kodeksi', 'JK', 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Jinoyat huquqi', 322, '01.04.1995'),
  ('criminal_procedure_code', 'Ozbekiston Respublikasi Jinoyat-protsessual kodeksi', 'JPK', 'Jinoyat protsessual munosabatlarini tartibga soluvchi qonun', 'Jinoyat huquqi', 389, '01.04.1995'),
  ('civil_code', 'Ozbekiston Respublikasi Fuqarolik kodeksi', 'FK', 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Fuqarolik huquqi', 1182, '01.03.1997'),
  ('civil_procedure_code', 'Ozbekiston Respublikasi Fuqarolik-protsessual kodeksi', 'FPK', 'Fuqarolik protsessual munosabatlarini tartibga soluvchi qonun', 'Fuqarolik huquqi', 246, '01.01.1997'),
  ('economic_procedure_code', 'Ozbekiston Respublikasi Iqtisodiy-protsessual kodeksi', 'IPK', 'Iqtisodiy protsessual munosabatlarini tartibga soluvchi qonun', 'Fuqarolik huquqi', 211, '01.01.2004'),
  ('labor_code', 'Ozbekiston Respublikasi Mehnat kodeksi', 'MK', 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Mehnat huquqi', 581, '01.04.1996'),
  ('family_code', 'Ozbekiston Respublikasi Oila kodeksi', 'OK', 'Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Oila huquqi', 246, '01.09.1998'),
  ('tax_code', 'Ozbekiston Respublikasi Soliq kodeksi', 'SK', 'Soliq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Soliq huquqi', 516, '01.01.2020'),
  ('land_code', 'Ozbekiston Respublikasi Yer kodeksi', 'ZK', 'Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'Yer huquqi', 168, '01.04.1998'),
  ('admin_code', 'Ozbekiston Respublikasi Ma''muriy javobgarlik to''g''risidagi kodeksi', 'MJtK', 'Ma''muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun', 'Ma''muriy huquq', 526, '01.04.1995'),
  ('admin_procedure_code', 'Ozbekiston Respublikasi Ma''muriy protsessual kodeksi', 'BSK', 'Ma''muriy protsessual munosabatlarini tartibga soluvchi qonun', 'Ma''muriy huquq', 312, '01.01.2018')
ON CONFLICT (id) DO NOTHING;

-- Insert Constitution articles (oybek tilida)
INSERT INTO articles (code_id, article_number, title, content, category) VALUES
  ('constitution', '1', 'Ozbekiston suveren respublika', 'Ozbekiston suveren demokratik respublika. Ozbekiston va Ozbekiston Respublikasi nomlari bir manoni anglatadi.', 'Davlat tuzumi'),
  ('constitution', '2', 'Davlat ramzlari', 'Ozbekiston Respublikasining davlat ramzlari Bayrog''i, Gerbi va Madhiyasidir.', 'Davlat tuzumi'),
  ('constitution', '13', 'Inson huquqlari kafolatlari', 'Ozbekiston Respublikasida inson huquqlari va erkinliklari Konstitutsiya va qonunlarga muvofiq kafolatlanadi.', 'Inson huquqlari'),
  ('constitution', '15', 'Konstitutsiya ustunligi', 'Ozbekiston Respublikasida Konstitutsiya va qonunlarning ustunligi tan olinadi.', 'Asosiy qoidalar')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- Insert Criminal Code articles (JK)
INSERT INTO articles (code_id, article_number, title, content, category, penalties) VALUES
  ('criminal_code', '1', 'Jinoyat qonunchiligining vazifalari', 'Ozbekiston Respublikasi jinoyat qonunchiligi shaxsning huquq va erkinliklarini, mulkni, jamiyat va davlat xavfsizligini jinoyatlardan himoya qiladi.', 'Umumiy qismlar', NULL),
  ('criminal_code', '97', 'Qasddan odam oldirish', 'Qasddan odam oldirish on yildan on besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.', 'Shaxsga qarshi jinoyatlar', 'Ozodlikdan mahrum qilish 10-15 yil'),
  ('criminal_code', '169', 'O''g''irlik', 'O''g''irlik boshqa mulkni yashirin ravishda o''g''irlashdir. Jarima yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.', 'Mulkka qarshi jinoyatlar', 'Jarima yoki 2 yil ozodlik')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- Insert Civil Code articles (FK)
INSERT INTO articles (code_id, article_number, title, content, category) VALUES
  ('civil_code', '1', 'Fuqarolik qonunchiligining vazifalari', 'Fuqarolik qonunchiligi mulkiy va mulkiy bolmagan shaxsiy munosabatlarni tartibga soladi.', 'Umumiy qismlar'),
  ('civil_code', '342', 'Shartnoma tushunchasi', 'Shartnoma ikki yoki undan ortiq shaxslarning huquq va majburiyatlarini belgilash to''g''risidagi kelishuvidir.', 'Majburiyatlar huquqi'),
  ('civil_code', '367', 'Shartnoma shakliy talablari', 'Shartnoma og''zaki yoki yozma shaklda tuzilishi mumkin. Yuridik shaxslar orasida yozma shakl majburiy.', 'Majburiyatlar huquqi')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- Insert Labor Code articles (MK)
INSERT INTO articles (code_id, article_number, title, content, category) VALUES
  ('labor_code', '1', 'Mehnat qonunchiligining asosiy vazifalari', 'Mehnat qonunchiligi ish beruvchi va ishchilar o''rtasidagi mehnat munosabatlarini tartibga soladi.', 'Umumiy qismlar'),
  ('labor_code', '77', 'Mehnat shartnomasining tuzilishi', 'Mehnat shartnomasi ishchi va ish beruvchi o''rtasida yozma shaklda tuziladi.', 'Mehnat shartnomasi'),
  ('labor_code', '161', 'Ishdan bo''shatish asoslari', 'Mehnat shartnomasi tomonlar kelishuvi bilan, ishchining xohishi bilan yoki ish beruvchi tashabbusi bilan bekor qilinishi mumkin.', 'Mehnat shartnomasi'),
  ('labor_code', '242', 'Ish haqi to''lash tartibi', 'Ish haqi oyiga ikki marta to''lanadi.', 'Ish haqi')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- Insert Family Code articles (OK)
INSERT INTO articles (code_id, article_number, title, content, category) VALUES
  ('family_code', '1', 'Oila qonunchiligi vazifalari', 'Oila qonunchiligi oilani mustahkamlash va oilaviy munosabatlarni tenglik asosida qurishga qaratilgan.', 'Umumiy qoidalar'),
  ('family_code', '15', 'Nikoh yoshi', 'Nikoh tuzish yoshi on sakkiz yosh etib belgilanadi.', 'Nikoh'),
  ('family_code', '22', 'Nikohni bekor qilish', 'Nikoh er-xotinning roziligi bilan yoki sud tartibida bekor qilinadi.', 'Nikoh')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_code_id ON articles(code_id);
CREATE INDEX IF NOT EXISTS idx_articles_number ON articles(article_number);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Create view for easy access
CREATE OR REPLACE VIEW code_article_counts AS
  SELECT c.id, c.short_name, c.title, c.total_articles, COUNT(a.id) AS seeded_articles
  FROM codes c
  LEFT JOIN articles a ON a.code_id = c.id
  GROUP BY c.id, c.short_name, c.title, c.total_articles;
