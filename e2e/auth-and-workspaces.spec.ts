/**
 * Auth and Workspaces E2E Tests
 *
 * LA3-P0-02: Tests for the full demo sign-in and workspace switching experience.
 */

import { test, expect } from '@playwright/test'

// Base64 encoded "e2e:e2e" for outer Basic Auth guard
const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Auth and Workspaces', () => {
  test.beforeEach(async ({ page }) => {
    // Add Basic Auth header for all requests
    await page.setExtraHTTPHeaders({ Authorization: BASIC_AUTH_HEADER })
  })

  test('anonymous visit to /studio redirects to sign-in page', async ({ page }) => {
    await page.goto('/studio')
    
    // Should be redirected to /auth/demo-signin
    await expect(page).toHaveURL(/\/auth\/demo-signin/)
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in as Demo Owner' })).toBeVisible()
  })

  test('demo sign-in flow and workspace switching', async ({ page }) => {
    // 1. Visit sign-in page
    await page.goto('/auth/demo-signin')

    // 2. Sign in as Demo Owner
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 3. Should land on /studio with Demo Workspace
    await expect(page).toHaveURL(/\/studio/)
    await expect(page.locator('header')).toContainText('LessonArcade Demo Workspace')
    await expect(page.getByRole('heading', { name: 'Lesson Studio' })).toBeVisible()

    // 4. Navigate to lessons overview
    await page.goto('/studio/lessons')
    await expect(page).toHaveURL(/\/studio\/lessons/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('LessonArcade Demo Workspace')
    
    // Check lessons in Demo workspace
    await expect(page.getByRole('cell', { name: 'effective-meetings' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'react-hooks-intro' })).toBeVisible()

    // 5. Use workspace switcher to change to Sample Team
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sample Team' }).click()

    // 6. Should show Sample Team lessons
    await expect(page.locator('header')).toContainText('Sample Team')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sample Team')
    
    // Check lessons in Sample Team workspace
    await expect(page.getByRole('cell', { name: 'design-feedback-basics' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'feedback-that-lands' })).toBeVisible()

    // 7. Sign out
    await page.getByRole('button', { name: 'Sign Out' }).click()
    
    // Should be back at sign-in page
    await expect(page).toHaveURL(/\/auth\/demo-signin/)
  })
})
