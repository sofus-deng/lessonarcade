/**
 * Integrations - Webhooks E2E Tests
 *
 * LA3-P2-02: Webhook-based integration PoC
 */

import { test, expect } from '@playwright/test'

const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Integrations - Webhooks', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
  })

  test('Owner can view and manage webhooks', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await page.waitForLoadState('networkidle')
    
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
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await page.waitForLoadState('networkidle')
    
    // Click "Add Webhook"
    await page.getByRole('button', { name: 'Add Webhook' }).click()
    
    // Fill in webhook URL
    await page
      .getByPlaceholder('https://example.com/webhook')
      .fill('https://test.example.com/webhook')
    
    // Click "Add Webhook" button
    await page.getByRole('button', { name: 'Add Webhook' }).click()
    
    // Verify new webhook appears (page reloads)
    await expect(
      page.getByText('https://test.example.com/webhook')
    ).toBeVisible()
  })

  test('Webhook is triggered when comment is created', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to lessons overview
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'E2E test for webhook trigger'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    
    // Verify comment appears
    await expect(page.getByText(testComment)).toBeVisible()
  })

  test('Inactive webhooks are not triggered', async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
    
    // Sign in as demo owner
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Owner' }).click()
    await expect(page).toHaveURL(/\/studio/)
    
    // Navigate to integrations page
    await page.goto('/studio/settings/integrations')
    await page.waitForLoadState('networkidle')
    
    // Deactivate pre-seeded webhook
    await page
      .locator('button[title="Deactivate"]')
      .first()
      .click()
    
    // Verify webhook is now inactive
    await expect(page.getByText('Inactive')).toBeVisible()
    
    // Navigate to lessons and add a comment
    await page.goto('/studio/lessons')
    await page.waitForLoadState('networkidle')
    
    // Click Review button on first lesson
    await page.getByRole('button', { name: 'Review' }).first().click()
    await expect(page).toHaveURL(/\/studio\/lessons\/.+/)
    
    // Add a comment
    const testComment = 'Test with inactive webhook'
    await page
      .locator('[data-testid="la-lesson-comment-input"]')
      .fill(testComment)
    await page.getByRole('button', { name: 'Add Comment' }).click()
    
    // Verify comment appears
    await expect(page.getByText(testComment)).toBeVisible()
    
    // Reactivate webhook for other tests
    await page.goto('/studio/settings/integrations')
    await page
      .locator('button[title="Activate"]')
      .first()
      .click()
  })
})
