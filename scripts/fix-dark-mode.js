#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISAI — Global Dark Mode Batch Fixer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Batch-fixes common light-mode Tailwind utility classes by adding
 * dark: variants. This handles 90% of the work. The remaining 10%
 * of edge cases need manual review.
 *
 * USAGE: node scripts/fix-dark-mode.js
 *
 * SAFE TO RUN MULTIPLE TIMES — idempotent (won't double-add dark: classes)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Files to scan (page.tsx and component .tsx files) ───────────────────
const TARGET_DIRS = [
  path.join(__dirname, '..', 'src', 'app'),
  path.join(__dirname, '..', 'src', 'components'),
];

// ── Replacement rules ───────────────────────────────────────────────────
// Order matters: more specific patterns first, general patterns last
const REPLACEMENTS = [
  // bg-white without dark variant → add dark:bg-zinc-900
  { search: /(?<![-\w])bg-white(?!\s*(?:dark:|\\|\/|$|[;,>)\]}=]))(?!\s*\/)/g, replace: 'bg-white dark:bg-zinc-900' },

  // text-gray-900 → text-gray-900 dark:text-zinc-100
  { search: /text-gray-900(?!\s*dark:)/g, replace: 'text-gray-900 dark:text-zinc-100' },

  // text-gray-800 → text-gray-800 dark:text-zinc-200
  { search: /text-gray-800(?!\s*dark:)/g, replace: 'text-gray-800 dark:text-zinc-200' },

  // text-gray-700 → text-gray-700 dark:text-zinc-300
  { search: /text-gray-700(?!\s*dark:)/g, replace: 'text-gray-700 dark:text-zinc-300' },

  // text-gray-600 → text-gray-600 dark:text-zinc-400
  { search: /text-gray-600(?!\s*dark:)/g, replace: 'text-gray-600 dark:text-zinc-400' },

  // text-gray-500 → text-gray-500 dark:text-zinc-500
  { search: /text-gray-500(?!\s*dark:)/g, replace: 'text-gray-500 dark:text-zinc-500' },

  // border-gray-200 → border-gray-200 dark:border-zinc-800
  { search: /border-gray-200(?!\s*dark:)/g, replace: 'border-gray-200 dark:border-zinc-800' },

  // border-gray-100 → border-gray-100 dark:border-zinc-800
  { search: /border-gray-100(?!\s*dark:)/g, replace: 'border-gray-100 dark:border-zinc-800' },

  // border-gray-300 → border-gray-300 dark:border-zinc-700
  { search: /border-gray-300(?!\s*dark:)/g, replace: 'border-gray-300 dark:border-zinc-700' },

  // bg-gray-50 → bg-gray-50 dark:bg-zinc-800/50
  { search: /bg-gray-50(?!\s*dark:)/g, replace: 'bg-gray-50 dark:bg-zinc-800/50' },

  // bg-gray-100 → bg-gray-100 dark:bg-zinc-800/30
  { search: /(?<!dark:)bg-gray-100(?!\s*dark:)/g, replace: 'bg-gray-100 dark:bg-zinc-800/30' },

  // bg-blue-50 → bg-blue-50 dark:bg-blue-900/20
  { search: /bg-blue-50(?!\s*dark:)/g, replace: 'bg-blue-50 dark:bg-blue-900/20' },

  // bg-green-50 → bg-green-50 dark:bg-green-900/20
  { search: /bg-green-50(?!\s*dark:)/g, replace: 'bg-green-50 dark:bg-green-900/20' },

  // bg-red-50 → bg-red-50 dark:bg-red-900/20
  { search: /bg-red-50(?!\s*dark:)/g, replace: 'bg-red-50 dark:bg-red-900/20' },

  // bg-yellow-50 → bg-yellow-50 dark:bg-yellow-900/20
  { search: /bg-yellow-50(?!\s*dark:)/g, replace: 'bg-yellow-50 dark:bg-yellow-900/20' },

  // bg-amber-50 → bg-amber-50 dark:bg-amber-900/20
  { search: /bg-amber-50(?!\s*dark:)/g, replace: 'bg-amber-50 dark:bg-amber-900/20' },

  // bg-purple-50 → bg-purple-50 dark:bg-purple-900/20
  { search: /bg-purple-50(?!\s*dark:)/g, replace: 'bg-purple-50 dark:bg-purple-900/20' },

  // bg-indigo-50 → bg-indigo-50 dark:bg-indigo-900/20
  { search: /bg-indigo-50(?!\s*dark:)/g, replace: 'bg-indigo-50 dark:bg-indigo-900/20' },

  // bg-white/80 → bg-white/80 dark:bg-zinc-900/80
  { search: /bg-white\/80(?!\s*dark:)/g, replace: 'bg-white/80 dark:bg-zinc-900/80' },

  // hover:bg-gray-50 → hover:bg-gray-50 dark:hover:bg-zinc-800/50
  { search: /hover:bg-gray-50(?!\s*dark:)/g, replace: 'hover:bg-gray-50 dark:hover:bg-zinc-800/50' },

  // hover:bg-gray-100 → hover:bg-gray-100 dark:hover:bg-zinc-800/30
  { search: /hover:bg-gray-100(?!\s*dark:)/g, replace: 'hover:bg-gray-100 dark:hover:bg-zinc-800/30' },

  // hover:text-gray-900 → hover:text-gray-900 dark:hover:text-zinc-100
  { search: /hover:text-gray-900(?!\s*dark:)/g, replace: 'hover:text-gray-900 dark:hover:text-zinc-100' },

  // hover:text-blue-600 → hover:text-blue-600 dark:hover:text-blue-400
  { search: /hover:text-blue-600(?!\s*dark:)/g, replace: 'hover:text-blue-600 dark:hover:text-blue-400' },

  // hover:border-gray-300 → hover:border-gray-300 dark:hover:border-zinc-700
  { search: /hover:border-gray-300(?!\s*dark:)/g, replace: 'hover:border-gray-300 dark:hover:border-zinc-700' },

  // ── Additional edge case patterns ──

  // divide-gray-200 → divide-gray-200 dark:divide-zinc-800
  { search: /divide-gray-200(?!\s*dark:)/g, replace: 'divide-gray-200 dark:divide-zinc-800' },

  // text-gray-400 → text-gray-400 dark:text-zinc-500
  { search: /text-gray-400(?!\s*dark:)/g, replace: 'text-gray-400 dark:text-zinc-500' },

  // placeholder-gray-400 → placeholder-gray-400 dark:placeholder-zinc-500
  { search: /placeholder-gray-400(?!\s*dark:)/g, replace: 'placeholder-gray-400 dark:placeholder-zinc-500' },

  // ring-gray-200 → ring-gray-200 dark:ring-zinc-800
  { search: /ring-gray-200(?!\s*dark:)/g, replace: 'ring-gray-200 dark:ring-zinc-800' },

  // ring-gray-300 → ring-gray-300 dark:ring-zinc-700
  { search: /ring-gray-300(?!\s*dark:)/g, replace: 'ring-gray-300 dark:ring-zinc-700' },

  // bg-slate-50 → bg-slate-50 dark:bg-zinc-900
  { search: /bg-slate-50(?!\s*dark:)/g, replace: 'bg-slate-50 dark:bg-zinc-900' },

  // text-slate-900 → text-slate-900 dark:text-zinc-100
  { search: /text-slate-900(?!\s*dark:)/g, replace: 'text-slate-900 dark:text-zinc-100' },

  // bg-slate-100 → bg-slate-100 dark:bg-zinc-800/30
  { search: /bg-slate-100(?!\s*dark:)/g, replace: 'bg-slate-100 dark:bg-zinc-800/30' },

  // border-slate-200 → border-slate-200 dark:border-zinc-800
  { search: /border-slate-200(?!\s*dark:)/g, replace: 'border-slate-200 dark:border-zinc-800' },

  // text-slate-600 → text-slate-600 dark:text-zinc-400
  { search: /text-slate-600(?!\s*dark:)/g, replace: 'text-slate-600 dark:text-zinc-400' },
];

// ── Files to SKIP (already handled or special cases) ────────────────────
const SKIP_FILES = [
  'node_modules',
  '.next',
  'signin/page.tsx',  // already premium dark
  'layout.tsx',       // uses CSS vars
  'providers.tsx',    // context provider
  'globals.css',      // CSS file
  'page-old.tsx',     // old unused files
  'page-real.tsx',    // old unused files  
  'api-kerak-bolmagan', // unused
];

function shouldSkip(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

// ── Main ────────────────────────────────────────────────────────────────
function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  JURISAI — Global Dark Mode Batch Fixer');
  console.log('══════════════════════════════════════════════════════════\n');

  let totalFiles = 0;
  let totalChanges = 0;
  let skippedFiles = 0;

  for (const dir of TARGET_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir, { recursive: true })
      .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
      .map(f => path.join(dir, f));

    for (const filePath of files) {
      if (shouldSkip(filePath)) {
        skippedFiles++;
        continue;
      }

      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let fileChanged = false;

        for (const rule of REPLACEMENTS) {
          const newContent = content.replace(rule.search, rule.replace);
          if (newContent !== content) {
            const changes = countOccurrences(content, rule.search);
            totalChanges += changes;
            content = newContent;
            fileChanged = true;
          }
        }

        if (fileChanged) {
          fs.writeFileSync(filePath, content, 'utf8');
          totalFiles++;
        }
      } catch (e) {
        console.log(`  ⚠️  Error processing ${path.basename(filePath)}: ${e.message}`);
      }
    }
  }

  console.log(`  ✅ ${totalFiles} files modified`);
  console.log(`  📊 ${totalChanges} total replacements`);
  console.log(`  ⏭️  ${skippedFiles} files skipped\n`);

  if (totalFiles > 0) {
    console.log('  ⚠️  Some edge cases may need manual review:');
    console.log('  - Classes inside template literals (${...})');
    console.log('  - Classes with important (!) modifiers');
    console.log('  - Inline styles (style={{}})');
    console.log('  - CSS-in-JS patterns\n');
  }

  console.log('  💡 Run build test: npm run build\n');
}

function countOccurrences(str, regex) {
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}

main();
