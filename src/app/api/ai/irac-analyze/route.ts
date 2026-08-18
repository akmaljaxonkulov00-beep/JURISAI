import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseText } = body

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: "Holat matni kamida 50 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }
    if (caseText.length > 20000) {
      return NextResponse.json(
        { error: 'Holat matni juda uzun — maksimal 20 000 belgi' },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'irac',
      metadata: { text_length: caseText.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const BASE_SYSTEM_PROMPT = `Sen JurisAI IRAC — O'zbekiston Respublikasi qonunchiligi bo'yicha professional huquqiy tahlil tizimisan.

QAT'IY QOIDALAR:
1. FAQAT BAZA MA'LUMOTLARIGA ASOSLAN: Javobingda keltiriladigan HAR BIR modda raqami va kodeks nomi "BAZA MA'LUMOTLARI" blokida berilgan bo'lishi SHART. Bazada mavjud bo'lmagan modda raqami to'qima.
2. TIL: Faqat o'zbek tilida, FAQAT LOTIN ALIFBOSIDA javob ber. Kirill harflari ishlatilmaydi.
3. FORMAT: Javobni ANIQ quyidagi formatda ber — boshqa format ishlatma:

## Muammo (Issue)
(Bu bo'limda huquqiy masalani 1-2 jumlada aniqlang. Asosiy huquqiy nizo nimadan iborat ekanini tushuntiring.)

## Qoida (Rule)
(Bu bo'limda tegishli qonun moddalarini keltiring. Har bir moddani "Kodeks nomi, N-modda" formatida yoz. Modda matnini qisqacha keltiring.)

## Qo'llash (Application)
(Bu bo'limda qonunni shu holatga qo'llang. Faktlarni moddalarga bog'lang.)

## Xulosa (Conclusion)
(Yakuniy huquqiy pozitsiyani va amaliy tavsiyalarni bering.)

HAR BIR BO'LIM AJRATILGAN BO'LISHI SHART — ularni aralashtirma yoki birlashtirma.`

    // ── RAG: ish matniga mos moddalarni qonunchilik bazasidan qidirish ──
    const { prompt: systemPrompt, articles } = await groundPrompt(caseText, BASE_SYSTEM_PROMPT, 8)

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Quyidagi huquqiy holatni IRAC metodologiyasi bo'yicha tahlil qiling:\n\n${caseText}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return NextResponse.json({ error: 'AI tahlil xatosi' }, { status: response.status })
    }

    const data = await response.json()
    const analysisText = ensureUzbekLatin(data.choices[0]?.message?.content || 'Tahlil olinmadi')

    // ── IRAC bo'limlarini ajratib olish (kengaytirilgan regex + fallback) ──
    const extractSection = (text: string, ...names: string[]): string => {
      for (const name of names) {
        // Pattern 1: ## Nom (English) yoki ## Nom
        const patterns = [
          new RegExp(
            `##\\s*${name}\\s*(?:\\([^)]*\\))?\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n\\*\\*|$)`,
            'i'
          ),
          new RegExp(`\\*\\*${name}\\*\\*:?\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n##\\s|$)`, 'i'),
          new RegExp(`#{1,3}\\s*${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|\\n\\*\\*|$)`, 'i'),
        ]
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match && match[1].trim().length > 5) return match[1].trim()
        }
      }
      return ''
    }

    const issue = extractSection(analysisText, 'Muammo', 'Issue')
    const rule = extractSection(analysisText, 'Qoida', 'Rule')
    const application = extractSection(analysisText, "Qo'llash", 'Application', 'Qo`llash')
    const conclusion = extractSection(analysisText, 'Xulosa', 'Conclusion')

    // Fallback: agar hech qanday bo'lim topilmasa, matnni 4 ga bo'lish
    let finalIssue = issue
    let finalRule = rule
    let finalApplication = application
    let finalConclusion = conclusion

    if (!issue && !rule && !application && !conclusion && analysisText.length > 100) {
      // Matnni paragraflar bo'yicha ajratish
      const paragraphs = analysisText.split(/\n\s*\n/).filter(p => p.trim().length > 20)
      if (paragraphs.length >= 4) {
        finalIssue = paragraphs[0].trim()
        finalRule = paragraphs[1].trim()
        finalApplication = paragraphs[2].trim()
        finalConclusion = paragraphs[3].trim()
      } else if (paragraphs.length > 0) {
        // Kamida 1 bo'lim bo'lsa — qolganiga umumiy matn
        finalIssue = paragraphs[0]?.trim() || analysisText
        finalRule = paragraphs[1]?.trim() || analysisText
        finalApplication = paragraphs[2]?.trim() || analysisText
        finalConclusion = paragraphs[3]?.trim() || analysisText
      }
    }

    // ── Manbalarni ajratib olish (kengaytirilgan) ──
    const sources: Array<{ title: string; article: string; url: string }> = []

    // Pattern 1: To'liq kodeks nomi
    const sourcePatterns = [
      /(O'zbekiston Respublikasi\s+[A-Za-z\u00C0-\u024F\u0400-\u04FF\s]+?kodeks[i]?)\s+(\d+[\s-]*(?:modda|moddasi)?)/gi,
      // Pattern 2: Qisqartmalar (JK, FK, MK, OK, SK, JPK, GPK, MJtK)
      /\b(JK|FK|MK|OK|SK|JPK|GPK|MJtK|FPK)\s*(?:kodeksi(?:ning)?)?\s*(?:\d+[-]?\s*(?:modda|moddasi))?\s*(\d{1,4})\s*[-]?\s*(?:modda|moddasi)/gi,
      // Pattern 3: Oddiy "N-modda" format
      /(\d{1,4})\s*[-–—]?\s*(?:modda|moddasi)/g,
    ]

    const codeMap: Record<string, string> = {
      JK: 'Jinoyat kodeksi',
      FK: 'Fuqarolik kodeksi',
      MK: 'Mehnat kodeksi',
      OK: 'Oila kodeksi',
      SK: 'Soliq kodeksi',
      JPK: 'Jinoyat-protsessual kodeksi',
      GPK: 'Fuqarolik protsessual kodeksi',
      FPK: 'Fuqarolik protsessual kodeksi',
      MJtK: "Ma'muriy javobgarlik kodeksi",
    }

    for (const pattern of sourcePatterns) {
      let match
      while ((match = pattern.exec(analysisText)) !== null) {
        const fullMatch = match[0].trim()
        if (sources.some(s => s.article === fullMatch)) continue

        if (codeMap[match[1]?.toUpperCase()]) {
          sources.push({
            title: codeMap[match[1].toUpperCase()],
            article: fullMatch,
            url: 'https://lex.uz',
          })
        } else if (match[1]) {
          sources.push({
            title: match[1].trim(),
            article: fullMatch,
            url: 'https://lex.uz',
          })
        } else if (match[0]) {
          sources.push({
            title: 'Qonun',
            article: fullMatch,
            url: 'https://lex.uz',
          })
        }
      }
    }

    // RAG'dan topilgan moddalarni ham manbalar sifatida qo'shish
    if (articles && articles.length > 0) {
      for (const art of articles.slice(0, 5)) {
        const artRef = `${art.code_name}, ${art.article_number}-modda`
        if (!sources.some(s => s.article.includes(art.article_number))) {
          sources.push({
            title: art.code_name,
            article: `${art.article_number}-modda — ${art.title || ''}`,
            url: 'https://lex.uz',
          })
        }
      }
    }

    // ── Ishonchlilik hisobi ──
    let confidence = 40
    if (finalIssue && finalIssue.length > 20) confidence += 12
    if (finalRule && finalRule.length > 20) confidence += 15
    if (finalApplication && finalApplication.length > 20) confidence += 15
    if (finalConclusion && finalConclusion.length > 20) confidence += 10
    if (sources.length > 0) confidence += 8
    confidence = Math.min(confidence, 95)

    return NextResponse.json({
      issue: finalIssue || analysisText.substring(0, 500),
      rule: finalRule || analysisText.substring(0, 500),
      application: finalApplication || analysisText.substring(0, 500),
      conclusion: finalConclusion || analysisText.substring(0, 500),
      sources: sources.slice(0, 8),
      confidence,
    })
  } catch (error) {
    console.error('IRAC analysis error:', error)
    return NextResponse.json({ error: 'Tahlil qilishda xatolik yuz berdi' }, { status: 500 })
  }
}
