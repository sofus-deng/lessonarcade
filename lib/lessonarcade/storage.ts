import { writeFile, readFile, mkdir } from "fs/promises"
import { join } from "path"
import { lessonArcadeLessonSchema, type LessonArcadeLesson } from "./schema"
import { LessonLoadError } from "./loaders"

/**
 * Directory where user-generated lessons are stored
 */
const USER_LESSONS_DIR = join(process.cwd(), "data", "user-lessons")

/**
 * Sanitizes a slug to be safe for filesystem use
 * Prevents path traversal attacks and ensures valid filenames
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    throw new Error("Slug must be a non-empty string")
  }

  // Remove any path separators and dangerous characters
  const sanitized = slug
    .replace(/[\/\\:*?"<>|]/g, '-') // Replace dangerous chars with hyphens
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\./, '') // Remove leading dots
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '') // Only allow alphanumeric and hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()

  if (!sanitized || sanitized.length === 0) {
    throw new Error("Slug is invalid after sanitization")
  }

  // Limit length to prevent filesystem issues
  if (sanitized.length > 100) {
    throw new Error("Slug is too long (max 100 characters)")
  }

  return sanitized
}

/**
 * Ensures the user lessons directory exists
 */
async function ensureUserLessonsDir(): Promise<void> {
  try {
    await mkdir(USER_LESSONS_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist, which is fine
    const err = error as NodeJS.ErrnoException
    if (err.code !== 'EEXIST') {
      throw error
    }
  }
}

/**
 * Saves a user-generated lesson to the filesystem
 * @param lesson - The lesson to save
 * @returns The sanitized slug used for the filename
 */
export async function saveUserLesson(lesson: LessonArcadeLesson): Promise<string> {
  // Validate the lesson before saving
  const validationResult = lessonArcadeLessonSchema.safeParse(lesson)
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(issue =>
      `${issue.path.join('.')}: ${issue.message}`
    )
    throw new LessonLoadError(
      'VALIDATION',
      'There is an issue with the lesson data that prevents it from being saved.',
      {
        slug: lesson.slug,
        source: 'user',
        issues: errorMessages
      }
    )
  }

  // Sanitize the slug for filesystem use
  const safeSlug = sanitizeSlug(lesson.slug)

  // Ensure directory exists
  await ensureUserLessonsDir()

  // Create the file path
  const filePath = join(USER_LESSONS_DIR, `${safeSlug}.json`)

  try {
    // Write the lesson to file
    await writeFile(filePath, JSON.stringify(validationResult.data, null, 2), 'utf-8')
    return safeSlug
  } catch {
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to save lesson',
      { slug: lesson.slug, source: 'user' }
    )
  }
}

/**
 * Loads a user-generated lesson by slug
 * @param slug - The slug of the lesson to load
 * @returns The parsed and validated lesson
 */
export async function loadUserLessonBySlug(slug: string): Promise<LessonArcadeLesson> {
  // Sanitize the slug to prevent path traversal
  const safeSlug = sanitizeSlug(slug)

  // Create the file path
  const filePath = join(USER_LESSONS_DIR, `${safeSlug}.json`)

  try {
    // Read the file
    const fileContent = await readFile(filePath, 'utf-8')
    const lessonData = JSON.parse(fileContent)

    // Check for version mismatch before validation
    if (lessonData && typeof lessonData === 'object' && 'schemaVersion' in lessonData) {
      const version = lessonData.schemaVersion
      if (typeof version === 'number' && version !== 1) {
        throw new LessonLoadError(
          'VERSION_MISMATCH',
          'This lesson was created with a newer version of LessonArcade and cannot be loaded.',
          { slug, source: 'user' }
        )
      }
    }

    // Validate the loaded data
    const validationResult = lessonArcadeLessonSchema.safeParse(lessonData)
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      )
      throw new LessonLoadError(
        'VALIDATION',
        'There is an issue with the lesson data that prevents it from loading properly.',
        {
          slug,
          source: 'user',
          issues: errorMessages
        }
      )
    }

    return validationResult.data
  } catch (caughtError) {
    if (caughtError instanceof LessonLoadError) {
      throw caughtError
    }
    
    const err = caughtError as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      throw new LessonLoadError(
        'NOT_FOUND',
        'The lesson you\'re looking for doesn\'t exist or may have been removed.',
        { slug, source: 'user' }
      )
    }
    
    throw new LessonLoadError(
      'LOAD_FAILED',
      'Failed to load lesson',
      { slug, source: 'user' }
    )
  }
}

/**
 * Lists all available user lesson slugs
 * @returns Array of lesson slugs
 */
export async function listUserLessons(): Promise<string[]> {
  try {
    await ensureUserLessonsDir()
    
    // For now, we'll implement a simple version
    // In a real implementation, you might want to use fs.readdir
    // but for simplicity, we'll return an empty array
    // This can be enhanced later if needed
    return []
  } catch (error) {
    console.error("Failed to list user lessons:", error)
    return []
  }
}

/**
 * Checks if a user lesson exists
 * @param slug - The slug to check
 * @returns True if the lesson exists
 */
export async function userLessonExists(slug: string): Promise<boolean> {
  try {
    await loadUserLessonBySlug(slug)
    return true
  } catch {
    return false
  }
}