import { test, expect } from '@playwright/test';

test('lesson page loads correctly', async ({ page }) => {
  // Visit a specific lesson page
  await page.goto('/demo/lesson/design-feedback-basics');
  
  // Verify the lesson page is visible
  await expect(page.locator('[data-testid="la-lesson-page"]')).toBeVisible();
});