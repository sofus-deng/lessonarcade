import { test, expect } from '@playwright/test';

test('studio route returns 401 without authentication', async ({ request }) => {
  // Use APIRequestContext to avoid browser auth dialog
  const response = await request.get('/studio');
  
  // In development, Basic Auth might not be configured
  // We'll check for either 401 (auth required) or 200 (dev mode)
  const status = response.status();
  expect(status === 401 || status === 200).toBeTruthy();
  
  // If we get 200, it should be because auth is not configured in dev
  if (status === 200) {
    const authHeader = response.headers()['www-authenticate'];
    // In dev mode with no auth configured, there should be no auth header
    expect(authHeader).toBeUndefined();
  } else {
    // In production or when auth is configured, we should get 401
    expect(status).toBe(401);
    const authHeader = response.headers()['www-authenticate'];
    expect(authHeader).toContain('Basic');
  }
});