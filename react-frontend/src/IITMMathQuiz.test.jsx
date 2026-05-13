/**
 * Component integration tests for IITMMathQuiz.jsx
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
      state: { quizName: 'Domain & Range Quiz' },
      pathname: '/courses/IIITM-math/quiz/Domain_and_Range',
    }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const SESSION = { email: 'student@iitm.ac.in', username: 'iitmStudent' }

const QUESTIONS = [
  {
    _id: 'm1', question_text: 'What is the domain of f(x) = 1/x?',
    type: 'multiple_choice',
    options: ['All reals', 'x neq 0', 'x > 0', 'x < 0'],
    correct_answer: 1, difficulty: 'easy', topic: 'Domain_and_Range', points: 1,
  },
  {
    _id: 'm2', question_text: 'Find the range of f(x) = x squared.',
    type: 'text_input',
    correct_answer: '[0, inf)',
    difficulty: 'medium', topic: 'Domain_and_Range', points: 1,
  },
  {
    _id: 'm3', question_text: 'What is f(3) for f(x) = x + 1?',
    type: 'numeric',
    correct_answer: '4', difficulty: 'easy', topic: 'Domain_and_Range', points: 1,
  },
  {
    _id: 'm4', question_text: 'Which values are in the domain of sqrt(x)?',
    type: 'multiple_select',
    options: ['-1', '0', '1', '4'],
    correct_answer: [1, 2, 3],
    difficulty: 'hard', topic: 'Domain_and_Range', points: 3,
  },
]

function renderQuiz(questions = QUESTIONS) {
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

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('Authentication', () => {
  it('shows spinner while loading', () => {
    axios.get.mockReturnValue(new Promise(() => {}))
    render(<IITMMathQuiz />)
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })

  it('redirects to /login on 401', async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 401 } })
    render(<IITMMathQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('redirects to /login when session has no email', async () => {
    axios.get.mockResolvedValueOnce({ data: {} })
    render(<IITMMathQuiz />)
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }))
  })

  it('renders quiz after successful auth', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText(/domain of f\(x\)/i)).toBeInTheDocument()
  })
})

// ─── Question display ─────────────────────────────────────────────────────────
describe('Question display', () => {
  it('shows quiz name in page heading', async () => {
    renderQuiz()
    await waitForLoad()
    // heading h1 specifically to avoid breadcrumb duplicate
    expect(screen.getByRole('heading', { name: /Domain & Range Quiz/i })).toBeInTheDocument()
  })

  it('shows question count in subtitle', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText(/4 questions/i)).toBeInTheDocument()
  })

  it('shows difficulty badge', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('easy')).toBeInTheDocument()
  })

  it('shows error when no questions loaded', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [] } })
    render(<IITMMathQuiz />)
    await waitFor(() => expect(screen.getByText(/No questions found/i)).toBeInTheDocument())
  })
})

// ─── MCQ interaction ──────────────────────────────────────────────────────────
describe('MCQ interaction', () => {
  it('renders 4 options for MCQ', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByText('All reals')).toBeInTheDocument()
    expect(screen.getByText('x > 0')).toBeInTheDocument()
    expect(screen.getByText('x < 0')).toBeInTheDocument()
  })

  it('clicking an option selects it and updates answered count', async () => {
    renderQuiz()
    await waitForLoad()
    // MCQ in IITMMathQuiz uses div labels, not radio inputs
    fireEvent.click(screen.getByText('All reals').closest('[style]') || screen.getByText('All reals'))
    // Answered count in sidebar: "1 / 4" inside the infoPill strong
    await waitFor(() => {
      const strong = [...document.querySelectorAll('strong')].find(el => /1\s*\/\s*4/.test(el.textContent))
      expect(strong).toBeTruthy()
    })
  })
})

// ─── Text input ───────────────────────────────────────────────────────────────
describe('Text input question', () => {
  it('renders text input on Q2', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(document.querySelector('input[type="text"]')).toBeInTheDocument())
  })

  it('shows preview labels when text is entered', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="text"]'))
    fireEvent.change(document.querySelector('input[type="text"]'), { target: { value: 'sqrt(x)' } })
    // MathPreviewInput renders "Preview:" span AND "ANSWER PREVIEW" heading
    await waitFor(() => {
      const previews = screen.getAllByText(/preview/i)
      expect(previews.length).toBeGreaterThan(0)
    })
  })
})

// ─── Numeric input ────────────────────────────────────────────────────────────
describe('Numeric input', () => {
  it('renders number input on Q3', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Find the range/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(document.querySelector('input[type="number"]')).toBeInTheDocument())
  })

  it('entering value marks question answered', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText(/Find the range/i))
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })
    await waitFor(() => {
      const strong = [...document.querySelectorAll('strong')].find(el => /[1-9]\s*\/\s*4/.test(el.textContent))
      expect(strong).toBeTruthy()
    })
  })
})

// ─── Multiple Select ──────────────────────────────────────────────────────────
describe('Multiple select (MSQ)', () => {
  async function goToQ4() {
    renderQuiz()
    await waitForLoad()
    // Navigate directly to Q4 via the number button in sidebar
    await waitFor(() => {
      const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4')
      expect(btns.length).toBeGreaterThan(0)
    })
    const navBtn4 = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4')[0]
    fireEvent.click(navBtn4)
    await waitFor(() => screen.getByText(/sqrt\(x\)/i))
  }

  it('renders checkboxes on Q4', async () => {
    await goToQ4()
    expect(document.querySelectorAll('input[type="checkbox"]').length).toBe(4)
  })

  it('shows "Select all that apply" hint', async () => {
    await goToQ4()
    expect(screen.getByText(/Select all that apply/i)).toBeInTheDocument()
  })

  it('selecting options marks MSQ answered', async () => {
    await goToQ4()
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    // Checkbox has stopPropagation — must click the parent container div
    fireEvent.click(cbs[1].parentElement)
    fireEvent.click(cbs[2].parentElement)
    fireEvent.click(cbs[3].parentElement)
    await waitFor(() => {
      const strong = [...document.querySelectorAll('strong')].find(el => /[1-9]\s*\/\s*4/.test(el.textContent))
      expect(strong).toBeTruthy()
    })
  })
})

// ─── Navigation controls ──────────────────────────────────────────────────────
describe('Navigation', () => {
  it('Prev disabled on Q1', async () => {
    renderQuiz()
    await waitForLoad()
    expect(screen.getByRole('button', { name: /Prev/i })).toBeDisabled()
  })

  it('Next navigates to Q2', async () => {
    renderQuiz()
    await waitForLoad()
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => expect(screen.getByText(/Find the range/i)).toBeInTheDocument())
  })

  it('Submit button appears on last question', async () => {
    renderQuiz()
    await waitForLoad()
    const navBtn4 = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4')[0]
    fireEvent.click(navBtn4)
    await waitFor(() => expect(screen.getByText('Submit')).toBeInTheDocument())
  })
})

// ─── Submit gate ──────────────────────────────────────────────────────────────
describe('Submit gate', () => {
  it('Submit is enabled on last question (only disabled while saving)', async () => {
    // IITMMathQuiz submit button is disabled={saving} only — not gated on answered count
    renderQuiz()
    await waitForLoad()
    const navBtn4 = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4')[0]
    fireEvent.click(navBtn4)
    await waitFor(() => screen.getByText('Submit'))
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    expect(submitBtn).not.toBeDisabled()
  })

  it('shows unanswered warning', async () => {
    renderQuiz()
    await waitForLoad()
    const navBtn4 = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '4')[0]
    fireEvent.click(navBtn4)
    await waitFor(() => expect(screen.getByText(/unanswered/i)).toBeInTheDocument())
  })
})

// ─── Submit & Review ─────────────────────────────────────────────────────────
describe('Submit and Review', () => {
  async function answerAllAndSubmit() {
    renderQuiz()
    await waitForLoad()

    // Q1 — click option label (MCQ in IITMMathQuiz uses divs, not radio inputs)
    const opts = screen.getAllByText(/All reals|x neq 0|x > 0|x < 0/)
    fireEvent.click(opts[0].closest('[style]') || opts[0])
    // wait for answered count to register
    await waitFor(() => {
      const strong = [...document.querySelectorAll('strong')].find(el => /1\s*\/\s*4/.test(el.textContent))
      expect(strong).toBeTruthy()
    })

    // Q2 — text input
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="text"]'))
    fireEvent.change(document.querySelector('input[type="text"]'), { target: { value: '[0, inf)' } })

    // Q3 — numeric
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="number"]'))
    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '4' } })

    // Q4 — MSQ
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelectorAll('input[type="checkbox"]').length === 4)
    const cbs = document.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(cbs[1])
    fireEvent.click(cbs[2])
    fireEvent.click(cbs[3])

    // Wait for submit to become enabled then click
    await waitFor(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
      expect(btn).not.toBeDisabled()
    })
    const submitBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')
    fireEvent.click(submitBtn)
  }

  it('shows Review heading after submit', async () => {
    await answerAllAndSubmit()
    await waitFor(
      () => expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 10000 }
    )
  })

  it('shows percentage score', async () => {
    await answerAllAndSubmit()
    await waitFor(() => expect(screen.getByText(/%/)).toBeInTheDocument(), { timeout: 5000 })
  })

  it('posts score to /api/iitmmath_scores', async () => {
    await answerAllAndSubmit()
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/iitmmath_scores'),
        expect.objectContaining({ email: SESSION.email }),
        expect.any(Object)
      ),
      { timeout: 5000 }
    )
  })

  it('Retake reloads questions', async () => {
    await answerAllAndSubmit()
    await waitFor(() => screen.getAllByText(/Review/i), { timeout: 5000 })

    axios.get.mockResolvedValueOnce({ data: { questions: QUESTIONS } })
    fireEvent.click(screen.getByRole('button', { name: /Retake/i }))

    await waitFor(
      () => expect(screen.getByText(/domain of f\(x\)/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ─── BUG: Auto-submit protection ─────────────────────────────────────────────
// Math quiz has 4 questions. Submit appears on Q4 in the same spot as Next.
// These tests confirm the quiz never auto-submits when navigating.
describe('BUG — Math quiz must not auto-submit when navigating', () => {

  it('REAL USER SCENARIO — clicking Next on Q3 must not auto-submit', async () => {
    renderQuiz()
    await waitForLoad()

    // Navigate to Q3 (second to last)
    const navBtn3 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '3'
    )[0]
    fireEvent.click(navBtn3)
    await waitFor(() => screen.getByText(/Question 3 of 4/i))

    // Click Next on Q3 → Q4 where Submit appears in same spot as Next was
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => screen.getByText('Submit'))

    // Submit appeared but quiz NOT submitted
    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('jumping to last question via numbered button does NOT auto-submit', async () => {
    renderQuiz()
    await waitForLoad()

    const navBtn4 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '4'
    )[0]
    fireEvent.click(navBtn4)
    await waitFor(() => screen.getByText('Submit'))

    expect(screen.getByText('Submit')).toBeInTheDocument()
    expect(screen.queryByText(/Review/i)).not.toBeInTheDocument()
  })

  it('pressing Enter in numeric input does NOT submit Math quiz', async () => {
    renderQuiz()
    await waitForLoad()

    // Navigate to Q3 (numeric question)
    const navBtn3 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '3'
    )[0]
    fireEvent.click(navBtn3)
    await waitFor(() => document.querySelector('input[type="number"]'))

    const numInput = document.querySelector('input[type="number"]')
    fireEvent.change(numInput, { target: { value: '4' } })
    fireEvent.keyDown(numInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

    // ReviewPage h1 is "{quizName} — Review". MathPreviewInput also has "ANSWER PREVIEW".
    // Use "— Review" to match only the result page heading, not "ANSWER PREVIEW".
    expect(screen.queryAllByText(/— Review/i).length).toBe(0)
    // Also verify we're still on Q3 (not navigated away by Enter key)
    expect(screen.getByText(/Question 3 of 4/i)).toBeInTheDocument()
  })

  it('pressing Enter in text input does NOT submit Math quiz', async () => {
    renderQuiz()
    await waitForLoad()

    // Navigate to Q2 (text question)
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))
    await waitFor(() => document.querySelector('input[type="text"]'))

    const textInput = document.querySelector('input[type="text"]')
    fireEvent.change(textInput, { target: { value: '[0, inf)' } })
    fireEvent.keyDown(textInput, { key: 'Enter', code: 'Enter', keyCode: 13 })

    expect(screen.queryAllByText(/— Review/i).length).toBe(0)
    expect(screen.getByText(/Question 2 of 4/i)).toBeInTheDocument()
  })

  it('only a deliberate Submit click submits Math quiz', async () => {
    renderQuiz()
    await waitForLoad()

    const navBtn4 = [...document.querySelectorAll('button')].filter(
      b => b.textContent.trim() === '4'
    )[0]
    fireEvent.click(navBtn4)
    await waitFor(() => screen.getByText('Submit'))

    fireEvent.click([...document.querySelectorAll('button')].find(
      b => b.textContent.trim() === 'Submit'
    ))
    await waitFor(
      () => expect(screen.getAllByText(/Review/i).length).toBeGreaterThan(0),
      { timeout: 5000 }
    )
  })
})
