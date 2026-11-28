import { describe, it, expect } from 'vitest'
import {
  validateDecisionTreeLogic,
  calculateTreeStatistics,
  findNodeById,
} from '@/lib/decision-tree-engine'
import type { DecisionNode } from '@/types/decision-tree'

describe('P1-2: Interactive Decision Tree Builder & Logic Validator', () => {
  it('validates a well-formed 5-node If/Then legal decision tree with 0 errors', () => {
    const validTree: DecisionNode = {
      id: 'root',
      type: 'ROOT',
      title: 'Qarz shartnomasi nizosi',
      children: [
        {
          id: 'q1',
          type: 'QUESTION',
          title: 'Yozma shartnoma bormi?',
          condition_if: 'Qarz summasi BHMning 10 baravaridan ortiq bo‘lsa',
          condition_then: 'Yozma shakl talab qilinadi (FK 733-modda)',
          legal_basis: 'FK 733-modda',
          children: [
            {
              id: 'd1',
              type: 'DECISION',
              branch_label: 'Ha — tilxat mavjud',
              title: 'Sudga da’vo kiritish',
              condition_if: 'Tilxatda muddat o‘tgan bo‘lsa',
              legal_basis: 'FPK 189-modda',
              children: [
                {
                  id: 'out1',
                  type: 'SUCCESS',
                  title: 'Qarz va penya undiriladi',
                  probability: 80,
                  legal_basis: 'FK 735-modda',
                },
                {
                  id: 'out2',
                  type: 'FAILURE',
                  title: 'Da’vo muddati o‘tganligi sababli rad etiladi',
                  probability: 20,
                  legal_basis: 'FK 150-modda',
                },
              ],
            },
          ],
        },
      ],
    }

    const stats = calculateTreeStatistics(validTree)
    expect(stats.outcomes).toBe(2)
    expect(findNodeById(validTree, 'd1')?.condition_if).toContain('Tilxatda')

    const validation = validateDecisionTreeLogic(validTree)
    expect(validation.isValid).toBe(true)
    expect(validation.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    expect(validation.score).toBe(100)
  })

  it('detects missing outcomes, dead-end branches, duplicate siblings, and probability overflow', () => {
    const brokenTree: DecisionNode = {
      id: 'root',
      type: 'ROOT',
      title: 'Noto‘liq daraxt',
      children: [
        {
          id: 'b1',
          type: 'DECISION',
          title: 'Shoxcha A',
          probability: 70,
        },
        {
          id: 'b2',
          type: 'DECISION',
          title: 'Shoxcha A',
          probability: 60,
        },
      ],
    }

    const validation = validateDecisionTreeLogic(brokenTree)
    expect(validation.isValid).toBe(false)
    const codes = validation.issues.map(i => i.code)
    expect(codes).toContain('CONTRADICTORY_OR_DUPLICATE_BRANCH')
    expect(codes).toContain('PROBABILITY_OVERFLOW')
    expect(codes).toContain('MISSING_FINAL_OUTCOME')
    expect(codes).toContain('DEAD_END_BRANCH')
    expect(codes).toContain('MISSING_CONDITION')
  })
})
