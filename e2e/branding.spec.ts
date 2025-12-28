import { test, expect } from '@playwright/test'

test.describe('Branding System', () => {
  test('demo page loads with default brand', async ({ page }) => {
    await page.goto('/demo')

    // Check data-brand attribute on document element (where BrandSwitcher sets it)
    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'lessonarcade-default'
    )
  })

  test('demo page loads with warm-paper brand from query', async ({ page }) => {
    await page.goto('/demo?brand=warm-paper')

    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'warm-paper'
    )
  })

  test('demo page loads with night-classroom brand from query', async ({ page }) => {
    await page.goto('/demo?brand=night-classroom')

    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'night-classroom'
    )
  })

  test('demo page falls back to default for unknown brand', async ({ page }) => {
    await page.goto('/demo?brand=unknown-brand')

    // Verify brand falls back to default
    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'lessonarcade-default'
    )
  })

  test('brand switcher updates URL query param', async ({ page }) => {
    await page.goto('/demo')

    const brandSelect = page.locator('#brand-select')
    await expect(brandSelect).toBeVisible()

    // Select warm-paper
    await brandSelect.selectOption('warm-paper')

    // Verify data-brand attribute
    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'warm-paper'
    )
  })

  test('brand switcher reads initial brand from query param', async ({ page }) => {
    await page.goto('/demo?brand=night-classroom')

    const brandSelect = page.locator('#brand-select')
    await expect(brandSelect).toBeVisible()

    // Verify select has correct initial value
    const selectedValue = await brandSelect.inputValue()
    expect(selectedValue).toBe('night-classroom')
  })

  test('brand switcher updates data-brand attribute', async ({ page }) => {
    await page.goto('/demo')

    const brandSelect = page.locator('#brand-select')
    await expect(brandSelect).toBeVisible()

    // Select warm-paper
    await brandSelect.selectOption('warm-paper')

    // Verify data-brand attribute on document element (where BrandSwitcher sets it)
    await expect(page.locator('html')).toHaveAttribute(
      'data-brand',
      'warm-paper'
    )
  })
})
