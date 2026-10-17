import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { awardUserXP } from '@/lib/xp-engine'

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

    const supabase = getSupabaseAdmin()
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
      const meta = (treeObj && typeof treeObj === 'object' && (treeObj as any).metadata) || {}
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
        ...meta,
        ...r,
        user_role: r.user_role ?? meta.user_role ?? 'davogar',
        objectives: r.objectives ?? meta.objectives ?? '',
        known_facts: r.known_facts ?? meta.known_facts ?? '',
        evidence_docs: r.evidence_docs ?? meta.evidence_docs ?? '',
        opposing_party: r.opposing_party ?? meta.opposing_party ?? '',
        deadlines: r.deadlines ?? meta.deadlines ?? '',
        additional_notes: r.additional_notes ?? meta.additional_notes ?? '',
        analysis: r.analysis ?? meta.analysis ?? {},
        selected_path: r.selected_path ?? meta.selected_path ?? [],
        evidence_state: r.evidence_state ?? meta.evidence_state ?? {},
        notes: r.notes ?? meta.notes ?? '',
        status: r.status ?? meta.status ?? 'active',
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
 * Yangi qaror daraxtini Supabase bazasiga saqlash va XP berish.
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
      status = 'active',
    } = body

    if (!name || !tree) {
      return NextResponse.json(
        { success: false, error: 'Ish nomi va daraxt tuzilmasi talab qilinadi' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const now = new Date().toISOString()

    const metadataToStore: Record<string, unknown> = {
      user_role: String(user_role).trim(),
      objectives: String(objectives || '').trim(),
      known_facts: String(known_facts || '').trim(),
      evidence_docs: String(evidence_docs || '').trim(),
      opposing_party: String(opposing_party || '').trim(),
      deadlines: String(deadlines || '').trim(),
      additional_notes: String(additional_notes || '').trim(),
      analysis: analysis || {},
      selected_path: selected_path || [],
      evidence_state: evidence_state || {},
      notes: String(notes || '').trim(),
      status: String(status || 'active').trim(),
    }

    // Persist all metadata inside tree JSONB so no data is ever lost even if DB columns are missing
    const enrichedTree =
      tree && typeof tree === 'object'
        ? {
            ...tree,
            metadata: {
              ...((tree as any).metadata || {}),
              ...metadataToStore,
            },
          }
        : tree

    let payload: Record<string, unknown> = {
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
      tree: enrichedTree,
      analysis,
      selected_path,
      evidence_state,
      notes: String(notes || '').trim(),
      status: String(status || 'active').trim(),
      scenario: String(objectives || known_facts || additional_notes || '').slice(0, 1000),
      created_at: now,
      updated_at: now,
    }

    let insertResult = await supabase.from('decision_trees').insert(payload).select('*').single()

    // Self-healing retry if any column does not exist in the Supabase schema cache
    let retries = 0
    while (insertResult.error && retries < 15) {
      retries++
      const msg = insertResult.error.message || ''
      const match =
        msg.match(/Could not find the '([^']+)' column/i) ||
        msg.match(/column "?([a-zA-Z0-9_]+)"? of relation/i)
      if (
        match &&
        match[1] &&
        match[1] in payload &&
        match[1] !== 'tree' &&
        match[1] !== 'user_id' &&
        match[1] !== 'name'
      ) {
        const missingCol = match[1]
        console.warn(
          `[decision-tree] Column '${missingCol}' missing in DB schema cache. Omitting and retrying...`
        )
        delete payload[missingCol]
        insertResult = await supabase.from('decision_trees').insert(payload).select('*').single()
      } else if (msg.includes('schema cache') || msg.includes('column')) {
        console.warn(`[decision-tree] Falling back to core columns due to schema error: ${msg}`)
        payload = {
          user_id: auth.user.id,
          name: String(name).trim(),
          case_type: String(case_type).trim(),
          tree: enrichedTree,
          scenario: String(objectives || known_facts || additional_notes || '').slice(0, 1000),
          created_at: now,
          updated_at: now,
        }
        insertResult = await supabase.from('decision_trees').insert(payload).select('*').single()
        break
      } else {
        break
      }
    }

    if (insertResult.error || !insertResult.data) {
      console.error('Decision tree save error:', insertResult.error?.message)
      return NextResponse.json(
        {
          success: false,
          error:
            'Daraxtni saqlashda maʼlumotlar bazasi xatosi: ' +
            (insertResult.error?.message || 'Nomaʼlum xatolik'),
        },
        { status: 500 }
      )
    }

    const savedRow = insertResult.data as Record<string, unknown>
    const normalizedCase = {
      ...metadataToStore,
      ...savedRow,
      user_role: savedRow.user_role ?? metadataToStore.user_role,
      objectives: savedRow.objectives ?? metadataToStore.objectives,
      known_facts: savedRow.known_facts ?? metadataToStore.known_facts,
      evidence_docs: savedRow.evidence_docs ?? metadataToStore.evidence_docs,
      opposing_party: savedRow.opposing_party ?? metadataToStore.opposing_party,
      deadlines: savedRow.deadlines ?? metadataToStore.deadlines,
      additional_notes: savedRow.additional_notes ?? metadataToStore.additional_notes,
      analysis: savedRow.analysis ?? metadataToStore.analysis,
      selected_path: savedRow.selected_path ?? metadataToStore.selected_path,
      evidence_state: savedRow.evidence_state ?? metadataToStore.evidence_state,
      notes: savedRow.notes ?? metadataToStore.notes,
      status: savedRow.status ?? metadataToStore.status,
    }

    // Award XP (+15 XP)
    const idempotencyKey = `decision_tree_create_${savedRow.id}`
    const xpResult = await awardUserXP({
      userId: auth.user.id,
      userEmail: auth.user.email,
      action: 'decision-tree',
      xp: 15,
      title: `Qarorlar daraxti yaratildi: ${name}`,
      description: `${case_type} bo‘yicha yuridik strategiya tahlili`,
      idempotencyKey,
      metadata: {
        tree_id: savedRow.id,
        name,
        case_type,
      },
    })

    return NextResponse.json({
      success: true,
      case: normalizedCase,
      xpEarned: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
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
