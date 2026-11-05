import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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

    return NextResponse.json({ success: true, data: profile })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      full_name,
      phone,
      bio,
      specialties,
      experience_years,
      bar_association,
      workplace,
      education,
      languages,
      consultation_formats,
      location_city,
      pricing_type,
      hourly_rate,
      starting_rate,
      is_price_public,
      services,
      availability,
      avatar_url,
    } = body

    const admin = getSupabaseAdmin()
    const now = new Date().toISOString()

    const updatePayload: Record<string, unknown> = {
      updated_at: now,
    }

    if (full_name !== undefined) updatePayload.full_name = full_name
    if (phone !== undefined) updatePayload.phone = phone
    if (bio !== undefined) updatePayload.bio = bio
    if (specialties !== undefined) updatePayload.specialties = specialties
    if (experience_years !== undefined) updatePayload.experience_years = experience_years
    if (bar_association !== undefined) updatePayload.bar_association = bar_association
    if (workplace !== undefined) updatePayload.workplace = workplace
    if (education !== undefined) updatePayload.education = education
    if (languages !== undefined) updatePayload.languages = languages
    if (consultation_formats !== undefined) updatePayload.consultation_formats = consultation_formats
    if (location_city !== undefined) updatePayload.location_city = location_city
    if (pricing_type !== undefined) updatePayload.pricing_type = pricing_type
    if (hourly_rate !== undefined) updatePayload.hourly_rate = hourly_rate
    if (starting_rate !== undefined) updatePayload.starting_rate = starting_rate
    if (is_price_public !== undefined) updatePayload.is_price_public = is_price_public
    if (services !== undefined) updatePayload.services = services
    if (availability !== undefined) updatePayload.availability = availability
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url

    const { data, error } = await admin
      .from('advocate_profiles')
      .update(updatePayload)
      .eq('user_id', auth.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // registered_users dagi ism va rasmni ham yangilash
    try {
      const userUpdates: Record<string, any> = {}
      if (full_name) {
        userUpdates.name = full_name
        userUpdates.full_name = full_name
      }
      if (avatar_url) userUpdates.avatar = avatar_url
      if (phone) userUpdates.phone = phone
      if (Object.keys(userUpdates).length > 0) {
        await admin.from('registered_users').update(userUpdates).eq('id', auth.user.id)
      }
    } catch {}

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
