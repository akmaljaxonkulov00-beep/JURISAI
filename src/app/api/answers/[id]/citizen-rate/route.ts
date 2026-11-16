import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/answers/[id]/citizen-rate
 * Fuqaro o'z savoliga berilgan talaba javobini baholaydi (1 dan 5 gacha yulduzcha).
 * Ushbu baho talabaning reytingini oshiradi, unga qo'shimcha ballar beradi.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id: answerId } = await context.params
    const body = await request.json()
    const { rating, feedback } = body

    const numericRating = Number(rating)
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Baho 1 dan 5 gacha yulduzcha bo‘lishi kerak' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // 1. Javobni va tegishli savolni topish
    const { data: answer, error: ansErr } = await admin
      .from('legal_answers')
      .select('id, question_id, author_id, author_role, citizen_rating')
      .eq('id', answerId)
      .maybeSingle()

    if (ansErr || !answer) {
      return NextResponse.json({ success: false, error: 'Javob topilmadi' }, { status: 404 })
    }

    // Savolning egasi aynan shu fuqaro ekanligini tekshirish
    const { data: question } = await admin
      .from('legal_questions')
      .select('id, citizen_id, title')
      .eq('id', answer.question_id)
      .maybeSingle()

    if (question && question.citizen_id !== auth.user.id && !auth.user.email?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Faqat savol egasi javobga baho berishi mumkin' },
        { status: 403 }
      )
    }

    // 2. Javobga fuqaro bahosini saqlash
    const now = new Date().toISOString()
    await admin
      .from('legal_answers')
      .update({
        citizen_rating: numericRating,
        citizen_feedback: (feedback || '').trim(),
        updated_at: now,
      })
      .eq('id', answerId)

    // Savol holatini 'resolved' deb belgilash
    if (question) {
      await admin
        .from('legal_questions')
        .update({
          status: 'resolved',
          updated_at: now,
        })
        .eq('id', question.id)
    }

    // 3. Agar javob muallifi talaba (law_student) bo'lsa:
    // Fuqaroning 1-5 yulduzli bahosi to'g'ridan-to'g'ri ball (yulduzcha) sifatida jamlanadi:
    // 5 yulduz = +5 ball, 4 yulduz = +4 ball, 3 yulduz = +3 ball, 2 yulduz = +1 ball, 1 yulduz = 0 ball
    const earnedPoints =
      numericRating === 5 ? 5 : numericRating === 4 ? 4 : numericRating === 3 ? 3 : numericRating === 2 ? 1 : 0

    if (answer.author_id) {
      // Talabaning profili
      const { data: profile } = await admin
        .from('law_student_profiles')
        .select('*')
        .eq('user_id', answer.author_id)
        .maybeSingle()

      if (profile) {
        const currentScore = Number(profile.reputation_score || 0)
        const newScore = currentScore + earnedPoints

        // Yangi daraja (Tier) hisoblash:
        let level = profile.level || 'beginner'
        if (newScore >= 250) level = 'expert'
        else if (newScore >= 150) level = 'advanced'
        else if (newScore >= 75) level = 'skilled'
        else if (newScore >= 30) level = 'contributor'

        // DIQQAT: HAR BIR JAVOB UCHUN PUL BERILMAYDI!
        // Fuqaro qo'ygan 1-5 ballar talabaning hisobida yig'ilib boradi.
        // Faqatgina talaba juda ko'p savollarga sifatli javob berib, ballari har 50 ballik
        // marraga (masalan 50, 100, 150 ball) yetgandagina, talabaning amaliyotga qiziqishini
        // rag'batlantirish uchun ramziy rag'bat (20 000 UZS) hisoblanadi.
        // Fuqarolardan tushgan pulning asosiy qismi platformada qoladi.
        const prevThresholdCount = Math.floor(currentScore / 50)
        const newThresholdCount = Math.floor(newScore / 50)
        const milestonesReached = newThresholdCount - prevThresholdCount

        if (milestonesReached > 0) {
          const rewardAmount = milestonesReached * 20000 // Har 50 ball to'planganda 20 000 UZS ramziy rag'bat

          const { data: wallet } = await admin
            .from('student_wallets')
            .select('*')
            .eq('student_id', answer.author_id)
            .maybeSingle()

          if (wallet) {
            await admin
              .from('student_wallets')
              .update({
                balance: Number(wallet.balance || 0) + rewardAmount,
                total_earned: Number(wallet.total_earned || 0) + rewardAmount,
                updated_at: now,
              })
              .eq('student_id', answer.author_id)
          } else {
            await admin.from('student_wallets').insert({
              student_id: answer.author_id,
              balance: rewardAmount,
              total_earned: rewardAmount,
              total_withdrawn: 0,
              updated_at: now,
            })
          }

          // Mukofot yozuvini kiritish (50 ballik marra bosqichi uchun)
          await admin.from('student_rewards').insert({
            student_id: answer.author_id,
            question_id: answer.question_id,
            answer_id: answerId,
            amount: rewardAmount,
            ai_score: numericRating,
            notes: `Fuqarolardan to‘plangan ${newScore} ball marrasi (har 50 ball uchun 20 000 UZS ramziy rag‘bat)`,
            created_at: now,
          })
        }

        await admin
          .from('law_student_profiles')
          .update({
            reputation_score: newScore,
            level,
            updated_at: now,
          })
          .eq('user_id', answer.author_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bahoyingiz qabul qilindi! Talaba reytingi va ballari oshirildi.',
      rating: numericRating,
      earnedPoints,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
