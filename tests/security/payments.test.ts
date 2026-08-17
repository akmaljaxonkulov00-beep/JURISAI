// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * TO'LOV / SUBSKRIPSIYA XAVFSIZLIK TESTLARI
 *
 * 1.  unauthenticated payment access → 401
 * 2.  fake planId → 400 (hech narsa yozilmaydi)
 * 3.  client narxi ishonilmaydi — DB narxi ishlatiladi
 * 4.  cross-user: GET faqat O'Z cheklarini qaytaradi
 * 5.  approve faqat ADMIN → 401/403
 * 6.  duplicate approval → balans ikki marta qo'shilmaydi
 * 7.  state machine: approved/rejected to'lovni qayta ishlab bo'lmaydi (409)
 * 8.  fake /api/payment/upgrade (paymentSuccessful=true) o'chirilgan
 * 9.  Payme webhook: kalitsiz 503, yolg'on imzo 400
 * 10. subskriptiya faqat tasdiqlangan to'lovdan keyin faollashadi
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => {
  const rows: Record<string, any[]> = {
    payment_requests: [],
    pricing_plans: [
      { id: 'free', name: 'Bepul', price: 0 },
      { id: 'standart', name: 'Standart', price: 45000 },
      { id: 'pro', name: 'Pro', price: 140000 },
    ],
    registered_users: [],
    user_notifications: [],
  }
  const tokens: Record<string, { id: string; email: string }> = {}

  const makeClient = () => {
    const chain = (table: string) => {
      const q: any = {
        __table: table,
        __filters: [] as Array<{ k: string; v: any; ilike?: boolean }>,
        __insertPayload: null,
        __orderKey: '',
        __orderDesc: false,
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
      q.ilike = (k: string, v: any) => {
        q.__filters.push({ k, v, ilike: true })
        return q
      }
      q.order = (k: string, opts?: any) => {
        q.__orderKey = k
        q.__orderDesc = !!opts?.ascending === false
        return q
      }
      q.gte = () => q
      q.lte = () => q
      q.update = (payload: any) => {
        q.__insertPayload = null
        rows[table]
          .filter(matches)
          .forEach(row => Object.assign(row, payload))
        return q
      }
      q.insert = (payload: any) => {
        // Insert darhol commit bo'ladi (notification kabi zanjir .single()'siz)
        const list = Array.isArray(payload) ? payload : [payload]
        const committed = list.map((p: any) => {
          const row = { ...p }
          if (!row.id) row.id = `gen-${rows[table].length + 1}`
          rows[table].push(row)
          return row
        })
        q.__insertPayload = null
        q.__lastInserted = committed[0]
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
      // await q — SELECT natijasi
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
        admin: {
          updateUserById: async () => ({ data: {}, error: null }),
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

import { POST as paymentsPOST, GET as paymentsGET } from '@/app/api/payments/route'
import { POST as approvePOST } from '@/app/api/payments/approve/route'
import { POST as rejectPOST } from '@/app/api/payments/reject/route'
import { POST as managePOST } from '@/app/api/payments/manage/route'
import { POST as paymePOST } from '@/app/api/billing/payment/route'

const ADMIN_TOKEN = 'token-admin'
const USER_TOKEN = 'token-user'
const OTHER_TOKEN = 'token-other'

function mockRequest(opts: { token?: string; body?: any; query?: Record<string, string> }): any {
  const headers = new Headers()
  if (opts.token) headers.set('authorization', `Bearer ${opts.token}`)
  const url = new URL('http://localhost')
  for (const [k, v] of Object.entries(opts.query || {})) url.searchParams.set(k, v)
  return {
    url: url.toString(),
    nextUrl: url,
    headers,
    json: async () => opts.body ?? {},
    cookies: { get: () => (opts.token ? { value: opts.token } : undefined) },
  }
}

function seedPayment(overrides: any = {}) {
  const row = {
    id: 'pay-' + Math.random().toString(36).slice(2, 10),
    user_id: 'user-1',
    user_email: 'user@test.uz',
    user_name: 'Test User',
    plan: 'standart',
    amount: 45000,
    receipt_image: '',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
  state.rows.payment_requests.push(row)
  return row
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  delete process.env.PAYME_MERCHANT_KEY

  state.rows.payment_requests = []
  state.rows.user_notifications = []
  state.rows.pricing_plans = [
    { id: 'free', name: 'Bepul', price: 0 },
    { id: 'standart', name: 'Standart', price: 45000 },
    { id: 'pro', name: 'Pro', price: 140000 },
  ]
  state.rows.registered_users = [
    { id: 'admin-1', email: 'admin@test.uz', role: 'ADMIN', subscription_plan: 'free', balance: 0 },
    { id: 'user-1', email: 'user@test.uz', role: 'USER', subscription_plan: 'free', balance: 0 },
    { id: 'user-2', email: 'other@test.uz', role: 'USER', subscription_plan: 'free', balance: 0 },
  ]
  // Mutatsiya — makeClient closuresi bir xil obyektga qaraydi
  Object.keys(state.tokens).forEach(k => delete state.tokens[k])
  Object.assign(state.tokens, {
    [ADMIN_TOKEN]: { id: 'admin-1', email: 'admin@test.uz' },
    [USER_TOKEN]: { id: 'user-1', email: 'user@test.uz' },
    [OTHER_TOKEN]: { id: 'user-2', email: 'other@test.uz' },
  })
})

describe('1) Unauthenticated payment access → 401', () => {
  it('POST /api/payments without token → 401', async () => {
    const res = await paymentsPOST(
      mockRequest({ body: { planId: 'standart', checkImage: 'data:image/png;base64,x' } })
    )
    expect(res.status).toBe(401)
  })

  it('GET /api/payments without token → 401', async () => {
    const res = await paymentsGET(mockRequest({}))
    expect(res.status).toBe(401)
  })

  it('approve without token → 401', async () => {
    const res = await approvePOST(mockRequest({ body: { paymentId: 'pay-1' } }))
    expect(res.status).toBe(401)
  })
})

describe('2) Fake plan / client price is never trusted', () => {
  it('unknown planId → 400, nothing inserted', async () => {
    const before = state.rows.payment_requests.length
    const res = await paymentsPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { planId: 'hacker-plan', checkImage: 'data:image/png;base64,x' },
      })
    )
    expect(res.status).toBe(400)
    expect(state.rows.payment_requests.length).toBe(before)
  })

  it('client amount=1 is ignored — DB price 45000 stored', async () => {
    const res = await paymentsPOST(
      mockRequest({
        token: USER_TOKEN,
        body: { planId: 'standart', planPrice: 1, planName: 'Hacked', checkImage: 'data:image/png;base64,x' },
      })
    )
    expect(res.status).toBe(200)
    const created = state.rows.payment_requests[state.rows.payment_requests.length - 1]
    expect(created.amount).toBe(45000)
    expect(created.plan).toBe('standart')
    expect(created.status).toBe('pending')
    expect(created.user_id).toBe('user-1')
  })
})

describe('3) Cross-user payment access', () => {
  it('GET returns only own payments (session identity)', async () => {
    seedPayment({ id: 'pay-mine', user_id: 'user-1' })
    seedPayment({ id: 'pay-other', user_id: 'user-2' })

    const res = await paymentsGET(mockRequest({ token: USER_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    const ids = json.data.payments.map((p: any) => p.id)
    expect(ids).toContain('pay-mine')
    expect(ids).not.toContain('pay-other')
  })
})

describe('4) Only ADMIN can approve/reject payments', () => {
  it('USER approve → 403', async () => {
    const p = seedPayment()
    const res = await approvePOST(mockRequest({ token: USER_TOKEN, body: { paymentId: p.id } }))
    expect(res.status).toBe(403)
    expect(p.status).toBe('pending') // hech narsa o'zgarmagan
  })

  it('USER reject → 403', async () => {
    const p = seedPayment()
    const res = await rejectPOST(mockRequest({ token: USER_TOKEN, body: { paymentId: p.id } }))
    expect(res.status).toBe(403)
  })

  it('USER manage → 403', async () => {
    const p = seedPayment()
    const res = await managePOST(
      mockRequest({ token: USER_TOKEN, body: { paymentId: p.id, action: 'approve' } })
    )
    expect(res.status).toBe(403)
  })
})

describe('5) Duplicate approval — no double balance, subscription activates once', () => {
  it('approve pending → approved + balance added', async () => {
    const p = seedPayment()
    const res = await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    expect(res.status).toBe(200)

    const updated = state.rows.payment_requests.find(r => r.id === p.id)
    expect(updated.status).toBe('approved')
    expect(updated.processed_by).toBe('admin-1')

    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.balance).toBe(45000)
    expect(user.subscription_plan).toBe('standart')
    expect(user.subscription_expires_at).toBeDefined()
  })

  it('second approve → idempotent, balance NOT doubled', async () => {
    const p = seedPayment()
    await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))

    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.balance).toBe(45000) // 90000 emas!
  })

  it('manage approve → same idempotent behavior', async () => {
    const p = seedPayment()
    await managePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id, action: 'approve' } }))
    await managePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id, action: 'approve' } }))
    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.balance).toBe(45000)
  })

  it('subscribed user gets notifications', async () => {
    const p = seedPayment()
    await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    const note = state.rows.user_notifications.find(n => n.user_id === 'user-1')
    expect(note).toBeDefined()
    expect(note.category).toBe('payment')
  })
})

describe('6) State machine guards', () => {
  it('approve an already-rejected payment → 409', async () => {
    const p = seedPayment({ status: 'rejected' })
    const res = await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    expect(res.status).toBe(409)
    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.balance).toBe(0)
  })

  it('reject an already-approved payment → 409', async () => {
    const p = seedPayment({ status: 'approved' })
    const res = await rejectPOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    expect(res.status).toBe(409)
  })

  it('reject pending → rejected; second reject idempotent', async () => {
    const p = seedPayment()
    const r1 = await rejectPOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id, notes: 'yomon chek' } }))
    expect(r1.status).toBe(200)
    const r2 = await rejectPOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: p.id } }))
    expect(r2.status).toBe(200)

    const updated = state.rows.payment_requests.find(r => r.id === p.id)
    expect(updated.status).toBe('rejected')
    expect(updated.reject_reason).toBe('yomon chek')
    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.subscription_plan).toBe('free') // rad etilgan to'lov premium bermaydi
  })

  it('approve unknown payment → 404', async () => {
    const res = await approvePOST(mockRequest({ token: ADMIN_TOKEN, body: { paymentId: 'nope' } }))
    expect(res.status).toBe(404)
  })
})

describe('7) Fake /api/payment/upgrade (paymentSuccessful=true) is gone', () => {
  it('route no longer exists — import fails', async () => {
    await expect(import('@/app/api/payment/upgrade/route')).rejects.toThrow()
  })
})

describe('8) Payme webhook cannot fake-activate', () => {
  it('without PAYME_MERCHANT_KEY → 503', async () => {
    const res = await paymePOST(
      mockRequest({
        body: {
          method: 'PerformTransaction',
          params: { id: 'txn-1', account: { user_id: 'user-1', plan_id: 'pro' } },
          id: 1,
          sign: 'fake',
        },
      })
    )
    expect(res.status).toBe(503)
    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.subscription_plan).toBe('free')
  })

  it('with key but invalid signature → error body, nothing changes', async () => {
    process.env.PAYME_MERCHANT_KEY = 'test-merchant-key'
    const res = await paymePOST(
      mockRequest({
        body: {
          method: 'PerformTransaction',
          params: { id: 'txn-1', account: { user_id: 'user-1', plan_id: 'pro' } },
          id: 1,
          sign: 'fake-signature',
        },
      })
    )
    const json = await res.json()
    // Payme protocol: HTTP 200 + error body
    expect(json.error).toBeDefined()
    expect(json.error.code).toBe(-32504)
    const user = state.rows.registered_users.find(u => u.id === 'user-1')
    expect(user.subscription_plan).toBe('free')
  })
})
