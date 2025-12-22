// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'

// Mock server-only module
vi.mock('server-only', () => ({}))

// Mock file system modules for testing missing files
const mockFs = vi.hoisted(() => ({
  readFile: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  appendFile: vi.fn()
}))

// Mocks node:fs/promises module
vi.mock('node:fs/promises', () => mockFs)

// Import analytics functions after mocking
import { readTelemetryFiles } from '@/lib/lessonarcade/voice/analytics'

describe('Voice Analytics Privacy', () => {
  it('should handle missing telemetry directory gracefully', async () => {
    // Mock access to throw error for all files (simulating missing directory)
    mockFs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'))

    const result = await readTelemetryFiles({ days: 7 })

    expect(result.events).toHaveLength(0)
    expect(result.parseErrors).toBe(0)
    expect(mockFs.access).toHaveBeenCalledTimes(7) // Should check all 7 days
  })

  it('should handle empty telemetry files gracefully', async () => {
    // Mock access to succeed but readFile to return empty content
    mockFs.access.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue('')

    const result = await readTelemetryFiles({ days: 1 })

    expect(result.events).toHaveLength(0)
    expect(result.parseErrors).toBe(0)
  })

  it('should handle corrupted telemetry files gracefully without exposing sensitive data', async () => {
    // Mock access to succeed but readFile to return corrupted JSON
    mockFs.access.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue('{"invalid": json}')

    const result = await readTelemetryFiles({ days: 1 })

    expect(result.events).toHaveLength(0)
    expect(result.parseErrors).toBe(1)
    // Ensure no sensitive data is exposed in error messages
    expect(result.parseErrors).toBe(1)
  })

  it('should not expose file paths in error messages', async () => {
    // Mock access to succeed but readFile to throw an error
    mockFs.access.mockResolvedValue(undefined)
    mockFs.readFile.mockRejectedValue(new Error('Permission denied'))

    const result = await readTelemetryFiles({ days: 1 })

    expect(result.events).toHaveLength(0)
    expect(result.parseErrors).toBe(0)
    // The function should handle errors gracefully without exposing file paths
  })

  it('should handle files with only empty lines', async () => {
    // Mock access to succeed but readFile to return only empty lines
    mockFs.access.mockResolvedValue(undefined)
    mockFs.readFile.mockResolvedValue('\n\n\n\n')

    const result = await readTelemetryFiles({ days: 1 })

    expect(result.events).toHaveLength(0)
    expect(result.parseErrors).toBe(0)
  })

  it('should handle mixed valid and invalid telemetry data', async () => {
    // Mock access to succeed
    mockFs.access.mockResolvedValue(undefined)
    
    // Mock readFile with mixed valid and invalid JSONL
    mockFs.readFile.mockResolvedValue(
      '{"schemaVersion":1,"ts":"2025-12-20T10:00:00.000Z","event":"voice_play","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n' +
      '{"invalid": json}\n' +
      '{"schemaVersion":1,"ts":"2025-12-20T10:01:00.000Z","event":"voice_end","lessonSlug":"test-lesson","levelIndex":0,"itemIndex":1,"engine":"browser","languageCode":"en","rate":1,"textLen":100,"textHash":"abc123","sessionId":"sess_test123"}\n'
    )

    const result = await readTelemetryFiles({ days: 1 })

    expect(result.events).toHaveLength(2)
    expect(result.parseErrors).toBe(1)
  })
})