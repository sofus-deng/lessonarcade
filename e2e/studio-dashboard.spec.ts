/**
 * Studio Dashboard E2E Tests
 *
 * LA3-P0-03: Tests for the workspace-level dashboard at /studio.
 */

import { test, expect } from '@playwright/test'
import { applyBasicAuth, signInAsDemo } from './utils/auth'

test.describe('Studio Dashboard', () => {
  test.beforeEach(async ({ context }) => {
    await applyBasicAuth(context)
  })

  test('anonymous visit to /studio redirects to sign-in', async ({ page }) => {
    await page.goto('/studio')
    await expect(page).toHaveURL(/\/auth\/demo-signin/)
  })

  test('dashboard shows metrics and top lessons for active workspace', async ({ page }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Land on /studio
    await expect(page).toHaveURL(/\/studio/)
    await expect(page.locator('[data-testid="la-studio-dashboard-page"]')).toBeVisible()

    // 3. Verify workspace header
    await expect(page.getByRole('heading', { name: 'LessonArcade Demo Workspace Dashboard' })).toBeVisible()

    // 4. Verify metric cards
    await expect(
      page.getByRole('heading', { name: 'Lessons', exact: true })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lesson Runs' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Average Score' })).toBeVisible()
    
    // In seeded demo workspace, we expect 2 lessons
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible()

    // 5. Verify top lessons list
    await expect(page.getByRole('heading', { name: 'Top Lessons' })).toBeVisible()
    await expect(page.getByText('effective-meetings')).toBeVisible()
    await expect(page.getByText('react-hooks-intro')).toBeVisible()
  })

  test('workspace switcher updates dashboard data', async ({ page }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Start at Demo Workspace
    await expect(page.getByRole('heading', { name: 'LessonArcade Demo Workspace Dashboard' })).toBeVisible()

    // 3. Switch to Sample Team
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sample Team' }).click()

    // 4. Verify dashboard updates
    await expect(page.getByRole('heading', { name: 'Sample Team Dashboard' })).toBeVisible()
    
    // Sample team also has 2 lessons in seed
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible()
    
    // Verify sample team lessons are shown
    await expect(page.getByText('design-feedback-basics')).toBeVisible()
    await expect(page.getByText('feedback-that-lands')).toBeVisible()
  })
})
