import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { callGemini } from '@/lib/gemini'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      caseText,
      caseTitle = '',
      lawReferences = [],
      keyQuestions = [],
      category = '',
      difficulty = '',
    } = body

    if (!caseText || typeof caseText !== 'string' || caseText.trim().length < 30) {
      return NextResponse.json(
        { error: "Holat matni kamida 30 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }
    if (caseText.length > 25000) {
      return NextResponse.json(
        { error: 'Holat matni juda uzun — maksimal 25 000 belgi' },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'irac',
      metadata: { text_length: caseText.length, case_title: caseTitle || 'Custom case' },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const BASE_SYSTEM_PROMPT = `Sen Juristiv IRAC — O'zbekiston Respublikasi qonunchiligi bo'yicha professional oliy toifali sudya va advokatlar tahlil tizimisan.

QAT'IY QOIDALAR:
1. HUQUQIY ASOSLAR: Keltiriladigan moddalar O'zbekiston Respublikasining amaldagi qonunchiligiga (Fuqarolik kodeksi, Jinoyat kodeksi, Mehnat kodeksi, Oila kodeksi, Ma'muriy javobgarlik to'g'risidagi kodeks va boshqalar) qat'iy asoslanishi shart. Mavjud bo'lmagan moddalar mutlaqo to'qilmasin.
2. TIL: Faqat o'zbek tilida, FAQAT LOTIN ALIFBOSIDA yoz. Kirill harflari mutlaqo ishlatilmaydi.
3. IRAC METODOLOGIYASI:
   - issue (Muammo): Huquqiy nizo mohiyatini 1-2 ta aniq, professional jumlada ifodalang.
   - rule (Qoida): Tegishli amaldagi qonun moddalarini to'liq ko'rsating (masalan: "O'zbekiston Respublikasi Fuqarolik kodeksining 113, 116-moddalari"). Moddaning tegishli qismi va qoidasini aniq bayon qiling.
   - application (Qo'llash): Kazusdagi aniq faktlarni moddalarga birma-bir bog'lab, yuridik mantiq asosida chuqur tahlil qiling.
   - conclusion (Xulosa): Yakuniy huquqiy yechim, tarafning huquqlari va sudga yoki amaliyotga oid aniq tavsiyalarni bering.
4. JAVOB FORMATI: Javobni FAQAT toza JSON formatida qaytar (hech qanday markdown \`\`\`json teglari va ortiqcha kirish so'zlarsiz):

{
  "issue": "Muammo matni...",
  "rule": "Qonun moddalari matni...",
  "application": "Vaziyatga qo'llash tahlili...",
  "conclusion": "Yakuniy xulosa va amaliy tavsiya...",
  "sources": [
    { "title": "Kodeks yoki Qonun nomi", "article": "N-modda", "url": "https://lex.uz" }
  ],
  "confidence": 92
}`

    // ── RAG: ish matni va modda havolalariga mos normalarni bazadan qidirish ──
    const searchContext = [
      caseTitle,
      caseText,
      Array.isArray(lawReferences) ? lawReferences.join(' ') : '',
      Array.isArray(keyQuestions) ? keyQuestions.join(' ') : '',
      category,
    ]
      .filter(Boolean)
      .join('\n')

    const { prompt: systemPrompt, articles } = await groundPrompt(searchContext, BASE_SYSTEM_PROMPT, 8)

    const userPrompt = `QUYIDAGI HUQUQIY HOLATNI IRAC METODOLOGIYASI BO'YICHA TAHLIL QILING:

${caseTitle ? `KAZUS NOMI: ${caseTitle}\n` : ''}${category ? `SOHA: ${category}\n` : ''}${difficulty ? `DARAJA: ${difficulty}\n` : ''}${Array.isArray(lawReferences) && lawReferences.length > 0 ? `QONUNCHILIK ASOSLARI: ${lawReferences.join(', ')}\n` : ''}${Array.isArray(keyQuestions) && keyQuestions.length > 0 ? `HAL QILINISHI KERAK BO'LGAN ASOSIY SAVOLLAR:\n${keyQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
KAZUS MATNI:
${caseText}

Iltimos, O'zbekiston Respublikasi amaldagi qonunchiligi asosida har bir bo'limni to'liq, mukammal va professional tarzda yuqoridagi JSON formatida qaytaring.`

    const CANDIDATE_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

    let analysisText = ''
    let lastError = ''

    // ── 1. Google Gemini orqali tahlil (Birlamchi) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(userPrompt, {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          maxTokens: 3000,
          responseJson: true,
        })
        if (geminiRes && geminiRes.trim()) {
          analysisText = ensureUzbekLatin(geminiRes)
        }
      } catch (geminiErr: any) {
        console.warn('Gemini IRAC urinishi xatoligi, Groq’ga o‘tilmoqda:', geminiErr.message)
        lastError = geminiErr.message
      }
    }

    // ── 2. Zaxira: Groq API ──
    if (!analysisText && GROQ_API_KEY) {
      for (const model of CANDIDATE_MODELS) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)

        try {
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              temperature: 0.1,
              max_tokens: 2500,
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            const raw = data.choices?.[0]?.message?.content || ''
            if (raw.trim()) {
              analysisText = ensureUzbekLatin(raw)
              break
            }
          } else {
            const errorText = await response.text().catch(() => '')
            lastError = `Model ${model} failed (${response.status}): ${errorText.slice(0, 150)}`
            console.warn('Groq IRAC attempt failed:', lastError)
          }
        } catch (e: any) {
          clearTimeout(timeoutId)
          lastError = e.name === 'AbortError' ? 'AI timeout (20s)' : e.message
          console.warn(`Groq IRAC error with ${model}:`, lastError)
        }
      }
    }

    if (!analysisText) {
      return NextResponse.json(
        { error: `AI tahlil xatosi: ${lastError || 'Barcha modellar band'}` },
        { status: 503 }
      )
    }

    // ── JSON parse yoki fallback extraction ──
    let parsed: any = null
    try {
      let cleanText = analysisText.trim()
      if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7)
      else if (cleanText.startsWith('```')) cleanText = cleanText.slice(3)
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3)
      parsed = JSON.parse(cleanText.trim())
    } catch {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {}
      }
    }

    let finalIssue = ''
    let finalRule = ''
    let finalApplication = ''
    let finalConclusion = ''
    let sources: Array<{ title: string; article: string; url: string }> = []
    let confidence = 90

    if (parsed && typeof parsed === 'object') {
      finalIssue = parsed.issue || ''
      finalRule = parsed.rule || ''
      finalApplication = parsed.application || ''
      finalConclusion = parsed.conclusion || ''
      if (Array.isArray(parsed.sources)) sources = parsed.sources
      if (typeof parsed.confidence === 'number') confidence = parsed.confidence
    }

    // Agar JSON bo'lmasa yoki maydonlar yetishmasa, xavfsiz matn tahlili
    if (!finalIssue || !finalRule || !finalApplication || !finalConclusion) {
      const extractSection = (text: string, ...names: string[]): string => {
        for (const name of names) {
          const patterns = [
            new RegExp(
              `(?:##+|\\*\\*)\\s*(?:\\d+[.\\s-]*)?${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=(?:\\n##+|\\n\\*\\*\\s*(?:\\d+[.\\s-]*)?(?:Muammo|Qoida|Qo['\`]llash|Xulosa|Issue|Rule|Application|Conclusion)|$)`,
              'i'
            ),
            new RegExp(
              `\\b${name}\\s*(?:\\([^)]*\\))?:?\\s*\\n([\\s\\S]*?)(?=\\n(?:Qoida|Qo['\`]llash|Xulosa|Rule|Application|Conclusion)\\b|$)`,
              'i'
            ),
          ]
          for (const pattern of patterns) {
            const match = text.match(pattern)
            if (match && match[1].trim().length > 5) return match[1].trim()
          }
        }
        return ''
      }

      finalIssue = finalIssue || extractSection(analysisText, 'Muammo', 'Issue')
      finalRule = finalRule || extractSection(analysisText, 'Qoida', 'Rule')
      finalApplication =
        finalApplication ||
        extractSection(analysisText, "Qo'llash", 'Application', 'Qo`llash', 'Qollash')
      finalConclusion = finalConclusion || extractSection(analysisText, 'Xulosa', 'Conclusion')

      if (!finalIssue && !finalRule && !finalApplication && !finalConclusion) {
        const paragraphs = analysisText.split(/\n\s*\n/).filter(p => p.trim().length > 20)
        if (paragraphs.length >= 4) {
          finalIssue = paragraphs[0].trim()
          finalRule = paragraphs[1].trim()
          finalApplication = paragraphs[2].trim()
          finalConclusion = paragraphs[3].trim()
        } else {
          finalIssue = analysisText.slice(0, 300)
          finalRule = "O'zbekiston Respublikasi amaldagi qonunchiligi"
          finalApplication = analysisText
          finalConclusion = 'Tahlil yakunlandi.'
        }
      }
    }

    // Manbalarni tahlil qilish (agar bo'sh bo'lsa matndan qidirish)
    if (sources.length === 0) {
      const codeMap: Record<string, string> = {
        JK: 'Jinoyat kodeksi',
        FK: 'Fuqarolik kodeksi',
        MK: 'Mehnat kodeksi',
        OK: 'Oila kodeksi',
        SK: 'Soliq kodeksi',
        JPK: 'Jinoyat-protsessual kodeksi',
        GPK: 'Fuqarolik protsessual kodeksi',
        FPK: 'Fuqarolik protsessual kodeksi',
        MJtK: "Ma'muriy javobgarlik to'g'risidagi kodeks",
        IPK: 'Iqtisodiy protsessual kodeksi',
        MSIYtK: 'Maʼmuriy sud ishlarini yuritish toʻgʻrisidagi kodeks',
        JIK: 'Jinoyat-ijroiya kodeksi',
        YeK: 'Yer kodeksi',
        BK: 'Bojxona kodeksi',
      }

      const refPattern =
        /\b(JK|FK|MK|OK|SK|JPK|GPK|FPK|MJtK|IPK|MSIYtK)\s*(?:kodeksi)?\s*(?:ning)?\s*(\d{1,4}(?:-\d+)?)\s*[-–—]?\s*(?:modda[si]*)?/gi
      let m
      const fullAnalysis = `${finalRule} ${finalApplication} ${finalConclusion}`
      while ((m = refPattern.exec(fullAnalysis)) !== null) {
        const codeKey = m[1].toUpperCase()
        const articleNum = m[2]
        const articleStr = `${codeKey} ${articleNum}-modda`
        if (!sources.some(s => s.article === articleStr)) {
          sources.push({
            title: codeMap[codeKey] || `${codeKey} kodeksi`,
            article: articleStr,
            url: 'https://lex.uz',
          })
        }
      }

      if (sources.length === 0 && Array.isArray(lawReferences)) {
        lawReferences.forEach(ref => {
          sources.push({
            title: String(ref),
            article: String(ref),
            url: 'https://lex.uz',
          })
        })
      }

      // RAG'dan topilgan moddalarni ham qo'shish
      if (articles && articles.length > 0) {
        for (const art of articles.slice(0, 5)) {
          const artRef = `${art.article_number}-modda`
          if (!sources.some(s => s.article.includes(art.article_number))) {
            sources.push({
              title: art.code_name,
              article: `${art.article_number}-modda — ${art.title || ''}`,
              url: 'https://lex.uz',
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      issue: finalIssue,
      rule: finalRule,
      application: finalApplication,
      conclusion: finalConclusion,
      sources: sources.slice(0, 10),
      confidence,
    })
  } catch (error: any) {
    console.error('IRAC analyze API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Tahlil jarayonida kutilmagan xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
