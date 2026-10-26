import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  getCourtRoom,
  startTrial,
  assignParticipantRole,
  advanceTrialStage,
  updateSpeakingQueue,
  grantSpeakingTurn,
  raiseObjection,
  ruleOnObjection,
  sendCourtMessage,
  submitEvidence,
  ruleOnEvidence,
  issueVerdict,
  kickParticipant,
  leaveCourtRoom,
} from '@/lib/court/multiplayer-db'
import type { MultiplayerRole } from '@/lib/court/multiplayer-types'

async function resolveUser(request: NextRequest): Promise<{ id: string; name: string } | null> {
  const auth = await requireUser(request)
  if (auth.ok) {
    try {
      const admin = getSupabaseAdmin()
      const { data } = await admin
        .from('registered_users')
        .select('full_name, email')
        .eq('id', auth.user.id)
        .maybeSingle()
      return {
        id: auth.user.id,
        name: data?.full_name || auth.user.email.split('@')[0] || 'Foydalanuvchi',
      }
    } catch {
      return {
        id: auth.user.id,
        name: auth.user.email.split('@')[0] || 'Foydalanuvchi',
      }
    }
  }

  const guestId = request.headers.get('x-guest-id')
  const guestName = request.headers.get('x-guest-name')
  if (guestId && guestId.trim().length > 3) {
    return {
      id: guestId.trim(),
      name: decodeURIComponent(guestName || 'Ishtirokchi').trim(),
    }
  }

  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const { codeOrId } = await params
    const user = await resolveUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Avtorizatsiyadan o‘tilmagan' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Harakat turi (action) ko‘rsatilmadi' },
        { status: 400 }
      )
    }

    let updatedRoom

    switch (action) {
      case 'start': {
        updatedRoom = await startTrial(codeOrId, user.id)
        break
      }

      case 'assign_role': {
        const { targetUserId, newRole } = body
        if (!targetUserId || !newRole) {
          return NextResponse.json(
            { success: false, error: 'targetUserId va newRole majburiy' },
            { status: 400 }
          )
        }
        updatedRoom = await assignParticipantRole(
          codeOrId,
          user.id,
          targetUserId,
          newRole as MultiplayerRole
        )
        break
      }

      case 'advance_stage': {
        const { nextStageId } = body
        updatedRoom = await advanceTrialStage(codeOrId, user.id, nextStageId)
        break
      }

      case 'speak': {
        const { content } = body
        if (!content || !content.trim()) {
          return NextResponse.json(
            { success: false, error: 'Nutq matni bo‘sh bo‘lishi mumkin emas' },
            { status: 400 }
          )
        }
        updatedRoom = await sendCourtMessage(codeOrId, user, content)
        break
      }

      case 'speaking_queue': {
        const { queueAction } = body // 'request' | 'cancel'
        updatedRoom = await updateSpeakingQueue(codeOrId, user.id, queueAction || 'request')
        break
      }

      case 'grant_speech': {
        const { targetUserId } = body // string | null
        updatedRoom = await grantSpeakingTurn(codeOrId, user.id, targetUserId)
        break
      }

      case 'raise_objection': {
        const { reason, targetRole } = body
        const currentRoom = await getCourtRoom(codeOrId)
        const p = currentRoom?.participants.find(part => part.userId === user.id)
        if (!p)
          return NextResponse.json(
            { success: false, error: 'Ishtirokchi topilmadi' },
            { status: 404 }
          )

        updatedRoom = await raiseObjection(
          codeOrId,
          { id: user.id, name: user.name, role: p.role },
          reason,
          targetRole
        )
        break
      }

      case 'rule_objection': {
        const { ruling, reasoning } = body // 'sustained' | 'overruled'
        if (!ruling)
          return NextResponse.json(
            { success: false, error: 'Ajrim turi ko‘rsatilmadi' },
            { status: 400 }
          )
        updatedRoom = await ruleOnObjection(codeOrId, user.id, ruling, reasoning || '')
        break
      }

      case 'submit_evidence': {
        const { title, type, description, content, referenceNumber, fileUrl, visibility } = body
        if (!title || !content) {
          return NextResponse.json(
            { success: false, error: 'Dalil nomi va mazmuni majburiy' },
            { status: 400 }
          )
        }
        updatedRoom = await submitEvidence(codeOrId, user, {
          title,
          type,
          description: description || '',
          content,
          referenceNumber,
          fileUrl,
          visibility,
        })
        break
      }

      case 'rule_evidence': {
        const { evidenceId, status, reason } = body // 'admitted' | 'rejected'
        if (!evidenceId || !status) {
          return NextResponse.json(
            { success: false, error: 'evidenceId va status majburiy' },
            { status: 400 }
          )
        }
        updatedRoom = await ruleOnEvidence(codeOrId, user.id, evidenceId, status, reason || '')
        break
      }

      case 'issue_verdict': {
        const { verdictDecision, title, summary, legalReasoning, penaltyOrRemedy } = body
        if (!verdictDecision || !summary) {
          return NextResponse.json(
            { success: false, error: 'Hukm xulosasi va asoslari to‘liq bo‘lishi lozim' },
            { status: 400 }
          )
        }
        updatedRoom = await issueVerdict(codeOrId, user.id, {
          verdictDecision,
          title: title || 'O‘zbekiston Respublikasi Nomi Bilan Sud Hukmi',
          summary,
          legalReasoning: legalReasoning || '',
          penaltyOrRemedy: penaltyOrRemedy || '',
        })
        break
      }

      case 'kick': {
        const { targetUserId } = body
        if (!targetUserId) {
          return NextResponse.json(
            { success: false, error: 'targetUserId ko‘rsatilmadi' },
            { status: 400 }
          )
        }
        updatedRoom = await kickParticipant(codeOrId, user.id, targetUserId)
        break
      }

      case 'leave': {
        updatedRoom = await leaveCourtRoom(codeOrId, user.id)
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Noma’lum harakat: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, room: updatedRoom })
  } catch (err: any) {
    console.error('POST /api/court/multiplayer/rooms/[codeOrId]/action error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Harakatni bajarishda xatolik yuz berdi' },
      { status: 400 }
    )
  }
}
