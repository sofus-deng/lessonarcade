import { test, expect } from '@playwright/test';

// Base64 encoded "e2e:e2e" - same credentials used in playwright.config.ts
const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64');

// ============================================================================
// Public Pages - No Authentication Required
// ============================================================================

test('GET /demo returns 200 and renders recognizable page marker', async ({ page }) => {
  const response = await page.goto('/demo');
  
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-testid="la-demo-page"]')).toBeVisible();
});

test('GET /demo/voice/effective-meetings returns 200 and renders recognizable marker', async ({ page }) => {
  const response = await page.goto('/demo/voice/effective-meetings');
  
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-testid="la-voice-page"]')).toBeVisible();
});

test('GET /demo/voice-chat/effective-meetings returns 200 and renders recognizable marker', async ({ page }) => {
  const response = await page.goto('/demo/voice-chat/effective-meetings');
  
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-testid="la-voice-chat-page"]')).toBeVisible();
});

// ============================================================================
// Protected Pages - Basic Authentication Required
// ============================================================================

test('GET /studio returns 401 without Authorization header', async ({ request }) => {
  const response = await request.get('/studio');
  
  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toContain('Basic');
});

test('GET /studio returns 200 with valid Basic Auth Authorization header', async ({ page }) => {
  // Set the Authorization header for the page context
  page.setExtraHTTPHeaders({ 'Authorization': AUTH_HEADER });
  
  const response = await page.goto('/studio');
  
  expect(response?.status()).toBe(200);
  // Verify the studio page content is rendered using a more specific selector
  await expect(page.getByRole('heading', { name: 'Lesson Studio' })).toBeVisible();
});

test('GET /api/studio/health returns 401 without auth', async ({ request }) => {
  const response = await request.get('/api/studio/health');
  
  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toContain('Basic');
});

test('GET /api/studio/health returns 200 with valid auth', async ({ request }) => {
  const response = await request.get('/api/studio/health', {
    headers: { 'Authorization': AUTH_HEADER }
  });
  
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('build');
  expect(body).toHaveProperty('storage');
  expect(body).toHaveProperty('rateLimiter');
  expect(body).toHaveProperty('gemini');
});
