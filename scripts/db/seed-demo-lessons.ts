#!/usr/bin/env tsx

/**
 * Demo Data Seeding Script
 *
 * This script seeds Phase 3 SaaS database with demo data including:
 * - A "Demo Workspace" with default branding
 * - A "Demo Owner" user account
 * - Demo lessons imported from data/demo-lessons/ JSON files
 *
 * The script is idempotent - it can be run multiple times without creating duplicates.
 * It uses upsert operations to update existing data if needed.
 *
 * Usage:
 *   pnpm db:seed:demo
 *   tsx scripts/db/seed-demo-lessons.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { Prisma, PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/db/prisma'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Demo lesson slugs to seed from data/demo-lessons/
 */
const DEMO_LESSON_SLUGS = [
  'effective-meetings',
  'react-hooks-intro',
]

/**
 * Demo workspace configuration
 */
const DEMO_WORKSPACE = {
  name: 'LessonArcade Demo Workspace',
  slug: 'demo',
  brandId: 'lessonarcade-default',
}

/**
 * Demo owner user configuration
 */
const DEMO_OWNER = {
  email: 'demo-owner@example.com',
  name: 'Demo Owner',
}

/**
 * Type for lesson JSON structure (partial, only what we need)
 */
interface LessonJson {
  title?: string
  slug?: string
  levels?: unknown[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute SHA-256 checksum of a string for content integrity
 */
function computeChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Load lesson JSON from data/demo-lessons/ directory
 */
function loadLessonJson(slug: string): LessonJson {
  const path = join(process.cwd(), 'data', 'demo-lessons', `${slug}.json`)
  const content = readFileSync(path, 'utf-8')
  return JSON.parse(content) as LessonJson
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

/**
 * Seed demo data into database
 *
 * This function is idempotent and can be run multiple times.
 * It creates or updates:
 * - Demo workspace
 * - Demo owner user
 * - Workspace member with OWNER role
 * - Demo lessons with versions and content
 *
 * @param prismaClient - Optional Prisma client instance (for testing)
 */
export async function seedDemoData(prismaClient?: PrismaClient): Promise<void> {
  // Use provided client or default to shared prisma
  const prisma = prismaClient ?? defaultPrisma

  console.log('🌱 Seeding demo data...')

  // --------------------------------------------------------------------------
  // 1. Ensure demo workspace exists
  // --------------------------------------------------------------------------
  const workspace = await prisma.workspace.upsert({
    where: { slug: DEMO_WORKSPACE.slug },
    update: {},
    create: DEMO_WORKSPACE,
  })
  console.log(`  ✓ Workspace: ${workspace.name} (${workspace.slug})`)

  // --------------------------------------------------------------------------
  // 2. Ensure demo owner user exists
  // --------------------------------------------------------------------------
  const user = await prisma.user.upsert({
    where: { email: DEMO_OWNER.email },
    update: {},
    create: DEMO_OWNER,
  })
  console.log(`  ✓ User: ${user.name} (${user.email})`)

  // --------------------------------------------------------------------------
  // 3. Ensure workspace member exists
  // --------------------------------------------------------------------------
  const member = await prisma.workspaceMember.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  })
  console.log(`  ✓ WorkspaceMember: ${member.role}`)

  // --------------------------------------------------------------------------
  // 4. Seed each demo lesson
  // --------------------------------------------------------------------------
  let seededLessons = 0

  for (const slug of DEMO_LESSON_SLUGS) {
    try {
      const lessonJson = loadLessonJson(slug)
      const jsonStr = JSON.stringify(lessonJson)
      const checksum = computeChecksum(jsonStr)

      // Create or update lesson
      const lesson = await prisma.lesson.upsert({
        where: {
          workspaceId_slug: {
            workspaceId: workspace.id,
            slug: slug,
          },
        },
        update: {
          title: lessonJson.title || slug,
          status: 'ACTIVE',
        },
        create: {
          workspaceId: workspace.id,
          slug: slug,
          title: lessonJson.title || slug,
          status: 'ACTIVE',
        },
      })

      // Create or update lesson version (version 1, published)
      const version = await prisma.lessonVersion.upsert({
        where: {
          lessonId_versionNumber: {
            lessonId: lesson.id,
            versionNumber: 1,
          },
        },
        update: {
          isPublished: true,
        },
        create: {
          lessonId: lesson.id,
          versionNumber: 1,
          isPublished: true,
        },
      })

      // Create or update lesson content
      await prisma.lessonContent.upsert({
        where: { lessonVersionId: version.id },
        update: {
          json: jsonStr,
          checksum: checksum,
        },
        create: {
          lessonVersionId: version.id,
          json: jsonStr,
          checksum: checksum,
        },
      })

      console.log(`  ✓ Lesson: ${lesson.title} (${slug})`)
      seededLessons++
    } catch (error) {
      console.error(`  ✗ Failed to seed lesson: ${slug}`, error)
    }
  }

  // --------------------------------------------------------------------------
  // 5. Log summary
  // --------------------------------------------------------------------------
  const totalLessons = await prisma.lesson.count({
    where: { workspaceId: workspace.id },
  })

  console.log('')
  console.log('✅ Demo data seeded successfully!')
  console.log(`   Workspace ID: ${workspace.id}`)
  console.log(`   Lessons seeded: ${seededLessons}`)
  console.log(`   Total lessons in workspace: ${totalLessons}`)
}

// ============================================================================
// SCRIPT ENTRY POINT
// ============================================================================

/**
 * Run seeding script if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .catch((error) => {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    })
    .finally(() => {
      defaultPrisma.$disconnect()
    })
}
