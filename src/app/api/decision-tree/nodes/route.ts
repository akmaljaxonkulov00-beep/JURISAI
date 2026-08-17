import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

interface TreeNodeLite {
  id?: string
  label: string
  type?: string
  probability?: number
  duration?: string
  cost?: number
  legalBasis?: string
  details?: string
  children?: TreeNodeLite[]
}

function collectNodes(node: TreeNodeLite, out: TreeNodeLite[] = []): TreeNodeLite[] {
  out.push(node)
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectNodes(c, out)
  }
  return out
}

/** Foydalanuvchining REAL daraxti ichidagi tugunlarini qaytaradi (mock yo'q) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const tree_id = searchParams.get('tree_id')
    const scenario = searchParams.get('scenario')

    // Tugunlar faqat REAL daraxtdan olinadi
    let query = supabase
      .from('decision_trees')
      .select('id, name, scenario, tree')
      .eq('user_id', auth.user.id)
      .limit(1)
    if (tree_id) query = query.eq('id', tree_id)
    if (scenario && !tree_id) query = query.eq('scenario', scenario)

    const { data, error } = await query
    if (error) {
      console.error('Decision tree nodes get error:', error.message)
      return NextResponse.json({
        nodes: [],
        total_nodes: 0,
        filters: { tree_id: tree_id || null, scenario: scenario || null },
        summary: {},
        last_updated: new Date().toISOString(),
      })
    }

    const row: Record<string, unknown> | null =
      Array.isArray(data) && data.length ? (data[0] as Record<string, unknown>) : null
    if (!row?.tree) {
      return NextResponse.json({
        nodes: [],
        total_nodes: 0,
        filters: { tree_id: tree_id || null, scenario: scenario || null },
        summary: {},
        last_updated: new Date().toISOString(),
      })
    }

    const tree: TreeNodeLite = row.tree as TreeNodeLite
    const flat = collectNodes(tree)

    const nodes = flat.map((n, idx) => {
      const type = idx === 0 ? 'start' : n.type === 'outcome' ? 'action' : 'analysis'
      return {
        id: n.id || `node_${idx + 1}`,
        title: n.label || 'Tugun',
        description: n.details || '',
        type,
        tree_id: row.id,
        position: { x: 100 + idx * 100, y: 50 + idx * 100 },
        decisions: [],
        legal_basis: n.legalBasis ? [n.legalBasis] : [],
        estimated_time: n.duration || null,
        priority: typeof n.probability === 'number' && n.probability <= 40 ? 'high' : 'medium',
        status: 'pending',
      }
    })

    const byType = (t: string) => nodes.filter(n => n.type === t).length
    return NextResponse.json({
      nodes,
      total_nodes: nodes.length,
      filters: { tree_id: tree_id || null, scenario: scenario || null },
      summary: {
        start_nodes: byType('start'),
        analysis_nodes: byType('analysis'),
        action_nodes: byType('action'),
        calculation_nodes: 0,
        completed_nodes: 0,
        pending_nodes: byType('pending'),
        in_progress_nodes: 0,
      },
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Decision tree nodes get error:', error)
    return NextResponse.json(
      { error: 'Qaror daraxti tugunlarini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
