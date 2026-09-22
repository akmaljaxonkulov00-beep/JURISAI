import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/tools/document-generate
 * Rasmiy shablonlar asosida to'ldirilgan yuridik hujjatni shakllantirish va saqlash.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const { templateSlug, formData = {}, title = 'Yuridik Hujjat' } = body

    if (!templateSlug) {
      return NextResponse.json(
        { success: false, error: 'Shablon tanlanishi lozim' },
        { status: 400 }
      )
    }

    // 1. Fetch official template from database
    const { data: tpl, error: tplErr } = await supabase
      .from('document_templates')
      .select('*')
      .eq('slug', templateSlug)
      .maybeSingle()

    if (tplErr || !tpl) {
      return NextResponse.json(
        { success: false, error: 'Rasmiy hujjat shabloni topilmadi' },
        { status: 404 }
      )
    }

    // 2. Replace placeholders in template content with user values
    let filledContent = tpl.content || ''
    for (const [key, val] of Object.entries(formData)) {
      const placeholder = `(${key})`
      const placeholderAlt = `___${key}___`
      filledContent = filledContent
        .replaceAll(placeholder, String(val))
        .replaceAll(placeholderAlt, String(val))
    }

    // Also replace common patterns
    filledContent = filledContent
      .replaceAll(
        '(F.I.Sh., yashash manzili, telefon raqami)',
        String(formData['davogar_info'] || formData['fullname'] || '_______________')
      )
      .replaceAll(
        '(F.I.Sh., yashash manzili)',
        String(formData['javobgar_info'] || '_______________')
      )
      .replaceAll("(da'vogarning F.I.Sh.)", String(formData['davogar_name'] || '_______________'))
      .replaceAll(
        "___________ so'm",
        `${formData['claim_amount'] ? Number(formData['claim_amount']).toLocaleString() : '___________'} so'm`
      )

    // Save to user tool history
    try {
      await supabase.from('tool_history').insert({
        user_id: auth.user.id,
        tool_type: 'document_generation',
        title: `${tpl.name}`,
        summary: `Shablon: ${tpl.name} (${tpl.category})`,
        input_data: { templateSlug, formData },
        result_data: {
          templateName: tpl.name,
          category: tpl.category,
          law_ref: tpl.law_ref,
          filledContent,
        },
        legal_references: tpl.law_ref ? [tpl.law_ref] : [],
        status: 'completed',
      })
    } catch (saveErr) {
      console.error('Failed to save document generation history:', saveErr)
    }

    return NextResponse.json({
      success: true,
      document: {
        title: tpl.name,
        category: tpl.category,
        law_ref: tpl.law_ref,
        content: filledContent,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Document generate error:', error)
    return NextResponse.json(
      { success: false, error: 'Hujjatni shakllantirishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
