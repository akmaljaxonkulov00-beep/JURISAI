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
import { callGemini, UZBEK_LEGAL_SYSTEM_INSTRUCTION } from '@/lib/gemini'

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

    const chatSystemPrompt = `${UZBEK_LEGAL_SYSTEM_INSTRUCTION}

QONUNIY YO‘RIQNOMALAR:
1. BARCHA HUQUQIY SAVOLLARGA JAVOB: Foydalanuvchining O‘zbekiston Respublikasi huquq tizimi va qonunchiligi bilan bog‘liq har qanday savoliga (21 ta amaldagi kodeks, qonunlar, LexUZ asosida) to‘liq, mukammal va professional yuridik javob ber. Hech qachon "bazada modda topilmadi" deb to'xtab qolma.
2. ANIQ MODDALAR: Javoblarda O‘zbekiston Respublikasining tegishli amaldagi kodekslari va qonunlarining aniq moddalarini ko‘rsatib, yuridik tahlil ber (Masalan: "O‘zbekiston Respublikasi Jinoyat kodeksining 168-moddasi", "Mehnat kodeksining 161-moddasi", "Fuqarolik kodeksining 354-moddasi").
3. BAZA MA'LUMOTLARI: Quyidagi BAZA MA'LUMOTLARI bloki rasmiy manba sifatida berilgan bo‘lsa, undan foydalan; agar savol bo‘yicha bazada modda bo‘lmasa ham, O‘zbekiston amaldagi qonunchiligi asosida to‘liq va aniq huquqiy yechim ber.
4. TIL VA ALIFBO: Faqat adabiy o‘zbek tilida, FAQAT LOTIN ALIFBOSIDA javob ber. Kirill yozuvi mutlaqo ishlatilmaydi.
5. FORMAT: Toza Markdown (## sarlavhalar, **qalin**, • ro‘yxatlar).
6. Qisqa va lo‘nda bo‘l: odatda 150-300 so‘z. Foydalanuvchi "batafsil" desa 350-500 so‘z.${legalContext}`

    let aiResponse = ''

    // ── 1. Gemini (asosiy provider) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await callGemini(
          `${chatSystemPrompt}\n\nFOYDALANUVCHI SAVOLI: ${message}`,
          { maxTokens: 2048, temperature: 0.1 }
        )
        if (geminiResult?.trim()) {
          aiResponse = ensureUzbekLatin(geminiResult)
        }
      } catch (geminiErr) {
        console.warn("[chat] Gemini xatosi, Groq'ga o'tilmoqda:", geminiErr)
      }
    }

    // ── 2. Groq (zaxira provider) ──
    if (!aiResponse) {
      if (!GROQ_API_KEY) {
        console.error('[chat] Na Gemini, na Groq sozlanmagan')
        return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
      }
      const groqResp = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: chatSystemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      })

      if (!groqResp.ok) {
        const errorText = await groqResp.text()
        console.error('Groq API error:', errorText)
        return NextResponse.json(
          {
            error: 'AI service error',
            details: groqResp.status === 401 ? 'API key invalid' : 'Unknown error',
          },
          { status: groqResp.status }
        )
      }

      const groqData = await groqResp.json()
      aiResponse = ensureUzbekLatin(groqData.choices[0]?.message?.content || 'Javob olinmadi')
    }

    // ── Modda iqtiboslari validatsiyasi ──
    try {
      const citeResult = await validateCitations(aiResponse)
      if (citeResult.invalid.length > 0) {
        aiResponse = appendCitationNote(aiResponse, citeResult)
      }
    } catch {
      // Validatsiya xatosi javobni buzmasin
    }

    // ── XP mukofoti (+5 XP) ──
    let xpResult = null
    try {
      const { awardUserXP } = await import('@/lib/xp-engine')
      xpResult = await awardUserXP({
        userId: auth.user.id,
        xp: 5,
        action: 'ai-chat',
        title: 'AI yuridik maslahat',
        description: "AI yuridik maslahat so'rovi",
        idempotencyKey: `ai_chat_${auth.user.id}_${Date.now()}`,
      })
    } catch (e) {
      console.warn('AI chat XP award error:', e)
    }

    return NextResponse.json({
      response: aiResponse,
      xpAwarded: xpResult?.xpEarned || 0,
      totalXp: xpResult?.totalXp,
      level: xpResult?.level,
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
