import { test, expect } from '@playwright/test';

test('voice chat page loads correctly', async ({ page }) => {
  // Visit the voice chat page
  await page.goto('/demo/voice-chat/effective-meetings');
  
  // Verify the voice chat page is visible
  await expect(page.locator('[data-testid="la-voice-chat-page"]')).toBeVisible();
  
  // IMPORTANT: Do not trigger audio as per requirements
});