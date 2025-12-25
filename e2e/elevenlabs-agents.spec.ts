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
