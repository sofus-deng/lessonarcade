import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'
import { createHash } from 'crypto'

// Global test setup
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

const navigatorStub = {
  ...(globalThis.navigator ?? {}),
  sendBeacon: vi.fn(() => true),
}
vi.stubGlobal('navigator', navigatorStub)

// Create a proper Response instance for the fetch stub
const okJson = new Response(JSON.stringify({ ok: true }), {
  status: 200,
  headers: { 'content-type': 'application/json' }
})

vi.stubGlobal(
  'fetch',
  vi.fn(async () => okJson.clone()) as unknown as typeof fetch
)

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

const cryptoDigest = vi.fn(async (_algorithm: AlgorithmIdentifier, data: ArrayBuffer | ArrayBufferView) => {
  const buffer = data instanceof ArrayBuffer
    ? Buffer.from(data)
    : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  const hash = createHash('sha256').update(buffer).digest()
  return Uint8Array.from(hash).buffer
})

const cryptoStub = {
  ...(globalThis.crypto ?? {}),
  randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000000'),
  subtle: {
    ...((globalThis.crypto && globalThis.crypto.subtle) ?? {}),
    digest: cryptoDigest,
  },
}
vi.stubGlobal('crypto', cryptoStub)

beforeEach(() => {
  sessionStorageStub.clear()
})
