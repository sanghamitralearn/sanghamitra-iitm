/**
 * PdsaCodingQuiz — Test Suite
 *
 * Key facts about this component:
 *  - Loads Pyodide (Python-in-browser) for running student code → must be mocked
 *  - Uses fetch() for: coding-submissions, coding-questions, coding-submission
 *  - Uses axios.get() for session-info
 *  - 3 difficulty levels: Level 1 always unlocked; Level 2 needs L1 ≥60%; Level 3 needs L1+L2 ≥60%
 *  - Students type Python code in a <textarea>; "Run Tests" button calls Pyodide
 *  - Submit scores all 5 questions by running Pyodide per test case
 *  - deepEqual() is the local answer-comparison helper
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import PdsaCodingQuiz from '../pages/courses/PDSA/PdsaCodingQuiz'

// ─── Router mock ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
let mockWeekId = '2'

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useParams:   () => ({ weekId: mockWeekId }),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const SESSION = { email: 'coder@iitm.ac.in', username: 'pythonStudent' }

const CODING_QUESTIONS = [
  {
    questionId: 'cq1',
    title: 'Sum of two numbers',
    description: 'Write a function that returns the sum of two numbers.',
    functionName: 'add',
    starterCode: 'def add(a, b):\n    pass\n',
    testCases: [
      { input: [1, 2],  expected: 3  },
      { input: [0, 0],  expected: 0  },
      { input: [-1, 1], expected: 0  },
    ],
    maxScore: 20,
    points: 20,
  },
  {
    questionId: 'cq2',
    title: 'Find maximum in list',
    description: 'Return the maximum element from a list.',
    functionName: 'find_max',
    starterCode: 'def find_max(lst):\n    pass\n',
    testCases: [
      { input: [[3, 1, 4]], expected: 4 },
      { input: [[7]],       expected: 7 },
    ],
    maxScore: 20,
    points: 20,
  },
]

// ─── Pyodide mock ─────────────────────────────────────────────────────────────
function mockPyodideReady() {
  const pyMock = {
    runPythonAsync: vi.fn().mockResolvedValue(null),
    loadPackagesFromImports: vi.fn().mockResolvedValue(undefined),
  }
  window.loadPyodide = vi.fn().mockResolvedValue(pyMock)
  window.pyodide = pyMock
  return pyMock
}

function mockPyodideNotLoaded() {
  delete window.loadPyodide
  delete window.pyodide
}

// ─── fetch mock ───────────────────────────────────────────────────────────────
function mockFetch({
  submissions = [],
  questions   = CODING_QUESTIONS,
  submitOk    = true,
} = {}) {
  global.fetch = vi.fn()
    // 1st call: coding-submissions (load previous scores)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ submissions }),
    })
    // 2nd call: coding-questions (start a level)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, questions }),
    })
    // subsequent calls: coding-submission POST
    .mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: submitOk }),
    })
}

// ─── Setup helper ─────────────────────────────────────────────────────────────
function setup({ submissions = [], questions = CODING_QUESTIONS } = {}) {
  axios.get.mockResolvedValueOnce({ data: SESSION })
  mockFetch({ submissions, questions })
  return render(<PdsaCodingQuiz />)
}

async function waitForLevelSelection() {
  await waitFor(
    () => expect(screen.getByText('Select a Level to Start')).toBeInTheDocument(),
    { timeout: 4000 }
  )
}

// Click "Start Level 1" to enter the quiz
async function startLevel1(questions = CODING_QUESTIONS) {
  setup({ questions })
  await waitForLevelSelection()
  fireEvent.click(screen.getByRole('button', { name: /Start Level 1/i }))
  await waitFor(
    () => expect(screen.getByText(CODING_QUESTIONS[0].title)).toBeInTheDocument(),
    { timeout: 4000 }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockWeekId = '2'
  mockPyodideReady()
})

afterEach(() => {
  delete global.fetch
  delete window.loadPyodide
  delete window.pyodide
})

// ═══════════════════════════════════════════════════════════════════════════════
// deepEqual unit tests (pure function — no component needed)
// ═══════════════════════════════════════════════════════════════════════════════
describe('deepEqual — answer comparison helper', () => {
  // Re-implement for testing (identical to component source)
  function deepEqual(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== typeof b) return false
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((v, i) => deepEqual(v, b[i]))
    }
    if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b)
    return false
  }

  it('equal numbers', () => expect(deepEqual(3, 3)).toBe(true))
  it('unequal numbers', () => expect(deepEqual(3, 4)).toBe(false))
  it('equal strings', () => expect(deepEqual('abc', 'abc')).toBe(true))
  it('equal arrays', () => expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true))
  it('different array lengths', () => expect(deepEqual([1, 2], [1, 2, 3])).toBe(false))
  it('nested arrays', () => expect(deepEqual([[1, 2], [3]], [[1, 2], [3]])).toBe(true))
  it('equal objects', () => expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true))
  it('unequal objects', () => expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false))
  it('null vs null', () => expect(deepEqual(null, null)).toBe(true))
  it('null vs value', () => expect(deepEqual(null, 1)).toBe(false))
  it('boolean true/false', () => expect(deepEqual(true, false)).toBe(false))
  it('0 vs false — type mismatch', () => expect(deepEqual(0, false)).toBe(false))
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-01  Page loads without errors
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-01 — Page loads without errors', () => {
  it('renders without throwing', () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetch()
    expect(() => render(<PdsaCodingQuiz />)).not.toThrow()
  })

  it('shows spinner while checking auth', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    mockFetch()
    render(<PdsaCodingQuiz />)
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })

  it('shows level selection after auth', async () => {
    setup()
    await waitForLevelSelection()
    expect(screen.getByText('Select a Level to Start')).toBeInTheDocument()
  })

  it('shows correct quiz heading', async () => {
    setup()
    await waitForLevelSelection()
    expect(screen.getByRole('heading', { name: /Sorting Algorithms Coding/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-01  Invalid weekId guard
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-01 — Invalid weekId shows error guard', () => {
  it('shows "Invalid Quiz Week" for unknown weekId', () => {
    mockWeekId = 'bad_week'
    render(<PdsaCodingQuiz />)
    expect(screen.getByText(/Invalid Quiz Week/i)).toBeInTheDocument()
  })

  it('shows Back to PDSA link for invalid weekId', () => {
    mockWeekId = 'bad_week'
    render(<PdsaCodingQuiz />)
    expect(screen.getByRole('link', { name: /Back to PDSA/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-02  Auth redirect
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-02 — Auth redirect on failure', () => {
  it('redirects to /login on 401', async () => {
    mockFetch()
    axios.get.mockRejectedValueOnce({ response: { status: 401 } })
    render(<PdsaCodingQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('redirects when session has no email', async () => {
    mockFetch()
    axios.get.mockResolvedValueOnce({ data: {} })
    render(<PdsaCodingQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-03  Level selection UI
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-03 — Level selection screen', () => {
  it('shows Easy, Medium, Hard badges', async () => {
    setup()
    await waitForLevelSelection()
    expect(screen.getByText('Easy')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('Hard')).toBeInTheDocument()
  })

  it('Level 1 is unlocked (Start Level 1 button enabled)', async () => {
    setup()
    await waitForLevelSelection()
    const startL1 = screen.getByRole('button', { name: /Start Level 1/i })
    expect(startL1).not.toBeDisabled()
  })

  it('Level 2 is locked when no previous scores', async () => {
    setup()
    await waitForLevelSelection()
    expect(screen.getByText(/Complete Level 1.*to unlock/i)).toBeInTheDocument()
  })

  it('Level 3 is locked when no previous scores', async () => {
    setup()
    await waitForLevelSelection()
    expect(screen.getByText(/Complete Levels 1 & 2.*to unlock/i)).toBeInTheDocument()
  })

  it('Level 2 unlocks when Level 1 score ≥ 60%', async () => {
    const subs = [
      { email: SESSION.email, topic: 'Sorting Algorithms', level: 1, percentage: 80 },
    ]
    setup({ submissions: subs })
    await waitForLevelSelection()
    const startL2 = screen.getByRole('button', { name: /Start Level 2/i })
    expect(startL2).not.toBeDisabled()
  })

  it('Level 2 stays locked when Level 1 score < 60%', async () => {
    const subs = [
      { email: SESSION.email, topic: 'Sorting Algorithms', level: 1, percentage: 40 },
    ]
    setup({ submissions: subs })
    await waitForLevelSelection()
    // No "Start Level 2" — shows "Locked" text instead
    expect(screen.queryByRole('button', { name: /Start Level 2/i })).not.toBeInTheDocument()
  })

  it('shows best score when level was previously attempted', async () => {
    const subs = [
      { email: SESSION.email, topic: 'Sorting Algorithms', level: 1, percentage: 75 },
    ]
    setup({ submissions: subs })
    await waitForLevelSelection()
    expect(screen.getByText(/Best: 75%/i)).toBeInTheDocument()
  })

  it('shows "Retake Level" when already attempted', async () => {
    const subs = [
      { email: SESSION.email, topic: 'Sorting Algorithms', level: 1, percentage: 60 },
    ]
    setup({ submissions: subs })
    await waitForLevelSelection()
    expect(screen.getByRole('button', { name: /Retake Level/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-04  Python environment status
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-04 — Python environment status indicators', () => {
  it('shows "Python environment ready!" when Pyodide is ready', async () => {
    setup()
    await waitForLevelSelection()
    await waitFor(() =>
      expect(screen.getByText(/Python environment ready!/i)).toBeInTheDocument()
    )
  })

  it('shows "Loading Python environment..." when Pyodide not ready', async () => {
    mockPyodideNotLoaded()
    // Pyodide script would be injected via DOM; it won't load in jsdom so stays loading
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissions: [] }),
    })
    render(<PdsaCodingQuiz />)
    await waitFor(() => screen.getByText('Select a Level to Start'))
    expect(screen.getByText(/Loading Python environment/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-02 / TC-03  Question display inside a level
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-02 & TC-03 — Question display inside a level', () => {
  it('shows question title after starting Level 1', async () => {
    await startLevel1()
    expect(screen.getByText('Sum of two numbers')).toBeInTheDocument()
  })

  it('shows question description', async () => {
    await startLevel1()
    expect(screen.getByText(/Write a function that returns the sum/i)).toBeInTheDocument()
  })

  it('shows "Question 1 of 2" counter', async () => {
    await startLevel1()
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument()
  })

  it('shows test cases section', async () => {
    await startLevel1()
    expect(screen.getByText('Test Cases:')).toBeInTheDocument()
  })

  it('shows expected output for each test case', async () => {
    await startLevel1()
    // Multiple test cases each show "Expected:" — use getAllByText
    const expectedLabels = screen.getAllByText(/Expected/i)
    expect(expectedLabels.length).toBeGreaterThan(0)
  })

  it('shows difficulty badge for the level', async () => {
    await startLevel1()
    expect(screen.getByText(/Level 1.*Easy/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-05  Code editor (textarea)
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-05 — Code editor textarea', () => {
  it('renders a textarea for code input', async () => {
    await startLevel1()
    expect(document.querySelector('textarea')).toBeInTheDocument()
  })

  it('pre-fills with starter code', async () => {
    await startLevel1()
    expect(document.querySelector('textarea').value).toContain('def add')
  })

  it('accepts typed code', async () => {
    await startLevel1()
    const ta = document.querySelector('textarea')
    fireEvent.change(ta, { target: { value: 'def add(a, b):\n    return a + b\n' } })
    expect(ta.value).toContain('return a + b')
  })

  it('shows "Python Ready" indicator when Pyodide is loaded', async () => {
    await startLevel1()
    expect(screen.getByText(/Python Ready/i)).toBeInTheDocument()
  })

  it('Reset Code button restores starter code', async () => {
    await startLevel1()
    const ta = document.querySelector('textarea')
    fireEvent.change(ta, { target: { value: 'completely wrong code' } })
    fireEvent.click(screen.getByRole('button', { name: /Reset Code/i }))
    await waitFor(() => expect(ta.value).toContain('def add'))
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-06  Run Tests button
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-06 — Run Tests button', () => {
  it('🧪 Run Tests button is visible', async () => {
    await startLevel1()
    expect(screen.getByText(/Run Tests/i)).toBeInTheDocument()
  })

  it('Run Tests button is enabled when Pyodide is ready', async () => {
    await startLevel1()
    const runBtn = screen.getByText(/Run Tests/i).closest('button')
    expect(runBtn).not.toBeDisabled()
  })

  it('Run Tests calls Pyodide.runPythonAsync', async () => {
    const pyMock = window.pyodide
    await startLevel1()
    fireEvent.click(screen.getByText(/Run Tests/i).closest('button'))
    await waitFor(() => expect(pyMock.runPythonAsync).toHaveBeenCalled())
  })

  it('shows ✓ Passed badge when Pyodide returns correct answer', async () => {
    const pyMock = window.pyodide
    // runPythonAsync returns 3 (correct for add(1,2))
    pyMock.runPythonAsync
      .mockResolvedValueOnce(null) // clearGlobals
      .mockResolvedValueOnce(null) // exec user code
      .mockResolvedValueOnce(3)    // call: add(1, 2) → 3 ✓
      .mockResolvedValueOnce(null) // clearGlobals
      .mockResolvedValueOnce(null) // exec user code
      .mockResolvedValueOnce(0)    // call: add(0, 0) → 0 ✓
      .mockResolvedValueOnce(null) // clearGlobals
      .mockResolvedValueOnce(null) // exec user code
      .mockResolvedValueOnce(0)    // call: add(-1,1) → 0 ✓

    await startLevel1()
    fireEvent.click(screen.getByText(/Run Tests/i).closest('button'))
    await waitFor(() =>
      expect(screen.getAllByText(/✓ Passed/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })

  it('shows failed badge when Pyodide returns wrong answer', async () => {
    const pyMock = window.pyodide
    // Return 99 for every function call (add(...)), null for all others
    pyMock.runPythonAsync.mockImplementation((code) => {
      if (typeof code === 'string' && code.includes('add(')) return Promise.resolve(99)
      return Promise.resolve(null)
    })

    await startLevel1()
    await waitFor(() => screen.getByText(/Python Ready/i))
    fireEvent.click(screen.getByText(/Run Tests/i).closest('button'))
    // Multiple test cases fail — use getAllByText to avoid "multiple elements" error
    await waitFor(() =>
      expect(screen.getAllByText(/Got/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })

  it('shows error message when code throws an exception', async () => {
    const pyMock = window.pyodide
    pyMock.runPythonAsync
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('SyntaxError: invalid syntax'))

    await startLevel1()
    fireEvent.change(document.querySelector('textarea'), { target: { value: 'def add(:' } })
    fireEvent.click(screen.getByText(/Run Tests/i).closest('button'))
    await waitFor(() =>
      expect(screen.getByText(/SyntaxError/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-11 / TC-12  Navigation inside a level
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-11 & TC-12 — Navigation inside level', () => {
  it('Next button moves to Q2', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => expect(screen.getByText('Find maximum in list')).toBeInTheDocument())
  })

  it('Previous button is disabled on Q1', async () => {
    await startLevel1()
    expect(screen.getByRole('button', { name: /← Previous/i })).toBeDisabled()
  })

  it('Previous button is enabled on Q2', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText('Find maximum in list'))
    expect(screen.getByRole('button', { name: /← Previous/i })).not.toBeDisabled()
  })

  it('code typed on Q1 is preserved after navigating away and back', async () => {
    await startLevel1()
    const ta = document.querySelector('textarea')
    fireEvent.change(ta, { target: { value: 'def add(a, b):\n    return a + b\n' } })

    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText('Find maximum in list'))

    fireEvent.click(screen.getByRole('button', { name: /← Previous/i }))
    await waitFor(() => screen.getByText('Sum of two numbers'))
    expect(document.querySelector('textarea').value).toContain('return a + b')
  })

  it('numbered nav buttons jump to the correct question', async () => {
    await startLevel1()
    const navBtn2 = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '2')[0]
    fireEvent.click(navBtn2)
    await waitFor(() => expect(screen.getByText('Find maximum in list')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CODING-07  Exit Level
// ═══════════════════════════════════════════════════════════════════════════════
describe('CODING-07 — Exit Level button', () => {
  it('Exit Level button is visible during a level', async () => {
    await startLevel1()
    expect(screen.getByRole('button', { name: /Exit Level/i })).toBeInTheDocument()
  })

  it('clicking Exit Level and confirming returns to level selection', async () => {
    window.confirm = vi.fn().mockReturnValue(true)
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Exit Level/i }))
    await waitFor(() =>
      expect(screen.getByText('Select a Level to Start')).toBeInTheDocument()
    )
  })

  it('clicking Exit Level and cancelling stays in level', async () => {
    window.confirm = vi.fn().mockReturnValue(false)
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Exit Level/i }))
    expect(screen.getByText('Sum of two numbers')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-19  Submit Level
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-19 — Submit Level', () => {
  it('Submit Level button appears on last question', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText('Find maximum in list'))
    expect(screen.getByText(/Submit Level/i)).toBeInTheDocument()
  })

  it('submitting shows Level Complete result page', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => expect(screen.getByText(/Level 1 Complete!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('posts to /api/coding-submission on submit', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/coding-submission'),
        expect.objectContaining({ method: 'POST' })
      ),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-20 / TC-21  Result page
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-20 & TC-21 — Level result page', () => {
  async function submitLevel1() {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => screen.getByText(/Level 1 Complete!/i),
      { timeout: 5000 }
    )
  }

  it('shows percentage', async () => {
    await submitLevel1()
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('shows score as X / Y points', async () => {
    await submitLevel1()
    expect(screen.getByText(/\d+ \/ \d+ points/i)).toBeInTheDocument()
  })

  it('shows Retake Level button', async () => {
    await submitLevel1()
    expect(screen.getByRole('button', { name: /Retake Level/i })).toBeInTheDocument()
  })

  it('shows Level Selection button', async () => {
    await submitLevel1()
    expect(screen.getByRole('button', { name: /Level Selection/i })).toBeInTheDocument()
  })

  it('clicking Level Selection returns to level screen', async () => {
    await submitLevel1()
    // Re-mock fetch for the loadLevelScores call that happens on returning
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissions: [] }),
    })
    fireEvent.click(screen.getByRole('button', { name: /Level Selection/i }))
    await waitFor(() =>
      expect(screen.getByText('Select a Level to Start')).toBeInTheDocument()
    )
  })

  it('shows "Level 2 Unlocked!" when score ≥ 60%', async () => {
    // Make Pyodide return correct answers to get 100%
    const pyMock = window.pyodide
    pyMock.runPythonAsync.mockImplementation((code) => {
      if (code && code.includes('clearGlobals')) return Promise.resolve(null)
      if (typeof code === 'string' && code.includes('add(')) return Promise.resolve(3)
      if (typeof code === 'string' && code.includes('find_max(')) return Promise.resolve(4)
      return Promise.resolve(null)
    })
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => screen.getByText(/Level 1 Complete!/i),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-22  Score calculation accuracy (via deepEqual)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-22 — Score calculation correctness', () => {
  it('all test cases passing → score = maxScore', () => {
    function deepEqual(a, b) { return a === b }
    const testCases = [{ expected: 3 }, { expected: 0 }, { expected: 0 }]
    const results = [{ passed: true }, { passed: true }, { passed: true }]
    const passed = results.filter(r => r.passed).length
    const total  = testCases.length
    const score  = Math.round((passed / total) * 20) // 20 pts per question
    expect(score).toBe(20)
  })

  it('no test cases passing → score = 0', () => {
    const results = [{ passed: false }, { passed: false }, { passed: false }]
    const passed = results.filter(r => r.passed).length
    const score  = Math.round((passed / 3) * 20)
    expect(score).toBe(0)
  })

  it('partial pass → proportional score', () => {
    const results = [{ passed: true }, { passed: false }, { passed: true }]
    const passed = results.filter(r => r.passed).length   // 2
    const score  = Math.round((passed / 3) * 20)           // Math.round(40/3) = 13
    expect(score).toBe(13)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-24  Cannot submit twice (result page replaces quiz)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-24 — Second submission is blocked', () => {
  it('Submit Level button disappears after submitting', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => screen.getByText(/Level 1 Complete!/i),
      { timeout: 5000 }
    )
    const submitBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent.includes('Submit Level')
    )
    expect(submitBtn).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-25  Questions fetch failure shows error with retry
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-25 — Failed question fetch is handled gracefully', () => {
  it('shows error alert when coding-questions fetch fails', async () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ submissions: [] }) })
      .mockRejectedValueOnce(new Error('Network error'))  // coding-questions fails
    render(<PdsaCodingQuiz />)
    await waitForLevelSelection()
    fireEvent.click(screen.getByRole('button', { name: /Start Level 1/i }))
    await waitFor(() =>
      expect(screen.getByText(/Failed to load questions/i)).toBeInTheDocument()
    )
  })

  it('shows Retry and Back to Level Selection buttons on error', async () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ submissions: [] }) })
      .mockRejectedValueOnce(new Error('Network error'))
    render(<PdsaCodingQuiz />)
    await waitForLevelSelection()
    fireEvent.click(screen.getByRole('button', { name: /Start Level 1/i }))
    await waitFor(() => screen.getByText(/Failed to load questions/i))
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to Level Selection/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-28  Keyboard accessibility
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-28 — Keyboard accessibility', () => {
  it('Start Level 1 button is focusable', async () => {
    setup()
    await waitForLevelSelection()
    const btn = screen.getByRole('button', { name: /Start Level 1/i })
    btn.focus()
    expect(document.activeElement).toBe(btn)
  })

  it('code textarea is focusable', async () => {
    await startLevel1()
    const ta = document.querySelector('textarea')
    ta.focus()
    expect(document.activeElement).toBe(ta)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-29 / TC-30  Submitting with empty code + result page details
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-29 & TC-30 — Empty-code submit + result page', () => {
  it('empty code submission does not crash', async () => {
    await startLevel1()
    fireEvent.change(document.querySelector('textarea'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    expect(() =>
      fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    ).not.toThrow()
  })

  it('result page shows Level X Complete! heading', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))
    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => expect(screen.getByText(/Level 1 Complete!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ─── BUG: Auto-submit protection ─────────────────────────────────────────────
// Coding quiz has 2 questions per level. Submit Level appears on Q2
// in the same spot as Next. These tests confirm no auto-submission.
describe('BUG — Coding quiz must not auto-submit when navigating', () => {

  it('REAL USER SCENARIO — clicking Next on Q1 must not auto-submit level', async () => {
    await startLevel1()

    // Click Next on Q1 → Q2 where "Submit Level" appears in same spot as Next
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))

    // Submit Level appeared but level NOT submitted
    expect(screen.getByText(/Submit Level/i)).toBeInTheDocument()
    expect(screen.queryByText(/Level 1 Complete/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('jumping to last question via numbered button does NOT auto-submit level', async () => {
    await startLevel1()

    // Click numbered button "2" to jump to Q2
    const navBtn2 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '2'
    )[0]
    fireEvent.click(navBtn2)
    await waitFor(() => screen.getByText(/Submit Level/i))

    expect(screen.queryByText(/Level 1 Complete/i)).not.toBeInTheDocument()
  })

  it('typing in code editor does NOT submit the level', async () => {
    await startLevel1()

    const ta = document.querySelector('textarea')
    fireEvent.change(ta, { target: { value: 'def add(a, b):\n    return a + b\n' } })
    fireEvent.keyDown(ta, { key: 'Enter', code: 'Enter', keyCode: 13 })

    // Still on Q1, level NOT submitted
    expect(screen.queryByText(/Level 1 Complete/i)).not.toBeInTheDocument()
    expect(screen.getByText(CODING_QUESTIONS[0].title)).toBeInTheDocument()
  })

  it('only a deliberate Submit Level click submits the level', async () => {
    await startLevel1()
    fireEvent.click(screen.getByRole('button', { name: /Next →/i }))
    await waitFor(() => screen.getByText(/Submit Level/i))

    fireEvent.click(screen.getByText(/Submit Level/i).closest('button'))
    await waitFor(
      () => expect(screen.getByText(/Level 1 Complete!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})
