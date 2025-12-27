/**
 * Pricing & Plans Configuration Module
 *
 * This module defines the pricing plan structure for LessonArcade Phase 3.
 * It is read-only configuration for now - no DB integration, billing provider,
 * or auth changes are included.
 *
 * See plans/la3-p1-02-pricing-and-plans.md for the complete design specification.
 */

/**
 * Plan identifiers for all available pricing tiers.
 */
export type PlanId = "free" | "pro" | "team";

/**
 * Feature flags that can be enabled or disabled per plan.
 */
export type FeatureFlag =
  | "voice-demo"
  | "voice-full"
  | "embed-player"
  | "advanced-analytics"
  | "custom-branding"
  | "api-read"
  | "api-write"
  | "priority-support";

/**
 * Definition of a pricing plan.
 */
export interface PlanDefinition {
  /** Unique identifier for the plan */
  id: PlanId;
  /** Display name of the plan */
  name: string;
  /** Short description of the plan */
  description: string;
  /** Number of workspaces included in the plan (null = unlimited) */
  includedWorkspaces: number | null;
  /** Number of editor seats included in the plan (null = unlimited) */
  includedEditorSeats: number | null;
  /** Number of active lessons included in the plan (null = unlimited) */
  includedLessons: number | null;
  /** Number of lesson runs per month included in the plan (null = unlimited) */
  includedLessonRunsPerMonth: number | null;
  /** Features enabled for this plan */
  features: FeatureFlag[];
  /** Whether this plan is recommended for new users */
  isRecommended?: boolean;
  /** Human-readable price hint (e.g., "US$29–49 / workspace / month (TBD)") */
  priceHint?: string;
  /** Intended customer profile */
  targetAudience: string;
}

/**
 * Array of all available pricing plans.
 */
export const PRICING_PLANS: readonly PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    description: "For individual educators and small teams experimenting with interactive lessons.",
    includedWorkspaces: 1,
    includedEditorSeats: 1,
    includedLessons: 3,
    includedLessonRunsPerMonth: 100,
    features: ["voice-demo"],
    priceHint: "Free",
    targetAudience: "Individual educators, content creators, and small teams",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For small teams and agencies managing 5-20 lessons with voice and embed support.",
    includedWorkspaces: 1,
    includedEditorSeats: 5,
    includedLessons: 25,
    includedLessonRunsPerMonth: 2_500,
    features: [
      "voice-full",
      "embed-player",
      "custom-branding",
      "api-read",
    ],
    isRecommended: true,
    priceHint: "US$29–49 / workspace / month (TBD)",
    targetAudience: "Small teams, agencies, and marketing teams",
  },
  {
    id: "team",
    name: "Team",
    description: "For larger organizations with multiple workspaces and advanced analytics.",
    includedWorkspaces: 5,
    includedEditorSeats: 25,
    includedLessons: null, // unlimited
    includedLessonRunsPerMonth: 10_000,
    features: [
      "voice-full",
      "embed-player",
      "advanced-analytics",
      "custom-branding",
      "api-read",
      "api-write",
      "priority-support",
    ],
    priceHint: "US$99–149 / workspace / month (TBD)",
    targetAudience: "Larger organizations, agencies, and educational institutions",
  },
] as const;

/**
 * Map of plan IDs to plan definitions for efficient lookup.
 */
export const PLAN_BY_ID: Readonly<Record<PlanId, PlanDefinition>> = PRICING_PLANS.reduce(
  (acc, plan) => ({ ...acc, [plan.id]: plan }),
  {} as Record<PlanId, PlanDefinition>,
);

/**
 * Get a plan definition by its ID.
 *
 * @param planId - The plan ID to look up
 * @returns The plan definition, or undefined if not found
 */
export function getPlanById(planId: PlanId): PlanDefinition | undefined {
  return PLAN_BY_ID[planId];
}

/**
 * Check if a plan includes a specific feature.
 *
 * @param planId - The plan ID to check
 * @param feature - The feature to check for
 * @returns True if the plan includes the feature, false otherwise
 */
export function planHasFeature(planId: PlanId, feature: FeatureFlag): boolean {
  const plan = getPlanById(planId);
  return plan?.features.includes(feature) ?? false;
}

/**
 * Get all plans sorted by price (ascending).
 *
 * @returns Array of plans sorted by price (Free → Pro → Team)
 */
export function getPlansSortedByPrice(): readonly PlanDefinition[] {
  return [...PRICING_PLANS].sort((a, b) => {
    const order: Record<PlanId, number> = { free: 0, pro: 1, team: 2 };
    return order[a.id] - order[b.id];
  });
}

/**
 * Get recommended plan for new users.
 *
 * @returns The recommended plan, or undefined if none is marked as recommended
 */
export function getRecommendedPlan(): PlanDefinition | undefined {
  return PRICING_PLANS.find((plan) => plan.isRecommended);
}
