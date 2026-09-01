const fs = require('fs');
const path = require('path');

const files = [
  'src/lib/i18n/uz.ts',
  'src/lib/i18n/en.ts',
  'src/lib/i18n/ru.ts',
];

files.forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  let c = fs.readFileSync(fullPath, 'utf8');
  const lines = c.split('\n');
  let fixed = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Match lines like:   keyName: 'value with apostrophe',
    const m = l.match(/^(\s+\w+:\s*)'([^']*(?:'[^']*)*)',?\s*$/);
    if (m && m[2].includes("'")) {
      // Has unescaped apostrophes inside single quotes — switch to double quotes
      const val = m[2];
      lines[i] = l.replace(m[0], m[1] + '"' + val + '",');
      fixed++;
    }
  }
  
  if (fixed > 0) {
    fs.writeFileSync(fullPath, lines.join('\n'));
    console.log(path.basename(f) + ': fixed ' + fixed + ' lines');
  } else {
    console.log(path.basename(f) + ': no issues');
  }
});
