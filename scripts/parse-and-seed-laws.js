#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISTIV LEGAL CODE TXT PARSER & SUPABASE SEEDER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 📋 USAGE:
 *   node scripts/parse-and-seed-laws.js
 *
 * 📂 WHAT IT DOES:
 *   1. Reads all *.txt files from the `laws/` directory
 *   2. Auto-detects which legal code each file belongs to (by filename + header)
 *   3. Parses each TXT file to extract:
 *      - Code metadata (name, effective date, total articles)
 *      - Chapters (bobs/sections)
 *      - Individual articles (number, title, full content)
 *      - Penalties (Jazo: field)
 *      - Cross-references (Tegishli: field)
 *   4. Upserts categories (codes) and articles into Supabase
 *   5. Idempotent — safe to run multiple times
 *
 * 📁 TXT FILE FORMAT (laws/criminal_code.txt):
 *
 *   O'zbekiston Respublikasi Jinoyat Kodeksi
 *   ==========================================
 *   Kuchga kirgan: 01.04.1995
 *   Jami moddalar: 302
 *
 *   1-bob. Bob nomi
 *
 *   1-modda. Modda nomi
 *   Modda matni...
 *   Jazo: Jazo matni
 *   Tegishli: JK 97, JK 98
 *
 * ⚙️ ENV VARS NEEDED:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ── Load environment variables from .env.local ──────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envPathsToTry = [
    envPath,
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.production'),
  ];

  for (const p of envPathsToTry) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) return;
        const key = trimmed.substring(0, eqIdx).trim();
        let value = trimmed.substring(eqIdx + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      console.log(`  📄 Loaded env from: ${p}`);
      return;
    }
  }
  console.log('  ⚠️  No .env file found, using process.env');
}

// ── Configuration ───────────────────────────────────────────────────────
const LAWS_DIR = path.join(__dirname, '..', 'laws');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ── Code ID mapping from filename to Supabase code_id ───────────────────
const FILENAME_TO_CODE_ID = {
  'criminal_code': 'criminal_code',
  'civil_code': 'civil_code',
  'labor_code': 'labor_code',
  'family_code': 'family_code',
  'tax_code': 'tax_code',
  'land_code': 'land_code',
  'admin_code': 'admin_code',
  'constitution': 'constitution',
  'civil_procedure_code': 'civil_procedure_code',
  'criminal_procedure_code': 'criminal_procedure_code',
  'economic_procedure_code': 'economic_procedure_code',
};

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

// ── TXT Parser Engine ───────────────────────────────────────────────────
// Regex patterns for parsing
const PATTERNS = {
  // Code header: "O'zbekiston Respublikasi Jinoyat Kodeksi"
  codeName: /^([A-Za-zĀ-ž'ʼʻʽ\s]+Kodeksi|[A-Za-zĀ-ž'ʼʻʽ\s]+Konstitutsiyasi)/,
  // Effective date: "Kuchga kirgan: 01.04.1995"
  effectiveDate: /^Kuchga kirgan:\s*([\d.]+)/i,
  // Total articles: "Jami moddalar: 302"
  totalArticles: /^Jami moddalar:\s*(\d+)/i,
  // Chapter: "1-bob. Bob nomi" or "1-bob. Umumiy qoidalar"
  chapter: /^(\d+)-bob\.\s*(.*)/i,
  // Section (sub-chapter): "1-§. Paragraf nomi"
  section: /^(\d+)-§\.\s*(.*)/,
  // Article: "1-modda. Modda nomi"
  article: /^(\d+)-modda\.\s*(.*)/i,
  // Penalties: "Jazo: ..."
  penalties: /^Jazo:\s*(.*)/i,
  // References: "Tegishli: JK 97, JK 98"
  references: /^Tegishli:\s*(.*)/i,
};

/**
 * Parse a single TXT file into structured code data
 */
function parseTxtFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const codeId = path.basename(filePath, '.txt');
  const result = {
    id: codeId,
    name: FILENAME_TO_FULL_NAME[codeId] || codeId.replace(/_/g, ' '),
    effectiveDate: '',
    totalArticles: 0,
    chapters: [],
    articles: [],
  };

  let currentChapter = '';
  let currentSection = '';
  let currentArticle = null;
  let currentContent = [];
  let foundCodeName = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip separator lines (=== or --- lines)
    if (/^[=\-•\*]{3,}$/.test(line)) continue;

    // Try to find code name in header
    if (!foundCodeName && PATTERNS.codeName.test(line)) {
      foundCodeName = true;
      result.name = FILENAME_TO_FULL_NAME[codeId] || line;
      continue;
    }

    // Effective date
    const dateMatch = line.match(PATTERNS.effectiveDate);
    if (dateMatch) {
      result.effectiveDate = dateMatch[1];
      continue;
    }

    // Total articles
    const totalMatch = line.match(PATTERNS.totalArticles);
    if (totalMatch) {
      result.totalArticles = parseInt(totalMatch[1], 10);
      continue;
    }

    // Chapter (e.g. "1-bob. Asosiy qoidalar")
    const chapterMatch = line.match(PATTERNS.chapter);
    if (chapterMatch) {
      // Flush any pending article before starting new chapter
      if (currentArticle) {
        currentArticle.content = currentContent.join('\n\n').trim();
        result.articles.push(currentArticle);
        currentArticle = null;
        currentContent = [];
      }
      currentChapter = `${chapterMatch[1]}-bob. ${chapterMatch[2]}`;
      result.chapters.push(currentChapter);
      continue;
    }

    // Section (e.g. "1-§. Umumiy qism")
    const sectionMatch = line.match(PATTERNS.section);
    if (sectionMatch) {
      currentSection = `${sectionMatch[1]}-§. ${sectionMatch[2]}`;
      continue;
    }

    // Article (e.g. "1-modda. Vazifalar")
    const articleMatch = line.match(PATTERNS.article);
    if (articleMatch) {
      // Flush previous article
      if (currentArticle) {
        currentArticle.content = currentContent.join('\n\n').trim();
        // Extract penalties from content if not already set
        if (!currentArticle.penalties) {
          const pMatch = currentArticle.content.match(PATTERNS.penalties);
          if (pMatch) {
            currentArticle.penalties = pMatch[1];
            currentArticle.content = currentArticle.content.replace(/^Jazo:.*$/m, '').trim();
          }
        }
        // Extract references from content if not already set
        if (!currentArticle.references || currentArticle.references.length === 0) {
          const rMatch = currentArticle.content.match(PATTERNS.references);
          if (rMatch) {
            currentArticle.references = rMatch[1].split(',').map(r => r.trim());
            currentArticle.content = currentArticle.content.replace(/^Tegishli:.*$/m, '').trim();
          }
        }
        result.articles.push(currentArticle);
      }

      currentArticle = {
        number: articleMatch[1],
        title: articleMatch[2],
        content: '',
        chapter: currentChapter,
        section: currentSection,
        category: currentChapter.replace(/^\d+-bob\.\s*/, ''),
        penalties: '',
        references: [],
      };
      currentContent = [];
      continue;
    }

    // Check for standalone penalties on a line by itself (not inside an article block)
    const penaltyMatch = line.match(PATTERNS.penalties);
    if (penaltyMatch && currentArticle) {
      currentArticle.penalties = (currentArticle.penalties ? currentArticle.penalties + '; ' : '') + penaltyMatch[1];
      continue;
    }

    // Check for standalone references
    const refMatch = line.match(PATTERNS.references);
    if (refMatch && currentArticle) {
      currentArticle.references = [
        ...currentArticle.references,
        ...refMatch[1].split(',').map(r => r.trim()),
      ];
      continue;
    }

    // Otherwise, it's content of the current article
    if (currentArticle) {
      currentContent.push(line);
    }
  }

  // Flush last article
  if (currentArticle) {
    currentArticle.content = currentContent.join('\n\n').trim();
    if (!currentArticle.penalties) {
      const pMatch = currentArticle.content.match(PATTERNS.penalties);
      if (pMatch) {
        currentArticle.penalties = pMatch[1];
        currentArticle.content = currentArticle.content.replace(/^Jazo:.*$/m, '').trim();
      }
    }
    if (!currentArticle.references || currentArticle.references.length === 0) {
      const rMatch = currentArticle.content.match(PATTERNS.references);
      if (rMatch) {
        currentArticle.references = rMatch[1].split(',').map(r => r.trim());
        currentArticle.content = currentArticle.content.replace(/^Tegishli:.*$/m, '').trim();
      }
    }
    result.articles.push(currentArticle);
  }

  return result;
}

// ── Supabase Upsert ─────────────────────────────────────────────────────
async function upsertCodeToSupabase(code) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  ⚠️  No Supabase credentials — printing parsed data instead');
    return { category: false, articles: 0 };
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  let categoryInserted = false;
  let articlesInserted = 0;

  // ── Upsert category (code) ──────────────────────────────────────────
  try {
    const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: code.id,
        name: code.name,
        description: `${code.name} — ${code.effectiveDate} dan kuchga kirgan. ${code.articles.length} ta modda.`,
        document_count: code.totalArticles || code.articles.length,
        document_type: 'Kodeks',
      }),
    });

    if (catRes.ok || catRes.status === 409) {
      categoryInserted = true;
    } else {
      const errText = await catRes.text();
      // Table might not exist — try creating it
      if (catRes.status === 404 || catRes.status === 400) {
        console.log(`  ⚠️  categories table may not exist. Run the migration first:`);
        console.log(`     supabase/migrations/20250726_create_legal_codes_tables.sql`);
        console.log(`  📝 Data would be: ${code.name} (${code.articles.length} articles)`);
        return { category: false, articles: 0 };
      }
    }
  } catch (e) {
    console.log(`  ⚠️  Category upsert error (non-critical): ${e.message}`);
    return { category: false, articles: 0 };
  }

  // ── Upsert articles ─────────────────────────────────────────────────
  for (const article of code.articles) {
    // Skip if article has no content
    if (!article.content && !article.title) continue;

    try {
      const artRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          code_id: code.id,
          article_number: article.number,
          title: article.title,
          content: article.content || article.title,
          category: article.category || 'Umumiy',
          penalties: article.penalties || '',
          references: JSON.stringify(article.references || []),
          chapter: article.chapter || '',
          section: article.section || '',
        }),
      });

      if (artRes.ok || artRes.status === 409) {
        articlesInserted++;
      }
    } catch (e) {
      console.log(`  ⚠️  Article ${article.number} error: ${e.message}`);
    }
  }

  return { category: categoryInserted, articles: articlesInserted };
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  JURISTIV — Legal Code TXT Parser & Supabase Seeder');
  console.log('══════════════════════════════════════════════════════════\n');

  // Load env
  loadEnv();

  // Check Supabase credentials
  if (SUPABASE_URL && SUPABASE_KEY) {
    console.log(`  📡 Supabase: ${SUPABASE_URL}`);
  } else {
    console.log('  ⚠️  No Supabase credentials — dry run mode (parse only)');
    console.log('  💡 Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
  }

  // Check laws directory
  if (!fs.existsSync(LAWS_DIR)) {
    console.error(`  ❌ Laws directory not found: ${LAWS_DIR}`);
    console.error('  💡 Create a laws/ directory with .txt files');
    process.exit(1);
  }

  // Find all TXT files
  const txtFiles = fs.readdirSync(LAWS_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (txtFiles.length === 0) {
    console.error('  ❌ No .txt files found in laws/ directory');
    console.error('  💡 Add TXT files (e.g., criminal_code.txt, civil_code.txt)');
    process.exit(1);
  }

  console.log(`  📂 Found ${txtFiles.length} TXT file(s) in laws/\n`);

  let totalCategories = 0;
  let totalArticles = 0;

  // Process each TXT file
  for (const filename of txtFiles) {
    const filePath = path.join(LAWS_DIR, filename);
    console.log(`  ── Processing: ${filename} ──────────────────`);

    // Parse
    const code = parseTxtFile(filePath);
    console.log(`  📖 ${code.name}`);
    const unknownDate = "Noma'lum";
    console.log(`  📅 Kuchga kirgan: ${code.effectiveDate || unknownDate}`);
    console.log(`  📝 Moddalar: ${code.articles.length} ta`);
    if (code.chapters.length > 0) {
      console.log(`  📑 Boblar: ${code.chapters.join(', ')}`);
    }

    // Upsert to Supabase
    const result = await upsertCodeToSupabase(code);

    if (result.category) {
      totalCategories++;
    }
    totalArticles += result.articles;

    console.log(`  ✅ ${result.articles} ta modda saqlandi\n`);
  }

  // Summary
  console.log('══════════════════════════════════════════════════════════');
  console.log('  ✅ BAJARILDI!');
  console.log(`  📊 Kategoriyalar: ${totalCategories} ta`);
  console.log(`  📊 Moddalar: ${totalArticles} ta`);
  console.log('══════════════════════════════════════════════════════════\n');

  // Print usage instructions
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  💡 Supabase ga yuklash uchun:');
    console.log('  1. NEXT_PUBLIC_SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY ni .env.local ga qoshish');
    console.log('  2. Supabase SQL Editor da migratsiyani ishga tushiring:');
    console.log('     supabase/migrations/20250726_create_legal_codes_tables.sql');
    console.log('  3. Ushbu skriptni qayta ishga tushiring:');
    console.log('     node scripts/parse-and-seed-laws.js\n');
  }

  console.log('  💡 Yangi TXT fayl qoshish uchun:');
  console.log('  1. laws/ papkasiga .txt fayl qoying');
  console.log('  2. Skriptni qayta ishga tushiring (idempotent - takroran xavfsiz)\n');
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
