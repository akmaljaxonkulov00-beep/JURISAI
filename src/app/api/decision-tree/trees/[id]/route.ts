import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

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

    return NextResponse.json({ success: true, case: data })
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
    if (body.tree !== undefined) updatePayload.tree = body.tree
    if (body.analysis !== undefined) updatePayload.analysis = body.analysis
    if (body.selected_path !== undefined) updatePayload.selected_path = body.selected_path
    if (body.evidence_state !== undefined) updatePayload.evidence_state = body.evidence_state
    if (body.notes !== undefined) updatePayload.notes = String(body.notes).trim()
    if (body.status !== undefined) updatePayload.status = String(body.status).trim()

    const { data, error } = await supabase
      .from('decision_trees')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select('*')
      .single()

    if (error) {
      console.error('Decision tree update error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Yangilashda xatolik: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      case: data,
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
