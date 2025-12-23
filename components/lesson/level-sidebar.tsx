"use client"

import { motion } from 'motion/react'
import { type LessonArcadeLevel } from '@/lib/lessonarcade/schema'
import { cn } from '@/lib/ui/cn'

type LessonMode = "focus" | "arcade"

interface AnswerState {
  selectedOptions: string[]
  isSubmitted: boolean
  isCorrect?: boolean
  pointsEarned?: number
  basePointsEarned?: number
  bonusPointsEarned?: number
}

interface ScoringState {
  mode: LessonMode
  totalScore: number
  baseScore: number
  bonusScore: number
  levelScores: Record<string, number>
  levelBaseScores: Record<string, number>
  levelBonusScores: Record<string, number>
  streak: number
  answeredItems: Record<string, AnswerState>
  itemFirstShown: Record<string, number>
}

interface LevelSidebarProps {
  levels: LessonArcadeLevel[]
  currentLevelIndex: number
  onLevelSelect: (index: number) => void
  scoringState: ScoringState
}

export function LevelSidebar({ levels, currentLevelIndex, onLevelSelect, scoringState }: LevelSidebarProps) {
  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-la-surface mb-6">Lesson Levels</h2>
      
      <div className="space-y-3">
        {levels.map((level, index) => {
          const levelProgress = getLevelProgress(level, scoringState)
          
          return (
            <motion.button
              key={level.id}
              onClick={() => onLevelSelect(index)}
              className={cn(
                "w-full text-left p-4 rounded-lg border transition-all duration-300",
                "hover:bg-la-surface/10 hover:border-la-accent/50 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-la-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-la-bg",
                index === currentLevelIndex
                  ? "bg-la-surface/20 border-la-accent shadow-sm"
                  : "border-la-border/30 bg-la-surface/5"
              )}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                      index === currentLevelIndex
                        ? "bg-la-accent text-la-bg"
                        : levelProgress.answered > 0
                        ? "bg-la-primary/20 text-la-primary"
                        : "bg-la-muted/30 text-la-surface"
                    )}>
                      {levelProgress.answered > 0 ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <h3 className={cn(
                      "font-medium",
                      index === currentLevelIndex
                        ? "text-la-accent"
                        : levelProgress.answered > 0
                        ? "text-la-primary"
                        : "text-la-surface"
                    )}>
                      {level.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-la-muted/80 line-clamp-2 mb-2">
                    {level.summary}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-la-muted/60">
                      <span>{level.items.length} items</span>
                      {level.timeRange && (
                        <span>
                          {Math.floor((level.timeRange.endAtSeconds - level.timeRange.startSeconds) / 60)}m
                        </span>
                      )}
                    </div>
                    
                    {levelProgress.answered > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-xs"
                      >
                        <span className="text-la-muted">{levelProgress.answered}/{level.items.length}</span>
                        {levelProgress.points > 0 && (
                          <span className="text-la-primary font-medium">+{levelProgress.points}pts</span>
                        )}
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  {levelProgress.answered > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(levelProgress.answered / level.items.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="mt-2 h-1 bg-la-primary/30 rounded-full"
                    />
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function getLevelProgress(level: LessonArcadeLevel, scoringState: ScoringState) {
  const answered = level.items.filter(item =>
    scoringState.answeredItems[item.id]?.isSubmitted
  ).length
  
  const points = scoringState.levelScores[level.id] || 0
  
  return { answered, total: level.items.length, points }
}