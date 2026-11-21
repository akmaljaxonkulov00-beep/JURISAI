/**
 * multiplayer-types.ts — JURISTIV Enterprise Multiplayer Virtual Court tiplari
 * O'zbekiston protsessual qonunchiligi (JPK, FPK, BSK, MK, FK) asosida.
 */

import type { EvidenceType, EvidenceVisibility, CourtRole } from './court-types'

export type MultiplayerRole =
  | 'SUDYA'
  | 'ADVOKAT'
  | 'PROKUROR'
  | 'GUVOH'
  | 'AYBLANUVCHI'
  | 'EKSPERT'
  | 'KOTIB'
  | 'KUZATUVCHI'

export type MultiplayerRoomStatus =
  | 'waiting'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'abandoned'

export type MultiplayerCaseCategory = 'criminal' | 'civil' | 'labor' | 'administrative' | 'economic'

export interface RoomSettings {
  allowGuests: boolean
  aiAssistantEnabled: boolean
  strictProceduralRules: boolean
  maxDurationMinutes?: number
}

export interface MultiplayerParticipant {
  id: string
  roomId: string
  userId: string
  userName: string
  avatarUrl?: string
  role: MultiplayerRole
  isHost: boolean
  isAi: boolean
  isReady: boolean
  canSpeak: boolean
  connectionStatus: 'online' | 'idle' | 'disconnected'
  lastSeenAt: string
  joinedAt: string
  micMuted?: boolean
  videoEnabled?: boolean
}

export interface MultiplayerEvidenceItem {
  id: string
  roomId: string
  submittedById: string
  submittedByName: string
  submittedByRole: MultiplayerRole
  title: string
  type: EvidenceType | 'audio'
  description: string
  content: string
  fileUrl?: string
  referenceNumber?: string
  visibility: EvidenceVisibility
  status: 'pending' | 'admitted' | 'rejected'
  judgeDecisionReason?: string
  decidedAt?: string
  createdAt: string
}

export interface MultiplayerMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  role: MultiplayerRole
  messageType: 'speech' | 'procedural' | 'objection' | 'ruling' | 'system' | 'verdict'
  content: string
  stageId: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface MultiplayerObjection {
  id: string
  raisedById: string
  raisedByName: string
  raisedByRole: MultiplayerRole
  targetParticipantId?: string
  targetRole?: string
  reason: string
  stageId: string
  status: 'pending' | 'sustained' | 'overruled'
  judgeReasoning?: string
  createdAt: string
}

export interface ParticipantScore {
  userId: string
  userName: string
  role: MultiplayerRole
  legalReasoning: number
  proceduralCorrectness: number
  argumentQuality: number
  evidenceUsage: number
  totalScore: number
  xpEarned: number
  feedback: string
  mistakes: string[]
  recommendations: string[]
  correctArticles?: string[]
  proceduralGrade: string
}

export interface MultiplayerVerdict {
  verdictDecision:
    | 'aybdor'
    | 'aybsiz'
    | 'qanoatlantirildi'
    | 'rad_etildi'
    | 'qisman_qanoatlantirildi'
    | 'kelishuv'
  title: string
  summary: string
  legalReasoning: string
  penaltyOrRemedy: string
  judgedAt: string
  judgedByName: string
  judgedById: string
  scores: Record<string, ParticipantScore>
}

export interface SpeakingQueueItem {
  userId: string
  userName: string
  role: MultiplayerRole
  requestedAt: string
  approvedAt?: string
}

export interface MultiplayerRoom {
  id: string
  code: string
  title: string
  caseCategory: MultiplayerCaseCategory
  courtType: string
  scenarioId?: string
  scenarioData: any
  hostId: string
  hostName: string
  creatorId?: string
  isPublic: boolean
  aiEnabled: boolean
  voiceEnabled: boolean
  maxParticipants: number
  status: MultiplayerRoomStatus
  currentStageId: string
  currentStageOrder: number
  currentSpeakerId?: string | null
  currentSpeakerRole?: string | null
  speakingQueue: SpeakingQueueItem[]
  pendingObjection?: MultiplayerObjection | null
  verdictData?: MultiplayerVerdict | null
  participants: MultiplayerParticipant[]
  evidence: MultiplayerEvidenceItem[]
  messages: MultiplayerMessage[]
  startedAt?: string
  completedAt?: string
  durationSeconds?: number
  expiresAt?: string
  lastActivityAt?: string
  settings?: RoomSettings
  createdAt: string
  updatedAt: string
}

export interface CreateRoomInput {
  title: string
  caseCategory: MultiplayerCaseCategory
  courtType?: string
  scenarioId?: string
  maxParticipants?: number
  isPublic?: boolean
  aiEnabled?: boolean
  voiceEnabled?: boolean
  settings?: Partial<RoomSettings>
}

export const ROLE_LABELS: Record<
  MultiplayerRole,
  { title: string; desc: string; color: string; icon: string }
> = {
  SUDYA: {
    title: 'Sudya / Sud raisi',
    desc: 'Majlisga raislik qiladi, tartibni saqlaydi, dalillarni qabul qiladi va qat’iy hukm/qaror chiqaradi.',
    color: 'from-amber-500 to-yellow-600 border-amber-500/40 text-amber-300',
    icon: '⚖️',
  },
  PROKUROR: {
    title: 'Davlat ayblovchisi / Da’vogar',
    desc: 'Ayblov xulosasini himoya qiladi, da’vo talablarini asoslaydi, dalillar va jazo choralari so‘raydi.',
    color: 'from-red-600 to-rose-700 border-red-500/40 text-red-300',
    icon: '⚡',
  },
  ADVOKAT: {
    title: 'Himoyachi / Advokat',
    desc: 'Sudlanuvchi yoki javobgar huquqlarini himoya qiladi, oqlovchi dalillarni ilgari suradi, e’tirozlar bildiradi.',
    color: 'from-blue-600 to-indigo-700 border-blue-500/40 text-blue-300',
    icon: '🛡️',
  },
  GUVOH: {
    title: 'Guvoh',
    desc: 'Ish bo‘yicha o‘ziga ma’lum faktlarni qasamyod ostida xolis bayon qiladi va savollarga javob beradi.',
    color: 'from-emerald-600 to-teal-700 border-emerald-500/40 text-emerald-300',
    icon: '👁️',
  },
  EKSPERT: {
    title: 'Sud eksperti / Mutaxassis',
    desc: 'O‘z maxsus bilim va malakasi doirasida xulosa beradi va ekspertiza savollariga oydinlik kiritadi.',
    color: 'from-teal-600 to-cyan-700 border-teal-500/40 text-teal-300',
    icon: '🔬',
  },
  AYBLANUVCHI: {
    title: 'Sudlanuvchi / Javobgar',
    desc: 'Ayblovga nisbatan o‘z pozitsiyasini bildiradi, ko‘rsatma beradi va yakuniy oxirgi so‘z aytadi.',
    color: 'from-purple-600 to-fuchsia-700 border-purple-500/40 text-purple-300',
    icon: '👤',
  },
  KOTIB: {
    title: 'Sud majlisi kotibi',
    desc: 'Majlis bayonnomasini yuritadi, qatnashuvchilar hozirligini tekshiradi va texnik tartibni ta’minlaydi.',
    color: 'from-cyan-600 to-sky-700 border-cyan-500/40 text-cyan-300',
    icon: '📋',
  },
  KUZATUVCHI: {
    title: 'Kuzatuvchi (Ommaviy tinglovchi)',
    desc: 'Sud majlisini ochiq tartibda kuzatadi, dalillar va muzokaralarni real vaqtda ko‘rib boradi.',
    color: 'from-zinc-600 to-slate-700 border-zinc-600/40 text-zinc-300',
    icon: '👥',
  },
}

// ── Role Permissions Matrix ──
export const ROLE_PERMISSIONS: Record<
  MultiplayerRole,
  {
    canStartTrial: boolean
    canAdvanceStage: boolean
    canGrantSpeech: boolean
    canRuleObjection: boolean
    canRuleEvidence: boolean
    canIssueVerdict: boolean
    canPauseTrial: boolean
    canSpeakWithoutTurn: boolean
    canSubmitEvidence: boolean
    canRaiseObjection: boolean
  }
> = {
  SUDYA: {
    canStartTrial: true,
    canAdvanceStage: true,
    canGrantSpeech: true,
    canRuleObjection: true,
    canRuleEvidence: true,
    canIssueVerdict: true,
    canPauseTrial: true,
    canSpeakWithoutTurn: true,
    canSubmitEvidence: false,
    canRaiseObjection: false,
  },
  PROKUROR: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: true,
    canRaiseObjection: true,
  },
  ADVOKAT: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: true,
    canRaiseObjection: true,
  },
  GUVOH: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: false,
    canRaiseObjection: false,
  },
  EKSPERT: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: true,
    canRaiseObjection: false,
  },
  AYBLANUVCHI: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: false,
    canRaiseObjection: false,
  },
  KOTIB: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: true,
    canSubmitEvidence: false,
    canRaiseObjection: false,
  },
  KUZATUVCHI: {
    canStartTrial: false,
    canAdvanceStage: false,
    canGrantSpeech: false,
    canRuleObjection: false,
    canRuleEvidence: false,
    canIssueVerdict: false,
    canPauseTrial: false,
    canSpeakWithoutTurn: false,
    canSubmitEvidence: false,
    canRaiseObjection: false,
  },
}

/**
 * Xona sig‘imiga (maxParticipants) mos keladigan rasmiy sud rollari ro‘yxatini qaytaradi.
 * Masalan: 2 kishilik xonada 7 ta rol emas, faqat 2 ta zarur sud roli bo‘ladi.
 */
export function getActiveRolesForCapacity(maxParticipants: number = 8): MultiplayerRole[] {
  if (maxParticipants <= 2) {
    return ['SUDYA', 'ADVOKAT']
  }
  if (maxParticipants === 3) {
    return ['SUDYA', 'PROKUROR', 'ADVOKAT']
  }
  if (maxParticipants === 4) {
    return ['SUDYA', 'PROKUROR', 'ADVOKAT', 'KOTIB']
  }
  if (maxParticipants === 5) {
    return ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB']
  }
  if (maxParticipants === 6) {
    return ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB', 'GUVOH']
  }
  return ['SUDYA', 'PROKUROR', 'ADVOKAT', 'AYBLANUVCHI', 'KOTIB', 'GUVOH', 'EKSPERT']
}

