import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  getAvailablePresets, 
  resolvePreset, 
  validateVoiceId,
  getDefaultVoiceId,
  getAllVoiceIds,
  clearCache
} from '@/lib/lessonarcade/voice/preset-registry'

// Store original environment
const originalEnv = { ...process.env }

describe('Voice Preset Registry', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache()
  })

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv }
    clearCache()
  })

  describe('Preset Discovery', () => {
    it('should discover all configured presets', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'Adam',
        ELEVENLABS_VOICE_ID_ZH: 'Zhao',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
        VOICE_TTS_VOICE_ID_EN_NARRATOR: 'Lily',
        VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li',
        VOICE_TTS_VOICE_ID_ZH_NARRATOR: 'Mei'
      }
      
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
        NODE_ENV: 'test',
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
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'Adam',
        ELEVENLABS_VOICE_ID_ZH: 'Zhao',
        VOICE_TTS_VOICE_ID_INVALID: 'Voice1',
        VOICE_TTS_VOICE_ID_EN_: 'Voice2',
        VOICE_TTS_VOICE_ID__INSTRUCTOR: 'Voice3'
      }
      
      const presets = getAvailablePresets()
      // Should still only find valid presets (none in this case)
      expect(presets).toHaveLength(0)
    })

    it('should generate correct labels for English presets', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
        VOICE_TTS_VOICE_ID_EN_NARRATOR: 'Lily'
      }
      
      const presets = getAvailablePresets()
      const instructorPreset = presets.find(p => p.presetKey === 'en_instructor')
      const narratorPreset = presets.find(p => p.presetKey === 'en_narrator')
      
      expect(instructorPreset?.label).toBe('Instructor Voice')
      expect(narratorPreset?.label).toBe('Narrator Voice')
    })

    it('should generate correct labels for Chinese presets', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li',
        VOICE_TTS_VOICE_ID_ZH_NARRATOR: 'Mei'
      }
      
      const presets = getAvailablePresets()
      const instructorPreset = presets.find(p => p.presetKey === 'zh_instructor')
      const narratorPreset = presets.find(p => p.presetKey === 'zh_narrator')
      
      expect(instructorPreset?.label).toBe('中文講師')
      expect(narratorPreset?.label).toBe('中文旁白')
    })
  })

  describe('Preset Resolution', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
        VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li'
      }
    })

    it('should resolve valid presets', () => {
      const result = resolvePreset('en_instructor')
      expect(result).toEqual({
        voiceId: 'Sam',
        languageCode: 'en'
      })
    })

    it('should resolve Chinese presets', () => {
      const result = resolvePreset('zh_instructor')
      expect(result).toEqual({
        voiceId: 'Li',
        languageCode: 'zh'
      })
    })

    it('should return null for invalid presets', () => {
      const result = resolvePreset('invalid_preset')
      expect(result).toBeNull()
    })

    it('should return null for empty preset key', () => {
      const result = resolvePreset('')
      expect(result).toBeNull()
    })
  })

  describe('Voice ID Validation', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'Adam',
        ELEVENLABS_VOICE_ID_ZH: 'Zhao',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
        VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li'
      }
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

    it('should reject null or undefined voice IDs', () => {
      expect(validateVoiceId(null as unknown as string)).toBe(false)
      expect(validateVoiceId(undefined as unknown as string)).toBe(false)
    })
  })

  describe('Default Voice IDs', () => {
    it('should return English default voice from environment', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'CustomAdam'
      }
      
      expect(getDefaultVoiceId('en')).toBe('CustomAdam')
    })

    it('should return Chinese default voice from environment', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_ZH: 'CustomZhao'
      }
      
      expect(getDefaultVoiceId('zh')).toBe('CustomZhao')
    })

    it('should use hardcoded fallback when no default configured', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test'
      } // No default voices
      
      expect(getDefaultVoiceId('en')).toBe('Adam')
      expect(getDefaultVoiceId('zh')).toBe('Zhao')
    })
  })

  describe('All Voice IDs Collection', () => {
    it('should collect all valid voice IDs', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'Adam',
        ELEVENLABS_VOICE_ID_ZH: 'Zhao',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam',
        VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: 'Li'
      }
      
      const allVoiceIds = getAllVoiceIds()
      expect(allVoiceIds).toEqual(new Set(['Adam', 'Zhao', 'Sam', 'Li']))
    })

    it('should include hardcoded fallbacks', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test'
      } // No environment variables
      
      const allVoiceIds = getAllVoiceIds()
      expect(allVoiceIds.has('Adam')).toBe(true)
      expect(allVoiceIds.has('Zhao')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty environment', () => {
      process.env = {
        NODE_ENV: 'test'
      }
      
      expect(getAvailablePresets()).toHaveLength(0)
      expect(resolvePreset('en_instructor')).toBeNull()
      // Hardcoded fallbacks are always considered valid for security
      expect(validateVoiceId('Adam')).toBe(true)
    })

    it('should handle duplicate voice IDs', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        ELEVENLABS_VOICE_ID_EN: 'Adam',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Adam' // Same ID
      }
      
      const allVoiceIds = getAllVoiceIds()
      expect(allVoiceIds.has('Adam')).toBe(true)
      expect(validateVoiceId('Adam')).toBe(true)
    })

    it('should cache results for performance', () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: 'Sam'
      }
      
      // First call should populate cache
      const presets1 = getAvailablePresets()
      
      // Second call should use cache
      const presets2 = getAvailablePresets()
      
      expect(presets1).toEqual(presets2)
      expect(presets1).toHaveLength(1)
    })
  })
})