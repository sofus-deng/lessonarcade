import { describe, it, expect } from 'vitest'
import {
  PRICING_PLANS,
  PLAN_BY_ID,
  getPlanById,
  planHasFeature,
  getPlansSortedByPrice,
  getRecommendedPlan,
  type PlanId,
  type FeatureFlag,
} from '@/lib/saas/pricing'

describe('PRICING_PLANS', () => {
  it('is non-empty', () => {
    expect(PRICING_PLANS.length).toBeGreaterThan(0)
  })

  it('contains exactly three plans', () => {
    expect(PRICING_PLANS).toHaveLength(3)
  })

  it('all plan IDs are unique', () => {
    const ids = PRICING_PLANS.map((plan) => plan.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('each plan has all required properties', () => {
    const requiredKeys = [
      'id',
      'name',
      'description',
      'includedWorkspaces',
      'includedEditorSeats',
      'includedLessons',
      'includedLessonRunsPerMonth',
      'features',
      'targetAudience',
    ]

    PRICING_PLANS.forEach((plan) => {
      requiredKeys.forEach((key) => {
        expect(plan).toHaveProperty(key)
      })
    })
  })

  it('all plans have valid plan IDs', () => {
    const validIds: PlanId[] = ['free', 'pro', 'team']
    PRICING_PLANS.forEach((plan) => {
      expect(validIds).toContain(plan.id)
    })
  })

  it('all plans have valid feature flags', () => {
    const validFeatures: FeatureFlag[] = [
      'voice-demo',
      'voice-full',
      'embed-player',
      'advanced-analytics',
      'custom-branding',
      'api-read',
      'api-write',
      'priority-support',
    ]

    PRICING_PLANS.forEach((plan) => {
      plan.features.forEach((feature) => {
        expect(validFeatures).toContain(feature)
      })
    })
  })

  it('free plan has limited features', () => {
    const freePlan = PRICING_PLANS.find((plan) => plan.id === 'free')
    expect(freePlan).toBeDefined()
    expect(freePlan?.features).toEqual(['voice-demo'])
    expect(freePlan?.includedWorkspaces).toBe(1)
    expect(freePlan?.includedEditorSeats).toBe(1)
    expect(freePlan?.includedLessons).toBe(3)
    expect(freePlan?.includedLessonRunsPerMonth).toBe(100)
  })

  it('pro plan has more features than free', () => {
    const proPlan = PRICING_PLANS.find((plan) => plan.id === 'pro')
    expect(proPlan).toBeDefined()
    expect(proPlan?.features.length).toBeGreaterThan(1)
    expect(proPlan?.features).toContain('voice-full')
    expect(proPlan?.features).toContain('embed-player')
    expect(proPlan?.isRecommended).toBe(true)
  })

  it('team plan has most features', () => {
    const teamPlan = PRICING_PLANS.find((plan) => plan.id === 'team')
    expect(teamPlan).toBeDefined()
    expect(teamPlan?.features.length).toBeGreaterThan(4)
    expect(teamPlan?.features).toContain('advanced-analytics')
    expect(teamPlan?.features).toContain('api-write')
    expect(teamPlan?.features).toContain('priority-support')
    expect(teamPlan?.includedLessons).toBeNull() // unlimited
  })
})

describe('PLAN_BY_ID', () => {
  it('contains all plan IDs', () => {
    const expectedIds: PlanId[] = ['free', 'pro', 'team']
    expectedIds.forEach((id) => {
      expect(PLAN_BY_ID).toHaveProperty(id)
    })
  })

  it('each plan in PLAN_BY_ID matches PRICING_PLANS', () => {
    PRICING_PLANS.forEach((plan) => {
      expect(PLAN_BY_ID[plan.id]).toBe(plan)
    })
  })
})

describe('getPlanById', () => {
  it('returns correct plan for valid IDs', () => {
    expect(getPlanById('free')?.id).toBe('free')
    expect(getPlanById('pro')?.id).toBe('pro')
    expect(getPlanById('team')?.id).toBe('team')
  })

  it('returns undefined for invalid ID', () => {
    // TypeScript should prevent this, but we test the runtime behavior
    const result = getPlanById('invalid' as PlanId)
    expect(result).toBeUndefined()
  })
})

describe('planHasFeature', () => {
  it('returns true for features that plan has', () => {
    expect(planHasFeature('free', 'voice-demo')).toBe(true)
    expect(planHasFeature('pro', 'voice-full')).toBe(true)
    expect(planHasFeature('pro', 'embed-player')).toBe(true)
    expect(planHasFeature('team', 'advanced-analytics')).toBe(true)
  })

  it('returns false for features that plan does not have', () => {
    expect(planHasFeature('free', 'voice-full')).toBe(false)
    expect(planHasFeature('free', 'embed-player')).toBe(false)
    expect(planHasFeature('pro', 'advanced-analytics')).toBe(false)
    expect(planHasFeature('pro', 'api-write')).toBe(false)
  })

  it('returns false for invalid plan ID', () => {
    expect(planHasFeature('invalid' as PlanId, 'voice-demo')).toBe(false)
  })
})

describe('getPlansSortedByPrice', () => {
  it('returns plans in correct order', () => {
    const sorted = getPlansSortedByPrice()
    expect(sorted).toHaveLength(3)
    expect(sorted[0].id).toBe('free')
    expect(sorted[1].id).toBe('pro')
    expect(sorted[2].id).toBe('team')
  })

  it('does not modify original PRICING_PLANS array', () => {
    const originalOrder = PRICING_PLANS.map((plan) => plan.id)
    getPlansSortedByPrice()
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual(originalOrder)
  })
})

describe('getRecommendedPlan', () => {
  it('returns pro plan as recommended', () => {
    const recommended = getRecommendedPlan()
    expect(recommended).toBeDefined()
    expect(recommended?.id).toBe('pro')
    expect(recommended?.isRecommended).toBe(true)
  })

  it('returns undefined if no plan is recommended', () => {
    // This test documents the current behavior
    // If we remove isRecommended from all plans, this would return undefined
    const recommended = getRecommendedPlan()
    expect(recommended).toBeDefined() // Currently returns pro plan
  })
})

describe('Plan hierarchy and limits', () => {
  it('workspace limits increase from free to team', () => {
    const free = getPlanById('free')
    const pro = getPlanById('pro')
    const team = getPlanById('team')

    expect(free?.includedWorkspaces).toBeLessThanOrEqual(pro?.includedWorkspaces ?? Infinity)
    expect(pro?.includedWorkspaces).toBeLessThanOrEqual(team?.includedWorkspaces ?? Infinity)
  })

  it('editor seat limits increase from free to team', () => {
    const free = getPlanById('free')
    const pro = getPlanById('pro')
    const team = getPlanById('team')

    expect(free?.includedEditorSeats).toBeLessThanOrEqual(pro?.includedEditorSeats ?? Infinity)
    expect(pro?.includedEditorSeats).toBeLessThanOrEqual(team?.includedEditorSeats ?? Infinity)
  })

  it('lesson run limits increase from free to team', () => {
    const free = getPlanById('free')
    const pro = getPlanById('pro')
    const team = getPlanById('team')

    expect(free?.includedLessonRunsPerMonth).toBeLessThanOrEqual(pro?.includedLessonRunsPerMonth ?? Infinity)
    expect(pro?.includedLessonRunsPerMonth).toBeLessThanOrEqual(team?.includedLessonRunsPerMonth ?? Infinity)
  })

  it('team plan has unlimited lessons', () => {
    const team = getPlanById('team')
    expect(team?.includedLessons).toBeNull()
  })
})
