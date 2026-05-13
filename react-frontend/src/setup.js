import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Suppress MathJax noise in tests
window.MathJax = {
  typesetPromise: vi.fn().mockResolvedValue(undefined),
}

// Suppress console.error for expected React warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: navigation'))
    ) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })

// jsdom doesn't implement window.alert — silence it
window.alert = vi.fn()
window.confirm = vi.fn(() => true)

// Silence console.error from axios mock rejections
vi.mock('axios')
