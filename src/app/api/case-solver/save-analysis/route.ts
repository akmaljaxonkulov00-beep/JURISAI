import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

interface IracInput {
  issue?: string
  rule?: string
  application?: string
  conclusion?: string
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const case_title: string = String(body.case_title || '').trim()
    const case_category: string = String(body.case_category || 'general').slice(0, 50)
    const case_difficulty: string = String(body.case_difficulty || 'medium').slice(0, 50)
    const analysis: IracInput =
      body.irac_analysis && typeof body.irac_analysis === 'object' ? body.irac_analysis : {}
    const total_score: number =
      typeof body.total_score === 'number'
        ? Math.min(100, Math.max(0, Math.round(body.total_score)))
        : 0
    const completed_at: string | null =
      typeof body.completed_at === 'string' ? body.completed_at : new Date().toISOString()

    if (!case_title) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: case_title, irac_analysis' },
        { status: 400 }
      )
    }

    // ── Deterministik baholash (Math.random YO'Q — har safar bir xil natija) ──
    const grade = getGrade(total_score)
    const feedback = buildFeedback(total_score, analysis)
    const suggestions = buildSuggestions(analysis)
    const strengths = buildStrengths(analysis)
    const weaknesses = buildWeaknesses(analysis)

    const { data, error } = await supabase
      .from('irac_analyses')
      .insert({
        user_id: auth.user.id,
        case_title,
        case_category,
        case_difficulty,
        irac_analysis: analysis as unknown as Record<string, unknown>,
        total_score,
        grade,
        feedback,
        suggestions,
        strengths,
        weaknesses,
        completed_at,
      })
      .select('id')
      .single()

    if (error) {
      console.error('IRAC analysis save error:', error.message)
      // Yolg'on "muvaffaqiyat" qaytarilmaydi — real xato
      return NextResponse.json(
        { error: 'IRAC tahlilini saqlashda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      total_score,
      grade,
      feedback,
      suggestions,
      strengths,
      weaknesses,
      message: 'IRAC tahlili muvaffaqiyatli saqlandi',
      saved_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('IRAC analysis save error:', error)
    return NextResponse.json(
      { error: 'IRAC tahlilini saqlashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

function getGrade(score: number): string {
  if (score >= 90) return "A+ (A'lo)"
  if (score >= 85) return 'A (Yaxshi)'
  if (score >= 80) return 'B+ (Yaxshi)'
  if (score >= 75) return 'B (Qoniqarli)'
  if (score >= 70) return "C+ (O'rtacha)"
  if (score >= 65) return "C (O'rtacha)"
  if (score >= 60) return 'D (Qoniqarsiz)'
  return 'F (Qayta urinish kerak)'
}

/** Deterministik fikr-mulohaza — tahlil mazmuniga asoslanadi, tasodifiy emas */
function buildFeedback(score: number, analysis: IracInput): string {
  const hasRule = Boolean(analysis.rule && /modda|kodeks|qonun/i.test(analysis.rule))
  const hasApplication = Boolean(
    analysis.application && /chunki|sabab|qo'llaniladi|holat/i.test(analysis.application)
  )
  const full = Boolean(
    analysis.issue && analysis.rule && analysis.application && analysis.conclusion
  )

  if (score >= 80 && hasRule && hasApplication && full) {
    return "A'lo ishladingiz! IRAC metodikasini to'liq qo'lladingiz va qonun havolalarini to'g'ri keltirdingiz."
  }
  if (score >= 60) {
    const missing: string[] = []
    if (!hasRule) missing.push("rule bosqichida aniq qonun moddasini ko'rsating")
    if (!hasApplication) missing.push("application bosqichida qonunni faktlarga bog'lang")
    return missing.length
      ? `Yaxshi natija. Yaxshilash uchun: ${missing.join('; ')}.`
      : 'Yaxshi natija. IRAC bosqichlarini biroz kuchaytirish mumkin.'
  }
  return "Qayta urinib ko'ring. IRAC metodikasini to'g'ri qo'llashingiz va qonun havolalarini keltirishingiz kerak."
}

function buildSuggestions(analysis: IracInput): string[] {
  const suggestions: string[] = []
  if (!analysis.issue || (analysis.issue || '').trim().length < 50) {
    suggestions.push('Issue bosqichini batafsilroq yozing — asosiy huquqiy muammoni aniq belgilang')
  }
  if (!analysis.rule || !/modda|kodeks|qonun/i.test(analysis.rule || '')) {
    suggestions.push("Rule bosqichiga tegishli qonun moddasini va kodeksni ko'rsating")
  }
  if (!analysis.application || !/chunki|sabab|qo'llaniladi/i.test(analysis.application || '')) {
    suggestions.push(
      'Application bosqichida qonunni faktlarga bog\'lang — "chunki" so\'zidan foydalaning'
    )
  }
  if (!analysis.conclusion || (analysis.conclusion || '').trim().length < 30) {
    suggestions.push('Conclusion bosqichini kuchaytiring — aniq xulosa chiqaring')
  }
  if (suggestions.length === 0) {
    suggestions.push("Ajoyib ish! IRAC metodikasini to'liq qo'lladingiz.")
  }
  return suggestions
}

function buildStrengths(analysis: IracInput): string[] {
  const strengths: string[] = []
  if (analysis.issue && (analysis.issue || '').trim().length > 100) {
    strengths.push('Issue bosqichi batafsil va aniq yozilgan')
  }
  if (analysis.rule && /modda|kodeks|qonun/i.test(analysis.rule)) {
    strengths.push("Qonun havolalari to'g'ri keltirilgan")
  }
  if (analysis.application && /chunki|sabab|qo'llaniladi/i.test(analysis.application)) {
    strengths.push("Qonunni faktlarga to'g'ri bog'langan")
  }
  if (analysis.conclusion && /shu sababga ko'ra|xulosa/i.test(analysis.conclusion)) {
    strengths.push('Xulosa mantiqan asoslangan')
  }
  if (strengths.length === 0) {
    strengths.push("IRAC metodikasiga urinib ko'rilgan")
  }
  return strengths
}

function buildWeaknesses(analysis: IracInput): string[] {
  const weaknesses: string[] = []
  if (!analysis.issue || (analysis.issue || '').trim().length < 30) {
    weaknesses.push('Issue juda qisqa va noaniq')
  }
  if (!analysis.rule || !/modda|kodeks|qonun/i.test(analysis.rule || '')) {
    weaknesses.push("Qonun havolasi yo'q yoki noto'g'ri")
  }
  if (!analysis.application || (analysis.application || '').trim().length < 50) {
    weaknesses.push('Application bosqichi zaif')
  }
  if (!analysis.conclusion || (analysis.conclusion || '').trim().length < 20) {
    weaknesses.push('Conclusion yetarli emas')
  }
  if (weaknesses.length === 0) {
    weaknesses.push('Hech qanday aniq zaiflik topilmadi')
  }
  return weaknesses
}
