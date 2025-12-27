import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PRICING_PLANS, type PlanDefinition } from "@/lib/saas/pricing"
import Link from "next/link"

/**
 * Helper to format quota values for display
 */
function formatQuota(value: number | null, unit: string): string {
  if (value === null) return "Unlimited"
  return `${value} ${unit}${value !== 1 ? "s" : ""}`
}

/**
 * Feature display mapping for user-friendly labels
 */
const FEATURE_LABELS: Record<string, string> = {
  "voice-demo": "Voice Demo",
  "voice-full": "Full Voice Mode",
  "embed-player": "Embeddable Player",
  "advanced-analytics": "Advanced Analytics",
  "custom-branding": "Custom Branding",
  "api-read": "API Read Access",
  "api-write": "API Write Access",
  "priority-support": "Priority Support",
}

/**
 * Individual plan card component
 */
function PlanCard({ plan }: { plan: PlanDefinition }) {
  const isRecommended = plan.isRecommended

  return (
    <Card
      data-testid={isRecommended ? "la-pricing-recommended" : undefined}
      className={`relative flex flex-col h-full ${
        isRecommended
          ? "border-la-accent ring-2 ring-la-accent/50 bg-la-accent/5"
          : ""
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-la-accent text-la-bg hover:bg-la-accent/90">
            Recommended
          </Badge>
        </div>
      )}

      <CardHeader className="pt-8">
        <CardTitle className="text-3xl">{plan.name}</CardTitle>
        <CardDescription className="text-base">{plan.description}</CardDescription>
        <p className="text-sm text-la-muted mt-2">{plan.targetAudience}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-3xl font-bold text-la-surface">
            {plan.priceHint}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-la-surface">
            <Check className="w-4 h-4 text-la-accent flex-shrink-0" aria-hidden="true" />
            <span>{formatQuota(plan.includedWorkspaces, "workspace")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-la-surface">
            <Check className="w-4 h-4 text-la-accent flex-shrink-0" aria-hidden="true" />
            <span>{formatQuota(plan.includedEditorSeats, "editor seat")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-la-surface">
            <Check className="w-4 h-4 text-la-accent flex-shrink-0" aria-hidden="true" />
            <span>{formatQuota(plan.includedLessons, "lesson")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-la-surface">
            <Check className="w-4 h-4 text-la-accent flex-shrink-0" aria-hidden="true" />
            <span>{formatQuota(plan.includedLessonRunsPerMonth, "lesson run")}/month</span>
          </div>
        </div>

        <div className="border-t border-la-border/20 pt-4">
          <h4 className="text-sm font-semibold text-la-surface mb-3">Features</h4>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-la-surface">
                <Check className="w-4 h-4 text-la-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{FEATURE_LABELS[feature] || feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          asChild
          className={`w-full ${
            isRecommended
              ? "bg-la-accent text-la-bg hover:bg-la-accent/90"
              : "bg-la-primary text-white hover:bg-la-primary/90"
          }`}
        >
          <Link href="/demo">Get Started</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Pricing page component
 * Displays all available plans with their features and pricing
 */
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-la-bg">
      <Navigation />

      <main data-testid="la-pricing-page">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-la-surface mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg sm:text-xl text-la-muted max-w-2xl mx-auto">
              LessonArcade is a B2B2C SaaS platform for organizations, teams, and brands that want to deliver engaging interactive learning experiences. Choose the plan that fits your team needs.
            </p>
          </div>
        </section>

        {/* Plan Comparison Section */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PRICING_PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
