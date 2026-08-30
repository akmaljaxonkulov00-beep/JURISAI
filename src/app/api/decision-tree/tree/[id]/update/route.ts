import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

interface TreeNode {
  id?: string
  label: string
  type?: string
  probability?: number
  duration?: string
  cost?: number
  legalBasis?: string
  actionItems?: string[]
  details?: string
  children?: TreeNode[]
  path_taken?: string[]
  current_node?: string
  last_decision?: Record<string, unknown>
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  for (const c of node.children || []) {
    const found = findNode(c, id)
    if (found) return found
  }
  return null
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const node_id: string = String(body.node_id || '')
    const decision: string = String(body.decision || '')
    const confidence: number =
      typeof body.confidence === 'number' ? Math.min(1, Math.max(0, body.confidence)) : 0.8

    if (!id || !node_id) {
      return NextResponse.json(
        { error: 'Barcha maydonlar talab qilinadi: tree_id, node_id, decision' },
        { status: 400 }
      )
    }

    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    // ── Egalik tekshiruvi: faqat o'z daraxtini yangilash mumkin ──
    const { data: row, error } = await supabase
      .from('decision_trees')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle()

    if (error) {
      console.error('Decision tree update ownership error:', error.message)
      return NextResponse.json(
        { error: 'Qaror daraxtini yangilashda xatolik yuz berdi' },
        { status: 500 }
      )
    }
    if (!row) {
      return NextResponse.json({ error: "Daraxt topilmadi yoki ruxsat yo'q" }, { status: 403 })
    }

    const tree: TreeNode = (row.tree as TreeNode) || { label: 'Daraxt', type: 'root' }
    const node = findNode(tree, node_id)
    if (!node) {
      return NextResponse.json({ error: 'Tugun topilmadi' }, { status: 404 })
    }

    // ── Real yangilash: tanlangan tugun yo'lini va joriy tugunni saqlash ──
    const pathTaken = Array.isArray(tree.path_taken) ? [...tree.path_taken, node_id] : [node_id]
    const nextChildren = node.children || []
    const currentNode = nextChildren.length ? nextChildren[0].id || node_id : node_id

    const updatedTree = {
      ...tree,
      path_taken: pathTaken.slice(-50),
      current_node: currentNode,
      last_decision: { node_id, decision, confidence, at: new Date().toISOString() },
    }

    const { error: updErr } = await supabase
      .from('decision_trees')
      .update({ tree: updatedTree, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (updErr) {
      console.error('Decision tree update error:', updErr.message)
      return NextResponse.json(
        { error: 'Qaror daraxtini yangilashda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    const next_nodes = nextChildren.map(c => ({
      node_id: c.id,
      title: c.label,
      description: c.details || '',
      estimated_time: c.duration || null,
      priority: typeof c.probability === 'number' && c.probability <= 40 ? 'high' : 'medium',
    }))

    const recommendations: string[] = []
    for (const c of nextChildren.slice(0, 2)) {
      if (c.actionItems?.length) recommendations.push(...c.actionItems.slice(0, 2))
    }
    if (!recommendations.length) {
      recommendations.push('Qaror asosida dalillarni mustahkamlang', 'Yuridik maslahat oling')
    }

    return NextResponse.json({
      success: true,
      update_id: `${id}_${Date.now()}`,
      tree_id: id,
      node_id,
      decision: decision || node.label,
      confidence,
      impact_analysis: {
        path_changes: nextChildren.map(c => ({
          path: c.label,
          probability: c.probability != null ? c.probability / 100 : 0.5,
        })),
        overall_confidence: {
          old_confidence: null,
          new_confidence: confidence,
        },
        risk_assessment: {
          new_risk_level: (Array.isArray(nextChildren) ? nextChildren : []).some(
            c => typeof c.probability === 'number' && c.probability <= 40
          )
            ? 'medium'
            : 'low',
        },
      },
      recommendations,
      next_nodes,
      message: 'Qaror daraxti muvaffaqiyatli yangilandi',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Decision tree update error:', error)
    return NextResponse.json(
      { error: 'Qaror daraxtini yangilashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
