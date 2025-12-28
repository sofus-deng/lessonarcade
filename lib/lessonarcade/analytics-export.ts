/**
 * Analytics Export Module
 *
 * This module provides pure functions for exporting workspace insights to CSV format.
 * The CSV output is deterministic and suitable for testing.
 *
 * LA3-P2-04: Insights Export + Read-only Reporting API (v0.3)
 */

import type {
  WorkspaceInsights,
  StrugglingLesson,
  EngagedLesson,
  ActivityEntry,
} from './analytics-service'

// ============================================================================
// CSV SERIALIZATION
// ============================================================================

/**
 * Escape a CSV value by wrapping in quotes if it contains:
 * - Commas
 * - Quotes
 * - Newlines
 *
 * @param value - The string value to escape
 * @returns Properly escaped CSV value
 */
function escapeCsvValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert an array of string values to a CSV row.
 *
 * @param values - Array of string values
 * @returns CSV row string with newline
 */
export function toCsvRow(values: string[]): string {
  return values.map(escapeCsvValue).join(',') + '\n'
}

/**
 * Format a date to ISO 8601 string for CSV export.
 *
 * @param date - Date to format
 * @returns ISO 8601 formatted date string
 */
function formatDate(date: Date): string {
  return date.toISOString()
}

// ============================================================================
// CSV BUILDERS
// ============================================================================

/**
 * Build the summary section of the CSV.
 *
 * @param insights - Workspace insights data
 * @returns CSV string for summary section
 */
function buildSummarySection(insights: WorkspaceInsights): string {
  const rows: string[] = []

  // Section header
  rows.push('Summary')
  rows.push('')

  // Metrics
  rows.push(toCsvRow(['Time Window Start', formatDate(insights.timeWindowStart)]))
  rows.push(toCsvRow(['Time Window End', formatDate(insights.timeWindowEnd)]))
  rows.push(toCsvRow(['Total Runs', insights.totalRunsInWindow.toString()]))
  rows.push(
    toCsvRow([
      'Average Score %',
      insights.avgScorePercentInWindow !== null
        ? insights.avgScorePercentInWindow.toString()
        : 'N/A',
    ])
  )
  rows.push(toCsvRow(['Unique Sessions', insights.totalUniqueLearnerSessions.toString()]))
  rows.push(toCsvRow(['Total Comments', insights.totalCommentsInWindow.toString()]))

  rows.push('')

  return rows.join('')
}

/**
 * Build the top struggling lessons section of the CSV.
 *
 * @param lessons - Array of struggling lessons
 * @returns CSV string for struggling lessons section
 */
function buildStrugglingLessonsSection(lessons: StrugglingLesson[]): string {
  const rows: string[] = []

  // Section header
  rows.push('Top Struggling Lessons')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Lesson Title', 'Lesson Slug', 'Runs', 'Average Score %']))

  // Table rows
  for (const lesson of lessons) {
    rows.push(
      toCsvRow([
        lesson.title,
        lesson.lessonSlug,
        lesson.runCount.toString(),
        lesson.avgScorePercent.toString(),
      ])
    )
  }

  rows.push('')

  return rows.join('')
}

/**
 * Build the top engaged lessons section of the CSV.
 *
 * @param lessons - Array of engaged lessons
 * @returns CSV string for engaged lessons section
 */
function buildEngagedLessonsSection(lessons: EngagedLesson[]): string {
  const rows: string[] = []

  // Section header
  rows.push('Top Engaged Lessons')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Lesson Title', 'Lesson Slug', 'Runs', 'Average Score %']))

  // Table rows
  for (const lesson of lessons) {
    rows.push(
      toCsvRow([
        lesson.title,
        lesson.lessonSlug,
        lesson.runCount.toString(),
        lesson.avgScorePercent !== null ? lesson.avgScorePercent.toString() : 'N/A',
      ])
    )
  }

  rows.push('')

  return rows.join('')
}

/**
 * Build the recent activity section of the CSV.
 *
 * @param activities - Array of activity entries
 * @returns CSV string for recent activity section
 */
function buildRecentActivitySection(activities: ActivityEntry[]): string {
  const rows: string[] = []

  // Section header
  rows.push('Recent Activity')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Type', 'Timestamp', 'Lesson Title', 'Lesson Slug', 'Description']))

  // Table rows (sorted by timestamp descending, as they come from the service)
  for (const activity of activities) {
    rows.push(
      toCsvRow([
        activity.type,
        formatDate(activity.timestamp),
        activity.lessonTitle,
        activity.lessonSlug,
        activity.description,
      ])
    )
  }

  return rows.join('')
}

/**
 * Build a complete CSV export from workspace insights.
 *
 * The CSV includes:
 * - Summary section with time window and aggregate metrics
 * - Top struggling lessons table
 * - Top engaged lessons table
 * - Recent activity timeline
 *
 * @param insights - Workspace insights data
 * @returns Complete CSV string
 */
export function buildWorkspaceInsightsCsv(insights: WorkspaceInsights): string {
  const sections: string[] = []

  // Build all sections
  sections.push(buildSummarySection(insights))
  sections.push(buildStrugglingLessonsSection(insights.topStrugglingLessons))
  sections.push(buildEngagedLessonsSection(insights.topEngagedLessons))
  sections.push(buildRecentActivitySection(insights.recentActivity))

  return sections.join('')
}
