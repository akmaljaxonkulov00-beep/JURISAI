import {
  DecisionNode,
  TreeStatistics,
  PathSimulationMetrics,
  ComparisonVariant,
  RiskLevel,
  ApplicableLawRef,
} from '@/types/decision-tree'

export const NODE_WIDTH = 240
export const NODE_HEIGHT = 110
export const HORIZONTAL_SPACING = 50
export const VERTICAL_SPACING = 100

/**
 * Calculates collision-free hierarchical layout positions (x, y) for all nodes in the tree.
 * Uses post-order subtree width calculation to ensure children never overlap.
 */
export function layoutTree(root: DecisionNode): DecisionNode {
  const clone: DecisionNode = JSON.parse(JSON.stringify(root))

  // Step 1: Compute subtree width for each node
  function computeSubtreeWidth(node: DecisionNode): number {
    node.width = NODE_WIDTH
    node.height = NODE_HEIGHT

    if (node.collapsed || !node.children || node.children.length === 0) {
      return NODE_WIDTH
    }

    let totalWidth = 0
    node.children.forEach((child, idx) => {
      const childWidth = computeSubtreeWidth(child)
      totalWidth += childWidth + (idx > 0 ? HORIZONTAL_SPACING : 0)
    })

    return Math.max(NODE_WIDTH, totalWidth)
  }

  computeSubtreeWidth(clone)

  // Step 2: Assign coordinates (x, y)
  function assignPositions(
    node: DecisionNode,
    startX: number,
    startY: number,
    allocatedWidth: number
  ) {
    node.x = Math.round(startX + allocatedWidth / 2 - NODE_WIDTH / 2)
    node.y = Math.round(startY)

    if (node.collapsed || !node.children || node.children.length === 0) {
      return
    }

    let currentX = startX
    const childY = startY + NODE_HEIGHT + VERTICAL_SPACING

    // Calculate total children natural width
    const childWidths = node.children.map(c => {
      if (c.collapsed || !c.children || c.children.length === 0) return NODE_WIDTH
      let w = 0
      c.children.forEach((cc, i) => {
        w +=
          (cc.collapsed || !cc.children?.length ? NODE_WIDTH : NODE_WIDTH) +
          (i > 0 ? HORIZONTAL_SPACING : 0)
      })
      return Math.max(NODE_WIDTH, w)
    })

    const totalChildrenWidth =
      childWidths.reduce((sum, w) => sum + w, 0) + (node.children.length - 1) * HORIZONTAL_SPACING

    // Center children under parent if allocated width is larger
    if (allocatedWidth > totalChildrenWidth) {
      currentX += (allocatedWidth - totalChildrenWidth) / 2
    }

    node.children.forEach((child, idx) => {
      const w = childWidths[idx]
      assignPositions(child, currentX, childY, w)
      currentX += w + HORIZONTAL_SPACING
    })
  }

  const rootSubtreeWidth = Math.max(
    NODE_WIDTH * 2,
    clone.children?.length ? clone.children.length * (NODE_WIDTH + HORIZONTAL_SPACING) : NODE_WIDTH
  )
  assignPositions(clone, 40, 40, rootSubtreeWidth)

  return clone
}

/**
 * Traverses the tree to find a node by ID.
 */
export function findNodeById(root: DecisionNode, id: string): DecisionNode | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Returns the path of nodes from the root down to the target node ID.
 */
export function findPathToNode(root: DecisionNode, targetId: string): DecisionNode[] {
  const path: DecisionNode[] = []

  function dfs(current: DecisionNode): boolean {
    path.push(current)
    if (current.id === targetId) return true

    if (current.children) {
      for (const child of current.children) {
        if (dfs(child)) return true
      }
    }

    path.pop()
    return false
  }

  dfs(root)
  return path
}

/**
 * Computes comprehensive real-time statistics from the decision tree.
 */
export function calculateTreeStatistics(root: DecisionNode): TreeStatistics {
  let variants = 0
  let decisionPoints = 0
  let outcomes = 0
  let optimalPaths = 0
  let riskPaths = 0
  let totalCost = 0
  const durations: string[] = []
  const confidences: number[] = []
  const evidenceSet = new Set<string>()
  const legalBasesSet = new Set<string>()

  function traverse(node: DecisionNode) {
    variants++

    if (node.type === 'DECISION' || node.type === 'QUESTION') {
      decisionPoints++
    }

    if (
      node.type === 'OUTCOME' ||
      node.type === 'SUCCESS' ||
      node.type === 'FAILURE' ||
      (!node.children?.length && node.type !== 'ROOT')
    ) {
      outcomes++
      if (
        node.type === 'SUCCESS' ||
        node.status === 'optimal' ||
        (node.probability != null && node.probability >= 60)
      ) {
        optimalPaths++
      } else if (
        node.type === 'FAILURE' ||
        node.type === 'WARNING' ||
        node.status === 'risk' ||
        (node.probability != null && node.probability <= 40)
      ) {
        riskPaths++
      }
    }

    if (typeof node.estimated_cost === 'number' && node.estimated_cost > 0) {
      totalCost += node.estimated_cost
    }

    if (node.estimated_duration && !durations.includes(node.estimated_duration)) {
      durations.push(node.estimated_duration)
    }

    if (typeof node.confidence === 'number' && node.confidence > 0) {
      confidences.push(node.confidence)
    } else if (typeof node.probability === 'number' && node.probability > 0) {
      confidences.push(node.probability)
    }

    if (Array.isArray(node.evidence_required)) {
      node.evidence_required.forEach(e => {
        if (e && e.trim()) evidenceSet.add(e.trim())
      })
    }

    if (node.legal_basis && node.legal_basis.trim()) {
      legalBasesSet.add(node.legal_basis.trim())
    }

    if (Array.isArray(node.applicable_laws)) {
      node.applicable_laws.forEach(l => {
        if (l.article_number) {
          legalBasesSet.add(`${l.code_name || l.code_id} ${l.article_number}`)
        }
      })
    }

    node.children?.forEach(traverse)
  }

  traverse(root)

  const avgConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 70

  return {
    variants,
    decisionPoints,
    outcomes,
    optimalPaths,
    riskPaths,
    totalCost,
    durations,
    confidence: Math.min(95, Math.max(35, avgConfidence)),
    evidenceRequiredCount: evidenceSet.size,
    legalBasesCount: legalBasesSet.size,
  }
}

/**
 * Calculates metrics for a specific simulated path.
 */
export function calculatePathSimulation(
  root: DecisionNode,
  targetNodeId: string,
  evidenceState: Record<string, boolean> = {}
): PathSimulationMetrics {
  const pathNodes = findPathToNode(root, targetNodeId)
  let totalCost = 0
  const durations: string[] = []
  const confidences: number[] = []
  let highestRisk: RiskLevel = 'low'
  const riskBasis: string[] = []
  const requiredEvidencesSet = new Set<string>()
  const legalArticlesMap = new Map<string, ApplicableLawRef>()
  const recommendedSteps: string[] = []

  const riskRank: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }

  pathNodes.forEach(node => {
    if (typeof node.estimated_cost === 'number') {
      totalCost += node.estimated_cost
    }

    if (node.estimated_duration && !durations.includes(node.estimated_duration)) {
      durations.push(node.estimated_duration)
    }

    if (typeof node.confidence === 'number') {
      confidences.push(node.confidence)
    }

    if (node.risk_level) {
      if (riskRank[node.risk_level] > riskRank[highestRisk]) {
        highestRisk = node.risk_level
      }
      if (node.risk_basis && !riskBasis.includes(node.risk_basis)) {
        riskBasis.push(node.risk_basis)
      }
    }

    if (Array.isArray(node.evidence_required)) {
      node.evidence_required.forEach(e => {
        if (e && e.trim()) requiredEvidencesSet.add(e.trim())
      })
    }

    if (Array.isArray(node.applicable_laws)) {
      node.applicable_laws.forEach(law => {
        const key = `${law.code_id}_${law.article_number}`
        if (!legalArticlesMap.has(key)) {
          legalArticlesMap.set(key, law)
        }
      })
    }

    if (Array.isArray(node.next_steps)) {
      node.next_steps.forEach(step => {
        if (step && !recommendedSteps.includes(step)) {
          recommendedSteps.push(step)
        }
      })
    }
  })

  const requiredEvidences = Array.from(requiredEvidencesSet)
  const missingEvidenceCount = requiredEvidences.filter(e => !evidenceState[e]).length

  const overallConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : 75

  return {
    pathNodes,
    totalCost,
    durations,
    overallConfidence,
    highestRisk,
    riskBasis,
    requiredEvidences,
    missingEvidenceCount,
    legalArticles: Array.from(legalArticlesMap.values()),
    recommendedSteps: recommendedSteps.slice(0, 6),
  }
}

/**
 * Builds comparison variants for top-level strategies or distinct branches.
 */
export function buildComparisonVariants(root: DecisionNode): ComparisonVariant[] {
  const branches = root.children || []
  if (branches.length === 0) return []

  return branches.map(branch => {
    const subtreeNodes: DecisionNode[] = []
    function collect(n: DecisionNode) {
      subtreeNodes.push(n)
      n.children?.forEach(collect)
    }
    collect(branch)

    let totalCost = branch.estimated_cost || 0
    const allLegal: ApplicableLawRef[] = [...(branch.applicable_laws || [])]
    const allEvidence = new Set<string>(branch.evidence_required || [])
    const nextSteps = new Set<string>(branch.next_steps || [])
    const pros: string[] = []
    const cons: string[] = []

    subtreeNodes.forEach(n => {
      if (n !== branch && typeof n.estimated_cost === 'number') {
        totalCost += n.estimated_cost
      }
      n.applicable_laws?.forEach(l => {
        if (!allLegal.some(x => x.code_id === l.code_id && x.article_number === l.article_number)) {
          allLegal.push(l)
        }
      })
      n.evidence_required?.forEach(e => allEvidence.add(e))
      n.next_steps?.forEach(s => nextSteps.add(s))

      if (n.status === 'optimal' || (n.probability != null && n.probability >= 60)) {
        pros.push(n.title + (n.description ? `: ${n.description}` : ''))
      } else if (n.status === 'risk' || (n.probability != null && n.probability <= 40)) {
        cons.push(n.title + (n.description ? `: ${n.description}` : ''))
      }
    })

    if (pros.length === 0) {
      pros.push("Qonuniy talablarga asoslangan yo'nalish")
    }
    if (cons.length === 0) {
      cons.push('Sud amaliyotida qoʻshimcha dalillar talab qilinishi mumkin')
    }

    return {
      id: branch.id,
      title: branch.title,
      nodeType: branch.type,
      legalBasis:
        branch.legal_basis ||
        (allLegal.length ? `${allLegal[0].code_name}, ${allLegal[0].article_number}-modda` : '—'),
      applicableLaws: allLegal,
      riskLevel: branch.risk_level || 'medium',
      riskBasis: branch.risk_basis || branch.description || 'Jarayonning umumiy xavf tahlili',
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 3),
      estimatedCost: totalCost,
      estimatedDuration: branch.estimated_duration || '1-3 oy',
      evidenceRequired: Array.from(allEvidence).slice(0, 5),
      confidence: branch.confidence || branch.probability || 65,
      nextSteps: Array.from(nextSteps).slice(0, 4),
      outcomeLabel: branch.consequences,
    }
  })
}

/**
 * Format currency in Uzbek So'm
 */
export function formatCurrencySom(amount?: number | null): string {
  if (amount == null || amount === 0) return '0 soʻm'
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' soʻm'
}

export interface TreeLogicIssue {
  severity: 'error' | 'warning'
  code:
    | 'CIRCULAR_OR_DUPLICATE_ID'
    | 'MISSING_FINAL_OUTCOME'
    | 'DEAD_END_BRANCH'
    | 'MISSING_CONDITION'
    | 'CONTRADICTORY_OR_DUPLICATE_BRANCH'
    | 'PROBABILITY_OVERFLOW'
    | 'MISSING_LEGAL_BASIS'
  nodeId: string
  nodeTitle: string
  message: string
  explanation: string
}

/**
 * Deterministic legal logic & structural consistency validator for Decision Trees.
 */
export function validateDecisionTreeLogic(root: DecisionNode): {
  isValid: boolean
  score: number
  issues: TreeLogicIssue[]
} {
  const issues: TreeLogicIssue[] = []
  const seenIds = new Set<string>()
  const outcomeTypes = new Set(['OUTCOME', 'SUCCESS', 'FAILURE'])
  let outcomeCount = 0
  let totalNodes = 0

  function walk(node: DecisionNode) {
    totalNodes++
    if (seenIds.has(node.id)) {
      issues.push({
        severity: 'error',
        code: 'CIRCULAR_OR_DUPLICATE_ID',
        nodeId: node.id,
        nodeTitle: node.title,
        message: `Takroriy yoki halqasimon tugun ID: "${node.title}"`,
        explanation: 'Daraxt tuzilmasi yo‘naltirilgan tsiklsiz (DAG/Tree) bo‘lishi shart.',
      })
      return
    }
    seenIds.add(node.id)

    if (outcomeTypes.has(node.type)) {
      outcomeCount++
    }

    const children = Array.isArray(node.children) ? node.children : []

    // Non-outcome leaf node (dead-end)
    if (children.length === 0 && !outcomeTypes.has(node.type) && node.type !== 'ROOT') {
      issues.push({
        severity: 'warning',
        code: 'DEAD_END_BRANCH',
        nodeId: node.id,
        nodeTitle: node.title,
        message: `"${node.title}" shoxchasi yakuniy natijasiz tugagan`,
        explanation:
          'Har bir qaror yoki savol tarmog‘i kamida bitta yakuniy huquqiy oqibat (OUTCOME/SUCCESS/FAILURE) bilan tugashi kerak.',
      })
    }

    // Condition check on DECISION / QUESTION nodes
    if (
      (node.type === 'DECISION' || node.type === 'QUESTION') &&
      !node.condition_if &&
      !node.question &&
      !node.description
    ) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_CONDITION',
        nodeId: node.id,
        nodeTitle: node.title,
        message: `"${node.title}" uchun AGAR (IF) sharti kiritilmagan`,
        explanation:
          'Qaror nuqtasida qaysi yuridik shart tekshirilayotgani (AGAR ... BO‘LSA) aniq ko‘rsatilishi lozim.',
      })
    }

    // Missing legal basis on DECISION / OUTCOME nodes
    if (
      node.type !== 'ROOT' &&
      node.type !== 'DECISION' &&
      !node.legal_basis?.trim() &&
      (!node.applicable_laws || node.applicable_laws.length === 0)
    ) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_LEGAL_BASIS',
        nodeId: node.id,
        nodeTitle: node.title,
        message: `"${node.title}" tugunida qonun moddasi ko‘rsatilmagan`,
        explanation:
          'Har bir huquqiy qaror va oqibat tegishli O‘zbekiston kodeksi moddasiga asoslanishi kerak.',
      })
    }

    // Sibling duplicate/contradictory branch labels & probability overflow
    if (children.length > 1) {
      const siblingLabels = new Set<string>()
      let probSum = 0
      let probCount = 0

      for (const child of children) {
        const key = (child.branch_label || child.title || '').trim().toLowerCase()
        if (key && siblingLabels.has(key)) {
          issues.push({
            severity: 'error',
            code: 'CONTRADICTORY_OR_DUPLICATE_BRANCH',
            nodeId: child.id,
            nodeTitle: child.title,
            message: `Bir xil nomdagi takroriy shoxcha: "${child.title}"`,
            explanation:
              'Bir tugundan chiqadigan muqobil shoxchalar bir-biridan farqli va o‘zaro ziddiyatsiz bo‘lishi shart.',
          })
        }
        if (key) siblingLabels.add(key)

        if (typeof child.probability === 'number') {
          probSum += child.probability
          probCount++
        }
      }

      if (probCount >= 2 && probSum > 100) {
        issues.push({
          severity: 'error',
          code: 'PROBABILITY_OVERFLOW',
          nodeId: node.id,
          nodeTitle: node.title,
          message: `"${node.title}" ostidagi ehtimolliklar yig‘indisi 100% dan oshib ketdi (${probSum}%)`,
          explanation:
            'O‘zaro istisno qiluvchi muqobil natijalar ehtimolligi yig‘indisi 100% dan oshmasligi kerak.',
        })
      }
    }

    for (const child of children) {
      walk(child)
    }
  }

  walk(root)

  if (totalNodes > 1 && outcomeCount === 0) {
    issues.push({
      severity: 'error',
      code: 'MISSING_FINAL_OUTCOME',
      nodeId: root.id,
      nodeTitle: root.title,
      message: 'Daraxtda birorta ham yakuniy natija (OUTCOME/SUCCESS/FAILURE) mavjud emas',
      explanation: 'Talaba qaror daraxtini kamida bitta yakuniy huquqiy oqibat bilan yakunlashi kerak.',
    })
  }

  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 8)

  return {
    isValid: errorCount === 0,
    score,
    issues,
  }
}
