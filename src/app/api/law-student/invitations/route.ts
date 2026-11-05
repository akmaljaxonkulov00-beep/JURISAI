import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createLawStudentInvitation } from '@/lib/law-student-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()
    const { data: invitations, error } = await admin
      .from('law_student_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: invitations || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { university, faculty, studentName, studentIdCode, studyYear, email, phone } = body

    if (!university?.trim() || !studentName?.trim() || !studentIdCode?.trim()) {
      return NextResponse.json(
        { success: false, error: 'OTM, Talaba F.I.Sh va Talaba ID kodi to‘ldirilishi shart' },
        { status: 400 }
      )
    }

    const invitation = await createLawStudentInvitation({
      university: university.trim(),
      faculty: (faculty || 'Yurisprudensiya').trim(),
      studentName: studentName.trim(),
      studentIdCode: studentIdCode.trim(),
      studyYear: Number(studyYear || 1),
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      createdByAdminId: auth.user.id,
    })

    return NextResponse.json(
      {
        success: true,
        data: invitation,
        message: 'Bir martalik taklifnoma muvaffaqiyatli yaratildi',
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
