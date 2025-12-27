/**
 * Prisma Client Singleton
 *
 * This module exports a singleton PrismaClient instance for use in the LessonArcade app.
 * The singleton pattern prevents multiple PrismaClient instances from being created
 * during development, which can cause connection pool exhaustion.
 *
 * Usage:
 *   import { prisma } from '@/lib/db/prisma'
 *   const users = await prisma.user.findMany()
 */

import { PrismaClient } from '@prisma/client'

/**
 * Global reference to the Prisma client instance.
 * In development, this is stored on globalThis to persist across hot-reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Singleton PrismaClient instance.
 * Reuses existing instance in development, creates new one in production.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
