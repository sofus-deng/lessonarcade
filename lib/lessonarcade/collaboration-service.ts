/**
 * Collaboration Service
 *
 * LA3-P2-01: Lesson comments and collaboration roles
 *
 * This module provides:
 * - Permission helpers for workspace members
 * - CRUD functions for lesson comments
 * - DTO types for API responses
 *
 * IMPORTANT: This is demo-grade code, not production-ready.
 *
 * @module lib/lessonarcade/collaboration-service
 */

import { PrismaClient, WorkspaceMemberRole, CommentStatus } from '@prisma/client'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Minimum role requirements for operations
 */
export type MinimumRole = 'viewer' | 'editor'

/**
 * DTO for lesson comments returned to clients
 */
export interface LessonCommentDTO {
  id: string
  authorName: string
  authorEmail: string
  createdAt: Date
  body: string
  status: CommentStatus
  levelIndex: number | null
  itemKey: string | null
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Schema for creating a new comment
 */
export const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(2000, 'Comment body must be at most 2000 characters'),
  levelIndex: z.number().int().min(0, 'Level index must be a non-negative integer').optional(),
  itemKey: z.string().optional(),
})

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Role hierarchy mapping for minimum role requirements
 *
 * Higher roles include all permissions of lower roles:
 * - OWNER > ADMIN > EDITOR > VIEWER
 */
const ROLE_HIERARCHY: Record<MinimumRole, WorkspaceMemberRole[]> = {
  viewer: ['VIEWER', 'EDITOR', 'ADMIN', 'OWNER'],
  editor: ['EDITOR', 'ADMIN', 'OWNER'],
}

/**
 * Require workspace member with minimum role
 *
 * This function checks if a user is a member of a workspace and has
 * a role that meets or exceeds the minimum requirement.
 *
 * @param prisma - Prisma client instance
 * @param userId - User ID to check
 * @param workspaceId - Workspace ID to check membership in
 * @param minimum - Minimum role required
 * @returns WorkspaceMember if user has sufficient role
 * @throws Error if not a member or insufficient role
 */
export async function requireWorkspaceMemberWithRole(
  prisma: PrismaClient,
  userId: string,
  workspaceId: string,
  minimum: MinimumRole
) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  })

  if (!member) {
    throw new Error('User is not a member of this workspace')
  }

  const allowedRoles = ROLE_HIERARCHY[minimum]
  if (!allowedRoles.includes(member.role)) {
    throw new Error(`User role ${member.role} does not meet minimum requirement ${minimum}`)
  }

  return member
}

// ============================================================================
// COMMENT CRUD FUNCTIONS
// ============================================================================

/**
 * List comments for a lesson in a workspace
 *
 * This function:
 * 1. Resolves workspace by slug
 * 2. Resolves lesson by workspace and slug
 * 3. Fetches comments with author info
 * 4. Maps to DTOs
 *
 * @param prisma - Prisma client instance
 * @param workspaceSlug - Workspace slug
 * @param lessonSlug - Lesson slug
 * @returns Array of comment DTOs, newest first
 * @throws Error if workspace or lesson not found
 */
export async function listLessonComments(
  prisma: PrismaClient,
  workspaceSlug: string,
  lessonSlug: string
): Promise<LessonCommentDTO[]> {
  // Resolve workspace by slug
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${workspaceSlug}" not found`)
  }

  // Resolve lesson by workspace and slug
  const lesson = await prisma.lesson.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: lessonSlug,
      },
    },
  })

  if (!lesson) {
    throw new Error(`Lesson with slug "${lessonSlug}" not found in workspace`)
  }

  // Fetch comments with author info
  const comments = await prisma.lessonComment.findMany({
    where: {
      workspaceId: workspace.id,
      lessonId: lesson.id,
    },
    include: {
      author: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Map to DTOs
  return comments.map((comment) => ({
    id: comment.id,
    authorName: comment.author.name,
    authorEmail: comment.author.email,
    createdAt: comment.createdAt,
    body: comment.body,
    status: comment.status,
    levelIndex: comment.levelIndex,
    itemKey: comment.itemKey,
  }))
}

/**
 * Create a new comment on a lesson
 *
 * This function:
 * 1. Validates input with Zod
 * 2. Resolves workspace by slug
 * 3. Resolves lesson by workspace and slug
 * 4. Creates comment with OPEN status
 *
 * @param prisma - Prisma client instance
 * @param workspaceSlug - Workspace slug
 * @param lessonSlug - Lesson slug
 * @param authorUserId - Author user ID
 * @param input - Comment input data
 * @returns Created comment DTO
 * @throws Error if workspace or lesson not found, or validation fails
 */
export async function createLessonComment(
  prisma: PrismaClient,
  workspaceSlug: string,
  lessonSlug: string,
  authorUserId: string,
  input: CreateCommentInput
): Promise<LessonCommentDTO> {
  // Validate input
  const validated = CreateCommentSchema.parse(input)

  // Resolve workspace by slug
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    throw new Error(`Workspace with slug "${workspaceSlug}" not found`)
  }

  // Resolve lesson by workspace and slug
  const lesson = await prisma.lesson.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: lessonSlug,
      },
    },
  })

  if (!lesson) {
    throw new Error(`Lesson with slug "${lessonSlug}" not found in workspace`)
  }

  // Create comment
  const comment = await prisma.lessonComment.create({
    data: {
      workspaceId: workspace.id,
      lessonId: lesson.id,
      authorId: authorUserId,
      body: validated.body,
      levelIndex: validated.levelIndex,
      itemKey: validated.itemKey,
      status: 'OPEN',
    },
    include: {
      author: true,
    },
  })

  return {
    id: comment.id,
    authorName: comment.author.name,
    authorEmail: comment.author.email,
    createdAt: comment.createdAt,
    body: comment.body,
    status: comment.status,
    levelIndex: comment.levelIndex,
    itemKey: comment.itemKey,
  }
}

/**
 * Resolve a comment (POC only - not production-ready)
 *
 * This function marks a comment as RESOLVED and sets the resolvedAt timestamp.
 *
 * POC NOTE: This is a basic implementation without full permission checks.
 * In production, you would want to verify that the user has permission to resolve
 * comments (e.g., only the author or an admin/owner).
 *
 * @param prisma - Prisma client instance
 * @param commentId - Comment ID
 * @returns Updated comment DTO
 * @throws Error if comment not found
 */
export async function resolveLessonComment(
  prisma: PrismaClient,
  commentId: string
): Promise<LessonCommentDTO> {
  // POC: Basic implementation without full permission checks
  const comment = await prisma.lessonComment.update({
    where: { id: commentId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
    include: {
      author: true,
    },
  })

  return {
    id: comment.id,
    authorName: comment.author.name,
    authorEmail: comment.author.email,
    createdAt: comment.createdAt,
    body: comment.body,
    status: comment.status,
    levelIndex: comment.levelIndex,
    itemKey: comment.itemKey,
  }
}
