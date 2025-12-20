# TTS Cost Guardrails

This document describes the TTS cost guardrails implemented in LessonArcade to prevent excessive API usage and costs.

## Overview

The TTS cost guardrails consist of multiple layers of protection on both the frontend and backend:

1. **Frontend Guardrails** - User experience controls and client-side deduplication
2. **Backend Guardrails** - Rate limiting and server-side deduplication
3. **Logging and Monitoring** - Enhanced visibility into TTS usage patterns

## Frontend Guardrails

### No Autoplay + First-time Acknowledgment

AI Voice never auto-plays on any of the following actions:
- Engine toggle (Browser ↔ AI)
- Preset change
- Language change
- Route change
- Item navigation

Only an explicit user click on the Play button can trigger TTS requests.

**Acknowledgment Behavior:**
- Shows a dialog the first time a user switches to AI Voice
- Dialog appears every time they switch to AI Voice until they acknowledge it
- Persists across browser sessions using localStorage key: `la:aiVoiceAcknowledged`
- If not acknowledged, AI Voice controls remain disabled
- Dialog message: "AI Voice will generate cloud TTS requests."

### Play Cooldown (Anti Double-click)

A 2-second cooldown prevents rapid repeated requests for the same item:

**Item Key Definition:**
```
itemKey = slug + levelIndex + itemIndex + displayLanguage + presetKey + rate
```

**Cooldown Behavior:**
- Only applies to AI Voice mode
- Only blocks requests for the exact same item (identical itemKey)
- Shows a brief user-friendly message when blocked
- Does NOT call `/api/voice/tts` when blocked

### Client-side In-flight Dedupe

Prevents duplicate requests for identical content:

**Cache Key Format:**
```
cacheKey = sha256(text + lang + voiceId + rate)
```

**Dedupe Behavior:**
- Maintains an in-memory Map of in-flight requests
- If multiple Play clicks occur for the same content, reuses the same Promise
- Prevents multiple network requests for identical content
- Stop button clears all in-flight tracking to prevent unexpected playback

## Backend Guardrails

### Multi-tier Rate Limiting

Three tiers of rate limits apply simultaneously:

| Tier | Identifier | Limit | Window |
|------|-------------|--------|--------|
| Minute | IP | 5 requests | 1 minute |
| Hour | IP | 10 requests | 1 hour |
| Minute | Fingerprint | 10 requests | 1 minute |
| Day | Fingerprint | 30 requests | 1 day |

**Fingerprint Generation:**
- Uses User-Agent and Accept-Language headers
- Hashed with LOGGING_SALT for privacy
- More stable than IP for identifying users

**Rate Limit Response:**
- Returns HTTP 429 status code
- Includes `retryAfterSeconds` field for client-side retry logic
- Logs which limit window was exceeded (minute/hour/day)

### Server-side In-flight Dedupe

Prevents duplicate requests at the API level:

**Implementation:**
- Module-level Map<string, Promise<Response>>
- Key: `cacheKey` (same as client: sha256 of text+lang+voiceId+rate)
- Checks for in-flight requests before calling ElevenLabs API
- Returns the same Promise to concurrent identical requests
- Cleans up entries in finally blocks

**Benefits:**
- Reduces API costs by deduplicating concurrent requests
- Improves response time for duplicate requests
- Provides resilience against rapid client retries

## Enhanced Logging

All TTS events are logged with additional fields:

```typescript
{
  event: "voice_tts",
  ok: boolean,
  ipHash: string,
  textLength: number,
  textHash: string,
  voiceId: string,
  language: string,
  rate: number,
  elapsedMs: number,
  errorCode?: "RATE_LIMIT" | "AUTH" | "VALIDATION" | "ELEVENLABS_ERROR",
  cached?: boolean,        // NEW: Cache hit indicator
  deduped?: boolean,      // NEW: Server dedupe indicator
  rateLimitWindow?: string, // NEW: "minute" | "hour" | "day"
  voicePreset?: string
}
```

**Security Note:**
- Raw text is never logged
- Only text length and SHA-256 hash are logged
- IP addresses are hashed with salt for privacy

## Implementation Details

### Frontend State Management

```typescript
// New state variables for guardrails
const [aiVoiceAcknowledged, setAiVoiceAcknowledged] = useState<boolean>(() => {
  return localStorage.getItem('la:aiVoiceAcknowledged') === 'true'
})
const [showAcknowledgmentDialog, setShowAcknowledgmentDialog] = useState(false)
const [lastPlayedItem, setLastPlayedItem] = useState<LastPlayedItem | null>(null)
const [inFlightRequests, setInFlightRequests] = useState<Map<string, Promise<Blob>>>(new Map())
```

### Backend Rate Limiting

```typescript
// Multi-tier rate limiting
const rateLimitResult = ttsRateLimiter.checkMultipleLimits(request, [
  { key: 'ip', maxRequests: 5, windowMs: 60 * 1000 },         // 5 req/min per IP
  { key: 'ip', maxRequests: 10, windowMs: 60 * 60 * 1000 },      // 10 req/hour per IP
  { key: 'fingerprint', maxRequests: 10, windowMs: 60 * 1000 },   // 10 req/min per fingerprint
  { key: 'fingerprint', maxRequests: 30, windowMs: 24 * 60 * 60 * 1000 } // 30 req/day per fingerprint
])
```

### Cache Key Generation

```typescript
// Consistent cache key generation (client and server)
function createCacheKey(text: string, language: string, voiceId: string, rate: number): string {
  return createHash('sha256')
    .update(`${text}:${language}:${voiceId}:${rate}`)
    .digest('hex')
}
```

## Testing Strategy

### Unit Tests

1. **Rate Limiter Tests** (`test/voice/rate-limiter-minute.test.ts`)
   - Minute window behavior
   - RetryAfterSeconds calculation
   - Multiple limit tiers interaction

2. **Dedupe Tests** (`test/voice/tts-dedupe.test.ts`)
   - In-flight Map behavior
   - Cleanup in finally blocks
   - Cache key generation

3. **Component Tests**
   - Acknowledgment dialog behavior
   - Cooldown enforcement
   - In-flight request reuse

### Manual Testing Checklist

- [ ] AI Voice toggle shows acknowledgment dialog
- [ ] Repeated Play within 2s shows cooldown message
- [ ] Stop during queue clears all in-flight requests
- [ ] Rate limit message displays correctly
- [ ] Multiple identical requests reuse promises
- [ ] Different items can be played within cooldown window
- [ ] Browser voice engine is unaffected by guardrails

## Cost Impact Analysis

### Expected Reductions

1. **Cooldown**: ~50% reduction in accidental double-clicks
2. **Client Dedupe**: ~20% reduction in duplicate requests
3. **Server Dedupe**: ~10% reduction in concurrent duplicates
4. **Rate Limits**: Caps maximum usage at reasonable levels

### Monitoring

Monitor the following metrics to assess effectiveness:
- `cached` field ratio (cache hit rate)
- `deduped` field ratio (dedupe hit rate)
- `rateLimitWindow` distribution (which limits are hit)
- Overall TTS request volume before/after implementation

## Future Enhancements

1. **Smart Caching**: Implement persistent cache across server restarts
2. **User Quotas**: Per-user quota management with dashboard
3. **Cost Analytics**: Real-time cost tracking and alerts
4. **Adaptive Rate Limits**: Dynamic limits based on usage patterns
5. **Regional Caching**: Edge caching for popular content