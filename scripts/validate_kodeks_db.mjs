/**
 * JURISAI — Source (scripts/kodeks_json) vs Supabase validation.
 *
 * Har bir kodeks uchun:
 *   SOURCE FILE, IMPORTED ARTICLES, DUPLICATES, MISSING, WRONG CODEX ARTICLES
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
const srcDir = path.join(__dirname, 'kodeks_json')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const PAGE = 1000

async function fetchAll(codeId) {
  const all = []
  let from = 0
  for (;;) {
    const r = await fetch(
      `${url}/rest/v1/articles?code_id=eq.${codeId}&select=*&order=article_number_int.asc.nullslast&offset=${from}&limit=${PAGE}`,
      { headers: { apikey: key, Authorization: 'Bearer ' + key } }
    )
    if (!r.ok) throw new Error(r.status + ' ' + (await r.text()).slice(0, 200))
    const data = await r.json()
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

const codes = [
  ['admin_code', 'Ma\'muriy javobgarlik kodeksi'],
  ['civil_code', 'Fuqarolik kodeksi'],
  ['constitution', 'Konstitutsiya'],
  ['criminal_code', 'Jinoyat kodeksi'],
  ['criminal_procedure_code', 'Jinoyat-protsessual kodeksi'],
  ['family_code', 'Oila kodeksi'],
  ['labor_code', 'Mehnat kodeksi'],
  ['tax_code', 'Soliq kodeksi'],
]

console.log('Kodeks'.padEnd(30), '| Source | DB | Missing | Extra(noto`g`ri) | Dupes | Gaps')
console.log('-'.repeat(100))

let totalSource = 0
let totalDb = 0

for (const [codeId, label] of codes) {
  const src = JSON.parse(fs.readFileSync(path.join(srcDir, `${codeId}.json`), 'utf8'))
  const srcNums = new Map(src.map(a => [String(a.article_number).trim(), a]))

  const db = await fetchAll(codeId)
  const dbNums = new Map(db.map(a => [String(a.article_number).trim(), a]))

  // Duplicates in DB (same article_number within code)
  const seen = new Set()
  let dupes = 0
  for (const a of db) {
    const n = String(a.article_number).trim()
    if (seen.has(n)) dupes++
    seen.add(n)
  }

  // Missing: in source but not in DB
  const missing = [...srcNums.keys()].filter(n => !dbNums.has(n)).map(Number).sort((a, b) => a - b)
  // Extra: in DB but not in source (wrong codex / unimported)
  const extra = [...dbNums.keys()].filter(n => !srcNums.has(n)).map(Number).sort((a, b) => a - b)

  // Gaps in source numbering (from min to max)
  const nums = [...srcNums.keys()].map(Number).filter(n => Number.isFinite(n)).sort((a, b) => a - b)
  const min = nums.length ? nums[0] : 0
  const max = nums.length ? nums[nums.length - 1] : 0
  const present = new Set(nums)
  const gaps = []
  for (let i = min; i <= max; i++) if (!present.has(i)) gaps.push(i)

  totalSource += src.length
  totalDb += db.length

  console.log(
    label.padEnd(30),
    '|', String(src.length).padStart(5),
    '|', String(db.length).padStart(4),
    '|', String(missing.length).padStart(4),
    '|', String(extra.length).padStart(8),
    '|', String(dupes).padStart(3),
    '|', gaps.length ? gaps.slice(0, 12).join(',') + (gaps.length > 12 ? '...' : '') : '—'
  )

  if (missing.length) console.log('    YETISHMAYOTGAN (source da bor, DB da yo\'q):', missing.slice(0, 30).join(', '))
  if (extra.length) console.log('    EXTRA / NOTO\'G\'RI (DB da bor, source da yo\'q):', extra.slice(0, 30).join(', '))
}

console.log('-'.repeat(100))
console.log('JAMI: source =', totalSource, '| DB =', totalDb)
