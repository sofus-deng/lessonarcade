/**
 * Voice Preset Registry
 * 
 * Manages AI voice presets, resolving preset keys to voice IDs,
 * and validating voice IDs against allowed presets.
 */

export interface VoicePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
  voiceId: string
}

export interface AvailablePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
}

export interface PresetResolutionResult {
  voiceId: string
  languageCode: 'en' | 'zh'
}

// Cache for resolved presets
let cachedPresets: VoicePreset[] | null = null
let cachedAvailablePresets: AvailablePreset[] | null = null
let cachedAllVoiceIds: Set<string> | null = null

/**
 * Discovers and parses voice presets from environment variables
 * Environment variable pattern: VOICE_TTS_VOICE_ID_{LANG}_{ROLE}
 * Example: VOICE_TTS_VOICE_ID_EN_INSTRUCTOR=Adam
 */
function discoverPresets(): VoicePreset[] {
  const presets: VoicePreset[] = []
  
  // Scan environment variables for preset pattern
  for (const [key, value] of Object.entries(process.env)) {
    const match = key.match(/^VOICE_TTS_VOICE_ID_(EN|ZH)_(.+)$/i)
    if (match && value) {
      const [, lang, role] = match
      const languageCode = lang.toLowerCase() as 'en' | 'zh'
      const presetKey = `${languageCode}_${role.toLowerCase()}`
      
      // Generate human-readable label
      let label: string
      if (languageCode === 'en') {
        // Convert role to title case: INSTRUCTOR -> Instructor
        label = `${role.charAt(0) + role.slice(1).toLowerCase()} Voice`
      } else {
        // English role labels for Chinese presets
        const roleLabels: Record<string, string> = {
          'INSTRUCTOR': 'Instructor',
          'NARRATOR': 'Narrator',
          'TEACHER': 'Teacher',
          'STORYTELLER': 'Storyteller'
        }
        label = `Chinese ${roleLabels[role.toUpperCase()] || role}`
      }
      
      presets.push({
        presetKey,
        label,
        languageCode,
        voiceId: value
      })
    }
  }
  
  return presets
}

/**
 * Get all available voice presets for client UI
 * Returns sanitized list without voice IDs
 */
export function getAvailablePresets(): AvailablePreset[] {
  if (cachedAvailablePresets === null) {
    const presets = discoverPresets()
    cachedAvailablePresets = presets.map(({ presetKey, label, languageCode }) => ({
      presetKey,
      label,
      languageCode
    }))
  }
  return cachedAvailablePresets
}

/**
 * Resolve a preset key to its voice ID and language code
 */
export function resolvePreset(presetKey: string): PresetResolutionResult | null {
  if (cachedPresets === null) {
    cachedPresets = discoverPresets()
  }
  
  const preset = cachedPresets.find(p => p.presetKey === presetKey)
  if (!preset) {
    return null
  }
  
  return {
    voiceId: preset.voiceId,
    languageCode: preset.languageCode
  }
}

/**
 * Validate if a voice ID is in the allowed set
 * Only validates against explicitly configured voice IDs or hardcoded fallbacks
 */
export function validateVoiceId(voiceId: string): boolean {
  if (!voiceId) return false
  
  // Check if it's a hardcoded fallback
  if (voiceId === 'Adam' || voiceId === 'Zhao') {
    return true
  }
  
  // Check if it's from environment variables
  const defaultEn = process.env.ELEVENLABS_VOICE_ID_EN
  const defaultZh = process.env.ELEVENLABS_VOICE_ID_ZH
  
  if (voiceId === defaultEn || voiceId === defaultZh) {
    return true
  }
  
  // Check if it's from presets
  if (cachedPresets === null) {
    cachedPresets = discoverPresets()
  }
  
  return cachedPresets.some(preset => preset.voiceId === voiceId)
}

/**
 * Get default voice ID for a language
 * Falls back to environment variables or hardcoded defaults
 */
export function getDefaultVoiceId(languageCode: 'en' | 'zh'): string {
  // Try environment variable first
  const envVar = languageCode === 'en' 
    ? process.env.ELEVENLABS_VOICE_ID_EN 
    : process.env.ELEVENLABS_VOICE_ID_ZH
  
  if (envVar) {
    return envVar
  }
  
  // Hardcoded fallbacks
  return languageCode === 'en' ? 'Adam' : 'Zhao'
}

/**
 * Get all valid voice IDs for validation
 */
export function getAllVoiceIds(): Set<string> {
  if (cachedAllVoiceIds === null) {
    const voiceIds = new Set<string>()
    
    // Add preset voice IDs
    if (cachedPresets === null) {
      cachedPresets = discoverPresets()
    }
    cachedPresets.forEach(preset => {
      voiceIds.add(preset.voiceId)
    })
    
    // Add default voice IDs from environment
    const defaultEn = process.env.ELEVENLABS_VOICE_ID_EN
    const defaultZh = process.env.ELEVENLABS_VOICE_ID_ZH
    
    if (defaultEn) voiceIds.add(defaultEn)
    if (defaultZh) voiceIds.add(defaultZh)
    
    // Always include hardcoded fallbacks
    voiceIds.add('Adam')
    voiceIds.add('Zhao')
    
    cachedAllVoiceIds = voiceIds
  }
  return cachedAllVoiceIds
}

/**
 * Clear all caches (useful for testing)
 */
export function clearCache(): void {
  cachedPresets = null
  cachedAvailablePresets = null
  cachedAllVoiceIds = null
}
