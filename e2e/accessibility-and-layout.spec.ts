import { test, expect } from '@playwright/test';

test.describe('Accessibility and Layout', () => {
  test('mobile viewport layout for lesson page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    
    // Visit a lesson page
    await page.goto('/demo/lesson/react-hooks-intro');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify that the lesson page is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Verify that the main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Verify that buttons are visible and not clipped off the bottom
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();
    
    // Get the bounding box of the first button
    const buttonBox = await buttons.first().boundingBox();
    expect(buttonBox).toBeTruthy();
    
    // Verify that the button is within the viewport
    if (buttonBox) {
      expect(buttonBox.y).toBeGreaterThan(0);
      expect(buttonBox.y + buttonBox.height).toBeLessThan(640);
    }
  });

  test('mobile viewport layout for voice demo page', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 640 });
    
    // Visit a voice demo page
    await page.goto('/demo/voice/effective-meetings');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify that the voice demo page is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Verify that the main content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Verify that voice controls are visible and not clipped
    const voiceControls = page.locator('button').filter({ hasText: /Play|Pause|Stop/i });
    await expect(voiceControls.first()).toBeVisible();
    
    // Get the bounding box of the first voice control button
    const controlBox = await voiceControls.first().boundingBox();
    expect(controlBox).toBeTruthy();
    
    // Verify that the control is within the viewport
    if (controlBox) {
      expect(controlBox.y).toBeGreaterThan(0);
      expect(controlBox.y + controlBox.height).toBeLessThan(640);
    }
  });
});
