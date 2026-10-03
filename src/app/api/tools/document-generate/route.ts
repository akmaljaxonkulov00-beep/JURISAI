import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { awardUserXP } from '@/lib/xp-engine'

// Built-in verified templates fallback
const FALLBACK_TEMPLATES: Record<
  string,
  { name: string; category: string; law_ref: string; content: string }
> = {
  'davo-arizasi-qarz': {
    name: 'Qarz summasini undirish to‘g‘risida da‘vo arizasi',
    category: 'fuqarolik',
    law_ref: 'O‘zbekiston FK 732-736-moddalari, FPK 189-191-moddalari',
    content: `FUQAROLIK ISHLARI BO‘YICHA (tuman/shahar) SUDIGA

Da‘vogar: (F.I.Sh., yashash manzili, telefon raqami)
Javobgar: (F.I.Sh., yashash manzili)
Da‘vo bahosi: ___________ so'm

DA‘VO ARIZASI
(Qarz summasini undirish to‘g‘risida)

Javobgar bilan o‘rtamizda tuzilgan qarz shartnomasiga (tilxatga) asosan, men javobgarga ___________ so'm miqdorida qarz bergan edim. Qarzni qaytarish muddati tugagan bo‘lsa-da, javobgar qarzni qaytarishdan bosh tortib kelmoqda.

(da'vo asoslari batafsil yoziladi)

O‘zbekiston Respublikasi Fuqarolik Kodeksining 732, 735, 736-moddalariga, FPKning 189-191-moddalariga asosan,

SO‘RAYMAN:
1. Javobgardan mening foydamga ___________ so'm qarz summasini undirishingizni;
2. To‘langan davlat boji va sud xarajatlarini javobgar hisobidan qoplashingizni.

Ilova qilinayotgan hujjatlar:
1. Da‘vo arizasi nusxalari.
2. Qarz tilxati (shartnomasi) nusxasi.
3. Davlat boji to‘langanligi haqida kvitansiya.

Da‘vogar: (da'vogarning F.I.Sh.) ___________
Sana: 2026-yil "___" __________`,
  },
}

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

    const supabase = getSupabaseAdmin()

    // 1. Fetch official template from database or fallback
    const { data: tpl } = await supabase
      .from('document_templates')
      .select('*')
      .eq('slug', templateSlug)
      .maybeSingle()

    const templateData = tpl ||
      FALLBACK_TEMPLATES[templateSlug] || {
        name: title || 'Yuridik Hujjat',
        category: 'umumiy',
        law_ref: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
        content: String(body.customContent || ''),
      }

    // 2. Replace placeholders in template content with user values
    let filledContent = templateData.content || ''
    for (const [key, val] of Object.entries(formData)) {
      const placeholder = `(${key})`
      const placeholderAlt = `___${key}___`
      filledContent = filledContent
        .replaceAll(placeholder, String(val))
        .replaceAll(placeholderAlt, String(val))
    }

    // Replace standard placeholders
    if (formData['court_name']) {
      filledContent = filledContent.replaceAll(
        /FUQAROLIK ISHLARI BO‘YICHA \(tuman\/shahar\) SUDIGA/g,
        String(formData['court_name']).toUpperCase()
      )
    }
    if (formData['davogar_info']) {
      filledContent = filledContent.replaceAll(
        '(F.I.Sh., yashash manzili, telefon raqami)',
        String(formData['davogar_info'])
      )
    }
    if (formData['javobgar_info']) {
      filledContent = filledContent.replaceAll(
        '(F.I.Sh., yashash manzili)',
        String(formData['javobgar_info'])
      )
    }
    if (formData['davogar_name']) {
      filledContent = filledContent.replaceAll(
        "(da'vogarning F.I.Sh.)",
        String(formData['davogar_name'])
      )
    }
    if (formData['claim_amount']) {
      filledContent = filledContent.replaceAll(
        "___________ so'm",
        `${Number(String(formData['claim_amount']).replace(/[^\d]/g, '')).toLocaleString()} so'm`
      )
    }
    if (formData['facts']) {
      filledContent = filledContent.replaceAll(
        "(da'vo asoslari batafsil yoziladi)",
        String(formData['facts'])
      )
    }

    // 3. Save to user tool history
    let historyId = `doc_${Date.now()}`
    try {
      const { data: savedRow } = await supabase
        .from('tool_history')
        .insert({
          user_id: auth.user.id,
          tool_type: 'document_generation',
          title: `${templateData.name}`,
          summary: `Shablon: ${templateData.name} (${templateData.category})`,
          input_data: { templateSlug, formData },
          result_data: {
            templateName: templateData.name,
            category: templateData.category,
            law_ref: templateData.law_ref,
            filledContent,
          },
          legal_references: templateData.law_ref ? [templateData.law_ref] : [],
          status: 'completed',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (savedRow?.id) historyId = savedRow.id
    } catch (saveErr) {
      console.warn('Failed to save document generation history:', saveErr)
    }

    // 4. Award XP (+10 XP)
    const idempotencyKey = `doc_gen_${auth.user.id}_${templateSlug}_${Date.now()}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'document-generate',
      xp: 10,
      title: `Hujjat yaratildi: ${templateData.name}`,
      description: `Rasmiy shablon asosida yuridik hujjat shakllantirildi`,
      idempotencyKey,
      metadata: {
        tool_type: 'document_generation',
        template_slug: templateSlug,
        history_id: historyId,
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        title: templateData.name,
        category: templateData.category,
        law_ref: templateData.law_ref,
        content: filledContent,
        generatedAt: new Date().toISOString(),
      },
      xpEarned: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
    })
  } catch (error) {
    console.error('Document generate error:', error)
    return NextResponse.json(
      { success: false, error: 'Hujjatni shakllantirishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
