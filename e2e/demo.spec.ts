import { test, expect } from '@playwright/test';

test('demo page loads and lesson navigation works', async ({ page }) => {
  // Visit the demo page
  await page.goto('/demo');
  
  // Verify the demo page is visible
  await expect(page.locator('[data-testid="la-demo-page"]')).toBeVisible();
  
  // Click on the first lesson card's "Start Lesson" button
  // Using a more specific selector to target the first lesson card
  const firstLessonLink = page.locator('a[href*="/demo/lesson/"]').first();
  await expect(firstLessonLink).toBeVisible();
  await firstLessonLink.click();
  
  // Verify we're on a lesson page
  await expect(page.locator('[data-testid="la-lesson-page"]')).toBeVisible();
});