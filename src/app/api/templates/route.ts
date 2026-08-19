import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/templates
 * Hujjat shablonlarini olish (admin panel uchun)
 */
export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  try {
    let query = sb
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ templates: data || [] })
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

/**
 * POST /api/templates
 * Yangi hujjat shabloni qo'shish (faqat admin)
 */
export async function POST(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token)

  if (authError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin tekshirish
  const { data: userData } = await sb
    .from('registered_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role?.toUpperCase())) {
    return NextResponse.json({ error: 'Forbidden — admin required' }, { status: 403 })
  }

  const body = await req.json()
  const { slug, name, category, description, content, law_ref, format, tags } = body

  if (!slug || !name || !content) {
    return NextResponse.json({ error: 'slug, name va content majburiy' }, { status: 400 })
  }

  const { data, error } = await sb
    .from('document_templates')
    .insert({
      slug,
      name,
      category: category || 'general',
      description: description || '',
      content,
      law_ref: law_ref || '',
      format: format || 'DOCX',
      tags: tags || [],
      is_active: true,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, template: data })
}

/**
 * PUT /api/templates
 * Shablonni tahrirlash (faqat admin)
 */
export async function PUT(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
  } = await sb.auth.getUser(token)

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await sb
    .from('registered_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role?.toUpperCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id majburiy' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await sb
    .from('document_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, template: data })
}

/**
 * DELETE /api/templates
 * Shablonni o'chirish (faqat admin)
 */
export async function DELETE(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
  } = await sb.auth.getUser(token)

  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await sb
    .from('registered_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role?.toUpperCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id majburiy' }, { status: 400 })
  }

  const { error } = await sb.from('document_templates').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
