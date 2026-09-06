import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Foydalanuvchi hujjatlarini saqlash / tarixini olish.
 *
 * POST /api/documents        — hujjatni database'ga saqlaydi
 * GET  /api/documents        — joriy foydalanuvchining hujjatlar tarixi
 * DELETE /api/documents?id=  — hujjatni o'chiradi (faqat egasi)
 *
 * user_id FAQAT session'dan olinadi — client yuborgan userId ishonilmaydi.
 * Saqlangan hujjatlar refresh/logout/login va boshqa qurilmada ham ko'rinadi.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  try {
    const admin = getSupabaseAdmin()

    // FK `users(id)` ustunidan xavfsiz o'tish uchun user qatori mavjud bo'lishini ta'minlaymiz
    await ensureUserRow(admin, auth.user.id, auth.user.email)

    const { data, error } = await admin
      .from('generated_documents')
      .select(
        'id, template_id, document_data, generated_content, output_format, language, created_at'
      )
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const documents = (data || []).map((row: Record<string, unknown>) => {
      const docData = (row.document_data || {}) as Record<string, unknown>
      return {
        id: String(row.id),
        title: String(docData.title || 'Hujjat'),
        content: String(row.generated_content || ''),
        template_id: String(row.template_id || ''),
        created_at: String(row.created_at || new Date().toISOString()),
        status: String(docData.status || 'completed'),
      }
    })

    return NextResponse.json({ success: true, documents })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load documents'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { title, content, template_id, status, form_data } = body || {}

    if (!content || String(content).trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Hujjat matni bo'sh bo'lishi mumkin emas" },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()
    await ensureUserRow(admin, auth.user.id, auth.user.email)

    const { data, error } = await admin
      .from('generated_documents')
      .insert({
        user_id: auth.user.id,
        template_id: template_id ? String(template_id).slice(0, 100) : null,
        document_data: {
          title: title || 'Hujjat',
          status: status || 'completed',
          form_data: form_data || {},
        },
        generated_content: String(content),
        output_format: 'pdf',
        language: 'uz',
      })
      .select('id, created_at')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      document: {
        id: String(data.id),
        title: title || 'Hujjat',
        content: String(content),
        template_id: template_id || '',
        created_at: String(data.created_at),
        status: 'completed',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save document'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ success: false, error: 'id kerak' }, { status: 400 })
  }

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('generated_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete document'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/** `users` jadvalida user qatori mavjud bo'lishini ta'minlaydi (FK uchun) */
async function ensureUserRow(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  email: string
): Promise<void> {
  try {
    await admin.from('users').upsert(
      {
        id: userId,
        email: email || `${userId}@juristiv.uz`,
        name: (email || 'Foydalanuvchi').split('@')[0] || 'Foydalanuvchi',
        role: 'user',
        subscription_plan: 'free',
      },
      { onConflict: 'id' }
    )
  } catch {
    // FK qatori allaqachon mavjud bo'lishi mumkin — insert keyin o'zi hal bo'ladi
  }
}
