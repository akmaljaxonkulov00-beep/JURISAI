/**
 * JURISAI LEGAL CODES SEEDER
 * 
 * Usage: node scripts/seed-legal-codes.js
 * 
 * This script seeds Uzbekistan legal codes from the hardcoded data
 * into Supabase. It creates:
 *   1. categories table entries for each code
 *   2. articles table entries for each code's articles
 *   3. Handles idempotent inserts (skip if exists)
 * 
 * Environment variables needed:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

// Load env vars (simple parser, don't use dotenv to avoid dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local not found, trying process.env');
    return;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ===== LEGAL CODES DATA =====
// This mirrors the data in src/data/legal-codes.ts
const LEGAL_CODES = [
  {
    id: 'criminal_code',
    name: "Oʻzbekiston Respublikasi Jinoyat Kodeksi",
    short_name: 'Oʻzbekiston Respublikasi Jinoyat Kodeksi',
    description: 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati',
    total_articles: 302,
    effective_date: '01.04.1995',
    articles: [
      {
        number: '1',
        title: "O'zbekiston Respublikasi jinoyat qonunchiligining vazifalar",
        content: "O'zbekiston Respublikasi jinoyat qonunchiligining vazifalari shaxsning huquq va erkinliklarini, mulkiyatni, jamiyat va davlat xavfsizligini, inson jamiyati tinchligini va xavfsizligini jinoyat huquq buzilishlaridan himoya qilishdan iborat. Ushbu Kodeks jinoyat qilinayotgan xatti-harakatlarning jinoyatliligini, ularning jazolarini va boshqa jinoyat-huquqiy oqibatlarini belgilaydi.",
        category: 'Umumiy qismlar'
      },
      {
        number: '25',
        title: 'Qasddan odam o\'ldirish',
        content: "Qasddan odam o'ldirish - o'ldirishga qasdlangan xatti-harakat natijasida boshqa shaxsning hayotidan mahrum etilishi. O'n yildan o'n to'rt yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
        category: 'Shaxsga qarshi jinoyatlar',
        penalties: 'Ozodlikdan mahrum qilish 10-14 yil',
        references: ['JK 97', 'JK 98']
      },
      {
        number: '97',
        title: 'Tan jarohati yetkazish',
        content: "Qasddan yengil tan jarohati yetkazish - bu vaqtinchalik mehnatga layoqatsizlik yoki umumiy mehnatga layoqatlikning oz miqdorda doimiy yo'qotilishi bilan bog'liq jarohot. Jarima to o'ttiz barobar minimal ish haqiga yoki ikki yilgacha isloh ishlar bilan jazolanadi.",
        category: 'Shaxsga qarshi jinoyatlar',
        penalties: 'Jarima yoki isloh ishlari',
        references: ['JK 98', 'JK 99', 'JK 100']
      },
      {
        number: '169',
        title: "O'g'irlik",
        content: "O'g'irlik - bu boshqa biror kishining mulkini yashirin ravishda o'g'irlash. Jarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
        category: 'Mulkka qarshi jinoyatlar',
        penalties: 'Jarima, isloh ishlari yoki 2 yilgacha ozodlikdan mahrum qilish',
        references: ['JK 168', 'JK 170', 'JK 171', 'JK 172']
      },
      {
        number: '205',
        title: 'Firibgarlik',
        content: "Firibgarlik - aldov yo'li bilan yoki ishonchni suiiste'mol qilish yo'li bilan boshqa birov kishining mulkini egallab olish yoki mulk huquqiga ega bo'lish. Jarima yoki ikki yilgacha isloh ishlari yoki ikki yilgacha ozodlikdan mahrum qilish bilan jazolanadi.",
        category: 'Mulkka qarshi jinoyatlar',
        penalties: 'Jarima, 2 yilgacha isloh ishi, yoki ozodlikdan mahrum qilish',
        references: ['JK 169', 'JK 170']
      }
    ]
  },
  {
    id: 'civil_code',
    name: "Oʻzbekiston Respublikasi Fuqarolik Kodeksi",
    short_name: 'Oʻzbekiston Respublikasi Fuqarolik Kodeksi',
    description: 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati',
    total_articles: 1031,
    effective_date: '01.03.1997',
    articles: [
      {
        number: '1',
        title: 'Fuqarolik qonunchiligi bilan tartibga solinadigan munosabatlar',
        content: "Fuqarolik qonunchiligi mulkiy va mulkiy bo'lmagan shaxsiy munosabatlarni tartibga soladi. Fuqarolik qonunchiligi shaxslarning mulkiy munosabatlari ishtirokchilarining huquqiy tengligiga, ularning xohish-irodalarining erkinligiga va mulkiy mustaqilligiga asoslanadi.",
        category: 'Umumiy qismlar'
      },
      {
        number: '342',
        title: 'Shartnoma tushunchasi',
        content: "Shartnoma - ikki yoki undan ortiq shaxslarning fuqarolik huquqlari va majburiyatlarini belgilash, o'zgartirish yoki to'xtatish to'g'risidagi kelishuvi. Shartnomaga fuqarolik qonunchiligi tomonidan bitimlar uchun belgilangan umumiy qoidalar qo'llaniladi.",
        category: 'Majburiyatlar huquqi',
        references: ['FK 343', 'FK 367', 'FK 368']
      },
      {
        number: '367',
        title: "Shartnomaning shakliy talablari",
        content: "Shartnoma og'zaki yoki yozma shaklda tuzilishi mumkin. Yozma shaklda tuzilishi lozim bo'lgan shartnomaning sharti buzilishi shartnomaning haqiqiy emasligiga olib kelishi mumkin.",
        category: 'Majburiyatlar huquqi',
        references: ['FK 342', 'FK 368', 'FK 369']
      },
      {
        number: '368',
        title: 'Shartnomani buzish',
        content: "Shartnoma bir tomonning ixtiyoriy ravishda o'z majburiyatini bajarmay qo'yishi yoki lozim darajada bajarmasligi natijasida buzilgan deb hisoblanadi. SHARTNOMANI BUZISH OQIBATLARI: 1) Shartnomani bekor qilish huquqi; 2) Yetkazilgan zararni qoplash; 3) Jarima va neustoyka to'lash; 4) Majburiy bajarish talab qilish.",
        category: 'Majburiyatlar huquqi',
        penalties: 'Zarar qoplash, jarima, shartnomani bekor qilish',
        references: ['FK 342', 'FK 367', 'FK 369']
      }
    ]
  },
  {
    id: 'labor_code',
    name: "Oʻzbekiston Respublikasi Mehnat Kodeksi",
    short_name: 'Oʻzbekiston Respublikasi Mehnat Kodeksi',
    description: 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati',
    total_articles: 359,
    effective_date: '01.04.1996',
    articles: [
      {
        number: '77',
        title: "Mehnat shartnomasining tuzilishi",
        content: "Mehnat shartnomasi ishchi va ish beruvchi o'rtasida yozma shaklda tuziladi. Mehnat shartnomasida tomonlarning F.I.Sh., passport ma'lumotlari, ish joyi va lavozim, ish haqi miqdori, ish vaqti va dam olish vaqti ko'rsatilishi kerak.",
        category: 'Mehnat shartnomasi',
        references: ['MK 78', 'MK 161']
      },
      {
        number: '161',
        title: "Ishdan bo'shatishning umumiy asoslari",
        content: "Mehnat shartnomasi quyidagi asoslar bo'yicha bekor qilinishi mumkin: 1) Tomonlarning kelishuvi bilan; 2) Shartnoma muddati tugashi; 3) Ishchining o'z xohishi bilan; 4) Ish beruvchining tashabbusi bilan (korxona tugatilganda, ishchilar sonini qisqartirishda, ishchi o'z majburiyatlarini bajarmasligi); 5) Ishchining o'limida.",
        category: 'Mehnat shartnomasi',
        penalties: "Noqonuniy ishdan bo'shatish uchun - ishga qaytarish va majburiy kompensatsiya",
        references: ['MK 77', 'MK 242']
      },
      {
        number: '242',
        title: "Ish haqi to'lash tartibi",
        content: "Ish haqi kamida oyiga ikki marta to'lanadi. Kechiktirishda javobgarlik: har bir kech qolgan kun uchun 1% miqdorida pul jarima.",
        category: 'Ish haqi',
        penalties: 'Har kun uchun 1% jarima, ma\'muriy javobgarlik',
        references: ['MK 161', 'FK 369']
      }
    ]
  },
  {
    id: 'family_code',
    name: "O'zbekiston Respublikasi Oila Kodeksi",
    short_name: "O'zbekiston Respublikasi Oila Kodeksi",
    description: 'Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati',
    total_articles: 246,
    effective_date: '01.09.1998',
    articles: [
      {
        number: '1',
        title: "Oila qonunchiligining vazifalari",
        content: "Oila qonunchiligi oilani mustahkamlash, oilaviy munosabatlarni tenglik asosida qurish, ota-onalar va farzandlarning huquqlarini himoya qilishga qaratilgan.",
        category: 'Umumiy qoidalar'
      },
      {
        number: '15',
        title: 'Nikoh yoshi',
        content: "Nikoh tuzish yoshi o'n sakkiz yosh etib belgilanadi. Uzrli sabablarga ko'ra, mahalliy davlat hokimiyati organi nikoh tuzish yoshini bir yildan ortiq bo'lmagan muddatga pasaytirishi mumkin.",
        category: 'Nikoh'
      }
    ]
  }
];

async function seed() {
  console.log('🚀 JURISAI Legal Codes Seeder\n');
  console.log(`📡 Supabase: ${SUPABASE_URL}\n`);

  let insertedCategories = 0;
  let insertedArticles = 0;

  for (const code of LEGAL_CODES) {
    console.log(`📖 Processing: ${code.name}`);

    // Step 1: Insert/update category
    try {
      const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: code.id,
          name: code.name,
          description: code.description,
          document_count: code.total_articles,
          document_type: 'Kodeks'
        })
      });
      if (catRes.ok || catRes.status === 409) {
        insertedCategories++;
        console.log(`  ✅ Category: ${code.name}`);
      } else {
        const errText = await catRes.text();
        console.log(`  ⚠️  Category insert: ${catRes.status} ${errText.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`  ❌ Category error: ${e.message}`);
    }

    // Step 2: Insert articles
    for (const article of code.articles) {
      try {
        const artRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            code_id: code.id,
            article_number: article.number,
            title: article.title,
            content: article.content,
            category: article.category || null,
            penalties: article.penalties || null,
            references: article.references || null
          })
        });
        if (artRes.ok || artRes.status === 409) {
          insertedArticles++;
          if (insertedArticles % 5 === 0) {
            process.stdout.write('.');
          }
        }
      } catch (e) {
        console.log(`  ❌ Article ${article.number} error: ${e.message}`);
      }
    }
    console.log(`  📝 Articles: ${code.articles.length} ta`);
  }

  console.log(`\n\n✅ Complete!`);
  console.log(`   Categories: ${insertedCategories} ta`);
  console.log(`   Articles: ${insertedArticles} ta`);
  console.log(`\n💡 Now run: npm run dev`);
}

seed().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
