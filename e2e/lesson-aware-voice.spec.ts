import { test, expect } from '@playwright/test'

test('lesson page Voice Conversation CTA navigates with lesson parameter', async ({ page }) => {
  await page.goto('/demo/lesson/design-feedback-basics')

  await expect(page.locator('[data-testid="la-lesson-page"]')).toBeVisible()

  const voiceConversationButton = page.getByRole('link', { name: 'Voice Conversation' })
  await expect(voiceConversationButton).toBeVisible()

  await voiceConversationButton.click()
  await expect(page).toHaveURL(/\/agents\?lesson=design-feedback-basics/)
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()
})

test('agents page shows lesson context when lesson parameter is provided', async ({ page }) => {
  await page.goto('/agents?lesson=design-feedback-basics')

  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-panel"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-title"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-title"]')).toContainText('Design Feedback Basics')

  await expect(page.locator('[data-testid="la-lesson-context-key-points-heading"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-suggested-questions-heading"]')).toBeVisible()
})

test('agents page shows error when lesson parameter is invalid', async ({ page }) => {
  await page.goto('/agents?lesson=non-existent-lesson')

  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-error"]')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
})

test('agents page works normally without lesson parameter', async ({ page }) => {
  await page.goto('/agents')

  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()

  await expect(page.locator('[data-testid="la-lesson-context-panel"]')).not.toBeVisible()

  await expect(page.getByRole('button', { name: 'Start Conversation' })).toBeVisible()
})
