// ── REAL O'ZBEKISTON HUQUQIY HUJJAT NAMUNALARI ─────────────────────────
// Har bir hujjat real qonunchilik talablariga asoslangan to'liq matn

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  description: string
  content: string
  lawRef?: string
  format: 'TXT' | 'DOCX' | 'PDF'
  size: string
  downloads: number
  createdAt: string
  tags: string[]
}

export const TEMPLATE_CATEGORIES = [
  { id: 'sud', name: 'Sud hujjatlari', icon: 'scale' },
  { id: 'shartnoma', name: 'Shartnomalar', icon: 'file-signature' },
  { id: "da'vo", name: "Da'vo va arizalar", icon: 'file-text' },
  { id: 'mehnat', name: 'Mehnat huquqi', icon: 'briefcase' },
  { id: 'vakolat', name: 'Ishonchnoma va vakolat', icon: 'user-check' },
  { id: 'majlis', name: 'Majlis va bayonnomalar', icon: 'users' },
  { id: 'xat', name: 'Xat va murojaatlar', icon: 'mail' },
  { id: 'moliya', name: 'Moliya va hisobot', icon: 'dollar-sign' },
]

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'dav-ariza-fuqarolik',
    name: "Da'vo arizasi (fuqarolik ishi bo'yicha)",
    category: "da'vo",
    description: "Fuqarolik ishi bo'yicha sudga da'vo arizasi namunasi",
    lawRef: 'FPK 103-108-moddalari',
    format: 'DOCX',
    size: '24 KB',
    downloads: 1580,
    createdAt: '2026-01-15',
    tags: ['fuqarolik', "da'vo", 'sud'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da'vogar: (F.I.Sh., yashash manzili, telefon raqami)
Javobgar: (F.I.Sh., yashash manzili, telefon raqami)

Da'vo arizasining qiymati: ___________ so'm

DA'VO ARIZASI

Men, (da'vogarning F.I.Sh.) quyidagi sabablarga ko'ra ushbu da'vo arizasini beraman:

1. Vaziyat bayoni:
(da'vo asoslari batafsil yoziladi)

2. Dalillar:
(da'voni asoslovchi dalillar keltiriladi)

3. Qonuniy asos:
O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 103-108-moddalariga asosan

4. Talab:
(da'vogarning aniq talabi yoziladi)

ILOVA:
1. Da'vo arizasining nusxasi - ____ nusxa
2. Davlat boji to'langanligi to'g'risidagi kvitansiya
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.           Imzo: ___________
`,
  },
  {
    id: 'dav-ariza-iqtisodiy',
    name: "Da'vo arizasi (iqtisodiy sud)",
    category: "da'vo",
    description: "Iqtisodiy sudga beriladigan da'vo arizasi",
    lawRef: 'IPK 91-96-moddalari',
    format: 'DOCX',
    size: '26 KB',
    downloads: 1200,
    createdAt: '2026-01-20',
    tags: ['iqtisodiy', "da'vo", 'sud'],
    content: `O'ZBEKISTON RESPUBLIKASI IQTISODIY SUDIGA

Da'vogar: (korxona nomi, STIR, bank rekvizitlari, manzili)
Javobgar: (korxona nomi, STIR, bank rekvizitlari, manzili)

Da'vo arizasining qiymati: ___________ so'm

DA'VO ARIZASI

(da'vogarning nomi) quyidagi sabablarga ko'ra ushbu da'vo arizasini beradi:

1. Holat bayoni:
(Tomonlar o'rtasidagi munosabatlar, shartnoma ma'lumotlari, majburiyatlarning bajarilmaganligi)

2. Shartnoma bo'yicha ma'lumot:
Shartnoma № ___ "___" ___________ 202___ y.

3. Qarzdorlik summasi:
Asosiy qarz: ___________ so'm
Penya: ___________ so'm
Jami: ___________ so'm

4. Qonuniy asos:
O'zbekiston Respublikasi Iqtisodiy protsessual kodeksining 91-96-moddalariga asosan

ILOVA:
1. Shartnoma nusxasi
2. Hisob-kitob hujjatlari
3. Davlat boji to'langanligi to'g'risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
M.O'.`,
  },
  {
    id: 'apellyatsiya-shikoyati',
    name: 'Apellyatsiya shikoyati',
    category: 'sud',
    description: 'Sud qaroriga apellyatsiya tartibida shikoyat qilish',
    lawRef: 'FPK 201-205-moddalari',
    format: 'DOCX',
    size: '22 KB',
    downloads: 980,
    createdAt: '2026-02-01',
    tags: ['apellyatsiya', 'shikoyat', 'sud'],
    content: `O'ZBEKISTON RESPUBLIKASI (viloyat/shahar) SUDIGA

Shikoyat qiluvchi: (F.I.Sh., manzili)
Sud qarori chiqargan sud: (tuman/shahar sudi)
Ish №: _________
Sud qarori sanasi: "___" ___________ 202___ y.

APELLYATSIYA SHIKOYATI

Men, (shikoyat qiluvchining F.I.Sh.) (tuman/shahar) sudining "___" ___________ 202___ yildagi ish № ___ sonli qarori bilan quyidagi masala bo'yicha:

(qarorning mazmuni qisqacha bayon etiladi)

qaror chiqarilgan bo'lib, men ushbu qarorga noroziman, chunki:

1. Sud tomonidan ishning holatlari to'liq o'rganilmagan;
2. (boshqa asoslar)

Yuqoridagilarni inobatga olib, O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 201-205-moddalariga asosan,

SO'RAYMAN:
(tuman/shahar) sudining "___" ___________ 202___ yildagi ish № ___ sonli qarorini bekor qilib, yangi qaror chiqarilsin.

ILOVA:
1. Shikoyat nusxasi - ___ nusxa
2. Davlat boji to'langanligi to'g'risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
`,
  },
  {
    id: 'kassatsiya-shikoyati',
    name: 'Kassatsiya shikoyati',
    category: 'sud',
    description: 'Apellyatsiya instansiyasi qaroriga kassatsiya shikoyati',
    lawRef: 'FPK 213-218-moddalari',
    format: 'DOCX',
    size: '24 KB',
    downloads: 760,
    createdAt: '2026-02-10',
    tags: ['kassatsiya', 'shikoyat', 'sud'],
    content: `O'ZBEKISTON RESPUBLIKASI (viloyat) SUDI KASSATSIYA INSTANSIYASIGA

Shikoyat qiluvchi: (F.I.Sh., manzili)
Apellyatsiya qarori chiqargan sud: _________
Ish №: _________

KASSATSION SHIKOYAT

Men, (shikoyat qiluvchi) (apellyatsiya instansiyasi sudining) "___" ___________ 202___ yildagi qaroriga norozilik bildiraman.

Quyidagi asoslarga ko'ra:

1. Ishda muhim ahamiyatga ega bo'lgan holatlar noto'g'ri baholangan;
2. Moddiy huquq normalari buzilgan;
3. Protsessual huquq normalari buzilgan;

Yuqoridagilarni inobatga olib, O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 213-218-moddalariga asosan,

SO'RAYMAN:
Apellyatsiya instansiyasining qarorini bekor qilib, yangi qaror chiqarilsin.

ILOVA:
1. Shikoyat nusxasi - ___ nusxa
2. Sud qarorining nusxasi
3. Davlat boji to'langanligi to'g'risidagi kvitansiya

Sana: "___" ___________ 202___ y.           Imzo: ___________
`,
  },
  {
    id: 'fuqarolik-shartnoma',
    name: 'Fuqarolik-huquqiy shartnoma',
    category: 'shartnoma',
    description: "Fuqarolik-huquqiy xarakterdagi xizmat ko'rsatish shartnomasi",
    lawRef: 'FK 345-358-moddalari',
    format: 'DOCX',
    size: '32 KB',
    downloads: 2300,
    createdAt: '2026-01-05',
    tags: ['fuqarolik', 'shartnoma', 'xizmat'],
    content: `FUQAROLIK-HUQUQIY SHARTNOMA № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Biz, quyida imzo chekuvchilar:

Buyurtmachi: (F.I.Sh., pasport ma'lumotlari, manzili)

va

Ijrochi: (F.I.Sh., pasport ma'lumotlari, manzili)

o'rtasida quyidagi shartnoma tuzildi:

1. ShARTNOMA PREDMETI
1.1. Ijrochi buyurtmachining topshirig'iga binoan quyidagi xizmatlarni ko'rsatish majburiyatini oladi: (xizmat turi)
1.2. Buyurtmachi ko'rsatilgan xizmatlar uchun haq to'lash majburiyatini oladi.

2. TOMONLARNING HUQUQ VA MAJBURIYATLARI
2.1. Ijrochi quyidagilarga majbur:
- Xizmatni sifatli bajarish;
- Belgilangan muddatlarda bajarish;
- (boshqa majburiyatlar)

2.2. Buyurtmachi quyidagilarga majbur:
- Xizmat uchun belgilangan haqni to'lash;
- Zarur hujjatlarni taqdim etish;
- (boshqa majburiyatlar)

3. XIZMATLAR NARXI VA HISOB-KITOB TARTIBI
3.1. Xizmatlarning umumiy qiymati: ___________ so'm
3.2. To'lov tartibi: (naqd/pul o'tkazmasi)

4. TOMONLARNING JAVOBGARLIGI
4.1. Shartnoma shartlarini buzganlik uchun tomonlar O'zbekiston Respublikasi qonunchiligiga muvofiq javobgar bo'ladi.

5. SHARTNOMANING AMAL QILISH MUDDATI
5.1. Shartnoma imzolangan paytdan kuchga kiradi va tomonlar majburiyatlarni to'liq bajarganlariga qadar amal qiladi.

6. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Buyurtmachi:                      Ijrochi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
`,
  },
  {
    id: 'mehnat-shartnoma',
    name: "Mehnat shartnomasi (ish beruvchi va xodim o'rtasida)",
    category: 'mehnat',
    description: 'Xodim bilan tuziladigan mehnat shartnomasi namunasi',
    lawRef: 'MK 100-104-moddalari',
    format: 'DOCX',
    size: '35 KB',
    downloads: 3200,
    createdAt: '2026-01-10',
    tags: ['mehnat', 'shartnoma', 'xodim'],
    content: `MEHNAT SHARTNOMASI № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Ish beruvchi: (korxona/tashkilot nomi, STIR, manzili), (lavozimi) (F.I.Sh.) vakili sifatida, bir tomondan,
va xodim: (F.I.Sh., pasport ma'lumotlari, INN), ikkinchi tomondan,
o'rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Xodim ish beruvchida quyidagi lavozimda ishlash majburiyatini oladi: (lavozim)
1.2. Ish joyi: (tarkibiy bo'linma)

2. MEHNAT SHARTLARI
2.1. Ishning xarakteri: (doimiy/vaqtinchalik)
2.2. Ish vaqti: haftasiga ___ soat
2.3. Dam olish kuni: (shanba/yakshanba)

3. TOMONLARNING HUQUQ VA MAJBURIYATLARI
3.1. Xodim quyidagilarga majbur:
- O'z mehnat vazifalarini vijdonan bajarish;
- Mehnat intizomiga rioya qilish;
- (boshqa majburiyatlar)

4. HAQ TO'LASH
4.1. Lavozim maoshi: ___________ so'm
4.2. Qo'shimcha to'lovlar: ___________ so'm

5. MEHNAT TATILI
5.1. Yillik mehnat ta'tili: ___ kalendar kun

6. SHARTNOMANING AMAL QILISH MUDDATI
6.1. Shartnoma muddati: (cheklanmagan/___ oy)

7. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Ish beruvchi:                      Xodim:
(korxona nomi)                     (F.I.Sh.)
(lavozimi)                        
Imzo: ________                     Imzo: ________
M.O'.`,
  },
  {
    id: 'ijara-shartnoma',
    name: 'Mulk ijarasi shartnomasi',
    category: 'shartnoma',
    description: 'Turar joy/noturar joy ijarasi shartnomasi',
    lawRef: 'FK 353-357-moddalari',
    format: 'DOCX',
    size: '28 KB',
    downloads: 1850,
    createdAt: '2026-02-15',
    tags: ['ijara', 'shartnoma', 'mulk'],
    content: `IJARA SHARTNOMASI № ___

"___" ___________ 202___ y.                    (shahar/tuman)

Ijarga beruvchi: (F.I.Sh., pasport ma'lumotlari, manzili)
va
Ijarga oluvchi: (F.I.Sh., pasport ma'lumotlari, manzili)

o'rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Ijarga beruvchi quyidagi mulkni ijaraga beradi: (mulk tavsifi, manzili, maydoni)
1.2. Mulkning xususiyatlari: (qavat, xonalar soni, jihozlar)

2. IJARA MUDDATI
2.1. Ijara muddati: "___" ___________ 202___ y. dan "___" ___________ 202___ y. gacha

3. IJARA HAQI
3.1. Oylik ijara haqi: ___________ so'm
3.2. To'lov tartibi: (har oyning ___ sanasigacha)

4. TOMONLARNING MAJBURIYATLARI
4.1. Ijarga beruvchi:
- Mulkni belgilangan tartibda topshirish
- Mulkni tegishli holatda saqlash

4.2. Ijarga oluvchi:
- Ijara haqini o'z vaqtida to'lash
- Mulkdan belgilangan maqsadda foydalanish

5. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Ijarga beruvchi:                   Ijarga oluvchi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
`,
  },
  {
    id: 'oldi-sotdi-shartnoma',
    name: "Ko'chmas mulk oldi-sotdi shartnomasi",
    category: 'shartnoma',
    description: "Ko'chmas mulk (uy, kvartira) oldi-sotdi shartnomasi",
    lawRef: 'FK 380-393-moddalari',
    format: 'DOCX',
    size: '34 KB',
    downloads: 2100,
    createdAt: '2026-01-25',
    tags: ['oldi-sotdi', 'shartnoma', 'mulk'],
    content: `KO'CHMAS MULK OLDI-SOTDI SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Sotuvchi: (F.I.Sh., pasport ma'lumotlari, manzili)
va
Xaridor: (F.I.Sh., pasport ma'lumotlari, manzili)

o'rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Sotuvchi quyidagi ko'chmas mulkni sotadi: (manzili, maydoni, xonalar soni)
1.2. Mulkning kadastr raqami: _________
1.3. Mulk huquqini tasdiqlovchi hujjat: (guvohnoma №)

2. MULKNING NARXI
2.1. Mulkning sotish narxi: ___________ so'm
2.2. To'lov tartibi: (bir martalik/bo'lib-bo'lib)

3. TOMONLARNING MAJBURIYATLARI
3.1. Sotuvchi:
- Mulkni belgilangan tartibda topshirish
- Mulkka nisbatan uchinchi shaxslarning huquqlari yo'qligini kafolatlash

3.2. Xaridor:
- Belgilangan narxni to'lash
- Mulkni qabul qilish

4. SHARTNOMANING TUZILISHI
4.1. Shartnoma notarial tartibda tasdiqlanishi kerak
4.2. Shartnoma davlat ro'yxatidan o'tkazilishi kerak

5. TOMONLARNING REKVIZITLARI

Sotuvchi:                          Xaridor:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
`,
  },
  {
    id: 'qarz-shartnoma',
    name: 'Qarz shartnomasi',
    category: 'shartnoma',
    description: "Pul mablag'larini qarzga olish shartnomasi",
    lawRef: 'FK 421-428-moddalari',
    format: 'DOCX',
    size: '22 KB',
    downloads: 1650,
    createdAt: '2026-02-20',
    tags: ['qarz', 'shartnoma', 'pul'],
    content: `QARZ SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Qarz beruvchi: (F.I.Sh., pasport ma'lumotlari, manzili)
va
Qarz oluvchi: (F.I.Sh., pasport ma'lumotlari, manzili)

o'rtasida quyidagi shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Qarz beruvchi qarz oluvchiga ___________ so'm miqdorida pul mablag'ini qarzga beradi.
1.2. Qarz oluvchi ko'rsatilgan pul mablag'ini belgilangan muddatda qaytarish majburiyatini oladi.

2. QARZDAN FOYDALANISH SHARTLARI
2.1. Qarz muddati: "___" ___________ 202___ y.
2.2. Foiz stavkasi: (yillik ___% foizsiz)

3. QARZNI QAYTARISH TARTIBI
3.1. Qarz (bir martalada/bo'lib-bo'lib) qaytariladi.
3.2. Qarzni kechiktirilgan holda qaytarganlik uchun O'zbekiston Respublikasi qonunchiligiga muvofiq javobgarlik belgilanadi.

4. TOMONLARNING REKVIZITLARI VA IMOZOLARI

Qarz beruvchi:                     Qarz oluvchi:
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
`,
  },
  {
    id: 'ishonchnoma',
    name: 'Ishonchnoma (umumiy)',
    category: 'vakolat',
    description: 'Jismoniy shaxs nomidan ish yuritish uchun ishonchnoma',
    lawRef: 'FK 158-moddasi',
    format: 'DOCX',
    size: '18 KB',
    downloads: 2900,
    createdAt: '2026-01-08',
    tags: ['ishonchnoma', 'vakolat'],
    content: `ISHONCHNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Men, (F.I.Sh., pasport seriyasi va raqami: ___, berilgan sanasi: "___" ___________ y., JSHSH: _________)

ushbu ishonchnoma bilan (F.I.Sh., pasport ma'lumotlari)ga quyidagi harakatlarni amalga oshirish vakolatini beraman:

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
`,
  },
  {
    id: 'aliment-ariza',
    name: "Aliment undirish to'g'risidagi ariza",
    category: "da'vo",
    description: "Voyaga yetmagan bolani ta'minlash uchun aliment undirish arizasi",
    lawRef: 'OK 98-109-moddalari',
    format: 'DOCX',
    size: '20 KB',
    downloads: 1400,
    createdAt: '2026-02-05',
    tags: ['aliment', "da'vo", 'oila'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da'vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)

ALIMENT UNDIRISH TO'G'RISIDA DA'VO ARIZASI

Men, (da'vogarning F.I.Sh.) (javobgarning F.I.Sh.) bilan _________________ yildan beri nikohda bo'lgan/bo'lganmiz.

Nikohdan/quyidagi farzandlarimiz bor:
1. (F.I.Sh., tug'ilgan sanasi)
2. (F.I.Sh., tug'ilgan sanasi)

Farzandlar mening tarbiyamda yashaydi. Javobgar farzandlarni moddiy ta'minlashda qatnashmaydi.

O'zbekiston Respublikasi Oila kodeksining 98-109-moddalariga asosan,

SO'RAYMAN:
Javobgardan voyaga yetmagan farzandlarimizni ta'minlash uchun har oyda ___________ so'm miqdorida aliment undirilsin.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Farzandlarning tug'ilganlik guvohnomalari nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.           Imzo: ___________
`,
  },
  {
    id: 'ajrim-ariza',
    name: "Nikohni bekor qilish to'g'risidagi da'vo arizasi",
    category: "da'vo",
    description: 'Nikohni (ajrimni) sud orqali bekor qilish arizasi',
    lawRef: 'OK 37-41-moddalari',
    format: 'DOCX',
    size: '22 KB',
    downloads: 1200,
    createdAt: '2026-02-12',
    tags: ['ajrim', "da'vo", 'oila'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da'vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)

NIKOHN BEKOR QILISH TO'G'RISIDA DA'VO ARIZASI

Men, (da'vogar) va (javobgar) o'rtasida ___________ yil "___" ___________ kuni FHDYo organida nikoh qayd etilgan (dalolatnoma yozuvi № ___).

Nikohdan birga yashash davomida er-xotin munosabatlari yaxshi bo'lmagan. Quyidagi sabablarga ko'ra birga yashash imkoni yo'q:

1. (sabab)
2. (sabab)

Nikohdan farzandlar: (bor/yo'q)

O'zbekiston Respublikasi Oila kodeksining 37-41-moddalariga asosan,

SO'RAYMAN:
(da'vogar) va (javobgar) o'rtasidagi nikohni bekor qilsin.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Farzandlarning tug'ilganlik guvohnomalari nusxasi (agar bo'lsa)

Sana: "___" ___________ 202___ y.           Imzo: ___________
`,
  },
  {
    id: 'ishga-qabul-ariza',
    name: "Ishga qabul qilish to'g'risidagi ariza",
    category: 'mehnat',
    description: 'Xodimning ishga qabul qilish haqidagi arizasi',
    lawRef: 'MK 100-101-moddalari',
    format: 'DOCX',
    size: '16 KB',
    downloads: 3500,
    createdAt: '2026-01-02',
    tags: ['mehnat', 'ariza', 'xodim'],
    content: `Korxona rahbariga
(korxona nomi)
(rahbarning F.I.Sh., lavozimi)

dan
(nomzodning F.I.Sh., manzili, telefon raqami)

ARIZA

Men, (F.I.Sh.)ni (lavozim nomi) lavozimiga ishga qabul qilishingizni so'rayman.

Ma'lumotim: (ta'lim darajasi, mutaxassisligim)
Ish tajribam: (______ yil)

Quyidagi hujjatlarni ilova qilaman:
1. Mehnat daftarchasi nusxasi
2. Diplomi nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'ishdan-bosh-ariza',
    name: "Ishdan bo'shash to'g'risidagi ariza",
    category: 'mehnat',
    description: "Xodimning o'z xohishi bilan ishdan bo'shash arizasi",
    lawRef: 'MK 161-moddasi',
    format: 'DOCX',
    size: '15 KB',
    downloads: 2800,
    createdAt: '2026-01-12',
    tags: ['mehnat', 'ariza', "bo'shash"],
    content: `Korxona rahbariga
(korxona nomi)
(rahbarning F.I.Sh.)

dan
(xodimning F.I.Sh., lavozimi)

ARIZA

Men, (F.I.Sh.)ni (lavozim nomi) lavozimidan o'z xohishim bilan bo'shatishingizni so'rayman.

O'zbekiston Respublikasi Mehnat kodeksining 161-moddasiga asosan, ish beruvchini ikki hafta oldin ogohlantirgan holda mehnat shartnomasini bekor qilaman.

Oxirgi ish kuni: "___" ___________ 202___ y.

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'advokat-sorov',
    name: "Advokatning ma'lumot so'rovi",
    category: 'vakolat',
    description: "Advokatlik so'rovi orqali ma'lumot olish",
    lawRef: "Advokatura to'g'risidagi qonun, 14-modda",
    format: 'DOCX',
    size: '18 KB',
    downloads: 950,
    createdAt: '2026-02-18',
    tags: ['advokat', "so'rov", 'vakolat'],
    content: `(tashkilot nomi)
(rahbarning F.I.Sh., lavozimi)

dan
Advokat (F.I.Sh.)
Litsenziya №: _________

ADVOKATLIK SO'ROVI

Men, (F.I.Sh.) advokat sifatida (ishonch bildiruvchining F.I.Sh.)ning manfaatlarini himoya qilish doirasida quyidagi ma'lumotlarni so'rayman:

1. (so'raladigan ma'lumot)
2. (so'raladigan ma'lumot)

"Advokatura to'g'risida"gi O'zbekiston Respublikasi Qonunining 14-moddasiga asosan, so'ralgan ma'lumotni ___ kun muddatda taqdim etishingizni so'rayman.

ILOVA:
1. Advokatlik guvohnomasi nusxasi
2. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
M.O'.`,
  },
  {
    id: 'sudga-murojaat',
    name: 'Sudga murojaat (umumiy namuna)',
    category: 'sud',
    description: 'Sudga murojaat qilishning umumiy namunasi',
    lawRef: 'FPK 103-moddasi',
    format: 'DOCX',
    size: '20 KB',
    downloads: 1100,
    createdAt: '2026-03-01',
    tags: ['sud', 'murojaat', 'ariza'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Arizachi: (F.I.Sh., manzili, telefon)
Manfaatdor shaxs: (F.I.Sh., manzili, telefon)

ARIZA

Men, (F.I.Sh.) O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 103-moddasiga asosan quyidagi masala bo'yicha sudga murojaat qilaman:

(ariza mazmuni batafsil yoziladi)

1. Vaziyatning qisqacha bayoni:
2. Arizachining talabi:
3. Qonuniy asos:

SO'RAYMAN:
(anich talab yoziladi)

ILOVA:
1. (hujjatlar ro'yxati)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'kafolat-xati',
    name: 'Kafolat xati',
    category: 'xat',
    description: 'Moliyaviy yoki boshqa majburiyatlarni kafolatlash xati',
    lawRef: '',
    format: 'DOCX',
    size: '16 KB',
    downloads: 1300,
    createdAt: '2026-03-05',
    tags: ['kafolat', 'xat', 'moliya'],
    content: `(qabul qiluvchi tashkilot nomi)

KAFOLAT XATI

"___" ___________ 202___ y.                    № ___

Men, (F.I.Sh., lavozimi) (tashkilot nomi) nomidan quyidagilarni kafolatlayman:

1. (majburiyat mazmuni)
2. (majburiyat)
3. (boshqa shartlar)

Ushbu kafolat (muddat) muddatga amal qiladi.

(kafolat beruvchining lavozimi)         ___________
                                         (imzo)

M.O'.`,
  },
  {
    id: 'ishonch-xati',
    name: 'Ishonch xati (tavsiya)',
    category: 'xat',
    description: 'Jismoniy yoki yuridik shaxsga beriladigan ishonch xati',
    lawRef: '',
    format: 'DOCX',
    size: '15 KB',
    downloads: 850,
    createdAt: '2026-03-10',
    tags: ['ishonch', 'xat', 'tavsiya'],
    content: `(qabul qiluvchi tashkilot nomi)

ISHONCH XATI

"___" ___________ 202___ y.                    № ___

Ushbu xat bilan (F.I.Sh., lavozimi)ni (tashkilot nomi)ga (masala) bo'yicha vakil etib tayinlaymiz.

(F.I.Sh.) quyidagi huquqlarga ega:
1. (vakolatlar)
2. (vakolatlar)

(vakilning imzosi): ___________ (imzo namunasi)

(korxona rahbari lavozimi)          ___________
                                       (imzo)
M.O'.`,
  },
  {
    id: 'shikoyat-ariza',
    name: 'Davlat organiga shikoyat arizasi',
    category: 'xat',
    description: 'Davlat organlari va mansabdor shaxslarning harakatlari ustidan shikoyat',
    lawRef: "Murojaatlar to'g'risidagi qonun",
    format: 'DOCX',
    size: '19 KB',
    downloads: 1050,
    createdAt: '2026-03-15',
    tags: ['shikoyat', 'ariza', 'davlat'],
    content: `(yuqori turuvchi tashkilot/organ nomi)
(rahbarning F.I.Sh.)

dan
(arizachining F.I.Sh., manzili, telefon)

SHIKOYAT ARIZASI

Men, (F.I.Sh.) quyidagi sabablarga ko'ra shikoyat arizasi bilan murojaat qilaman:

1. (shikoyat mazmuni)
2. (shikoyat qilinayotgan harakat/harakatlar)
3. (shikoyat qilinayotgan organ xodimining F.I.Sh., lavozimi)

Yuqoridagilarni inobatga olgan holda,

SO'RAYMAN:
1. (shikoyatni ko'rib chiqish)
2. (choralar ko'rish)
3. (javob berish)

ILOVA:
1. (dalillar, hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'dalolatnoma',
    name: 'Dalolatnoma (umumiy namuna)',
    category: 'majlis',
    description: 'Turli xil holatlarni qayd etish uchun dalolatnoma',
    lawRef: '',
    format: 'DOCX',
    size: '17 KB',
    downloads: 780,
    createdAt: '2026-03-20',
    tags: ['dalolatnoma', 'hujjat'],
    content: `DALOLATNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Biz, quyida imzo chekuvchilar:

1. (F.I.Sh., lavozimi)
2. (F.I.Sh., lavozimi)
3. (F.I.Sh., lavozimi)

ushbu dalolatnomani quyidagilar to'g'risida tuzdik:

"___" ___________ 202___ y. soat ___ da (joy)da quyidagi holat aniqlandi:

(holatning batafsil bayoni)

1. (holat)
2. (holat)

Ushbu dalolatnoma ikki nusxada tuzildi.

Imzolar:
1. ___________ (imzo)
2. ___________ (imzo)
3. ___________ (imzo)
`,
  },
  {
    id: 'bayonnoma',
    name: 'Bayonnoma (majlis)',
    category: 'majlis',
    description: "Yig'ilish va majlislarni qayd etish bayonnomasi",
    lawRef: '',
    format: 'DOCX',
    size: '22 KB',
    downloads: 650,
    createdAt: '2026-03-25',
    tags: ['bayonnoma', 'majlis'],
    content: `BAYONNOMA

"___" ___________ 202___ y.                    № ___

Majlis mavzusi: _________
Majlis o'tkazilgan joy: _________
Qatnashchilar: ___ kishi (ro'yxat ilova qilinadi)
Majlis raisi: (F.I.Sh.)
Majlis kotibi: (F.I.Sh.)

KUN TARTIBI:
1. (masala)
2. (masala)
3. (masala)

1-masala bo'yicha:
(tinglandi, so'zga chiqqanlar, qaror)

2-masala bo'yicha:
(tinglandi, so'zga chiqqanlar, qaror)

3-masala bo'yicha:
(tinglandi, so'zga chiqqanlar, qaror)

QAROR QILINDI:
1. (qaror)
2. (qaror)

Rais: ___________ (imzo)
Kotib: ___________ (imzo)
`,
  },
  {
    id: 'buyruq',
    name: "Korxona buyrug'i (namuna)",
    category: 'mehnat',
    description: "Korxona/tashkilot rahbarining buyrug'i namunasi",
    lawRef: '',
    format: 'DOCX',
    size: '18 KB',
    downloads: 2200,
    createdAt: '2026-01-18',
    tags: ['buyruq', 'mehnat', 'korxona'],
    content: `BUYRUK

"___" ___________ 202___ y.                    № ___

(korxona nomi)

(MAVZU: buyruq mazmuni qisqacha)

(Asos: qonun yo'qi, yuqori turuvchi tashkilotning ko'rsatmasi va h.k.)

BUYURAMAN:
1. (topshiriq)
2. (topshiriq)
3. (bajarilish muddati)

4. Ushbu buyruqning bajarilishini nazorat qilish (masul shaxs) zimmasiga yuklanadi.

(korxona rahbari lavozimi)          ___________
                                       (imzo)

Buyruq bilan tanishtirildi:
(F.I.Sh.) ________ "___" ___________ 202___ y.
`,
  },
  {
    id: 'hadya-shartnoma',
    name: 'Hadya shartnomasi',
    category: 'shartnoma',
    description: 'Mulkni hadya qilish shartnomasi',
    lawRef: 'FK 413-420-moddalari',
    format: 'DOCX',
    size: '20 KB',
    downloads: 890,
    createdAt: '2026-04-01',
    tags: ['hadya', 'shartnoma'],
    content: `HADYA SHARTNOMASI

"___" ___________ 202___ y.                    (shahar/tuman)

Hadya beruvchi: (F.I.Sh., pasport ma'lumotlari, manzili)
va
Hadya oluvchi: (F.I.Sh., pasport ma'lumotlari, manzili)

o'rtasida quyidagi shartnoma tuzildi:

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
`,
  },
  {
    id: 'tilxat',
    name: 'Tilxat',
    category: 'moliya',
    description: "Pul yoki moddiy boyliklarni olish to'g'risidagi tilxat",
    lawRef: '',
    format: 'TXT',
    size: '8 KB',
    downloads: 3200,
    createdAt: '2026-01-03',
    tags: ['tilxat', 'moliya', 'pul'],
    content: `TILXAT

"___" ___________ 202___ y.

Men, (F.I.Sh., pasport ma'lumotlari, manzili)

(F.I.Sh.)dan ___________ (summa raqam va yozuvda) so'm pul mablag'ini oldim.

Pulni (maqsadi) uchun oldim. Pulni ___________ gacha qaytarish majburiyatini olaman.

(F.I.Sh.)                          Imzo: ________

Guvohlar:
1. (F.I.Sh.) _________
2. (F.I.Sh.) _________
`,
  },
  {
    id: 'rozilik-xati',
    name: 'Rozilik xati',
    category: 'xat',
    description: 'Turli xil rozilik bildirish xatlari',
    lawRef: '',
    format: 'DOCX',
    size: '14 KB',
    downloads: 970,
    createdAt: '2026-04-10',
    tags: ['rozilik', 'xat'],
    content: `ROZILIK XATI

"___" ___________ 202___ y.                    № ___

(olingan hujjat/sana havolasi)

Men, (F.I.Sh.) (masala) bo'yicha (tashkilot/qaror bilan) tanishdim va rozilik bildiraman.

(rozilik mazmuni)

(qabul qiluvchi lavozimi)           ___________
                                       (imzo)
`,
  },
  {
    id: 'tushuntirish-xati',
    name: 'Tushuntirish xati',
    category: 'xat',
    description: 'Turli holatlar yuzasidan tushuntirish xati',
    lawRef: '',
    format: 'DOCX',
    size: '16 KB',
    downloads: 1100,
    createdAt: '2026-04-15',
    tags: ['tushuntirish', 'xat'],
    content: `(rahbarning F.I.Sh., lavozimi)

dan
(xodimning F.I.Sh., lavozimi)

TUSHUNTIRISH XATI

"___" ___________ 202___ y.                    № ___

(ishlab chiqarish masalasiga oid)

Men, (F.I.Sh.) (masala) bo'yicha quyidagilarni tushuntirishni lozim topaman:

1. (tushuntirish)
2. (tushuntirish)

(xodim F.I.Sh.)                 Imzo: ________
Sana: _________
`,
  },
  {
    id: 'meros-ariza',
    name: "Merosni qabul qilish to'g'risidagi ariza",
    category: "da'vo",
    description: 'Meros huquqini qabul qilish arizasi',
    lawRef: 'FK 1125-1140-moddalari',
    format: 'DOCX',
    size: '18 KB',
    downloads: 870,
    createdAt: '2026-04-20',
    tags: ['meros', 'ariza', 'mulk'],
    content: `(tuman/shahar) NOTARIAL KONTORIGA

Arizachi: (F.I.Sh., manzili, telefon)

MEROSNI QABUL QILISH TO'G'RISIDA ARIZA

Men, (F.I.Sh.) "___" ___________ 202___ y. vafot etgan (meros qoldiruvchining F.I.Sh.)dan qolgan merosni qabul qilaman.

Meros qoldiruvchi bilan (qarindoshlik darajasi) hisoblanaman.

Meros tarkibi:
1. (mulk)
2. (mulk)

O'zbekiston Respublikasi Fuqarolik kodeksining 1125-1140-moddalariga asosan, merosni qabul qilish to'g'risidagi arizani taqdim etaman.

ILOVA:
1. Meros qoldiruvchining o'limi to'g'risidagi guvohnoma nusxasi
2. Qarindoshlikni tasdiqlovchi hujjat nusxasi
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'mulk-bolish-davo',
    name: "Mulkni bo'lish to'g'risidagi da'vo arizasi",
    category: "da'vo",
    description: "Er-xotin o'rtasidagi umumiy mulkni bo'lish da'vosi",
    lawRef: 'OK 24-28-moddalari',
    format: 'DOCX',
    size: '24 KB',
    downloads: 680,
    createdAt: '2026-04-25',
    tags: ['mulk', "da'vo", 'oila'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Da'vogar: (F.I.Sh., manzili, telefon)
Javobgar: (F.I.Sh., manzili, telefon)
Uchinchi shaxs: (agar kerak bo'lsa)

Da'vo arizasining qiymati: ___________ so'm

MULKNI BO'LISH TO'G'RISIDA DA'VO ARIZASI

Men, (da'vogar) va (javobgar) o'rtasida ___________ yilda nikoh tuzilgan va ___________ yilda nikoh bekor qilingan.

Nikoh davrida quyidagi mulk sotib olingan:
1. (mulkning nomi, qiymati)
2. (mulkning nomi, qiymati)

O'zbekiston Respublikasi Oila kodeksining 24-28-moddalariga asosan,

SO'RAYMAN:
Yuqorida ko'rsatilgan mulkni teng taqsimlashni belgilang.

ILOVA:
1. Nikoh guvohnomasi nusxasi
2. Mulk huquqini tasdiqlovchi hujjatlar
3. (boshqa hujjatlar)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'sud-iltimosnoma',
    name: 'Sudga iltimosnoma',
    category: 'sud',
    description: 'Sudga turli xil iltimosnomalar berish namunasi',
    lawRef: 'FPK 56-moddasi',
    format: 'DOCX',
    size: '16 KB',
    downloads: 920,
    createdAt: '2026-05-01',
    tags: ['sud', 'iltimosnoma'],
    content: `O'ZBEKISTON RESPUBLIKASI (tuman/shahar) SUDIGA

Iltimosnoma beruvchi: (F.I.Sh., ishdagi holati: da'vogar/javobgar/advokat)
Ish №: _________

ILTIMOSNOMA

(ishning nomi) bo'yicha sud ishini ko'rib chiqish jarayonida quyidagi iltimosnomani bildiraman:

(iltimosnoma mazmuni)

1. (iltimos)
2. (asos)

O'zbekiston Respublikasi Fuqarolik protsessual kodeksining 56-moddasiga asosan,

SO'RAYMAN:
(iltimosnomani qanoatlantirish)

Sana: "___" ___________ 202___ y.    Imzo: ___________
`,
  },
  {
    id: 'javob-xati',
    name: 'Javob xati',
    category: 'xat',
    description: 'Olingan murojaat va xatlarga javob xati',
    lawRef: '',
    format: 'DOCX',
    size: '14 KB',
    downloads: 1500,
    createdAt: '2026-05-05',
    tags: ['xat', 'javob'],
    content: `(qabul qiluvchining F.I.Sh., manzili)

JAVOB XATI

"___" ___________ 202___ y.                    № ___

Sizning (sana)dagi (hujjat raqami) sonli murojaatingizga javoban quyidagilarni ma'lum qilamiz:

(javob mazmuni)

1. (band)
2. (band)

(qo'shimcha ma'lumot)

(lavozimi)                         ___________
                                     (imzo)
`,
  },
  {
    id: 'vakolatnoma',
    name: 'Vakolatnoma (ishonchli vakil tayinlash)',
    category: 'vakolat',
    description: 'Jismoniy shaxs manfaatlarini himoya qilish uchun vakolatnoma',
    lawRef: 'FK 158-moddasi',
    format: 'DOCX',
    size: '16 KB',
    downloads: 830,
    createdAt: '2026-05-10',
    tags: ['vakolat', 'vakolatnoma'],
    content: `VAKOLATNOMA

"___" ___________ 202___ y.                    (shahar/tuman)

Men, (F.I.Sh.) (F.I.Sh.)ga quyidagi masalalarda mening manfaatlarimni himoya qilish vakolatini beraman:

1. Sud, prokuratura va boshqa davlat organlarida mening nomimdan ishtirok etish;
2. Hujjatlarni olish va topshirish;
3. (boshqa vakolatlar)

Vakolatnoma (muddati)ga berilgan.

(Ishonch bildiruvchi)              (Vakil)
(F.I.Sh.)                          (F.I.Sh.)
Imzo: ________                     Imzo: ________
`,
  },
  {
    id: 'sorov-xati',
    name: "Ma'lumot olish uchun so'rov xati",
    category: 'xat',
    description: "Turli tashkilotlardan ma'lumot olish uchun so'rov xati",
    lawRef: '',
    format: 'DOCX',
    size: '14 KB',
    downloads: 1250,
    createdAt: '2026-05-15',
    tags: ["so'rov", 'xat'],
    content: `(tashkilot nomi, rahbarning F.I.Sh.)

SO'ROV XATI

"___" ___________ 202___ y.                    № ___

Hurmatli (rahbarning F.I.Sh.)!

Quyidagi masala bo'yicha ma'lumot olishimiz kerak:

(so'raladigan ma'lumot)

1. (savol)
2. (savol)
3. (savol)

So'ralgan ma'lumotni (muddat)gacha taqdim etishingizni so'raymiz.

(lavozimi)                         ___________
                                     (imzo)
`,
  },
]

// ── GET helper ────────────────────────────────────────────────────────

export function getTemplatesByCategory(category: string): DocumentTemplate[] {
  if (category === 'all') return DOCUMENT_TEMPLATES
  return DOCUMENT_TEMPLATES.filter(t => t.category === category)
}

export function searchTemplates(query: string): DocumentTemplate[] {
  const q = query.toLowerCase()
  return DOCUMENT_TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (Array.isArray(t.tags) ? t.tags : []).some(tag => tag.includes(q)) ||
      t.category.includes(q)
  )
}

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(t => t.id === id)
}
