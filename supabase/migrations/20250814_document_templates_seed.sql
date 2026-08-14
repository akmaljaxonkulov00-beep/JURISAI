-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Hujjat shablonlari (document_templates) — jadval + 32 ta to'liq namuna
-- Bu fayl avtomatik generatsiya qilingan (scripts/gen_template_seed.mjs).
-- Idempotent: mavjud bazada xavfsiz qayta RUN qilish mumkin.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  law_ref VARCHAR(500) DEFAULT '',
  format VARCHAR(10) DEFAULT 'DOCX' CHECK (format IN ('TXT', 'DOCX', 'PDF')),
  file_size VARCHAR(20) DEFAULT '0 KB',
  downloads INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(100) DEFAULT 'file-text',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kategoriyalar
INSERT INTO template_categories (slug, name, icon, sort_order) VALUES
  ('sud', 'Sud hujjatlari', 'scale', 1),
  ('shartnoma', 'Shartnomalar', 'file-signature', 2),
  ('da''vo', 'Da''vo va arizalar', 'file-text', 3),
  ('mehnat', 'Mehnat huquqi', 'briefcase', 4),
  ('vakolat', 'Ishonchnoma va vakolat', 'user-check', 5),
  ('majlis', 'Majlis va bayonnomalar', 'users', 6),
  ('xat', 'Xat va murojaatlar', 'mail', 7),
  ('moliya', 'Moliya va hisobot', 'dollar-sign', 8)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

CREATE INDEX IF NOT EXISTS idx_doc_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_doc_templates_tags ON document_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_doc_templates_name ON document_templates USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_doc_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_categories_slug ON template_categories(slug);

-- RLS
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active templates" ON document_templates;
CREATE POLICY "Anyone can view active templates"
  ON document_templates FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Templates admin write" ON document_templates;
CREATE POLICY "Templates admin write"
  ON document_templates FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Template categories read" ON template_categories;
CREATE POLICY "Template categories read"
  ON template_categories FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE document_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE template_categories;

-- ── Seed: 32 ta real O'zbekiston huquqiy hujjat namunasi ────────────────
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('dav-ariza-fuqarolik', 'Da''vo arizasi (fuqarolik ishi bo''yicha)', 'da''vo', 'Fuqarolik ishi bo''yicha sudga da''vo arizasi namunasi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da''vogar: (F.I.Sh., yashash manzili, telefon raqami)
Javobgar: (F.I.Sh., yashash manzili, telefon raqami)

Da''vo arizasining qiymati: ___________ so''m

DA''VO ARIZASI

Men, (da''vogarning F.I.Sh.) quyidagi sabablarga ko''ra ushbu da''vo arizasini beraman:

1. Vaziyat bayoni:
(da''vo asoslari batafsil yoziladi)

2. Dalillar:
(da''voni asoslovchi dalillar keltiriladi)

3. Qonuniy asos:
O''zbekiston Respublikasi Fuqarolik protsessual kodeksining 103-108-moddalariga asosan

4. Talab:
(da''vogarning aniq talabi yoziladi)

ILOVA:
1. Da''vo arizasining nusxasi - ____ nusxa
2. Davlat boji to''langanligi to''g''risidagi kvitansiya
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.           Imzo: ___________
',
   'FPK 103-108-moddalari', 'DOCX', '24 KB', 1580, ARRAY['fuqarolik', 'da''vo', 'sud'], true, '2026-01-15')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('dav-ariza-iqtisodiy', 'Da''vo arizasi (iqtisodiy sud)', 'da''vo', 'Iqtisodiy sudga beriladigan da''vo arizasi', 'O''ZBEKISTON RESPUBLIKASI IQTISODIY SUDIGA

Da''vogar: (korxona nomi, STIR, bank rekvizitlari, manzili)
Javobgar: (korxona nomi, STIR, bank rekvizitlari, manzili)

Da''vo arizasining qiymati: ___________ so''m

DA''VO ARIZASI

(da''vogarning nomi) quyidagi sabablarga ko''ra ushbu da''vo arizasini beradi:

1. Holat bayoni:
(Tomonlar o''rtasidagi munosabatlar, shartnoma ma''lumotlari, majburiyatlarning bajarilmaganligi)

2. Shartnoma bo''yicha ma''lumot:
Shartnoma № ___ "___" ___________ 202___ y.

3. Qarzdorlik summasi:
Asosiy qarz: ___________ so''m
Penya: ___________ so''m
Jami: ___________ so''m

4. Qonuniy asos:
O''zbekiston Respublikasi Iqtisodiy protsessual kodeksining 91-96-moddalariga asosan

ILOVA:
1. Shartnoma nusxasi
2. Hisob-kitob hujjatlari
3. Davlat boji to''langanligi to''g''risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
M.O''.',
   'IPK 91-96-moddalari', 'DOCX', '26 KB', 1200, ARRAY['iqtisodiy', 'da''vo', 'sud'], true, '2026-01-20')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('apellyatsiya-shikoyati', 'Apellyatsiya shikoyati', 'sud', 'Sud qaroriga apellyatsiya tartibida shikoyat qilish', 'O''ZBEKISTON RESPUBLIKASI (viloyat/shahar) SUDIGA

Shikoyat qiluvchi: (F.I.Sh., manzili)
Sud qarori chiqargan sud: (tuman/shahar sudi)
Ish №: _________
Sud qarori sanasi: "___" ___________ 202___ y.

APELLYATSIYA SHIKOYATI

Men, (shikoyat qiluvchining F.I.Sh.) (tuman/shahar) sudining "___" ___________ 202___ yildagi ish № ___ sonli qarori bilan quyidagi masala bo''yicha:

(qarorning mazmuni qisqacha bayon etiladi)

qaror chiqarilgan bo''lib, men ushbu qarorga noroziman, chunki:

1. Sud tomonidan ishning holatlari to''liq o''rganilmagan;
2. (boshqa asoslar)

Yuqoridagilarni inobatga olib, O''zbekiston Respublikasi Fuqarolik protsessual kodeksining 201-205-moddalariga asosan,

SO''RAYMAN:
(tuman/shahar) sudining "___" ___________ 202___ yildagi ish № ___ sonli qarorini bekor qilib, yangi qaror chiqarilsin.

ILOVA:
1. Shikoyat nusxasi - ___ nusxa
2. Davlat boji to''langanligi to''g''risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
',
   'FPK 201-205-moddalari', 'DOCX', '22 KB', 980, ARRAY['apellyatsiya', 'shikoyat', 'sud'], true, '2026-02-01')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('kassatsiya-shikoyati', 'Kassatsiya shikoyati', 'sud', 'Apellyatsiya instansiyasi qaroriga kassatsiya shikoyati', 'O''ZBEKISTON RESPUBLIKASI (viloyat) SUDI KASSATSIYA INSTANSIYASIGA

Shikoyat qiluvchi: (F.I.Sh., manzili)
Apellyatsiya qarori chiqargan sud: _________
Ish №: _________

KASSATSION SHIKOYAT

Men, (shikoyat qiluvchi) (apellyatsiya instansiyasi sudining) "___" ___________ 202___ yildagi qaroriga norozilik bildiraman.

Quyidagi asoslarga ko''ra:

1. Ishda muhim ahamiyatga ega bo''lgan holatlar noto''g''ri baholangan;
2. Moddiy huquq normalari buzilgan;
3. Protsessual huquq normalari buzilgan;

Yuqoridagilarni inobatga olib, O''zbekiston Respublikasi Fuqarolik protsessual kodeksining 213-218-moddalariga asosan,

SO''RAYMAN:
Apellyatsiya instansiyasining qarorini bekor qilib, yangi qaror chiqarilsin.

ILOVA:
1. Shikoyat nusxasi - ___ nusxa
2. Sud qarorining nusxasi
3. Davlat boji to''langanligi to''g''risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
',
   'FPK 213-218-moddalari', 'DOCX', '24 KB', 760, ARRAY['kassatsiya', 'shikoyat', 'sud'], true, '2026-02-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('fuqarolik-shartnoma', 'Fuqarolik-huquqiy shartnoma', 'shartnoma', 'Fuqarolik-huquqiy xarakterdagi xizmat ko''rsatish shartnomasi', 'FUQAROLIK-HUQUQIY SHARTNOMA № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Biz, quyida imzo chekuvchilar:

Buyurtmachi: (F.I.Sh., pasport ma''lumotlari, manzili)

va

Ijrochi: (F.I.Sh., pasport ma''lumotlari, manzili)

o''rtasida quyidagi shartnoma tuzildi:

1. ShARTNOMA PREDMETI
1.1. Ijrochi buyurtmachining topshirig''iga binoan quyidagi xizmatlarni ko''rsatish majburiyatini oladi: (xizmat turi)
1.2. Buyurtmachi ko''rsatilgan xizmatlar uchun haq to''lash majburiyatini oladi.

2. TOMONLARNING HUQUQ VA MAJBURIYATLARI
2.1. Ijrochi quyidagilarga majbur:
- Xizmatni sifatli bajarish;
- Belgilangan muddatlarda bajarish;
- (boshqa majburiyatlar)

2.2. Buyurtmachi quyidagilarga majbur:
- Xizmat uchun belgilangan haqni to''lash;
- Zarur hujjatlarni taqdim etish;
- (boshqa majburiyatlar)

3. XIZMATLAR NARXI VA HISOB-KITOB TARTIBI
3.1. Xizmatlarning umumiy qiymati: ___________ so''m
3.2. To''lov tartibi: (naqd/pul o''tkazmasi)

4. TOMONLARNING JAVOBGARLIGI
4.1. Shartnoma shartlarini buzganlik uchun tomonlar O''zbekiston Respublikasi qonunchiligiga muvofiq javobgar bo''ladi.

5. SHARTNOMANING AMAL QILISH MUDDATI
5.1. Shartnoma imzolangan paytdan kuchga kiradi va tomonlar majburiyatlarni to''liq bajarganlariga qadar amal qiladi.

6. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Buyurtmachi:                      Ijrochi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 345-358-moddalari', 'DOCX', '32 KB', 2300, ARRAY['fuqarolik', 'shartnoma', 'xizmat'], true, '2026-01-05')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('mehnat-shartnoma', 'Mehnat shartnomasi (ish beruvchi va xodim o''rtasida)', 'mehnat', 'Xodim bilan tuziladigan mehnat shartnomasi namunasi', 'MEHNAT SHARTNOMASI № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Ish beruvchi: (korxona/tashkilot nomi, STIR, manzili), (lavozimi) (F.I.Sh.) vakili sifatida, bir tomondan,
va xodim: (F.I.Sh., pasport ma''lumotlari, INN), ikkinchi tomondan,
o''rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Xodim ish beruvchida quyidagi lavozimda ishlash majburiyatini oladi: (lavozim)
1.2. Ish joyi: (tarkibiy bo''linma)

2. MEHNAT SHARTLARI
2.1. Ishning xarakteri: (doimiy/vaqtinchalik)
2.2. Ish vaqti: haftasiga ___ soat
2.3. Dam olish kuni: (shanba/yakshanba)

3. TOMONLARNING HUQUQ VA MAJBURIYATLARI
3.1. Xodim quyidagilarga majbur:
- O''z mehnat vazifalarini vijdonan bajarish;
- Mehnat intizomiga rioya qilish;
- (boshqa majburiyatlar)

4. HAQ TO''LASH
4.1. Lavozim maoshi: ___________ so''m
4.2. Qo''shimcha to''lovlar: ___________ so''m

5. MEHNAT TATILI
5.1. Yillik mehnat ta''tili: ___ kalendar kun

6. SHARTNOMANING AMAL QILISH MUDDATI
6.1. Shartnoma muddati: (cheklanmagan/___ oy)

7. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Ish beruvchi:                      Xodim:
(korxona nomi)                     (F.I.Sh.)
(lavozimi)                        
Imzo: ________                     Imzo: ________
M.O''.',
   'MK 100-104-moddalari', 'DOCX', '35 KB', 3200, ARRAY['mehnat', 'shartnoma', 'xodim'], true, '2026-01-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ijara-shartnoma', 'Mulk ijarasi shartnomasi', 'shartnoma', 'Turar joy/noturar joy ijarasi shartnomasi', 'IJARA SHARTNOMASI № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Ijarga beruvchi: (F.I.Sh., pasport ma''lumotlari, manzili)
va
Ijarga oluvchi: (F.I.Sh., pasport ma''lumotlari, manzili)

o''rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Ijarga beruvchi quyidagi mulkni ijaraga beradi: (mulk tavsifi, manzili, maydoni)
1.2. Mulkning xususiyatlari: (qavat, xonalar soni, jihozlar)

2. IJARA MUDDATI
2.1. Ijara muddati: "___" ___________ 202___ y. dan "___" ___________ 202___ y. gacha

3. IJARA HAQI
3.1. Oylik ijara haqi: ___________ so''m
3.2. To''lov tartibi: (har oyning ___ sanasigacha)

4. TOMONLARNING MAJBURIYATLARI
4.1. Ijarga beruvchi:
- Mulkni belgilangan tartibda topshirish
- Mulkni tegishli holatda saqlash

4.2. Ijarga oluvchi:
- Ijara haqini o''z vaqtida to''lash
- Mulkdan belgilangan maqsadda foydalanish

5. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Ijarga beruvchi:                   Ijarga oluvchi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 353-357-moddalari', 'DOCX', '28 KB', 1850, ARRAY['ijara', 'shartnoma', 'mulk'], true, '2026-02-15')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('oldi-sotdi-shartnoma', 'Ko''chmas mulk oldi-sotdi shartnomasi', 'shartnoma', 'Ko''chmas mulk (uy, kvartira) oldi-sotdi shartnomasi', 'KO''CHMAS MULK OLDI-SOTDI SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Sotuvchi: (F.I.Sh., pasport ma''lumotlari, manzili)
va
Xaridor: (F.I.Sh., pasport ma''lumotlari, manzili)

o''rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Sotuvchi quyidagi ko''chmas mulkni sotadi: (manzili, maydoni, xonalar soni)
1.2. Mulkning kadastr raqami: _________
1.3. Mulk huquqini tasdiqlovchi hujjat: (guvohnoma №)

2. MULKNING NARXI
2.1. Mulkning sotish narxi: ___________ so''m
2.2. To''lov tartibi: (bir martalik/bo''lib-bo''lib)

3. TOMONLARNING MAJBURIYATLARI
3.1. Sotuvchi:
- Mulkni belgilangan tartibda topshirish
- Mulkka nisbatan uchinchi shaxslarning huquqlari yo''qligini kafolatlash

3.2. Xaridor:
- Belgilangan narxni to''lash
- Mulkni qabul qilish

4. SHARTNOMANING TUZILISHI
4.1. Shartnoma notarial tartibda tasdiqlanishi kerak
4.2. Shartnoma davlat ro''yxatidan o''tkazilishi kerak

5. TOMONLARNING REKVIZITLARI

Sotuvchi:                          Xaridor:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 380-393-moddalari', 'DOCX', '34 KB', 2100, ARRAY['oldi-sotdi', 'shartnoma', 'mulk'], true, '2026-01-25')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('qarz-shartnoma', 'Qarz shartnomasi', 'shartnoma', 'Pul mablag''larini qarzga olish shartnomasi', 'QARZ SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Qarz beruvchi: (F.I.Sh., pasport ma''lumotlari, manzili)
va
Qarz oluvchi: (F.I.Sh., pasport ma''lumotlari, manzili)

o''rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Qarz beruvchi qarz oluvchiga ___________ so''m miqdorida pul mablag''ini qarzga beradi.
1.2. Qarz oluvchi ko''rsatilgan pul mablag''ini belgilangan muddatda qaytarish majburiyatini oladi.

2. QARZDAN FOYDALANISH SHARTLARI
2.1. Qarz muddati: "___" ___________ 202___ y.
2.2. Foiz stavkasi: (yillik ___% foizsiz)

3. QARZNI QAYTARISH TARTIBI
3.1. Qarz (bir martalada/bo''lib-bo''lib) qaytariladi.
3.2. Qarzni kechiktirilgan holda qaytarganlik uchun O''zbekiston Respublikasi qonunchiligiga muvofiq javobgarlik belgilanadi.

4. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Qarz beruvchi:                     Qarz oluvchi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 421-428-moddalari', 'DOCX', '22 KB', 1650, ARRAY['qarz', 'shartnoma', 'pul'], true, '2026-02-20')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ishonchnoma', 'Ishonchnoma (umumiy)', 'vakolat', 'Jismoniy shaxs nomidan ish yuritish uchun ishonchnoma', 'ISHONCHNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Men, (F.I.Sh., pasport seriyasi va raqami: ___, berilgan sanasi: "___" ___________ y., JSHSH: _________)

ushbu ishonchnoma bilan (F.I.Sh., pasport ma''lumotlari)ga quyidagi harakatlarni amalga oshirish vakolatini beraman:

1. Mening nomimdan hujjatlarni olish va topshirish;
2. Shartnomalar tuzish va imzolash;
3. Bank operatsiyalarini amalga oshirish;
4. Davlat organlarida mening manfaatlarimni himoya qilish;
5. (boshqa vakolatlar)

Ishonchnoma (muddati) muddatga berilgan.

Ishonchnomani beruvchi:
(F.I.Sh.)
Imzo: ________

Ishonchnoma notarial tartibda tasdiqlangan:
Notarius: ________
Reestr №: ________
',
   'FK 158-moddasi', 'DOCX', '18 KB', 2900, ARRAY['ishonchnoma', 'vakolat'], true, '2026-01-08')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('aliment-ariza', 'Aliment undirish to''g''risidagi ariza', 'da''vo', 'Voyaga yetmagan bolani ta''minlash uchun aliment undirish arizasi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da''vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)

ALIMENT UNDIRISH TO''G''RISIDA DA''VO ARIZASI

Men, (da''vogarning F.I.Sh.) (javobgarning F.I.Sh.) bilan _________________ yildan beri nikohda bo''lgan/bo''lganmiz.

Nikohdan/quyidagi farzandlarimiz bor:
1. (F.I.Sh., tug''ilgan sanasi)
2. (F.I.Sh., tug''ilgan sanasi)

Farzandlar mening tarbiyamda yashaydi. Javobgar farzandlarni moddiy ta''minlashda qatnashmaydi.

O''zbekiston Respublikasi Oila kodeksining 98-109-moddalariga asosan,

SO''RAYMAN:
Javobgardan voyaga yetmagan farzandlarimizni ta''minlash uchun har oyda ___________ so''m miqdorida aliment undirilsin.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Farzandlarning tug''ilganlik guvohnomalari nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.           Imzo: ___________
',
   'OK 98-109-moddalari', 'DOCX', '20 KB', 1400, ARRAY['aliment', 'da''vo', 'oila'], true, '2026-02-05')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ajrim-ariza', 'Nikohni bekor qilish to''g''risidagi da''vo arizasi', 'da''vo', 'Nikohni (ajrimni) sud orqali bekor qilish arizasi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da''vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)

NIKOHN BEKOR QILISH TO''G''RISIDA DA''VO ARIZASI

Men, (da''vogar) va (javobgar) o''rtasida ___________ yil "___" ___________ kuni FHDYo organida nikoh qayd etilgan (dalolatnoma yozuvi № ___).

Nikohdan birga yashash davomida er-xotin munosabatlari yaxshi bo''lmagan. Quyidagi sabablarga ko''ra birga yashash imkoni yo''q:

1. (sabab)
2. (sabab)

Nikohdan farzandlar: (bor/yo''q)

O''zbekiston Respublikasi Oila kodeksining 37-41-moddalariga asosan,

SO''RAYMAN:
(da''vogar) va (javobgar) o''rtasidagi nikohni bekor qilsin.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Farzandlarning tug''ilganlik guvohnomalari nusxasi (agar bo''lsa)

Sana: "___" ___________ 202___ y.           Imzo: ___________
',
   'OK 37-41-moddalari', 'DOCX', '22 KB', 1200, ARRAY['ajrim', 'da''vo', 'oila'], true, '2026-02-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ishga-qabul-ariza', 'Ishga qabul qilish to''g''risidagi ariza', 'mehnat', 'Xodimning ishga qabul qilish haqidagi arizasi', 'Korxona rahbariga
(korxona nomi)
(rahbarning F.I.Sh., lavozimi)

dan
(nomzodning F.I.Sh., manzili, telefon raqami)

ARIZA

Men, (F.I.Sh.)ni (lavozim nomi) lavozimiga ishga qabul qilishingizni so''rayman.

Ma''lumotim: (ta''lim darajasi, mutaxassisligim)
Ish tajribam: (______ yil)

Quyidagi hujjatlarni ilova qilaman:
1. Mehnat daftarchasi nusxasi
2. Diplomi nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'MK 100-101-moddalari', 'DOCX', '16 KB', 3500, ARRAY['mehnat', 'ariza', 'xodim'], true, '2026-01-02')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ishdan-bosh-ariza', 'Ishdan bo''shash to''g''risidagi ariza', 'mehnat', 'Xodimning o''z xohishi bilan ishdan bo''shash arizasi', 'Korxona rahbariga
(korxona nomi)
(rahbarning F.I.Sh.)

dan
(xodimning F.I.Sh., lavozimi)

ARIZA

Men, (F.I.Sh.)ni (lavozim nomi) lavozimidan o''z xohishim bilan bo''shatishingizni so''rayman.

O''zbekiston Respublikasi Mehnat kodeksining 161-moddasiga asosan, ish beruvchini ikki hafta oldin ogohlantirgan holda mehnat shartnomasini bekor qilaman.

Oxirgi ish kuni: "___" ___________ 202___ y.

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'MK 161-moddasi', 'DOCX', '15 KB', 2800, ARRAY['mehnat', 'ariza', 'bo''shash'], true, '2026-01-12')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('advokat-sorov', 'Advokatning ma''lumot so''rovi', 'vakolat', 'Advokatlik so''rovi orqali ma''lumot olish', '(tashkilot nomi)
(rahbarning F.I.Sh., lavozimi)

dan
Advokat (F.I.Sh.)
Litsenziya №: _________

ADVOKATLIK SO''ROVI

Men, (F.I.Sh.) advokat sifatida (ishonch bildiruvchining F.I.Sh.)ning manfaatlarini himoya qilish doirasida quyidagi ma''lumotlarni so''rayman:

1. (so''raladigan ma''lumot)
2. (so''raladigan ma''lumot)

"Advokatura to''g''risida"gi O''zbekiston Respublikasi Qonunining 14-moddasiga asosan, so''ralgan ma''lumotni ___ kun muddatda taqdim etishingizni so''rayman.

ILOVA:
1. Advokatlik guvohnomasi nusxasi
2. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
M.O''.',
   'Advokatura to''g''risidagi qonun, 14-modda', 'DOCX', '18 KB', 950, ARRAY['advokat', 'so''rov', 'vakolat'], true, '2026-02-18')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('sudga-murojaat', 'Sudga murojaat (umumiy namuna)', 'sud', 'Sudga murojaat qilishning umumiy namunasi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Arizachi: (F.I.Sh., manzili, telefon)
Manfaatdor shaxs: (F.I.Sh., manzili, telefon)

ARIZA

Men, (F.I.Sh.) O''zbekiston Respublikasi Fuqarolik protsessual kodeksining 103-moddasiga asosan quyidagi masala bo''yicha sudga murojaat qilaman:

(ariza mazmuni batafsil yoziladi)

1. Vaziyatning qisqacha bayoni:
2. Arizachining talabi:
3. Qonuniy asos:

SO''RAYMAN:
(anich talab yoziladi)

ILOVA:
1. (hujjatlar ro''yxati)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'FPK 103-moddasi', 'DOCX', '20 KB', 1100, ARRAY['sud', 'murojaat', 'ariza'], true, '2026-03-01')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('kafolat-xati', 'Kafolat xati', 'xat', 'Moliyaviy yoki boshqa majburiyatlarni kafolatlash xati', '(qabul qiluvchi tashkilot nomi)

KAFOLAT XATI

"___" ___________ 202___ y.                    № ___

Men, (F.I.Sh., lavozimi) (tashkilot nomi) nomidan quyidagilarni kafolatlayman:

1. (majburiyat mazmuni)
2. (majburiyat)
3. (boshqa shartlar)

Ushbu kafolat (muddat) muddatga amal qiladi.

(kafolat beruvchining lavozimi)         ___________
                                         (imzo)

M.O''.',
   '', 'DOCX', '16 KB', 1300, ARRAY['kafolat', 'xat', 'moliya'], true, '2026-03-05')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('ishonch-xati', 'Ishonch xati (tavsiya)', 'xat', 'Jismoniy yoki yuridik shaxsga beriladigan ishonch xati', '(qabul qiluvchi tashkilot nomi)

ISHONCH XATI

"___" ___________ 202___ y.                    № ___

Ushbu xat bilan (F.I.Sh., lavozimi)ni (tashkilot nomi)ga (masala) bo''yicha vakil etib tayinlaymiz.

(F.I.Sh.) quyidagi huquqlarga ega:
1. (vakolatlar)
2. (vakolatlar)

(vakilning imzosi): ___________ (imzo namunasi)

(korxona rahbari lavozimi)          ___________
                                       (imzo)
M.O''.',
   '', 'DOCX', '15 KB', 850, ARRAY['ishonch', 'xat', 'tavsiya'], true, '2026-03-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('shikoyat-ariza', 'Davlat organiga shikoyat arizasi', 'xat', 'Davlat organlari va mansabdor shaxslarning harakatlari ustidan shikoyat', '(yuqori turuvchi tashkilot/organ nomi)
(rahbarning F.I.Sh.)

dan
(arizachining F.I.Sh., manzili, telefon)

SHIKOYAT ARIZASI

Men, (F.I.Sh.) quyidagi sabablarga ko''ra shikoyat arizasi bilan murojaat qilaman:

1. (shikoyat mazmuni)
2. (shikoyat qilinayotgan harakat/harakatlar)
3. (shikoyat qilinayotgan organ xodimining F.I.Sh., lavozimi)

Yuqoridagilarni inobatga olgan holda,

SO''RAYMAN:
1. (shikoyatni ko''rib chiqish)
2. (choralar ko''rish)
3. (javob berish)

ILOVA:
1. (dalillar, hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'Murojaatlar to''g''risidagi qonun', 'DOCX', '19 KB', 1050, ARRAY['shikoyat', 'ariza', 'davlat'], true, '2026-03-15')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('dalolatnoma', 'Dalolatnoma (umumiy namuna)', 'majlis', 'Turli xil holatlarni qayd etish uchun dalolatnoma', 'DALOLATNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Biz, quyida imzo chekuvchilar:

1. (F.I.Sh., lavozimi)
2. (F.I.Sh., lavozimi)
3. (F.I.Sh., lavozimi)

ushbu dalolatnomani quyidagilar to''g''risida tuzdik:

"___" ___________ 202___ y. soat ___ da (joy)da quyidagi holat aniqlandi:

(holatning batafsil bayoni)

1. (holat)
2. (holat)

Ushbu dalolatnoma ikki nusxada tuzildi.

Imzolar:
1. ___________ (imzo)
2. ___________ (imzo)
3. ___________ (imzo)
',
   '', 'DOCX', '17 KB', 780, ARRAY['dalolatnoma', 'hujjat'], true, '2026-03-20')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('bayonnoma', 'Bayonnoma (majlis)', 'majlis', 'Yig''ilish va majlislarni qayd etish bayonnomasi', 'BAYONNOMA

"___" ___________ 202___ y.                    № ___

Majlis mavzusi: _________
Majlis o''tkazilgan joy: _________
Qatnashchilar: ___ kishi (ro''yxat ilova qilinadi)
Majlis raisi: (F.I.Sh.)
Majlis kotibi: (F.I.Sh.)

KUN TARTIBI:
1. (masala)
2. (masala)
3. (masala)

1-masala bo''yicha:
(tinglandi, so''zga chiqqanlar, qaror)

2-masala bo''yicha:
(tinglandi, so''zga chiqqanlar, qaror)

3-masala bo''yicha:
(tinglandi, so''zga chiqqanlar, qaror)

QAROR QILINDI:
1. (qaror)
2. (qaror)

Rais: ___________ (imzo)
Kotib: ___________ (imzo)
',
   '', 'DOCX', '22 KB', 650, ARRAY['bayonnoma', 'majlis'], true, '2026-03-25')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('buyruq', 'Korxona buyrug''i (namuna)', 'mehnat', 'Korxona/tashkilot rahbarining buyrug''i namunasi', 'BUYRUK

"___" ___________ 202___ y.                    № ___

(korxona nomi)

(MAVZU: buyruq mazmuni qisqacha)

(Asos: qonun yo''qi, yuqori turuvchi tashkilotning ko''rsatmasi va h.k.)

BUYURAMAN:
1. (topshiriq)
2. (topshiriq)
3. (bajarilish muddati)

4. Ushbu buyruqning bajarilishini nazorat qilish (masul shaxs) zimmasiga yuklanadi.

(korxona rahbari lavozimi)          ___________
                                       (imzo)

Buyruq bilan tanishtirildi:
(F.I.Sh.) ________ "___" ___________ 202___ y.
',
   '', 'DOCX', '18 KB', 2200, ARRAY['buyruq', 'mehnat', 'korxona'], true, '2026-01-18')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('hadya-shartnoma', 'Hadya shartnomasi', 'shartnoma', 'Mulkni hadya qilish shartnomasi', 'HADYA SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Hadya beruvchi: (F.I.Sh., pasport ma''lumotlari, manzili)
va
Hadya oluvchi: (F.I.Sh., pasport ma''lumotlari, manzili)

o''rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Hadya beruvchi quyidagi mulkni tekinga hadya qiladi: (mulk tavsifi)

2. TOMONLARNING HUQUQ VA MAJBURIYATLARI
2.1. Hadya beruvchi mulkni belgilangan tartibda topshirish majburiyatini oladi.
2.2. Hadya oluvchi mulkni qabul qilish huquqiga ega.

3. SHARTNOMANING TUZILISHI
3.1. Shartnoma notarial tartibda tasdiqlanishi kerak.

4. TOMONLARNING REKVIZITLARI

Hadya beruvchi:                    Hadya oluvchi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 413-420-moddalari', 'DOCX', '20 KB', 890, ARRAY['hadya', 'shartnoma'], true, '2026-04-01')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('tilxat', 'Tilxat', 'moliya', 'Pul yoki moddiy boyliklarni olish to''g''risidagi tilxat', 'TILXAT

"___" ___________ 202___ y.

Men, (F.I.Sh., pasport ma''lumotlari, manzili)

(F.I.Sh.)dan ___________ (summa raqam va yozuvda) so''m pul mablag''ini oldim.

Pulni (maqsadi) uchun oldim. Pulni ___________ gacha qaytarish majburiyatini olaman.

(F.I.Sh.)                          Imzo: ________

Guvohlar:
1. (F.I.Sh.) _________
2. (F.I.Sh.) _________
',
   '', 'TXT', '8 KB', 3200, ARRAY['tilxat', 'moliya', 'pul'], true, '2026-01-03')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('rozilik-xati', 'Rozilik xati', 'xat', 'Turli xil rozilik bildirish xatlari', 'ROZILIK XATI

"___" ___________ 202___ y.                    № ___

(olingan hujjat/sana havolasi)

Men, (F.I.Sh.) (masala) bo''yicha (tashkilot/qaror bilan) tanishdim va rozilik bildiraman.

(rozilik mazmuni)

(qabul qiluvchi lavozimi)           ___________
                                       (imzo)
',
   '', 'DOCX', '14 KB', 970, ARRAY['rozilik', 'xat'], true, '2026-04-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('tushuntirish-xati', 'Tushuntirish xati', 'xat', 'Turli holatlar yuzasidan tushuntirish xati', '(rahbarning F.I.Sh., lavozimi)

dan
(xodimning F.I.Sh., lavozimi)

TUSHUNTIRISH XATI

"___" ___________ 202___ y.                    № ___

(ishlab chiqarish masalasiga oid)

Men, (F.I.Sh.) (masala) bo''yicha quyidagilarni tushuntirishni lozim topaman:

1. (tushuntirish)
2. (tushuntirish)

(xodim F.I.Sh.)                 Imzo: ________
Sana: _________
',
   '', 'DOCX', '16 KB', 1100, ARRAY['tushuntirish', 'xat'], true, '2026-04-15')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('meros-ariza', 'Merosni qabul qilish to''g''risidagi ariza', 'da''vo', 'Meros huquqini qabul qilish arizasi', '(tuman/shahar) NOTARIAL KONTORIGA

Arizachi: (F.I.Sh., manzili, telefon)

MEROSNI QABUL QILISH TO''G''RISIDA ARIZA

Men, (F.I.Sh.) "___" ___________ 202___ y. vafot etgan (meros qoldiruvchining F.I.Sh.)dan qolgan merosni qabul qilaman.

Meros qoldiruvchi bilan (qarindoshlik darajasi) hisoblanaman.

Meros tarkibi:
1. (mulk)
2. (mulk)

O''zbekiston Respublikasi Fuqarolik kodeksining 1125-1140-moddalariga asosan, merosni qabul qilish to''g''risidagi arizani taqdim etaman.

ILOVA:
1. Meros qoldiruvchining o''limi to''g''risidagi guvohnoma nusxasi
2. Qarindoshlikni tasdiqlovchi hujjat nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'FK 1125-1140-moddalari', 'DOCX', '18 KB', 870, ARRAY['meros', 'ariza', 'mulk'], true, '2026-04-20')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('mulk-bolish-davo', 'Mulkni bo''lish to''g''risidagi da''vo arizasi', 'da''vo', 'Er-xotin o''rtasidagi umumiy mulkni bo''lish da''vosi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da''vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)
Uchinchi shaxs: (agar kerak bo''lsa)

Da''vo arizasining qiymati: ___________ so''m

MULKNI BO''LISH TO''G''RISIDA DA''VO ARIZASI

Men, (da''vogar) va (javobgar) o''rtasida ___________ yilda nikoh tuzilgan va ___________ yilda nikoh bekor qilingan.

Nikoh davrida quyidagi mulk sotib olingan:
1. (mulkning nomi, qiymati)
2. (mulkning nomi, qiymati)

O''zbekiston Respublikasi Oila kodeksining 24-28-moddalariga asosan,

SO''RAYMAN:
Yuqorida ko''rsatilgan mulkni teng taqsimlashni belgilang.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Mulk huquqini tasdiqlovchi hujjatlar
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'OK 24-28-moddalari', 'DOCX', '24 KB', 680, ARRAY['mulk', 'da''vo', 'oila'], true, '2026-04-25')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('sud-iltimosnoma', 'Sudga iltimosnoma', 'sud', 'Sudga turli xil iltimosnomalar berish namunasi', 'O''ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Iltimosnoma beruvchi: (F.I.Sh., ishdagi holati: da''vogar/javobgar/advokat)
Ish №: _________

ILTIMOSNOMA

(ishning nomi) bo''yicha sud ishini ko''rib chiqish jarayonida quyidagi iltimosnomani bildiraman:

(iltimosnoma mazmuni)

1. (iltimos)
2. (asos)

O''zbekiston Respublikasi Fuqarolik protsessual kodeksining 56-moddasiga asosan,

SO''RAYMAN:
(iltimosnomani qanoatlantirish)

Sana: "___" ___________ 202___ y.    Imzo: ___________
',
   'FPK 56-moddasi', 'DOCX', '16 KB', 920, ARRAY['sud', 'iltimosnoma'], true, '2026-05-01')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('javob-xati', 'Javob xati', 'xat', 'Olingan murojaat va xatlarga javob xati', '(qabul qiluvchining F.I.Sh., manzili)

JAVOB XATI

"___" ___________ 202___ y.                    № ___

Sizning (sana)dagi (hujjat raqami) sonli murojaatingizga javoban quyidagilarni ma''lum qilamiz:

(javob mazmuni)

1. (band)
2. (band)

(qo''shimcha ma''lumot)

(lavozimi)                         ___________
                                     (imzo)
',
   '', 'DOCX', '14 KB', 1500, ARRAY['xat', 'javob'], true, '2026-05-05')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('vakolatnoma', 'Vakolatnoma (ishonchli vakil tayinlash)', 'vakolat', 'Jismoniy shaxs manfaatlarini himoya qilish uchun vakolatnoma', 'VAKOLATNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Men, (F.I.Sh.) (F.I.Sh.)ga quyidagi masalalarda mening manfaatlarimni himoya qilish vakolatini beraman:

1. Sud, prokuratura va boshqa davlat organlarida mening nomimdan ishtirok etish;
2. Hujjatlarni olish va topshirish;
3. (boshqa vakolatlar)

Vakolatnoma (muddati)ga berilgan.

(Ishonch bildiruvchi)              (Vakil)
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
',
   'FK 158-moddasi', 'DOCX', '16 KB', 830, ARRAY['vakolat', 'vakolatnoma'], true, '2026-05-10')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
INSERT INTO document_templates
  (slug, name, category, description, content, law_ref, format, file_size, downloads, tags, is_active, created_at)
VALUES
  ('sorov-xati', 'Ma''lumot olish uchun so''rov xati', 'xat', 'Turli tashkilotlardan ma''lumot olish uchun so''rov xati', '(tashkilot nomi, rahbarning F.I.Sh.)

SO''ROV XATI

"___" ___________ 202___ y.                    № ___

Hurmatli (rahbarning F.I.Sh.)!

Quyidagi masala bo''yicha ma''lumot olishimiz kerak:

(so''raladigan ma''lumot)

1. (savol)
2. (savol)
3. (savol)

So''ralgan ma''lumotni (muddat)gacha taqdim etishingizni so''raymiz.

(lavozimi)                         ___________
                                     (imzo)
',
   '', 'DOCX', '14 KB', 1250, ARRAY['so''rov', 'xat'], true, '2026-05-15')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  law_ref = EXCLUDED.law_ref,
  format = EXCLUDED.format,
  file_size = EXCLUDED.file_size,
  downloads = EXCLUDED.downloads,
  tags = EXCLUDED.tags,
  is_active = true,
  updated_at = NOW();
