/**
 * Supabase ga qonun kodekslarini import qilish skripti
 *
 * Talablar:
 *   1. npm install dotenv @supabase/supabase-js
 *   2. .env.local faylida quyidagi o'zgaruvchilar:
 *      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *      SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *
 * Ishga tushirish (PowerShell):
 *   cd C:\Users\ANUBIS~1\Desktop\JURISAI
 *   npm install dotenv @supabase/supabase-js
 *   node scripts/import-legal-to-supabase.js "C:\Users\ANUBIS PC\Desktop\35 TA QONUNCHILIK"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// ── CONFIG ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('');
  console.error('  XATO: .env.local da NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY topilmadi!');
  console.error('');
  console.error('  .env.local faylingizga quyidagilarni qoshing:');
  console.error('    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── CODE MAP ───────────────────────────────────────────────────────────────
// TXT fayl nomi -> Supabase code_id va kodeks nomi
const CODE_MAP = {
  'FK.txt':    { code_id: 'civil_code',           name: "O'zbekiston Respublikasi Fuqarolik kodeksi" },
  'JK.txt':    { code_id: 'criminal_code',         name: "O'zbekiston Respublikasi Jinoyat kodeksi" },
  'MK.txt':    { code_id: 'admin_code',            name: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi kodeksi" },
  'Mehnat.txt':{ code_id: 'labor_code',            name: "O'zbekiston Respublikasi Mehnat kodeksi" },
  'Oila.txt':  { code_id: 'family_code',           name: "O'zbekiston Respublikasi Oila kodeksi" },
  'Yer.txt':   { code_id: 'land_code',             name: "O'zbekiston Respublikasi Yer kodeksi" },
};

// Regex for "X-modda" pattern — matches Uzbek article headers
const ARTICLE_RE = /^(\d+)[-]\s*modda\b\s*\.?\s*(.*)/imsu;

// Regex for chapter headers like "1-BOB."
const CHAPTER_RE = /^(\d+)[-]?\s*bob/i;

// ── PARSE ───────────────────────────────────────────────────────────────────
function parseFile(filePath, codeMeta) {
  const raw = fs.readFileSync(filePath, 'utf-8');    // Normalise line-endings, strip BOM, collapse Unicode apostrophes
  const content = raw
    .replace(/\r\n?/g, '\n')
    .replace(/^\uFEFF/, '')
    .replace(/[\u2018\u2019\u02BB\u02BC]/g, "'");

  const lines = content.split('\n');
  const articles = [];
  let current = null;
  let chapter = 'Umumiy qoidalar';
  let body = [];
  let inArticle = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inArticle && current) body.push('');
      continue;
    }

    // ── Chapter detection ──
    const chMatch = line.match(CHAPTER_RE);
    if (chMatch) {
      if (inArticle && current) {
        current.content = body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (current.content) articles.push(current);
        current = null;
        body = [];
        inArticle = false;
      }
      chapter = line;
      continue;
    }

    // ── Article detection ──
    const artMatch = line.match(ARTICLE_RE);
    if (artMatch) {
      if (inArticle && current) {
        current.content = body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (current.content) articles.push(current);
        body = [];
      }

      current = {
        code_id: codeMeta.code_id,
        article_number: artMatch[1],
        title: artMatch[2] || '',
        content: '',
        chapter: chapter,
      };
      inArticle = true;
      continue;
    }

    // ── Body content ──
    if (inArticle && current) {
      // Skip metadata / editorial notes
      if (line.match(/^(Oldingi tahrirga qarang|Eski tahrir)/i)) continue;
      if (line.match(/^\(\d+-modda/)) continue;
      if (line.match(/^\(/)) continue; // skip footnote-like parenthesis lines
      body.push(line);
    }
  }

  // Last article
  if (inArticle && current) {
    current.content = body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (current.content) articles.push(current);
  }

  return articles;
}

// ── IMPORT ──────────────────────────────────────────────────────────────────
async function importCode(articles, codeMeta) {
  console.log(`\n  \u{1F4E5} ${codeMeta.name} (${codeMeta.code_id}) ...`);

  // Upsert category
  const { error: catErr } = await supabase
    .from('categories')
    .upsert(
      {
        code_id: codeMeta.code_id,
        name: codeMeta.name,
        description: codeMeta.name,
        article_count: articles.length,
      },
      { onConflict: 'code_id' }
    );

  if (catErr) {
    console.error(`    \u2717  Kategoriya xatosi: ${catErr.message}`);
    return 0;
  }

  // Batch-insert articles
  const BATCH = 100;
  let ok = 0;

  for (let i = 0; i < articles.length; i += BATCH) {
    const batch = articles.slice(i, i + BATCH);
    const { error: aErr } = await supabase
      .from('articles')
      .upsert(batch, { onConflict: 'code_id,article_number' });

    if (aErr) {
      // Show first few chars of problematic content for debugging
      const sample = batch[0]?.content?.slice(0, 60).replace(/\n/g, ' ');
      console.error(`    \u2717  Modda xatosi (${i + 1}-${i + batch.length}): ${aErr.message}`);
      console.error(`       Birinchi modda: ${sample}...`);
    } else {
      ok += batch.length;
    }
  }

  console.log(`    \u2713  ${ok} ta modda import qilindi`);
  return ok;
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  const lawsDir = process.argv[2];
  if (!lawsDir) {
    console.log('');
    console.log('  Foydalanish:');
    console.log('    node scripts/import-legal-to-supabase.js "C:\\Users\\ANUBIS PC\\Desktop\\35 TA QONUNCHILIK"');
    console.log('');
    console.log('  Yo\'l qisqa nom bilan ham ishlaydi (bo\'sh joy muammosini oldini oladi):');
    console.log('    node scripts\\import-legal-to-supabase.js "C:\\Users\\ANUBIS~1\\Desktop\\35 TA QONUNCHILIK"');
    console.log('');
    process.exit(0);
  }

  console.log('');
  console.log('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('    O\'zbekiston Qonunchiligi Import Skripti');
  console.log('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('');
  console.log(`  Manba papka: ${lawsDir}`);
  console.log('');

  if (!fs.existsSync(lawsDir)) {
    console.error(`  XATO: Papka topilmadi: ${lawsDir}`);
    console.error('  Tekshiring: papka mavjudmi va yo\'l to\'g\'rimi?');
    process.exit(1);
  }

  const files = fs.readdirSync(lawsDir);
  console.log(`  Papkada ${files.length} ta fayl topildi\n`);

  let totalFiles = 0;
  let totalArticles = 0;

  for (const file of files) {
    const meta = CODE_MAP[file];
    if (!meta) {
      console.log(`  \u23F9  ${file} — \u00F6tkazib yuborildi (CODE_MAP da yo\'q)`);
      continue;
    }

    const fp = path.resolve(lawsDir, file);
    if (!fs.existsSync(fp)) {
      console.log(`  \u26A0  ${file} topilmadi, o\'tkazib yuborildi`);
      continue;
    }

    const stat = fs.statSync(fp);
    const sizeKB = (stat.size / 1024).toFixed(1);

    console.log(`  \u{1F4C4} ${file} (${sizeKB} KB)`);
    console.log(`     Parsing qilinmoqda...`);

    const articles = parseFile(fp, meta);
    console.log(`     ${articles.length} ta modda topildi`);

    if (articles.length > 0) {
      const imported = await importCode(articles, meta);
      totalArticles += imported;
      totalFiles++;
    }
  }

  console.log('');
  console.log('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log(`  \u2705 Import tugadi!`);
  console.log(`     ${totalFiles} ta kodeks`);
  console.log(`     ${totalArticles} ta modda`);
  console.log('  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  console.log('');
}

main().catch((err) => {
  console.error('  \u2717  Umumiy xatolik:', err.message);
  console.error(err.stack);
  process.exit(1);
});
