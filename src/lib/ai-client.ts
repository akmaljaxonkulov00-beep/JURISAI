/**
 * AI Client for Groq API
 * Uses Node.js https module directly to bypass SSL issues in development
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Make HTTPS request using Node.js native https module to bypass SSL issues
async function httpsRequest(url: string, options: any, body: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const https = require('https');
      const urlObj = new URL(url);

      const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: options.method || 'POST',
        headers: options.headers,
        rejectUnauthorized: process.env.NODE_ENV === 'production', // Production da true, development da false
      };

      const req = https.request(reqOptions, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              reject(new Error(`API Error ${res.statusCode}: ${parsed?.error?.message || data}`));
            } else {
              resolve({ ok: true, status: res.statusCode, data: parsed });
            }
          } catch {
            reject(new Error(`JSON parse error: ${data.substring(0, 200)}`));
          }
        });
      });

      req.on('error', (err: any) => reject(err));
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

export class AIClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GROQ_API_KEY;
    if (!this.apiKey) {
      console.warn('[!] GROQ_API_KEY not found');
    }
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY sozlanmagan');
    }

    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const requestBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 500,
      frequency_penalty: 0.6,
      presence_penalty: 0.3,
    });

    try {
      const result = await httpsRequest(
        GROQ_API_URL,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
        requestBody
      );

      const data = result.data;

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('AI dan javob olinmadi');
      }

      return {
        text: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Groq API bilan bog\'lanishda xatolik');
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
- 4 ta bo'lim ham bo'lishi SHART`;

    return this.chat({
      systemPrompt: context && context.trim() ? context : defaultPrompt,
      prompt: message,
      temperature: 0.15,
      maxTokens: 350,
    });
  }

  // IRAC Analysis
  async analyzeIRAC(caseText: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston huquq tizimi bo'yicha ekspert. IRAC metodologiyasi bo'yicha qisqa tahlil ber. O'zbek tilida.`,
      prompt: `IRAC tahlil qiling:\n\n${caseText}\n\nFormat:\n**ISSUE:** [masala]\n**RULE:** [qoidalar]\n**APPLICATION:** [qo'llash]\n**CONCLUSION:** [xulosa]`,
      temperature: 0.3,
      maxTokens: 800,
    });
  }

  // Document Generation
  async generateDocument(docType: string, details: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston huquqiy hujjatlar mutaxassisissan. Rasmiy uslubda hujjat yarat.`,
      prompt: `"${docType}" hujjat yarating:\n\n${details}`,
      temperature: 0.2,
      maxTokens: 1500,
    });
  }

  // Weakness Detection
  async detectWeaknesses(argument: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen huquqiy argument tahlilchisan. Zaif tomonlarni topib, takliflar ber. O'zbek tilida.`,
      prompt: `Argumentni tahlil qiling:\n\n${argument}\n\nFormat:\n**ZAIF TOMONLAR:**\n- ...\n**KUCHLI TOMONLAR:**\n- ...\n**TAKLIFLAR:**\n- ...`,
      temperature: 0.3,
      maxTokens: 600,
    });
  }

  // Scenario Generation
  async generateScenario(topic: string, difficulty: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen ta'lim uchun huquqiy stsenariylar yaratuvchisan. O'zbekiston qonunchiligiga asoslan.`,
      prompt: `"${topic}" mavzusida "${difficulty}" darajasida stsenariy yarat.`,
      temperature: 0.7,
      maxTokens: 800,
    });
  }

  // Court Simulation
  async simulateCourt(caseDetails: string): Promise<AIResponse> {
    return this.chat({
      systemPrompt: `Sen O'zbekiston sudyasissan. Sud jarayonini qisqa va rasmiy tarzda olib bor.`,
      prompt: `Sud jarayoni: ${caseDetails}`,
      temperature: 0.4,
      maxTokens: 600,
    });
  }
}

// Singleton instance
export const aiClient = new AIClient();

