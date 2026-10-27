/**
 * multiplayer-types.ts — JURISTIV Ko'p foydalanuvchili Virtual Sud tiplari
 * O'zbekiston protsessual qonunchiligi (JPK, FPK, BSK, MK, FK) asosida.
 */

import type { EvidenceType, EvidenceVisibility, CourtRole } from './court-types'

export type MultiplayerRole =
  'SUDYA' | 'ADVOKAT' | 'PROKUROR' | 'GUVOH' | 'AYBLANUVCHI' | 'KOTIB' | 'KUZATUVCHI'

export type MultiplayerRoomStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

export type MultiplayerCaseCategory = 'criminal' | 'civil' | 'labor' | 'administrative' | 'economic'

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
    'aybdor' | 'aybsiz' | 'qanoatlantirildi' | 'rad_etildi' | 'qisman_qanoatlantirildi' | 'kelishuv'
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
    title: 'Guvoh / Mutaxassis',
    desc: 'Ish bo‘yicha ma’lum faktlarni qasamyod ostida xolis bayon qiladi va savollarga javob beradi.',
    color: 'from-emerald-600 to-teal-700 border-emerald-500/40 text-emerald-300',
    icon: '👁️',
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
