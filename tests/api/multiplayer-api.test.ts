// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createRoomRoute, GET as listRoomsRoute } from '@/app/api/court/multiplayer/rooms/route'
import { GET as getRoomRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/route'
import { POST as joinRoomRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/join/route'
import { POST as actionRoute } from '@/app/api/court/multiplayer/rooms/[codeOrId]/action/route'

describe('Multiplayer Virtual Court — Next.js Route Handlers', { timeout: 15000 }, () => {
  let createdRoomCode = ''
  let createdRoomId = ''

  it('POST /api/court/multiplayer/rooms — creates room with guest/user headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/court/multiplayer/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': 'host_user_1',
        'x-guest-name': 'Sudya Shokirov',
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
    createdRoomId = data.room.id
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

  it('GET /api/court/multiplayer/rooms/[codeOrId] — fetches room by code', async () => {
    const req = new NextRequest(`http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}`)
    const res = await getRoomRoute(req, { params: Promise.resolve({ codeOrId: createdRoomCode }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.room.code).toBe(createdRoomCode)
  })

  it('POST /api/court/multiplayer/rooms/[codeOrId]/join — second user joins with role', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': 'participant_user_2',
          'x-guest-name': 'Advokat Bobur',
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

  it('POST /api/court/multiplayer/rooms/[codeOrId]/action — start trial', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/court/multiplayer/rooms/${createdRoomCode}/action`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': 'host_user_1',
          'x-guest-name': 'Sudya Shokirov',
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
          'x-guest-id': 'participant_user_2',
          'x-guest-name': 'Advokat Bobur',
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
