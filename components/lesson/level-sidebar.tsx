"use client"

import { motion } from 'motion/react'
import { type LessonArcadeLevel } from '@/lib/lessonarcade/schema'
import { cn } from '@/lib/ui/cn'

interface LevelSidebarProps {
  levels: LessonArcadeLevel[]
  currentLevelIndex: number
  onLevelSelect: (index: number) => void
}

export function LevelSidebar({ levels, currentLevelIndex, onLevelSelect }: LevelSidebarProps) {
  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-la-surface mb-6">Lesson Levels</h2>
      
      <div className="space-y-3">
        {levels.map((level, index) => (
          <motion.button
            key={level.id}
            onClick={() => onLevelSelect(index)}
            className={cn(
              "w-full text-left p-4 rounded-lg border transition-all duration-200",
              "hover:bg-la-surface/10 hover:border-la-accent/50",
              index === currentLevelIndex
                ? "bg-la-surface/20 border-la-accent shadow-sm"
                : "border-la-border/30 bg-la-surface/5"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    index === currentLevelIndex
                      ? "bg-la-accent text-la-bg"
                      : "bg-la-muted/30 text-la-surface"
                  )}>
                    {index + 1}
                  </span>
                  <h3 className={cn(
                    "font-medium",
                    index === currentLevelIndex
                      ? "text-la-accent"
                      : "text-la-surface"
                  )}>
                    {level.title}
                  </h3>
                </div>
                
                <p className="text-sm text-la-muted/80 line-clamp-2 mb-2">
                  {level.summary}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-la-muted/60">
                  <span>{level.items.length} items</span>
                  {level.timeRange && (
                    <span>
                      {Math.floor((level.timeRange.endSeconds - level.timeRange.startSeconds) / 60)}m
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}