/**
 * multiplayer-db.ts — JURISTIV Multiplayer Virtual Court Data & State Engine
 * Server-authoritative state model, persistent storage, and procedural validation.
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getScenarioById, SEED_SCENARIOS } from './scenario-db'
import { TRIAL_STAGES, getNextStage } from './stage-machine'
import { awardUserXP } from '@/lib/xp-engine'
import type {
  MultiplayerRoom,
  MultiplayerParticipant,
  MultiplayerMessage,
  MultiplayerEvidenceItem,
  MultiplayerObjection,
  MultiplayerVerdict,
  MultiplayerRole,
  CreateRoomInput,
  SpeakingQueueItem,
  ParticipantScore,
} from './multiplayer-types'

// Global server memory store to maintain live sub-millisecond rooms & active presence
const globalStore = globalThis as unknown as {
  __juristivRooms?: Map<string, MultiplayerRoom>
}
if (!globalStore.__juristivRooms) {
  globalStore.__juristivRooms = new Map<string, MultiplayerRoom>()
}
const roomsMap = globalStore.__juristivRooms

// ── Collision-Resistant Room Code Generator ──
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'JUR-'
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ── Fallback Database Persistence via court_sessions ──
async function persistRoomToDb(room: MultiplayerRoom): Promise<void> {
  try {
    const admin = getSupabaseAdmin()
    // 1. Try dedicated table if it exists
    const { error: mpErr } = await admin.from('court_multiplayer_rooms').upsert({
      id: room.id,
      code: room.code,
      title: room.title,
      case_category: room.caseCategory,
      court_type: room.courtType,
      scenario_id: room.scenarioId || null,
      scenario_data: room.scenarioData,
      host_id: room.hostId,
      host_name: room.hostName,
      is_public: room.isPublic,
      ai_enabled: room.aiEnabled,
      voice_enabled: room.voiceEnabled,
      max_participants: room.maxParticipants,
      status: room.status,
      current_stage_id: room.currentStageId,
      current_stage_order: room.currentStageOrder,
      current_speaker_id: room.currentSpeakerId || null,
      current_speaker_role: room.currentSpeakerRole || null,
      speaking_queue: room.speakingQueue,
      pending_objection: room.pendingObjection || null,
      verdict_data: room.verdictData || null,
      updated_at: new Date().toISOString(),
    })

    if (!mpErr) {
      // Upsert participants
      for (const p of room.participants) {
        await admin.from('court_multiplayer_participants').upsert({
          id: p.id,
          room_id: room.id,
          user_id: p.userId,
          user_name: p.userName,
          avatar_url: p.avatarUrl || '',
          role: p.role,
          is_host: p.isHost,
          is_ai: p.isAi,
          is_ready: p.isReady,
          can_speak: p.canSpeak,
          connection_status: p.connectionStatus,
          last_seen_at: p.lastSeenAt,
          joined_at: p.joinedAt,
        })
      }
      return
    }

    // 2. Fallback: Persist into existing court_sessions with rich JSON evaluation
    // This guarantees persistence even before DDL migration is executed
    await admin.from('court_sessions').upsert({
      id: room.id,
      user_id:
        room.hostId.includes('-') && room.hostId.length === 36
          ? room.hostId
          : '00000000-0000-0000-0000-000000000000',
      title: `[MULTIPLAYER] ${room.title} (${room.code})`,
      case_details: room.scenarioData?.facts || room.title,
      user_role: 'SUDYA',
      status: room.status === 'completed' ? 'completed' : 'active',
      score: room.verdictData ? 90 : null,
      outcome:
        room.verdictData?.summary ||
        (room.status === 'completed' ? 'Hukm chiqarilgan' : 'Ko‘p foydalanuvchili sud'),
      evaluation: {
        is_multiplayer: true,
        room_data: room,
      },
      updated_at: new Date().toISOString(),
    })
  } catch (err) {
    // Non-blocking catch to ensure realtime in-memory operation continues flawlessly
    console.error('persistRoomToDb error (safe fallback in memory):', err)
  }
}

// ── Restore room from Database if not in memory ──
async function loadRoomFromDb(codeOrId: string): Promise<MultiplayerRoom | null> {
  try {
    const admin = getSupabaseAdmin()
    const cleanKey = codeOrId.toUpperCase().trim()

    // 1. Try court_multiplayer_rooms
    const { data: mpData } = await admin
      .from('court_multiplayer_rooms')
      .select('*')
      .or(`code.eq.${cleanKey},id.eq.${codeOrId}`)
      .maybeSingle()

    if (mpData) {
      const { data: partData } = await admin
        .from('court_multiplayer_participants')
        .select('*')
        .eq('room_id', mpData.id)

      const { data: evData } = await admin
        .from('court_multiplayer_evidence')
        .select('*')
        .eq('room_id', mpData.id)

      const { data: msgData } = await admin
        .from('court_multiplayer_messages')
        .select('*')
        .eq('room_id', mpData.id)
        .order('created_at', { ascending: true })

      const room: MultiplayerRoom = {
        id: mpData.id,
        code: mpData.code,
        title: mpData.title,
        caseCategory: mpData.case_category,
        courtType: mpData.court_type,
        scenarioId: mpData.scenario_id,
        scenarioData: mpData.scenario_data || {},
        hostId: mpData.host_id,
        hostName: mpData.host_name,
        isPublic: mpData.is_public,
        aiEnabled: mpData.ai_enabled,
        voiceEnabled: mpData.voice_enabled,
        maxParticipants: mpData.max_participants,
        status: mpData.status,
        currentStageId: mpData.current_stage_id,
        currentStageOrder: mpData.current_stage_order,
        currentSpeakerId: mpData.current_speaker_id,
        currentSpeakerRole: mpData.current_speaker_role,
        speakingQueue: mpData.speaking_queue || [],
        pendingObjection: mpData.pending_objection,
        verdictData: mpData.verdict_data,
        participants: (partData || []).map((p: any) => ({
          id: p.id,
          roomId: p.room_id,
          userId: p.user_id,
          userName: p.user_name,
          avatarUrl: p.avatar_url,
          role: p.role,
          isHost: p.is_host,
          isAi: p.is_ai,
          isReady: p.is_ready,
          canSpeak: p.can_speak,
          connectionStatus: p.connection_status,
          lastSeenAt: p.last_seen_at,
          joinedAt: p.joined_at,
        })),
        evidence: (evData || []).map((e: any) => ({
          id: e.id,
          roomId: e.room_id,
          submittedById: e.submitted_by_id,
          submittedByName: e.submitted_by_name,
          submittedByRole: e.submitted_by_role,
          title: e.title,
          type: e.type,
          description: e.description,
          content: e.content,
          fileUrl: e.file_url,
          referenceNumber: e.reference_number,
          visibility: e.visibility,
          status: e.status,
          judgeDecisionReason: e.judge_decision_reason,
          decidedAt: e.decided_at,
          createdAt: e.created_at,
        })),
        messages: (msgData || []).map((m: any) => ({
          id: m.id,
          roomId: m.room_id,
          userId: m.user_id,
          userName: m.user_name,
          role: m.role,
          messageType: m.message_type,
          content: m.content,
          stageId: m.stage_id,
          metadata: m.metadata,
          createdAt: m.created_at,
        })),
        createdAt: mpData.created_at,
        updatedAt: mpData.updated_at,
      }
      roomsMap.set(room.id, room)
      roomsMap.set(room.code, room)
      return room
    }

    // 2. Try court_sessions fallback
    const { data: sessData } = await admin
      .from('court_sessions')
      .select('*')
      .or(`title.ilike.%${cleanKey}%,id.eq.${codeOrId}`)
      .limit(1)
      .maybeSingle()

    if (sessData?.evaluation?.is_multiplayer && sessData.evaluation.room_data) {
      const room = sessData.evaluation.room_data as MultiplayerRoom
      roomsMap.set(room.id, room)
      roomsMap.set(room.code, room)
      return room
    }
  } catch (err) {
    console.error('loadRoomFromDb error:', err)
  }
  return null
}

// ── Public API Methods ──

/**
 * 1. Sud Zali Yaratish (Create Courtroom)
 */
export async function createCourtRoom(
  hostUser: { id: string; name: string },
  input: CreateRoomInput
): Promise<MultiplayerRoom> {
  const roomId = crypto.randomUUID()
  let code = generateRoomCode()
  while (roomsMap.has(code)) {
    code = generateRoomCode()
  }

  // Load selected scenario or default to Criminal / Civil
  let scenario = SEED_SCENARIOS[0]
  if (input.scenarioId) {
    const fetched = await getScenarioById(input.scenarioId)
    if (fetched) scenario = fetched
  } else {
    const match = SEED_SCENARIOS.find(s => s.category === input.caseCategory)
    if (match) scenario = match
  }

  const now = new Date().toISOString()

  // Host starts as SUDYA (Judge) or Kuzatuvchi
  const hostParticipant: MultiplayerParticipant = {
    id: crypto.randomUUID(),
    roomId,
    userId: hostUser.id,
    userName: hostUser.name || 'Sud Raisi',
    avatarUrl: '',
    role: 'SUDYA',
    isHost: true,
    isAi: false,
    isReady: true,
    canSpeak: true,
    connectionStatus: 'online',
    lastSeenAt: now,
    joinedAt: now,
  }

  // Initial evidence items from scenario
  const initialEvidence: MultiplayerEvidenceItem[] = (scenario.evidence || []).map(ev => ({
    id: crypto.randomUUID(),
    roomId,
    submittedById: 'system',
    submittedByName: 'Ish materiallari',
    submittedByRole: 'KOTIB',
    title: ev.title,
    type: ev.type,
    description: ev.description,
    content: ev.content,
    fileUrl: '',
    referenceNumber: ev.id.toUpperCase(),
    visibility: ev.visibility,
    status: ev.status === 'unsubmitted' ? 'pending' : (ev.status as any),
    judgeDecisionReason:
      ev.status === 'admitted' ? 'Dastlabki tergov materiallaridan qabul qilingan' : '',
    decidedAt: ev.status === 'admitted' ? now : undefined,
    createdAt: now,
  }))

  // Initial system message
  const welcomeMessage: MultiplayerMessage = {
    id: crypto.randomUUID(),
    roomId,
    userId: 'system',
    userName: 'Sud Tizimi',
    role: 'KOTIB',
    messageType: 'system',
    content: `Virtual sud zali ochildi. Ish: "${input.title}". Xona kodi: ${code}. Barcha taraflar taklif etiladi.`,
    stageId: 'open_hearing',
    createdAt: now,
  }

  const room: MultiplayerRoom = {
    id: roomId,
    code,
    title: input.title || scenario.title,
    caseCategory: input.caseCategory,
    courtType:
      input.courtType ||
      (input.caseCategory === 'criminal'
        ? 'Jinoyat ishlari bo‘yicha sud'
        : input.caseCategory === 'labor'
          ? 'Mehnat nizolari sudi'
          : 'Fuqarolik ishlari bo‘yicha sud'),
    scenarioId: scenario.id,
    scenarioData: scenario,
    hostId: hostUser.id,
    hostName: hostUser.name,
    isPublic: input.isPublic !== false,
    aiEnabled: !!input.aiEnabled,
    voiceEnabled: input.voiceEnabled !== false,
    maxParticipants: Math.min(Math.max(input.maxParticipants || 8, 2), 16),
    status: 'waiting',
    currentStageId: 'open_hearing',
    currentStageOrder: 1,
    currentSpeakerId: hostParticipant.userId,
    currentSpeakerRole: 'SUDYA',
    speakingQueue: [],
    pendingObjection: null,
    verdictData: null,
    participants: [hostParticipant],
    evidence: initialEvidence,
    messages: [welcomeMessage],
    createdAt: now,
    updatedAt: now,
  }

  roomsMap.set(room.id, room)
  roomsMap.set(room.code, room)

  await persistRoomToDb(room)
  return room
}

/**
 * 2. Xonani qidirish (Get Courtroom)
 */
export async function getCourtRoom(codeOrId: string): Promise<MultiplayerRoom | null> {
  if (!codeOrId) return null
  const clean = codeOrId.toUpperCase().trim()
  if (roomsMap.has(clean)) {
    return roomsMap.get(clean)!
  }
  if (roomsMap.has(codeOrId)) {
    return roomsMap.get(codeOrId)!
  }
  return await loadRoomFromDb(codeOrId)
}

/**
 * 3. Ochiq zallar ro‘yxati (List Public Rooms)
 */
export async function listPublicCourtRooms(): Promise<
  Array<{
    id: string
    code: string
    title: string
    caseCategory: string
    courtType: string
    hostName: string
    participantCount: number
    maxParticipants: number
    status: string
    aiEnabled: boolean
    voiceEnabled: boolean
    availableRoles: MultiplayerRole[]
    createdAt: string
  }>
> {
  // Check memory and also poll database
  const activeRooms = Array.from(roomsMap.values()).filter(
    (r, idx, self) => r.isPublic && self.findIndex(o => o.id === r.id) === idx
  )

  const ALL_ROLES: MultiplayerRole[] = [
    'SUDYA',
    'PROKUROR',
    'ADVOKAT',
    'GUVOH',
    'AYBLANUVCHI',
    'KOTIB',
    'KUZATUVCHI',
  ]

  return activeRooms.map(r => {
    const assignedRoles = new Set(r.participants.map(p => p.role))
    const available = ALL_ROLES.filter(
      role => role === 'KUZATUVCHI' || role === 'GUVOH' || !assignedRoles.has(role)
    )
    return {
      id: r.id,
      code: r.code,
      title: r.title,
      caseCategory: r.caseCategory,
      courtType: r.courtType,
      hostName: r.hostName,
      participantCount: r.participants.length,
      maxParticipants: r.maxParticipants,
      status: r.status,
      aiEnabled: r.aiEnabled,
      voiceEnabled: r.voiceEnabled,
      availableRoles: available,
      createdAt: r.createdAt,
    }
  })
}

/**
 * 4. Sud zaliga qo‘shilish (Join Courtroom)
 */
export async function joinCourtRoom(
  codeOrId: string,
  user: { id: string; name: string },
  requestedRole?: MultiplayerRole
): Promise<{ room: MultiplayerRoom; participant: MultiplayerParticipant }> {
  const room = await getCourtRoom(codeOrId)
  if (!room) {
    throw new Error('Ko‘rsatilgan xona kodi bo‘yicha sud zali topilmadi.')
  }

  if (room.status === 'cancelled') {
    throw new Error('Ushbu sud zali yopilgan yoki bekor qilingan.')
  }

  // Check if participant already exists in room
  const existing = room.participants.find(p => p.userId === user.id)
  if (existing) {
    existing.connectionStatus = 'online'
    existing.lastSeenAt = new Date().toISOString()
    if (user.name) existing.userName = user.name
    room.updatedAt = new Date().toISOString()
    await persistRoomToDb(room)
    return { room, participant: existing }
  }

  // Capacity check
  if (room.participants.length >= room.maxParticipants) {
    throw new Error('Sud zalida bo‘sh joy qolmagan (maksimal ishtirokchilar soniga yetildi).')
  }

  // Determine Role:
  // Unique roles: SUDYA, PROKUROR, ADVOKAT, AYBLANUVCHI, KOTIB
  const UNIQUE_ROLES: MultiplayerRole[] = ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB']
  const takenRoles = new Set(room.participants.map(p => p.role))

  let assignedRole: MultiplayerRole = 'KUZATUVCHI'
  if (requestedRole && requestedRole !== 'KUZATUVCHI') {
    if (UNIQUE_ROLES.includes(requestedRole)) {
      if (!takenRoles.has(requestedRole)) {
        assignedRole = requestedRole
      }
    } else {
      assignedRole = requestedRole
    }
  }

  // If role is still KUZATUVCHI in waiting room, try to give an unfilled essential role
  if (assignedRole === 'KUZATUVCHI' && room.status === 'waiting') {
    const priorityRoles: MultiplayerRole[] = [
      'PROKUROR',
      'ADVOKAT',
      'AYBLANUVCHI',
      'GUVOH',
      'KOTIB',
    ]
    for (const r of priorityRoles) {
      if (!takenRoles.has(r)) {
        assignedRole = r
        break
      }
    }
  }

  const now = new Date().toISOString()
  const newParticipant: MultiplayerParticipant = {
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: user.id,
    userName: user.name || 'Ishtirokchi',
    avatarUrl: '',
    role: assignedRole,
    isHost: false,
    isAi: false,
    isReady: true,
    canSpeak: assignedRole === 'SUDYA',
    connectionStatus: 'online',
    lastSeenAt: now,
    joinedAt: now,
  }

  room.participants.push(newParticipant)

  // Announce participant join
  const joinMsg: MultiplayerMessage = {
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: 'system',
    userName: 'Sud Kotibi',
    role: 'KOTIB',
    messageType: 'system',
    content: `${newParticipant.userName} sud majlisiga [${assignedRole}] maqomida qo‘shildi.`,
    stageId: room.currentStageId,
    createdAt: now,
  }
  room.messages.push(joinMsg)
  room.updatedAt = now

  await persistRoomToDb(room)
  return { room, participant: newParticipant }
}

/**
 * 5. Rolni o‘zgartirish (Assign / Change Role)
 */
export async function assignParticipantRole(
  codeOrId: string,
  actorUserId: string,
  targetUserId: string,
  newRole: MultiplayerRole
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const actor = room.participants.find(p => p.userId === actorUserId)
  if (!actor || (!actor.isHost && actor.role !== 'SUDYA' && actorUserId !== targetUserId)) {
    throw new Error(
      'Faqat Sud Raisi yoki xona boshqaruvchisi boshqa ishtirokchilar rolini o‘zgartirishi mumkin.'
    )
  }

  const target = room.participants.find(p => p.userId === targetUserId)
  if (!target) throw new Error('Ishtirokchi topilmadi.')

  // Unique roles restriction
  const UNIQUE_ROLES: MultiplayerRole[] = ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB']
  if (UNIQUE_ROLES.includes(newRole)) {
    const existingHolder = room.participants.find(
      p => p.role === newRole && p.userId !== targetUserId
    )
    if (existingHolder) {
      // If actor is host/judge, swap or reassign the previous holder to Kuzatuvchi
      if (actor.isHost || actor.role === 'SUDYA') {
        existingHolder.role = 'KUZATUVCHI'
      } else {
        throw new Error(`Ushbu rol (${newRole}) allaqachon boshqa ishtirokchiga biriktirilgan.`)
      }
    }
  }

  const oldRole = target.role
  target.role = newRole
  target.canSpeak = newRole === 'SUDYA' || room.currentSpeakerId === target.userId

  const now = new Date().toISOString()
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: 'system',
    userName: 'Sud Kotibi',
    role: 'KOTIB',
    messageType: 'system',
    content: `${target.userName} ning roli "${oldRole}" dan "${newRole}" ga o‘zgartirildi.`,
    stageId: room.currentStageId,
    createdAt: now,
  })
  room.updatedAt = now

  await persistRoomToDb(room)
  return room
}

/**
 * 6. Sud jarayonini boshlash (Start Trial)
 */
export async function startTrial(codeOrId: string, actorUserId: string): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const actor = room.participants.find(p => p.userId === actorUserId)
  if (!actor || (!actor.isHost && actor.role !== 'SUDYA')) {
    throw new Error('Faqat Sud Raisi majlisni boshlashi mumkin.')
  }

  room.status = 'in_progress'
  room.currentStageId = 'open_hearing'
  room.currentStageOrder = 1

  // SUDYA has the floor at opening
  const judge = room.participants.find(p => p.role === 'SUDYA') || actor
  room.currentSpeakerId = judge.userId
  room.currentSpeakerRole = 'SUDYA'

  const now = new Date().toISOString()
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: 'system',
    userName: 'Sud Kotibi',
    role: 'KOTIB',
    messageType: 'procedural',
    content: `Barcha turib hurmat bajo keltirsin! Sud majlisi boshlandi. Raislik qiluvchi: ${judge.userName}.`,
    stageId: 'open_hearing',
    createdAt: now,
  })
  room.updatedAt = now

  await persistRoomToDb(room)
  return room
}

/**
 * 7. Keyingi bosqichga o‘tish (Advance Stage)
 */
export async function advanceTrialStage(
  codeOrId: string,
  actorUserId: string,
  targetStageId?: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const actor = room.participants.find(p => p.userId === actorUserId)
  if (!actor || actor.role !== 'SUDYA') {
    throw new Error('Faqat Sudya protsessual bosqichni o‘zgartirish vakolatiga ega.')
  }

  const currentIdx = TRIAL_STAGES.findIndex(s => s.id === room.currentStageId)
  let nextStage = TRIAL_STAGES[currentIdx + 1]

  if (targetStageId) {
    const specified = TRIAL_STAGES.find(s => s.id === targetStageId)
    if (specified) nextStage = specified
  }

  if (!nextStage) {
    throw new Error('Barcha protsessual bosqichlar yakunlangan. Hukm chiqarish lozim.')
  }

  room.currentStageId = nextStage.id
  room.currentStageOrder = nextStage.order
  room.pendingObjection = null // clear objections on stage transition

  const now = new Date().toISOString()
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: 'system',
    userName: 'Sud Raisi',
    role: 'SUDYA',
    messageType: 'procedural',
    content: `Bosqich o‘zgardi: "${nextStage.title}". ${nextStage.description}`,
    stageId: nextStage.id,
    createdAt: now,
  })
  room.updatedAt = now

  await persistRoomToDb(room)
  return room
}

/**
 * 8. So‘z so‘rash / Navbat (Speaking Queue)
 */
export async function updateSpeakingQueue(
  codeOrId: string,
  userId: string,
  action: 'request' | 'cancel'
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const p = room.participants.find(part => part.userId === userId)
  if (!p) throw new Error('Ishtirokchi topilmadi.')

  if (action === 'request') {
    if (!room.speakingQueue.some(q => q.userId === userId)) {
      room.speakingQueue.push({
        userId,
        userName: p.userName,
        role: p.role,
        requestedAt: new Date().toISOString(),
      })
    }
  } else {
    room.speakingQueue = room.speakingQueue.filter(q => q.userId !== userId)
  }

  room.updatedAt = new Date().toISOString()
  await persistRoomToDb(room)
  return room
}

/**
 * 9. So‘z berish / To‘xtatish (Judge Grants/Revokes Speaking Turn)
 */
export async function grantSpeakingTurn(
  codeOrId: string,
  judgeUserId: string,
  targetUserId: string | null
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const judge = room.participants.find(p => p.userId === judgeUserId)
  if (!judge || judge.role !== 'SUDYA') {
    throw new Error('Faqat Sudya so‘z navbatini taqsimlash huquqiga ega.')
  }

  const now = new Date().toISOString()

  if (!targetUserId) {
    room.currentSpeakerId = null
    room.currentSpeakerRole = null
    room.participants.forEach(p => {
      p.canSpeak = p.role === 'SUDYA'
    })
    room.messages.push({
      id: crypto.randomUUID(),
      roomId: room.id,
      userId: judgeUserId,
      userName: judge.userName,
      role: 'SUDYA',
      messageType: 'procedural',
      content: 'Sud nutqni to‘xtatdi va sukunat e’lon qildi.',
      stageId: room.currentStageId,
      createdAt: now,
    })
  } else {
    const target = room.participants.find(p => p.userId === targetUserId)
    if (!target) throw new Error('Tanlangan ishtirokchi topilmadi.')

    room.currentSpeakerId = target.userId
    room.currentSpeakerRole = target.role
    room.speakingQueue = room.speakingQueue.filter(q => q.userId !== targetUserId)

    room.participants.forEach(p => {
      p.canSpeak = p.userId === targetUserId || p.role === 'SUDYA'
    })

    room.messages.push({
      id: crypto.randomUUID(),
      roomId: room.id,
      userId: judgeUserId,
      userName: judge.userName,
      role: 'SUDYA',
      messageType: 'procedural',
      content: `So‘z berildi: ${target.role} — ${target.userName}.`,
      stageId: room.currentStageId,
      createdAt: now,
    })
  }

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 10. E’tiroz bildirish (Raise Objection)
 */
export async function raiseObjection(
  codeOrId: string,
  user: { id: string; name: string; role: MultiplayerRole },
  reason: string,
  targetRole?: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  if (user.role === 'KUZATUVCHI') {
    throw new Error('Kuzatuvchilar protsessual e’tiroz bildirish huquqiga ega emas.')
  }

  const now = new Date().toISOString()
  const objection: MultiplayerObjection = {
    id: crypto.randomUUID(),
    raisedById: user.id,
    raisedByName: user.name,
    raisedByRole: user.role,
    targetRole: targetRole || room.currentSpeakerRole || undefined,
    reason,
    stageId: room.currentStageId,
    status: 'pending',
    createdAt: now,
  }

  room.pendingObjection = objection
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: user.id,
    userName: user.name,
    role: user.role,
    messageType: 'objection',
    content: `⚡ E’TIROZ! (${user.role} ${user.name}): "${reason}"`,
    stageId: room.currentStageId,
    metadata: { objectionId: objection.id },
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 11. E’tirozni hal etish (Judge Rules on Objection)
 */
export async function ruleOnObjection(
  codeOrId: string,
  judgeUserId: string,
  ruling: 'sustained' | 'overruled',
  reasoning: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const judge = room.participants.find(p => p.userId === judgeUserId)
  if (!judge || judge.role !== 'SUDYA') {
    throw new Error('Faqat Sudya e’tiroz bo‘yicha ajrim chiqarish huquqiga ega.')
  }

  if (!room.pendingObjection) {
    throw new Error('Hozirda ko‘rib chiqilayotgan e’tiroz mavjud emas.')
  }

  const now = new Date().toISOString()
  const obj = room.pendingObjection
  obj.status = ruling
  obj.judgeReasoning = reasoning

  const rulingText =
    ruling === 'sustained'
      ? `E’tiroz QANOATLANTIRILDI: ${reasoning || 'Taraf o‘z so‘zini qonun doirasida davom ettirsin.'}`
      : `E’tiroz RAD ETILDI: ${reasoning || 'Harakatlar qonun talablariga mos keladi.'}`

  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: judgeUserId,
    userName: judge.userName,
    role: 'SUDYA',
    messageType: 'ruling',
    content: `⚖️ SUD AJRIMI: ${rulingText}`,
    stageId: room.currentStageId,
    metadata: { objectionId: obj.id, ruling },
    createdAt: now,
  })

  room.pendingObjection = null
  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 12. Nutq / Xabar yuborish (Send Speech / Message)
 */
export async function sendCourtMessage(
  codeOrId: string,
  user: { id: string; name: string },
  content: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const p = room.participants.find(part => part.userId === user.id)
  if (!p) throw new Error('Ishtirokchi xonaga a’zo emas.')

  if (room.status === 'in_progress' && p.role === 'KUZATUVCHI') {
    throw new Error('Kuzatuvchilar sud zali umumiy majlisida nutq so‘zlay olmaydi.')
  }

  // If in trial, check speaking permission (except Judge who can always interject)
  if (room.status === 'in_progress' && p.role !== 'SUDYA') {
    if (room.currentSpeakerId && room.currentSpeakerId !== p.userId) {
      throw new Error('Hozirda boshqa taraf so‘zlamoqda. Iltimos, so‘z navbatiga yoziling.')
    }
  }

  const cleanText = (content || '').trim()
  if (!cleanText) throw new Error('Xabar matni bo‘sh bo‘lishi mumkin emas.')

  const now = new Date().toISOString()
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: user.id,
    userName: p.userName,
    role: p.role,
    messageType: 'speech',
    content: cleanText,
    stageId: room.currentStageId,
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 13. Dalil taqdim etish (Submit Evidence)
 */
export async function submitEvidence(
  codeOrId: string,
  user: { id: string; name: string },
  input: {
    title: string
    type: any
    description: string
    content: string
    referenceNumber?: string
    fileUrl?: string
    visibility?: any
  }
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const p = room.participants.find(part => part.userId === user.id)
  if (!p) throw new Error('Ishtirokchi topilmadi.')

  if (p.role === 'KUZATUVCHI') {
    throw new Error('Kuzatuvchilar dalil taqdim eta olmaydi.')
  }

  const now = new Date().toISOString()
  const evidenceItem: MultiplayerEvidenceItem = {
    id: crypto.randomUUID(),
    roomId: room.id,
    submittedById: user.id,
    submittedByName: p.userName,
    submittedByRole: p.role,
    title: input.title.trim(),
    type: input.type || 'document',
    description: input.description.trim(),
    content: input.content.trim(),
    fileUrl: input.fileUrl || '',
    referenceNumber: input.referenceNumber || `DALIL-${room.evidence.length + 1}`,
    visibility: input.visibility || 'public',
    status: 'pending',
    createdAt: now,
  }

  room.evidence.push(evidenceItem)

  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: user.id,
    userName: p.userName,
    role: p.role,
    messageType: 'procedural',
    content: `📁 YANGI DALIL TAQDIM ETILDI: "${evidenceItem.title}" (${evidenceItem.referenceNumber}). Sud tomonidan ko‘rib chiqilishi kutilmoqda.`,
    stageId: room.currentStageId,
    metadata: { evidenceId: evidenceItem.id },
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 14. Dalil bo‘yicha ajrim (Judge Rules on Evidence)
 */
export async function ruleOnEvidence(
  codeOrId: string,
  judgeUserId: string,
  evidenceId: string,
  status: 'admitted' | 'rejected',
  reason: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const judge = room.participants.find(p => p.userId === judgeUserId)
  if (!judge || judge.role !== 'SUDYA') {
    throw new Error('Faqat Sudya dalilni ishga qo‘shish yoki rad etish vakolatiga ega.')
  }

  const item = room.evidence.find(e => e.id === evidenceId)
  if (!item) throw new Error('Dalil topilmadi.')

  const now = new Date().toISOString()
  item.status = status
  item.judgeDecisionReason = reason
  item.decidedAt = now

  const actionText =
    status === 'admitted'
      ? `Dalil ish materiallariga QABUL QILINDI. Asos: ${reason}`
      : `Dalil QABUL QILINMADI (rad etildi). Asos: ${reason}`

  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: judgeUserId,
    userName: judge.userName,
    role: 'SUDYA',
    messageType: 'ruling',
    content: `⚖️ DALIL BO‘YICHA AJRIM ("${item.title}"): ${actionText}`,
    stageId: room.currentStageId,
    metadata: { evidenceId: item.id, status },
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

function generateRoleFeedback(
  role: MultiplayerRole,
  userName: string,
  speechCount: number,
  hasEvidence: boolean,
  totalScore: number
): {
  feedback: string
  mistakes: string[]
  recommendations: string[]
  correctArticles: string[]
  grade: string
} {
  const grade =
    totalScore >= 92
      ? 'A+'
      : totalScore >= 85
        ? 'A'
        : totalScore >= 75
          ? 'B+'
          : totalScore >= 65
            ? 'B'
            : 'C'

  switch (role) {
    case 'SUDYA':
      return {
        feedback: `${userName} (Sud Raisi) majlisni xolisona boshqardi, protsessual ketma-ketlikka amal qildi va taraflar e’tirozlarini ko‘rib chiqdi.`,
        mistakes: [
          speechCount < 3
            ? 'Majlis ochilishida (JPK 405) taraflarga protsessual huquq va majburiyatlarini to‘liq, moddama-modda tushuntirib berishda sustlik bo‘ldi.'
            : 'Ayrim e’tirozlar bo‘yicha taraflarga batafsilroq asoslangan ajrim e’lon qilish maqsadga muvofiq edi.',
          'Dalillarni tekshirish bosqichida guvohlar ko‘rsatmasini ashyoviy dalillar bilan o‘zaro solishtirishga ko‘proq urg‘u berilmadi.',
        ],
        recommendations: [
          'JPK 405-410-moddalari talabiga ko‘ra, majlisni ochiq deb e’lon qilgach, shaxslarni tekshirish va rad qilish (otvod) huquqini darhol eslatish shart.',
          'Yakuniy hukm matnida faqat jazo miqdorini emas, balki JK 55-moddasida nazarda tutilgan barcha yengillashtiruvchi holatlarning aniq tahlilini aks ettirish lozim.',
        ],
        correctArticles: ['JPK 405-modda', 'JPK 411-modda', 'JPK 454-modda', 'JK 55-modda'],
        grade,
      }

    case 'PROKUROR':
      return {
        feedback: `${userName} (Davlat ayblovchisi) ayblov xulosasini himoya qildi va sudlanuvchining qilmishi qonunga zid ekanligini isbotlashga intildi.`,
        mistakes: [
          !hasEvidence
            ? 'Ayblovni mustahkamlash uchun tergov materiallaridagi videoyozuv va tovar inventarizatsiyasi dalillarini faolroq ishlatmadi.'
            : 'Himoya tarafining moddiy zarar qoplangani haqidagi kvitansiyasiga nisbatan munosabat bildirishda kechikish bo‘ldi.',
          'Sudlanuvchining qaramog‘idagi nogiron farzandlari borligi kabi ijtimoiy omillar jazo so‘rashda to‘liq inobatga olinmadi.',
        ],
        recommendations: [
          'JPK 88-moddasi bo‘yicha jinoyatning barcha sub’ektiv va ob’ektiv belgilarini faktlar va hujjatlar bilan to‘g‘ridan-to‘g‘ri bog‘lab bayon etish lozim.',
          'Davlat ayblovchisi sifatida nafaqat qattiq jazo talab qilish, balki adolat mezoniga ko‘ra JK 55-moddani o‘zi ham taklif etishi kasbiy saviyani ko‘rsatadi.',
        ],
        correctArticles: ['JPK 88-modda', 'JK 169-modda', 'JPK 438-modda'],
        grade,
      }

    case 'ADVOKAT':
      return {
        feedback: `${userName} (Himoyachi) sudlanuvchining qonuniy manfaatlarini himoya qildi va jazoni yengillashtirish choralarini ko‘rdi.`,
        mistakes: [
          speechCount < 2
            ? 'Himoya nutqi qisqa bo‘lib, sudlanuvchining og‘ir moddiy sharoiti va chin dildan pushaymonligini ochib berishda faollik yetishmadi.'
            : 'Zarar qoplangani haqidagi bank to‘lov kvitansiyasini tergov boshidayoq dalil sifatida qabul qildirishga yetarlicha qat’iyat ko‘rsatilmadi.',
          'Ayblov tomonining ayrim taxminiy vajlariga nisbatan protsessual e’tiroz (objection) bildirish imkoniyatidan to‘liq foydalanilmadi.',
        ],
        recommendations: [
          'JK 55-moddasiga tayanib, zararning ixtiyoriy qoplanganligi va oilaviy og‘ir ahvolni tasdiqlovchi hujjatlarni birinchi navbatda sudga kiritish kerak edi.',
          'JPK 450-moddasi (Sud munozaralari) bo‘yicha ozodlikdan mahrum etish bilan bog‘liq bo‘lmagan jazo (jarima/axloq tuzatish) so‘rab aniq iltimosnoma bilan chiqish lozim edi.',
        ],
        correctArticles: ['JK 55-modda', 'JPK 442-modda', 'JPK 450-modda'],
        grade,
      }

    case 'AYBLANUVCHI':
      return {
        feedback: `${userName} (Sudlanuvchi) sud jarayonida o‘z pozitsiyasini bildirdi va suddan adolatli munosabat so‘radi.`,
        mistakes: [
          'Oxirgi so‘z (JPK 453) imkoniyatidan to‘liq foydalanmadi va pushaymonlikni sudda to‘liq ifodalamadi.',
          'Zararni qoplashdagi shaxsiy hissasi va jabrlanuvchi bilan yarashuv choralarini yetarlicha tilga olmadi.',
        ],
        recommendations: [
          'Sudda haqiqatni yashirmay, qilmishidan xulosa chiqarganini va jamiyat uchun xavfli emasligini ko‘rsatish lozim edi.',
        ],
        correctArticles: ['JPK 453-modda', 'JK 55-modda'],
        grade,
      }

    case 'GUVOH':
      return {
        feedback: `${userName} (Guvoh) ish yuzasidan o‘ziga ma’lum bo‘lgan ma’lumotlarni bayon qildi.`,
        mistakes: [
          'Ko‘rsatma berishda shaxsiy taxminlarni haqiqiy ko‘rgan faktlarga aralashtirib yuborish holatlari uchradi.',
        ],
        recommendations: [
          'JPK 116-moddasi bo‘yicha faqat shaxsan ko‘rgan yoki eshitgan aniq vaqt va joy haqidagi faktlarni xolis aytish lozim.',
        ],
        correctArticles: ['JPK 116-modda', 'JPK 445-modda'],
        grade,
      }

    default:
      return {
        feedback: `${userName} (${role}) sud majlisi tartibiga rioya qildi.`,
        mistakes: ['Jarayonda faolroq ishtirok etish tavsiya etiladi.'],
        recommendations: [
          'Sud qonunchiligi bo‘yicha protsessual bilimlarni oshirib borish maqsadga muvofiq.',
        ],
        correctArticles: ['JPK 405-modda'],
        grade,
      }
  }
}

/**
 * 15. Hukm / Qaror chiqarish (Issue Verdict and Complete Trial)
 */
export async function issueVerdict(
  codeOrId: string,
  judgeUserId: string,
  input: {
    verdictDecision: any
    title: string
    summary: string
    legalReasoning: string
    penaltyOrRemedy: string
  }
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const judge = room.participants.find(p => p.userId === judgeUserId)
  if (!judge || judge.role !== 'SUDYA') {
    throw new Error('Faqat Sudya hukm / hal qiluv qarori chiqarish vakolatiga ega.')
  }

  const now = new Date().toISOString()

  // Score all active participants fairly based on participation and role
  const scores: Record<string, ParticipantScore> = {}

  for (const p of room.participants) {
    if (p.role === 'KUZATUVCHI') continue

    const pMessages = room.messages.filter(m => m.userId === p.userId && m.messageType === 'speech')
    const speechCount = pMessages.length
    const hasEvidence = room.evidence.some(e => e.submittedById === p.userId)

    const legalReasoning = Math.min(60 + speechCount * 8, 98)
    const proceduralCorrectness = Math.min(70 + speechCount * 6, 95)
    const argumentQuality = Math.min(65 + speechCount * 7, 96)
    const evidenceUsage = hasEvidence ? 90 : 70
    const totalScore = Math.round(
      (legalReasoning + proceduralCorrectness + argumentQuality + evidenceUsage) / 4
    )
    const xpEarned = totalScore * 2 // 150 - 200 XP

    // Detailed educational analysis: Qayerda xato qildi & Nima qilishi kerak edi
    const analysis = generateRoleFeedback(p.role, p.userName, speechCount, hasEvidence, totalScore)

    scores[p.userId] = {
      userId: p.userId,
      userName: p.userName,
      role: p.role,
      legalReasoning,
      proceduralCorrectness,
      argumentQuality,
      evidenceUsage,
      totalScore,
      xpEarned,
      feedback: analysis.feedback,
      mistakes: analysis.mistakes,
      recommendations: analysis.recommendations,
      correctArticles: analysis.correctArticles,
      proceduralGrade: analysis.grade,
    }

    // Award XP to real registered user asynchronously
    if (p.userId.includes('-') && p.userId.length === 36) {
      awardUserXP({
        userId: p.userId,
        action: 'court_win',
        xp: xpEarned,
        title: 'Virtual Sud Simulyatsiyasi',
        description: `Ko‘p foydalanuvchili sudda [${p.role}] sifatida muvaffaqiyatli ishtirok uchun`,
        idempotencyKey: `mp-xp-${room.id}-${p.userId}`,
        metadata: { roomId: room.id, role: p.role, score: totalScore },
      }).catch(e => {
        console.error('Error awarding XP:', e)
      })
    }
  }

  const verdict: MultiplayerVerdict = {
    verdictDecision: input.verdictDecision,
    title: input.title || `O‘zbekiston Respublikasi Nomi Bilan HUKM`,
    summary: input.summary,
    legalReasoning: input.legalReasoning,
    penaltyOrRemedy: input.penaltyOrRemedy,
    judgedAt: now,
    judgedByName: judge.userName,
    judgedById: judge.userId,
    scores,
  }

  room.verdictData = verdict
  room.status = 'completed'
  room.currentStageId = 'verdict_review'
  room.currentStageOrder = 8

  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: judgeUserId,
    userName: judge.userName,
    role: 'SUDYA',
    messageType: 'verdict',
    content: `🏛️ O‘ZBEKISTON RESPUBLIKASI NOMI BILAN HUKM/QAROR: ${input.summary}. Jazo/Qaror chorasi: ${input.penaltyOrRemedy}`,
    stageId: 'verdict_review',
    metadata: { verdict },
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 16. Xonadan chiqish (Leave Room)
 */
export async function leaveCourtRoom(
  codeOrId: string,
  userId: string
): Promise<MultiplayerRoom | null> {
  const room = await getCourtRoom(codeOrId)
  if (!room) return null

  const p = room.participants.find(part => part.userId === userId)
  if (!p) return room

  const now = new Date().toISOString()
  p.connectionStatus = 'disconnected'

  // If host leaves, transfer host privileges to another participant
  if (p.isHost) {
    p.isHost = false
    const newHost = room.participants.find(
      other => other.userId !== userId && other.connectionStatus === 'online'
    )
    if (newHost) {
      newHost.isHost = true
      room.hostId = newHost.userId
      room.hostName = newHost.userName
      room.messages.push({
        id: crypto.randomUUID(),
        roomId: room.id,
        userId: 'system',
        userName: 'Tizim',
        role: 'KOTIB',
        messageType: 'system',
        content: `Xona boshqaruvchisi (${p.userName}) chiqdi. Boshqaruv ${newHost.userName} ga o‘tkazildi.`,
        stageId: room.currentStageId,
        createdAt: now,
      })
    }
  }

  // Remove participant if in waiting lobby, or keep status disconnected if trial is running
  if (room.status === 'waiting') {
    room.participants = room.participants.filter(part => part.userId !== userId)
  }

  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: 'system',
    userName: 'Sud Kotibi',
    role: 'KOTIB',
    messageType: 'system',
    content: `${p.userName} (${p.role}) majlisni tark etdi.`,
    stageId: room.currentStageId,
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}

/**
 * 17. Ishtirokchini chetlashtirish (Host Kicks Participant)
 */
export async function kickParticipant(
  codeOrId: string,
  hostUserId: string,
  targetUserId: string
): Promise<MultiplayerRoom> {
  const room = await getCourtRoom(codeOrId)
  if (!room) throw new Error('Sud zali topilmadi.')

  const host = room.participants.find(p => p.userId === hostUserId)
  if (!host || (!host.isHost && host.role !== 'SUDYA')) {
    throw new Error(
      'Faqat xona boshqaruvchisi yoki Sud Raisi ishtirokchini zalldan chetlatishi mumkin.'
    )
  }

  const target = room.participants.find(p => p.userId === targetUserId)
  if (!target) throw new Error('Ishtirokchi topilmadi.')

  room.participants = room.participants.filter(p => p.userId !== targetUserId)
  room.speakingQueue = room.speakingQueue.filter(q => q.userId !== targetUserId)
  if (room.currentSpeakerId === targetUserId) {
    room.currentSpeakerId = null
  }

  const now = new Date().toISOString()
  room.messages.push({
    id: crypto.randomUUID(),
    roomId: room.id,
    userId: hostUserId,
    userName: host.userName,
    role: host.role,
    messageType: 'system',
    content: `${target.userName} sud zalidan chetlashtirildi.`,
    stageId: room.currentStageId,
    createdAt: now,
  })

  room.updatedAt = now
  await persistRoomToDb(room)
  return room
}
