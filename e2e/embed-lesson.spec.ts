import { test, expect } from '@playwright/test';

test('embed lesson page loads correctly', async ({ page }) => {
  // Navigate to embed route for a demo lesson
  // Note: Demo seeding is handled by global setup
  await page.goto('/embed/demo/lesson/effective-meetings');

  // Wait for embed page to be visible
  await expect(page.locator('[data-testid="la-embed-lesson-page"]')).toBeVisible();

  // Verify lesson content is present (title or heading)
  // We check for any h1 or h2 element to confirm lesson loaded
  const lessonHeading = page.locator('h1, h2').first();
  await expect(lessonHeading).toBeVisible();

  // Note: We do NOT assert on exact numeric stats (scores, counts)
  // as these may change from other tests creating more LessonRun entries
});

test('embed lesson shows error for invalid workspace', async ({ page }) => {
  // Navigate to embed route with invalid workspace
  await page.goto('/embed/invalid-workspace/lesson/effective-meetings');

  // Wait for embed page to be visible
  await expect(page.locator('[data-testid="la-embed-lesson-page"]')).toBeVisible();

  // Verify error message is shown
  await expect(page.getByText('Workspace Not Available')).toBeVisible();
  await expect(page.getByText('This workspace is not available for embedding')).toBeVisible();
});

test('embed lesson shows error for unknown lesson', async ({ page }) => {
  // Navigate to embed route with unknown lesson
  await page.goto('/embed/demo/lesson/unknown-lesson');

  // Wait for embed page to be visible
  await expect(page.locator('[data-testid="la-embed-lesson-page"]')).toBeVisible();

  // Verify error message is shown
  await expect(page.getByText('Lesson Not Found')).toBeVisible();
});
