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

    // ── Suhbat tarixi (Context) — OpenAI/Groq messages formatiga moslash ──
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (Array.isArray(context) && context.length > 0) {
      for (const msg of context.slice(-8)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          conversationHistory.push({
            role: msg.role,
            content: String(msg.content || '').slice(0, 1500),
          })
        }
      }
    }

    // ── RAG qidiruvi: kontekstli qidiruv ──
    // Agar foydalanuvchi "qachon qabul qilingan?", "nechanchi moddada?" kabi qisqa savol bersa,
    // avvalgi suhbat mavzusini qo'shib qidiramiz, aks holda qidiruv mavzuni yo'qotadi.
    const lastUserQuery = conversationHistory
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || ''
    const ragQuery = `${lastUserQuery} ${message}`.trim()
    const relevantArticles = await retrieveLegalArticles(ragQuery || message, 6)
    const legalContext = buildLegalContext(relevantArticles)

    const systemPrompt = `Sen O'zbekiston Respublikasi qonunchiligi bo'yicha Oliy Yuridik Ekspert va AI Advokatsan. Faqat o'zbek tilida javob ber.

ASOSIY VAZIFANG:
Foydalanuvchining O‘zbekiston Respublikasi huquq tizimi va qonunchiligi bilan bog‘liq BARCHA savollariga (Konstitutsiya, fuqarolik, shartnoma, jinoyat, ma’muriy javobgarlik, sud jarayonlari, mehnat, oila, soliq, tadbirkorlik, mulk, meros, uy-joy, yer va boshqa sohalar) to‘liq, xatosiz, aniq sanalar va moddalarni ko‘rsatgan holda professional javob berish.

O‘ZBEKISTON RESPUBLIKASI KONSTITUTSIYASI VA ASOSIY QONUNLARINING RASMIY FAKTLARI:
1. KONSTITUTSIYA:
   - Ilk bor qabul qilingan sana: 1992-yil 8-dekabr (Oliy Kengashning 12-chaqiriq 11-sessiyasida qabul qilingan. 8-dekabr — Konstitutsiya kuni).
   - Yangi tahriri: 2023-yil 30-apreldagi umumxalq referendumi asosida qabul qilingan va 2023-yil 1-maydan kuchga kirgan.
   - Tuzilishi: Muqaddima, 6 ta bo‘lim, 27 ta bob, 155 ta modda.
   - 1-modda: "O‘zbekiston — boshqaruvning respublika shakliga ega bo‘lgan suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat."
   - 28-modda: Har bir shaxs o‘z shaxsiga, sha’ni va qadr-qimmatiga tajovuzlardan himoyalanish huquqiga ega.
   - 27-modda: Aybsizlik prezumpsiyasi (har bir shaxs uning jinoyat sodir etishdagi aybi qonunda nazarda tutilgan tartibda isbotlanmaguncha aybsiz hisoblanadi).

2. ASOSIY KODEKSLARNING RASMIY QABUL QILINGAN SANALARI:
   - Fuqarolik kodeksi: 1-qismi 1995-yil 21-dekabrda, 2-qismi 1996-yil 29-avgustda qabul qilingan, 1997-yil 1-martdan kuchga kirgan.
   - Yangi tahrirdagi Mehnat kodeksi: 2022-yil 28-oktabrda (O‘RQ-798-son) qabul qilingan, 2023-yil 30-apreldan kuchga kirgan.
   - Jinoyat kodeksi: 1994-yil 22-sentabrda qabul qilingan, 1995-yil 1-apreldan kuchga kirgan.
   - Jinoyat-protsessual kodeksi: 1994-yil 22-sentabrda qabul qilingan, 1995-yil 1-apreldan kuchga kirgan.
   - Oila kodeksi: 1998-yil 30-aprelda qabul qilingan, 1998-yil 1-sentabrdan kuchga kirgan.
   - Ma’muriy javobgarlik to‘g‘risidagi kodeks (MJtK): 1994-yil 22-sentabrda qabul qilingan, 1995-yil 1-apreldan kuchga kirgan.
   - Fuqarolik protsessual kodeksi (FPK): Yangi tahriri 2018-yil 22-yanvarda qabul qilingan, 2018-yil 1-apreldan kuchga kirgan.
   - Iqtisodiy protsessual kodeks (IPK): 2018-yil 24-yanvarda qabul qilingan, 2018-yil 1-apreldan kuchga kirgan.
   - Soliq kodeksi: Yangi tahriri 2019-yil 30-dekabrda qabul qilingan, 2020-yil 1-yanvardan kuchga kirgan.
   - Bojxona kodeksi: Yangi tahriri 2016-yil 20-yanvarda qabul qilingan, 2016-yil 21-apreldan kuchga kirgan.

3. FUNDAMENTAL HUQUQIY ME'YORLAR:
   - Da'vo muddati: umumiy da'vo muddati 3 yil (FK 150-modda).
   - Sinov muddati: xodim uchun ko'pi bilan 3 oy, rahbarlar uchun 6 oy (MK 129-modda).
   - Aliment miqdori: 1 bola uchun 1/4 qism, 2 bola uchun 1/3 qism, 3 va undan ortiq bola uchun daromadning 1/2 qismi (OK 99-modda).

QAT'IY QOIDALAR (HALLUCINATION QAT'IYAN TAQIQLANADI):
1. SUHBAT KONTEKSTIGA QAT'IY E'TIBOR BER: Agar foydalanuvchi "qachon qabul qilingan?", "moddalari nechta?", "kim tomonidan?" kabi davomiy savol bersa, bu savol BEVOSITA oldingi suhbatda ko'tarilgan mavzuga (masalan, Konstitutsiyaga) tegishli! Butun suhbat kontekstini hisobga olib javob ber.
2. SANALARNI VA MA'LUMOTLARNI TO'QIMA: Barcha kodekslarga bir xil soxta sana (masalan "1995-yil 27-mart") yozish QAT'IYAN TAQIQLANADI. Faqat yuqorida keltirilgan rasmiy qabul sanalari va moddalarini to'g'ri keltir.
3. KONSTITUTSIYA QABUL SANASI: Agar Konstitutsiya qachon qabul qilingan deb so'ralsa, 1992-yil 8-dekabrda qabul qilingani va 2023-yil 30-aprelda umumxalq referendumida yangi tahriri qabul qilinganini aniq tushuntir.

JAVOB FORMATI:
📘 Umumiy tushuncha
Mavzuning huquqiy mohiyatini sodda va tushunarli tilda izohla.

⚖️ Huquqiy izoh va tahlil
Qonunchilik talablari, huquq va majburiyatlar, yuridik oqibatlar yoki aniq sanalar.

📚 Tegishli moddalar va qonuniy asoslar
O‘zbekiston Respublikasining tegishli kodeks va qonun moddalarini aniq ko‘rsatib, har biriga qisqa izoh ber.

💡 Amaliy misol yoki yo‘l-yo‘riq
Hayotiy vaziyat yoki fuqaroning qadam-baqadam qilishi kerak bo‘lgan harakatlari.

✅ Xulosa va tavsiya
Yakuniy xulosa va amaliy yuridik maslahat.

BOSHQA QOIDALAR:
- ALIFBO: JAVOBLAR FAQAT LOTIN O‘ZBEK ALIFBOSIDA bo‘lsin. Kirill harflari MUTLAQO ISHLATILMAYDI.
- Bo‘lim sarlavhalarini 📘, ⚖️, 📚, 💡, ✅ belgilari bilan boshla.
- Har bir bo‘lim orasida bo‘sh qator qoldir.
- Javob uzunligi: 200-400 so‘z.
${legalContext}`

    // Call Gemini (primary) with Groq fallback
    const CANDIDATE_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b']

    const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ]

    const fullPromptForGemini =
      conversationHistory.length > 0
        ? `${conversationHistory.map(m => `${m.role === 'user' ? 'Foydalanuvchi' : 'AI Maslahatchi'}: ${m.content}`).join('\n\n')}\n\nFoydalanuvchi: ${message}`
        : message

    let responseText = ''
    let lastError = ''

    // ── 1. Google Gemini orqali javob (Birlamchi va bepul) ──
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await callGemini(fullPromptForGemini, {
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
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        try {
          const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: apiMessages,
              temperature: 0.1,
              frequency_penalty: 0.2,
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
