"use client"

import { motion } from 'motion/react'
import { type LessonArcadeLevel } from '@/lib/lessonarcade/schema'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface LevelHeaderProps {
  level: LessonArcadeLevel
}

export function LevelHeader({ level }: LevelHeaderProps) {
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
            <div>
              <h3 className="text-sm font-medium text-la-muted mb-2">Key Points</h3>
              <div className="flex flex-wrap gap-2">
                {level.keyPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-la-accent/10 text-la-accent text-sm border border-la-accent/20"
                  >
                    {point}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {level.timeRange && (
            <div className="flex items-center gap-2 text-sm text-la-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {Math.floor((level.timeRange.endSeconds - level.timeRange.startSeconds) / 60)} minutes
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}