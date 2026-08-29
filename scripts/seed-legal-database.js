#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISTIV: LEGAL DATABASE SEEDER (via @supabase/supabase-js)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node scripts/seed-legal-database.js
 *
 * What it does:
 *   1. Reads .env.local for Supabase credentials
 *   2. Reads and executes the SQL migration to create tables (via direct REST)
 *   3. Seeds all 8 TXT files from laws/ directory
 *   4. Also seeds hardcoded data from src/data/legal-codes.ts as fallback
 *
 * Environment variables needed (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ── Load .env.local ──────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

// ── Configuration ────────────────────────────────────────────────────────
const LAWS_DIR = path.join(__dirname, '..', 'laws');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MIGRATION_FILE = path.join(__dirname, '..', 'supabase/migrations/20250726_create_legal_codes_tables.sql');

// ── Full Uzbek names for codes ──────────────────────────────────────────
const FILENAME_TO_FULL_NAME = {
  'criminal_code': "Oʻzbekiston Respublikasi Jinoyat Kodeksi",
  'civil_code': "Oʻzbekiston Respublikasi Fuqarolik Kodeksi",
  'labor_code': "Oʻzbekiston Respublikasi Mehnat Kodeksi",
  'family_code': "Oʻzbekiston Respublikasi Oila Kodeksi",
  'tax_code': "Oʻzbekiston Respublikasi Soliq Kodeksi",
  'land_code': "Oʻzbekiston Respublikasi Yer Kodeksi",
  'admin_code': "Oʻzbekiston Respublikasi Ma'muriy Javobgarlik To'g'risidagi Kodeks",
  'constitution': "Oʻzbekiston Respublikasi Konstitutsiyasi",
  'civil_procedure_code': "Oʻzbekiston Respublikasi Fuqarolik Protsessual Kodeksi",
  'criminal_procedure_code': "Oʻzbekiston Respublikasi Jinoyat Protsessual Kodeksi",
  'economic_procedure_code': "Oʻzbekiston Respublikasi Iqtisodiy Protsessual Kodeksi",
};

// ── Parse TXT file ──────────────────────────────────────────────────────
function parseTxtFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const codeId = path.basename(filePath, '.txt');

  const result = {
    id: codeId,
    name: FILENAME_TO_FULL_NAME[codeId] || codeId.replace(/_/g, ' '),
    effectiveDate: '',
    totalArticles: 0,
    articles: [],
  };

  const articleRegex = /^(\d+)-modda\.?\s*(.*)/i;
  const chapterRegex = /^(\d+)-bob\.?\s*(.*)/i;
  let currentArticle = null;
  let currentContent = [];
  let foundCodeName = false;

  for (const line of lines) {
    if (/^[=\-•*]{3,}$/.test(line)) continue;

    if (!foundCodeName && /[A-Za-zĀ-ž'ʼʻʽ\s]+Kodeksi|[A-Za-zĀ-ž'ʼʻʽ\s]+Konstitutsiyasi/.test(line)) {
      foundCodeName = true;
      continue;
    }

    const dateMatch = line.match(/^Kuchga kirgan:\s*([\d.]+)/i);
    if (dateMatch) { result.effectiveDate = dateMatch[1]; continue; }

    const totalMatch = line.match(/^Jami moddalar:\s*(\d+)/i);
    if (totalMatch) { result.totalArticles = parseInt(totalMatch[1], 10); continue; }

    // Flush previous article
    if (articleRegex.test(line) && currentArticle) {
      currentArticle.content = currentContent.join('\n\n').trim();
      result.articles.push(currentArticle);
      currentContent = [];
    }

    const articleMatch = line.match(articleRegex);
    if (articleMatch) {
      currentArticle = {
        number: articleMatch[1],
        title: articleMatch[2] || '',
        content: '',
        chapter: '',
        category: 'Umumiy',
        penalties: '',
        references: [],
      };
      continue;
    }

    if (currentArticle) {
      const pMatch = line.match(/^Jazo:\s*(.*)/i);
      if (pMatch) { currentArticle.penalties = pMatch[1]; continue; }
      const rMatch = line.match(/^Tegishli:\s*(.*)/i);
      if (rMatch) { currentArticle.references = rMatch[1].split(',').map(r => r.trim()); continue; }
      currentContent.push(line);
    }
  }

  // Flush last article
  if (currentArticle) {
    currentArticle.content = currentContent.join('\n\n').trim();
    result.articles.push(currentArticle);
  }

  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  JURISTIV — Legal Database Seeder');
  console.log('══════════════════════════════════════════════════════════\n');

  loadEnv();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  console.log(`📡 Supabase: ${SUPABASE_URL}\n`);

  // Step 1: Try migration (SQL via REST won't work, but we can create tables via supabase client)
  console.log('📦 Step 1: Checking tables...');

  // Check if tables exist
  const { error: catCheckErr } = await supabase.from('categories').select('id').limit(1);
  const tablesExist = !catCheckErr || !catCheckErr.message?.includes('Could not find the table');

  if (!tablesExist) {
    console.log('  ⚠️  Tables do not exist in Supabase.');
    console.log('  💡 Please run the migration in Supabase Dashboard SQL Editor:');
    console.log(`     📄 ${MIGRATION_FILE}\n`);
    console.log('  📝 After creating tables, run this script again.');
    console.log('  ─────────────────────────────────────────────');
    console.log('  🗄️  SQL Migration Content:');
    console.log(fs.readFileSync(MIGRATION_FILE, 'utf8').substring(0, 500) + '...\n');
    console.log('  ─────────────────────────────────────────────\n');

    // Try to create tables via direct SQL execution using a custom approach
    // Since we can't execute raw SQL via REST, try the supabase_ functions
    console.log('  🔄 Attempting SQL execution via Supabase...');
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      query_text: fs.readFileSync(MIGRATION_FILE, 'utf8')
    }).single();
    
    if (sqlError) {
      console.log(`  ⚠️  SQL execution not available (${sqlError.message})`);
      console.log('  📋 Please run the migration in Supabase Dashboard SQL Editor manually.');
      console.log();
    }
  } else {
    console.log('  ✅ Tables exist!\n');
  }

  // Step 2: Seed codes from TXT files
  console.log('📂 Step 2: Reading TXT files from laws/...');

  const txtFiles = fs.readdirSync(LAWS_DIR).filter(f => f.endsWith('.txt')).sort();
  if (txtFiles.length === 0) {
    console.log('  ⚠️  No TXT files found in laws/ directory');
  } else {
    console.log(`  Found ${txtFiles.length} TXT file(s)\n`);
  }

  let totalArticles = 0;
  let totalCodes = 0;

  for (const filename of txtFiles) {
    const filePath = path.join(LAWS_DIR, filename);
    console.log(`  ── ${filename} ──`);

    const code = parseTxtFile(filePath);
    console.log(`  📖 ${code.name}`);
    console.log(`  📝 ${code.articles.length} articles`);

    if (tablesExist) {
      // Insert category
      const { error: catErr } = await supabase.from('categories').upsert({
        id: code.id,
        name: code.name,
        description: `${code.name} — ${code.effectiveDate || 'Noma\'lum'} dan kuchga kirgan. ${code.articles.length} ta modda.`,
        document_count: code.totalArticles || code.articles.length,
        document_type: 'Kodeks',
      }, { onConflict: 'id' });

      if (catErr) {
        console.log(`  ⚠️  Category insert error: ${catErr.message}`);
      } else {
        totalCodes++;
        // Insert articles
        let insertedArticles = 0;
        for (const article of code.articles) {
          if (!article.content && !article.title) continue;
          const { error: artErr } = await supabase.from('articles').upsert({
            code_id: code.id,
            article_number: article.number,
            title: article.title,
            content: article.content || article.title,
            category: article.category || 'Umumiy',
            penalties: article.penalties || '',
            references: article.references || [],
            chapter: article.chapter || '',
          }, { onConflict: 'code_id,article_number' });

          if (!artErr) insertedArticles++;
        }
        totalArticles += insertedArticles;
        console.log(`  ✅ ${insertedArticles} articles saved`);
      }
    } else {
      console.log(`  ⏭️  Tables not ready — skipping insert`);
    }
    console.log();
  }

  // Summary
  console.log('══════════════════════════════════════════════════════════');
  if (tablesExist) {
    console.log(`  ✅ DONE! Seeded ${totalCodes} codes and ${totalArticles} articles.`);
  } else {
    console.log('  ⚠️  Dry run complete.');
    console.log('  📋 To seed data:');
    console.log('    1. Go to https://supabase.com/dashboard/project/blayqzykzlmrjuvhzvsk');
    console.log('    2. Open SQL Editor');
    console.log('    3. Copy and run the SQL from:');
    console.log(`       supabase/migrations/20250726_create_legal_codes_tables.sql`);
    console.log('    4. Re-run this script:');
    console.log('       node scripts/seed-legal-database.js');
  }
  console.log('══════════════════════════════════════════════════════════\n');
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
