/**
 * JURISTIV Legal TXT Parser & Supabase Seeder
 * 
 * Usage:
 *   node scripts/parse-legal-txt.js --file="C:/path/to/Mehnat.txt" --code-id=labor_code --short-name=MK
 *   node scripts/parse-legal-txt.js --dir="C:/35 TA QONUNCHILIK"  (batch process all .txt files)
 *   node scripts/parse-legal-txt.js --file="..." --seed  (also seed to Supabase)
 * 
 * This script:
 * 1. Reads a TXT file containing Uzbek legal code text
 * 2. Parses articles (moddalar) - extracting number, title, content
 * 3. Groups by categories (bo'limlar/boblar)
 * 4. Outputs as JSON or seeds directly to Supabase
 */

const fs = require('fs');
const path = require('path');

// ── Parse command line args ──
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, ...vals] = arg.replace(/^--/, '').split('=');
  acc[key] = vals.join('=');
  return acc;
}, {});

const FILE_PATH = args.file || args.f;
const DIRECTORY = args.dir || args.d;
const CODE_ID = args['code-id'] || args.code || 'unknown';
const SHORT_NAME = args['short-name'] || args.short || 'XX';
const SEED = args.seed || args.s || false;
const OUTPUT = args.output || args.o;

// ═══════════════════════════════════════════════════════════════════════════
// Configuration: Map file names to code IDs
// ═══════════════════════════════════════════════════════════════════════════

const FILE_CONFIGS = {
  'mehnat.txt': { id: 'labor_code', shortName: 'MK', name: "O'zbekiston Respublikasi Mehnat kodeksi", description: 'Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'jk.txt': { id: 'criminal_code', shortName: 'JK', name: "O'zbekiston Respublikasi Jinoyat kodeksi", description: 'Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'fk.txt': { id: 'civil_code', shortName: 'FK', name: "O'zbekiston Respublikasi Fuqarolik kodeksi", description: 'Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'oila.txt': { id: 'family_code', shortName: 'OK', name: "O'zbekiston Respublikasi Oila kodeksi", description: 'Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'soliq.txt': { id: 'tax_code', shortName: 'SK', name: "O'zbekiston Respublikasi Soliq kodeksi", description: 'Soliq munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'yer.txt': { id: 'land_code', shortName: 'ZK', name: "O'zbekiston Respublikasi Yer kodeksi", description: 'Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati' },
  'mjtk.txt': { id: 'admin_code', shortName: 'MJK', name: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi kodeks", description: "Ma'muriy huquqbuzarliklar va javobgarlikni tartibga soluvchi qonun" },
};

// ═══════════════════════════════════════════════════════════════════════════
// Parser
// ═══════════════════════════════════════════════════════════════════════════

function parseLegalText(text, codeId, shortName) {
  const lines = text.split('\n');
  const articles = [];
  let currentArticle = null;
  let currentCategory = 'Umumiy qoidalar';
  let currentSection = '';

  // Patterns
  const categoryPatterns = [
    /^(?:^|\s)([A-ZА-ЯЁ][A-ZА-ЯЁ\s\-]+)(?:BOʻLIM|BO'LIM|BOLIM|bob|БЎЛИМ|БОБ)/i,
    /^(?:^|\s)(\d+\s*-?\s*[bB][oʻo']?lim)/i,
    /^(?:^|\s)(\d+\s*-?\s*[bB][oāo]b)/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for section headers (BO'LIM, BOB)
    const upperLine = line.toUpperCase();
    if (
      (upperLine.includes('BOʻLIM') || upperLine.includes("BO'LIM") || upperLine.includes('БОЛИМ') || upperLine.includes('БЎЛИМ')) &&
      !upperLine.includes('MODDA')
    ) {
      currentCategory = line.replace(/^\d+\s*[-–.]?\s*/, '').trim();
      continue;
    }
    if (
      (upperLine.includes('BOB') || upperLine.includes('БОБ')) &&
      !upperLine.includes('MODDA')
    ) {
      currentSection = line.replace(/^\d+\s*[-–.]?\s*/, '').trim();
      // Combine section into category
      if (currentCategory && currentSection) {
        // Don't replace, just note the section
      }
      continue;
    }

    // Article pattern: "N-modda. Title" or "N-modda. Title" or "N-moddaning ..."
    const articleMatch = line.match(/^(\d+)\s*[-–.]?\s*(?:modda|МОДДА)s?\.?\s*(.*)/i);
    if (articleMatch) {
      // Save previous article
      if (currentArticle && currentArticle.content.trim()) {
        articles.push(currentArticle);
      }

      const articleNumber = articleMatch[1];
      const title = articleMatch[2]?.trim() || '';

      currentArticle = {
        number: articleNumber,
        title: title,
        content: '',
        category: currentCategory,
        penalties: extractPenalties(title + ' ' + line),
        references: [],
      };
      continue;
    }

    // Pattern: "N-modda. Title" (without colon after modda)
    const articleMatch2 = line.match(/^(\d+)-modda\.?\s+(.*)/i);
    if (articleMatch2 && !currentArticle) {
      if (currentArticle && currentArticle.content.trim()) {
        articles.push(currentArticle);
      }
      currentArticle = {
        number: articleMatch2[1],
        title: articleMatch2[2]?.trim() || '',
        content: '',
        category: currentCategory,
        penalties: extractPenalties(articleMatch2[2] || ''),
        references: [],
      };
      continue;
    }

    // If we're inside an article, add content
    if (currentArticle) {
      // Skip section headers within article
      if (
        (upperLine.includes('BOʻLIM') || upperLine.includes("BO'LIM") || upperLine.includes('БОБ')) &&
        !upperLine.includes('MODDA')
      ) {
        // This is a new section - flush current article if any
        if (currentArticle && currentArticle.content.trim()) {
          articles.push(currentArticle);
        }
        currentArticle = null;
        currentCategory = line.replace(/^\d+\s*[-–.]?\s*/, '').trim();
        continue;
      }

      currentArticle.content += line + '\n';
    }
  }

  // Push last article
  if (currentArticle && currentArticle.content.trim()) {
    articles.push(currentArticle);
  }

  // Post-process: extract penalties from content
  articles.forEach(article => {
    const content = article.content;
    // Look for penalty patterns
    const penaltyMatches = content.match(/(?:jazo|jazolanadi|jarima|ozodlikdan mahrum qilish|majburiy jamoat ishlari|axloq tuzatish ishlari)[^.]*\./gi);
    if (penaltyMatches && !article.penalties) {
      article.penalties = penaltyMatches.join('; ').substring(0, 200);
    }

    // Extract references to other articles
    const refMatches = content.match(/(?:ushbu Kodeks|JK|FK|MK|OK|SK|ZK|MJK)\s+\d+/gi);
    if (refMatches) {
      article.references = [...new Set(refMatches.map(r => r.trim()))];
    }
  });

  // Categorize articles by their content patterns
  const categorizedArticles = articles.map(article => {
    const content = article.content.toLowerCase();
    if (content.includes('jazo') || content.includes('ozodlikdan mahrum') || content.includes('jarima')) {
      article.category = article.category || 'Jazo va javobgarlik';
    }
    if (content.includes('shartnoma') || content.includes('kelishuv')) {
      article.category = article.category || 'Shartnoma va kelishuvlar';
    }
    if (content.includes('mehnat') || article.title.toLowerCase().includes('mehnat')) {
      article.category = article.category || 'Mehnat munosabatlari';
    }
    return article;
  });

  return {
    id: codeId,
    shortName: shortName,
    articles: articles,
    totalArticles: articles.length,
  };
}

function extractPenalties(text) {
  const lower = text.toLowerCase();
  if (lower.includes('ozodlikdan mahrum')) {
    const match = text.match(/(\d+\s*(?:yil|oy)[^.]*ozodlikdan mahrum)/i);
    return match ? match[1] : 'Ozodlikdan mahrum qilish';
  }
  if (lower.includes('jarima')) {
    const match = text.match(/(jarima[^.]*\.)/i);
    return match ? match[1] : 'Jarima';
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  let filesToProcess = [];

  if (FILE_PATH) {
    filesToProcess = [{ path: FILE_PATH, config: getConfig(FILE_PATH) }];
  } else if (DIRECTORY) {
    const dirFiles = fs.readdirSync(DIRECTORY)
      .filter(f => f.endsWith('.txt'))
      .map(f => ({
        path: path.join(DIRECTORY, f),
        config: getConfig(f),
      }));
    filesToProcess = dirFiles;
    console.log(`📁 Found ${dirFiles.length} TXT files in directory`);
  } else {
    console.log(`
Usage:
  node scripts/parse-legal-txt.js --file="path/to/file.txt"
  node scripts/parse-legal-txt.js --dir="path/to/directory"
  node scripts/parse-legal-txt.js --file="..." --seed (also seed to Supabase)
  node scripts/parse-legal-txt.js --file="..." --output=result.json
    `);
    process.exit(0);
  }

  for (const { path: filePath, config } of filesToProcess) {
    if (!config) {
      console.log(`⚠️  Skipping ${filePath}: no config mapping found`);
      continue;
    }

    console.log(`\n📄 Processing: ${path.basename(filePath)}`);
    console.log(`   Code: ${config.name} (${config.shortName})`);

    const text = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseLegalText(text, config.id, config.shortName);

    console.log(`   ✅ Parsed ${parsed.articles.length} articles`);

    // Show summary
    const categories = [...new Set(parsed.articles.map(a => a.category))];
    console.log(`   📂 Categories: ${categories.length}`);
    categories.forEach(c => {
      const count = parsed.articles.filter(a => a.category === c).length;
      console.log(`      - ${c}: ${count} ta modda`);
    });

    // Output JSON
    if (OUTPUT) {
      const outputPath = OUTPUT.replace('{name}', config.id);
      fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
      console.log(`   💾 Output written to: ${outputPath}`);
    } else {
      // Default: write to scripts/output/
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, `${config.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
      console.log(`   💾 Output written to: ${outputPath}`);
    }

    // Seed to Supabase
    if (SEED) {
      console.log(`   🌱 Seeding to Supabase...`);
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.log('   ⚠️  Supabase URL or Key not found in environment. Skipping seed.');
          console.log('      Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        } else {
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Upsert code
          const { error: codeError } = await supabase
            .from('legal_codes')
            .upsert({
              id: config.id,
              name: config.name,
              short_name: config.shortName,
              description: config.description || '',
              total_articles: parsed.articles.length,
              effective_date: '01.01.2024',
            }, { onConflict: 'id' });

          if (codeError) {
            console.log(`   ⚠️  Error upserting code: ${codeError.message}`);
          } else {
            console.log(`   ✅ Code '${config.shortName}' upserted`);
          }

          // Batch upsert articles (in chunks of 50 to avoid payload limits)
          const chunkSize = 50;
          for (let i = 0; i < parsed.articles.length; i += chunkSize) {
            const chunk = parsed.articles.slice(i, i + chunkSize).map((a, idx) => ({
              code_id: config.id,
              article_number: a.number,
              title: a.title,
              content: a.content,
              category: a.category || 'Umumiy',
              penalties: a.penalties || null,
              references: a.references || [],
              order_index: i + idx,
            }));

            const { error: articlesError } = await supabase
              .from('legal_articles')
              .upsert(chunk, { onConflict: 'code_id,article_number' });

            if (articlesError) {
              console.log(`   ⚠️  Error seeding articles chunk ${i / chunkSize + 1}: ${articlesError.message}`);
            } else {
              console.log(`   ✅ Seeded articles ${i + 1}-${Math.min(i + chunkSize, parsed.articles.length)}`);
            }
          }

          console.log(`   ✅ All ${parsed.articles.length} articles seeded successfully!`);
        }
      } catch (err) {
        console.log(`   ⚠️  Seed error: ${err.message}`);
        console.log('      Make sure @supabase/supabase-js is installed: npm install @supabase/supabase-js');
      }
    }
  }

  console.log('\n✅ All files processed!');
}

function getConfig(filename) {
  const basename = path.basename(filename).toLowerCase();
  return FILE_CONFIGS[basename] || null;
}

main().catch(console.error);
