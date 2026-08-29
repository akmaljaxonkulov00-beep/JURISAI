/**
 * JURISTIV — src/data/full-legal-codes.json ni TO'G'RI manbadan qayta yaratish.
 *
 * Source: scripts/kodeks_json/*.json (foydalanuvchi yuklagan PDF'lardan
 * ekstrakt qilingan, 4397 modda). Statik fallback ma'lumot hech qachon
 * database'dan orqada qolmasligi uchun aynan shu manbadan tayyorlanadi.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, 'kodeks_json')
const outFile = path.join(__dirname, '..', 'src', 'data', 'full-legal-codes.json')

const NAMES = {
  constitution: "O'zbekiston Respublikasi Konstitutsiyasi",
  criminal_code: "O'zbekiston Respublikasi Jinoyat Kodeksi",
  criminal_procedure_code: "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi",
  civil_code: "O'zbekiston Respublikasi Fuqarolik Kodeksi (1-qism)",
  family_code: "O'zbekiston Respublikasi Oila Kodeksi",
  admin_code:
    "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
  tax_code: "O'zbekiston Respublikasi Soliq Kodeksi",
  labor_code: "O'zbekiston Respublikasi Mehnat Kodeksi",
}

const DESCRIPTIONS = {
  constitution: "O'zbekiston Respublikasi Konstitutsiyasi",
  criminal_code: "O'zbekiston Respublikasi Jinoyat Kodeksi",
  criminal_procedure_code: "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi",
  civil_code: "O'zbekiston Respublikasi Fuqarolik kodeksi (1-qism)",
  family_code: "O'zbekiston Respublikasi Oila Kodeksi",
  admin_code: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
  tax_code: "O'zbekiston Respublikasi Soliq kodeksi",
  labor_code: "O'zbekiston Respublikasi Mehnat Kodeksi",
}

const codes = []

for (const [codeId, name] of Object.entries(NAMES)) {
  const file = path.join(srcDir, `${codeId}.json`)
  if (!fs.existsSync(file)) {
    console.warn('MISSING SOURCE:', codeId)
    continue
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const articles = raw
    .map(a => ({
      number: String(a.article_number),
      title: a.title || '',
      content: a.content || '',
      category: a.chapter || 'Umumiy',
    }))
    // Numeric sort — hech qachon lexicographic bo'lmasligi uchun
    .sort((a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0))

  codes.push({
    id: codeId,
    name,
    shortName: name,
    description: DESCRIPTIONS[codeId] || name,
    totalArticles: articles.length,
    effectiveDate: '01.01.2024',
    articles,
  })
  console.log(`${codeId.padEnd(28)} ${articles.length} modda`)
}

fs.writeFileSync(outFile, JSON.stringify(codes, null, 2), 'utf8')
console.log(`\nYozildi: ${outFile} (${codes.length} kodeks, ${codes.reduce((s, c) => s + c.articles.length, 0)} modda)`)
