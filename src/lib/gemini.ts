/**
 * gemini.ts — JURISTIV Google Gemini Legal AI Engine
 * O‘zbekiston Respublikasi qonunchiligi asosidagi ixtisoslashgan AI dvigateli.
 * Modellar: gemini-3-flash-preview, gemini-3.5-flash-lite, gemini-3.5-flash
 */

import { ensureUzbekLatin } from './uz-latin'

const apiKey = process.env.GEMINI_API_KEY;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const CANDIDATE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
]

/**
 * O‘zbekiston Respublikasi Qonunchiligi bo‘yicha fundamental tizim direktivasi.
 * Har bir so‘rovda Gemini ushbu chuqur yuridik baza asosida ish ko‘radi.
 */
export const UZBEK_LEGAL_SYSTEM_INSTRUCTION = `
Siz JURISTIV platformasining O‘zbekiston Respublikasi qonunchiligi bo‘yicha ixtisoslashgan Oliy Yuridik Eksperti, Universitet Professori va Virtual Sud maslahatchisisiz.

ASOSIY VAZIFALARINGIZ VA PRINSIPLARINGIZ:
1. UNIVERSAL HUQUQIY BAZA VA MANBALAR:
   Barcha tahlil va javoblaringiz O‘zbekiston Respublikasining butun qonunchilik tizimiga, amaldagi normativ-huquqiy hujjatlarga (lex.uz) va huquq nazariyasiga asoslanadi:
   - O‘zbekiston Respublikasi Konstitutsiyasi: Oliy yuridik kuchga ega asosiy qonun (Ilk tahrir: 1992-yil 8-dekabrda 12-chaqiriq Oliy Kengashning 11-sessiyasida qabul qilingan; Yangi tahrir: 2023-yil 30-aprelda umumxalq referendumida qabul qilinib, 2023-yil 1-maydan kuchga kirgan; Aniq tuzilishi: Muqaddima, 6 ta bo‘lim, 27 ta bob, 155 ta modda). Xalq — davlat hokimiyatining birdan-bir manbaidir.
   - Barcha amaldagi kodekslar: Fuqarolik (FK), Fuqarolik protsessual (FPK), Jinoyat (JK), Jinoyat-protsessual (JPK), Jinoyat-ijroiya (JIK), Ma’muriy javobgarlik (MJtK), Ma’muriy sud ishlarini yuritish (MSIYUK), Yangi Mehnat (MK), Oila (OK), Soliq (SK), Bojxona (BK), Budjet (BK), Saylov (SK), Uy-joy (UJK), Yer (YK), Shaharsozlik (ShK), Havo (HK), Suv (SK), Iqtisodiy protsessual (IPK), Tadbirkorlik kodeksi (TK).
   - Maxsus qonunlar: "Davlat xaridlari to‘g‘risida", "Raqobat to‘g‘risida", "Iste’molchilarning huquqlarini himoya qilish to‘g‘risida", "Advokatura to‘g‘risida", "Notariat to‘g‘risida", "Sud hujjatlari va boshqa organlar hujjatlarini ijro etish to‘g‘risida" (MIB), "To‘lovga qobiliyatsizlik to‘g‘risida", "Tadbirkorlik faoliyati erkinligining kafolatlari to‘g‘risida", "Mulkchilik to‘g‘risida", "Ijara to‘g‘risida", "Garov to‘g‘risida", "Sug‘urta faoliyati to‘g‘risida" va boshqa barcha sohaviy qonunlar.
   - Qonunosti hujjatlari: O‘zbekiston Respublikasi Prezidenti farmon va qarorlari, Vazirlar Mahkamasi qarorlari.
   - Sud amaliyoti: O‘zbekiston Respublikasi Oliy sudi Plenumi qarorlari, Konstitutsiyaviy sud qarorlari.
   - Nazariy va doktrinal asoslar: Davlat va huquq nazariyasi, fuqarolik huquqi nazariyasi, kriminologiya, jinoyat huquqi prinsiplari, sud ekspertizasi va yuridik mantiq.

2. TIL VA YURIDIK TERMINOLOGIYA:
   - Barcha javoblar faqat O‘zbek lotin alifbosida, sof adabiy, rasmiy yuridik tilda va yuqori darajadagi mantiqiy asoslanganlikda bo‘lishi shart.
   - Moddalar, qismlar va bandlar aniq keltiriladi. Mavjud bo‘lmagan moddalarni yoki sanalarni to‘qib chiqarish (hallucination) qat’iyan man etiladi.
   - Agar foydalanuvchi qonunning qabul qilinish tarixini maxsus so‘ramagan bo‘lsa, qabul qilingan yillarni ortiqcha to‘qimasdan, to‘g‘ridan-to‘g‘ri amaldagi norma, moddaning amaliy talablari, javobgarlik yoki huquqiy yechimini aniq tushuntiring.

3. KAZUSLAR VA MUAMMOLARNI TAHLIL QILISH METODOLOGIYASI (IRAC):
   - I (Issue / Muammo): Nizoning huquqiy mohiyati va yechilishi lozim bo‘lgan asosiy huquqiy savol.
   - R (Rule / Huquqiy qoida): Ushbu munosabatni tartibga soluvchi aniq moddalar va qonun talablari.
   - A (Application / Tahlil va qo‘llash): Faktik holatlarning qonun normasiga muvofiqligi (subsumpsiya), sub’ektlarning harakatlariga huquqiy baho.
   - C (Conclusion / Xulosa): Yakuniy qat’iy huquqiy xulosa, tomonlarning huquq va majburiyatlari hamda yechim.

4. PROTSESSUAL ROLLAR (VIRTUAL SUD):
   - SUDYA: Xolisona baho, protsessual tartib, qonuniy va asosli ajrim/hukm.
   - PROKUROR: Davlat ayblovini himoya qilish, qonuniylik nazorati, huquqbuzarlik tarkibini isbotlash.
   - ADVOKAT: Manfaatlarni himoya qilish, oqlovchi va yengillashtiruvchi holatlar, protsessual arizalar.
`.trim()

export interface GeminiOptions {
  temperature?: number
  maxTokens?: number
  systemInstruction?: string
  responseJson?: boolean
}

async function postJson(url: string, bodyObj: any): Promise<any> {
  const bodyStr = JSON.stringify(bodyObj)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const https = require('https')
  const urlObj = new URL(url)

  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(bodyStr)),
      },
      rejectUnauthorized: process.env.NODE_ENV === 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
    }

    const req = https.request(reqOptions, (res: any) => {
      let data = ''
      res.on('data', (chunk: any) => {
        data += String(chunk || '')
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if ((res.statusCode || 0) >= 400) {
            reject(new Error(`API Error ${res.statusCode}: ${parsed?.error?.message || data}`))
          } else {
            resolve(parsed)
          }
        } catch {
          reject(new Error(`JSON parse error: ${data.slice(0, 200)}`))
        }
      })
    })

    req.setTimeout(8000, () => {
      req.destroy(new Error('Gemini so‘rov vaqti tugadi (8s timeout)'))
    })

    req.on('error', (err: Error) => reject(err))
    req.write(bodyStr)
    req.end()
  })
}

/**
 * Gemini modeliga to'g'ridan-to'g'ri so'rov yuborish (Avtomatik fallback bilan).
 */
export async function callGemini(prompt: string, options: GeminiOptions = {}): Promise<string> {
  const activeKey = process.env.GEMINI_API_KEY || apiKey
  if (!activeKey) {
    throw new Error('GEMINI_API_KEY topilmadi')
  }

  // Test muhitida mock kalit berilgan bo‘lsa, xavfsiz deterministik javob qaytarish
  if (activeKey.startsWith('test-') || activeKey === 'mock-key') {
    if (options.responseJson) {
      return JSON.stringify({
        status: 'success',
        code: 'JPK',
        article: '405',
        articleNumber: '405',
        title: 'Sud majlisini ochish',
        explanation: 'O‘zbekiston Respublikasi Jinoyat-protsessual kodeksining 405-moddasi bo‘yicha tushuntirish',
        issue: 'Sud majlisini ochish tartibi',
        rules: [{ code: 'JPK', article: '405', text: 'Raislik etuvchi sud majlisini ochadi' }],
        analysis: 'Sud majlisi ochiq deb e’lon qilinadi.',
        conclusion: 'JPK 405-modda talablariga rioya etildi.',
        recommendations: ['Sud tergovini belgilangan tartibda boshlash'],
      })
    }
    return ensureUzbekLatin(
      'O‘zbekiston Respublikasi Mehnat kodeksining 161-moddasiga muvofiq mehnat shartnomasini bekor qilishning aniq asoslari va kafolatlari belgilangan.'
    )
  }

  const sysInstruction = options.systemInstruction
    ? `${UZBEK_LEGAL_SYSTEM_INSTRUCTION}\n\nQo‘shimcha vazifa:\n${options.systemInstruction}`
    : UZBEK_LEGAL_SYSTEM_INSTRUCTION

  const requestBody: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: sysInstruction }],
    },
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens ?? 8192,
    },
  }

  if (options.responseJson) {
    requestBody.generationConfig.responseMimeType = 'application/json'
  }

  let lastError: Error | null = null
  let attempts = 0

  // Candidate Gemini modellari bo'yicha ketma-ket urinib ko'rish
  for (const model of CANDIDATE_GEMINI_MODELS) {
    attempts++
    try {
      const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${activeKey}`
      const data = await postJson(url, requestBody)

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText && typeof rawText === 'string') {
        return ensureUzbekLatin(rawText.trim())
      }
    } catch (err: any) {
      console.warn(`Gemini model [${model}] bilan xatolik yuz berdi:`, err.message)
      lastError = err
      // Agar ketma-ket 2 ta model 429 bergan bo'lsa, zaxira provayderga (Groq) o'tish
      if (err.message.includes('429') && attempts >= 2) {
        break
      }
    }
  }

  throw lastError || new Error('Barcha Gemini modellarida so‘rov bajarilmadi.')
}

/**
 * Gemini JSON generatori: Model bergan JSON javobni avtomatik parslaydi va tekshiradi.
 */
export async function callGeminiJson<T = any>(
  prompt: string,
  options: Omit<GeminiOptions, 'responseJson'> = {}
): Promise<T> {
  const jsonPrompt = `${prompt}\n\nMUHIM: Javobni FAQAT to‘g‘ri JSON formatida qaytaring. Markdown bloklari (\`\`\`json ...) qo‘shmang.`
  const text = await callGemini(jsonPrompt, { ...options, responseJson: true })

  try {
    // Trim potential markdown wrappers if model still outputs them
    let cleanJson = text.trim()
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7)
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3)
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3)
    }
    return JSON.parse(cleanJson.trim()) as T
  } catch (err) {
    console.error('Gemini JSON parse xatoligi. Javob matni:', text)
    throw new Error(`Gemini qaytargan JSON ni o‘qib bo‘lmadi: ${(err as Error).message}`)
  }
}

/**
 * IRAC Usulida Kazus Yechish Dvigateli
 */
export async function analyzeCaseWithGemini(caseDetails: {
  title: string
  facts: string
  disputeCategory?: string
  questions?: string
}): Promise<{
  issue: string
  rules: Array<{ code: string; article: string; text: string }>
  analysis: string
  conclusion: string
  recommendations: string[]
}> {
  const prompt = `
QUYIDAGI HUQUQIY KAZUSNI O‘ZBEKISTON QONUNCHILIGI BO‘YICHA IRAC METODI BILAN TAHLIL QILING:

ISh NOMI: ${caseDetails.title}
TOIFA: ${caseDetails.disputeCategory || 'Umumiy huquqiy nizo'}
ISHNING HAQIQIY HOLATLARI (FAKTLAR):
${caseDetails.facts}

${caseDetails.questions ? `SAVOLLAR / TALABLAR:\n${caseDetails.questions}` : ''}

Quyidagi JSON strukturasida javob bering:
{
  "issue": "Nizoning asosiy huquqiy muammosi",
  "rules": [
    { "code": "Kodeks nomi (masalan: Mehnat kodeksi)", "article": "Modda raqami (masalan: 161-modda)", "text": "Qonun normasi qisqacha mazmuni" }
  ],
  "analysis": "Faktlarning qonun normasiga nisbati (subsumpsiya va chuqur tahlil)",
  "conclusion": "Yakuniy aniq huquqiy xulosa",
  "recommendations": ["Amaliy tavsiya 1", "Amaliy tavsiya 2"]
}
`.trim()

  return callGeminiJson(prompt, {
    systemInstruction:
      'Siz O‘zbekiston Respublikasi yuridik fanlari bo‘yicha ekspert-huquqshunossiz. Kazusni qat’iy IRAC uslubida yeching.',
    temperature: 0.2,
  })
}

/**
 * Yuridik Maslahat Chati (Legal Assistant)
 */
export async function consultLegalAssistant(
  userQuery: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  const historyText =
    history.length > 0
      ? `OLDINGI SUHBAT TARIXI:\n${history.map(h => `${h.role === 'user' ? 'Foydalanuvchi' : 'Maslahatchi'}: ${h.content}`).join('\n')}\n\n`
      : ''

  const prompt = `
${historyText}FOYDALANUVCHINING SAVOLI:
${userQuery}

Iltimos, O‘zbekiston Respublikasi amaldagi qonunlari asosida batafsil, xushmuomala, tushunarli va qonun moddalariga havola qilgan holda to‘liq maslahat bering.
`.trim()

  return callGemini(prompt, {
    systemInstruction:
      'Siz JURISTIV yuridik maslahatchisisiz. Fuqarolarga ularning qonuniy huquqlari va sudga murojaat qilish tartibini tushuntiring.',
    temperature: 0.3,
  })
}
