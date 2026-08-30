const fs = require('fs');
const path = require('path');

function addImportAndComponent(filePath, componentJSX) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (c.includes('FeatureInstructions')) {
    console.log(filePath + ': already has FeatureInstructions');
    return;
  }

  // Find the last import line
  const lines = c.split('\n');
  let lastImportIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('import ') || t.endsWith("from 'lucide-react'") || t.endsWith('from "lucide-react"') || t.includes("from '@/")) {
      lastImportIdx = i;
    }
  }

  // Add FeatureInstructions import after last import
  lines.splice(lastImportIdx + 1, 0, "import FeatureInstructions from '@/components/ui/FeatureInstructions'");
  c = lines.join('\n');

  // Find 'Orqaga' marker and insert component after </button>
  const idx = c.indexOf('Orqaga');
  if (idx > 0) {
    const btnEnd = c.indexOf('</button>', idx);
    if (btnEnd > 0) {
      const insertPos = btnEnd + '</button>'.length;
      c = c.slice(0, insertPos) + componentJSX + c.slice(insertPos);
    }
  }

  fs.writeFileSync(filePath, c, 'utf8');
  console.log(filePath + ': DONE');
}

// Virtual Court
addImportAndComponent(
  'src/app/virtual-court/page.tsx',
  `
            <FeatureInstructions
              featureName="Virtual Sud"
              steps={[
                { title: 'Ishni tanlang', description: "Tayyor ish shablonlaridan birini tanlang yoki o'zingizning ishingizni kiriting.", icon: '📋' },
                { title: 'Rolni tanlang', description: "Sudya, prokuror, advokat yoki sudlanuvchi rolini tanlang. Siz tanlagan roldan foydalaning.", icon: '👤' },
                { title: "Ovoz bilan gapiring", description: "Mikrofon tugmasini bosib ovozli gapiring. AI barcha rollar nomidan javob beradi.", icon: '🎙️' },
                { title: 'Hukm chiqaring', description: "Sud jarayoni tugagach, hukm chiqaring yoki AI tomonidan baholashni so'ring.", icon: '⚖️' },
              ]}
              tips={["Har bir foydalanuvchi o'z roli bilan gaplashadi", "AI boshqa rollar nomidan real javob beradi", "Sessiya tugagach ball va tahlil olishingiz mumkin"]}
            />`
);
