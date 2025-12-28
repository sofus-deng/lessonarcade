/**
 * Filename Sanitizer Utility
 *
 * This module provides a utility function for sanitizing strings
 * for safe use in Content-Disposition filenames.
 *
 * Ensures filenames are:
 * - URL-safe
 * - Cross-platform compatible
 * - Free of special characters that could cause issues
 */

/**
 * Sanitize a string for safe use in a filename.
 *
 * Strategy:
 * 1. Convert to lowercase
 * 2. Replace any invalid char (not in [a-z0-9._-]) with hyphen (-)
 * 3. Collapse multiple hyphens into one
 * 4. Trim leading/trailing hyphens and dots
 * 5. If result is empty, fall back to "export"
 *
 * @param input - The string to sanitize
 * @returns Sanitized string safe for filenames
 */
export function sanitizeFilename(input: string): string {
  // 1. Convert to lowercase
  let result = input.toLowerCase()

  // 2. Replace any invalid char (not in [a-z0-9._-]) with hyphen (-)
  result = result.replace(/[^a-z0-9._-]/g, '-')

  // 3. Collapse multiple hyphens into one
  result = result.replace(/-+/g, '-')

  // 4. Trim leading/trailing hyphens and dots
  result = result.replace(/^[-.]+|[-.]+$/g, '')

  // 5. If result is empty, fall back to "export"
  if (result === '') {
    return 'export'
  }

  return result
}
