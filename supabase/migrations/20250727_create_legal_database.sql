-- ============================================================================
-- JURISAI: YURIDIK MA'LUMOTLAR BAZASI (QONUN KODEKSLARI)
-- Supabase Migration: 20250727
-- 
-- Tables:
--   categories  - legal code categories (JK, FK, MK, OK, etc.)
--   articles    - individual articles within each code
-- ============================================================================

-- ── 1. Enable UUID extension ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. CATEGORIES TABLE ────────────────────────────────────────────────────
-- Each row represents a legal code (Jinoyat Kodeksi, Fuqarolik Kodeksi, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT UNIQUE NOT NULL,          -- e.g. 'criminal_code', 'civil_code'
  name TEXT NOT NULL,                     -- Full Uzbek name
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'book-open',
  color TEXT DEFAULT 'from-blue-500 to-blue-600',
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. ARTICLES TABLE ──────────────────────────────────────────────────────
-- Each row is a single article (modda) belonging to a category
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id TEXT NOT NULL REFERENCES categories(code_id) ON DELETE CASCADE,
  article_number TEXT NOT NULL,           -- e.g. '1', '97', '242'
  title TEXT DEFAULT '',                  -- Article title
  content TEXT DEFAULT '',                -- Full article text
  chapter TEXT DEFAULT 'Umumiy qoidalar',
  section TEXT DEFAULT '',
  penalties TEXT DEFAULT '',             -- Jazo (for criminal/administrative codes)
  references TEXT[] DEFAULT '{}',        -- Cross-references to other articles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, article_number)
);

-- ── 4. FULL-TEXT SEARCH INDEX ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_content_search 
  ON articles USING GIN(to_tsvector('simple', content));

CREATE INDEX IF NOT EXISTS idx_articles_number_search 
  ON articles(article_number);

CREATE INDEX IF NOT EXISTS idx_articles_code_id 
  ON articles(code_id);

-- ── 5. ROW LEVEL SECURITY ──────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories and articles
CREATE POLICY "Public can read categories" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "Public can read articles" 
  ON articles FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert categories" 
  ON categories FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can update categories" 
  ON categories FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can delete categories" 
  ON categories FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can insert articles" 
  ON articles FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can update articles" 
  ON articles FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

CREATE POLICY "Admins can delete articles" 
  ON articles FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.email() = 'akmaljaxonkulov00@gmail.com'
  );

-- ── 6. SEED DATA: Categories ───────────────────────────────────────────────
INSERT INTO categories (code_id, name, description, icon, color, article_count) VALUES
  ('criminal_code',           'Oʻzbekiston Respublikasi Jinoyat kodeksi',             'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'gavel', 'from-red-500 to-orange-500', 302),
  ('civil_code',              'Oʻzbekiston Respublikasi Fuqarolik kodeksi',            'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'scale', 'from-blue-500 to-blue-600', 1031),
  ('labor_code',              'Oʻzbekiston Respublikasi Mehnat kodeksi',               'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'users', 'from-green-500 to-emerald-600', 359),
  ('family_code',             'Oʻzbekiston Respublikasi Oila kodeksi',                 'Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'users', 'from-pink-500 to-rose-600', 246),
  ('tax_code',                'Oʻzbekiston Respublikasi Soliq kodeksi',                'Soliq munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'dollar-sign', 'from-purple-500 to-violet-600', 516),
  ('land_code',               'Oʻzbekiston Respublikasi Yer kodeksi',                  'Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati', 'tree-pine', 'from-amber-500 to-yellow-600', 168),
  ('admin_code',              'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi', 'Maʼmuriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun', 'shield', 'from-slate-500 to-gray-600', 526),
  ('constitution',            'Oʻzbekiston Respublikasi Konstitutsiyasi',              "O'zbekiston Respublikasining Asosiy Qonuni", 'landmark', 'from-blue-600 to-indigo-700', 155),
  ('civil_procedure_code',    'Oʻzbekiston Respublikasi Fuqarolik protsessual kodeksi', 'Fuqarolik ishlarini sudda koʻrish tartibini belgilovchi asosiy qonun hujjati', 'file-text', 'from-cyan-500 to-sky-600', 476),
  ('criminal_procedure_code', 'Oʻzbekiston Respublikasi Jinoyat-protsessual kodeksi',  'Jinoyat ishlarini tergov qilish va sudda koʻrish tartibini belgilovchi qonun', 'file-text', 'from-rose-500 to-red-600', 598),
  ('economic_procedure_code', 'Oʻzbekiston Respublikasi Iqtisodiy protsessual kodeksi', 'Iqtisodiy nizolarni sudda koʻrish tartibini belgilovchi asosiy qonun hujjati', 'dollar-sign', 'from-teal-500 to-emerald-600', 324)
ON CONFLICT (code_id) DO NOTHING;

-- ── 7. SEED DATA: Articles (Yer kodeksi - extracted from user's Yer.txt) ───
-- Yer kodeksi: 1-107-modda (bob 1-21)

INSERT INTO articles (code_id, article_number, title, content, chapter, section) VALUES
('land_code', '1',  'Yer toʻgʻrisidagi qonunchilikning asosiy vazifalari', 
 'Yer umummilliy boylikdir, Oʻzbekiston Respublikasi xalqi hayoti, faoliyati va farovonligining asosi sifatida undan oqilona foydalanish zarur va u davlat tomonidan muhofaza qilinadi.\n\nYer toʻgʻrisidagi qonunchilikning asosiy vazifalari hozirgi va kelajak avlodlarning manfaatlarini koʻzlab yerdan ilmiy asoslangan tarzda, oqilona foydalanish va uni muhofaza qilishni, tuproq unumdorligini tiklash va oshirishni, tabiiy muhitni asrash va yaxshilashni, xoʻjalik yuritishning barcha shakllarini teng huquqlilik asosida rivojlantirish uchun sharoit yaratishni, yuridik va jismoniy shaxslarning yer uchastkalariga boʻlgan huquqlarini himoya qilishni taʼminlash maqsadida yer munosabatlarini tartibga solishdan, shuningdek bu sohada qonuniylikni mustahkamlashdan shu jumladan korrupsiyaga oid huquqbuzarliklarning oldini olishdan iborat.',
 '1-BOB. UMUMIY QOIDALAR', '1-modda'),

('land_code', '2',  'Yer toʻgʻrisidagi qonunchilikning asosiy prinsiplari',
 'Yer toʻgʻrisidagi qonunchilik quyidagi asosiy prinsiplarga asoslanadi:\n\n• eng muhim tabiiy resurs, fuqarolar hayotiy faoliyatining asosi tariqasida yer fondini asrash, tuproq sifatini yaxshilash hamda uning unumdorligini oshirish;\n• yerlardan oqilona, samarali va belgilangan maqsadda foydalanishni taʼminlash;\n• qishloq xoʻjaligi uchun moʻljallangan yerlarning, eng avvalo sugʻoriladigan yerlarning alohida muhofaza etilishini taʼminlash;\n• yerga va butun atrof tabiiy muhitga zarar yetkazilishining oldini olish;\n• yerga egalik qilish va undan foydalanish shakllarining xilma-xilligi;\n• yerdan foydalanganlik uchun haq toʻlash;\n• yerlarning holati haqidagi axborotning toʻliq boʻlishi.',
 '1-BOB. UMUMIY QOIDALAR', '2-modda'),

('land_code', '3',  'Yer toʻgʻrisidagi qonunchilik hujjatlari',
 'Yer toʻgʻrisidagi qonunchilik ushbu Kodeksdan va yer munosabatlarini tartibga soluvchi boshqa qonunchilik hujjatlaridan iborat.\n\nQoraqalpogʻiston Respublikasida yer munosabatlari Qoraqalpogʻiston Respublikasining qonunchiligi bilan ham tartibga solinadi.\n\nAgar Oʻzbekiston Respublikasining xalqaro shartnomasida Oʻzbekiston Respublikasining yer toʻgʻrisidagi qonunchiligidagidan boshqacha qoidalar belgilangan boʻlsa, xalqaro shartnoma qoidalari qoʻllaniladi.',
 '1-BOB. UMUMIY QOIDALAR', '3-modda'),

('land_code', '4',  'Oʻzbekiston Respublikasi Vazirlar Mahkamasining yer munosabatlarini tartibga solish sohasidagi vakolatlari',
 'Yer munosabatlarini tartibga solish sohasida quyidagilar Oʻzbekiston Respublikasi Vazirlar Mahkamasining vakolatlariga kiradi:\n\n• yerlardan oqilona foydalanish hamda ularni muhofaza qilish sohasidagi yagona davlat siyosatini amalga oshirish;\n• yer munosabatlarini tartibga solish toʻgʻrisida normativ hujjatlar qabul qilish;\n• tuproq unumdorligini oshirish, yerlardan oqilona foydalanish va ularni muhofaza qilish yuzasidan davlat dasturlarini tasdiqlash;\n• davlat mulkidagi yerlarni tasarruf etish;\n• yerlardan oqilona foydalanish va ularni muhofaza qilish ustidan davlat nazoratini tashkil etish.',
 '1-BOB. UMUMIY QOIDALAR', '4-modda'),

('land_code', '5',  'Viloyatlar, Toshkent shahar davlat hokimiyati organlarining yer munosabatlarini tartibga solish sohasidagi vakolatlari',
 'Yer munosabatlarini tartibga solish sohasida quyidagilar viloyatlar, Toshkent shahar davlat hokimiyati organlarining vakolatlariga kiradi:\n\n• tuproq unumdorligini oshirish, yerlardan oqilona foydalanish hamda ularni muhofaza qilish boʻyicha hududiy dasturlarni ishlab chiqish va amalga oshirish;\n• yer resurslaridan belgilangan maqsadda, oqilona va samarali foydalanish, yerlarni muhofaza qilish ustidan davlat nazoratini amalga oshirish;\n• yer tuzishni, yerlarning monitoringini va davlat yer kadastri yuritilishini tashkil etish;\n• yer uchastkalarini jamoat ehtiyojlari uchun doimiy foydalanishga ajratish.',
 '1-BOB. UMUMIY QOIDALAR', '5-modda'),

('land_code', '6',  'Tumanlar davlat hokimiyati organlarining yer munosabatlarini tartibga solish sohasidagi vakolatlari',
 'Yer munosabatlarini tartibga solish sohasida quyidagilar tumanlar davlat hokimiyati organlarining vakolatlariga kiradi:\n\n• tuproq unumdorligini oshirish, yerlardan oqilona va samarali foydalanish va ularni muhofaza qilish tadbirlarini ishlab chiqish hamda amalga oshirish;\n• yerlardan oqilona foydalanish va ularni muhofaza qilish ustidan davlat nazoratini amalga oshirish;\n• yer tuzishni, yerlarning monitoringini va davlat yer kadastri yuritilishini tashkil etish.',
 '1-BOB. UMUMIY QOIDALAR', '6-modda'),

('land_code', '7',  'Shaharlar davlat hokimiyati organlarining yer munosabatlarini tartibga solish sohasidagi vakolatlari',
 'Yer munosabatlarini tartibga solish sohasida quyidagilar shaharlar davlat hokimiyati organlarining vakolatlariga kiradi:\n\n• yerlardan oqilona va samarali foydalanish va ularni muhofaza qilish tadbirlarini ishlab chiqish hamda amalga oshirish;\n• yerlardan oqilona foydalanish va ularni muhofaza qilish ustidan davlat nazoratini amalga oshirish;\n• yer tuzishni, yerlarning monitoringini va davlat yer kadastri yuritilishini tashkil etish;\n• yer uchastkalariga boʻlgan huquqlarning davlat roʻyxatiga olinishini tashkil etish.',
 '1-BOB. UMUMIY QOIDALAR', '7-modda'),

('land_code', '8',  'Yer fondi toifalari',
 'Oʻzbekiston Respublikasida yer fondi yerlardan foydalanishning belgilangan asosiy maqsadiga koʻra quyidagi toifalarga boʻlinadi:\n\n1) qishloq xoʻjaligiga moʻljallangan yerlar;\n2) aholi punktlarining (shaharlar, posyolkalar va qishloq aholi punktlarining) yerlari;\n3) sanoat, transport, aloqa, mudofaa va boshqa maqsadlarga moʻljallangan yerlar;\n4) tabiatni muhofaza qilish, sogʻlomlashtirish va rekreatsiya maqsadlariga moʻljallangan yerlar;\n5) tarixiy-madaniy ahamiyatga molik yerlar;\n6) oʻrmon fondi yerlari;\n7) suv fondi yerlari;\n8) zaxira yerlar.',
 '2-BOB. YER FONDI', '8-modda'),

('land_code', '9',  'Yerlarni toifalarga boʻlish va bir toifadan boshqasiga oʻtkazish',
 'Yerlar asosiy foydalanish maqsadiga qarab yer fondi toifalariga boʻlinadi.\n\nYerlardan asosiy foydalanish maqsadi yer uchastkalaridan ruxsat etilgan foydalanishning asosiy turlarini belgilash yoʻli bilan aniqlashtiriladi.\n\nYerlarni yer fondining bir toifasidan boshqasiga oʻtkazish yerlardan asosiy foydalanish maqsadi oʻzgargan taqdirda amalga oshiriladi.',
 '2-BOB. YER FONDI', '9-modda'),

('land_code', '10', 'Yer uchastkasi',
 'Yer uchastkasi — yer fondining qayd etilgan chegaraga, maydonga, joylashish manziliga, huquqiy rejimga hamda davlat yer kadastrida aks ettiriladigan boshqa xususiyatlariga ega boʻlgan qismidir.\n\nYer uchastkasi boʻlinadigan va boʻlinmaydigan boʻlishi mumkin.',
 '2-BOB. YER FONDI', '10-modda'),

('land_code', '11', 'Qishloq xoʻjaligining tabiiy moslashuvi jihatidan yerlarni rayonlashtirish',
 'Qishloq xoʻjaligining tabiiy moslashuvi jihatidan yerlarni rayonlashtirish — hududlarning tabiiy sharoitlarni va qishloq xoʻjaligi oʻsimliklari agrobiologik talablarini hisobga olgan holda boʻlinishidir.\n\nQishloq xoʻjaligiga moʻljallangan yerlardan foydalanish va ularni muhofaza qilish qishloq xoʻjaligining tabiiy moslashuvi jihatidan yerlarni rayonlashtirishga muvofiq amalga oshiriladi.',
 '3-BOB. YER TUZISH', '11-modda'),

('land_code', '12', 'Yer tuzishning vazifalari va mazmuni',
 'Yer tuzish yerlardan foydalanish va ularni muhofaza qilishni tashkil etishga, yer resurslarini hisobga olish va baholashga, qulay ekologik muhitni vujudga keltirishga va tabiiy landshaftlarni yaxshilashga qaratilgan tadbirlar tizimini o'z ichiga oladi.\n\nYer tuzish istiqbolga mo'ljallangan, loyihalash oldidan, xo'jaliklararo hamda ichki xo'jalik yer tuzish turlariga bo'linadi.',
 '3-BOB. YER TUZISH', '12-modda'),

('land_code', '13', 'Yer tuzish loyihasini koʻrib chiqish va tasdiqlash',
 'Xoʻjaliklararo va xoʻjalik ichidagi yer tuzish loyihalari qishloq xoʻjaligi hamda oʻrmon xoʻjaligi korxonalari, muassasalari va tashkilotlari mol-mulkining mulkdorlari yoki ular vakolat bergan organlar tomonidan koʻrib chiqiladi va qabul qilinadi.',
 '3-BOB. YER TUZISH', '13-modda'),

('land_code', '14', 'Yer monitoringi',
 'Yer monitoringi yer tarkibidagi oʻzgarishlarni oʻz vaqtida aniqlash, yerlarga baho berish, salbiy jarayonlarning oldini olish va oqibatlarini tugatish uchun yer fondining holatini kuzatib turish tizimidan iborat.',
 '3-BOB. YER TUZISH', '14-modda'),

('land_code', '15', 'Davlat yer kadastri',
 'Davlat yer kadastri yerlarning tabiiy, xoʻjalik va huquqiy rejimi, ularning toifalari, sifat koʻrsatkichlari va bahosi, yer uchastkalaridan ruxsat etilgan foydalanishning asosiy turlari toʻgʻrisidagi zarur, ishonchli maʼlumotlar va hujjatlar tizimidan iborat.',
 '3-BOB. YER TUZISH', '15-modda'),

('land_code', '16', 'Oʻzbekiston Respublikasida yerga boʻlgan mulkchilik',
 'Yer umummilliy boylikdir, undan oqilona foydalanilishi lozim va u davlat tomonidan muhofaza etiladi.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK', '16-modda'),

('land_code', '17', 'Yuridik va jismoniy shaxslarning yer uchastkalariga boʻlgan huquqlari',
 'Yuridik shaxslar ushbu Kodeksga va boshqa qonunchilik hujjatlariga muvofiq mulk, doimiy foydalanish va ijara huquqi asosida yer uchastkalariga ega boʻlishi mumkin.\n\nJismoniy shaxslar ushbu Kodeks va boshqa qonunchilik hujjatlariga muvofiq mulk va ijara huquqi asosida yer uchastkalariga ega boʻlishi mumkin.\n\nChet ellik fuqarolar va yuridik shaxslar, fuqaroligi boʻlmagan shaxslar, chet el investitsiyalari ishtirokidagi korxonalar yer uchastkalariga faqat ijara huquqi asosida ega boʻlishi mumkin.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK', '17-modda'),

('land_code', '18', 'Yuridik va jismoniy shaxslarning yer uchastkalariga boʻlgan mulk huquqining vujudga kelishi',
 'Yuridik va jismoniy shaxslarning yer uchastkalariga boʻlgan mulk huquqi qishloq xoʻjaligiga moʻljallanmagan yer uchastkalari xususiylashtirilganda, qonunchilikda belgilangan tartibda yuzaga keladi.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK', '18-modda'),

('land_code', '20', 'Yer uchastkalaridan doimiy foydalanish huquqi',
 'Yer uchastkalari viloyat va Toshkent shahar hokimining qaroriga asosan davlat organlariga, muassasalariga va korxonalariga, fuqarolarning oʻzini oʻzi boshqarish organlariga jamoat ehtiyojlari uchun doimiy foydalanishga beriladi.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK VA HUQUQLAR', '20-modda'),

('land_code', '21', 'Birgalikda egalik qilinadigan yoki foydalaniladigan yer uchastkalari',
 'Yer uchastkasini boʻlishning imkoniyati boʻlmasa, bunday yer bir necha yuridik va jismoniy shaxslar tomonidan birgalikda egalik qilinadigan va foydalaniladigan yer uchastkasi deb eʼtirof etiladi.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK VA HUQUQLAR', '21-modda'),

('land_code', '22', 'Yer uchastkasiga boʻlgan huquqning boshqa shaxsga oʻtishi',
 'Korxonaga, binoga, inshootga, koʻp yillik dov-daraxtlarga yoki boshqa koʻchmas mulkka boʻlgan mulk huquqi yoki operativ boshqaruv huquqi boshqa shaxsga oʻtgan taqdirda, ushbu obyektlar bilan birgalikda mazkur obyektlar band etgan hamda ulardan foydalanish uchun zarur boʻlgan yer uchastkasiga doimiy egalik qilish, meros qilib qoldiriladigan umrbod egalik qilish, undan doimiy foydalanish va ijara huquqi ham oʻtadi.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK VA HUQUQLAR', '22-modda'),

('land_code', '23', 'Yer uchastkalari berish (realizatsiya qilish)',
 'Yer uchastkalarini mulk qilib berish (realizatsiya qilish), doimiy foydalanish uchun va ijaraga berish yer ajratish tariqasida amalga oshiriladi.\n\nYer uchastkalarini berish (realizatsiya qilish) quyidagi tartibda amalga oshiriladi:\n1) mulk qilib berish (realizatsiya qilish) — qishloq xoʻjaligiga moʻljallanmagan yer uchastkalarini xususiylashtirish toʻgʻrisidagi qonunchilikka muvofiq;\n2) doimiy foydalanishga berish;\n3) ijaraga berish — elektron onlayn-auksion vositasida.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK VA HUQUQLAR', '23-modda'),

('land_code', '24', 'Yer uchastkasi ijarasi',
 'Yer uchastkasining ijarasi yer uchastkasiga ijara shartnomasi shartlarida muddatli, haq evaziga egalik qilish va foydalanishdan iboratdir.\n\nQishloq xoʻjaligiga moʻljallangan yer uchastkalari ijara huquqi asosida beriladi. Ijara muddati yuz yildan ortiq boʻlishi mumkin emas.\n\nIjaraga berilgan yer uchastkalari oldi-sotdi, hadya, ayirboshlash obyekti boʻlishi mumkin emas.',
 '4-BOB. YERGA BOʻLGAN MULKCHILIK VA HUQUQLAR', '24-modda'),

('land_code', '25', 'Yer uchastkalaridan qidiruv ishlari uchun foydalanish',
 'Geologiya-suratga olish, qidirish, geodeziya va boshqa qidiruv ishlarini amalga oshiruvchi korxonalar, muassasalar va tashkilotlar bu ishlarni barcha toifadagi yerlarda yer egalaridan, yerdan foydalanuvchilardan, ijarachilardan hamda mulkdorlardan yer uchastkalarini olib qoʻymagan holda ommaviy servitut asosida amalga oshirishi mumkin.',
 '5-BOB. YERDAN FOYDALANISH', '25-modda'),

('land_code', '26', 'Yer uchastkalaridan imorat qurish uchun foydalanish',
 'Yer uchastkalarini doimiy egalik qilishga va foydalanishga, meros qilib qoldiriladigan umrbod egalik qilishga olgan yuridik va jismoniy shaxslar qonunchilikka muvofiq yer uchastkasini saqlash vazifasiga oid majburiyatlar bajarilgan taqdirda oʻzlari olgan korxonalar, binolar, imoratlar, inshootlarni belgilangan tartibda qurish, buzish yoki rekonstruksiya qilishga haqlidir.',
 '5-BOB. YERDAN FOYDALANISH', '26-modda'),

('land_code', '27', 'Fuqarolarga yakka tartibda uy-joy qurish uchun yer uchastkalarini realizatsiya qilish',
 "Oʻzbekiston Respublikasi fuqarolariga yakka tartibda uy-joy qurish va uy-joyni obodonlashtirish uchun 0,04 gektargacha yer uchastkalari elektron onlayn-auksion orqali mulk huquqi asosida realizatsiya qilinadi.",
 '5-BOB. YERDAN FOYDALANISH', '27-modda'),

('land_code', '28', 'Yer uchun haq toʻlash',
 "Oʻzbekiston Respublikasida yer uchastkalarini olganlik va yerdan foydalanganlik uchun haq toʻlanadi.\n\nOʻz egaligida va foydalanishida hamda mulkida yer uchastkalari boʻlgan yuridik va jismoniy shaxslar yerlardan foydalanganlik uchun haq toʻlaydi. Yerdan foydalanganlik uchun haq har yili toʻlanadigan yer soligʻi shaklida olinadi.",
 '5-BOB. YERDAN FOYDALANISH', '28-modda'),

('land_code', '29', 'Yer uchastkasini saqlash vazifasi',
 "Egalik qilishga, foydalanishga, ijaraga berilgan yoki boshqa asoslarga binoan olingan yer uchastkasini saqlash vazifasi qonunchilikka muvofiq quyidagi majburiyatlar bilan taʼminlanishi mumkin:\n\n• yer uchastkasini sotish yoki oʻzgacha tarzda boshqa shaxsga oʻtkazishni taqiqlash;\n• yer uchastkasidan ruxsat etilgan foydalanishning asosiy turini oʻzgartirishni taqiqlash;\n• yer unumdorligini saqlash va oshirish chora-tadbirlarini amalga oshirish.",
 '5-BOB. YERDAN FOYDALANISH', '29-modda'),

('land_code', '30', 'Oʻzganing yer uchastkasidan cheklangan tarzda foydalanish huquqi (servitut)',
 "Oʻzganing yer uchastkasidan cheklangan tarzda foydalanish huquqi (servitut) — koʻchmas mulk egasining qoʻshni yer uchastkasidan, zarur hollarda esa boshqa yer uchastkasidan ham cheklangan tarzda foydalanish huquqidir.\n\nServitut quyidagi maqsadlarda belgilanishi mumkin:\n• oʻzganing yer uchastkasi orqali piyoda yoki transportda oʻtish;\n• oʻzganing yer uchastkasida drenaj ishlari oʻtkazish;\n• elektr uzatish, aloqa liniyalari va truboprovodlar oʻtkazish.",
 '5-BOB. YERDAN FOYDALANISH', '30-modda'),

('land_code', '31', 'Yer uchastkasiga boʻlgan huquqning vujudga kelishi',
 "Yuridik va jismoniy shaxslarning yer uchastkasiga boʻlgan huquqi joyning oʻzida chegaralar belgilanganidan, yer uchastkalarining planlari (chizmalari) va tavsiflari tuzilib, yer uchastkalariga boʻlgan huquq davlat roʻyxatiga olinganidan keyin vujudga keladi.",
 '6-BOB. YER HUQUQLARINING VUJUDGA KELISHI', '31-modda'),

('land_code', '32', 'Yer uchastkasining plani. Yer uchastkasining chegaralarini joyning oʻzida belgilash',
 "Yer uchastkasining plani — yer uchastkasining chegaralari, oʻlchamlari va boshqa xususiyatlari koʻrsatilgan hujjatdir.",
 '6-BOB. YER HUQUQLARINING VUJUDGA KELISHI', '32-modda'),

('land_code', '101', 'Yer uchastkalaridan ruxsat etilgan foydalanish turlari',
 "Yer uchastkasidan ruxsat etilgan foydalanish turlari yer uchastkasida amalga oshirilishi mumkin boʻlgan faoliyatning yoʻl qoʻyiladigan turlaridir.\n\nYer uchastkalaridan ruxsat etilgan foydalanish turlari hududning funksional zonalashtirilishini belgilovchi shaharsozlik hujjatlari bilan asosiy, shartli ruxsat etilgan va yordamchi turi sifatida belgilanadi.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '101-modda'),

('land_code', '102', 'Yer uchastkasidan ruxsat etilgan foydalanishning asosiy turi',
 "Yer uchastkasidan ruxsat etilgan foydalanishning asosiy turi yer uchastkasi qaysi faoliyatni yuritish maqsadlari uchun moʻljallangan boʻlsa, oʻsha faoliyatning asosiy turini aks ettiradi.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '102-modda'),

('land_code', '103', 'Yer uchastkasidan shartli ruxsat etilgan foydalanish turi',
 "Yer uchastkasidan shartli ruxsat etilgan foydalanish turi yer uchastkasidagi faoliyat turi boʻlib, uni amalga oshirish uchun ruxsatnoma olish va shaharsozlik reglamentida belgilangan shartlarga rioya etish talab qilinadi.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '103-modda'),

('land_code', '104', 'Yer uchastkasidan ruxsat etilgan foydalanishning yordamchi turi',
 "Yer uchastkasidan ruxsat etilgan foydalanishning yordamchi turi yer uchastkasidan ruxsat etilgan foydalanishning asosiy turiga nisbatan qoʻshimcha hisoblanadigan, mustaqil boʻlishi mumkin boʻlmagan faoliyat turidir.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '104-modda'),

('land_code', '105', 'Yer uchastkalaridan ruxsat etilgan foydalanish turlarini oʻzgartirish tartibi',
 "Yer uchastkasidan ruxsat etilgan foydalanishning asosiy turini oʻzgartirish uning huquq egasining arizasiga koʻra amalga oshiriladi.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '105-modda'),

('land_code', '106', 'Yer uchastkasidan shartli ruxsat etilgan foydalanish turi uchun ruxsatnoma olish tartibi',
 "Yer uchastkasidan shartli ruxsat etilgan foydalanish turi uchun ruxsatnoma uning huquq egasining arizasiga koʻra amalga oshiriladi.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '106-modda'),

('land_code', '107', 'Ruxsat etilgan foydalanishning belgilangan asosiy turidan qatʼi nazar yer uchastkalaridan foydalanish',
 "Ruxsat etilgan foydalanishning belgilangan turidan qatʼi nazar yer uchastkasidan:\n\n• geodeziya punktlarini, chegara, axborotga doir va boshqa belgilarni joylashtirish;\n• muhandislik-kommunikatsiya tarmoqlari obyektlarini servitut shartlarida joylashtirish;\n• muhandislik hamda geologik qidiruv va tadqiqotlarni amalga oshirish;\n• favqulodda vaziyatlarning oldini olish va ularni bartaraf etish uchun foydalanilishi mumkin.",
 '21-BOB. RUXSAT ETILGAN FOYDALANISH', '107-modda')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- ── 8. SEED DATA: Mehnat kodeksi articles (extracted from user's Mehnat.txt) ──
INSERT INTO articles (code_id, article_number, title, content, chapter) VALUES
('labor_code', '1', 'Ushbu Kodeks bilan tartibga solinadigan munosabatlar',
 'Ushbu Kodeks xodimlar, ish beruvchilar va davlat manfaatlarining muvozanatini taʼminlash hamda ularni muvofiqlashtirish asosida yakka tartibdagi mehnatga oid munosabatlarni va ular bilan bevosita bogʻliq boʻlgan ijtimoiy munosabatlarni tartibga soladi.',
 '1-bob. Asosiy qoidalar'),

('labor_code', '2', 'Ushbu Kodeksning asosiy vazifalari',
 "Ushbu Kodeksning asosiy vazifalari quyidagilardan iborat:\n\n• xodimlar mehnat huquqlari va erkinliklarining davlat kafolatlarini belgilash;\n• ish beruvchilarning kadrlarni tanlash va samarali mehnat jarayonini tashkil etish sohasidagi huquqlari amalga oshirilishini ta'minlash;\n• mehnat sohasida ijtimoiy sheriklikni rag'batlantirish va rivojlantirish;\n• xodimlar va ish beruvchilarning huquqlari hamda qonuniy manfaatlari himoya qilinishini ta'minlash.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '3', 'Yakka tartibdagi mehnatga oid munosabatlarni huquqiy jihatdan tartibga solishning asosiy prinsiplari',
 "Yakka tartibdagi mehnatga oid munosabatlarni huquqiy jihatdan tartibga solishning asosiy prinsiplari quyidagilardan iborat:\n\n• mehnat huquqlarining tengligi, mehnat va mashg'ulotlar sohasida kamsitishni taqiqlash;\n• mehnat erkinligi va majburiy mehnatni taqiqlash;\n• mehnat sohasidagi ijtimoiy sheriklik;\n• mehnat huquqlari ta'minlanishining va mehnat majburiyatlari bajarilishining kafolatlanganligi;\n• xodimning huquqiy holati yomonlashishiga yo'l qo'yilmasligi.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '4', 'Mehnat huquqlarining tengligi, kamsitishni taqiqlash prinsipi',
 "Har kim mehnat huquqlarini amalga oshirish va himoya qilishda teng imkoniyatlarga ega.\n\nMehnat va mashg'ulotlar sohasida kamsitish taqiqlanadi. Jinsi, yoshi, irqi, millati, tili, ijtimoiy kelib chiqishi, mulkiy holati va mansab mavqeyi, dinga bo'lgan munosabati, e'tiqodi, jamoat birlashmalariga mansubligi, shuningdek xodimlarning ishchanlik sifatlari va mehnati natijalari bilan bog'liq bo'lmagan boshqa jihatlariga qarab mehnat va mashg'ulotlar sohasida biror-bir to'g'ridan-to'g'ri yoki bilvosita cheklovlar belgilash kamsitishdir.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '5', 'Mehnat erkinligi va majburiy mehnatni taqiqlash prinsipi',
 "Mehnat erkinligi har kimning mehnat qilishga bo'lgan o'z qobiliyatlarini tasarruf etish, mashg'ulot turini, kasbni va mutaxassislikni, ish joyini hamda mehnat sharoitlarini erkin tanlash huquqini anglatadi.\n\nMajburiy mehnat taqiqlanadi.\n\nMajburiy mehnat biror-bir jismoniy shaxsdan jazoni qo'llash tahdidi ostida talab etiladigan, bajarilishi uchun ushbu shaxs ixtiyoriy ravishda o'z xizmatlarini taklif qilmagan har qanday ishni yoki xizmatni anglatadi.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '6', 'Mehnat sohasidagi ijtimoiy sheriklik prinsipi',
 "Mehnat sohasidagi ijtimoiy sheriklik prinsipi xodimlarning, ular vakillarining, ish beruvchilarning, ular vakillarining, shuningdek davlat organlarining ijtimoiy-mehnat munosabatlarini tartibga solish masalalari yuzasidan manfaatlarini muvofiqlashtirishni ta'minlashga qaratilgan hamkorligidan iboratdir.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '7', 'Mehnat huquqlari ta'minlanishining kafolatlanganligi prinsipi',
 "Mehnat to'g'risidagi qonunchilik quyidagilarni ta'minlaydigan vositalar va usullar majmuini mustahkamlaydi:\n\n• xodimlarning va ish beruvchilarning mehnat sohasidagi huquqlari amalga oshirilishini;\n• majburiyatlarning bajarilishini;\n• xodimlar va ish beruvchilarning mehnat huquqlari himoya qilinishini;\n• mehnat huquqlari buzilganligi uchun javobgarlikni.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '8', "Xodimning huquqiy holati yomonlashishiga yo'l qo'yilmasligi prinsipi",
 "Har qanday normativ-huquqiy hujjat xodimning huquqiy holatini yuqoriroq yuridik kuchga ega bo'lgan normativ-huquqiy hujjatga nisbatan yomonlashtirmasligi kerak.",
 '1-bob. Asosiy qoidalar'),

('labor_code', '9', "Muddatlarni hisoblash",
 "Ushbu Kodeksda, jamoa kelishuvlarida, jamoa shartnomasida yoki mehnat shartnomasida belgilangan muddatlar kalendar sana bilan, yillar, oylar, haftalar, kunlar yoki soatlar bilan hisoblanadigan vaqt davrining tugashi bilan yoxud yuz berishi kerak bo'lgan voqeani ko'rsatgan holda aniqlanadi.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '10', 'Mehnat toʻgʻrisidagi qonunchilik',
 "Mehnat to'g'risidagi qonunchilik ushbu Kodeksdan hamda yakka tartibdagi mehnatga oid munosabatlarni va ular bilan bevosita bog'liq bo'lgan ijtimoiy munosabatlarni tartibga soluvchi boshqa qonunchilik hujjatlaridan iboratdir.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '11', 'Mehnat toʻgʻrisidagi qonunchilikning amal qilish sohasi',
 "Mehnat to'g'risidagi qonunchilikning amal qilishi xodim va ish beruvchi o'rtasidagi yakka tartibdagi mehnatga oid munosabatlarga nisbatan tatbiq etiladi.\n\nAgar O'zbekiston Respublikasining qonunlarida yoki xalqaro shartnomasida boshqacha qoida nazarda tutilmagan bo'lsa, O'zbekiston Respublikasi hududida mehnat to'g'risidagi qonunchilik bilan belgilangan qoidalar chet el fuqarolari, fuqaroligi bo'lmagan shaxslar ishtirokidagi mehnatga oid munosabatlarga nisbatan tatbiq etiladi.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '12', 'Mehnat haqidagi boshqa huquqiy hujjatlar',
 "Mehnat haqidagi boshqa huquqiy hujjatlar quyidagilardan iborat:\n\n• jamoa kelishuvlari;\n• jamoa shartnomalari;\n• ish beruvchi tomonidan kasaba uyushmasi qo'mitasi bilan kelishuvga ko'ra qabul qilinadigan ichki hujjatlar;\n• ichki hujjatlar, shu jumladan ish beruvchi o'z vakolatlari doirasida yakka o'zi qabul qiladigan yakka tartibdagi huquqiy hujjatlar.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '13', 'Mehnat toʻgʻrisidagi qonunchilikning va mehnat haqidagi boshqa huquqiy hujjatlarning oʻzaro nisbati',
 "Mehnat haqidagi boshqa huquqiy hujjatlarda xodimlar uchun mehnat to'g'risidagi qonunchilikda belgilanganiga nisbatan qo'shimcha huquqlar va kafolatlar nazarda tutilishi mumkin.\n\nMehnat haqidagi boshqa huquqiy hujjatlarga xodimning holatini mehnat to'g'risidagi qonunchilikka nisbatan yomonlashtiruvchi qoidalarni kiritishga yo'l qo'yilmaydi.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '14', 'Jamoa kelishuvlarining oʻzaro nisbati',
 "Tarmoq va hududiy jamoa kelishuvlariga xodimlarning holatini bosh jamoa kelishuviga nisbatan yomonlashtiruvchi qoidalarni kiritish taqiqlanadi.\n\nIchki hujjatlarda xodimlar uchun ularga nisbatan amal qilishi tatbiq etiladigan jamoa kelishuvlarida belgilanganiga nisbatan qo'shimcha mehnat huquqlari va kafolatlari nazarda tutilishi mumkin.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '15', 'Ichki hujjatlarning oʻzaro nisbati',
 "Ish beruvchi tomonidan kasaba uyushmasi qo'mitasi bilan kelishuvga ko'ra qabul qilingan ichki hujjatlar jamoa shartnomasiga nisbatan xodimning holatini yomonlashtiruvchi qoidalarni o'z ichiga olmasligi kerak.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '16', "Mehnat to'g'risidagi qonunchilik, mehnat haqidagi boshqa huquqiy hujjatlar va mehnat shartnomasining o'zaro nisbati",
 "Xodim bilan tuzilgan mehnat shartnomasida xodimga mehnat to'g'risidagi qonunchilikda va mehnat haqidagi boshqa huquqiy hujjatlarda nazarda tutilganiga nisbatan qo'shimcha huquqlar va kafolatlar nazarda tutilishi mumkin.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '17', "Mehnat haqidagi boshqa huquqiy hujjatlar qoidalarining va mehnat shartnomasi shartlarining haqiqiy emasligi",
 "Xodimning holatini yomonlashtiradigan mehnat haqidagi boshqa huquqiy hujjatlar qoidalari haqiqiy emas.\n\nHaqiqiy bo'lmagan qoidalar va shartlar qabul qilingan paytdan e'tiboran haqiqiy emas deb hisoblanadi.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik'),

('labor_code', '18', "Ish beruvchining yakka tartibdagi huquqiy hujjatlari",
 "Ish beruvchilar o'z vakolatlari doirasida muayyan xodimga yoki jamoaga yo'naltirilgan va bir marta qo'llanilish uchun mo'ljallangan yakka tartibdagi huquqiy hujjatlar — buyruqlar, farmoyishlar, qarorlar qabul qilishi mumkin.",
 '2-bob. Mehnat toʻgʻrisidagi qonunchilik')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- ── 9. SEED DATA: Jinoyat kodeksi articles ─────────────────────────────────
INSERT INTO articles (code_id, article_number, title, content, chapter) VALUES
('criminal_code', '1', "O'zbekiston Respublikasi jinoyat qonunchiligining vazifalari",
 "O'zbekiston Respublikasi jinoyat qonunchiligining vazifalari shaxsning huquq va erkinliklarini, mulkiyatni, jamiyat va davlat xavfsizligini, inson jamiyati tinchligini va xavfsizligini jinoyat huquq buzilishlaridan himoya qilishdan iborat.\n\nUshbu Kodeks jinoyat qilinayotgan xatti-harakatlarning jinoyatliligini, ularning jazolarini va boshqa jinoyat-huquqiy oqibatlarini belgilaydi.",
 '1-BOB. Jinoyat qonunchiligi'),

('criminal_code', '2', "O'zbekiston Respublikasi jinoyat qonunchiligi",
 "O'zbekiston Respublikasi jinoyat qonunchiligi O'zbekiston Respublikasi Konstitutsiyasiga asoslanadi va ushbu Kodeksdan iborat.",
 '1-BOB. Jinoyat qonunchiligi'),

('criminal_code', '3', "Jinoyat qonunining vazifalari",
 "Jinoyat qonuni shaxsning huquq va erkinliklarini, mulkni, iqtisodiy tizimni, tabiatni, konstitutsiyaviy tuzumni va O'zbekiston davlatchiligini, inson jamiyatining tinchlik va xavfsizligini jinoyat huquqbuzarliklaridan himoya qilish vazifasini bajaradi.",
 '1-BOB. Jinoyat qonunchiligi'),

('criminal_code', '11', "Jinoyat tushunchasi",
 "Jinoyat — ushbu Kodeks bilan qo'rqitib qo'yilgan, aybli, ijtimoiy xavfli qilmish (harakat yoki harakatsizlik)dir.\n\nJinoyat sodir etganlikda aybdor deb topilgan shaxsga nisbatan jazo yoki boshqa jinoyat-huquqiy ta'sir choralari qo'llaniladi.",
 '2-BOB. Jinoyat'),

('criminal_code', '25', "Qasddan odam o'ldirish",
 "Qasddan odam o'ldirish — o'ldirishga qasdlangan xatti-harakat natijasida boshqa shaxsning hayotidan mahrum etilishi.\n\nO'n yildan o'n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
 'Shaxsga qarshi jinoyatlar'),

('criminal_code', '97', "Qasddan yengil tan jarohati yetkazish",
 "Qasddan yengil tan jarohati yetkazish — vaqtinchalik mehnatga layoqatsizlik yoki umumiy mehnatga layoqatlikning oz miqdorda doimiy yo'qotilishi bilan bog'liq jarohot.\n\nJarima yoki ikki yilgacha isloh ishlari bilan jazolanadi.",
 'Shaxsga qarshi jinoyatlar'),

('criminal_code', '98', "Qasddan o'rta og'irlikdagi tan jarohati yetkazish",
 "Qasddan o'rta og'irlikdagi tan jarohati yetkazish — hayot uchun xavfli bo'lmagan, lekin uch haftadan oshiq vaqt mobaynida kasallik yoki umumiy mehnatga layoqatlikning sezilarli darajada doimiy yo'qotilishi bilan bog'liq jarohot.\n\nUch yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
 'Shaxsga qarshi jinoyatlar'),

('criminal_code', '169', "O'g'irlik",
 "O'g'irlik — bu boshqa biror kishining mulkini yashirin ravishda o'g'irlash.\n\nJarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.\n\nOg'irlashtiruvchi hollar: bir guruh shaxslar tomonidan, boshqa birovning turar-joyiga noqonuniy kirib, sezilarli miqdorda zarar yetkazgan holda — uch yildan besh yilgacha ozodlikdan mahrum qilish.\n\nYirik miqdorda — besh yildan o'n yilgacha ozodlikdan mahrum qilish.",
 'Mulkka qarshi jinoyatlar'),

('criminal_code', '205', "Firibgarlik",
 "Firibgarlik — aldov yo'li bilan yoki ishonchni suiiste'mol qilish yo'li bilan boshqa birovning mulkini egallab olish yoki mulk huquqiga ega bo'lish.\n\nJarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
 'Mulkka qarshi jinoyatlar')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- ── 10. SEED DATA: Constitution articles ──────────────────────────────────
INSERT INTO articles (code_id, article_number, title, content, chapter) VALUES
('constitution', '1', "O'zbekiston — suveren respublika",
 "O'zbekiston — suveren demokratik respublika. 'O'zbekiston' va 'O'zbekiston Respublikasi' degan nomlar bir ma'noni anglatadi. Davlat o'zining hududiy yaxlitligini va konstitutsiyaviy tuzumini himoya qiladi.",
 'Asosiy qoidalar'),

('constitution', '2', "Davlat ramzlari",
 "O'zbekiston Respublikasining davlat ramzlari — Bayrog'i, Gerbi va Madhiyasi belgilangan tartibda tasdiqlanadi.",
 'Asosiy qoidalar'),

('constitution', '13', "Inson huquqlari kafolatlari",
 "O'zbekiston Respublikasida inson huquqlari va erkinliklari Konstitutsiya va qonunlarga muvofiq kafolatlanadi. Har kim o'z huquqlari va erkinliklarini sud orqali himoya qilishga haqlidir.",
 'Inson huquqlari'),

('constitution', '15', "Konstitutsiyaviy qonunlarning ustunligi",
 "O'zbekiston Respublikasida O'zbekiston Respublikasi Konstitutsiyasi va qonunlarining ustunligi tan olinadi. Davlat, uning organlari, mansabdor shaxslari, jamoat birlashmalari, fuqarolar Konstitutsiya va qonunlarga muvofiq ish olib boradilar.",
 'Asosiy qoidalar'),

('constitution', '24', "Yashash huquqi",
 "Yashash huquqi — har bir insonning ajralmas huquqidir. O'zbekiston Respublikasida o'lim jazosi taqiqlanadi.",
 'Inson huquqlari')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- ── 11. SEED DATA: Family Code articles ────────────────────────────────────
INSERT INTO articles (code_id, article_number, title, content, chapter) VALUES
('family_code', '1', "Oila to'g'risidagi qonun hujjatlari",
 "Oila kodeksi O'zbekiston Respublikasida oila munosabatlarini tartibga soladi. Nikoh ixtiyoriy va teng huquqli asosda tuziladi.",
 '1-BOB. Umumiy qoidalar'),

('family_code', '2', "Oila qonunchiligining vazifalari",
 "Oila qonunchiligi oilani mustahkamlash, oilaviy munosabatlarni tenglik asosida qurish, ota-onalar va farzandlarning huquqlarini himoya qilishga qaratilgan.",
 '1-BOB. Umumiy qoidalar'),

('family_code', '15', "Nikoh yoshi",
 "Nikoh tuzish yoshi o'n sakkiz yosh etib belgilanadi. Uzrli sabablarga ko'ra, mahalliy davlat hokimiyati organi nikoh tuzish yoshini bir yildan ortiq bo'lmagan muddatga pasaytirishi mumkin.",
 '2-BOB. Nikoh'),

('family_code', '22', "Nikohni bekor qilish",
 "Nikoh er-xotinning o'zaro roziligi bilan yoki er-xotindan birining iltimosiga ko'ra sud tartibida bekor qilinadi. Nikohni bekor qilishda er-xotinning umumiy mulki taqsimlanadi.",
 '2-BOB. Nikoh')
ON CONFLICT (code_id, article_number) DO NOTHING;

-- ── 12. UPDATE article counts ──────────────────────────────────────────────
UPDATE categories SET article_count = (SELECT COUNT(*) FROM articles WHERE articles.code_id = categories.code_id);
