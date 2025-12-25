#!/usr/bin/env tsx

/**
 * English-Only Audit Script
 * 
 * Scans judge-visible text files for CJK characters and reports violations.
 * This ensures all user-facing UI and documentation is in English.
 * 
 * Allowed directories (bilingual content):
 * - data/demo-lessons/ - Bilingual lesson content with English defaults
 * - lib/lessonarcade/voice/ - Conditional bilingual voice narration
 * - test/ - Test data for bilingual functionality
 * 
 * Scanned directories (must be English-only):
 * - app/ - UI routes and pages
 * - components/ - Rendered UI components
 * - docs/ - Documentation
 * - README.md - Project readme
 * 
 * Usage:
 *   tsx scripts/audit-english.ts                    # Scan repo root
 *   tsx scripts/audit-english.ts --root /path/to/dir # Scan custom directory
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Parse command line arguments
const args = process.argv.slice(2)
let repoRoot = join(__dirname, '..') // Default to repo root

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--root' && args[i + 1]) {
    repoRoot = args[i + 1]
    i++ // Skip the next argument
  }
}

/**
 * Check if a string contains CJK characters
 * Uses explicit character ranges for Chinese, Japanese, and Korean
 */
function containsCJK(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    
    // CJK Unified Ideographs (Chinese, Japanese, Korean)
    if (charCode >= 0x4E00 && charCode <= 0x9FFF) return true
    // CJK Extensions A
    if (charCode >= 0x3400 && charCode <= 0x4DBF) return true
    // CJK Extensions B
    if (charCode >= 0x20000 && charCode <= 0x2A6DF) return true
    // CJK Compatibility Ideographs
    if (charCode >= 0xF900 && charCode <= 0xFAFF) return true
    // Hangul Syllables (Korean)
    if (charCode >= 0xAC00 && charCode <= 0xD7AF) return true
    // Hiragana (Japanese)
    if (charCode >= 0x3040 && charCode <= 0x309F) return true
    // Katakana (Japanese)
    if (charCode >= 0x30A0 && charCode <= 0x30FF) return true
    // CJK Unified Ideographs Extension F
    if (charCode >= 0x2F800 && charCode <= 0x2FA1F) return true
  }
  return false
}

// Directories to scan for CJK characters (must be English-only)
const SCAN_DIRECTORIES = [
  'app',
  'components',
  'docs',
]

// Files to scan individually
const SCAN_FILES = [
  'README.md',
]

// Directories to skip (allowed bilingual content)
const ALLOWLIST_DIRECTORIES = [
  'data/demo-lessons',
  'lib/lessonarcade/voice',
  'test',
]

// File extensions to scan
const SCAN_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.md',
  '.json',
  '.mjs',
  '.cjs',
]

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red)
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green)
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue)
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow)
}

/**
 * Check if a path should be skipped based on allowlist
 */
function shouldSkipPath(filePath: string): boolean {
  const relativePath = relative(repoRoot, filePath)
  
  for (const allowedDir of ALLOWLIST_DIRECTORIES) {
    if (relativePath.startsWith(allowedDir)) {
      return true
    }
  }
  
  return false
}

/**
 * Check if a file should be scanned based on extension
 */
function shouldScanFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()
  if (!ext) return false
  return SCAN_EXTENSIONS.includes(`.${ext.toLowerCase()}`)
}

/**
 * Get all files recursively in a directory
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!existsSync(dir)) {
    return fileList
  }

  const files = readdirSync(dir)
  files.forEach(file => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else if (shouldScanFile(filePath) && !shouldSkipPath(filePath)) {
      fileList.push(filePath)
    }
  })

  return fileList
}

/**
 * Scan a file for CJK characters
 */
function scanFile(filePath: string): Array<{ line: number, snippet: string }> {
  const violations: Array<{ line: number, snippet: string }> = []
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      if (containsCJK(line)) {
        violations.push({
          line: index + 1,
          snippet: line.trim().substring(0, 80) + (line.length > 80 ? '...' : '')
        })
      }
    })
  } catch {
    logWarning(`Failed to read file: ${filePath}`)
  }
  
  return violations
}

/**
 * Run the audit
 */
function runAudit(): boolean {
  logInfo('Running English-only audit...\n')
  
  const allViolations: Array<{ file: string, line: number, snippet: string }> = []
  
  // Scan directories
  for (const dir of SCAN_DIRECTORIES) {
    const dirPath = join(repoRoot, dir)
    if (existsSync(dirPath)) {
      logInfo(`Scanning directory: ${dir}/`)
      const files = getAllFiles(dirPath)
      
      for (const file of files) {
        const violations = scanFile(file)
        violations.forEach(v => {
          allViolations.push({
            file: relative(repoRoot, file),
            line: v.line,
            snippet: v.snippet
          })
        })
      }
    } else {
      logWarning(`Directory not found: ${dir}/`)
    }
  }
  
  // Scan individual files
  for (const file of SCAN_FILES) {
    const filePath = join(repoRoot, file)
    if (existsSync(filePath)) {
      logInfo(`Scanning file: ${file}`)
      const violations = scanFile(filePath)
      violations.forEach(v => {
        allViolations.push({
          file: file,
          line: v.line,
          snippet: v.snippet
        })
      })
    } else {
      logWarning(`File not found: ${file}`)
    }
  }
  
  console.log()
  
  // Report results
  if (allViolations.length === 0) {
    logSuccess('No CJK characters found in judge-visible paths.')
    logInfo('All scanned files are English-only.')
    return true
  } else {
    logError(`Found ${allViolations.length} violation(s) in judge-visible paths:\n`)
    
    // Group violations by file
    const violationsByFile: Record<string, typeof allViolations> = {}
    allViolations.forEach(v => {
      if (!violationsByFile[v.file]) {
        violationsByFile[v.file] = []
      }
      violationsByFile[v.file].push(v)
    })
    
    // Print violations
    Object.entries(violationsByFile).forEach(([file, violations]) => {
      log(`\n${file}:`, colors.cyan)
      violations.forEach(v => {
        log(`  Line ${v.line}: ${v.snippet}`, colors.red)
      })
    })
    
    console.log()
    logError('Audit failed! Please replace CJK characters with English.')
    logInfo('Allowed bilingual content directories: ' + ALLOWLIST_DIRECTORIES.join(', '))
    return false
  }
}

// Run audit if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runAudit()
  process.exit(success ? 0 : 1)
}

// Export for use in tests
export { runAudit, containsCJK, shouldSkipPath, shouldScanFile, scanFile }
