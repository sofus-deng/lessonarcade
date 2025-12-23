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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { cn } from '@/lib/ui/cn'
import { useRouter } from 'next/navigation'

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
  return getLocalizedText(undefined, item.prompt, language)
}

// Calculate total count of answerable items (multiple choice + open ended)
const getTotalAnswerableCount = (lesson: LessonArcadeLesson) => {
  return lesson.levels.reduce((sum, level) => 
    sum + level.items.filter(item => 
      item.kind === 'multiple_choice' || item.kind === 'open_ended'
    ).length, 0)
}

// Chat End Summary Component
const ChatEndSummary = ({ 
  lesson, 
  chatState, 
  onReplay 
}: { 
  lesson: LessonArcadeLesson
  chatState: ChatFlowState
  onReplay: () => void 
}) => {
  const router = useRouter()
  const totalAnswerable = getTotalAnswerableCount(lesson)
  const completionRate = totalAnswerable > 0 
    ? Math.round((chatState.answeredCount / totalAnswerable) * 100) 
    : 0
  const accuracyRate = chatState.answeredCount > 0 
    ? Math.round((chatState.correctCount / chatState.answeredCount) * 100) 
    : 0

  return (
    <Card className="bg-gradient-to-br from-la-accent/10 to-la-primary/10 border-la-accent/30">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-la-accent text-white flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-la-bg">Lesson Complete!</h2>
        <p className="text-la-muted">{lesson.title}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-la-surface/50 rounded-lg">
            <div className="text-2xl font-bold text-la-accent">{completionRate}%</div>
            <div className="text-sm text-la-muted">Completed</div>
            <div className="text-xs text-la-muted mt-1">
              {chatState.answeredCount}/{totalAnswerable} answered
            </div>
          </div>
          <div className="text-center p-4 bg-la-surface/50 rounded-lg">
            <div className="text-2xl font-bold text-la-primary">{accuracyRate}%</div>
            <div className="text-sm text-la-muted">Accuracy</div>
            <div className="text-xs text-la-muted mt-1">
              {chatState.correctCount}/{chatState.answeredCount} correct
            </div>
          </div>
          <div className="text-center p-4 bg-la-surface/50 rounded-lg">
            <div className="text-2xl font-bold text-la-bg">{lesson.levels.length}</div>
            <div className="text-sm text-la-muted">Levels</div>
            <div className="text-xs text-la-muted mt-1">
              {lesson.levels.reduce((sum, level) => sum + level.items.length, 0)} items
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={onReplay}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Replay Lesson
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/demo')}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Demos
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  
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
  
  const totalAnswerable = useMemo(() => getTotalAnswerableCount(lesson), [lesson])

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
    
    // For multiple choice, track the selected option and correctness
    if (payload.kind === 'multiple_choice' && currentItem.kind === 'multiple_choice') {
      setSelectedOptionId(payload.optionId)
      const correct = currentItem.correctOptionIds.includes(payload.optionId)
      setIsCorrect(correct)
      setShowFeedback(true)
    }
    
    setChatState(prev => (prev ? submitAnswer(prev, lesson, payload) : prev))
    setAwaitingNext(true)
  }

  const handleNextStep = () => {
    if (!chatState) return
    setChatState(prev => (prev ? nextStep(prev, lesson) : prev))
    setAwaitingNext(false)
    setOpenEndedText('')
    setSelectedOptionId(null)
    setShowFeedback(false)
    setIsCorrect(null)
  }

  const handleReplay = () => {
    const newState = startChatFlow(
      initChatFlow(lesson, { displayLanguage, includeKeyPoints: true }),
      lesson
    )
    setChatState(newState)
    setAwaitingNext(false)
    setOpenEndedText('')
    setSelectedOptionId(null)
    setShowFeedback(false)
    setIsCorrect(null)
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
            {!chatState.finished && totalAnswerable > 0 && (
              <div className="text-xs text-la-muted mt-1">
                Progress: {chatState.answeredCount}/{totalAnswerable} answered • 
                {chatState.answeredCount > 0 && ` ${chatState.correctCount}/${chatState.answeredCount} correct`}
              </div>
            )}
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

        {chatState.finished ? (
          <ChatEndSummary 
            lesson={lesson} 
            chatState={chatState} 
            onReplay={handleReplay} 
          />
        ) : (
          <Card className="bg-la-surface border-la-border">
            <CardContent className="pt-6 space-y-4">
              {currentItem ? (
                <>
                  <div className="text-sm text-la-muted">
                    {getItemPrompt(currentItem, displayLanguage)}
                  </div>
                  {currentItem.kind === 'multiple_choice' && (
                    <div className="grid gap-2">
                      {currentItem.options.map((option, index) => {
                        const optionText = getLocalizedText(option.textI18n, option.text, displayLanguage)
                        const isSelected = selectedOptionId === option.id
                        const isOptionCorrect = currentItem.correctOptionIds.includes(option.id)
                        
                        return (
                          <Button
                            key={option.id}
                            variant="outline"
                            className={cn(
                              "justify-start text-left h-auto p-4",
                              isSelected && showFeedback && isOptionCorrect && "bg-green-50 border-green-300 text-green-900",
                              isSelected && showFeedback && !isOptionCorrect && "bg-red-50 border-red-300 text-red-900",
                              awaitingNext && "cursor-not-allowed opacity-75"
                            )}
                            onClick={() => !awaitingNext && handleAnswer({ kind: 'multiple_choice', optionId: option.id })}
                            disabled={awaitingNext}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium",
                                isSelected && showFeedback && isOptionCorrect && "bg-green-500 border-green-500 text-white",
                                isSelected && showFeedback && !isOptionCorrect && "bg-red-500 border-red-500 text-white",
                                !isSelected && "border-la-muted text-la-muted"
                              )}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1">{optionText}</span>
                              {isSelected && showFeedback && (
                                <div className={cn(
                                  "text-xs font-medium px-2 py-1 rounded",
                                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                )}>
                                  {isCorrect ? "Correct" : "Incorrect"}
                                </div>
                              )}
                            </div>
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
                        disabled={awaitingNext}
                        className={awaitingNext ? "opacity-75 cursor-not-allowed" : ""}
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
        )}
      </div>
    </div>
  )
}
