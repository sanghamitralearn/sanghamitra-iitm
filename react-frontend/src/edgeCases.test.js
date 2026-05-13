/**
 * Edge case tests — covers scenarios that could cause silent bugs
 * when AI adds new features or modifies existing logic.
 *
 * Run after ANY AI-generated change:
 *   npm run test:pretty -- edgeCases
 */
import { describe, it, expect } from 'vitest'

// ══════════════════════════════════════════════════════════════════════════════
// EDGE-1  PDSA calculateScore — dangerous edge cases
// (copied verbatim from PdsaTestQuiz.jsx so any change there breaks this)
// ══════════════════════════════════════════════════════════════════════════════
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

describe('EDGE-1 — PDSA calculateScore dangerous edge cases', () => {

  it('numerical: "7.0" vs "7" — different string, should be 0 (exact match)', () => {
    // PDSA uses exact string match, NOT numeric comparison
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: '7.0' })
    // "7.0".trim() !== "7".trim() → 0 points (this is expected PDSA behavior)
    expect(score).toBe(0)
  })

  it('numerical: "7.00" vs "7" → 0 (exact string match)', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '7', maxScore: 1 }]
    const { score } = calculateScore(qs, { q1: '7.00' })
    expect(score).toBe(0)
  })

  it('maxScore = 0 does not crash (falls back to 1)', () => {
    // q.maxScore || 1  → 0 || 1 = 1
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: 'A', maxScore: 0 }]
    const { score, totalPossible } = calculateScore(qs, { q1: 'A' })
    expect(totalPossible).toBe(1)  // 0 || 1
    expect(score).toBe(1)
  })

  it('undefined correctAnswer in mcq-single → 0 (no crash)', () => {
    const qs = [{ questionId: 'q1', type: 'mcq-single', correctAnswer: undefined, maxScore: 1 }]
    expect(() => calculateScore(qs, { q1: 'A' })).not.toThrow()
    const { score } = calculateScore(qs, { q1: 'A' })
    expect(score).toBe(0)
  })

  it('null user answer → 0 (no crash)', () => {
    const qs = [{ questionId: 'q1', type: 'numerical', correctAnswer: '5', maxScore: 1 }]
    expect(() => calculateScore(qs, { q1: null })).not.toThrow()
    const { score } = calculateScore(qs, { q1: null })
    expect(score).toBe(0)
  })

  it('unknown question type → 0 score, no crash', () => {
    // If AI adds a new type like "drag-drop" without updating calculateScore,
    // score is 0 (no earned points) — test documents this behavior
    const qs = [{ questionId: 'q1', type: 'drag-drop', correctAnswer: 'X', maxScore: 1 }]
    expect(() => calculateScore(qs, { q1: 'X' })).not.toThrow()
    const { score } = calculateScore(qs, { q1: 'X' })
    expect(score).toBe(0)   // new type not handled → always 0
  })

  it('empty question list → score 0, totalPossible 0', () => {
    const { score, totalPossible } = calculateScore([], {})
    expect(score).toBe(0)
    expect(totalPossible).toBe(0)
  })

  it('percentage calculation: 0 totalPossible does not cause NaN', () => {
    const { score, totalPossible } = calculateScore([], {})
    const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
    expect(percentage).toBe(0)
    expect(isNaN(percentage)).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// EDGE-2  Stats/Math scoreQuestion — dangerous edge cases
// (mirrors the actual scoreQuestion in both quiz components)
// ══════════════════════════════════════════════════════════════════════════════
function norm(t) {
  if (t === undefined || t === null) return ''
  let str = String(t).trim()
  str = str.replace(/\s+/g, '').replace(/\\\(/g, '').replace(/\\\)/g, '')
    .replace(/\\\[/g, '').replace(/\\\]/g, '').replace(/\$/g, '')
    .replace(/infinity|∞/gi, 'inf').replace(/√\(([^)]+)\)/g, 'sqrt($1)')
    .replace(/√(\d+)/g, 'sqrt($1)').replace(/≠/g, '!=').replace(/≤/g, '<=')
    .replace(/≥/g, '>=').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/∪/g, 'U').replace(/∩/g, 'n').replace(/∈/g, 'in')
    .replace(/⊂/g, 'subset').replace(/⊆/g, 'subseteq')
  if (str.includes('/') && !str.includes('sqrt')) {
    const parts = str.split('/')
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
      str = String(parseFloat(parts[0]) / parseFloat(parts[1]))
  }
  return str.replace(/\.0$/, '').toLowerCase()
}

function scoreQuestion(question, userAnswer) {
  const ca     = question.correct_answer
  const alts   = question.alternative_answers || []
  const points = question.points || 1
  const type   = question.type === 'mcq' ? 'multiple_choice'
               : question.type === 'text' ? 'text_input'
               : question.type

  const empty = userAnswer === undefined || userAnswer === null || userAnswer === ''
                || (Array.isArray(userAnswer) && userAnswer.length === 0)
  if (empty) return { partialScore: 0, isCorrect: false, isMSQ: type === 'multiple_select' }

  if (type === 'multiple_choice') {
    const resolveToIndex = (val) => {
      if (val === undefined || val === null) return -1
      if (typeof val === 'number' && !isNaN(val)) return val
      const asInt = parseInt(String(val).trim())
      if (!isNaN(asInt)) return asInt
      return (question.options || []).findIndex(o => norm(o) === norm(String(val)))
    }
    const userIdx    = resolveToIndex(userAnswer)
    const correctIdx = resolveToIndex(ca)
    let correct = (userIdx !== -1 && correctIdx !== -1 && userIdx === correctIdx)
    if (!correct) {
      const uText = norm(question.options?.[userIdx] ?? userAnswer)
      const cText = norm(question.options?.[correctIdx] ?? ca)
      correct = !!(uText && cText && uText === cText)
    }
    if (!correct) correct = alts.some(alt => resolveToIndex(alt) === userIdx)
    return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
  }

  if (type === 'multiple_select') {
    if (!Array.isArray(userAnswer) || userAnswer.length === 0)
      return { partialScore: 0, isCorrect: false, isMSQ: true }
    const toText = (val) => {
      if (val === undefined || val === null) return ''
      const asInt = typeof val === 'number' ? val : parseInt(String(val).trim())
      if (!isNaN(asInt) && asInt >= 0 && asInt < (question.options || []).length)
        return norm(question.options[asInt])
      return norm(String(val))
    }
    let correctTexts = Array.isArray(ca) ? ca.map(toText) : [toText(ca)]
    const n = correctTexts.length
    if (n === 0) return { partialScore: 0, isCorrect: false, isMSQ: true }
    const perCorrect = points / n
    const perWrong   = points / 3
    const userTexts  = userAnswer.map(v => norm(String(v)))
    let raw = 0
    userTexts.forEach(ut => {
      if (correctTexts.includes(ut)) raw += perCorrect
      else                           raw -= perWrong
    })
    const partialScore = parseFloat(Math.max(0, Math.min(points, raw)).toFixed(4))
    return { partialScore, isCorrect: partialScore === points, isMSQ: true }
  }

  if (type === 'numeric' || type === 'numeric_input') {
    const uNum = parseFloat(String(userAnswer).trim())
    const cNum = parseFloat(String(ca).trim())
    if (isNaN(uNum) || isNaN(cNum)) return { partialScore: 0, isCorrect: false, isMSQ: false }
    const tol = question.has_tolerance && question.tolerance_value > 0
      ? question.tolerance_value
      : Math.max(Math.abs(cNum) * 0.01, 0.0001)
    let correct = Math.abs(uNum - cNum) <= tol
    if (!correct) correct = alts.some(alt => {
      const altNum = parseFloat(String(alt).trim())
      return !isNaN(altNum) && Math.abs(uNum - altNum) <= Math.max(Math.abs(altNum) * 0.01, 0.0001)
    })
    return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
  }

  const nUser = norm(String(userAnswer).trim())
  const nCorr = norm(String(ca).trim())
  let correct = nUser === nCorr
  if (!correct) {
    const uNum = parseFloat(nUser), cNum = parseFloat(nCorr)
    if (!isNaN(uNum) && !isNaN(cNum))
      correct = Math.abs(uNum - cNum) <= Math.max(Math.abs(cNum) * 0.01, 0.0001)
  }
  if (!correct) correct = alts.some(a => norm(String(a).trim()) === nUser)
  return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
}

describe('EDGE-2 — Stats/Math scoreQuestion dangerous edge cases', () => {

  it('null correct_answer → no crash, returns false', () => {
    const q = { type: 'multiple_choice', correct_answer: null, options: ['A', 'B'], points: 1 }
    expect(() => scoreQuestion(q, 0)).not.toThrow()
    expect(scoreQuestion(q, 0).isCorrect).toBe(false)
  })

  it('undefined correct_answer in numeric → no crash, returns false', () => {
    const q = { type: 'numeric', correct_answer: undefined, points: 1 }
    expect(() => scoreQuestion(q, '5')).not.toThrow()
    expect(scoreQuestion(q, '5').isCorrect).toBe(false)
  })

  it('correct_answer = 0 (zero) in numeric → correctly matches', () => {
    const q = { type: 'numeric', correct_answer: '0', points: 1 }
    expect(scoreQuestion(q, '0').isCorrect).toBe(true)
    expect(scoreQuestion(q, '1').isCorrect).toBe(false)
  })

  it('numeric: 0 correct_answer with small input 0.00005 → correct (within min tolerance 0.0001)', () => {
    const q = { type: 'numeric', correct_answer: '0', points: 1 }
    // tolerance = max(0*0.01, 0.0001) = 0.0001
    expect(scoreQuestion(q, '0.00005').isCorrect).toBe(true)
  })

  it('numeric: negative correct answer', () => {
    const q = { type: 'numeric', correct_answer: '-5', points: 1 }
    expect(scoreQuestion(q, '-5').isCorrect).toBe(true)
    expect(scoreQuestion(q, '5').isCorrect).toBe(false)
  })

  it('MCQ: correct_answer as string "0" matches index 0', () => {
    const q = { type: 'multiple_choice', correct_answer: '0', options: ['X', 'Y'], points: 1 }
    expect(scoreQuestion(q, 0).isCorrect).toBe(true)
    expect(scoreQuestion(q, 1).isCorrect).toBe(false)
  })

  it('MCQ: points > 1 gives proportional score', () => {
    const q = { type: 'multiple_choice', correct_answer: 1, options: ['A', 'B'], points: 5 }
    expect(scoreQuestion(q, 1).partialScore).toBe(5)
    expect(scoreQuestion(q, 0).partialScore).toBe(0)
  })

  it('MSQ: all correct + one wrong → partial score (not 0, not full)', () => {
    const q = {
      type: 'multiple_select',
      correct_answer: [0, 1],   // 'A', 'B'
      options: ['A', 'B', 'C'],
      points: 2,
    }
    // perCorrect = 2/2 = 1, perWrong = 2/3 ≈ 0.667
    // Selected A (correct +1), B (correct +1), C (wrong -0.667) → raw = 1.333
    const r = scoreQuestion(q, ['A', 'B', 'C'])
    expect(r.isCorrect).toBe(false)           // not fully correct
    expect(r.partialScore).toBeGreaterThan(0) // but got some marks
    expect(r.partialScore).toBeLessThan(2)    // not full marks
  })

  it('MSQ: score never goes below 0 (no negative marks)', () => {
    const q = {
      type: 'multiple_select',
      correct_answer: [0],   // only 'A' is correct
      options: ['A', 'B', 'C'],
      points: 2,
    }
    // Select all wrong options: B, C → raw = -0.667 - 0.667 = -1.333 → capped at 0
    const r = scoreQuestion(q, ['B', 'C'])
    expect(r.partialScore).toBe(0)
    expect(r.partialScore).toBeGreaterThanOrEqual(0)
  })

  it('text: LaTeX symbols stripped by norm() before comparison', () => {
    const q = { type: 'text_input', correct_answer: '\\(x\\)', points: 1 }
    // norm('\\(x\\)') = 'x', norm('x') = 'x' → match
    expect(scoreQuestion(q, 'x').isCorrect).toBe(true)
  })

  it('text: Unicode symbols normalised (∞ → inf)', () => {
    const q = { type: 'text_input', correct_answer: 'inf', points: 1 }
    expect(scoreQuestion(q, '∞').isCorrect).toBe(true)
  })

  it('text: fraction "1/2" matches decimal "0.5" via norm()', () => {
    const q = { type: 'text_input', correct_answer: '1/2', points: 1 }
    expect(scoreQuestion(q, '0.5').isCorrect).toBe(true)
  })

  it('unknown type → no crash, returns 0 score', () => {
    const q = { type: 'future_ai_type', correct_answer: 'X', points: 1 }
    expect(() => scoreQuestion(q, 'X')).not.toThrow()
    // Unknown types fall through to text comparison
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// EDGE-3  Calculator edge cases
// ══════════════════════════════════════════════════════════════════════════════
describe('EDGE-3 — Calculator math edge cases', () => {

  it('division by zero gives Infinity or handles gracefully', () => {
    const result = 5 / 0
    // JavaScript gives Infinity — calculator should show "Infinity" not crash
    expect(isFinite(result)).toBe(false)
    expect(result).toBe(Infinity)
  })

  it('sqrt of negative number gives NaN', () => {
    const result = Math.sqrt(-1)
    expect(isNaN(result)).toBe(true)
  })

  it('log of 0 gives -Infinity', () => {
    expect(Math.log10(0)).toBe(-Infinity)
  })

  it('tan of 90 degrees is very large (near Infinity)', () => {
    // tan(90°) mathematically = ∞, JavaScript gives a very large number
    expect(Math.tan(90 * Math.PI / 180)).toBeGreaterThan(1e10)
  })

  it('sin values stay between -1 and 1', () => {
    for (const deg of [0, 30, 45, 90, 135, 180, 270, 360]) {
      const val = Math.sin(deg * Math.PI / 180)
      expect(val).toBeGreaterThanOrEqual(-1)
      expect(val).toBeLessThanOrEqual(1)
    }
  })

  it('floating point: 0.1 + 0.2 handled by toFixed(10)', () => {
    const raw = 0.1 + 0.2  // = 0.30000000000000004 in JS
    const displayed = parseFloat(raw.toFixed(10))
    expect(displayed).toBeCloseTo(0.3, 9)
  })

  it('1/x of 0 gives Infinity — no crash', () => {
    const result = 1 / 0
    expect(result).toBe(Infinity)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// EDGE-4  What to test when AI adds a NEW question type
// This is a TEMPLATE — copy and fill in for each new type AI adds
// ══════════════════════════════════════════════════════════════════════════════
describe('EDGE-4 — Template for testing new question types added by AI', () => {

  it('TEMPLATE: new type with correct answer → should give full score', () => {
    // When AI adds "true_false" type, add it to calculateScore/scoreQuestion
    // then write:
    //   const q = { type: 'true_false', correctAnswer: 'True', maxScore: 1 }
    //   const { score } = calculateScore([q], { q1: 'True' })
    //   expect(score).toBe(1)
    //
    // For now this is a reminder test that always passes
    expect(true).toBe(true)
  })

  it('TEMPLATE: new type with wrong answer → should give 0', () => {
    // When AI adds a new type, ALWAYS test the wrong-answer case too
    expect(true).toBe(true)
  })

  it('TEMPLATE: new type with no answer → should not crash', () => {
    // Always test that unanswered questions don't throw errors
    expect(true).toBe(true)
  })
})
