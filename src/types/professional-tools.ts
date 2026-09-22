/**
 * Professional Tools (Asboblar) Type Definitions
 * Strict LegalTech Data Structures for Juristiv
 */

export interface OfficialLegalSource {
  source_key: string
  source_name: string
  source_type: 'law' | 'code' | 'plenum' | 'cbu_rate' | 'decree' | 'standard_form'
  official_domain: string
  url: string
  document_number: string
  document_title: string
  effective_date?: string
  current_rate?: number
  currency?: string
  verification_status: 'verified' | 'pending' | 'archived'
  verified_at?: string
  description?: string
}

// ── 1. Yuridik Kalkulyatorlar Tiplari ──

export type CourtType = 'civil' | 'economic' | 'administrative'
export type ClaimPropertyType =
  | 'property'
  | 'non_property'
  | 'divorce'
  | 'divorce_repeated'
  | 'inheritance'
  | 'administrative_appeal'
export type CourtInstance = 'first_instance' | 'appeal' | 'cassation' | 'supervisory'

export interface StateFeeInput {
  courtType: CourtType
  claimType: ClaimPropertyType
  claimAmount?: number // so'mda
  instance?: CourtInstance
  isExempted?: boolean
  exemptionReason?: string
}

export interface StateFeeBreakdownItem {
  name: string
  rateDescription: string
  calculatedAmount: number
  statutoryMinimum?: number
  legalGround: string
  sourceUrl: string
}

export interface StateFeeResult {
  totalFee: number
  bhmRate: number
  breakdown: StateFeeBreakdownItem[]
  legalBases: string[]
  officialSources: OfficialLegalSource[]
  calculationFormula: string
  notes?: string[]
}

export interface PenaltyInput {
  contractAmount: number
  dailyRatePercent?: number // odatda 0.5% (Qonun 670-I) yoki shartnomada belgilangan
  daysLate: number
  maxCapPercent?: number // 50% statutory cap
  includeInterest327?: boolean
}

export interface PenaltyResult {
  penaltyAmount: number
  effectiveDailyRate: number
  isCapped: boolean
  capAmount: number
  daysCounted: number
  interest327Amount?: number
  totalClaim: number
  calculationFormula: string
  legalBases: string[]
  officialSources: OfficialLegalSource[]
}

export interface Interest327Input {
  debtAmount: number
  daysCount: number
  customAnnualRate?: number // Agar kiritilmasa Markaziy bank amaldagi qayta moliyalash stavkasi (13.5%) olinadi
}

export interface Interest327Result {
  interestAmount: number
  annualRateApplied: number
  cbuRateDate: string
  daysCount: number
  dailyRate: number
  calculationFormula: string
  legalBases: string[]
  officialSources: OfficialLegalSource[]
}

export interface BhmInput {
  multiplier: number // Masalan 5 baravari, 10 baravari
  customBhmRate?: number
}

export interface BhmResult {
  multiplier: number
  singleBhmAmount: number
  totalAmount: number
  decreeNumber: string
  effectiveFrom: string
  officialSources: OfficialLegalSource[]
}

export interface DeadlineInput {
  startDate: string
  disputeCategory:
    | 'civil_general'
    | 'labor_reinstatement'
    | 'labor_other'
    | 'contract_breach'
    | 'appeal_civil'
    | 'appeal_economic'
}

export interface DeadlineResult {
  startDate: string
  deadlineDate: string
  durationText: string
  isExpired: boolean
  daysRemaining: number
  legalBases: string[]
  officialSources: OfficialLegalSource[]
  proceduralSteps: string[]
}

// ── 2. Hujjatlar Konstruktori Tiplari ──

export interface OfficialTemplate {
  id: string
  slug: string
  name: string
  category: string
  description: string
  content: string
  law_ref: string
  format: 'DOCX' | 'PDF' | 'TXT'
  file_size?: string
  downloads?: number
  tags?: string[]
  official_source_url?: string
  authority?: string
  placeholders?: TemplatePlaceholder[]
}

export interface TemplatePlaceholder {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'select'
  options?: string[]
  required: boolean
  placeholder?: string
  helpText?: string
  defaultValue?: string
}

export interface DocumentGenerationPayload {
  templateSlug: string
  formData: Record<string, string | number>
  exportFormat?: 'DOCX' | 'PDF' | 'TXT'
}

export interface GeneratedDocument {
  title: string
  templateSlug: string
  htmlContent: string
  filledFields: Record<string, string | number>
  legalReferences: string[]
  officialSourceUrl?: string
  generatedAt: string
}

// ── 3. Risk Assessment Tiplari ──

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ClauseRiskIssue {
  clauseTitle: string
  clauseText: string
  issue: string
  severity: RiskSeverity
  legalViolation?: string
  legalGround: string
  officialSourceUrl?: string
  recommendation: string
}

export interface MissingClauseWarning {
  clauseType: string
  importance: 'essential' | 'recommended'
  whyNeeded: string
  suggestedText: string
  legalGround?: string
}

export interface RiskScanResult {
  documentTitle: string
  documentType: string
  overallRisk: 'low' | 'medium' | 'high'
  riskScore: number // 0-100 (100 is safest)
  summary: string
  detectedIssues: ClauseRiskIssue[]
  missingClauses: MissingClauseWarning[]
  positiveClauses: string[]
  actionPlan: string[]
  officialSources: OfficialLegalSource[]
  scannedAt: string
}

// ── 4. Sud Amaliyoti Tiplari ──

export interface CourtPracticeItem {
  id: string
  title: string
  caseNumber?: string
  courtName: string
  category: string
  plenumDecisionNumber?: string
  legalArea: string
  summary: string
  keyRuling: string
  citedLaws: string[]
  officialSourceUrl: string
  decisionDate: string
  relevanceScore?: number
}

// ── 5. Tarix Tipi ──

export interface ToolHistoryRecord {
  id: string
  user_id?: string
  tool_type: 'calculator' | 'document_generation' | 'risk_assessment' | 'court_practice'
  title: string
  summary?: string
  input_data: Record<string, unknown>
  result_data: Record<string, unknown>
  legal_references: string[]
  status?: string
  created_at: string
}
