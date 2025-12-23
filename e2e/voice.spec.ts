import { test, expect } from '@playwright/test';

test('voice lesson page loads correctly', async ({ page }) => {
  // Visit the voice lesson page
  await page.goto('/demo/voice/effective-meetings');
  
  // Verify the voice page is visible
  await expect(page.locator('[data-testid="la-voice-page"]')).toBeVisible();
  
  // IMPORTANT: Do not click Play or trigger audio as per requirements
});