// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'

// Import analytics functions directly for testing
// Note: This test file runs in node environment to test server-only modules
import { aggregate, type AnalyticsFilters } from '@/lib/lessonarcade/voice/analytics'
import { type VoiceTelemetryEvent } from '@/lib/lessonarcade/voice/telemetry'

describe('Voice Analytics Privacy Guards', () => {
  const forbiddenIdentifiers = [
    'ipHash',
    'fingerprintHash', 
    'sessionId',
    'textHash'
  ]

  describe('Aggregation output deep-scan', () => {
    it('should not expose raw identifiers in aggregated results', () => {
      // Create sample events with sensitive identifiers
      const sampleEvents: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'sensitive-text-hash-123',
          sessionId: 'sensitive-session-id-456',
          ipHash: 'sensitive-ip-hash-789',
          fingerprintHash: 'sensitive-fingerprint-hash-012'
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_end',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'sensitive-text-hash-123',
          sessionId: 'sensitive-session-id-456',
          ipHash: 'sensitive-ip-hash-789',
          fingerprintHash: 'sensitive-fingerprint-hash-012'
        }
      ]

      // Aggregate events
      const result = aggregate(sampleEvents)

      // Convert to JSON string for deep scanning
      const resultJson = JSON.stringify(result)

      // Assert that no forbidden identifiers appear in aggregated output
      for (const identifier of forbiddenIdentifiers) {
        expect(resultJson).not.toContain(identifier)
      }
    })

    it('should not include raw event payload arrays in aggregated results', () => {
      const sampleEvents: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'test-lesson',
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

      const result = aggregate(sampleEvents)

      // Check that result contains summaries only, not raw event arrays
      expect(result).not.toHaveProperty('events')
      expect(result).not.toHaveProperty('rawEvents')
      expect(result).not.toHaveProperty('payload')
      
      // Verify it only contains expected aggregated properties
      expect(result).toHaveProperty('totals')
      expect(result).toHaveProperty('completionRate')
      expect(result).toHaveProperty('replayRate')
      expect(result).toHaveProperty('topInterruptionPoints')
      expect(result).toHaveProperty('itemLeaderboard')
    })

    it('should handle filtered aggregation without exposing identifiers', () => {
      const sampleEvents: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'sensitive-text-hash-123',
          sessionId: 'sensitive-session-id-456'
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_play',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 2,
          engine: 'ai',
          languageCode: 'zh',
          rate: 1.2,
          textLen: 150,
          textHash: 'sensitive-text-hash-456',
          sessionId: 'sensitive-session-id-789'
        }
      ]

      // Test with various filters
      const filters: AnalyticsFilters[] = [
        { engine: 'browser' },
        { languageCode: 'en' },
        { reason: 'user_stop' }
      ]

      for (const filter of filters) {
        const result = aggregate(sampleEvents, filter)
        const resultJson = JSON.stringify(result)
        
        // Assert that no forbidden identifiers appear in any filtered result
        for (const identifier of forbiddenIdentifiers) {
          expect(resultJson).not.toContain(identifier)
        }
      }
    })
  })

  describe('UI source scan guard (static)', () => {
    it('should not contain forbidden identifiers in voice-analytics page component', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )

      // Assert that page component doesn't reference forbidden identifiers
      for (const identifier of forbiddenIdentifiers) {
        expect(pageSource).not.toContain(identifier)
      }
    })

    it('should not contain forbidden identifiers in voice-analytics client component', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Assert that client component doesn't reference forbidden identifiers
      for (const identifier of forbiddenIdentifiers) {
        expect(clientSource).not.toContain(identifier)
      }
    })

    it('should not contain debug console.log statements with sensitive data in UI components', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Check for potential debug logging that might expose sensitive data
      const debugPatterns = [
        /console\.log.*event/i,
        /console\.log.*telemetry/i,
        /console\.log.*analytics/i,
        /console\.log.*data/i
      ]

      for (const pattern of debugPatterns) {
        expect(pageSource).not.toMatch(pattern)
        expect(clientSource).not.toMatch(pattern)
      }
    })
  })

  describe('Additional privacy safeguards', () => {
    it('should ensure aggregated metrics are calculated without sensitive data', () => {
      const sampleEvents: VoiceTelemetryEvent[] = [
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:00:00.000Z',
          event: 'voice_play',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'any-hash',
          sessionId: 'any-session'
        },
        {
          schemaVersion: 1,
          ts: '2025-12-20T10:01:00.000Z',
          event: 'voice_end',
          lessonSlug: 'test-lesson',
          levelIndex: 0,
          itemIndex: 1,
          engine: 'browser',
          languageCode: 'en',
          rate: 1.0,
          textLen: 100,
          textHash: 'any-hash',
          sessionId: 'any-session'
        }
      ]

      const result = aggregate(sampleEvents)

      // Verify that metrics are calculated correctly without exposing raw data
      expect(result.completionRate).toBe(1) // 1 end / 1 play = 100%
      expect(result.replayRate).toBe(0) // No replays
      expect(result.totals.totalPlays).toBe(1)
      expect(result.totals.totalEnds).toBe(1)

      // Verify no sensitive data in any part of result
      const resultJson = JSON.stringify(result)
      for (const identifier of forbiddenIdentifiers) {
        expect(resultJson).not.toContain(identifier)
      }
    })
  })
})