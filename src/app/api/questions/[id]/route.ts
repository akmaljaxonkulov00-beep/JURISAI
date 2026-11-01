import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser } from '@/lib/server-auth'
import { getUserRole } from '@/lib/server-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const question = await platformDb.getQuestionById(id)

    if (!question) {
      return NextResponse.json({ success: false, error: 'Savol topilmadi' }, { status: 404 })
    }

    // Maxfiy savollar faqat savol egasi yoki vakolatli advokatga ko'rinadi
    if (question.visibility === 'private') {
      const auth = await requireUser(request)
      if (!auth.ok) {
        return NextResponse.json(
          { success: false, error: 'Ushbu savol maxfiy hisoblanadi. Kirish taqiqlangan.' },
          { status: 403 }
        )
      }

      const { role } = await getUserRole(auth.user.id, auth.user.email)
      const isOwner = question.citizen_id === auth.user.id
      const isAuthorizedAdvocate =
        (role === 'advocate' && question.escalated_to_advocate_id === auth.user.id) ||
        role === 'admin'

      if (!isOwner && !isAuthorizedAdvocate) {
        return NextResponse.json(
          { success: false, error: 'Ushbu maxfiy savolni ko‘rish huquqi sizda yo‘q.' },
          { status: 403 }
        )
      }
    }

    const answers = await platformDb.getAnswersForQuestion(id)

    return NextResponse.json({
      success: true,
      data: {
        ...question,
        citizen_name: question.is_anonymous ? 'Anonim fuqaro' : question.citizen_name,
        answers,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Savolni olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const question = await platformDb.getQuestionById(id)
    if (!question) {
      return NextResponse.json({ success: false, error: 'Savol topilmadi' }, { status: 404 })
    }

    const { role } = await getUserRole(auth.user.id, auth.user.email)
    const isOwner = question.citizen_id === auth.user.id
    if (!isOwner && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Faqat savol egasi uni o‘zgartirishi mumkin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updated = await platformDb.updateQuestion(id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Savolni yangilashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
