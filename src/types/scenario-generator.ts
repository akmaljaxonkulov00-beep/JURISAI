/**
 * Professional Scenario Generator (Senariy Generator) Types
 * Interactive Legal Simulation Engine for Juristiv (2026 Production)
 */

export type ScenarioDomain =
  | 'civil'
  | 'criminal'
  | 'family'
  | 'labor'
  | 'administrative'
  | 'business'
  | 'contract'
  | 'inheritance'
  | 'property'
  | 'land'
  | 'ip'
  | 'tax'

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ScenarioRole =
  | 'advokat'
  | 'himoyachi'
  | 'prokuror'
  | 'sudya'
  | 'tergovchi'
  | 'yurist'
  | 'mediator'
  | 'davogar_vakili'
  | 'javobgar_vakili'
  | 'talaba'

export type ScenarioObjective =
  | 'irac'
  | 'court_practice'
  | 'negotiation'
  | 'investigation'
  | 'legal_consulting'
  | 'document_drafting'
  | 'evidence_evaluation'
  | 'strategy'
  | 'court_trial'

export type ActionType =
  | 'request_evidence'
  | 'question_witness'
  | 'inspect_document'
  | 'send_claim'
  | 'negotiate'
  | 'court_application'
  | 'cite_article'
  | 'custom_action'

export interface ScenarioParticipant {
  id: string
  name: string
  role: string
  background: string
  interests: string
  legal_stance?: string
}

export interface ScenarioFact {
  id: string
  statement: string
  is_contested: boolean
  date?: string
  category?: string
}

export interface ScenarioEvidenceItem {
  id: string
  title: string
  type: 'document' | 'testimony' | 'expert_opinion' | 'physical' | 'digital'
  description: string
  reliability: 'high' | 'medium' | 'low'
  is_admissible: boolean
  legal_basis?: string
  discovered: boolean
}

export interface ScenarioTimelineItem {
  date: string
  event: string
  significance: string
}

export interface ScenarioLegalIssue {
  id: string
  question: string
  applicable_articles: string[]
  official_source_url?: string
}

export interface ScenarioOption {
  id: string
  label: string
  action_type: ActionType
  description: string
  consequence: string
  xp: number
  is_optimal: boolean
  feedback: string
}

export interface ScenarioDecisionPoint {
  id: string
  step_number: number
  stage_title: string
  prompt: string
  options: ScenarioOption[]
}

export interface ScenarioValidation {
  is_valid: boolean
  checked_articles: string[]
  legal_consistency_score: number // 0-100
  notes?: string[]
}

export interface ScenarioData {
  id: string
  title: string
  legal_domain: ScenarioDomain
  difficulty: ScenarioDifficulty
  objective: ScenarioObjective
  user_role: ScenarioRole
  background: string
  facts: ScenarioFact[]
  participants: ScenarioParticipant[]
  evidence: ScenarioEvidenceItem[]
  timeline: ScenarioTimelineItem[]
  legal_issues: ScenarioLegalIssue[]
  decision_points: ScenarioDecisionPoint[]
  learning_outcomes: string[]
  sources: Array<{ name: string; url: string; number: string }>
  validation: ScenarioValidation
}

export interface UserActionLog {
  step_number: number
  chosen_option_id: string
  action_title: string
  action_type: ActionType
  consequence: string
  xp_earned: number
  is_optimal: boolean
  feedback: string
  timestamp: string
}

export interface ScenarioEvaluation {
  total_score: number // 0-100
  xp_awarded: number
  decision_quality_score: number // 0-100
  legal_analysis_score: number // 0-100
  evidence_usage_score: number // 0-100
  strategy_score: number // 0-100
  mistakes: string[]
  missed_opportunities: string[]
  recommendations: string[]
  completed_at: string
}

export interface ScenarioSession {
  id: string
  user_id: string
  template_id?: string
  scenario_data: ScenarioData
  current_step: number
  total_steps: number
  user_actions: UserActionLog[]
  discovered_evidence: string[]
  score?: number
  xp_awarded?: number
  evaluation?: ScenarioEvaluation
  status: 'active' | 'completed' | 'abandoned'
  created_at: string
  updated_at: string
}

export interface CreateScenarioFormInput {
  domain: ScenarioDomain
  difficulty: ScenarioDifficulty
  role: ScenarioRole
  objective: ScenarioObjective
  topic: string
  focus_areas: string[]
  additional_requirements?: string
  participants_count?: number
}
