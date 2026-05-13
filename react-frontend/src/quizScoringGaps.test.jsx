/**
 * Gap-filling tests — covers the 3 real holes found in the existing suite:
 *
 * GAP-1  Stats unit tests tested OLD checkCorrect but the component now uses
 *        scoreQuestion (with norm() + IITM partial marking). Tests here go
 *        THROUGH the real component so they catch any scoring logic change.
 *
 * GAP-2  Multi-topic Stats quiz (Quiz 1 Midterm style) was completely untested.
 *
 * GAP-3  PDSA calculateScore edge cases: numerical with spaces, mcq-multiple
 *        partial selection, maxScore > 1 questions.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import StatisticsQuiz from '../pages/courses/StatisticsQuiz'
import PdsaTestQuiz   from '../pages/courses/PDSA/PdsaTestQuiz'

// ─── Router mocks ─────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
let mockTopic  = 'Basics_of_Data'
let mockState  = { quizName: 'Test Quiz' }

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    useParams:   () => ({ topic: mockTopic, weekId: '2' }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockState, pathname: '/test' }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SESSION = { email: 'student@test.com', username: 'student' }

async function waitForLoad() {
  await waitFor(
    () => expect(document.querySelector('.spinner-border')).not.toBeInTheDocument(),
    { timeout: 5000 }
  )
}

function clickMSQOption(cb) { fireEvent.click(cb.parentElement) }

beforeEach(() => {
  vi.clearAllMocks()
  mockTopic = 'Basics_of_Data'
  mockState = { quizName: 'Test Quiz' }
})

// ══════════════════════════════════════════════════════════════════════════════
// GAP-1 — Stats scoreQuestion tested THROUGH the real component
// (so any change to scoreQuestion in the component is immediately caught)
// ══════════════════════════════════════════════════════════════════════════════
describe('GAP-1 — StatisticsQuiz real scoreQuestion (via component)', () => {

  // ── MCQ by index ──────────────────────────────────────────────────────────
  it('MCQ correct answer by index → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'What is 2+2?', type: 'multiple_choice',
      options: ['2', '3', '4', '5'], correct_answer: 2,  // '4'
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    // Select correct answer (index 2)
    const radios = document.querySelectorAll('input[type="radio"]')
    fireEvent.click(radios[2])

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── MCQ wrong answer → 0% ─────────────────────────────────────────────────
  it('MCQ wrong answer → 0%', async () => {
    const q = {
      _id: 'q1', question_text: 'What is 2+2?', type: 'multiple_choice',
      options: ['2', '3', '4', '5'], correct_answer: 2,
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.click(document.querySelectorAll('input[type="radio"]')[0]) // wrong
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── MCQ by option text (correct_answer stored as text, not index) ─────────
  it('MCQ correct_answer as option text → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Capital of India?', type: 'multiple_choice',
      options: ['Mumbai', 'Delhi', 'Chennai'], correct_answer: 'Delhi',
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.click(document.querySelectorAll('input[type="radio"]')[1]) // Delhi
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── Numeric within 1% tolerance ───────────────────────────────────────────
  it('Numeric within 1% default tolerance → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Value of pi?', type: 'numeric',
      correct_answer: '100',  // 1% = ±1
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '100.9' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── Numeric outside 1% tolerance → 0% ────────────────────────────────────
  it('Numeric outside 1% tolerance → 0%', async () => {
    const q = {
      _id: 'q1', question_text: 'Value?', type: 'numeric',
      correct_answer: '100',
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '102' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── Numeric with custom tolerance ─────────────────────────────────────────
  it('Numeric within custom tolerance → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Approx value?', type: 'numeric',
      correct_answer: '10', has_tolerance: true, tolerance_value: 2,
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.change(document.querySelector('input[type="number"]'), { target: { value: '11.9' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── MSQ fully correct → 100% ──────────────────────────────────────────────
  it('MSQ all correct options selected → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Which are even?', type: 'multiple_select',
      options: ['1', '2', '4', '5'], correct_answer: [1, 2],  // '2' and '4'
      difficulty: 'medium', topic: 'Basics of Data', points: 2,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    const cbs = document.querySelectorAll('input[type="checkbox"]')
    clickMSQOption(cbs[1])   // '2'
    clickMSQOption(cbs[2])   // '4'
    await waitFor(() => expect(cbs[1].checked).toBe(true))

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── MSQ partial selection → partial score (not 100%) ─────────────────────
  it('MSQ only one correct option selected → NOT 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Which are even?', type: 'multiple_select',
      options: ['1', '2', '4', '5'], correct_answer: [1, 2],
      difficulty: 'medium', topic: 'Basics of Data', points: 2,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    const cbs = document.querySelectorAll('input[type="checkbox"]')
    clickMSQOption(cbs[1])   // only '2' — missing '4'

    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => {
      expect(screen.queryByText('100%')).not.toBeInTheDocument()
    }, { timeout: 5000 })
  })

  // ── Text answer case-insensitive (norm()) ─────────────────────────────────
  it('Text answer is case-insensitive via norm() → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'Name the set?', type: 'text_input',
      correct_answer: 'Real Numbers',
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.change(document.querySelector('input[type="text"]'), { target: { value: 'real numbers' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── Alternative answers ───────────────────────────────────────────────────
  it('Alternative text answer accepted → 100%', async () => {
    const q = {
      _id: 'q1', question_text: 'What is the set of non-negative integers?',
      type: 'text_input', correct_answer: 'natural numbers',
      alternative_answers: ['whole numbers', 'N'],
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    fireEvent.change(document.querySelector('input[type="text"]'), { target: { value: 'whole numbers' } })
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
  })

  // ── No answer → 0% ───────────────────────────────────────────────────────
  it('No answer submitted → 0%', async () => {
    const q = {
      _id: 'q1', question_text: 'What is 2+2?', type: 'multiple_choice',
      options: ['2', '3', '4', '5'], correct_answer: 2,
      difficulty: 'easy', topic: 'Basics of Data', points: 1,
    }
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [q] } })
    axios.post.mockResolvedValue({ data: { success: true } })
    render(<StatisticsQuiz />)
    await waitForLoad()

    // Don't select anything — just submit
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }))
    await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument(), { timeout: 5000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GAP-2 — Multi-topic Stats quiz (Quiz 1 Midterm style)
// ══════════════════════════════════════════════════════════════════════════════
describe('GAP-2 — StatisticsQuiz multi-topic mode', () => {

  const MULTI_TOPICS = [
    { name: 'Basics of Data',       endpoint: 'Basics_of_Data' },
    { name: 'Descriptive Statistics', endpoint: 'Descriptive_Statistics' },
  ]

  const Q_TOPIC1 = [{
    _id: 't1q1', question_text: 'Q from Topic 1', type: 'multiple_choice',
    options: ['A', 'B'], correct_answer: 0, difficulty: 'easy',
    topic: 'Basics of Data', points: 1,
  }]
  const Q_TOPIC2 = [{
    _id: 't2q1', question_text: 'Q from Topic 2', type: 'numeric',
    correct_answer: '5', difficulty: 'easy',
    topic: 'Descriptive Statistics', points: 1,
  }]

  beforeEach(() => {
    mockState = {
      quizName: 'Quiz 1 Midterm',
      topics: MULTI_TOPICS,
      countPerTopic: 1,
    }
  })

  it('fetches questions from BOTH topic endpoints', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })                              // session
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC1 } })             // topic 1
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC2 } })             // topic 2
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Two question-fetch calls should have happened (one per topic)
    const getCalls = axios.get.mock.calls.map(c => c[0])
    const topicCalls = getCalls.filter(url => url.includes('iitm-stats-questions'))
    expect(topicCalls.length).toBe(2)
    expect(topicCalls[0]).toContain('Basics_of_Data')
    expect(topicCalls[1]).toContain('Descriptive_Statistics')
  })

  it('shows questions from both topics in the quiz', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC1 } })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC2 } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Both questions should be navigable (2 total)
    expect(screen.getByText(/Question \d+ of 2/i)).toBeInTheDocument()
  })

  it('shows Quiz 1 Midterm name in heading', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC1 } })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC2 } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Heading h1 specifically — breadcrumb also has the name
    expect(screen.getByRole('heading', { name: /Quiz 1 Midterm/i })).toBeInTheDocument()
  })

  it('shows a topic badge from one of the loaded topics', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC1 } })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC2 } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Questions are shuffled, so Q1 may be from either topic.
    // At least one of the two topic names must appear as a badge.
    const badges = [...document.querySelectorAll('.badge')]
    const topicBadge = badges.find(b =>
      ['Basics of Data', 'Descriptive Statistics'].includes(b.textContent.trim())
    )
    expect(topicBadge).toBeTruthy()
  })

  it('handles one topic returning empty gracefully', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: Q_TOPIC1 } })
      .mockResolvedValueOnce({ data: { questions: [] } })          // topic 2 empty
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitForLoad()

    // Should still show questions from topic 1
    expect(screen.getByText(/Question \d+ of 1/i)).toBeInTheDocument()
  })

  it('shows error when ALL topics return empty', async () => {
    axios.get
      .mockResolvedValueOnce({ data: SESSION })
      .mockResolvedValueOnce({ data: { questions: [] } })
      .mockResolvedValueOnce({ data: { questions: [] } })
    axios.post.mockResolvedValue({ data: { success: true } })

    render(<StatisticsQuiz />)
    await waitFor(() =>
      expect(screen.getByText(/No questions found/i)).toBeInTheDocument(),
      { timeout: 5000 }
    )
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// GAP-3 — PDSA calculateScore edge cases
// ══════════════════════════════════════════════════════════════════════════════

// Replicate calculateScore exactly from PdsaTestQuiz.jsx
function calculateScore(questions, answers) {
  let score = 0, totalPossible = 0
  const breakdown = []
  questions.forEach(q => {
    const max = q.maxScore || 1
    totalPossible += max
    const ua = answers[q.questionId]
    let earned = 0
    if (q.type === 'mcq-single') {
      if (ua === q.correctAnswer) earned = max
    } else if (q.type === 'mcq-multiple') {
      const ua2 = Array.isArray(ua) ? [...ua].sort() : []
      const ca2 = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : []
      if (JSON.stringify(ua2) === JSON.stringify(ca2)) earned = max
    } else if (q.type === 'numerical') {
      if (String(ua || '').trim() === String(q.correctAnswer).trim()) earned = max
    }
    score += earned
    breakdown.push({ questionId: q.questionId, earned, max })
  })
  return { score, totalPossible, breakdown }
}

describe('GAP-3 — PDSA calculateScore edge cases', () => {

  // ── MCQ-single ─────────────────────────────────────────────────────────────
  it('mcq-single: correct answer → full score', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: 'O(log n)', maxScore: 1 }]
    const { score, totalPossible } = calculateScore(qs, { q1: 'O(log n)' })
    expect(score).toBe(1)
    expect(totalPossible).toBe(1)
  })

  it('mcq-single: wrong answer → 0', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: 'O(log n)', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: 'O(n)' })
    expect(score).toBe(0)
  })

  it('mcq-single: unanswered → 0', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: 'O(log n)', maxScore: 1 }]
    const { score } = calculateScore(qs, {})
    expect(score).toBe(0)
  })

  it('mcq-single: maxScore = 3 → correct gives 3', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: 'Yes', maxScore: 3 }]
    const { score, totalPossible } = calculateScore(qs, { q1: 'Yes' })
    expect(score).toBe(3)
    expect(totalPossible).toBe(3)
  })

  // ── MCQ-multiple ───────────────────────────────────────────────────────────
  it('mcq-multiple: exact match → full score', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-multiple', correctAnswer: ['Array', 'Queue'], maxScore: 2 }]
    const { score } = calculateScore(qs, { q1: ['Array', 'Queue'] })
    expect(score).toBe(2)
  })

  it('mcq-multiple: correct answer in different order → full score (sort handles it)', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-multiple', correctAnswer: ['Array', 'Queue'], maxScore: 2 }]
    const { score } = calculateScore(qs, { q1: ['Queue', 'Array'] })
    expect(score).toBe(2)
  })

  it('mcq-multiple: partial selection → 0 (PDSA is exact match, not partial)', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-multiple', correctAnswer: ['Array', 'Queue'], maxScore: 2 }]
    const { score } = calculateScore(qs, { q1: ['Array'] })   // missing Queue
    expect(score).toBe(0)
  })

  it('mcq-multiple: extra wrong option selected → 0', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-multiple', correctAnswer: ['Array', 'Queue'], maxScore: 2 }]
    const { score } = calculateScore(qs, { q1: ['Array', 'Queue', 'Tree'] })
    expect(score).toBe(0)
  })

  it('mcq-multiple: unanswered → 0', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-multiple', correctAnswer: ['Array'], maxScore: 2 }]
    const { score } = calculateScore(qs, {})
    expect(score).toBe(0)
  })

  // ── Numerical ──────────────────────────────────────────────────────────────
  it('numerical: exact string match → full score', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: '7' })
    expect(score).toBe(1)
  })

  it('numerical: answer with trailing space → full score (trim() applied)', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: ' 7 ' })
    expect(score).toBe(1)
  })

  it('numerical: answer with leading space → full score', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: ' 7 ', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: '7' })
    expect(score).toBe(1)
  })

  it('numerical: wrong number → 0', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: '8' })
    expect(score).toBe(0)
  })

  it('numerical: unanswered → 0', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, {})
    expect(score).toBe(0)
  })

  it('numerical: maxScore = 5 → correct gives 5', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '42', maxScore: 5 }]
    const { score, totalPossible } = calculateScore(qs, { q1: '42' })
    expect(score).toBe(5)
    expect(totalPossible).toBe(5)
  })

  // ── Mixed question types ───────────────────────────────────────────────────
  it('mixed quiz: only some correct → correct partial score', () => {
    const qs = [
      { questionId: 'q1', type: 'mcq-single',   correctAnswer: 'A',   maxScore: 1 },
      { questionId: 'q2', type: 'mcq-multiple',  correctAnswer: ['X'], maxScore: 2 },
      { questionId: 'q3', type: 'numerical',     correctAnswer: '5',   maxScore: 1 },
    ]
    const answers = {
      q1: 'A',   // correct → 1
      q2: ['Y'], // wrong   → 0
      q3: '5',   // correct → 1
    }
    const { score, totalPossible } = calculateScore(qs, answers)
    expect(score).toBe(2)
    expect(totalPossible).toBe(4)
  })

  it('all unanswered → score 0, totalPossible is sum of maxScores', () => {
    const qs = [
      { questionId: 'q1', type: 'mcq-single',  correctAnswer: 'A', maxScore: 2 },
      { questionId: 'q2', type: 'numerical',   correctAnswer: '3', maxScore: 3 },
    ]
    const { score, totalPossible } = calculateScore(qs, {})
    expect(score).toBe(0)
    expect(totalPossible).toBe(5)
  })

  // ── Verify THROUGH the component (not just the duplicate function) ─────────
  describe('PDSA calculateScore — through real component', () => {
    function mockFetch(questions) {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true, questions }) })
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })
    }

    afterEach(() => { delete global.fetch })

    it('all correct via component → 100%', async () => {
      // Use multi-word options so they don't clash with the letter badge ('A','B','C')
      const qs = [
        { questionId: 'p1', title: 'Big-O question', type: 'mcq-single',
          options: ['O(n)', 'O(log n)', 'O(n²)'], correctAnswer: 'O(log n)', maxScore: 1 },
      ]
      axios.get.mockResolvedValueOnce({ data: SESSION })
      mockFetch(qs)
      render(<PdsaTestQuiz />)

      await waitFor(() => screen.getByText(/Question 1 of 1/i), { timeout: 5000 })

      // Click correct option
      const opt = screen.getByText('O(log n)')
      fireEvent.click(opt.closest('[style*="cursor"]') || opt)

      await waitFor(() => screen.getByText('Submit Quiz'))
      fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))

      await waitFor(() => expect(screen.getByText('100%')).toBeInTheDocument(), { timeout: 5000 })
    })

    it('wrong answer via component → 0%', async () => {
      const qs = [
        { questionId: 'p1', title: 'Big-O question', type: 'mcq-single',
          options: ['O(n)', 'O(log n)', 'O(n²)'], correctAnswer: 'O(log n)', maxScore: 1 },
      ]
      axios.get.mockResolvedValueOnce({ data: SESSION })
      mockFetch(qs)
      render(<PdsaTestQuiz />)

      await waitFor(() => screen.getByText(/Question 1 of 1/i), { timeout: 5000 })

      // Click wrong option
      const opt = screen.getByText('O(n)')
      fireEvent.click(opt.closest('[style*="cursor"]') || opt)

      await waitFor(() => screen.getByText('Submit Quiz'))
      fireEvent.click(screen.getByRole('button', { name: /Submit Quiz/i }))

      await waitFor(() => expect(screen.getByText('0%')).toBeInTheDocument(), { timeout: 5000 })
    })
  })
})
