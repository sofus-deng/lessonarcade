# Workspace Insights / Learning Effectiveness Dashboard

**LA3-P2-03** — Workspace Insights for LessonArcade v0.3

## Purpose

The Workspace Insights page provides a higher-level analytics view for each workspace so teams can quickly see which lessons are healthy, which need work, and what recently happened. This dashboard helps content creators and team leads identify:

- Lessons with low completion rates or poor scores that need revision
- Most popular lessons by engagement
- Recent activity across the workspace (lesson completions and comments)
- Overall learning effectiveness metrics

## Metrics Included in v0.3

### Time-Windowed Metrics

All metrics are computed within a configurable time window (default: 30 days).

| Metric | Description | Data Source |
|--------|-------------|-------------|
| `totalRunsInWindow` | Count of LessonRun records within the time window | `LessonRun.startedAt >= timeWindowStart` |
| `avgScorePercentInWindow` | Average score % across runs with valid score/maxScore | `LessonRun` where `maxScore > 0` |
| `totalUniqueLearnerSessions` | Count of distinct non-null `anonymousSessionId` | `LessonRun.anonymousSessionId` |
| `totalCommentsInWindow` | Count of LessonComment created within window | `LessonComment.createdAt >= timeWindowStart` |

### Lesson-Level Analytics

#### Top Struggling Lessons

Up to 3 lessons with lowest average score percentage that have at least 3 runs in the window. Each entry includes:
- `lessonSlug` - Lesson identifier
- `title` - Lesson title
- `runCount` - Number of runs in the window
- `avgScorePercent` - Average score percentage

**Purpose**: Identify lessons that may need content revision or clarification.

#### Top Engaged Lessons

Up to 3 lessons with highest run count in the window. Each entry includes:
- `lessonSlug` - Lesson identifier
- `title` - Lesson title
- `runCount` - Number of runs in the window
- `avgScorePercent` - Average score percentage

**Purpose**: Identify most popular lessons by engagement.

### Recent Activity Timeline

Last 5 events merged from LessonRun completions and LessonComment creations, sorted by timestamp descending. Each entry includes:
- `type` - Either "run" or "comment"
- `timestamp` - Event timestamp
- `lessonSlug` - Associated lesson
- `lessonTitle` - Lesson title
- `description` - Short description (e.g., "Completed with 80% score" or "Comment added")

**Purpose**: Quick visibility into recent workspace activity.

## API Design

### Analytics Service

```typescript
// Input options
interface WorkspaceInsightsOptions {
  workspaceSlug: string
  windowDays?: number  // Default: 30
}

// Output DTO
interface WorkspaceInsights {
  // Time window
  timeWindowStart: Date
  timeWindowEnd: Date

  // Aggregate metrics
  totalRunsInWindow: number
  avgScorePercentInWindow: number | null
  totalUniqueLearnerSessions: number
  totalCommentsInWindow: number

  // Lesson-level analytics
  topStrugglingLessons: StrugglingLesson[]
  topEngagedLessons: EngagedLesson[]

  // Recent activity
  recentActivity: ActivityEntry[]
}

interface StrugglingLesson {
  lessonSlug: string
  title: string
  runCount: number
  avgScorePercent: number
}

interface EngagedLesson {
  lessonSlug: string
  title: string
  runCount: number
  avgScorePercent: number | null
}

interface ActivityEntry {
  type: 'run' | 'comment'
  timestamp: Date
  lessonSlug: string
  lessonTitle: string
  description: string
}
```

### Service Function

```typescript
export async function getWorkspaceInsights(
  options: WorkspaceInsightsOptions
): Promise<WorkspaceInsights>
```

## Implementation Details

### Database Queries

The analytics service uses efficient Prisma queries:

1. **Time Window**: Computed as `timeWindowEnd = now()` and `timeWindowStart = now() - windowDays * 24 * 60 * 60 * 1000`

2. **Workspace Resolution**: First query resolves workspace by slug to get `workspaceId`

3. **Lesson Runs Query**:
   ```typescript
   prisma.lessonRun.findMany({
     where: {
       workspaceId,
       startedAt: { gte: timeWindowStart }
     },
     include: { lesson: true }
   })
   ```

4. **Lesson Comments Query**:
   ```typescript
   prisma.lessonComment.findMany({
     where: {
       workspaceId,
       createdAt: { gte: timeWindowStart }
     },
     include: { lesson: true },
     orderBy: { createdAt: 'desc' }
   })
   ```

5. **Aggregation**: In-memory aggregation for lesson-level stats (group by `lessonId`)

### Edge Cases

- **No data in window**: Returns zeros for counts and empty arrays for lists
- **No runs with valid scores**: `avgScorePercentInWindow` is `null`
- **Fewer than 3 struggling lessons**: Returns available lessons that meet the minimum run threshold
- **Fewer than 3 engaged lessons**: Returns available lessons sorted by run count

## UI Design

### Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Studio Header (Workspace Switcher + Sign Out)              │
├─────────────────────────────────────────────────────────────┤
│ Workspace Name | "Last 30 days" | Window Selector          │
│ "Learning effectiveness metrics for your workspace"         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ Runs    │ │ Avg     │ │ Sessions │ │Comments │           │
│ │   42    │ │  78%    │ │   35    │ │   12    │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│ Lessons that need attention                                │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Lesson Title          | Runs | Avg Score            │  │
│ │───────────────────────────────────────────────────────│  │
│ │ Decision Making       │ 5    | 45%                  │  │
│ │ Effective Meetings    │ 8    | 52%                  │  │
│ └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Most engaged lessons                                      │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Lesson Title          | Runs | Avg Score            │  │
│ │───────────────────────────────────────────────────────│  │
│ │ React Hooks Intro     │ 25   | 85%                  │  │
│ │ Voice Chat Flow      │ 18   | 78%                  │  │
│ └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Recent activity                                          │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 2 hours ago - Completed "React Hooks Intro" (90%)   │  │
│ │ 3 hours ago - Comment on "Voice Chat Flow"         │  │
│ │ 5 hours ago - Completed "Effective Meetings" (75%)  │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Design

- **Mobile**: Metric cards stack vertically, tables use full width
- **Tablet**: 2x2 grid for metric cards
- **Desktop**: 4-column grid for metric cards

### Accessibility

- All interactive elements have proper `aria-label` attributes
- Keyboard navigation support for window selector
- Screen reader friendly table headers
- High contrast text for metric values

## Future Evolutions

### Date Range Picker

Replace the simple 7/30 day selector with a full date range picker allowing:
- Custom start/end dates
- Preset ranges (Today, Yesterday, Last 7 days, Last 30 days, This Month, Last Month)
- Comparison with previous period

### Cohort Analysis

Track learner cohorts over time:
- First-time vs returning learners
- Completion rates by cohort
- Score improvement trends

### Per-Learner Drilldown

Click on a lesson to see:
- Individual learner performance
- Time spent per level
- Common failure points

### Export to CSV

Allow exporting insights data for:
- External reporting
- Further analysis in spreadsheets
- Integration with BI tools

### Personalization Engine Integration

Use insights to:
- Recommend lesson improvements
- Identify content gaps
- Suggest personalized learning paths

## Testing Strategy

### Unit Tests (Vitest)

- Test analytics service with various data scenarios
- Verify time window filtering
- Verify aggregation logic
- Test edge cases (no data, single run, etc.)

### E2E Tests (Playwright)

- Test page loads with authenticated user
- Test workspace switching updates insights
- Test window selector functionality
- Test empty states for workspaces with minimal data

## Related Files

- `lib/lessonarcade/analytics-service.ts` - Analytics service implementation
- `app/studio/insights/page.tsx` - Insights page UI
- `test/db/analytics-service.test.ts` - Unit tests
- `e2e/studio-insights.spec.ts` - E2E tests
- `components/studio/studio-header.tsx` - Studio header component
- `components/studio/workspace-switcher.tsx` - Workspace switcher
