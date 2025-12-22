#!/usr/bin/env node

/**
 * Press Kit Quality Gate
 * 
 * Verifies that press kit directory contains all required files
 * and that no binary files have been accidentally committed.
 */

import { readdirSync, statSync, existsSync } from 'fs'
import { join, relative, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '../..')
const presskitDir = join(repoRoot, 'presskit')

// Configuration
const REQUIRED_FILES = [
  'presskit/README.md',
  'presskit/pitch-deck.md',
  'presskit/diagrams/',
  'presskit/screenshots/README.md',
  'presskit/video/README.md'
]

const BINARY_EXTENSIONS = [
  '.mp4', '.mov', '.avi', '.mkv',  // Video files
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',  // Image files
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',  // Documents
  '.zip', '.tar', '.gz', '.rar',  // Archives
  '.exe', '.dmg', '.pkg', '.deb', '.rpm',  // Executables
  '.ttf', '.otf', '.woff', '.woff2'  // Fonts
]

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green)
}

function logError(message) {
  log(`✗ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow)
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue)
}

/**
 * Check if a file or directory exists
 */
function pathExists(path) {
  try {
    return existsSync(path)
  } catch {
    return false
  }
}

/**
 * Get all files recursively in a directory
 */
function getAllFiles(dir, fileList = []) {
  if (!pathExists(dir)) {
    return fileList
  }

  const files = readdirSync(dir)
  files.forEach(file => {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  })

  return fileList
}

/**
 * Check if a file has a binary extension
 */
function isBinaryFile(filePath) {
  const ext = extname(filePath).toLowerCase()
  return BINARY_EXTENSIONS.includes(ext)
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  logInfo('Checking required files...')
  let allRequired = true

  REQUIRED_FILES.forEach(requiredPath => {
    const fullPath = join(repoRoot, requiredPath)

    if (requiredPath.endsWith('/')) {
      // Check if directory exists
      if (pathExists(fullPath)) {
        logSuccess(`Directory exists: ${requiredPath}`)
      } else {
        logError(`Directory missing: ${requiredPath}`)
        allRequired = false
      }
    } else {
      // Check if file exists
      if (pathExists(fullPath)) {
        logSuccess(`File exists: ${requiredPath}`)
      } else {
        logError(`File missing: ${requiredPath}`)
        allRequired = false
      }
    }
  })

  return allRequired
}

/**
 * Check for binary files in presskit directory
 */
function checkBinaryFiles() {
  logInfo('Checking for binary files...')
  const allFiles = getAllFiles(presskitDir)
  const binaryFiles = allFiles.filter(file => isBinaryFile(file))

  // Skip .gitkeep files
  const filteredBinaries = binaryFiles.filter(file =>
    !file.endsWith('.gitkeep')
  )

  if (filteredBinaries.length === 0) {
    logSuccess('No binary files found in presskit directory')
    return true
  } else {
    logError(`Found ${filteredBinaries.length} binary file(s) in presskit directory:`)
    filteredBinaries.forEach(file => {
      const relativePath = relative(repoRoot, file)
      logError(`  - ${relativePath}`)
    })
    logWarning('Binary files should not be committed to repository')
    return false
  }
}

/**
 * Check if diagrams directory has at least 2 diagram files
 */
function checkDiagramFiles() {
  logInfo('Checking diagram files...')
  const diagramsDir = join(presskitDir, 'diagrams')

  if (!pathExists(diagramsDir)) {
    logError('Diagrams directory does not exist')
    return false
  }

  const diagramFiles = getAllFiles(diagramsDir).filter(file =>
    file.endsWith('.mmd') || file.endsWith('.md')
  )

  if (diagramFiles.length >= 2) {
    logSuccess(`Found ${diagramFiles.length} diagram file(s)`)
    diagramFiles.forEach(file => {
      const relativePath = relative(repoRoot, file)
      logSuccess(`  - ${relativePath}`)
    })
    return true
  } else {
    logError(`Expected at least 2 diagram files, found ${diagramFiles.length}`)
    return false
  }
}

/**
 * Main check function
 */
function runChecks() {
  logInfo('Running Press Kit Quality Gate...\n')

  const requiredFilesCheck = checkRequiredFiles()
  console.log()

  const binaryFilesCheck = checkBinaryFiles()
  console.log()

  const diagramFilesCheck = checkDiagramFiles()
  console.log()

  // Summary
  logInfo('Quality Gate Summary:')
  log(`Required Files: ${requiredFilesCheck ? 'PASS' : 'FAIL'}`, requiredFilesCheck ? colors.green : colors.red)
  log(`Binary Files: ${binaryFilesCheck ? 'PASS' : 'FAIL'}`, binaryFilesCheck ? colors.green : colors.red)
  log(`Diagram Files: ${diagramFilesCheck ? 'PASS' : 'FAIL'}`, diagramFilesCheck ? colors.green : colors.red)
  console.log()

  const allChecksPass = requiredFilesCheck && binaryFilesCheck && diagramFilesCheck

  if (allChecksPass) {
    logSuccess('All quality gate checks passed! ✓')
    logInfo('Press kit is ready for sharing.')
  } else {
    logError('Quality gate checks failed! ✗')
    logWarning('Please fix issues above before sharing press kit.')
  }

  console.log()

  return allChecksPass
}

// Run checks if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runChecks()
  process.exit(success ? 0 : 1)
}

// Export for use in tests
export {
  checkRequiredFiles,
  checkBinaryFiles,
  checkDiagramFiles,
  runChecks
}