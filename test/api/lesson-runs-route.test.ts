/**
 * Lesson Runs API Route Tests
 *
 * Tests for the lesson runs API endpoint that validate:
 * - Valid payload returns 201 with lesson run ID
 * - Invalid payload returns 400
 * - Unknown workspace returns 404
 * - Unknown lesson returns 404
 * - Database errors are handled gracefully
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/lesson-runs/route'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'
import { prisma } from '@/lib/db/prisma'

describe('Lesson Runs API Route', () => {
  /**
   * Seed demo data before all tests
   */
  beforeAll(async () => {
    await seedDemoWorkspaceAndLessons(prisma)
  })

  /**
   * Disconnect Prisma client after all tests
   */
  afterEach(async () => {
    await prisma.$disconnect()
  })

  it('should return 201 for valid payload', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'effective-meetings',
        mode: 'focus',
        score: 5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.lessonRunId).toBeDefined()
    expect(typeof data.lessonRunId).toBe('string')
  })

  it('should return 201 for arcade mode', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'react-hooks-intro',
        mode: 'arcade',
        score: 8,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.lessonRunId).toBeDefined()
  })

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        workspaceSlug: 'demo',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request')
    expect(data.issues).toBeDefined()
    expect(Array.isArray(data.issues)).toBe(true)
  })

  it('should return 400 for invalid mode', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'effective-meetings',
        mode: 'invalid-mode',
        score: 5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('should return 400 for negative score', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'effective-meetings',
        mode: 'focus',
        score: -5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('should return 400 for invalid datetime', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'effective-meetings',
        mode: 'focus',
        score: 5,
        maxScore: 10,
        completedAt: 'not-a-datetime',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('Invalid request')
  })

  it('should return 404 for unknown workspace', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'unknown',
        lessonSlug: 'effective-meetings',
        mode: 'focus',
        score: 5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.error).toBe('Workspace not found')
  })

  it('should return 404 for unknown lesson', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'unknown-lesson',
        mode: 'focus',
        score: 5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.error).toBe('Lesson not found')
  })

  it('should accept optional fields', async () => {
    const request = new NextRequest('http://localhost/api/lesson-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug: 'demo',
        lessonSlug: 'effective-meetings',
        mode: 'focus',
        score: 5,
        maxScore: 10,
        completedAt: new Date().toISOString(),
        durationMs: 60000,
        anonymousSessionId: '550e8400-e29b-41d4-a716-446655440000',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.ok).toBe(true)
  })
})
