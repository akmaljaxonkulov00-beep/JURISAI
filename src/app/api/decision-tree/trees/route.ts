import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'
import { DecisionCase } from '@/types/decision-tree'

/**
 * GET /api/decision-tree/trees
 * Foydalanuvchining barcha saqlangan qaror daraxtlarini qidirish, filtrlash va saralash bilan qaytaradi.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const case_type = searchParams.get('case_type')
    const search = searchParams.get('search')?.toLowerCase().trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    let query = supabase
      .from('decision_trees')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (case_type && case_type !== 'all') {
      query = query.eq('case_type', case_type)
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,objectives.ilike.%${search}%,known_facts.ilike.%${search}%`
      )
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Decision trees fetch error:', error.message)
      return NextResponse.json({
        trees: [],
        total: 0,
        error: error.message,
      })
    }

    const rows = (data || []) as any[]
    const trees = rows.map(r => {
      const treeObj = r.tree
      const countNodes = (node: any): number => {
        if (!node || typeof node !== 'object') return 0
        let count = 1
        if (Array.isArray(node.children)) {
          for (const c of node.children) count += countNodes(c)
        }
        return count
      }
      const computeConfidence = (node: any, acc: number[] = []): number => {
        if (!node || typeof node !== 'object') return 75
        if (typeof node.confidence === 'number') acc.push(node.confidence)
        else if (typeof node.probability === 'number') acc.push(node.probability)
        if (Array.isArray(node.children)) {
          for (const c of node.children) computeConfidence(c, acc)
        }
        return acc.length ? Math.round(acc.reduce((s, p) => s + p, 0) / acc.length) : 75
      }

      const total_nodes = countNodes(treeObj) || 1
      const confidence_score = computeConfidence(treeObj)

      return {
        ...r,
        total_nodes,
        confidence_score,
      }
    })

    return NextResponse.json({
      success: true,
      trees,
      total: count || trees.length,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Decision trees GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Qaror daraxtlarini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/decision-tree/trees
 * Yangi qaror daraxtini Supabase bazasiga saqlash.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const {
      name,
      case_type = 'fuqarolik',
      user_role = 'davogar',
      objectives = '',
      known_facts = '',
      evidence_docs = '',
      opposing_party = '',
      deadlines = '',
      additional_notes = '',
      tree,
      analysis = {},
      selected_path = [],
      evidence_state = {},
      notes = '',
    } = body

    if (!name || !tree) {
      return NextResponse.json(
        { success: false, error: 'Ish nomi va daraxt tuzilmasi talab qilinadi' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const payload = {
      user_id: auth.user.id,
      name: String(name).trim(),
      case_type: String(case_type).trim(),
      user_role: String(user_role).trim(),
      objectives: String(objectives || '').trim(),
      known_facts: String(known_facts || '').trim(),
      evidence_docs: String(evidence_docs || '').trim(),
      opposing_party: String(opposing_party || '').trim(),
      deadlines: String(deadlines || '').trim(),
      additional_notes: String(additional_notes || '').trim(),
      tree,
      analysis,
      selected_path,
      evidence_state,
      notes: String(notes || '').trim(),
      status: 'active',
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('decision_trees')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Decision tree save error:', error.message)
      return NextResponse.json(
        { success: false, error: 'Daraxtni saqlashda maʼlumotlar bazasi xatosi: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      case: data,
      message: 'Qarorlar daraxti muvaffaqiyatli saqlandi',
    })
  } catch (error) {
    console.error('Decision tree POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Daraxtni saqlashda server xatosi' },
      { status: 500 }
    )
  }
}
