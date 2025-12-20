"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { type LessonArcadeLesson, type LanguageCode } from '@/lib/lessonarcade/schema'
import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import { buildVoiceScript } from '@/lib/lessonarcade/voice/build-script'
import { chunkTextForTts } from '@/lib/lessonarcade/voice/chunk-text'
import { getTtsMaxChars } from '@/lib/lessonarcade/voice/constants'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/ui/cn'
import { Play, Pause, Square, RotateCcw, Volume2, AlertCircle } from 'lucide-react'
import { createHash } from 'crypto'

interface VoiceLessonPlayerProps {
  lesson: LessonArcadeLesson
}

type SpeechStatus = 'idle' | 'speaking' | 'paused' | 'unsupported' | 'loading'
type VoiceEngine = 'browser' | 'ai'

// Audio queue item interface
interface AudioQueueItem {
  blob: Blob
  url: string
  text: string
}

// Available preset interface
interface AvailablePreset {
  presetKey: string
  label: string
  languageCode: 'en' | 'zh'
}

// Last played item for cooldown tracking
interface LastPlayedItem {
  itemKey: string
  timestamp: number
}

export function VoiceLessonPlayer({ lesson }: VoiceLessonPlayerProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [displayLanguage, setDisplayLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:displayLanguage') || 'en'
    }
    return 'en'
  })
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle')
  const [speechRate, setSpeechRate] = useState(1.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>('browser')
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:voicePresetKey') || ''
    }
    return ''
  })
  const [isAIVoiceAvailable, setIsAIVoiceAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Preset-related state
  const [availablePresets, setAvailablePresets] = useState<AvailablePreset[]>([])
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [presetsError, setPresetsError] = useState<string | null>(null)
  
  // New state for TTS guardrails
  const [aiVoiceAcknowledged, setAiVoiceAcknowledged] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:aiVoiceAcknowledged') === 'true'
    }
    return false
  })
  const [showAcknowledgmentDialog, setShowAcknowledgmentDialog] = useState(false)
  const [lastPlayedItem, setLastPlayedItem] = useState<LastPlayedItem | null>(null)
  const [inFlightRequests, setInFlightRequests] = useState<Map<string, Promise<Blob>>>(new Map())
  
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // AI Voice specific refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const audioQueueRef = useRef<AudioQueueItem[]>([])
  const currentChunkIndexRef = useRef(0)
  const textChunksRef = useRef<string[]>([])
  const isBufferingRef = useRef(false)
  const prefetchPromiseRef = useRef<Promise<void> | null>(null)

  // Check if speech synthesis is supported
  const isSpeechSupported = speechStatus !== 'unsupported'

  // Create cache key for deduplication (same as server)
  const createCacheKey = useCallback((text: string, lang: string, voiceId: string, rate: number): string => {
    return createHash('sha256')
      .update(`${text}:${lang}:${voiceId}:${rate}`)
      .digest('hex')
  }, [])

  // Create item key for cooldown tracking
  const createItemKey = useCallback((): string => {
    return `${lesson.slug}-${currentLevelIndex}-${currentItemIndex}-${displayLanguage}-${selectedPresetKey}-${speechRate}`
  }, [lesson.slug, currentLevelIndex, currentItemIndex, displayLanguage, selectedPresetKey, speechRate])

  // Handle AI Voice acknowledgment
  const handleAcknowledgeAI = useCallback(() => {
    setAiVoiceAcknowledged(true)
    setShowAcknowledgmentDialog(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('la:aiVoiceAcknowledged', 'true')
    }
  }, [])

  // Speak text with current settings (browser engine)
  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesisRef.current || !isSpeechSupported) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speechRate
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech error: ${event.error}`))
      
      currentUtteranceRef.current = utterance
      speechSynthesisRef.current.speak(utterance)
    })
  }, [isSpeechSupported, speechRate])

  // Fetch audio for a text chunk with deduplication
  const fetchAudioChunk = useCallback(async (text: string, signal: AbortSignal): Promise<Blob> => {
    // Create cache key for deduplication
    const cacheKey = createCacheKey(text, displayLanguage, selectedPresetKey || 'default', speechRate)
    
    // Check if request is already in-flight
    const existingRequest = inFlightRequests.get(cacheKey)
    if (existingRequest) {
      return existingRequest
    }
    
    // Create new request
    const requestPromise = (async () => {
      const requestBody: Record<string, unknown> = {
        text,
        rate: speechRate,
        lang: displayLanguage
      }
      
      // Use preset if available, otherwise use default behavior
      if (selectedPresetKey) {
        requestBody.voicePreset = selectedPresetKey
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
        } else {
          throw new Error(data.error?.message || 'Failed to generate audio')
        }
      }
      
      return await response.blob()
    })()
    
    // Store in-flight request
    setInFlightRequests(prev => new Map(prev).set(cacheKey, requestPromise))
    
    try {
      return await requestPromise
    } finally {
      // Clean up in-flight request
      setInFlightRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(cacheKey)
        return newMap
      })
    }
  }, [speechRate, displayLanguage, selectedPresetKey, createCacheKey, inFlightRequests])

  // Prefetch: next chunk while current one is playing
  const prefetchNextChunk = useCallback(async (chunkIndex: number): Promise<void> => {
    if (
      chunkIndex + 1 >= textChunksRef.current.length || 
      audioQueueRef.current.some(item => item.text === textChunksRef.current[chunkIndex + 1])
    ) {
      return // No next chunk or already prefetched
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
    } catch (err) {
      // Silently fail prefetch errors, they'll be handled when playing the chunk
      console.warn('Failed to prefetch next chunk:', err)
    }
  }, [fetchAudioChunk])

  // Play AI voice using buffered chunking
  const playAIVoiceChunked = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create new abort controller for this session
      abortControllerRef.current = new AbortController()
      audioQueueRef.current = []
      currentChunkIndexRef.current = 0
      isBufferingRef.current = true
      
      // Build script and chunk it
      const script = buildVoiceScript({
        lesson,
        levelIndex: currentLevelIndex,
        itemIndex: currentItemIndex,
        displayLanguage,
        includeKeyPoints: true
      })
      
      const maxChars = getTtsMaxChars()
      textChunksRef.current = chunkTextForTts(script, maxChars)
      
      if (textChunksRef.current.length === 0) {
        reject(new Error('No text to speak'))
        return
      }
      
      // Start playing chunks
      const playNextChunk = async (chunkIndex: number): Promise<void> => {
        // Check if we should stop
        if (abortControllerRef.current?.signal.aborted) {
          return
        }
        
        // Check if we've played all chunks
        if (chunkIndex >= textChunksRef.current.length) {
          setSpeechStatus('idle')
          setIsPlaying(false)
          resolve()
          return
        }
        
        currentChunkIndexRef.current = chunkIndex
        const chunkText = textChunksRef.current[chunkIndex]
        
        // Check if we already have this chunk in queue
        let audioItem = audioQueueRef.current.find(item => item.text === chunkText)
        
        if (!audioItem) {
          // Need to fetch this chunk
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
          } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
              reject(err)
            }
            return
          }
        }
        
        // Create audio element and play
        const audio = new Audio(audioItem.url)
        audioRef.current = audio
        
        // Start prefetching the next chunk while this one plays
        if (chunkIndex + 1 < textChunksRef.current.length) {
          prefetchPromiseRef.current = prefetchNextChunk(chunkIndex)
        }
        
        return new Promise<void>((audioResolve, audioReject) => {
          const handleEnded = () => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            audio.pause()
            
            // Clean up the blob URL after playing
            URL.revokeObjectURL(audioItem!.url)
            
            // Remove from queue
            audioQueueRef.current = audioQueueRef.current.filter(item => item.text !== audioItem!.text)
            
            // Play next chunk
            playNextChunk(chunkIndex + 1).then(audioResolve).catch(audioReject)
          }
          
          const handleError = (e: Event) => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            
            // Clean up
            URL.revokeObjectURL(audioItem!.url)
            audioQueueRef.current = audioQueueRef.current.filter(item => item.text !== audioItem!.text)
            
            if (abortControllerRef.current?.signal.aborted) {
              audioResolve()
            } else {
              const target = e.target as HTMLAudioElement
              if (target && target.error) {
                audioReject(new Error(`Audio playback error: ${target.error.message}`))
              } else {
                audioReject(new Error('Audio playback failed'))
              }
            }
          }
          
          audio.addEventListener('ended', handleEnded)
          audio.addEventListener('error', handleError)
          
          // Start playing
          setSpeechStatus('speaking')
          isBufferingRef.current = false
          audio.play().catch(audioReject)
        })
      }
      
      // Start with the first chunk
      playNextChunk(0).catch(reject)
    })
  }, [lesson, currentLevelIndex, currentItemIndex, displayLanguage, fetchAudioChunk, prefetchNextChunk])

  // Stop speech with enhanced cleanup
  const stopSpeech = useCallback(() => {
    // Cancel browser speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }
    
    // Abort AI voice fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    // Stop and clean up audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    // Clean up all blob URLs
    audioQueueRef.current.forEach(item => {
      URL.revokeObjectURL(item.url)
    })
    audioQueueRef.current = []
    
    // Clear all in-flight requests
    setInFlightRequests(new Map())
    
    // Reset state
    setIsPlaying(false)
    setSpeechStatus('idle')
    setError(null)
    isBufferingRef.current = false
    currentChunkIndexRef.current = 0
    textChunksRef.current = []
  }, [])

  // Handle preset change
  const handlePresetChange = useCallback((presetKey: string) => {
    setSelectedPresetKey(presetKey)
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (presetKey) {
        localStorage.setItem('la:voicePresetKey', presetKey)
      } else {
        localStorage.removeItem('la:voicePresetKey')
      }
    }
    
    // Stop any current playback to apply new voice
    stopSpeech()
  }, [stopSpeech])

  // Fetch presets function
  const fetchPresets = useCallback(async () => {
    setPresetsLoading(true)
    setPresetsError(null)
    
    try {
      const response = await fetch('/api/voice/presets')
      const data = await response.json()
      
      if (data.ok) {
        setAvailablePresets(data.presets)
        
        // Validate selected preset is still available
        if (selectedPresetKey) {
          const isStillAvailable = data.presets.some(
            (preset: AvailablePreset) => preset.presetKey === selectedPresetKey
          )
          
          if (!isStillAvailable) {
            // Fall back to first available preset for current language
            const fallbackPreset = data.presets.find(
              (preset: AvailablePreset) => preset.languageCode === displayLanguage
            )
            if (fallbackPreset) {
              handlePresetChange(fallbackPreset.presetKey)
            }
          }
        }
      } else {
        setPresetsError(data.error?.message || 'Failed to load presets')
      }
    } catch {
      setPresetsError('Network error loading presets')
    } finally {
      setPresetsLoading(false)
    }
  }, [selectedPresetKey, displayLanguage, handlePresetChange])

  // Play current item with guardrails
  const playCurrentItem = useCallback(async () => {
    if (!isSpeechSupported && voiceEngine === 'browser') return
    
    // AI Voice guardrails
    if (voiceEngine === 'ai') {
      // Check acknowledgment
      if (!aiVoiceAcknowledged) {
        setShowAcknowledgmentDialog(true)
        return
      }
      
      // Check cooldown (2 seconds for same item)
      const now = Date.now()
      const itemKey = createItemKey()
      if (lastPlayedItem && lastPlayedItem.itemKey === itemKey && (now - lastPlayedItem.timestamp) < 2000) {
        setError('Please wait a moment before playing the same item again.')
        setTimeout(() => setError(null), 3000)
        return
      }
      
      // Update last played item
      setLastPlayedItem({ itemKey, timestamp: now })
    }
    
    setIsPlaying(true)
    setError(null)
    
    if (voiceEngine === 'browser') {
      setSpeechStatus('speaking')
      
      try {
        // Build script for browser engine
        const script = buildVoiceScript({
          lesson,
          levelIndex: currentLevelIndex,
          itemIndex: currentItemIndex,
          displayLanguage,
          includeKeyPoints: true
        })
        
        // Split into sentences for browser engine
        const sentences = script.match(/[^.!?。！？]+[.!?。！？]*/g) || [script]
        
        for (const sentence of sentences) {
          if (speechStatus === 'paused') {
            // Wait if paused
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
      } catch (err) {
        console.error('Error playing voice:', err)
        setError(err instanceof Error ? err.message : 'An error occurred during playback')
      } finally {
        setIsPlaying(false)
        setSpeechStatus('idle')
      }
    } else {
      // AI voice with chunking
      try {
        await playAIVoiceChunked()
      } catch (err) {
        console.error('Error playing AI voice:', err)
        setError(err instanceof Error ? err.message : 'An error occurred during playback')
        setIsPlaying(false)
        setSpeechStatus('idle')
      }
    }
  }, [speechStatus, isSpeechSupported, voiceEngine, currentLevelIndex, currentItemIndex, displayLanguage, lesson, playAIVoiceChunked, speakText, aiVoiceAcknowledged, createItemKey, lastPlayedItem])

  // Initialize speech synthesis and check AI voice availability
  useEffect(() => {
    // Check browser speech synthesis support
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    } else {
      setSpeechStatus('unsupported')
    }
    
    // Check if AI voice is available by checking if API key is configured
    // This is a client-side check, actual validation happens server-side
    const checkAIVoiceAvailability = async () => {
      try {
        // Make a simple request to check if API is configured
        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'test' })
        })
        
        // If we get a 500 with AUTH error, API key is not configured
        const data = await response.json()
        if (data.error?.code === 'AUTH') {
          setIsAIVoiceAvailable(false)
        } else {
          // Any other response means API is available
          setIsAIVoiceAvailable(true)
        }
      } catch {
        // Network error means API might be available
        setIsAIVoiceAvailable(true)
      }
    }
    
    checkAIVoiceAvailability()
    
    // Cleanup on unmount
    return () => {
      stopSpeech()
    }
  }, [stopSpeech])

  // Fetch presets when AI voice engine is selected
  useEffect(() => {
    if (voiceEngine === 'ai' && isAIVoiceAvailable) {
      fetchPresets()
    }
  }, [voiceEngine, isAIVoiceAvailable, fetchPresets])

  // Handle language change with localStorage persistence
  const handleLanguageChange = (language: LanguageCode) => {
    setDisplayLanguage(language)
    if (typeof window !== 'undefined') {
      localStorage.setItem('la:displayLanguage', language)
    }
  }

  // Handle voice engine change with acknowledgment check
  const handleVoiceEngineChange = (engine: VoiceEngine) => {
    // Stop any current playback
    stopSpeech()
    
    // Check if switching to AI Voice and not acknowledged
    if (engine === 'ai' && !aiVoiceAcknowledged) {
      setShowAcknowledgmentDialog(true)
      // Don't change engine yet, wait for acknowledgment
      return
    }
    
    setVoiceEngine(engine)
    setError(null)
  }

  // Get current level and item
  const currentLevel = lesson.levels[currentLevelIndex]
  const currentItem = currentLevel.items[currentItemIndex]

  // Get presets for current language
  const presetsForCurrentLanguage = availablePresets.filter(
    preset => preset.languageCode === displayLanguage
  )

  // Pause/Resume speech
  const togglePause = () => {
    if (voiceEngine === 'browser' && speechSynthesisRef.current) {
      // Browser speech synthesis
      if (speechStatus === 'speaking') {
        speechSynthesisRef.current.pause()
        setSpeechStatus('paused')
      } else if (speechStatus === 'paused') {
        speechSynthesisRef.current.resume()
        setSpeechStatus('speaking')
      }
    } else if (voiceEngine === 'ai' && audioRef.current) {
      // AI voice audio playback
      if (speechStatus === 'speaking') {
        audioRef.current.pause()
        setSpeechStatus('paused')
      } else if (speechStatus === 'paused') {
        audioRef.current.play()
        setSpeechStatus('speaking')
      }
    }
  }

  // Replay current item
  const replayCurrentItem = useCallback(() => {
    stopSpeech()
    setTimeout(() => {
      playCurrentItem()
    }, 100)
  }, [stopSpeech, playCurrentItem])

  // Navigate to next item
  const nextItem = () => {
    stopSpeech()
    
    if (currentItemIndex < currentLevel.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1)
    } else if (currentLevelIndex < lesson.levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1)
      setCurrentItemIndex(0)
    }
  }

  // Navigate to previous item
  const previousItem = () => {
    stopSpeech()
    
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1)
    } else if (currentLevelIndex > 0) {
      setCurrentLevelIndex(currentLevelIndex - 1)
      setCurrentItemIndex(lesson.levels[currentLevelIndex - 1].items.length - 1)
    }
  }

  // Render current item content
  const renderCurrentItem = () => {
    switch (currentItem.kind) {
      case 'multiple_choice':
        return (
          <Card className="bg-la-surface border-la-border">
            <CardHeader>
              <CardTitle className="text-xl text-la-bg">
                {getLocalizedText(
                  currentItem.promptI18n,
                  currentItem.prompt,
                  displayLanguage
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentItem.options.map((option, index) => (
                <div
                  key={option.id}
                  className="p-3 rounded-lg border border-la-border bg-la-muted/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-la-muted text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <p className="flex-1">{getLocalizedText(
                      option.textI18n,
                      option.text,
                      displayLanguage
                    )}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
        
      case 'open_ended':
        return (
          <Card className="bg-la-surface border-la-border">
            <CardHeader>
              <CardTitle className="text-xl text-la-bg">
                {getLocalizedText(
                  currentItem.promptI18n,
                  currentItem.prompt,
                  displayLanguage
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border border-la-border bg-la-muted/20">
                <p className="text-la-muted italic">
                  Please provide your answer...
                </p>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'checkpoint':
        return (
          <Card className="bg-la-surface border-la-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-la-accent/10 flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-la-accent" />
                </div>
                <p className="text-lg text-la-bg">
                  {getLocalizedText(
                    currentItem.messageI18n,
                    currentItem.message,
                    displayLanguage
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  // Render preset selector
  const renderPresetSelector = () => {
    if (presetsLoading) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-la-muted">Voice:</span>
          <div className="text-xs text-la-muted">Loading presets...</div>
        </div>
      )
    }

    if (presetsError) {
      return (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          Voice presets unavailable: {presetsError}
        </div>
      )
    }

    if (presetsForCurrentLanguage.length === 0) {
      return (
        <div className="text-xs text-la-muted">
          No voice presets available for {displayLanguage === 'en' ? 'English' : 'Chinese'}
        </div>
      )
    }

    // Use segmented control for ≤5 presets, dropdown for more
    if (presetsForCurrentLanguage.length <= 5) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-la-muted">Voice:</span>
          <div className="flex gap-1">
            {presetsForCurrentLanguage.map(preset => (
              <Button
                key={preset.presetKey}
                variant={selectedPresetKey === preset.presetKey ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetChange(preset.presetKey)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )
    } else {
      // Dropdown fallback for many presets
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-la-muted">Voice:</span>
          <select
            value={selectedPresetKey}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="text-xs px-2 py-1 border border-la-border rounded"
          >
            <option value="">Select voice...</option>
            {presetsForCurrentLanguage.map(preset => (
              <option key={preset.presetKey} value={preset.presetKey}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      )
    }
  }

  // Render voice controls
  const renderVoiceControls = () => {
    if (!isSpeechSupported) {
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
      <Card className="bg-la-surface border-la-border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Voice Engine Toggle */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-la-muted">Voice Engine:</span>
                <div className="flex gap-1">
                  <Button
                    variant={voiceEngine === 'browser' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVoiceEngineChange('browser')}
                    className="text-xs"
                  >
                    Browser
                  </Button>
                  <Button
                    variant={voiceEngine === 'ai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVoiceEngineChange('ai')}
                    disabled={!isAIVoiceAvailable}
                    className="text-xs"
                    title={!isAIVoiceAvailable ? "AI Voice is not configured" : undefined}
                  >
                    AI Voice
                  </Button>
                </div>
              </div>
              
              {!isAIVoiceAvailable && voiceEngine === 'ai' && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  AI Voice is not available. Please configure ElevenLabs API key.
                </div>
              )}
              
              {/* Voice Preset Selector for AI Voice */}
              {voiceEngine === 'ai' && isAIVoiceAvailable && (
                renderPresetSelector()
              )}
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                speechStatus === 'speaking' ? "bg-green-500" :
                speechStatus === 'paused' ? "bg-yellow-500" :
                speechStatus === 'loading' || isBufferingRef.current ? "bg-blue-500" :
                "bg-gray-400"
              )} />
              <span className="text-sm text-la-muted">
                {speechStatus === 'speaking' ? "Speaking..." :
                 speechStatus === 'paused' ? "Paused" :
                 speechStatus === 'loading' || isBufferingRef.current ? "Loading..." :
                 "Ready"}
              </span>
            </div>

            {/* Error display */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {error}
              </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <Button
                  onClick={playCurrentItem}
                  className="bg-la-accent text-la-bg hover:bg-la-accent/90"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Play
                </Button>
              ) : (
                <>
                  {speechStatus === 'speaking' ? (
                    <Button
                      onClick={togglePause}
                      variant="outline"
                      size="sm"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={togglePause}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </>
              )}
              
              <Button
                onClick={stopSpeech}
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
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Replay
              </Button>
            </div>

            {/* Speech rate control */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-la-muted">Speed:</span>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-la-muted w-10">{speechRate}x</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - Levels List */}
      <div className="w-full lg:w-80 lg:min-h-screen lg:sticky lg:top-0 border-r border-la-border/20 bg-la-bg/50 p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-la-surface">Voice Mode</h2>
          <div className="space-y-2">
            {lesson.levels.map((level, levelIndex) => (
              <div key={level.id} className="space-y-1">
                <div className={cn(
                  "p-2 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                  levelIndex === currentLevelIndex
                    ? "bg-la-accent text-white"
                    : "bg-la-surface/20 text-la-muted hover:bg-la-surface/30"
                )}
                  onClick={() => {
                    setCurrentLevelIndex(levelIndex)
                    setCurrentItemIndex(0)
                    stopSpeech()
                  }}
                >
                  {levelIndex + 1}. {level.title}
                </div>
                {levelIndex === currentLevelIndex && (
                  <div className="ml-4 space-y-1">
                    {level.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-1 rounded text-xs cursor-pointer transition-colors",
                          itemIndex === currentItemIndex
                            ? "bg-la-accent/20 text-la-surface"
                            : "text-la-muted hover:text-la-surface"
                        )}
                        onClick={() => {
                          setCurrentItemIndex(itemIndex)
                          stopSpeech()
                        }}
                      >
                        {item.kind === 'multiple_choice' ? 'Q' :
                         item.kind === 'open_ended' ? 'OE' : 'CP'} {itemIndex + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentLevelIndex}-${currentItemIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header with Language Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-la-surface mb-2">
                  {lesson.title} - Voice Mode
                </h1>
                <p className="text-la-muted">
                  Level {currentLevelIndex + 1} of {lesson.levels.length} • 
                  Item {currentItemIndex + 1} of {currentLevel.items.length}
                </p>
              </div>
              
              {/* Language Toggle */}
              <LanguageToggle
                currentLanguage={displayLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>

            {/* Voice Controls */}
            {renderVoiceControls()}

            {/* Current Item Content */}
            {renderCurrentItem()}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={previousItem}
                variant="outline"
                disabled={currentLevelIndex === 0 && currentItemIndex === 0}
              >
                Previous
              </Button>
              
              <Button
                onClick={nextItem}
                disabled={
                  currentLevelIndex === lesson.levels.length - 1 && 
                  currentItemIndex === currentLevel.items.length - 1
                }
              >
                Next
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* AI Voice Acknowledgment Dialog */}
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
              onClick={() => {
                setShowAcknowledgmentDialog(false)
                // Switch back to browser if user cancels
                setVoiceEngine('browser')
              }}
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
    </div>
  )
}