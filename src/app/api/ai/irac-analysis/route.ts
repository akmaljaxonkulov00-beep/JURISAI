import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  checkAndIncrement,
  getIdentityFromRequest,
  usageMessage,
} from '@/lib/usage-limits'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseText, userId } = body

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: "Ish matni kamida 50 ta belgidan iborat bo'lishi kerak" },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(request, body)
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

    const systemPrompt = `You are JurisAI IRAC — an expert legal analysis system. Analyze the following legal case using IRAC methodology (Issue, Rule, Application, Conclusion) in Uzbek language.

IRAC FORMAT:
## Muammo (Issue)
(1-2 jumla bilan huquqiy masalani aniqlang)

## Qoida (Rule)  
(Tegishli qonun moddalarini keltiring)

## Qo'llash (Application)
(Vaziyatni tahlil qiling va qonunni qo'llang)

## Xulosa (Conclusion)
(Yakuniy pozitsiyani bildiring)`

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

    // Log usage to Supabase
    try {
      const supabase = getSupabaseAdmin()
      await supabase.from('usage_logs').insert({
        user_id: userId || 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(analysisText.length / 4) + Math.ceil(caseText.length / 4),
        action: 'irac_analysis',
        metadata: { text_length: caseText.length },
        created_at: new Date().toISOString(),
      })
    } catch {}

    return NextResponse.json({
      irac: analysisText,
      caseText,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('IRAC analysis error:', error)
    return NextResponse.json({ error: 'IRAC tahlilini olishda xatolik yuz berdi' }, { status: 500 })
  }
}
