import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt, validateCitations, appendCitationNote } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT =
  "You are Juristiv Document Generator — an expert legal document creation system specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).\n\n" +
  'STRICT RULES:\n' +
  '1. ACCURACY FIRST: You must NEVER invent or hallucinate legal clauses, article numbers, or official references.\n' +
  '2. FORMATTING: Generate professionally formatted legal documents with clear sections, numbered clauses, and proper legal language.\n' +
  "3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili), LATIN ALPHABET ONLY. NEVER use Cyrillic letters (ў, қ, ғ, ҳ, ё, ж).\n\n" +
  'Based on the provided template and data, generate a complete legal document including:\n' +
  "- Document title and header (with O'zbekiston Respublikasi reference)\n" +
  '- Parties/participants section\n' +
  '- Subject matter\n' +
  '- Rights and obligations\n' +
  '- Terms and conditions\n' +
  '- Signatures section with date\n' +
  '- Relevant legal basis references (only if certain)\n\n' +
  "MUHIM: Hech qachon yolg'on qonun moddalari yoki rasmiy ma'lumotlarni to'qimang. Faqat berilgan ma'lumotlar asosida ishlang."

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, templateName, documentData, outputFormat, language } = body

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      )
    }
    // Input hajmi chegarasi — suiste'mol va juda katta so'rovlarning oldini olish
    const dataSize = JSON.stringify(documentData).length
    if (dataSize > 50000) {
      return NextResponse.json(
        { error: "Hujjat ma'lumotlari juda katta — maksimal 50 000 belgi" },
        { status: 400 }
      )
    }
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 503 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'document_generate',
      metadata: { templateId, output_format: outputFormat || 'docx' },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // RAG: hujjat turi va ma'lumotlariga mos REAL qonun moddalari bazadan olinadi
    // va AI faqat shu moddalarga asoslanib hujjat yozadi (to'qima modda yo'q).
    const question = `${templateName || templateId}: ${String(documentData).slice(0, 600)}`
    const { prompt } = await groundPrompt(question, SYSTEM_PROMPT, 4)

    // Call Groq for document generation
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content:
              'Template: ' +
              (templateName || templateId) +
              '\nData: ' +
              JSON.stringify(documentData) +
              '\nFormat: ' +
              (outputFormat || 'docx'),
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    // Provider xatosi — fake muvaffaqiyat QAYTARILMAYDI
    if (!response.ok) {
      console.error('Groq document-generate error:', response.status, await response.text())
      return NextResponse.json({ error: 'AI xizmatida xatolik yuz berdi' }, { status: 502 })
    }

    const data = await response.json()
    const documentContent = ensureUzbekLatin(data.choices[0]?.message?.content || '')
    if (!documentContent) {
      return NextResponse.json({ error: 'AI javob olinmadi' }, { status: 502 })
    }

    // AI javobidagi modda iqtiboslari bazaga mosligini tekshiramiz —
    // to'qima/noto'g'ri modda raqamlari qolmasligi uchun.
    let finalContent = documentContent
    try {
      const citeResult = await validateCitations(finalContent)
      if (citeResult.invalid.length > 0) {
        finalContent = appendCitationNote(finalContent, citeResult)
      }
    } catch {
      // Validatsiya xatosi hujjatni buzmasin
    }

    return NextResponse.json({
      success: true,
      document: finalContent,
      templateId,
      outputFormat,
      language,
      usage: { totalTokens: Math.ceil(finalContent.length / 4) },
    })
  } catch (error) {
    console.error('Document generation error:', error)
    return NextResponse.json({ error: 'Hujjat generatsiyasida xatolik yuz berdi' }, { status: 500 })
  }
}
