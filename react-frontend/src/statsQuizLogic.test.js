/**
 * Unit tests for StatisticsQuiz pure logic functions.
 * These functions are extracted verbatim from StatisticsQuiz.jsx so the tests
 * stay honest — if the component logic changes, update here too.
 */
import { describe, it, expect } from 'vitest'

// ─── Extracted from StatisticsQuiz.jsx ────────────────────────────────────────

function isAnswered(a) {
  if (a === undefined || a === null) return false
  if (typeof a === 'number') return true
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return a.length > 0
  return false
}

function checkCorrect(question, userAnswer) {
  const ca   = question.correct_answer
  const alts = question.alternative_answers || []
  const type = question.type

  if (type === 'multiple_choice' || type === 'mcq') {
    const caIdx = typeof ca === 'string' ? parseInt(ca) : ca
    const uaIdx = typeof userAnswer === 'string' ? parseInt(userAnswer) : userAnswer
    return uaIdx === caIdx
  }

  if (type === 'multiple_select') {
    if (!Array.isArray(userAnswer)) return false
    const ua  = [...userAnswer].map(Number).sort((a, b) => a - b)
    const exp = (Array.isArray(ca) ? ca : [ca]).map(Number).sort((a, b) => a - b)
    return JSON.stringify(ua) === JSON.stringify(exp)
  }

  if (type === 'numeric' || type === 'numeric_input') {
    const uNum = parseFloat(userAnswer)
    const cNum = parseFloat(ca)
    if (isNaN(uNum) || isNaN(cNum)) return false
    const tol = question.has_tolerance && question.tolerance_value > 0
      ? question.tolerance_value
      : 0.001
    if (Math.abs(uNum - cNum) <= tol) return true
    return alts.some(a => Math.abs(uNum - parseFloat(a)) <= tol)
  }

  // text / everything else
  const ua   = String(userAnswer || '').trim().toLowerCase()
  const cStr = String(ca || '').trim().toLowerCase()
  return ua === cStr || alts.some(a => String(a).trim().toLowerCase() === ua)
}

// ─── doSubmit score calculation (inline replica) ──────────────────────────────
function calcResults(questions, answers) {
  const questionResults = questions.map(q => {
    const ua = answers[q._id]
    return {
      questionId: q._id,
      isCorrect:  checkCorrect(q, ua),
    }
  })
  const score      = questionResults.filter(r => r.isCorrect).length
  const percentage = Math.round((score / questions.length) * 100)
  return { score, percentage, questionResults }
}

// ─── isAnswered ───────────────────────────────────────────────────────────────
describe('isAnswered', () => {
  it('index 0 (number) is answered', () => expect(isAnswered(0)).toBe(true))
  it('index 3 (number) is answered', () => expect(isAnswered(3)).toBe(true))
  it('non-empty string is answered',  () => expect(isAnswered('3.14')).toBe(true))
  it('whitespace-only string is NOT', () => expect(isAnswered('   ')).toBe(false))
  it('empty string is NOT answered',  () => expect(isAnswered('')).toBe(false))
  it('non-empty array is answered',   () => expect(isAnswered([0, 2])).toBe(true))
  it('empty array is NOT answered',   () => expect(isAnswered([])).toBe(false))
  it('null is NOT answered',          () => expect(isAnswered(null)).toBe(false))
  it('undefined is NOT answered',     () => expect(isAnswered(undefined)).toBe(false))
})

// ─── checkCorrect — MCQ ───────────────────────────────────────────────────────
describe('checkCorrect — multiple_choice', () => {
  const q = {
    type: 'multiple_choice',
    correct_answer: 2,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
  }

  it('correct index as number',  () => expect(checkCorrect(q, 2)).toBe(true))
  it('correct index as string',  () => expect(checkCorrect(q, '2')).toBe(true))
  it('wrong index',              () => expect(checkCorrect(q, 1)).toBe(false))
  it('wrong index as string',    () => expect(checkCorrect(q, '0')).toBe(false))
  it('null answer is wrong',     () => expect(checkCorrect(q, null)).toBe(false))
  it('undefined answer is wrong',() => expect(checkCorrect(q, undefined)).toBe(false))

  it('correct_answer stored as string index', () => {
    const q2 = { type: 'multiple_choice', correct_answer: '1', options: ['A', 'B', 'C'] }
    expect(checkCorrect(q2, 1)).toBe(true)
    expect(checkCorrect(q2, '1')).toBe(true)
    expect(checkCorrect(q2, 0)).toBe(false)
  })

  it('mcq type alias behaves identically', () => {
    const qm = { type: 'mcq', correct_answer: 0, options: ['A', 'B'] }
    expect(checkCorrect(qm, 0)).toBe(true)
    expect(checkCorrect(qm, '0')).toBe(true)
    expect(checkCorrect(qm, 1)).toBe(false)
  })
})

// ─── checkCorrect — Multiple Select ──────────────────────────────────────────
describe('checkCorrect — multiple_select', () => {
  const q = {
    type: 'multiple_select',
    correct_answer: [0, 2],
    options: ['A', 'B', 'C', 'D'],
  }

  it('exact match',               () => expect(checkCorrect(q, [0, 2])).toBe(true))
  it('order-independent match',   () => expect(checkCorrect(q, [2, 0])).toBe(true))
  it('partial selection = wrong', () => expect(checkCorrect(q, [0])).toBe(false))
  it('extra selection = wrong',   () => expect(checkCorrect(q, [0, 1, 2])).toBe(false))
  it('completely wrong',          () => expect(checkCorrect(q, [1, 3])).toBe(false))
  it('non-array answer = false',  () => expect(checkCorrect(q, 0)).toBe(false))
  it('empty array = false',       () => expect(checkCorrect(q, [])).toBe(false))

  it('single correct option stored as scalar', () => {
    const q2 = { type: 'multiple_select', correct_answer: 1, options: ['A', 'B', 'C'] }
    expect(checkCorrect(q2, [1])).toBe(true)
    expect(checkCorrect(q2, [0])).toBe(false)
  })

  it('string indices are coerced', () => {
    expect(checkCorrect(q, ['0', '2'])).toBe(true)
  })
})

// ─── checkCorrect — Numeric ───────────────────────────────────────────────────
describe('checkCorrect — numeric', () => {
  it('exact integer match',     () => {
    const q = { type: 'numeric', correct_answer: '42' }
    expect(checkCorrect(q, '42')).toBe(true)
    expect(checkCorrect(q, 42)).toBe(true)
  })

  it('exact float match',       () => {
    const q = { type: 'numeric', correct_answer: '3.14' }
    expect(checkCorrect(q, '3.14')).toBe(true)
  })

  it('within default tolerance (0.001)', () => {
    const q = { type: 'numeric', correct_answer: '10' }
    expect(checkCorrect(q, '10.0009')).toBe(true)
    expect(checkCorrect(q, '10.002')).toBe(false)
  })

  it('within custom tolerance', () => {
    const q = { type: 'numeric', correct_answer: '5', has_tolerance: true, tolerance_value: 0.5 }
    expect(checkCorrect(q, '5.4')).toBe(true)
    expect(checkCorrect(q, '5.6')).toBe(false)
    expect(checkCorrect(q, '4.5')).toBe(true)
    expect(checkCorrect(q, '4.49')).toBe(false)
  })

  it('tolerance_value 0 falls back to default 0.001', () => {
    const q = { type: 'numeric', correct_answer: '7', has_tolerance: true, tolerance_value: 0 }
    expect(checkCorrect(q, '7.0009')).toBe(true)
    expect(checkCorrect(q, '7.002')).toBe(false)
  })

  it('NaN user answer = false', () => {
    const q = { type: 'numeric', correct_answer: '5' }
    expect(checkCorrect(q, 'abc')).toBe(false)
    expect(checkCorrect(q, '')).toBe(false)
    expect(checkCorrect(q, null)).toBe(false)
  })

  it('numeric_input type alias', () => {
    const q = { type: 'numeric_input', correct_answer: '99' }
    expect(checkCorrect(q, '99')).toBe(true)
    expect(checkCorrect(q, '98')).toBe(false)
  })

  it('matches alternative numeric answers', () => {
    const q = {
      type: 'numeric',
      correct_answer: '1',
      alternative_answers: ['1.0', '1.00'],
    }
    expect(checkCorrect(q, '1.0')).toBe(true)
    expect(checkCorrect(q, '1.00')).toBe(true)
    expect(checkCorrect(q, '2')).toBe(false)
  })

  it('negative numbers', () => {
    const q = { type: 'numeric', correct_answer: '-3' }
    expect(checkCorrect(q, '-3')).toBe(true)
    expect(checkCorrect(q, '3')).toBe(false)
  })

  it('zero is a valid correct answer', () => {
    const q = { type: 'numeric', correct_answer: '0' }
    expect(checkCorrect(q, '0')).toBe(true)
    expect(checkCorrect(q, '1')).toBe(false)
  })
})

// ─── checkCorrect — Text ──────────────────────────────────────────────────────
describe('checkCorrect — text', () => {
  it('exact match',          () => {
    const q = { type: 'text_input', correct_answer: 'Paris' }
    expect(checkCorrect(q, 'Paris')).toBe(true)
  })

  it('case-insensitive',     () => {
    const q = { type: 'text_input', correct_answer: 'Paris' }
    expect(checkCorrect(q, 'paris')).toBe(true)
    expect(checkCorrect(q, 'PARIS')).toBe(true)
  })

  it('leading/trailing space stripped', () => {
    const q = { type: 'text_input', correct_answer: 'yes' }
    expect(checkCorrect(q, '  yes  ')).toBe(true)
  })

  it('wrong text answer',    () => {
    const q = { type: 'text_input', correct_answer: 'yes' }
    expect(checkCorrect(q, 'no')).toBe(false)
  })

  it('matches alternative text answers', () => {
    const q = {
      type: 'text_input',
      correct_answer: 'correct',
      alternative_answers: ['right', 'true'],
    }
    expect(checkCorrect(q, 'right')).toBe(true)
    expect(checkCorrect(q, 'TRUE')).toBe(true)   // case-insensitive alt
    expect(checkCorrect(q, 'wrong')).toBe(false)
  })

  it('empty user answer is wrong', () => {
    const q = { type: 'text_input', correct_answer: 'yes' }
    expect(checkCorrect(q, '')).toBe(false)
    expect(checkCorrect(q, null)).toBe(false)
  })
})

// ─── calcResults ─────────────────────────────────────────────────────────────
describe('calcResults (score calculation)', () => {
  const questions = [
    { _id: 'q1', type: 'multiple_choice', correct_answer: 0, options: ['A', 'B'] },
    { _id: 'q2', type: 'numeric', correct_answer: '10' },
    { _id: 'q3', type: 'multiple_select', correct_answer: [0, 1], options: ['A', 'B', 'C'] },
    { _id: 'q4', type: 'text_input', correct_answer: 'hello' },
  ]

  it('all correct → 100%', () => {
    const answers = { q1: 0, q2: '10', q3: [0, 1], q4: 'hello' }
    const { score, percentage } = calcResults(questions, answers)
    expect(score).toBe(4)
    expect(percentage).toBe(100)
  })

  it('all wrong → 0%', () => {
    const answers = { q1: 1, q2: '99', q3: [2], q4: 'bye' }
    const { score, percentage } = calcResults(questions, answers)
    expect(score).toBe(0)
    expect(percentage).toBe(0)
  })

  it('half correct → 50%', () => {
    const answers = { q1: 0, q2: '10', q3: [2], q4: 'bye' }
    const { score, percentage } = calcResults(questions, answers)
    expect(score).toBe(2)
    expect(percentage).toBe(50)
  })

  it('unanswered questions count as wrong', () => {
    const answers = { q1: 0 }
    const { score, percentage } = calcResults(questions, answers)
    expect(score).toBe(1)
    expect(percentage).toBe(25)
  })
})
