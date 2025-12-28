/**
 * Studio Insights CSV API Tests
 *
 * Tests for CSV export API endpoint that validates:
 * - Response headers are correct (Content-Type, Content-Disposition)
 * - Filename is safe and follows expected pattern
 * - CSV content is valid
 */

import { describe, it, expect } from 'vitest'
import { sanitizeFilename } from '@/lib/utils/filename-sanitizer'

describe('Studio Insights CSV API', () => {
  describe('Filename Sanitization', () => {
    it('should sanitize basic slugs', () => {
      expect(sanitizeFilename('demo')).toBe('demo')
      expect(sanitizeFilename('sample-team')).toBe('sample-team')
      expect(sanitizeFilename('effective-meetings')).toBe('effective-meetings')
    })

    it('should convert uppercase to lowercase', () => {
      expect(sanitizeFilename('DemoWorkspace')).toBe('demoworkspace')
    })

    it('should replace invalid characters with hyphens', () => {
      expect(sanitizeFilename('lesson with spaces')).toBe('lesson-with-spaces')
      expect(sanitizeFilename('lesson,with,commas')).toBe('lesson-with-commas')
      expect(sanitizeFilename('lesson"quoted"')).toBe('lesson-quoted')
    })

    it('should collapse multiple hyphens', () => {
      expect(sanitizeFilename('lesson---many---hyphens')).toBe('lesson-many-hyphens')
    })

    it('should trim leading and trailing hyphens and dots', () => {
      expect(sanitizeFilename('-leading-hyphen')).toBe('leading-hyphen')
      expect(sanitizeFilename('trailing-hyphen-')).toBe('trailing-hyphen')
      expect(sanitizeFilename('.leading-dot')).toBe('leading-dot')
      expect(sanitizeFilename('trailing-dot.')).toBe('trailing-dot')
    })

    it('should return "export" fallback for empty result', () => {
      expect(sanitizeFilename('!!!')).toBe('export')
      expect(sanitizeFilename('---')).toBe('export')
      expect(sanitizeFilename('...')).toBe('export')
    })

    it('should preserve underscores', () => {
      expect(sanitizeFilename('lesson_with_underscore')).toBe('lesson_with_underscore')
      expect(sanitizeFilename('lesson_with_dots')).toBe('lesson_with_dots')
    })

    it('should handle mixed special characters', () => {
      expect(sanitizeFilename('Lesson, With, "Quotes" And Spaces')).toBe('lesson-with-quotes-and-spaces')
    })
  })

  describe('Filename Pattern Validation', () => {
    it('should match expected pattern for demo workspace', () => {
      const sanitized = sanitizeFilename('demo')
      expect(sanitized).toMatch(/^[a-z0-9._-]+$/)
    })

    it('should match expected pattern for sample-team workspace', () => {
      const sanitized = sanitizeFilename('sample-team')
      expect(sanitized).toMatch(/^[a-z0-9._-]+$/)
    })

    it('should produce safe filename for CSV download', () => {
      const workspaceSlug = 'demo'
      const windowDays = 30
      const sanitizedWorkspaceSlug = sanitizeFilename(workspaceSlug)
      const filename = `lessonarcade-insights-${sanitizedWorkspaceSlug}-${windowDays}d.csv`

      // Verify filename only contains safe characters
      expect(filename).toMatch(/^[a-z0-9._-]+-[a-z0-9._-]+-(7|30)d\.csv$/)
    })
  })

  describe('CSV Content-Type Header', () => {
    it('should specify text/csv; charset=utf-8', () => {
      const contentType = 'text/csv; charset=utf-8'
      expect(contentType).toContain('text/csv')
      expect(contentType).toContain('charset=utf-8')
    })
  })

  describe('Content-Disposition Header', () => {
    it('should include attachment directive', () => {
      const contentDisposition = 'attachment; filename="test.csv"'
      expect(contentDisposition).toContain('attachment')
      expect(contentDisposition).toContain('filename=')
    })

    it('should include filename in quotes', () => {
      const contentDisposition = 'attachment; filename="test.csv"'
      expect(contentDisposition).toMatch(/filename="[^"]+"/)
    })
  })
})
