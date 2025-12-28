/**
 * Insights Export and API E2E Tests
 *
 * LA3-P2-04: Tests for CSV export and read-only reporting APIs.
 */

import { test, expect } from '@playwright/test'

// Base64 encoded "e2e:e2e" for outer Basic Auth guard
const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Insights Export and API', () => {
  test.beforeEach(async ({ page }) => {
    // Add Basic Auth header for all requests
    await page.setExtraHTTPHeaders({ Authorization: BASIC_AUTH_HEADER })
  })

  test('as Demo Owner: click Export CSV and verify download', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Click Export CSV button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download = await downloadPromise

    // 4. Verify download occurred
    expect(download).toBeDefined()

    // 5. Verify filename format
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^lessonarcade-insights-demo-(7|30)d\.csv$/)

    // 6. Verify CSV content contains expected headers
    const csvContent = await download.createReadStream()
    const csvText = await csvContent.toString()
    expect(csvText).toContain('Summary')
    expect(csvText).toContain('Total Runs')
    expect(csvText).toContain('Average Score %')
    expect(csvText).toContain('Unique Sessions')
    expect(csvText).toContain('Total Comments')
  })

  test('CSV export with 7-day window has correct filename', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page with 7-day window
    await page.goto('/studio/insights?window=7')

    // 3. Click Export CSV button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download = await downloadPromise

    // 4. Verify filename includes 7d
    const filename = download.suggestedFilename()
    expect(filename).toContain('7d.csv')
  })

  test('CSV export with 30-day window has correct filename', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page with 30-day window
    await page.goto('/studio/insights?window=30')

    // 3. Click Export CSV button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download = await downloadPromise

    // 4. Verify filename includes 30d
    const filename = download.suggestedFilename()
    expect(filename).toContain('30d.csv')
  })

  test('CSV export button is accessible via keyboard', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Focus on Export CSV button using Tab key
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // 4. Verify button is focused
    const exportButton = page.getByTestId('la-insights-export-csv')
    await expect(exportButton).toBeFocused()

    // 5. Press Enter to trigger download
    const downloadPromise = page.waitForEvent('download')
    await page.keyboard.press('Enter')
    const download = await downloadPromise

    // 6. Verify download occurred
    expect(download).toBeDefined()
  })

  test('JSON API endpoint returns insights data', async ({ page, request }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Wait for session to be established
    await page.waitForURL(/\/studio/)

    // 3. Call insights API endpoint
    const response = await request.get('/api/studio/insights?window=30')

    // 4. Verify response
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('ok', true)
    expect(data).toHaveProperty('insights')

    // 5. Verify insights structure
    const insights = data.insights
    expect(insights).toHaveProperty('timeWindowStart')
    expect(insights).toHaveProperty('timeWindowEnd')
    expect(insights).toHaveProperty('totalRunsInWindow')
    expect(insights).toHaveProperty('avgScorePercentInWindow')
    expect(insights).toHaveProperty('totalUniqueLearnerSessions')
    expect(insights).toHaveProperty('totalCommentsInWindow')
    expect(insights).toHaveProperty('topStrugglingLessons')
    expect(insights).toHaveProperty('topEngagedLessons')
    expect(insights).toHaveProperty('recentActivity')
  })

  test('JSON API endpoint with 7-day window', async ({ page, request }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Wait for session to be established
    await page.waitForURL(/\/studio/)

    // 3. Call insights API endpoint with 7-day window
    const response = await request.get('/api/studio/insights?window=7')

    // 4. Verify response
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.insights).toBeDefined()
  })

  test('JSON API endpoint rejects invalid window parameter', async ({ page, request }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Wait for session to be established
    await page.waitForURL(/\/studio/)

    // 3. Call insights API endpoint with invalid window
    const response = await request.get('/api/studio/insights?window=15')

    // 4. Verify error response
    expect(response.status()).toBe(400)

    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('CSV API endpoint returns CSV content', async ({ page, request }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Wait for session to be established
    await page.waitForURL(/\/studio/)

    // 3. Call CSV API endpoint
    const response = await request.get('/api/studio/insights.csv?window=30')

    // 4. Verify response
    expect(response.ok()).toBe(true)

    // 5. Verify content type
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('text/csv')

    // 6. Verify content disposition
    const contentDisposition = response.headers()['content-disposition']
    expect(contentDisposition).toContain('attachment')
    expect(contentDisposition).toMatch(/filename="lessonarcade-insights-demo-30d\.csv"/)

    // 7. Verify CSV content
    const csvContent = await response.text()
    expect(csvContent).toContain('Summary')
    expect(csvContent).toContain('Total Runs')
  })

  test('Lessons overview API endpoint returns lessons data', async ({ page, request }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Wait for session to be established
    await page.waitForURL(/\/studio/)

    // 3. Call lessons overview API endpoint
    const response = await request.get('/api/studio/lessons-overview')

    // 4. Verify response
    expect(response.ok()).toBe(true)

    const data = await response.json()
    expect(data).toHaveProperty('ok', true)
    expect(data).toHaveProperty('lessons')

    // 5. Verify lessons structure
    const overview = data.lessons
    expect(overview).toHaveProperty('workspace')
    expect(overview).toHaveProperty('lessons')
    expect(overview).toHaveProperty('totals')

    // 6. Verify workspace info
    expect(overview.workspace).toHaveProperty('id')
    expect(overview.workspace).toHaveProperty('slug')
    expect(overview.workspace).toHaveProperty('name')

    // 7. Verify totals
    expect(overview.totals).toHaveProperty('totalLessons')
    expect(overview.totals).toHaveProperty('totalRuns')
    expect(overview.totals).toHaveProperty('averageScorePercent')

    // 8. Verify lessons array
    expect(Array.isArray(overview.lessons)).toBe(true)
  })

  test('as Demo Editor: can export CSV', async ({ page }) => {
    // 1. Sign in as Demo Editor
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Editor' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Verify Export CSV button is visible
    await expect(page.getByTestId('la-insights-export-csv')).toBeVisible()

    // 4. Click Export CSV button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download = await downloadPromise

    // 5. Verify download occurred
    expect(download).toBeDefined()
  })

  test('as Demo Viewer: can export CSV', async ({ page }) => {
    // 1. Sign in as Demo Viewer
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Viewer' }).click()

    // 2. Navigate to insights page
    await page.goto('/studio/insights')

    // 3. Verify Export CSV button is visible
    await expect(page.getByTestId('la-insights-export-csv')).toBeVisible()

    // 4. Click Export CSV button
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download = await downloadPromise

    // 5. Verify download occurred
    expect(download).toBeDefined()
  })

  test('API endpoints require authentication', async ({ request }) => {
    // 1. Call insights API without authentication
    const insightsResponse = await request.get('/api/studio/insights')

    // 2. Verify redirect to sign-in (Next.js redirects on auth failure)
    expect(insightsResponse.status()).toBe(401)

    // 3. Call CSV API without authentication
    const csvResponse = await request.get('/api/studio/insights.csv')

    // 4. Verify redirect to sign-in
    expect(csvResponse.status()).toBe(401)

    // 5. Call lessons overview API without authentication
    const lessonsResponse = await request.get('/api/studio/lessons-overview')

    // 6. Verify redirect to sign-in
    expect(lessonsResponse.status()).toBe(401)
  })

  test('workspace switching: CSV filename reflects active workspace', async ({ page }) => {
    // 1. Sign in
    await page.goto('/auth/demo-signin')
    await page.getByRole('button', { name: 'Sign in as Demo Owner' }).click()

    // 2. Navigate to insights page with default workspace
    await page.goto('/studio/insights')

    // 3. Click Export CSV and verify filename
    const downloadPromise1 = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download1 = await downloadPromise1
    const filename1 = download1.suggestedFilename()
    expect(filename1).toContain('demo')

    // 4. Switch to Sample Team workspace
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Sample Team' }).click()

    // 5. Wait for page to reload
    await page.waitForURL(/\/studio\/insights/)

    // 6. Click Export CSV and verify filename
    const downloadPromise2 = page.waitForEvent('download')
    await page.getByTestId('la-insights-export-csv').click()
    const download2 = await downloadPromise2
    const filename2 = download2.suggestedFilename()
    expect(filename2).toContain('sample-team')
  })
})
