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
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    'qanday', 'qanaqa', 'nima', 'uchun', 'bilan', 'haqida', 'bo\'yicha', 'bo‘yicha',
    'kerak', 'mumkin', 'emas', 'sizga', 'meni', 'menga', 'savol', 'bor', 'yoq',
    'bering', 'ayting', 'tushuntir', 'tushuntiring', 'yordam', 'bering', 'holat',
    'holatda', 'bo\'lsa', 'bo‘lsa', 'agar', 'keyin', 'so\'ng', 'so‘ng', 'ham',
    'modda', 'moddasi', 'qonun', 'qonuni', 'kodeks', 'kodeksi', 'respublika',
    'o\'zbekiston', 'o‘zbekiston', 'bo\'yicha', 'bo‘yicha',
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

/** Eng uzun umumiy qator (substring) uzunligi — yolg'on mosliklarni (masalan 'odillik' ~ 'ogirlik') filtrlaydi. */
function longestCommonSubstring(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return 0
  const dp: number[] = new Array(n + 1).fill(0)
  let best = 0
  for (let i = 1; i <= m; i++) {
    let prev = 0
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev + 1
        if (dp[j] > best) best = dp[j]
      } else {
        dp[j] = 0
      }
      prev = tmp
    }
  }
  return best
}

/**
 * So'z va kalit so'z o'rtasida ishonchli o'xshashlik bormi?
 *  - 1 ta xato: ishonchli moslik
 *  - 2 ta xato: umumiy prefiks (2+ belgi) yoki kamida 4 belgidan iborat umumiy qator talab
 * Baza matnidagi tizimli xatolar (masalan 'O‘g‘rilik' ~ to'g'ri 'o'g'irlik') ham
 * topiladi, ammo tasodifiy o'xshashliklar ('odillik' ~ 'ogirlik') filtrlanadi.
 */
function fuzzyMatch(word: string, keyword: string): boolean {
  const maxDist = keyword.length >= 6 ? 2 : 1
  if (Math.abs(word.length - keyword.length) > maxDist) return false
  const d = levenshtein(word, keyword)
  if (d > maxDist) return false
  if (d <= 1) return true
  // 2 xatolik holatida: umumiy prefiks yoki katta umumiy qator bo'lishi kerak
  if (word.startsWith(keyword.slice(0, 2)) || keyword.startsWith(word.slice(0, 2))) return true
  return longestCommonSubstring(word, keyword) >= 4
}

/** Sarlavha/full row bo'yicha reyting balli. Uzun (aniq) so'z ko'proq og'irlik oladi; eng uzun kalit so'z mos tushsa qo'shimcha bonus. */
function scoreRow(
  row: any,
  keywordWords: string[],
  numMatch: RegExpMatchArray | null
): { score: number; matched: number; maxWordLen: number } {
  const title = (row.title || '').toLowerCase().replace(APOSTROPHES, '')
  const content = (row.content || '').toLowerCase().replace(APOSTROPHES, '')
  const titleWords = new Set<string>(title.split(/\s+/).filter(Boolean) as string[])
  let score = 0
  let matched = 0
  let maxWordLen = 0
  // Aniq modda raqami — eng yuqori ustunlik; mazmunli sarlavhali yozuvlar ustunroq
  if (
    numMatch &&
    String(row.article_number || '').replace(/^0+/, '') === numMatch[1].replace(/^0+/, '')
  ) {
    score += 100 + Math.min((title || '').length / 40, 5)
    // Faqat raqam bilan so'ralganda eng ko'p havola qilinadigan kodekslar ustunroq
    const codePriority: Record<string, number> = {
      criminal_code: 4,
      constitution: 2,
      civil_code: 1,
    }
    score += codePriority[row.code_id] || 0
  } else if (numMatch && String(row.article_number || '').startsWith(numMatch[1])) {
    score += 30
  }
  const longest = Math.max(0, ...keywordWords.map(w => w.length))
  let longestMatched = false
  let longestHitTitle = false
  for (const w of keywordWords) {
    if (!w) continue
    const weight = 2 + Math.min(w.length, 6)
    let hit = false
    let hitTitle = false
    if (title.includes(w)) {
      score += weight * 3
      hit = true
      hitTitle = true
    } else if (content.includes(w)) {
      score += weight
      hit = true
    }
    if (!hit) {
      // Xatoga chidamli moslik: sarlavhadagi so'z bilan yaqin bo'lsa
      for (const tw of titleWords) {
        if (fuzzyMatch(tw, w)) {
          score += weight * 2
          hit = true
          hitTitle = true
          break
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
export async function retrieveLegalArticles(
  message: string,
  limit = 6
): Promise<RAGArticle[]> {
  try {
    const supabase = makeSupabase()
    if (!supabase) return []

    // Kodeks nomlari xaritasi (iqtibos uchun)
    let codeNames = new Map<string, string>()
    try {
      const { data: cats } = await supabase.from('categories').select('code_id, name')
      if (cats && cats.length > 0) {
        codeNames = new Map((cats as any[]).map((c: any) => [c.code_id, c.name]))
      }
    } catch {
      // categories bo'lmasa display map ishlatiladi
    }

    const numMatch = message.match(/(\d{1,4})\s*[-–—]?\s*modda/i)
    const keywordWords = extractKeywords(message).map(w => w.replace(APOSTROPHES, ''))

    const candidateIds = new Set<string>()
    const add = (rows: any[]) => {
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
      const patterns = keywordWords.flatMap(w => keywordPatterns(w)).slice(0, 6)
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
    const fuzzyIds: string[] = []
    if (keywordWords.length > 0) {
      const titles: any[] = []
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
      const scored = titles
        .map((row: any) => ({ row, s: scoreRow(row, keywordWords, null).score }))
        .filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 40)
      for (const x of scored) {
        if (!candidateIds.has(x.row.id)) {
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
    const ranked = (full as any[])
      .map((row: any) => ({ row, ...scoreRow(row, keywordWords, numMatch) }))
      .filter(r => r.score > 0 || full.length <= limit)
      .sort(
        (a, b) =>
          b.score - a.score || b.maxWordLen - a.maxWordLen || b.matched - a.matched
      )
      .slice(0, limit)
      .map(r => r.row)

    return mapRows(ranked, codeNames)
  } catch (error) {
    console.error('[legal-rag] retrieve error:', error)
    return []
  }
}

function mapRows(rows: any[], codeNames: Map<string, string>): RAGArticle[] {
  const results = rows.map((row: any) => {
    const codeName =
      codeNames.get(row.code_id) || CATEGORY_DISPLAY[row.code_id] || row.code_id
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
    const content = a.content.length > maxCharsPerArticle
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
