import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { awardUserXP } from '@/lib/xp-engine'

/**
 * GET /api/decision-tree/trees/[id]
 * Bitta case'ning to'liq ma'lumotlarini yuklash.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('decision_trees')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Qaror daraxti topilmadi yoki unga ruxsat yo‘q' },
        { status: 404 }
      )
    }

    const treeObj = data.tree
    const meta = (treeObj && typeof treeObj === 'object' && (treeObj as any).metadata) || {}
    const normalizedCase = {
      ...meta,
      ...data,
      user_role: data.user_role ?? meta.user_role ?? 'davogar',
      objectives: data.objectives ?? meta.objectives ?? '',
      known_facts: data.known_facts ?? meta.known_facts ?? '',
      evidence_docs: data.evidence_docs ?? meta.evidence_docs ?? '',
      opposing_party: data.opposing_party ?? meta.opposing_party ?? '',
      deadlines: data.deadlines ?? meta.deadlines ?? '',
      additional_notes: data.additional_notes ?? meta.additional_notes ?? '',
      analysis: data.analysis ?? meta.analysis ?? {},
      selected_path: data.selected_path ?? meta.selected_path ?? [],
      evidence_state: data.evidence_state ?? meta.evidence_state ?? {},
      notes: data.notes ?? meta.notes ?? '',
      status: data.status ?? meta.status ?? 'active',
    }

    return NextResponse.json({ success: true, case: normalizedCase })
  } catch (error) {
    console.error('Decision tree GET by id error:', error)
    return NextResponse.json(
      { success: false, error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/decision-tree/trees/[id]
 * Case ma'lumotlarini (daraxt, tanlangan yo'l, dalillar, tahlil, eslatmalar) yangilash.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const now = new Date().toISOString()

    const updatePayload: Record<string, unknown> = {
      updated_at: now,
    }

    if (body.name !== undefined) updatePayload.name = String(body.name).trim()
    if (body.case_type !== undefined) updatePayload.case_type = String(body.case_type).trim()
    if (body.user_role !== undefined) updatePayload.user_role = String(body.user_role).trim()
    if (body.objectives !== undefined) updatePayload.objectives = String(body.objectives).trim()
    if (body.known_facts !== undefined) updatePayload.known_facts = String(body.known_facts).trim()
    if (body.evidence_docs !== undefined)
      updatePayload.evidence_docs = String(body.evidence_docs).trim()
    if (body.opposing_party !== undefined)
      updatePayload.opposing_party = String(body.opposing_party).trim()
    if (body.deadlines !== undefined) updatePayload.deadlines = String(body.deadlines).trim()
    if (body.additional_notes !== undefined)
      updatePayload.additional_notes = String(body.additional_notes).trim()
    if (body.analysis !== undefined) updatePayload.analysis = body.analysis
    if (body.selected_path !== undefined) updatePayload.selected_path = body.selected_path
    if (body.evidence_state !== undefined) updatePayload.evidence_state = body.evidence_state
    if (body.notes !== undefined) updatePayload.notes = String(body.notes).trim()
    if (body.status !== undefined) updatePayload.status = String(body.status).trim()

    // Persist all metadata inside tree JSONB so it is guaranteed to persist
    const targetTree = body.tree !== undefined ? body.tree : undefined
    if (targetTree && typeof targetTree === 'object') {
      const existingMeta = (targetTree as any).metadata || {}
      updatePayload.tree = {
        ...targetTree,
        metadata: {
          ...existingMeta,
          ...(body.user_role !== undefined && { user_role: String(body.user_role).trim() }),
          ...(body.objectives !== undefined && { objectives: String(body.objectives).trim() }),
          ...(body.known_facts !== undefined && { known_facts: String(body.known_facts).trim() }),
          ...(body.evidence_docs !== undefined && {
            evidence_docs: String(body.evidence_docs).trim(),
          }),
          ...(body.opposing_party !== undefined && {
            opposing_party: String(body.opposing_party).trim(),
          }),
          ...(body.deadlines !== undefined && { deadlines: String(body.deadlines).trim() }),
          ...(body.additional_notes !== undefined && {
            additional_notes: String(body.additional_notes).trim(),
          }),
          ...(body.analysis !== undefined && { analysis: body.analysis }),
          ...(body.selected_path !== undefined && { selected_path: body.selected_path }),
          ...(body.evidence_state !== undefined && { evidence_state: body.evidence_state }),
          ...(body.notes !== undefined && { notes: String(body.notes).trim() }),
          ...(body.status !== undefined && { status: String(body.status).trim() }),
        },
      }
    } else if (body.tree !== undefined) {
      updatePayload.tree = body.tree
    }

    const supabase = getSupabaseAdmin()
    let updateResult = await supabase
      .from('decision_trees')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('*')
      .single()

    // Self-healing retry if any column is missing in the database schema
    let retries = 0
    while (updateResult.error && retries < 15) {
      retries++
      const msg = updateResult.error.message || ''
      const match =
        msg.match(/Could not find the '([^']+)' column/i) ||
        msg.match(/column "?([a-zA-Z0-9_]+)"? of relation/i)
      if (
        match &&
        match[1] &&
        match[1] in updatePayload &&
        match[1] !== 'tree' &&
        match[1] !== 'name'
      ) {
        const colToRemove = match[1]
        console.warn(`[decision-tree] Column '${colToRemove}' missing on update. Retrying...`)
        delete updatePayload[colToRemove]
        updateResult = await supabase
          .from('decision_trees')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', auth.user.id)
          .select('*')
          .single()
      } else if (msg.includes('schema cache') || msg.includes('column')) {
        console.warn(
          `[decision-tree] Falling back to safe update fields due to schema error: ${msg}`
        )
        const safePayload: Record<string, unknown> = { updated_at: now }
        if (updatePayload.name) safePayload.name = updatePayload.name
        if (updatePayload.case_type) safePayload.case_type = updatePayload.case_type
        if (updatePayload.tree) safePayload.tree = updatePayload.tree
        updateResult = await supabase
          .from('decision_trees')
          .update(safePayload)
          .eq('id', id)
          .eq('user_id', auth.user.id)
          .select('*')
          .single()
        break
      } else {
        break
      }
    }

    if (updateResult.error || !updateResult.data) {
      console.error('Decision tree update error:', updateResult.error?.message)
      return NextResponse.json(
        {
          success: false,
          error: 'Yangilashda xatolik: ' + (updateResult.error?.message || 'Nomaʼlum xatolik'),
        },
        { status: 500 }
      )
    }

    const savedRow = updateResult.data as Record<string, unknown>
    const savedTree = savedRow.tree
    const meta = (savedTree && typeof savedTree === 'object' && (savedTree as any).metadata) || {}
    const normalizedCase = {
      ...meta,
      ...savedRow,
      user_role: savedRow.user_role ?? meta.user_role ?? 'davogar',
      objectives: savedRow.objectives ?? meta.objectives ?? '',
      known_facts: savedRow.known_facts ?? meta.known_facts ?? '',
      evidence_docs: savedRow.evidence_docs ?? meta.evidence_docs ?? '',
      opposing_party: savedRow.opposing_party ?? meta.opposing_party ?? '',
      deadlines: savedRow.deadlines ?? meta.deadlines ?? '',
      additional_notes: savedRow.additional_notes ?? meta.additional_notes ?? '',
      analysis: savedRow.analysis ?? meta.analysis ?? {},
      selected_path: savedRow.selected_path ?? meta.selected_path ?? [],
      evidence_state: savedRow.evidence_state ?? meta.evidence_state ?? {},
      notes: savedRow.notes ?? meta.notes ?? '',
      status: savedRow.status ?? meta.status ?? 'active',
    }

    // Agar status completed bo'lsa, yakuniy completion XP beramiz
    let xpEarned = 0
    if (body.status === 'completed') {
      const xpRes = await awardUserXP({
        userId: auth.user.id,
        userEmail: auth.user.email,
        action: 'decision-tree',
        xp: 20,
        title: `Qarorlar daraxti yakunlandi: ${savedRow.name}`,
        description: `Tahlil va strategiya yakuniy bosqichga yetkazildi`,
        idempotencyKey: `decision_tree_complete_${id}`,
        metadata: {
          tree_id: id,
          name: savedRow.name,
        },
      })
      xpEarned = xpRes.xpEarned
    }

    return NextResponse.json({
      success: true,
      case: normalizedCase,
      xpEarned,
      message: 'Qarorlar daraxti yangilandi',
    })
  } catch (error) {
    console.error('Decision tree PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Serverda yangilash xatosi' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/decision-tree/trees/[id]
 * Case'ni o'chirish (faqat egasi).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('decision_trees')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('Decision tree delete error:', error.message)
      return NextResponse.json(
        { success: false, error: 'O‘chirishda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Qarorlar daraxti o‘chirildi',
    })
  } catch (error) {
    console.error('Decision tree DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
