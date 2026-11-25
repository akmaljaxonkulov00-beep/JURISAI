import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { retrieveLegalArticles, buildLegalContext } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { callGemini } from '@/lib/gemini'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseTitle, caseText, lawReferences = [], userAnswers } = body

    if (!caseText || typeof caseText !== 'string' || caseText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Kazus matni yetarli emas (kamida 20 belgi)' },
        { status: 400 }
      )
    }

    if (!userAnswers || typeof userAnswers !== 'object') {
      return NextResponse.json({ error: 'Foydalanuvchi javoblari talab qilinadi' }, { status: 400 })
    }

    const { issue = '', rule = '', application = '', conclusion = '' } = userAnswers
    const allEmpty = !issue.trim() && !rule.trim() && !application.trim() && !conclusion.trim()
    if (allEmpty) {
      return NextResponse.json(
        { error: "Kamida bitta bo'limni to'ldirishingiz kerak" },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── Autentifikatsiya + IRAC limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'irac',
      metadata: { case_title: caseTitle || 'Custom case' },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // ── RAG: Tegishli qonun moddalarini qidirish ──
    const queryForRag = `${caseTitle || ''} ${caseText} ${Array.isArray(lawReferences) ? lawReferences.join(' ') : ''}`
    const relevantArticles = await retrieveLegalArticles(queryForRag, 6)
    const legalContext = buildLegalContext(relevantArticles)

    const systemPrompt = `Sen O'zbekiston Respublikasi huquq tizimi bo'yicha oliy toifali sudya va advokatlar ustozi, IRAC metodologiyasi bo'yicha ekspert AI baholovchisisan.

QAT'IY QOIDALAR VA ANIQ BAHOLASH RUBRIKASI (DEMO YOKI TAXMINIY BALL QO'YISH QAT'IYAN TAQIQLANADI):
Foydalanuvchi javobini O'zbekiston Respublikasi amaldagi qonunchiligi (JK, FK, MK, OK, MJtK, FPK, JPK) bo'yicha chuqur va xolis tekshir.
Har bir bo'lim bo'yicha ball qo'yishda quyidagi aniq mezonlarga qat'iy amal qil:

1. [ISSUE - Huquqiy muammoni aniqlash] (0 - 20 ball):
   • 0-5 ball: Muammo umuman ko'rsatilmagan yoki kazusdagi faktlarga mutlaqo aloqasi yo'q.
   • 6-12 ball: Maishiy tilda yozilgan, aniq huquqiy kvalifikatsiya va nizo predmeti ifodalanmagan.
   • 13-17 ball: Asosiy huquqiy nizo to'g'ri ilg'angan, lekin aniq huquqiy terminologiya yetishmaydi.
   • 18-20 ball: Mukammal professional ifoda: moddiy yoki protsessual huquqiy masala aniq va lo'nda yuridik tilda qo'yilgan.

2. [RULE - Qonun normasini ko'rsatish] (0 - 25 ball):
   • 0-7 ball: Qonun moddasi ko'rsatilmagan yoki mavjud bo'lmagan/boshqa davlat qonuniga havola berilgan.
   • 8-15 ball: To'g'ri kodeks nomi keltirilgan, lekin modda raqami xato yoki faqat umumiy deklarativ gaplar yozilgan.
   • 16-21 ball: Amaldagi O'zbekiston qonuni/kodeksining to'g'ri moddasi topilgan, lekin qism yoki bandlari yetarlicha ochilmagan.
   • 22-25 ball: 2026-yilgi amaldagi tahrirdagi aniq modda, qism, band va uning dispozitsiyasi to'liq va to'g'ri ko'rsatilgan.

3. [APPLICATION - Qonunni faktlarga tatbiq etish] (0 - 30 ball):
   • 0-8 ball: Tahlil yo'q, shunchaki kazus matni yoki qonun moddasi qayta ko'chirilgan.
   • 9-18 ball: Yuzaki tahlil: huquqbuzarlik/nizo tarkibi elementlari (subyekt, obyekt, subyektiv va obyektiv tomonlar, ayb, zarar, sababiy bog'lanish) faktlarga to'liq taqqoslanmagan.
   • 19-25 ball: Yaxshi huquqiy tahlil: faktlar modda talablariga mantiqiy bog'langan, asosiy argumentlar keltirilgan.
   • 26-30 ball: Mukammal yuridik sillogizm: har bir faktik holat normaning har bir shartiga chuqur huquqiy tahlil bilan bog'langan.

4. [CONCLUSION - Yakuniy xulosa] (0 - 25 ball):
   • 0-6 ball: Xulosa yo'q yoki qonuniy tahlilga mutlaqo zid natija chiqarilgan.
   • 7-14 ball: Noaniq, ikkilanishli yoki yechim bermaydigan xulosa.
   • 15-20 ball: To'g'ri yakuniy yechim, nizoning huquqiy oqibati to'g'ri belgilangan.
   • 21-25 ball: Qat'iy, asoslangan va to'liq yuridik yakun (da'voni qanoatlantirish yoki rad etish, jazo/zarar miqdori, protsessual oqibat).

Jami "score" (0-100 oralig'ida) = sectionScores.issue + sectionScores.rule + sectionScores.application + sectionScores.conclusion bo'lishi SHART.
Foydalanuvchining kamchiliklarini to'g'rilash uchun "issue", "rule", "application", "conclusion" maydonlarida to'liq namunali to'g'ri javobni ber.
FAQAT O'ZBEK LOTIN ALIFBOSIDA toza JSON formatida javob ber:

{
  "issue": "To'g'ri huquqiy muammo namunasi...",
  "rule": "Tegishli qonun moddalari matni va havolalari...",
  "application": "Faktlarni moddalarga to'g'ri bog'lash namunasi...",
  "conclusion": "Yakuniy huquqiy yechim va xulosa...",
  "sources": [{"title": "Kodeks nomi", "article": "N-modda", "url": "https://lex.uz"}],
  "confidence": 92,
  "score": 75,
  "sectionScores": {"issue": 16, "rule": 18, "application": 23, "conclusion": 18},
  "feedback": "Foydalanuvchi javobining chuqur yuridik tahlili va asoslantirilgan sharhi",
  "strengths": ["Kuchli tomon 1", "Kuchli tomon 2"],
  "weaknesses": ["Zaif tomon 1", "Zaif tomon 2"],
  "suggestions": ["Aniq amaliy tavsiya 1", "Tavsiya 2"]
}${legalContext}`

    const userPrompt = `QUYIDAGI KAZUS VA FOYDALANUVCHINING IRAC JAVOBINI BAHOLANG:

KAZUS SARLAVHASI: ${caseTitle || 'Foydalanuvchi kiritgan kazus'}
KAZUS MATNI:
${caseText}

MAVJUD QONUN HA VOLALARI: ${Array.isArray(lawReferences) && lawReferences.length > 0 ? lawReferences.join(', ') : "Ko'rsatilmagan"}

FOYDALANUVCHI JAVOBI:
[MUAMMO / ISSUE]:
${issue || '(kiritilmagan)'}

[QOIDA / RULE]:
${rule || '(kiritilmagan)'}

[QO'LLASH / APPLICATION]:
${application || '(kiritilmagan)'}

[XULOSA / CONCLUSION]:
${conclusion || '(kiritilmagan)'}

Iltimos, har bir bo'limni xolisona tekshirib, ko'rsatilgan JSON formatida javob bering.`

    let aiContent = ''
    let lastError = ''

    // ── 1. Google Gemini orqali baholash (Birlamchi va barqaror) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(userPrompt, {
          systemInstruction: systemPrompt,
          temperature: 0.15,
          maxTokens: 2500,
          responseJson: true,
        })
        if (geminiRes && geminiRes.trim()) {
          aiContent = ensureUzbekLatin(geminiRes)
        }
      } catch (geminiErr: any) {
        console.warn('Gemini IRAC Evaluate urinishi xatoligi, Groq’ga o‘tilmoqda:', geminiErr.message)
        lastError = geminiErr.message
      }
    }

    // ── 2. Zaxira: Groq API ──
    if (!aiContent && GROQ_API_KEY) {
      const CANDIDATE_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

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
              temperature: 0.15,
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
              aiContent = ensureUzbekLatin(raw)
              break
            }
          } else {
            const errText = await response.text().catch(() => '')
            lastError = `Model ${model} error: ${errText.slice(0, 150)}`
          }
        } catch (e: any) {
          clearTimeout(timeoutId)
          lastError = e.name === 'AbortError' ? 'AI timeout (20s)' : e.message
        }
      }
    }

    if (!aiContent) {
      return NextResponse.json(
        { error: `AI baholash xizmati vaqtincha band: ${lastError || 'Qayta urinib ko‘ring'}` },
        { status: 503 }
      )
    }

    let parsed: any = null
    try {
      let cleanText = aiContent.trim()
      if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7)
      else if (cleanText.startsWith('```')) cleanText = cleanText.slice(3)
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3)
      parsed = JSON.parse(cleanText.trim())
    } catch {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {}
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(
        { error: 'AI javobini JSON sifatida o‘qib bo‘lmadi' },
        { status: 502 }
      )
    }

    // Bo'lim ballarini normallashtirish
    const sectionScores = {
      issue: Math.min(20, Math.max(0, Number(parsed.sectionScores?.issue) || 0)),
      rule: Math.min(25, Math.max(0, Number(parsed.sectionScores?.rule) || 0)),
      application: Math.min(30, Math.max(0, Number(parsed.sectionScores?.application) || 0)),
      conclusion: Math.min(25, Math.max(0, Number(parsed.sectionScores?.conclusion) || 0)),
    }
    const computedScore =
      sectionScores.issue +
      sectionScores.rule +
      sectionScores.application +
      sectionScores.conclusion
    const totalScore =
      typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : computedScore

    return NextResponse.json({
      success: true,
      issue: parsed.issue || '',
      rule: parsed.rule || '',
      application: parsed.application || '',
      conclusion: parsed.conclusion || '',
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 85,
      score: totalScore,
      sectionScores,
      feedback: parsed.feedback || "Javobingiz IRAC metodikasi bo'yicha tahlil qilindi.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    })
  } catch (error: any) {
    console.error('IRAC evaluate API error:', error)
    return NextResponse.json(
      { error: error?.message || 'Baholashda kutilmagan server xatosi yuz berdi' },
      { status: 500 }
    )
  }
}
