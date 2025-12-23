/**
 * Next.js App Router mocks for Vitest
 *
 * This module provides mocks for Next.js App Router hooks and utilities
 * that are commonly used in components but not available in jsdom.
 */

import { vi } from 'vitest'

// Mock next/navigation hooks
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}))

export const useSearchParams = vi.fn(() => ({
  get: vi.fn(() => ''),
  getAll: vi.fn(() => ({})),
  has: vi.fn(() => false),
  entries: vi.fn(() => []),
  forEach: vi.fn(() => {}),
  keys: vi.fn(() => []),
  values: vi.fn(() => []),
  toString: vi.fn(() => ''),
}))

export const usePathname = vi.fn(() => '/')

// Mock next/headers functions
export const headers = vi.fn(() => ({
  get: vi.fn(() => ''),
  has: vi.fn(() => false),
  entries: vi.fn(() => []),
  forEach: vi.fn(() => {}),
  keys: vi.fn(() => []),
  values: vi.fn(() => []),
}))

export const cookies = vi.fn(() => ({
  get: vi.fn(() => undefined),
  getAll: vi.fn(() => []),
  has: vi.fn(() => false),
  set: vi.fn(() => {}),
  delete: vi.fn(() => {}),
}))

// Setup vi.mock for next/navigation
vi.mock('next/navigation', () => ({
  useRouter,
  useSearchParams,
  usePathname,
}))

// Setup vi.mock for next/headers
vi.mock('next/headers', () => ({
  headers,
  cookies,
}))
