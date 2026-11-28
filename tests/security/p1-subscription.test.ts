import { describe, it, expect } from 'vitest'
import { DEFAULT_LIMITS } from '@/lib/usage-limits'
import { getPricingPlans } from '@/lib/settings-sync'

describe('P1-6 Subscription Rebalancing & Honest Pricing', () => {
  it('grants Free plan trial access to Virtual Court, Decision Tree, and Document Analysis', () => {
    expect(DEFAULT_LIMITS.free.virtual_court).toBe(2)
    expect(DEFAULT_LIMITS.free.decision_tree).toBe(2)
    expect(DEFAULT_LIMITS.free.document_analysis).toBe(2)
    expect(DEFAULT_LIMITS.free.irac).toBe(10)
    expect(DEFAULT_LIMITS.free.scenario).toBe(5)
  })

  it('preserves Standart and Pro paid limits', () => {
    expect(DEFAULT_LIMITS.standart.virtual_court).toBe(15)
    expect(DEFAULT_LIMITS.standart.decision_tree).toBe(30)
    expect(DEFAULT_LIMITS.pro.virtual_court).toBe(50)
    expect(DEFAULT_LIMITS.pro.irac).toBe(-1)
  })

  it('removes paused Marketplace claims from fallback pricing plans', async () => {
    const plans = await getPricingPlans()
    const proPlan = plans.find(p => p.id === 'pro')
    expect(proPlan).toBeDefined()
    const joined = (proPlan?.features || []).join(' ')
    expect(joined).not.toContain('Shaxsiy maslahatchi')
    expect(joined).not.toContain('Ekspert konsultatsiyasi')

    const freePlan = plans.find(p => p.id === 'free')
    expect(freePlan).toBeDefined()
    const freeJoined = (freePlan?.features || []).join(' ')
    expect(freeJoined).toContain('virtual sud')
    expect(freeJoined).toContain('qarorlar daraxti')
  })
})
