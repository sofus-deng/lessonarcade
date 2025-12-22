import { Metadata } from "next"
import { readTelemetryFiles, aggregate, type AnalyticsFilters } from "@/lib/lessonarcade/voice/analytics"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { VoiceAnalyticsClient } from "./voice-analytics-client"

export const metadata: Metadata = {
  title: "Voice Analytics | LessonArcade Studio",
  description: "Voice telemetry analytics and insights for LessonArcade",
}

// Default filter values
const DEFAULT_DAYS = 7
const DEFAULT_ENGINE = "all"
const DEFAULT_LANGUAGE = "all"
const DEFAULT_REASON = "all"

async function getAnalyticsData(searchParams: {
  days?: string
  engine?: string
  languageCode?: string
  reason?: string
}) {
  // Parse and validate search params
  const days = searchParams.days ? parseInt(searchParams.days, 10) : DEFAULT_DAYS
  const validDays = [1, 7, 14, 30].includes(days) ? days : DEFAULT_DAYS
  
  const filters: AnalyticsFilters = {
    engine: (searchParams.engine as 'browser' | 'ai' | 'all') || DEFAULT_ENGINE,
    languageCode: searchParams.languageCode || DEFAULT_LANGUAGE,
    reason: (searchParams.reason as 'user_stop' | 'navigation' | 'rate_limited' | 'cooldown_blocked' | 'error' | 'all') || DEFAULT_REASON,
  }

  // Read telemetry files and aggregate data
  const { events, parseErrors } = await readTelemetryFiles({ days: validDays })
  const analytics = aggregate(events, filters)
  
  // Include parse errors in totals
  analytics.totals.parseErrors = parseErrors

  return {
    analytics,
    filters: {
      days: validDays,
      engine: filters.engine || DEFAULT_ENGINE,
      languageCode: filters.languageCode || DEFAULT_LANGUAGE,
      reason: filters.reason || DEFAULT_REASON
    }
  }
}

export default async function VoiceAnalyticsPage({
  searchParams,
}: {
  searchParams: {
    days?: string
    engine?: string
    languageCode?: string
    reason?: string
  }
}) {
  const { analytics, filters } = await getAnalyticsData(searchParams)

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-la-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-la-surface mb-4">
              Voice Analytics
            </h1>
            <p className="text-lg text-la-muted">
              Aggregated voice telemetry insights for last {filters.days} days
            </p>
          </div>

          {/* Filters */}
          <VoiceAnalyticsClient filters={filters} />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analytics.completionRate)}</div>
                <p className="text-xs text-la-muted">
                  {analytics.totals.totalEnds} / {analytics.totals.totalPlays} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Replay Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analytics.replayRate)}</div>
                <p className="text-xs text-la-muted">
                  {analytics.totals.totalPlays} total plays
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totals.totalEvents.toLocaleString()}</div>
                <p className="text-xs text-la-muted">
                  {analytics.totals.parseErrors} parse errors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totals.totalStops}</div>
                <p className="text-xs text-la-muted">
                  stops, {analytics.totals.totalPauses} pauses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Interruption Points */}
          <Card>
            <CardHeader>
              <CardTitle>Top Interruption Points</CardTitle>
              <CardDescription>
                Items where users most frequently stop voice playback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topInterruptionPoints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topInterruptionPoints.map((point, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{point.lessonSlug}</TableCell>
                        <TableCell>{point.levelIndex}</TableCell>
                        <TableCell>{point.itemIndex}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{point.reason}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{point.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-la-muted">
                  No interruption data available for selected filters
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Played Items */}
            <Card>
              <CardHeader>
                <CardTitle>Most Played Items</CardTitle>
                <CardDescription>
                  Items with highest voice playback count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.itemLeaderboard.mostPlayed.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Plays</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.itemLeaderboard.mostPlayed.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.lessonSlug}</TableCell>
                          <TableCell>{item.levelIndex}</TableCell>
                          <TableCell>{item.itemIndex}</TableCell>
                          <TableCell className="text-right">{item.plays}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-la-muted">
                    No play data available for selected filters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Stopped Items */}
            <Card>
              <CardHeader>
                <CardTitle>Most Stopped Items</CardTitle>
                <CardDescription>
                  Items with highest voice stop count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.itemLeaderboard.mostStopped.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lesson</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Stops</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.itemLeaderboard.mostStopped.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.lessonSlug}</TableCell>
                          <TableCell>{item.levelIndex}</TableCell>
                          <TableCell>{item.itemIndex}</TableCell>
                          <TableCell className="text-right">{item.stops}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-la-muted">
                    No stop data available for selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}