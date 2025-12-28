/**
 * Analytics Export Tests
 *
 * Tests for CSV export functionality that validates:
 * - CSV value escaping works correctly (commas, quotes, newlines)
 * - CSV row formatting is correct
 * - Full insights CSV includes expected sections and headers
 * - CSV output is deterministic and stable
 */

import { describe, it, expect } from 'vitest'
import {
  toCsvRow,
  buildWorkspaceInsightsCsv,
} from '@/lib/lessonarcade/analytics-export'
import type { WorkspaceInsights } from '@/lib/lessonarcade/analytics-service'

describe('Analytics Export', () => {
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

  describe('buildWorkspaceInsightsCsv', () => {
    const mockDate = new Date('2025-12-28T00:00:00.000Z')

    const baseInsights: WorkspaceInsights = {
      timeWindowStart: mockDate,
      timeWindowEnd: new Date('2025-12-28T23:59:59.999Z'),
      totalRunsInWindow: 10,
      avgScorePercentInWindow: 75.5,
      totalUniqueLearnerSessions: 5,
      totalCommentsInWindow: 3,
      topStrugglingLessons: [
        {
          lessonSlug: 'lesson-1',
          title: 'Lesson One',
          runCount: 5,
          avgScorePercent: 45.0,
        },
        {
          lessonSlug: 'lesson-2',
          title: 'Lesson Two',
          runCount: 3,
          avgScorePercent: 50.5,
        },
      ],
      topEngagedLessons: [
        {
          lessonSlug: 'lesson-1',
          title: 'Lesson One',
          runCount: 5,
          avgScorePercent: 45.0,
        },
        {
          lessonSlug: 'lesson-3',
          title: 'Lesson Three',
          runCount: 4,
          avgScorePercent: null,
        },
      ],
      recentActivity: [
        {
          type: 'run',
          timestamp: mockDate,
          lessonSlug: 'lesson-1',
          lessonTitle: 'Lesson One',
          description: 'Completed with 80% score',
        },
        {
          type: 'comment',
          timestamp: mockDate,
          lessonSlug: 'lesson-2',
          lessonTitle: 'Lesson Two',
          description: 'Comment added by John Doe',
        },
      ],
    }

    it('should include Summary section with correct headers', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Summary')
      expect(csv).toContain('Time Window Start')
      expect(csv).toContain('Time Window End')
      expect(csv).toContain('Total Runs')
      expect(csv).toContain('Average Score %')
      expect(csv).toContain('Unique Sessions')
      expect(csv).toContain('Total Comments')
    })

    it('should include Top Struggling Lessons section with correct headers', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Top Struggling Lessons')
      expect(csv).toContain('Lesson Title,Lesson Slug,Runs,Average Score %')
    })

    it('should include Top Engaged Lessons section with correct headers', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Top Engaged Lessons')
      expect(csv).toContain('Lesson Title,Lesson Slug,Runs,Average Score %')
    })

    it('should include Recent Activity section with correct headers', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Recent Activity')
      expect(csv).toContain('Type,Timestamp,Lesson Title,Lesson Slug,Description')
    })

    it('should include all struggling lessons data', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Lesson One,lesson-1,5,45')
      expect(csv).toContain('Lesson Two,lesson-2,3,50.5')
    })

    it('should include all engaged lessons data', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('Lesson One,lesson-1,5,45')
      expect(csv).toContain('Lesson Three,lesson-3,4,N/A')
    })

    it('should include all recent activity data', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('run')
      expect(csv).toContain('comment')
      expect(csv).toContain('Completed with 80% score')
      expect(csv).toContain('Comment added by John Doe')
    })

    it('should handle null average score in engaged lessons', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('N/A')
    })

    it('should format dates in ISO 8601 format', () => {
      const csv = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv).toContain('2025-12-28T00:00:00.000Z')
    })

    it('should handle empty arrays gracefully', () => {
      const emptyInsights: WorkspaceInsights = {
        ...baseInsights,
        topStrugglingLessons: [],
        topEngagedLessons: [],
        recentActivity: [],
      }
      const csv = buildWorkspaceInsightsCsv(emptyInsights)

      // Should still include section headers
      expect(csv).toContain('Top Struggling Lessons')
      expect(csv).toContain('Top Engaged Lessons')
      expect(csv).toContain('Recent Activity')

      // Should include table headers even with no data
      expect(csv).toContain('Lesson Title,Lesson Slug,Runs,Average Score %')
      expect(csv).toContain('Type,Timestamp,Lesson Title,Lesson Slug,Description')
    })

    it('should handle null average score in summary', () => {
      const noScoreInsights: WorkspaceInsights = {
        ...baseInsights,
        avgScorePercentInWindow: null,
      }
      const csv = buildWorkspaceInsightsCsv(noScoreInsights)
      expect(csv).toContain('Average Score %,N/A')
    })

    it('should escape special characters in lesson titles', () => {
      const specialTitleInsights: WorkspaceInsights = {
        ...baseInsights,
        topStrugglingLessons: [
          {
            lessonSlug: 'lesson-with-comma',
            title: 'Lesson, With, Commas',
            runCount: 5,
            avgScorePercent: 50.0,
          },
        ],
      }
      const csv = buildWorkspaceInsightsCsv(specialTitleInsights)
      expect(csv).toContain('"Lesson, With, Commas"')
    })

    it('should produce deterministic output for same input', () => {
      const csv1 = buildWorkspaceInsightsCsv(baseInsights)
      const csv2 = buildWorkspaceInsightsCsv(baseInsights)
      expect(csv1).toBe(csv2)
    })
  })
})
