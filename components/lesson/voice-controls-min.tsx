"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { type LessonArcadeLesson, type LanguageCode } from '@/lib/lessonarcade/schema'
import { buildVoiceScript } from '@/lib/lessonarcade/voice/build-script'
import { chunkTextForTts } from '@/lib/lessonarcade/voice/chunk-text'
import { getTtsMaxChars } from '@/lib/lessonarcade/voice/constants'
import { createTextHash, createSessionId } from '@/lib/lessonarcade/voice/telemetry-client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/ui/cn'
import { Play, Pause, Square, RotateCcw, AlertCircle } from 'lucide-react'
import { createHash } from 'crypto'

export type VoiceEngine = 'browser' | 'ai'

interface VoiceControlsMinProps {
  lesson: LessonArcadeLesson
  levelIndex: number
  itemIndex: number
  displayLanguage: LanguageCode
  engine: VoiceEngine
  presetKey: string
  rate: number
}

type SpeechStatus = 'idle' | 'speaking' | 'paused' | 'unsupported' | 'loading'

interface AudioQueueItem {
  blob: Blob
  url: string
  text: string
}

interface LastPlayedItem {
  itemKey: string
  timestamp: number
}

export function VoiceControlsMin({
  lesson,
  levelIndex,
  itemIndex,
  displayLanguage,
  engine,
  presetKey,
  rate
}: VoiceControlsMinProps) {
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAIVoiceAvailable, setIsAIVoiceAvailable] = useState(false)
  const [aiVoiceAcknowledged, setAiVoiceAcknowledged] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:aiVoiceAcknowledged') === 'true'
    }
    return false
  })
  const [showAcknowledgmentDialog, setShowAcknowledgmentDialog] = useState(false)
  const [lastPlayedItem, setLastPlayedItem] = useState<LastPlayedItem | null>(null)
  const [inFlightRequests, setInFlightRequests] = useState<Map<string, Promise<Blob>>>(new Map())
  const [sessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let existingSessionId = sessionStorage.getItem('la:voiceSessionId')
      if (!existingSessionId) {
        existingSessionId = createSessionId()
        sessionStorage.setItem('la:voiceSessionId', existingSessionId)
      }
      return existingSessionId
    }
    return ''
  })

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const audioQueueRef = useRef<AudioQueueItem[]>([])
  const currentChunkIndexRef = useRef(0)
  const textChunksRef = useRef<string[]>([])
  const isBufferingRef = useRef(false)
  const prefetchPromiseRef = useRef<Promise<void> | null>(null)
  const currentScriptRef = useRef<string>('')

  const isSpeechSupported = speechStatus !== 'unsupported'

  const createCacheKey = useCallback((text: string, lang: string, voiceId: string, voiceRate: number): string => {
    return createHash('sha256')
      .update(`${text}:${lang}:${voiceId}:${voiceRate}`)
      .digest('hex')
  }, [])

  const createItemKey = useCallback((): string => {
    return `${lesson.slug}-${levelIndex}-${itemIndex}-${displayLanguage}-${presetKey}-${rate}`
  }, [lesson.slug, levelIndex, itemIndex, displayLanguage, presetKey, rate])

  const sendTelemetryEvent = useCallback((
    event: 'voice_play' | 'voice_pause' | 'voice_resume' | 'voice_stop' | 'voice_end' | 'voice_error',
    reason?: 'user_stop' | 'navigation' | 'rate_limited' | 'cooldown_blocked' | 'error',
    useBeacon: boolean = false
  ) => {
    try {
      const scriptText = currentScriptRef.current || ''

      const telemetryData = {
        schemaVersion: 1,
        ts: new Date().toISOString(),
        event,
        lessonSlug: lesson.slug,
        levelIndex,
        itemIndex,
        engine,
        languageCode: displayLanguage,
        voicePresetKey: presetKey || undefined,
        rate,
        textLen: scriptText.length,
        textHash: createTextHash(scriptText),
        sessionId
      }

      if (reason) {
        (telemetryData as Record<string, unknown>).reason = reason
      }

      const jsonData = JSON.stringify(telemetryData)

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/voice/telemetry', jsonData)
      } else {
        fetch('/api/voice/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: jsonData,
          keepalive: true
        }).catch(() => {})
      }
    } catch (telemetryError) {
      console.warn('Failed to send telemetry event:', telemetryError)
    }
  }, [lesson.slug, levelIndex, itemIndex, engine, displayLanguage, presetKey, rate, sessionId])

  const handleAcknowledgeAI = useCallback(() => {
    setAiVoiceAcknowledged(true)
    setShowAcknowledgmentDialog(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('la:aiVoiceAcknowledged', 'true')
    }
  }, [])

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesisRef.current || !isSpeechSupported) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      speechSynthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = rate
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`))

      currentUtteranceRef.current = utterance
      speechSynthesisRef.current.speak(utterance)
    })
  }, [isSpeechSupported, rate])

  const fetchAudioChunk = useCallback(async (text: string, signal: AbortSignal): Promise<Blob> => {
    const cacheKey = createCacheKey(text, displayLanguage, presetKey || 'default', rate)

    const existingRequest = inFlightRequests.get(cacheKey)
    if (existingRequest) {
      return existingRequest
    }

    const requestPromise = (async () => {
      const requestBody: Record<string, unknown> = {
        text,
        rate,
        lang: displayLanguage
      }

      if (presetKey) {
        requestBody.voicePreset = presetKey
      }

      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal
      })

      if (!response.ok) {
        const data = await response.json()

        if (data.error?.code === 'RATE_LIMIT') {
          const retryMinutes = Math.ceil((data.error.retryAfterSeconds || 3600) / 60)
          throw new Error(`Rate limit exceeded. Please try again in ${retryMinutes} minutes.`)
        }
        throw new Error(data.error?.message || 'Failed to generate audio')
      }

      return await response.blob()
    })()

    setInFlightRequests(prev => new Map(prev).set(cacheKey, requestPromise))

    try {
      return await requestPromise
    } finally {
      setInFlightRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(cacheKey)
        return newMap
      })
    }
  }, [rate, displayLanguage, presetKey, createCacheKey, inFlightRequests])

  const prefetchNextChunk = useCallback(async (chunkIndex: number): Promise<void> => {
    if (
      chunkIndex + 1 >= textChunksRef.current.length ||
      audioQueueRef.current.some(item => item.text === textChunksRef.current[chunkIndex + 1])
    ) {
      return
    }

    try {
      const nextChunkText = textChunksRef.current[chunkIndex + 1]
      const blob = await fetchAudioChunk(nextChunkText, abortControllerRef.current!.signal)
      const url = URL.createObjectURL(blob)

      audioQueueRef.current.push({
        blob,
        url,
        text: nextChunkText
      })
    } catch (prefetchError) {
      console.warn('Failed to prefetch next chunk:', prefetchError)
    }
  }, [fetchAudioChunk])

  const playAIVoiceChunked = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      abortControllerRef.current = new AbortController()
      audioQueueRef.current = []
      currentChunkIndexRef.current = 0
      isBufferingRef.current = true

      const script = buildVoiceScript({
        lesson,
        levelIndex,
        itemIndex,
        displayLanguage,
        includeKeyPoints: true
      })

      currentScriptRef.current = script

      const maxChars = getTtsMaxChars()
      textChunksRef.current = chunkTextForTts(script, maxChars)

      if (textChunksRef.current.length === 0) {
        reject(new Error('No text to speak'))
        return
      }

      const playNextChunk = async (chunkIndex: number): Promise<void> => {
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        if (chunkIndex >= textChunksRef.current.length) {
          setSpeechStatus('idle')
          setIsPlaying(false)
          sendTelemetryEvent('voice_end')
          resolve()
          return
        }

        currentChunkIndexRef.current = chunkIndex
        const chunkText = textChunksRef.current[chunkIndex]

        let audioItem = audioQueueRef.current.find(item => item.text === chunkText)

        if (!audioItem) {
          try {
            setSpeechStatus('loading')
            isBufferingRef.current = true

            const blob = await fetchAudioChunk(chunkText, abortControllerRef.current!.signal)
            const url = URL.createObjectURL(blob)

            audioItem = {
              blob,
              url,
              text: chunkText
            }

            audioQueueRef.current.push(audioItem)
          } catch (chunkError) {
            if (chunkError instanceof Error && chunkError.name !== 'AbortError') {
              sendTelemetryEvent('voice_error', 'error')
              reject(chunkError)
            }
            return
          }
        }

        const audio = new Audio(audioItem.url)
        audioRef.current = audio

        if (chunkIndex + 1 < textChunksRef.current.length) {
          prefetchPromiseRef.current = prefetchNextChunk(chunkIndex)
        }

        return new Promise<void>((audioResolve, audioReject) => {
          const handleEnded = () => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            audio.pause()

            URL.revokeObjectURL(audioItem!.url)
            audioQueueRef.current = audioQueueRef.current.filter(item => item.text !== audioItem!.text)

            playNextChunk(chunkIndex + 1).then(audioResolve).catch(audioReject)
          }

          const handleError = (event: Event) => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)

            URL.revokeObjectURL(audioItem!.url)
            audioQueueRef.current = audioQueueRef.current.filter(item => item.text !== audioItem!.text)

            if (abortControllerRef.current?.signal.aborted) {
              audioResolve()
            } else {
              const target = event.target as HTMLAudioElement
              if (target && target.error) {
                sendTelemetryEvent('voice_error', 'error')
                audioReject(new Error(`Audio playback error: ${target.error.message}`))
              } else {
                sendTelemetryEvent('voice_error', 'error')
                audioReject(new Error('Audio playback failed'))
              }
            }
          }

          audio.addEventListener('ended', handleEnded)
          audio.addEventListener('error', handleError)

          setSpeechStatus('speaking')
          isBufferingRef.current = false
          audio.play().catch(audioReject)
        })
      }

      playNextChunk(0).catch(reject)
    })
  }, [lesson, levelIndex, itemIndex, displayLanguage, fetchAudioChunk, prefetchNextChunk, sendTelemetryEvent])

  const stopSpeech = useCallback((reason?: 'user_stop' | 'navigation') => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    audioQueueRef.current.forEach(item => {
      URL.revokeObjectURL(item.url)
    })
    audioQueueRef.current = []

    setInFlightRequests(new Map())
    setIsPlaying(false)
    setSpeechStatus('idle')
    setError(null)
    isBufferingRef.current = false
    currentChunkIndexRef.current = 0
    textChunksRef.current = []
    currentScriptRef.current = ''

    if (isPlaying) {
      sendTelemetryEvent('voice_stop', reason, true)
    }
  }, [isPlaying, sendTelemetryEvent])

  const playCurrentItem = useCallback(async () => {
    if (engine === 'browser' && !isSpeechSupported) return
    if (engine === 'ai' && !isAIVoiceAvailable) {
      setError('AI Voice is not available.')
      return
    }

    if (engine === 'ai') {
      if (!aiVoiceAcknowledged) {
        setShowAcknowledgmentDialog(true)
        return
      }

      const now = Date.now()
      const itemKey = createItemKey()
      if (lastPlayedItem && lastPlayedItem.itemKey === itemKey && (now - lastPlayedItem.timestamp) < 2000) {
        setError('Please wait a moment before playing the same item again.')
        setTimeout(() => setError(null), 3000)
        sendTelemetryEvent('voice_error', 'cooldown_blocked')
        return
      }

      setLastPlayedItem({ itemKey, timestamp: now })
    }

    setIsPlaying(true)
    setError(null)

    if (engine === 'browser') {
      setSpeechStatus('speaking')

      try {
        const script = buildVoiceScript({
          lesson,
          levelIndex,
          itemIndex,
          displayLanguage,
          includeKeyPoints: true
        })

        currentScriptRef.current = script

        const sentences = script.match(/[^.!?。！？]+[.!?。！？]*/g) || [script]

        sendTelemetryEvent('voice_play')

        for (const sentence of sentences) {
          if (speechStatus === 'paused') {
            await new Promise(resolve => {
              const checkInterval = setInterval(() => {
                if (speechStatus !== 'paused') {
                  clearInterval(checkInterval)
                  resolve(undefined)
                }
              }, 100)
            })
          }

          if (speechStatus === 'idle') {
            break
          }

          await speakText(sentence.trim())
        }
      } catch (playError) {
        console.error('Error playing voice:', playError)
        setError(playError instanceof Error ? playError.message : 'An error occurred during playback')
        sendTelemetryEvent('voice_error', 'error')
      } finally {
        setIsPlaying(false)
        setSpeechStatus('idle')
      }
    } else {
      try {
        sendTelemetryEvent('voice_play')
        await playAIVoiceChunked()
      } catch (playError) {
        console.error('Error playing AI voice:', playError)
        setError(playError instanceof Error ? playError.message : 'An error occurred during playback')
        setIsPlaying(false)
        setSpeechStatus('idle')
      }
    }
  }, [
    aiVoiceAcknowledged,
    createItemKey,
    displayLanguage,
    engine,
    isAIVoiceAvailable,
    isSpeechSupported,
    itemIndex,
    lastPlayedItem,
    lesson,
    levelIndex,
    playAIVoiceChunked,
    sendTelemetryEvent,
    speakText,
    speechStatus
  ])

  const togglePause = () => {
    if (engine === 'browser' && speechSynthesisRef.current) {
      if (speechStatus === 'speaking') {
        speechSynthesisRef.current.pause()
        setSpeechStatus('paused')
        sendTelemetryEvent('voice_pause')
      } else if (speechStatus === 'paused') {
        speechSynthesisRef.current.resume()
        setSpeechStatus('speaking')
        sendTelemetryEvent('voice_resume')
      }
    } else if (engine === 'ai' && audioRef.current) {
      if (speechStatus === 'speaking') {
        audioRef.current.pause()
        setSpeechStatus('paused')
        sendTelemetryEvent('voice_pause')
      } else if (speechStatus === 'paused') {
        audioRef.current.play()
        setSpeechStatus('speaking')
        sendTelemetryEvent('voice_resume')
      }
    }
  }

  const replayCurrentItem = useCallback(() => {
    stopSpeech()
    setTimeout(() => {
      playCurrentItem()
    }, 100)
  }, [stopSpeech, playCurrentItem])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    } else {
      setSpeechStatus('unsupported')
    }

    const checkAIVoiceAvailability = async () => {
      try {
        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'test' })
        })

        const data = await response.json()
        if (data.error?.code === 'AUTH') {
          setIsAIVoiceAvailable(false)
        } else {
          setIsAIVoiceAvailable(true)
        }
      } catch {
        setIsAIVoiceAvailable(true)
      }
    }

    checkAIVoiceAvailability()

    return () => {
      stopSpeech()
    }
  }, [stopSpeech])

  useEffect(() => {
    stopSpeech('navigation')
  }, [lesson.slug, levelIndex, itemIndex, displayLanguage, presetKey, rate, engine, stopSpeech])

  const isPlayDisabled = engine === 'browser'
    ? !isSpeechSupported
    : !isAIVoiceAvailable

  const statusText = speechStatus === 'speaking'
    ? 'Speaking...'
    : speechStatus === 'paused'
      ? 'Paused'
      : speechStatus === 'loading' || isBufferingRef.current
        ? 'Loading...'
        : engine === 'ai' && !isAIVoiceAvailable
          ? 'AI Voice unavailable'
          : 'Ready'

  if (!isSpeechSupported && engine === 'browser') {
    return (
      <Card className="bg-la-surface border-la-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-la-muted">
            <AlertCircle className="w-5 h-5" />
            <span>Voice mode is not supported in your browser. Please try using Chrome, Safari, or Edge.</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-la-surface border-la-border">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                speechStatus === 'speaking' ? "bg-green-500" :
                speechStatus === 'paused' ? "bg-yellow-500" :
                speechStatus === 'loading' || isBufferingRef.current ? "bg-blue-500" :
                "bg-gray-400"
              )} />
              <span className="text-sm text-la-muted">{statusText}</span>
            </div>

            {error && (
              <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                {error}
              </span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {!isPlaying ? (
                <Button
                  onClick={playCurrentItem}
                  className="bg-la-accent text-la-bg hover:bg-la-accent/90"
                  size="sm"
                  disabled={isPlayDisabled}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </Button>
              ) : (
                <Button
                  onClick={togglePause}
                  variant="outline"
                  size="sm"
                >
                  {speechStatus === 'speaking' ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() => stopSpeech('user_stop')}
                variant="outline"
                size="sm"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>

              <Button
                onClick={replayCurrentItem}
                variant="outline"
                size="sm"
                disabled={isPlayDisabled}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Replay
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAcknowledgmentDialog} onOpenChange={setShowAcknowledgmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Voice</DialogTitle>
            <DialogDescription>
              AI Voice will generate cloud TTS requests.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowAcknowledgmentDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleAcknowledgeAI}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
