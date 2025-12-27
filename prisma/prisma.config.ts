import { defineConfig } from '@prisma/client/ts'

export default defineConfig({
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
})
