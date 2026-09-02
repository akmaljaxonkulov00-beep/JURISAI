-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: IRAC kazuslar qo'shish (10+ ta har bir kategoriya)
-- + Contact section default social links enabled
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Contact section default social links — ENABLED with example URLs ──
UPDATE public.site_settings SET value = 'true' WHERE key = 'social_telegram_enabled';
UPDATE public.site_settings SET value = 'https://t.me/juristiv' WHERE key = 'social_telegram' AND (value = '' OR value IS NULL);
UPDATE public.site_settings SET value = 'true' WHERE key = 'social_instagram_enabled';
UPDATE public.site_settings SET value = 'https://instagram.com/juristiv' WHERE key = 'social_instagram' AND (value = '' OR value IS NULL);

-- ── 2. IRAC Cases — Jinoyat huquqi (10 ta) ──────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('O''g''irlik — JK 169-modda', 'Sudlanuvchi A.A. Karimov supermarketdan 10 million so''m naqd pulni o''g''irlab ketdi. U 2 kundan keyin qo''lga olindi va aybini tan oldi. Jinoyat ishi ochildi. Sudlanuvchining oldida o''g''irlikning og''irlik darajasini aniqlash masalasi turadi.', 'jinoyat', 'easy', ARRAY['JK 169-modda', 'JK 47-modda']),
('Firibgarlik — JK 168-modda', 'B.T. Omonov "Invest Group" firibgarlik guruhiga 100 million so''m pul o''tkazdi. Guruh a''zolari pulni qaytarmay, yo''qolib ketdi. Firibgarlik jinoyatida ayblanmoqda. Omonov pullarini qaytarishni talab qilmoqda.', 'jinoyat', 'medium', ARRAY['JK 168-modda', 'JK 28-modda']),
('Hodisa sodir etish — JK 266-modda', 'Haydovchi R.K. tezlikni oshirib, piyodani urib yubordi. Piyoda og''ir tan jarohati oldi. Haydovchi voqea joyidan qochib ketdi. Keyinchalik qo''lga olindi. Jinoyat ishi ochildi.', 'jinoyat', 'medium', ARRAY['JK 266-modda', 'JK 267-modda']),
('Bosqinchilik — JK 164-modda', 'Guruh a''zolari kechasi uyga bostirib kirib, egalari bilan zo''rlik ishlatib, pul va qimmatbaho narsalarni o''g''irlab ketdi. Boshqa bir shahardagi uydan ham shunday hodisa sodir etilganligi aniqlandi.', 'jinoyat', 'hard', ARRAY['JK 164-modda', 'JK 170-modda', 'JK 22-modda']),
('Poraxo''rlik — JK 210-modda', 'Tashkilot mansabdor shaxsi xizmat ko''rsatganligi uchun tadbirkordan 5 million so''m pora oldi. Uning xonasi kuzatuv kamerasi orqali tasvirlangan. Poraxo''rlik jinoyatida ayblanmoqda.', 'jinoyat', 'medium', ARRAY['JK 210-modda', 'JK 211-modda']),
('Tovlamachilik — JK 165-modda', 'A.A. shaxs B.B. ni tasvirga olish orqali shantaj qilib, 20 million so''m talab qildi. B.B. politsiyaga murojaat qildi. Operativ tadbir o''tkazildi va A.A. qo''lga olindi.', 'jinoyat', 'hard', ARRAY['JK 165-modda', 'JK 166-modda']),
('Chet elga qochishga urinish — JK 223-modda', 'Sudlanuvchi J.D. jinoyat ishi yakunlanishidan oldin chegarani noqonuniy kesib o''tishga urindi. U ushlandi va qo''lga olindi. Qochishga tayyorgarlik ko''rganligi isbotlandi.', 'jinoyat', 'easy', ARRAY['JK 223-modda']),
('Voyaga yetmaganlarni jalb etish — JK 135-modda', 'A.A. voyaga yetmagan 15 yoshli bolani jinoyatga jalb qildi. Bolaga o''g''irlik qilishni o''rgatdi va uni birgalikda o''g''irlikka olib bordi. Voyaga yetmagan himoyasi masalasi ko''rib chiqilmoqda.', 'jinoyat', 'hard', ARRAY['JK 135-modda', 'JK 136-modda']),
('Valyuta firibgarligi — JK 228-modda', 'Moliyaviy kompaniya xodimi fuqarolardan valyuta sotib olish uchun pul yig''di, lekin valyutani bermadi va pullarni o''zlashtirdi. 50 dan ortiq jabrlanuvchi bor.', 'jinoyat', 'hard', ARRAY['JK 228-modda', 'JK 168-modda']),
('Bosqinchilik urinishi — JK 164-modda, 27-modda', 'Sudlanuvchi uyga bostirib kirishga tayyorgarlik ko''rdi, lekin qo''lga olinganidan oldin buzuq amalga oshirmadi. Jinoyatga tayyorgarlik ko''rish moddasi qo''llanilishi kerakligi masalasi.', 'jinoyat', 'easy', ARRAY['JK 27-modda', 'JK 164-modda'])
ON CONFLICT DO NOTHING;

-- ── 3. IRAC Cases — Fuqarolik huquqi (10 ta) ────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('Shartnoma buzilishi', 'BuildPro qurilish kompaniyasi va O''zbekiston Invest o''rtasida qurilish shartnomasi tuzildi. 6 oy ichida 5 qavatli uy qurishi kerak edi. 8 oy o''tganiga qaramay, qurilish hali yakunlanmagan. 50 million so''m zarar talab qilinmoqda.', 'fuqarolik', 'medium', ARRAY['FK 345-modda', 'FK 395-modda', 'FK 396-modda']),
('Meros nizosi', 'V.B. Toshmatov vafot etgan. Uning 3 nafar farzandi merosni bo''lishda kelisha olmadi. Toshkent shahridagi 3 xonali kvartira va 2 ta avtomobili bor. Farzandlardan biri boshqa shaharda yashaydi.', 'fuqarolik', 'medium', ARRAY['OK 1187-modda', 'OK 1192-modda', 'FK 1195-modda']),
('Ko''chmas mulk nizosi', 'Ikki qo''shni o''rtasida devor qurish masalasida kelishmovchilik yuzaga keldi. Har bir tomonga tegishli hudud chegaralari noto''g''ri ko''rsatilgan. Kadastro hujjatlari ikki xil ma''lumot ko''rsatmoqda.', 'fuqarolik', 'easy', ARRAY['FK 153-modda', 'FK 257-modda']),
('Qarz nizosi', 'A.A. B.B. ga 10 million so''m qarz berdi. Qarz shartnomasi tuzildi, lekin qarz muddati tugaganiga 6 oy bo''lganiga qaramay, B.B. qarzni qaytarmayapti. Qarzdanfoiz ham qo''llanilishi kerak.', 'fuqarolik', 'easy', ARRAY['FK 421-modda', 'FK 422-modda', 'FK 423-modda']),
('Tovar yetkazib berish shartnomasi', 'Kompaniya 100 tonna paxta sotib oldi. Shartnoma bo''yicha yetkazib berish muddati 30 kun edi. 60 kun o''tganiga qaramay, tovar hali yetkazilmadi. Zarar miqdori baholab chiqilmoqda.', 'fuqarolik', 'medium', ARRAY['FK 506-modda', 'FK 507-modda', 'FK 508-modda']),
('Egalik huquqini tasdiqlash', 'Fuqaro o''zining ko''chmas mulkiga egalik huquqini sud orqali tasdiqlashni so''ramoqda. Notarial hujjat topilmaydi, lekin ko''p yillar davomida foydalanib kelgan.', 'fuqarolik', 'hard', ARRAY['FK 253-modda', 'FK 254-modda', 'FK 255-modda']),
('Javobgarlik — yetkazilgan zarar', 'Kompaniya mahsulotining nuqsonli chiqishi natijasida iste''molchiga 2 million so''m zarar yetkazildi. Iste''molchi zararni qoplashni talab qilmoqda. Majburiy javobgarlik masalasi.', 'fuqarolik', 'medium', ARRAY['FK 400-modda', 'FK 401-modda']),
('Shartnoma bekor qilish', 'Tomonlardan biri shartnomaning bir tomonlama buzilganini da''vo qilib, shartnomaning bekor qililishini so''ramoqda. Boshqa tomon esa shartnomaning bajarilganini ta''kidlamoqda.', 'fuqarolik', 'medium', ARRAY['FK 346-modda', 'FK 347-modda']),
('Foydalanish huquqi', 'Ikki tashkilot o''rtasida mulkni foydalanish huquqi bo''yicha nizo yuzaga keldi. Bitta tashkilot mulkni ijaraga olgan, ikkinchisi esa o''zini haqli deb hisoblaydi.', 'fuqarolik', 'hard', ARRAY['FK 270-modda', 'FK 271-modda']),
('Noto''g''ri bajarilgan xizmat', 'Qurilish kompaniyasi tom qismini ta''mirlash ishlarini noto''g''ri bajarib, tom yomg''irdan o''ta boshladi. Buyurtmachi qayta ta''mirlash xarajatlarini da''vo qilmoqda.', 'fuqarolik', 'easy', ARRAY['FK 394-modda', 'FK 395-modda'])
ON CONFLICT DO NOTHING;

-- ── 4. IRAC Cases — Mehnat huquqi (10 ta) ───────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('Ishdan bo''shatish — MK 168', 'A.N. Karimov "TechSoft" kompaniyasida 3 yil ishlagan. 2024-yil 10-avgust kuni ish beruvchi uni ogohlantirmasdan ishdan bo''shatdi. Karimov mehnat shartnomasi buzilganini da''vo qilmoqda.', 'mehnat', 'medium', ARRAY['MK 100-modda', 'MK 161-modda', 'MK 168-modda']),
('Mehnat ta''tili huquqi', 'Xodim 2 yil davomida yillik mehnat ta''tilidan foydalanmagan. Ish beruvchi ta''til berishdan bosh tortmoqda. Xodim qonuniy huquqini talab qilmoqda.', 'mehnat', 'easy', ARRAY['MK 143-modda', 'MK 144-modda']),
('Oylik to''lov — kechiktirish', 'Ish beruvchi xodimlarning oylik maoshini 3 oydan beri to''lamayapti. Xodimlar mehnat nizosi komissiyasiga murojaat qilmoqda. Qancha miqdorda qarzdorlik borligi aniqlanmoqda.', 'mehnat', 'medium', ARRAY['MK 155-modda', 'MK 156-modda', 'MK 157-modda']),
('Mehnat shartnomasini buzish', 'Ish beruvchi xodimni ogohlantirmasdan lavozimidan tushirdi va maoshini kamaytirdi. Xodim mehnat huquqi buzilganini da''vo qilmoqda.', 'mehnat', 'medium', ARRAY['MK 98-modda', 'MK 99-modda', 'MK 100-modda']),
('Kasbiy kasallik', 'Xodim ish joyida kasbiy kasallikka chalingan. Ish beruvchi kasallik sababli ishdan bo''shatmoqda. Kasallikning kasbiy ekanligini tibbiy ekspertiza aniqlashi kerak.', 'mehnat', 'hard', ARRAY['MK 216-modda', 'MK 217-modda']),
('Mehnat intizomi buzilishi', 'Xodim ish vaqtida telefon bilan shug''ullanib, ish vaqtini samarasiz o''tkazgan. Ish beruvchi ogohlantirmasdan ishdan bo''shatdi. Mehnat intizomini buzish holati baholanmoqda.', 'mehnat', 'easy', ARRAY['MK 130-modda', 'MK 168-modda']),
('Tadbirkorlikda ishchilar huquqi', 'Xususiy korxonada 50 dan ortiq xodim ishlaydi. Ish beruvchi mehnat shartnomasi tuzmagan va ijtimoiy sug''urta to''lamagan. Xodimlar o''z huquqlarini talab qilmoqda.', 'mehnat', 'hard', ARRAY['MK 16-modda', 'MK 17-modda', 'MK 18-modda']),
('Qo''shimcha ish vaqti uchun to''lov', 'Xodimlar 2 oy davomida dam olish kunlarida ham ishlashga majbur qilingan. Qo''shimcha ish vaqti uchun to''lov amalga oshirilmagan. Xodimlar kompensatsiya talab qilmoqda.', 'mehnat', 'medium', ARRAY['MK 63-modda', 'MK 64-modda']),
('Mehnat daftarchasi', 'Xodim ishdan bo''shagandan keyin mehnat daftarchasini qaytarishdan bosh tortmoqda. Ish beruvchi yangi ishga qabul qilish uchun mehnat daftarchasi kerakligini aytmoqda.', 'mehnat', 'easy', ARRAY['MK 67-modda']),
('Staj hisoblash', 'Xodimning oldingi ish tajribasi stajiga kiritilmayapti. Bu esa uning ta''til huquqiga va pensiya stajiga ta''sir qilmoqda. Stajning to''g''ri hisoblanishi masalasi.', 'mehnat', 'medium', ARRAY['MK 72-modda', 'MK 107-modda'])
ON CONFLICT DO NOTHING;

-- ── 5. IRAC Cases — Oila huquqi (10 ta) ─────────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('Ajrashish — bolalar tarbiyasi', 'B.A. Rashidov va N.A. Rashidova ajralishmoqda. Ularning 2 nafar farzandi bor. Farzandlar kim bilan yashashi va aliment miqdori aniqlanmoqda.', 'oila', 'hard', ARRAY['OK 39-modda', 'OK 41-modda', 'OK 55-modda', 'OK 76-modda']),
('Aliment undirish', 'Ayol 2 yoshli bolasi uchun aliment undirmoqda. Er o''zini moddiy javobgar deb hisoblamaydi. Aliment miqdori qonuniy tartibda aniqlanishi kerak.', 'oila', 'medium', ARRAY['OK 98-modda', 'OK 99-modda', 'OK 100-modda']),
('Mulk taqsimoti — ajrashishda', 'Erlar ajrashganidan keyin umumiy mulkni taqsimlash masalasi kelib chiqdi. Kvartira, avtomobil va bank hisobidagi mablag''lar taqsimlanishi kerak.', 'oila', 'medium', ARRAY['OK 39-modda', 'OK 40-modda', 'OK 55-modda']),
('Nikoh bekor qilish', 'Turmush o''rtog''i tomonidan zo''rlik ishlatilganligi sababli nikohni bekor qilish kerakligi da''vo qilinmoqda. Tegishli dalillar taqdim etilgan.', 'oila', 'hard', ARRAY['OK 38-modda', 'OK 39-modda', 'OK 40-modda']),
('Oila a''zolarining huquqlari', 'Bolaning bobosi va buvisi bola bilan ko''rishish huquqini talab qilmoqda. Ota-onasi bu huquqni cheklamoqda. Bolaning manfaatlari hisobga olinishi kerak.', 'oila', 'easy', ARRAY['OK 54-modda', 'OK 55-modda']),
('Bola tarbiyasida nizo', 'Ajrashgan ota-onalar bolaning qaysi maktabga borishi va qaysi shaharda yashashi masalasida kelisha olmadi. Bola manfaatlari birinchi o''rinda.', 'oila', 'medium', ARRAY['OK 54-modda', 'OK 68-modda']),
('Turmush o''rtog''i mulki', 'Turmush o''rtog''i o''z nomiga oldingi nikohdan qolgan mulkni sotib yuborgan. Boshqa turmush o''rtog''i bu harakatga norozilik bildirmoqda.', 'oila', 'hard', ARRAY['OK 35-modda', 'OK 36-modda']),
('Moddiy ta''minlash', 'Nikohdan tashqari yashagan juftlikning farzandi uchun moddiy ta''minlash masalasi. Ota farzandni tan olmayapti. DNT ekspertizasi talab qilinmoqda.', 'oila', 'medium', ARRAY['OK 98-modda', 'OK 51-modda']),
('Vasiylik', 'Ota-onasi vafot etgan bola uchun vasiy tayinlash masalasi. Bolaning yaqin qarindoshi vasiy bo''lishni xohlaydi. Bolaning manfaatlari hisobga olinmoqda.', 'oila', 'easy', ARRAY['OK 72-modda', 'OK 73-modda']),
('Farzandni tan olish', 'Er-xotin farzandni birgalikda tan olmoqda. Biroq biologik ota bunga qarshi. Farzandni tan olish tartibi va shartlari masalasi.', 'oila', 'hard', ARRAY['OK 57-modda', 'OK 58-modda', 'OK 59-modda'])
ON CONFLICT DO NOTHING;

-- ── 6. IRAC Cases — Ma''muriy huquq (10 ta) ─────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('Jarima — transport qoidalari buzilishi', 'Haydovchi A.V. Petrov tezlikni oshirgani uchun 10 baravar jarimaga tortildi. Petrov jarimaning ortiqcha ekanligini da''vo qilmoqda. Holat kameralarda tasvirlangan.', 'mamuriy', 'easy', ARRAY['MJtK 145-modda', 'MJtK 146-modda']),
('Litsenziya masalasi', 'Tadbirkor litsenziyasiz tijorat faoliyati bilan shug''ullanayotganligi aniqlandi. Davlat organi uning faoliyatini to''xtatdi. Tadbirkor litsenziya olish jarayoni noto''g''ri tushuntirilganligini aytmoqda.', 'mamuriy', 'medium', ARRAY['MJtK 220-modda']),
('Ekologiya qoidalari buzilishi', 'Sanoat korxonasi chiqindi suvni tozalamasdan daryoga tashladi. Atrof-muhitga zarar yetkazildi. Davlat organi korxonaga jarima qo''lladi va faoliyatini to''xtatdi.', 'mamuriy', 'medium', ARRAY['MJtK 234-modda', 'MJtK 235-modda']),
('Soliq buzilishi', 'Tadbirkor 2 yil davomida soliq deklaratsiyasini to''ldirmagan. Soliq organi qo''shimcha soliq va jarima hisoblab chiqdi. Tadbirkor hisob-kitob noto''g''ri ekanligini da''vo qilmoqda.', 'mamuriy', 'hard', ARRAY['MJtK 179-modda', 'MJtK 180-modda']),
('Yer ishlatish qoidalari', 'Fuqaro o''z yer uchastkasida ruxsatsiz bino qurdi. Mahalliy hokimiyat buzilishni talab qilmoqda. Fuqaro bu qurilish uchun ruxsat olish shart emasligini aytmoqda.', 'mamuriy', 'medium', ARRAY['MJtK 195-modda']),
('Tadbirkorlik faoliyati to''xtatilishi', 'Davlat organi tadbirkorning faoliyatini xavfsizlik qoidalari buzilganligi sababli to''xtatdi. Tadbirkor bu qaror qonunsiz ekanligini da''vo qilmoqda.', 'mamuriy', 'easy', ARRAY['MJtK 200-modda', 'MJtK 201-modda']),
('Yig''ilish o''tkazish tartibi', 'Fuqarolar guruh o''rnatish uchun hokimiyatdan ruxsat so''rashgan. Ruxsat berilmagan. Fuqarolar o''z huquqlari buzilganini da''vo qilmoqda.', 'mamuriy', 'easy', ARRAY['MJtK 215-modda']),
('Davlat xizmatchisi', 'Davlat xizmatchisi o''z lavozimidan shaxsiy manfaat uchun foydalanganligi aniqlandi. Tergov jarayonida uning harakatlari ma''muriy huquqbuzarlik deb baholanmoqda.', 'mamuriy', 'hard', ARRAY['MJtK 225-modda', 'MJtK 226-modda']),
('Chegarani kesib o''tish', 'Fuqaro ruxsatsiz chegarani kesib o''tib, boshqa mamlakatga kirishga uringan. U ushlandi va ma''muriy javobgarlikka tortilmoqda.', 'mamuriy', 'medium', ARRAY['MJtK 240-modda']),
('Mehnat muhofazasi qoidalari', 'Korxonada xavfsizlik qoidalari buzilishi sababli ishchi jarohat oldi. Davlat mehnat inspeksiyasi korxonaga jarima qo''lladi. Korxona bu qarorga norozilik bildirmoqda.', 'mamuriy', 'medium', ARRAY['MJtK 245-modda', 'MJtK 246-modda'])
ON CONFLICT DO NOTHING;

-- ── 7. IRAC Cases — Tijorat huquqi (10 ta) ──────────────────────────────
INSERT INTO public.irac_cases (title, description, category, difficulty, law_references) VALUES
('Intellektual mulk huquqi', 'Digital Solutions kompaniyasi litsenziyasiz dasturiy ta''minot ishlatgan StartUp Plus kompaniyasiga qarshi da''vo arizasi bilan murojaat qildi. Zarar miqdori 200 million so''m deb baholandi.', 'tijorat', 'hard', ARRAY['FK 1082-modda', 'FK 1083-modda', 'FK 1084-modda']),
('Aktsiyadorlik nizosi', 'Kompaniya ikki asosiy aktsiyador o''rtasida nizo yuzaga keldi. Biri kompaniya rahbarini o''zgartirmoqda, ikkinchisi bu qarorga qarshi. Qaror qabul qilish tartibi baholanmoqda.', 'tijorat', 'hard', ARRAY['FK 89-modda', 'FK 90-modda']),
('Korxona qurilishi', 'Ikki tashkilot o''rtasida qo''shma korxona tuzish to''g''risida shartnoma tuzildi. Bitta tashkilot o''z majburiyatlarini bajarmadi. Shartnoma buzilishi masalasi.', 'tijorat', 'medium', ARRAY['FK 91-modda', 'FK 92-modda']),
('Bankrotlik', 'Korxona 1 yildan beri qarzlarni to''lay olmayapti. Kreditorlar korxonani bankrotlik deb e''lon qilishni talab qilmoqda. Korxonaning mulki qarz miqdoridan kamroq.', 'tijorat', 'hard', ARRAY['FK 47-modda', 'FK 48-modda']),
('Shartnoma narxini baholash', 'Tovar yetkazib berish shartnomasida narx ko''rsatilgan. Bozor narxi keskin o''zgargach, tomonlar narxni qayta ko''rib chiqishni talab qilmoqda.', 'tijorat', 'medium', ARRAY['FK 345-modda', 'FK 397-modda']),
('Konsortsium shartnomasi', 'Bir nechta kompaniya katta loyiha uchun konsortsium tuzdi. Loyiha kechiktirildi. Zarar taqsimoti masalasi kelib chiqdi.', 'tijorat', 'hard', ARRAY['FK 93-modda', 'FK 94-modda']),
('Tijorat sirini saqlash', 'Xodim ishdan bo''shagandan keyin sobiq kompaniyaning sirlarini yangi ish beruvchiga oshkora qildi. Kompaniya zarar talab qilmoqda.', 'tijorat', 'medium', ARRAY['FK 14-modda', 'FK 15-modda']),
('Tovar belgisi', 'Kompaniya o''zining tovar belgisini ro''yxatdan o''tkazgan. Boshqa kompaniya bir xil belgini ishlatmoqda. Tovar belgisini himoya qilish masalasi.', 'tijorat', 'easy', ARRAY['FK 1090-modda', 'FK 1091-modda']),
('Xalqaro savdo nizosi', 'Ikki mamlakat kompaniyalari o''rtasida tovar yetkazib berish shartnomasi tuzildi. Tovar sifatsiz chiqdi. Xalqaro arbitratsiya masalasi.', 'tijorat', 'hard', ARRAY['FK 1200-modda', 'FK 1201-modda']),
('Kafolat majburiyati', 'Iste''molchi sotib olgan mahsulot kafolat muddatida buzildi. Ishlab chiqaruvchi kafolatni tan olmayapti. Iste''molchining huquqlari baholanmoqda.', 'tijorat', 'easy', ARRAY['FK 1060-modda', 'FK 1061-modda'])
ON CONFLICT DO NOTHING;
