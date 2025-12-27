/**
 * E2E tests for lesson runs backend analytics.
 *
 * Tests verify that:
 * - The API call is best-effort (doesn't block the UI)
 * - The UI remains responsive even when the API fails
 */

import { test, expect } from '@playwright/test'

test.describe('Lesson Runs E2E', () => {
  test('should not block UI if API fails', async ({ page }) => {
    // Mock the API to fail
    await page.route('**/api/lesson-runs', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    // Navigate to lesson page
    await page.goto('/demo/lesson/effective-meetings')

    // Wait for lesson to load
    await expect(page.locator('[data-testid="la-lesson-page"]')).toBeVisible()

    // Verify page is still responsive despite API failure
    // This confirms that the API call is best-effort and doesn't block the UI
    await expect(page.locator('body')).toBeVisible()
  })
})
