/**
 * JURISAI — Qonunlar bazasini to'liq import qilish (Supabase).
 *
 * 1. `articles` jadvalini tozalaydi (eski/noto'g'ri/aralash ma'lumotlar)
 * 2. scripts/kodeks_json/*.json fayllaridagi BARCHA moddalarni import qiladi
 * 3. Har bir modda o'z code_id ga bog'lanadi, duplikatlar olib tashlanadi,
 *    article_number_int (son tartibi) o'rnatiladi.
 *
 * Faqat SUPABASE_SERVICE_ROLE_KEY bilan ishlaydi (.env.local dan o'qiladi).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── .env.local dan sozlamalarni o'qish ──
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  const raw = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL yoki SERVICE_ROLE_KEY topilmadi (.env.local)')
  process.exit(1)
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
}

async function api(method, table, params = '', body = null, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    method,
    headers: { ...H, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${table}: ${res.status} ${text.slice(0, 300)}`)
  }
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function main() {
  // 1. Eski ma'lumotlarni tozalash
  console.log('1. articles tozalanmoqda...')
  await api(
    'DELETE',
    'articles',
    '?id=neq.00000000-0000-0000-0000-000000000000',
    null
  )

  // 2. JSON fayllarni yuklash + dedup
  const jsonDir = path.join(__dirname, 'kodeks_json')
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'))
  const seen = new Set()
  const rows = []

  for (const file of files.sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf8'))
    const arts = Array.isArray(data) ? data : data.articles || []
    let kept = 0
    for (const a of arts) {
      const codeId = a.code_id || file.replace('.json', '')
      const num = String(a.article_number || '').trim()
      if (!num) continue
      const key = codeId + '|' + num
      if (seen.has(key)) continue
      seen.add(key)
      const base = parseInt(String(num).split('-')[0], 10) || 0
      rows.push({
        code_id: codeId,
        article_number: num,
        article_number_int: Number.isFinite(a.article_number_int)
          ? a.article_number_int
          : base,
        title: (a.title || '').trim(),
        content: (a.content || '').trim(),
        chapter: a.chapter || '',
        section: a.section || '',
        penalties: a.penalties || '',
        cross_references: Array.isArray(a.cross_references)
          ? a.cross_references
          : [],
      })
      kept++
    }
    console.log(`   ${file}: ${kept} modda`)
  }

  console.log(`2. Jami import qilinadigan moddalar: ${rows.length}`)

  // 3. Batch insert (250/partiya)
  const BATCH = 250
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    await api(
      'POST',
      'articles',
      '?on_conflict=code_id,article_number',
      batch,
      { Prefer: 'resolution=merge-duplicates,return=minimal' }
    )
    inserted += batch.length
    if (inserted % 1000 < BATCH) console.log(`   ${inserted}/${rows.length} yuklandi`)
  }
  console.log(`3. Import tugadi: ${inserted} modda`)

  // 4. Tekshiruv: code bo'yicha hisob
  const check = await api('GET', 'articles?select=code_id&limit=50000')
  const byCode = {}
  for (const a of check) byCode[a.code_id] = (byCode[a.code_id] || 0) + 1
  console.log('4. Bazadagi moddalar (code bo\'yicha):', JSON.stringify(byCode))
  console.log('   JAMI:', check.length)
}

main().catch(e => {
  console.error('XATO:', e.message)
  process.exit(1)
})
