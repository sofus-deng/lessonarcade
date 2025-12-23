import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    // Use jsdom for tests (most project tests need DOM APIs)
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // Exclude node_modules and other non-project test files
    exclude: [
      'node_modules/**',
      'e2e/**',
      '.next/**',
      'dist/**',
    ],
    // Set stable jsdom URL for router tests
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3100',
      },
    },
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
