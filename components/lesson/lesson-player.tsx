"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { type LessonArcadeLesson, type LessonArcadeItem, type LessonArcadeMultipleChoiceItem } from '@/lib/lessonarcade/schema'
import { LevelSidebar } from './level-sidebar'
import { LevelHeader } from './level-header'
import { LessonSummary } from './lesson-summary'
import { MultipleChoiceItem } from './items/multiple-choice-item'
import { OpenEndedItem } from './items/open-ended-item'
import { CheckpointItem } from './items/checkpoint-item'

interface LessonPlayerProps {
  lesson: LessonArcadeLesson
}

interface AnswerState {
  selectedOptions: string[]  // Current selected options
  isSubmitted: boolean       // Whether the answer has been submitted/locked
  isCorrect?: boolean        // Whether the answer is correct (for multiple choice)
  pointsEarned?: number      // Points earned for this answer
}

interface ScoringState {
  totalScore: number         // Total points across all levels
  levelScores: Record<string, number>  // Points per level ID
  streak: number             // Current consecutive correct answers
  answeredItems: Record<string, AnswerState>  // Enhanced answer tracking
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [scoringState, setScoringState] = useState<ScoringState>({
    totalScore: 0,
    levelScores: {},
    streak: 0,
    answeredItems: {}
  })

  const currentLevel = lesson.levels[currentLevelIndex]

  const handleLevelSelect = (index: number) => {
    setCurrentLevelIndex(index)
  }

  const calculateMultipleChoiceScore = (item: LessonArcadeMultipleChoiceItem, selectedOptions: string[]) => {
    // Check if answer is correct
    const isCorrect =
      selectedOptions.length === item.correctOptionIds.length &&
      selectedOptions.every(option => item.correctOptionIds.includes(option))
    
    // Calculate points
    const points = isCorrect ? (item.points || 1) : 0
    
    return { isCorrect, points }
  }

  const updateScoringState = (itemId: string, item: LessonArcadeItem, isCorrect: boolean, points: number) => {
    // Find which level this item belongs to
    const level = lesson.levels.find(l => l.items.some(i => i.id === itemId))
    const levelId = level?.id || ''
    
    setScoringState(prev => {
      const newLevelScores = { ...prev.levelScores }
      newLevelScores[levelId] = (newLevelScores[levelId] || 0) + points
      
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
        totalScore: prev.totalScore + points,
        levelScores: newLevelScores,
        streak: newStreak,
        answeredItems: prev.answeredItems
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
    
    if (item.kind === 'multiple_choice') {
      const { isCorrect, points } = calculateMultipleChoiceScore(item as LessonArcadeMultipleChoiceItem, currentAnswer.selectedOptions)
      
      // Update answered items
      setScoringState(prev => ({
        ...prev,
        answeredItems: {
          ...prev.answeredItems,
          [itemId]: {
            ...currentAnswer,
            isSubmitted: true,
            isCorrect,
            pointsEarned: points
          }
        }
      }))
      
      // Update scoring state
      updateScoringState(itemId, item, isCorrect, points)
    } else if (item.kind === 'open_ended') {
      // Mark as answered but no points
      setScoringState(prev => ({
        ...prev,
        answeredItems: {
          ...prev.answeredItems,
          [itemId]: {
            ...currentAnswer,
            isSubmitted: true,
            pointsEarned: 0
          }
        }
      }))
    }
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

    switch (item.kind) {
      case 'multiple_choice':
        return (
          <MultipleChoiceItem
            key={item.id}
            item={item}
            selectedOptions={currentAnswer.selectedOptions}
            isLocked={currentAnswer.isSubmitted}
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
            onChange={(value: string) => handleOpenEndedChange(item.id, value)}
            onSubmit={() => handleAnswerSubmit(item.id)}
          />
        )
      case 'checkpoint':
        return <CheckpointItem key={item.id} item={item} />
      default:
        return null
    }
  }

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
      <div className="flex-1 p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevelIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Lesson Summary */}
            <LessonSummary
              lesson={lesson}
              scoringState={scoringState}
            />

            {/* Level Header */}
            <LevelHeader
              level={currentLevel}
              scoringState={scoringState}
            />

            {/* Items */}
            <div className="space-y-4">
              {currentLevel.items.map(renderItem)}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}