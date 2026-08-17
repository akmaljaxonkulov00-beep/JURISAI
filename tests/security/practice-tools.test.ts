// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * COURT / DECISION TREE / SCENARIO / IRAC — REAL MA'LUMOT VA XAVFSIZLIK TESTLARI
 *
 * 1.  authsiz → 401 (barcha endpoint)
 * 2.  User A User B ning daraxtini yangilay olmaydi → 403
 * 3.  User A User B ning sud sessiyasiga yozolmaydi → 403
 * 4.  Sessiya/daraxt/senariy/tahlil faqat session user_id bilan saqlanadi
 *     (body'dagi userId ishonilmaydi)
 * 5.  Decision trees GET — faqat o'z daraxtlari (mock array yo'q)
 * 6.  Senariy shablonlari — real scenario_templates jadvalidan
 * 7.  IRAC save — deterministik feedback (Math.random yo'q)
 * 8.  Sud sessiyasi — real court_sessions/court_messages yozuvi
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.hoisted(() => {
  process.env.GROQ_API_KEY = 'test-groq-key'
})

const state = vi.hoisted(() => {
  const rows: Record<string, any[]> = {
    registered_users: [],
    decision_trees: [],
    scenarios: [],
    scenario_templates: [],
    irac_analyses: [],
    court_sessions: [],
    court_messages: [],
    usage_logs: [],
    user_usage_limits: [],
    pricing_plans: [],
    site_settings: [],
  }
  const tokens: Record<string, { id: string; email: string }> = {}

  const makeClient = () => {
    const chain = (table: string) => {
      const q: any = {
        __table: table,
        __filters: [] as Array<{ k: string; v: any; ilike?: boolean }>,
        __pending: null as any,
        __orderKey: '',
        __orderDesc: false,
        __lastInserted: null as any,
      }
      const matches = (row: any) =>
        q.__filters.every(({ k, v, ilike }: any) => {
          const a = String(row[k] ?? '')
          const b = String(v)
          return ilike ? a.toLowerCase() === b.toLowerCase() : a === b
        })
      q.select = () => q
      q.eq = (k: string, v: any) => {
        q.__filters.push({ k, v })
        return q
      }
      q.in = (k: string, v: any[]) => {
        q.__filters.push({ k, v, mode: 'in' })
        return q
      }
      q.ilike = (k: string, v: any) => {
        q.__filters.push({ k, v, ilike: true })
        return q
      }
      q.or = () => q
      q.limit = () => q
      q.range = () => q
      q.gte = () => q
      q.lte = () => q
      q.order = (k: string, opts?: any) => {
        q.__orderKey = k
        q.__orderDesc = !!opts?.ascending === false
        return q
      }
      q.insert = (payload: any) => {
        const list = Array.isArray(payload) ? payload : [payload]
        const committed = list.map((p: any) => {
          const row = { ...p }
          if (!row.id) row.id = `gen-${rows[table].length + 1}`
          rows[table].push(row)
          return row
        })
        q.__lastInserted = committed[0]
        return q
      }
      q.upsert = (payload: any) => {
        const list = Array.isArray(payload) ? payload : [payload]
        for (const p of list) {
          const row = { ...p }
          if (!row.id) row.id = `gen-${rows[table].length + 1}`
          rows[table].push(row)
        }
        return q
      }
      q.update = (payload: any) => {
        q.__pending = { op: 'update', payload }
        return q
      }
      q.delete = () => {
        q.__pending = { op: 'delete' }
        return q
      }
      const applyPending = () => {
        if (!q.__pending) return []
        if (q.__pending.op === 'update') {
          const updated: any[] = []
          rows[table].filter(matches).forEach(row => {
            Object.assign(row, q.__pending.payload)
            updated.push(row)
          })
          return updated
        }
        if (q.__pending.op === 'delete') {
          const toRemove = rows[table].filter(matches)
          for (const r of toRemove) {
            const idx = rows[table].indexOf(r)
            if (idx >= 0) rows[table].splice(idx, 1)
          }
          return toRemove
        }
        return []
      }
      q.maybeSingle = async () => {
        const applied = applyPending()
        const arr = q.__pending ? applied : rows[table].filter(matches)
        return { data: arr[0] ?? null, error: null }
      }
      q.single = async () => {
        if (q.__lastInserted) {
          const row = q.__lastInserted
          q.__lastInserted = null
          return { data: row, error: null }
        }
        const applied = applyPending()
        const arr = q.__pending ? applied : rows[table].filter(matches)
        return { data: arr[0] ?? {}, error: arr.length ? null : { message: 'not found' } }
      }
      q.then = (resolve: any, reject: any) => {
        const applied = applyPending()
        let arr = q.__pending ? applied : rows[table].filter(matches)
        if (q.__orderKey) {
          arr = [...arr].sort((a, b) => {
            const av = String(a[q.__orderKey] ?? '')
            const bv = String(b[q.__orderKey] ?? '')
            const c = av < bv ? -1 : av > bv ? 1 : 0
            return q.__orderDesc ? -c : c
          })
        }
        Promise.resolve({ data: arr, error: null }).then(resolve, reject)
      }
      return q
    }
    return {
      auth: {
        getUser: async (token?: string) => {
          const u = token ? tokens[token] : undefined
          return u
            ? { data: { user: u }, error: null }
            : { data: { user: null }, error: new Error('invalid token') }
        },
      },
      from: (table: string) => chain(table),
    }
  }

  const client = makeClient()
  return { rows, tokens, makeClient, client }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => state.makeClient(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: state.client,
  supabaseClient: state.client,
  supabaseServer: state.client,
  default: state.client,
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => state.makeClient(),
}))

vi.mock('@/lib/server-auth', () => ({
  requireUser: async (req: any) => {
    const header = req.headers?.get?.('authorization') || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.get?.('sb-access-token')?.value
    const user = token ? state.tokens[token] : undefined
    if (!user) {
      return { ok: false, response: { status: 401, json: async () => ({ error: 'Unauthorized' }) } }
    }
    return { ok: true, user }
  },
  requireAdmin: async (req: any) => {
    const header = req.headers?.get?.('authorization') || ''
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.get?.('sb-access-token')?.value
    const user = token ? state.tokens[token] : undefined
    if (!user) {
      return { ok: false, response: { status: 401, json: async () => ({ error: 'Unauthorized' }) } }
    }
    const profile = state.rows.registered_users.find((u: any) => u.id === user.id)
    if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(String(profile.role).toUpperCase())) {
      return { ok: false, response: { status: 403, json: async () => ({ error: 'Forbidden' }) } }
    }
    return { ok: true, user, role: 'ADMIN' }
  },
}))

vi.mock('@/lib/usage-limits', () => ({
  checkAndIncrement: async () => ({ allowed: true, remaining: 99, limit: 100, resetAt: null }),
  usageMessage: (u: any) => u?.message || 'Limit tugadi',
}))

vi.mock('@/lib/legal-rag', () => ({
  groundPrompt: async (text: string, base: string) => ({ prompt: base, articles: [] }),
  validateCitations: async () => ({ valid: [], invalid: [] }),
  appendCitationNote: (text: string) => text,
}))

import { GET as treesGET } from '@/app/api/decision-tree/trees/route'
import { GET as nodesGET } from '@/app/api/decision-tree/nodes/route'
import { PUT as treeUpdatePUT } from '@/app/api/decision-tree/tree/[id]/update/route'
import { GET as scenariosGET, POST as scenariosPOST } from '@/app/api/scenario-generator/scenarios/route'
import { GET as templatesGET } from '@/app/api/scenario-generator/templates/route'
import { POST as saveAnalysisPOST } from '@/app/api/case-solver/save-analysis/route'
import { POST as courtPOST } from '@/app/api/court-simulator/route'

const A_TOKEN = 'token-a'
const B_TOKEN = 'token-b'

function mockRequest(opts: { token?: string; body?: any; query?: Record<string, string>; params?: { id: string } }): any {
  const headers = new Headers()
  if (opts.token) headers.set('authorization', `Bearer ${opts.token}`)
  const url = new URL('http://localhost/api/test')
  for (const [k, v] of Object.entries(opts.query || {})) url.searchParams.set(k, v)
  return {
    url: url.toString(),
    nextUrl: url,
    headers,
    json: async () => opts.body ?? {},
    cookies: { get: () => (opts.token ? { value: opts.token } : undefined) },
    params: Promise.resolve({ id: opts.params?.id || 'tree-1' }),
  }
}

function groqResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

  for (const k of Object.keys(state.rows)) state.rows[k] = []
  Object.keys(state.tokens).forEach(k => delete state.tokens[k])
  Object.assign(state.tokens, {
    [A_TOKEN]: { id: 'user-a', email: 'a@test.uz' },
    [B_TOKEN]: { id: 'user-b', email: 'b@test.uz' },
  })
  state.rows.registered_users = [
    { id: 'user-a', email: 'a@test.uz', full_name: 'User A', role: 'USER' },
    { id: 'user-b', email: 'b@test.uz', full_name: 'User B', role: 'USER' },
  ]
  state.rows.pricing_plans = [
    { id: 'free', name: 'Bepul', price: 0, limits: { virtual_court: 10 } },
  ]
  state.rows.site_settings = [{ id: 'global', fair_use_limits: {} }]

  // Groq mock — eval so'rovi uchun JSON, qolgani rol matni
  global.fetch = vi.fn(async (url: any, init: any) => {
    const bodyStr = String(init?.body || '')
    if (bodyStr.includes('JSON')) {
      return groqResponse('{"legalAccuracy":85,"argument":80,"ethics":90}')
    }
    return groqResponse(
      '[KOTIBA]: Majlis bayoni yuritiladi.\n[SUDYA]: Sud majlisini ochaman, taraflar ishtirok etadi.'
    )
  }) as any
})

afterEach(() => {
  vi.restoreAllMocks()
  ;(global.fetch as any)?.mockClear?.()
})

// ────────────────────────────────────────────────────────────────────────────
describe('1) Unauthenticated → 401', () => {
  it('decision trees GET without token → 401', async () => {
    const res = await treesGET(mockRequest({}))
    expect(res.status).toBe(401)
  })
  it('decision tree nodes GET without token → 401', async () => {
    const res = await nodesGET(mockRequest({ query: { tree_id: 't1' } }))
    expect(res.status).toBe(401)
  })
  it('decision tree update PUT without token → 401', async () => {
    const res = await treeUpdatePUT(
      mockRequest({ body: { node_id: 'n1', decision: 'x' } }),
      { params: Promise.resolve({ id: 't1' }) }
    )
    expect(res.status).toBe(401)
  })
  it('scenarios GET without token → 401', async () => {
    const res = await scenariosGET(mockRequest({}))
    expect(res.status).toBe(401)
  })
  it('scenarios POST without token → 401', async () => {
    const res = await scenariosPOST(mockRequest({ body: { data: { title: 'x' } } }))
    expect(res.status).toBe(401)
  })
  it('save-analysis POST without token → 401', async () => {
    const res = await saveAnalysisPOST(
      mockRequest({ body: { case_title: 'Ish', irac_analysis: {} } })
    )
    expect(res.status).toBe(401)
  })
  it('court simulator POST without token → 401', async () => {
    const res = await courtPOST(mockRequest({ body: { action: 'start', caseDetails: 'Ish' } }))
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('2) Decision tree — ownership va real ma\'lumot', () => {
  const treeA = {
    id: 'root',
    label: 'A daraxti',
    type: 'root',
    children: [
      { id: 'n1', label: 'Sudga berish', type: 'decision', probability: 60, children: [
        { id: 'n2', label: "G'alaba", type: 'outcome', probability: 50 },
      ] },
    ],
  }

  it('A B-ning daraxtini yangilay olmaydi → 403', async () => {
    state.rows.decision_trees = [
      { id: 'tree-b', user_id: 'user-b', name: 'B daraxti', tree: treeA, case_type: 'huquqiy' },
    ]
    const res = await treeUpdatePUT(
      mockRequest({
        token: A_TOKEN,
        body: { node_id: 'n1', decision: 'yoq', confidence: 0.9 },
      }),
      { params: Promise.resolve({ id: 'tree-b' }) }
    )
    expect(res.status).toBe(403)
    // B daraxti o'zgarmagan
    expect(state.rows.decision_trees[0].tree.current_node).toBeUndefined()
  })

  it('A o\'z daraxtini yangilay oladi → 200 va DB real yangilanadi', async () => {
    state.rows.decision_trees = [
      { id: 'tree-a', user_id: 'user-a', name: 'A daraxti', tree: treeA, case_type: 'huquqiy' },
    ]
    const res = await treeUpdatePUT(
      mockRequest({
        token: A_TOKEN,
        body: { node_id: 'n1', decision: 'Sudga beramiz', confidence: 0.75 },
      }),
      { params: Promise.resolve({ id: 'tree-a' }) }
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    // Real DB yangilanishi: path_taken + current_node yozilgan
    const updated = state.rows.decision_trees[0]
    expect(updated.tree.path_taken).toContain('n1')
    expect(updated.tree.current_node).toBe('n2')
    expect(updated.tree.last_decision.decision).toBe('Sudga beramiz')
    expect(json.next_nodes.length).toBeGreaterThan(0)
  })

  it('trees GET — faqat o\'z daraxtlari (B-niki ko\'rinmaydi)', async () => {
    state.rows.decision_trees = [
      { id: 'tree-a', user_id: 'user-a', name: 'A daraxti', tree: treeA, case_type: 'huquqiy', updated_at: '2026-01-02T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'tree-b', user_id: 'user-b', name: 'B daraxti', tree: treeA, case_type: 'huquqiy', updated_at: '2026-01-03T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z' },
    ]
    const res = await treesGET(mockRequest({ token: A_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    const ids = json.trees.map((t: any) => t.id)
    expect(ids).toContain('tree-a')
    expect(ids).not.toContain('tree-b')
    // Real daraxtdan hisoblangan ma'lumot (mock emas)
    expect(json.trees[0].total_nodes).toBeGreaterThan(0)
    expect(typeof json.trees[0].confidence_score).toBe('number')
  })

  it('nodes GET — tugunlar real daraxt JSONB\'dan', async () => {
    state.rows.decision_trees = [
      { id: 'tree-a', user_id: 'user-a', name: 'A', tree: treeA, case_type: 'huquqiy' },
    ]
    const res = await nodesGET(mockRequest({ token: A_TOKEN, query: { tree_id: 'tree-a' } }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total_nodes).toBe(3) // root + n1 + n2
    expect(json.nodes[0].title).toBe('A daraxti')
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('3) Scenario generator — ownership va real shablonlar', () => {
  it('scenarios GET — faqat o\'z senariylari', async () => {
    state.rows.scenarios = [
      { id: 's1', user_id: 'user-a', title: 'A senariysi', scenario_type: 'civil', difficulty_level: 'medium', complexity: 'standard', description: 'A', data: { participants: [], case_data: {}, objectives: [], legal_references: [] }, created_at: '2026-01-01T00:00:00.000Z' },
      { id: 's2', user_id: 'user-b', title: 'B senariysi', scenario_type: 'civil', difficulty_level: 'medium', complexity: 'standard', description: 'B maxfiy', data: { participants: [], case_data: {}, objectives: [], legal_references: [] }, created_at: '2026-01-02T00:00:00.000Z' },
    ]
    const res = await scenariosGET(mockRequest({ token: A_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    const ids = json.scenarios.map((s: any) => s.id)
    expect(ids).toContain('s1')
    expect(ids).not.toContain('s2')
  })

  it('scenarios POST — user_id session\'dan (body userId ishonilmaydi)', async () => {
    const res = await scenariosPOST(
      mockRequest({
        token: A_TOKEN,
        body: {
          userId: 'user-b',
          data: {
            title: 'Yangi senariy',
            scenario_type: 'criminal',
            difficulty_level: 'hard',
            complexity: 'complex',
            description: 'Tavsif',
            participants: [],
            case_data: {},
            objectives: [],
            legal_references: [],
          },
        },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.scenario.id).toBeDefined()
    expect(state.rows.scenarios[0].user_id).toBe('user-a') // session — body emas
    expect(state.rows.scenarios[0].title).toBe('Yangi senariy')
  })

  it('templates GET — real scenario_templates jadvalidan (mock yo\'q)', async () => {
    state.rows.scenario_templates = [
      { id: 'tpl-1', name: 'Jinoyat tergovi', scenario_type: 'criminal', difficulty_level: 'medium', description: 'Real shablon', structure: {}, duration_minutes: 50, participants_count: 4, key_elements: [], learning_objectives: [], evaluation_criteria: [], materials_needed: [], created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z', usage_count: 0, rating: 0 },
    ]
    const res = await templatesGET(mockRequest({ query: { scenario_type: 'criminal' } }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.templates).toHaveLength(1)
    expect(json.templates[0].name).toBe('Jinoyat tergovi')
    expect(json.templates[0].id).toBe('tpl-1')
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('4) IRAC save-analysis — real saqlash, deterministik feedback', () => {
  const payload = {
    case_title: 'O\'g\'irlik ishi',
    case_category: 'criminal',
    case_difficulty: 'medium',
    irac_analysis: {
      issue: 'O\'g\'irlik jinoyati bo\'yicha huquqiy masala',
      rule: 'JK 169-moddasiga ko\'ra',
      application: 'Chunki dalillar mavjud',
      conclusion: 'Shu sababga ko\'ra javobgarlik belgilanadi',
    },
    total_score: 85,
    completed_at: '2026-01-01T00:00:00.000Z',
  }

  it('user_id session\'dan, body userId ishonilmaydi', async () => {
    const res = await saveAnalysisPOST(
      mockRequest({ token: A_TOKEN, body: { ...payload, userId: 'user-b' } })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.id).toBeDefined()
    expect(state.rows.irac_analyses[0].user_id).toBe('user-a')
    expect(state.rows.irac_analyses[0].total_score).toBe(85)
    expect(state.rows.irac_analyses[0].grade).toContain('A')
  })

  it('feedback deterministik — Math.random yo\'q (ikki chaqiruv bir xil natija)', async () => {
    const r1 = await saveAnalysisPOST(mockRequest({ token: A_TOKEN, body: payload }))
    const j1 = await r1.json()
    state.rows.irac_analyses = []
    const r2 = await saveAnalysisPOST(mockRequest({ token: A_TOKEN, body: payload }))
    const j2 = await r2.json()
    expect(j1.feedback).toBe(j2.feedback)
    expect(j1.suggestions).toEqual(j2.suggestions)
    expect(j1.strengths).toEqual(j2.strengths)
    expect(j1.weaknesses).toEqual(j2.weaknesses)
    expect(j1.grade).toBe(j2.grade)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('5) Court simulator — real sessiya va egalik', () => {
  it('start — real court_sessions yozuvi yaratiladi, simulation_id = row id', async () => {
    const res = await courtPOST(
      mockRequest({
        token: A_TOKEN,
        body: { action: 'start', caseDetails: 'Supermarketdan tovar o\'g\'irlash', userRole: 'SUDYA', userName: 'User A' },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(state.rows.court_sessions).toHaveLength(1)
    expect(state.rows.court_sessions[0].user_id).toBe('user-a')
    expect(state.rows.court_sessions[0].status).toBe('active')
    expect(json.simulation_id).toBe(state.rows.court_sessions[0].id)
    // AI xabarlari ham bazaga yozilgan
    expect(state.rows.court_messages.length).toBeGreaterThan(0)
    expect(state.rows.court_messages[0].session_id).toBe(state.rows.court_sessions[0].id)
  })

  it('submit — User A User B ning sessiyasiga yozolmaydi → 403', async () => {
    state.rows.court_sessions = [
      { id: 'sim-b', user_id: 'user-b', title: 'B sessiyasi', status: 'active' },
    ]
    const res = await courtPOST(
      mockRequest({
        token: A_TOKEN,
        body: { action: 'submit_argument', simulationId: 'sim-b', argument: 'Men gapiraman', userRole: 'SUDYA', userName: 'A' },
      })
    )
    expect(res.status).toBe(403)
    expect(state.rows.court_messages).toHaveLength(0)
  })

  it('get_verdict — User A User B ning sessiyasini yakunlay olmaydi → 403', async () => {
    state.rows.court_sessions = [
      { id: 'sim-b', user_id: 'user-b', title: 'B sessiyasi', status: 'active' },
    ]
    const res = await courtPOST(
      mockRequest({
        token: A_TOKEN,
        body: { action: 'get_verdict', simulationId: 'sim-b', userRole: 'SUDYA' },
      })
    )
    expect(res.status).toBe(403)
    expect(state.rows.court_sessions[0].status).toBe('active') // yakunlanmagan
  })

  it('submit o\'z sessiyasida — xabar bazaga yoziladi', async () => {
    state.rows.court_sessions = [
      { id: 'sim-a', user_id: 'user-a', title: 'A sessiyasi', status: 'active' },
    ]
    const res = await courtPOST(
      mockRequest({
        token: A_TOKEN,
        body: { action: 'submit_argument', simulationId: 'sim-a', argument: 'SUDYA (statement): Ayblov asossiz', userRole: 'SUDYA', userName: 'User A' },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.roles.length).toBeGreaterThan(0)
    // Foydalanuvchi xabari + AI javoblari saqlangan
    const saved = state.rows.court_messages
    expect(saved.some((m: any) => m.speaker === 'SUDYA' && m.content.includes('Ayblov asossiz'))).toBe(true)
    expect(saved.some((m: any) => m.role === 'KOTIBA')).toBe(true)
    expect(saved.every((m: any) => m.session_id === 'sim-a')).toBe(true)
  })

  it('get_verdict o\'z sessiyasida — score/outcome bazaga yoziladi', async () => {
    state.rows.court_sessions = [
      { id: 'sim-a', user_id: 'user-a', title: 'A sessiyasi', status: 'active' },
    ]
    const res = await courtPOST(
      mockRequest({
        token: A_TOKEN,
        body: { action: 'get_verdict', simulationId: 'sim-a', userRole: 'SUDYA' },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(typeof json.score).toBe('number')
    const updated = state.rows.court_sessions[0]
    expect(updated.status).toBe('completed')
    expect(updated.score).toBe(json.score)
    expect(updated.outcome).toBe(json.outcome)
  })
})
