/**
 * JURISAI — Fuqarolik kodeksi bob nomlarini to'ldirish.
 *
 * Muammo: civil part1 faylida bob sarlavhalari ikki qatorda ("1-BOB." keyin
 * "FUQAROLIK QONUNCHILIGI") — avvalgi parser faqat birinchi qatorni olgan,
 * shuning uchun DB'da "1-bob." bo'lib qolgan. Bu skript modda raqamini
 * bobga moslab, to'liq nomni Supabase'ga yozadi.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const TEXT_DIR = path.join(__dirname, 'kodeks_text')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const BOB_RE = /^(\d+|[IVXL]+)\s*[-.\u00a0]?\s*bob[.\u00a0]?\s*(.*)$/i
const MODDA_RE = /^(\d+)\s*[-.\u00a0]?\s*modda[.\u00a0]?\s*(.*)$/i
const ANNOT_RE = /^\(\s*\d+\s*[-.\u00a0]?\s*bob/i

function parseChapters(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const lines = text.split(/\r?\n/)
  const articleToChapter = new Map()
  let currentChapter = ''
  let pendingTitle = null // two-line format: "1-BOB." then title on next line

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const stripped = raw.trim()

    // Two-line format: current line was "N-BOB." and this is the title line
    if (pendingTitle && stripped && !ANNOT_RE.test(stripped)) {
      // Skip annotation lines about previous edits
      const title = stripped.replace(/\s*$/, '')
      currentChapter = `${pendingTitle} ${title}`.trim()
      pendingTitle = null
      continue
    }

    const mBob = BOB_RE.exec(stripped)
    if (mBob) {
      const num = mBob[1]
      const title = (mBob[2] || '').trim()
      if (title) {
        currentChapter = `${num}-bob. ${title}`.trim()
      } else {
        pendingTitle = `${num}-bob.`
      }
      continue
    }

    const mModda = MODDA_RE.exec(stripped)
    if (mModda) {
      articleToChapter.set(mModda[1], currentChapter)
      pendingTitle = null
      continue
    }

    // Any other line between BOB and title breaks two-line format
    if (pendingTitle && stripped) {
      pendingTitle = null
    }
  }
  return articleToChapter
}

const map1 = parseChapters(path.join(TEXT_DIR, 'civil_code_part1.txt'))
const map2 = parseChapters(path.join(TEXT_DIR, 'civil_code_part2.txt'))
const articleToChapter = new Map([...map1, ...map2])

console.log('Parsed chapters (part1+part2):', new Set(articleToChapter.values()).size)
console.log('Articles mapped:', articleToChapter.size)

// Fetch civil articles from DB (paginated)
async function fetchCivil() {
  const all = []
  let from = 0
  const PAGE = 1000
  for (;;) {
    const r = await fetch(
      `${url}/rest/v1/articles?code_id=eq.civil_code&select=id,article_number,chapter&order=article_number_int.asc.nullslast&offset=${from}&limit=${PAGE}`,
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

const articles = await fetchCivil()
console.log('DB civil articles:', articles.length)

// Build updates: article_number -> full chapter
const updates = []
let skipped = 0
for (const a of articles) {
  const full = articleToChapter.get(String(a.article_number)) || ''
  const current = (a.chapter || '').trim()
  if (!full) {
    skipped++
    continue
  }
  if (current !== full) {
    updates.push({ id: a.id, number: a.article_number, old: current.slice(0, 40), next: full.slice(0, 60) })
  }
}

console.log('Articles needing chapter update:', updates.length)
console.log('Articles without parsed chapter (kept as-is):', skipped)
updates.slice(0, 12).forEach(u => console.log('  ', u.number, '|', u.old, '→', u.next))

// Apply updates with bounded concurrency (network tezligi uchun)
let done = 0
const CONCURRENCY = 30
for (let i = 0; i < updates.length; i += CONCURRENCY) {
  const batch = updates.slice(i, i + CONCURRENCY)
  await Promise.all(
    batch.map(async u => {
      const r = await fetch(`${url}/rest/v1/articles?id=eq.${u.id}`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ chapter: u.next }),
      })
      if (!r.ok && r.status !== 204) {
        console.error('PATCH failed for', u.number, r.status, (await r.text()).slice(0, 100))
      }
    })
  )
  done += batch.length
  console.log(`Applied ${done}/${updates.length}`)
}

// Summary
const finalChapters = new Set()
for (const a of await fetchCivil()) {
  finalChapters.add((a.chapter || '').trim())
}
const shortChapters = [...finalChapters].filter(c => /^\d+-bob\.$/.test(c))
console.log('\n=== NATIJA ===')
console.log('Jami boblar:', finalChapters.size, '| qisqa (raqam-only) qolgan:', shortChapters.length, shortChapters.slice(0, 10))
