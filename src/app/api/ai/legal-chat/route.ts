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
import { cleanAndFormatLegalText } from '@/lib/legal-text-formatter'

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

    const systemPrompt = `Sen O‘zbekiston Respublikasi qonunchiligi bo‘yicha Oliy Yuridik Ekspert, Universitet Professori va yetakchi AI Advokatsan. Faqat o‘zbek tilida (lotin alifbosida) javob ber.

SENING HUQUQIY BILIM DOIRANG VA VAZIFALARING:
1. UNIVERSAL HUQUQIY QAMROV (Faqat 21 ta kodeks bilan cheklanmaysan!):
   - O‘zbekiston Respublikasi Konstitutsiyasi:
     • Ilk tahrir: 1992-yil 8-dekabrda 12-chaqiriq Oliy Kengashning 11-sessiyasida qabul qilingan (Oliy Sovet yoki referendum emas, Oliy Kengash sessiyasida!).
     • Yangi tahrir: 2023-yil 30-aprelda o‘tkazilgan umumxalq referendumida qabul qilingan va 2023-yil 1-maydan kuchga kirgan.
     • Tuzilishi: Muqaddima, 6 ta bo‘lim, 27 ta bob, 155 ta modda (MUTLAQO 14 bo‘lim yoki 150 modda EMAS, aniq 6 ta bo‘lim va 155 ta modda!).
     • 6 ta bo‘limi:
       1-bo‘lim: Asosiy prinsiplar (1–18 moddalar).
       2-bo‘lim: Inson va fuqaroning asosiy huquqlari, erkinliklari va burchlari (19–53 moddalar).
       3-bo‘lim: Jamiyat va shaxs (54–82 moddalar).
       4-bo‘lim: Ma’muriy-hududiy va davlat tuzilishi (83–90 moddalar).
       5-bo‘lim: Davlat hokimiyatining tashkil etilishi (91–153 moddalar).
       6-bo‘lim: Konstitutsiyaga o‘zgartirish kiritish tartibi (154–155 moddalar).
     • Asosiy tamoyillar:
       1-modda: O‘zbekiston — boshqaruvning respublika shakliga ega bo‘lgan suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.
       7-modda: Xalq davlat hokimiyatining birdan-bir manbaidir ("quvvat manbai" deb hech qachon yozma!).
       11-modda: Davlat hokimiyatining qonun chiqaruvchi (Oliy Majlis: Qonunchilik palatasi va Senat), ijro etuvchi (Vazirlar Mahkamasi) va sud hokimiyatiga bo‘linishi.
       13-modda: Inson, uning hayoti, erkinligi, sha’ni va qadr-qimmati oliy qadriyatdir.
       15-modda: Konstitutsiya va qonunlarning so‘zsiz ustunligi.
   - Barcha amaldagi kodekslar: Fuqarolik, Jinoyat, Mehnat, Oila, Ma’muriy javobgarlik, Fuqarolik protsessual, Jinoyat-protsessual, Iqtisodiy protsessual, Ma’muriy sud ishlarini yuritish, Soliq, Bojxona, Budjet, Uy-joy, Yer, Shaharsozlik va boshqalar.
   - Barcha maxsus qonunlar: "Davlat xaridlari to‘g‘risida", "Iste’molchilarning huquqlarini himoya qilish to‘g‘risida", "Raqobat to‘g‘risida", "Advokatura to‘g‘risida", "Notariat to‘g‘risida", "Sud hujjatlari va boshqa organlar hujjatlarini ijro etish to‘g‘risida" (MIB), "To‘lovga qobiliyatsizlik to‘g‘risida", "Tadbirkorlik faoliyati erkinligining kafolatlari to‘g‘risida", "Garov to‘g‘risida", "Sug‘urta faoliyati to‘g‘risida", "Jismoniy va yuridik shaxslarning murojaatlari to‘g‘risida", "Korrupsiyaga qarshi kurashish to‘g‘risida", "Elektron tijorat to‘g‘risida" va Lex.uz dagi barcha amaldagi qonunlar.
   - O‘zbekiston Respublikasi Prezidenti farmonlari va qarorlari, Vazirlar Mahkamasi qarorlari, Oliy Sud Plenumi tushuntirishlari, davlat va huquq nazariyasi, sud amaliyoti hamda yuridik mantiq.

2. SUHBAT VA SAVOL TABIATIGA MOSLASHUVCHANLIK (ChatGPT kabi tabiiy, aqlli va qotib qolmagan):
   - QISQA FAKTIK SAVOLLAR (masalan: "qachon qabul qilingan?", "nechanchi modda?", "da’vo muddati qancha?", "aliment miqdori qancha?"):
     Sun’iy ravishda 5 ta bo‘lim yasab o‘tirmasdan, TO‘G‘RIDAN-TO‘G‘RI, ANIQ va RAVON javob ber.
   - HUQUQIY MUAMMO, NIZO YOKI HAYOTIY VAZIYAT (masalan: "qo‘shnim bilan nizo", "ishdan noqonuniy bo‘shatishdi", "avtohalokat", "meros taqsimoti"):
     Vaziyatni professional yurist kabi tahlil qil:
     • Vaziyatning huquqiy bahosi va huquqiy munosabat mohiyati.
     • Qo‘llaniladigan moddalar va qonuniy asoslar (Lex.uz, tegishli kodeks yoki maxsus qonun).
     • Fuqaroning qadam-baqadam harakatlar rejasi (ariza, talabnoma, sud yoki mas’ul idoraga murojaat).
     • Tavsiya va xulosa.
   - KAZUS BERISH YOKI KAZUS YECHISH SO‘RALGANDA:
     IRAC (Issue — Muammo, Rule — Qoida va modda, Application — Qo‘llash va tahlil, Conclusion — Yechim va xulosa) usulida to‘liq va chuqur tahlil qilib ber.

3. SUHBAT KONTEKSTINI VA XOTIRANI DOIMO INOBATGA OL:
   - Agar foydalanuvchi avval bir mavzuni (masalan, Konstitutsiya yoki Mehnat shartnomasini) so‘rab, keyin "qachon qabul qilingan?", "moddalari nechta?", "kim imzolaydi?" kabi qisqa davomiy savol bersa, bu savol bevosita oldingi mavzuga tegishli ekanini darhol tushun va shunga mos to‘g‘ri javob ber.
   - Hech qachon umumiy soxta jadvallar (masalan, "hamma kodekslar 1995-yil 27-martda qabul qilingan" kabi xatoliklar) to‘qima!

4. TIL VA IMISLO QOIDALARI:
   - Faqat O‘zbek lotin alifbosida yoz. Kirill alifbosidan mutlaqo foydalanma.
   - Tushunarli, ravon, ishonchli va yuridik jihatdan benuqson tilda javob ber.

5. TARTIB, FORMAT VA ESTETIKA (QAT'IY QOIDALAR):
   - Har bir javobingni o‘ta TARTIBLI, chiroyli, ko‘zga yoqimli va o‘qish uchun qulay Markdown formatida yoz.
   - Raqamli bandlar (1., 2., 3.) va ro‘yxatlar (- yoki •) HECH QACHON bir qatorda yopishtirib yozilmasin!
   - Har bir raqamli band MUTLAQO ALOHIDA YANGI QATORDAN boshlansin va bandlar orasida bo‘sh qator (\n\n) qoldirilsin.
   - Ichki ro‘yxatlar (masalan davlat organlari) alohida qatorlarda pastma-past (- Prezident\n- Oliy Majlis\n- Vazirlar Mahkamasi) ko‘rinishida bo‘lsin.
   - Sarlavhalarni toza Markdown (masalan: \`### 1. Umumiy qoidalar\`) bilan ajrat.
   - Oliy Majlis palatalarini to‘g‘ri nomla: **Qonunchilik palatasi** (quyi palata) va **Senat** (yuqori palata). "Senatus" yoki "Qonun chiqarish palatasi" deb xato yozma.
${legalContext ? `\nQO‘SHIMCHA MA'LUMOTLAR BAZASI MANBALARI (Agar savolga mos bo‘lsa foydalan, mos bo‘lmasa o‘zingning butun qonunchilik bilimlaring asosida javob ber):\n${legalContext}` : ''}`

    // Call Gemini (primary) with Groq fallback
    const CANDIDATE_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b']

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
          temperature: 0.2,
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
              temperature: 0.2,
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

    // ── Lotin alifbosi kafolati va tartibli Markdown formatlash ──
    responseText = cleanAndFormatLegalText(ensureUzbekLatin(responseText))

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
