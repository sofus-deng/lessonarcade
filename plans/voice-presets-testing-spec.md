# Voice Presets Testing Specification

## Overview
This document outlines the comprehensive testing strategy for the voice presets feature, including unit tests, integration tests, and end-to-end tests.

## Test Structure

### File Organization
```
test/
├── voice/
│   ├── presets.test.ts          # Main test file for preset functionality
│   ├── build-script.test.ts     # Existing tests (no changes)
│   └── chunk-text.test.ts       # Existing tests (no changes)
└── setup.ts                     # Existing test setup
```

## Unit Tests

### Test File: `test/voice/presets.test.ts`

#### Test Setup
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  getAvailablePresets, 
  resolvePreset, 
  validateVoiceId,
  getDefaultVoiceId,
  getAllVoiceIds
} from '@/lib/lessonarcade/voice/preset-registry'

// Store original environment
const originalEnv = process.env

// Mock environment variables for testing
const mockEnv = {
  ELEVENLABS_VOICE_ID_EN: 'Adam',
  ELEVENLABS_VOICE_ID_ZH: 'Zhao',
  VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
  VOICE_TTS_VOICE_ID_EN_NARRATOR: 'Lily',
  VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li',
  VOICE_TTS_VOICE_ID_ZH_NARRATOR: 'Mei'
}
```

#### Test Cases

##### 1. Preset Discovery Tests
```typescript
describe('Preset Discovery', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, ...mockEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should discover all configured presets', () => {
    const presets = getAvailablePresets()
    expect(presets).toHaveLength(4)
    expect(presets.map(p => p.presetKey)).toEqual([
      'en_instructor',
      'en_narrator',
      'zh_instructor',
      'zh_narrator'
    ])
  })

  it('should handle missing preset variables', () => {
    process.env = {
      ...originalEnv,
      ELEVENLABS_VOICE_ID_EN: 'Adam',
      ELEVENLABS_VOICE_ID_ZH: 'Zhao'
      // No preset variables
    }
    
    const presets = getAvailablePresets()
    expect(presets).toHaveLength(0)
  })

  it('should ignore malformed environment variables', () => {
    process.env = {
      ...originalEnv,
      ...mockEnv,
      'VOICE_TTS_VOICE_ID_INVALID': 'Voice1',
      'VOICE_TTS_VOICE_ID_EN_': 'Voice2',
      'VOICE_TTS_VOICE_ID__INSTRUCTOR': 'Voice3'
    }
    
    const presets = getAvailablePresets()
    // Should still only find valid presets
    expect(presets).toHaveLength(4)
  })
})
```

##### 2. Preset Resolution Tests
```typescript
describe('Preset Resolution', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, ...mockEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should resolve valid presets', () => {
    const result = resolvePreset('en_instructor')
    expect(result).toEqual({
      voiceId: 'Sam',
      languageCode: 'en'
    })
  })

  it('should return null for invalid presets', () => {
    const result = resolvePreset('invalid_preset')
    expect(result).toBeNull()
  })

  it('should resolve Chinese presets', () => {
    const result = resolvePreset('zh_narrator')
    expect(result).toEqual({
      voiceId: 'Mei',
      languageCode: 'zh'
    })
  })
})
```

##### 3. Voice ID Validation Tests
```typescript
describe('Voice ID Validation', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, ...mockEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should validate voice IDs from presets', () => {
    expect(validateVoiceId('Sam')).toBe(true)
    expect(validateVoiceId('Li')).toBe(true)
  })

  it('should validate default voice IDs', () => {
    expect(validateVoiceId('Adam')).toBe(true)
    expect(validateVoiceId('Zhao')).toBe(true)
  })

  it('should reject unknown voice IDs', () => {
    expect(validateVoiceId('Unknown')).toBe(false)
    expect(validateVoiceId('')).toBe(false)
  })
})
```

##### 4. Default Voice Tests
```typescript
describe('Default Voice IDs', () => {
  it('should return English default voice', () => {
    process.env = { ...originalEnv, ELEVENLABS_VOICE_ID_EN: 'Adam' }
    expect(getDefaultVoiceId('en')).toBe('Adam')
  })

  it('should return Chinese default voice', () => {
    process.env = { ...originalEnv, ELEVENLABS_VOICE_ID_ZH: 'Zhao' }
    expect(getDefaultVoiceId('zh')).toBe('Zhao')
  })

  it('should use hardcoded fallback when no default configured', () => {
    process.env = originalEnv // No default voices
    expect(getDefaultVoiceId('en')).toBe('Adam')
    expect(getDefaultVoiceId('zh')).toBe('Zhao')
  })
})
```

##### 5. Edge Cases Tests
```typescript
describe('Edge Cases', () => {
  it('should handle empty environment', () => {
    process.env = {}
    expect(getAvailablePresets()).toHaveLength(0)
    expect(resolvePreset('en_instructor')).toBeNull()
    expect(validateVoiceId('Adam')).toBe(false)
  })

  it('should handle duplicate voice IDs', () => {
    process.env = {
      ...originalEnv,
      ELEVENLABS_VOICE_ID_EN: 'Adam',
      VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Adam' // Same ID
    }
    
    expect(getAllVoiceIds()).toEqual(['Adam', 'Zhao'])
    expect(validateVoiceId('Adam')).toBe(true)
  })
})
```

## Integration Tests

### API Endpoint Tests

#### Test File: `test/api/voice/presets.test.ts` (New file)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp } from 'vue' // Adjust for Next.js

describe('/api/voice/presets', () => {
  // Mock environment variables for API tests
  beforeAll(() => {
    process.env.VOICE_TTS_VOICE_ID_EN_INSTRUCTOR = 'Sam'
    process.env.VOICE_TTS_VOICE_ID_EN_NARRATOR = 'Lily'
    process.env.VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR = 'Li'
  })

  it('should return available presets', async () => {
    const response = await fetch('/api/voice/presets')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.presets).toBeInstanceOf(Array)
    expect(data.presets[0]).toHaveProperty('presetKey')
    expect(data.presets[0]).toHaveProperty('label')
    expect(data.presets[0]).toHaveProperty('languageCode')
    expect(data.presets[0]).not.toHaveProperty('voiceId')
  })

  it('should handle empty presets', async () => {
    // Temporarily clear environment
    delete process.env.VOICE_TTS_VOICE_ID_EN_INSTRUCTOR
    
    const response = await fetch('/api/voice/presets')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.presets).toHaveLength(0)
  })
})
```

### Enhanced TTS API Tests

#### Update: `test/api/voice/tts.test.ts` (New file)

```typescript
describe('/api/voice/tts with presets', () => {
  beforeAll(() => {
    process.env.ELEVENLABS_API_KEY = 'test-key'
    process.env.VOICE_TTS_VOICE_ID_EN_INSTRUCTOR = 'Sam'
  })

  it('should accept voicePreset parameter', async () => {
    const response = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        voicePreset: 'en_instructor'
      })
    })
    
    // Mock ElevenLabs API call
    expect(response.status).toBe(200)
  })

  it('should reject invalid voicePreset', async () => {
    const response = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        voicePreset: 'invalid_preset'
      })
    })
    
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.ok).toBe(false)
    expect(data.error.code).toBe('VALIDATION')
  })

  it('should maintain backward compatibility with voiceId', async () => {
    const response = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        voiceId: 'Adam'
      })
    })
    
    expect(response.status).toBe(200)
  })
})
```

## Component Tests

### Voice Lesson Player Tests

#### Test File: `test/components/voice-lesson-player.test.ts` (New file)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoiceLessonPlayer } from '@/components/lesson/voice-lesson-player'
import { mockLesson } from '../fixtures/lesson'

// Mock fetch API
global.fetch = vi.fn()

describe('Voice Lesson Player Preset Selection', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('should fetch presets on mount with AI voice engine', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        presets: [
          { presetKey: 'en_instructor', label: 'Instructor', languageCode: 'en' }
        ]
      })
    })

    render(<VoiceLessonPlayer lesson={mockLesson} />)
    
    // Switch to AI voice
    fireEvent.click(screen.getByText('AI Voice'))
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/voice/presets')
    })
  })

  it('should display preset selector when presets available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        presets: [
          { presetKey: 'en_instructor', label: 'Instructor', languageCode: 'en' },
          { presetKey: 'en_narrator', label: 'Narrator', languageCode: 'en' }
        ]
      })
    })

    render(<VoiceLessonPlayer lesson={mockLesson} />)
    
    // Switch to AI voice
    fireEvent.click(screen.getByText('AI Voice'))
    
    await waitFor(() => {
      expect(screen.getByText('Instructor')).toBeInTheDocument()
      expect(screen.getByText('Narrator')).toBeInTheDocument()
    })
  })

  it('should persist selected preset to localStorage', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        presets: [
          { presetKey: 'en_instructor', label: 'Instructor', languageCode: 'en' }
        ]
      })
    })

    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
    
    render(<VoiceLessonPlayer lesson={mockLesson} />)
    
    // Switch to AI voice
    fireEvent.click(screen.getByText('AI Voice'))
    
    await waitFor(() => {
      expect(screen.getByText('Instructor')).toBeInTheDocument()
    })
    
    // Select preset
    fireEvent.click(screen.getByText('Instructor'))
    
    expect(localStorageSpy).toHaveBeenCalledWith('la:voicePresetKey', 'en_instructor')
  })

  it('should handle preset loading errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<VoiceLessonPlayer lesson={mockLesson} />)
    
    // Switch to AI voice
    fireEvent.click(screen.getByText('AI Voice'))
    
    await waitFor(() => {
      expect(screen.getByText(/Voice presets unavailable/)).toBeInTheDocument()
    })
  })
})
```

## End-to-End Tests

### Playwright Tests (Optional)

#### Test File: `test/e2e/voice-presets.spec.ts` (New file)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Voice Presets E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to voice lesson page
    await page.goto('/demo/voice/test-lesson')
  })

  test('should select and use voice preset', async ({ page }) => {
    // Switch to AI voice
    await page.click('[data-testid="ai-voice-button"]')
    
    // Wait for presets to load
    await page.waitForSelector('[data-testid="preset-selector"]')
    
    // Select a preset
    await page.click('[data-testid="preset-en_instructor"]')
    
    // Verify localStorage
    const presetKey = await page.evaluate(() => 
      localStorage.getItem('la:voicePresetKey')
    )
    expect(presetKey).toBe('en_instructor')
    
    // Play audio to verify preset is used
    await page.click('[data-testid="play-button"]')
    
    // Verify TTS API was called with preset
    // (This would require mocking the API in test setup)
  })

  test('should handle unavailable preset gracefully', async ({ page }) => {
    // Set an unavailable preset in localStorage
    await page.evaluate(() => {
      localStorage.setItem('la:voicePresetKey', 'unavailable_preset')
    })
    
    // Reload page
    await page.reload()
    
    // Switch to AI voice
    await page.click('[data-testid="ai-voice-button"]')
    
    // Should fall back to available preset
    await page.waitForSelector('[data-testid="preset-selector"]')
    
    // Verify a preset is selected (not the unavailable one)
    const selectedPreset = await page.locator('[data-testid*="preset-"].selected')
    expect(selectedPreset).toHaveCount(1)
  })
})
```

## Test Data Fixtures

### Test Fixtures File: `test/fixtures/lesson.ts`

```typescript
import type { LessonArcadeLesson } from '@/lib/lessonarcade/schema'

export const mockLesson: LessonArcadeLesson = {
  id: 'test-lesson',
  slug: 'test-lesson',
  title: 'Test Lesson',
  shortDescription: 'A test lesson',
  longDescription: 'A detailed test lesson description',
  estimatedDurationMinutes: 30,
  tags: ['test'],
  language: 'en',
  video: {
    provider: 'youtube',
    videoId: 'test-video-id'
  },
  levels: [
    {
      id: 'level-1',
      index: 0,
      title: 'Test Level',
      summary: 'Test level summary',
      keyPoints: ['Test point 1', 'Test point 2'],
      items: [
        {
          kind: 'multiple_choice',
          id: 'mc-item-1',
          prompt: 'Test question',
          options: [
            { id: 'a', text: 'Option A' },
            { id: 'b', text: 'Option B' }
          ],
          correctOptionIds: ['a'],
          explanation: 'Test explanation'
        }
      ]
    }
  ]
}
```

## Test Execution

### Running Tests
```bash
# Run all tests
pnpm test

# Run voice preset tests only
pnpm test test/voice/presets.test.ts

# Run tests with coverage
pnpm test --coverage

# Run E2E tests (if implemented)
pnpm test:e2e
```

### CI/CD Integration
- All tests must pass before merging
- Coverage threshold: 90% for new code
- E2E tests run on PR and main branch

## Performance Testing

### Load Testing
- Test API endpoints under load
- Verify preset resolution performance
- Check memory usage with many presets

### Benchmarking
- Measure preset resolution time (< 1ms)
- Measure API response time (< 100ms)
- Track memory usage

## Test Maintenance

### Updating Tests
- Update tests when adding new preset types
- Maintain test fixtures with lesson data
- Keep mocks in sync with API changes

### Test Documentation
- Document test scenarios
- Explain complex test setups
- Provide troubleshooting guide