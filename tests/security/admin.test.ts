// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ADMIN PANEL XAVFSIZLIK TESTLARI
 *
 * 1.  unauthenticated → 401 (barcha admin endpoint)
 * 2.  oddiy user → 403 (barcha admin endpoint)
 * 3.  oddiy ADMIN boshqa foydalanuvchiga ADMIN rolini BERA OLMAYDI (privilege escalation)
 * 4.  SUPER_ADMIN rol berishi mumkin → 200 + audit log yoziladi
 * 5.  oxirgi SUPER_ADMIN'ni tushirib bo'lmaydi → 409
 * 6.  o'z-o'zini o'chirish taqiqlanadi → 403
 * 7.  analytics/users — FAQAT real ma'lumot (to'qima subskriptiya yo'q)
 * 8.  analytics/ai-usage — real usage_logs
 * 9.  analytics/revenue — real payment_requests
 * 10. reset-password faqat admin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = vi.hoisted(() => {
  const rows: Record<string, any[]> = {
    registered_users: [],
    pricing_plans: [],
    payment_requests: [],
    usage_logs: [],
    admin_audit_logs: [],
    site_settings: [],
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
      q.limit = () => q
      q.range = () => q
      q.gte = () => q
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
      q.delete = () => {
        // Haqiqiy o'chirish — mos kelgan qatorlar olib tashlanadi
        const toRemove = rows[table].filter(matches)
        for (const r of toRemove) {
          const idx = rows[table].indexOf(r)
          if (idx >= 0) rows[table].splice(idx, 1)
        }
        return q
      }
      q.maybeSingle = async () => {
        const arr = rows[table].filter(matches)
        return { data: arr[0] ?? null, error: null }
      }
      q.single = async () => {
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
        admin: {
          updateUserById: async () => ({ data: { user: { email: 'x@test.uz' } }, error: null }),
          deleteUser: async () => ({ data: {}, error: null }),
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

// tests/setup.ts dagi minimal stub'ni to'liq client bilan qoplaymiz —
// admin/users route `@/lib/supabase` orqali maybeSingle/or/ilike ishlatadi
vi.mock('@/lib/supabase', () => ({
  supabase: state.makeClient(),
  supabaseClient: state.makeClient(),
  supabaseServer: state.makeClient(),
  default: state.makeClient(),
}))

import { GET as usersAnalyticsGET } from '@/app/api/admin/analytics/users/route'
import { GET as aiUsageAnalyticsGET } from '@/app/api/admin/analytics/ai-usage/route'
import { GET as revenueAnalyticsGET } from '@/app/api/admin/analytics/revenue/route'
import { PATCH as usersPATCH, DELETE as usersDELETE } from '@/app/api/admin/users/route'
import { POST as resetPasswordPOST } from '@/app/api/admin/users/reset-password/route'

const SUPER_TOKEN = 'token-super'
const ADMIN_TOKEN = 'token-admin'
const USER_TOKEN = 'token-user'

function mockRequest(opts: { token?: string; body?: any; query?: Record<string, string> }): any {
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
  }
}

function seedUsers() {
  state.rows.registered_users = [
    {
      id: 'super-1',
      email: 'super@test.uz',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      subscription_plan: 'free',
      created_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'admin-1',
      email: 'admin@test.uz',
      name: 'Admin User',
      role: 'ADMIN',
      subscription_plan: 'free',
      created_at: '2025-02-01T00:00:00.000Z',
    },
    {
      id: 'user-1',
      email: 'user@test.uz',
      name: 'Regular User',
      role: 'USER',
      subscription_plan: 'standart',
      subscription_expires_at: '2099-01-01T00:00:00.000Z',
      created_at: '2025-03-01T00:00:00.000Z',
    },
    {
      id: 'user-2',
      email: 'expired@test.uz',
      name: 'Expired User',
      role: 'USER',
      subscription_plan: 'pro',
      subscription_expires_at: '2020-01-01T00:00:00.000Z',
      created_at: '2025-03-02T00:00:00.000Z',
    },
    {
      id: 'user-3',
      email: 'target@test.uz',
      name: 'Target User',
      role: 'USER',
      subscription_plan: 'free',
      created_at: '2025-03-03T00:00:00.000Z',
    },
  ]
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

  for (const k of Object.keys(state.rows)) state.rows[k] = []
  Object.keys(state.tokens).forEach(k => delete state.tokens[k])
  Object.assign(state.tokens, {
    [SUPER_TOKEN]: { id: 'super-1', email: 'super@test.uz' },
    [ADMIN_TOKEN]: { id: 'admin-1', email: 'admin@test.uz' },
    [USER_TOKEN]: { id: 'user-1', email: 'user@test.uz' },
  })
  seedUsers()
  state.rows.pricing_plans = [
    { id: 'free', name: 'Bepul', price: 0 },
    { id: 'standart', name: 'Standart', price: 45000 },
    { id: 'pro', name: 'Pro', price: 140000 },
  ]
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('1) Unauthenticated admin access → 401', () => {
  it('analytics/users without token → 401', async () => {
    const res = await usersAnalyticsGET(mockRequest({}))
    expect(res.status).toBe(401)
  })

  it('admin/users PATCH without token → 401', async () => {
    const res = await usersPATCH(mockRequest({ body: { userId: 'user-1', action: 'block' } }))
    expect(res.status).toBe(401)
  })

  it('reset-password without token → 401', async () => {
    const res = await resetPasswordPOST(
      mockRequest({ body: { userId: 'user-1', password: 'newpass123' } })
    )
    expect(res.status).toBe(401)
  })
})

describe('2) Normal user → 403 on every admin endpoint', () => {
  it('analytics/users → 403', async () => {
    const res = await usersAnalyticsGET(mockRequest({ token: USER_TOKEN }))
    expect(res.status).toBe(403)
  })

  it('analytics/ai-usage → 403', async () => {
    const res = await aiUsageAnalyticsGET(mockRequest({ token: USER_TOKEN }))
    expect(res.status).toBe(403)
  })

  it('analytics/revenue → 403', async () => {
    const res = await revenueAnalyticsGET(mockRequest({ token: USER_TOKEN }))
    expect(res.status).toBe(403)
  })

  it('admin/users PATCH → 403', async () => {
    const res = await usersPATCH(mockRequest({ token: USER_TOKEN, body: { userId: 'user-3', action: 'block' } }))
    expect(res.status).toBe(403)
  })

  it('admin/users DELETE → 403', async () => {
    const res = await usersDELETE(mockRequest({ token: USER_TOKEN, body: { userId: 'user-3' } }))
    expect(res.status).toBe(403)
  })
})

describe('3) Role management — privilege escalation blocked', () => {
  it('normal ADMIN cannot grant ADMIN role to a user → 403', async () => {
    const res = await usersPATCH(
      mockRequest({
        token: ADMIN_TOKEN,
        body: { userId: 'user-3', action: 'changeRole', data: { role: 'ADMIN' } },
      })
    )
    expect(res.status).toBe(403)
    const target = state.rows.registered_users.find((u: any) => u.id === 'user-3')
    expect(target.role).toBe('USER') // o'zgarmagan
  })

  it('normal ADMIN cannot change another ADMIN role → 403', async () => {
    const res = await usersPATCH(
      mockRequest({
        token: ADMIN_TOKEN,
        body: { userId: 'admin-1', action: 'changeRole', data: { role: 'USER' } },
      })
    )
    expect(res.status).toBe(403)
  })

  it('invalid role value → 400', async () => {
    const res = await usersPATCH(
      mockRequest({
        token: SUPER_TOKEN,
        body: { userId: 'user-3', action: 'changeRole', data: { role: 'GOD' } },
      })
    )
    expect(res.status).toBe(400)
  })

  it('SUPER_ADMIN can grant ADMIN → 200 + audit log written', async () => {
    const res = await usersPATCH(
      mockRequest({
        token: SUPER_TOKEN,
        body: { userId: 'user-3', action: 'changeRole', data: { role: 'ADMIN' } },
      })
    )
    expect(res.status).toBe(200)
    const target = state.rows.registered_users.find((u: any) => u.id === 'user-3')
    expect(target.role).toBe('ADMIN')

    // Audit log yozilgan
    const log = state.rows.admin_audit_logs.find((l: any) => l.action === 'user_role_change')
    expect(log).toBeDefined()
    expect(log.admin_id).toBe('super-1')
    expect(log.target_id).toBe('user-3')
    expect(log.details.to).toBe('ADMIN')
    expect(log.details.from).toBe('USER')
  })

  it('admin cannot self-demote (non-super) → 403', async () => {
    const res = await usersPATCH(
      mockRequest({
        token: ADMIN_TOKEN,
        body: { userId: 'admin-1', action: 'changeRole', data: { role: 'USER' } },
      })
    )
    expect(res.status).toBe(403)
  })
})

describe('4) Last SUPER_ADMIN protection', () => {
  it('cannot demote the only SUPER_ADMIN → 409', async () => {
    // registered_users da faqat bitta SUPER_ADMIN (super-1)
    const res = await usersPATCH(
      mockRequest({
        token: SUPER_TOKEN,
        body: { userId: 'super-1', action: 'changeRole', data: { role: 'ADMIN' } },
      })
    )
    expect(res.status).toBe(409)
    const target = state.rows.registered_users.find((u: any) => u.id === 'super-1')
    expect(target.role).toBe('SUPER_ADMIN')
  })

  it('cannot delete yourself (only SUPER_ADMIN) → 403', async () => {
    // O'z-o'zini o'chirish birinchi himoya — 403 (409 emas)
    const res = await usersDELETE(mockRequest({ token: SUPER_TOKEN, body: { userId: 'super-1' } }))
    expect(res.status).toBe(403)
  })

  it('super admin can demote another super admin when there are 2+ → 200', async () => {
    state.rows.registered_users.push({
      id: 'super-2',
      email: 'super2@test.uz',
      name: 'Second Super',
      role: 'SUPER_ADMIN',
      subscription_plan: 'free',
      created_at: '2025-04-01T00:00:00.000Z',
    })
    const res = await usersPATCH(
      mockRequest({
        token: SUPER_TOKEN,
        body: { userId: 'super-2', action: 'changeRole', data: { role: 'ADMIN' } },
      })
    )
    expect(res.status).toBe(200)
    const target = state.rows.registered_users.find((u: any) => u.id === 'super-2')
    expect(target.role).toBe('ADMIN')
  })
})

describe('5) Admin can delete a normal user (with audit log)', () => {
  it('delete user-3 → 200, removed + audit log', async () => {
    const res = await usersDELETE(mockRequest({ token: SUPER_TOKEN, body: { userId: 'user-3' } }))
    expect(res.status).toBe(200)
    expect(state.rows.registered_users.find((u: any) => u.id === 'user-3')).toBeUndefined()
    const log = state.rows.admin_audit_logs.find((l: any) => l.action === 'user_delete')
    expect(log).toBeDefined()
    expect(log.admin_id).toBe('super-1')
    expect(log.target_id).toBe('user-3')
  })

  it('admin cannot delete another admin → 403', async () => {
    const res = await usersDELETE(mockRequest({ token: ADMIN_TOKEN, body: { userId: 'admin-1' } }))
    expect(res.status).toBe(403)
  })
})

describe('6) Analytics — REAL data only, no fabricated numbers', () => {
  it('analytics/users shows only real active subscriptions (expired excluded)', async () => {
    const res = await usersAnalyticsGET(mockRequest({ token: SUPER_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()

    // 5 ta foydalanuvchi bor (real)
    expect(json.summary.totalUsers).toBe(5)
    // Faqat 1 ta faol subskriptiya (user-1 standart, muddati o'tmagan) — user-2 pro muddati o'tgan
    const standart = json.activeSubscriptions.find((s: any) => s.planId === 'standart')
    expect(standart).toBeDefined()
    expect(standart.activeSubscriptions).toBe(1)
    // Muddati o'tgan pro hisoblanmaydi
    const pro = json.activeSubscriptions.find((s: any) => s.planId === 'pro')
    expect(pro).toBeUndefined()
    // Hardcoded plan narxlari yo'q — pricing_plans'dan
    expect(standart.planPrice).toBe(45000)
  })

  it('analytics/ai-usage uses real usage_logs', async () => {
    state.rows.usage_logs = [
      { id: '1', user_id: 'user-1', email: 'user@test.uz', action: 'ai_chat', tokens: 100, created_at: new Date().toISOString() },
      { id: '2', user_id: 'user-1', email: 'user@test.uz', action: 'ai_chat', tokens: 50, created_at: new Date().toISOString() },
      { id: '3', user_id: 'user-1', email: 'user@test.uz', action: 'irac', tokens: 200, created_at: new Date().toISOString() },
    ]
    const res = await aiUsageAnalyticsGET(mockRequest({ token: SUPER_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary.totalAIUsage).toBe(3)
    const chat = json.mostUsedFeatures.find((f: any) => f.feature === 'ai_chat')
    expect(chat.totalUsage).toBe(2)
    expect(json.topUsers.length).toBe(1)
    expect(json.topUsers[0].email).toBe('user@test.uz') // real email, 'unknown@example.com' emas
  })

  it('analytics/revenue uses real approved payments only', async () => {
    state.rows.payment_requests = [
      { id: 'p1', plan: 'standart', plan_id: 'standart', amount: 45000, status: 'approved', created_at: new Date().toISOString() },
      { id: 'p2', plan: 'pro', plan_id: 'pro', amount: 140000, status: 'approved', created_at: new Date().toISOString() },
      { id: 'p3', plan: 'pro', plan_id: 'pro', amount: 140000, status: 'pending', created_at: new Date().toISOString() },
    ]
    const res = await revenueAnalyticsGET(mockRequest({ token: SUPER_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary.totalTransactions).toBe(2) // pending hisoblanmaydi
    expect(json.summary.totalRevenue).toBe(185000) // 45000 + 140000
    const pro = json.revenueByPlan.find((p: any) => p.planId === 'pro')
    expect(pro.subscriptionCount).toBe(1)
    expect(pro.planPrice).toBe(140000) // pricing_plans'dan
  })
})

describe('7) reset-password admin-only', () => {
  it('user → 403', async () => {
    const res = await resetPasswordPOST(
      mockRequest({ token: USER_TOKEN, body: { userId: 'user-1', password: 'newpass123' } })
    )
    expect(res.status).toBe(403)
  })

  it('super admin → 200 + audit log', async () => {
    const res = await resetPasswordPOST(
      mockRequest({ token: SUPER_TOKEN, body: { userId: 'user-1', password: 'newpass123' } })
    )
    expect(res.status).toBe(200)
    const log = state.rows.admin_audit_logs.find((l: any) => l.action === 'user_password_reset')
    expect(log).toBeDefined()
    expect(log.target_id).toBe('user-1')
  })

  it('short password → 400', async () => {
    const res = await resetPasswordPOST(
      mockRequest({ token: SUPER_TOKEN, body: { userId: 'user-1', password: '123' } })
    )
    expect(res.status).toBe(400)
  })
})
