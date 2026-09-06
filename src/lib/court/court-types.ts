/**
 * court-types.ts — Virtual Sud Simulyatori tiplari
 * O'zbekiston protsessual qonunchiligi (JPK, FPK, BSK, MK, FK) asosida.
 */

export type CourtRole = 'ADVOKAT' | 'PROKUROR' | 'SUDYA'

export type ProcedureType = 'trial' | 'negotiation' | 'investigation'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type CaseCategory = 'criminal' | 'civil' | 'administrative' | 'labor' | 'family' | 'economic'

export interface LegalBasisRef {
  code: string // e.g. 'JK', 'JPK', 'FK', 'FPK', 'MK', 'OK'
  article: string // e.g. '169-modda'
  title: string
  relevance: string
}

export interface ParticipantPersona {
  id: string
  role: string // 'SUDYA' | 'PROKUROR' | 'ADVOKAT' | 'SUDLANUVCHI' | 'JABRLANUVCHI' | 'GUVOH' | 'EKSPERT' | 'KOTIB' | "DA'VOGAR" | 'JAVOBGAR' | 'TERGOVCHI'
  title: string // Display title: "Sud raisi", "Davlat ayblovchisi", "Himoyachi", etc.
  name: string // Real Uzbek name, e.g. "Farhod Ergashev"
  avatarIcon?: string
  isUser: boolean
  objective: string
  allowedKnowledge: string[]
  hiddenSecrets?: string[]
  communicationStyle: string // e.g. 'formal', 'aggressive', 'evasive', 'emotional', 'objective'
  statementsMade?: string[]
}

export type EvidenceType =
  'document' | 'photo' | 'testimony' | 'expert_opinion' | 'contract' | 'receipt' | 'report'

export type EvidenceVisibility =
  'public' | 'prosecution_only' | 'defense_only' | 'court_only' | 'revealed'

export type EvidenceStatus = 'unsubmitted' | 'submitted' | 'admitted' | 'rejected'

export interface EvidenceItem {
  id: string
  title: string
  type: EvidenceType
  description: string
  content: string
  source: string
  relevance: string
  visibility: EvidenceVisibility
  status: EvidenceStatus
  proceduralObjection?: string | null
}

export interface ProceduralActionDef {
  id: string
  label: string
  actionType:
    'speak' | 'question' | 'present_evidence' | 'object' | 'ruling' | 'conclude' | 'settle'
  description: string
  targetRequired?: boolean
  evidenceRequired?: boolean
}

export interface CourtStage {
  id: string
  order: number
  title: string
  legalName: string // e.g. "Sud majlisining ochilishi (JPK 405-modda)"
  description: string
  allowedRoles: string[] // Who can initiate actions
  availableActions: ProceduralActionDef[]
  requiredActions: string[]
  transitionCondition: string
  nextStageId: string | null
}

export interface CourtScenario {
  id: string
  title: string
  description: string
  category: CaseCategory
  procedure_type: ProcedureType
  difficulty: DifficultyLevel
  facts: string
  legal_basis: LegalBasisRef[]
  participants: ParticipantPersona[]
  stages: CourtStage[]
  evidence: EvidenceItem[]
  expected_outcome: string
  active: boolean
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface UserActionPayload {
  type: 'speak' | 'question' | 'present_evidence' | 'object' | 'ruling' | 'conclude' | 'settle'
  role: CourtRole
  speakerName?: string
  text: string
  targetRole?: string
  evidenceId?: string
  objectionReason?: string
}

export interface AiSpeakerMessage {
  speaker: string
  role: string
  message: string
  action?: string
  evidence_reference?: string[]
  reaction_to_user?: string
}

export interface StructuredAiResponse {
  speakers: AiSpeakerMessage[]
  stage_update?: {
    ready_for_next_stage: boolean
    next_stage_recommendation?: string | null
    reason?: string
  }
  user_feedback?: {
    valid_procedural_move: boolean
    critique: string
    etiquette_score_delta: number
    argument_score_delta: number
    evidence_score_delta: number
  }
  suggested_actions?: {
    action_id: string
    label: string
    description?: string
  }[]
}

export interface SessionEvent {
  id: string
  timestamp: string
  stageId: string
  eventType:
    | 'session_started'
    | 'stage_started'
    | 'participant_spoke'
    | 'user_action'
    | 'evidence_presented'
    | 'evidence_admitted'
    | 'evidence_rejected'
    | 'objection_raised'
    | 'ruling_made'
    | 'stage_completed'
    | 'decision_made'
    | 'session_completed'
  speaker: string
  role: string
  content: string
  metadata?: Record<string, unknown>
}

export interface CourtSessionState {
  scenario_id: string
  selected_role: CourtRole
  procedure_type: ProcedureType
  current_stage: string
  stage_order: number
  total_stages: number
  current_speaker: string
  participant_state: ParticipantPersona[]
  evidence_state: EvidenceItem[]
  events: SessionEvent[]
  scoring: {
    etiquette: number
    argument: number
    evidence: number
    proceduralCorrectness: number
    legalReasoning: number
    violationsCount: number
  }
  procedural_violations: string[]
  completed: boolean
}

export interface ScoringResult {
  legalReasoning: number
  argumentQuality: number
  evidenceUsage: number
  proceduralCorrectness: number
  strategy: number
  impartiality?: number // Only for SUDYA
  totalScore: number
  xpEarned: number
  achievements: string[]
  feedbackSummary: string
  detailedCritique: string[]
  strengths: string[]
  improvements: string[]
}
