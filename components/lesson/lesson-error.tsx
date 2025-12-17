import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LessonLoadError } from "@/lib/lessonarcade/loaders"

interface LessonErrorProps {
  error: LessonLoadError
}

export function LessonError({ error }: LessonErrorProps) {
  const getErrorContent = () => {
    switch (error.code) {
      case 'NOT_FOUND':
        return {
          headline: "Lesson Not Found",
          message: "The lesson you're looking for doesn't exist or may have been removed.",
          primaryAction: {
            href: "/demo",
            text: "Browse Demo Lessons"
          },
          secondaryAction: {
            href: "/studio",
            text: "Create Your Own Lesson"
          }
        }
      
      case 'VALIDATION':
        return {
          headline: "Lesson Unavailable",
          message: "There's an issue with the lesson data that prevents it from loading properly.",
          primaryAction: {
            href: "/demo",
            text: "Browse Demo Lessons"
          },
          secondaryAction: {
            href: "/studio",
            text: "Create Your Own Lesson"
          }
        }
      
      case 'VERSION_MISMATCH':
        return {
          headline: "Lesson Incompatible",
          message: "This lesson was created with a newer version of LessonArcade and cannot be loaded.",
          primaryAction: {
            href: "/demo",
            text: "Browse Demo Lessons"
          },
          secondaryAction: {
            href: "/studio",
            text: "Create Your Own Lesson"
          }
        }
      
      case 'LOAD_FAILED':
        return {
          headline: "Loading Failed",
          message: "We couldn't load this lesson due to a technical issue. Please try again later.",
          primaryAction: {
            href: "/demo",
            text: "Browse Demo Lessons"
          },
          secondaryAction: {
            href: "/studio",
            text: "Create Your Own Lesson"
          }
        }
      
      default:
        return {
          headline: "Lesson Unavailable",
          message: "An unexpected error occurred while loading this lesson.",
          primaryAction: {
            href: "/demo",
            text: "Browse Demo Lessons"
          },
          secondaryAction: {
            href: "/studio",
            text: "Create Your Own Lesson"
          }
        }
    }
  }

  const content = getErrorContent()

  return (
    <div className="min-h-screen bg-la-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-la-surface rounded-lg border border-la-border p-8 text-center">
          <h1 className="text-3xl font-bold text-la-bg mb-4">
            {content.headline}
          </h1>
          <p className="text-la-muted mb-6">
            {content.message}
          </p>
          <div className="space-y-4">
            <Link href={content.primaryAction.href}>
              <Button className="w-full sm:w-auto">
                {content.primaryAction.text}
              </Button>
            </Link>
            <div className="text-sm text-la-muted">
              or{" "}
              <Link 
                href={content.secondaryAction.href}
                className="text-la-accent hover:text-la-accent/80 underline"
              >
                {content.secondaryAction.text}
              </Link>
            </div>
          </div>
          
          {/* Debug information - collapsed by default */}
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-la-muted hover:text-la-accent transition-colors">
              Debug details
            </summary>
            <div className="mt-4 p-4 bg-la-bg/10 rounded border border-la-border">
              <div className="mb-2">
                <span className="font-medium text-la-accent">Error Code:</span>{" "}
                <span className="text-la-muted">{error.code}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-la-accent">Slug:</span>{" "}
                <span className="text-la-muted">{error.debug.slug}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium text-la-accent">Source:</span>{" "}
                <span className="text-la-muted">{error.debug.source}</span>
              </div>
              {error.debug.issues && error.debug.issues.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium text-la-accent">Issues:</span>
                  <pre className="mt-1 text-xs text-la-muted overflow-x-auto bg-la-surface p-2 rounded border border-la-border">
                    {JSON.stringify(error.debug.issues, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <span className="font-medium text-la-accent">Debug Info:</span>
                <pre className="mt-1 text-xs text-la-muted overflow-x-auto bg-la-surface p-2 rounded border border-la-border">
                  {JSON.stringify(
                    {
                      code: error.code,
                      slug: error.debug.slug,
                      source: error.debug.source,
                      issues: error.debug.issues
                    }, 
                    null, 
                    2
                  )}
                </pre>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}