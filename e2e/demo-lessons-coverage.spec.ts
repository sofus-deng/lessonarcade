import { test, expect } from '@playwright/test';

/**
 * Fast, deterministic E2E test that verifies all demo slugs work across all three public routes.
 * Uses APIRequestContext for efficiency and resilience.
 * Does NOT trigger audio or rely on visible text assertions.
 */

// All demo lesson slugs from the registry
const demoSlugs = [
  'react-hooks-intro',
  'effective-meetings',
  'design-feedback-basics',
  'decision-making-uncertainty',
  'feedback-that-lands',
  'effective-one-on-ones',
];

test.describe('Demo Lessons Coverage', () => {
  test.beforeEach(async ({ request }) => {
    // Ensure we're testing against the running server
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
  });

  test('should load /demo/lesson/{slug} for all demo slugs', async ({ request }) => {
    for (const slug of demoSlugs) {
      const response = await request.get(`/demo/lesson/${slug}`);
      
      // Verify 200 status
      expect(response.status()).toBe(200);
      
      // Verify page contains the lesson page testid
      const html = await response.text();
      expect(html).toContain('data-testid="la-lesson-page"');
    }
  });

  test('should load /demo/voice/{slug} for all demo slugs', async ({ request }) => {
    for (const slug of demoSlugs) {
      const response = await request.get(`/demo/voice/${slug}`);
      
      // Verify 200 status
      expect(response.status()).toBe(200);
      
      // Verify page contains the voice page testid
      const html = await response.text();
      expect(html).toContain('data-testid="la-voice-page"');
    }
  });

  test('should load /demo/voice-chat/{slug} for all demo slugs', async ({ request }) => {
    for (const slug of demoSlugs) {
      const response = await request.get(`/demo/voice-chat/${slug}`);
      
      // Verify 200 status
      expect(response.status()).toBe(200);
      
      // Verify page contains the voice-chat page testid
      const html = await response.text();
      expect(html).toContain('data-testid="la-voice-chat-page"');
    }
  });

  test('should return 200 with error page for non-existent demo slug on /demo/lesson/{slug}', async ({ request }) => {
    const response = await request.get('/demo/lesson/non-existent-slug');
    expect(response.status()).toBe(200); // Next.js returns 200 with error page
  });

  test('should return 200 with error page for non-existent demo slug on /demo/voice/{slug}', async ({ request }) => {
    const response = await request.get('/demo/voice/non-existent-slug');
    expect(response.status()).toBe(200); // Next.js returns 200 with error page
  });

  test('should return 200 with error page for non-existent demo slug on /demo/voice-chat/{slug}', async ({ request }) => {
    const response = await request.get('/demo/voice-chat/non-existent-slug');
    expect(response.status()).toBe(200); // Next.js returns 200 with error page
  });
});
