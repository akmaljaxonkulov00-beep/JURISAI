import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

interface TreeNodeLite {
  id: string
  label: string
  type?: string
  probability?: number
  duration?: string
  cost?: number
  legalBasis?: string
  details?: string
  children?: TreeNodeLite[]
}

function countNodes(node: TreeNodeLite): number {
  let count = 1
  if (Array.isArray(node.children)) {
    for (const c of node.children) count += countNodes(c)
  }
  return count
}

function countOutcomes(node: TreeNodeLite): number {
  if (node.type === 'outcome') return 1
  let count = 0
  if (Array.isArray(node.children)) {
    for (const c of node.children) count += countOutcomes(c)
  }
  return count
}

function avgProbability(node: TreeNodeLite, acc: number[] = []): number {
  if (typeof node.probability === 'number') acc.push(node.probability)
  if (Array.isArray(node.children)) {
    for (const c of node.children) avgProbability(c, acc)
  }
  return acc.length ? acc.reduce((s, p) => s + p, 0) / acc.length : 55
}

interface TreeRow {
  id: string
  name?: string
  case_type?: string | null
  scenario?: string | null
  tree?: unknown
  created_at?: string | null
  updated_at?: string | null
}

interface MappedTree {
  id: string
  status: string
  confidence_score: number
}

/** Foydalanuvchining REAL decision_trees jadvalidagi daraxtlarini qaytaradi (mock yo'q) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const case_type = searchParams.get('case_type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    let query = supabase
      .from('decision_trees')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (case_type) query = query.eq('case_type', case_type)

    const { data, error } = await query
    if (error) {
      // Jadval mavjud bo'lmasa — bo'sh (lekin valid) javob, mock emas
      console.error('Decision trees get error:', error.message)
      return NextResponse.json({
        trees: [],
        pagination: { total: 0, limit, offset, has_more: false },
        filters: { case_type: case_type || null },
        summary: { total_trees: 0, active_trees: 0, completed_trees: 0, average_confidence: 0 },
        last_updated: new Date().toISOString(),
      })
    }

    const rows = (data || []) as TreeRow[]
    const trees = rows.map(t => {
      const tree: TreeNodeLite = (t.tree as TreeNodeLite) || {
        label: t.name || 'Daraxt',
        type: 'root',
      }
      const total = countNodes(tree)
      const outcomes = countOutcomes(tree)
      const avgProb = Math.round(avgProbability(tree))
      return {
        id: t.id,
        title: t.name || tree.label || 'Nomsiz daraxt',
        case_type: t.case_type || 'huquqiy',
        description: t.scenario || '',
        complexity_level: outcomes >= 8 ? 'high' : outcomes >= 4 ? 'medium' : 'low',
        created_at: t.created_at,
        updated_at: t.updated_at,
        status: 'active',
        confidence_score: Math.min(95, Math.max(35, Math.round(avgProb * 0.6 + 40 * 0.4))),
        total_nodes: total,
        completed_nodes: 0,
        current_node: tree.id || 'root',
        progress: 0,
        estimated_completion: null,
        outcomes: [],
      }
    })

    const active = trees.filter(t => t.status === 'active').length
    const completed = trees.filter(t => t.status === 'completed').length

    return NextResponse.json({
      trees,
      pagination: {
        total: trees.length,
        limit,
        offset,
        has_more: trees.length >= limit,
      },
      filters: { case_type: case_type || null },
      summary: {
        total_trees: trees.length,
        active_trees: active,
        completed_trees: completed,
        average_confidence: trees.length
          ? Math.round(
              trees.reduce((s: number, t: MappedTree) => s + t.confidence_score, 0) / trees.length
            )
          : 0,
      },
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Decision trees get error:', error)
    return NextResponse.json(
      { error: 'Qaror daraxtlarini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
