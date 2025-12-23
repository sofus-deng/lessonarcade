import { z } from "zod";
import { LessonLoadError as InternalLessonLoadError } from "./loaders";

export type LessonLoadErrorKind = "not_found" | "schema_invalid" | "version_mismatch" | "unknown";

export interface LessonLoadError {
  kind: LessonLoadErrorKind;
  message: string;
  details?: string;
  slug?: string;
  issues?: string[];
}

/**
 * Normalizes an unknown error into a structured LessonLoadError
 */
export function normalizeLessonLoadError(err: unknown): LessonLoadError {
  if (err instanceof InternalLessonLoadError) {
    const kindMap: Record<string, LessonLoadErrorKind> = {
      NOT_FOUND: "not_found",
      VALIDATION: "schema_invalid",
      VERSION_MISMATCH: "version_mismatch",
      LOAD_FAILED: "unknown",
    };

    return {
      kind: kindMap[err.code] || "unknown",
      message: err.message,
      slug: err.debug.slug,
      issues: err.debug.issues,
    };
  }

  if (err instanceof z.ZodError) {
    return {
      kind: "schema_invalid",
      message: "The lesson data is invalid.",
      issues: err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  // Handle generic errors
  const message = err instanceof Error ? err.message : "An unexpected error occurred.";
  
  return {
    kind: "unknown",
    message,
  };
}
