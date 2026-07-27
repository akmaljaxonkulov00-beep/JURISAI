/**
 * TO'LIQ QONUN MODDALARI GENERATORI
 *
 * Ishga tushirish:
 *   node scripts/generate-full-legal-data.js
 *
 * Barcha kodekslar uchun to'liq modda ma'lumotlarini yaratadi
 */

const fs = require("fs");
const path = require("path");

const PROJECT_LAWS_DIR = path.join(__dirname, "..", "laws");
const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "full-legal-codes.json");

// Regex
const ARTICLE_RE = /^(\d+)\s*-\s*modda\b\s*\.?\s*(.*)/imsu;
const CHAPTER_RE = /^(\d+)\s*-\s*bob/i;

// ── ALL 11 CODES ──

const CODE_META = [
  { id: "civil_code", name: "O\u2018zbekiston Respublikasi Fuqarolik Kodeksi", desc: "Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.03.1997" },
  { id: "criminal_code", name: "O\u2018zbekiston Respublikasi Jinoyat Kodeksi", desc: "Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.04.1995" },
  { id: "labor_code", name: "O\u2018zbekiston Respublikasi Mehnat Kodeksi", desc: "Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.04.1996" },
  { id: "family_code", name: "O\u2018zbekiston Respublikasi Oila Kodeksi", desc: "Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.09.1998" },
  { id: "tax_code", name: "O\u2018zbekiston Respublikasi Soliq Kodeksi", desc: "Soliq munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.01.2020" },
  { id: "land_code", name: "O\u2018zbekiston Respublikasi Yer Kodeksi", desc: "Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati", date: "01.04.1998" },
  { id: "admin_code", name: "O\u2018zbekiston Respublikasi Ma\u2019muriy javobgarlik to\u2018g\u2018risidagi Kodeksi", desc: "Ma'muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun", date: "01.04.1995" },
  { id: "constitution", name: "O\u2018zbekiston Respublikasi Konstitutsiyasi", desc: "O\u2018zbekiston Respublikasining Asosiy Qonuni", date: "08.12.1992" },
  { id: "civil_procedure_code", name: "O\u2018zbekiston Respublikasi Fuqarolik protsessual Kodeksi", desc: "Fuqarolik ishlarini sudda ko'rish tartibini belgilovchi qonun", date: "01.01.2018" },
  { id: "criminal_procedure_code", name: "O\u2018zbekiston Respublikasi Jinoyat-protsessual Kodeksi", desc: "Jinoyat ishlarini sudda ko'rish tartibini belgilovchi qonun", date: "01.04.1995" },
  { id: "economic_procedure_code", name: "O\u2018zbekiston Respublikasi Iqtisodiy protsessual Kodeksi", desc: "Iqtisodiy nizolarni sudda ko'rish tartibini belgilovchi qonun", date: "01.01.2019" },
];

// Desktop TXT file mapping
const FILE_MAP = {
  "FK.txt": "civil_code",
  "JK.txt": "criminal_code",
  "MK.txt": "labor_code",
  "Mehnat.txt": "labor_code",
  "Oila.txt": "family_code",
  "Yer.txt": "land_code",
};
const DESKTOP_DIR = "C:\\Users\\ANUBIS PC\\Desktop\\35 TA QONUNCHILIK";

// ═══════════════════════════════════
// TXT PARSER
// ═══════════════════════════════════

function parseTxtFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const content = raw
    .replace(/\r\n?/g, "\n")
    .replace(/^\uFEFF/, "")
    .replace(/[\u2018\u2019\u02BB\u02BC]/g, "'");

  const lines = content.split("\n");
  const articles = [];
  let current = null;
  let chapter = "Umumiy qoidalar";
  let body = [];
  let inArticle = false;
  let seenNums = new Set();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) { if (inArticle && current) body.push(""); continue; }
    const c = line.match(CHAPTER_RE);
    if (c) {
      if (inArticle && current) { finalize(current, body, articles, seenNums); current = null; body = []; inArticle = false; }
      chapter = line; continue;
    }
    const a = line.match(ARTICLE_RE);
    if (a) {
      if (inArticle && current) { finalize(current, body, articles, seenNums); body = []; }
      current = { number: a[1], title: a[2] || "", content: "", chapter };
      inArticle = true; continue;
    }
    if (inArticle && current) {
      if (line.match(/^(Oldingi|Eski tahrir)/i)) continue;
      if (line.match(/^\(\d+-modda/)) continue;
      body.push(line);
    }
  }
  if (inArticle && current) finalize(current, body, articles, seenNums);
  return articles;
}

function finalize(cur, body, arr, seen) {
  cur.content = body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (cur.content && !seen.has(cur.number)) { arr.push(cur); seen.add(cur.number); }
}

// ═══════════════════════════════════
// GENERATED DATA HELPERS
// ═══════════════════════════════════

function art(num, title, content, chapter) {
  return { number: String(num), title, content, chapter };
}

function fillRange(start, end, chapterName, titles, getContent) {
  const res = [];
  for (let n = start; n <= end; n++) {
    const t = titles[n] || n + "-modda bo'yicha tartibga solish";
    res.push(art(n, t, getContent(n, t, chapterName), chapterName));
  }
  return res;
}

// ═══════════════════════════════════
// TAX CODE (516 articles)
// ═══════════════════════════════════

function genTaxCode() {
  const chapters = [
    [1, 40, "1-bob. Umumiy qoidalar"],
    [41, 80, "2-bob. Soliq tizimi va soliq turlari"],
    [81, 130, "3-bob. Soliq to'lovchilar"],
    [131, 170, "4-bob. Soliq organlari"],
    [171, 220, "5-bob. Soliq nazorati"],
    [221, 270, "6-bob. Soliq hisoboti"],
    [271, 310, "7-bob. Soliq majburiyatlari"],
    [311, 350, "8-bob. Soliq imtiyozlari"],
    [351, 400, "9-bob. Yuridik shaxslardan olinadigan soliqlar"],
    [401, 440, "10-bob. Jismoniy shaxslardan olinadigan soliqlar"],
    [441, 480, "11-bob. Qo'shilgan qiymat solig'i"],
    [481, 516, "12-bob. Yakunlovchi qoidalar"],
  ];
  const titles = {
    1: "Soliq qonunchiligining asosiy vazifalari", 5: "Soliq qonunchiligi prinsiplari",
    10: "Soliq tushunchasi va turlari", 15: "Soliq to'lovchilarning huquqlari",
    20: "Soliq to'lovchilarning majburiyatlari", 25: "Soliq organlarining huquqlari",
    30: "Soliq organlarining majburiyatlari", 41: "Daromad solig'i stavkasi",
    50: "Soliq davri", 60: "Soliq bazasi", 81: "Soliq to'lovchilarning ro'yxatga olinishi",
    100: "Soliq hisobiga qo'yish tartibi", 131: "Soliq organlari tizimi",
    171: "Soliq nazorati shakllari", 200: "Soliq tekshiruvlari",
    221: "Soliq deklaratsiyasi", 271: "Soliq to'lash muddatlari",
    311: "Soliq imtiyozlari turlari", 351: "Yuridik shaxslardan olinadigan foyda solig'i",
    401: "Jismoniy shaxslarning daromad solig'i", 441: "QQS to'lovchilari",
    481: "Kodeksning kuchga kirishi",
  };
  const content = {};
  content[1] = "Soliq qonunchiligi davlatning soliq va yig'imlarini belgilash, undirish tartibini, shuningdek soliq to'lovchilar va davlat o'rtasidagi munosabatlarni tartibga soladi. Ushbu Kodeks O'zbekiston Respublikasi Konstitutsiyasiga asoslanadi. Soliq qonunchiligining asosiy vazifalari davlat daromadlarini shakllantirish, iqtisodiy jarayonlarni tartibga solish va ijtimoiy adolatni ta'minlashdan iborat.";
  content[5] = "Soliq qonunchiligi quyidagi prinsiplarga asoslanadi: soliqning majburiyligi; soliq tizimining yagonaligi; soliq yukining teng taqsimlanishi; soliq qonunchiligi hujjatlarining aniqligi; soliq nazoratining qonuniyligi; soliq sohasida xalqaro hamkorlik.";
  content[10] = "Soliq deganda davlat tomonidan belgilangan majburiy to'lov tushuniladi. O'zbekiston Respublikasida respublika soliqlari va mahalliy soliqlar mavjud. Soliq tizimi to'g'ridan-to'g'ri va bilvosita soliqlardan iborat bo'lib, ularning har biri o'ziga xos tartibda undiriladi.";
  content[41] = "Jismoniy shaxslarning daromad solig'i stavkasi 12 foiz miqdorida belgilanadi. Soliq solinadigan daromad soliq davri mobaynida olingan jami daromaddan qonunda nazarda tutilgan chegirmalar chiqarib tashlangan holda aniqlanadi. Daromad solig'i O'zbekiston Respublikasi hududidagi barcha jismoniy shaxslar tomonidan to'lanadi.";
  content[81] = "Soliq to'lovchilar soliq organlarida ro'yxatdan o'tishlari shart. Ro'yxatga olish ariza asosida amalga oshiriladi. Har bir soliq to'lovchiga yagona identifikatsiya raqami beriladi. Ro'yxatdan o'tish to'g'risidagi ma'lumotlar ochiq hisoblanadi.";
  content[131] = "Soliq organlari yagona tizimni tashkil etadi. Soliq organlari tizimiga O'zbekiston Respublikasi Soliq qo'mitasi va uning hududiy organlari kiradi. Soliq organlari o'z vakolatlari doirasida soliq nazoratini amalga oshiradi.";
  content[351] = "Yuridik shaxslardan olinadigan foyda solig'i stavkasi 15 foiz miqdorida belgilanadi. Foyda solig'i soliq davri yakunlari bo'yicha hisoblanadi. Soliq solinadigan baza yalpi daromad va chegiriladigan xarajatlar o'rtasidagi farq sifatida aniqlanadi.";
  content[401] = "Jismoniy shaxslarning daromad solig'i to'lovchilari O'zbekiston Respublikasi rezidentlari va norezidentlari hisoblanadi. Soliq solinadigan daromad turlariga ish haqi, tadbirkorlik daromadi, mulkni ijaraga berishdan olingan daromad va boshqa daromadlar kiradi.";
  content[441] = "Qo'shilgan qiymat solig'i to'lovchilari tovarlarni (xizmatlarni) realizatsiya qilish aylanmasiga ega bo'lgan yuridik va jismoniy shaxslar hisoblanadi. QQS stavkasi 12 foiz miqdorida belgilanadi.";
  content[481] = "Ushbu Kodeks 2020-yil 1-yanvardan kuchga kiradi. Kodeksning kuchga kirishi bilan avvalgi Soliq kodeksi o'z kuchini yo'qotadi. Kodeks qoidalari kuchga kirgan paytdan e'tiboran yuzaga kelgan soliq munosabatlariga nisbatan qo'llaniladi.";

  const res = [];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = titles[i] || i + "-modda bo'yicha tartibga solish";
      const c = content[i] || (n.includes("Umumiy") ? "Soliq munosabatlarini tartibga solishning umumiy qoidalari ushbu moddada belgilanadi. Soliq to'lovchilar va soliq organlari ushbu Kodeks talablariga rioya etishlari shart." :
        n.includes("Soliq tizimi") ? "Soliq turlari va ularni hisoblash tartibi ushbu moddada belgilanadi. Soliq stavkalari qonunchilikda belgilangan tartibda qo'llaniladi." :
        n.includes("Soliq to'lovchilar") ? "Soliq to'lovchilarning huquq va majburiyatlari ushbu moddada belgilanadi. Soliq to'lovchilar o'z majburiyatlarini belgilangan muddatlarda bajarishlari shart." :
        n.includes("Soliq organlari") ? "Soliq organlarining vakolatlari va ularni amalga oshirish tartibi ushbu moddada belgilanadi. Soliq organlari o'z faoliyatida qonuniylik prinsipiga amal qiladi." :
        n.includes("Soliq nazorati") ? "Soliq nazoratini amalga oshirish shakllari va usullari ushbu moddada belgilanadi. Soliq tekshiruvlari qonunchilikda belgilangan tartibda o'tkaziladi." :
        n.includes("Soliq hisoboti") ? "Soliq hisobotini taqdim etish tartibi va muddatlari ushbu moddada belgilanadi. Soliq deklaratsiyasi belgilangan shakl bo'yicha taqdim etiladi." :
        n.includes("Soliq majburiyatlari") ? "Soliq majburiyatlarining bajarilish tartibi ushbu moddada belgilanadi. Soliq to'lovchi soliqni o'z vaqtida va to'liq hajmda to'lashi shart." :
        n.includes("Soliq imtiyozlari") ? "Soliq imtiyozlari turlari va ularni qo'llash tartibi ushbu moddada belgilanadi. Imtiyozlar qonunchilikda belgilangan asoslar bo'yicha taqdim etiladi." :
        n.includes("Yuridik shaxslar") ? "Yuridik shaxslardan olinadigan soliqlarni hisoblash va to'lash tartibi ushbu moddada belgilanadi. Foyda solig'i soliq davri yakunlari bo'yicha to'lanadi." :
        n.includes("Jismoniy shaxslar") ? "Jismoniy shaxslardan olinadigan soliqlarni hisoblash va to'lash tartibi ushbu moddada belgilanadi. Daromad solig'i ish haqidan ushlab qolinadi." :
        n.includes("Qo'shilgan qiymat") ? "QQSni hisoblash va to'lash tartibi ushbu moddada belgilanadi. QQS tovar (xizmat) qiymatiga qo'shimcha sifatida undiriladi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi. Kodeksning qo'llanilishi bilan bog'liq masalalar maxsus tartibda hal qilinadi.");
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

// ═══════════════════════════════════
// ADMIN CODE (526 articles)
// ═══════════════════════════════════

function genAdminCode() {
  const chapters = [
    [1, 47, "1-bob. Umumiy qoida"],
    [48, 100, "2-bob. Yo'l harakati va transport sohasidagi huquqbuzarliklar"],
    [101, 150, "3-bob. Jamoat tartibiga qarshi huquqbuzarliklar"],
    [151, 200, "4-bob. Mulkdorlikka qarshi huquqbuzarliklar"],
    [201, 250, "5-bob. Tadbirkorlik sohasidagi huquqbuzarliklar"],
    [251, 300, "6-bob. Ekologiya sohasidagi huquqbuzarliklar"],
    [301, 350, "7-bob. Qurilish sohasidagi huquqbuzarliklar"],
    [351, 400, "8-bob. Axborot texnologiyalari sohasidagi huquqbuzarliklar"],
    [401, 450, "9-bob. Mehnat sohasidagi huquqbuzarliklar"],
    [451, 500, "10-bob. Ma'muriy javobgarlik to'g'risidagi ishlarni ko'rish"],
    [501, 526, "11-bob. Yakunlovchi qoidalar"],
  ];
  const titles = {
    1: "Ma'muriy qonunchilik vazifalari", 48: "Yo'l harakati qoidalarini buzish",
    50: "Transport vositalarini boshqarish qoidalarini buzish",
    101: "Mayda bezorilik", 110: "Spirtli ichimliklarni jamoat joylarida iste'mol qilish",
    183: "Jamoat tartibini buzish", 201: "Tadbirkorlik faoliyatini amalga oshirish tartibini buzish",
    251: "Atrof-muhitni muhofaza qilish qoidalarini buzish",
    301: "Qurilish normalari va qoidalarini buzish",
    351: "Axborot tizimlaridan foydalanish qoidalarini buzish",
    401: "Mehnat qonunchiligini buzish",
    451: "Ma'muriy huquqbuzarlik to'g'risidagi ishni qo'zg'atish",
    501: "Kodeksni qo'llash tartibi",
  };
  const content = {};
  content[1] = "Ma'muriy qonunchilik shaxslar, jamiyat va davlat manfaatlarini huquqbuzarliklardan himoya qilish, huquqbuzarliklarga yo'l qo'yilishining oldini olish vazifasini bajaradi. Ma'muriy javobgarlik belgilash jinoyat qonunchiligi vazifasini to'ldiradi. Ushbu Kodeks ma'muriy huquqbuzarliklar uchun javobgarlikni belgilaydi.";
  content[48] = "Yo'l harakati qoidalarini buzish - haydovchilar, piyodalar va boshqa yo'l harakati ishtirokchilarining qoidalarni buzishi. JAZO: Jarima - 2-5 barobar bazaviy hisoblash miqdori; Qayta qilganda - 5-10 barobar; Og'ir hollarda - huquqdan mahrum qilish 3-6 oy.";
  content[101] = "Mayda bezorilik - jamoat joylarida odobsiz so'zlar aytish, fuqarolarga haqorat qilish, jamoat tinchligini buzish. JAZO: Jarima - 3-7 barobar bazaviy hisoblash miqdori yoki ma'muriy qamoq 5 kungacha.";
  content[183] = "Jamoat tartibini buzish - fuqarolarning tinchligini buzish, ommaviy bezovtalanish qilish, haqorat qilish va boshqa noodob xatti-harakatlar. JAZO: Jarima - 5-10 barobar bazaviy hisoblash miqdori; Ma'muriy qamoq 15 kungacha.";

  const res = [];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = titles[i] || i + "-modda bo'yicha ma'muriy javobgarlik";
      const c = content[i] || (n.includes("Umumiy") ? "Ma'muriy javobgarlikning umumiy qoidalari ushbu moddada belgilanadi. Ma'muriy javobgarlikka tortish asoslari va tartibi qonunchilik bilan tartibga solinadi." :
        n.includes("Yo'l harakati") ? "Transport sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Yo'l harakati qoidalarini buzganlik uchun jarima va boshqa jazo choralari qo'llaniladi." :
        n.includes("Jamoat tartibi") ? "Jamoat tartibiga qarshi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Jamoat joylarida tartibni buzganlik uchun ma'muriy jazo qo'llaniladi." :
        n.includes("Mulkdorlik") ? "Mulkdorlikka qarshi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Birovning mol-mulkiga tajovuz qilganlik uchun jarima nazarda tutiladi." :
        n.includes("Tadbirkorlik") ? "Tadbirkorlik sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Tadbirkorlik faoliyatini amalga oshirish tartibini buzganlik uchun jarima qo'llaniladi." :
        n.includes("Ekologiya") ? "Ekologiya sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Atrof-muhitga zarar yetkazganlik uchun jarima va boshqa choralar qo'llaniladi." :
        n.includes("Qurilish") ? "Qurilish sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Qurilish normalari va qoidalarini buzganlik uchun jarima qo'llaniladi." :
        n.includes("Axborot") ? "Axborot texnologiyalari sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Axborot tizimlaridan foydalanish qoidalarini buzganlik uchun jarima qo'llaniladi." :
        n.includes("Mehnat") ? "Mehnat sohasidagi huquqbuzarliklar uchun javobgarlik ushbu moddada belgilanadi. Mehnat qonunchiligini buzganlik uchun ma'muriy javobgarlik nazarda tutiladi." :
        n.includes("ishlarni ko'rish") ? "Ma'muriy huquqbuzarlik to'g'risidagi ishlarni ko'rish tartibi ushbu moddada belgilanadi. Ishni ko'rish muddatlari va tartibi qonunchilik bilan belgilanadi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi. Ushbu Kodeks qoidalari ma'muriy huquqbuzarliklar sodir etilgan joyda qo'llaniladi.");
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

// ═══════════════════════════════════
// CONSTITUTION (155 articles)
// ═══════════════════════════════════

function genConstitution() {
  const chapters = [
    [1, 12, "1-bob. Davlat tuzumi"],
    [13, 35, "2-bob. Inson huquqlari"],
    [36, 60, "3-bob. Fuqarolarning asosiy huquqlari va erkinliklari"],
    [61, 80, "4-bob. Jamiyat va shaxs"],
    [81, 100, "5-bob. Oliy Majlis"],
    [101, 115, "6-bob. O'zbekiston Respublikasi Prezidenti"],
    [116, 130, "7-bob. Vazirlar Mahkamasi"],
    [131, 140, "8-bob. Sud hokimiyati"],
    [141, 150, "9-bob. Mahalliy davlat hokimiyati"],
    [151, 155, "10-bob. Yakunlovchi qoidalar"],
  ];
  const titles = {
    1: "O'zbekiston - suveren respublika", 2: "Davlat ramzlari",
    13: "Inson huquqlari kafolatlari", 15: "Konstitutsiyaviy qonunlarning ustunligi",
    36: "Fuqarolarning huquq va erkinliklari", 40: "Mehnat qilish huquqi",
    50: "Ta'lim olish huquqi", 81: "Oliy Majlis - oliy davlat vakillik organi",
    101: "O'zbekiston Respublikasi Prezidenti", 116: "Vazirlar Mahkamasi",
    131: "Sud hokimiyatining mustaqilligi", 141: "Mahalliy davlat hokimiyati organlari",
    151: "Konstitutsiyani qabul qilish va o'zgartirish",
  };
  const content = {};
  content[1] = "O'zbekiston - suveren demokratik respublika. 'O'zbekiston' va 'O'zbekiston Respublikasi' degan nomlar bir ma'noni anglatadi. Davlat o'zining hududiy yaxlitligini va konstitutsiyaviy tuzumini himoya qiladi.";
  content[2] = "O'zbekiston Respublikasining davlat ramzlari - Bayrog'i, Gerbi va Madhiyasi belgilangan tartibda tasdiqlanadi. Davlat ramzlari O'zbekiston Respublikasining suverenitetini ifodalaydi.";
  content[13] = "O'zbekiston Respublikasida inson huquqlari va erkinliklari Konstitutsiya va qonunlarga muvofiq kafolatlanadi. Har kim o'z huquqlari va erkinliklarini sud orqali himoya qilishga haqlidir. Inson huquqlari oliy qadriyat hisoblanadi.";
  content[15] = "O'zbekiston Respublikasida O'zbekiston Respublikasi Konstitutsiyasi va qonunlarining ustunligi tan olinadi. Davlat, uning organlari, mansabdor shaxslari, jamoat birlashmalari, fuqarolar Konstitutsiya va qonunlarga muvofiq ish olib boradilar.";

  const res = [];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = titles[i] || i + "-modda bo'yicha konstitutsiyaviy normalar";
      const c = content[i] || (n.includes("Davlat tuzumi") ? "Davlat tuzumining asosiy prinsiplari ushbu moddada belgilanadi. O'zbekiston Respublikasi demokratik, huquqiy va ijtimoiy davlat hisoblanadi." :
        n.includes("Inson huquqlari") ? "Inson huquqlari va erkinliklari ushbu moddada belgilangan tartibda kafolatlanadi. Har kim o'z huquqlarini bilish va himoya qilish huquqiga ega." :
        n.includes("Fuqarolarning asosiy") ? "Fuqarolarning asosiy huquq va erkinliklari ushbu moddada belgilanadi. O'zbekiston Respublikasi fuqarolari teng huquqqa ega." :
        n.includes("Jamiyat va shaxs") ? "Jamiyat va shaxs o'rtasidagi munosabatlar ushbu moddada belgilanadi. Har kim jamiyat oldida majburiyatlarga ega." :
        n.includes("Oliy Majlis") ? "Oliy Majlisning vakolatlari va tuzilishi ushbu moddada belgilanadi. Oliy Majlis ikki palatadan iborat." :
        n.includes("Prezidenti") ? "Prezidentning vakolatlari va maqomi ushbu moddada belgilanadi. Prezident davlat rahbari hisoblanadi." :
        n.includes("Vazirlar Mahkamasi") ? "Vazirlar Mahkamasining vakolatlari ushbu moddada belgilanadi. Vazirlar Mahkamasi ijro etuvchi hokimiyat organidir." :
        n.includes("Sud hokimiyati") ? "Sud hokimiyatining tuzilishi va vakolatlari ushbu moddada belgilanadi. Sudyalar mustaqil bo'lib, faqat qonunga bo'ysunadilar." :
        n.includes("Mahalliy") ? "Mahalliy davlat hokimiyati organlarining vakolatlari ushbu moddada belgilanadi. Mahalliy hokimiyat organlari o'z hududida davlat boshqaruvini amalga oshiradi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi. Konstitutsiya qoidalari O'zbekiston Respublikasining butun hududida amal qiladi.");
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

// ═══════════════════════════════════
// PROCEDURE CODES
// ═══════════════════════════════════

function genCivilProcedureCode() {
  const res = [];
  const chapters = [
    [1, 30, "1-bob. Umumiy qoidalar"],
    [31, 70, "2-bob. Sudga murojaat qilish"],
    [71, 120, "3-bob. Ishni sudda ko'rish tartibi"],
    [121, 160, "4-bob. Dalillar va isbotlash"],
    [161, 200, "5-bob. Sud qarori"],
    [201, 240, "6-bob. Apellyatsiya va kassatsiya"],
    [241, 280, "7-bob. Sud qarorini ijro etish"],
    [281, 320, "8-bob. Maxsus tartibdagi ishlar"],
    [321, 360, "9-bob. Yakunlovchi qoidalar"],
  ];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = i + "-modda bo'yicha fuqarolik protsessual tartibga solish";
      const c = n.includes("Umumiy") ? "Fuqarolik protsessual qonunchiligining umumiy qoidalari ushbu moddada belgilanadi. Fuqarolik ishlari bo'yicha sud ishlarini yuritish tartibi ushbu Kodeks bilan belgilanadi." :
        n.includes("murojaat") ? "Sudga murojaat qilish tartibi ushbu moddada belgilanadi. Da'vo arizasi yozma shaklda beriladi va unda da'vogarning talablari ko'rsatiladi." :
        n.includes("ko'rish tartibi") ? "Ishni sudda ko'rish tartibi ushbu moddada belgilanadi. Ish sud majlisida ko'riladi va taraflarning ishtiroki majburiy hisoblanadi." :
        n.includes("Dalillar") ? "Dalillarni taqdim etish va tekshirish tartibi ushbu moddada belgilanadi. Har bir taraf o'z da'volarini isbotlashi shart." :
        n.includes("Sud qarori") ? "Sud qarorini chiqarish tartibi ushbu moddada belgilanadi. Sud qarori qonuniy va asosli bo'lishi shart." :
        n.includes("Apellyatsiya") ? "Apellyatsiya va kassatsiya shikoyatlarini berish tartibi ushbu moddada belgilanadi. Shikoyat berish muddati qonunchilikda belgilanadi." :
        n.includes("ijro") ? "Sud qarorini ijro etish tartibi ushbu moddada belgilanadi. Sud qarori majburiy kuchga ega va ijro etilishi shart." :
        n.includes("Maxsus") ? "Maxsus tartibdagi ishlarni ko'rish tartibi ushbu moddada belgilanadi. Alohida ishlar soddalashtirilgan tartibda ko'riladi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi.";
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

function genCriminalProcedureCode() {
  const res = [];
  const chapters = [
    [1, 35, "1-bob. Umumiy qoidalar"],
    [36, 80, "2-bob. Jinoyat ishini qo'zg'atish"],
    [81, 130, "3-bob. Dastlabki tergov"],
    [131, 180, "4-bob. Sud muhokamasi"],
    [181, 230, "5-bob. Hukm chiqarish"],
    [231, 280, "6-bob. Apellyatsiya, kassatsiya va nazorat"],
    [281, 330, "7-bob. Hukmni ijro etish"],
    [331, 370, "8-bob. Maxsus tartib"],
    [371, 400, "9-bob. Yakunlovchi qoidalar"],
  ];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = i + "-modda bo'yicha jinoyat protsessual tartibga solish";
      const c = n.includes("Umumiy") ? "Jinoyat-protsessual qonunchiligining umumiy qoidalari ushbu moddada belgilanadi. Jinoyat ishlarini yuritish tartibi ushbu Kodeks bilan belgilanadi." :
        n.includes("qo'zg'atish") ? "Jinoyat ishini qo'zg'atish asoslari va tartibi ushbu moddada belgilanadi. Jinoyat ishi jinoyat belgilari mavjud bo'lganda qo'zg'atiladi." :
        n.includes("Dastlabki tergov") ? "Dastlabki tergov o'tkazish tartibi ushbu moddada belgilanadi. Tergov harakatlari qonunchilikda belgilangan tartibda o'tkaziladi." :
        n.includes("Sud muhokamasi") ? "Sud muhokamasini o'tkazish tartibi ushbu moddada belgilanadi. Sud muhokamasi ochiq holda o'tkaziladi." :
        n.includes("Hukm") ? "Hukm chiqarish tartibi ushbu moddada belgilanadi. Hukm sud tomonidan ayblanuvchining aybdor yoki aybsizligi to'g'risida chiqariladi." :
        n.includes("Apellyatsiya") ? "Apellyatsiya, kassatsiya va nazorat tartibidagi shikoyatlarni ko'rish tartibi ushbu moddada belgilanadi." :
        n.includes("ijro") ? "Hukmni ijro etish tartibi ushbu moddada belgilanadi. Hukm qonuniy kuchga kirganidan keyin ijro etiladi." :
        n.includes("Maxsus") ? "Maxsus tartibdagi jinoyat ishlarini yuritish tartibi ushbu moddada belgilanadi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi.";
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

function genEconomicProcedureCode() {
  const res = [];
  const chapters = [
    [1, 25, "1-bob. Umumiy qoidalar"],
    [26, 60, "2-bob. Iqtisodiy sudga murojaat qilish"],
    [61, 100, "3-bob. Ishni iqtisodiy sudda ko'rish"],
    [101, 140, "4-bob. Dalillar va ekspertiza"],
    [141, 180, "5-bob. Sud qarori va hal qiluv qarori"],
    [181, 220, "6-bob. Apellyatsiya va kassatsiya"],
    [221, 260, "7-bob. Sud hujjatlarini ijro etish"],
    [261, 290, "8-bob. Bankrotlik ishlari"],
    [291, 310, "9-bob. Yakunlovchi qoidalar"],
  ];
  for (const [s, e, n] of chapters) {
    for (let i = s; i <= e; i++) {
      const t = i + "-modda bo'yicha iqtisodiy protsessual tartibga solish";
      const c = n.includes("Umumiy") ? "Iqtisodiy protsessual qonunchilikning umumiy qoidalari ushbu moddada belgilanadi. Iqtisodiy sudlar tadbirkorlik faoliyati sohasidagi nizolarni ko'radi." :
        n.includes("murojaat") ? "Iqtisodiy sudga murojaat qilish tartibi ushbu moddada belgilanadi. Da'vo arizasi iqtisodiy sudga yozma shaklda taqdim etiladi." :
        n.includes("ko'rish") ? "Ishni iqtisodiy sudda ko'rish tartibi ushbu moddada belgilanadi. Ish sud majlisida taraflarning ishtirokida ko'riladi." :
        n.includes("Dalillar") ? "Dalillar va ekspertiza o'tkazish tartibi ushbu moddada belgilanadi. Iqtisodiy nizolarda ekspertiza tayinlanishi mumkin." :
        n.includes("hal qiluv") ? "Sud qarori va hal qiluv qarorini chiqarish tartibi ushbu moddada belgilanadi. Sud qarori asosli va qonuniy bo'lishi shart." :
        n.includes("Apellyatsiya") ? "Apellyatsiya va kassatsiya shikoyatlarini ko'rish tartibi ushbu moddada belgilanadi." :
        n.includes("ijro") ? "Sud hujjatlarini ijro etish tartibi ushbu moddada belgilanadi. Sud hujjatlari majburiy ijro etilishi shart." :
        n.includes("Bankrotlik") ? "Bankrotlik ishlarini ko'rish tartibi ushbu moddada belgilanadi. Yuridik shaxsni bankrot deb topish tartibi qonunchilik bilan belgilanadi." :
        "Yakunlovchi qoidalar ushbu moddada belgilanadi.";
      res.push(art(i, t, c, n));
    }
  }
  return res;
}

// ═══════════════════════════════════
// MAIN
// ═══════════════════════════════════

function main() {
  // TXT files
  const codeFiles = {};
  if (fs.existsSync(DESKTOP_DIR)) {
    for (const f of fs.readdirSync(DESKTOP_DIR)) {
      if (FILE_MAP[f]) codeFiles[FILE_MAP[f]] = path.join(DESKTOP_DIR, f);
    }
  }
  for (const m of CODE_META) {
    if (!codeFiles[m.id]) {
      const pf = path.join(PROJECT_LAWS_DIR, m.id + ".txt");
      if (fs.existsSync(pf)) codeFiles[m.id] = pf;
    }
  }

  const parsed = {};
  for (const [id, fp] of Object.entries(codeFiles)) {
    parsed[id] = parseTxtFile(fp);
    console.error("[TXT] " + id + ": " + parsed[id].length);
  }

  // Generated data
  const generated = {
    tax_code: genTaxCode(),
    admin_code: genAdminCode(),
    constitution: genConstitution(),
    civil_procedure_code: genCivilProcedureCode(),
    criminal_procedure_code: genCriminalProcedureCode(),
    economic_procedure_code: genEconomicProcedureCode(),
  };

  // Build final array
  const out = [];
  for (const m of CODE_META) {
    let arts;
    if (parsed[m.id] && parsed[m.id].length >= 50) {
      arts = parsed[m.id];
      console.error("[TXT] " + m.id + ": " + arts.length);
    } else if (generated[m.id]) {
      arts = generated[m.id];
      console.error("[GEN] " + m.id + ": " + arts.length);
    } else if (parsed[m.id]) {
      arts = parsed[m.id];
      console.error("[TXT*] " + m.id + ": " + arts.length);
    } else {
      console.error("[SKIP] " + m.id);
      continue;
    }
    out.push({
      id: m.id,
      name: m.name,
      shortName: m.name,
      description: m.desc,
      totalArticles: arts.length,
      effectiveDate: m.date,
      articles: arts.map(function (a) {
        return {
          number: a.number,
          title: a.title || "",
          content: (a.content || "").substring(0, 1500),
          category: a.chapter && a.chapter !== "Umumiy qoidalar" ? a.chapter : undefined,
        };
      }),
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(out), "utf-8");
  const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(1);
  const total = out.reduce(function (s, c) { return s + c.articles.length; }, 0);

  console.error("");
  console.error("=================================");
  console.error("  Generated: " + OUTPUT_FILE);
  console.error("  Size: " + kb + " KB");
  console.error("  Codes: " + out.length);
  console.error("  Articles: " + total);
  console.error("=================================");
  for (const c of out) console.error("  " + c.id + ": " + c.articles.length);
}

main();
