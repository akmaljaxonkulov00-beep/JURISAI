import { NextRequest, NextResponse } from 'next/server'
import {
  checkAndIncrement,
  getIdentityFromRequest,
  usageMessage,
} from '@/lib/usage-limits'

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

interface AiNode {
  label: string
  type: 'decision' | 'outcome'
  probability?: number
  duration?: string
  cost?: number
  legalBasis?: string
  actionItems?: string[]
  details?: string
  children?: AiNode[]
}

/**
 * POST /api/decision-tree/generate
 *
 * Foydalanuvchi muammosini tavsiflaganda O'zbekiston qonunchiligiga
 * asoslangan qarorlar daraxtini avtomatik yaratadi (Groq AI).
 * Qaytaradigan struktura frontend TreeNode formatiga mos keladi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const scenario: string = body.scenario || body.scenario_title || ''
    const caseType: string = body.case_type || 'huquqiy'

    if (!scenario || typeof scenario !== 'string' || scenario.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'Ish tavsifi juda qisqa' }, { status: 400 })
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI xizmati sozlanmagan' }, { status: 500 })
    }

    // ── AI limit tekshiruvi ──
    const identity = getIdentityFromRequest(request, body)
    const usage = await checkAndIncrement({
      ...identity,
      feature: 'decision_tree',
      metadata: { case_type: caseType },
    })
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: 'limit_reached', message: usageMessage(usage), usage },
        { status: 429 }
      )
    }

    const systemPrompt = `Sen O'zbekiston Respublikasi qonunchiligiga ixtisoslashgan professional yuridik strategisаn.
Foydalanuvchi ish holatini tasvirlaydi. Sening vazifang — REAL qonunchilikka asoslangan QARORLAR DARAXTINI yaratish.

DARAHT TUZILISHI:
- Ildiz (root) tugundan boshlanadi, undan 2-4 ta asosiy yo'l (decision tugunlari) chiqadi.
- Har bir decision tugunidan 2-3 ta yakun (outcome) chiqadi: "G'alaba", "Qisman g'alaba", "Mag'lubiyat", "Kelishuv", "Xarajat ortishi" kabi.
- JAMI 8-15 ta tugun bo'lsin. Daraxt haqiqiy sud amaliyotiga mos bo'lsin.

HAR BIR TUGUN UCHUN (decision va outcome):
- label: tugun nomi (qisqa va aniq, o'zbek tilida)
- type: "decision" (qaror) yoki "outcome" (yakun)
- probability: 0-100 orasidagi real ehtimollik foizi (yondashuvlarning hammasi yig'indisi 100 bo'lishi shart emas, lekin realistik bo'lsin)
- duration: kutilayotgan muddat ("1-3 oy", "3-6 oy", "6-12 oy", "15-45 kun" kabi)
- cost: taxminiy xarajat so'mda (sud boji, advokat, ekspertiza — realistik raqam)
- legalBasis: MUHIM — faqat REAL mavjud qonun moddasini yoz. Yolg'on modda raqami to'qima!
  Fuqarolik ishlarida: FK (Fuqarolik Kodeksi), FPK (Fuqarolik protsessual kodeksi)
  Mehnat nizolarida: MK (Mehnat Kodeksi)
  Oila nizolarida: OK (Oila Kodeksi)
  Jinoyat ishlarida: JK (Jinoyat Kodeksi), JPK (Jinoyat-protsessual kodeksi)
  Ma'muriy: MJtK (Ma'muriy javobgarlik to'g'risidagi kodeks)
  Bilmasang, legalBasis ni bo'sh qoldir, yolg'on to'qima!
- actionItems: 1-3 ta aniq keyingi qadam (masalan: "Da'vo arizasini tayyorlash", "Dalillarni to'plash")
- details: qisqa izoh — nima uchun bu yo'l tanlangan / xavf darajasi

JAVOB FORMATI — FAQAT JSON (boshqa hech narsa yozma):
{
  "label": "ish nomi (qisqa)",
  "type": "root",
  "children": [
    {
      "label": "Sudga berish",
      "type": "decision",
      "probability": 60,
      "duration": "3-6 oy",
      "cost": 800000,
      "legalBasis": "FK 333-moddasi",
      "actionItems": ["Da'vo arizasini tayyorlash", "Dalillarni to'plash"],
      "details": "...",
      "children": [
        { "label": "G'alaba", "type": "outcome", "probability": 50, "duration": "3-6 oy", "cost": 800000, "legalBasis": "FK 333-moddasi", "details": "..." },
        { "label": "Xarajat ortishi", "type": "outcome", "probability": 25, "duration": "6-12 oy", "cost": 1200000, "details": "..." }
      ]
    }
  ]
}

QAT'IY QOIDALAR:
- Faqat JSON qaytar, markdown kod bloklari, tushuntirish yoki boshqa matn YO'Q.
- Yolg'on modda raqami to'qima — legalBasis ni bilmasang bo'sh qoldir.
- Ish tavsifi: ${scenario}
- Ish turi: ${caseType}`

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
          {
            role: 'user',
            content: `Mening ishim: ${scenario}. Yuqoridagi qoidalarga amal qilib qarorlar daraxtini yarat.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq decision-tree error:', errorText)
      return NextResponse.json(
        { success: false, error: 'AI xizmati xatosi' },
        { status: response.status }
      )
    }

    const data = await response.json()
    let raw = data.choices[0]?.message?.content || ''

    // JSON ni matndan ajratib olish (ba'zi modellar ```json blok qaytaradi)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: 'AI noto‘g‘ri format qaytardi' },
        { status: 502 }
      )
    }

    let tree: AiNode
    try {
      tree = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(
        { success: false, error: 'AI JSON parse qilinmadi' },
        { status: 502 }
      )
    }

    // Validatsiya va normalizatsiya
    const normalizeNode = (node: AiNode): AiNode | null => {
      if (!node || typeof node.label !== 'string' || !node.label.trim()) return null
      const children = Array.isArray(node.children)
        ? (node.children.map(normalizeNode).filter(Boolean) as AiNode[])
        : []
      return {
        label: node.label.trim().slice(0, 120),
        type: node.type === 'outcome' ? 'outcome' : 'decision',
        probability:
          typeof node.probability === 'number'
            ? Math.min(100, Math.max(0, Math.round(node.probability)))
            : undefined,
        duration: typeof node.duration === 'string' ? node.duration.slice(0, 40) : undefined,
        cost: typeof node.cost === 'number' && node.cost > 0 ? Math.round(node.cost) : undefined,
        legalBasis: typeof node.legalBasis === 'string' ? node.legalBasis.slice(0, 100) : undefined,
        actionItems: Array.isArray(node.actionItems)
          ? node.actionItems
              .filter(a => typeof a === 'string' && a.trim())
              .map(a => a.trim().slice(0, 200))
              .slice(0, 3)
          : undefined,
        details: typeof node.details === 'string' ? node.details.slice(0, 300) : undefined,
        children: children.length > 0 ? children : undefined,
      }
    }

    const normalized = normalizeNode(tree)
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: 'AI bo‘sh daraxt qaytardi' },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, tree: normalized })
  } catch (error: any) {
    console.error('Decision tree generate error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
