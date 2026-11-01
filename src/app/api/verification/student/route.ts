import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, requireAdmin, getUserRole } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)

    // Admin barcha so'rovlarni ko'radi; talaba faqat o'zinikini
    if (role === 'admin') {
      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') || undefined
      const list = await platformDb.getLawStudents(status)
      return NextResponse.json({ success: true, data: list })
    }

    const myProfile = await platformDb.getLawStudentById(auth.user.id)
    return NextResponse.json({ success: true, data: myProfile })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Verifikatsiya ma’lumotlarini olishda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { university, faculty, studyYear, specialization, studentIdNumber, documents } = body

    if (!university || !studentIdNumber) {
      return NextResponse.json(
        { success: false, error: 'Universitet nomi va talabalik guvohnomasi raqami majburiy' },
        { status: 400 }
      )
    }

    const profile = await platformDb.upsertLawStudentProfile(auth.user.id, {
      full_name: body.fullName || (auth.user.email ? auth.user.email.split('@')[0] : 'Talaba'),
      university,
      faculty,
      study_year: Number(studyYear) || 1,
      specialization,
      student_id_number: studentIdNumber,
      student_id_documents: documents || [],
      verification_status: 'pending',
    })

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Talabalik ma’lumotlari ma’muriyat tekshiruviga yuborildi',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Arizani yuborishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

// Admin approve / reject / suspend
export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request)
    if (!adminAuth.ok) return adminAuth.response

    const { studentId, status, rejectionReason } = await request.json()

    if (!studentId || !['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Yaroqsiz talaba identifikatori yoki holat' },
        { status: 400 }
      )
    }

    const updated = await platformDb.upsertLawStudentProfile(studentId, {
      verification_status: status,
      verification_rejection_reason: rejectionReason || null,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
    })

    await logAdminAction({
      admin: adminAuth.user,
      action: `LAW_STUDENT_VERIFICATION_${status.toUpperCase()}`,
      targetType: 'law_student',
      targetId: studentId,
      details: { status, rejectionReason },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Verifikatsiya holatini yangilashda xatolik' },
      { status: 500 }
    )
  }
}
