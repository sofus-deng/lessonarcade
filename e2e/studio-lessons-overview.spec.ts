import { test, expect } from '@playwright/test'

const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64')

test.describe('Studio Lessons Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ Authorization: AUTH_HEADER })
  })

  test('shows seeded demo lessons in the overview', async ({ page }) => {
    await page.goto('/studio/lessons')

    await expect(
      page.locator('[data-testid="la-lessons-overview-page"]')
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1 })
    ).toContainText('LessonArcade Demo Workspace')
    await expect(
      page.getByRole('cell', { name: 'effective-meetings' })
    ).toBeVisible()
    await expect(
      page.getByRole('cell', { name: 'react-hooks-intro' })
    ).toBeVisible()
  })
})
