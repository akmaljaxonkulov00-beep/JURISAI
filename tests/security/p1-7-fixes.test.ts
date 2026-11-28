import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockResolveCourtUser = vi.fn()
const mockGetCourtRoom = vi.fn()
vi.mock('@/lib/court/multiplayer-auth', () => ({
  resolveCourtUser: (...args: unknown[]) => mockResolveCourtUser(...args),
}))
vi.mock('@/lib/court/multiplayer-db', () => ({
  getCourtRoom: (...args: unknown[]) => mockGetCourtRoom(...args),
}))

const mockRequireUser = vi.fn()
vi.mock('@/lib/server-auth', () => ({
  requireUser: (...args: unknown[]) => mockRequireUser(...args),
}))

const mockCreateTransaction = vi.fn()
const mockUpdateAppointment = vi.fn()
vi.mock('@/lib/db/platform-db', () => ({
  platformDb: {
    createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
    updateAppointment: (...args: unknown[]) => mockUpdateAppointment(...args),
  },
}))

describe('P1.7 Security & Reliability Regression Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-participant reads of private multiplayer rooms with 403', async () => {
    mockResolveCourtUser.mockResolvedValue({ id: 'intruder-user', name: 'Intruder', email: 'i@test.uz' })
    mockGetCourtRoom.mockResolvedValue({
      id: 'room-1',
      code: 'JUR-1234',
      isPublic: false,
      hostId: 'owner-user',
      status: 'waiting',
      participants: [{ userId: 'owner-user', role: 'SUDYA' }],
    })

    const { GET } = await import('@/app/api/court/multiplayer/rooms/[codeOrId]/route')
    const req = new NextRequest('http://localhost/api/court/multiplayer/rooms/JUR-1234')
    const res = await GET(req, { params: Promise.resolve({ codeOrId: 'JUR-1234' }) })
    expect(res.status).toBe(403)
  })

  it('rejects mutating actions on completed multiplayer rooms with 409', async () => {
    mockResolveCourtUser.mockResolvedValue({ id: 'owner-user', name: 'Owner', email: 'o@test.uz' })
    mockGetCourtRoom.mockResolvedValue({
      id: 'room-1',
      code: 'JUR-1234',
      isPublic: false,
      hostId: 'owner-user',
      status: 'completed',
      participants: [{ userId: 'owner-user', role: 'SUDYA' }],
    })

    const { POST } = await import('@/app/api/court/multiplayer/rooms/[codeOrId]/action/route')
    const req = new NextRequest('http://localhost/api/court/multiplayer/rooms/JUR-1234/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'speak', content: 'Test' }),
    })
    const res = await POST(req, { params: Promise.resolve({ codeOrId: 'JUR-1234' }) })
    expect(res.status).toBe(409)
  })

  it('checkout creates pending transaction and does not auto-mark appointment as paid', async () => {
    mockRequireUser.mockResolvedValue({ ok: true, user: { id: 'citizen-1', email: 'c@test.uz' } })
    mockCreateTransaction.mockResolvedValue({ id: 'tx-1', status: 'pending' })
    mockUpdateAppointment.mockResolvedValue({})

    const { POST } = await import('@/app/api/payments/checkout/route')
    const req = new NextRequest('http://localhost/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultationId: 'cons-1', amount: 150000, provider: 'click' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockCreateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending' })
    )
    expect(mockUpdateAppointment).toHaveBeenCalledWith(
      'cons-1',
      expect.objectContaining({ payment_status: 'pending' })
    )
    const callArg = mockUpdateAppointment.mock.calls[0][1]
    expect(callArg.payment_status).not.toBe('paid')
    expect(callArg.status).toBeUndefined()
  })
})
