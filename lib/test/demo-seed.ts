import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import type { PrismaClient } from '@prisma/client'

// Demo lesson slugs for each workspace
export const DEMO_LESSON_SLUGS = ['effective-meetings', 'react-hooks-intro']
export const SAMPLE_TEAM_LESSON_SLUGS = ['design-feedback-basics', 'feedback-that-lands']

export const DEMO_WORKSPACE = {
  name: 'LessonArcade Demo Workspace',
  slug: 'demo',
  brandId: 'lessonarcade-default',
}

export const SAMPLE_TEAM_WORKSPACE = {
  name: 'Sample Team',
  slug: 'sample-team',
  brandId: 'lessonarcade-default',
}

export const DEMO_OWNER = {
  email: 'demo-owner@example.com',
  name: 'Demo Owner',
}

interface LessonJson {
  title?: string
  slug?: string
  levels?: unknown[]
}

export interface DemoSeedSummary {
  workspaceId: string
  lessonsSeeded: number
  totalLessons: number
}

interface DemoSeedLogger {
  log: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

interface DemoSeedOptions {
  logger?: DemoSeedLogger
}

function computeChecksum(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

function loadLessonJson(slug: string): LessonJson {
  const path = join(process.cwd(), 'data', 'demo-lessons', `${slug}.json`)
  const content = readFileSync(path, 'utf-8')
  return JSON.parse(content) as LessonJson
}

/**
 * Seed demo workspace and lessons
 */
export async function seedDemoWorkspaceAndLessons(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<DemoSeedSummary> {
  const log = options.logger?.log ?? (() => {})
  const logError = options.logger?.error ?? (() => {})

  log('Seeding demo workspace...')

  const workspace = await prisma.workspace.upsert({
    where: { slug: DEMO_WORKSPACE.slug },
    update: {},
    create: DEMO_WORKSPACE,
  })
  log(`Workspace: ${workspace.name} (${workspace.slug})`)

  const user = await prisma.user.upsert({
    where: { email: DEMO_OWNER.email },
    update: {},
    create: DEMO_OWNER,
  })
  log(`User: ${user.name} (${user.email})`)

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
  log(`WorkspaceMember: ${member.role}`)

  let seededLessons = 0

  for (const slug of DEMO_LESSON_SLUGS) {
    try {
      const lessonJson = loadLessonJson(slug)
      const jsonStr = JSON.stringify(lessonJson)
      const checksum = computeChecksum(jsonStr)

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

      log(`Lesson: ${lesson.title} (${slug})`)
      seededLessons++
    } catch (seedError) {
      logError(`Failed to seed lesson: ${slug}`, seedError)
    }
  }

  const totalLessons = await prisma.lesson.count({
    where: { workspaceId: workspace.id },
  })

  log('Demo workspace seeded successfully.')
  log(`Workspace ID: ${workspace.id}`)
  log(`Lessons seeded: ${seededLessons}`)
  log(`Total lessons in workspace: ${totalLessons}`)

  return {
    workspaceId: workspace.id,
    lessonsSeeded: seededLessons,
    totalLessons,
  }
}

/**
 * Seed sample team workspace and lessons
 */
export async function seedSampleTeamWorkspaceAndLessons(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<DemoSeedSummary> {
  const log = options.logger?.log ?? (() => {})
  const logError = options.logger?.error ?? (() => {})

  log('Seeding sample team workspace...')

  // Get or create demo owner user
  const user = await prisma.user.upsert({
    where: { email: DEMO_OWNER.email },
    update: {},
    create: DEMO_OWNER,
  })
  log(`User: ${user.name} (${user.email})`)

  const workspace = await prisma.workspace.upsert({
    where: { slug: SAMPLE_TEAM_WORKSPACE.slug },
    update: {},
    create: SAMPLE_TEAM_WORKSPACE,
  })
  log(`Workspace: ${workspace.name} (${workspace.slug})`)

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
  log(`WorkspaceMember: ${member.role}`)

  let seededLessons = 0

  for (const slug of SAMPLE_TEAM_LESSON_SLUGS) {
    try {
      const lessonJson = loadLessonJson(slug)
      const jsonStr = JSON.stringify(lessonJson)
      const checksum = computeChecksum(jsonStr)

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

      log(`Lesson: ${lesson.title} (${slug})`)
      seededLessons++
    } catch (seedError) {
      logError(`Failed to seed lesson: ${slug}`, seedError)
    }
  }

  const totalLessons = await prisma.lesson.count({
    where: { workspaceId: workspace.id },
  })

  log('Sample team workspace seeded successfully.')
  log(`Workspace ID: ${workspace.id}`)
  log(`Lessons seeded: ${seededLessons}`)
  log(`Total lessons in workspace: ${totalLessons}`)

  return {
    workspaceId: workspace.id,
    lessonsSeeded: seededLessons,
    totalLessons,
  }
}

/**
 * Seed all demo data (both workspaces)
 */
export async function seedAllDemoData(
  prisma: PrismaClient,
  options: DemoSeedOptions = {}
): Promise<{ demo: DemoSeedSummary; sampleTeam: DemoSeedSummary }> {
  const log = options.logger?.log ?? (() => {})

  log('Seeding all demo data...')

  const demo = await seedDemoWorkspaceAndLessons(prisma, options)
  const sampleTeam = await seedSampleTeamWorkspaceAndLessons(prisma, options)

  log('All demo data seeded successfully.')

  return { demo, sampleTeam }
}
