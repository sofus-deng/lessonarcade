import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LessonLoadError } from "@/lib/lessonarcade/lesson-load-error";

interface LessonLoadErrorViewProps {
  error: LessonLoadError;
  debug?: boolean;
}

export function LessonLoadErrorView({ error, debug = false }: LessonLoadErrorViewProps) {
  const isDevelopment = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";
  const showDetails = debug || isDevelopment;

  const getErrorContent = () => {
    switch (error.kind) {
      case "not_found":
        return {
          title: "Lesson Not Found",
          description: "The lesson you're looking for doesn't exist or may have been moved.",
        };
      case "schema_invalid":
        return {
          title: "Lesson Format Issue",
          description: "There's an issue with the lesson data that prevents it from loading properly.",
        };
      case "version_mismatch":
        return {
          title: "Incompatible Lesson Version",
          description: "This lesson was created with a different version of LessonArcade and cannot be loaded.",
        };
      case "unknown":
      default:
        return {
          title: "Something Went Wrong",
          description: "An unexpected error occurred while loading this lesson. Please try again later.",
        };
    }
  };

  const { title, description } = getErrorContent();

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-la-surface rounded-xl border border-la-border p-8 shadow-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-la-accent/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-la-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-la-bg mb-2">{title}</h1>
        <p className="text-la-muted mb-8">{description}</p>
        
        <div className="space-y-4">
          <Link href="/demo">
            <Button className="w-full" size="lg">
              Back to Demos
            </Button>
          </Link>
        </div>

        {showDetails && (
          <div className="mt-10 text-left">
            <div className="text-xs font-semibold text-la-muted uppercase tracking-wider mb-2">
              Debug Information
            </div>
            <div className="bg-la-bg/5 rounded-lg p-4 border border-la-border/50 overflow-hidden">
              <div className="text-xs font-mono text-la-muted break-all space-y-2">
                <div><span className="text-la-accent font-semibold">Kind:</span> {error.kind}</div>
                {error.slug && <div><span className="text-la-accent font-semibold">Slug:</span> {error.slug}</div>}
                <div><span className="text-la-accent font-semibold">Message:</span> {error.message}</div>
                {error.issues && error.issues.length > 0 && (
                  <div>
                    <div className="text-la-accent font-semibold mb-1">Issues:</div>
                    <ul className="list-disc list-inside pl-1 space-y-1">
                      {error.issues.slice(0, 5).map((issue, idx) => (
                        <li key={idx} className="truncate">{issue}</li>
                      ))}
                      {error.issues.length > 5 && <li>... and {error.issues.length - 5} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
