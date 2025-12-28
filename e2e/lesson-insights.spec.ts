/**
 * Lesson Insights E2E Tests
 *
 * LA3-P2-05: Tests for the lesson-level insights drilldown page.
 */

import { readFile } from 'fs/promises'
import { test, expect } from '@playwright/test'
import { applyBasicAuth, signInAsDemo } from './utils/auth'

test.describe('Lesson Insights Drilldown', () => {
  test.beforeEach(async ({ context }) => {
    await applyBasicAuth(context)
  })

  test('as Demo Owner: navigate to lesson insights from workspace insights', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Wait for insights page to load
    await expect(
      page.locator('[data-testid="la-studio-insights-page"]')
    ).toBeVisible()

    // 4. Find and click on a lesson link in struggling or engaged lessons table
    const lessonInsightLink = page
      .locator('a[href*="/studio/insights/lessons/"]')
      .first()
    if (await lessonInsightLink.count()) {
      await lessonInsightLink.click()

      // 5. Verify navigated to lesson insights page
      await expect(page).toHaveURL(/\/studio\/insights\/lessons\//)

      // 6. Verify lesson insights page is visible
      await expect(
        page.locator('[data-testid="la-studio-lesson-insights-page"]')
      ).toBeVisible()
    }
  })

  test('as Demo Owner: view lesson insights page with metrics', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate directly to a lesson insights page (using a known lesson slug)
    await page.goto('/studio/insights/lessons/effective-meetings')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 4. Verify lesson title is visible
    await expect(page.getByRole('heading', { name: /effective meetings/i })).toBeVisible()

    // 5. Verify metric cards are visible
    await expect(page.getByText('Total Runs')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Avg Score' })).toBeVisible()
    await expect(page.getByText('Unique Sessions')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible()

    // 6. Verify mode breakdown section
    await expect(page.getByText('Mode Breakdown')).toBeVisible()
    await expect(page.getByText('Focus Mode')).toBeVisible()
    await expect(page.getByText('Arcade Mode')).toBeVisible()

    // 7. Verify daily activity section
    await expect(page.getByText('Daily Activity (UTC)')).toBeVisible()

    // 8. Verify recent activity section
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })

  test('time window selector: switch between 7 and 30 days', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to lesson insights page with default 30-day window
    await page.goto('/studio/insights/lessons/effective-meetings')
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 3. Click 7 days
    await page.getByRole('link', { name: '7 days' }).click()

    // 4. Verify URL updates with window=7
    await expect(page).toHaveURL(/window=7/)

    // 5. Click 30 days
    await page.getByRole('link', { name: '30 days' }).click()

    // 6. Verify URL updates with window=30
    await expect(page).toHaveURL(/window=30/)
  })

  test('CSV export: click Export CSV and verify download', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to lesson insights page
    await page.goto('/studio/insights/lessons/effective-meetings')
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 3. Click Export CSV button
    await expect(page.getByTestId('la-lesson-insights-export-csv')).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-lesson-insights-export-csv').click()
    const download = await downloadPromise

    // 4. Verify download occurred
    expect(download).toBeDefined()

    // 5. Verify filename format
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^lessonarcade-lesson-insights-[a-z0-9._-]+-[a-z0-9._-]+-(7|30)d\.csv$/)
  })

  test('CSV export: verify CSV content contains expected headers', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to lesson insights page
    await page.goto('/studio/insights/lessons/effective-meetings')
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 3. Click Export CSV button
    await expect(page.getByTestId('la-lesson-insights-export-csv')).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-lesson-insights-export-csv').click()
    const download = await downloadPromise

    // 4. Verify CSV content contains expected headers
    const downloadPath = await download.path()
    expect(downloadPath).not.toBeNull()
    const csvText = await readFile(downloadPath as string, 'utf-8')

    expect(csvText).toContain('Summary')
    expect(csvText).toContain('Lesson Title')
    expect(csvText).toContain('Lesson Slug')
    expect(csvText).toContain('Time Window Start')
    expect(csvText).toContain('Total Runs')
    expect(csvText).toContain('Average Score %')
    expect(csvText).toContain('Unique Sessions')
    expect(csvText).toContain('Mode Breakdown')
    expect(csvText).toContain('Comments Summary')
    expect(csvText).toContain('Daily Buckets (UTC)')
    expect(csvText).toContain('Recent Activity')
  })

  test('JSON API endpoint: returns lesson insights data', async ({ page }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Call lesson insights API endpoint
    const response = await page.request.get(
      '/api/studio/lessons/effective-meetings/insights?window=30'
    )

    // 4. Verify response
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('ok', true)
    expect(data).toHaveProperty('insights')

    // 5. Verify insights structure
    const insights = data.insights
    expect(insights).toHaveProperty('timeWindowStart')
    expect(insights).toHaveProperty('timeWindowEnd')
    expect(insights).toHaveProperty('lesson')
    expect(insights).toHaveProperty('totalRuns')
    expect(insights).toHaveProperty('avgScorePercent')
    expect(insights).toHaveProperty('modeBreakdown')
    expect(insights).toHaveProperty('uniqueSessions')
    expect(insights).toHaveProperty('totalComments')
    expect(insights).toHaveProperty('openComments')
    expect(insights).toHaveProperty('resolvedComments')
    expect(insights).toHaveProperty('dailyBuckets')
    expect(insights).toHaveProperty('recentActivity')

    // 6. Verify lesson structure
    expect(insights.lesson).toHaveProperty('id')
    expect(insights.lesson).toHaveProperty('slug')
    expect(insights.lesson).toHaveProperty('title')

    // 7. Verify modeBreakdown structure
    expect(insights.modeBreakdown).toHaveProperty('focusRuns')
    expect(insights.modeBreakdown).toHaveProperty('arcadeRuns')
  })

  test('JSON API endpoint: rejects invalid window parameter', async ({ page }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Call lesson insights API endpoint with invalid window
    const response = await page.request.get(
      '/api/studio/lessons/effective-meetings/insights?window=15'
    )

    // 4. Verify error response
    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('workspace switching: switch to Sample Team and verify drilldown reflects active workspace', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to lesson insights page in Demo workspace
    await page.goto('/studio/insights/lessons/effective-meetings')

    // 3. Verify page loads for Demo workspace
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 4. Switch to Sample Team workspace
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sample Team' }).click()

    // 5. Verify page shows 404 or different data for Sample Team
    await expect
      .poll(async () => (await page.locator('body').textContent()) || '')
      .toMatch(/not found|404|Unable to load/i)
  })

  test('as Demo Editor: can view lesson insights page', async ({
    page,
  }) => {
    // 1. Sign in as Demo Editor
    await signInAsDemo(page, 'Editor')

    // 2. Navigate to lesson insights page
    await page.goto('/studio/insights/lessons/effective-meetings')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 4. Verify metrics are shown
    await expect(page.getByText('Total Runs')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Avg Score' })).toBeVisible()
  })

  test('as Demo Viewer: can view lesson insights page', async ({
    page,
  }) => {
    // 1. Sign in as Demo Viewer
    await signInAsDemo(page, 'Viewer')

    // 2. Navigate to lesson insights page
    await page.goto('/studio/insights/lessons/effective-meetings')

    // 3. Verify page is visible
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 4. Verify metrics are shown
    await expect(page.getByText('Total Runs')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Avg Score' })).toBeVisible()
  })

  test('CSV API endpoint: returns CSV with correct headers', async ({ page }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Call CSV API endpoint
    const response = await page.request.get(
      '/api/studio/lessons/effective-meetings/insights.csv?window=30'
    )

    // 4. Verify response
    expect(response.ok()).toBe(true)

    // 5. Verify content type
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('text/csv')
    expect(contentType).toContain('charset=utf-8')

    // 6. Verify content disposition
    const contentDisposition = response.headers()['content-disposition']
    expect(contentDisposition).toContain('attachment')
    expect(contentDisposition).toMatch(/filename="lessonarcade-lesson-insights-[a-z0-9._-]+-[a-z0-9._-]+-30d\.csv"/)
  })

  test('empty state: lesson with no data shows friendly messages', async ({
    page,
  }) => {
    // 1. Sign in
    await signInAsDemo(page, 'Owner')

    // 2. Navigate to lesson insights page with a very small window (0 days = empty)
    await page.goto('/studio/insights/lessons/effective-meetings?window=0')

    // 3. Verify page loads
    await expect(
      page.locator('[data-testid="la-studio-lesson-insights-page"]')
    ).toBeVisible()

    // 4. Verify empty state messages are shown
    await expect(page.getByText('Total Runs')).toBeVisible()
    await expect(page.getByText('No daily activity data in this time window')).toBeVisible()
    await expect(page.getByText('No recent activity in this time window')).toBeVisible()
  })
})
