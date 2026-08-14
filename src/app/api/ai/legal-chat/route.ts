import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  checkAndIncrement,
  getIdentityFromRequest,
  usageMessage,
} from '@/lib/usage-limits'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Xabar majburiy' }, { status: 400 })
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(request, body)
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'ai_chat',
      metadata: { message_length: message.length, source: 'legal_chat' },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // Build context from conversation history
    let contextText = ''
    if (context.length > 0) {
      contextText =
        '\n\nOldingi suhbat:\n' +
        context
          .slice(-4)
          .map(
            (msg: any) =>
              `${msg.role === 'user' ? 'Savol' : 'Javob'}: ${msg.content.substring(0, 150)}...`
          )
          .join('\n')
    }

    const systemPrompt = `Sen O'zbekiston Respublikasi qonunchiligi bo'yicha professional AI yuridik yordamchisan.

Har bir javobni foydalanuvchi oson tushunadigan, tartibli va professional uslubda yoz. Javoblar 200-300 so'zdan kam bo'lmasin. Faqat adabiy o'zbek tilida yoz. Hech qachon yolg'on modda raqami to'qima. FAQAT O'zbekiston Respublikasining amaldagi qonunlariga asoslanib javob ber. Agar ma'lumot topilmasa, buni aniq ayt, lekin o'zi ma'lumot to'qima.

JAVOB FORMATI (quyidagi bo'limlarga qat'iy rioya qil):

📘 Umumiy tushuncha
2-4 paragraf. Mavzuning mohiyatini sodda tilda tushuntir. Nima haqida ekanligi, qachon qo'llanilishi, kimlarga tegishliligi haqida yoz.

⚖️ Huquqiy izoh
Qonun nimani tartibga solishi, qanday holatlarda qo'llanilishi, amaliy ahamiyati haqida yoz. Bu bo'limda faqat fakt va qonuniy tahlil bo'lsin.

📚 Tegishli moddalar
Moddalarni • bilan sanab chiq. Har bir moddani 1-2 gap bilan izohla. Misol:
• 97-modda — Qasddan odam o'ldirish uchun javobgarlik belgilangan
• 98-modda — Jabrlanuvchining o'limiga sabab bo'lgan og'ir tan jarohati

💡 Oddiy misol
Hayotiy misol yoz. Foydalanuvchi oson tushunishi uchun. Masalan: "Fuqaro boshqa shaxsning telefonini qasddan olib qo'ysa..."

✅ Xulosa
2-3 gaplik yakuniy xulosa. Asosiy fikrni takrorla va amaliy tavsiya ber.

MUHIM QOIDALAR:
- Hech qachon **, ##, * kabi markdown belgilarini ishlatma. Oddiy matn yoz.
- Bo'lim sarlavhalarini aynan 📘, ⚖️, 📚, 💡, ✅ bilan boshla.
- Hech qachon yolg'on modda to'qima. Bilmasang, "aniq modda raqami uchun O'zbekiston Respublikasining tegishli kodeksiga murojaat qiling" deb yoz.
- Kodeks nomlarini to'liq yoz: "O'zbekiston Respublikasi Jinoyat Kodeksi" emas "JK".
- Har bir bo'lim orasida bo'sh qator qoldir.
- Javob tabiiy, inson yozgandek ravon bo'lsin. Robot uslubida yozma.
- Javob uzunligi: odatda 200-300 so'z. Foydalanuvchi "batafsil" desa 400-600 so'z. "Qisqacha" desa 100-180 so'z.
${contextText}`

    // Call Groq with strict parameters
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
          { role: 'user', content: message },
        ],
        temperature: 0.1,
        frequency_penalty: 0.3,
        presence_penalty: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return NextResponse.json(
        { error: 'AI xizmati xatosi', success: false },
        { status: response.status }
      )
    }

    const data = await response.json()
    let responseText = data.choices[0]?.message?.content || 'Javob olinmadi'

    // Clean up: trim if extremely long (over 3000 chars)
    if (responseText.length > 3000) {
      responseText = responseText.slice(0, 3000).trim() + '...'
    }

    // Determine category based on keywords
    let category: 'legal' | 'case' | 'document' | 'general' = 'general'
    const lowerText = message.toLowerCase()

    if (
      lowerText.includes('modda') ||
      lowerText.includes('qonun') ||
      lowerText.includes('kodeks')
    ) {
      category = 'legal'
    } else if (
      lowerText.includes('keys') ||
      lowerText.includes('sud') ||
      lowerText.includes("da'vo")
    ) {
      category = 'case'
    } else if (
      lowerText.includes('shartnoma') ||
      lowerText.includes('hujjat') ||
      lowerText.includes('ariza')
    ) {
      category = 'document'
    }

    // Extract related laws from response
    const relatedLaws: string[] = []
    const lawPattern =
      /([А-Я][а-яА-Я\s]+кодекси?|[A-Z][a-z]+\s+kodeks[i]?)\s*(\d+[-]?(?:modda|moddasi)?)/gi
    let match
    while ((match = lawPattern.exec(responseText)) !== null) {
      relatedLaws.push(match[0])
    }

    // Generate smart suggestions
    let suggestions: string[] = []
    switch (category) {
      case 'legal':
        suggestions = [
          "Bu qonunning amalda qanday qo'llanilishi?",
          "O'xshash moddalar haqida ma'lumot",
          "Bu qonun buzilganda nima bo'ladi?",
        ]
        break
      case 'case':
        suggestions = [
          'Sud jarayoni qancha vaqt davom etadi?',
          'Qanday dalillar kerak?',
          'Advokat yollamoq majburiymu?',
        ]
        break
      case 'document':
        suggestions = [
          "Hujjat namunasini ko'rsating",
          "Qanday ma'lumotlar kerak?",
          'Hujjatni qayerga topshirish kerak?',
        ]
        break
      default:
        suggestions = ['Batafsil tushuntiring', 'Misol keltirib bering', "O'xshash holatlar"]
    }

    // Log usage to Supabase (non-blocking)
    try {
      const supabase = getSupabaseAdmin()
      await supabase.from('usage_logs').insert({
        user_id: 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(responseText.length / 4),
        action: 'ai_legal_chat',
        metadata: { category, message_length: message.length },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Silently fail — logging is non-critical
    }

    return NextResponse.json({
      response: responseText,
      category,
      relatedLaws: relatedLaws.slice(0, 3),
      suggestions,
      success: true,
    })
  } catch (error: any) {
    console.error('Legal Chat API Error:', error)
    return NextResponse.json(
      {
        error: 'Xatolik yuz berdi',
        message: error.message || "Noma'lum xatolik",
        success: false,
      },
      { status: 500 }
    )
  }
}
