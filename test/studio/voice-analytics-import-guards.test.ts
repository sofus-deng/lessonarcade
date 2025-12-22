// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'

describe('Voice Analytics Import Guards', () => {
  const forbiddenIdentifiers = [
    'ipHash',
    'fingerprintHash', 
    'sessionId',
    'textHash'
  ]

  describe('Client component import restrictions', () => {
    it('should not import from server-only analytics module in client component', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should not import from analytics module
      expect(clientSource).not.toContain("from '@/lib/lessonarcade/voice/analytics'")
      expect(clientSource).not.toContain("from \"@/lib/lessonarcade/voice/analytics\"")
      expect(clientSource).not.toContain("import.*analytics")
    })

    it('should not contain node: imports in client component', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should not contain any node: imports
      expect(clientSource).not.toMatch(/from ['"]node:/)
    })

    it('should use "use client" directive in client component', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should have use client directive
      expect(clientSource).toContain('"use client"')
    })

    it('should only import client-safe modules in client component', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should only import from client-safe modules
      const allowedImports = [
        /from ['"]next\/navigation['"]/, // Next.js navigation hooks
        /from ['"]react['"]/, // React
        /from ['"]@\/components\/ui\/['"]/, // UI components
        /from ['"]@\/radix-ui\/['"]/ // Radix UI components
      ]

      // Check that all imports match allowed patterns
      const importLines = clientSource.split('\n').filter(line => line.trim().startsWith('import'))
      
      for (const importLine of importLines) {
        let isAllowed = false
        for (const allowedPattern of allowedImports) {
          if (allowedPattern.test(importLine)) {
            isAllowed = true
            break
          }
        }
        
        if (!isAllowed) {
          // If not matching allowed patterns, it should be a relative import or type import
          // Allow @/components/ui imports as they are client-safe
          expect(importLine).toMatch(/from ['"]\.\/|from ['"]type |from ['"]@\/components\/ui\//)
        }
      }
    })
  })

  describe('Server component import validation', () => {
    it('should import from analytics module in server component', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )

      // Should import from analytics module
      expect(pageSource).toContain("from \"@/lib/lessonarcade/voice/analytics\"")
    })

    it('should not include restricted key rendering in server component', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )

      // Should not render any forbidden identifiers
      for (const identifier of forbiddenIdentifiers) {
        expect(pageSource).not.toContain(identifier)
      }
    })

    it('should not use "use client" directive in server component', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )

      // Should not have use client directive
      expect(pageSource).not.toContain('"use client"')
    })
  })

  describe('File boundary enforcement', () => {
    it('should ensure analytics.ts has server-only import', async () => {
      const analyticsSource = await readFile(
        'lib/lessonarcade/voice/analytics.ts',
        'utf8'
      )

      // Should have server-only import at top
      expect(analyticsSource).toContain("import 'server-only'")
      
      // Should be one of the first imports
      const lines = analyticsSource.split('\n')
      const serverOnlyIndex = lines.findIndex(line => line.includes("import 'server-only'"))
      expect(serverOnlyIndex).toBeLessThan(3) // Should be within first 3 lines
    })

    it('should ensure telemetry.ts properly separates client and server code', async () => {
      const telemetrySource = await readFile(
        'lib/lessonarcade/voice/telemetry.ts',
        'utf8'
      )

      // Should export client-safe functions
      expect(telemetrySource).toContain("export { createTextHash, createSessionId } from './telemetry-client'")
      
      // Should use conditional fs import
      expect(telemetrySource).toContain("const fs = typeof window === 'undefined' ? { mkdir, appendFile } : null")
    })
  })

  describe('Import path validation', () => {
    it('should prevent direct import of server modules in client code', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should not import server-only modules
      const serverModules = [
        'node:fs',
        'node:path',
        'node:crypto',
        '@/lib/lessonarcade/voice/analytics',
        '@/lib/lessonarcade/voice/telemetry'
      ]

      for (const moduleName of serverModules) {
        expect(clientSource).not.toContain(moduleName)
      }
    })

    it('should ensure proper TypeScript types are used', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should use proper TypeScript interfaces/types
      expect(clientSource).toContain('interface VoiceAnalyticsClientProps')
      
      // Should not use 'any' type
      expect(clientSource).not.toMatch(/:\s*any(?!\w)/)
    })
  })

  describe('Runtime separation verification', () => {
    it('should ensure client component only receives serializable data', async () => {
      const pageSource = await readFile(
        'app/studio/(admin)/voice-analytics/page.tsx',
        'utf8'
      )

      // Should pass only serializable data to client component
      expect(pageSource).toContain('filters={filters}')
      
      // Should not pass raw events or sensitive data
      expect(pageSource).not.toContain('events={events}')
      expect(pageSource).not.toContain('analytics=')
    })

    it('should ensure client component only manipulates URL/search params', async () => {
      const clientSource = await readFile(
        'app/studio/(admin)/voice-analytics/voice-analytics-client.tsx',
        'utf8'
      )

      // Should only use navigation hooks for client-side state
      expect(clientSource).toContain('useRouter')
      expect(clientSource).toContain('useSearchParams')
      expect(clientSource).toContain('usePathname')
      
      // Should not make direct API calls or fetch data
      expect(clientSource).not.toContain('fetch(')
      expect(clientSource).not.toContain('axios')
      expect(clientSource).not.toContain('api/')
    })
  })
})