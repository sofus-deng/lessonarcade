import { describe, it, expect } from "vitest";
import { normalizeLessonLoadError } from "@/lib/lessonarcade/lesson-load-error";
import { LessonLoadError as InternalLessonLoadError } from "@/lib/lessonarcade/loaders";
import { z } from "zod";

describe("normalizeLessonLoadError", () => {
  it("normalizes InternalLessonLoadError with NOT_FOUND code", () => {
    const internalErr = new InternalLessonLoadError("NOT_FOUND", "Not found", {
      slug: "test-slug",
      source: "demo",
    });
    const normalized = normalizeLessonLoadError(internalErr);
    expect(normalized.kind).toBe("not_found");
    expect(normalized.slug).toBe("test-slug");
    expect(normalized.message).toBe("Not found");
  });

  it("normalizes InternalLessonLoadError with VALIDATION code", () => {
    const internalErr = new InternalLessonLoadError("VALIDATION", "Invalid data", {
      slug: "test-slug",
      source: "demo",
      issues: ["field: required"],
    });
    const normalized = normalizeLessonLoadError(internalErr);
    expect(normalized.kind).toBe("schema_invalid");
    expect(normalized.issues).toContain("field: required");
  });

  it("normalizes InternalLessonLoadError with VERSION_MISMATCH code", () => {
    const internalErr = new InternalLessonLoadError("VERSION_MISMATCH", "Version mismatch", {
      slug: "test-slug",
      source: "demo",
    });
    const normalized = normalizeLessonLoadError(internalErr);
    expect(normalized.kind).toBe("version_mismatch");
  });

  it("normalizes ZodError", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({ name: 123 });
    if (result.success) throw new Error("Should have failed");
    
    const normalized = normalizeLessonLoadError(result.error);
    expect(normalized.kind).toBe("schema_invalid");
    expect(normalized.issues?.[0]).toContain("name");
  });

  it("normalizes generic Error", () => {
    const err = new Error("Generic error");
    const normalized = normalizeLessonLoadError(err);
    expect(normalized.kind).toBe("unknown");
    expect(normalized.message).toBe("Generic error");
  });

  it("handles unknown types", () => {
    const normalized = normalizeLessonLoadError("not an error");
    expect(normalized.kind).toBe("unknown");
    expect(normalized.message).toBe("An unexpected error occurred.");
  });
});
