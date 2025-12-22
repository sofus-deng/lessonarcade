// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { 
  parseJsonl, 
  aggregate, 
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

      // Both should be treated as the same key with "default" preset
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
  })
})