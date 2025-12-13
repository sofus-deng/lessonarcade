"use client"

import { motion } from 'motion/react'
import { type LessonArcadeLesson } from '@/lib/lessonarcade/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

interface LessonSummaryProps {
  lesson: LessonArcadeLesson
  scoringState: ScoringState
  onModeChange: (mode: LessonMode) => void
}

export function LessonSummary({ lesson, scoringState, onModeChange }: LessonSummaryProps) {
  // Calculate lesson metrics
  const metrics = calculateLessonMetrics(lesson, scoringState)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-4 mb-6"
    >
      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-la-surface border-la-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-la-muted mb-1">Lesson Mode</h3>
                <p className="text-xs text-la-muted">
                  {scoringState.mode === "focus"
                    ? "No time pressure, focus on learning"
                    : "Beat the clock for bonus points"}
                </p>
              </div>
              <ModeToggle
                currentMode={scoringState.mode}
                onModeChange={onModeChange}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completion Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-la-surface border-la-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-la-bg">Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-la-muted">Levels</span>
                <motion.span
                  key={`levels-${metrics.completedLevels}-${metrics.totalLevels}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-medium text-la-bg"
                >
                  {metrics.completedLevels}/{metrics.totalLevels}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-la-muted">Items</span>
                <motion.span
                  key={`items-${metrics.answeredScorableItems}-${metrics.totalScorableItems}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-medium text-la-bg"
                >
                  {metrics.answeredScorableItems}/{metrics.totalScorableItems}
                </motion.span>
              </div>
              <div className="w-full bg-la-border/20 rounded-full h-2 mt-2">
                <motion.div
                  key={`completion-bar-${metrics.itemsCompletionPercentage}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.itemsCompletionPercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-la-primary h-2 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Score Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-la-surface border-la-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-la-bg">Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scoringState.mode === "arcade" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-la-muted">Base</span>
                    <motion.span
                      key={`base-${scoringState.baseScore}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-medium text-la-bg"
                    >
                      {scoringState.baseScore}
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-la-muted">Bonus</span>
                    <motion.span
                      key={`bonus-${scoringState.bonusScore}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-medium text-la-accent"
                    >
                      +{scoringState.bonusScore}
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-la-muted">Total</span>
                    <motion.div
                      key={`total-${scoringState.totalScore}-${metrics.totalPossiblePoints}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-right"
                    >
                      <span className="font-medium text-la-primary">
                        {scoringState.totalScore}
                      </span>
                      <span className="text-la-muted mx-1">/</span>
                      <span className="text-la-muted">{metrics.totalPossiblePoints}</span>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-la-muted">Score</span>
                  <motion.div
                    key={`score-${scoringState.totalScore}-${metrics.totalPossiblePoints}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-right"
                  >
                    <span className="font-medium text-la-primary">
                      {scoringState.totalScore}
                    </span>
                    <span className="text-la-muted mx-1">/</span>
                    <span className="text-la-muted">{metrics.totalPossiblePoints}</span>
                  </motion.div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-la-muted">Percentage</span>
                <motion.span
                  key={`percentage-${metrics.scorePercentage}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-medium text-la-bg"
                >
                  {metrics.scorePercentage}%
                </motion.span>
              </div>
              <div className="w-full bg-la-border/20 rounded-full h-2 mt-2">
                <motion.div
                  key={`score-bar-${metrics.scorePercentage}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.scorePercentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-la-accent h-2 rounded-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Star Rating Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="bg-la-surface border-la-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-la-bg">Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center gap-1 py-2">
                {[1, 2, 3].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ 
                      scale: star <= metrics.starRating ? 1 : 0.3,
                      rotate: star <= metrics.starRating ? 0 : -180,
                      opacity: star <= metrics.starRating ? 1 : 0.2
                    }}
                    transition={{ 
                      delay: (star - 1) * 0.1,
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    <StarIcon filled={star <= metrics.starRating} />
                  </motion.div>
                ))}
              </div>
              <motion.div
                key={`rating-label-${metrics.ratingLabel}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-center"
              >
                <span className="text-sm font-medium text-la-bg">
                  {metrics.ratingLabel}
                </span>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={filled ? "text-la-accent" : "text-la-muted/30"}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function calculateLessonMetrics(lesson: LessonArcadeLesson, scoringState: ScoringState) {
  // Calculate totals from lesson data
  let totalScorableItems = 0
  let totalPossiblePoints = 0
  
  lesson.levels.forEach(level => {
    level.items.forEach(item => {
      if (item.kind === 'multiple_choice') {
        totalScorableItems++
        totalPossiblePoints += item.points || 1
      }
    })
  })
  
  // Calculate earned points and answered items from session state
  let answeredScorableItems = 0
  let completedLevels = 0
  
  lesson.levels.forEach(level => {
    let levelScorableItems = 0
    let levelAnsweredScorableItems = 0
    
    level.items.forEach(item => {
      if (item.kind === 'multiple_choice') {
        levelScorableItems++
        if (scoringState.answeredItems[item.id]?.isSubmitted) {
          answeredScorableItems++
          levelAnsweredScorableItems++
        }
      }
    })
    
    // Level is complete if all scorable items have been answered
    if (levelScorableItems > 0 && levelScorableItems === levelAnsweredScorableItems) {
      completedLevels++
    }
  })
  
  const earnedPoints = scoringState.totalScore
  const scorePercentage = totalPossiblePoints > 0 
    ? Math.round((earnedPoints / totalPossiblePoints) * 100)
    : 0
  
  const itemsCompletionPercentage = totalScorableItems > 0
    ? Math.round((answeredScorableItems / totalScorableItems) * 100)
    : 0
  
  // Calculate star rating
  const { stars, label } = calculateStarRating(scorePercentage)
  
  return {
    totalLevels: lesson.levels.length,
    completedLevels,
    totalScorableItems,
    answeredScorableItems,
    totalPossiblePoints,
    earnedPoints,
    scorePercentage,
    itemsCompletionPercentage,
    starRating: stars,
    ratingLabel: label
  }
}

function calculateStarRating(scorePercentage: number): { stars: number; label: string } {
  if (scorePercentage >= 85) {
    return { stars: 3, label: "Excellent" }
  } else if (scorePercentage >= 60) {
    return { stars: 2, label: "Good" }
  } else {
    return { stars: 1, label: "Keep going" }
  }
}

function ModeToggle({ currentMode, onModeChange }: {
  currentMode: LessonMode
  onModeChange: (mode: LessonMode) => void
}) {
  return (
    <div className="flex bg-la-border/20 rounded-lg p-1">
      <Button
        variant={currentMode === "focus" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("focus")}
        className={cn(
          "flex-1 transition-all duration-200",
          currentMode === "focus"
            ? "bg-la-primary text-white shadow-sm"
            : "text-la-muted hover:text-la-bg"
        )}
      >
        Focus
      </Button>
      <Button
        variant={currentMode === "arcade" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("arcade")}
        className={cn(
          "flex-1 transition-all duration-200",
          currentMode === "arcade"
            ? "bg-la-primary text-white shadow-sm"
            : "text-la-muted hover:text-la-bg"
        )}
      >
        Arcade
      </Button>
    </div>
  )
}