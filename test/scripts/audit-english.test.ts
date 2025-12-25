/**
 * English-Only Audit Script Tests
 * 
 * Tests for audit-english script to ensure it properly validates
 * English-only content in judge-visible paths and allows
 * expected bilingual content in allowlisted directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

const testDir = join(process.cwd(), 'test-temp-audit')
const scriptsDir = join(process.cwd(), 'scripts')

describe('English-Only Audit', () => {
  beforeEach(() => {
    // Create a temporary test directory structure
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, 'app'), { recursive: true })
    mkdirSync(join(testDir, 'components'), { recursive: true })
    mkdirSync(join(testDir, 'docs'), { recursive: true })
    mkdirSync(join(testDir, 'data', 'demo-lessons'), { recursive: true })
    mkdirSync(join(testDir, 'lib', 'lessonarcade', 'voice'), { recursive: true })
    mkdirSync(join(testDir, 'test'), { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('English-Only Content Check', () => {
    it('should pass when all judge-visible files are English-only', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Run audit script with --root argument using tsx
      const result = execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
        encoding: 'utf8'
      })

      expect(result).toContain('No CJK characters found')
      expect(result).toContain('All scanned files are English-only')
    })

    it('should fail when CJK characters are found in judge-visible paths', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK text to a component file
      writeFileSync(join(testDir, 'components', 'card.tsx'), 'export function Card() { return <div>中文</div> }')

      // Run audit script and verify it fails by checking exit code
      try {
        execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
          encoding: 'utf8',
          stdio: 'pipe'
        })
        // If we reach here, test should fail
        expect(true).toBe(false)
      } catch (error: unknown) {
        // Expected behavior - script should fail with non-zero exit code
        expect(error).toBeDefined()
        const errorOutput = (error as { stdout?: string, stderr?: string }).stdout?.toString() || (error as { stdout?: string, stderr?: string }).stderr?.toString() || ''
        expect(errorOutput).toContain('Found 1 violation(s)')
        expect(errorOutput).toContain('components/card.tsx')
      }
    })

    it('should report violations with file path, line number, and snippet', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK text to multiple files
      writeFileSync(join(testDir, 'components', 'card.tsx'), 'export function Card() {\n  return <div>中文</div>\n}')
      writeFileSync(join(testDir, 'app', 'about.tsx'), 'export function About() {\n  return <div>測試</div>\n}')

      // Run audit script and verify it fails
      try {
        execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
          encoding: 'utf8',
          stdio: 'pipe'
        })
        expect(true).toBe(false)
      } catch (error: unknown) {
        const errorOutput = (error as { stdout?: string, stderr?: string }).stdout?.toString() || (error as { stdout?: string, stderr?: string }).stderr?.toString() || ''
        expect(errorOutput).toContain('Found 2 violation(s)')
        expect(errorOutput).toContain('components/card.tsx')
        expect(errorOutput).toContain('app/about.tsx')
        expect(errorOutput).toContain('Line 2')
      }
    })
  })

  describe('Allowlist Check', () => {
    it('should pass when CJK characters are found in allowed directories', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK text to allowed directories (should be ignored)
      writeFileSync(join(testDir, 'data', 'demo-lessons', 'lesson.json'), '{"title": "中文", "content": "測試"}')
      writeFileSync(join(testDir, 'lib', 'lessonarcade', 'voice', 'script.ts'), 'const text = "中文"')
      writeFileSync(join(testDir, 'test', 'data.ts'), 'const test = "測試"')

      // Run audit script with --root argument using tsx
      const result = execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
        encoding: 'utf8'
      })

      expect(result).toContain('No CJK characters found')
    })

    it('should fail when CJK is in judge-visible paths even if allowed paths have CJK', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK text to both allowed and disallowed directories
      writeFileSync(join(testDir, 'data', 'demo-lessons', 'lesson.json'), '{"title": "中文", "content": "測試"}')
      writeFileSync(join(testDir, 'lib', 'lessonarcade', 'voice', 'script.ts'), 'const text = "中文"')
      writeFileSync(join(testDir, 'test', 'data.ts'), 'const test = "測試"')
      writeFileSync(join(testDir, 'components', 'card.tsx'), 'export function Card() { return <div>中文</div> }')

      // Run audit script and verify it fails
      try {
        execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
          encoding: 'utf8',
          stdio: 'pipe'
        })
        expect(true).toBe(false)
      } catch (error: unknown) {
        const errorOutput = (error as { stdout?: string, stderr?: string }).stdout?.toString() || (error as { stdout?: string, stderr?: string }).stderr?.toString() || ''
        expect(errorOutput).toContain('Found 1 violation(s)')
        expect(errorOutput).toContain('components/card.tsx')
        // Should not report violations from allowed directories
        expect(errorOutput).not.toContain('data/demo-lessons/lesson.json')
        expect(errorOutput).not.toContain('lib/lessonarcade/voice/script.ts')
        expect(errorOutput).not.toContain('test/data.ts')
      }
    })
  })

  describe('File Extension Filtering', () => {
    it('should scan only specified file extensions', () => {
      // Create English-only files in judge-visible directories
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK text to files with non-scanned extensions
      writeFileSync(join(testDir, 'app', 'image.png'), 'fake png content')
      writeFileSync(join(testDir, 'components', 'style.css'), '.card { color: red; }')
      writeFileSync(join(testDir, 'docs', 'diagram.pdf'), 'fake pdf content')

      // Run audit script with --root argument using tsx
      const result = execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
        encoding: 'utf8'
      })

      expect(result).toContain('No CJK characters found')
    })
  })

  describe('Integration Test', () => {
    it('should pass with complete valid structure (English-only judge-visible, CJK in allowed)', () => {
      // Create complete valid structure
      writeFileSync(join(testDir, 'app', 'page.tsx'), 'export default function Page() { return <div>Hello World</div> }')
      writeFileSync(join(testDir, 'app', 'about.tsx'), 'export function About() { return <div>About</div> }')
      writeFileSync(join(testDir, 'components', 'button.tsx'), 'export function Button() { return <button>Click me</button> }')
      writeFileSync(join(testDir, 'components', 'card.tsx'), 'export function Card() { return <div>Card</div> }')
      writeFileSync(join(testDir, 'docs', 'setup.md'), '# Setup Guide\n\nThis is a guide.')
      writeFileSync(join(testDir, 'README.md'), '# Project\n\nThis is a project.')

      // Add CJK content to allowed directories
      writeFileSync(join(testDir, 'data', 'demo-lessons', 'lesson.json'), '{"title": "中文", "content": "測試"}')
      writeFileSync(join(testDir, 'lib', 'lessonarcade', 'voice', 'script.ts'), 'const text = "中文"')
      writeFileSync(join(testDir, 'test', 'data.ts'), 'const test = "測試"')

      // Run audit script with --root argument using tsx
      const result = execSync(`npx tsx ${join(scriptsDir, 'audit-english.ts')} --root ${testDir}`, {
        encoding: 'utf8'
      })

      expect(result).toContain('No CJK characters found')
      expect(result).toContain('All scanned files are English-only')
    })
  })
})
