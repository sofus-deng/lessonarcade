#!/usr/bin/env tsx

/**
 * Demo Data Seeding Script
 *
 * Usage:
 *   pnpm db:seed:demo
 *   tsx scripts/db/seed-demo-lessons.ts
 */

import type { PrismaClient } from '@prisma/client'
import { prisma as defaultPrisma } from '@/lib/db/prisma'
import { seedDemoWorkspaceAndLessons } from '@/lib/test/demo-seed'

export async function seedDemoData(prismaClient?: PrismaClient) {
  const prisma = prismaClient ?? defaultPrisma
  return seedDemoWorkspaceAndLessons(prisma, { logger: console })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData()
    .catch((seedError) => {
      console.error('Seeding failed:', seedError)
      process.exit(1)
    })
    .finally(() => {
      defaultPrisma.$disconnect()
    })
}
