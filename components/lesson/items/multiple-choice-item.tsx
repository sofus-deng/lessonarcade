"use client"

import { useState } from 'react'
import { motion } from 'motion/react'
import { type LessonArcadeMultipleChoiceItem } from '@/lib/lessonarcade/schema'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/ui/cn'

interface MultipleChoiceItemProps {
  item: LessonArcadeMultipleChoiceItem
  selectedOptions: string[]
  onSelectionChange: (optionIds: string[]) => void
}

export function MultipleChoiceItem({ item, selectedOptions, onSelectionChange }: MultipleChoiceItemProps) {
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleOptionClick = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId]
    
    onSelectionChange(newSelection)
    setHasInteracted(true)
  }

  const isCorrect = (optionId: string) => item.correctOptionIds.includes(optionId)
  const isSelected = (optionId: string) => selectedOptions.includes(optionId)

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
                {item.prompt}
              </h3>
              {item.difficulty && (
                <div className="flex items-center gap-2 text-sm text-la-muted">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    item.difficulty === 'easy' && "bg-green-100 text-green-800",
                    item.difficulty === 'medium' && "bg-yellow-100 text-yellow-800",
                    item.difficulty === 'hard' && "bg-red-100 text-red-800"
                  )}>
                    {item.difficulty}
                  </span>
                  {item.points && (
                    <span>{item.points} points</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {item.options.map((option, index) => {
            const optionIsSelected = isSelected(option.id)
            const optionIsCorrect = isCorrect(option.id)
            const showFeedback = hasInteracted && optionIsSelected
            
            return (
              <motion.button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  "hover:shadow-md hover:border-la-accent/50",
                  optionIsSelected
                    ? showFeedback
                      ? optionIsCorrect
                        ? "bg-green-50 border-green-300 text-green-900"
                        : "bg-red-50 border-red-300 text-red-900"
                      : "bg-la-accent/10 border-la-accent text-la-bg"
                    : "bg-la-surface border-la-border text-la-bg hover:bg-la-muted/10"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
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
                    <p className="font-medium">{option.text}</p>
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
          
          {hasInteracted && item.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-la-accent/10 border border-la-accent/20 rounded-lg"
            >
              <p className="text-sm text-la-accent font-medium mb-1">Explanation:</p>
              <p className="text-sm text-la-bg">{item.explanation}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}