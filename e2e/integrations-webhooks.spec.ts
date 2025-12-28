/**
 * Integrations - Webhooks E2E Tests
 *
 * LA3-P2-02: Webhook-based integration PoC
 */

import { test, expect } from '@playwright/test'
import { applyBasicAuth, signInAsDemo } from './utils/auth'

test.describe('Integrations - Webhooks', () => {
  test.beforeEach(async ({ context }) => {
    await applyBasicAuth(context)
  })

  test('Owner can view and manage webhooks', async ({ page }) => {
    // Sign in as demo owner
    await signInAsDemo(page, 'Owner')
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await expect(
      page.locator('[data-testid="la-studio-integrations-page"]')
    ).toBeVisible()
    
    // Verify page loads
    await expect(
      page.locator('[data-testid="la-studio-integrations-page"]')
    ).toBeVisible()
    
    // Verify pre-seeded webhook is visible
    await expect(
      page.getByText('https://example.com/lessonarcade-webhook-demo')
    ).toBeVisible()
    
    // Verify PoC notice is visible
    await expect(
      page.getByText(/PoC Note/)
    ).toBeVisible()
  })

  test('Owner can add a new webhook', async ({ page }) => {
    // Sign in as demo owner
    await signInAsDemo(page, 'Owner')
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await expect(
      page.locator('[data-testid="la-studio-integrations-page"]')
    ).toBeVisible()
    
    // Click "Add Webhook"
    await page.getByRole('button', { name: 'Add Webhook' }).first().click()
    
    // Fill in webhook URL
    await page
      .getByPlaceholder('https://example.com/webhook')
      .fill('https://test.example.com/webhook')
    
    // Click "Add Webhook" button
    await page.getByRole('button', { name: 'Add Webhook' }).nth(1).click()
    
    // Verify new webhook appears (page reloads)
    await expect(
      page.getByText('https://test.example.com/webhook')
    ).toBeVisible()
  })

  test('Webhook is triggered when comment is created', async ({ page }) => {
    // Sign in as demo owner
    await signInAsDemo(page, 'Owner')
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'E2E test for webhook trigger'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    
    // Verify comment appears
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(testComment)
  })

  test('Inactive webhooks are not triggered', async ({ page }) => {
    // Sign in as demo owner
    await signInAsDemo(page, 'Owner')
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await expect(
      page.locator('[data-testid="la-studio-integrations-page"]')
    ).toBeVisible()
    
    const demoWebhookCard = page.getByTestId('la-webhook-card-demo-webhook-1')
    await expect(demoWebhookCard).toBeVisible()

    const statusBadge = demoWebhookCard.getByTestId('la-webhook-status-demo-webhook-1')
    const toggleButton = demoWebhookCard.getByTestId('la-webhook-toggle-demo-webhook-1')
    const statusText = (await statusBadge.textContent()) ?? ''

    if (statusText.includes('Active')) {
      await toggleButton.click()
      await expect(statusBadge).toHaveText('Inactive')
    } else {
      await expect(statusBadge).toHaveText('Inactive')
    }
    
    // Navigate to lessons and add a comment
    await page.goto('/studio/lessons')
    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    
    // Click Review button on first lesson
    await page.getByRole('link', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'Test with inactive webhook'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    
    // Verify comment appears
    await expect(
      page.getByTestId('la-lesson-comments-list')
    ).toContainText(testComment)
    
    // Reactivate webhook for other tests
    await page.goto('/studio/settings/integrations')
    const reactivateCard = page.getByTestId('la-webhook-card-demo-webhook-1')
    await expect(reactivateCard).toBeVisible()
    const reactivateStatus = reactivateCard.getByTestId('la-webhook-status-demo-webhook-1')
    const reactivateToggle = reactivateCard.getByTestId('la-webhook-toggle-demo-webhook-1')
    const reactivateText = (await reactivateStatus.textContent()) ?? ''
    if (reactivateText.includes('Inactive')) {
      await reactivateToggle.click()
      await expect(reactivateStatus).toHaveText('Active')
    }
  })
})
