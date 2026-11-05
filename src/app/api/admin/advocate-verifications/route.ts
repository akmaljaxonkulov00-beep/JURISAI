import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const admin = getSupabaseAdmin()
    const { data: list, error } = await admin
      .from('advocate_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: list || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { profileId, userId, action, rejectionReason } = body

    if (!profileId || !action) {
      return NextResponse.json(
        { success: false, error: 'profileId va action ("approve" | "reject" | "suspend") zarur' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()
    let newStatus = 'pending'

    if (action === 'approve') newStatus = 'verified'
    else if (action === 'reject') newStatus = 'rejected'
    else if (action === 'suspend') newStatus = 'suspended'

    const { data: updated, error } = await admin
      .from('advocate_profiles')
      .update({
        verification_status: newStatus,
        verification_rejection_reason: rejectionReason || null,
        verified_at: newStatus === 'verified' ? now : null,
        verified_by: auth.user.id,
        updated_at: now,
      })
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Agar tasdiqlansa, registered_users dagi rolni ham ADVOCATE ga yangilash
    const targetUserId = userId || updated.user_id
    if (newStatus === 'verified' && targetUserId) {
      await admin.from('registered_users').update({ role: 'ADVOCATE' }).eq('id', targetUserId)
    }

    return NextResponse.json({
      success: true,
      message: `Advokat arizasi ${newStatus === 'verified' ? 'tasdiqlandi' : 'rad etildi'}!`,
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
