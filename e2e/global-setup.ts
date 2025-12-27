import { prisma } from '../lib/db/prisma'
import { seedDemoWorkspaceAndLessons } from '../lib/test/demo-seed'

const DEFAULT_DATABASE_URL = 'file:./dev.db'

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
  process.env.DATABASE_URL = databaseUrl

  try {
    await seedDemoWorkspaceAndLessons(prisma)
    console.log('Seeded demo data for E2E tests.')
  } finally {
    await prisma.$disconnect()
  }
}
