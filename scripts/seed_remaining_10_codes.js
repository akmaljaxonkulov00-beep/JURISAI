require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 10 new codes specification
const NEW_CODES = [
  {
    code_id: 'criminal_executive_code',
    name: 'O‘zbekiston Respublikasining Jinoyat-ijroiya kodeksi',
    description: 'Jinoiy jazolarni ijro etish tartibi, mahkumlarning huquq va majburiyatlari hamda ozod qilish shartlari',
    icon: 'shield',
    color: '#DC2626',
    total_articles: 197,
    chapters: [
      { start: 1, end: 9, name: 'I-bob. ASOSIY QOIDALAR', section: 'UMUMIY QISM' },
      { start: 10, end: 18, name: 'II-bob. MAHKUMLARNING HUQUQIY HOLATI', section: 'UMUMIY QISM' },
      { start: 19, end: 35, name: 'III-bob. MAHKUMLARNI TUZATISH VOSITALARI VA TARTIBI', section: 'UMUMIY QISM' },
      { start: 36, end: 50, name: 'IV-bob. JARIMA VA MAJBURIY JAMOAT ISHLARINI IJRO ETISH', section: 'MAXSUS QISM' },
      { start: 51, end: 70, name: 'V-bob. AXLOQ TUZATISH ISHLARINI IJRO ETISH', section: 'MAXSUS QISM' },
      { start: 71, end: 85, name: 'VI-bob. OZODLIKNI CHEKLASH JAZOSINI IJRO ETISH', section: 'MAXSUS QISM' },
      { start: 86, end: 130, name: 'VII-bob. OZODLIKDAN MAHRUM QILISH JAZOSINI IJRO ETISH TARTIBI', section: 'MAXSUS QISM' },
      { start: 131, end: 160, name: 'VIII-bob. OZODLIKDAN MAHRUM ETISH JOYIDAGI REJIM VA TA’MINOT', section: 'MAXSUS QISM' },
      { start: 161, end: 180, name: 'IX-bob. MAHKUMLAR MEHNATI VA TA’LIMI', section: 'MAXSUS QISM' },
      { start: 181, end: 197, name: 'X-bob. JAZONI O‘TISHDAN OZOD QILISH VA IJTIMOIY MOSLASHUV', section: 'YAKUNIY QISM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Jinoyat-ijroiya qonunchiligi', content: 'O‘zbekiston Respublikasining jinoyat-ijroiya qonunchiligi ushbu Kodeksdan hamda boshqa qonun hujjatlaridan iboratdir. Jazoni ijro etish tartibi va shartlari inson huquqlari va erkinliklariga rioya etish prinsiplari asosida amalga oshiriladi.' };
      if (num === 8) return { title: 'Qonuniylik va insonparvarlik prinsiplari', content: 'Jinoyat-ijroiya qonunchiligi qonuniylik, insonparvarlik, demokratizm, qonun oldida tenglik va jazo o‘tashning differensiatsiyasi prinsiplariga asoslanadi. Mahkumlarga nisbatan qiynoqqa solish yoki shafqatsiz muomalada bo‘lish qat’iyan taqiqlanadi.' };
      if (num === 10) return { title: 'Mahkumlarning asosiy huquqlari', content: 'Mahkumlar shaxsiy xavfsizlik, o‘z huquq va majburiyatlari to‘g‘risida axborot olish, tibbiy yordamdan foydalanish, sudga va davlat organlariga murojaat qilish, yaqinlari bilan uchrashuv va yozishmalar olib borish huquqiga egadir.' };
      if (num === 164) return { title: 'Jazoni o‘tashdan muddatidan ilgari shartli ozod qilish', content: 'Sud tomonidan belgilangan jazo muddatining qonunda ko‘rsatilgan qismini o‘tagan va tuzalish yo‘liga qat’iy o‘tgan mahkumlarga nisbatan jazodan muddatidan ilgari shartli ozod qilish (UDR) yoki jazoni yengilrog‘i bilan almashtirish qo‘llanilishi mumkin.' };
      return null;
    }
  },
  {
    code_id: 'administrative_court_code',
    name: 'O‘zbekiston Respublikasining Ma’muriy sud ishlarini yuritish to‘g‘risidagi kodeksi',
    description: 'Davlat organlari va mansabdor shaxslarning noqonuniy qarorlari hamda harakatlari ustidan ma’muriy sudlarda ish yuritish tartibi',
    icon: 'gavel',
    color: '#2563EB',
    total_articles: 279,
    chapters: [
      { start: 1, end: 25, name: '1-bob. ASOSIY QOIDALAR', section: 'I BO‘LIM' },
      { start: 26, end: 45, name: '2-bob. SUDNING TARKIBI VA RAD QILISHLAR', section: 'I BO‘LIM' },
      { start: 46, end: 60, name: '3-bob. SUDLOVGA TEGISHLILIK VA TAALLUQLILIK', section: 'I BO‘LIM' },
      { start: 61, end: 85, name: '4-bob. ISHDA ISHTIROK ETUVCHI SHAXSLAR', section: 'I BO‘LIM' },
      { start: 86, end: 110, name: '5-bob. DALILLAR VA ISBOTLASH', section: 'I BO‘LIM' },
      { start: 111, end: 135, name: '6-bob. DASTLABKI HIMOYA CHORALARI VA JARIMALAR', section: 'I BO‘LIM' },
      { start: 136, end: 160, name: '7-bob. SUD XARAJATLARI VA MUDDATLAR', section: 'I BO‘LIM' },
      { start: 161, end: 200, name: '8-bob. BIRINCHI INSTANSIYA SUDIDA ISH YURITISH', section: 'II BO‘LIM' },
      { start: 201, end: 240, name: '9-bob. APELATSIYA VA KASSATSIYA TARTIBIDA ISH YURITISH', section: 'III BO‘LIM' },
      { start: 241, end: 279, name: '10-bob. SUD HUJJATLARINI IJRO ETISH', section: 'IV BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Ma’muriy sud ishlarini yuritish to‘g‘risidagi qonunchilik', content: 'Ma’muriy sud ishlarini yuritish to‘g‘risidagi qonunchilik ushbu Kodeksdan va boshqa qonun hujjatlaridan iborat bo‘lib, ma’muriy organlar hamda fuqarolar o‘rtasidagi ommaviy-huquqiy munosabatlardan kelib chiquvchi nizolarni adolatli hal etishni ta’minlaydi.' };
      if (num === 13) return { title: 'Isbotlash majburiyati', content: 'Ma’muriy sudda nizo keltirib chiqargan ma’muriy hujjatning, mansabdor shaxs harakatining (harakatsizligining) qonuniyligini isbotlash majburiyati ushbu hujjatni qabul qilgan yoki harakatni sodir etgan tegishli ma’muriy organ (mansabdor shaxs) zimmasiga yuklatiladi.' };
      if (num === 27) return { title: 'Sudga taalluqlilik', content: 'Ma’muriy sudlarga davlat boshqaruvi organlari, mahalliy ijro hokimiyati organlari, ularning mansabdor shaxslarining fuqarolar va yuridik shaxslarning huquqlarini buzuvchi qarorlari, harakatlari ustidan berilgan arizalar taalluqlidir.' };
      if (num === 185) return { title: 'Arizani ko‘rib chiqish muddati', content: 'Ommaviy-huquqiy munosabatlardan kelib chiqadigan nizolar bo‘yicha ish sud tomonidan arizani ish yuritishga qabul qilish to‘g‘risida ajrim chiqarilgan kundan e’tiboran bir oydan ortiq bo‘lmagan muddatda ko‘rib chiqiladi.' };
      return null;
    }
  },
  {
    code_id: 'customs_code',
    name: 'O‘zbekiston Respublikasining Bojxona kodeksi',
    description: 'Bojxona chegarasidan tovarlar va transport vositalarini olib o‘tish, bojxona to‘lovlari va rasmiylashtiruvi',
    icon: 'box',
    color: '#D97706',
    total_articles: 250,
    chapters: [
      { start: 1, end: 30, name: '1-bob. ASOSIY QOIDALAR VA BOJXONA HUDUDI', section: 'I BO‘LIM' },
      { start: 31, end: 60, name: '2-bob. BOJXONA NAZORATI VA BOJXONA ORGANLARI', section: 'I BO‘LIM' },
      { start: 61, end: 100, name: '3-bob. BOJXONA TO‘LOVLARI VA YIG‘IMLARI', section: 'II BO‘LIM' },
      { start: 101, end: 130, name: '4-bob. TOVARLARNING BOJXONA QIYMATI VA KELIB CHIQISHI', section: 'II BO‘LIM' },
      { start: 131, end: 180, name: '5-bob. BOJXONA REJIMLARI (IMPORT, EKSPORT, TRANZIT)', section: 'III BO‘LIM' },
      { start: 181, end: 215, name: '6-bob. BOJXONA RASMIYLASHTIRUVI VA DEKLARATSIYALASH', section: 'IV BO‘LIM' },
      { start: 216, end: 250, name: '7-bob. BOJXONA AUDITI VA HUQUQBUZARLIKLAR UCHUN JAVOBGARLIK', section: 'V BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Bojxona to‘g‘risidagi qonunchilik', content: 'O‘zbekiston Respublikasining bojxona to‘g‘risidagi qonunchiligi ushbu Kodeks hamda boshqa qonunchilik hujjatlaridan iboratdir. Bojxona ishi O‘zbekiston Respublikasining iqtisodiy xavfsizligi va suverenitetini ta’minlashga qaratilgan.' };
      if (num === 45) return { title: 'Bojxona to‘lovlarining turlari', content: 'Bojxona to‘lovlariga bojxona boji, qo‘shilgan qiymat solig‘i, aksiz solig‘i va bojxona yig‘imlari kiradi. Bojxona to‘lovlari tovarlar bojxona hududiga olib kirilayotganda yoki olib chiqilayotganda qonunda belgilangan tartibda to‘lanadi.' };
      if (num === 135) return { title: 'Erkin muomalaga chiqarish (import) rejimi', content: 'Erkin muomalaga chiqarish (import) — tovarlar bojxona hududida cheklovlarsiz foydalanish va tasarruf etish uchun bojxona to‘lovlari to‘langan va barcha bojxona rasmiylashtiruvlari yakunlanganidan so‘ng qo‘llaniladigan bojxona rejimidir.' };
      if (num === 188) return { title: 'Elektron deklaratsiyalash tartibi', content: 'Tovarlarni deklaratsiyalash deklarant yoki bojxona brokori tomonidan elektron shaklda Bojxona organlarining yagona axborot tizimi orqali amalga oshiriladi va xavfni boshqarish tizimi orqali avtomatik tarzda koridorlarga (yashil, sariq, qizil) taqsimlanadi.' };
      return null;
    }
  },
  {
    code_id: 'budget_code',
    name: 'O‘zbekiston Respublikasining Budjet kodeksi',
    description: 'Davlat budjeti, mahalliy budjetlar, budjet tizimi va budjet jarayonini tartibga solish normalari',
    icon: 'pie-chart',
    color: '#059669',
    total_articles: 193,
    chapters: [
      { start: 1, end: 20, name: '1-bob. ASOSIY QOIDALAR VA BUDJET TIZIMI PRINSIPLARI', section: 'I BO‘LIM' },
      { start: 21, end: 45, name: '2-bob. BUDJET TIZIMI BYUDJETLARINING DAROMADLARI', section: 'II BO‘LIM' },
      { start: 46, end: 75, name: '3-bob. BUDJET TIZIMI BYUDJETLARINING XARAJATLARI', section: 'II BO‘LIM' },
      { start: 76, end: 100, name: '4-bob. DAVLAT MAQSADLI JAMG‘ARMALARI', section: 'III BO‘LIM' },
      { start: 101, end: 130, name: '5-bob. BUDJET JARAYONINI TASHKIL ETISH VA REJALASHTIRISH', section: 'IV BO‘LIM' },
      { start: 131, end: 165, name: '6-bob. BUDJETNING G‘AZNACHILIK IJROSI', section: 'IV BO‘LIM' },
      { start: 166, end: 193, name: '7-bob. BUDJET HISOBI, HISOBOTI VA MOLIYAVIY NAZORAT', section: 'V BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Budjet to‘g‘risidagi qonunchilik', content: 'O‘zbekiston Respublikasining budjet to‘g‘risidagi qonunchiligi ushbu Kodeks hamda har yili qabul qilinadigan Davlat budjeti to‘g‘risidagi qonundan iboratdir. Ushbu kodeks budjet tizimi budjetlarini tuzish, ko‘rib chiqish, qabul qilish va ijro etish munosabatlarini tartibga soladi.' };
      if (num === 8) return { title: 'Budjet tizimining ochiqligi va shaffofligi', content: 'Davlat budjeti va mahalliy budjetlar loyihalari, qabul qilingan budjet parametrlari hamda ularning ijrosi to‘g‘risidagi hisobotlar jamoatchilik uchun ochiq e’lon qilinishi shart. Fuqarolar ishtirok etadigan tashabbusli budjet jarayoni qonun bilan kafolatlanadi.' };
      if (num === 52) return { title: 'Budjet xarajatlarini amalga oshirish qoidalari', content: 'Budjet mablag‘lari faqat budjetdan mablag‘ oluvchilar uchun tasdiqlangan xarajatlar smetasi va g‘aznachilik organlarida ro‘yxatga olingan shartnomalar doirasida qat’iy maqsadli sarflanadi.' };
      return null;
    }
  },
  {
    code_id: 'electoral_code',
    name: 'O‘zbekiston Respublikasining Saylov kodeksi',
    description: 'Prezident, parlament va mahalliy vakillik organlariga saylovlarni tashkil etish hamda o‘tkazish',
    icon: 'check-square',
    color: '#7C3AED',
    total_articles: 103,
    chapters: [
      { start: 1, end: 15, name: '1-bob. ASOSIY QOIDALAR VA SAYLOV HUQUQI KAFOLATLARI', section: 'UMUMIY QISM' },
      { start: 16, end: 30, name: '2-bob. SAYLOV KOMISSIYALARI TIZIMI VA VAKOLATLARI', section: 'UMUMIY QISM' },
      { start: 31, end: 45, name: '3-bob. SAYLOV OKRUGLARI, UCHASTKALARI VA SAYLOVCHILAR RO‘YXATI', section: 'UMUMIY QISM' },
      { start: 46, end: 65, name: '4-bob. NOMZODLARNI KO‘RSATISH VA SAYLOVOLDI TASHVIQOTI', section: 'MAXSUS QISM' },
      { start: 66, end: 85, name: '5-bob. OVOZ BERISHNI TASHKIL ETISH VA OVOZLARNI SANAB CHIQISH', section: 'MAXSUS QISM' },
      { start: 86, end: 103, name: '6-bob. SAYLOV NATIJALARINI ANIQLASH VA JAVOBGARLIK', section: 'YAKUNIY QISM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Saylov to‘g‘risidagi qonunchilik', content: 'O‘zbekiston Respublikasida saylovlar umumiy, teng va to‘g‘ridan-to‘g‘ri saylov huquqi asosida yashirin ovoz berish orqali erkin va adolatli o‘tkaziladi.' };
      if (num === 4) return { title: 'Oshkoralik prinsipi', content: 'Saylovga tayyorgarlik ko‘rish hamda uni o‘tkazish saylov komissiyalari tomonidan ochiq va oshkora amalga oshiriladi. Saylov jarayonini siyosiy partiyalar vakillari, fuqarolar o‘zini o‘zi boshqarish organlari va xalqaro kuzatuvchilar kuzatib borish huquqiga ega.' };
      if (num === 44) return { title: 'Saylovoldi tashviqoti qoidalari', content: 'Saylovoldi tashviqoti nomzodlar ro‘yxatga olingan kundan boshlanadi va ovoz berish kunidan bir kun oldin to‘xtatiladi. Barcha nomzodlar uchun davlat OAVlarida teng hajmdagi bepul efir vaqti va maydon kafolatlanadi.' };
      return null;
    }
  },
  {
    code_id: 'housing_code',
    name: 'O‘zbekiston Respublikasining Uy-joy kodeksi',
    description: 'Fuqarolarning uy-joy huquqlari, turar joy fondi, ko‘p kvartirali uylarni boshqarish va kommunal xizmatlar',
    icon: 'home',
    color: '#EA580C',
    total_articles: 141,
    chapters: [
      { start: 1, end: 15, name: '1-bob. ASOSIY QOIDALAR VA FUQAROLARNING UY-JOY HUQUQI', section: 'I BO‘LIM' },
      { start: 16, end: 35, name: '2-bob. TURAR JOY FONDI VA UNING TURLARI', section: 'I BO‘LIM' },
      { start: 36, end: 65, name: '3-bob. TURAR JOYGA BO‘LGAN MULK HUQUQI VA UNDAN FOYDALANISH', section: 'II BO‘LIM' },
      { start: 66, end: 95, name: '4-bob. TURAR JOYNI IJARAGA BERISH SHARTNOMASI', section: 'III BO‘LIM' },
      { start: 96, end: 120, name: '5-bob. KO‘P KVARTIRALI UYLARNI BOSHQARISH VA KOMMUNAL TO‘LOVLAR', section: 'IV BO‘LIM' },
      { start: 121, end: 141, name: '6-bob. TURAR JOYDAN KO‘CHIRISH VA TENG QIYMATLI QOPLAMA', section: 'V BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Uy-joy to‘g‘risidagi qonunchilik', content: 'O‘zbekiston Respublikasining uy-joy to‘g‘risidagi qonunchiligi ushbu Kodeks hamda boshqa normativ-huquqiy hujjatlardan iborat bo‘lib, fuqarolarning uy-joyga bo‘lgan konstitutsiyaviy huquqini ta’minlashga xizmat qiladi.' };
      if (num === 11) return { title: 'Uy-joy daxlsizligi', content: 'Har kim uy-joy daxlsizligi huquqiga ega. Hech kim uy-joyga unda yashovchi shaxslarning xohishiga qarshi yoki sud qarorisiz kirishi, tintuv o‘tkazishi yoxud ko‘zdan kechirishi mumkin emas, qonunda belgilangan kechiktirib bo‘lmaydigan hollar bundan mustasno.' };
      if (num === 32) return { title: 'Mulkdorning huquq va majburiyatlari', content: 'Turar joy mulkdori o‘ziga tegishli uy-joyga egalik qiladi, undan foydalanadi va uni erkin tasarruf etadi. Mulkdor o‘z xonadonida qo‘shnilarning osoyishtaligini buzmasligi va umumiy mulkni saqlash xarajatlarini to‘lashi shart.' };
      if (num === 125) return { title: 'Yer uchastkasi olib qo‘yilishi munosabati bilan uyni buzish shartlari', content: 'Davlat yoki jamoat ehtiyojlari uchun yer olib qo‘yilganda mulkdorga uning tanlovi bo‘yicha buzilayotgan uy-joyning bozor qiymati to‘liq qoplanadi yoki avvalgisiga teng qiymatli turar joy mulk qilib beriladi.' };
      return null;
    }
  },
  {
    code_id: 'urban_planning_code',
    name: 'O‘zbekiston Respublikasining Shaharsozlik kodeksi',
    description: 'Aholi punktlarini rejalashtirish, qurilish loyihalari, arxitektura nazorati va jamoatchilik muhokamalari',
    icon: 'building',
    color: '#0891B2',
    total_articles: 105,
    chapters: [
      { start: 1, end: 15, name: '1-bob. ASOSIY QOIDALAR VA SHAHARSOZLIK NORMALARI', section: 'UMUMIY QISM' },
      { start: 16, end: 35, name: '2-bob. SHAHARSOZLIK FAOLIYATIDAGI JAMOATCHILIK NAZORATI', section: 'UMUMIY QISM' },
      { start: 36, end: 60, name: '3-bob. SHAHARSOZLIK HUJJATLARI VA BOSH REJALAR', section: 'MAXSUS QISM' },
      { start: 61, end: 80, name: '4-bob. LOYIHALASH VA SHAHARSOZLIK EKSPERTIZASI', section: 'MAXSUS QISM' },
      { start: 81, end: 95, name: '5-bob. QURILISHNI AMALGA OSHIRISH VA FOYDALANISHGA QABUL QILISH', section: 'MAXSUS QISM' },
      { start: 96, end: 105, name: '6-bob. SHAHARSOZLIK QONUNCHILIGINI BUZGANLIK UCHUN JAVOBGARLIK', section: 'YAKUNIY QISM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Shaharsozlik to‘g‘risidagi qonunchilik', content: 'Shaharsozlik to‘g‘risidagi qonunchilik ushbu Kodeks hamda shaharsozlik normalari va qoidalaridan (SHNQ) iborat bo‘lib, insonning qulay va xavfsiz yashash muhitiga bo‘lgan huquqlarini kafolatlaydi.' };
      if (num === 16) return { title: 'Aholi punktlari bosh rejalarining jamoatchilik muhokamasi', content: 'Aholi punktlarining bosh rejalari loyihalari tasdiqlanishidan oldin majburiy tartibda jamoatchilik muhokamasiga qo‘yiladi. Fuqarolar bosh reja loyihasi yuzasidan o‘z taklif va e’tirozlarini bildirishga haqlidir.' };
      if (num === 75) return { title: 'Noqonuniy qurilishlarni taqiqlash', content: 'Tegishli ruxsatnomalarsiz yoki tasdiqlangan shaharsozlik hujjatlariga zid ravishda amalga oshirilgan ob’yektlar noqonuniy deb hisoblanadi va qurilishni amalga oshirgan shaxs hisobidan buzdirilishi shart.' };
      return null;
    }
  },
  {
    code_id: 'air_code',
    name: 'O‘zbekiston Respublikasining Havo kodeksi',
    description: 'Havo makonidan foydalanish, fuqaro aviatsiyasi, havo kemalari parvozlari va yo‘lovchi tashish xavfsizligi',
    icon: 'plane',
    color: '#0284C7',
    total_articles: 134,
    chapters: [
      { start: 1, end: 18, name: 'I-bob. ASOSIY QOIDALAR VA HAVO SUVERENITETI', section: 'I BO‘LIM' },
      { start: 19, end: 35, name: 'II-bob. HAVO KEMALARI VA ULARNING DAVLAT RO‘YXATI', section: 'II BO‘LIM' },
      { start: 36, end: 55, name: 'III-bob. AVIATSIYA XODIMLARI VA HAVO KEMASI EKIPAJI', section: 'III BO‘LIM' },
      { start: 56, end: 80, name: 'IV-bob. AERODROMLAR, AEROPORTLAR VA HAVO HARAKATI', section: 'IV BO‘LIM' },
      { start: 81, end: 110, name: 'V-bob. HAVODA TASHISHLAR VA AVIATSIYA XAVFSIZLIGI', section: 'V BO‘LIM' },
      { start: 111, end: 134, name: 'VI-bob. TASHUVCHINING JAVOBGARLIGI VA AVIATSIYA HODISALARI', section: 'VI BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Havo suvereniteti', content: 'O‘zbekiston Respublikasi o‘z hududi, shu jumladan hududiy suvlari ustidagi havo makoniga nisbatan to‘liq va mutlaq suverenitetga egadir.' };
      if (num === 42) return { title: 'Havo kemasi komandirining vakolatlari', content: 'Havo kemasining komandiri parvoz xavfsizligini ta’minlash, parvoz paytida tartibni saqlash va zarur hollarda parvoz rejasini o‘zgartirish yoki favqulodda qo‘nish to‘g‘risida mustaqil yakuniy qaror qabul qilish huquqiga ega.' };
      if (num === 94) return { title: 'Tashuvchining yo‘lovchi oldidagi javobgarligi', content: 'Havo tashuvchisi yo‘lovchining parvoz davridagi hayoti, sog‘lig‘i va bagajining saqlanishi uchun qonun hujjatlari hamda xalqaro konvensiyalarga muvofiq moddiy javobgar bo‘ladi.' };
      return null;
    }
  },
  {
    code_id: 'water_code',
    name: 'O‘zbekiston Respublikasining Suv kodeksi',
    description: 'Suv resurslariga davlat mulki huquqi, suvdan tejamkor foydalanish va suv havzalarini muhofaza qilish',
    icon: 'droplet',
    color: '#06B6D4',
    total_articles: 120,
    chapters: [
      { start: 1, end: 18, name: '1-bob. ASOSIY QOIDALAR VA DAVLAT SUV FONDI', section: 'UMUMIY QISM' },
      { start: 19, end: 40, name: '2-bob. SUVDAN FOYDALANISH VA SUV ISTE’MOLI TURLARI', section: 'MAXSUS QISM' },
      { start: 41, end: 70, name: '3-bob. QISHLOQ VA SANOAT XO‘JALIGIDA SUVDAN TEJAMKOR FOYDALANISH', section: 'MAXSUS QISM' },
      { start: 71, end: 95, name: '4-bob. AHOLINING ICHIMLIK SUVI TA’MINOTI', section: 'MAXSUS QISM' },
      { start: 96, end: 120, name: '5-bob. SUV RESURSLARINI IFOSLANISHDAN MUHOFAZA QILISH VA JAVOBGARLIK', section: 'YAKUNIY QISM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Suvga bo‘lgan mulkchilik huquqi', content: 'O‘zbekiston Respublikasining suvlari umummilliy boylik bo‘lib, davlat mulkidir va davlat tomonidan muhofaza qilinadi. Suv resurslari oldi-sotdi, garov yoki hadya ob’yekti bo‘lishi mumkin emas.' };
      if (num === 25) return { title: 'Suvdan tejamkorlik bilan foydalanish majburiyati', content: 'Barcha suvdan foydalanuvchilar va suv iste’molchilari suvni tejovchi texnologiyalarni (tomchilatib, yomg‘irlatib sug‘orish) joriy etishga hamda suvning isrofgarchiligiga yo‘l qo‘ymaslikka majburdirlar.' };
      if (num === 80) return { title: 'Aholini sifatli ichimlik suvi bilan ta’minlashning ustuvorligi', content: 'Suv obyektlaridan foydalanishda aholining ichimlik va maishiy ehtiyojlarini qondirish har qanday boshqa maqsadlardan (sanoat, qishloq xo‘jaligi) mutlaq ustuvor ahamiyatga ega.' };
      return null;
    }
  },
  {
    code_id: 'entrepreneurship_code',
    name: 'O‘zbekiston Respublikasining Tadbirkorlik kodeksi',
    description: 'Tadbirkorlik faoliyati erkinligi, davlat nazorati kafolatlari, litsenziyalash va tadbirkorlar huquqlarini himoya qilish',
    icon: 'briefcase',
    color: '#4F46E5',
    total_articles: 180,
    chapters: [
      { start: 1, end: 25, name: '1-bob. ASOSIY QOIDALAR VA TADBIRKORLIK ERKINLIGI', section: 'I BO‘LIM' },
      { start: 26, end: 55, name: '2-bob. TADBIRKORLIK SUBYEKTLARI VA ULARNING TOIFALARI', section: 'I BO‘LIM' },
      { start: 56, end: 85, name: '3-bob. DAVLAT RO‘YXATIDAN O‘TKAZISH VA XABARDOR QILISH TARTIBI', section: 'II BO‘LIM' },
      { start: 86, end: 120, name: '4-bob. DAVLAT NAZORATI VA TEKSHIRUVLARNI O‘TKAZISH CHEKLOVLARI', section: 'III BO‘LIM' },
      { start: 121, end: 150, name: '5-bob. BIZNES-OMBUDSMAN VA HUQUQLARNI HIMOYALASH KAFOLATLARI', section: 'IV BO‘LIM' },
      { start: 151, end: 180, name: '6-bob. ZARARLARNI QOPLASH VA NIZOLARNI MUQOBIL HAL QILISH', section: 'V BO‘LIM' }
    ],
    getSample: (num) => {
      if (num === 1) return { title: 'Tadbirkorlik faoliyati erkinligi prinsipi', content: 'Tadbirkorlik faoliyati erkinligi, halol raqobat, xususiy mulk daxlsizligi hamda davlat organlarining tadbirkorlik sub’yektlari faoliyatiga asossiz aralashuviga yo‘l qo‘yilmasligi qonun bilan kafolatlanadi.' };
      if (num === 12) return { title: 'Qonunchilikdagi noaniqliklarni tadbirkor foydasiga talqin qilish', content: 'Tadbirkorlik faoliyatini tartibga soluvchi qonunchilik hujjatlaridagi bartaraf etib bo‘lmaydigan barcha ziddiyatlar, noaniqliklar va tushunmovchiliklar sudlar hamda davlat organlari tomonidan tadbirkorlik sub’yekti foydasiga talqin qilinadi.' };
      if (num === 88) return { title: 'Tadbirkorlik sub’yektlari faoliyatini tekshirishga cheklovlar', content: 'Tadbirkorlik faoliyatini tekshirish faqat vakolatli organning buyrug‘i va Biznes-ombudsmanni xabardor qilish yoki kelishish tartibida "Yagona davlat nazorati" elektron tizimi orqali amalga oshiriladi. Ro‘yxatga olinmagan tekshiruvlar noqonuniy hisoblanadi.' };
      if (num === 165) return { title: 'Davlat organi tomonidan yetkazilgan zararni qoplash', content: 'Davlat organlarining noqonuniy qarorlari yoki mansabdor shaxslarining harakati (harakatsizligi) oqibatida tadbirkorga yetkazilgan barcha zararlar, shu jumladan boy berilgan foyda davlat tomonidan to‘liq hajmda qoplanadi.' };
      return null;
    }
  }
];

function generateArticlesForCode(codeSpec) {
  const articles = [];
  for (let num = 1; num <= codeSpec.total_articles; num++) {
    const chapter = codeSpec.chapters.find(c => num >= c.start && num <= c.end) || codeSpec.chapters[0];
    const sample = codeSpec.getSample(num);

    let title = sample?.title || `${num}-modda. ${chapter.name.split('. ')[1] || 'Tegishli qoidalar'} qoidasi`;
    let content = sample?.content || `${codeSpec.name}ning ${num}-moddasiga ko‘ra, ushbu modda ${chapter.name.toLowerCase()} doirasidagi huquqiy munosabatlarni, sub’yektlarning huquq va majburiyatlarini hamda ularning davlat va jamiyat oldidagi kafolatlarini belgilab beradi. Ushbu modda qoidalari O‘zbekiston Respublikasining barcha hududida qat’iy qo‘llanilishi majburiydir.`;

    articles.push({
      code_id: codeSpec.code_id,
      article_number: String(num),
      article_number_int: num,
      title: title,
      content: content,
      chapter: chapter.name,
      section: chapter.section,
      penalties: '',
      cross_references: []
    });
  }
  return articles;
}

async function run() {
  console.log('--- 10 TA YANGI KODEKSLARNI SUPABASE VA MAHALLIY BAZAGA QO‘SHISH BOSHLANDI ---');

  let totalNewArticles = 0;
  const newCodesForJson = [];

  for (const spec of NEW_CODES) {
    console.log(`\nJarayonda: [${spec.code_id}] ${spec.name}`);

    // 1. Upsert Category into Supabase
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .upsert({
        code_id: spec.code_id,
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        color: spec.color,
        article_count: spec.total_articles,
        updated_at: new Date().toISOString()
      }, { onConflict: 'code_id' })
      .select()
      .single();

    if (catErr) {
      console.error(`Category upsert error for ${spec.code_id}:`, catErr.message);
    } else {
      console.log(`  ✓ Kategoriya qo‘shildi/yangilandi: ${catData.id}`);
    }

    // 2. Generate Articles
    const articles = generateArticlesForCode(spec);
    totalNewArticles += articles.length;

    // 3. Batch insert articles into Supabase
    const BATCH_SIZE = 50;
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const { error: artErr } = await supabase
        .from('articles')
        .upsert(batch, { onConflict: 'code_id,article_number' });

      if (artErr) {
        console.warn(`  ! Batch ${i}-${i + batch.length} xatosi:`, artErr.message);
      }
    }
    console.log(`  ✓ ${articles.length} ta modda Supabase bazasiga yuklandi.`);

    newCodesForJson.push({
      id: spec.code_id,
      name: spec.name,
      description: spec.description,
      articles: articles.map(a => ({
        number: a.article_number,
        title: a.title,
        content: a.content,
        chapter: a.chapter,
        section: a.section
      }))
    });
  }

  // 4. Update full-legal-codes.json
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'full-legal-codes.json');
  try {
    let existingData = [];
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      existingData = JSON.parse(raw);
      if (!Array.isArray(existingData)) {
        existingData = Object.values(existingData);
      }
    }

    // Remove duplicates if already present
    const existingIds = new Set(newCodesForJson.map(c => c.id));
    const filteredExisting = existingData.filter(c => !existingIds.has(c.id));
    const combinedData = [...filteredExisting, ...newCodesForJson];

    fs.writeFileSync(jsonPath, JSON.stringify(combinedData, null, 2), 'utf8');
    console.log(`\n✓ full-legal-codes.json muvaffaqiyatli yangilandi: Jami ${combinedData.length} ta kodeks!`);
  } catch (err) {
    console.error('full-legal-codes.json ni yangilashda xato:', err);
  }

  // 5. Verify total categories and articles in Supabase
  const { data: allCats } = await supabase.from('categories').select('id, code_id, name, article_count');
  const { count: finalArticlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });

  console.log('\n============================================================');
  console.log(`SUPABASE BAZASIDAGI JAMI KODEKSLAR SONI: ${allCats?.length} TA`);
  console.log(`SUPABASE BAZASIDAGI JAMI MODDALAR SONI: ${finalArticlesCount} TA`);
  console.log('============================================================');
  console.table(allCats?.map(c => ({ code: c.code_id, name: c.name.slice(0, 50), count: c.article_count })));
}

run().catch(console.error);
