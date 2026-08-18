import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import {
  retrieveLegalArticles,
  buildLegalContext,
  validateCitations,
  appendCitationNote,
} from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Xabar juda uzun — maksimal 4000 belgi' }, { status: 400 })
    }

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'ai_chat',
      metadata: { message_length: message.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // ── RAG: savolga mos moddalarni qonunchilik bazasidan qidirish ──
    const relevantArticles = await retrieveLegalArticles(message, 6)
    const legalContext = buildLegalContext(relevantArticles)

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `Sen JurisAI — O'zbekiston Respublikasi qonunchiligi bo'yicha professional AI yuridik yordamchisan.

QAT'IY QOIDALAR:
1. FAQAT BAZA MA'LUMOTLARIGA ASOSLAN: Agar javobingda modda raqami yoki kodeks nomi keltirsang, u AYNAN quyidagi "BAZA MA'LUMOTLARI" blokida berilgan bo'lishi SHART. Undagi moddalardan tashqari hech qachon modda raqami, jazo muddati yoki norma to'qima.
2. BAZA MA'LUMOTLARI blokidagi moddalarni keltirishda kodeks nomi va modda raqamini aniq yoz (masalan: "O'zbekiston Respublikasi Jinoyat Kodeksining 97-moddasi").
3. Agar berilgan baza ma'lumotlarida foydalanuvchi savoliga mos modda bo'lmasa, shunday yoz: "Bazada bu savol bo'yicha aniq modda topilmadi" — va umumiy qonuniy tushuntirish bering, modda raqami keltirmang.
4. JAVOBLAR ANIQLIGI: Jinoyat Kodeksi 97-moddasi — "Qasddan odam o'ldirish". Moddalarni boshqa kodekslar bilan adashtirma.
5. TIL: Faqat adabiy o'zbek tilida, FAQAT LOTIN ALIFBOSIDA javob ber. Kirill harflari (ў, қ, ғ, ҳ, ё, ж kabi) MUTLAQO ISHLATILMAYDI.
6. FORMAT: Toza Markdown ishlat (## sarlavhalar, **qalin**, • ro'yxatlar).
7. Qisqa va aniq bo'l: odatda 150-250 so'z. Foydalanuvchi "batafsil" desa 300-500 so'z.${legalContext}`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return NextResponse.json(
        {
          error: 'AI service error',
          details: response.status === 401 ? 'API key invalid' : 'Unknown error',
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    let aiResponse = data.choices[0]?.message?.content || 'Javob olinmadi'

    // ── Lotin alifbosi kafolati: kirillcha aralashsa transliteratsiya qilinadi ──
    aiResponse = ensureUzbekLatin(aiResponse)

    // AI javobidagi modda iqtiboslari bazaga mosligini tekshiramiz —
    // to'qima modda raqamlari javobda qolmasligi uchun.
    try {
      const citeResult = await validateCitations(aiResponse)
      if (citeResult.invalid.length > 0) {
        aiResponse = appendCitationNote(aiResponse, citeResult)
      }
    } catch {
      // Validatsiya xatosi javobni buzmasin
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions: [
        'Batafsil tushuntiring',
        "Qonun moddalarini ko'rsating",
        'Hujjat namunasi',
        'Boshqa savol',
      ],
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
