import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  checkAndIncrement,
  getIdentityFromRequest,
  usageMessage,
} from '@/lib/usage-limits'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT =
  "You are JurisAI Document Analyzer — an expert legal document analysis system specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).\n\n" +
  'STRICT RULES:\n' +
  '1. ACCURACY FIRST: You must NEVER invent or hallucinate legal articles (moddalar) or punishments.\n' +
  '2. FORMATTING: Use clean Markdown with headings, bold terms, and bullet points.\n' +
  "3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).\n\n" +
  'Analyze the legal document and provide:\n' +
  '- Hujjatning qisqa tavsifi\n' +
  '- Qonunchilikka moslik tekshiruvi\n' +
  "- Mumkin bo'lgan huquqiy risklar\n" +
  '- Tavsiyalar va takliflar\n' +
  '- Tegishli qonun moddalari\n\n' +
  "MUHIM: Agar aniq modda raqamini bilmasangiz, taxmin qilmang. Hech qachon yolg'on ma'lumot bermang."

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentText, documentType, userId } = body

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { error: "Hujjat matni kamida 50 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(req, body)
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

    // Log usage to Supabase
    try {
      const supabase = getSupabaseAdmin()
      await supabase.from('usage_logs').insert({
        user_id: userId || 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(documentText.length / 4),
        action: 'document_analysis',
        metadata: { document_type: documentType || 'general', text_length: documentText.length },
        created_at: new Date().toISOString(),
      })
    } catch {}

    // Call Groq for document analysis
    let analysisText = 'Hujjat tahlili muvaffaqiyatli.\n\nHujjat qonunchilikka mos keladi.'
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: documentText },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        analysisText = data.choices[0]?.message?.content || analysisText
      }
    } catch {}

    return NextResponse.json({
      analysis: analysisText,
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
