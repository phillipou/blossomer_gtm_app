import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock IntersectionObserver
(globalThis as any).IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = [0]
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
} as any

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  length: 0,
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
}
(globalThis as any).localStorage = localStorageMock as any