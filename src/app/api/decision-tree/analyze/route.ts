import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { checkAndIncrement, usageMessage } from '@/lib/usage-limits'
import { retrieveLegalArticles, buildLegalContext, RAGArticle } from '@/lib/legal-rag'
import { ensureUzbekLatin } from '@/lib/uz-latin'
import { DecisionNode, CaseAnalysis, ApplicableLawRef } from '@/types/decision-tree'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name: string = String(body.name || body.scenario_title || '').trim()
    const description: string = String(body.description || body.scenario_description || '').trim()
    const caseType: string = String(body.case_type || 'fuqarolik').trim()
    const userRole: string = String(body.user_role || 'davogar').trim()
    const objectives: string = String(body.objectives || '').trim()
    const knownFacts: string = String(body.known_facts || description || '').trim()
    const evidenceDocs: string = String(body.evidence_docs || '').trim()
    const opposingParty: string = String(body.opposing_party || '').trim()
    const deadlines: string = String(body.deadlines || '').trim()
    const additionalNotes: string = String(body.additional_notes || '').trim()

    const combinedQuery =
      `${name} ${caseType} ${userRole} ${objectives} ${knownFacts} ${evidenceDocs}`.trim()
    if (!combinedQuery || combinedQuery.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ish maʼlumotlari yetarli emas — kamida sarlavha yoki holat tavsifini kiriting',
        },
        { status: 400 }
      )
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI xizmati sozlanmagan (GROQ_API_KEY yo‘q)' },
        { status: 500 }
      )
    }

    // ── Server-side Auth & Limit tekshiruvi ──
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const identity = { userId: auth.user.id, email: auth.user.email || undefined }
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'decision_tree',
      metadata: { case_type: caseType, user_role: userRole },
    })

    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    // ── Real Qonunchilik Bazasidan (RAG) moddalarni qidirish ──
    const articles: RAGArticle[] = await retrieveLegalArticles(combinedQuery, 8)
    const legalContext = buildLegalContext(articles, 1200)

    const systemPrompt = `Sen O'zbekiston Respublikasi qonunchiligiga ixtisoslashgan oliy toifali yuridik strateg va LegalTech tahlilchisisan.
Sening vazifang — berilgan huquqiy ish bo'yicha chuqur tahlil o'tkazish va O'zbekiston qonunchiligiga 100% mos QARORLAR DARAXTINI (DECISION TREE) tuzish.

TALABLAR:
1. Tahlil faqat O'zbekiston Respublikasining amaldagi qonunlariga asoslansin.
2. QONUN MODDALARI QOIDASI: Har bir qaror va tahlil nuqtasi uchun faqat haqiqiy qonun moddalarini keltir.
${legalContext ? legalContext : "Qonunlar bazasidan mos norma topilmasa, yolg'on modda to'qima, legal_basis ga faqat umumiy kodeks nomini kirit."}
3. DARAHT TUZILMASI:
   - Root tugun (ish nomi va umumiy tavsif).
   - Kamida 2-4 ta strategik yo'nalish (DECISION / QUESTION / ACTION).
   - Har bir yo'nalish bo'yicha 2-3 ta ehtimoliy natija (OUTCOME / SUCCESS / FAILURE / WARNING).
   - Har bir tugunda: title, description, legal_basis, risk_level ('low'|'medium'|'high'), risk_basis, probability (0-100), estimated_cost (so'mda raqam), estimated_duration (masalan '1-3 oy'), confidence (0-100), evidence_required (kerakli dalillar ro'yxati), next_steps (aniq amaliy qadamlar).
4. ALIFBO: Barcha matnlar FAQAT LOTIN O'ZBEK ALIFBOSIDA bo'lsin. Kirill harflari ISHLATILMAYDI.
5. JAVOB FORMATI: Faqat to'g'ridan-to'g'ri JSON qaytar (markdown kodi, tushuntirish va ortiqcha so'zlar YO'Q).

JSON SCHEMA:
{
  "analysis": {
    "case_summary": "Ishning 2-3 jumlalik qisqa huquqiy xulosasi",
    "legal_domain": "${caseType}",
    "user_role": "${userRole}",
    "objectives": "Foydalanuvchi maqsadi",
    "key_facts": ["Asosiy yuridik ahamiyatga ega fakt 1", "Fakt 2"],
    "missing_facts": ["Aniqlanishi lozim bo'lgan qo'shimcha fakt 1"],
    "legal_issues": ["Ko'rib chiqilishi kerak bo'lgan asosiy huquqiy muammo 1", "Muammo 2"],
    "applicable_laws": [
      {
        "code_id": "civil_code",
        "code_name": "Fuqarolik Kodeksi",
        "article_number": "333",
        "title": "Majburiyatlarni buzganlik uchun javobgarlik",
        "excerpt": "Qisqa matni",
        "status": "amalda"
      }
    ],
    "evidence": ["Mavjud va talab qilinadigan dalillar"],
    "assumptions": ["Farazlar"],
    "decision_points": ["Qaror qabul qilish kerak bo'lgan asosiy nuqtalar"],
    "possible_strategies": ["Strategiya 1 (masalan: Talabnoma yuborish)", "Strategiya 2 (Sudga da'vo arizasi)"],
    "risks": [
      {
        "title": "Xavf nomi",
        "level": "medium",
        "basis": "Nima sababdan xavf mavjud (masalan: dalil yetishmasligi, da'vo muddati)"
      }
    ],
    "opportunities": ["Imkoniyat va afzalliklar"],
    "recommended_next_steps": ["1-qadam", "2-qadam"]
  },
  "tree": {
    "id": "root",
    "type": "ROOT",
    "title": "${name || 'Huquqiy ish tahlili'}",
    "description": "Boshlang'ich huquqiy vaziyat tahlili",
    "risk_level": "medium",
    "confidence": 85,
    "children": [
      {
        "id": "strategy_1",
        "type": "DECISION",
        "title": "1-yo'nalish nomi",
        "description": "Ushbu yo'nalishning batafsil tavsifi",
        "action": "Amalga oshiriladigan birlamchi harakat",
        "legal_basis": "Tegishli modda",
        "applicable_laws": [],
        "risk_level": "low",
        "risk_basis": "Xavf sababi",
        "probability": 70,
        "estimated_cost": 500000,
        "estimated_duration": "15-30 kun",
        "confidence": 80,
        "evidence_required": ["Shartnoma", "To'lov hujjati"],
        "next_steps": ["Talabnoma loyihasini tayyorlash"],
        "children": [
          {
            "id": "outcome_1_1",
            "type": "SUCCESS",
            "title": "Ijobiy yakun: Talab qondirilishi",
            "description": "Natija tavsifi",
            "consequences": "Huquqiy oqibatlar",
            "risk_level": "low",
            "probability": 65,
            "estimated_cost": 0,
            "estimated_duration": "10-15 kun",
            "confidence": 85,
            "next_steps": ["Ijro qilinishini nazorat qilish"]
          },
          {
            "id": "outcome_1_2",
            "type": "FAILURE",
            "title": "Rad etilish yoki javobsiz qolish",
            "description": "Natija tavsifi",
            "consequences": "Sudga murojaat qilish zarurati tug'iladi",
            "risk_level": "high",
            "probability": 35,
            "estimated_cost": 0,
            "estimated_duration": "30 kun",
            "confidence": 75,
            "next_steps": ["Sudga da'vo arizasi tayyorlash"]
          }
        ]
      }
    ]
  }
}`

    const userPrompt = `
ISH MA'LUMOTLARI:
- Ish nomi: ${name || 'Nomsiz ish'}
- Huquq sohasi: ${caseType}
- Foydalanuvchi roli: ${userRole}
- Maqsad: ${objectives || 'Qonuniy himoya va huquqni tiklash'}
- Ma'lum faktlar: ${knownFacts || 'Faktlar keltirilmagan'}
- Mavjud hujjatlar va dalillar: ${evidenceDocs || 'Hujjatlar toʻliq koʻrsatilmagan'}
- Qarshi tomon: ${opposingParty || "Noma'lum"}
- Muddatlar / Cheklovlar: ${deadlines || 'Belgilanmagan'}
- Qoʻshimcha izoh: ${additionalNotes || "Yo'q"}

Ushbu ishni to'liq tahlil qilib, belgilangan JSON schema formatida qaytaring.
`

    // Multi-model fallback sequence for maximum reliability
    const candidateModels = [
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-120b',
      'llama-3.1-70b-versatile',
    ]

    let aiContent = ''
    let lastError = ''

    for (const modelName of candidateModels) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 28000)

      try {
        const aiRes = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 3500,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (aiRes.ok) {
          const aiData = await aiRes.json()
          aiContent = aiData.choices?.[0]?.message?.content || ''
          if (aiContent.trim()) {
            break // Success
          }
        } else {
          const errText = await aiRes.text().catch(() => '')
          lastError = `Model ${modelName} error (${aiRes.status}): ${errText.slice(0, 200)}`
          console.warn('Groq model attempt failed:', lastError)
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        lastError =
          fetchErr.name === 'AbortError' ? 'AI so‘rovi vaqti tugadi (timeout)' : fetchErr.message
        console.warn(`Groq fetch error with ${modelName}:`, lastError)
      }
    }

    if (!aiContent) {
      console.error('All Groq candidate models failed for decision-tree:', lastError)
      return NextResponse.json(
        {
          success: false,
          error:
            'AI xizmatidan vaqtincha javob olinmadi. Iltimos, bir ozdan so‘ng qayta urinib ko‘ring.',
        },
        { status: 503 }
      )
    }

    const content = ensureUzbekLatin(aiContent)

    let parsedResult: { analysis?: CaseAnalysis; tree?: DecisionNode } | null = null
    try {
      parsedResult = JSON.parse(content)
    } catch {
      // JSON match fallback
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0])
        } catch {}
      }
    }

    // Default structure normalization if partial
    if (!parsedResult || typeof parsedResult !== 'object') {
      parsedResult = {}
    }

    if (!parsedResult.analysis) {
      parsedResult.analysis = {
        case_summary: description || `${name} bo'yicha huquqiy tahlil`,
        legal_domain: caseType,
        user_role: userRole,
        objectives: objectives || 'Qonuniy himoya va huquqni tiklash',
        key_facts: knownFacts ? [knownFacts] : ['Ish holatlari tahlil qilinmoqda'],
        missing_facts: [],
        legal_issues: ["Huquqiy munosabatlarni aniqlash va qonun normalarini to'g'ri qo'llash"],
        applicable_laws: [],
        evidence: evidenceDocs ? [evidenceDocs] : [],
        assumptions: [],
        decision_points: ["Da'vo yoki talabnoma taqdim etish asoslarini tekshirish"],
        possible_strategies: [
          'Talabnoma yuborish orqali hal etish',
          "Sudga da'vo arizasi kiritish",
        ],
        risks: [
          {
            title: 'Dalillar yetarli emasligi',
            level: 'medium',
            basis: "Hujjatlar to'liq taqdim etilmagan bo'lishi mumkin",
          },
        ],
        opportunities: ["O'zbekiston Respublikasi qonunchiligiga muvofiq huquqlarni himoya qilish"],
        recommended_next_steps: [
          "Hujjatlar to'plamini to'liq shakllantirish",
          'Tegishli yuridik xulosa tayyorlash',
        ],
      }
    }

    if (!parsedResult.tree || typeof parsedResult.tree !== 'object') {
      parsedResult.tree = {
        id: 'root',
        type: 'ROOT',
        title: name || 'Huquqiy ish tahlili',
        description: description || "Boshlang'ich huquqiy holat tahlili",
        risk_level: 'medium',
        confidence: 80,
        children: [
          {
            id: 'strategy_pre_trial',
            type: 'DECISION',
            title: "1-Yo'nalish: Sudgacha hal etish (Talabnoma)",
            description: 'Qarshi tomonga yozma talabnoma va ogohlantirish xati yuborish',
            action: 'Talabnoma tayyorlash va yuborish',
            risk_level: 'low',
            probability: 65,
            estimated_cost: 300000,
            estimated_duration: '10-15 kun',
            confidence: 85,
            next_steps: [
              'Talabnoma matnini qonun moddalariga asoslab yozish',
              'Pochta orqali topshirish',
            ],
            children: [
              {
                id: 'outcome_settled',
                type: 'SUCCESS',
                title: 'Ijobiy natija: Nizoni ixtiyoriy hal qilish',
                description: "Talablar qarshi tomon tomonidan to'liq qanoatlantiriladi",
                risk_level: 'low',
                probability: 60,
                confidence: 85,
                next_steps: ["Kelishuv ijrosini ta'minlash"],
              },
              {
                id: 'outcome_refused',
                type: 'FAILURE',
                title: 'Talab rad etildi yoki javobsiz qoldi',
                description: 'Qarshi tomon talabni bajarmadi, sudga murojaat qilish zarur',
                risk_level: 'high',
                probability: 40,
                confidence: 75,
                next_steps: ["Sudga da'vo arizasi tayyorlash"],
              },
            ],
          },
          {
            id: 'strategy_court',
            type: 'DECISION',
            title: "2-Yo'nalish: Sudga da'vo arizasi kiritish",
            description: "Vakolatli sudga da'vo arizasi va dalillar paketini taqdim etish",
            action: "Da'vo arizasini rasmiylashtirish va davlat bojini to'lash",
            risk_level: 'medium',
            probability: 75,
            estimated_cost: 1500000,
            estimated_duration: '1-3 oy',
            confidence: 80,
            next_steps: ["Da'vo arizasi va ilovalarni shakllantirish", "E-Sud orqali jo'natish"],
            children: [
              {
                id: 'outcome_court_won',
                type: 'SUCCESS',
                title: "Da'vo to'liq qanoatlantirildi",
                description: 'Sud qarori qonuniy kuchga kiradi va ijro varaqasi olinadi',
                risk_level: 'low',
                probability: 70,
                confidence: 80,
                next_steps: ['MIB orqali ijroga qaratish'],
              },
            ],
          },
        ],
      }
    }

    // Bind real RAG articles to applicable laws if AI omitted or generalized
    if (articles.length > 0) {
      const mappedRag: ApplicableLawRef[] = articles.slice(0, 5).map(a => ({
        code_id: a.code_id,
        code_name: a.code_name,
        article_number: a.article_number,
        title: a.title,
        excerpt: a.content.slice(0, 150),
        status: 'amalda',
      }))

      if (
        !parsedResult.analysis.applicable_laws ||
        parsedResult.analysis.applicable_laws.length === 0
      ) {
        parsedResult.analysis.applicable_laws = mappedRag
      }
    }

    return NextResponse.json({
      success: true,
      analysis: parsedResult.analysis,
      tree: parsedResult.tree,
      rag_articles_count: articles.length,
    })
  } catch (error) {
    console.error('Decision tree analyze error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Serverda kutilmagan xatolik yuz berdi',
      },
      { status: 500 }
    )
  }
}
