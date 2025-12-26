import { defineConfig } from '@prisma/client'

export default defineConfig({
  schema: './schema.prisma',
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
  adapter: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
})
