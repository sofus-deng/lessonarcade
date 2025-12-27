'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LessonCommentDTO } from '@/lib/lessonarcade/collaboration-service'

interface LessonCommentsPanelProps {
  lessonSlug: string
  canEdit: boolean
}

/**
 * Lesson Comments Panel
 *
 * LA3-P2-01: Client component for displaying and managing lesson comments
 *
 * Features:
 * - Fetches comments from API on mount
 * - Displays comments in reverse chronological order
 * - Allows editors and above to add new comments
 * - Shows read-only message for viewers
 */
export function LessonCommentsPanel({
  lessonSlug,
  canEdit,
}: LessonCommentsPanelProps) {
  const [comments, setComments] = useState<LessonCommentDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')

  // Fetch comments on mount
  useEffect(() => {
    async function fetchComments() {
      try {
        const response = await fetch(
          `/api/studio/lessons/${lessonSlug}/comments`
        )
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments)
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [lessonSlug])

  // Submit new comment
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/studio/lessons/${lessonSlug}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: newComment }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-la-muted">Loading comments...</p>
        ) : (
          <div className="space-y-6">
            {/* Comment Input (only for editors and above) */}
            {canEdit ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  data-testid="la-lesson-comment-input"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                  {isSubmitting ? 'Adding...' : 'Add Comment'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-la-muted p-3 bg-muted rounded-md">
                View-only role; comments are read-only for this user.
              </p>
            )}

            {/* Comments List */}
            <div
              data-testid="la-lesson-comments-list"
              className="space-y-4"
            >
              {comments.length === 0 ? (
                <p className="text-la-muted">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-la-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-la-surface">
                            {comment.authorName}
                          </span>
                          <span className="text-sm text-la-muted">
                            {comment.authorEmail}
                          </span>
                          <Badge
                            variant={
                              comment.status === 'OPEN' ? 'default' : 'secondary'
                            }
                          >
                            {comment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-la-muted mb-2">
                          {formatDate(comment.createdAt)}
                        </p>
                        <p className="text-la-surface whitespace-pre-wrap">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
