import { createTextHash } from '@/lib/lessonarcade/voice/telemetry-client'
import type { LanguageCode } from '@/lib/lessonarcade/schema'

export type VoiceTelemetryEvent =
  | 'voice_play'
  | 'voice_pause'
  | 'voice_resume'
  | 'voice_stop'
  | 'voice_end'
  | 'voice_error'

export type VoiceTelemetryReason =
  | 'user_stop'
  | 'navigation'
  | 'rate_limited'
  | 'cooldown_blocked'
  | 'error'

export type VoiceTelemetryContext = {
  lessonSlug: string
  levelIndex: number
  itemIndex: number
  engine: 'browser' | 'ai'
  languageCode: LanguageCode
  voicePresetKey?: string
  rate: number
  sessionId: string
}

export type VoiceTelemetryPayload = VoiceTelemetryContext & {
  event: VoiceTelemetryEvent
  text: string
  reason?: VoiceTelemetryReason
  useBeacon?: boolean
}

export function emitVoiceTelemetryEvent({
  event,
  text,
  reason,
  useBeacon = false,
  lessonSlug,
  levelIndex,
  itemIndex,
  engine,
  languageCode,
  voicePresetKey,
  rate,
  sessionId
}: VoiceTelemetryPayload): void {
  try {
    const telemetryData: Record<string, unknown> = {
      schemaVersion: 1,
      ts: new Date().toISOString(),
      event,
      lessonSlug,
      levelIndex,
      itemIndex,
      engine,
      languageCode,
      voicePresetKey: voicePresetKey || undefined,
      rate,
      textLen: text.length,
      textHash: createTextHash(text),
      sessionId,
    }

    if (reason) {
      telemetryData.reason = reason
    }

    const jsonData = JSON.stringify(telemetryData)

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/voice/telemetry', jsonData)
    } else {
      fetch('/api/voice/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonData,
        keepalive: true,
      }).catch(() => {})
    }
  } catch (error) {
    console.warn('Failed to send telemetry event:', error)
  }
}
