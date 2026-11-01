import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    const awaitingReview = searchParams.get('awaitingReview') === 'true'

    if (awaitingReview) {
      const auth = await requireUser(request)
      if (!auth.ok) return auth.response
      const answers = await platformDb.getAnswersAwaitingReview()
      return NextResponse.json({ success: true, data: answers })
    }

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'questionId parametri talab qilinadi' },
        { status: 400 }
      )
    }

    const answers = await platformDb.getAnswersForQuestion(questionId)
    return NextResponse.json({ success: true, data: answers })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Javoblarni olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // Faqat talaba, advokat yoki admin javob yozishi mumkin
    if (role !== 'law_student' && role !== 'advocate' && role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Faqat huquqshunos talabalar va advokatlar savollarga javob yozish huquqiga ega.',
        },
        { status: 403 }
      )
    }

    // Agar talaba bo'lsa, verifikatsiyasi approved ekanligini tekshiramiz
    if (role === 'law_student') {
      const studentProfile = await platformDb.getLawStudentById(auth.user.id)
      if (studentProfile && studentProfile.verification_status !== 'approved') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Javob berish uchun talabalik hujjatingiz ma’muriyat tomonidan tasdiqlangan bo‘lishi kerak.',
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { questionId, content, legalBasis } = body

    if (!questionId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Savol identifikatori va javob matni majburiy' },
        { status: 400 }
      )
    }

    const question = await platformDb.getQuestionById(questionId)
    if (!question) {
      return NextResponse.json({ success: false, error: 'Savol topilmadi' }, { status: 404 })
    }

    const authorRole = role === 'advocate' ? 'advocate' : 'law_student'
    const isAdvocateVerified = role === 'advocate' // Advokat o'zi yozgan bo'lsa, bu to'g'ridan-to'g'ri advokat javobi

    const newAnswer = await platformDb.createAnswer({
      question_id: questionId,
      author_id: auth.user.id,
      author_name: auth.user.email ? auth.user.email.split('@')[0] : 'Mutaxassis',
      author_role: authorRole,
      content: sanitizeInput(content),
      legal_basis: legalBasis ? sanitizeInput(legalBasis) : undefined,
      status: role === 'advocate' ? 'approved' : 'awaiting_review',
      is_advocate_verified: isAdvocateVerified,
      reviewed_by_advocate_id: role === 'advocate' ? auth.user.id : null,
      reviewed_at: role === 'advocate' ? new Date().toISOString() : null,
    })

    return NextResponse.json({ success: true, data: newAnswer }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Javob yuborishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
