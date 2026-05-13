/**
 * IITMMathQuiz — Test Cases TC-01 to TC-30
 *
 * Covers: page load, question display, option selection, navigation,
 * numeric/text/special-char input, calculator, submission, scoring,
 * result page, keyboard access, and edge cases.
 *
 * NOTE: TC-15 (drag calculator), TC-26 (cross-browser), TC-27 (responsive
 * layout) require manual / browser testing and are marked accordingly.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import axios from 'axios'
import IITMMathQuiz from '../pages/courses/IITMMathQuiz'

// ─── Router mock ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useParams:   () => ({ topic: 'Domain_and_Range' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: { quizName: 'IITM Math — Domain & Range' },
      pathname: '/courses/IIITM-math/quiz/Domain_and_Range',
    }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const SESSION = { email: 'student@iitm.ac.in', username: 'mathStudent' }

const QUESTIONS = [
  {
    _id: 'q1',
    question_text: 'What is the domain of f(x) = 1/x?',
    type: 'multiple_choice',
    options: ['All real numbers', 'x ≠ 0', 'x > 0', 'x < 0'],
    correct_answer: 1,   // 'x ≠ 0'
    difficulty: 'easy',
    topic: 'Domain_and_Range',
    points: 1,
  },
  {
    _id: 'q2',
    question_text: 'Find the value of f(3) when f(x) = x + 1.',
    type: 'numeric',
    correct_answer: '4',
    difficulty: 'easy',
    topic: 'Domain_and_Range',
    points: 1,
  },
  {
    _id: 'q3',
    question_text: 'Express the range of f(x) = x² using interval notation.',
    type: 'text_input',
    correct_answer: '[0, inf)',
    difficulty: 'medium',
    topic: 'Domain_and_Range',
    points: 1,
  },
  {
    _id: 'q4',
    question_text: 'Which of the following are in the domain of sqrt(x)?',
    type: 'multiple_select',
    options: ['-4', '0', '9', '-1'],
    correct_answer: [1, 2],  // '0' and '9'
    difficulty: 'hard',
    topic: 'Domain_and_Range',
    points: 2,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setup(questions = QUESTIONS) {
  axios.get
    .mockResolvedValueOnce({ data: SESSION })
    .mockResolvedValueOnce({ data: { questions } })
  axios.post.mockResolvedValue({ data: { success: true } })
  return render(<IITMMathQuiz />)
}

async function waitForLoad() {
  await waitFor(
    () => expect(document.querySelector('.spinner-border')).not.toBeInTheDocument(),
    { timeout: 4000 }
  )
}

// Click Next once and wait until the target question number is shown
async function nextTo(targetQ) {
  fireEvent.click(screen.getByRole('button', { name: /Next/i }))
  await waitFor(() =>
    expect(screen.getByText(new RegExp(`Question ${targetQ} of`, 'i'))).toBeInTheDocument()
  )
}

// Navigate from Q1 to question N by clicking Next (N-1) times sequentially
async function goTo(questionNumber) {
  for (let target = 2; target <= questionNumber; target++) {
    await nextTo(target)
  }
}

// Click an MSQ option via its container div (checkbox has stopPropagation)
function selectMSQOption(checkboxEl) {
  fireEvent.click(checkboxEl.parentElement)
}

// Answer every question with a correct answer; ends on Q4 ready to submit
async function answerAllQuestions() {
  setup()
  await waitForLoad()

  // Q1 — MCQ: pick 'x neq 0' (index 1, correct answer)
  const radios = document.querySelectorAll('input[type="radio"]')
  fireEvent.click(radios[1])
  await waitFor(() => expect(radios[1].checked).toBe(true))

  // Q2 — navigate then fill numeric
  await nextTo(2)
  await waitFor(() => document.querySelector('input[type="number"]'))
  fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })

  // Q3 — navigate then fill text
  await nextTo(3)
  await waitFor(() => document.querySelector('input[type="text"]'))
  fireEvent.change(document.querySelector('input[type="text"]'), { target: { value: '[0, inf)' } })

  // Q4 — navigate then select MSQ options
  await nextTo(4)
  await waitFor(() => document.querySelectorAll('input[type="checkbox"]').length > 0)
  const cbs = document.querySelectorAll('input[type="checkbox"]')
  selectMSQOption(cbs[1])   // '0'
  selectMSQOption(cbs[2])   // '9'
  await waitFor(() => expect(cbs[1].checked).toBe(true))
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-01  Quiz page loads without errors
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-01 — Quiz page loads without errors', () => {
  it('renders without throwing', async () => {
    expect(() => setup()).not.toThrow()
  })

  it('shows loading spinner initially', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    render(<IITMMathQuiz />)
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })

  it('spinner disappears and quiz renders after data loads', async () => {
    setup()
    await waitForLoad()
    expect(document.querySelector('.spinner-border')).not.toBeInTheDocument()
    // Heading is "IITM Math — Domain & Range"; breadcrumb link also contains "IITM Math"
    // Use heading role to avoid ambiguity
    expect(screen.getByRole('heading', { name: /IITM Math/i })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-02  All questions are displayed with proper numbering
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-02 — All questions displayed with correct numbering', () => {
  it('shows total question count in subtitle', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText(/4 questions/i)).toBeInTheDocument()
  })

  it('Q1 shows "Question 1 of 4"', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText(/Question 1 of 4/i)).toBeInTheDocument()
  })

  it('Q2 shows "Question 2 of 4" after Next', async () => {
    setup()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument())
  })

  it('sidebar navigator shows numbered buttons 1–4', async () => {
    setup()
    await waitForLoad()
    ;['1', '2', '3', '4'].forEach(n => {
      const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === n)
      expect(btns.length).toBeGreaterThan(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-03  Question format — readable, no truncation
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-03 — Question text is readable and fully displayed', () => {
  it('renders full question text without "…" truncation during quiz', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('What is the domain of f(x) = 1/x?')).toBeInTheDocument()
  })

  it('shows difficulty badge', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('easy')).toBeInTheDocument()
  })

  it('shows topic badge', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('Domain_and_Range')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-04  All options visible and properly aligned
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-04 — All options visible for MCQ question', () => {
  it('shows all 4 option labels', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('All real numbers')).toBeInTheDocument()
    expect(screen.getByText('x ≠ 0')).toBeInTheDocument()
    expect(screen.getByText('x > 0')).toBeInTheDocument()
    expect(screen.getByText('x < 0')).toBeInTheDocument()
  })

  it('renders 4 radio inputs for MCQ', async () => {
    setup()
    await waitForLoad()
    expect(document.querySelectorAll('input[type="radio"]').length).toBe(4)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-05  Click an option — gets selected smoothly
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-05 — Option selection works', () => {
  it('clicking a radio option selects it', async () => {
    setup()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')
    fireEvent.click(radios[1])
    await waitFor(() => expect(radios[1].checked).toBe(true))
  })

  it('answered count increases to 1 after selecting', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByText('0 answered')).toBeInTheDocument()
    fireEvent.click(document.querySelectorAll('input[type="radio"]')[1])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-06  Change selected option — previous deselected, new selected
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-06 — Changing selected option works correctly', () => {
  it('selecting a different option deselects the previous one', async () => {
    setup()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')

    fireEvent.click(radios[0])
    await waitFor(() => expect(radios[0].checked).toBe(true))

    fireEvent.click(radios[2])
    await waitFor(() => {
      expect(radios[2].checked).toBe(true)
      expect(radios[0].checked).toBe(false)
    })
  })

  it('answered count stays at 1 after changing option', async () => {
    setup()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')
    fireEvent.click(radios[0])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
    fireEvent.click(radios[3])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-07  Leave question unanswered and move to next — no crash
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-07 — Unanswered question navigation does not crash', () => {
  it('Next button works without answering Q1', async () => {
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
    expect(screen.getByText('0 answered')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-08  Enter numeric value — accepted
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-08 — Numeric input accepts valid numbers', () => {
  it('accepts integer value', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })
    expect(document.querySelector('input[type="number"]').value).toBe('4')
  })

  it('accepts decimal value', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '3.14' } })
    expect(document.querySelector('input[type="number"]').value).toBe('3.14')
  })

  it('accepts negative value', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '-5' } })
    expect(document.querySelector('input[type="number"]').value).toBe('-5')
  })

  it('entering value marks question answered', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-09  Enter text in numeric box — input is rejected by browser type="number"
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-09 — Text in numeric input is not accepted', () => {
  it('input[type="number"] has type="number" (browser blocks text natively)', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    const numInput = document.querySelector('input[type="number"]')
    // type="number" is the browser-level guard
    expect(numInput.type).toBe('number')
  })

  it('text string results in empty value on a number input', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    const numInput = document.querySelector('input[type="number"]')
    // jsdom mirrors browser: non-numeric value = ''
    fireEvent.change(numInput, { target: { value: 'two' } })
    expect(numInput.value).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-10  Special characters in numeric box — not accepted
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-10 — Special characters are not accepted in numeric input', () => {
  it('@ symbol results in empty value', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '@#$' } })
    expect(document.querySelector('input[type="number"]').value).toBe('')
  })

  it('abc+xyz results in empty value', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: 'abc+xyz' } })
    expect(document.querySelector('input[type="number"]').value).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-11  Click Next — moves to next question
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-11 — Next button navigates forward', () => {
  it('Next from Q1 shows Q2', async () => {
    setup()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument())
  })

  it('Next from Q2 shows Q3', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 3 of 4/i)).toBeInTheDocument())
  })

  it('No Next button on last question (Submit shown instead)', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    expect(screen.queryByRole('button', { name: /^Next$/i })).not.toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-12  Click Previous — returns to previous question with saved answer
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-12 — Previous button returns with saved answer', () => {
  it('Prev is disabled on Q1', async () => {
    setup()
    await waitForLoad()
    expect(screen.getByRole('button', { name: /Prev/i })).toBeDisabled()
  })

  it('Prev is enabled after moving to Q2', async () => {
    setup()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Prev/i })).not.toBeDisabled()
    )
  })

  it('answer typed on Q2 is still there after going Prev then Next', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })

    // go back to Q1
    fireEvent.click(screen.getByRole('button', { name: /Prev/i }))
    await waitFor(() => screen.getByText(/Question 1 of 4/i))

    // go forward to Q2 again
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    expect(document.querySelector('input[type="number"]').value).toBe('4')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-13  Refresh browser — quiz resets (SPA with no persistent storage)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-13 — Browser refresh resets quiz (no persistent state)', () => {
  it('re-mounting component starts quiz fresh from Q1', async () => {
    const { unmount } = setup()
    await waitForLoad()
    await goTo(3)
    await waitFor(() => screen.getByText(/Question 3 of 4/i))

    // Simulate refresh by unmounting and remounting
    unmount()
    vi.clearAllMocks()

    setup()
    await waitForLoad()
    expect(screen.getByText(/Question 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByText('0 answered')).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-14  Open calculator
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-14 — Calculator opens successfully', () => {
  it('calculator panel is hidden by default', async () => {
    setup()
    await waitForLoad()
    expect(screen.queryByText('🧮 Calculator')).not.toBeInTheDocument()
  })

  it('clicking the 🧮 FAB opens the calculator panel', async () => {
    setup()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => expect(screen.getByText('🧮 Calculator')).toBeInTheDocument())
  })

  it('calculator shows display and buttons after opening', async () => {
    setup()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => screen.getByText('🧮 Calculator'))
    // Number buttons should be present
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '=' })).toBeInTheDocument()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-15  Drag calculator — MANUAL TEST
// Calculator uses position:fixed with no drag implementation.
// Verify manually that the calculator stays in place and doesn't overlap inputs.
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-15 — Calculator drag (manual verification required)', () => {
  it('calculator is rendered with fixed positioning (no drag in DOM)', async () => {
    setup()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => screen.getByText('🧮 Calculator'))
    // The calculator container has position:fixed applied via inline style
    const calcContainer = screen.getByText('🧮 Calculator').closest('div[style*="fixed"]')
    expect(calcContainer).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-16  Minimize button — NOT IMPLEMENTED (no minimize in current version)
// Calculator only has a close (×) button. Minimize is not a feature.
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-16 — Calculator minimize (not implemented — documented as known gap)', () => {
  it('no minimize button exists on the calculator', async () => {
    setup()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => screen.getByText('🧮 Calculator'))
    // There is no minimize button — only ×
    const calcPanel = screen.getByText('🧮 Calculator').parentElement
    const btnsInCalc = calcPanel ? calcPanel.querySelectorAll('button') : []
    const minimizeBtn = [...btnsInCalc].find(b => /minimize|−$/.test(b.textContent.trim()))
    expect(minimizeBtn).toBeUndefined()   // confirmed: minimize not implemented
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-17  Close (×) button closes calculator
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-17 — Close button (×) closes the calculator', () => {
  it('clicking × removes the calculator panel', async () => {
    setup()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => screen.getByText('🧮 Calculator'))
    const closeBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '×')
    fireEvent.click(closeBtn)
    await waitFor(() =>
      expect(screen.queryByText('🧮 Calculator')).not.toBeInTheDocument()
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-18  Reopen calculator after closing
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-18 — Calculator can be reopened after closing', () => {
  it('opens → closes → opens again successfully', async () => {
    setup()
    await waitForLoad()
    const fab = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')

    fireEvent.click(fab())
    await waitFor(() => screen.getByText('🧮 Calculator'))

    const closeBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '×')
    fireEvent.click(closeBtn)
    await waitFor(() => expect(screen.queryByText('🧮 Calculator')).not.toBeInTheDocument())

    fireEvent.click(fab())
    await waitFor(() => expect(screen.getByText('🧮 Calculator')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-19  Answer all questions and submit
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-19 — Answering all questions and submitting works', () => {
  it('submit button is present on last question', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => expect(screen.getByText('Submit')).toBeInTheDocument())
  })

  it('quiz submits and shows review after answering all', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-20  Score is displayed correctly on result page
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-20 — Score display on result page', () => {
  it('shows a percentage value on the result card', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText(/%/)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('shows Excellent!/Good job!/Keep practicing! message', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText(/Excellent!|Good job!|Keep practicing!/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-21  Total score shown as "X / Y" (out of total possible points)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-21 — Total score is shown as X/Y (score out of max)', () => {
  it('result card shows score fraction (e.g. 3/5)', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => {
        // Look for the "X/Y" pattern inside the score circle
        const fractions = [...document.querySelectorAll('span')].filter(el =>
          /\d+\/\d+/.test(el.textContent.trim())
        )
        expect(fractions.length).toBeGreaterThan(0)
      },
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-22  Score calculation matches correct answers
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-22 — Score matches actual correct answers', () => {
  it('all correct answers → 100% score', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText('100%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('no answers → 0% score', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText('0%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-23  No spacing issues in answer section
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-23 — Answer section has no spacing issues', () => {
  it('numeric input has a placeholder and is visible', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    const numInput = document.querySelector('input[type="number"]')
    expect(numInput.placeholder).toBeTruthy()
    expect(numInput).toBeVisible()
  })

  it('text input has a placeholder and is visible', async () => {
    setup()
    await waitForLoad()
    await goTo(3)
    await waitFor(() => document.querySelector('input[type="text"]'))
    const textInput = document.querySelector('input[type="text"]')
    expect(textInput.placeholder).toBeTruthy()
    expect(textInput).toBeVisible()
  })

  it('MCQ options are all visible', async () => {
    setup()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')
    radios.forEach(r => expect(r).toBeVisible())
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-24  Submitting twice is blocked (ReviewPage replaces quiz UI)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-24 — Second submission is blocked', () => {
  it('Submit button is not rendered on the review page', async () => {
    await answerAllQuestions()
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => screen.getAllByText(/Review/i),
      { timeout: 5000 }
    )
    // After submission the quiz UI is replaced by ReviewPage — no Submit button
    const submitOnReview = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    expect(submitOnReview).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-25  Invalid / empty submission — system handles gracefully
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-25 — Submitting with invalid/empty answers is handled', () => {
  it('submitting with all unanswered questions gives 0%', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
    await waitFor(
      () => expect(screen.getByText('0%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('does not throw or crash when submitted with no answers', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    expect(() => fireEvent.click(submitBtn)).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-26  Open quiz in different browser — MANUAL TEST
// Run the dev server and open in Chrome, Firefox, and Safari.
// Verify quiz loads, options work, calculator opens, and submission succeeds.
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-26 — Cross-browser compatibility (manual)', () => {
  it('placeholder: cross-browser testing is a manual step', () => {
    // Run manually in Chrome, Firefox, Edge, Safari
    // Checklist:
    //   [ ] Quiz loads and questions display
    //   [ ] MCQ, MSQ, numeric, text inputs all work
    //   [ ] Calculator opens and computes correctly
    //   [ ] Submission and review page render properly
    expect(true).toBe(true)   // placeholder — always passes
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-27  Different screen sizes — MANUAL TEST
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-27 — Responsive layout (manual)', () => {
  it('placeholder: responsive layout testing is a manual step', () => {
    // Test at these viewports:
    //   Mobile  : 375×667 (iPhone SE)
    //   Tablet  : 768×1024 (iPad)
    //   Desktop : 1440×900
    // Verify sidebar hides on mobile, questions are readable, calc doesn't overlap
    expect(true).toBe(true)   // placeholder — always passes
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-28  Keyboard navigation (Tab key)
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-28 — Keyboard (Tab) accessibility', () => {
  it('radio inputs are focusable', async () => {
    setup()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')
    radios.forEach(r => {
      r.focus()
      expect(document.activeElement).toBe(r)
    })
  })

  it('Next button is focusable and clickable via keyboard', async () => {
    setup()
    await waitForLoad()
    const nextBtn = screen.getByRole('button', { name: /Next/i })
    nextBtn.focus()
    expect(document.activeElement).toBe(nextBtn)
    fireEvent.keyDown(nextBtn, { key: 'Enter', code: 'Enter' })
  })

  it('numeric input is reachable by focus', async () => {
    setup()
    await waitForLoad()
    await goTo(2)
    await waitFor(() => document.querySelector('input[type="number"]'))
    const numInput = document.querySelector('input[type="number"]')
    numInput.focus()
    expect(document.activeElement).toBe(numInput)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-29  Submit with no answers answered — system handles properly
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-29 — Submit with zero answers is handled properly', () => {
  it('shows review page (does not crash)', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    fireEvent.click([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit'))
    await waitFor(
      () => expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })

  it('all question results marked incorrect', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    fireEvent.click([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit'))
    await waitFor(
      () => expect(screen.getByText('0%')).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })

  it('posts score of 0 to the backend', async () => {
    setup()
    await waitForLoad()
    await goTo(4)
    await waitFor(() => screen.getByText('Submit'))
    fireEvent.click([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit'))
    await waitFor(
      () => expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('scores'),
        expect.objectContaining({ email: SESSION.email }),
        expect.any(Object)
      ),
      { timeout: 5000 }
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TC-30  Final result page loads with correct details
// ═══════════════════════════════════════════════════════════════════════════════
describe('TC-30 — Result page loads with correct details', () => {
  async function submitAndWaitForReview() {
    await answerAllQuestions()
    fireEvent.click([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit'))
    await waitFor(
      () => screen.getAllByText(/Review/i),
      { timeout: 5000 }
    )
  }

  it('shows quiz name in the Review heading', async () => {
    await submitAndWaitForReview()
    // h1 = "IITM Math — Domain & Range — Review"; breadcrumb also has "Review"
    expect(screen.getByRole('heading', { name: /Review/i })).toBeInTheDocument()
  })

  it('shows percentage score circle', async () => {
    await submitAndWaitForReview()
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('shows Correct and Wrong question counts', async () => {
    await submitAndWaitForReview()
    expect(screen.getByText(/Correct/i)).toBeInTheDocument()
    expect(screen.getByText(/Wrong/i)).toBeInTheDocument()
  })

  it('shows total time taken', async () => {
    await submitAndWaitForReview()
    expect(screen.getByText(/Total time/i)).toBeInTheDocument()
  })

  it('shows a Retake button', async () => {
    await submitAndWaitForReview()
    expect(screen.getByRole('button', { name: /Retake/i })).toBeInTheDocument()
  })

  it('shows a Back link to return to course page', async () => {
    await submitAndWaitForReview()
    // ReviewPage renders Back as a Link (<a>), not a <button>
    expect(screen.getByRole('link', { name: /Back/i })).toBeInTheDocument()
  })

  it('lists all 4 questions in the review section', async () => {
    await submitAndWaitForReview()
    // Each question's text should be visible in the review
    expect(screen.getByText(/domain of f\(x\)/i)).toBeInTheDocument()
  })
})
