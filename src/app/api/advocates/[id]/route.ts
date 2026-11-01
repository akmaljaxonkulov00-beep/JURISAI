import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const advocate = await platformDb.getAdvocateById(id)

    if (!advocate) {
      return NextResponse.json({ success: false, error: 'Advokat topilmadi' }, { status: 404 })
    }

    const reviews = await platformDb.getReviews(advocate.user_id)

    return NextResponse.json({
      success: true,
      data: {
        ...advocate,
        reviews,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Advokat profilini olishda xatolik yuz berdi' },
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
    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // Faqat o'z profilini yoki admin o'zgartirishi mumkin
    if (auth.user.id !== id && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Faqat advokat o‘z profilini tahrirlashi mumkin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updated = await platformDb.upsertAdvocateProfile(id, body)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Profilni yangilashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
