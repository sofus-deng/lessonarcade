import { prisma } from '../lib/db/prisma'
import { seedAllDemoData } from '../lib/test/demo-seed'

const DEFAULT_DATABASE_URL = 'file:./dev.db'

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
  process.env.DATABASE_URL = databaseUrl

  try {
    await seedAllDemoData(prisma)
    console.log('Seeded demo + sample team data for E2E tests.')
  } finally {
    await prisma.$disconnect()
  }
}
