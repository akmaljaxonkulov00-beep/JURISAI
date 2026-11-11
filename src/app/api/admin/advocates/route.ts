import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { platformDb } from '@/lib/db/platform-db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/advocates
 * Barcha advokatlarni olish, filtrlash va statistikani hisoblash
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase() || ''
    const status = searchParams.get('status') || 'all'

    const admin = getSupabaseAdmin()
    let { data: list, error } = await admin
      .from('advocate_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !list) {
      // Fallback via platformDb
      list = await platformDb.getAdvocates({ verifiedOnly: false })
    }

    let advocates = list || []

    // Filtrlash
    if (status !== 'all') {
      advocates = advocates.filter((a: any) =>
        status === 'approved'
          ? (a.verification_status === 'approved' || a.verification_status === 'verified')
          : a.verification_status === status
      )
    }

    if (search) {
      advocates = advocates.filter((a: any) =>
        (a.full_name && a.full_name.toLowerCase().includes(search)) ||
        (a.email && a.email.toLowerCase().includes(search)) ||
        (a.license_number && a.license_number.toLowerCase().includes(search)) ||
        (a.location_city && a.location_city.toLowerCase().includes(search)) ||
        (a.bar_association && a.bar_association.toLowerCase().includes(search)) ||
        (Array.isArray(a.specialties) && a.specialties.some((s: string) => s.toLowerCase().includes(search)))
      )
    }

    // Statistika
    const all = list || []
    const stats = {
      total: all.length,
      approved: all.filter((a: any) => a.verification_status === 'approved' || a.verification_status === 'verified').length,
      pending: all.filter((a: any) => a.verification_status === 'pending' || !a.verification_status).length,
      rejected: all.filter((a: any) => a.verification_status === 'rejected').length,
      suspended: all.filter((a: any) => a.verification_status === 'suspended').length,
      avg_rate: all.length > 0 ? Math.round(all.reduce((acc: number, a: any) => acc + (a.hourly_rate || 150000), 0) / all.length) : 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      advocates,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/advocates
 * Advokat verifikatsiya holatini, litsenziya ma'lumotlarini yoki narxini yangilash
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { advocateId, action, status, rejectionReason, hourlyRate, specialties, barAssociation, licenseNumber } = body

    if (!advocateId) {
      return NextResponse.json({ success: false, error: 'advocateId ko‘rsatilmadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()
    const updates: Record<string, any> = { updated_at: now }

    if (action === 'approve' || status === 'approved') {
      updates.verification_status = 'approved'
      updates.verified_at = now
      updates.verified_by = auth.user.id
      updates.verification_rejection_reason = null
    } else if (action === 'reject' || status === 'rejected') {
      updates.verification_status = 'rejected'
      updates.verification_rejection_reason = rejectionReason || 'Litsenziya talablariga mos kelmadi'
    } else if (action === 'suspend' || status === 'suspended') {
      updates.verification_status = 'suspended'
    } else if (action === 'pending' || status === 'pending') {
      updates.verification_status = 'pending'
    }

    if (hourlyRate !== undefined) updates.hourly_rate = Number(hourlyRate)
    if (specialties !== undefined) updates.specialties = specialties
    if (barAssociation !== undefined) updates.bar_association = barAssociation
    if (licenseNumber !== undefined) updates.license_number = licenseNumber

    const { data: updated, error } = await admin
      .from('advocate_profiles')
      .update(updates)
      .eq('id', advocateId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, advocate: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/advocates
 * Yangi advokat profilini yaratish
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      full_name,
      phone,
      email,
      license_number,
      bar_association,
      specialties,
      experience_years,
      location_city,
      hourly_rate,
      bio,
    } = body

    if (!full_name || !license_number || !bar_association) {
      return NextResponse.json(
        { success: false, error: 'F.I.Sh., Litsenziya raqami va Advokatlar palatasi majburiy' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const newAdvocate = {
      full_name,
      phone: phone || '',
      email: email || '',
      license_number,
      bar_association,
      specialties: Array.isArray(specialties) ? specialties : ['Fuqarolik huquqi', 'Biznes huquqi'],
      experience_years: Number(experience_years) || 3,
      location_city: location_city || 'Toshkent',
      hourly_rate: Number(hourly_rate) || 200000,
      bio: bio || 'Professional advokatlik amaliyoti.',
      verification_status: 'approved',
      verified_at: now,
      verified_by: auth.user.id,
      rating: 5.0,
      review_count: 0,
      consultation_formats: ['online', 'offline'],
      languages: ['uz', 'ru'],
      created_at: now,
      updated_at: now,
    }

    const { data: created, error } = await admin
      .from('advocate_profiles')
      .insert([newAdvocate])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, advocate: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/advocates
 * Advokatni o'chirish
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const advocateId = searchParams.get('id')

    if (!advocateId) {
      return NextResponse.json({ success: false, error: 'id ko‘rsatilmadi' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const { error } = await admin.from('advocate_profiles').delete().eq('id', advocateId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Advokat muvaffaqiyatli o‘chirildi' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
