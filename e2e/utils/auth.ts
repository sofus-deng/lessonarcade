import { expect, type BrowserContext, type Page } from '@playwright/test'

const BASIC_AUTH_HEADER =
  'Basic ' + Buffer.from('e2e:e2e').toString('base64')

export async function applyBasicAuth(context: BrowserContext) {
  await context.setExtraHTTPHeaders({ Authorization: BASIC_AUTH_HEADER })
}

export async function signInAsDemo(
  page: Page,
  role: 'Owner' | 'Editor' | 'Viewer'
) {
  await page.goto('/auth/demo-signin')
  await page
    .getByRole('button', { name: `Sign in as Demo ${role}` })
    .click()
  await expect(
    page.locator('[data-testid="la-studio-dashboard-page"]')
  ).toBeVisible()
}
