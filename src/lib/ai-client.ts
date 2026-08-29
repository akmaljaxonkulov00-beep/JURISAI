/**
 * AI Client for Groq API
 * Uses Node.js https module directly to bypass SSL issues in development
 */

import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// AI javoblari lotin o'zbek alifbosida bo'lishini kafolatlash
import { ensureUzbekLatin } from './uz-latin'

export interface AIRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface AIResponse {
  text: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

interface HttpsResult {
  ok: boolean
  status?: number
  data: {
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    error?: { message?: string }
  }
}

// Make HTTPS request using Node.js native https module to bypass SSL issues
async function httpsRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> },
  body: string
): Promise<HttpsResult> {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const https = require('https')
      const urlObj = new URL(url)

      const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: options.method || 'POST',
        headers: options.headers,
        rejectUnauthorized: process.env.NODE_ENV === 'production', // Production da true, development da false
      }

      const req = https.request(
        reqOptions,
        (res: { statusCode?: number; on: (ev: string, cb: (chunk?: unknown) => void) => void }) => {
          let data = ''
          res.on('data', (chunk?: unknown) => {
            data += String(chunk || '')
          })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data)
              if ((res.statusCode || 0) >= 400) {
                reject(new Error(`API Error ${res.statusCode}: ${parsed?.error?.message || data}`))
              } else {
                resolve({ ok: true, status: res.statusCode, data: parsed })
              }
            } catch {
              reject(new Error(`JSON parse error: ${data.substring(0, 200)}`))
            }
          })
        }
      )

      req.on('error', (err: Error) => reject(err))
      req.write(body)
      req.end()
    } catch (err) {
      reject(err)
    }
  })
}

export class AIClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GROQ_API_KEY
    if (!this.apiKey) {
      console.warn('[!] GROQ_API_KEY not found')
    }
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY sozlanmagan')
    }

    // Generate MD5 hash of prompt + systemPrompt to use as unique cache key
    const promptHash = crypto
      .createHash('md5')
      .update(JSON.stringify({ prompt: request.prompt, systemPrompt: request.systemPrompt }))
      .digest('hex')

    // ── 1. Check DB Cache (less than 24h old) ──
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: cachedRow } = await supabase
        .from('ai_response_cache')
        .select('response')
        .eq('prompt_hash', promptHash)
        .gte('created_at', yesterday)
        .maybeSingle()

      if (cachedRow?.response) {
        console.log(`[Cache Hit] Returning cached response for hash: ${promptHash}`)
        return {
          text: cachedRow.response,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        }
      }
    } catch (err) {
      console.warn('[Cache Query Error] Proceeding to call LLM:', err)
    }

    const messages: Array<{ role: string; content: string }> = []

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt })
    }
    messages.push({ role: 'user', content: request.prompt })

    const requestBody = JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 1500,
      frequency_penalty: 0.6,
      presence_penalty: 0.3,
    })

    try {
      const result = await httpsRequest(
        GROQ_API_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': String(Buffer.byteLength(requestBody)),
          },
        },
        requestBody
      )

      const data = result.data

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('AI dan javob olinmadi')
      }

      const responseText = ensureUzbekLatin(data.choices[0].message.content)

      // ── 2. Save to Cache (non-blocking in background) ──
      try {
        supabase
          .from('ai_response_cache')
          .insert({
            prompt_hash: promptHash,
            prompt: request.prompt,
            system_prompt: request.systemPrompt || '',
            response: responseText,
          })
          .then(({ error }) => {
            if (error && error.code !== '23505') {
              console.warn('[Cache Save Error]:', error.message)
            }
          })
      } catch (err) {
        console.warn('[Cache Catch Error]:', err)
      }

      return {
        text: responseText,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error("Groq API bilan bog'lanishda xatolik")
    }
  }

  // AI Assistant chat
  async chatMessage(message: string, context?: string): Promise<AIResponse> {
    // Agar maxsus prompt berilgan bo'lsa (masalan sud simulyatori) — o'shani ishlatamiz
    const defaultPrompt = `Sen O'zbekiston huquq bo'yicha professional AI yordamchisan.

JAVOBNI ANIQ SHU FORMATDA, SHU EMOJILAR BILAN BER (boshqacha emas):

▣ QISQA JAVOB:
Bir jumlada asosiy javob.

▣ ASOSIY MA'LUMOT:
• Birinchi muhim fakt
• Ikkinchi muhim fakt
• Uchinchi muhim fakt

═ QONUN:
• Tegishli kodeks va modda raqami
• Yana bir modda (agar bo'lsa)

☼ MASLAHAT:
• Bitta aniq amaliy maslahat

QAT'IY QOIDALAR:
- Har bir bo'lim yangi qatordan boshlansin
- Punktlar • belgisi bilan
- Maksimal 130 so'z
- Sodda, tushunarli o'zbek tili
- FAQAT LOTIN ALIFBOSIDA — kirill harflari (ў, қ, ғ, ҳ, ё, ж) ishlatilmaydi
- 4 ta bo'lim ham bo'lishi SHART`

    return this.chat({
      systemPrompt: context && context.trim() ? context : defaultPrompt,
      prompt: message,
      temperature: 0.15,
      maxTokens: 1024,
    })
  }

  // IRAC Analysis
  async analyzeIRAC(caseText: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston huquq tizimi bo'yicha ekspert. IRAC metodologiyasi bo'yicha qisqa tahlil ber. O'zbek tilida.`,
      prompt: `IRAC tahlil qiling:\n\n${caseText}\n\nFormat:\n**ISSUE:** [masala]\n**RULE:** [qoidalar]\n**APPLICATION:** [qo'llash]\n**CONCLUSION:** [xulosa]`,
      temperature: 0.3,
      maxTokens: 1500,
    })
  }

  // Document Generation
  async generateDocument(docType: string, details: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston huquqiy hujjatlar mutaxassisissan. Rasmiy uslubda hujjat yarat.`,
      prompt: `"${docType}" hujjat yarating:\n\n${details}`,
      temperature: 0.2,
      maxTokens: 2500,
    })
  }

  // Weakness Detection
  async detectWeaknesses(argument: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen huquqiy argument tahlilchisan. Zaif tomonlarni topib, takliflar ber. O'zbek tilida.`,
      prompt: `Argumentni tahlil qiling:\n\n${argument}\n\nFormat:\n**ZAIF TOMONLAR:**\n- ...\n**KUCHLI TOMONLAR:**\n- ...\n**TAKLIFLAR:**\n- ...`,
      temperature: 0.3,
      maxTokens: 1200,
    })
  }

  // Scenario Generation
  async generateScenario(topic: string, difficulty: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen ta'lim uchun huquqiy stsenariylar yaratuvchisan. O'zbekiston qonunchiligiga asoslan.`,
      prompt: `"${topic}" mavzusida "${difficulty}" darajasida stsenariy yarat.`,
      temperature: 0.7,
      maxTokens: 1500,
    })
  }

  // Court Simulation
  async simulateCourt(caseDetails: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston sudyasissan. Sud jarayonini qisqa va rasmiy tarzda olib bor.`,
      prompt: `Sud jarayoni: ${caseDetails}`,
      temperature: 0.4,
      maxTokens: 1200,
    })
  }
}

// Singleton instance
export const aiClient = new AIClient()
