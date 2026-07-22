-- ============================================================
-- JURISAI — Uzbekistan Legal Database Seed Script
-- O'zbekiston Respublikasi Qonunchiligi asosiy kodifikatsiyalari
-- ============================================================
-- Run this in Supabase SQL Editor after migrations are applied.
-- This seeds the legal_documents table with foundational laws.

-- Helper: ensure pgvector extension exists for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Clear existing seed data to avoid duplicates
DELETE FROM legal_documents WHERE jurisdiction = 'uzbekistan' AND language = 'uz';

-- ============================================================
-- 1. O'ZBEKISTON RESPUBLIKASI KONSTITUTSIYASI (Constitution)
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('O''zbekiston Respublikasi Konstitutsiyasi — 1-modda', 
 'O''zbekiston — boshqaruvning respublika shakliga ega bo''lgan suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlatdir. Davlat o''z xalqining irodasini ifoda etadi va uning manfaatlariga xizmat qiladi.',
 'constitution', '1-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 2-modda',
 'Davlat xalq nomidan ish yuritadi va uning vakolatli organlari, shuningdek, saylovlar, referendumlar orqali ifoda etilgan xalq irodasiga asoslanadi.',
 'constitution', '2-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 7-modda',
 'O''zbekiston Respublikasida davlat hokimiyatining bo''linishi prinsipi amal qiladi: qonun chiqaruvchi, ijro etuvchi va sud hokimiyati.',
 'constitution', '7-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 13-modda',
 'O''zbekiston Respublikasida demokratiya umuminsoniy prinsiplarga asoslanadi, ularga ko''ra inson, uning hayoti, erkinligi, sha''ni, qadr-qimmati va boshqa daxisiz huquqlari oliy qadriyat hisoblanadi.',
 'constitution', '13-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 14-modda',
 'Davlat o''z faoliyatini inson va jamiyat farovonligini ta''minlash, ijtimoiy adolat, qonuniylik, fuqarolarning teng huquqliligi va ijtimoiy sheriklik prinsiplari asosida tashkil etadi.',
 'constitution', '14-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 15-modda',
 'O''zbekiston Respublikasida O''zbekiston Respublikasining Konstitutsiyasi va qonunlarining ustunligi tan olinadi. Davlat, uning organlari, mansabdor shaxslar, jamoat birlashmalari, fuqarolar Konstitutsiya va qonunlarga muvofiq ish olib boradilar.',
 'constitution', '15-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 19-modda',
 'O''zbekiston Respublikasida insonning huquq va erkinliklari xalqaro huquqning umume''tirof etilgan normalariga muvofiq tan olinadi va kafolatlanadi. Inson huquq va erkinliklari har kimga tug''ilganidan boshlab tegishlidir.',
 'constitution', '19-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 24-modda',
 'Hayot saqlash huquqi — har bir insonning daxisiz huquqidir. Har kimning hayotiga suiqasd qilish eng og''ir jinoyat hisoblanadi.',
 'constitution', '24-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 25-modda',
 'Inson erkinligi va shaxsiy daxisizlik huquqiga ega. Hech kim qonun asoslarisiz hibsga olinishi, ushlanishi yoki boshqa tarzda erkinlikdan mahrum etilishi mumkin emas.',
 'constitution', '25-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 27-modda',
 'Har kim o''z sha''ni va qadr-qimmatiga tajovuz qilinishidan, shaxsiy hayotiga aralashishdan himoyalanish huquqiga ega. Shaxsning faxriy va qadr-qimmatini kamsituvchi ma''lumotlar tarqatilishidan himoya qilish davlat tomonidan kafolatlanadi.',
 'constitution', '27-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 29-modda',
 'Har kim fikrlash, so''z, e''tiqod erkinligi huquqiga ega. Har kim o''zi istagan ma''lumotni izlash, olish va tarqatish huquqiga ega.',
 'constitution', '29-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 36-modda',
 'Har kim mulkdor bo''lish huquqiga ega. Bankdagi omonatlar, meros huquqi qonun bilan kafolatlanadi. Mulkni musodara qilish faqat sud qaroriga asosan amalga oshirilishi mumkin.',
 'constitution', '36-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 37-modda',
 'Har kim mehnat qilish, erkin kasb tanlash, adolatli mehnat sharoitlarida ishlash huquqiga ega. Majburiy mehnat taqiqlanadi.',
 'constitution', '37-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 44-modda',
 'Har kimga o''z huquq va erkinliklarini sud orqali himoya qilish, davlat organlari, mansabdor shaxslarning qonunga xilof harakatlari ustidan sudga shikoyat qilish huquqi kafolatlanadi.',
 'constitution', '44-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 46-modda',
 'O''zbekiston Respublikasi fuqarolari qonun oldida tengdirlar va hech kim ijtimoiy mavqei, irqi, millati, jinsi, tili, diniga, e''tiqodiga qarab imtiyozga ega bo''lishi yoki kamsitilishi mumkin emas.',
 'constitution', '46-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 48-modda',
 'Har kim jismoniy va ma''naviy sog''lig''ini saqlashga, malakali tibbiy xizmat olishga, davlat va jamoat sog''liqni saqlash tizimidan foydalanishga haqli.',
 'constitution', '48-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 50-modda',
 'Fuqarolar Konstitutsiya va qonunlarga rioya etishga, boshqa shaxslarning huquqlari, erkinliklari, sha''ni va qadr-qimmatiga hurmat bilan munosabatda bo''lishga majburdirlar.',
 'constitution', '50-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 55-modda',
 'O''zbekiston Respublikasi Prezidenti davlat boshlig''i hisoblanadi va davlat hokimiyatining birligini, Konstitutsiya va qonunlarning buzilmasligini, inson huquq va erkinliklarining himoya qilinishini ta''minlaydi.',
 'constitution', '55-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 78-modda',
 'O''zbekiston Respublikasining Oliy Majlisi — qonun chiqaruvchi hokimiyatni amalga oshiruvchi oliy davlat organidir. U Qonunchilik palatasi va Senatdan iborat ikki palatali parlamenti hisoblanadi.',
 'constitution', '78-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 99-modda',
 'O''zbekiston Respublikasining Vazirlar Mahkamasi ijro etuvchi hokimiyatni amalga oshiradi. Vazirlar Mahkamasi O''zbekiston Respublikasi Prezidenti va Oliy Majlis oldida javobgardir.',
 'constitution', '99-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 106-modda',
 'O''zbekiston Respublikasida sud hokimiyati qonun chiqaruvchi va ijro etuvchi hokimiyatlardan mustaqil holda faoliyat ko''rsatadi. Sudyalar mustaqildirlar va faqat qonunga bo''ysunadilar.',
 'constitution', '106-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 109-modda',
 ' Sudyalar daxlsizdirlar. Sudyaga jinoiy javobgarlik faqat qonunda belgilangan tartibda qo''llaniladi.',
 'constitution', '109-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 110-modda',
 'Sud hokimiyatining asosiy prinsiplari: sudya mustaqilligi, ishlarning ochiq ko''rib chiqilishi, raqobatchilik va taraflarning teng huquqliligi, ayblanuvchining himoya huquqi.',
 'constitution', '110-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 115-modda',
 'O''zbekiston Respublikasida Har bir insonga uning roziligisiz turar joyidan mahrum etilish, uning turar joyiga kirish, tintuv o''tkazish faqat qonunda belgilangan asoslar va tartibda amalga oshiriladi.',
 'constitution', '115-modda', 'uzbekistan', 'uz'),

('O''zbekiston Respublikasi Konstitutsiyasi — 128-modda',
 'O''zbekiston Respublikasi prokuraturasi o''z vakolatlari doirasida qonunlarning aniq va bir xilda ijro etilishi ustidan nazoratni amalga oshiradi.',
 'constitution', '128-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 2. FUQAROLIK KODEKSI (Civil Code — FK)
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Fuqarolik Kodeksi — 1-modda. Fuqarolik qonunchiligining asosiy prinsiplari',
 'Fuqarolik qonunchiligi mulkiy va mulkiy emas shaxsiy munosabatlarni, shuningdek, mulk egalik qilish, undan foydalanish va uni tasarruf etish bilan bog''liq munosabatlarni tartibga soladi. Fuqarolik qonunchiligining asosiy prinsiplari: taraflarning tengligi, mulk daxlsizligi, shartnoma erkinligi, fuqarolik huquqlarini buzilishining oldini olish.',
 'civil_code', '1-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 8-modda. Fuqarolik huquq va majburiyatlarining vujudga kelish asoslari',
 'Fuqarolik huquq va majburiyatlari qonun hujjatlarida nazarda tutilgan asoslardan, shuningdek, insonning umumiy huquq va erkinliklaridan kelib chiqadigan, qonunga zid bo''lmagan harakatlardan vujudga keladi.',
 'civil_code', '8-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 9-modda. Fuqarolarning huquqiy layoqati',
 'Fuqarolik huquq layoqati — fuqaroning fuqarolik huquq va majburiyatlariga ega bo''lish qobiliyati. U hamma fuqarolar uchun teng ravishda, tug''ilgan paytdan e''tiboran tan olinadi.',
 'civil_code', '9-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 17-modda. Yuridik shaxslarning huquq layoqati',
 'Yuridik shaxs ta''sis hujjatlarida belgilangan faoliyat maqsadlariga mos keladigan fuqarolik huquqlariga ega bo''lishi va majburiyatlarini bajarishi mumkin.',
 'civil_code', '17-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 21-modda. Bitim tushunchasi',
 'Bitimlar deb fuqarolik huquq va majburiyatlarini belgilash, o''zgartirish yoki bekor qilishga qaratilgan fuqarolar va yuridik shaxslarning harakatlari tan olinadi.',
 'civil_code', '21-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 29-modda. Shartnoma tushunchasi',
 'Shartnoma deb ikki yoki bir necha shaxsning fuqarolik huquq va majburiyatlarini belgilash, o''zgartirish yoki bekor qilish to''g''risidagi kelishuvi tan olinadi.',
 'civil_code', '29-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 33-modda. Shartnoma erkinligi',
 'Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar. Taraflarning o''z ixtiyori bilan shartnoma tuzish, shartnoma mazmunini belgilash huquqi majburan cheklanishiga yo''l qo''yilmaydi.',
 'civil_code', '33-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 83-modda. Zararni qoplash',
 'Shaxsning mulkiga etkazilgan zarar, shuningdek, uning shaxsiy nomulkiy huquqlariga etkazilgan zarar, agar qonunda boshqacha tartib nazarda tutilmagan bo''lsa, to''liq hajmda qoplanishi kerak.',
 'civil_code', '83-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 84-modda. Ma''naviy zararni qoplash',
 'Agar fuqaroning shaxsiy nomulkiy huquqlari buzilgan yoki unga tegishli nomoddiy ne''matlarga tajovuz qilingan bo''lsa, fuqaro ma''naviy zararni qoplashni talab qilishga haqli.',
 'civil_code', '84-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 99-modda. Mulk huquqi tushunchasi',
 'Mulk huquqi — subyektning o''z mulkiga egalik qilish, undan foydalanish va uni tasarruf etish huquqidir. Mulk huquqi egalik qilish, foydalanish va tasarruf etish vakolatlarini o''z ichiga oladi.',
 'civil_code', '99-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 100-modda. Mulk daxlsizligi',
 'Hech kim o''z mulkidan qonunda belgilangan asoslardan tashqari mahrum etilishi mumkin emas. Mulkni begonalashtirish faqat sud qaroriga asosan amalga oshiriladi.',
 'civil_code', '100-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 150-modda. Ijaraga topshirish',
 'Ijara shartnomasi bo''yicha ijaraga beruvchi ijarachiga haq evaziga mulkdan vaqtincha foydalanish uchun berish majburiyatini oladi. Ijara shartnomasi yozma shaklda tuziladi.',
 'civil_code', '150-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 200-modda. Meros tushunchasi',
 'Meros — meros qoldiruvchiga tegishli bo''lgan huquq va majburiyatlarning merosxo''rlarga o''tishidir. Meros qonun bo''yicha va vasiyat bo''yicha meros qilib olinadi.',
 'civil_code', '200-modda', 'uzbekistan', 'uz'),

('Fuqarolik Kodeksi — 210-modda. Merosxo''rlar doirasi',
 'Qonun bo''yicha merosxo''rlar: birinchi navbat — meros qoldiruvchining bolalari, turmush o''rtog''i va ota-onasi; ikkinchi navbat — meros qoldiruvchining aka-uka va opa-singillari; uchinchi navbat — meros qoldiruvchining buvisi va bobosi.',
 'civil_code', '210-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 3. JINOYAT KODEKSI (Criminal Code — JK)
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Jinoyat Kodeksi — 1-modda. Jinoyat qonunchiligining vazifalari',
 'O''zbekiston Respublikasining jinoyat qonunchiligi ijtimoiy tuzumni, mulkni, shaxsni, fuqarolarning huquq va erkinliklarini, jamoat tartibini hamda jinoyat tajovuzlaridan qonuniylikni himoya qilish vazifasini bajaradi.',
 'criminal_code', '1-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 96-modda. Qasddan odam o''ldirish',
 'Qasddan odam o''ldirish, ya''ni boshqa shaxsga qasddan o''lim yetkazish, o''n uch yildan yigirma yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '96-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 97-modda. Qasddan odam o''ldirish (og''irlashtiruvchi holatlar)',
 'Qasddan odam o''ldirish: a) ikki yoki undan ortiq shaxsga nisbatan; b) o''zining xizmat vazifasini bajarayotgan shaxsga nisbatan; v) ayniqsa shafqatsiz usulda; g) umumxavfli usulda sodir etilgan bo''lsa, o''n olti yildan yigirma besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '97-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 98-modda. Qasddan badanga og''ir shikast yetkazish',
 'Qasddan badanga og''ir shikast yetkazish, ya''ni hayot uchun xavfli bo''lgan tan jarohati yetkazish, sog''liqning buzilishiga yoki mehnat qobiliyatining sezilarli darajada yo''qolishiga sabab bo''lsa, besh yildan o''n yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '98-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 100-modda. Qiynoqlar',
 'Qiynoqlar — mansabdor shaxs tomonidan jabrlanuvchiga jismoniy yoki ma''naviy azob berish. Uch yildan yetti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '100-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 104-modda. Nomusga tegish',
 'Nomusga tegish — zo''rlik ishlatib yoki zo''rlik ishlatish bilan qo''rqitib jinsiy aloqa qilish. O''n yildan o'n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '104-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 105-modda. Voyaga yetmagan shaxs bilan jinsiy aloqa qilish',
 'O''n olti yoshga to''lmagan shaxs bilan jinsiy aloqa qilish — uch yildan yetti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '105-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 110-modda. O''g''rilik',
 'O''g''rilik, ya''ni birovning mulkini yashirin ravishda talon-taroj qilish — eng kam ish haqining ellik baravaridan yuz baravarigacha miqdorda jarima yoki uch yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '110-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 111-modda. Talonchilik',
 'Talonchilik — ochiqdan-ochiq birovning mulkini talon-taroj qilish. Agar zo''rlik ishlatilmasdan sodir etilgan bo''lsa, uch yildan yetti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '111-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 112-modda. Bosqinchilik',
 'Bosqinchilik — birovning mulkini egallash maqsadida hujum qilib talon-taroj qilish, hayot va sog''liq uchun xavfli zo''rlik ishlatish — o''n yildan o''n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '112-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 113-modda. To''lovga qodir emaslik',
 'To''lovga qodir emaslik — tadbirkorlik faoliyati davomida kreditorlarga zarar yetkazish. Agar qasddan sodir etilgan bo''lsa, uch yildan besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '113-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 120-modda. Firibgarlik',
 'Firibgarlik — ishonchni suiiste''mol qilish yoki aldash yo''li bilan birovning mulkini yoki mulk huquqini qo''lga kiritish. Besh yildan o''n yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '120-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 130-modda. Giyohvandlik vositalarining noqonuniy aylanishi',
 'Giyohvandlik vositalari yoki psixotrop moddalarning noqonuniy muomalasi — o''n yildan yigirma yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '130-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 141-modda. Terrorizm',
 'Terrorizm — davlat, jamiyat yoki shaxslarni qo''rqitishga qaratilgan portlatish, o''t qo''yish yoki boshqa xavfli harakatlarni sodir etish. O''n besh yildan yigirma besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '141-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 143-modda. Korrupsiya (pora olish)',
 'Mansabdor shaxs tomonidan porani olish — o''z xizmat vazifasini bajarish uchun moddiy qiymatga ega bo''lgan narsalarni olish. Besh yildan o''n yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '143-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 144-modda. Pora berish',
 'Mansabdor shaxsga pora berish — uch yildan yetti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '144-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 145-modda. Hokimiyatni suiiste''mol qilish',
 'Mansabdor shaxs tomonidan o''z xizmat vakolatlarini suiiste''mol qilish, agar bu davlat yoki jamoat manfaatlariga, fuqarolarning huquq va qonuniy manfaatlariga zarar yetkazsa, uch yildan o''n yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '145-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 165-modda. Avtotransport harakati xavfsizligini buzish',
 'Avtotransport vositasining harakati xavfsizligini buzish, og''ir oqibatlarga olib kelgan bo''lsa, uch yildan yetti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '165-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 168-modda. Mast holatida transport vositasini boshqarish',
 'Transport vositasini mast holatida boshqarish — uch yilgacha transport vositasini boshqarish huquqidan mahrum qilish yoki o''n besh sutkagacha ma''muriy qamoq bilan jazolanadi.',
 'criminal_code', '168-modda', 'uzbekistan', 'uz'),

('Jinoyat Kodeksi — 184-modda. Voyaga yetmaganlarni jinoyatga jalb qilish',
 'Voyaga yetmagan shaxsni jinoyat sodir etishga jalb qilish — uch yildan besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.',
 'criminal_code', '184-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 4. MEHNAT KODEKSI (Labor Code — MK)
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Mehnat Kodeksi — 1-modda. Mehnat qonunchiligining vazifalari',
 'Mehnat qonunchiligi xodimlar va ish beruvchilar o''rtasidagi mehnat munosabatlarini, shuningdek, ular bilan bevosita bog''liq bo''lgan boshqa munosabatlarni tartibga soladi.',
 'labor_code', '1-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 7-modda. Majburiy mehnatni taqiqlash',
 'O''zbekiston Respublikasida majburiy mehnat taqiqlanadi. Majburiy mehnat — jismoniy yoki ma''naviy zo''rlik ishlatib, mehnatni muntazam bajarishga majburlashdir.',
 'labor_code', '7-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 15-modda. Mehnat shartnomasi',
 'Mehnat shartnomasi — xodim va ish beruvchi o''rtasidagi kelishuv bo''lib, unga ko''ra xodim ma''lum bir mutaxassislik bo''yicha ish bajaradi, ish beruvchi esa ish haqini to''lash va mehnat sharoitlarini ta''minlash majburiyatini oladi.',
 'labor_code', '15-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 16-modda. Mehnat shartnomasining mazmuni',
 'Mehnat shartnomasi quyidagi ma''lumotlarni o''z ichiga olishi kerak: taraflar, ish joyi, mehnat vazifasi, mehnatga haq to''lash shartlari, ish vaqti va dam olish vaqti, ta''til muddati.',
 'labor_code', '16-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 18-modda. Sinov muddati',
 'Mehnat shartnomasida sinov muddati nazarda tutilishi mumkin. Sinov muddati uch oydan, rahbar xodimlar uchun olti oydan oshmasligi kerak.',
 'labor_code', '18-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 36-modda. Mehnat shartnomasini bekor qilish',
 'Mehnat shartnomasi taraflarning kelishuvi bilan, muddat tugashi bilan, xodimning tashabbusi bilan yoki ish beruvchining tashabbusi bilan bekor qilinishi mumkin.',
 'labor_code', '36-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 38-modda. Ish beruvchining tashabbusi bilan shartnomani bekor qilish',
 'Ish beruvchi mehnat shartnomasini quyidagi hollarda bekor qilishi mumkin: tashkilot tugatilganda; xodimning malakasi yetarli bo''lmaganda; xodim mehnat intizomini qo''pol ravishda buzganda; xodim o''z mehnat vazifalarini muntazam ravishda bajarmaganda.',
 'labor_code', '38-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 50-modda. Ish haqi',
 'Ish haqi xodimning malakasiga, bajarilgan ishning murakkabligiga, miqdoriga va sifatiga qarab belgilanadi. Ish haqi eng kam ish haqidan past bo''lishi mumkin emas.',
 'labor_code', '50-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 52-modda. Eng kam ish haqi',
 'Eng kam ish haqi O''zbekiston Respublikasining Davlat budjeti to''g''risidagi qonun bilan har yili belgilanadi va qayta ko''rib chiqiladi.',
 'labor_code', '52-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 56-modda. Ish vaqtining davomiyligi',
 'Ish vaqtining normal davomiyligi haftasiga qirq soatdan oshmasligi kerak. Ba''zi toifadagi xodimlar uchun qisqartirilgan ish vaqti belgilanishi mumkin.',
 'labor_code', '56-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 60-modda. Dam olish vaqti',
 'Haftalik uzluksiz dam olish vaqti qirq ikki soatdan kam bo''lmasligi kerak. Ta''tilning davomiyligi kamida yigirma bir ish kunini tashkil etadi.',
 'labor_code', '60-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 66-modda. Yillik mehnat ta''tili',
 'Xodimlarga har yili kamida yigirma bir ish kuni davom etadigan yillik mehnat ta''tili beriladi. Ba''zi toifadagi xodimlar uchun qo''shimcha ta''tillar belgilanishi mumkin.',
 'labor_code', '66-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 79-modda. Xodimning moddiy javobgarligi',
 'Xodim ish beruvchiga yetkazilgan zarar uchun moddiy javobgar bo''ladi. Xodimning moddiy javobgarligi uning o''rtacha oylik ish haqidan oshmasligi kerak.',
 'labor_code', '79-modda', 'uzbekistan', 'uz'),

('Mehnat Kodeksi — 87-modda. Mehnat nizolari',
 'Yakka mehnat nizolari mehnat komissiyalari va sudlar tomonidan ko''rib chiqiladi. Jamoa mehnat nizolari va ish tashlashlar qonun hujjatlariga muvofiq tartibga solinadi.',
 'labor_code', '87-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 5. OILA KODEKSI (Family Code — OK)
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Oila Kodeksi — 1-modda. Oila qonunchiligining vazifalari',
 'Oila qonunchiligi oilaviy munosabatlarni, nikoh tuzish tartibini, nikohni bekor qilishni, ota-onalarning farzandlar oldidagi huquq va majburiyatlarini tartibga soladi.',
 'family_code', '1-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 3-modda. Oila va davlat munosabatlari',
 'Oila davlat himoyasidadir. O''zbekiston Respublikasida nikoh ixtiyoriy, erkak va ayolning teng huquqliligi asosiga qurilgan.',
 'family_code', '3-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 5-modda. Nikoh tuzish tartibi',
 'Nikoh FHDYo organlarida tuziladi. Nikoh tuzish uchun erkak va ayolning o''zaro ixtiyoriy roziligi va ularning nikoh yoshiga etgan bo''lishi talab etiladi.',
 'family_code', '5-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 10-modda. Nikoh yoshi',
 'Nikoh yoshi o''n sakkiz yosh etib belgilanadi. Alohida hollarda, uzrli sabablar bo''lganda, nikoh yoshi bir yildan ko''p bo''lmagan muddatga kamaytirilishi mumkin.',
 'family_code', '10-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 12-modda. Nikoh tuzishga to''sqinlik qiluvchi holatlar',
 'Nikoh tuzishga quyidagi holatlar to''sqinlik qiladi: kamida bir tomon boshqa ro''yxatdan o''tgan nikohda bo''lsa; yaqin qarindoshlar o''rtasida; farzandlikka oluvchi va farzandlikka olingan bola o''rtasida; tomonlardan biri muomalaga layoqatsiz deb topilgan bo''lsa.',
 'family_code', '12-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 18-modda. Nikohni bekor qilish',
 'Nikoh er-xotinning arizasiga ko''ra yoki er-xotindan birining arizasiga ko''ra sud organlari tomonidan bekor qilinadi.',
 'family_code', '18-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 21-modda. Er-xotinning mulki',
 'Nikoh davrida orttirilgan mulk — er-xotinning umumiy mulki hisoblanadi. Nikohdan oldin har bir tomonga tegishli bo''lgan mulk, shuningdek, meros yoki hadya tariqasida olingan mulk har bir tomonning alohida mulki hisoblanadi.',
 'family_code', '21-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 30-modda. Ota-onalarning huquq va majburiyatlari',
 'Ota-onalar o''z farzandlari oldida teng huquq va majburiyatlarga ega. Ota-onalar farzandlarining tarbiyasi, ta''limi va sog''lig''i uchun javobgardirlar.',
 'family_code', '30-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 32-modda. Farzandlarning mulk huquqi',
 'Farzandlar ota-onasining mulkiga egalik huquqiga ega emas, ota-onalar esa farzandlarining mulkiga egalik huquqiga ega emas. Farzandlar ota-onalari bilan birga yashaganda, ular o''zaro kelishuv asosida mulkdan foydalanadilar.',
 'family_code', '32-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 35-modda. Aliment to''lash majburiyati',
 'Ota-onalar o''z farzandlarini moddiy ta''minlash majburiyatiga egadirlar. Agar ota-ona farzandidan alohida yashasa, u aliment to''lashi shart. Aliment miqdori: bir bola uchun — daromadning 1/4 qismi, ikki bola uchun — 1/3 qismi, uch va undan ortiq bola uchun — 1/2 qismi.',
 'family_code', '35-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 40-modda. Farzandlikka olish',
 'Farzandlikka olish sud tomonidan amalga oshiriladi. Farzandlikka olishda farzandlikka oluvchi va farzandlikka olinadigan bolaning manfaatlari hisobga olinadi. Farzandlikka olish siri qonun bilan himoya qilinadi.',
 'family_code', '40-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 45-modda. Nikoh shartnomasi',
 'Nikoh tuzayotgan shaxslar yoki er-xotinlar o''zlarining mulkiy huquq va majburiyatlarini belgilovchi nikoh shartnomasini tuzishga haqlidirlar. Nikoh shartnomasi yozma shaklda tuziladi va notarial tasdiqlanishi kerak.',
 'family_code', '45-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 50-modda. Bolalarni himoya qilish',
 'Davlat bolalarning huquqlarini, erkinliklarini va qonuniy manfaatlarini himoya qilishni ta''minlaydi. Bolalarga nisbatan zo''ravonlik, munosabatda qo''pollik, haqoratlash va ularning sha''nini kamsitish taqiqlanadi.',
 'family_code', '50-modda', 'uzbekistan', 'uz'),

('Oila Kodeksi — 52-modda. Homiy va vasiylik',
 'Vasiylik va homiylik organlari ota-ona qaramog''isiz qolgan bolalarning huquqlarini himoya qilish uchun tashkil etiladi.',
 'family_code', '52-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 6. PROTSESSUAL KODEKSLAR (Procedural Codes)
-- ============================================================

-- 6a. FPK — Fuqarolik Protsessual Kodeksi
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Fuqarolik Protsessual Kodeksi — 1-modda. Fuqarolik protsessual qonunchiligining vazifalari',
 'Fuqarolik protsessual qonunchiligining vazifalari fuqarolik ishlarini to''g''ri va o''z vaqtida ko''rib chiqish va hal qilish, fuqarolarning buzilgan yoki bahsli huquqlari, erkinliklari va qonun bilan qo''riqlanadigan manfaatlarini himoya qilishdan iborat.',
 'procedural_code', 'FPK 1-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 5-modda. Sudga murojaat qilish huquqi',
 'Har bir manfaatdor shaxs o''z huquq va erkinliklarini himoya qilish uchun sudga murojaat qilish huquqiga ega. Sudga murojaat qilish qonunda belgilangan tartibda amalga oshiriladi.',
 'procedural_code', 'FPK 5-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 10-modda. Da''vo arizasi',
 'Da''vo arizasi yozma shaklda beriladi. Arizada: sud nomi, da''vogar va javobgar to''g''risidagi ma''lumotlar, da''voning mazmuni, da''vogarning talabi va uning asoslari ko''rsatilishi kerak.',
 'procedural_code', 'FPK 10-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 15-modda. Dalillar',
 'Dalillar deb ishni to''g''ri hal qilish uchun ahamiyatga ega bo''lgan faktlar mavjudligini tasdiqlovchi qonuniy tartibda olingan ma''lumotlarga aytiladi. Dalillar: tushuntirishlar, ko''rsatmalar, yozma va ashyoviy dalillar, ekspert xulosalari.',
 'procedural_code', 'FPK 15-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 20-modda. Sud majlisining ochiqligi',
 'Sud majlisida ishlarni ko''rish ochiq tarzda amalga oshiriladi. Yopiq sud majlisida ishlarni ko''rishga faqat qonunda nazarda tutilgan hollarda yo''l qo''yiladi.',
 'procedural_code', 'FPK 20-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 35-modda. Sud qarori',
 'Sud qarori qonuniy va asosli bo''lishi kerak. Sud qaror chiqarishda dalillarni to''liq va har tomonlama baholaydi.',
 'procedural_code', 'FPK 35-modda', 'uzbekistan', 'uz'),
('Fuqarolik Protsessual Kodeksi — 40-modda. Apellyatsiya shikoyati',
 'Sud qarori ustidan apellyatsiya shikoyati qaror chiqarilgan kundan e''tiboran bir oy muddat ichida berilishi mumkin. Apellyatsiya shikoyati qarorni chiqargan sud orqali yuqori sudga yuboriladi.',
 'procedural_code', 'FPK 40-modda', 'uzbekistan', 'uz');

-- 6b. JPK — Jinoiy Protsessual Kodeksi
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Jinoiy Protsessual Kodeksi — 1-modda. Jinoyat protsessining vazifalari',
 'Jinoyat protsessining vazifalari jinoyatlarni tez va to''liq ochish, aybdorlarni fosh etish va ularga nisbatan qonuniy jazo qo''llash, hech kim aybsiz ravishda jinoiy javobgarlikka tortilmasligini ta''minlashdan iborat.',
 'procedural_code', 'JPK 1-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 5-modda. Aybsizlik prezumptsiyasi',
 'Ayblanuvchi uning aybi qonuniy tartibda, ya''ni sud hukmi bilan isbotlanmaguncha aybsiz hisoblanadi. Barcha shubhalar ayblanuvchi foydasiga talqin qilinadi.',
 'procedural_code', 'JPK 5-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 10-modda. Himoya huquqi',
 'Ayblanuvchi o''zini himoya qilish huquqiga ega. Himoya huquqiga: himoyachiga ega bo''lish, ayblov bilan tanishish, dalillar taqdim etish, e''tiroz bildirish kiradi.',
 'procedural_code', 'JPK 10-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 15-modda. Tintuv',
 'Tintuv — yashirin yoki olib qo''yilgan narsalarni topish maqsadida xonani, binoni yoki boshqa joyni tekshirish. Tintuv sud sanksiyasi bilan yoki qonunda nazarda tutilgan tartibda o''tkaziladi.',
 'procedural_code', 'JPK 15-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 20-modda. Prokuror nazorati',
 'Prokuror jinoyat protsessida qonunlarga rioya etilishi ustidan nazoratni amalga oshiradi. Prokuror tergovchi va surishtiruvchining protsessual harakatlarining qonuniyligini tekshiradi.',
 'procedural_code', 'JPK 20-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 25-modda. Sud hukmi',
 'Sud hukmi qonuniy, asosli va adolatli bo''lishi kerak. Hukm sud tomonidan dalillarni har tomonlama, to''liq va xolisona baholash asosida chiqariladi.',
 'procedural_code', 'JPK 25-modda', 'uzbekistan', 'uz'),
('Jinoiy Protsessual Kodeksi — 30-modda. Kassatsiya shikoyati',
 'Hukm ustidan kassatsiya shikoyati berish muddati — hukm chiqarilgan kundan e''tiboran bir oy. Kassatsiya instantsiyasi hukmning qonuniyligi va asosliligini tekshiradi.',
 'procedural_code', 'JPK 30-modda', 'uzbekistan', 'uz');

-- 6c. IPK — Iqtisodiy Protsessual Kodeksi
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Iqtisodiy Protsessual Kodeksi — 1-modda. Iqtisodiy sudlovning vazifalari',
 'Iqtisodiy protsessual qonunchiligi tadbirkorlik va boshqa iqtisodiy faoliyat sohasidagi nizolarni, shuningdek, iqtisodiy sudga taalluqli boshqa ishlarni ko''rib chiqish va hal qilish tartibini belgilaydi.',
 'procedural_code', 'IPK 1-modda', 'uzbekistan', 'uz'),
('Iqtisodiy Protsessual Kodeksi — 3-modda. Iqtisodiy sudga murojaat qilish',
 'Yuridik shaxslar va tadbirkorlar iqtisodiy nizolarni hal qilish uchun iqtisodiy sudga murojaat qilish huquqiga ega. Murojaat yozma shaklda bo''lishi kerak.',
 'procedural_code', 'IPK 3-modda', 'uzbekistan', 'uz'),
('Iqtisodiy Protsessual Kodeksi — 8-modda. Nizoni tinch yo''l bilan hal qilish',
 'Iqtisodiy sud ishni qo''zg''atishdan oldin tomonlarga nizoni tinch yo''l bilan hal qilish choralarini ko''rishni tavsiya etishi mumkin. Tomonlar kelishuv bitimini tuzishga haqlidirlar.',
 'procedural_code', 'IPK 8-modda', 'uzbekistan', 'uz'),
('Iqtisodiy Protsessual Kodeksi — 15-modda. Iqtisodiy sud qarori',
 'Iqtisodiy sud qarori qonuniy kuchga kirgandan so''ng barcha davlat organlari, tashkilotlar va shaxslar uchun majburiydir. Qaror ustidan apellyatsiya berilishi mumkin.',
 'procedural_code', 'IPK 15-modda', 'uzbekistan', 'uz');

-- 6d. BSK — Ma''muriy Sud Ish Yurituvi Kodeksi
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Ma''muriy Sud Ish Yurituvi Kodeksi — 1-modda. Ma''muriy sudlovning vazifalari',
 'Ma''muriy sud ish yurituvi davlat organlari va mansabdor shaxslarning qarorlari, harakatlari yoki harakatsizligi ustidan berilgan shikoyatlarni ko''rib chiqish va hal qilish tartibini belgilaydi.',
 'procedural_code', 'BSK 1-modda', 'uzbekistan', 'uz'),
('Ma''muriy Sud Ish Yurituvi Kodeksi — 5-modda. Fuqaroning shikoyat qilish huquqi',
 'Har bir fuqaro davlat organlari va mansabdor shaxslarning qonunga xilof qarorlari, harakatlari yoki harakatsizligi ustidan ma''muriy sudga shikoyat qilish huquqiga ega.',
 'procedural_code', 'BSK 5-modda', 'uzbekistan', 'uz'),
('Ma''muriy Sud Ish Yurituvi Kodeksi — 10-modda. Shikoyat berish muddati',
 'Shikoyat qaror, harakat yoki harakatsizlik to''g''risida bilgan yoki bilishi kerak bo''lgan kundan e''tiboran bir oy muddat ichida berilishi mumkin.',
 'procedural_code', 'BSK 10-modda', 'uzbekistan', 'uz');

-- ============================================================
-- 7. O'K — O'zbekiston Respublikasining Ma'muriy Javobgarlik To'g'risidagi Kodeksi
-- ============================================================
INSERT INTO legal_documents (title, content, document_type, article_reference, jurisdiction, language) VALUES
('Ma''muriy javobgarlik to''g''risidagi kodeks — 1-modda. Ma''muriy javobgarlik asoslari',
 'Ma''muriy javobgarlik — jismoniy va yuridik shaxslarning ma''muriy huquqbuzarlik sodir etganligi uchun qonunda belgilangan javobgarligi.',
 'administrative_code', 'MJtK 1-modda', 'uzbekistan', 'uz'),
('Ma''muriy javobgarlik to''g''risidagi kodeks — 15-modda. Jarima',
 'Ma''muriy jarima — pul ko''rinishidagi jazo. Jarima miqdori eng kam ish haqining bir qismi yoki bir necha barobarida belgilanadi.',
 'administrative_code', 'MJtK 15-modda', 'uzbekistan', 'uz'),
('Ma''muriy javobgarlik to''g''risidagi kodeks — 20-modda. Ma''muriy huquqbuzarlik to''g''risidagi ishni ko''rib chiqish',
 'Ma''muriy huquqbuzarlik to''g''risidagi ish vakolatli organ (mansabdor shaxs) tomonidan huquqbuzarlik bayonnomasi tuzilgan kundan e''tiboran o''n besh kun muddatda ko''rib chiqiladi.',
 'administrative_code', 'MJtK 20-modda', 'uzbekistan', 'uz');

-- ============================================================
-- Indexes for better search performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_legal_documents_jurisdiction_lang ON legal_documents(jurisdiction, language);
CREATE INDEX IF NOT EXISTS idx_legal_documents_document_type ON legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_article_ref ON legal_documents(article_reference);
