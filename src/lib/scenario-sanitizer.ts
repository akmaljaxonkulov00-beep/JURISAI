import crypto from 'crypto'
import {
  ScenarioData,
  ScenarioDecisionPoint,
  ScenarioEvidenceItem,
  ScenarioFact,
} from '@/types/scenario-generator'

interface SignedScenarioPayload {
  id: string
  decision_points: ScenarioDecisionPoint[]
  hidden_evidence: ScenarioEvidenceItem[]
  facts: ScenarioFact[]
}

function getScenarioSecret(): string {
  return (
    process.env.SCENARIO_HMAC_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'juristiv-dev-scenario-secret-2026'
  )
}

function signPayload(dataB64: string): string {
  return crypto.createHmac('sha256', getScenarioSecret()).update(dataB64).digest('base64url')
}

export function createScenarioStateToken(scenario: ScenarioData): string {
  const payload: SignedScenarioPayload = {
    id: scenario.id,
    decision_points: scenario.decision_points || [],
    hidden_evidence: (scenario.evidence || []).filter(e => e.discovered === false),
    facts: scenario.facts || [],
  }
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = signPayload(encoded)
  return `${encoded}.${sig}`
}

export function verifyScenarioStateToken(token?: string | null): SignedScenarioPayload | null {
  if (!token || !token.includes('.')) return null
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const expected = signPayload(encoded)
  try {
    const a = Buffer.from(sig, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null
    }
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SignedScenarioPayload
  } catch {
    return null
  }
}

/**
 * Strips answer keys (is_optimal, xp, feedback, consequence) and undiscovered evidence
 * before sending a scenario to the client.
 */
export function sanitizeScenarioForClient(scenario: ScenarioData): ScenarioData {
  const server_state_token = createScenarioStateToken(scenario)

  const sanitizedDecisionPoints: ScenarioDecisionPoint[] = (scenario.decision_points || []).map(
    dp => ({
      ...dp,
      options: (dp.options || []).map(opt => ({
        id: opt.id,
        label: opt.label,
        action_type: opt.action_type,
        description: opt.description,
      })),
    })
  )

  const visibleEvidence = (scenario.evidence || []).filter(e => e.discovered !== false)

  return {
    ...scenario,
    evidence: visibleEvidence,
    decision_points: sanitizedDecisionPoints,
    server_state_token,
  }
}
