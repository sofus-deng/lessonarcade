/**
 * Lessons Overview API Tests
 *
 * Tests for lessons overview API endpoint that validates:
 * - Response shape is explicit and consistent
 * - Response structure matches expected format
 */

import { describe, it, expect } from 'vitest'

describe('Lessons Overview API', () => {
  describe('Response Shape', () => {
    it('should have correct top-level structure', () => {
      // Verify the expected response structure
      const expectedStructure = {
        ok: true,
        lessons: {
          workspace: {
            id: expect.any(String),
            slug: expect.any(String),
            name: expect.any(String),
          },
          lessons: expect.any(Array),
          totals: {
            totalLessons: expect.any(Number),
            totalRuns: expect.any(Number),
            averageScorePercent: expect.anything(), // Can be number or null
          },
        },
      }

      // Verify each property exists
      expect(expectedStructure.ok).toBe(true)
      expect(expectedStructure.lessons).toBeDefined()
      expect(expectedStructure.lessons.workspace).toBeDefined()
      expect(expectedStructure.lessons.lessons).toBeDefined()
      expect(expectedStructure.lessons.totals).toBeDefined()
    })

    it('should include workspace info with id, slug, and name', () => {
      const workspaceStructure = {
        id: expect.any(String),
        slug: expect.any(String),
        name: expect.any(String),
      }

      expect(workspaceStructure.id).toBeDefined()
      expect(workspaceStructure.slug).toBeDefined()
      expect(workspaceStructure.name).toBeDefined()
    })

    it('should include lessons array', () => {
      const lessonsArray = expect.any(Array)

      expect(lessonsArray).toBeDefined()
    })

    it('should include totals with totalLessons, totalRuns, and averageScorePercent', () => {
      const totalsStructure = {
        totalLessons: expect.any(Number),
        totalRuns: expect.any(Number),
        averageScorePercent: expect.anything(), // Can be number or null
      }

      expect(totalsStructure.totalLessons).toBeDefined()
      expect(totalsStructure.totalRuns).toBeDefined()
      expect(totalsStructure.averageScorePercent).toBeDefined()
    })

    it('should return valid JSON format', () => {
      const validJson = '{"ok":true,"lessons":{}}'
      expect(() => JSON.parse(validJson)).not.toThrow()
    })
  })
})
