import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { groundPrompt } from '@/lib/legal-rag'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseText } = body

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: "Holat matni kamida 50 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }
    if (caseText.length > 20000) {
      return NextResponse.json(
        { error: 'Holat matni juda uzun — maksimal 20 000 belgi' },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── Autentifikatsiya + AI limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'irac',
      metadata: { text_length: caseText.length },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const BASE_SYSTEM_PROMPT = `You are JurisAI IRAC — an expert legal analysis system specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

STRICT RULES:
1. ACCURACY FIRST: You must NEVER invent or hallucinate legal articles (moddalar) or punishments.
2. FORMATTING: Use clear structure with headings and bullet points.
3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).

Analyze the following legal case using IRAC methodology:

## Muammo (Issue)
(1-2 jumla bilan huquqiy masalani aniqlang)

## Qoida (Rule)
(Tegishli qonun moddalarini keltiring — kodeks nomi va modda raqami bilan)

## Qo'llash (Application)
(Vaziyatni tahlil qiling va qonunni qo'llang)

## Xulosa (Conclusion)
(Yakuniy pozitsiyani bildiring va amaliy tavsiyalar bering)`

    // ── RAG: ish matniga mos moddalarni qonunchilik bazasidan qidirish ──
    const { prompt: systemPrompt } = await groundPrompt(caseText, BASE_SYSTEM_PROMPT)

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: caseText },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return NextResponse.json({ error: 'AI tahlil xatosi' }, { status: response.status })
    }

    const data = await response.json()
    const analysisText = data.choices[0]?.message?.content || 'Tahlil olinmadi'

    // Parse IRAC sections from the response
    const extractSection = (text: string, sectionName: string): string => {
      const patterns = [
        new RegExp(`## ${sectionName}\\s*\\([^)]+\\)\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i'),
        new RegExp(`## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i'),
        new RegExp(`\\*\\*${sectionName}\\*\\*:\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i'),
      ]
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1].trim()
      }
      return '' // not found — empty string, caller will use analysisText as fallback
    }

    const issue = extractSection(analysisText, 'Muammo')
    const rule = extractSection(analysisText, 'Qoida')
    const application = extractSection(analysisText, "Qo'llash")
    const conclusion = extractSection(analysisText, 'Xulosa')

    // Extract source citations from the text
    const sources: Array<{ title: string; article: string; url: string }> = []
    const sourcePattern =
      /(O'zbekiston Respublikasi\s+[A-Za-z\s]+kodeks(i)?)\s+(dastlabki\s+)?(\d+(-modda)?)/gi
    let match
    while ((match = sourcePattern.exec(analysisText)) !== null) {
      sources.push({
        title: match[1].trim(),
        article: match[0].trim(),
        url: 'https://lex.uz',
      })
    }

    // Calculate confidence based on completeness
    let confidence = 50
    if (issue && issue.length > 20) confidence += 10
    if (rule && rule.length > 20) confidence += 15
    if (application && application.length > 20) confidence += 15
    if (conclusion && conclusion.length > 20) confidence += 10
    if (sources.length > 0) confidence += 10
    confidence = Math.min(confidence, 95)

    return NextResponse.json({
      issue: issue || analysisText,
      rule: rule || analysisText,
      application: application || analysisText,
      conclusion: conclusion || analysisText,
      sources: sources.slice(0, 5),
      confidence,
    })
  } catch (error) {
    console.error('IRAC analysis error:', error)
    return NextResponse.json({ error: 'Tahlil qilishda xatolik yuz berdi' }, { status: 500 })
  }
}
