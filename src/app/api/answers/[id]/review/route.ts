import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, getUserRole } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id: answerId } = await params
    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // Faqat advokat yoki admin taqriz qila oladi
    if (role !== 'advocate' && role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Talabalar javobini taqriz qilish faqat litsenziyaga ega advokatlar uchun ruxsat etilgan.',
        },
        { status: 403 }
      )
    }

    // Advokat verifikatsiyasi tasdiqlangan bo'lishi shart
    if (role === 'advocate') {
      const advocateProfile = await platformDb.getAdvocateById(auth.user.id)
      if (advocateProfile && advocateProfile.verification_status !== 'approved') {
        return NextResponse.json(
          {
            success: false,
            error: 'Taqriz berish uchun advokatlik maqomingiz tasdiqlangan bo‘lishi lozim.',
          },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { status, feedback, revisionNotes } = body

    if (!status || !['approved', 'revision_requested', 'rejected'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yaroqsiz taqriz holati ('approved', 'revision_requested', 'rejected')",
        },
        { status: 400 }
      )
    }

    if (!feedback?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Taqrizda yuridik asoslantirilgan sharh yoki tavsiya yozilishi shart',
        },
        { status: 400 }
      )
    }

    const advocateName = auth.user.email ? auth.user.email.split('@')[0] : 'Advokat'

    const updated = await platformDb.reviewAnswer(answerId, {
      advocateId: auth.user.id,
      advocateName,
      status,
      feedback: sanitizeInput(feedback),
      revisionNotes: revisionNotes ? sanitizeInput(revisionNotes) : undefined,
    })

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Javob topilmadi' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message:
        status === 'approved'
          ? 'Javob muvaffaqiyatli tasdiqlandi va "Advokat tomonidan tekshirilgan" belgisi berildi.'
          : status === 'revision_requested'
            ? 'Talabaga tahrirlash talabi va tavsiyalar yuborildi.'
            : 'Javob rad etildi.',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Taqrizni saqlashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
