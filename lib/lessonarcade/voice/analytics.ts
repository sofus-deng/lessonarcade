import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { VoiceTelemetryEventSchema, type VoiceTelemetryEvent } from './telemetry'

/**
 * Filter options for analytics queries
 */
export interface AnalyticsFilters {
  engine?: 'browser' | 'ai' | 'all'
  languageCode?: string
  reason?: 'user_stop' | 'navigation' | 'rate_limited' | 'cooldown_blocked' | 'error' | 'all'
}

/**
 * Aggregated analytics results
 */
export interface AnalyticsResult {
  totals: {
    totalEvents: number
    totalPlays: number
    totalEnds: number
    totalStops: number
    totalPauses: number
    totalResumes: number
    totalErrors: number
    parseErrors: number
  }
  completionRate: number
  replayRate: number
  topInterruptionPoints: Array<{
    lessonSlug: string
    levelIndex: number
    itemIndex: number
    reason: string
    count: number
  }>
  itemLeaderboard: {
    mostPlayed: Array<{
      lessonSlug: string
      levelIndex: number
      itemIndex: number
      plays: number
    }>
    mostStopped: Array<{
      lessonSlug: string
      levelIndex: number
      itemIndex: number
      stops: number
    }>
  }
}

/**
 * Result of parsing JSONL files
 */
interface ParseResult {
  events: VoiceTelemetryEvent[]
  parseErrors: number
}

/**
 * Gets candidate file paths for the last N days
 */
function getCandidateFilePaths(days: number): string[] {
  const filePaths: string[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    const fileName = `events-${dateStr}.jsonl`
    filePaths.push(path.join(process.cwd(), 'data', 'voice-analytics', fileName))
  }
  
  return filePaths
}

/**
 * Reads telemetry files for the specified number of days
 */
export async function readTelemetryFiles({ days }: { days: number }): Promise<ParseResult> {
  const candidatePaths = getCandidateFilePaths(days)
  const allEvents: VoiceTelemetryEvent[] = []
  let totalParseErrors = 0

  for (const filePath of candidatePaths) {
    try {
      // Check if file exists
      await access(filePath)
      
      // Read file content
      const content = await readFile(filePath, 'utf8')
      const lines = content.split('\n').filter(line => line.trim() !== '')
      
      // Parse each line
      const parseResult = parseJsonl(lines)
      allEvents.push(...parseResult.events)
      totalParseErrors += parseResult.parseErrors
      
    } catch {
      // File doesn't exist or can't be read, skip it
      continue
    }
  }

  return {
    events: allEvents,
    parseErrors: totalParseErrors
  }
}

/**
 * Safely parses JSONL lines
 */
export function parseJsonl(lines: string[]): ParseResult {
  const events: VoiceTelemetryEvent[] = []
  let parseErrors = 0

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      const result = VoiceTelemetryEventSchema.safeParse(parsed)
      
      if (result.success) {
        events.push(result.data)
      } else {
        parseErrors++
      }
    } catch {
      // Invalid JSON, count as parse error
      parseErrors++
    }
  }

  return {
    events,
    parseErrors
  }
}

/**
 * Applies filters to events
 */
function applyFilters(events: VoiceTelemetryEvent[], filters: AnalyticsFilters): VoiceTelemetryEvent[] {
  return events.filter(event => {
    // Engine filter
    if (filters.engine && filters.engine !== 'all') {
      if (event.engine !== filters.engine) {
        return false
      }
    }

    // Language filter
    if (filters.languageCode && filters.languageCode !== 'all') {
      if (event.languageCode !== filters.languageCode) {
        return false
      }
    }

    // Reason filter (only applies to events with reason)
    if (filters.reason && filters.reason !== 'all' && 'reason' in event) {
      if (event.reason !== filters.reason) {
        return false
      }
    }

    return true
  })
}

/**
 * Aggregates events into analytics metrics
 */
export function aggregate(events: VoiceTelemetryEvent[], filters: AnalyticsFilters = {}): AnalyticsResult {
  // Apply filters
  const filteredEvents = applyFilters(events, filters)

  // Count events by type
  const totals = {
    totalEvents: filteredEvents.length,
    totalPlays: filteredEvents.filter(e => e.event === 'voice_play').length,
    totalEnds: filteredEvents.filter(e => e.event === 'voice_end').length,
    totalStops: filteredEvents.filter(e => e.event === 'voice_stop').length,
    totalPauses: filteredEvents.filter(e => e.event === 'voice_pause').length,
    totalResumes: filteredEvents.filter(e => e.event === 'voice_resume').length,
    totalErrors: filteredEvents.filter(e => e.event === 'voice_error').length,
    parseErrors: 0 // Will be set from parse result
  }

  // Calculate completion rate
  const completionRate = totals.totalPlays > 0 ? totals.totalEnds / totals.totalPlays : 0

  // Calculate replay rate
  const playEvents = filteredEvents.filter(e => e.event === 'voice_play')
  const uniquePlayKeys = new Set<string>()
  
  for (const event of playEvents) {
    const key = `${event.lessonSlug}:${event.levelIndex}:${event.itemIndex}:${event.engine}:${event.languageCode}:${event.voicePresetKey || 'default'}:${event.rate}`
    uniquePlayKeys.add(key)
  }
  
  const uniquePlays = uniquePlayKeys.size
  const replayRate = totals.totalPlays > 0 ? (totals.totalPlays - uniquePlays) / totals.totalPlays : 0

  // Top interruption points
  const interruptionCounts = new Map<string, { count: number; reason: string; lessonSlug: string; levelIndex: number; itemIndex: number }>()
  
  for (const event of filteredEvents) {
    if (event.event === 'voice_stop' && event.reason) {
      const key = `${event.lessonSlug}:${event.levelIndex}:${event.itemIndex}:${event.reason}`
      const existing = interruptionCounts.get(key)
      
      if (existing) {
        existing.count++
      } else {
        interruptionCounts.set(key, {
          count: 1,
          reason: event.reason,
          lessonSlug: event.lessonSlug,
          levelIndex: event.levelIndex,
          itemIndex: event.itemIndex
        })
      }
    }
  }

  const topInterruptionPoints = Array.from(interruptionCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ reason, lessonSlug, levelIndex, itemIndex, count }) => ({
      lessonSlug,
      levelIndex,
      itemIndex,
      reason,
      count
    }))

  // Item leaderboard
  const playCounts = new Map<string, { plays: number; stops: number }>()
  
  for (const event of filteredEvents) {
    const key = `${event.lessonSlug}:${event.levelIndex}:${event.itemIndex}`
    const existing = playCounts.get(key)
    
    if (existing) {
      if (event.event === 'voice_play') {
        existing.plays++
      } else if (event.event === 'voice_stop') {
        existing.stops++
      }
    } else {
      playCounts.set(key, {
        plays: event.event === 'voice_play' ? 1 : 0,
        stops: event.event === 'voice_stop' ? 1 : 0
      })
    }
  }

  const itemStats = Array.from(playCounts.entries()).map(([key, stats]) => {
    const [lessonSlug, levelIndexStr, itemIndexStr] = key.split(':')
    return {
      lessonSlug,
      levelIndex: parseInt(levelIndexStr, 10),
      itemIndex: parseInt(itemIndexStr, 10),
      ...stats
    }
  })

  const mostPlayed = itemStats
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)
    .map(({ lessonSlug, levelIndex, itemIndex, plays }) => ({
      lessonSlug,
      levelIndex,
      itemIndex,
      plays
    }))

  const mostStopped = itemStats
    .filter(item => item.stops > 0)
    .sort((a, b) => b.stops - a.stops)
    .slice(0, 10)
    .map(({ lessonSlug, levelIndex, itemIndex, stops }) => ({
      lessonSlug,
      levelIndex,
      itemIndex,
      stops
    }))

  return {
    totals,
    completionRate,
    replayRate,
    topInterruptionPoints,
    itemLeaderboard: {
      mostPlayed,
      mostStopped
    }
  }
}