/**
 * Collaboration Comments E2E Tests
 *
 * LA3-P3-04: Tests for collaboration comments functionality.
 */

import { test, expect } from '@playwright/test'
import { applyBasicAuth, signInAsDemo } from './utils/auth'

test.describe('Collaboration Comments', () => {
  test.beforeEach(async ({ context }) => {
    await applyBasicAuth(context)
  })

  test('Editor can add and see comments', async ({ page }) => {
    await signInAsDemo(page, 'Owner')
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
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
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(testComment)
  })

  test('Viewer sees comments in read-only mode', async ({ page }) => {
    // First, sign in as editor to create a comment
    await signInAsDemo(page, 'Editor')
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'E2E test comment for viewer'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(testComment)
    
    // Switch to viewer role
    await signInAsDemo(page, 'Viewer')
    
    // Navigate to same lesson
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Verify comment is visible
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(testComment)
    
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
    // Add comment in demo workspace
    await signInAsDemo(page, 'Owner')
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Add comment in demo workspace
    const demoComment = 'Demo workspace specific comment'
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add comment
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(demoComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(demoComment)
    
    // Switch to sample team workspace
    await page.goto('/studio')
    await expect(
      page.locator('[data-testid="la-studio-dashboard-page"]')
    ).toBeVisible()
    const workspaceSelect = page.getByRole('combobox')
    await expect(workspaceSelect).toBeEnabled()
    await workspaceSelect.click()
    const sampleOption = page.getByRole('option', { name: 'Sample Team' })
    await expect(sampleOption).toBeVisible()
    await sampleOption.click()
    
    // Navigate to lessons in sample team
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Verify demo workspace comment is NOT visible
    await expect(
      page.getByTestId('la-lesson-comments-list').getByText(demoComment)
    ).toHaveCount(0)
  })
})
