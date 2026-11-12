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
import { callGemini } from '@/lib/gemini'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Xabar majburiy' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Xabar juda uzun — maksimal 4000 belgi' }, { status: 400 })
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
            (msg: { role?: string; content?: string }) =>
              `${msg.role === 'user' ? 'Savol' : 'Javob'}: ${(msg.content || '').substring(0, 150)}...`
          )
          .join('\n')
    }

    // ── RAG: savolga mos moddalarni qonunchilik bazasidan qidirish ──
    const relevantArticles = await retrieveLegalArticles(message, 6)
    const legalContext = buildLegalContext(relevantArticles)

    const systemPrompt = `Sen O'zbekiston Respublikasi qonunchiligi bo'yicha Oliy Yuridik Ekspert va AI Advokatsan. Faqat o'zbek tilida javob ber.

ASOSIY VAZIFANG:
Foydalanuvchining O‘zbekiston Respublikasi huquq tizimi va qonunchiligi bilan bog‘liq BARCHA savollariga (fuqarolik, shartnoma, jinoyat, ma’muriy javobgarlik, sud jarayonlari, mehnat, oila, soliq, tadbirkorlik, mulk, meros, uy-joy, yer, ekologiya, davlat xizmatlari va boshqa barcha sohalar bo‘yicha) to‘liq, mukammal, qonuniy asoslangan va aniq moddalarni ko‘rsatgan holda professional javob berish.

QONUNIY ASOSLAR VA MANBALAR:
O‘zbekiston Respublikasining barcha amaldagi qonun hujjatlariga tayangan holda ish ko‘r:
- O‘zbekiston Respublikasi Konstitutsiyasi (yangi tahrir)
- 21 ta amaldagi Kodeks: Fuqarolik kodeksi (FK), Jinoyat kodeksi (JK), Mehnat kodeksi (MK), Fuqarolik protsessual kodeksi (FPK), Jinoyat-protsessual kodeksi (JPK), Ma’muriy javobgarlik to‘g‘risidagi kodeks (MJtK), Ma’muriy sud ishlarini yuritish to‘g‘risidagi kodeks (MSIYUK), Oila kodeksi (OK), Soliq kodeksi (SK), Iqtisodiy protsessual kodeks (IPK), Bojxona kodeksi (BK), Budjet kodeksi (BK), Shaharsozlik kodeksi (ShK), Yer kodeksi (YK), Uy-joy kodeksi (UJK), Saylov kodeksi (SK), Havo kodeksi (HK), Jinoyat-ijroiya kodeksi (JIK), Suv kodeksi (SK), Tadbirkorlik kodeksi (TK)
- O‘zbekiston Respublikasi Qonunlari, Prezident farmon va qarorlari, Vazirlar Mahkamasi qarorlari (Lex.uz)
- O‘zbekiston Respublikasi Oliy sudi Plenumi qarorlari.

MUHIM QOIDALAR:
1. QAMROV VA TO'LIQLIK: Baza ma'lumotlarida modda bo'lishi yoki bo'lmasligidan qat'i nazar, O'zbekiston huquq tizimi bo'yicha barcha savollarga amaldagi qonunchilik asosida to'liq va professional javob ber. Hech qachon "bazada modda topilmadi" deb cheklanma yoki javob berishdan bosh tortma.
2. ANIQ MODDALAR: Tahlilda tegishli kodeks yoki qonun nomini hamda moddalarini aniq keltir (Masalan: "O'zbekiston Respublikasi Mehnat kodeksining 161-moddasi", "Fuqarolik kodeksining 354-moddasi", "Jinoyat kodeksining 168-moddasi").
3. AMALIY YO'L-YO'RIQ: Foydalanuvchiga amaliy harakatlar rejasini ber: qaysi idora yoki sudga murojaat qilish, qanday hujjatlar taqdim etish, protsessual muddatlar.
4. BAZA MA'LUMOTLARI: Quyidagi BAZA MA'LUMOTLARI blokidagi rasmiy tasdiqlangan me'yorlardan foydalan. Baza bo'sh bo'lsa ham, O'zbekiston qonunchiligi bo'yicha to'liq asoslangan holda javob ber.
5. SOXTA MODDA TAQIQLANADI: Hech qachon mavjud bo'lmagan xayoliy modda yoki normani to'qima. Faqat amaldagi O'zbekiston qonunlariga tayangan holda asosli javob ber.

JAVOB FORMATI:
📘 Umumiy tushuncha
Mavzuning huquqiy mohiyatini sodda va tushunarli tilda izohla.

⚖️ Huquqiy izoh va tahlil
Qonunchilik talablari, huquq va majburiyatlar, yuridik oqibatlar.

📚 Tegishli moddalar va qonuniy asoslar
O‘zbekiston Respublikasining tegishli kodeks va qonun moddalarini aniq ko‘rsatib, har biriga qisqa izoh ber.

💡 Amaliy misol yoki yo‘l-yo‘riq
Hayotiy vaziyat yoki fuqaroning qadam-baqadam qilishi kerak bo‘lgan harakatlari.

✅ Xulosa va tavsiya
Yakuniy xulosa va amaliy yuridik maslahat.

BOSHQA QOIDALAR:
- ALIFBO: JAVOBLAR FAQAT LOTIN O‘ZBEK ALIFBOSIDA bo‘lsin. Kirill harflari MUTLAQO ISHLATILMAYDI.
- Bo‘lim sarlavhalarini 📘, ⚖️, 📚, 💡, ✅ belgilari bilan boshla.
- Kodeks nomlarini to‘liq yoz: "O‘zbekiston Respublikasi Fuqarolik kodeksi" kabi.
- Har bir bo‘lim orasida bo‘sh qator qoldir.
- Javob uzunligi: 200-400 so‘z.
${legalContext}${contextText}`

    // Call Gemini (primary) with Groq fallback
    const CANDIDATE_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']

    let responseText = ''
    let lastError = ''

    // ── 1. Google Gemini orqali javob (Birlamchi va bepul) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(message, {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          maxTokens: 2500,
        })
        if (geminiRes && geminiRes.trim()) {
          responseText = geminiRes
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Legal Chat urinishi xatoligi, Groq’ga o‘tilmoqda:', geminiErr.message)
      }
    }

    // ── 2. Zaxira: Groq API ──
    if (!responseText) {
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
                { role: 'user', content: message },
              ],
              temperature: 0.1,
              frequency_penalty: 0.3,
              presence_penalty: 0.1,
              max_tokens: 2048,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            const raw = data.choices?.[0]?.message?.content || ''
            if (raw.trim()) {
              responseText = raw
              break
            }
          } else {
            const errorText = await response.text().catch(() => '')
            lastError = `Model ${model} failed (${response.status}): ${errorText.slice(0, 150)}`
            console.warn('Groq Legal Chat attempt failed:', lastError)
          }
        } catch (e: any) {
          clearTimeout(timeoutId)
          lastError = e.name === 'AbortError' ? 'AI timeout (25s)' : e.message
          console.warn(`Groq Legal Chat error with ${model}:`, lastError)
        }
      }
    }

    if (!responseText) {
      return NextResponse.json(
        { error: `AI xizmati xatosi: ${lastError || 'Barcha modellar band'}`, success: false },
        { status: 503 }
      )
    }

    // ── Lotin alifbosi kafolati: kirillcha aralashsa transliteratsiya qilinadi ──
    responseText = ensureUzbekLatin(responseText)

    // Clean up: trim if extremely long (over 3000 chars)
    if (responseText.length > 3000) {
      responseText = responseText.slice(0, 3000).trim() + '...'
    }

    // AI javobidagi modda iqtiboslari bazaga mosligini tekshiramiz —
    // to'qima modda raqamlari javobda qolmasligi uchun.
    try {
      const citeResult = await validateCitations(responseText)
      if (citeResult.invalid.length > 0) {
        responseText = appendCitationNote(responseText, citeResult)
      }
    } catch {
      // Validatsiya xatosi javobni buzmasin
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

    // XP mukofoti (+5 XP)
    let xpResult = null
    try {
      const { awardUserXP } = await import('@/lib/xp-engine')
      xpResult = await awardUserXP({
        userId: auth.user.id,
        xp: 5,
        action: 'ai-chat',
        title: 'AI yuridik maslahat',
        description: 'AI yuridik maslahat so‘rovi',
        idempotencyKey: `ai_legal_chat_${auth.user.id}_${Date.now()}`,
      })
    } catch (e) {
      console.warn('Legal chat XP award error:', e)
    }

    return NextResponse.json({
      response: responseText,
      category,
      relatedLaws: relatedLaws.slice(0, 3),
      suggestions,
      xpAwarded: xpResult?.xpEarned || 0,
      totalXp: xpResult?.totalXp,
      level: xpResult?.level,
      success: true,
    })
  } catch (error) {
    console.error('Legal Chat API Error:', error)
    return NextResponse.json({ error: 'Xatolik yuz berdi', success: false }, { status: 500 })
  }
}
