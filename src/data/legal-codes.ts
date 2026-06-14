/**
 * O'ZBEKISTON RESPUBLIKASI QONUN KODEKSLARI
 * To'liq moddalar bilan
 */

export interface LegalArticle {
  number: string;
  title: string;
  content: string;
  category?: string;
  penalties?: string;
  references?: string[];
}

export interface LegalCode {
  id: string;
  name: string;
  shortName: string;
  description: string;
  totalArticles: number;
  effectiveDate: string;
  articles: LegalArticle[];
}

// ============================================================================
// JINOYAT KODEKSI (JK)
// ============================================================================

export const CRIMINAL_CODE: LegalCode = {
  id: 'criminal_code',
  name: 'O\'zbekiston Respublikasi Jinoyat kodeksi',
  shortName: 'JK',
  description: 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati',
  totalArticles: 302,
  effectiveDate: '01.04.1995',
  articles: [
    {
      number: '1',
      title: 'O\'zbekiston Respublikasi jinoyat qonunchiligining vazifalar',
      content: `O'zbekiston Respublikasi jinoyat qonunchiligining vazifalari shaxsning huquq va erkinliklarini, mulkiyatni, jamiyat va davlat xavfsizligini, inson jamiyati tinchligini va xavfsizligini jinoyat huquq buzilishlaridan himoya qilishdan iborat.

Ushbu Kodeks jinoyat qilinayotgan xatti-harakatlarning jinoyatliligini, ularning jazolarini va boshqa jinoyat-huquqiy oqibatlarini belgilaydi.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '2',
      title: 'O\'zbekiston Respublikasi jinoyat qonunchiligi',
      content: `O'zbekiston Respublikasi jinoyat qonunchiligi O'zbekiston Respublikasi Konstitutsiyasiga asoslanadi va ushbu Kodeksdan iborat.

Jinoyat javobgarligining va jazoning asoslari hamda shartlarini belgilaydigan va boshqa jinoyat-huquqiy normalarni o'z ichiga olgan yangi qonunlar ushbu Kodeksga kiritilishi lozim.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '3',
      title: 'Jinoyat qonunining vazifalar',
      content: `Jinoyat qonuni shaxsning huquq va erkinliklarini, mulkni, iqtisodiy tizimni, tabiatni, konstitut

siyaviy tuzumni va O'zbekiston davlatchiligini, inson jamiyatining tinchlik va xavfsizligini jinoyat huquqbuzarliklaridan himoya qilish vazifasini bajaradi.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '25',
      title: 'Qasddan odam o\'ldirish',
      content: `Qasddan odam o'ldirish - o'ldirishga qasdlangan xatti-harakat natijasida boshqa shaxsning hayotidan mahrum etilishi.

O'n yildan o'n to'rt yilgacha ozodlikdan mahrum qilish bilan jazolanadi.`,
      category: 'Shaxsga qarshi jinoyatlar',
      penalties: 'Ozodlikdan mahrum qilish 10-14 yil',
      references: ['JK 97', 'JK 98']
    },
    {
      number: '97',
      title: 'Tan jarohati yetkazish',
      content: `Qasddan yengil tan jarohati yetkazish - bu vaqtinchalik mehnatga layoqatsizlik yoki umumiy mehnatga layoqatlikning oz miqdorda doimiy yo'qotilishi bilan bog'liq jarohot.

Jarima to o'ttiz barobar minimal ish haqiga yoki ikki yilgacha isloh ishlar bilan jazolanadi.`,
      category: 'Shaxsga qarshi jinoyatlar',
      penalties: 'Jarima yoki isloh ishlari',
      references: ['JK 98', 'JK 99', 'JK 100']
    },
    {
      number: '98',
      title: 'Qasddan o\'rta og\'irlikdagi tan jarohati yetkazish',
      content: `Qasddan o'rta og'irlikdagi tan jarohati yetkazish - hayot uchun xavfli bo'lmagan, lekin uch haftadan oshiq vaqt mobaynida kasallik yoki umumiy mehnatga layoqatlikning sezilarli darajada doimiy yo'qotilishi bilan bog'liq jarohot.

Uch yilgacha ozodlikdan mahrum qilish bilan jazolanadi.`,
      category: 'Shaxsga qarshi jinoyatlar',
      penalties: 'Ozodlikdan mahrum qilish 3 yilgacha',
      references: ['JK 97', 'JK 99', 'JK 104']
    },
    {
      number: '169',
      title: 'O\'g\'irlik',
      content: `O'g'irlik - bu boshqa biror kishining mulkini yashirin ravishda o'g'irlash.

Jarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.

QUYIDAGI HOLLARDA AYBDORLIK OG'IRLASHADI:
a) Bir guruh shaxslar tomonidan;
b) Boshqa birov kishining turar-joyiga noqonuniy kirib;
c) Sezilarli miqdorda zarar yetkazgan holda - uch yildan besh yilgacha ozodlikdan mahrum qilish.

YIRIK MIQDORDA zarar yetkazilgan holda - besh yildan o'n yilgacha ozodlikdan mahrum qilish.

AYNIQSA YIRIK MIQDORDA zarar yetkazilgan holda - o'n yildan o'n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.`,
      category: 'Mulkka qarshi jinoyatlar',
      penalties: 'Jarima, isloh ishlari yoki 2 yilgacha ozodlikdan mahrum qilish. Og\'irlashtirilgan holda 15 yilgacha',
      references: ['JK 168', 'JK 170', 'JK 171', 'JK 172']
    },
    {
      number: '170',
      title: 'Talonchilik',
      content: `Talonchilik - boshqa biror kishining mulkini ochiq ravishda tortib olish.

Uch yildan etti yilgacha ozodlikdan mahrum qilish bilan jazolanadi.

QUYIDAGI HOLLARDA:
a) Bir guruh shaxslar tomonidan;
b) Zo'ravonlik qo'llagan yoki zo'ravonlik qo'llash tahdidi bilan;
c) Yirik miqdorda zarar yetkazgan holda -

Besh yildan o'n yilgacha ozodlikdan mahrum qilish bilan jazolanadi.

AYNIQSA OG'IR HOLLARDA - o'n yildan o'n besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.`,
      category: 'Mulkka qarshi jinoyatlar',
      penalties: '3-7 yil, og\'irlashtirilgan 5-10 yil, juda og\'ir 10-15 yil',
      references: ['JK 169', 'JK 171', 'JK 25']
    },
    {
      number: '205',
      title: 'Firibgarlik',
      content: `Firibgarlik - aldov yo'li bilan yoki ishonchni suiiste'mol qilish yo'li bilan boshqa birov kishining mulkini egallab olish yoki mulk huquqiga ega bo'lish.

Jarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.

QUYIDAGI HOLLARDA:
a) Oldindan kelishilgan bir guruh shaxslar tomonidan;
b) Sezilarli miqdorda zarar yetkazgan holda -

Uch yildan besh yilgacha ozodlikdan mahrum qilish bilan jazolanadi.

YIRIK MIQDORDA zarar yetkazilgan holda - besh yildan o'n yilgacha ozodlikdan mahrum qilish.`,
      category: 'Mulkka qarshi jinoyatlar',
      penalties: 'Jarima, 2 yilgacha isloh ishi, yoki ozodlikdan mahrum qilish',
      references: ['JK 169', 'JK 170']
    }
  ]
};

// ============================================================================
// FUQAROLIK KODEKSI (FK)
// ============================================================================

export const CIVIL_CODE: LegalCode = {
  id: 'civil_code',
  name: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
  shortName: 'FK',
  description: 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati',
  totalArticles: 1031,
  effectiveDate: '01.03.1997',
  articles: [
    {
      number: '1',
      title: 'Fuqarolik qonunchiligi bilan tartibga solinadigan munosabatlar',
      content: `Fuqarolik qonunchiligi mulkiy va mulkiy bo'lmagan shaxsiy munosabatlarni tartibga soladi.

Fuqarolik qonunchiligi shaxslarning mulkiy munosabatlari ishtirokchilarining huquqiy tengligiga, ularning xohish-irodalarining erkinligiga va mulkiy mustaqilligiga asoslanadi.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '8',
      title: 'Fuqarolik huquqlarining amalga oshirilishi',
      content: `Fuqarolar va yuridik shaxslar o'z xohishlariga ko'ra fuqarolik huquqlarini amalga oshiradilar.

Fuqarolik huquqlarini amalga oshirishdan voz kechish haqiqiy emas va huquqiy kuchga ega emas, agar qonunda boshqacha tartib nazarda tutilmagan bo'lsa.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '93',
      title: 'Mehnatga layoqatsizlik',
      content: `Fuqaroning mehnatga layoqatsiz deb topilishi uchun u o'z mehnat funktsiyalarini bajarish qobiliyatini butunlay yoki qisman yo'qotgan bo'lishi kerak.

Mehnatga layoqatsizlik tibbiy-ijtimoiy ekspertiza komissiyasi tomonidan belgilanadi.`,
      category: 'Shaxslar',
      references: ['MK 161', 'MK 242']
    },
    {
      number: '342',
      title: 'Shartnoma tushunchasi',
      content: `Shartnoma - ikki yoki undan ortiq shaxslarning fuqarolik huquqlari va majburiyatlarini belgilash, o'zgartirish yoki to'xtatish to'g'risidagi kelishuvi.

Shartnomaga fuqarolik qonunchiligi tomonidan bitimlar uchun belgilangan umumiy qoidalar qo'llaniladi.

SHARTNOMANING ASOSIY SHARTLARI:
1) Tomonlar (shartnoma ishtirokchilari);
2) Shartnoma predmeti (nima haqida kelishilmoqda);
3) Tomonlarning huquq va majburiyatlari;
4) Shartnomani buzishning oqibatlari;
5) Bahosi va to'lov tartibi (agar to'lov nazarda tutilgan bo'lsa).`,
      category: 'Majburiyatlar huquqi',
      references: ['FK 343', 'FK 367', 'FK 368']
    },
    {
      number: '367',
      title: 'Shartnomaning shakliy talablari',
      content: `Shartnoma og'zaki yoki yozma shaklda tuzilishi mumkin.

YOZMA SHAKL majburiy quyidagi hollarda:
1) Agar qonun yoki tomonlar kelishuvi shuni talab qilsa;
2) Yuridik shaxslar o'rtasida;
3) Miqdori o'n barobar minimal ish haqidan ortiq bo'lgan hollarda;
4) Notarial tasdiqlash talab qilingan hollarda.

Yozma shaklda tuzilishi lozim bo'lgan shartnomaning sharti buzilishi shartnomaning haqiqiy emasligiga olib kelishi mumkin.`,
      category: 'Majburiyatlar huquqi',
      references: ['FK 342', 'FK 368', 'FK 369']
    },
    {
      number: '368',
      title: 'Shartnomani buzish',
      content: `Shartnoma bir tomonning ixtiyoriy ravishda o'z majburiyatini bajarmay qo'yishi yoki lozim darajada bajarmasligi natijasida buzilgan deb hisoblanadi.

SHARTNOMANI BUZISH OQIBATLARI:
1) Shartnomani bekor qilish huquqi;
2) Yetkazilgan zararni qoplash;
3) Jarima va neustoyka to'lash;
4) Majburiy bajarish talab qilish.

Shartnomani buzish majburiy ravishda tomonlarning kelishuvi yoki sud qarori bilan amalga oshiriladi.`,
      category: 'Majburiyatlar huquqi',
      penalties: 'Zarar qoplash, jarima, shartnomani bekor qilish',
      references: ['FK 342', 'FK 367', 'FK 369']
    },
    {
      number: '369',
      title: 'Neustoyka (jarim penalties)',
      content: `Neustoyka - majburiyatni bajarmaslik yoki lozim darajada bajarmaslik uchun kreditor foydasiga qarzdor to'lashi kerak bo'lgan pul miqdori yoki foiz.

NEUSTOYKA TURLARI:
1) Jarima - bir martalik to'lov;
2) Pеnya - har bir kech qolgan kun uchun foiz.

Neustoyka to'lash majburiyatni bajarish majburiyatini bekor qilmaydi.

Neustoyka qonun yoki shartnoma asosida belgilanishi mumkin. Qonuniy neustoyka shartnoma bilan o'zgartirilishi mumkin, agar qonunda boshqacha ko'rsatilmagan bo'lsa.`,
      category: 'Majburiyatlar huquqi',
      references: ['FK 368', 'FK 370']
    }
  ]
};

// ============================================================================
// MEHNAT KODEKSI (MK)
// ============================================================================

export const LABOR_CODE: LegalCode = {
  id: 'labor_code',
  name: 'O\'zbekiston Respublikasi Mehnat kodeksi',
  shortName: 'MK',
  description: 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati',
  totalArticles: 359,
  effectiveDate: '01.04.1996',
  articles: [
    {
      number: '1',
      title: 'Mehnat qonunchiligining asosiy vazifalari',
      content: `Mehnat qonunchiligining asosiy vazifalari quyidagilardan iborat:

1) Ish beruvchilar va ishchilar o'rtasidagi munosabatlarni tartibga solish;
2) Mehnat huquqlari va erkinliklarini ta'minlash;
3) Mehnat shartlarini yaxshilash;
4) Ishchilarning ijtimoiy himoyasi;
5) Mehnat nizolarini hal qilish.`,
      category: 'Umumiy qismlar'
    },
    {
      number: '77',
      title: 'Mehnat shartnomasining tuzilishi',
      content: `Mehnat shartnomasi ishchi va ish beruvchi o'rtasida yozma shaklda tuziladi.

MEHNAT SHARTNOMASI QUYIDAGILARNI O'Z ICHIGA OLISHI KERAK:
1) Tomonlarning F.I.Sh. va passport ma'lumotlari;
2) Ish joyi va lavozim;
3) Ish haqi miqdori va to'lov tartibi;
4) Ish vaqti va dam olish vaqti;
5) Shartnoma muddati (agar muddatli bo'lsa);
6) Ijtimoiy kafolatlar;
7) Boshqa muhim shartlar.

Mehnat shartnomasi imzolanganidan keyin uch kun ichida ish beruvchi tomonidan davlat mehnat inspektsiyasiga ro'yxatdan o'tkazilishi lozim.`,
      category: 'Mehnat shartnomasi',
      references: ['MK 78', 'MK 161']
    },
    {
      number: '161',
      title: 'Ishdan bo\'shatishning umumiy asoslari',
      content: `Mehnat shartnomasi quyidagi asoslar bo'yicha bekor qilinishi (ishdan bo'shatish) mumkin:

1) TOMONLARNING KELISHUVI BILAN - istalgan vaqtda;

2) SHARTNOMA MUDDATI TUGASHI - muddatli shartnomalar uchun;

3) ISHCHINING O'Z XOHISHI BILAN:
   - Ikki hafta oldin yozma xabarnoma berish bilan;
   - Muhim sabablarga ko'ra (pensiyaga chiqish, o'qishga kirish) - darhol;

4) ISH BERUVCHINING TASHABBUSI BILAN:
   a) Korxona tugatilganda;
   b) Ishchilar sonini qisqartirishda;
   c) Ishchi o'z majburiyatlarini bajarmasligi:
      - Malakasining mos kelmasligi;
      - Mehnat intizomini muntazam buzishi;
      - Og'ir mehnat intizomi buzilishi (bir marta);
      - Ish vaqtida mast holda kelish;
      - O'g'irlik, buzg'unchilik;
   d) Ishga kelmaslik (3 kundan ortiq);
   e) Ishonchni yo'qotish (mas'ul lavozimlar uchun);

5) ISHCHINING O'LIMIDA yoki sud qarori bilan;

6) BOSHQA QONUNIY ASOSLAR bo'yicha.

MUHIM:
- Homilador ayollar va 3 yoshgacha bola onalarini ishdan bo'shatish taqiqlanadi (korxona tugatilishi bundan mustasno);
- Ishdan bo'shatish faqat yozma buyruq bilan rasmiylashtiriladi;
- Ishchi ishdan bo'shatish to'g'risidagi buyruq bilan tanishtirilishi kerak;
- Ishdan bo'shatilganda barcha to'lovlar (ish haqi, tatil puli va boshqalar) to'liq to'lanadi.`,
      category: 'Mehnat shartnomasi',
      penalties: 'Noqonuniy ishdan boshatish uchun - ishga qaytarish va majburiy kompensatsiya',
      references: ['MK 77', 'MK 242', 'FK 93', 'MK 162', 'MK 163']
    },
    {
      number: '162',
      title: 'Ishdan boshatish tartibi',
      content: `Ishdan boshatish quyidagi tartibda amalga oshiriladi:

1) YOZMA XABARNOMA - ish beruvchi ishchini ishdan boshatish togrisida yozma ravishda xabardor qiladi;

2) ISH TOPSHIRISH - ishchi oz ish joyini, hujjatlarni va mulkni topshiradi;

3) BUYRUQ CHIQARISH - ish beruvchi ishdan boshatish togrisida buyruq chiqaradi;

4) MEHNAT DAFTARIDA YOZUV - ishdan boshatish mehnat daftariga kiritiladi;

5) TOLOVLAR - barcha tolovlar (ish haqi, tatil, kompensatsiya) toliq tolanadi;

6) HISOB-KITOB - oxirgi ish kunida yoki keyingi kun ichida amalga oshiriladi.

NOQONUNIY ISHDAN BOSHATISH:
- Ishchi sudga shikoyat qilishi mumkin (3 oy ichida);
- Sud ishga qaytarishi mumkin;
- Majburiy kompensatsiya tolash.`,
      category: 'Mehnat shartnomasi',
      references: ['MK 161', 'MK 242']
    },
    {
      number: '242',
      title: 'Ish haqi to\'lash tartibi',
      content: `Ish haqi kamida oyiga ikki marta - har oy 25-kunidan kechiktirmay va oldingi oyning ish haqi har oyning 10-kunidan kechiktirmay to'lanadi.

ISH HAQI TO'LASH QOIDALARI:
1) To'liq summasida (chegirmalar qonun asosida);
2) O'z vaqtida (kechiktirishsiz);
3) Naqd yoki bank o'tkazmasi orqali;
4) Ishchining roziligi bilan;

ISH HAQI USHLANISHI:
- Soliq (11%);
- Pensiya jamg'armasi (7.5%);
- Sud qarori bo'yicha aliment va boshqa to'lovlar;

KECHIKTIRISHDA JAVOBGARLIK:
- Har bir kech qolgan kun uchun 1% miqdorida pul jarima;
- Ma'muriy javobgarlik (jarima);
- Mehnat inspektsiyasi tomonidan tekshiruv.`,
      category: 'Ish haqi',
      penalties: 'Har kun uchun 1% jarima, ma\'muriy javobgarlik',
      references: ['MK 161', 'FK 369']
    },
    {
      number: '113',
      title: 'Ish vaqti davomiyligi',
      content: `Normal ish vaqti haftasiga 40 soatdan oshmasligi kerak.

QISQARTIRILGAN ISH VAQTI:
- 16 yoshgacha - haftasiga 36 soat;
- Og'ir sharoitda ishlaydiganlar - 36 soat;
- Nogironlar (1-2 guruh) - 36 soat;
- O'qiydigan yoshlar - 36 soat;

QISMAN BANDLIK mumkin - tomonlar kelishuviga ko'ra.

ISH VAQTI TAQSIMOTI - korxona tomonidan belgilanadi, lekin:
- Kuniga 8 soatdan oshmasligi;
- Haftasiga 40 soatdan oshmasligi;
- Dam olish kunlari bo'lishi kerak.`,
      category: 'Ish vaqti va dam olish',
      references: ['MK 114', 'MK 115']
    }
  ]
};

// ============================================================================
// MA'MURIY JAVOBGARLIK KODEKSI (MJK)
// ============================================================================

export const ADMINISTRATIVE_CODE: LegalCode = {
  id: 'admin_code',
  name: 'O\'zbekiston Respublikasi Ma\'muriy javobgarlik to\'g\'risida kodeks',
  shortName: 'MJK',
  description: 'Ma\'muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun',
  totalArticles: 526,
  effectiveDate: '01.04.1995',
  articles: [
    {
      number: '1',
      title: 'Ma\'muriy qonunchilik vazifalari',
      content: `Ma'muriy qonunchilik shaxslar, jamiyat va davlat manfaatlarini huquqbuzarliklardan himoya qilish, huquqbuzarliklarga yo'l qo'yilishining oldini olish vazifasini bajaradi.

Ma'muriy javobgarlik belgilash jinoyat qonunchiligi vazifasini to'ldiradi.`,
      category: 'Umumiy qoida'
    },
    {
      number: '48',
      title: 'Yo\'l harakati qoidalarini buzish',
      content: `Yo'l harakati qoidalarini buzish - haydovchilar, piyodalar va boshqa yo'l harakati ishtirokchilarining qoidalarni buzishi.

JAZO:
- Jarima - 2-5 barobar bazaviy hisoblash miqdori;
- Qayta qilganda - 5-10 barobar;
- Og'ir hollarda - huquqdan mahrum qilish 3-6 oy.

OG'IR BUZILISHLAR:
- Mast holda boshqarish - 20-30 barobar jarima + huquqdan mahrum 2 yil;
- Qizil chiroqdan o'tish - 10 barobar jarima;
- Tezlikni oshirish (40+ km/soat) - 10-15 barobar jarima.`,
      category: 'Yo\'l harakati xavfsizligi',
      penalties: '2-30 barobar jarima, huquqdan mahrum qilish',
      references: ['MJK 125', 'MJK 126']
    },
    {
      number: '183',
      title: 'Jamoat tartibini buzish',
      content: `Jamoat tartibini buzish - fuqarolarning tinchligini buzish, ommaviy bezovtalanish qilish, haqorat qilish va boshqa noodob xatti-harakatlar.

JAZO:
- Jarima - 5-10 barobar bazaviy hisoblash miqdori;
- Ma'muriy qamog 15 kungacha.

QAYTA QILGANDA yoki guruh bo'lib qilganda - jarima 10-20 barobar yoki ma'muriy qamog 30 kungacha.`,
      category: 'Jamoat tartibi',
      penalties: 'Jarima 5-20 barobar, ma\'muriy qamog 15-30 kun'
    }
  ]
};

// ============================================================================
// EXPORT ALL CODES
// ============================================================================

export const ALL_LEGAL_CODES = [
  CRIMINAL_CODE,
  CIVIL_CODE,
  LABOR_CODE,
  ADMINISTRATIVE_CODE
];

export const getLegalCodeById = (id: string): LegalCode | undefined => {
  return ALL_LEGAL_CODES.find(code => code.id === id);
};

export const searchLegalArticles = (query: string): LegalArticle[] => {
  const lowerQuery = query.toLowerCase();
  const results: LegalArticle[] = [];

  ALL_LEGAL_CODES.forEach(code => {
    code.articles.forEach(article => {
      if (
        article.number.includes(lowerQuery) ||
        article.title.toLowerCase().includes(lowerQuery) ||
        article.content.toLowerCase().includes(lowerQuery) ||
        article.category?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(article);
      }
    });
  });

  return results;
};

export const getArticleByNumber = (codeId: string, articleNumber: string): LegalArticle | undefined => {
  const code = getLegalCodeById(codeId);
  if (!code) return undefined;
  
  return code.articles.find(article => article.number === articleNumber);
};
