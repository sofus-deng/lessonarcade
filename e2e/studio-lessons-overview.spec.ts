import { test, expect } from '@playwright/test'
import { applyBasicAuth, signInAsDemo } from './utils/auth'

test.describe('Studio Lessons Overview', () => {
  test.beforeEach(async ({ context, page }) => {
    await applyBasicAuth(context)

    // Sign in as demo owner for session authentication
    await signInAsDemo(page, 'Owner')
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
