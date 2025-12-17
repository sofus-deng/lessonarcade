"use client"

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { type LessonArcadeMultipleChoiceItem, type LanguageCode } from '@/lib/lessonarcade/schema'
import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/ui/cn'

type LessonMode = "focus" | "arcade"

interface MultipleChoiceItemProps {
  item: LessonArcadeMultipleChoiceItem
  selectedOptions: string[]
  isLocked: boolean
  mode: LessonMode
  firstShownAt?: number
  displayLanguage: LanguageCode
  onSelectionChange: (optionIds: string[]) => void
  onSubmit: () => void
}

export function MultipleChoiceItem({
  item,
  selectedOptions,
  isLocked,
  mode,
  firstShownAt,
  displayLanguage,
  onSelectionChange,
  onSubmit
}: MultipleChoiceItemProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Timer effect for Arcade mode
  useEffect(() => {
    if (mode === "arcade" && !isLocked && firstShownAt) {
      const calculateTimeLeft = () => {
        const elapsed = (Date.now() - firstShownAt) / 1000
        const remaining = Math.max(0, 12 - elapsed)
        return Math.ceil(remaining)
      }

      // Update every second
      const interval = setInterval(() => {
        const newTimeLeft = calculateTimeLeft()
        setTimeLeft(newTimeLeft)
        
        if (newTimeLeft <= 0) {
          clearInterval(interval)
        }
      }, 1000)

      // Set initial time after a brief delay to avoid synchronous setState
      const timeoutId = setTimeout(() => {
        setTimeLeft(calculateTimeLeft())
      }, 0)

      return () => {
        clearInterval(interval)
        clearTimeout(timeoutId)
      }
    } else {
      // Use setTimeout to avoid synchronous setState
      const timeoutId = setTimeout(() => {
        setTimeLeft(null)
      }, 0)
      
      return () => clearTimeout(timeoutId)
    }
  }, [mode, isLocked, firstShownAt])

  const handleOptionClick = (optionId: string) => {
    if (isLocked) return
    
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId]
    
    onSelectionChange(newSelection)
    
    // Auto-submit on first selection (simple locking behavior)
    if (newSelection.length > 0) {
      setTimeout(() => onSubmit(), 100)
    }
  }

  const isCorrect = (optionId: string) => item.correctOptionIds.includes(optionId)
  const isSelected = (optionId: string) => selectedOptions.includes(optionId)
  
  // Calculate if the overall answer is correct
  const isAnswerCorrect =
    selectedOptions.length === item.correctOptionIds.length &&
    selectedOptions.every(option => item.correctOptionIds.includes(option))
  
  // Calculate points earned
  const basePoints = item.points || 1
  const pointsEarned = isLocked && isAnswerCorrect ? basePoints : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="bg-la-surface border-la-border">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-la-primary/10 text-la-primary font-semibold text-sm mt-1">
              Q
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-la-bg mb-2">
                {getLocalizedText(item.promptI18n, item.prompt, displayLanguage)}
              </h3>
              <div className="flex items-center gap-4 text-sm text-la-muted">
                {item.difficulty && (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    item.difficulty === 'easy' && "bg-green-100 text-green-800",
                    item.difficulty === 'medium' && "bg-yellow-100 text-yellow-800",
                    item.difficulty === 'hard' && "bg-red-100 text-red-800"
                  )}>
                    {item.difficulty}
                  </span>
                )}
                <span>{basePoints} points</span>
                {mode === "arcade" && !isLocked && timeLeft !== null && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      timeLeft > 6 ? "bg-blue-100 text-blue-800" :
                      timeLeft > 0 ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    )}
                  >
                    Time left: {timeLeft}s
                  </motion.span>
                )}
                {isLocked && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isAnswerCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}
                  >
                    {isAnswerCorrect ? `+${pointsEarned} pts` : "0 pts"}
                  </motion.span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {item.options.map((option, index) => {
            const optionIsSelected = isSelected(option.id)
            const optionIsCorrect = isCorrect(option.id)
            const showFeedback = isLocked && optionIsSelected
            
            return (
              <motion.button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={isLocked}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  isLocked ? "cursor-not-allowed" : "hover:shadow-md hover:border-la-accent/50 cursor-pointer",
                  optionIsSelected
                    ? showFeedback
                      ? optionIsCorrect
                        ? "bg-green-50 border-green-300 text-green-900"
                        : "bg-red-50 border-red-300 text-red-900"
                      : "bg-la-accent/10 border-la-accent text-la-bg"
                    : "bg-la-surface border-la-border text-la-bg hover:bg-la-muted/10"
                )}
                whileHover={isLocked ? {} : { scale: 1.01 }}
                whileTap={isLocked ? {} : { scale: 0.99 }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 text-sm font-medium mt-0.5",
                    optionIsSelected
                      ? showFeedback
                        ? optionIsCorrect
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-red-500 border-red-500 text-white"
                        : "bg-la-accent border-la-accent text-white"
                      : "border-la-muted text-la-muted"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getLocalizedText(option.textI18n, option.text, displayLanguage)}</p>
                    {showFeedback && optionIsCorrect && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-green-700 mt-2"
                      >
                        ✓ Correct
                      </motion.p>
                    )}
                    {showFeedback && !optionIsCorrect && optionIsSelected && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-sm text-red-700 mt-2"
                      >
                        ✗ Incorrect
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.button>
            )
          })}
          
          {isLocked && item.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-la-accent/10 border border-la-accent/20 rounded-lg"
            >
              <p className="text-sm text-la-accent font-medium mb-1">Explanation:</p>
              <p className="text-sm text-la-bg">{getLocalizedText(item.explanationI18n, item.explanation || '', displayLanguage)}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}