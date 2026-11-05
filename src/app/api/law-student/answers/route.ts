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

    const studentName = auth.user.email?.split('@')[0] || 'Talaba'

    // 3. Javobni saqlash
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
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (ansErr || !answer) {
      return NextResponse.json({ success: false, error: ansErr?.message }, { status: 500 })
    }

    // 4. Savolni 'answered' qilish va lockni yopish
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

    // 5. Mukofot ajratish (5 000 - 15 000 UZS oralig'ida sifatiga qarab)
    let rewardAmount = 5000
    if (aiEval.score >= 85) rewardAmount = 15000
    else if (aiEval.score >= 70) rewardAmount = 10000

    if (aiEval.isEligibleForReward) {
      await creditStudentReward({
        studentId: auth.user.id,
        questionId,
        answerId: answer.id,
        amount: rewardAmount,
        aiScore: aiEval.score,
      })
    }

    // 6. Talaba profilidagi answers_count ni oshirish
    try {
      const { data: prof } = await admin
        .from('law_student_profiles')
        .select('answers_count, approved_answers_count')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      if (prof) {
        await admin
          .from('law_student_profiles')
          .update({
            answers_count: (prof.answers_count || 0) + 1,
            approved_answers_count: (prof.approved_answers_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', auth.user.id)
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Javobingiz muvaffaqiyatli qabul qilindi! AI Bahosi: ${aiEval.score} ball. Hisobingizga +${rewardAmount.toLocaleString()} so'm mukofot qo'shildi.`,
      data: {
        answer,
        evaluation: aiEval,
        rewardAmount,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
