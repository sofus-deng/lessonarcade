import { test, expect } from '@playwright/test';

test('pricing page loads and displays all plans', async ({ page }) => {
  // Navigate to the pricing page
  const response = await page.goto('/pricing');

  // Verify the page loads successfully
  expect(response?.status()).toBe(200);

  // Verify the pricing page is visible using the test id
  await expect(page.locator('[data-testid="la-pricing-page"]')).toBeVisible();

  // Verify all three plan names (Free, Pro, Team) appear on the page
  await expect(page.getByText('Free').first()).toBeVisible();
  await expect(page.getByText('Pro').first()).toBeVisible();
  await expect(page.getByText('Team').first()).toBeVisible();

  // Verify the recommended plan (Pro) is visually distinguished
  await expect(page.locator('[data-testid="la-pricing-recommended"]')).toBeVisible();
});

test('pricing page navigation link works from home page', async ({ page }) => {
  // Start from the home page
  await page.goto('/');

  // Click on the Pricing link in the navigation
  const pricingLink = page.getByRole('link', { name: 'Pricing' });
  await expect(pricingLink).toBeVisible();
  await pricingLink.click();

  // Verify we're now on the pricing page
  await expect(page.locator('[data-testid="la-pricing-page"]')).toBeVisible();
  await expect(page).toHaveURL('/pricing');
});
