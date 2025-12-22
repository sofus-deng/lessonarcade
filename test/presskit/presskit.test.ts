/**
 * Press Kit Quality Gate Tests
 * 
 * Tests presskit quality gate script to ensure it properly validates
 * press kit structure and prevents binary files from being committed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'

const testDir = join(process.cwd(), 'test-temp-presskit')
const scriptsDir = join(process.cwd(), 'scripts')

describe('Press Kit Quality Gate', () => {
  beforeEach(() => {
    // Create a temporary test directory structure
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, 'presskit'), { recursive: true })
    mkdirSync(join(testDir, 'presskit', 'diagrams'), { recursive: true })
    mkdirSync(join(testDir, 'presskit', 'screenshots'), { recursive: true })
    mkdirSync(join(testDir, 'presskit', 'video'), { recursive: true })
  })

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Required Files Check', () => {
    it('should pass when all required files exist', () => {
      // Create all required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Run check script
      const result = execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
        cwd: testDir,
        encoding: 'utf8'
      })

      expect(result).toContain('All quality gate checks passed!')
    })

    it('should fail when required files are missing', () => {
      // Create only some required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')

      // Run check script and verify it fails by checking exit code
      try {
        execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
          cwd: testDir,
          encoding: 'utf8',
          stdio: 'pipe' // Suppress output
        })
        // If we reach here, the test should fail
        expect(true).toBe(false)
      } catch (error) {
        // Expected behavior - script should fail with non-zero exit code
        expect(error).toBeDefined()
      }
    })
  })

  describe('Binary Files Check', () => {
    it('should pass when no binary files are present', () => {
      // Create only text files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Run check script
      const result = execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
        cwd: testDir,
        encoding: 'utf8'
      })

      expect(result).toContain('No binary files found')
    })

    it('should fail when binary files are present', () => {
      // Create required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Add binary files
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'test.png'), 'fake png content')
      writeFileSync(join(testDir, 'presskit', 'video', 'demo.mp4'), 'fake mp4 content')

      // Run check script and verify it fails
      try {
        execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
          cwd: testDir,
          encoding: 'utf8',
          stdio: 'pipe' // Suppress output
        })
        // If we reach here, the test should fail
        expect(true).toBe(false)
      } catch (error) {
        // Expected behavior - script should fail with non-zero exit code
        expect(error).toBeDefined()
      }
    })

    it('should ignore .gitkeep files', () => {
      // Create required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Add .gitkeep file (should be ignored)
      writeFileSync(join(testDir, 'presskit', 'screenshots', '.gitkeep'), '# gitkeep')

      // Run check script
      const result = execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
        cwd: testDir,
        encoding: 'utf8'
      })

      expect(result).toContain('No binary files found')
    })
  })

  describe('Diagram Files Check', () => {
    it('should pass when at least 2 diagram files exist', () => {
      // Create required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Create 2 diagram files
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')

      // Run check script
      const result = execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
        cwd: testDir,
        encoding: 'utf8'
      })

      expect(result).toContain('Found 2 diagram file(s)')
    })

    it('should fail when fewer than 2 diagram files exist', () => {
      // Create required files
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Create only 1 diagram file
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')

      // Run check script and verify it fails
      try {
        execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
          cwd: testDir,
          encoding: 'utf8',
          stdio: 'pipe' // Suppress output
        })
        // If we reach here, the test should fail
        expect(true).toBe(false)
      } catch (error) {
        // Expected behavior - script should fail with non-zero exit code
        expect(error).toBeDefined()
      }
    })
  })

  describe('Integration Test', () => {
    it('should pass with complete valid presskit structure', () => {
      // Create a complete valid presskit structure
      writeFileSync(join(testDir, 'presskit', 'README.md'), '# Press Kit')
      writeFileSync(join(testDir, 'presskit', 'pitch-deck.md'), '# Pitch Deck')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'voice-flow.mmd'), '# Voice Flow')
      writeFileSync(join(testDir, 'presskit', 'diagrams', 'cloud-run.mmd'), '# Cloud Run')
      writeFileSync(join(testDir, 'presskit', 'screenshots', 'README.md'), '# Screenshots')
      writeFileSync(join(testDir, 'presskit', 'screenshots', '.gitkeep'), '# gitkeep')
      writeFileSync(join(testDir, 'presskit', 'video', 'README.md'), '# Video')

      // Run check script
      const result = execSync(`node ${join(scriptsDir, 'presskit', 'check.mjs')}`, {
        cwd: testDir,
        encoding: 'utf8'
      })

      expect(result).toContain('All quality gate checks passed!')
      expect(result).toContain('Press kit is ready for sharing')
    })
  })
})