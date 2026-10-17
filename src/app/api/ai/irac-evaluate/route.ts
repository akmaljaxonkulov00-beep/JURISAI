import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { retrieveLegalArticles, buildLegalContext } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

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

    if (!GROQ_API_KEY) {
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

QAT'IY QOIDALAR:
1. FAQAT O'zbekiston Respublikasi amaldagi qonunchiligi (JK, FK, MK, OK, MJtK, FPK, JPK) asosida xolis bahola.
2. Har bir bo'lim uchun qat'iy maksimal ballar:
   - issue (Muammoni aniqlash): maksimal 20 ball
   - rule (Qonun moddalarini ko'rsatish): maksimal 25 ball
   - application (Qonunni holat faktlariga qo'llash): maksimal 30 ball
   - conclusion (Yakuniy huquqiy xulosa): maksimal 25 ball
3. Jami "score" (0-100 oralig'ida) aniq sectionScores summasiga teng bo'lishi SHART.
4. Foydalanuvchining kamchiliklarini to'ldiruvchi to'g'ri javoblarni issue, rule, application, conclusion maydonlarida ber.
5. FAQAT O'ZBEK LOTIN ALIFBOSIDA yoz. Kirill harflari mutlaqo ishlatilmaydi.
6. JAVOB FAQAT TOZA JSON BO'LISHI SHART (hech qanday markdown \`\`\`json teglari va ortiqcha so'zlarsiz):

{
  "issue": "To'g'ri huquqiy muammo tahlili...",
  "rule": "Tegishli qonun moddalari matni va havolalari...",
  "application": "Faktlarni moddalarga to'g'ri bog'lash...",
  "conclusion": "Yakuniy huquqiy yechim va xulosa...",
  "sources": [{"title": "Kodeks nomi", "article": "N-modda", "url": "https://lex.uz"}],
  "confidence": 90,
  "score": 75,
  "sectionScores": {"issue": 16, "rule": 18, "application": 23, "conclusion": 18},
  "feedback": "Umumiy tahliliy xulosa",
  "strengths": ["Kuchli tomon 1", "Kuchli tomon 2"],
  "weaknesses": ["Zaif tomon 1", "Zaif tomon 2"],
  "suggestions": ["Takomillashtirish bo'yicha maslahat 1", "Maslahat 2"]
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

    const CANDIDATE_MODELS = [
      'openai/gpt-oss-120b',
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
    ]

    let aiContent = ''
    let lastError = ''

    for (const model of CANDIDATE_MODELS) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

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
            temperature: 0.2,
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
        lastError = e.name === 'AbortError' ? 'AI timeout (25s)' : e.message
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
      parsed = JSON.parse(aiContent)
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
