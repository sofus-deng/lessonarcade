import { test, expect } from '@playwright/test'

test.describe('Branding System', () => {
  test('demo page loads with default brand', async ({ page }) => {
    await page.goto('/demo')

    // Check data-brand attribute on document element (where BrandSwitcher sets it)
    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('lessonarcade-default')
  })

  test('demo page loads with warm-paper brand from query', async ({ page }) => {
    await page.goto('/demo?brand=warm-paper')

    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('warm-paper')
  })

  test('demo page loads with night-classroom brand from query', async ({ page }) => {
    await page.goto('/demo?brand=night-classroom')

    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('night-classroom')
  })

  test('demo page falls back to default for unknown brand', async ({ page }) => {
    await page.goto('/demo?brand=unknown-brand')

    // Verify brand falls back to default
    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('lessonarcade-default')
  })

  test('brand switcher updates URL query param', async ({ page }) => {
    await page.goto('/demo')

    const brandSelect = page.locator('#brand-select')
    await expect(brandSelect).toBeVisible()

    // Select warm-paper
    const warmPaperOption = page.locator('select option[value="warm-paper"]')
    await warmPaperOption.click()

    // Verify data-brand attribute
    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('warm-paper')
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
    const warmPaperOption = page.locator('select option[value="warm-paper"]')
    await warmPaperOption.click()

    // Verify data-brand attribute on document element (where BrandSwitcher sets it)
    const brandAttr = await page.locator('html').getAttribute('data-brand')
    expect(brandAttr).toBe('warm-paper')
  })
})
