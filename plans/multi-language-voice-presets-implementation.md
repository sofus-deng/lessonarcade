# Multi-Language and Multi-Voice Presets Implementation Plan

## Overview
This document outlines the implementation of server-controlled AI voice presets for the LessonArcade platform, allowing users to select from predefined voice options across different languages.

## Architecture

### 1. Voice Preset Registry (Server-Side)
Create a new module to manage voice presets that reads from environment variables:

```typescript
// lib/lessonarcade/voice/preset-registry.ts

interface VoicePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
  voiceId: string
}

interface AvailablePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
}
```

The registry will:
- Read preset configurations from environment variables
- Maintain backward compatibility with existing `ELEVENLABS_VOICE_ID_EN` and `ELEVENLABS_VOICE_ID_ZH`
- Provide methods to resolve preset keys to voice IDs
- Validate voice IDs against allowed presets

### 2. Environment Variables
Add new environment variables to `.env.example`:

```bash
# Default voice IDs (existing, for backward compatibility)
ELEVENLABS_VOICE_ID_EN=Adam
ELEVENLABS_VOICE_ID_ZH=Zhao

# Voice Presets (new)
VOICE_TTS_VOICE_ID_EN_INSTRUCTOR=Adam
VOICE_TTS_VOICE_ID_EN_NARRATOR=Sam
VOICE_TTS_VOICE_ID_ZH_INSTRUCTOR=Zhao
VOICE_TTS_VOICE_ID_ZH_NARRATOR=Li
```

Environment variable pattern: `VOICE_TTS_VOICE_ID_{LANG}_{ROLE}`
- LANG: EN or ZH
- ROLE: INSTRUCTOR, NARRATOR, etc.

### 3. API Routes

#### GET /api/voice/presets
Returns a sanitized list of available presets for the client UI:
```json
{
  "ok": true,
  "presets": [
    {
      "presetKey": "en_instructor",
      "label": "English Instructor",
      "languageCode": "en"
    },
    {
      "presetKey": "en_narrator",
      "label": "English Narrator",
      "languageCode": "en"
    },
    {
      "presetKey": "zh_instructor",
      "label": "中文讲师",
      "languageCode": "zh"
    }
  ]
}
```

#### POST /api/voice/tts (Enhanced)
Update existing route to:
1. Accept optional `voicePreset` parameter
2. Maintain backward compatibility with `voiceId` parameter
3. Resolve preset to voiceId server-side
4. Validate voiceId against allowed presets
5. Keep caching keyed by resolved voiceId

### 4. Client-Side Implementation

#### Voice Lesson Player Updates
- Add AI Voice preset selector (segmented control)
- Only show when AI Voice engine is selected
- Fetch presets from `/api/voice/presets` on mount
- Persist selected preset in localStorage (key: `la:voicePresetKey`)
- Gracefully handle unavailable presets

#### UI Component Structure
```typescript
// New state in voice-lesson-player.tsx
const [availablePresets, setAvailablePresets] = useState<AvailablePreset[]>([])
const [selectedPresetKey, setSelectedPresetKey] = useState<string>(() => {
  // Load from localStorage
})
```

### 5. Testing Strategy

#### Unit Tests (test/voice/presets.test.ts)
- Test preset resolution from environment variables
- Test unavailable presets are excluded
- Test validation rejects unknown voiceId
- Test backward compatibility with existing voice IDs

#### Integration Tests
- Test API endpoint returns correct preset list
- Test TTS endpoint resolves presets correctly
- Test UI component renders and functions correctly

## Implementation Steps

1. **Create Voice Preset Registry Module**
   - Implement `lib/lessonarcade/voice/preset-registry.ts`
   - Handle environment variable reading
   - Implement preset resolution and validation

2. **Update Environment Configuration**
   - Add new preset variables to `.env.example`
   - Document variable naming convention

3. **Create Presets API Endpoint**
   - Implement `app/api/voice/presets/route.ts`
   - Return sanitized preset list
   - Handle errors gracefully

4. **Enhance TTS API Endpoint**
   - Update `app/api/voice/tts/route.ts`
   - Add voicePreset parameter support
   - Implement preset resolution and validation
   - Maintain backward compatibility

5. **Update Voice Lesson Player**
   - Add preset fetching on mount
   - Implement segmented control for preset selection
   - Add localStorage persistence
   - Handle edge cases (unavailable presets)

6. **Create Tests**
   - Implement unit tests for preset registry
   - Add integration tests for API endpoints
   - Test UI component functionality

7. **Quality Assurance**
   - Run lint checks (`pnpm lint`)
   - Run test suite (`pnpm test`)
   - Build project (`pnpm build`)
   - Manual testing of voice functionality

## Technical Considerations

### Caching Strategy
- Maintain existing cache structure keyed by resolved voiceId
- Cache invalidation remains unchanged
- Preset resolution happens before cache key generation

### Error Handling
- Gracefully handle missing environment variables
- Provide clear error messages for invalid presets
- Fallback to default voice when selected preset unavailable

### Performance
- Minimal overhead for preset resolution
- Preset list fetched once on component mount
- No additional API calls for TTS requests

### Security
- Never expose raw voice IDs to client
- Validate all voice IDs server-side
- Sanitize all user inputs

## Future Enhancements

1. **Dynamic Preset Loading**
   - Load presets from database instead of environment variables
   - Allow runtime preset configuration

2. **Voice Preview**
   - Add preview functionality for each preset
   - Allow users to test voices before selection

3. **Custom Voice Settings**
   - Allow per-preset voice settings (rate, pitch, etc.)
   - Store user preferences

## Rollout Plan

1. Implement server-side components first
2. Add API endpoints
3. Update client-side components
4. Add comprehensive tests
5. Perform quality assurance
6. Deploy to production
7. Monitor performance and usage

## Success Metrics

- Successful voice preset selection and playback
- Zero regression in existing voice functionality
- Improved user experience with voice variety
- Easy configuration for administrators