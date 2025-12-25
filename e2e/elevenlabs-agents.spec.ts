import { test, expect } from '@playwright/test'

test('GET /api/get-signed-url returns signedUrl in mock mode', async ({ request }) => {
  const response = await request.get('/api/get-signed-url')

  expect(response.ok()).toBe(true)

  const data = await response.json()
  expect(data).toHaveProperty('signedUrl')
  expect(typeof data.signedUrl).toBe('string')
})

test('/agents page renders and shows start button', async ({ page }) => {
  await page.goto('/agents')

  // Verify page is visible
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()

  // Verify start button is visible
  await expect(page.getByRole('button', { name: 'Start Conversation' })).toBeVisible()

  // IMPORTANT: Do not click to avoid mic requirement in CI
})

test('home page has Voice Conversation CTA in HeroSection that navigates to /agents', async ({ page }) => {
  await page.goto('/')

  // Verify Voice Conversation button is visible in HeroSection (main content area)
  const heroVoiceConversationButton = page.locator('main').getByRole('link', { name: 'Voice Conversation' })
  await expect(heroVoiceConversationButton).toBeVisible()

  // Click button and verify navigation to /agents (with optional query string)
  await heroVoiceConversationButton.click()
  await expect(page).toHaveURL(/\/agents/)
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()
})

test('navigation bar has Voice Conversation link that navigates to /agents', async ({ page }) => {
  await page.goto('/')

  // Verify Voice Conversation link is visible in navigation
  const navVoiceConversationLink = page.locator('nav').getByRole('link', { name: 'Voice Conversation' })
  await expect(navVoiceConversationLink).toBeVisible()

  // Click link and verify navigation to /agents (with optional query string)
  await navVoiceConversationLink.click()
  await expect(page).toHaveURL(/\/agents/)
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()
})

test('demo page has Voice Conversation CTA that navigates to /agents', async ({ page }) => {
  await page.goto('/demo')

  // Verify Voice Conversation button is visible
  const voiceConversationButton = page.getByRole('link', { name: 'Voice Conversation' })
  await expect(voiceConversationButton).toBeVisible()

  // Click button and verify navigation to /agents (with optional query string)
  await voiceConversationButton.click()
  await expect(page).toHaveURL(/\/agents/)
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()
})

test('lesson page has Voice Conversation CTA that navigates to /agents', async ({ page }) => {
  await page.goto('/demo/lesson/design-feedback-basics')

  // Verify lesson page is visible
  await expect(page.locator('[data-testid="la-lesson-page"]')).toBeVisible()

  // Verify Voice Conversation button is visible
  const voiceConversationButton = page.getByRole('link', { name: 'Voice Conversation' })
  await expect(voiceConversationButton).toBeVisible()

  // Click button and verify navigation to /agents (with optional query string)
  await voiceConversationButton.click()
  await expect(page).toHaveURL(/\/agents/)
  await expect(page.locator('[data-testid="la-agents-page"]')).toBeVisible()
})
