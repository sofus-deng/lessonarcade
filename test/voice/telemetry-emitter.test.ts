import { describe, it, expect, beforeEach, vi } from 'vitest'
import { emitVoiceTelemetryEvent } from '@/lib/lessonarcade/voice/telemetry-emitter'

const basePayload = {
  lessonSlug: 'lesson-1',
  levelIndex: 0,
  itemIndex: 0,
  engine: 'browser' as const,
  languageCode: 'en',
  voicePresetKey: 'preset-1',
  rate: 1,
  sessionId: 'sess_test',
  text: 'Hello there.'
}

const getFetchEvents = () => {
  const fetchCalls = (fetch as unknown as { mock: { calls: Array<[RequestInfo, RequestInit?]> } }).mock.calls
  return fetchCalls
    .filter(([input]) => typeof input === 'string' && input.includes('/api/voice/telemetry'))
    .map(([, init]) => JSON.parse((init?.body ?? '') as string).event as string)
}

const getBeaconEvents = () => {
  const beaconCalls = (navigator.sendBeacon as unknown as { mock: { calls: Array<[string, string]> } }).mock.calls
  return beaconCalls.map(([, data]) => JSON.parse(data).event as string)
}

describe('emitVoiceTelemetryEvent', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear()
    vi.mocked(navigator.sendBeacon).mockClear()
  })

  it('does not emit telemetry until explicitly called', () => {
    expect(getFetchEvents()).toHaveLength(0)
    expect(getBeaconEvents()).toHaveLength(0)
  })

  it('emits play, pause, resume, end, and error events via fetch', () => {
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_play' })
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_pause' })
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_resume' })
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_end' })
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_error', reason: 'error' })

    const events = getFetchEvents()
    expect(events).toEqual(expect.arrayContaining([
      'voice_play',
      'voice_pause',
      'voice_resume',
      'voice_end',
      'voice_error',
    ]))
    expect(getBeaconEvents()).toHaveLength(0)
  })

  it('emits stop events via sendBeacon when requested', () => {
    emitVoiceTelemetryEvent({ ...basePayload, event: 'voice_stop', reason: 'user_stop', useBeacon: true })

    expect(getBeaconEvents()).toContain('voice_stop')
  })
})
