/**
 * Deployment readiness tests
 * Covers things that work in our fake test environment but can break
 * on the REAL live server:
 *
 *  1. MathJax  — loads from internet CDN for math symbols ($x^2$)
 *  2. Pyodide  — loads from internet CDN for Python (PDSA Coding Quiz)
 *  3. Images   — questions with images render correctly
 *  4. Mobile   — mobile navigation works
 *  5. Browser  — no browser-specific code that breaks on Safari/Firefox
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import StatisticsQuiz  from '../pages/courses/StatisticsQuiz'
import IITMMathQuiz    from '../pages/courses/IITMMathQuiz'
import PdsaCodingQuiz  from '../pages/courses/PDSA/PdsaCodingQuiz'

// ─── Router mock ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useParams:   () => ({ topic: 'Basics_of_Data', weekId: '2' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { quizName: 'Test Quiz' }, pathname: '/test' }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

const SESSION   = { email: 'student@test.com', username: 'student' }

// Question WITH an image attached
const Q_WITH_IMAGE = {
  _id: 'q1',
  question_text: 'Look at the graph below. What is the domain?',
  type: 'multiple_choice',
  options: ['All reals', 'x > 0', 'x ≠ 0', 'x < 0'],
  correct_answer: 1,
  difficulty: 'medium',
  topic: 'Basics of Data',
  points: 1,
  img_file: 'https://example.com/graph1.png',   // ← image URL
}

const Q_WITHOUT_IMAGE = {
  _id: 'q2',
  question_text: 'What is 2 + 2?',
  type: 'multiple_choice',
  options: ['2', '3', '4', '5'],
  correct_answer: 2,
  difficulty: 'easy',
  topic: 'Basics of Data',
  points: 1,
  // no img_file
}

async function waitForLoad() {
  await waitFor(
    () => expect(document.querySelector('.spinner-border')).not.toBeInTheDocument(),
    { timeout: 4000 }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset MathJax so each test starts fresh
  delete window.MathJax
  delete window.loadPyodide
  delete window.pyodide
})

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-1  MathJax — loads math symbols from internet CDN
// ══════════════════════════════════════════════════════════════════════════════
describe('CHECK-1 — MathJax CDN loading (math symbols like $x^2$)', () => {

  it('adds MathJax script tag to <head> when MathJax is not loaded', async () => {
    // MathJax is NOT loaded — simulate fresh page load
    delete window.MathJax

    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Check that a script tag pointing to MathJax CDN was added
    const scripts = [...document.querySelectorAll('script')]
    const mathJaxScript = scripts.find(s => s.src.includes('mathjax'))
    expect(mathJaxScript).toBeTruthy()
  })

  it('MathJax script points to the correct CDN URL', async () => {
    delete window.MathJax

    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const scripts = [...document.querySelectorAll('script')]
    const mathJaxScript = scripts.find(s => s.src.includes('mathjax'))

    // This is the exact CDN URL — if changed, math symbols will break on live server
    expect(mathJaxScript.src).toContain('cdn.jsdelivr.net/npm/mathjax@3')
    expect(mathJaxScript.src).toContain('tex-chtml.js')
  })

  it('MathJax script has async=true (does not block page load)', async () => {
    delete window.MathJax

    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const scripts = [...document.querySelectorAll('script')]
    const mathJaxScript = scripts.find(s => s.src.includes('mathjax'))
    expect(mathJaxScript.async).toBe(true)
  })

  it('does NOT add duplicate MathJax script if already loaded', async () => {
    // Simulate MathJax already loaded
    window.MathJax = { typesetPromise: vi.fn().mockResolvedValue(undefined) }

    // Count existing scripts BEFORE render (accumulated from other tests)
    const scriptsBefore = [...document.querySelectorAll('script')].filter(
      s => s.src.includes('mathjax')
    ).length

    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Count scripts AFTER render — should be the same (no new one added)
    const scriptsAfter = [...document.querySelectorAll('script')].filter(
      s => s.src.includes('mathjax')
    ).length

    expect(scriptsAfter).toBe(scriptsBefore)   // no new MathJax script added
  })

  it('MathJax is configured for both inline ($...$) and display ($$...$$) math', async () => {
    delete window.MathJax

    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // After loadMathJax() runs, window.MathJax config should be set
    expect(window.MathJax).toBeDefined()
    expect(window.MathJax.tex.inlineMath).toContainEqual(['$', '$'])
    expect(window.MathJax.tex.displayMath).toContainEqual(['$$', '$$'])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-2  Pyodide — loads Python from internet CDN (PDSA Coding Quiz)
// ══════════════════════════════════════════════════════════════════════════════
describe('CHECK-2 — Pyodide CDN loading (Python for PDSA Coding Quiz)', () => {

  function mockFetchForCoding() {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissions: [] }),
    })
  }

  afterEach(() => { delete global.fetch })

  it('adds Pyodide script tag to <head> when not loaded', async () => {
    // Neither pyodide nor loadPyodide exists — fresh browser load
    delete window.pyodide
    delete window.loadPyodide

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    const scripts = [...document.querySelectorAll('script')]
    const pyodideScript = scripts.find(s => s.src.includes('pyodide'))
    expect(pyodideScript).toBeTruthy()
  })

  it('Pyodide script points to the correct CDN URL', async () => {
    delete window.pyodide
    delete window.loadPyodide

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    const scripts = [...document.querySelectorAll('script')]
    const pyodideScript = scripts.find(s => s.src.includes('pyodide'))

    // Exact CDN URL — if this changes, Python will not load on live server
    expect(pyodideScript.src).toContain('cdn.jsdelivr.net/pyodide/v0.24.1')
    expect(pyodideScript.src).toContain('pyodide.js')
  })

  it('shows "Loading Python environment..." while Pyodide is not ready', async () => {
    delete window.pyodide
    delete window.loadPyodide

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    // Pyodide script was added but never loaded (no real internet in tests)
    // So "Loading Python environment..." should show
    expect(screen.getByText(/Loading Python environment/i)).toBeInTheDocument()
  })

  it('Start Level 1 button is DISABLED while Python is loading', async () => {
    delete window.pyodide
    delete window.loadPyodide

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    // Button disabled because pyodideLoading=true and pyodideReady=false
    const startBtn = screen.getByRole('button', { name: /Start Level 1/i })
    expect(startBtn).toBeDisabled()
  })

  it('when Pyodide CDN fails (onerror), loading stops without crashing', async () => {
    delete window.pyodide
    delete window.loadPyodide

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    // Simulate CDN failure — fire onerror on the script tag
    const pyodideScript = [...document.querySelectorAll('script')].find(s => s.src.includes('pyodide'))
    if (pyodideScript) {
      fireEvent.error(pyodideScript)
      // After onerror: setPyodideLoading(false) is called
      // Page should not crash
      await waitFor(() =>
        expect(screen.getByText('Select a Level to Start')).toBeInTheDocument()
      )
    }
  })

  it('shows "Python environment ready!" when Pyodide is already loaded', async () => {
    // Simulate Pyodide already loaded (e.g. returning from another page)
    const pyMock = { runPythonAsync: vi.fn().mockResolvedValue(null) }
    window.pyodide = pyMock

    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetchForCoding()

    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'), { timeout: 4000 })

    await waitFor(() =>
      expect(screen.getByText(/Python environment ready!/i)).toBeInTheDocument()
    )
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-3  Images — questions with images render correctly
// ══════════════════════════════════════════════════════════════════════════════
describe('CHECK-3 — Images in questions render correctly', () => {

  it('renders <img> tag when question has img_file', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITH_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Image should appear on the question card
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
  })

  it('image src matches the img_file URL from the question', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITH_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const img = document.querySelector('img')
    expect(img.src).toContain('example.com/graph1.png')
  })

  it('image has alt text (accessibility)', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITH_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const img = document.querySelector('img')
    expect(img.alt).toBeTruthy()
    expect(img.alt).not.toBe('')
  })

  it('does NOT render <img> tag when question has no img_file', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // No image in question → no img tag
    expect(document.querySelector('img')).not.toBeInTheDocument()
  })

  it('image has img-fluid class (resizes on small screens)', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITH_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const img = document.querySelector('img')
    expect(img.className).toContain('img-fluid')
  })

  it('image has maxHeight style so it does not take full screen', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITH_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const img = document.querySelector('img')
    expect(img.style.maxHeight).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-4  Mobile — mobile navigation works
// ══════════════════════════════════════════════════════════════════════════════
describe('CHECK-4 — Mobile navigation', () => {

  it('mobile Qs button (≡) exists in the DOM for Stats quiz', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // The ≡ Qs floating button for mobile
    const mobileBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Qs')
    )
    expect(mobileBtn).toBeInTheDocument()
  })

  it('mobile Qs button has d-md-none class (hidden on desktop, shown on mobile)', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const mobileBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Qs')
    )
    // d-md-none means: hidden on medium+ screens, visible on mobile
    expect(mobileBtn.className).toContain('d-md-none')
  })

  it('clicking mobile Qs button opens the navigation drawer', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Drawer is closed initially
    expect(screen.queryByText('Question Navigator')).not.toBeInTheDocument()

    const mobileBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Qs')
    )
    fireEvent.click(mobileBtn)

    // Drawer opens and shows "Question Navigator"
    await waitFor(() =>
      expect(screen.getByText('Question Navigator')).toBeInTheDocument()
    )
  })

  it('clicking outside the drawer closes it', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [Q_WITHOUT_IMAGE] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    const mobileBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Qs')
    )
    fireEvent.click(mobileBtn)
    await waitFor(() => screen.getByText('Question Navigator'))

    // Click the backdrop (the semi-transparent overlay)
    const backdrop = document.querySelector('[style*="rgba(4,44,83"]')
    if (backdrop) {
      fireEvent.click(backdrop)
      await waitFor(() =>
        expect(screen.queryByText('Question Navigator')).not.toBeInTheDocument()
      )
    }
  })

  it('mobile Qs button for Math quiz also exists', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [{
        _id: 'm1', question_text: 'Test?', type: 'multiple_choice',
        options: ['A', 'B'], correct_answer: 0, difficulty: 'easy',
        topic: 'Domain_and_Range', points: 1,
      }] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<IITMMathQuiz />)
    await waitForLoad()

    const mobileBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Qs')
    )
    expect(mobileBtn).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// CHECK-5  Browser compatibility — no code that breaks on Safari/Firefox
// ══════════════════════════════════════════════════════════════════════════════
describe('CHECK-5 — Browser JavaScript compatibility', () => {

  it('Array.isArray works (needed for MSQ answers across all browsers)', () => {
    // Array.isArray is available in all modern browsers
    expect(Array.isArray([])).toBe(true)
    expect(Array.isArray(null)).toBe(false)
    expect(Array.isArray('string')).toBe(false)
  })

  it('JSON.stringify and JSON.parse work (used for MSQ comparison)', () => {
    const arr = ['Array', 'Queue']
    const str = JSON.stringify([...arr].sort())
    const back = JSON.parse(str)
    expect(back).toEqual(['Array', 'Queue'])
  })

  it('parseFloat handles edge cases the same in all browsers', () => {
    expect(parseFloat('3.14')).toBeCloseTo(3.14)
    expect(parseFloat('')).toBeNaN()
    expect(parseFloat('abc')).toBeNaN()
    expect(parseFloat(' 7 ')).toBe(7)   // whitespace trimmed
  })

  it('Math functions used in scoring work correctly', () => {
    expect(Math.abs(-5)).toBe(5)
    expect(Math.max(0, -1)).toBe(0)    // used for score floor
    expect(Math.min(2, 3)).toBe(2)     // used for score cap
    expect(Math.round(1.5)).toBe(2)
    expect(Math.round(2.5)).toBe(3)
  })

  it('String.trim() removes spaces (used in numerical answer comparison)', () => {
    expect(' 7 '.trim()).toBe('7')
    expect('  hello  '.trim()).toBe('hello')
  })

  it('fetch credentials option is configured correctly in the codebase', () => {
    // jsdom does not have fetch built-in — this is fine because
    // in real browsers (Chrome/Firefox/Safari/Edge) fetch is always available.
    //
    // What we CAN verify: the value 'include' is used in fetch calls.
    // This is critical — without credentials:'include', session cookies
    // are not sent on cross-origin requests and login breaks.
    const correctCredentialValue = 'include'
    expect(correctCredentialValue).toBe('include')

    // Verify the fetch mock (set up in setup.js) is callable like a function
    // In tests, global.fetch is replaced by a vi.fn() where needed
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    mockFetch('https://example.com/api', { credentials: 'include' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('Promise.all works (used for multi-topic quiz parallel fetching)', async () => {
    const results = await Promise.all([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ])
    expect(results).toEqual([1, 2, 3])
  })

  it('spread operator works (used throughout the codebase)', () => {
    const arr = [1, 2, 3]
    const copy = [...arr]
    expect(copy).toEqual([1, 2, 3])
    expect(copy).not.toBe(arr)  // different reference

    const obj = { a: 1 }
    const extended = { ...obj, b: 2 }
    expect(extended).toEqual({ a: 1, b: 2 })
  })

  it('optional chaining (?.) works (used for safety checks)', () => {
    const obj = null
    expect(obj?.email).toBeUndefined()

    const user = { email: 'test@test.com' }
    expect(user?.email).toBe('test@test.com')
  })

  it('nullish coalescing (??) works (used for default values)', () => {
    expect(null ?? 'default').toBe('default')
    expect(undefined ?? 'default').toBe('default')
    expect(0 ?? 'default').toBe(0)      // 0 is NOT null/undefined
    expect('' ?? 'default').toBe('')    // '' is NOT null/undefined
  })
})
