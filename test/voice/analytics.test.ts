// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock server-only module
vi.mock('server-only', () => ({}))

// Mock file system modules for testing missing files
const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  appendFile: vi.fn()
}))

// Mocks node:fs/promises module
vi.mock('node:fs/promises', () => mockFs)

// Import analytics functions after mocking
import { 
  parseJsonl, 
  aggregate, 
  readTelemetryFiles,
  type AnalyticsFilters 
} from '@/lib/lessonarcade/voice/analytics'
import { type VoiceTelemetryEvent } from '@/lib/lessonarcade/voice/telemetry'

describe('Voice Analytics', () => {
  describe('parseJsonl', () => {
    it('should parse valid JSONL lines correctly', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}',
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(0)
      expect(result.events[0].event).toBe('voice_play')
      expect(result.events[1].event).toBe('voice_end')
    })

    it('should skip malformed JSON lines and count them as parse errors', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}',
        '{"invalid": json}', // Invalid JSON
        'not json at all', // Not JSON
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(2)
    })

    it('should skip lines that fail schema validation', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}',
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"invalid_event","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}', // Invalid event
        '{"schemaVersion":1,"ts":"2025-12-20T10:02:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(1)
    })

    // Additional robustness tests for malformed JSONL lines
    it('should handle empty lines gracefully', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}',
        '', // Empty line
        '   ', // Whitespace only line
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      // parseJsonl doesn't filter empty lines, so it counts them as parse errors
      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(2) // Empty lines are counted as parse errors
    })

    it('should handle truncated JSON lines', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}',
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson"', // Truncated JSON
        '{"schemaVersion":1,"ts":"2025-12-20T10:02:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(1)
    })

    it('should handle JSON with extra commas', () => {
      const jsonlLines = [
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123",}', // Extra comma
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}'
      ]

      const result = parseJsonl(jsonlLines)

      expect(result.events).toHaveLength(1)
      expect(result.parseErrors).toBe(1)
    })
  })

  describe('readTelemetryFiles', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle missing directory gracefully', async () => {
      // Mock access to throw error for all files (simulating missing directory)
      mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'))

      const result = await readTelemetryFiles({ days: 7 })

      expect(result.events).toHaveLength(0)
      expect(result.parseErrors).toBe(0)
      expect(mockFs.access).toHaveBeenCalledTimes(7) // Should check all 7 days
    })

    it('should handle mixed missing and existing files', async () => {
      // Mock access to succeed for some files and fail for others
      mockFs.access
        .mockResolvedValueOnce(undefined) // Day 0 - exists
        .mockRejectedValueOnce(new Error('ENOENT')) // Day 1 - missing
        .mockResolvedValueOnce(undefined) // Day 2 - exists
        .mockRejectedValueOnce(new Error('ENOENT')) // Day 3 - missing
        .mockRejectedValueOnce(new Error('ENOENT')) // Day 4 - missing
        .mockResolvedValueOnce(undefined) // Day 5 - exists
        .mockRejectedValueOnce(new Error('ENOENT')) // Day 6 - missing

      // Mock readFile for existing files
      mockFs.readFile
        .mockResolvedValueOnce('{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n')
        .mockResolvedValueOnce('{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n')
        .mockResolvedValueOnce('{"schemaVersion":1,"ts":"2025-12-20T10:02:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":2,"engine":"ai","languageCode":"zh","rate":1.2,"textLen":150,"textHash":"def456","sessionId":"sess_test456"}\n')

      const result = await readTelemetryFiles({ days: 7 })

      expect(result.events).toHaveLength(3)
      expect(result.parseErrors).toBe(0)
      expect(mockFs.access).toHaveBeenCalledTimes(7)
      expect(mockFs.readFile).toHaveBeenCalledTimes(3)
    })

    it('should handle file read errors gracefully', async () => {
      // Mock access to succeed but readFile to fail
      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockRejectedValue(new Error('EACCES: permission denied'))

      const result = await readTelemetryFiles({ days: 1 })

      expect(result.events).toHaveLength(0)
      expect(result.parseErrors).toBe(0)
      expect(mockFs.access).toHaveBeenCalledTimes(1)
      expect(mockFs.readFile).toHaveBeenCalledTimes(1)
    })

    it('should accumulate parse errors across multiple files', async () => {
      mockFs.access.mockResolvedValue(undefined)
      
      // Mock files with various levels of corruption
      mockFs.readFile
        .mockResolvedValueOnce('{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n') // Valid
        .mockResolvedValueOnce('{"invalid": json}\n{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n') // 1 error
        .mockResolvedValueOnce('not json at all\n{"schemaVersion":1,"ts":"2025-12-20T10:02:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":2,"engine":"ai","languageCode":"zh","rate":1.2,"textLen":150,"textHash":"def456","sessionId":"sess_test456"}\n{"invalid": json}\n') // 2 errors

      const result = await readTelemetryFiles({ days: 3 })

      expect(result.events).toHaveLength(3) // 3 valid events
      expect(result.parseErrors).toBe(3) // 3 parse errors total
    })

    // Test to verify that readTelemetryFiles filters out empty lines before parsing
    it('should filter out empty lines before parsing', async () => {
      mockFs.access.mockResolvedValue(undefined)
      
      // Mock file with empty lines
      mockFs.readFile.mockResolvedValueOnce(
        '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n' +
        '\n' + // Empty line
        '   \n' + // Whitespace only line
        '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n'
      )

      const result = await readTelemetryFiles({ days: 1 })

      // Empty lines are filtered out before parsing, so we get 2 events and 0 parse errors
      expect(result.events).toHaveLength(2)
      expect(result.parseErrors).toBe(0)
    })
  })

  describe('aggregate', () => {
    const sampleEvents: VoiceTelemetryEvent[] = [
      // Play events
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:00:00.000Z',
        event: 'voice_play',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'hash1',
        sessionId: 'sess1'
      },
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:01:00.000Z',
        event: 'voice_play',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'hash1',
        sessionId: 'sess2'
      },
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:02:00.000Z',
        event: 'voice_play',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 2,
        engine: 'ai',
        languageCode: 'zh',
        rate: 1.2,
        textLen: 150,
        textHash: 'hash2',
        sessionId: 'sess1'
      },
      // End events
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:03:00.000Z',
        event: 'voice_end',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'hash1',
        sessionId: 'sess1'
      },
      // Stop events
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:04:00.000Z',
        event: 'voice_stop',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 2,
        engine: 'ai',
        languageCode: 'zh',
        rate: 1.2,
        textLen: 150,
        textHash: 'hash2',
        sessionId: 'sess1',
        reason: 'user_stop'
      },
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:05:00.000Z',
        event: 'voice_stop',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 2,
        engine: 'ai',
        languageCode: 'zh',
        rate: 1.2,
        textLen: 150,
        textHash: 'hash2',
        sessionId: 'sess2',
        reason: 'navigation'
      },
      // Pause and resume events
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:06:00.000Z',
        event: 'voice_pause',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'hash1',
        sessionId: 'sess1'
      },
      {
        schemaVersion: 1,
        ts: '2025-12-20T10:07:00.000Z',
        event: 'voice_resume',
        lessonSlug: 'lesson-1',
        levelIndex: 0,
        itemIndex: 1,
        engine: 'browser',
        languageCode: 'en',
        voicePresetKey: 'preset1',
        rate: 1.0,
        textLen: 100,
        textHash: 'hash1',
        sessionId: 'sess1'
      }
    ]

    it('should calculate completion rate correctly', () => {
      const result = aggregate(sampleEvents)

      expect(result.totals.totalPlays).toBe(3)
      expect(result.totals.totalEnds).toBe(1)
      expect(result.completionRate).toBe(1/3) // 0.333...
    })

    it('should calculate replay rate correctly', () => {
      const result = aggregate(sampleEvents)

      // We have 3 plays, but only 2 unique play keys
      // (lesson-1:0:1:browser:en:preset1:1.0 appears twice)
      expect(result.totals.totalPlays).toBe(3)
      expect(result.replayRate).toBe((3 - 2) / 3) // 0.333...
    })

    it('should handle missing voicePresetKey in replay calculation', () => {
      const eventsWithMissingPreset: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
          // No voicePresetKey
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_play',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess2'
          // No voicePresetKey
        }
      ]

      const result = aggregate(eventsWithMissingPreset)

      // Both should be treated as same key with "default" preset
      expect(result.totals.totalPlays).toBe(2)
      expect(result.replayRate).toBe((2 - 1) / 2) // 0.5
    })

    it('should group interruption points correctly', () => {
      const result = aggregate(sampleEvents)

      expect(result.topInterruptionPoints).toHaveLength(2)
      
      const userStopPoint = result.topInterruptionPoints.find(p => p.reason === 'user_stop')
      const navigationPoint = result.topInterruptionPoints.find(p => p.reason === 'navigation')
      
      expect(userStopPoint).toBeDefined()
      expect(userStopPoint?.count).toBe(1)
      expect(userStopPoint?.lessonSlug).toBe('lesson-1')
      expect(userStopPoint?.levelIndex).toBe(0)
      expect(userStopPoint?.itemIndex).toBe(2)
      
      expect(navigationPoint).toBeDefined()
      expect(navigationPoint?.count).toBe(1)
      expect(navigationPoint?.lessonSlug).toBe('lesson-1')
      expect(navigationPoint?.levelIndex).toBe(0)
      expect(navigationPoint?.itemIndex).toBe(2)
    })

    it('should create item leaderboard correctly', () => {
      const result = aggregate(sampleEvents)

      expect(result.itemLeaderboard.mostPlayed).toHaveLength(2)
      expect(result.itemLeaderboard.mostStopped).toHaveLength(1)
      
      // Item 0:1 should be most played (2 plays)
      const mostPlayed = result.itemLeaderboard.mostPlayed[0]
      expect(mostPlayed.lessonSlug).toBe('lesson-1')
      expect(mostPlayed.levelIndex).toBe(0)
      expect(mostPlayed.itemIndex).toBe(1)
      expect(mostPlayed.plays).toBe(2)
      
      // Item 0:2 should be most stopped (2 stops)
      const mostStopped = result.itemLeaderboard.mostStopped[0]
      expect(mostStopped.lessonSlug).toBe('lesson-1')
      expect(mostStopped.levelIndex).toBe(0)
      expect(mostStopped.itemIndex).toBe(2)
      expect(mostStopped.stops).toBe(2)
    })

    it('should apply engine filter correctly', () => {
      const filters: AnalyticsFilters = { engine: 'browser' }
      const result = aggregate(sampleEvents, filters)

      // Only browser events should be included
      expect(result.totals.totalPlays).toBe(2)
      expect(result.totals.totalEnds).toBe(1)
      expect(result.totals.totalStops).toBe(0) // No browser stops
    })

    it('should apply language filter correctly', () => {
      const filters: AnalyticsFilters = { languageCode: 'en' }
      const result = aggregate(sampleEvents, filters)

      // Only English events should be included
      expect(result.totals.totalPlays).toBe(2)
      expect(result.totals.totalEnds).toBe(1)
      expect(result.totals.totalStops).toBe(0) // No English stops
    })

    it('should apply reason filter correctly', () => {
      const filters: AnalyticsFilters = { reason: 'user_stop' }
      const result = aggregate(sampleEvents, filters)

      // Only user_stop events should be included in stops
      expect(result.totals.totalStops).toBe(1)
      expect(result.topInterruptionPoints).toHaveLength(1)
      expect(result.topInterruptionPoints[0].reason).toBe('user_stop')
    })

    it('should handle empty events array', () => {
      const result = aggregate([])

      expect(result.totals.totalEvents).toBe(0)
      expect(result.totals.totalPlays).toBe(0)
      expect(result.totals.totalEnds).toBe(0)
      expect(result.totals.totalStops).toBe(0)
      expect(result.completionRate).toBe(0)
      expect(result.replayRate).toBe(0)
      expect(result.topInterruptionPoints).toHaveLength(0)
      expect(result.itemLeaderboard.mostPlayed).toHaveLength(0)
      expect(result.itemLeaderboard.mostStopped).toHaveLength(0)
    })

    it('should guard against division by zero in completion rate', () => {
      const eventsWithNoEnds: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
        }
      ]

      const result = aggregate(eventsWithNoEnds)

      expect(result.totals.totalPlays).toBe(1)
      expect(result.totals.totalEnds).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('should limit results to top 10 for leaderboards', () => {
      // Create 15 events with different items
      const manyEvents: VoiceTelemetryEvent[] = []
      for (let i = 0; i < 15; i++) {
        manyEvents.push({
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: `lesson-${i}`,
          levelIndex: 0,
          itemIndex: i,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: `hash${i}`,
          sessionId: `sess${i}`
        })
      }

      const result = aggregate(manyEvents)

      expect(result.itemLeaderboard.mostPlayed).toHaveLength(10)
      expect(result.itemLeaderboard.mostStopped).toHaveLength(0) // No stops
    })

    // Additional robustness tests
    it('should handle events with missing optional fields gracefully', () => {
      const eventsWithMissingFields: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
          // Missing voicePresetKey
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_stop',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
          // Missing reason field
        }
      ]

      const result = aggregate(eventsWithMissingFields)

      expect(result.totals.totalPlays).toBe(1)
      expect(result.totals.totalStops).toBe(1)
      expect(result.completionRate).toBe(0) // No end events
      expect(result.replayRate).toBe(0) // No replays
    })

    it('should handle stop events without reason field', () => {
      const eventsWithStopWithoutReason: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_stop',
          lessonSlug: 'lesson-1',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'hash1',
          sessionId: 'sess1'
          // No reason field
        }
      ]

      const result = aggregate(eventsWithStopWithoutReason)

      expect(result.totals.totalStops).toBe(1)
      expect(result.topInterruptionPoints).toHaveLength(0) // No stops with reason
    })
  })
})