"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { type LessonArcadeLesson, type LessonArcadeItem } from '@/lib/lessonarcade/schema'
import { LevelSidebar } from './level-sidebar'
import { LevelHeader } from './level-header'
import { MultipleChoiceItem } from './items/multiple-choice-item'
import { OpenEndedItem } from './items/open-ended-item'
import { CheckpointItem } from './items/checkpoint-item'

interface LessonPlayerProps {
  lesson: LessonArcadeLesson
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})

  const currentLevel = lesson.levels[currentLevelIndex]

  const handleLevelSelect = (index: number) => {
    setCurrentLevelIndex(index)
  }

  const handleAnswerSelect = (itemId: string, optionIds: string[]) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [itemId]: optionIds
    }))
  }

  const renderItem = (item: LessonArcadeItem) => {
    const currentSelection = selectedAnswers[item.id] || []

    switch (item.kind) {
      case 'multiple_choice':
        return (
          <MultipleChoiceItem
            key={item.id}
            item={item}
            selectedOptions={currentSelection}
            onSelectionChange={(optionIds: string[]) => handleAnswerSelect(item.id, optionIds)}
          />
        )
      case 'open_ended':
        return (
          <OpenEndedItem
            key={item.id}
            item={item}
            value={currentSelection[0] || ''}
            onChange={(value: string) => handleAnswerSelect(item.id, [value])}
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
            {/* Level Header */}
            <LevelHeader level={currentLevel} />

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