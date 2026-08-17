// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * XAVFSIZLIK TESTLARI — Authentication / Authorization
 *
 * 1. unauthenticated → 401
 * 2. normal user → 403 on admin APIs
 * 3. normal user cannot become ADMIN (sync-user role escalation)
 * 4. user A cannot read user B data
 * 5. user A cannot modify user B
 * 6. only admin can approve payments
 * 7. only admin can change pricing
 * 8. only owner can delete their account
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock state + Supabase fakes ──────────────────────────────────────────
const state = vi.hoisted(() => {
  const makeClient = () => {
    const chain = (table: string) => {
      const q: any = {}
      q.select = () => q
      q.eq = () => q
      q.or = () => q
      q.order = () => q
      q.limit = () => q
      q.range = () => q
      q.single = async () => ({ data: {}, error: null })
      q.maybeSingle = async () => {
        if (table === 'registered_users') {
          const role = state.roleByUser[state.currentUserId]
          if (!role) return { data: null, error: null }
          return {
            data: {
              id: state.currentUserId,
              email: state.tokens[state.currentToken]?.email || '',
              role,
              subscription_plan: 'free',
              name: 'Test User',
            },
            error: null,
          }
        }
        return { data: null, error: null }
      }
      // update/insert/delete — zanjirni qaytaradi (so'nggi natija error=None)
      q.insert = (payload: any) => {
        state.inserts.push({ table, payload })
        return q
      }
      q.update = (payload: any) => {
        state.updates.push({ table, payload })
        return q
      }
      q.delete = () => {
        state.deletes.push({ table })
        return q
      }
      return q
    }
    return {
      auth: {
        getUser: async (token?: string) => {
          if (!token) return { data: { user: null }, error: new Error('no token') }
          const u = state.tokens[token]
          if (!u) return { data: { user: null }, error: new Error('invalid token') }
          state.currentToken = token
          state.currentUserId = u.id
          return { data: { user: u }, error: null }
        },
        admin: {
          deleteUser: async () => ({ error: null }),
        },
      },
      from: (table: string) => chain(table),
    }
  }
  return {
    tokens: {} as Record<string, { id: string; email: string }>,
    roleByUser: {} as Record<string, string>,
    inserts: [] as Array<{ table: string; payload: any }>,
    updates: [] as Array<{ table: string; payload: any }>,
    deletes: [] as Array<{ table: string }>,
    currentToken: '',
    currentUserId: '',
    makeClient,
  }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => state.makeClient(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => state.makeClient(),
}))

import { requireUser, requireAdmin } from '@/lib/server-auth'
import { POST as syncUserPOST } from '@/app/api/auth/sync-user/route'
import { GET as userRoleGET } from '@/app/api/auth/user-role/route'
import { POST as adminPricingPOST } from '@/app/api/admin/pricing/route'
import { PATCH as adminUsersPATCH } from '@/app/api/admin/users/route'
import { POST as approvePaymentPOST } from '@/app/api/payments/approve/route'
import { POST as deleteAccountPOST } from '@/app/api/user/delete/route'

const ADMIN_TOKEN = 'token-admin'
const USER_TOKEN = 'token-user'

function mockRequest(opts: {
  token?: string
  body?: any
  query?: Record<string, string>
}): any {
  const headers = new Headers()
  if (opts.token) headers.set('authorization', `Bearer ${opts.token}`)
  const url = new URL('http://localhost')
  for (const [k, v] of Object.entries(opts.query || {})) url.searchParams.set(k, v)
  return {
    url: url.toString(),
    nextUrl: url,
    headers,
    json: async () => opts.body ?? {},
    cookies: {
      get: () => (opts.token ? { value: opts.token } : undefined),
    },
  }
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

  state.tokens = {
    [ADMIN_TOKEN]: { id: 'admin-1', email: 'admin@test.uz' },
    [USER_TOKEN]: { id: 'user-1', email: 'user@test.uz' },
  }
  state.roleByUser = { 'admin-1': 'ADMIN', 'user-1': 'USER' }
  state.inserts = []
  state.updates = []
  state.deletes = []
  state.currentToken = ''
  state.currentUserId = ''
})

describe('1) Unauthenticated → 401', () => {
  it('requireUser rejects missing/invalid token', async () => {
    const r1 = await requireUser(mockRequest({}))
    expect(r1.ok).toBe(false)
    expect((r1 as any).response.status).toBe(401)

    const r2 = await requireUser(mockRequest({ token: 'forged-token' }))
    expect(r2.ok).toBe(false)
    expect((r2 as any).response.status).toBe(401)
  })

  it('requireAdmin rejects missing token', async () => {
    const r = await requireAdmin(mockRequest({}))
    expect(r.ok).toBe(false)
    expect((r as any).response.status).toBe(401)
  })

  it('sync-user POST without token → 401', async () => {
    const res = await syncUserPOST(mockRequest({ body: { id: 'x', email: 'a@b.c' } }))
    expect(res.status).toBe(401)
  })

  it('account delete without token → 401', async () => {
    const res = await deleteAccountPOST(mockRequest({ body: { userId: 'user-1' } }))
    expect(res.status).toBe(401)
  })
})

describe('2) Normal user → 403 on admin APIs', () => {
  it('admin pricing POST with USER session → 403', async () => {
    const res = await adminPricingPOST(
      mockRequest({ token: USER_TOKEN, body: { plans: [] } })
    )
    expect(res.status).toBe(403)
  })

  it('admin users PATCH with USER session → 403 (cannot change another user role)', async () => {
    const res = await adminUsersPATCH(
      mockRequest({
        token: USER_TOKEN,
        body: { userId: 'admin-1', action: 'changeRole', data: { role: 'USER' } },
      })
    )
    expect(res.status).toBe(403)
  })

  it('admin users PATCH without token → 401', async () => {
    const res = await adminUsersPATCH(mockRequest({ body: {} }))
    expect(res.status).toBe(401)
  })
})

describe('3) Normal user cannot become ADMIN', () => {
  it('sync-user ignores client role=ADMIN / subscription_plan=pro', async () => {
    const res = await syncUserPOST(
      mockRequest({
        token: USER_TOKEN,
        body: {
          id: 'admin-1', // client tries to spoof another id
          email: 'admin@test.uz',
          name: 'Hacker',
          role: 'ADMIN',
          subscription_plan: 'pro',
        },
      })
    )
    expect(res.status).toBe(200)

    // Existing user (user-1): faqat update — role/subscription_plan payload'da bo'lmasligi shart
    const update = state.updates.find(u => u.table === 'registered_users')
    expect(update).toBeDefined()
    expect(update!.payload.role).toBeUndefined()
    expect(update!.payload.subscription_plan).toBeUndefined()
    expect(update!.payload.email).toBe('user@test.uz') // session email — client email emas
  })

  it('sync-user for NEW user creates role USER + free (never client role)', async () => {
    // Yangi user — rol ro'yxatda yo'q
    state.roleByUser['new-1'] = ''
    state.tokens['token-new'] = { id: 'new-1', email: 'new@test.uz' }
    const res = await syncUserPOST(
      mockRequest({
        token: 'token-new',
        body: { role: 'ADMIN', subscription_plan: 'pro', name: 'New' },
      })
    )
    expect(res.status).toBe(200)
    const insert = state.inserts.find(i => i.table === 'registered_users')
    expect(insert).toBeDefined()
    expect(insert!.payload.role).toBe('USER')
    expect(insert!.payload.subscription_plan).toBe('free')
    expect(insert!.payload.id).toBe('new-1')
  })
})

describe('4) User A cannot read user B data', () => {
  it('user-role with another user email → 403', async () => {
    const res = await userRoleGET(
      mockRequest({
        token: USER_TOKEN,
        query: { email: 'admin@test.uz' },
      })
    )
    expect(res.status).toBe(403)
  })

  it('user-role with another user id → 403', async () => {
    const res = await userRoleGET(
      mockRequest({
        token: USER_TOKEN,
        query: { userId: 'admin-1' },
      })
    )
    expect(res.status).toBe(403)
  })

  it('user-role with OWN email → allowed', async () => {
    const res = await userRoleGET(
      mockRequest({
        token: USER_TOKEN,
        query: { email: 'user@test.uz' },
      })
    )
    expect(res.status).toBe(200)
  })
})

describe('5) User A cannot modify user B', () => {
  it('user A cannot change user B role via admin API → 403', async () => {
    const res = await adminUsersPATCH(
      mockRequest({
        token: USER_TOKEN,
        body: { userId: 'admin-1', action: 'changeRole', data: { role: 'USER' } },
      })
    )
    expect(res.status).toBe(403)
    // Hech qanday update yozilmagan
    expect(state.updates.length).toBe(0)
  })
})

describe('6) Only admin can approve payments', () => {
  it('USER session → 403', async () => {
    const res = await approvePaymentPOST(
      mockRequest({ token: USER_TOKEN, body: { paymentId: 'pay-1' } })
    )
    expect(res.status).toBe(403)
  })

  it('unauthenticated → 401', async () => {
    const res = await approvePaymentPOST(mockRequest({ body: { paymentId: 'pay-1' } }))
    expect(res.status).toBe(401)
  })

  it('ADMIN session → passes the guard', async () => {
    const res = await approvePaymentPOST(
      mockRequest({ token: ADMIN_TOKEN, body: { paymentId: 'pay-1' } })
    )
    // Guard o'tdi: 401/403 emas
    expect([401, 403]).not.toContain(res.status)
  })
})

describe('7) Only admin can change pricing', () => {
  it('USER session → 403', async () => {
    const res = await adminPricingPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { plans: [{ id: 'free', name: 'Hacked', price: 0 }] },
      })
    )
    expect(res.status).toBe(403)
  })

  it('ADMIN session → passes the guard', async () => {
    const res = await adminPricingPOST(
      mockRequest({
        token: ADMIN_TOKEN,
        body: { plans: [{ id: 'free', name: 'Bepul', price: 0 }] },
      })
    )
    expect([401, 403]).not.toContain(res.status)
  })
})

describe('8) Only owner can delete their account', () => {
  it('user deletes own account (body userId is ignored; session id used)', async () => {
    const res = await deleteAccountPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { userId: 'admin-1', email: 'admin@test.uz' }, // client spoof attempt
      })
    )
    expect(res.status).toBe(200)
    // O'chirishlar session user (user-1) uchun bajarildi
    const tables = state.deletes.map(d => d.table)
    expect(tables).toContain('registered_users')
    expect(tables).toContain('payment_requests')
  })

  it('unauthenticated delete → 401', async () => {
    const res = await deleteAccountPOST(mockRequest({ body: { userId: 'user-1' } }))
    expect(res.status).toBe(401)
  })
})
