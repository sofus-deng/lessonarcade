"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { type LessonArcadeLesson, type LanguageCode } from '@/lib/lessonarcade/schema'
import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/ui/cn'
import { Play, Pause, Square, RotateCcw, Volume2, AlertCircle } from 'lucide-react'

interface VoiceLessonPlayerProps {
  lesson: LessonArcadeLesson
}

type SpeechStatus = 'idle' | 'speaking' | 'paused' | 'unsupported'

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
  
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    } else {
      setSpeechStatus('unsupported')
    }
  }, [])

  // Handle language change with localStorage persistence
  const handleLanguageChange = (language: LanguageCode) => {
    setDisplayLanguage(language)
    if (typeof window !== 'undefined') {
      localStorage.setItem('la:displayLanguage', language)
    }
  }

  // Get the current level and item
  const currentLevel = lesson.levels[currentLevelIndex]
  const currentItem = currentLevel.items[currentItemIndex]

  // Check if speech synthesis is supported
  const isSpeechSupported = speechStatus !== 'unsupported'

  // Generate voice script for current item
  const generateVoiceScript = (): string[] => {
    const script: string[] = []
    
    // Add level title
    script.push(currentLevel.title)
    
    // Add key points if available
    if (currentLevel.keyPoints && currentLevel.keyPoints.length > 0) {
      script.push("Key points:")
      currentLevel.keyPoints.forEach(point => {
        script.push(point)
      })
    }
    
    // Add item content based on type
    switch (currentItem.kind) {
      case 'multiple_choice':
        script.push(getLocalizedText(
          currentItem.promptI18n,
          currentItem.prompt,
          displayLanguage
        ))
        
        script.push("The options are:")
        currentItem.options.forEach((option, index) => {
          script.push(`Option ${String.fromCharCode(65 + index)}: ${getLocalizedText(
            option.textI18n,
            option.text,
            displayLanguage
          )}`)
        })
        break
        
      case 'open_ended':
        script.push(getLocalizedText(
          currentItem.promptI18n,
          currentItem.prompt,
          displayLanguage
        ))
        script.push("Please provide your answer.")
        break
        
      case 'checkpoint':
        script.push(getLocalizedText(
          currentItem.messageI18n,
          currentItem.message,
          displayLanguage
        ))
        break
    }
    
    return script
  }

  // Speak text with current settings
  const speakText = (text: string): Promise<void> => {
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
  }

  // Play the entire script for current item
  const playCurrentItem = async () => {
    if (!isSpeechSupported) return
    
    setIsPlaying(true)
    setSpeechStatus('speaking')
    
    try {
      const script = generateVoiceScript()
      
      for (const text of script) {
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
        
        await speakText(text)
      }
    } catch (error) {
      console.error('Error playing voice:', error)
    } finally {
      setIsPlaying(false)
      setSpeechStatus('idle')
    }
  }

  // Stop speech
  const stopSpeech = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }
    setIsPlaying(false)
    setSpeechStatus('idle')
  }

  // Pause/Resume speech
  const togglePause = () => {
    if (!speechSynthesisRef.current) return
    
    if (speechStatus === 'speaking') {
      speechSynthesisRef.current.pause()
      setSpeechStatus('paused')
    } else if (speechStatus === 'paused') {
      speechSynthesisRef.current.resume()
      setSpeechStatus('speaking')
    }
  }

  // Replay current item
  const replayCurrentItem = () => {
    stopSpeech()
    setTimeout(() => {
      playCurrentItem()
    }, 100)
  }

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
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                speechStatus === 'speaking' ? "bg-green-500" :
                speechStatus === 'paused' ? "bg-yellow-500" :
                "bg-gray-400"
              )} />
              <span className="text-sm text-la-muted">
                {speechStatus === 'speaking' ? "Speaking..." :
                 speechStatus === 'paused' ? "Paused" :
                 "Ready"}
              </span>
            </div>

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
    </div>
  )
}