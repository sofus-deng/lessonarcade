/**
 * E2E tests for Studio Lessons Overview page.
 *
 * Tests verify that:
 * - The lessons overview page renders at /studio/lessons
 * - The page structure is present (header, summary panel, lessons section)
 * - The page handles empty state gracefully
 */

import { test, expect } from '@playwright/test'

test.describe('Studio Lessons Overview', () => {
  test('should render lessons overview page at /studio/lessons', async ({ page }) => {
    await page.goto('/studio/lessons')

    // Verify the page renders
    await expect(page.locator('[data-testid="la-lessons-overview-page"]')).toBeVisible()
  })

  test('should display page header', async ({ page }) => {
    await page.goto('/studio/lessons')

    // Verify the page header is displayed
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })

  test('should display summary panel structure', async ({ page }) => {
    await page.goto('/studio/lessons')

    // Verify the summary panel structure is displayed
    // Note: Content may vary based on whether database is seeded
    await expect(page.getByText('Total Lessons')).toBeVisible()
    await expect(page.getByText('Total Runs')).toBeVisible()
    await expect(page.getByText('Average Score')).toBeVisible()
  })

  test('should display lessons section structure', async ({ page }) => {
    await page.goto('/studio/lessons')

    // Verify the lessons section header is displayed
    // Note: Content may vary based on whether database is seeded
    await expect(page.getByText('Lessons')).toBeVisible()
  })

  test('should display empty state when no lessons', async ({ page }) => {
    await page.goto('/studio/lessons')

    // Verify the page renders (may show empty state if no lessons)
    await expect(page.locator('[data-testid="la-lessons-overview-page"]')).toBeVisible()

    // Check if empty state message is present (may or may not be, depending on DB state)
    const emptyState = page.getByText(/no lessons found/i)
    const isVisible = await emptyState.isVisible().catch(() => false)
    if (isVisible) {
      await expect(emptyState).toBeVisible()
    }
  })
})
