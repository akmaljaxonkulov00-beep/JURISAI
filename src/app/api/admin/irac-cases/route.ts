import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Admin IRAC cases CRUD
 * GET — barcha kazuslar (admin uchun, inactive ham)
 * POST — yangi kazus qo'shish
 * PUT — kazusni tahrirlash
 * DELETE — kazusni o'chirish
 */
async function verifyAdmin(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
  } = await sb.auth.getUser(token)

  if (!user?.id) return null

  const { data: userData } = await sb
    .from('registered_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role?.toUpperCase())) {
    return null
  }

  return { sb, userId: user.id }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await auth.sb
    .from('irac_cases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cases: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, category, difficulty, law_references, is_active } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title va description majburiy' }, { status: 400 })
  }

  const { data, error } = await auth.sb
    .from('irac_cases')
    .insert({
      title,
      description,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      law_references: law_references || [],
      is_active: is_active !== false,
      created_by: auth.userId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, case: data })
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id majburiy' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await auth.sb
    .from('irac_cases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, case: data })
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdmin(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id majburiy' }, { status: 400 })
  }

  const { error } = await auth.sb.from('irac_cases').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
