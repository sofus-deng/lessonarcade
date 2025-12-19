"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Tag, Play, ArrowRight, Volume2 } from "lucide-react"
import type { DemoLessonSummary } from "@/lib/lessonarcade/loaders"

interface DemoLessonGridProps {
  lessons: DemoLessonSummary[]
}

export function DemoLessonGrid({ lessons }: DemoLessonGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {lessons.map((lesson, index) => (
        <motion.div
          key={lesson.slug}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -5 }}
        >
          <Card className="h-full bg-la-surface border-la-border hover:border-la-accent/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl text-la-bg mb-2 line-clamp-2">
                    {lesson.title}
                  </CardTitle>
                  <CardDescription className="text-la-muted text-sm line-clamp-3">
                    {lesson.shortDescription}
                  </CardDescription>
                </div>
                <motion.div
                  className="ml-4 bg-la-accent/10 rounded-full p-2"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Play className="w-5 h-5 text-la-accent" />
                </motion.div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-4">
              <div className="space-y-3">
                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-la-muted">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.estimatedDurationMinutes} minutes</span>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {lesson.tags.slice(0, 3).map((tag) => (
                    <motion.span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-la-muted/30 text-la-muted text-xs rounded-full"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </motion.span>
                  ))}
                  {lesson.tags.length > 3 && (
                    <span className="text-xs text-la-muted">
                      +{lesson.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 space-y-3">
              <Button asChild className="w-full bg-la-accent text-la-bg hover:bg-la-accent/90 group">
                <Link href={`/demo/lesson/${lesson.slug}`}>
                  <span>Start Lesson</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full group">
                <Link href={`/demo/voice/${lesson.slug}`}>
                  <Volume2 className="w-4 h-4 mr-2 text-la-accent" />
                  <span>Voice Mode</span>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}