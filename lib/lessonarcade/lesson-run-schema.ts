/**
 * Zod schemas for lesson run API request validation.
 *
 * This module defines the validation schema for creating lesson runs via the API.
 */

import { z } from 'zod'

/**
 * Request schema for creating a lesson run.
 *
 * Required fields:
 * - workspaceSlug: The workspace identifier (e.g., "demo")
 * - lessonSlug: The lesson identifier (e.g., "effective-meetings")
 * - mode: The lesson mode ("focus" or "arcade")
 * - score: The score achieved
 * - maxScore: The maximum possible score
 * - completedAt: ISO datetime string when the lesson was completed
 *
 * Optional fields:
 * - durationMs: Duration of the lesson run in milliseconds
 * - anonymousSessionId: UUID for anonymous session tracking
 */
export const CreateLessonRunSchema = z.object({
  workspaceSlug: z.string().min(1, 'workspaceSlug is required'),
  lessonSlug: z.string().min(1, 'lessonSlug is required'),
  mode: z.enum(['focus', 'arcade'], {
    message: 'mode must be either "focus" or "arcade"',
  }),
  score: z.number().int().min(0, 'score must be a non-negative integer'),
  maxScore: z.number().int().min(0, 'maxScore must be a non-negative integer'),
  completedAt: z.string().datetime('completedAt must be a valid ISO datetime string'),
  // Optional fields
  durationMs: z.number().int().min(0).optional(),
  anonymousSessionId: z.string().uuid().optional(),
})

/**
 * Inferred type for validated lesson run input.
 */
export type CreateLessonRunInput = z.infer<typeof CreateLessonRunSchema>
