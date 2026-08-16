import { NextRequest, NextResponse } from 'next/server'
import { checkAndIncrement, getIdentityFromRequest, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// POST /api/scenario-generator/generate
// O'zbekiston qonunchiligiga asoslangan huquqiy senariy yaratadi (limit bilan).
// Body: { topic: string, difficulty?: string, focus_areas?: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const topic = String(body.topic || '').trim()
    const difficulty = String(body.difficulty || body.difficulty_level || "o'rta")
    const focusAreas: string[] = Array.isArray(body.focus_areas) ? body.focus_areas : []

    if (!topic) {
      return NextResponse.json({ error: 'Senariy mavzusi kiritilishi shart' }, { status: 400 })
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(request, body)
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'scenario',
      metadata: { topic, difficulty },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const BASE_SYSTEM_PROMPT = `Sen O'zbekiston Respublikasi qonunchiligi va sud amaliyotiga ixtisoslashgan huquqiy senariy yaratuvchisisiz (legal scenario writer for legal education).

QAT'IY QOIDALAR:
1. Senariy O'zbekiston qonunchiligiga (kodekslar, qonunlar, sud amaliyoti) mos bo'lsin.
2. Quyidagi tuzilmada yoz:
**SENARIY NOMI:**
(2-3 so'zlik nom)

**KONTEKST:**
(Ishning to'liq holati — kim, qachon, qayerda, nima bo'lgan)

**TOMONLAR:**
- (tomon 1: roli, maqsadi)
- (tomon 2: roli, maqsadi)
- (agar kerak bo'lsa, boshqa tomonlar)

**ASOSIY MUAMMO:**
(huquqiy masala aniq ifodalansin)

**QO'SHIMCHA FAKTLAR:**
- (holatni murakkablashtiruvchi faktlar)

**QONUNIY ASOS:**
- (tegishli kodeks nomi va modda raqami — aniq bilmasang, "aniq modda uchun qonunlar bazasiga qarang" deb yoz)

**MAQSADLAR:**
- (har bir tomon uchun maqsadlar)

3. Hech qachon yolg'on modda raqami to'qima.
4. O'zbek tilida, ta'limiy va batafsil yoz.`

    // ── RAG: mavzuga mos moddalarni qonunchilik bazasidan qidirish ──
    const { prompt: systemPrompt } = await groundPrompt(
      `${topic} ${focusAreas.join(' ')}`,
      BASE_SYSTEM_PROMPT
    )

    const userPrompt = `${topic} mavzusida "${difficulty}" qiyinlik darajasidagi huquqiy senariy yarat.${
      focusAreas.length > 0 ? ` Diqqat markazlari: ${focusAreas.join(', ')}.` : ''
    }`

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
        temperature: 0.6,
        max_tokens: 1600,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error (scenario):', errorText)
      return NextResponse.json({ error: 'AI xizmat xatosi' }, { status: response.status })
    }

    const data = await response.json()
    const aiText = data.choices[0]?.message?.content || 'Senariy olinmadi'

    return NextResponse.json({ text: aiText })
  } catch (error) {
    console.error('Scenario generation error:', error)
    return NextResponse.json({ error: 'Senariy yaratishda xatolik yuz berdi' }, { status: 500 })
  }
}
