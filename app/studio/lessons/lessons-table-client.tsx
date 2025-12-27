"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { LessonStats } from '@/lib/lessonarcade/lesson-dashboard-service'

/**
 * Props for the LessonsTableClient component.
 */
interface LessonsTableClientProps {
  lessons: LessonStats[]
}

/**
 * Get badge variant based on lesson status.
 */
function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default'
    case 'DRAFT':
      return 'secondary'
    case 'ARCHIVED':
      return 'outline'
    default:
      return 'secondary'
  }
}

/**
 * Format date for display.
 */
function formatDate(date: Date | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Client component for lessons table with search and filtering.
 *
 * Features:
 * - Search by lesson title or slug (case-insensitive)
 * - Default sorting by lastCompletedAt descending
 * - Lessons with no runs appear after those with runs
 * - Review button to navigate to lesson review page
 */
export function LessonsTableClient({ lessons }: LessonsTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort lessons
  const filteredLessons = useMemo(() => {
    // Filter by search query
    const result = lessons.filter((lesson) => {
      const query = searchQuery.toLowerCase().trim()
      if (!query) return true
      return (
        lesson.title.toLowerCase().includes(query) ||
        lesson.slug.toLowerCase().includes(query)
      )
    })

    // Sort: lessons with runs first (by lastCompletedAt descending), then lessons without runs (by title)
    result.sort((a, b) => {
      // Both have lastCompletedAt
      if (a.lastCompletedAt && b.lastCompletedAt) {
        return b.lastCompletedAt.getTime() - a.lastCompletedAt.getTime()
      }
      // Only a has lastCompletedAt
      if (a.lastCompletedAt) return -1
      // Only b has lastCompletedAt
      if (b.lastCompletedAt) return 1
      // Neither has lastCompletedAt, sort by title
      return a.title.localeCompare(b.title)
    })

    return result
  }, [lessons, searchQuery])

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center justify-between">
        <Input
          type="text"
          placeholder="Search lessons by title or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-la-muted">
          {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'}
        </span>
      </div>

      {/* Lessons Table */}
      {filteredLessons.length > 0 ? (
        <div className="rounded-lg border border-la-border bg-la-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead>Last Completed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell className="text-la-muted">{lesson.slug}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lesson.status)}>
                      {lesson.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{lesson.runCount}</TableCell>
                  <TableCell className="text-right">
                    {lesson.averageScorePercent !== null
                      ? `${lesson.averageScorePercent}%`
                      : '—'}
                  </TableCell>
                  <TableCell>{formatDate(lesson.lastCompletedAt)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/studio/lessons/${lesson.slug}`}>
                        Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-la-muted">
          {searchQuery
            ? 'No lessons match your search.'
            : 'No lessons found in this workspace.'}
        </div>
      )}
    </div>
  )
}
