import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { evaluateStudentAnswerAI, creditStudentReward } from '@/lib/law-student-service'
import { sanitizeInput } from '@/lib/api-security'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { questionId, content, legalBasis } = body

    if (!questionId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Savol ID va javob matni kiritilishi shart' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // 1. Savolni tekshirish (faqat bitta talaba javobi qabul qilinadi!)
    const { data: q, error: qErr } = await admin
      .from('legal_questions')
      .select('id, title, description, status, locked_by_student_id, answers_count')
      .eq('id', questionId)
      .single()

    if (qErr || !q) {
      return NextResponse.json({ success: false, error: 'Savol topilmadi' }, { status: 404 })
    }

    if (q.status === 'answered' || (q.answers_count && q.answers_count > 0)) {
      return NextResponse.json(
        { success: false, error: 'Ushbu savolga allaqachon javob berilgan' },
        { status: 409 }
      )
    }

    // 2. 7 ta mezon bo'yicha AI baholashi
    const cleanContent = sanitizeInput(content)
    const cleanBasis = sanitizeInput(legalBasis || '')

    const aiEval = await evaluateStudentAnswerAI({
      questionTitle: q.title,
      questionDesc: q.description,
      answerContent: cleanContent,
      legalBasis: cleanBasis,
    })

    // 3. Talabaning haqiqiy ism-sharifini profilidan olish
    const { data: studentProf } = await admin
      .from('law_student_profiles')
      .select('full_name, reputation_score, answers_count, approved_answers_count, level')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    const studentName = studentProf?.full_name || (auth.user as any)?.name || auth.user.email?.split('@')[0] || 'Yosh Advokat'

    // 4. Javobni saqlash (AI bahosi bilan)
    const { data: answer, error: ansErr } = await admin
      .from('legal_answers')
      .insert({
        question_id: questionId,
        author_id: auth.user.id,
        author_name: studentName,
        author_role: 'law_student',
        content: cleanContent,
        legal_basis: cleanBasis,
        status: 'approved',
        ai_evaluation: aiEval,
        ai_score: aiEval.score,
        reward_amount: 0, // Har bir javobga to'g'ridan-to'g'ri pul berilmaydi, ball yig'iladi
        reward_status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (ansErr || !answer) {
      return NextResponse.json({ success: false, error: ansErr?.message }, { status: 500 })
    }

    // 5. Savolni 'answered' qilish va lockni yopish
    await admin
      .from('legal_questions')
      .update({
        status: 'answered',
        answers_count: 1,
        locked_by_student_id: null,
        lock_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    // 6. Qat'iy 1-5 ballik shkala bo'yicha ball jamg'arish
    const earnedStars = aiEval.score || 3 // 1 dan 5 gacha ball
    const currentScore = Number(studentProf?.reputation_score || 0)
    const newTotalScore = currentScore + earnedStars
    const currentApprovedCount = Number(studentProf?.approved_answers_count || 0) + (earnedStars >= 4 ? 1 : 0)

    // Kvota tizimi: Kamida 7 ta sifatli (4-5 ballik) javoblar soniga yetganda mukofot ochiladi!
    // Har bir javob uchun alohida pul to'lanmaydi!
    const prevQuotaCount = Math.floor((studentProf?.approved_answers_count || 0) / 7)
    const newQuotaCount = Math.floor(currentApprovedCount / 7)
    const quotaAchieved = newQuotaCount > prevQuotaCount

    let quotaBonus = 0
    if (quotaAchieved) {
      quotaBonus = 100000 // 7 ta sifatli javob kvotasi uchun 100 000 UZS mukofot

      const { data: wallet } = await admin
        .from('student_wallets')
        .select('*')
        .eq('student_id', auth.user.id)
        .maybeSingle()

      if (wallet) {
        await admin
          .from('student_wallets')
          .update({
            balance: Number(wallet.balance || 0) + quotaBonus,
            total_earned: Number(wallet.total_earned || 0) + quotaBonus,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', auth.user.id)
      } else {
        await admin.from('student_wallets').insert({
          student_id: auth.user.id,
          balance: quotaBonus,
          total_earned: quotaBonus,
          total_withdrawn: 0,
          updated_at: new Date().toISOString(),
        })
      }
    }

    // Darajani aniqlash (1-5 ballik yig'indi bo'yicha)
    let newLevel = studentProf?.level || 'beginner'
    if (newTotalScore >= 100) newLevel = 'expert'
    else if (newTotalScore >= 50) newLevel = 'advanced'
    else if (newTotalScore >= 25) newLevel = 'skilled'
    else if (newTotalScore >= 10) newLevel = 'contributor'

    // Profilni yangilash
    if (studentProf) {
      await admin
        .from('law_student_profiles')
        .update({
          answers_count: (studentProf.answers_count || 0) + 1,
          approved_answers_count: currentApprovedCount,
          reputation_score: newTotalScore,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', auth.user.id)
    }

    const message = quotaBonus > 0
      ? `Javobingiz qabul qilindi! AI Bahosi: ${earnedStars} / 5 yulduz. Tabriklaymiz, 7 ta sifatli javob kvotasini to‘ldirdingiz va hisobingizga +${quotaBonus.toLocaleString()} so'm kvota mukofoti qo‘shildi!`
      : `Javobingiz qabul qilindi! AI Qattiqqol Bahosi: ${earnedStars} / 5 yulduz (+${earnedStars} reyting bali). Fuqaro javobingizni baholaganda qo‘shimcha ballar qo‘shiladi.`

    return NextResponse.json({
      success: true,
      message,
      data: {
        answer,
        evaluation: aiEval,
        earnedPoints: earnedStars,
        newTotalScore,
        newLevel,
        quotaBonus,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
