import { test, expect } from '@playwright/test';

// Base64 encoded "e2e:e2e"
const AUTH_HEADER = 'Basic ' + Buffer.from('e2e:e2e').toString('base64');

test('studio route returns 401 without authentication', async ({ request }) => {
  const response = await request.get('/studio');
  
  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toContain('Basic');
});

test('studio route returns 200 with valid authentication', async ({ request }) => {
  const response = await request.get('/studio', {
    headers: { 'Authorization': AUTH_HEADER }
  });
  
  expect(response.status()).toBe(200);
});

test('api/studio/health returns 401 without authentication', async ({ request }) => {
  const response = await request.get('/api/studio/health');
  
  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toContain('Basic');
});

test('api/studio/health returns 200 with valid authentication', async ({ request }) => {
  const response = await request.get('/api/studio/health', {
    headers: { 'Authorization': AUTH_HEADER }
  });
  
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('build');
  expect(body).toHaveProperty('storage');
  expect(body).toHaveProperty('rateLimiter');
  expect(body).toHaveProperty('gemini');
});
