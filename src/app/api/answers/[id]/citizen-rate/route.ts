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
    // Bahoga qarab ball hisoblash: 5 yulduz = 25 ball, 4 = 15 ball, 3 = 10 ball, 2 = 5 ball
    const bonusPoints = numericRating === 5 ? 25 : numericRating === 4 ? 15 : numericRating === 3 ? 10 : 5

    if (answer.author_id) {
      // Talabaning profili
      const { data: profile } = await admin
        .from('law_student_profiles')
        .select('*')
        .eq('user_id', answer.author_id)
        .maybeSingle()

      if (profile) {
        const currentScore = Number(profile.reputation_score || 0)
        const newScore = currentScore + bonusPoints

        // Yangi daraja (Tier) hisoblash:
        let level = profile.level || 'beginner'
        if (newScore >= 500) level = 'expert'
        else if (newScore >= 300) level = 'advanced'
        else if (newScore >= 150) level = 'skilled'
        else if (newScore >= 60) level = 'contributor'

        // Fuqaro qo'ygan 1-5 yulduzli bahoga asoslangan ramziy rag'batlantirish:
        // Bu oylik emas, balki talabaning qiziqishi va bilimini oshirish uchun beriladigan rag'bat.
        // Fuqaro to'lagan pulning asosiy qismi platformada qoladi.
        // 5 yulduz (A'lo) = 5 000 UZS
        // 4 yulduz (Yaxshi) = 3 000 UZS
        // 3 yulduz (Qoniqarli) = 1 000 UZS
        // 1-2 yulduz = 0 UZS
        const studentRewardAmount =
          numericRating === 5 ? 5000 : numericRating === 4 ? 3000 : numericRating === 3 ? 1000 : 0

        if (studentRewardAmount > 0) {
          const { data: wallet } = await admin
            .from('student_wallets')
            .select('*')
            .eq('student_id', answer.author_id)
            .maybeSingle()

          if (wallet) {
            await admin
              .from('student_wallets')
              .update({
                balance: Number(wallet.balance || 0) + studentRewardAmount,
                total_earned: Number(wallet.total_earned || 0) + studentRewardAmount,
                updated_at: now,
              })
              .eq('student_id', answer.author_id)
          } else {
            await admin.from('student_wallets').insert({
              student_id: answer.author_id,
              balance: studentRewardAmount,
              total_earned: studentRewardAmount,
              total_withdrawn: 0,
              updated_at: now,
            })
          }

          // Mukofot yozuvini kiritish
          await admin.from('student_rewards').insert({
            student_id: answer.author_id,
            question_id: answer.question_id,
            answer_id: answerId,
            amount: studentRewardAmount,
            ai_score: numericRating,
            notes: `Fuqaroning ${numericRating} yulduzli bahosi uchun ramziy rag‘batlantirish`,
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
      message: 'Bahoyingiz qabul qilindi! Talaba reytingi oshirildi.',
      rating: numericRating,
      bonusPoints,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
