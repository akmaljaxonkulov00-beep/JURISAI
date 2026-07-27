/**
 * O'zbekiston Respublikasi Qonun Kodekslari Parser
 * 
 * This script reads TXT files from the user's laws directory,
 * parses articles structured as "X-modda. Title" with content,
 * and generates Supabase-compatible JSON output.
 * 
 * Usage: node scripts/parse-legal-files.js
 */

const fs = require('fs');
const path = require('path');

// Mapping from filename to code metadata
const CODE_MAP = {
  'FK.txt': { id: 'civil_code', name: "Oʻzbekiston Respublikasi Fuqarolik kodeksi", description: "Fuqarolik huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'JK.txt': { id: 'criminal_code', name: "Oʻzbekiston Respublikasi Jinoyat kodeksi", description: "Jinoyat huquq munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'Mehnat.txt': { id: 'labor_code', name: "Oʻzbekiston Respublikasi Mehnat kodeksi", description: "Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'MK.txt': { id: 'labor_code', name: "Oʻzbekiston Respublikasi Mehnat kodeksi", description: "Mehnat munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'Oila.txt': { id: 'family_code', name: "Oʻzbekiston Respublikasi Oila kodeksi", description: "Oila munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'Yer.txt': { id: 'land_code', name: "Oʻzbekiston Respublikasi Yer kodeksi", description: "Yer munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
  'SK.txt': { id: 'tax_code', name: "Oʻzbekiston Respublikasi Soliq kodeksi", description: "Soliq munosabatlarini tartibga soluvchi asosiy qonun hujjati" },
};

// Regex patterns
const ARTICLE_PATTERN = /^(\d+)-modda\.?\s*(.*)/i;
const CHAPTER_PATTERN = /^(\d+)-?BOB\.?\s*(.*)/i;
const SECTION_PATTERN = /^(I+|II+|III+|IV+|V+|VI+|VII+|VIII+|IX+|X+|XI+|XII+|XIII+|XIV+|XV+)\s*(BO'LIM|BOB|QISM)?\.?\s*(.*)/i;

function parseTextFile(filePath, codeMeta) {
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
      if (inArticle && currentArticle) {
        currentContent.push('');
      }
      continue;
    }
    
    // Check for chapter
    const chapterMatch = line.match(CHAPTER_PATTERN);
    if (chapterMatch) {
      if (inArticle && currentArticle) {
        currentArticle.content = currentContent.join('\n').trim();
        if (currentArticle.content) {
          articles.push(currentArticle);
        }
        currentArticle = null;
        currentContent = [];
        inArticle = false;
      }
      currentChapter = line;
      continue;
    }
    
    // Check for article
    const articleMatch = line.match(ARTICLE_PATTERN);
    if (articleMatch) {
      if (inArticle && currentArticle) {
        currentArticle.content = currentContent.join('\n').trim();
        if (currentArticle.content) {
          articles.push(currentArticle);
        }
        currentContent = [];
      }
      
      const articleNumber = articleMatch[1];
      const articleTitle = articleMatch[2] || '';
      
      currentArticle = {
        code_id: codeMeta.id,
        article_number: articleNumber,
        title: articleTitle,
        content: '',
        chapter: currentChapter,
        category: currentChapter
      };
      inArticle = true;
      continue;
    }
    
    // Skip header lines (code name, metadata)
    if (!inArticle && !chapterMatch) {
      continue;
    }
    
    // Content line
    if (inArticle && currentArticle) {
      // Skip lines that are just "Oldingi tahrirga qarang." or similar metadata
      if (line.startsWith('Oldingi tahrirga qarang') || 
          line.startsWith('(') && line.includes('sonli Qonuni') ||
          line.startsWith('(') && line.includes('Qonunchilik maʼlumotlari') ||
          line.startsWith('(') && line.includes('OʻR QHT') ||
          line.startsWith('(') && line.includes('Oliy Majlis') ||
          line.match(/^\d+-modda/i)) {
        continue;
      }
      currentContent.push(line);
    }
  }
  
  // Save last article
  if (inArticle && currentArticle) {
    currentArticle.content = currentContent.join('\n').trim();
    if (currentArticle.content) {
      articles.push(currentArticle);
    }
  }
  
  return {
    id: codeMeta.id,
    name: codeMeta.name,
    shortName: codeMeta.name,
    description: codeMeta.description,
    totalArticles: articles.length,
    effectiveDate: '01.01.2024',
    articles: articles
  };
}

// Main
const lawsDir = process.argv[2] || 'C:/Users/ANUBIS PC/Desktop/35 TA QONUNCHILIK';
const outputDir = process.argv[3] || './scripts/output';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const results = {};

const files = fs.readdirSync(lawsDir);
let parsedCount = 0;

files.forEach(file => {
  const codeMeta = CODE_MAP[file];
  if (!codeMeta) return;
  
  const filePath = path.join(lawsDir, file);
  console.log(`Parsing: ${file}...`);
  
  try {
    const parsed = parseTextFile(filePath, codeMeta);
    results[codeMeta.id] = parsed;
    fs.writeFileSync(
      path.join(outputDir, `${codeMeta.id}.json`),
      JSON.stringify(parsed, null, 2)
    );
    console.log(`  ✓ ${parsed.articles.length} ta modda topildi`);
    parsedCount++;
  } catch (err) {
    console.error(`  ✗ Xatolik: ${err.message}`);
  }
});

// Generate combined output
fs.writeFileSync(
  path.join(outputDir, 'all-codes.json'),
  JSON.stringify(results, null, 2)
);

console.log(`\n✅ Jami ${parsedCount} ta kodeks parselandi!`);
console.log(`   Natijalar: ${outputDir}/`);

if (results.criminal_code) console.log(`   - Jinoyat kodeksi: ${results.criminal_code.articles.length} ta modda`);
if (results.civil_code) console.log(`   - Fuqarolik kodeksi: ${results.civil_code.articles.length} ta modda`);
if (results.labor_code) console.log(`   - Mehnat kodeksi: ${results.labor_code.articles.length} ta modda`);
if (results.family_code) console.log(`   - Oila kodeksi: ${results.family_code.articles.length} ta modda`);
if (results.land_code) console.log(`   - Yer kodeksi: ${results.land_code.articles.length} ta modda`);
