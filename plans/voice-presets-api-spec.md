# Voice Presets API Specification

## Overview
This document specifies the API endpoints for the voice presets feature, including the new presets endpoint and enhancements to the existing TTS endpoint.

## GET /api/voice/presets

### Description
Returns a list of available voice presets for the client UI. The response is sanitized and does not include raw voice IDs.

### Request
```
GET /api/voice/presets
```

### Response Format
```json
{
  "ok": true,
  "presets": [
    {
      "presetKey": "en_instructor",
      "label": "Instructor Voice",
      "languageCode": "en"
    },
    {
      "presetKey": "en_narrator",
      "label": "Narrator Voice",
      "languageCode": "en"
    },
    {
      "presetKey": "zh_instructor",
      "label": "中文讲师",
      "languageCode": "zh"
    },
    {
      "presetKey": "zh_narrator",
      "label": "中文旁白",
      "languageCode": "zh"
    }
  ]
}
```

### Error Responses
```json
// 500 - Internal Server Error
{
  "ok": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to retrieve voice presets"
  }
}
```

### Implementation Notes
- Uses the preset registry to get available presets
- Filters out presets without voice IDs
- Returns only safe data (no voice IDs exposed)
- Handles missing environment variables gracefully

## POST /api/voice/tts (Enhanced)

### Description
Converts text to speech using ElevenLabs API. Enhanced to support voice presets while maintaining backward compatibility.

### Request
```json
{
  "text": "Hello, world!",
  "voicePreset": "en_instructor",  // New optional parameter
  "voiceId": "Adam",               // Existing parameter (for backward compatibility)
  "rate": 1.0,
  "lang": "en"
}
```

### Parameter Validation
1. **text**: Required, non-empty string, max length from constants
2. **voicePreset**: Optional, must be a valid preset key if provided
3. **voiceId**: Optional, must be in allowed set if provided
4. **rate**: Optional, number between 0.5 and 2.0
5. **lang**: Optional, 'en' or 'zh'

### Resolution Logic
1. If `voicePreset` is provided:
   - Resolve to voice ID using preset registry
   - Use resolved voice ID
   - Ignore `voiceId` parameter if also provided
2. If `voiceId` is provided (and no `voicePreset`):
   - Validate against allowed voice IDs
   - Use provided voice ID
3. If neither is provided:
   - Use default voice ID for language

### Response Format
```json
// Success: Returns audio data
Content-Type: audio/mpeg
Cache-Control: public, max-age=600

// Error: JSON response
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Error Codes
```json
// AUTH - API key not configured
{
  "ok": false,
  "error": {
    "code": "AUTH",
    "message": "ElevenLabs API key not configured"
  }
}

// VALIDATION - Invalid request parameters
{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid voice preset: unknown_preset"
  }
}

// RATE_LIMIT - Too many requests
{
  "ok": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfterSeconds": 3600
  }
}

// ELEVENLABS_ERROR - External API error
{
  "ok": false,
  "error": {
    "code": "ELEVENLABS_ERROR",
    "message": "ElevenLabs API error: 401 Unauthorized"
  }
}
```

### Caching Strategy
- Cache key includes resolved voice ID (not preset key)
- Format: `hash(text:language:resolvedVoiceId:rate)`
- TTL: 10 minutes
- Cleanup every 5 minutes

### Logging Enhancements
Add new log entry for preset resolution:
```typescript
interface TTSLogEntry {
  // ... existing fields
  voicePreset?: string    // New field
  resolvedVoiceId: string  // Renamed from voiceId
}
```

## Implementation Details

### Preset Resolution Flow
```typescript
// 1. Check for voicePreset
if (voicePreset) {
  const result = resolvePreset(voicePreset)
  if (!result) {
    return error("VALIDATION", `Invalid voice preset: ${voicePreset}`)
  }
  finalVoiceId = result.voiceId
  language = result.languageCode
}
// 2. Fall back to voiceId
else if (voiceId) {
  if (!validateVoiceId(voiceId)) {
    return error("VALIDATION", `Invalid voice ID: ${voiceId}`)
  }
  finalVoiceId = voiceId
}
// 3. Use default
else {
  finalVoiceId = getDefaultVoiceId(lang)
}
```

### Backward Compatibility
- Existing clients continue to work with `voiceId` parameter
- Default voice IDs still read from existing environment variables
- No breaking changes to response format

### Security Considerations
- All voice ID validation happens server-side
- Preset keys cannot be forged (must match environment variables)
- No voice IDs exposed in presets endpoint
- Rate limiting applies to all requests

## Testing Strategy

### Unit Tests
1. Test preset resolution with valid keys
2. Test preset resolution with invalid keys
3. Test voice ID validation
4. Test backward compatibility with voiceId
5. Test default voice fallback
6. Test error handling for all error codes

### Integration Tests
1. Test complete flow with preset
2. Test complete flow with voiceId
3. Test error responses
4. Test caching with resolved voice IDs
5. Test rate limiting

### Mock Scenarios
```typescript
// Test with preset
const response = await fetch('/api/voice/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Test',
    voicePreset: 'en_instructor',
    lang: 'en'
  })
})

// Test with voiceId (backward compatibility)
const response = await fetch('/api/voice/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Test',
    voiceId: 'Adam',
    lang: 'en'
  })
})
```

## Performance Considerations
- Preset resolution is O(1) lookup
- No additional API calls
- Minimal memory overhead
- Caching unchanged except for key format

## Future Enhancements
1. Support for voice settings per preset (rate, pitch, etc.)
2. Preset-specific caching policies
3. A/B testing for preset performance
4. Analytics on preset usage