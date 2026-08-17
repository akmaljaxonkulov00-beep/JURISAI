import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * POST /api/ai/irac-analyze-real
 *
 * /case-solver sahifasi ishlatadigan IRAC baholash API'si.
 * Foydalanuvchining har bir IRAC bo'limiga yozgan javobini O'zbekiston
 * qonunchiligi bazasidan topilgan REAL moddalarga solishtirib baholaydi.
 *
 * Body: { case_text: string, case_type?: string, difficulty_level?: string }
 * Return: { scores: { issue, rule, application, conclusion }, suggestions: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const caseText = String(body.case_text || '').trim()
    const caseType = String(body.case_type || 'jinoyat').trim()
    const difficulty = String(body.difficulty_level || "o'rta").trim()

    if (!caseText || caseText.trim().length < 30) {
      return NextResponse.json(
        { error: "Holat matni kamida 30 ta belgidan iborat bo'lishi kerak" },
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
      metadata: { source: 'case_solver', text_length: caseText.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const BASE_SYSTEM_PROMPT = `Sen O'zbekiston Respublikasi qonunchiligi bo'yicha professional IRAC baholovchi yordamchisan.

Vazifa: foydalanuvchi yechayotgan huquqiy ish (case) bo'yicha uning har bir IRAC bo'limiga yozgan javobini baholash.

IRAC bo'limlari:
- issue — Muammo: huquqiy masala to'g'ri aniqlanganmi
- rule — Qoida: tegishli qonun moddalari to'g'ri keltirilganmi (kodeks nomi va modda raqami bilan)
- application — Qo'llash: vaziyatga qonun to'g'ri qo'llanganmi
- conclusion — Xulosa: yakuniy pozitsiya va tavsiya to'g'rimi

Baholash mezonlari (har bir bo'lim uchun 0-100 ball):
- 90-100: a'lo — to'liq va qonunga mos
- 70-89: yaxshi — asosiy fikrlar bor, kichik kamchiliklar
- 50-69: o'rtacha — qisman to'g'ri, muhim jihatlar yetishmayapti
- 0-49: qoniqarsiz — noto'g'ri yoki juda qisqa

JAVOB FORMATI — faqat JSON (boshqa matn yozma):
{
  "scores": { "issue": 0, "rule": 0, "application": 0, "conclusion": 0 },
  "suggestions": ["kamchilik 1", "kamchilik 2", "kamchilik 3"]
}`

    // ── RAG: ish matniga mos moddalarni qonunchilik bazasidan qidirish ──
    const { prompt: systemPrompt } = await groundPrompt(caseText, BASE_SYSTEM_PROMPT)

    const userPrompt = `Quyidagi huquqiy ishni va foydalanuvchi javobini baholang.

ISH TURI: ${caseType}
QIYINLIK: ${difficulty}

ISH VA FOYDALANUVCHI JAVOBLARI:
${caseText.slice(0, 6000)}

Yuqoridagi formatda JSON qaytaring.`

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error (irac-real):', errorText)
      return NextResponse.json({ error: 'AI tahlil xatosi' }, { status: response.status })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''

    // AI javobidan JSON ni ajratib olish
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    let scores = { issue: 0, rule: 0, application: 0, conclusion: 0 }
    let suggestions: string[] = []
    try {
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
      scores = {
        issue: Math.max(0, Math.min(100, Number(parsed.scores?.issue) || 0)),
        rule: Math.max(0, Math.min(100, Number(parsed.scores?.rule) || 0)),
        application: Math.max(0, Math.min(100, Number(parsed.scores?.application) || 0)),
        conclusion: Math.max(0, Math.min(100, Number(parsed.scores?.conclusion) || 0)),
      }
      suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions.slice(0, 5).map((s: unknown) => String(s))
        : []
    } catch {
      // JSON bo'lmasa — matndan qidirish
      for (const section of ['issue', 'rule', 'application', 'conclusion']) {
        const m = raw.match(new RegExp(`"${section}"\\s*:\\s*(\\d{1,3})`))
        if (m) scores[section as keyof typeof scores] = Math.max(0, Math.min(100, Number(m[1])))
      }
    }

    return NextResponse.json({ scores, suggestions })
  } catch (error) {
    console.error('IRAC analyze-real error:', error)
    return NextResponse.json({ error: 'Tahlil qilishda xatolik yuz berdi' }, { status: 500 })
  }
}
