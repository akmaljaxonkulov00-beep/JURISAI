// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock supabase-admin & server-auth for isolated deterministic API tests
const mockUsers: Record<string, { id: string; email: string; name: string }> = {
  'token-host': { id: 'host_user_1', email: 'host@juristiv.uz', name: 'Sudya Shokirov' },
  'token-advokat': { id: 'participant_user_2', email: 'advokat@juristiv.uz', name: 'Advokat Bobur' },
}

vi.mock('@/lib/server-auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/server-auth')>('@/lib/server-auth')
  return {
    ...actual,
    requireUser: vi.fn(async (req: NextRequest) => {
      const auth = req.headers.get('authorization') || ''
      const token = auth.replace(/^Bearer\s+/i, '').trim()
      const user = mockUsers[token]
      if (!user) {
        return {
          ok: false as const,
          response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'content-type': 'application/json' },
          }),
        }
      }
      return { ok: true as const, user: { id: user.id, email: user.email } }
    }),
  }
})

import { POST as createRoomRoute, GET as listRoomsRoute } from '@/app/api/court/multiplayer/rooms/route'
import { GET as getRoomRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/route'
import { POST as joinRoomRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/join/route'
import { POST as actionRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/action/route'

describe('Multiplayer Virtual Court — Next.js Route Handlers (Authenticated)', { timeout: 15000 }, () => {
  let createdRoomCode = ''

  it('POST /api/court/multiplayer/rooms — rejects unauthenticated x-guest-id spoofing with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/court/multiplayer/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': 'host_user_1',
        'x-guest-name': 'Spoofed Sudya',
      },
      body: JSON.stringify({
        title: 'Spoofed Room',
        caseCategory: 'criminal',
      }),
    })

    const res = await createRoomRoute(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/court/multiplayer/rooms — creates room for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/court/multiplayer/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-host',
      },
      body: JSON.stringify({
        title: 'API Test Jinoyat Ishi',
        caseCategory: 'criminal',
        maxParticipants: 6,
        isPublic: true,
      }),
    })

    const res = await createRoomRoute(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.room).toBeDefined()
    expect(data.room.code).toMatch(/^JUR-/)
    expect(data.room.title).toBe('API Test Jinoyat Ishi')

    createdRoomCode = data.room.code
  })

  it('GET /api/court/multiplayer/rooms — lists created public room', async () => {
    const res = await listRoomsRoute()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.rooms)).toBe(true)
    const found = data.rooms.find((r: any) => r.code === createdRoomCode)
    expect(found).toBeDefined()
  })

  it('GET /api/court/multiplayer/rooms/[codeOrId] — rejects unauthenticated and fetches room for authenticated user', async () => {
    const unauthReq = new NextRequest(`http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}`)
    const unauthRes = await getRoomRoute(unauthReq, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    expect(unauthRes.status).toBe(401)

    const req = new NextRequest(`http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}`, {
      headers: { Authorization: 'Bearer token-host' },
    })
    const res = await getRoomRoute(req, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.room.code).toBe(createdRoomCode)
  })

  it('POST /api/court/multiplayer/rooms/[codeOrId]/join — second authenticated user joins with role', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-advokat',
        },
        body: JSON.stringify({ role: 'ADVOKAT' }),
      }
    )

    const res = await joinRoomRoute(req, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.participant.role).toBe('ADVOKAT')
    expect(data.room.participants.length).toBe(2)
  })

  it('POST /api/court/multiplayer/rooms/[codeOrId]/action — authenticated host starts trial', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-host',
        },
        body: JSON.stringify({ action: 'start' }),
      }
    )

    const res = await actionRoute(req, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.room.status).toBe('in_progress')
  })

  it('POST /api/court/multiplayer/rooms/[codeOrId]/action — non-authorized user cannot advance stage', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-advokat',
        },
        body: JSON.stringify({ action: 'advance_stage' }),
      }
    )

    const res = await actionRoute(req, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Faqat Sudya')
  })
})
