import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser, requireAdmin, getUserRole } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { role } = await getUserRole(auth.user.id, auth.user.email)

    if (role === 'admin') {
      const { searchParams } = new URL(request.url)
      const list = await platformDb.getAdvocates({ verifiedOnly: false })
      return NextResponse.json({ success: true, data: list })
    }

    const myProfile = await platformDb.getAdvocateById(auth.user.id)
    return NextResponse.json({ success: true, data: myProfile })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Advokat verifikatsiyasini olishda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      licenseNumber,
      barAssociation,
      specialties,
      experienceYears,
      bio,
      phone,
      documents,
    } = body

    if (!licenseNumber || !barAssociation) {
      return NextResponse.json(
        { success: false, error: 'Litsenziya raqami va Advokatlar palatasi nomi majburiy' },
        { status: 400 }
      )
    }

    const profile = await platformDb.upsertAdvocateProfile(auth.user.id, {
      full_name: body.fullName || (auth.user.email ? auth.user.email.split('@')[0] : 'Advokat'),
      phone: phone || '',
      email: auth.user.email,
      bio: bio || '',
      license_number: licenseNumber,
      bar_association: barAssociation,
      specialties: specialties || ['Fuqarolik huquqi'],
      experience_years: Number(experienceYears) || 1,
      license_documents: documents || [],
      verification_status: 'pending',
    })

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Litsenziya ma’lumotlari ma’muriyat tekshiruviga yuborildi',
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

    const { advocateId, status, rejectionReason } = await request.json()

    if (!advocateId || !['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Yaroqsiz advokat identifikatori yoki holat' },
        { status: 400 }
      )
    }

    const updated = await platformDb.upsertAdvocateProfile(advocateId, {
      verification_status: status,
      verification_rejection_reason: rejectionReason || null,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
    })

    await logAdminAction({
      admin: adminAuth.user,
      action: `ADVOCATE_VERIFICATION_${status.toUpperCase()}`,
      targetType: 'advocate',
      targetId: advocateId,
      details: { status, rejectionReason },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Advokat verifikatsiya holatini yangilashda xatolik' },
      { status: 500 }
    )
  }
}
