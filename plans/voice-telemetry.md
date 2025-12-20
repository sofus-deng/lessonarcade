# Voice Telemetry Implementation

## Overview

Voice telemetry provides privacy-safe analytics for Voice Mode usage, measuring completion rates, replay frequency, and common interruption points. The system is designed to never store personally identifiable information or sensitive content.

## What is Collected

### Collected Data
- **Event types**: `voice_play`, `voice_pause`, `voice_resume`, `voice_stop`, `voice_end`, `voice_error`
- **Session identifier**: Random client-side session ID stored in sessionStorage
- **Lesson context**: `lessonSlug`, `levelIndex`, `itemIndex`
- **Voice settings**: `engine` (browser/ai), `languageCode`, `voicePresetKey`, `rate`
- **Text metadata**: `textLen` (character count) and `textHash` (SHA-256 hash of script text only)
- **Server identifiers**: Hashed IP address and browser fingerprint using LOGGING_SALT
- **Event context**: Timestamp, reason for stop events, deduplication status
- **Schema version**: Version field for future compatibility

### Explicitly NOT Collected
- Raw text content, transcripts, or audio data
- IP addresses in plaintext
- User agent strings or other browser fingerprints in plaintext
- Any personally identifiable information
- Voice IDs (only preset keys are stored)

## Storage Location

Telemetry events are stored in daily-rotated JSONL files:
```
data/voice-analytics/events-YYYY-MM-DD.jsonl
```

Each line contains a single JSON object with the telemetry event schema.

⚠️ **Cloud Run Ephemerality Note**: In Cloud Run deployments, local files are ephemeral and may not persist across container restarts or scaling events. For production analytics, consider implementing a persistent storage solution (e.g., Cloud Storage, BigQuery) or log aggregation service.

## Event Flow

### Client-Side Events
1. **Session Generation**: Random session ID created and stored in `sessionStorage` under key `la:voiceSessionId`
2. **Event Emission**: Events sent to `/api/voice/telemetry` endpoint
3. **Reliability**: 
   - Stop/Navigation events use `navigator.sendBeacon()` (survives page unload)
   - Other events use `fetch()` with `keepalive: true`
4. **Privacy**: Text hash computed client-side using SHA-256 of script text only

### Server-Side Processing
1. **Validation**: Events validated against Zod schema
2. **Rate Limiting**: 60 requests per minute per IP address
3. **Hashing**: IP address and browser fingerprint hashed using existing LOGGING_SALT pattern
4. **Storage**: Events appended to daily JSONL file with server-side hashes added

## Schema Version 1

```typescript
{
  schemaVersion: 1,
  ts: string,                    // ISO timestamp
  event: "voice_play" | "voice_pause" | "voice_resume" | "voice_stop" | "voice_end" | "voice_error",
  lessonSlug: string,
  levelIndex: number,
  itemIndex: number,
  engine: "browser" | "ai",
  languageCode: string,
  voicePresetKey?: string,
  rate: number,
  textLen: number,
  textHash: string,              // SHA-256 of script text only
  sessionId: string,              // Client-side session ID
  ipHash?: string,               // Server-derived hash
  fingerprintHash?: string,        // Server-derived hash
  deduped?: boolean,
  reason?: "user_stop" | "navigation" | "rate_limited" | "cooldown_blocked" | "error"
}
```

## Inspecting Events

To inspect telemetry events, you can use standard command-line tools to search through the JSONL files:

```bash
# View today's events
cat data/voice-analytics/events-$(date +%Y-%m-%d).jsonl

# Search for specific event types
grep '"event":"voice_stop"' data/voice-analytics/events-*.jsonl

# Count events by type
grep -o '"event":"[^"]*"' data/voice-analytics/events-*.jsonl | sort | uniq -c

# Find completion rate (voice_end vs voice_play)
echo "Completion rate: $(grep -c '"event":"voice_end"' data/voice-analytics/events-*.jsonl) / $(grep -c '"event":"voice_play"' data/voice-analytics/events-*.jsonl)"
```

## Privacy and Security

### Hashing Strategy
- **IP addresses**: Hashed using SHA-256 with LOGGING_SALT
- **Browser fingerprints**: Hashed using SHA-256 with LOGGING_SALT
- **Text content**: Only SHA-256 hash stored, never raw text
- **Session IDs**: Random strings, no user identifiers

### Rate Limiting
- 60 requests per minute per IP address
- Prevents abuse while allowing reasonable usage patterns
- Includes `retryAfterSeconds` in rate limit responses

### Error Handling
- Telemetry failures never break voice playback
- All telemetry operations wrapped in try-catch blocks
- Silent failures logged to console only

## Implementation Notes

### Text Hash Definition
The `textHash` field contains SHA-256 hash of the script text ONLY, excluding:
- Voice preset settings
- Playback rate
- Language settings
- User agent or IP information

This enables consistent analysis of replay and interruption patterns without exposing sensitive content.

### Session Management
- Session IDs persist for the browser session duration
- Stored in `sessionStorage` under key `la:voiceSessionId`
- Format: `sess_{random}_{timestamp}`

### Event Reliability
- Critical events (stop, navigation) use `navigator.sendBeacon()`
- Non-critical events use `fetch()` with `keepalive: true`
- All telemetry is fire-and-forget from UI perspective

## Future Considerations

### Schema Evolution
- Schema version field enables backward-compatible changes
- New fields can be added with existing consumers ignoring unknown properties
- Version increments indicate breaking changes

### Persistent Storage
For production deployments requiring persistent analytics:
1. Replace file-based storage with cloud storage
2. Implement log shipping to analytics service
3. Add data retention policies
4. Consider real-time dashboards for monitoring

### Privacy Enhancements
- Potential for differential privacy techniques
- Configurable telemetry opt-out
- Data minimization reviews
- Regular privacy impact assessments