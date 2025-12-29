import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false,
    exclude: ["node_modules/**", "e2e/**", ".next/**", "dist/**"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3100",
      },
    },
    reporters: process.env.CI
      ? [
          ["default", { outputFile: "test-results/vitest-junit.xml" }],
          ["junit", { outputFile: "test-results/vitest-junit.xml" }],
        ]
      : [["default"]],
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
})
