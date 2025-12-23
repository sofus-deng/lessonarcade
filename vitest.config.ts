import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    exclude: ['e2e/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
