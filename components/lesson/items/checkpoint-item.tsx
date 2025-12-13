"use client"

import { motion } from 'motion/react'
import { type LessonArcadeCheckpointItem } from '@/lib/lessonarcade/schema'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CheckpointItemProps {
  item: LessonArcadeCheckpointItem
}

export function CheckpointItem({ item }: CheckpointItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="bg-gradient-to-r from-la-accent/10 to-la-primary/10 border-la-accent/30 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-la-accent text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-la-bg">Checkpoint</h3>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="px-2 py-1 bg-la-accent/20 text-la-accent text-xs font-medium rounded-full"
                >
                  Progress Milestone
                </motion.div>
              </div>
              <p className="text-la-bg leading-relaxed">
                {item.message}
              </p>
            </div>
          </div>
        </CardHeader>
        
        {item.actionHint && (
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-2 p-3 bg-la-surface/50 rounded-lg border border-la-border/50"
            >
              <svg className="w-4 h-4 text-la-accent mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-sm text-la-muted">{item.actionHint}</p>
            </motion.div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}