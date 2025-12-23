"use client"

import { motion } from 'motion/react'
import { type LessonArcadeLevel } from '@/lib/lessonarcade/schema'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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

interface LevelHeaderProps {
  level: LessonArcadeLevel
  scoringState: ScoringState
}

export function LevelHeader({ level, scoringState }: LevelHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="bg-la-surface border-la-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-la-accent text-la-bg font-semibold text-sm">
              {level.index + 1}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-la-bg">
              {level.title}
            </h1>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-la-muted text-lg leading-relaxed">
            {level.summary}
          </p>
          
          {level.keyPoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-la-accent/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-la-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-la-muted">Key Points</h3>
              </div>
              <div className="space-y-2">
                {level.keyPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-la-accent/5 border border-la-accent/10 hover:bg-la-accent/10 transition-colors duration-200 group"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-la-accent/20 flex items-center justify-center mt-0.5 group-hover:bg-la-accent/30 transition-colors duration-200">
                      <svg className="w-2.5 h-2.5 text-la-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-la-bg leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {level.timeRange && (
            <div className="flex items-center gap-2 text-sm text-la-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {Math.floor((level.timeRange.endAtSeconds - level.timeRange.startSeconds) / 60)} minutes
              </span>
            </div>
          )}
          
          {/* Level Stats */}
          <LevelStats levelId={level.id} level={level} scoringState={scoringState} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

function LevelStats({ levelId, level, scoringState }: {
  levelId: string
  level: LessonArcadeLevel
  scoringState: ScoringState
}) {
  const answeredCount = level.items.filter(item =>
    scoringState.answeredItems[item.id]?.isSubmitted
  ).length
  
  const levelScore = scoringState.levelScores[levelId] || 0
  const levelBaseScore = scoringState.levelBaseScores[levelId] || 0
  const levelBonusScore = scoringState.levelBonusScores[levelId] || 0
  
  return (
    <motion.div
      className="flex flex-wrap items-center gap-4 text-sm pt-2 border-t border-la-border/20"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      key={`${levelId}-${answeredCount}-${levelScore}-${scoringState.streak}-${scoringState.mode}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Answered:</span>
        <span className="font-medium text-la-bg">{answeredCount}/{level.items.length}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Points:</span>
        {scoringState.mode === "arcade" ? (
          <div className="flex items-center gap-1">
            <span className="font-medium text-la-bg">{levelBaseScore}</span>
            <span className="text-la-accent">+{levelBonusScore}</span>
            <span className="font-medium text-la-primary">={levelScore}</span>
          </div>
        ) : (
          <span className="font-medium text-la-primary">{levelScore}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-la-muted">Streak:</span>
        <motion.span
          className="font-medium text-la-accent"
          animate={{ scale: scoringState.streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          🔥 {scoringState.streak}
        </motion.span>
      </div>
    </motion.div>
  )
}