import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getErrorMessage } from '@/lib/errors'

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Bepul',
    price: 0,
    features: [
      "To'liq qonunlar bazasi — cheksiz",
      "30 ta AI chat so'rovi / oy",
      '10 ta IRAC tahlili / oy',
      '10 ta hujjat generator / oy',
      '10 ta ovozli yozuv (STT) / oy',
      '5 ta senariy generator / oy',
      'Asboblar, jamiyat, statistika — cheksiz',
    ],
    limits: {
      ai_chat: { value: 30, period_type: 'monthly' },
      irac: { value: 10, period_type: 'monthly' },
      document_generate: { value: 10, period_type: 'monthly' },
      document_analysis: { value: 0, period_type: 'monthly' },
      virtual_court: { value: 0, period_type: 'monthly' },
      decision_tree: { value: 0, period_type: 'monthly' },
      speech_stt: { value: 10, period_type: 'monthly' },
      scenario: { value: 5, period_type: 'monthly' },
    },
    case_limit: 5,
    discount_percent: 0,
    discount_label: '',
  },
  {
    id: 'standart',
    name: 'Standart',
    price: 29000,
    features: [
      "300 ta AI chat so'rovi / oy",
      '50 ta IRAC tahlili / oy',
      '50 ta hujjat generator / oy',
      '30 ta hujjat tahlili / oy',
      '30 ta qarorlar daraxti / oy',
      '100 ta ovozli yozuv (STT) / oy',
      '15 ta virtual sud sessiyasi / oy',
      '30 ta senariy generator / oy',
    ],
    limits: {
      ai_chat: { value: 300, period_type: 'monthly' },
      irac: { value: 50, period_type: 'monthly' },
      document_generate: { value: 50, period_type: 'monthly' },
      document_analysis: { value: 30, period_type: 'monthly' },
      decision_tree: { value: 30, period_type: 'monthly' },
      speech_stt: { value: 100, period_type: 'monthly' },
      virtual_court: { value: 15, period_type: 'monthly' },
      scenario: { value: 30, period_type: 'monthly' },
    },
    case_limit: 50,
    discount_percent: 0,
    discount_label: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79000,
    features: [
      "AI chat so'rovlari — Fair Use",
      'IRAC — Fair Use',
      'Hujjat — Fair Use',
      'Daraxt — Fair Use',
      'Senariy — Fair Use',
      'Ovozli yozuv (STT) — Fair Use',
      '50 ta virtual sud sessiyasi / oy',
      'Shaxsiy maslahatchi',
      'Ekspert konsultatsiyasi',
    ],
    limits: {
      ai_chat: { value: -1, period_type: 'monthly' },
      irac: { value: -1, period_type: 'monthly' },
      document_generate: { value: -1, period_type: 'monthly' },
      document_analysis: { value: -1, period_type: 'monthly' },
      decision_tree: { value: -1, period_type: 'monthly' },
      speech_stt: { value: -1, period_type: 'monthly' },
      virtual_court: { value: 50, period_type: 'monthly' },
      scenario: { value: -1, period_type: 'monthly' },
    },
    case_limit: -1,
    discount_percent: 0,
    discount_label: '',
  },
]

export async function GET() {
  try {
    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Pricing Public] Error:', error)
      return NextResponse.json({ success: false, error: error.message })
    }

    let rawPlans = data || []
    if (rawPlans.length === 0) {
      // Auto-seed default plans if table is empty
      try {
        const { data: inserted } = await supabase
          .from('pricing_plans')
          .upsert(DEFAULT_PLANS, { onConflict: 'id' })
          .select()
        if (inserted && inserted.length > 0) {
          rawPlans = inserted
        } else {
          rawPlans = DEFAULT_PLANS
        }
      } catch {
        rawPlans = DEFAULT_PLANS
      }
    } else {
      // Self-healing: agar bazada eski 45000 yoki 140000 qolib ketgan bo'lsa — avtomatik 29000 va 79000 ga yangilash
      let needsDbUpdate = false
      rawPlans = rawPlans.map((p: any) => {
        if (p.id === 'standart' && (p.price === 45000 || !p.price)) {
          needsDbUpdate = true
          return {
            ...p,
            price: 29000,
            features: DEFAULT_PLANS.find(d => d.id === 'standart')?.features || p.features,
            limits:
              p.limits && Object.keys(p.limits).length > 0
                ? p.limits
                : DEFAULT_PLANS.find(d => d.id === 'standart')?.limits,
          }
        }
        if (p.id === 'pro' && (p.price === 140000 || !p.price)) {
          needsDbUpdate = true
          return {
            ...p,
            price: 79000,
            features: DEFAULT_PLANS.find(d => d.id === 'pro')?.features || p.features,
            limits:
              p.limits && Object.keys(p.limits).length > 0
                ? p.limits
                : DEFAULT_PLANS.find(d => d.id === 'pro')?.limits,
          }
        }
        if (p.id === 'free' && p.price !== 0) {
          needsDbUpdate = true
          return {
            ...p,
            price: 0,
            features: DEFAULT_PLANS.find(d => d.id === 'free')?.features || p.features,
            limits:
              p.limits && Object.keys(p.limits).length > 0
                ? p.limits
                : DEFAULT_PLANS.find(d => d.id === 'free')?.limits,
          }
        }
        return p
      })

      if (needsDbUpdate) {
        try {
          await supabase.from('pricing_plans').upsert(
            rawPlans.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              features: p.features,
              case_limit: p.case_limit ?? -1,
              limits: p.limits || {},
              discount_percent: p.discount_percent || 0,
              discount_label: p.discount_label || '',
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'id' }
          )
        } catch (e) {
          console.warn('[Pricing Auto-Heal] DB update failed:', e)
        }
      }
    }

    // Transform snake_case to camelCase + calculate discounted price
    const plans = rawPlans.map(
      (p: {
        id?: string
        name?: string
        price?: number
        features?: unknown
        case_limit?: number
        caseLimit?: number
        limits?: unknown
        discount_percent?: number
        discount_label?: string
      }) => {
        const price = Number(p.price) || 0
        const discountPercent = Number(p.discount_percent) || 0
        const discountedPrice =
          discountPercent > 0 ? Math.round(price * (1 - discountPercent / 100)) : price

        return {
          id: p.id,
          name: p.name,
          price,
          discountedPrice,
          discountPercent,
          discountLabel: p.discount_label || '',
          features: p.features || [],
          caseLimit: p.case_limit || p.caseLimit || -1,
          limits: p.limits || {},
        }
      }
    )

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
