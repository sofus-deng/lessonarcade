/**
 * Collaboration Comments E2E Tests
 *
 * LA3-P3-04: Tests for collaboration comments functionality.
 */

import { test, expect } from '@playwright/test'

const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Collaboration Comments', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
  })

  test('Editor can add and see comments', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Sign in as demo editor
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Editor' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Verify comments panel is visible
    await expect(
      page.locator('[data-testid="la-studio-lesson-review-page"]')
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="la-lesson-comments-list"]')
    ).toBeVisible()
    
    // Verify comment input is available (editor role)
    await expect(
      page.locator('[data-testid="la-lesson-comment-input"]')
    ).toBeVisible()
    
    // Add a comment
    const testComment = 'E2E test comment from editor'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    
    // Verify comment appears in list
    await expect(page.getByText(testComment)).toBeVisible()
  })

  test('Viewer sees comments in read-only mode', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // First, sign in as editor to create a comment
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Editor' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'E2E test comment for viewer'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    await expect(page.getByText(testComment)).toBeVisible()
    
    // Sign out
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Viewer' }).click()
    await expect(page).toHaveURL(/\/auth\/demo-signin/)
    
    // Sign in as viewer
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Viewer' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to same lesson
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Verify comment is visible
    await expect(page.getByText(testComment)).toBeVisible()
    
    // Verify comment input is NOT available (viewer role)
    await expect(
      page.locator('[data-testid="la-lesson-comment-input"]')
    ).not.toBeVisible()
    
    // Verify read-only message is shown
    await expect(
      page.getByText('View-only role; comments are read-only for this user')
    ).toBeVisible()
  })

  test('Comments are scoped per workspace', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Add comment in demo workspace
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Editor' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Add comment in demo workspace
    const demoComment = 'Demo workspace specific comment'
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add comment
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(demoComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    await expect(page.getByText(demoComment)).toBeVisible()
    
    // Switch to sample team workspace
    await page.goto('/studio')
    await page.getByRole('button', { name: 'Switch Workspace' }).click()
    await page.getByRole('menuitem', { name: 'Sample Team' }).click()
    
    // Navigate to lessons in sample team
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Verify demo workspace comment is NOT visible
    await expect(page.getByText(demoComment)).not.toBeVisible()
  })
})
