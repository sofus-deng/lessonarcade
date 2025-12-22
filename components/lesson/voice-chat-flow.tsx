"use client"

import { useEffect, useMemo, useState } from 'react'
import type { LessonArcadeLesson, LessonArcadeItem, LanguageCode } from '@/lib/lessonarcade/schema'
import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import {
  initChatFlow,
  startChatFlow,
  submitAnswer,
  nextStep,
  type ChatFlowState
} from '@/lib/lessonarcade/voice/chat-flow'
import { VoiceControlsMin, type VoiceEngine } from '@/components/lesson/voice-controls-min'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { cn } from '@/lib/ui/cn'

interface VoiceChatFlowProps {
  lesson: LessonArcadeLesson
  initialDisplayLanguage?: LanguageCode
}

const resolveInitialLanguage = (value?: string): LanguageCode => {
  if (value === 'en' || value === 'zh') {
    return value
  }

  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = localStorage.getItem('la:displayLanguage')
  if (stored === 'en' || stored === 'zh') {
    return stored
  }

  return 'en'
}

const getItemPrompt = (item: LessonArcadeItem, language: LanguageCode) => {
  if (item.kind === 'checkpoint') {
    return getLocalizedText(item.messageI18n, item.message, language)
  }
  return getLocalizedText(item.promptI18n, item.prompt, language)
}

export function VoiceChatFlow({ lesson, initialDisplayLanguage }: VoiceChatFlowProps) {
  const initialLanguage = resolveInitialLanguage(initialDisplayLanguage)
  const [displayLanguage, setDisplayLanguage] = useState<LanguageCode>(initialLanguage)
  const [chatState, setChatState] = useState<ChatFlowState>(() => (
    startChatFlow(
      initChatFlow(lesson, { displayLanguage: initialLanguage, includeKeyPoints: true }),
      lesson
    )
  ))
  const [awaitingNext, setAwaitingNext] = useState(false)
  const [openEndedText, setOpenEndedText] = useState('')
  const voiceEngine: VoiceEngine = 'browser'
  const [voicePresetKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:voicePresetKey') || ''
    }
    return ''
  })
  const voiceRate = 1.0

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem('la:displayLanguage', displayLanguage)
  }, [displayLanguage])

  const totalItems = useMemo(() => (
    lesson.levels.reduce((sum, level) => sum + level.items.length, 0)
  ), [lesson.levels])

  const currentItemNumber = useMemo(() => {
    const previousCount = lesson.levels
      .slice(0, chatState.levelIndex)
      .reduce((sum, level) => sum + level.items.length, 0)
    return previousCount + chatState.itemIndex + 1
  }, [chatState, lesson.levels])

  const currentLevel = lesson.levels[chatState.levelIndex]
  const currentItem = currentLevel.items[chatState.itemIndex]
  const progressItemNumber = chatState?.finished ? totalItems : currentItemNumber

  const handleLanguageChange = (language: LanguageCode) => {
    setDisplayLanguage(language)
    setChatState(prev => ({ ...prev, displayLanguage: language }))
  }

  const handleAnswer = (payload: { kind: 'multiple_choice'; optionId: string } | { kind: 'open_ended'; text: string }) => {
    if (!chatState) return
    setChatState(prev => (prev ? submitAnswer(prev, lesson, payload) : prev))
    setAwaitingNext(true)
  }

  const handleNextStep = () => {
    if (!chatState) return
    setChatState(prev => (prev ? nextStep(prev, lesson) : prev))
    setAwaitingNext(false)
    setOpenEndedText('')
  }

  return (
    <div className="min-h-screen bg-la-bg">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-la-surface">{lesson.title}</h1>
            <div className="text-sm text-la-muted">
              Item {progressItemNumber} / {totalItems} • {currentLevel.title}
            </div>
          </div>
          <LanguageToggle
            currentLanguage={displayLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </header>

        <VoiceControlsMin
          lesson={lesson}
          levelIndex={chatState.levelIndex}
          itemIndex={chatState.itemIndex}
          displayLanguage={displayLanguage}
          engine={voiceEngine}
          presetKey={voicePresetKey}
          rate={voiceRate}
        />

        <Card className="bg-la-surface/40 border-la-border">
          <CardContent className="pt-6 space-y-3">
            {chatState.messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap border",
                    message.role === 'user'
                      ? "bg-la-accent text-la-bg border-la-accent/80"
                      : "bg-la-surface text-la-bg border-la-border"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-la-surface border-la-border">
          <CardContent className="pt-6 space-y-4">
            {chatState.finished ? (
              <div className="text-sm text-la-muted">Lesson complete. Review the transcript above.</div>
            ) : currentItem ? (
              <>
                <div className="text-sm text-la-muted">
                  {getItemPrompt(currentItem, displayLanguage)}
                </div>
                {currentItem.kind === 'multiple_choice' && (
                  <div className="grid gap-2">
                    {currentItem.options.map((option, index) => {
                      const optionText = getLocalizedText(option.textI18n, option.text, displayLanguage)
                      return (
                        <Button
                          key={option.id}
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleAnswer({ kind: 'multiple_choice', optionId: option.id })}
                          disabled={awaitingNext}
                        >
                          {String.fromCharCode(65 + index)}. {optionText}
                        </Button>
                      )
                    })}
                  </div>
                )}

                {currentItem.kind === 'open_ended' && (
                  <div className="space-y-3">
                    <Textarea
                      value={openEndedText}
                      onChange={(event) => setOpenEndedText(event.target.value)}
                      placeholder={getLocalizedText(
                        currentItem.placeholderI18n,
                        currentItem.placeholder || 'Type your response...',
                        displayLanguage
                      )}
                      rows={4}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAnswer({ kind: 'open_ended', text: openEndedText.trim() })}
                        disabled={awaitingNext || openEndedText.trim().length === 0}
                      >
                        Submit
                      </Button>
                      {awaitingNext && (
                        <Button variant="outline" onClick={handleNextStep}>
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {currentItem.kind === 'checkpoint' && (
                  <div className="flex items-center gap-2">
                    <Button onClick={handleNextStep}>Continue</Button>
                  </div>
                )}

                {currentItem.kind === 'multiple_choice' && awaitingNext && (
                  <Button variant="outline" onClick={handleNextStep}>
                    Next
                  </Button>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
