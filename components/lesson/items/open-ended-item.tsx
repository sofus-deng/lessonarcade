"use client"

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { type LessonArcadeOpenEndedItem, type LanguageCode } from '@/lib/lessonarcade/schema'
import { getLocalizedText } from '@/lib/lessonarcade/i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/ui/cn'

interface OpenEndedItemProps {
  item: LessonArcadeOpenEndedItem
  value: string
  displayLanguage: LanguageCode
  onChange: (value: string) => void
  onSubmit: () => void
}

export function OpenEndedItem({ item, value, displayLanguage, onChange, onSubmit }: OpenEndedItemProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [characterCount, setCharacterCount] = useState(value.length)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    setCharacterCount(value.length)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (item.maxCharacters && newValue.length > item.maxCharacters) {
      return // Prevent exceeding max characters
    }
    onChange(newValue)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Auto-submit when user leaves textarea if there's content
    if (value.trim().length > 0 && !isSubmitted) {
      setIsSubmitted(true)
      onSubmit()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const isNearLimit = item.maxCharacters && characterCount > item.maxCharacters * 0.9
  const isAtLimit = item.maxCharacters && characterCount >= item.maxCharacters

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
              A
            </div>
            <div className="flex-1">
              <h3 
                id={`question-${item.id}`}
                className="text-lg font-semibold text-la-bg mb-2"
              >
                {getLocalizedText(undefined, item.prompt || "", displayLanguage)}
              </h3>
              {item.guidance && (
                <div className="flex items-start gap-2 text-sm text-la-muted">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1 4h-1" />
                  </svg>
                  <p>{getLocalizedText(item.guidanceI18n, item.guidance, displayLanguage)}</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent aria-describedby={`question-${item.id}`}>
          <div className="space-y-3">
            <Textarea
              value={value}
              onChange={handleChange}
              placeholder={getLocalizedText(item.placeholderI18n, item.placeholder || "Enter your answer here...", displayLanguage)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={isSubmitted}
              className={cn(
                "min-h-[120px] resize-none border-la-border bg-la-surface text-la-bg",
                "placeholder:text-la-muted/50 focus:border-la-accent focus:ring-la-accent/20",
                isFocused && "ring-2 ring-la-accent/20",
                isSubmitted && "cursor-not-allowed opacity-75"
              )}
              aria-label={getLocalizedText(item.placeholderI18n, item.prompt || "Your answer", displayLanguage)}
              maxLength={item.maxCharacters}
            />
            
            {item.maxCharacters && (
              <motion.div
                className={cn(
                  "flex justify-between items-center text-sm",
                  isAtLimit
                    ? "text-red-600"
                    : isNearLimit
                    ? "text-yellow-600"
                    : "text-la-muted"
                )}
                animate={{ 
                  color: isAtLimit ? "#dc2626" : isNearLimit ? "#ca8a04" : "#64748b"
                }}
              >
                <span>Character limit</span>
                <span className={cn(
                  "font-medium",
                  isAtLimit && "font-semibold"
                )}>
                  {characterCount} / {item.maxCharacters}
                </span>
              </motion.div>
            )}
            
            {isSubmitted && value.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-la-accent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0z" />
                </svg>
                <span>Answer submitted</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
