import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT =
  "You are JurisAI Document Analyzer — an expert legal document analysis system specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).\n\n" +
  'STRICT RULES:\n' +
  '1. ACCURACY FIRST: You must NEVER invent or hallucinate legal articles (moddalar) or punishments.\n' +
  '2. FORMATTING: Use clean Markdown with headings, bold terms, and bullet points.\n' +
  "3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili), LATIN ALPHABET ONLY. NEVER use Cyrillic letters (ў, қ, ғ, ҳ, ё, ж).\n\n" +
  'Analyze the legal document and provide:\n' +
  '- Hujjatning qisqa tavsifi\n' +
  '- Qonunchilikka moslik tekshiruvi\n' +
  "- Mumkin bo'lgan huquqiy risklar\n" +
  '- Tavsiyalar va takliflar\n' +
  '- Tegishli qonun moddalari\n\n' +
  "MUHIM: Agar aniq modda raqamini bilmasangiz, taxmin qilmang. Hech qachon yolg'on ma'lumot bermang."

const BASE_SYSTEM_PROMPT = SYSTEM_PROMPT

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentText, documentType } = body

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { error: "Hujjat matni kamida 50 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }
    if (documentText.length > 30000) {
      return NextResponse.json(
        { error: 'Hujjat matni juda katta — maksimal 30 000 belgi' },
        { status: 400 }
      )
    }
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 503 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    // (identity FAQAT session'dan — client body'dagi userId ishonilmaydi)
    const auth = await requireUser(req)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'document_analysis',
      metadata: { document_type: documentType || 'general', text_length: documentText.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // ── RAG: hujjat matniga mos moddalarni qonunchilik bazasidan qidirish ──
    const { prompt: systemPrompt } = await groundPrompt(
      documentText.slice(0, 3000),
      BASE_SYSTEM_PROMPT
    )

    // Call Groq for document analysis
    let response: Response
    try {
      response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: documentText },
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      })
    } catch (err) {
      console.error('Groq document-analysis fetch error:', err)
      return NextResponse.json({ error: 'AI xizmatida xatolik yuz berdi' }, { status: 502 })
    }

    // Provider xatosi — fake muvaffaqiyat QAYTARILMAYDI
    if (!response.ok) {
      console.error('Groq document-analysis error:', response.status, await response.text())
      return NextResponse.json({ error: 'AI xizmatida xatolik yuz berdi' }, { status: 502 })
    }

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content
    if (!analysisText) {
      return NextResponse.json({ error: 'AI javob olinmadi' }, { status: 502 })
    }

    // ── Lotin alifbosi kafolati ──
    const latinAnalysis = ensureUzbekLatin(analysisText)

    return NextResponse.json({
      analysis: latinAnalysis,
      documentType,
      timestamp: new Date().toISOString(),
      usage: { totalTokens: Math.ceil(documentText.length / 4) },
    })
  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      { error: 'Hujjat tahlilini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
