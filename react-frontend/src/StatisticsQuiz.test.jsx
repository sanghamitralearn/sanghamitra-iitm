/**
 * Component integration tests for StatisticsQuiz.jsx
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import StatisticsQuiz from '../pages/courses/StatisticsQuiz'

// ─── Router mock ──────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useParams:   () => ({ topic: 'Basics_of_Data' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { quizName: 'Test Quiz' }, pathname: '/courses/statistics/quiz/Basics_of_Data' }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const SESSION = { email: 'student@test.com', username: 'student' }

const QUESTIONS = [
  {
    _id: 'q1', question_text: 'What type is age?', type: 'multiple_choice',
    options: ['Categorical', 'Numerical', 'Boolean', 'None'],
    correct_answer: 1, difficulty: 'easy', topic: 'Basics of Data', points: 1,
  },
  {
    _id: 'q2', question_text: 'Mean of [2, 4, 6]?', type: 'numeric',
    correct_answer: '4', difficulty: 'easy', topic: 'Basics of Data', points: 1,
  },
  {
    _id: 'q3', question_text: 'Which are discrete?', type: 'multiple_select',
    options: ['Age', 'Gender', 'Income', 'Shoe size'],
    correct_answer: [0, 3], difficulty: 'medium', topic: 'Basics of Data', points: 2,
  },
]

function renderQuiz(questions = QUESTIONS) {
  axios.get
    .mockResolvedValueOnce({ data: SESSION })
    .mockResolvedValueOnce({ data: { questions } })
  axios.post.mockResolvedValue({ data: { success: true } })
  return render(<StatisticsQuiz />)
}

// Wait for spinner to disappear
async function waitForLoad() {
  await waitFor(
    () => expect(document.querySelector('.spinner-border')).not.toBeInTheDocument(),
    { timeout: 4000 }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('Authentication', () => {
  it('shows loading spinner initially', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    render(<StatisticsQuiz />)
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })

  it('redirects to /login on session failure (401)', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 401 } })
    render(<StatisticsQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('redirects to /login when session has no email', async () => {
    axios.get.mockResolvedValueOnce({ data: {} })
    render(<StatisticsQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('loads questions after successful auth', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('What type is age?')).toBeInTheDocument()
  })
})

// ─── Question rendering ───────────────────────────────────────────────────────
describe('Question rendering', () => {
  it('shows MCQ options as radio buttons', async () => {
    renderQuiz()
    await waitForLoad()
    expect(document.querySelectorAll('input[type="radio"]').length).toBe(4)
  })

  it('shows difficulty badge', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('easy')).toBeInTheDocument()
  })

  it('shows topic badge', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('Basics of Data')).toBeInTheDocument()
  })

  it('shows "Question 1 of 3" progress text', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument()
  })

  it('shows "0 answered" initially', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('0 answered')).toBeInTheDocument()
  })

  it('shows error when API returns no questions', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [] } })
    render(<StatisticsQuiz />)
    await waitFor(() => expect(screen.getByText(/No questions found/i)).toBeInTheDocument())
  })
})

// ─── MCQ ─────────────────────────────────────────────────────────────────────
describe('MCQ answering', () => {
  it('selecting an option checks that radio', async () => {
    renderQuiz()
    await waitForLoad()
    const radios = document.querySelectorAll('input[type="radio"]')
    fireEvent.click(radios[1])
    await waitFor(() => expect(radios[1].checked).toBe(true))
  })

  it('only one radio selected at a time', async () => {
    renderQuiz()
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

  it('answered count increases to 1 after selecting MCQ', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('0 answered')).toBeInTheDocument()
    fireEvent.click(document.querySelectorAll('input[type="radio"]')[1])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────
describe('Navigation', () => {
  it('Next button advances to Q2', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument())
  })

  it('Prev button is disabled on Q1', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByRole('button', { name: /Prev/i })).toBeDisabled()
  })

  it('Prev button is enabled after going to Q2', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Prev/i })).not.toBeDisabled())
  })

  it('Submit appears on the last question (Q3)', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Which are discrete/i)).toBeInTheDocument())
    // Submit button uses inline style (S.navSubmit), not a Bootstrap class
    await waitFor(() => expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument())
  })
})

// ─── Numeric input ────────────────────────────────────────────────────────────
describe('Numeric input', () => {
  it('renders number input on Q2', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(document.querySelector('input[type="number"]')).toBeInTheDocument())
  })

  it('typing a number marks question answered', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: /Prev/i }))
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())
  })
})

// ─── Multiple Select ──────────────────────────────────────────────────────────
describe('Multiple select', () => {
  async function goToQ3() {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 3/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))
  }

  it('renders checkboxes for multiple_select', async () => {
    await goToQ3()
    expect(document.querySelectorAll('input[type="checkbox"]').length).toBe(4)
  })

  it('can check an option', async () => {
    await goToQ3()
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    // Checkbox has onClick/onChange stopPropagation — click the parent div
    fireEvent.click(cbs[0].parentElement)
    await waitFor(() => expect(cbs[0].checked).toBe(true))
  })

  it('can check multiple options', async () => {
    await goToQ3()
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(cbs[0].parentElement)
    fireEvent.click(cbs[3].parentElement)
    await waitFor(() => {
      expect(cbs[0].checked).toBe(true)
      expect(cbs[3].checked).toBe(true)
      expect(cbs[1].checked).toBe(false)
    })
  })

  it('unchecking removes selection', async () => {
    await goToQ3()
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(cbs[0].parentElement)
    await waitFor(() => expect(cbs[0].checked).toBe(true))
    fireEvent.click(cbs[0].parentElement)
    await waitFor(() => expect(cbs[0].checked).toBe(false))
  })
})

// ─── Submit gate ──────────────────────────────────────────────────────────────
describe('Submit gate', () => {
  async function goToLastQ() {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 3/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))
  }

  it('Submit button is enabled on last question (only disabled while saving)', async () => {
    // StatisticsQuiz submit uses disabled={saving} only, not answer-count gate
    await goToLastQ()
    await waitFor(() => expect(screen.getByRole('button', { name: /Submit/i })).not.toBeDisabled())
  })

  it('shows unanswered warning on last question', async () => {
    await goToLastQ()
    expect(screen.getByText(/unanswered/i)).toBeInTheDocument()
  })

  it('Submit enabled after answering all questions', async () => {
    renderQuiz()
    await waitForLoad()

    // Q1 — MCQ
    fireEvent.click(document.querySelectorAll('input[type="radio"]')[1])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())

    // Q2 — numeric
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })

    // Q3 — multiple_select
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(cbs[0].parentElement)
    fireEvent.click(cbs[3].parentElement)
    await waitFor(() => expect(cbs[0].checked).toBe(true))
  })
})

// ─── Submit & Review ─────────────────────────────────────────────────────────
describe('Submit and Review', () => {
  async function answerAllAndSubmit() {
    renderQuiz()
    await waitForLoad()

    // Q1 — correct (index 1)
    fireEvent.click(document.querySelectorAll('input[type="radio"]')[1])
    await waitFor(() => expect(screen.getByText('1 answered')).toBeInTheDocument())

    // Q2 — correct numeric
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })

    // Q3 — correct MSQ
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(cbs[0].parentElement)
    fireEvent.click(cbs[3].parentElement)
    await waitFor(() => expect(cbs[0].checked).toBe(true))

    // Submit button is enabled (only disabled when saving)
    const submitBtn = screen.getByRole('button', { name: /Submit/i })
    fireEvent.click(submitBtn)
  }

  it('shows "Review" heading after submit', async () => {
    await answerAllAndSubmit()
    await waitFor(() =>
      expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })

  it('shows score percentage circle', async () => {
    await answerAllAndSubmit()
    await waitFor(() => expect(screen.getByText(/%/)).toBeInTheDocument(), { timeout: 5000 })
  })

  it('posts score to /api/statistics_scores', async () => {
    await answerAllAndSubmit()
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/statistics_scores'),
        expect.objectContaining({ email: SESSION.email }),
        expect.any(Object)
      ),
      { timeout: 5000 }
    )
  })

  it('Retake button reloads questions and returns to Q1', async () => {
    await answerAllAndSubmit()
    await waitFor(() => screen.getAllByText(/Review/i), { timeout: 5000 })

    // Mock next question fetch for retake
    axios.get.mockResolvedValueOnce({ data: { questions: QUESTIONS } })
    fireEvent.click(screen.getByRole('button', { name: /Retake/i }))

    await waitFor(() =>
      expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ─── Calculator toggle ────────────────────────────────────────────────────────
describe('Calculator', () => {
  it('is hidden by default', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.queryByText('🧮 Calculator')).not.toBeInTheDocument()
  })

  it('opens when 🧮 FAB is clicked', async () => {
    renderQuiz()
    await waitForLoad()
    // The FAB button only contains the emoji
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => expect(screen.getByText('🧮 Calculator')).toBeInTheDocument())
  })

  it('closes when × is clicked', async () => {
    renderQuiz()
    await waitForLoad()
    const fab = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '🧮')
    fireEvent.click(fab)
    await waitFor(() => screen.getByText('🧮 Calculator'))
    // The × close button inside the calculator
    const closeBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '×')
    fireEvent.click(closeBtn)
    await waitFor(() => expect(screen.queryByText('🧮 Calculator')).not.toBeInTheDocument())
  })
})

// ─── BUG: Auto-submit protection ─────────────────────────────────────────────
// Stats quiz has 3 questions. Submit appears on Q3 in the same spot as Next.
// These tests confirm the quiz never auto-submits when navigating.
describe('BUG — Stats quiz must not auto-submit when navigating', () => {

  it('REAL USER SCENARIO — clicking Next on Q2 must not auto-submit', async () => {
    renderQuiz()
    await waitForLoad()

    // Go to Q2 (second to last)
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 3/i))

    // Click Next on Q2 → reaches Q3 where Submit appears in same spot as Next was
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))

    // Submit button is visible — but quiz NOT submitted yet
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('jumping to last question via numbered button does NOT auto-submit', async () => {
    renderQuiz()
    await waitForLoad()

    const navBtn3 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '3'
    )[0]
    fireEvent.click(navBtn3)
    await waitFor(() => screen.getByText(/Which are discrete/i))

    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
  })

  it('pressing Enter in numeric input does NOT submit Stats quiz', async () => {
    renderQuiz()
    await waitForLoad()

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))

    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '4' } })
    fireEvent.keyDown(numInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

    // Still on Q2, NOT submitted
    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument()
  })

  it('pressing Enter in text input does NOT submit Stats quiz', async () => {
    renderQuiz([
      { _id: 'q1', question_text: 'Text Q', type: 'text_input',
        correct_answer: 'hello', difficulty: 'easy', topic: 'Basics of Data', points: 1 },
      { _id: 'q2', question_text: 'Last Q', type: 'multiple_choice',
        options: ['A','B'], correct_answer: 0, difficulty: 'easy', topic: 'Basics of Data', points: 1 },
    ])
    await waitForLoad()

    const textInput = document.querySelector('input[type="text"]')
    fireEvent.change(textInput, { target: { value: 'hello' } })
    fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Question 1 of 2/i)).toBeInTheDocument()
  })

  it('only a deliberate Submit click submits Stats quiz', async () => {
    renderQuiz()
    await waitForLoad()

    // Reach last question
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Question 2 of 3/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Which are discrete/i))

    // Deliberately click Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(
      () => expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })
})
