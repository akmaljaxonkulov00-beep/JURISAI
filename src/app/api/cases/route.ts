import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // Faqat advokat yoki admin o'z ishlarini ko'ra oladi
    if (role !== 'advocate' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Sud ishlari dosyesi faqat advokatlarga mo‘ljallangan' },
        { status: 403 }
      )
    }

    const cases = await platformDb.getAdvocateCases(auth.user.id)
    return NextResponse.json({ success: true, data: cases })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ishlar ro‘yxatini yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)
    if (role !== 'advocate' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Faqat advokat yangi sud ishi ochishi mumkin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { clientName, clientPhone, clientEmail, caseTitle, caseCategory, description, deadline, privateNotes, tasks } = body

    if (!clientName || !clientPhone || !caseTitle) {
      return NextResponse.json(
        { success: false, error: 'Mijoz ismi, telefoni va ish sarlavhasi majburiy' },
        { status: 400 }
      )
    }

    const newCase = await platformDb.createAdvocateCase({
      advocate_id: auth.user.id,
      client_name: sanitizeInput(clientName),
      client_phone: sanitizeInput(clientPhone),
      client_email: clientEmail ? sanitizeInput(clientEmail) : undefined,
      case_title: sanitizeInput(caseTitle),
      case_category: caseCategory || 'Umumiy nizo',
      description: description ? sanitizeInput(description) : '',
      status: 'active',
      deadline: deadline || undefined,
      private_notes: privateNotes ? sanitizeInput(privateNotes) : '',
      tasks: tasks || [
        { id: '1', text: 'Mijoz bilan dastlabki suhbat o‘tkazish', done: true },
        { id: '2', text: 'Hujjatlar to‘plamini tahlil qilish', done: false },
      ],
      documents: [],
    })

    return NextResponse.json({ success: true, data: newCase }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Yangi ish yaratishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Ish identifikatori kiritilishi shart' },
        { status: 400 }
      )
    }

    const updated = await platformDb.updateAdvocateCase(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Ishni yangilashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
