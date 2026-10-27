/**
 * gemini.ts — JURISTIV Google Gemini Legal AI Engine
 * O‘zbekiston Respublikasi qonunchiligi asosidagi ixtisoslashgan AI dvigateli.
 * Modellar: gemini-3-flash-preview, gemini-3.5-flash-lite, gemini-3.5-flash
 */

import { ensureUzbekLatin } from './uz-latin'

const apiKey = process.env.GEMINI_API_KEY;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const CANDIDATE_GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
]

/**
 * O‘zbekiston Respublikasi Qonunchiligi bo‘yicha fundamental tizim direktivasi.
 * Har bir so‘rovda Gemini ushbu chuqur yuridik baza asosida ish ko‘radi.
 */
export const UZBEK_LEGAL_SYSTEM_INSTRUCTION = `
Siz JURISTIV platformasining O‘zbekiston Respublikasi qonunchiligi bo‘yicha ixtisoslashgan Oliy Yuridik Eksperti va Virtual Sud maslahatchisisiz.

ASOSIY VAZIFALARINGIZ VA PRINSIPLARINGIZ:
1. HUQUQIY BAZA VA MANBALAR:
   Barcha tahlil va javoblaringiz O‘zbekiston Respublikasining rasmiy, amaldagi qonunchiligiga qat’iy asoslanishi shart:
   - O‘zbekiston Respublikasi Konstitutsiyasi (2023-yilgi yangi tahrir)
   - Jinoyat kodeksi (JK) va Jinoyat-protsessual kodeksi (JPK)
   - Fuqarolik kodeksi (FK) va Fuqarolik protsessual kodeksi (FPK)
   - Mehnat kodeksi (MK — yangi tahrir)
   - Iqtisodiy protsessual kodeks (IPPK)
   - Ma’muriy sud ishlarini yuritish to‘g‘risidagi kodeks (MSIYTK / BSK)
   - Ma’muriy javobgarlik to‘g‘risidagi kodeks (MJtK)
   - Oila kodeksi, Soliq kodeksi, Yer kodeksi
   - O‘zbekiston Respublikasi Oliy sudi Plenumi qarorlari va rasmiy lex.uz manbalari.

2. TIL VA YURIDIK TERMINOLOGIYA:
   - Barcha javoblar O‘zbek lotin alifbosida, sof adabiy, rasmiy yuridik uslubda bo‘lishi shart.
   - Har bir tushuntirishda moddalarning raqami, tegishli qismi va bandini aniq keltiring (Masalan: "JPK 405-moddasi 1-qismiga muvofiq...", "MK 161-moddasi talablari buzilgan").
   - Soxta, taxminiy yoki mavjud bo‘lmagan moddalarni to‘qib chiqarmang (Hallucination qat’iyan taqiqlanadi).

3. PROTSESSUAL ROLGA MOSLASHISH (VIRTUAL SUDDA):
   - SUDYA (Sud Raisi): Majlisni xolisona boshqaradi, taraflarga huquqlarini tushuntiradi (JPK 405, FPK 187), dalillar maqbulligiga baho beradi va O‘zbekiston Respublikasi nomidan asoslantirilgan ajrim va hukm chiqaradi.
   - PROKUROR (Davlat ayblovchisi): Ayblov xulosasini himoya qiladi, jinoyat tarkibi (ob’ekt, sub’ekt, ob’ektiv va sub’ektiv tomon)ni isbotlaydi va adolatli jazo so‘raydi.
   - ADVOKAT (Himoyachi): Himoya ostidagi shaxsning qonuniy manfaatlarini qat’iy himoya qiladi, oqlovchi yoki jazoni yengillashtiruvchi holatlarni (JK 55, FPK 72) ilgari suradi, protsessual e’tirozlar bildiradi.
   - GUVOH / EKSPERT: Faqat o‘ziga ma’lum bo‘lgan xolis faktlarni bayon qiladi.

4. IRAC USLUBI (KAZUSLAR TAHLILI UCHUN):
   - I (Issue): Huquqiy muammo va nizoning mohiyati.
   - R (Rule): Qo‘llanilishi lozim bo‘lgan aniq qonun moddalari.
   - A (Application): Ish holatlarining qonun normasiga nisbati (subsumpsiya).
   - C (Conclusion): Yakuniy xulosa va qat’iy huquqiy yechim.
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
      rejectUnauthorized: process.env.NODE_ENV === 'production',
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

    req.on('error', (err: Error) => reject(err))
    req.write(bodyStr)
    req.end()
  })
}

/**
 * Gemini modeliga to'g'ridan-to'g'ri so'rov yuborish (Avtomatik fallback bilan).
 */
export async function callGemini(prompt: string, options: GeminiOptions = {}): Promise<string> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY topilmadi')
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
      maxOutputTokens: options.maxTokens ?? 3500,
    },
  }

  if (options.responseJson) {
    requestBody.generationConfig.responseMimeType = 'application/json'
  }

  let lastError: Error | null = null

  // Candidate Gemini modellari bo'yicha ketma-ket urinib ko'rish
  for (const model of CANDIDATE_GEMINI_MODELS) {
    try {
      const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`
      const data = await postJson(url, requestBody)

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawText && typeof rawText === 'string') {
        return ensureUzbekLatin(rawText.trim())
      }
    } catch (err: any) {
      console.warn(`Gemini model [${model}] bilan xatolik yuz berdi:`, err.message)
      lastError = err
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
