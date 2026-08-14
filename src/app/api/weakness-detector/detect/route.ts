import { NextRequest, NextResponse } from 'next/server'
import {
  checkAndIncrement,
  getIdentityFromRequest,
  usageMessage,
} from '@/lib/usage-limits'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// POST /api/weakness-detector/detect
// Argumentdagi zaifliklarni real AI orqali tahlil qiladi (limit bilan).
// Body: { text: string } — tahlil qilinadigan matn (argument yoki yaxshilash so'rovi)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const text = String(body.text || body.argument_text || '').trim()

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: "Argument matni kamida 20 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(request, body)
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'weakness',
      metadata: { text_length: text.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const systemPrompt = `Sen O'zbekiston Respublikasi huquq tizimi bo'yicha argument tahlilchisi (legal argument analyst). Foydalanuvchi bergan argumentdagi ZAIF TOMONLARNI topib, tahlil qilasan.

QAT'IY QOIDALAR:
1. JAVOBNI ANIQ SHU FORMATDA BER (boshqa format ishlatma):
**ZAIF TOMONLAR:**
- (zaiflik tavsifi — mantiqiy, huquqiy yoki daliliy nuqson)
- (yana zaifliklar, kamida 2 ta, ko'pi bilan 5 ta)
**KUCHLI TOMONLAR:**
- (kuchli jihat)
**TAKLIFLAR:**
- (har bir zaiflikka aniq tuzatish taklifi)

2. Hech qachon yolg'on qonun moddasi raqami to'qima. Moddani aniq bilmasang, "aniq modda uchun qonunlar bazasiga qarang" deb yoz.
3. O'zbek tilida, rasmiy va professional uslubda javob ber.`

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
          { role: 'user', content: text },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error (weakness):', errorText)
      return NextResponse.json({ error: 'AI tahlil xatosi' }, { status: response.status })
    }

    const data = await response.json()
    const aiText = data.choices[0]?.message?.content || 'Tahlil olinmadi'

    return NextResponse.json({ text: aiText })
  } catch (error) {
    console.error('Weakness detection error:', error)
    return NextResponse.json(
      { error: 'Zaifliklarni aniqlashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
