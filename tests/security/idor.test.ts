// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * IDOR / BOLA XAVFSIZLIK TESTLARI
 *
 * Asosiy qoida: identity FAQAT tasdiqlangan session'dan olinadi.
 * Client yuborgan userId/memberId/actorId/author HECH QACHON ishonilmaydi.
 *
 * 1.  authsiz → 401 (barcha community endpoint)
 * 2.  User A User B ning bildirishnomalarini ko'ra olmaydi/o'zgartira olmaydi
 * 3.  User A User B ni guruhdan chiqara olmaydi (moderator bo'lmasa)
 * 4.  User A moderator tayinlay olmaydi (yaratuvchi bo'lmasa)
 * 5.  User A boshqa guruh so'rovlarini tasdiqlay olmaydi
 * 6.  User A o'zini User B qilib ko'rsata olmaydi (consultation/feed author)
 * 7.  User A User B postini o'chira/tahrirlay olmaydi
 * 8.  Oddiy user ekspert/webinar qo'sha olmaydi → 403 (admin x2)
 * 9.  User A User B maxfiy guruhlarini ko'ra olmaydi
 * 10. User A guruh a'zosi bo'lmagan guruh postlarini o'qiy olmaydi
 * 11. User A User B guruhini o'zgartira/o'chira olmaydi
 * 12. User A User B to'lovlarini ko'ra olmaydi
 * 13. User A User B bookmark'larini ko'ra olmaydi
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const state = vi.hoisted(() => {
  const rows: Record<string, any[]> = {
    registered_users: [],
    community_groups: [],
    community_group_members: [],
    community_group_posts: [],
    community_group_join_requests: [],
    community_group_notifications: [],
    community_consultations: [],
    community_posts: [],
    community_comments: [],
    community_experts: [],
    community_webinars: [],
    user_notifications: [],
    payment_requests: [],
    legal_bookmarks: [],
  }
  const tokens: Record<string, { id: string; email: string }> = {}

  const makeClient = () => {
    const chain = (table: string) => {
      const q: any = {
        __table: table,
        __filters: [] as Array<{ k: string; v: any; mode?: 'in' | 'eq' }>,
      }
      const matches = (row: any) =>
        q.__filters.every(({ k, v, mode }: any) => {
          if (mode === 'in') {
            const arr = Array.isArray(v) ? v : []
            return arr.includes(row[k])
          }
          const a = String(row[k] ?? '')
          const b = String(v)
          return a === b
        })
      q.select = () => q
      q.eq = (k: string, v: any) => {
        q.__filters.push({ k, v, mode: 'eq' })
        return q
      }
      q.in = (k: string, v: any[]) => {
        q.__filters.push({ k, v, mode: 'in' })
        return q
      }
      q.ilike = (k: string, v: any) => {
        q.__filters.push({ k, v, mode: 'eq', ilike: true })
        return q
      }
      q.or = () => q
      q.limit = () => q
      q.range = () => q
      q.gte = () => q
      q.lte = () => q
      q.order = () => q
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
      q.upsert = (payload: any, opts?: any) => {
        const list = Array.isArray(payload) ? payload : [payload]
        for (const p of list) {
          const exists = rows[table].some(
            (r) =>
              r.group_id === p.group_id &&
              r.user_id === p.user_id
          )
          if (!exists || !opts?.ignoreDuplicates) {
            const row = { ...p }
            if (!row.id) row.id = `gen-${rows[table].length + 1}`
            rows[table].push(row)
          }
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
          rows[table].filter(matches).forEach((row) => {
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
        const applied = applyPending()
        const arr = q.__pending ? applied : rows[table].filter(matches)
        return { data: arr[0] ?? {}, error: arr.length ? null : { message: 'not found' } }
      }
      q.then = (resolve: any, reject: any) => {
        const applied = applyPending()
        const arr = q.__pending ? applied : rows[table].filter(matches)
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

  return { rows, tokens, makeClient }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => state.makeClient(),
}))

// server-auth ni mock'laymiz — requireUser/requireAdmin token asosida ishlaydi,
// requireAdmin registered_users.role ni tekshiradi (database roli).
vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: () => state.makeClient(),
}))

vi.mock('@/lib/server-auth', () => ({
  requireUser: async (req: any) => {
    const header = req.headers?.get?.('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.get?.('sb-access-token')?.value
    const user = token ? state.tokens[token] : undefined
    if (!user) {
      return { ok: false, response: { status: 401, json: async () => ({ error: 'Unauthorized' }) } }
    }
    return { ok: true, user }
  },
  requireAdmin: async (req: any) => {
    const header = req.headers?.get?.('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.get?.('sb-access-token')?.value
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

import { POST as groupsPOST, PUT as groupsPUT, PATCH as groupsPATCH, DELETE as groupsDELETE } from '@/app/api/community/groups/route'
import { POST as joinPOST } from '@/app/api/community/groups/join/route'
import { POST as requestsPOST, PATCH as requestsPATCH } from '@/app/api/community/groups/requests/route'
import { GET as groupPostsGET } from '@/app/api/community/groups/posts/route'
import { DELETE as membersDELETE, PATCH as membersPATCH } from '@/app/api/community/groups/members/route'
import { GET as groupNotifsGET, PATCH as groupNotifsPATCH } from '@/app/api/community/groups/notifications/route'
import { GET as consultationsGET, POST as consultationsPOST } from '@/app/api/community/consultations/route'
import { POST as expertsPOST } from '@/app/api/community/experts/route'
import { POST as webinarsPOST } from '@/app/api/community/webinars/route'
import { POST as feedPOST, PUT as feedPUT, DELETE as feedDELETE } from '@/app/api/community/posts/route'
import { POST as commentsPOST } from '@/app/api/community/comments/route'
import { GET as paymentsGET } from '@/app/api/payments/route'
import { GET as bookmarksGET } from '@/app/api/legal/database/bookmarks/route'

const A_TOKEN = 'token-a'
const B_TOKEN = 'token-b'
const ADMIN_TOKEN = 'token-admin'

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

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

  for (const k of Object.keys(state.rows)) state.rows[k] = []
  Object.keys(state.tokens).forEach((k) => delete state.tokens[k])
  Object.assign(state.tokens, {
    [A_TOKEN]: { id: 'user-a', email: 'a@test.uz' },
    [B_TOKEN]: { id: 'user-b', email: 'b@test.uz' },
    [ADMIN_TOKEN]: { id: 'admin-1', email: 'admin@test.uz' },
  })
  state.rows.registered_users = [
    { id: 'user-a', email: 'a@test.uz', full_name: 'User A', role: 'USER' },
    { id: 'user-b', email: 'b@test.uz', full_name: 'User B', role: 'USER' },
    { id: 'admin-1', email: 'admin@test.uz', full_name: 'Admin', role: 'ADMIN' },
  ]
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ────────────────────────────────────────────────────────────────────────────
describe('1) Unauthenticated → 401 (identity session talab qilinadi)', () => {
  it('groups POST without token → 401', async () => {
    const res = await groupsPOST(mockRequest({ body: { name: 'Guruh' } }))
    expect(res.status).toBe(401)
  })
  it('group join POST without token → 401', async () => {
    const res = await joinPOST(mockRequest({ body: { code: 'ABCD1234' } }))
    expect(res.status).toBe(401)
  })
  it('group posts GET without token → 401', async () => {
    const res = await groupPostsGET(mockRequest({ query: { groupId: 'g1' } }))
    expect(res.status).toBe(401)
  })
  it('consultations GET (admin list) without token → 401', async () => {
    const res = await consultationsGET(mockRequest({}))
    expect(res.status).toBe(401)
  })
  it('group notifications GET without token → 401', async () => {
    const res = await groupNotifsGET(mockRequest({}))
    expect(res.status).toBe(401)
  })
  it('feed POST without token → 401', async () => {
    const res = await feedPOST(mockRequest({ body: { content: 'x', category: 'discussion' } }))
    expect(res.status).toBe(401)
  })
  it('comments POST without token → 401', async () => {
    const res = await commentsPOST(mockRequest({ body: { postId: 'p1', content: 'x' } }))
    expect(res.status).toBe(401)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('2) Notifications — User A User B ning bildirishnomalariga tegolmaydi', () => {
  it('GET returns only own notifications (B-niki yashirin)', async () => {
    state.rows.community_group_notifications = [
      { id: 'n1', user_id: 'user-a', title: 'A xabari', read: false },
      { id: 'n2', user_id: 'user-b', title: 'B xabari', read: false },
    ]
    const res = await groupNotifsGET(mockRequest({ token: A_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    const ids = (json.data || []).map((n: any) => n.id)
    expect(ids).toContain('n1')
    expect(ids).not.toContain('n2')
  })

  it('PATCH cannot mark B-ning bildirishnomasini o\'qilgan', async () => {
    state.rows.community_group_notifications = [
      { id: 'n1', user_id: 'user-b', read: false },
    ]
    const res = await groupNotifsPATCH(
      mockRequest({ token: A_TOKEN, body: { id: 'n1' } })
    )
    expect(res.status).toBe(200)
    // B-ning bildirishnomasi o'zgarmagan (update user_id sharti bilan filterlangan)
    expect(state.rows.community_group_notifications[0].read).toBe(false)
  })

  it('main /api/notifications GET — B-ning to\'lov holati A ga ko\'rinmaydi', async () => {
    state.rows.user_notifications = [
      { id: 'n1', user_id: 'user-a', title: 'A', read: false },
      { id: 'n2', user_id: 'user-b', title: 'B maxfiy', read: false },
    ]
    state.rows.payment_requests = [
      { id: 'p1', user_id: 'user-b', status: 'approved', plan: 'pro', amount: 140000, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-02T00:00:00.000Z' },
    ]
    const res = await paymentsGET(mockRequest({ token: A_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.payments).toHaveLength(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('3) Group members — faqat moderator/yaratuvchi chiqara oladi', () => {
  it('A (oddiy a\'zo emas) B ni guruhdan chiqara olmaydi → 403', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b', is_private: false }]
    state.rows.community_group_members = [
      { group_id: 'g1', user_id: 'user-b', role: 'creator' },
    ]
    const res = await membersDELETE(
      mockRequest({ token: A_TOKEN, query: { groupId: 'g1', userId: 'user-b' } })
    )
    expect(res.status).toBe(403)
    // B hali ham a'zo
    expect(state.rows.community_group_members.some((m: any) => m.user_id === 'user-b')).toBe(true)
  })

  it('A moderator tayinlay olmaydi (guruh yaratuvchisi emas) → 403', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b' }]
    const res = await membersPATCH(
      mockRequest({
        token: A_TOKEN,
        body: { groupId: 'g1', userId: 'user-b', role: 'moderator' },
      })
    )
    expect(res.status).toBe(403)
  })

  it('A boshqa guruhning qo\'shilish so\'rovlarini tasdiqlay olmaydi → 403', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b' }]
    state.rows.community_group_join_requests = [
      { id: 'r1', group_id: 'g1', user_id: 'user-c', status: 'pending' },
    ]
    const res = await requestsPATCH(
      mockRequest({ token: A_TOKEN, body: { id: 'r1', status: 'approved' } })
    )
    expect(res.status).toBe(403)
    expect(state.rows.community_group_join_requests[0].status).toBe('pending')
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('4) Impersonatsiya — author/userId body\'dan ishonilmaydi', () => {
  it('consultations POST — user_id session\'dan (B emas)', async () => {
    const res = await consultationsPOST(
      mockRequest({
        token: A_TOKEN,
        body: { expertId: 'e1', expertName: 'Ekspert', type: 'consultation', message: 'Salom', userId: 'user-b', userEmail: 'b@test.uz' },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.user_id).toBe('user-a')
    expect(json.data.user_email).toBe('a@test.uz')
  })

  it('feed POST — author body\'dan emas, session\'dan', async () => {
    const res = await feedPOST(
      mockRequest({
        token: A_TOKEN,
        body: { content: 'Post', category: 'discussion', author: { id: 'user-b', name: 'B' } },
      })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.author.id).toBe('user-a')
    expect(json.data.author.name).toBe('User A')
  })

  it('groups POST — created_by session\'dan', async () => {
    const res = await groupsPOST(
      mockRequest({ token: A_TOKEN, body: { name: 'Guruh', userId: 'user-b' } })
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.created_by).toBe('user-a')
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('5) Feed posts — faqat muallif tahrirlaydi/o\'chiradi', () => {
  it('A B-ning postini o\'chira olmaydi → 403', async () => {
    state.rows.community_posts = [
      { id: 'p1', author: { id: 'user-b', name: 'B' }, content: 'B posti' },
    ]
    const res = await feedDELETE(mockRequest({ token: A_TOKEN, query: { id: 'p1' } }))
    expect(res.status).toBe(403)
    expect(state.rows.community_posts).toHaveLength(1)
  })

  it('A B-ning posti kontentini tahrirlay olmaydi → 403', async () => {
    state.rows.community_posts = [
      { id: 'p1', author: { id: 'user-b', name: 'B' }, content: 'B posti' },
    ]
    const res = await feedPUT(
      mockRequest({ token: A_TOKEN, body: { id: 'p1', content: 'Buzilgan' } })
    )
    expect(res.status).toBe(403)
    expect(state.rows.community_posts[0].content).toBe('B posti')
  })

  it('A o\'z postini o\'chira oladi → 200', async () => {
    state.rows.community_posts = [
      { id: 'p1', author: { id: 'user-a', name: 'A' }, content: 'A posti' },
    ]
    const res = await feedDELETE(mockRequest({ token: A_TOKEN, query: { id: 'p1' } }))
    expect(res.status).toBe(200)
    expect(state.rows.community_posts).toHaveLength(0)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('6) Ekspert/webinar — faqat admin qo\'shadi', () => {
  it('oddiy user ekspert qo\'sha olmaydi → 403', async () => {
    const res = await expertsPOST(mockRequest({ token: A_TOKEN, body: { name: 'Ekspert' } }))
    expect(res.status).toBe(403)
  })
  it('oddiy user vebinar qo\'sha olmaydi → 403', async () => {
    const res = await webinarsPOST(
      mockRequest({ token: A_TOKEN, body: { title: 'Vebinar', date: '2026-09-01' } })
    )
    expect(res.status).toBe(403)
  })
  it('admin ekspert qo\'sha oladi → 200', async () => {
    const res = await expertsPOST(mockRequest({ token: ADMIN_TOKEN, body: { name: 'Ekspert' } }))
    expect(res.status).toBe(200)
    expect(state.rows.community_experts).toHaveLength(1)
  })
  it('admin vebinar qo\'sha oladi → 200', async () => {
    const res = await webinarsPOST(
      mockRequest({ token: ADMIN_TOKEN, body: { title: 'Vebinar', date: '2026-09-01' } })
    )
    expect(res.status).toBe(200)
    expect(state.rows.community_webinars).toHaveLength(1)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('7) Guruh maxfiyligi — B-ning maxfiy guruhlari A ga ko\'rinmaydi', () => {
  it('groups GET — memberId parametri ishonilmaydi, faqat session a\'zoliklari', async () => {
    state.rows.community_groups = [
      { id: 'pub1', is_private: false, member_count: 5, created_by: 'user-b' },
      { id: 'sec1', is_private: true, member_count: 2, created_by: 'user-b' },
    ]
    state.rows.community_group_members = [
      { group_id: 'sec1', user_id: 'user-b', role: 'creator' },
    ]
    // A token bilan, lekin query'da B ning id si yuborilgan — B-ning maxfiy guruhi ko'rinmasligi kerak
    const res = await import('@/app/api/community/groups/route').then((m) => m.GET(
      mockRequest({ token: A_TOKEN, query: { memberId: 'user-b' } })
    ))
    expect(res.status).toBe(200)
    const json = await res.json()
    const ids = (json.data || []).map((g: any) => g.id)
    expect(ids).toContain('pub1')
    expect(ids).not.toContain('sec1')
  })

  it('a\'zo bo\'lmagan foydalanuvchi guruh postlarini o\'qiy olmaydi → 403', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b' }]
    state.rows.community_group_members = [
      { group_id: 'g1', user_id: 'user-b', role: 'creator' },
    ]
    state.rows.community_group_posts = [
      { id: 'gp1', group_id: 'g1', user_id: 'user-b', content: 'maxfiy' },
    ]
    const res = await groupPostsGET(mockRequest({ token: A_TOKEN, query: { groupId: 'g1' } }))
    expect(res.status).toBe(403)
  })

  it('maxfiy guruhga kodsiz PATCH qo\'shilib bo\'lmaydi → 403', async () => {
    state.rows.community_groups = [
      { id: 'g1', created_by: 'user-b', is_private: true, member_count: 1 },
    ]
    const res = await groupsPATCH(
      mockRequest({ token: A_TOKEN, body: { id: 'g1', delta: 1 } })
    )
    expect(res.status).toBe(403)
    expect(state.rows.community_group_members).toHaveLength(0)
  })

  it('B-ning guruhini A o\'zgartira/o\'chira olmaydi → 403', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b', name: 'B guruhi' }]
    const putRes = await groupsPUT(mockRequest({ token: A_TOKEN, body: { id: 'g1', name: 'Buzilgan' } }))
    expect(putRes.status).toBe(403)
    const delRes = await groupsDELETE(mockRequest({ token: A_TOKEN, query: { id: 'g1' } }))
    expect(delRes.status).toBe(403)
    expect(state.rows.community_groups).toHaveLength(1)
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('8) Bookmark — faqat o\'z bookmark\'lari', () => {
  it('GET bookmarks returns only own (session)', async () => {
    state.rows.legal_bookmarks = [
      { id: 'bk1', user_id: 'user-a', document_id: 'x' },
      { id: 'bk2', user_id: 'user-b', document_id: 'y' },
    ]
    const res = await bookmarksGET(mockRequest({ token: A_TOKEN }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.bookmarks).toEqual(['x'])
  })
})

// ────────────────────────────────────────────────────────────────────────────
describe('9) Guruh so\'rovlari POST — user identity session\'dan', () => {
  it('A so\'rov yuborganda user_id = A (body\'dagi userId emas)', async () => {
    state.rows.community_groups = [{ id: 'g1', created_by: 'user-b', name: 'Guruh' }]
    const res = await requestsPOST(
      mockRequest({ token: A_TOKEN, body: { groupId: 'g1', userId: 'user-b', userName: 'B' } })
    )
    expect(res.status).toBe(200)
    expect(state.rows.community_group_join_requests[0].user_id).toBe('user-a')
    expect(state.rows.community_group_join_requests[0].user_name).toBe('User A')
  })
})
