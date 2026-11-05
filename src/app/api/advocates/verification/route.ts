import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdvocateCredentials } from '@/lib/advocate-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()
    const { data: profile } = await admin
      .from('advocate_profiles')
      .select('*')
      .eq('user_id', auth.user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      profile: profile || null,
      verification_status: profile?.verification_status || 'not_applied',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      fullName,
      phone,
      licenseNumber,
      licenseDate,
      barAssociation,
      workplace,
      specialties,
      bio,
      documents,
    } = body

    if (!licenseNumber?.trim() || !fullName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'F.I.Sh va advokatlik guvohnoma raqami kiritilishi shart' },
        { status: 400 }
      )
    }

    // Rasmiy tekshiruv (e-advokat / manual review workflow)
    const verification = await verifyAdvocateCredentials({
      licenseNumber,
      fullName,
      licenseDate,
      barAssociation,
    })

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const profileData = {
      user_id: auth.user.id,
      full_name: fullName,
      phone: phone || auth.user.email,
      email: auth.user.email,
      license_number: licenseNumber.toUpperCase().trim(),
      license_date: licenseDate || null,
      bar_association: barAssociation || "O'zbekiston Advokatlar palatasi",
      workplace: workplace || '',
      specialties: Array.isArray(specialties) ? specialties : [],
      bio: bio || '',
      license_documents: documents || [],
      verification_status: verification.status,
      official_verification_data: verification,
      verified_at: verification.status === 'verified' ? now : null,
      updated_at: now,
    }

    const { data, error } = await admin
      .from('advocate_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Agar tasdiqlangan bo'lsa, registered_users dagi rolni ham ADVOCATE ga yangilaymiz
    if (verification.status === 'verified') {
      await admin
        .from('registered_users')
        .update({ role: 'ADVOCATE' })
        .eq('id', auth.user.id)
    }

    return NextResponse.json({
      success: true,
      data,
      verification,
      message: verification.message,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
