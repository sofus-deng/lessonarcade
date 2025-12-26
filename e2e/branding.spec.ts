import { test, expect } from '@playwright/test';

test.describe('Branding System', () => {
  test('demo page loads with default brand', async ({ page }) => {
    await page.goto('/demo');

    const brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('lessonarcade-default');
  });

  test('demo page loads with warm-paper brand from query', async ({ page }) => {
    await page.goto('/demo?brand=warm-paper');

    const brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('warm-paper');
  });

  test('demo page loads with night-classroom brand from query', async ({ page }) => {
    await page.goto('/demo?brand=night-classroom');

    const brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('night-classroom');
  });

  test('demo page falls back to default for unknown brand', async ({ page }) => {
    await page.goto('/demo?brand=unknown-brand');

    const brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('lessonarcade-default');
  });

  test('brand switcher updates data-brand attribute', async ({ page }) => {
    await page.goto('/demo');

    // Find and interact with brand switcher
    const brandSelect = page.locator('#brand-select');
    await expect(brandSelect).toBeVisible();

    // Verify initial state
    let brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('lessonarcade-default');

    // Select warm-paper
    await brandSelect.selectOption('warm-paper');
    brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('warm-paper');

    // Select night-classroom
    await brandSelect.selectOption('night-classroom');
    brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('night-classroom');

    // Select back to default
    await brandSelect.selectOption('lessonarcade-default');
    brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('lessonarcade-default');
  });

  test('brand switcher updates URL query param', async ({ page }) => {
    await page.goto('/demo');

    const brandSelect = page.locator('#brand-select');
    await expect(brandSelect).toBeVisible();

    // Select warm-paper
    await brandSelect.selectOption('warm-paper');
    await expect(page).toHaveURL(/brand=warm-paper/);

    // Select night-classroom
    await brandSelect.selectOption('night-classroom');
    await expect(page).toHaveURL(/brand=night-classroom/);
  });

  test('brand switcher reads initial brand from query param', async ({ page }) => {
    await page.goto('/demo?brand=night-classroom');

    const brandSelect = page.locator('#brand-select');
    await expect(brandSelect).toBeVisible();

    // Verify select has the correct initial value
    const selectedValue = await brandSelect.inputValue();
    expect(selectedValue).toBe('night-classroom');

    // Verify data-brand attribute matches
    const brandAttr = await page.locator('html').getAttribute('data-brand');
    expect(brandAttr).toBe('night-classroom');
  });
});
