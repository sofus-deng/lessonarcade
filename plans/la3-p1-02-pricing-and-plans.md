# LA3-P1-02: Pricing & Plans Structure

## Problem & Positioning

LessonArcade is a B2B2C SaaS platform that transforms teaching videos into interactive, game-like lessons. The primary customers are organizations, teams, and brands that want to deliver engaging learning experiences to their audiences.

**Who pays:**
- **Organizations & Teams**: Companies, agencies, educational institutions, and content creators who need to manage multiple lessons and track learner engagement.
- **Brands**: Marketing teams that want to deliver branded interactive learning experiences.

**What they pay for:**
- **Interactive lesson creation**: Tools to create, version, and manage lessons.
- **Voice mode**: AI-powered narration using ElevenLabs for natural voice experiences.
- **Analytics**: Detailed insights into learner performance, completion rates, and engagement patterns.
- **Embeddable player**: Ability to embed lessons in external websites, LMS platforms, and marketing pages.
- **Multi-workspace support**: Separate workspaces for different teams, clients, or brands.
- **Team collaboration**: Role-based access control for editors, admins, and viewers.

## Pricing Metrics

The pricing structure is based on the following key metrics:

### Primary Metrics

1. **Workspaces**: Number of distinct organizations/brands a customer can manage. Each workspace has its own lessons, analytics, and settings.

2. **Editor Seats**: Number of named users who can create and edit lessons. Learners who consume lessons are not counted as seats.

3. **Lesson Runs**: Number of completed lesson sessions per month. This measures actual usage and value delivered.

4. **Lessons**: Number of active lessons a workspace can have published.

### Secondary Metrics (Feature Gates)

- **Voice mode**: Access to AI-powered narration and voice chat features.
- **Embeddable player**: Ability to embed lessons in external sites.
- **Advanced analytics**: Detailed reports, cohort analysis, and data export.
- **Custom branding**: Custom themes, logos, and brand configurations.
- **API access**: Programmatic access to lessons, runs, and analytics.

## Plan Structure

We propose three plans: **Free**, **Pro**, and **Team**. This structure provides a clear upgrade path from individual experimentation to team collaboration and enterprise needs.

### Free Plan

**Intended Customer Profile:**
- Individual educators, content creators, and small teams experimenting with interactive lessons.
- Users who want to try the platform before committing to a paid plan.

**Included Features:**
- **Workspaces**: 1 workspace
- **Editor Seats**: 1 seat (the account owner)
- **Lessons**: Up to 3 active lessons
- **Lesson Runs**: Up to 100 runs per month (soft limit)
- **Voice Mode**: Basic voice demo only (limited to 1 lesson)
- **Embeddable Player**: Not available
- **Analytics**: Basic completion tracking
- **Custom Branding**: Default LessonArcade theme only
- **API Access**: Not available

**Limitations:**
- No team collaboration (single user)
- Limited voice features
- No embed capability
- Lesson runs tracked but not enforced (soft limit with friendly notifications)

**Upgrade Path:**
- Users upgrade to Pro when they need more lessons, voice features, or want to embed lessons.

**Price Hint:** Free

---

### Pro Plan

**Intended Customer Profile:**
- Small teams and agencies managing 5-20 lessons.
- Marketing teams delivering branded learning experiences.
- Content creators monetizing their courses.

**Included Features:**
- **Workspaces**: 1 workspace
- **Editor Seats**: Up to 5 editor seats
- **Lessons**: Up to 25 active lessons
- **Lesson Runs**: Up to 2,500 runs per month (soft limit)
- **Voice Mode**: Full voice support for all lessons
- **Embeddable Player**: Available with domain restrictions
- **Analytics**: Standard analytics dashboard
- **Custom Branding**: Custom themes and logos
- **API Access**: Read-only API access

**Limitations:**
- Single workspace only
- No advanced cohort analytics
- Limited to 5 editor seats

**Upgrade Path:**
- Teams upgrade to Team plan when they need multiple workspaces, more seats, or advanced analytics.

**Price Hint:** US$29–49 / workspace / month (TBD)

---

### Team Plan

**Intended Customer Profile:**
- Larger organizations with multiple teams or brands.
- Agencies managing multiple client workspaces.
- Educational institutions with departmental needs.

**Included Features:**
- **Workspaces**: Up to 5 workspaces
- **Editor Seats**: Up to 25 editor seats
- **Lessons**: Unlimited active lessons
- **Lesson Runs**: Up to 10,000 runs per month (soft limit)
- **Voice Mode**: Full voice support + premium voice packs
- **Embeddable Player**: Available with custom domain support
- **Analytics**: Advanced analytics, cohort analysis, data export
- **Custom Branding**: Full custom branding per workspace
- **API Access**: Full read/write API access
- **Priority Support**: Email support with SLA

**Limitations:**
- None within stated limits

**Upgrade Path:**
- Enterprise customers can contact sales for custom arrangements (unlimited workspaces, custom SLA, dedicated support).

**Price Hint:** US$99–149 / workspace / month (TBD)

---

## Billing Model Sketch

The following describes how billing could work in the future. This is conceptual and no payment provider has been chosen yet.

### Base Billing Structure

**Per-Workspace Subscription:**
- Each workspace is billed separately based on its plan.
- The plan determines the included quotas for seats, lessons, and runs.
- Billing is monthly, with annual discounts available.

### Usage-Based Components

**Lesson Run Tiers:**
- Included runs are bundled with each plan.
- Overage charges apply when runs exceed the included quota.
- Example: Pro plan includes 2,500 runs/month, additional runs at $0.01 per run.

**Add-Ons:**
- **Extra Workspaces**: Additional workspaces beyond plan limits at a discounted rate.
- **Extra Seats**: Additional editor seats beyond plan limits at $5-10/seat/month.
- **Higher Run Quotas**: Pre-purchased run bundles at volume discounts.
- **Premium Voice Packs**: Access to premium ElevenLabs voices at additional cost.

### Future Billing Features

**Payment Provider Options:**
- Stripe: Most common, well-documented, supports subscriptions and usage-based billing.
- Paddle: Handles global taxes and compliance, good for international sales.
- Chargebee: Enterprise-focused, supports complex billing scenarios.

**Billing Entities to Add (Future):**
```prisma
// Future schema extensions (not implemented in this step)

model Subscription {
  id                  String   @id @default(uuid())
  workspaceId         String   @unique
  planId              String   // References pricing plan
  status              String   // ACTIVE, PAST_DUE, CANCELED, TRIALING
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelAtPeriodEnd   Boolean  @default(false)
  stripeSubscriptionId String? // Payment provider reference
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  workspace           Workspace @relation(fields: [workspaceId], references: [id])
}

model Invoice {
  id              String   @id @default(uuid())
  subscriptionId  String
  amount          Int      // In cents
  currency        String   @default("USD")
  status          String   // DRAFT, OPEN, PAID, VOID
  dueDate         DateTime?
  paidAt          DateTime?
  stripeInvoiceId String?  // Payment provider reference
  createdAt       DateTime @default(now())

  subscription     Subscription @relation(fields: [subscriptionId], references: [id])
}

model UsageRecord {
  id              String   @id @default(uuid())
  workspaceId     String
  metric          String   // lesson_runs, active_learners, etc.
  quantity        Int
  periodStart     DateTime
  periodEnd       DateTime
  createdAt       DateTime @default(now())

  workspace       Workspace @relation(fields: [workspaceId], references: [id])
}
```

## Impact on Data Model and API

### Current Schema Support

The existing SaaS data model already supports the pricing structure:

**Workspace Model:**
- [`Workspace`](../prisma/schema.prisma:59) provides the foundation for per-workspace billing.
- [`WorkspaceSettings`](../prisma/schema.prisma:198) can store the current plan ID and feature flags.

**LessonRun Model:**
- [`LessonRun`](../prisma/schema.prisma:163) tracks all lesson runs, enabling usage-based billing.
- The `workspaceId` field allows efficient aggregation of usage per workspace.

**WorkspaceMember Model:**
- [`WorkspaceMember`](../prisma/schema.prisma:77) with role-based access control enables seat counting.
- Only OWNER, ADMIN, and EDITOR roles count as "editor seats" for billing purposes.

### Required Schema Extensions (Future)

The following schema extensions will be needed when implementing real billing:

1. **WorkspaceSettings Extensions:**
   - Add `planId` field to track the current plan.
   - Add `billingEmail` field for invoices.
   - Add `trialEndsAt` for trial management.

2. **New Models:**
   - `Subscription`: Tracks billing state per workspace.
   - `Invoice`: Stores billing history.
   - `UsageRecord`: Tracks usage metrics for billing periods.

3. **Feature Flags:**
   - Extend `featureFlags` JSON in WorkspaceSettings to include feature gates.

### API Impact

**Future API Endpoints:**
- `GET /api/workspace/:id/subscription` - Retrieve current subscription status.
- `GET /api/workspace/:id/usage` - Retrieve current usage metrics.
- `POST /api/workspace/:id/upgrade` - Initiate plan upgrade.
- `POST /api/workspace/:id/cancel` - Cancel subscription.

**Middleware Changes:**
- Add plan enforcement middleware to check feature access.
- Add usage tracking middleware to count lesson runs.
- Add quota enforcement middleware to prevent overages.

## Implementation Considerations

### Soft Limits vs Hard Limits

**Soft Limits (Recommended):**
- Lesson runs: Send friendly notifications when approaching limits, allow temporary overages.
- Encourage upgrades rather than blocking functionality.
- Better user experience, reduces churn.

**Hard Limits (Use Sparingly):**
- Workspaces: Prevent creating beyond plan limit.
- Editor seats: Prevent inviting beyond plan limit.
- Critical for preventing abuse and ensuring fair usage.

### Trial Strategy

**Free Trial:**
- Pro plan 14-day trial with full feature access.
- No credit card required for trial.
- Automatic downgrade to Free after trial ends.

**Trial-to-Paid Conversion:**
- Email reminders before trial ends.
- Highlight value delivered during trial (lessons created, runs completed).
- Offer discount for annual commitment.

### Enterprise Considerations

**Custom Pricing:**
- For large organizations (>50 seats, >100k runs/month).
- Custom SLAs and support options.
- Dedicated account management.

**Compliance:**
- SOC 2 Type II certification for enterprise customers.
- GDPR compliance for European customers.
- Data residency options for regulated industries.

## Open Questions

1. **Should we charge per-learner or per-run?**
   - Per-run is more aligned with value delivered.
   - Per-learner is simpler to understand but may discourage usage.

2. **How should we handle anonymous learners?**
   - Anonymous runs count toward workspace quota.
   - No per-learner pricing means anonymous usage is already included.

3. **Should voice mode be a separate add-on?**
   - Including it in Pro/Team simplifies pricing.
   - Separate add-on allows more granular control.

4. **What about content storage limits?**
   - Not included in initial pricing (assume reasonable use).
   - Could add storage limits for very large media files.

5. **How should we handle multi-language content?**
   - No additional charge for multiple languages.
   - Could charge for premium translation services in the future.

## Summary

This pricing structure provides:

- **Clear value tiers**: Free for experimentation, Pro for small teams, Team for organizations.
- **Predictable costs**: Per-workspace pricing with included quotas.
- **Flexible scaling**: Usage-based components for growing teams.
- **Feature-based differentiation**: Voice, embed, and analytics as key differentiators.
- **Clear upgrade paths**: Natural progression from Free → Pro → Team.

The existing SaaS data model supports this structure with minimal extensions. Future work will focus on implementing billing provider integration and quota enforcement.

## Next Steps

1. Implement the pricing configuration module in `lib/saas/pricing.ts`.
2. Add plan selection UI in Studio for workspace settings.
3. Implement usage tracking and reporting.
4. Design and implement billing provider integration (Stripe recommended).
5. Add quota enforcement middleware.
6. Implement subscription management UI.
