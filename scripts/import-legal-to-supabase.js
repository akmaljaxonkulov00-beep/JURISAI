/**
 * Supabase ga qonun kodekslarini import qilish skripti
 * 
 * Ishga tushirish:
 *   node scripts/import-legal-to-supabase.js
 * 
 * Talablar:
 *   - .env.local faylida NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY bo'lishi kerak
 *   - npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ .env.local da NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni belgilang!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const LAWS_DIR = process.argv[2] || 'C:/Users/ANUBIS PC/Desktop/35 TA QONUNCHILIK';

const CODE_MAP = {
  'FK.txt': { code_id: 'civil_code', name: "O'zbekiston Respublikasi Fuqarolik kodeksi", description: 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'JK.txt': { code_id: 'criminal_code', name: "O'zbekiston Respublikasi Jinoyat kodeksi", description: 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'Mehnat.txt': { code_id: 'labor_code', name: "O'zbekiston Respublikasi Mehnat kodeksi", description: 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'MK.txt': { code_id: 'labor_code', name: "O'zbekiston Respublikasi Mehnat kodeksi", description: 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'Oila.txt': { code_id: 'family_code', name: "O'zbekiston Respublikasi Oila kodeksi", description: 'Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'Yer.txt': { code_id: 'land_code', name: "O'zbekiston Respublikasi Yer kodeksi", description: 'Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
};

const ARTICLE_PATTERN = /^(\d+)-modda\.?\s*(.*)/i;

async function parseFile(filePath, codeMeta) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const articles = [];
  let currentArticle = null;
  let currentChapter = 'Umumiy qoidalar';
  let currentContent = [];
  let inArticle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inArticle && currentArticle) currentContent.push('');
      continue;
    }

    // Bobni aniqlash
    if (line.match(/^(\d+)-?BOB\.?\s/i)) {
      if (inArticle && currentArticle) {
        currentArticle.content = currentContent.join('\n').trim();
        if (currentArticle.content) articles.push(currentArticle);
        currentArticle = null;
        currentContent = [];
        inArticle = false;
      }
      currentChapter = line;
      continue;
    }

    // Moddani aniqlash
    const match = line.match(ARTICLE_PATTERN);
    if (match) {
      if (inArticle && currentArticle) {
        currentArticle.content = currentContent.join('\n').trim();
        if (currentArticle.content) articles.push(currentArticle);
        currentContent = [];
      }

      const articleNumber = match[1];
      const title = match[2] || '';

      currentArticle = {
        code_id: codeMeta.code_id,
        article_number: articleNumber,
        title: title,
        content: '',
        chapter: currentChapter,
      };
      inArticle = true;
      continue;
    }

    // Content
    if (inArticle && currentArticle) {
      // Skip metadata lines
      if (line.startsWith('Oldingi tahrirga qarang') ||
          line.match(/^\s*\(.*(?:sonli Qonuni|Qonunchilik maʼlumotlari|OʻR QHT|Oliy Majlis)/i) ||
          line.match(/^\d+-modda/i)) {
        continue;
      }
      currentContent.push(line);
    }
  }

  // Save last article
  if (inArticle && currentArticle) {
    currentArticle.content = currentContent.join('\n').trim();
    if (currentArticle.content) articles.push(currentArticle);
  }

  return articles;
}

async function importToSupabase(articles, codeMeta) {
  console.log(`\n📥 ${codeMeta.name} (${codeMeta.code_id})...`);

  // Upsert category
  const { error: catError } = await supabase
    .from('categories')
    .upsert({
      code_id: codeMeta.code_id,
      name: codeMeta.name,
      description: codeMeta.description,
      article_count: articles.length,
    }, { onConflict: 'code_id' });

  if (catError) {
    console.error(`  ✗ Kategoriya xatosi: ${catError.message}`);
    return;
  }

  // Upsert articles in batches
  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const { error: artError } = await supabase
      .from('articles')
      .upsert(batch, { onConflict: 'code_id,article_number' });

    if (artError) {
      console.error(`  ✗ Modda xatosi (${i}-${i + batch.length}): ${artError.message}`);
    } else {
      imported += batch.length;
    }
  }

  console.log(`  ✓ ${imported} ta modda import qilindi`);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  O\'zbekiston Qonun Kodekslari Importi');
  console.log('═══════════════════════════════════════════');
  console.log(`  Manba: ${LAWS_DIR}\n`);

  // First ensure categories table has our codes
  console.log('📚 Kategoriyalarni tekshirish...');
  
  const files = fs.readdirSync(LAWS_DIR);
  let totalFiles = 0;
  let totalArticles = 0;

  for (const file of files) {
    const codeMeta = CODE_MAP[file];
    if (!codeMeta) continue;

    const filePath = path.join(LAWS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ ${file} topilmadi, o'tkazib yuborildi`);
      continue;
    }

    console.log(`\n📄 Fayl: ${file}`);
    const articles = await parseFile(filePath, codeMeta);
    console.log(`  📝 ${articles.length} ta modda topildi`);

    await importToSupabase(articles, codeMeta);
    totalFiles++;
    totalArticles += articles.length;
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Import tugadi!`);
  console.log(`   ${totalFiles} ta kodeks`);
  console.log(`   ${totalArticles} ta modda`);
  console.log('═══════════════════════════════════════════');
}

main().catch(console.error);
