// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI XAVFSIZLIK TESTLARI
 *
 * 1.  unauthenticated AI request → 401
 * 2.  body'dagi spoofed userId ishonilmaydi — log session identity bilan yoziladi
 * 3.  limit tugagan → 429
 * 4.  valid request → 200 (Groq fetch mock)
 * 5.  oversized request → 400
 * 6.  provider failure → 502 (fake muvaffaqiyat qaytarilmaydi)
 * 7.  malformed request → 400
 * 8.  document-generate auth talab qiladi
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// GROQ_API_KEY route'lar import paytida o'qiladi — importdan oldin o'rnatish shart
vi.hoisted(() => {
  process.env.GROQ_API_KEY = 'test-groq-key'
})

const state = vi.hoisted(() => {
  const rows: Record<string, any[]> = {
    registered_users: [],
    user_usage_limits: [],
    pricing_plans: [],
    site_settings: [],
    usage_logs: [],
    articles: [],
    categories: [],
  }
  const tokens: Record<string, { id: string; email: string }> = {}

  const makeClient = () => {
    const chain = (table: string) => {
      const q: any = {
        __table: table,
        __filters: [] as Array<{ k: string; v: any; ilike?: boolean }>,
        __countOpt: false,
        __orderKey: '',
        __orderDesc: false,
      }
      const matches = (row: any) =>
        q.__filters.every(({ k, v, ilike }: any) => {
          const a = String(row[k] ?? '')
          const b = String(v)
          return ilike ? a.toLowerCase() === b.toLowerCase() : a === b
        })
      q.select = (_cols?: string, opts?: any) => {
        if (opts && typeof opts === 'object' && opts.count) q.__countOpt = true
        return q
      }
      q.eq = (k: string, v: any) => {
        q.__filters.push({ k, v })
        return q
      }
      q.ilike = (k: string, v: any) => {
        q.__filters.push({ k, v, ilike: true })
        return q
      }
      q.or = () => q
      q.textSearch = () => q
      q.limit = () => q
      q.range = () => q
      q.in = () => q
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
      q.update = (payload: any) => {
        rows[table].filter(matches).forEach(row => Object.assign(row, payload))
        return q
      }
      q.maybeSingle = async () => {
        const arr = rows[table].filter(matches)
        return { data: arr[0] ?? null, error: null }
      }
      q.single = async () => {
        if (q.__lastInserted) {
          const row = q.__lastInserted
          q.__lastInserted = null
          return { data: row, error: null }
        }
        const arr = rows[table].filter(matches)
        return { data: arr[0] ?? {}, error: arr.length ? null : { message: 'not found' } }
      }
      // await q — SELECT natijasi (count so'ralganda count bilan)
      q.then = (resolve: any, reject: any) => {
        let arr = rows[table].filter(matches)
        if (q.__orderKey) {
          arr = [...arr].sort((a, b) => {
            const av = String(a[q.__orderKey] ?? '')
            const bv = String(b[q.__orderKey] ?? '')
            const c = av < bv ? -1 : av > bv ? 1 : 0
            return q.__orderDesc ? -c : c
          })
        }
        const result: any = { data: arr, error: null }
        if (q.__countOpt) result.count = arr.length
        Promise.resolve(result).then(resolve, reject)
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

  return { rows, tokens, makeClient }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => state.makeClient(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => state.makeClient(),
}))

import { POST as chatPOST } from '@/app/api/ai/chat/route'
import { POST as legalChatPOST } from '@/app/api/ai/legal-chat/route'
import { POST as docGenPOST } from '@/app/api/ai/document-generate/route'
import { POST as docAnalysisPOST } from '@/app/api/ai/document-analysis/route'
import { POST as iracPOST } from '@/app/api/ai/irac-analyze/route'

const USER_TOKEN = 'token-user'
const OTHER_TOKEN = 'token-other'

function mockRequest(opts: { token?: string; body?: any }): any {
  const headers = new Headers()
  if (opts.token) headers.set('authorization', `Bearer ${opts.token}`)
  return {
    url: 'http://localhost/api/test',
    nextUrl: new URL('http://localhost/api/test'),
    headers,
    json: async () => opts.body ?? {},
    cookies: { get: () => (opts.token ? { value: opts.token } : undefined) },
  }
}

function groqOk(content: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

function groqFail(status: number): Response {
  return new Response(JSON.stringify({ error: 'upstream down' }), {
    status,
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
    [USER_TOKEN]: { id: 'user-1', email: 'user@test.uz' },
    [OTHER_TOKEN]: { id: 'user-2', email: 'other@test.uz' },
  })
  state.rows.registered_users = [
    { id: 'user-1', email: 'user@test.uz', role: 'USER', subscription_plan: 'free' },
    { id: 'user-2', email: 'other@test.uz', role: 'USER', subscription_plan: 'free' },
  ]
  state.rows.pricing_plans = [
    { id: 'free', name: 'Bepul', price: 0, limits: { ai_chat: 10, document_analysis: 2 } },
    { id: 'standart', name: 'Standart', price: 45000, limits: { ai_chat: 200 } },
    { id: 'pro', name: 'Pro', price: 140000, limits: { ai_chat: -1 } },
  ]
  state.rows.site_settings = [{ id: 'global', fair_use_limits: { ai_chat: 500 } }]

  global.fetch = vi.fn(async () => groqOk('Test javob.')) as any
})

afterEach(() => {
  vi.restoreAllMocks()
  ;(global.fetch as any)?.mockClear?.()
})

describe('1) Unauthenticated AI request → 401', () => {
  it('chat without token → 401', async () => {
    const res = await chatPOST(mockRequest({ body: { message: 'Salom' } }))
    expect(res.status).toBe(401)
  })

  it('legal-chat without token → 401', async () => {
    const res = await legalChatPOST(mockRequest({ body: { message: 'Salom' } }))
    expect(res.status).toBe(401)
  })

  it('document-generate without token → 401', async () => {
    const res = await docGenPOST(
      mockRequest({ body: { templateId: 'shartnoma', documentData: { a: 1 } } })
    )
    expect(res.status).toBe(401)
  })

  it('document-analysis without token → 401', async () => {
    const res = await docAnalysisPOST(
      mockRequest({ body: { documentText: 'x'.repeat(100) } })
    )
    expect(res.status).toBe(401)
  })

  it('irac-analyze without token → 401', async () => {
    const res = await iracPOST(mockRequest({ body: { caseText: 'x'.repeat(100) } }))
    expect(res.status).toBe(401)
  })
})

describe('2) Spoofed userId in body is NEVER trusted', () => {
  it('document-analysis logs session identity (user-1), not body userId (user-2)', async () => {
    const res = await docAnalysisPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { documentText: 'x'.repeat(100), userId: 'user-2', documentType: 'test' },
      })
    )
    expect(res.status).toBe(200)
    const log = state.rows.usage_logs.find((l: any) => l.action === 'document_analysis')
    expect(log).toBeDefined()
    expect(log.user_id).toBe('user-1') // session — body userId emas!
    expect(log.email).toBe('user@test.uz')
  })

  it('irac-analyze does not read userId from body at all', async () => {
    const res = await iracPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { caseText: 'x'.repeat(100), userId: 'user-2' },
      })
    )
    expect(res.status).toBe(200)
    const log = state.rows.usage_logs.find((l: any) => l.action === 'irac')
    expect(log).toBeDefined()
    expect(log.user_id).toBe('user-1')
  })
})

describe('3) Exhausted limit → 429', () => {
  it('user_usage_limits monthly_limit=0 → chat 429', async () => {
    state.rows.user_usage_limits = [
      { user_id: 'user-1', feature: 'ai_chat', monthly_limit: 0 },
    ]
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 'Salom' } }))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toBe('limit_reached')
  })

  it('free plan default limit reached (10 chats used) → chat 429', async () => {
    for (let i = 0; i < 10; i++) {
      state.rows.usage_logs.push({
        id: `u${i}`,
        user_id: 'user-1',
        email: 'user@test.uz',
        action: 'ai_chat',
        created_at: new Date().toISOString(),
      })
    }
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 'Salom' } }))
    expect(res.status).toBe(429)
  })

  it('other user limit is NOT affected', async () => {
    state.rows.user_usage_limits = [
      { user_id: 'user-2', feature: 'ai_chat', monthly_limit: 0 },
    ]
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 'Salom' } }))
    expect(res.status).toBe(200) // user-1 ga cheklov yo'q
  })
})

describe('4) Valid request → 200', () => {
  it('chat with valid token and message → 200 with response', async () => {
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 'Salom' } }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.response).toBe('Test javob.')
  })

  it('document-generate valid → 200, document returned', async () => {
    const res = await docGenPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { templateId: 'shartnoma', templateName: 'Mehnat shartnomasi', documentData: { x: 1 } },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.document).toBe('Test javob.')
  })
})

describe('5) Oversized request → 400', () => {
  it('chat message > 4000 chars → 400', async () => {
    const res = await chatPOST(
      mockRequest({ token: USER_TOKEN, body: { message: 'x'.repeat(4001) } })
    )
    expect(res.status).toBe(400)
  })

  it('document-analysis text > 30000 chars → 400', async () => {
    const res = await docAnalysisPOST(
      mockRequest({ token: USER_TOKEN, body: { documentText: 'x'.repeat(30001) } })
    )
    expect(res.status).toBe(400)
  })

  it('document-generate data > 50000 chars → 400', async () => {
    const res = await docGenPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { templateId: 't1', documentData: { big: 'x'.repeat(60000) } },
      })
    )
    expect(res.status).toBe(400)
  })
})

describe('6) Provider failure → 502 (NO fake success)', () => {
  it('Groq 500 → document-generate 502, no fake document', async () => {
    ;(global.fetch as any).mockResolvedValue(groqFail(500))
    const res = await docGenPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { templateId: 'shartnoma', documentData: { x: 1 } },
      })
    )
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.document).toBeUndefined() // soxta hujjat yo'q
    expect(json.error).toBeDefined()
  })

  it('Groq 500 → document-analysis 502, no fake success text', async () => {
    ;(global.fetch as any).mockResolvedValue(groqFail(500))
    const res = await docAnalysisPOST(
      mockRequest({ token: USER_TOKEN, body: { documentText: 'x'.repeat(100) } })
    )
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.analysis).toBeUndefined()
    expect(json.error).toBeDefined()
  })

  it('fetch network error → chat 500', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('network down'))
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 'Salom' } }))
    expect(res.status).toBe(500)
  })
})

describe('7) Malformed request → 400', () => {
  it('chat empty message → 400', async () => {
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: '' } }))
    expect(res.status).toBe(400)
  })

  it('chat non-string message → 400', async () => {
    const res = await chatPOST(mockRequest({ token: USER_TOKEN, body: { message: 123 } }))
    expect(res.status).toBe(400)
  })

  it('document-generate without templateId → 400', async () => {
    const res = await docGenPOST(
      mockRequest({ token: USER_TOKEN, body: { documentData: { x: 1 } } })
    )
    expect(res.status).toBe(400)
  })
})

describe('8) Document generation requires authentication', () => {
  it('fake token → 401', async () => {
    const res = await docGenPOST(
      mockRequest({
        token: 'forged-token',
        body: { templateId: 'shartnoma', documentData: { x: 1 } },
      })
    )
    expect(res.status).toBe(401)
  })

  it('valid token works', async () => {
    const res = await docGenPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { templateId: 'shartnoma', documentData: { x: 1 } },
      })
    )
    expect(res.status).toBe(200)
  })
})
