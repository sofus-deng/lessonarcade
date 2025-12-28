/**
 * Lesson Insights Export Tests
 *
 * Tests for CSV export functionality that validates:
 * - CSV value escaping works correctly (commas, quotes, newlines)
 * - CSV row formatting is correct
 * - Full lesson insights CSV includes expected sections and headers
 * - CSV output is deterministic and stable
 */

import { describe, it, expect } from 'vitest'
import {
  toCsvRow,
  buildLessonInsightsCsv,
} from '@/lib/lessonarcade/lesson-insights-export'
import type { LessonInsights } from '@/lib/lessonarcade/lesson-insights-service'

describe('Lesson Insights Export', () => {
  describe('toCsvRow', () => {
    it('should format simple values without special characters', () => {
      const result = toCsvRow(['a', 'b', 'c'])
      expect(result).toBe('a,b,c\n')
    })

    it('should escape values containing commas', () => {
      const result = toCsvRow(['hello,world', 'normal', 'value'])
      expect(result).toBe('"hello,world",normal,value\n')
    })

    it('should escape values containing quotes', () => {
      const result = toCsvRow(['say "hello"', 'normal', 'value'])
      expect(result).toBe('"say ""hello""",normal,value\n')
    })

    it('should escape values containing newlines', () => {
      const result = toCsvRow(['line1\nline2', 'normal', 'value'])
      expect(result).toBe('"line1\nline2",normal,value\n')
    })

    it('should escape values containing carriage returns', () => {
      const result = toCsvRow(['line1\rline2', 'normal', 'value'])
      expect(result).toBe('"line1\rline2",normal,value\n')
    })

    it('should handle empty values', () => {
      const result = toCsvRow(['', 'value', ''])
      expect(result).toBe(',value,\n')
    })

    it('should handle numeric values converted to strings', () => {
      const result = toCsvRow(['1', '2.5', '100'])
      expect(result).toBe('1,2.5,100\n')
    })

    it('should handle values with multiple special characters', () => {
      const result = toCsvRow(['a,b,c', '"quoted"', 'line\nbreak'])
      expect(result).toBe('"a,b,c","""quoted""","line\nbreak"\n')
    })
  })

  describe('buildLessonInsightsCsv', () => {
    const mockDate = new Date('2025-12-28T00:00:00.000Z')

    const baseInsights: LessonInsights = {
      timeWindowStart: mockDate,
      timeWindowEnd: new Date('2025-12-28T23:59:59.999Z'),
      lesson: {
        id: 'lesson-id-1',
        slug: 'effective-meetings',
        title: 'Effective Meetings',
      },
      totalRuns: 10,
      avgScorePercent: 75.5,
      modeBreakdown: {
        focusRuns: 7,
        arcadeRuns: 3,
      },
      uniqueSessions: 5,
      totalComments: 3,
      openComments: 2,
      resolvedComments: 1,
      dailyBuckets: [
        {
          date: '2025-12-27',
          runs: 5,
          avgScorePercent: 70.0,
        },
        {
          date: '2025-12-28',
          runs: 5,
          avgScorePercent: 80.0,
        },
      ],
      recentActivity: [
        {
          type: 'run',
          timestamp: mockDate,
          description: 'Completed with 80% score',
        },
        {
          type: 'comment',
          timestamp: mockDate,
          description: 'Comment added by John Doe',
          authorName: 'John Doe',
        },
      ],
    }

    it('should include Summary section with correct headers', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Summary')
      expect(csv).toContain('Lesson Title')
      expect(csv).toContain('Lesson Slug')
      expect(csv).toContain('Time Window Start')
      expect(csv).toContain('Time Window End')
      expect(csv).toContain('Total Runs')
      expect(csv).toContain('Average Score %')
      expect(csv).toContain('Unique Sessions')
      expect(csv).toContain('Total Comments')
      expect(csv).toContain('Open Comments')
      expect(csv).toContain('Resolved Comments')
    })

    it('should include lesson info in summary', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Effective Meetings')
      expect(csv).toContain('effective-meetings')
    })

    it('should include Mode Breakdown section with correct headers', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Mode Breakdown')
      expect(csv).toContain('Mode,Runs')
    })

    it('should include mode breakdown data', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Focus,7')
      expect(csv).toContain('Arcade,3')
    })

    it('should include Comments Summary section with correct headers', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Comments Summary')
      expect(csv).toContain('Status,Count')
    })

    it('should include comments summary data', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Open,2')
      expect(csv).toContain('Resolved,1')
      expect(csv).toContain('Total,3')
    })

    it('should include Daily Buckets (UTC) section with correct headers', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Daily Buckets (UTC)')
      expect(csv).toContain('Date,Runs,Average Score %')
    })

    it('should include all daily buckets data', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('2025-12-27,5,70')
      expect(csv).toContain('2025-12-28,5,80')
    })

    it('should include Recent Activity section with correct headers', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('Recent Activity')
      expect(csv).toContain('Type,Timestamp,Description')
    })

    it('should include all recent activity data', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('run')
      expect(csv).toContain('comment')
      expect(csv).toContain('Completed with 80% score')
      expect(csv).toContain('Comment added by John Doe')
    })

    it('should handle null average score in summary', () => {
      const noScoreInsights: LessonInsights = {
        ...baseInsights,
        avgScorePercent: null,
      }
      const csv = buildLessonInsightsCsv(noScoreInsights)
      expect(csv).toContain('Average Score %,N/A')
    })

    it('should handle null average score in daily buckets', () => {
      const noScoreBucketInsights: LessonInsights = {
        ...baseInsights,
        dailyBuckets: [
          {
            date: '2025-12-27',
            runs: 5,
            avgScorePercent: null,
          },
        ],
      }
      const csv = buildLessonInsightsCsv(noScoreBucketInsights)
      expect(csv).toContain('2025-12-27,5,N/A')
    })

    it('should format dates in ISO 8601 format', () => {
      const csv = buildLessonInsightsCsv(baseInsights)
      expect(csv).toContain('2025-12-28T00:00:00.000Z')
    })

    it('should handle empty arrays gracefully', () => {
      const emptyInsights: LessonInsights = {
        ...baseInsights,
        dailyBuckets: [],
        recentActivity: [],
      }
      const csv = buildLessonInsightsCsv(emptyInsights)

      // Should still include section headers
      expect(csv).toContain('Daily Buckets (UTC)')
      expect(csv).toContain('Recent Activity')

      // Should include table headers even with no data
      expect(csv).toContain('Date,Runs,Average Score %')
      expect(csv).toContain('Type,Timestamp,Description')
    })

    it('should escape special characters in lesson title', () => {
      const specialTitleInsights: LessonInsights = {
        ...baseInsights,
        lesson: {
          ...baseInsights.lesson,
          title: 'Lesson, With, Commas',
        },
      }
      const csv = buildLessonInsightsCsv(specialTitleInsights)
      expect(csv).toContain('"Lesson, With, Commas"')
    })

    it('should escape special characters in activity description', () => {
      const specialActivityInsights: LessonInsights = {
        ...baseInsights,
        recentActivity: [
          {
            type: 'comment',
            timestamp: mockDate,
            description: 'Comment "quoted" and, with, commas',
          },
        ],
      }
      const csv = buildLessonInsightsCsv(specialActivityInsights)
      expect(csv).toContain('"Comment ""quoted"" and, with, commas"')
    })

    it('should produce deterministic output for same input', () => {
      const csv1 = buildLessonInsightsCsv(baseInsights)
      const csv2 = buildLessonInsightsCsv(baseInsights)
      expect(csv1).toBe(csv2)
    })

    it('should include all sections in correct order', () => {
      const csv = buildLessonInsightsCsv(baseInsights)

      // Verify sections appear in order
      const summaryIndex = csv.indexOf('Summary')
      const modeBreakdownIndex = csv.indexOf('Mode Breakdown')
      const commentsSummaryIndex = csv.indexOf('Comments Summary')
      const dailyBucketsIndex = csv.indexOf('Daily Buckets (UTC)')
      const recentActivityIndex = csv.indexOf('Recent Activity')

      expect(summaryIndex).toBeLessThan(modeBreakdownIndex)
      expect(modeBreakdownIndex).toBeLessThan(commentsSummaryIndex)
      expect(commentsSummaryIndex).toBeLessThan(dailyBucketsIndex)
      expect(dailyBucketsIndex).toBeLessThan(recentActivityIndex)
    })
  })
})
