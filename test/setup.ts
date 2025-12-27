import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'

// Import Next.js mocks
import './next-mocks'

// Set DATABASE_URL for tests
process.env.DATABASE_URL = 'file:./dev.db'

// Global test setup

// TextEncoder/TextDecoder polyfills (from node:util)
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder: NodeTextEncoder } = await import('node:util')
  global.TextEncoder = NodeTextEncoder as unknown as typeof TextEncoder
}
if (typeof TextDecoder === 'undefined') {
  const { TextDecoder: NodeTextDecoder } = await import('node:util')
  global.TextDecoder = NodeTextDecoder as unknown as typeof TextDecoder
}

// matchMedia stub (already present, keeping it)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// ResizeObserver stub
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
if (typeof window !== 'undefined') {
  ;(global as typeof Window & typeof globalThis).ResizeObserver = ResizeObserverStub
}

// IntersectionObserver stub
class IntersectionObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
if (typeof window !== 'undefined') {
  ;(global as typeof Window & typeof globalThis).IntersectionObserver = IntersectionObserverStub
}

// scrollTo stub
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn()
  Element.prototype.scrollTo = vi.fn()
}

// navigator stub
const navigatorStub = {
  ...(globalThis.navigator ?? {}),
  sendBeacon: vi.fn(() => true),
}
if (!navigatorStub.userAgent) {
  navigatorStub.userAgent = 'jsdom'
}
vi.stubGlobal('navigator', navigatorStub)

// Create a proper Response instance for the fetch stub
const okJson = new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { 'content-type': 'application/json' },
})

vi.stubGlobal(
  'fetch',
  vi.fn(async () => okJson.clone()) as unknown as typeof fetch,
)

// sessionStorage stub
let sessionStore: Record<string, string> = {}
const sessionStorageStub = {
  getItem: (key: string) => (key in sessionStore ? sessionStore[key] : null),
  setItem: (key: string, value: string) => {
    sessionStore[key] = String(value)
  },
  removeItem: (key: string) => {
    delete sessionStore[key]
  },
  clear: () => {
    sessionStore = {}
  },
}
vi.stubGlobal('sessionStorage', sessionStorageStub)

// crypto.getRandomValues polyfill
const cryptoDigest = vi.fn(
  async (_algorithm: AlgorithmIdentifier, data: ArrayBuffer | ArrayBufferView) => {
    const buffer =
      data instanceof ArrayBuffer
        ? Buffer.from(data)
        : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    const hash = createHash('sha256').update(buffer).digest()
    return Uint8Array.from(hash).buffer
  },
)

const cryptoStub = {
  ...(globalThis.crypto ?? {}),
  randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000000'),
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
    return array
  }),
  subtle: {
    ...((globalThis.crypto && globalThis.crypto.subtle) ?? {}),
    digest: cryptoDigest,
  },
}
vi.stubGlobal('crypto', cryptoStub)

beforeEach(() => {
  sessionStorageStub.clear()
})
