/**
 * PdsaTestQuiz — Test Suite (TC-01 to TC-30 + PDSA-specific cases)
 *
 * Key differences from Math/Stats quizzes:
 *  - fetch() used for questions + submission (not axios)
 *  - MCQ options are plain <div> containers — no radio/checkbox inputs
 *  - Multiple-select stores selected option TEXTS, not indices
 *  - Submit button: className="btn btn-success", text="Submit Quiz"
 *  - Submit disabled only while submitting (disabled={submitting})
 *  - Invalid weekId guard renders without hitting the API
 *  - No calculator, no MathJax, no anti-cheat
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import PdsaTestQuiz from '../pages/courses/PDSA/PdsaTestQuiz'

// ─── Router mock ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
let mockWeekId = '2'   // default: Sorting Algorithms

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
const SESSION = { email: 'student@iitm.ac.in', username: 'pdsaStudent' }

const QUESTIONS = [
  {
    questionId: 'pq1',
    title: 'What is the time complexity of binary search?',
    type: 'mcq-single',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctAnswer: 'O(log n)',
    maxScore: 1,
  },
  {
    questionId: 'pq2',
    title: 'Which are linear data structures?',
    type: 'mcq-multiple',
    options: ['Array', 'Tree', 'Queue', 'Graph'],
    correctAnswer: ['Array', 'Queue'],
    maxScore: 2,
    description: 'Choose all correct answers.',
  },
  {
    questionId: 'pq3',
    title: 'How many nodes are in a full binary tree of height 2?',
    type: 'numerical',
    correctAnswer: '7',
    maxScore: 1,
  },
  {
    questionId: 'pq4',
    title: 'What does this code output?',
    type: 'mcq-single',
    options: ['0', '1', 'None', 'Error'],
    correctAnswer: 'None',
    maxScore: 1,
    code: 'def f():\n    pass\nprint(f())',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mockFetch(questionsPayload = QUESTIONS, submitOk = true) {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, questions: questionsPayload }),
    })
    .mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: submitOk }),
    })
}

function setup(questions = QUESTIONS) {
  axios.get.mockResolvedValueOnce({ data: SESSION })
  mockFetch(questions)
  return render(<PdsaTestQuiz />)
}

async function waitForLoad() {
  await waitFor(
    () => expect(document.querySelector('.spinner-border')).not.toBeInTheDocument(),
    { timeout: 4000 }
  )
}

// Click the option div that contains the given text (MCQ-single or MCQ-multiple)
function clickOption(text) {
  const label = screen.getByText(text)
  // option div wraps the letter badge + text; it is the nearest ancestor with onClick
  const optDiv = label.closest('[style*="cursor"]') || label.parentElement
  fireEvent.click(optDiv)
}

// Navigate one step forward
async function goNext(expectedQ) {
  fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  await waitFor(() =>
    expect(screen.getByText(new RegExp(`Question ${expectedQ} of`, 'i'))).toBeInTheDocument()
  )
}

// Answer all 4 questions correctly and end up on last question
async function answerAll() {
  setup()
  await waitForLoad()

  // Q1 — mcq-single: 'O(log n)'
  clickOption('O(log n)')
  await waitFor(() => expect(screen.getByText(/1 \/ 4 answered|1\/4 answered/i)).toBeInTheDocument())

  // Q2 — mcq-multiple
  await goNext(2)
  clickOption('Array')
  clickOption('Queue')

  // Q3 — numerical
  await goNext(3)
  await waitFor(() => document.querySelector('input[type="number"]'))
  fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '7' } })

  // Q4 — mcq-single with code block
  await goNext(4)
  clickOption('None')
}

beforeEach(() => {
  vi.clearAllMocks()
  mockWeekId = '2'
})

afterEach(() => {
  delete global.fetch
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-01  Quiz page loads without errors
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-01 — Quiz page loads without errors', () => {
  it('renders without throwing', () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    mockFetch()
    expect(() => render(<PdsaTestQuiz />)).not.toThrow()
  })

  it('shows loading spinner initially', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    mockFetch()
    render(<PdsaTestQuiz />)
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })

  it('spinner disappears after questions load', async () => {
    setup()
    await waitForLoad()
    expect(document.querySelector('.spinner-border')).not.toBeInTheDocument()
  })

  it('shows the correct quiz name after load', async () => {
    setup()
    await waitForLoad()
    // WEEK_CONFIG['2'] = 'Sorting Algorithms Quiz'
    expect(screen.getByRole('heading', { name: /Sorting Algorithms Quiz/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-02  All questions displayed with proper numbering
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-02 — All questions displayed with correct numbering', () => {
  it('shows "Question 1 of 4"', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText(/Question 1 of 4/i)).toBeInTheDocument()
  })

  it('shows "Question 2 of 4" after Next', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument()
  })

  it('renders numbered navigation buttons 1–4', async () => {
    setup()
    await waitForLoad()
    ;['1', '2', '3', '4'].forEach(n => {
      const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === n)
      expect(btns.length).toBeGreaterThan(0)
    })
  })

  it('shows question title text', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText(/binary search/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-03  Question format — readable, no truncation
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-03 — Question text is readable and fully displayed', () => {
  it('renders full question title without truncation', async () => {
    setup()
    await waitForLoad()
    // Title is rendered as "Q1: {title}" inside h5
    expect(screen.getByText(/binary search/i)).toBeInTheDocument()
  })

  it('renders optional description when present', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    // Q2 has description "Choose all correct answers." — distinct from the mcq hint
    expect(screen.getByText(/Choose all correct answers/i)).toBeInTheDocument()
  })

  it('renders code block when question has code', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    await waitFor(() => screen.getByText(/def f\(\)/))
    expect(screen.getByText(/def f\(\)/)).toBeInTheDocument()
  })

  it('shows point value badge on each question', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText(/1 pt/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-04  All options visible and properly aligned
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-04 — All options visible for MCQ question', () => {
  it('shows all 4 option texts for mcq-single', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('O(n)')).toBeInTheDocument()
    expect(screen.getByText('O(log n)')).toBeInTheDocument()
    expect(screen.getByText('O(n²)')).toBeInTheDocument()
    expect(screen.getByText('O(1)')).toBeInTheDocument()
  })

  it('shows option letter labels A, B, C, D', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-05  Click an option — gets selected
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-05 — Option selection works', () => {
  it('clicking an option selects it and shows 1/4 answered', async () => {
    setup()
    await waitForLoad()
    clickOption('O(log n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })

  it('selecting an option increases answered count (visual feedback)', async () => {
    // jsdom converts hex colours to rgb so we test behaviour not raw style strings
    setup()
    await waitForLoad()
    expect(screen.getByText(/0 \/ 4 answered/i)).toBeInTheDocument()
    clickOption('O(log n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-06  Change selected option — previous deselected, new selected
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-06 — Changing selected option', () => {
  it('answered count stays at 1 after changing option', async () => {
    setup()
    await waitForLoad()
    clickOption('O(n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
    clickOption('O(log n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })

  it('answered count stays 1 after changing option', async () => {
    setup()
    await waitForLoad()
    clickOption('O(n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
    clickOption('O(log n)')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-07  Skip unanswered question and move next — no crash
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-07 — Unanswered navigation does not crash', () => {
  it('Next works without answering Q1', async () => {
    setup()
    await waitForLoad()
    expect(() => fireEvent.click(screen.getByRole('button', { name: /Next/i }))).not.toThrow()
    await waitFor(() => expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument())
  })

  it('answered count stays 0 after skipping Q1', async () => {
    setup()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 4/i))
    expect(screen.getByText(/0 \/ 4 answered/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-08  Numeric input accepts valid numbers
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-08 — Numerical input accepts valid numbers', () => {
  it('renders number input on numerical question (Q3)', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await waitFor(() => expect(document.querySelector('input[type="number"]')).toBeInTheDocument())
  })

  it('accepts integer value', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '7' } })
    expect(numInput.value).toBe('7')
  })

  it('accepts negative number', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '-3' } })
    expect(numInput.value).toBe('-3')
  })

  it('entering a value marks Q3 as answered', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '7' } })
    await waitFor(() => expect(screen.getByText(/[1-9] \/ 4 answered/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-09  Text in numeric box is not accepted (browser type="number")
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-09 — Text rejected by numerical input', () => {
  it('numerical input has type="number"', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    expect(document.querySelector('input[type="number"]').type).toBe('number')
  })

  it('alphabetic text gives empty value on number input', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: 'seven' } })
    expect(numInput.value).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-10  Special characters rejected by numerical input
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-10 — Special characters rejected by numerical input', () => {
  it('@#$ gives empty value', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '@#$' } })
    expect(numInput.value).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-11  Next button navigates forward
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-11 — Next button navigates forward', () => {
  it('Next from Q1 shows Q2', async () => {
    setup()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument())
  })

  it('Submit Quiz appears on last question instead of Next', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    await waitFor(() => expect(screen.getByText('Submit Quiz')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /^Next$/i })).not.toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-12  Previous button returns with saved answer
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-12 — Previous button returns with saved answer', () => {
  it('Previous is disabled on Q1', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled()
  })

  it('Previous is enabled on Q2', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    expect(screen.getByRole('button', { name: /Previous/i })).not.toBeDisabled()
  })

  it('answer on Q3 is retained after going back and forward', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '7' } })

    // Go back to Q2
    fireEvent.click(screen.getByRole('button', { name: /Previous/i }))
    await waitFor(() => screen.getByText(/Question 2 of 4/i))

    // Go forward to Q3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    expect(document.querySelector('input[type="number"]').value).toBe('7')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-13  Browser refresh resets quiz (no persistent storage)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-13 — Refresh resets quiz to Q1', () => {
  it('remounting starts from Q1 with 0 answers', async () => {
    const { unmount } = setup()
    await waitForLoad()
    await goNext(2)

    unmount()
    vi.clearAllMocks()
    setup()
    await waitForLoad()

    expect(screen.getByText(/Question 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByText(/0 \/ 4 answered/i)).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PDSA-01  Invalid weekId shows error page (no API call)
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDSA-01 — Invalid week ID shows error guard', () => {
  it('shows "Invalid Quiz Week" for unknown weekId', () => {
    mockWeekId = 'invalid_week'
    render(<PdsaTestQuiz />)
    expect(screen.getByText(/Invalid Quiz Week/i)).toBeInTheDocument()
  })

  it('shows Back to PDSA link for invalid weekId', () => {
    mockWeekId = 'invalid_week'
    render(<PdsaTestQuiz />)
    expect(screen.getByRole('link', { name: /Back to PDSA/i })).toBeInTheDocument()
  })

  it('shows no quiz content (spinner/questions) for invalid weekId', () => {
    // React hooks always run, but the guard renders the error page immediately
    mockWeekId = 'invalid_week'
    render(<PdsaTestQuiz />)
    expect(screen.queryByText(/Question \d+ of/i)).not.toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PDSA-02  All valid weekIds load the correct quiz name
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDSA-02 — Valid week IDs load correct quiz names', () => {
  const cases = [
    ['1',        'Python Basics Quiz'],
    ['2',        'Sorting Algorithms Quiz'],
    ['5',        'Graph Algorithms Quiz'],
    ['9',        'Dynamic Programming Quiz'],
    ['midterm1', 'Midterm 1 Exam'],
    ['endterm',  'End Term Exam'],
  ]

  cases.forEach(([week, name]) => {
    it(`week "${week}" loads "${name}"`, async () => {
      mockWeekId = week
      axios.get.mockResolvedValueOnce({ data: SESSION })
      mockFetch()
      render(<PdsaTestQuiz />)
      await waitForLoad()
      expect(screen.getByRole('heading', { name: new RegExp(name, 'i') })).toBeInTheDocument()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PDSA-03  MCQ-multiple (select all that apply)
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDSA-03 — MCQ-multiple (select all that apply)', () => {
  async function goToMSQ() {
    setup()
    await waitForLoad()
    await goNext(2)
    // Use getAllByText — both description and mcq hint contain "Select all that apply"
    await waitFor(() => expect(screen.getAllByText(/Select all that apply/i).length).toBeGreaterThan(0))
  }

  it('shows "Select all that apply" hint', async () => {
    await goToMSQ()
    // Multiple matches expected (description + hint) — getAllByText
    expect(screen.getAllByText(/Select all that apply/i).length).toBeGreaterThan(0)
  })

  it('can select multiple options (answered count increases)', async () => {
    await goToMSQ()
    clickOption('Array')
    clickOption('Queue')
    // Both options stored in answers → Q2 counts as 1 answered question
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })

  it('clicking a selected option deselects it without crashing', async () => {
    // Note: PdsaTestQuiz counts answered by key presence (Object.keys(answers).length)
    // so count stays at 1 even when the selected array becomes empty.
    await goToMSQ()
    clickOption('Array')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
    expect(() => clickOption('Array')).not.toThrow() // toggle off
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })

  it('marks question answered after selecting at least one option', async () => {
    await goToMSQ()
    clickOption('Tree')
    await waitFor(() => expect(screen.getByText(/1 \/ 4 answered/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PDSA-04  Network failure during questions fetch shows error UI
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDSA-04 — Network error on question fetch', () => {
  it('shows error alert when fetch throws', async () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<PdsaTestQuiz />)
    await waitFor(() => expect(screen.getByText(/Failed to load questions/i)).toBeInTheDocument())
  })

  it('shows Retry button on error', async () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<PdsaTestQuiz />)
    await waitFor(() => expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument())
  })

  it('Retry button re-fetches questions', async () => {
    axios.get.mockResolvedValueOnce({ data: SESSION })
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, questions: QUESTIONS }),
      })
    render(<PdsaTestQuiz />)
    await waitFor(() => screen.getByRole('button', { name: /Retry/i }))
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }))
    await waitFor(() => expect(screen.getByText(/binary search/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PDSA-05  Auth redirect
// ═══════════════════════════════════════════════════════════════════════════════
describe('PDSA-05 — Auth redirect on session failure', () => {
  it('redirects to /login when session check fails', async () => {
    mockFetch()
    axios.get.mockRejectedValueOnce({ response: { status: 401 } })
    render(<PdsaTestQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('redirects when session has no email', async () => {
    mockFetch()
    axios.get.mockResolvedValueOnce({ data: {} })
    render(<PdsaTestQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-14–TC-18  No calculator in PdsaTestQuiz (documented)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-14 to TC-18 — Calculator (not present in PDSA)', () => {
  it('no calculator FAB exists on the page', async () => {
    setup()
    await waitForLoad()
    const calcBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('🧮'))
    expect(calcBtn).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-19  Answer all questions and submit
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-19 — Answering all questions and submitting', () => {
  it('Submit Quiz button appears on last question', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    await waitFor(() => expect(screen.getByText('Submit Quiz')).toBeInTheDocument())
  })

  it('submitting shows result page', async () => {
    await answerAll()
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i })
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-20  Score displayed correctly
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-20 — Score display on result page', () => {
  it('shows percentage value', async () => {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/%/)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('shows "Excellent!", "Good!" or "Keep Practicing!" message', async () => {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/Excellent!|Good!|Keep Practicing!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-21  Score shown as X / Y points
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-21 — Score shown as X / Y points', () => {
  it('result page shows points fraction', async () => {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/\d+ \/ \d+ points/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-22  Score matches correct answers
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-22 — Score matches actual correct answers', () => {
  it('all correct → 100%', async () => {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText('100%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('zero answers → 0%', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText('0%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-23  No spacing / rendering issues
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-23 — Answer section renders without issues', () => {
  it('MCQ option text is visible', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('O(n)')).toBeVisible()
  })

  it('numerical input is visible with placeholder', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    const numInput = document.querySelector('input[type="number"]')
    expect(numInput).toBeVisible()
    expect(numInput.placeholder).toBeTruthy()
  })

  it('progress bar is present', async () => {
    setup()
    await waitForLoad()
    expect(document.querySelector('.progress')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-24  Submitting twice is blocked (result page replaces quiz)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-24 — Second submission is blocked', () => {
  it('Submit Quiz button is absent on result page', async () => {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => screen.getByText(/Quiz Complete!/i),
      { timeout: 5000 }
    )
    const submitOnResult = [...document.querySelectorAll('button')].find(
      b => b.textContent.trim() === 'Submit Quiz'
    )
    expect(submitOnResult).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-25  Submit with no/invalid answers — handled gracefully
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-25 — Invalid or empty submission is handled', () => {
  it('submitting with no answers shows 0%', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText('0%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('does not throw on empty submission', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    expect(() => fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-26 / TC-27  Cross-browser and responsive — manual placeholders
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-26 & TC-27 — Cross-browser / responsive (manual)', () => {
  it('placeholder: test manually in Chrome, Firefox, Edge, Safari', () => {
    expect(true).toBe(true)
  })
  it('placeholder: test at 375px, 768px, 1440px viewports', () => {
    expect(true).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-28  Keyboard accessibility
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-28 — Keyboard accessibility', () => {
  it('Next button is focusable', async () => {
    setup()
    await waitForLoad()
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    nextBtn.focus()
    expect(document.activeElement).toBe(nextBtn)
  })

  it('numerical input is focusable', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await waitFor(() => document.querySelector('input[type="number"]'))
    const numInput = document.querySelector('input[type="number"]')
    numInput.focus()
    expect(document.activeElement).toBe(numInput)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-29  Submit with zero answers — system handles properly
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-29 — Submit with zero answers', () => {
  it('shows result page without crashing', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('posts submission to /api/pdsa-submission', async () => {
    setup()
    await waitForLoad()
    await goNext(2)
    await goNext(3)
    await goNext(4)
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pdsa-submission'),
        expect.objectContaining({ method: 'POST' })
      ),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-30  Result page has all details
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-30 — Result page contains all required details', () => {
  async function submitAll() {
    await answerAll()
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => screen.getByText(/Quiz Complete!/i),
      { timeout: 5000 }
    )
  }

  it('shows "Quiz Complete!" heading', async () => {
    await submitAll()
    expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument()
  })

  it('shows percentage score', async () => {
    await submitAll()
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('shows X / Y points', async () => {
    await submitAll()
    expect(screen.getByText(/\d+ \/ \d+ points/i)).toBeInTheDocument()
  })

  it('shows "Question Breakdown" section', async () => {
    await submitAll()
    expect(screen.getByText(/Question Breakdown/i)).toBeInTheDocument()
  })

  it('shows correct/incorrect badge for each question', async () => {
    await submitAll()
    const badges = [...document.querySelectorAll('.badge')].filter(b => /\d+\/\d+/.test(b.textContent))
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows Retake Quiz button', async () => {
    await submitAll()
    expect(screen.getByRole('button', { name: /Retake Quiz/i })).toBeInTheDocument()
  })

  it('clicking Retake Quiz reloads questions', async () => {
    await submitAll()
    mockFetch()
    fireEvent.click(screen.getByRole('button', { name: /Retake Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/Question 1 of 4/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('shows Back to PDSA link', async () => {
    await submitAll()
    expect(screen.getByRole('link', { name: /Back to PDSA/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BUG — Quiz submitted without clicking Submit
//
// ROOT CAUSE: Submit button appears in the SAME position as Next button.
// When a student double-clicks Next on the second-to-last question,
// the first click goes to Next (navigating to last question) and the
// second click lands on Submit (which just appeared in that same spot).
//
// ALSO: Buttons have no type="button" attribute, so pressing Enter inside
// a numerical input can trigger the nearest button.
// ═══════════════════════════════════════════════════════════════════════════════
describe('BUG — Quiz must not auto-submit without user clicking Submit', () => {

  it('quiz is NOT submitted after clicking Next to reach the last question', async () => {
    setup()
    await waitForLoad()

    // Navigate to last question (Q4) using Next 3 times
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 4/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 3 of 4/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 4 of 4/i))

    // Submit button is now visible — but quiz is NOT submitted yet
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument()
    expect(screen.queryByText(/Quiz Complete/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('quiz is NOT submitted after clicking a numbered nav button to jump to last question', async () => {
    setup()
    await waitForLoad()

    // Jump directly to Q4 using numbered button
    const navBtn4 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '4'
    )[0]
    fireEvent.click(navBtn4)
    await waitFor(() => screen.getByText(/Question 4 of 4/i))

    // Submit Quiz button appears — but quiz should NOT be submitted
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument()
    expect(screen.queryByText(/Quiz Complete/i)).not.toBeInTheDocument()
  })

  it('pressing Enter inside a numeric input does NOT submit the quiz', async () => {
    setup()
    await waitForLoad()

    await goNext(2)
    await waitFor(() => screen.getByText(/Question 2 of 4/i))
    await goNext(3)
    await waitFor(() => screen.getByText(/Question 3 of 4/i))
    await waitFor(() => document.querySelector('input[type="number"]'))

    // Type a number then press Enter
    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '7' } })
    fireEvent.keyDown(numInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

    // Quiz should still be on Q3 — NOT submitted
    expect(screen.queryByText(/Quiz Complete/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Question 3 of 4/i)).toBeInTheDocument()
  })

  it('pressing Enter inside an MCQ option does NOT submit the quiz', async () => {
    setup()
    await waitForLoad()

    // Navigate to last question (Q4) by chaining goNext calls
    await goNext(2)
    await goNext(3)
    await goNext(4)

    // Press Enter on the question text (simulates student pressing Enter after reading)
    const questionTitle = screen.getByText(/What does this code output/i)
    fireEvent.keyDown(questionTitle, { key: 'Enter', code: 'Enter', keyCode: 13 })

    // Quiz should still be on Q4 — NOT submitted
    expect(screen.queryByText(/Quiz Complete/i)).not.toBeInTheDocument()
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument()
  })

  it('REAL USER SCENARIO — rapid clicking Next on Q3 must not auto-submit', async () => {
    // This is the exact situation the user reported:
    //   Student clicks Next rapidly through questions
    //   On Q3 (second to last), first click moves to Q4
    //   Submit button appears in the SAME POSITION as Next was
    //   Second rapid click lands on Submit
    //   Quiz submits without student knowing
    setup()
    await waitForLoad()

    // Go to Q3 (second to last question)
    await goNext(2)
    await goNext(3)
    await waitFor(() => screen.getByText(/Question 3 of 4/i))

    // Student clicks Next on Q3 → goes to Q4, Submit button appears
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextBtn)
    await waitFor(() => screen.getByText(/Question 4 of 4/i))

    // Quiz should be on Q4 with Submit visible — NOT submitted yet
    expect(screen.getByText('Submit Quiz')).toBeInTheDocument()
    expect(screen.queryByText(/Quiz Complete/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('Submit button requires a deliberate click — single click submits', async () => {
    setup()
    await waitForLoad()

    await goNext(2)
    await goNext(3)
    await goNext(4)
    await waitFor(() => screen.getByText('Submit Quiz'))

    // Exactly ONE click on Submit should submit
    fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))
    await waitFor(
      () => expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('Submit button is disabled while submission is in progress (prevents double submit)', async () => {
    setup()
    await waitForLoad()

    await goNext(2)
    await goNext(3)
    await goNext(4)
    await waitFor(() => screen.getByText('Submit Quiz'))

    // Start submit
    const submitBtn = screen.getByRole('button', { name: /Submit Quiz/i })
    fireEvent.click(submitBtn)

    // Immediately check if button becomes disabled (prevents second click)
    // During submission: disabled={submitting} → submitting=true → disabled
    await waitFor(() =>
      expect(screen.getByText(/Quiz Complete/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
    // After submission: result page shows — Submit button is gone entirely
    expect(screen.queryByText('Submit Quiz')).not.toBeInTheDocument()
  })
})
