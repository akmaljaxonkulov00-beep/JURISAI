import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { retrieveLegalArticles, buildLegalContext } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { supabase } from '@/lib/supabase'
import { OFFICIAL_LEGAL_SOURCES } from '@/lib/official-sources-registry'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const documentText: string = String(body.documentText || body.text || '').trim()
    const documentTitle: string = String(body.documentTitle || 'Yuridik Shartnoma').trim()
    const documentType: string = String(body.documentType || 'contract').trim()

    if (!documentText || documentText.length < 30) {
      return NextResponse.json(
        { success: false, error: 'Hujjat matni kamida 30 ta belgidan iborat bo‘lishi lozim' },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI xizmati sozlanmagan (GROQ_API_KEY yo‘q)' },
        { status: 500 }
      )
    }

    // Usage limits check
    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'document_analysis',
      metadata: { document_type: documentType, text_length: documentText.length },
    })

    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // RAG: Qonunchilik bazasidan moddalarni qidirish
    const articles = await retrieveLegalArticles(documentText.slice(0, 2000), 6)
    const legalContext = buildLegalContext(articles, 1000)

    const systemPrompt = `Sen O‘zbekiston Respublikasi qonunchiligi bo‘yicha professional shartnomalar va hujjatlar auditorisan.
Vazifang: Foydalanuvchi taqdim etgan hujjatni (shartnoma, bitim, talabnoma) chuqur tahlil qilib, undagi huquqiy xavflar, noaniq bandlar, qonunga zid shartlar va yetishmayotgan muhim qismlarni aniqlash.

TALABLAR:
1. Qat'iy qoida: Yolg'on yoki to'qima qonun moddasi keltirma.
${legalContext ? legalContext : "Qonunlar bazasidan mos norma topilmasa, yolg'on modda o'ylab topma, faqat umumiy kodeks va me'yorni ko'rsat."}
2. Xavf darajasini tahliliy bahola: 'low', 'medium', 'high', 'critical'.
3. Har bir aniqlangan xavf uchun: band nomi, muammo, qonuniy asos, rasmiy tavsiya.
4. Yetishmayotgan zarur bandlarni (missingClauses) aniqla: masalan, fors-major, javobgarlik chegarasi, nizolarni sudgacha hal qilish (pretenziya) tartibi, konfidensiallik.
5. Alifbo: FAQAT LOTIN O'ZBEK ALIFBOSIDA bo'lsin.
6. Javob formati: FAQAT JSON SCHEMA BO'YICHA JSON qaytar (boshqa hech narsa yozma).

JSON SCHEMA:
{
  "documentTitle": "${documentTitle}",
  "documentType": "${documentType}",
  "overallRisk": "medium",
  "riskScore": 65,
  "summary": "Hujjatning 2-3 jumlalik umumiy huquqiy xulosasi",
  "detectedIssues": [
    {
      "clauseTitle": "Band nomi yoki mavzusi",
      "clauseText": "Hujjatdagi xavfli matn parchasi",
      "issue": "Nima uchun bu shart xavfli yoki noqonuniy",
      "severity": "high",
      "legalViolation": "Qaysi qonuniy talab buzilgan yoki cheklangan",
      "legalGround": "Fuqarolik Kodeksi 333-moddasi / Qonun 670-I",
      "recommendation": "Qanday o'zgartirish kiritish kerak"
    }
  ],
  "missingClauses": [
    {
      "clauseType": "Yetishmayotgan band nomi",
      "importance": "essential",
      "whyNeeded": "Nima sababdan ushbu band kiritilishi shart",
      "suggestedText": "Tavsiya etiladigan aniq band matni",
      "legalGround": "Tegishli norma"
    }
  ],
  "positiveClauses": [
    "Hujjatdagi huquqiy jihatdan to'g'ri va manfaatni himoya qiluvchi band 1"
  ],
  "actionPlan": [
    "1-tavsiya etiladigan qadam",
    "2-qadam"
  ]
}`

    const userPrompt = `QUYIDAGI HUJJATNI AUDIT VA RISK SKANERDAN O‘TKAZING:\n\n${documentText.slice(0, 15000)}`

    const aiRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('Groq risk assessment error:', errText)
      return NextResponse.json(
        { success: false, error: 'AI tahlil xizmatida xatolik yuz berdi' },
        { status: 502 }
      )
    }

    const aiData = await aiRes.json()
    const content = ensureUzbekLatin(aiData.choices?.[0]?.message?.content || '{}')

    let parsedResult
    try {
      parsedResult = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return NextResponse.json(
          { success: false, error: 'AI javobini o‘qib bo‘lmadi' },
          { status: 502 }
        )
      }
      parsedResult = JSON.parse(jsonMatch[0])
    }

    const report = {
      ...parsedResult,
      officialSources: [OFFICIAL_LEGAL_SOURCES.CIVIL_CODE, OFFICIAL_LEGAL_SOURCES.CONTRACT_LAW_670],
      scannedAt: new Date().toISOString(),
    }

    // Save to history
    try {
      await supabase.from('tool_history').insert({
        user_id: auth.user.id,
        tool_type: 'risk_assessment',
        title: `Risk Tahlili: ${documentTitle}`,
        summary: report.summary,
        input_data: { documentTitle, documentType, length: documentText.length },
        result_data: report,
        legal_references:
          report.detectedIssues
            ?.map((i: { legalGround?: string }) => i.legalGround)
            .filter(Boolean) || [],
        status: 'completed',
      })
    } catch (saveErr) {
      console.error('Failed to save risk assessment history:', saveErr)
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Risk assessment API error:', error)
    return NextResponse.json(
      { success: false, error: 'Hujjatni tahlil qilishda server xatosi' },
      { status: 500 }
    )
  }
}
