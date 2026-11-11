require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DESKTOP_DIR = 'c:\\Users\\ANUBIS PC\\Desktop\\kodeks';

const FILE_SPECS = [
  {
    file: '07.05.1993.doc',
    code_id: 'air_code',
    name: 'Oʻzbekiston Respublikasining Havo kodeksi',
    description: 'Aviatsiya faoliyati, samoviy hududdan foydalanish va havo transporti xavfsizligi qoidalari',
    icon: 'plane',
    color: '#0284C7'
  },
  {
    file: '20.01.2016.doc',
    code_id: 'customs_code',
    name: 'Oʻzbekiston Respublikasining Bojxona kodeksi',
    description: 'Bojxona chegarasidan tovarlar va transport vositalarini olib o‘tish, bojxona to‘lovlari va rasmiylashtiruvi',
    icon: 'box',
    color: '#D97706'
  },
  {
    file: '22.02.2021.doc',
    code_id: 'urban_planning_code',
    name: 'Oʻzbekiston Respublikasining Shaharsozlik kodeksi',
    description: 'Aholi punktlarini rejalashtirish, qurilish loyihalari, arxitektura nazorati va jamoatchilik muhokamalari',
    icon: 'building',
    color: '#0891B2'
  },
  {
    file: '24.01.2018.doc',
    code_id: 'economic_procedure_code',
    name: 'Oʻzbekiston Respublikasining Iqtisodiy protsessual kodeksi',
    description: 'Iqtisodiy sudlarda tadbirkorlik va xo‘jalik nizolarini ko‘rib chiqish tartibi',
    icon: 'file-text',
    color: '#0D9488'
  },
  {
    file: '24.12.1998.doc',
    code_id: 'housing_code',
    name: 'Oʻzbekiston Respublikasining Uy-joy kodeksi',
    description: 'Fuqarolarning uy-joy huquqlari, turar joy fondi, ko‘p kvartirali uylarni boshqarish va kommunal xizmatlar',
    icon: 'home',
    color: '#EA580C'
  },
  {
    file: '25.01.2018.doc',
    code_id: 'administrative_court_code',
    name: 'Oʻzbekiston Respublikasining Maʼmuriy sud ishlarini yuritish toʻgʻrisidagi kodeksi',
    description: 'Davlat organlari va mansabdor shaxslarning noqonuniy qarorlari hamda harakatlari ustidan sudga shikoyat qilish',
    icon: 'gavel',
    color: '#2563EB'
  },
  {
    file: '25.04.1997.doc',
    code_id: 'criminal_executive_code',
    name: 'Oʻzbekiston Respublikasining Jinoyat-ijroiya kodeksi',
    description: 'Jinoiy jazolarni ijro etish tartibi, mahkumlarning huquq va majburiyatlari hamda ozod qilish shartlari',
    icon: 'shield',
    color: '#DC2626'
  },
  {
    file: '25.06.2019 (1).doc',
    code_id: 'electoral_code',
    name: 'Oʻzbekiston Respublikasining Saylov kodeksi',
    description: 'Prezident, parlament va mahalliy vakillik organlariga saylovlarni tashkil etish hamda o‘tkazish',
    icon: 'check-square',
    color: '#7C3AED'
  },
  {
    file: '30.04.1998.doc',
    code_id: 'land_code',
    name: 'Oʻzbekiston Respublikasining Yer kodeksi',
    description: 'Yerga bo‘lgan huquqlar, yer uchastkalarini ajratish, ijaraga berish va yer fondini muhofaza qilish',
    icon: 'tree-pine',
    color: '#D97706'
  },
  {
    file: '30.07.2025.doc',
    code_id: 'water_code',
    name: 'Oʻzbekiston Respublikasining Suv kodeksi',
    description: 'Suv resurslariga davlat mulki huquqi, suvdan tejamkor foydalanish va suv havzalarini muhofaza qilish',
    icon: 'droplet',
    color: '#06B6D4'
  },
  {
    file: '30.12.2019.doc',
    code_id: 'tax_code',
    name: 'Oʻzbekiston Respublikasining Soliq kodeksi',
    description: 'Soliqlar va yig‘imlarni hisoblash, to‘lash, soliq imtiyozlari va soliq nazorati qoidalari',
    icon: 'dollar-sign',
    color: '#7C3AED'
  }
];

function cleanHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<sup>(\d+)<\/sup>/gi, '-$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\r/g, '');
}

function parseArticles(html, codeSpec) {
  const text = cleanHtml(html);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const articles = [];
  let currentArticle = null;
  let currentChapter = 'I-bob. ASOSIY QOIDALAR';
  let currentSection = 'UMUMIY QISM';

  for (const line of lines) {
    if (/BOʻLIM|BO'LIM|QISM/i.test(line) && line.length < 80) {
      currentSection = line;
      continue;
    }
    if (/\bbob\b|\bBOB\b/i.test(line) && line.length < 120 && !line.includes('modda')) {
      currentChapter = line;
      continue;
    }

    const artMatch = line.match(/^(\d+(?:-\d+)?)\s*[-–—]\s*modda\.?\s*(.*)$/i);
    if (artMatch) {
      if (currentArticle && currentArticle.content.length > 0) {
        articles.push(finalizeArticle(currentArticle, codeSpec));
      }
      currentArticle = {
        number: artMatch[1],
        title: artMatch[2] ? artMatch[2].trim() : '',
        content: [],
        chapter: currentChapter,
        section: currentSection
      };
    } else if (currentArticle) {
      if (!currentArticle.title && line.length < 160 && !line.includes('Ҳужжат') && !line.includes('Print')) {
        currentArticle.title = line.trim();
      } else if (!line.includes('Ҳужжат') && !line.includes('Print') && !line.includes('Аудио') && !line.includes('таклиф')) {
        currentArticle.content.push(line);
      }
    }
  }

  if (currentArticle && currentArticle.content.length > 0) {
    articles.push(finalizeArticle(currentArticle, codeSpec));
  }

  // Deduplicate by article_number just in case
  const uniqueMap = new Map();
  for (const a of articles) {
    if (!uniqueMap.has(a.article_number)) {
      uniqueMap.set(a.article_number, a);
    }
  }

  return Array.from(uniqueMap.values());
}

function finalizeArticle(art, codeSpec) {
  const contentText = art.content.join('\n\n').trim();
  const numInt = parseInt(art.number.split('-')[0], 10);
  const title = art.title || `${art.number}-modda`;

  return {
    code_id: codeSpec.code_id,
    article_number: String(art.number),
    article_number_int: isNaN(numInt) ? 0 : numInt,
    title: title,
    content: contentText || `${codeSpec.name}ning ${art.number}-moddasi qoidalari.`,
    chapter: art.chapter,
    section: art.section,
    penalties: '',
    cross_references: []
  };
}

async function run() {
  console.log('================================================================');
  console.log('USER DESKTOP/KODEKS FAYLLARIDAN HAQIQIY MODDALARNI IMPORT QILISH');
  console.log('================================================================');

  let totalParsed = 0;
  const jsonCodeList = [];

  for (const spec of FILE_SPECS) {
    const filePath = path.join(DESKTOP_DIR, spec.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Fayl topilmadi: ${filePath}`);
      continue;
    }

    console.log(`\nO'qilmoqda: ${spec.file} -> [${spec.code_id}] ${spec.name}`);
    const html = fs.readFileSync(filePath, 'utf8');
    const articles = parseArticles(html, spec);
    console.log(`  ✓ ${articles.length} ta yagona rasmiy modda ajratib olindi.`);
    totalParsed += articles.length;

    // 1. Upsert Category in Supabase
    const { error: catErr } = await supabase
      .from('categories')
      .upsert({
        code_id: spec.code_id,
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        color: spec.color,
        article_count: articles.length,
        updated_at: new Date().toISOString()
      }, { onConflict: 'code_id' });

    if (catErr) {
      console.error(`  ! Kategoriya upsert xatosi:`, catErr.message);
    } else {
      console.log(`  ✓ Kategoriya bazada yangilandi: ${spec.name} (${articles.length} ta modda)`);
    }

    // 2. Delete previous articles for this code_id to avoid stale data
    await supabase.from('articles').delete().eq('code_id', spec.code_id);

    // 3. Batch insert real articles into Supabase
    const BATCH_SIZE = 50;
    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      const { error: artErr } = await supabase.from('articles').insert(batch);
      if (artErr) {
        console.warn(`  ! Batch ${i}-${i + batch.length} xatosi:`, artErr.message);
      }
    }
    console.log(`  ✓ Supabase'ga ${articles.length} ta modda to'liq saqlandi!`);

    jsonCodeList.push({
      id: spec.code_id,
      name: spec.name,
      description: spec.description,
      totalArticles: articles.length,
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
    let existing = [];
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = Object.values(existing);
    }
    const newIds = new Set(jsonCodeList.map(c => c.id));
    const kept = existing.filter(c => !newIds.has(c.id));
    const merged = [...kept, ...jsonCodeList];
    fs.writeFileSync(jsonPath, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`\n✓ full-legal-codes.json yangilandi: Jami ${merged.length} ta kodeks.`);
  } catch (e) {
    console.error('JSON faylni yangilashda xato:', e);
  }

  // 5. Final count verification in Supabase
  const { data: allCats } = await supabase.from('categories').select('code_id, name, article_count');
  const { count: finalArticlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });

  console.log('\n============================================================');
  console.log(`IMPORT TO'LIQ VA BENUQSON YAKUNLANDI!`);
  console.log(`Jami kategoriyalar: ${allCats?.length} ta`);
  console.log(`Supabase'dagi barcha rasmiy moddalar soni: ${finalArticlesCount} ta`);
  console.log('============================================================');
  console.table(allCats);
}

run().catch(console.error);
