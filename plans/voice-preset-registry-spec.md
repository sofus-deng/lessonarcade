# Voice Preset Registry Specification

## Module Overview
The voice preset registry is responsible for managing AI voice presets, resolving preset keys to voice IDs, and validating voice IDs against allowed presets.

## File Location
`lib/lessonarcade/voice/preset-registry.ts`

## Interfaces

```typescript
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
```

## Environment Variable Pattern

### Default Voices (Backward Compatibility)
- `ELEVENLABS_VOICE_ID_EN` - Default English voice
- `ELEVENLABS_VOICE_ID_ZH` - Default Chinese voice

### Preset Voices
Pattern: `VOICE_TTS_VOICE_ID_{LANG}_{ROLE}`
- `{LANG}`: EN or ZH
- `{ROLE}`: INSTRUCTOR, NARRATOR, etc.

Examples:
- `VOICE_TTS_VOICE_ID_EN_INSTRUCTOR`
- `VOICE_TTS_VOICE_ID_EN_NARRATOR`
- `VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR`
- `VOICE_TTS_VOICE_ID_ZH_NARRATOR`

## Core Functions

### `getAvailablePresets(): AvailablePreset[]`
Returns a list of available presets for the client UI (sanitized, no voiceIds).

### `resolvePreset(presetKey: string): PresetResolutionResult | null`
Resolves a preset key to its voice ID and language code.

### `validateVoiceId(voiceId: string): boolean`
Validates if a voice ID is in the allowed set (from environment variables).

### `getDefaultVoiceId(languageCode: 'en' | 'zh'): string`
Returns the default voice ID for a language (from backward compatibility variables).

### `getAllVoiceIds(): string[]`
Returns all valid voice IDs for validation.

## Implementation Details

### Preset Discovery
1. Scan all environment variables matching the preset pattern
2. Parse preset key from variable name
3. Extract language code and role
4. Generate human-readable label

### Label Generation Rules
- English presets: "{Role} Voice" (e.g., "Instructor Voice")
- Chinese presets: "中文{Role}" (e.g., "中文讲师")

### Fallback Strategy
1. If preset not found, return null
2. If default voice requested but not configured, use hardcoded fallback
3. Maintain backward compatibility with existing voice ID usage

## Error Handling

### Missing Environment Variables
- Log warning for missing default voice IDs
- Continue with available presets only
- Don't fail if no presets configured

### Invalid Preset Keys
- Return null for unknown presets
- Log debug message
- Allow API to handle validation error

### Malformed Environment Variables
- Skip variables that don't match pattern
- Log warning for malformed names
- Continue with valid presets

## Caching Strategy
- Cache resolved presets at module load time
- No runtime environment variable changes supported
- Cache invalidation not needed (server restart required)

## Usage Examples

### Getting Available Presets
```typescript
const presets = getAvailablePresets()
// Returns: [
//   { presetKey: "en_instructor", label: "Instructor Voice", languageCode: "en" },
//   { presetKey: "zh_instructor", label: "中文讲师", languageCode: "zh" }
// ]
```

### Resolving a Preset
```typescript
const result = resolvePreset("en_instructor")
// Returns: { voiceId: "Adam", languageCode: "en" }
```

### Validating a Voice ID
```typescript
const isValid = validateVoiceId("Adam")
// Returns: true if Adam is in allowed set
```

## Testing Strategy

### Unit Tests
1. Test preset discovery from environment variables
2. Test preset resolution with valid keys
3. Test preset resolution with invalid keys
4. Test voice ID validation
5. Test backward compatibility
6. Test error handling

### Mock Environment
```typescript
// Test setup
const originalEnv = process.env
process.env = {
  ...originalEnv,
  ELEVENLABS_VOICE_ID_EN: "Adam",
  ELEVENLABS_VOICE_ID_ZH: "Zhao",
  VOICE_TTS_VOICE_ID_EN_INSTRUCTOR: "Sam",
  VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR: "Li"
}
```

## Performance Considerations
- Minimal overhead: O(1) for all operations
- Environment variables read once at module load
- No external dependencies
- Memory efficient: small preset registry

## Security Considerations
- Never expose raw voice IDs in client-facing responses
- Validate all voice IDs server-side
- Sanitize all environment variable inputs
- No injection vulnerabilities (environment variables are trusted)