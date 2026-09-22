import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface FullUserProfilePayload {
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  birthDate?: string
  specialization?: string
  university?: string
  courseLevel?: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const supabase = getSupabaseAdmin()

    const { data: regUser, error } = await supabase
      .from('registered_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('registered_users lookup error:', error.message)
    }

    const nameParts = (
      regUser?.name ||
      regUser?.full_name ||
      auth.user.email.split('@')[0] ||
      ''
    ).split(' ')
    const firstName = regUser?.first_name || nameParts[0] || ''
    const lastName = regUser?.last_name || nameParts.slice(1).join(' ') || ''

    return NextResponse.json({
      success: true,
      data: {
        id: userId,
        email: auth.user.email || regUser?.email || '',
        name: regUser?.name || regUser?.full_name || auth.user.email.split('@')[0] || '',
        firstName,
        lastName,
        middleName: regUser?.middle_name || '',
        phone: regUser?.phone || '',
        birthDate: regUser?.birth_date || null,
        specialization: regUser?.specialization || '',
        university: regUser?.university || '',
        courseLevel: regUser?.course_level || '',
        role: regUser?.role || 'USER',
        subscriptionPlan: regUser?.subscription_plan || 'free',
        subscriptionExpiresAt: regUser?.subscription_expires_at || null,
        avatar: regUser?.avatar || '',
        createdAt: regUser?.created_at || new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('Full profile GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load profile data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const body = (await request.json()) as FullUserProfilePayload
    const supabase = getSupabaseAdmin()

    const firstName = (body.firstName || '').trim()
    const lastName = (body.lastName || '').trim()
    const middleName = (body.middleName || '').trim()
    const fullName = `${firstName} ${lastName}`.trim() || auth.user.email.split('@')[0]

    const updatePayload: Record<string, unknown> = {
      name: fullName,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    }

    if (body.phone !== undefined) updatePayload.phone = body.phone.trim()
    if (body.middleName !== undefined) updatePayload.middle_name = middleName
    if (body.birthDate !== undefined) updatePayload.birth_date = body.birthDate || null
    if (body.specialization !== undefined) updatePayload.specialization = body.specialization.trim()
    if (body.university !== undefined) updatePayload.university = body.university.trim()
    if (body.courseLevel !== undefined) updatePayload.course_level = body.courseLevel.trim()

    // 1. Update registered_users in Supabase
    const { data: updatedUser, error: regError } = await supabase
      .from('registered_users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (regError) {
      console.error('registered_users update error:', regError)
    }

    // 2. Sync to auth metadata
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: fullName,
          phone: updatePayload.phone,
          specialization: updatePayload.specialization,
        },
      })
    } catch (authMetaErr) {
      console.warn('Auth metadata update failed:', authMetaErr)
    }

    return NextResponse.json({
      success: true,
      data: updatedUser || updatePayload,
      message: "Profil ma'lumotlari muvaffaqiyatli saqlandi",
    })
  } catch (err) {
    console.error('Full profile PUT error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile data' },
      { status: 500 }
    )
  }
}
