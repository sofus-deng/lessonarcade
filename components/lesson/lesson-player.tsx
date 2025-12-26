"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { type LessonArcadeLesson, type LessonArcadeItem, type LessonArcadeMultipleChoiceItem, type LanguageCode } from '@/lib/lessonarcade/schema'
import { LevelSidebar } from './level-sidebar'
import { LevelHeader } from './level-header'
import { LessonSummary } from './lesson-summary'
import { MultipleChoiceItem } from './items/multiple-choice-item'
import { OpenEndedItem } from './items/open-ended-item'
import { CheckpointItem } from './items/checkpoint-item'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface LessonPlayerProps {
  lesson: LessonArcadeLesson
}

type LessonMode = "focus" | "arcade"

interface AnswerState {
  selectedOptions: string[]  // Current selected options
  isSubmitted: boolean       // Whether to answer has been submitted/locked
  isCorrect?: boolean        // Whether to answer is correct (for multiple choice)
  pointsEarned?: number      // Points earned for this answer
  basePointsEarned?: number // Base points earned (separate from bonus)
  bonusPointsEarned?: number // Bonus points earned (Arcade mode only)
  firstShownAt?: number      // Timestamp when item was first shown (Arcade mode)
  submittedAt?: number       // Timestamp when item was submitted (Arcade mode)
}

interface ScoringState {
  mode: LessonMode           // Current lesson mode (focus or arcade)
  totalScore: number         // Total points across all levels
  baseScore: number          // Base points only (excluding bonuses)
  bonusScore: number         // Bonus points only (Arcade mode)
  levelScores: Record<string, number>  // Points per level ID
  levelBaseScores: Record<string, number>  // Base points per level ID
  levelBonusScores: Record<string, number>  // Bonus points per level ID
  streak: number             // Current consecutive correct answers
  answeredItems: Record<string, AnswerState>  // Enhanced answer tracking
  itemFirstShown: Record<string, number>  // Track when items were first shown
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [displayLanguage, setDisplayLanguage] = useState<LanguageCode>(() => {
    // Initialize displayLanguage from localStorage during initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('la:displayLanguage') || 'en'
    }
    return 'en'
  })
  const [scoringState, setScoringState] = useState<ScoringState>({
    mode: "focus",
    totalScore: 0,
    baseScore: 0,
    bonusScore: 0,
    levelScores: {},
    levelBaseScores: {},
    levelBonusScores: {},
    streak: 0,
    answeredItems: {},
    itemFirstShown: {}
  })
  
  // Refs for focus management
  const levelHeaderRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  // Handle language change with localStorage persistence
  const handleLanguageChange = (language: LanguageCode) => {
    setDisplayLanguage(language)
    if (typeof window !== 'undefined') {
      localStorage.setItem('la:displayLanguage', language)
    }
  }

  const currentLevel = lesson.levels[currentLevelIndex]

  // Track when items are first shown for Arcade mode
  const trackItemShown = (itemId: string) => {
    if (scoringState.mode === "arcade" && !scoringState.itemFirstShown[itemId]) {
      setScoringState(prev => ({
        ...prev,
        itemFirstShown: {
          ...prev.itemFirstShown,
          [itemId]: Date.now()
        }
      }))
    }
  }

  // Handle mode switching
  const handleModeChange = (newMode: LessonMode) => {
    setScoringState(prev => ({
      ...prev,
      mode: newMode
    }))
  }

  const handleLevelSelect = (index: number) => {
    setCurrentLevelIndex(index)
    // Move focus to level header after level change
    setTimeout(() => {
      levelHeaderRef.current?.focus()
    }, 100)
  }

  const calculateMultipleChoiceScore = (
    item: LessonArcadeMultipleChoiceItem,
    selectedOptions: string[],
    itemId: string,
    submittedAt?: number
  ) => {
    // Check if answer is correct
    const isCorrect =
      selectedOptions.length === item.correctOptionIds.length &&
      selectedOptions.every(option => item.correctOptionIds.includes(option))
    
    // Calculate base points
    const basePoints = isCorrect ? (item.points || 1) : 0
    
    // Calculate bonus points for Arcade mode
    let bonusPoints = 0
    if (scoringState.mode === "arcade" && isCorrect && submittedAt) {
      const firstShownAt = scoringState.itemFirstShown[itemId]
      if (firstShownAt) {
        const timeTaken = (submittedAt - firstShownAt) / 1000 // Convert to seconds
        if (timeTaken <= 6) {
          bonusPoints = 1
        }
      }
    }
    
    const totalPoints = basePoints + bonusPoints
    
    return { isCorrect, basePoints, bonusPoints, totalPoints }
  }

  const updateScoringState = (
    itemId: string,
    item: LessonArcadeItem,
    isCorrect: boolean,
    basePoints: number,
    bonusPoints: number
  ) => {
    // Find which level this item belongs to
    const level = lesson.levels.find(l => l.items.some(i => i.id === itemId))
    const levelId = level?.id || ''
    
    setScoringState(prev => {
      const newLevelScores = { ...prev.levelScores }
      const newLevelBaseScores = { ...prev.levelBaseScores }
      const newLevelBonusScores = { ...prev.levelBonusScores }
      
      const totalPoints = basePoints + bonusPoints
      
      newLevelScores[levelId] = (newLevelScores[levelId] || 0) + totalPoints
      newLevelBaseScores[levelId] = (newLevelBaseScores[levelId] || 0) + basePoints
      newLevelBonusScores[levelId] = (newLevelBonusScores[levelId] || 0) + bonusPoints
      
      // Update streak based on multiple choice correctness
      let newStreak = prev.streak
      if (item.kind === 'multiple_choice') {
        if (isCorrect) {
          newStreak = prev.streak + 1
        } else {
          newStreak = 0
        }
      }
      
      return {
        ...prev,
        totalScore: prev.totalScore + totalPoints,
        baseScore: prev.baseScore + basePoints,
        bonusScore: prev.bonusScore + bonusPoints,
        levelScores: newLevelScores,
        levelBaseScores: newLevelBaseScores,
        levelBonusScores: newLevelBonusScores,
        streak: newStreak
      }
    })
  }

  const handleAnswerSelect = (itemId: string, optionIds: string[]) => {
    setScoringState(prev => {
      const existingAnswer = prev.answeredItems[itemId]
      
      // If already submitted, don't allow changes
      if (existingAnswer?.isSubmitted) {
        return prev
      }
      
      const newAnsweredItems = {
        ...prev.answeredItems,
        [itemId]: {
          selectedOptions: optionIds,
          isSubmitted: false
        }
      }
      
      return {
        ...prev,
        answeredItems: newAnsweredItems
      }
    })
  }

  const handleAnswerSubmit = (itemId: string) => {
    const item = currentLevel.items.find(i => i.id === itemId)
    if (!item) return
    
    const currentAnswer = scoringState.answeredItems[itemId]
    if (!currentAnswer || currentAnswer.isSubmitted) return
    
    setScoringState(prev => {
      const submittedAt = Date.now()
      
      if (item.kind === 'multiple_choice') {
        const { isCorrect, basePoints, bonusPoints, totalPoints } = calculateMultipleChoiceScore(
          item as LessonArcadeMultipleChoiceItem,
          currentAnswer.selectedOptions,
          itemId,
          submittedAt
        )
        
        // Update scoring state
        updateScoringState(itemId, item, isCorrect, basePoints, bonusPoints)
        
        return {
          ...prev,
          answeredItems: {
            ...prev.answeredItems,
            [itemId]: {
              ...currentAnswer,
              isSubmitted: true,
              isCorrect,
              pointsEarned: totalPoints,
              basePointsEarned: basePoints,
              bonusPointsEarned: bonusPoints,
              submittedAt
            }
          }
        }
      } else if (item.kind === 'open_ended') {
        return {
          ...prev,
          answeredItems: {
            ...prev.answeredItems,
            [itemId]: {
              ...currentAnswer,
              isSubmitted: true,
              pointsEarned: 0,
              basePointsEarned: 0,
              bonusPointsEarned: 0,
              submittedAt
            }
          }
        }
      }
      
      return prev
    })
  }

  const handleOpenEndedChange = (itemId: string, value: string) => {
    const existingAnswer = scoringState.answeredItems[itemId]
    
    // If already submitted, don't allow changes
    if (existingAnswer?.isSubmitted) {
      return
    }
    
    setScoringState(prev => ({
      ...prev,
      answeredItems: {
        ...prev.answeredItems,
        [itemId]: {
          selectedOptions: [value],
          isSubmitted: false
        }
      }
    }))
  }

  const renderItem = (item: LessonArcadeItem) => {
    const currentAnswer = scoringState.answeredItems[item.id] || { selectedOptions: [], isSubmitted: false }
    
    // Track when item is shown for Arcade mode
    if (item.kind === 'multiple_choice' && !currentAnswer.isSubmitted) {
      trackItemShown(item.id)
    }
    
    switch (item.kind) {
      case 'multiple_choice':
        return (
          <MultipleChoiceItem
            key={item.id}
            item={item}
            selectedOptions={currentAnswer.selectedOptions}
            isLocked={currentAnswer.isSubmitted}
            mode={scoringState.mode}
            firstShownAt={scoringState.itemFirstShown[item.id]}
            displayLanguage={displayLanguage}
            onSelectionChange={(optionIds: string[]) => handleAnswerSelect(item.id, optionIds)}
            onSubmit={() => handleAnswerSubmit(item.id)}
          />
        )
      case 'open_ended':
        return (
          <OpenEndedItem
            key={item.id}
            item={item}
            value={currentAnswer.selectedOptions[0] || ''}
            displayLanguage={displayLanguage}
            onChange={(value: string) => handleOpenEndedChange(item.id, value)}
            onSubmit={() => handleAnswerSubmit(item.id)}
          />
        )
      case 'checkpoint':
        return <CheckpointItem key={item.id} item={item} displayLanguage={displayLanguage} />
      default:
        return null
    }
  }

  // Check if lesson is complete (all items answered)
  const isLessonComplete = currentLevel.items.every(item => {
    const answer = scoringState.answeredItems[item.id]
    return answer?.isSubmitted
  })

  // Move focus to summary when lesson completes
  useEffect(() => {
    if (isLessonComplete && summaryRef.current) {
      summaryRef.current.focus()
    }
  }, [isLessonComplete])

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - Levels List */}
      <div className="w-full lg:w-80 lg:min-h-screen lg:sticky lg:top-0 border-r border-la-border/20 bg-la-bg/50">
        <LevelSidebar
          levels={lesson.levels}
          currentLevelIndex={currentLevelIndex}
          onLevelSelect={handleLevelSelect}
          scoringState={scoringState}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevelIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header with Language Toggle and Voice Conversation CTA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                {/* Lesson Summary */}
                <LessonSummary
                  lesson={lesson}
                  scoringState={scoringState}
                  onModeChange={handleModeChange}
                />
              </div>
              
              {/* Language Toggle and Voice Conversation CTA */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button asChild variant="outline" size="sm" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent">
                  <Link href={`/agents?lesson=${encodeURIComponent(lesson.slug)}`}>
                    Voice Conversation
                  </Link>
                </Button>
                <LanguageToggle
                  currentLanguage={displayLanguage}
                  onLanguageChange={handleLanguageChange}
                />
              </div>
            </div>

            {/* Level Header */}
            <div ref={levelHeaderRef} tabIndex={-1}>
              <LevelHeader
                level={currentLevel}
                scoringState={scoringState}
              />
            </div>

            {/* Items */}
            <div className="space-y-4">
              {currentLevel.items.map(renderItem)}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Lesson Complete Summary - shown when all items are answered */}
        {isLessonComplete && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            className="mt-8"
            role="status"
            aria-live="polite"
            aria-label="Lesson complete"
          >
            <LessonSummary
              lesson={lesson}
              scoringState={scoringState}
              onModeChange={handleModeChange}
            />
          </div>
        )}
      </main>
    </div>
  )
}
