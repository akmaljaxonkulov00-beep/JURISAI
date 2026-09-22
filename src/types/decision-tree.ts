/**
 * Decision Tree (Qarorlar Daraxti) Data Types
 * Professional LegalTech Architecture for Juristiv
 */

export type NodeType =
  | 'ROOT'
  | 'FACT'
  | 'QUESTION'
  | 'DECISION'
  | 'ACTION'
  | 'OUTCOME'
  | 'WARNING'
  | 'SUCCESS'
  | 'FAILURE'

export type RiskLevel = 'low' | 'medium' | 'high'
export type NodeStatus = 'optimal' | 'risk' | 'neutral' | 'active'

export interface ApplicableLawRef {
  code_id: string
  code_name: string
  article_number: string
  title: string
  excerpt?: string
  status?: string
}

export interface DecisionNode {
  id: string
  case_id?: string
  parent_id?: string | null
  type: NodeType
  title: string
  description?: string
  question?: string
  action?: string
  legal_basis?: string
  applicable_laws?: ApplicableLawRef[]
  consequences?: string
  risk_level?: RiskLevel
  risk_basis?: string
  probability?: number | null // 0 - 100
  estimated_cost?: number // so'mda
  estimated_duration?: string // masalan: "1-3 oy", "15-45 kun"
  confidence?: number // AI tahlil ishonchliligi (0-100)
  evidence_required?: string[]
  next_steps?: string[]
  status?: NodeStatus
  children?: DecisionNode[]

  // Vizualizatsiya va iyerarxiya maydonlari
  x?: number
  y?: number
  width?: number
  height?: number
  collapsed?: boolean
  created_at?: string
}

export interface CaseAnalysis {
  case_summary: string
  legal_domain: string
  user_role: string
  objectives: string
  key_facts: string[]
  missing_facts: string[]
  legal_issues: string[]
  applicable_laws: ApplicableLawRef[]
  evidence: string[]
  assumptions: string[]
  decision_points: string[]
  possible_strategies: string[]
  risks: Array<{
    title: string
    level: RiskLevel
    basis: string
  }>
  opportunities: string[]
  recommended_next_steps: string[]
}

export interface DecisionCase {
  id: string
  user_id?: string
  name: string
  case_type: string
  user_role: string
  objectives?: string
  known_facts?: string
  evidence_docs?: string
  opposing_party?: string
  deadlines?: string
  additional_notes?: string
  tree: DecisionNode
  analysis?: CaseAnalysis
  selected_path?: string[] // node ids in path
  evidence_state?: Record<string, boolean> // evidence item -> checked status
  notes?: string
  status?: 'active' | 'archived' | 'completed'
  created_at?: string
  updated_at?: string
}

export interface TreeStatistics {
  variants: number
  decisionPoints: number
  outcomes: number
  optimalPaths: number
  riskPaths: number
  totalCost: number
  durations: string[]
  confidence: number
  evidenceRequiredCount: number
  legalBasesCount: number
}

export interface PathSimulationMetrics {
  pathNodes: DecisionNode[]
  totalCost: number
  durations: string[]
  overallConfidence: number
  highestRisk: RiskLevel
  riskBasis: string[]
  requiredEvidences: string[]
  missingEvidenceCount: number
  legalArticles: ApplicableLawRef[]
  recommendedSteps: string[]
}

export interface ComparisonVariant {
  id: string
  title: string
  nodeType: NodeType
  legalBasis: string
  applicableLaws: ApplicableLawRef[]
  riskLevel: RiskLevel
  riskBasis: string
  pros: string[]
  cons: string[]
  estimatedCost: number
  estimatedDuration: string
  evidenceRequired: string[]
  confidence: number
  nextSteps: string[]
  outcomeLabel?: string
}
