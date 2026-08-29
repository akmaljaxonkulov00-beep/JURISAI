import { createClient } from '@supabase/supabase-js'

/**
 * legal-rag.ts — AI yordamchi uchun "bazadan ma'lumot olish" (Retrieval-Augmented
 * Generation) mexanizmi.
 *
 * AI hech qachon modda raqami yoki norma to'qimasligi uchun foydalanuvchi savoliga
 * eng mos keladigan moddalar O'zbekiston qonunchiligi bazasidan (Supabase `articles`
 * jadvalidan) qidirilib, ularning TO'LIQ matni AI promptiga kontekst sifatida
 * beriladi. AI javobi faqat shu haqiqiy manbalarga asoslanadi.
 */

export interface RAGArticle {
  code_id: string
  code_name: string
  article_number: string
  title: string
  content: string
  chapter: string
  penalties: string
}

/** Supabase jadval satrlari (any o'rniga) */
interface RagRow {
  id?: string
  code_id?: string
  article_number?: string
  title?: string
  content?: string
  chapter?: string
  penalties?: string
  name?: string
}

const CATEGORY_DISPLAY: Record<string, string> = {
  constitution: "O'zbekiston Respublikasi Konstitutsiyasi",
  criminal_code: "O'zbekiston Respublikasi Jinoyat Kodeksi",
  criminal_procedure_code: "O'zbekiston Respublikasi Jinoyat-protsessual Kodeksi",
  civil_code: "O'zbekiston Respublikasi Fuqarolik Kodeksi",
  civil_procedure_code: "O'zbekiston Respublikasi Fuqarolik protsessual Kodeksi",
  labor_code: "O'zbekiston Respublikasi Mehnat Kodeksi",
  tax_code: "O'zbekiston Respublikasi Soliq Kodeksi",
  family_code: "O'zbekiston Respublikasi Oila Kodeksi",
  administrative_code: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
  admin_code: "O'zbekiston Respublikasi Ma'muriy javobgarlik to'g'risidagi Kodeksi",
}

function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('your-supabase-url')) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** O'zbekcha apostrof variantlari (' , ‘ , ’ , ʻ) */
const APOSTROPHES = /['‘’ʻ`]/g

/** Savoldan mazmunli kalit so'zlarni ajratib oladi (uzun va ahamiyatsiz so'zlar tashlanadi). */
function extractKeywords(message: string): string[] {
  const stopwords = new Set([
    'qanday',
    'qanaqa',
    'nima',
    'uchun',
    'bilan',
    'haqida',
    "bo'yicha",
    'bo‘yicha',
    'kerak',
    'mumkin',
    'emas',
    'sizga',
    'meni',
    'menga',
    'savol',
    'bor',
    'yoq',
    'bering',
    'ayting',
    'tushuntir',
    'tushuntiring',
    'yordam',
    'bering',
    'holat',
    'holatda',
    "bo'lsa",
    'bo‘lsa',
    'agar',
    'keyin',
    "so'ng",
    'so‘ng',
    'ham',
    'modda',
    'moddasi',
    'qonun',
    'qonuni',
    'kodeks',
    'kodeksi',
    'respublika',
    "o'zbekiston",
    'o‘zbekiston',
    "bo'yicha",
    'bo‘yicha',
  ])
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'‘’ʻ`]/gu, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.replace(APOSTROPHES, '').length >= 4 && !stopwords.has(w))
    .slice(0, 8)
}

/**
 * Kalit so'zni ILIKE pattern'lariga aylantiradi:
 *  - apostrofsiz ko'rinish (masalan 'ogirlik')
 *  - apostrof o'rniga '%' (keng joker) — baza kollatsiyasi apostroflarni
 *    e'tiborsiz qoldirishi mumkin, shuning uchun '%' bilan 'o‘g‘irlik' kabi
 *    variantlarga ham mos tushadi. Oqibatida kengroq natijalar qaytadi, ammo
 *    reyting (rank) eng mos moddani birinchi qo'yadi.
 */
function keywordPatterns(word: string): string[] {
  const patterns = new Set<string>()
  const stripped = word.replace(APOSTROPHES, '')
  if (stripped.length >= 4) patterns.add(stripped)
  const loose = word.replace(APOSTROPHES, '%')
  if (loose.includes('%')) patterns.add(loose)
  return [...patterns]
}

/** O'zbekcha so'z qo'shimchalari — fe'l va otlarni o'zakka keltirish uchun */
const SUFFIXES = [
  'ganlar',
  'dilar',
  'gani',
  'gan',
  'moqda',
  'moqchi',
  'moq',
  'ishlar',
  'ish',
  'ib',
  'di',
  'lar',
  'larni',
  'ni',
  'ning',
  'dan',
  'da',
  'ga',
  'lik',
  'ligi',
  'lash',
  'ladi',
  'lagan',
  'la',
]

function commonPrefixLen(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** So'zni o'zakka keltiradi (kamida 2 daraja qo'shimcha olib tashlaydi). */
function rootWord(word: string): string {
  let w = word
  for (let i = 0; i < 2; i++) {
    let stripped = false
    for (const s of SUFFIXES) {
      if (w.length - s.length >= 3 && w.endsWith(s)) {
        w = w.slice(0, -s.length)
        stripped = true
        break
      }
    }
    if (!stripped) break
  }
  return w
}

/** Levenshtein masofa — 'taqili' ~ 'ta‘til' kabi yozuv xatolariga chidamli moslik */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[n]
}

/**
 * So'z va kalit so'z o'rtasida ishonchli o'xshashlik bormi? (kanonik shaklda —
 * apostroflar saqlanadi: 'o'g'ir' (o'g'irlik) va 'og'ir' (og'ir shikast) farqlanadi)
 *  - 1 ta xato: ishonchli moslik
 *  - 2 ta xato: umumiy 2-belgili prefiks talab
 */
function fuzzyMatch(word: string, keyword: string): boolean {
  const maxDist = keyword.length >= 6 ? 2 : 1
  if (Math.abs(word.length - keyword.length) > maxDist) return false
  const d = levenshtein(word, keyword)
  if (d > maxDist) return false
  if (d <= 1) return true
  // 2 xatolik holatida: 3-belgili umumiy prefiks bo'lishi kerak
  // (2-belgili prefiks 'o'' bilan boshlanadigan so'zlarni adashtiradi:
  //  'o'ldir' ~ 'o'g'ir', 'og'ir' ~ 'o'g'ir' kabi)
  if (word.startsWith(keyword.slice(0, 3)) || keyword.startsWith(word.slice(0, 3))) return true
  return false
}

/** Sarlavha/full row bo'yicha reyting balli. Uzun (aniq) so'z ko'proq og'irlik oladi; eng uzun kalit so'z mos tushsa qo'shimcha bonus. */
function scoreRow(
  row: RagRow,
  keywords: string[],
  numMatch: RegExpMatchArray | null,
  selected?: string[]
): { score: number; matched: number; maxWordLen: number } {
  const lowerTitle = (row.title || '').toLowerCase()
  const strippedTitle = lowerTitle.replace(APOSTROPHES, '')
  const canonTitle = lowerTitle.replace(APOSTROPHES, "'")
  const strippedContent = (row.content || '').toLowerCase().replace(APOSTROPHES, '')
  const titleWords = new Set<string>(canonTitle.split(/\s+/).filter(Boolean) as string[])
  let score = 0
  let matched = 0
  let maxWordLen = 0
  // Aniq modda raqami — eng yuqori ustunlik; mazmunli sarlavhali yozuvlar ustunroq
  if (
    numMatch &&
    String(row.article_number || '').replace(/^0+/, '') === numMatch[1].replace(/^0+/, '')
  ) {
    score += 100 + Math.min((lowerTitle || '').length / 40, 5)
    // Faqat raqam bilan so'ralganda eng ko'p havola qilinadigan kodekslar ustunroq
    const codePriority: Record<string, number> = {
      criminal_code: 4,
      constitution: 2,
      civil_code: 1,
    }
    score += codePriority[row.code_id || ''] || 0
  } else if (numMatch && String(row.article_number || '').startsWith(numMatch[1])) {
    score += 30
  }
  const longest = Math.max(0, ...keywords.map(w => w.length))
  const rootCache = new Map<string, string>()
  const rootOf = (word: string) => {
    if (!rootCache.has(word)) rootCache.set(word, rootWord(word))
    return rootCache.get(word)!
  }
  const selectedSet = selected ? new Set(selected) : null
  let longestMatched = false
  let longestHitTitle = false
  for (const w of keywords) {
    if (!w) continue
    const stripped = w.replace(APOSTROPHES, '')
    const canon = w.replace(APOSTROPHES, "'")
    // Kam uchraydigan (aniq) so'zlar yuqoriroq og'irlik oladi
    let weight = 2 + Math.min(w.length, 6)
    if (selectedSet && selectedSet.has(w)) weight *= 1.6
    else if (selectedSet) weight *= 0.4
    let hit = false
    let hitTitle = false
    if (strippedTitle.includes(stripped)) {
      score += weight * 3
      hit = true
      hitTitle = true
    } else if (strippedContent.includes(stripped)) {
      score += weight
      hit = true
    }
    if (!hit) {
      // Kanonik (apostrof saqlangan) xatoga chidamli moslik
      for (const tw of titleWords) {
        if (fuzzyMatch(tw, canon)) {
          score += weight * 2
          hit = true
          hitTitle = true
          break
        }
      }
    }
    if (!hit) {
      // O'zak (stem) mosligi: 'o'g'irladi' ~ sarlavhadagi 'o'g'irlik' kabi.
      // 'og'ir' (og'ir shikast) ~ 'o'g'ir' (o'g'irlik) bir-biriga juda yaqin —
      // yolg'on moslikni oldini olish uchun o'zaklar kamida 2 belgidan iborat
      // umumiy prefiksga ega bo'lishi shart.
      const kwRoot = rootOf(canon)
      if (kwRoot.length >= 4) {
        for (const tw of titleWords) {
          const twRoot = rootOf(tw)
          if (twRoot === kwRoot) {
            score += weight * 3
            hit = true
            hitTitle = true
            break
          }
          if (fuzzyMatch(twRoot, kwRoot) && commonPrefixLen(twRoot, kwRoot) >= 2) {
            score += weight * 2
            hit = true
            hitTitle = true
            break
          }
        }
      }
    }
    if (!hit) {
      // Apostrofsiz (stripped) o'zak mosligi — 'taqili' ~ 'ta'tili' kabi
      // imlo xatolari uchun. BIR XIL bo'lgan stripped o'zaklar (d=0) qabul
      // qilinmaydi — aks holda 'og'ir' (og'ir shikast) yana o'g'irlik bilan
      // adashib qoladi.
      const kwStrippedRoot = rootOf(stripped)
      if (kwStrippedRoot.length >= 4) {
        for (const tw of titleWords) {
          const twStrippedRoot = rootOf(tw.replace(APOSTROPHES, ''))
          const d = levenshtein(twStrippedRoot, kwStrippedRoot)
          const maxDist = kwStrippedRoot.length >= 6 ? 2 : 1
          if (d >= 1 && d <= maxDist && commonPrefixLen(twStrippedRoot, kwStrippedRoot) >= 2) {
            score += weight * 2
            hit = true
            hitTitle = true
            break
          }
        }
      }
    }
    if (hit) {
      matched++
      maxWordLen = Math.max(maxWordLen, w.length)
      if (w.length === longest) {
        longestMatched = true
        if (hitTitle) longestHitTitle = true
      }
    }
  }
  // Eng uzun (eng aniq) kalit so'z mos tushsa — boshqa kodeksdagi keng so'zlar ustidan ustunlik
  if (longestMatched) score += 2 + Math.min(longest, 6) * 2
  // Eng uzun kalit so'z SARLAVHADA (matnda emas) topilsa — aniq modda ekanligi belgisi
  if (longestHitTitle) score += 10
  return { score, matched, maxWordLen }
}

/**
 * Bazadan foydalanuvchi savoliga eng mos moddalarni qidiradi.
 *
 * Uch bosqich:
 *  1. "N-modda" ko'rinishidagi aniq raqamli so'rov
 *  2. Kalit so'zlar bo'yicha ILIKE (title+content) — apostrof variantsiz oddiy so'zlar uchun
 *  3. Barcha sarlavhalarni JS tomonda Levenshtein bilan skanerlash — baza
 *     kollatsiyasi apostroflarni e'tiborsiz qoldirgani ("O‘g‘rilik" ~ "o'g'irlik")
 *     va foydalanuvchi yozuv xatolari uchun ishonchli natija beradi.
 */
export async function retrieveLegalArticles(message: string, limit = 6): Promise<RAGArticle[]> {
  try {
    const supabase = makeSupabase()
    if (!supabase) return []

    // Kodeks nomlari xaritasi (iqtibos uchun)
    let codeNames = new Map<string, string>()
    try {
      const { data: cats } = await supabase.from('categories').select('code_id, name')
      if (cats && cats.length > 0) {
        codeNames = new Map(cats.map((c: RagRow) => [c.code_id || '', c.name || '']))
      }
    } catch {
      // categories bo'lmasa display map ishlatiladi
    }

    const numMatch = message.match(/(\d{1,4})\s*[-–—]?\s*modda/i)
    // Kalit so'zlar apostroflari SAQLANGAN holda (kanonik o'zak solishtirish uchun)
    const rawKeywords = extractKeywords(message)
    const keywordWords = rawKeywords.map(w => w.replace(APOSTROPHES, ''))

    const candidateIds = new Set<string>()
    const add = (rows: RagRow[]) => {
      for (const r of rows || []) {
        if (r && r.id && !candidateIds.has(r.id)) candidateIds.add(r.id)
      }
    }

    // 1) Aniq raqamli so'rov
    if (numMatch) {
      const n = numMatch[1]
      const { data } = await supabase
        .from('articles')
        .select('id')
        .or(`article_number.ilike.${n}%,title.ilike.%${n}%`)
        .limit(60)
      add(data || [])
    }

    // 2) ILIKE kalit so'z qidiruvi (title+content) — apostrofsiz oddiy so'zlar uchun
    if (keywordWords.length > 0) {
      const patterns = keywordWords
        .flatMap(w => {
          const base = keywordPatterns(w)
          const root = rootWord(w)
          if (root.length >= 4 && root !== w) base.push(root)
          return base
        })
        .slice(0, 8)
      for (const p of patterns) {
        try {
          const { data } = await supabase
            .from('articles')
            .select('id')
            .or(`title.ilike.%${p}%,content.ilike.%${p}%`)
            .limit(150)
          add(data || [])
        } catch {
          // Bitta pattern xato bersa davom etamiz
        }
        if (candidateIds.size >= 400) break
      }
    }

    // 3) Sarlavha skaneri (Levenshtein) — apostrof/xatolarga chidamli.
    //    Baza kollatsiyasi apostroflarni e'tiborsiz qoldirgani uchun ILIKE
    //    'o\'g\'irlik' kabi so'zlarni topolmaydi — shuning uchun bu bosqich
    //    har doim bajariladi.
    let selectedKeywords: string[] | undefined
    const fuzzyIds: string[] = []
    if (keywordWords.length > 0) {
      const titles: RagRow[] = []
      const PAGE = 1000
      for (let from = 0; ; from += PAGE) {
        const { data } = await supabase
          .from('articles')
          .select('id, code_id, article_number, title')
          .range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        titles.push(...data)
        if (data.length < PAGE) break
      }

      // Eng aniq (kam uchraydigan) kalit so'zlarni tanlash — keng so'zlar
      // (masalan 'fuqaro', 'jinoyat', 'jazo') aniqlikni buzmasligi uchun.
      const df = new Map<string, number>()
      for (const w of rawKeywords) {
        const root = rootWord(w.replace(APOSTROPHES, "'"))
        let c = 0
        for (const row of titles) {
          const t = (row.title || '').toLowerCase().replace(APOSTROPHES, "'")
          if (t.includes(w.replace(APOSTROPHES, "'"))) {
            c++
            continue
          }
          for (const tw of t.split(/\s+/)) {
            const tr = rootWord(tw)
            if (tr === root || tr.includes(root) || root.includes(tr)) {
              c++
              break
            }
          }
        }
        df.set(w, c)
      }
      const sorted = [...rawKeywords].sort((a, b) => (df.get(a) || 0) - (df.get(b) || 0))
      // Faqat biron sarlavhada uchraydigan (df > 0) eng aniq so'zlar tanlanadi —
      // hech qaysi sarlavhada bo'lmagan so'zlar (masalan 'supermarketda') shovqin
      // keltiradi va tanlanmaydi.
      const withHits = sorted.filter(w => (df.get(w) || 0) > 0)
      selectedKeywords = withHits.slice(0, 3)

      const scored = titles
        .map((row: RagRow) => ({
          row,
          s: scoreRow(row, rawKeywords, null, selectedKeywords).score,
        }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 40)
      for (const x of scored) {
        if (x.row.id && !candidateIds.has(x.row.id)) {
          candidateIds.add(x.row.id)
          fuzzyIds.push(x.row.id)
        }
      }
    }

    if (candidateIds.size === 0) {
      // Bo'sh javobdan yaxshiroq — dastlabki moddalar
      const { data } = await supabase
        .from('articles')
        .select('*')
        .order('article_number_int', { ascending: true, nullsFirst: false })
        .limit(limit)
      return mapRows(data || [], codeNames)
    }

    // Tanlangan nomzodlarning to'liq matnini yuklash.
    // ILIKE topolmaydigan (apostrof/xatolik) nomzodlar birinchi navbatda yuklanadi.
    const otherIds = [...candidateIds].filter(id => !fuzzyIds.includes(id))
    const ids = [...fuzzyIds, ...otherIds].slice(0, 150)
    const { data: full } = await supabase.from('articles').select('*').in('id', ids)
    if (!full || full.length === 0) return []

    // To'liq matn bilan reyting
    const ranked = (full as RagRow[])
      .map((row: RagRow) => ({
        row,
        ...scoreRow(row, rawKeywords, numMatch, selectedKeywords),
      }))
      .filter(r => r.score > 0 || full.length <= limit)
      .sort((a, b) => b.score - a.score || b.maxWordLen - a.maxWordLen || b.matched - a.matched)
      .slice(0, limit)
      .map(r => r.row)

    return mapRows(ranked, codeNames)
  } catch (error) {
    console.error('[legal-rag] retrieve error:', error)
    return []
  }
}

function mapRows(rows: RagRow[], codeNames: Map<string, string>): RAGArticle[] {
  const results = rows.map((row: RagRow) => {
    const codeId = row.code_id || ''
    const codeName = codeNames.get(codeId) || CATEGORY_DISPLAY[codeId] || codeId
    return {
      code_id: row.code_id || '',
      code_name: codeName,
      article_number: row.article_number || '',
      title: row.title || '',
      content: row.content || '',
      chapter: row.chapter || '',
      penalties: row.penalties || '',
    } satisfies RAGArticle
  })
  // Dublikatlarni olib tashlash
  const seen = new Set<string>()
  return results.filter(r => {
    const key = `${r.code_id}_${r.article_number}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Topilgan moddalarni AI promptiga qo'yiladigan kontekst matniga aylantiradi.
 */
export function buildLegalContext(articles: RAGArticle[], maxCharsPerArticle = 1400): string {
  if (!articles || articles.length === 0) return ''

  const blocks = articles.map((a, i) => {
    const content =
      a.content.length > maxCharsPerArticle
        ? a.content.slice(0, maxCharsPerArticle).trim() + '…'
        : a.content
    const header = `${a.code_name}, ${a.article_number}-modda${a.title ? ' — ' + a.title : ''}`
    return `[${i + 1}] ${header}\n${content}${a.penalties ? `\n(Javobgarlik: ${a.penalties})` : ''}`
  })

  return (
    '\n\n════════════════════════════════════════\n' +
    "QUYIDAGI MA'LUMOTLAR — BAZA MA'LUMOTLARI (faqat haqiqiy qonun matnlari):\n" +
    blocks.join('\n\n---\n\n') +
    '\n════════════════════════════════════════'
  )
}

/**
 * Har qanday AI endpoint uchun "bazadan ma'lumot olish" (RAG) yordamchisi:
 * savolga mos moddalar qidirilib, ularning to'liq matni basePrompt ga kontekst
 * sifatida qo'shiladi. AI faqat shu manbalardan iqtibos keltirishi va modda
 * to'qimasligi qat'iy talab qilinadi.
 */
export async function groundPrompt(
  question: string,
  basePrompt: string,
  limit = 5
): Promise<{ prompt: string; articles: RAGArticle[] }> {
  let articles: RAGArticle[] = []
  try {
    articles = await retrieveLegalArticles(question, limit)
  } catch {
    articles = []
  }

  if (articles.length === 0) {
    const noDataRule =
      "\n\nQAT'IY QOIDA: Hech qachon modda raqami, kodeks nomi yoki jazo muddatini to'qima. " +
      'Aniq moddani bilmasang, "aniq modda uchun qonunlar bazasiga qarang" deb yoz va modda raqami keltirma.'
    return { prompt: basePrompt + noDataRule, articles }
  }

  const context = buildLegalContext(articles, 1200)
  const rule =
    "\n\nQAT'IY QOIDA: Javobingda keltiriladigan HAR BIR modda raqami va kodeks nomi " +
    "faqat yuqoridagi BAZA MA'LUMOTLARI blokidan olinishi SHART. Boshqa modda raqami, jazo " +
    'muddati yoki norma to\'qima. Berilgan moddalar savolga mos kelmasa, "Bazada bu savol ' +
    'bo\'yicha aniq modda topilmadi" deb yoz va modda raqami keltirma.'
  return { prompt: basePrompt + context + rule, articles }
}

// ═══════════════════════════════════════════════════════════════════════
// AI IQTIBOS VALIDATSIYASI — AI javobidagi modda havolalari bazaga mosligi
// tekshiriladi. To'qima yoki noto'g'ri modda raqami javobda qolmasligi uchun
// har bir "Kodeks N-modda" havolasi `articles` jadvalidan tekshiriladi.
// ═══════════════════════════════════════════════════════════════════════

export interface CitationRef {
  /** Kodeks qisqartmasi yoki to'liq nomi (masalan 'JK', 'Konstitutsiya'); nomi yo'q bo'lsa null */
  code: string | null
  article: number
  raw: string
}

export interface CitationValidation {
  valid: Array<{ code: string; codeName: string; article: number; title: string }>
  invalid: CitationRef[]
}

// Barcha kalitlar KICHIK harfda — regex katta-kichik harfni e'tiborsiz
// qoldiradi, lekin olingan prefiks asl holatda bo'ladi.
const CODE_PREFIX_ALIASES: Record<string, string> = {
  jk: 'criminal_code',
  jpk: 'criminal_procedure_code',
  fk: 'civil_code',
  gpk: 'civil_procedure_code',
  fpk: 'civil_procedure_code',
  mk: 'labor_code',
  sk: 'tax_code',
  ok: 'family_code',
  mjtk: 'admin_code',
  konstitutsiya: 'constitution',
  'jinoyat kodeksi': 'criminal_code',
  'jinoyat-protsessual kodeksi': 'criminal_procedure_code',
  'jinoyat protsessual kodeksi': 'criminal_procedure_code',
  'fuqarolik kodeksi': 'civil_code',
  'fuqarolik protsessual kodeksi': 'civil_procedure_code',
  'mehnat kodeksi': 'labor_code',
  'soliq kodeksi': 'tax_code',
  'oila kodeksi': 'family_code',
  "ma'muriy javobgarlik to'g'risidagi kodeksi": 'admin_code',
  "ma'muriy javobgarlik to'g'risidagi kodeks": 'admin_code',
}

const CODE_PREFIX_PATTERN =
  "Ma'muriy javobgarlik to'g'risidagi kodeksi|Ma'muriy javobgarlik to'g'risidagi kodeks|" +
  'Jinoyat-protsessual kodeksi|Jinoyat protsessual kodeksi|Fuqarolik protsessual kodeksi|' +
  'Fuqarolik kodeksi|Mehnat kodeksi|Soliq kodeksi|Oila kodeksi|Jinoyat kodeksi|Konstitutsiya|' +
  'JPK|GPK|FPK|MJtK|JK|FK|MK|SK|OK'

const CITATION_RE = new RegExp(
  '(' + CODE_PREFIX_PATTERN + ')?\\s*(?:ning)?\\s*(\\d{1,4})\\s*[-–—]?\\s*modda',
  'gi'
)

/**
 * Matndagi barcha "Kodeks N-modda" ko'rinishidagi havolalarni ajratib oladi.
 * Kodeks nomi bo'lmasa code=null (faqat raqam + modda).
 */
export function extractCitations(text: string): CitationRef[] {
  const refs: CitationRef[] = []
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = CITATION_RE.exec(text)) !== null) {
    const code = match[1] || null
    const article = parseInt(match[2], 10)
    if (Number.isNaN(article)) continue
    const raw = match[0]
    const key = `${code || '*'}|${article}`
    if (seen.has(key)) continue
    seen.add(key)
    refs.push({ code, article, raw })
  }
  return refs
}

/**
 * AI javobidagi modda havolalarini bazaga qarshi tekshiradi:
 *  - kodeks nomi keltirilgan bo'lsa — aynan shu kodeksda shu raqamli modda bormi
 *  - kodeks nomi keltirilmagan bo'lsa — bu raqamli modda bazada umuman bormi
 */
export async function validateCitations(text: string): Promise<CitationValidation> {
  const supabase = makeSupabase()
  const valid: CitationValidation['valid'] = []
  const invalid: CitationRef[] = []

  const refs = extractCitations(text)
  if (refs.length === 0) return { valid, invalid }
  if (!supabase) return { valid, invalid }

  for (const ref of refs) {
    try {
      const codeId = ref.code ? CODE_PREFIX_ALIASES[ref.code.toLowerCase()] || null : null
      let query = supabase
        .from('articles')
        .select('code_id, article_number, title')
        .eq('article_number', String(ref.article))
      if (codeId) query = query.eq('code_id', codeId)
      query = query.limit(2)

      const { data } = await query
      const rows = (data || []) as RagRow[]
      if (rows.length === 0) {
        invalid.push(ref)
        continue
      }
      // Kodeks nomi keltirilgan bo'lsa — mos tushgan qatorni olamiz
      const hit = codeId ? rows.find((r: RagRow) => r.code_id === codeId) : rows[0]
      if (!hit) {
        invalid.push(ref)
        continue
      }
      const codeName = CATEGORY_DISPLAY[hit.code_id as string] || hit.code_id || ''
      valid.push({
        code: hit.code_id || '',
        codeName: String(codeName),
        article: ref.article,
        title: hit.title || '',
      })
    } catch {
      // Tekshiruv xatosi javobni buzmasin — o'tkazib yuboramiz
    }
  }

  return { valid, invalid }
}

/**
 * Noto'g'ri (bazada yo'q) modda havolalari topilgan bo'lsa, javob oxiriga
 * eslatma qo'shiladi — AI to'qigan raqamlar jim o'tib ketmaydi.
 */
export function appendCitationNote(text: string, validation: CitationValidation): string {
  if (!validation.invalid || validation.invalid.length === 0) return text
  const list = [
    ...new Set(validation.invalid.map(i => `${i.code ? i.code + ' ' : ''}${i.article}-modda`)),
  ]
  const note =
    '\n\n⚠️ Eslatma: quyidagi modda havolalari qonunlar bazasida mavjud emas ' +
    "(raqam noto'g'ri bo'lishi mumkin): " +
    list.join(', ') +
    '.'
  // Eslatma bir necha marta qo'shilib ketmasligi uchun tekshiramiz
  if (text.includes('modda havolalari qonunlar bazasida mavjud emas')) return text
  return text + note
}
