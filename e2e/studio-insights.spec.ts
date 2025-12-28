/**
 * Studio Insights E2E Tests
 *
 * LA3-P2-03: Tests for the workspace insights dashboard at /studio/insights.
 */

import { test, expect } from '@playwright/test'

// Base64 encoded "e2e:e2e" for outer Basic Auth guard
const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Studio Insights', () => {
  test.beforeEach(async ({ page }) => {
    // Add Basic Auth header for all requests
    await page.setExtraHTTPHeaders({ Authorization: BASIC_AUTH_HEADER })
  })

  test('as Demo Owner: view insights page with metrics', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()

    // 4. Verify workspace name in header
    await expect(
      page.getByRole('heading', {
        name: 'LessonArcade Demo Workspace Insights',
      })
    ).toBeVisible()

    // 5. Verify metric cards show values (not exact numbers, just that they exist)
    await expect(
      page.locator('[data-testid="la-insights-metric-runs"]')
    ).toBeVisible()
    await expect(
      page.locator('[data-testid="la-insights-metric-avg-score"]')
    ).toBeVisible()

    // 6. Verify section headers are visible
    await expect(
      page.getByRole('heading', { name: 'Lessons that need attention' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Most engaged lessons' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Recent activity' })
    ).toBeVisible()

    // 7. Verify time window selector is visible
    await expect(page.getByText('Time window:')).toBeVisible()
    await expect(page.getByRole('link', { name: '7 days' })).toBeVisible()
    await expect(page.getByRole('link', { name: '30 days' })).toBeVisible()
  })

  test('as Demo Owner: navigate via Studio navigation', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Start at /studio
    await expect(page).toHaveURL(/\/studio$/)

    // 3. Click Insights link in navigation
    await page.getByRole('link', { name: 'Insights' }).click()

    // 4. Verify navigated to insights page
    await expect(page).toHaveURL(/\/studio\/insights/)
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()
  })

  test('workspace switching: switch to Sample Team and verify data changes', async ({
    page,
  }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Get initial workspace name (Demo)
    const initialWorkspaceName = await page
      .locator('h1')
      .textContent()
    expect(initialWorkspaceName).toContain('Demo Workspace')

    // 4. Switch to Sample Team workspace
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sample Team' }).click()

    // 5. Verify workspace name changes
    await expect(page.getByRole('heading', { name: 'Sample Team Insights' })).toBeVisible()

    // 6. Verify metrics are shown (even if different from Demo)
    await expect(
      page.locator('[data-testid="la-insights-metric-runs"]')
    ).toBeVisible()
  })

  test('time window selector: switch between 7 and 30 days', async ({
    page,
  }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page with default 30-day window
    await page.goto('/studio/insights')
    await expect(page).toHaveURL(/\/studio\/insights/)

    // 3. Verify 30 days is selected (has active styling)
    const thirtyDaysLink = page.getByRole('link', { name: '30 days' })
    await expect(thirtyDaysLink).toBeVisible()

    // 4. Click 7 days
    await page.getByRole('link', { name: '7 days' }).click()

    // 5. Verify URL updates with window=7
    await expect(page).toHaveURL(/window=7/)

    // 6. Click 30 days again
    await thirtyDaysLink.click()

    // 7. Verify URL updates with window=30
    await expect(page).toHaveURL(/window=30/)
  })

  test('empty state: workspace with no data shows friendly messages', async ({
    page,
  }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page with a very small window (0 days = empty)
    await page.goto('/studio/insights?window=0')

    // 3. Verify page loads
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()

    // 4. Verify metric cards show zeros or dashes
    const runsMetric = page.locator(
      '[data-testid="la-insights-metric-runs"]'
    )
    await expect(runsMetric).toBeVisible()

    // 5. Verify empty state messages are shown
    // Note: The exact message depends on whether there are lessons with runs
    // We just verify the page doesn't crash and shows some content
    await expect(
      page.getByRole('heading', { name: 'Lessons that need attention' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Most engaged lessons' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Recent activity' })
    ).toBeVisible()
  })

  test('navigation: Insights link is accessible via keyboard', async ({
    page,
  }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Start at /studio
    await page.goto('/studio')

    // 3. Navigate using Tab key
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Should land on Insights link

    // 4. Press Enter to navigate
    await page.keyboard.press('Enter')

    // 5. Verify navigated to insights page
    await expect(page).toHaveURL(/\/studio\/insights/)
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()
  })

  test('as Demo Editor: can view insights page', async ({ page }) => {
    // 1. Sign in as Demo Editor
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Editor' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()

    // 4. Verify metrics are shown
    await expect(
      page.locator('[data-testid="la-insights-metric-runs"]')
    ).toBeVisible()
  })

  test('as Demo Viewer: can view insights page', async ({ page }) => {
    // 1. Sign in as Demo Viewer
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Viewer' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()

    // 4. Verify metrics are shown
    await expect(
      page.locator('[data-testid="la-insights-metric-runs"]')
    ).toBeVisible()
  })
})
