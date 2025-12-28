/**
 * Lesson Insights Export Module
 *
 * This module provides pure functions for exporting lesson insights to CSV format.
 * The CSV output is deterministic and suitable for testing.
 *
 * LA3-P2-05: Lesson Drilldown Insights (v0.3)
 */

import type {
  LessonInsights,
  ModeBreakdown,
  DailyBucket,
  LessonActivityEntry,
} from './lesson-insights-service'

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
 * @param insights - Lesson insights data
 * @returns CSV string for summary section
 */
function buildSummarySection(insights: LessonInsights): string {
  const rows: string[] = []

  // Section header
  rows.push('Summary')
  rows.push('')

  // Lesson info
  rows.push(toCsvRow(['Lesson Title', insights.lesson.title]))
  rows.push(toCsvRow(['Lesson Slug', insights.lesson.slug]))

  // Time window
  rows.push(toCsvRow(['Time Window Start', formatDate(insights.timeWindowStart)]))
  rows.push(toCsvRow(['Time Window End', formatDate(insights.timeWindowEnd)]))

  // Metrics
  rows.push(toCsvRow(['Total Runs', insights.totalRuns.toString()]))
  rows.push(
    toCsvRow([
      'Average Score %',
      insights.avgScorePercent !== null
        ? insights.avgScorePercent.toString()
        : 'N/A',
    ])
  )
  rows.push(toCsvRow(['Unique Sessions', insights.uniqueSessions.toString()]))
  rows.push(toCsvRow(['Total Comments', insights.totalComments.toString()]))
  rows.push(toCsvRow(['Open Comments', insights.openComments.toString()]))
  rows.push(toCsvRow(['Resolved Comments', insights.resolvedComments.toString()]))

  rows.push('')

  return rows.join('')
}

/**
 * Build the mode breakdown section of the CSV.
 *
 * @param modeBreakdown - Mode breakdown data
 * @returns CSV string for mode breakdown section
 */
function buildModeBreakdownSection(modeBreakdown: ModeBreakdown): string {
  const rows: string[] = []

  // Section header
  rows.push('Mode Breakdown')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Mode', 'Runs']))

  // Table rows
  rows.push(toCsvRow(['Focus', modeBreakdown.focusRuns.toString()]))
  rows.push(toCsvRow(['Arcade', modeBreakdown.arcadeRuns.toString()]))

  rows.push('')

  return rows.join('')
}

/**
 * Build the comments summary section of the CSV.
 *
 * @param insights - Lesson insights data
 * @returns CSV string for comments summary section
 */
function buildCommentsSummarySection(insights: LessonInsights): string {
  const rows: string[] = []

  // Section header
  rows.push('Comments Summary')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Status', 'Count']))

  // Table rows
  rows.push(toCsvRow(['Open', insights.openComments.toString()]))
  rows.push(toCsvRow(['Resolved', insights.resolvedComments.toString()]))
  rows.push(toCsvRow(['Total', insights.totalComments.toString()]))

  rows.push('')

  return rows.join('')
}

/**
 * Build the daily buckets section of the CSV.
 *
 * @param dailyBuckets - Array of daily buckets
 * @returns CSV string for daily buckets section
 */
function buildDailyBucketsSection(dailyBuckets: DailyBucket[]): string {
  const rows: string[] = []

  // Section header
  rows.push('Daily Buckets (UTC)')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Date', 'Runs', 'Average Score %']))

  // Table rows (sorted by date, as they come from the service)
  for (const bucket of dailyBuckets) {
    rows.push(
      toCsvRow([
        bucket.date,
        bucket.runs.toString(),
        bucket.avgScorePercent !== null ? bucket.avgScorePercent.toString() : 'N/A',
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
function buildRecentActivitySection(activities: LessonActivityEntry[]): string {
  const rows: string[] = []

  // Section header
  rows.push('Recent Activity')
  rows.push('')

  // Table header
  rows.push(toCsvRow(['Type', 'Timestamp', 'Description']))

  // Table rows (sorted by timestamp descending, as they come from the service)
  for (const activity of activities) {
    rows.push(
      toCsvRow([
        activity.type,
        formatDate(activity.timestamp),
        activity.description,
      ])
    )
  }

  return rows.join('')
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Build a complete CSV export from lesson insights.
 *
 * The CSV includes:
 * - Summary section with lesson info and aggregate metrics
 * - Mode breakdown table
 * - Comments summary table
 * - Daily buckets table (UTC)
 * - Recent activity timeline
 *
 * @param insights - Lesson insights data
 * @returns Complete CSV string
 */
export function buildLessonInsightsCsv(insights: LessonInsights): string {
  const sections: string[] = []

  // Build all sections
  sections.push(buildSummarySection(insights))
  sections.push(buildModeBreakdownSection(insights.modeBreakdown))
  sections.push(buildCommentsSummarySection(insights))
  sections.push(buildDailyBucketsSection(insights.dailyBuckets))
  sections.push(buildRecentActivitySection(insights.recentActivity))

  return sections.join('')
}
