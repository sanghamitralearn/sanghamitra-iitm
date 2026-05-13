/**
 * Unit tests for IITMMathQuiz pure logic functions.
 * Extracted verbatim from IITMMathQuiz.jsx.
 */
import { describe, it, expect } from 'vitest'

// ─── Extracted helpers ────────────────────────────────────────────────────────

function resolveOptionText(question, idxOrText) {
  if (idxOrText === undefined || idxOrText === null) return ''
  const opts = question.options || []
  const idx = typeof idxOrText === 'number' ? idxOrText : parseInt(idxOrText)
  if (!isNaN(idx) && idx >= 0 && idx < opts.length) return opts[idx]
  return String(idxOrText)
}

function toTeX(raw) {
  let s = raw.trim()
  if (!s) return ''
  s = s.replace(/\bpi\b/gi, '\\pi')
  s = s.replace(/\binf(inity)?\b/gi, '\\infty')
  s = s.replace(/sqrt\(([^)]+)\)/g, (_, inner) => `\\sqrt{${toTeX(inner)}}`)
  s = s.replace(/sqrt(\d+)/g, (_, n) => `\\sqrt{${n}}`)
  s = s.replace(/\babs\(([^)]+)\)/g, (_, inner) => `|${inner}|`)
  s = s.replace(/\b(sin|cos|tan|cot|sec|csc|log|ln|exp)\(([^)]+)\)/g,
    (_, fn, arg) => `\\${fn}(${toTeX(arg)})`)
  s = s.replace(/([a-zA-Z0-9)]+)\^(\(([^)]+)\)|[a-zA-Z0-9]+)/g, (_, base, _exp, grp) =>
    `${base}^{${toTeX(grp || _exp)}}`)
  s = s.replace(/(-?[a-zA-Z0-9\\.]+|\([^)]+\))\s*\/\s*(-?[a-zA-Z0-9\\.]+|\([^)]+\))/g,
    (_, num, den) => `\\frac{${toTeX(num)}}{${toTeX(den)}}`)
  s = s.replace(/!=|≠/g, '\\neq').replace(/>=|≥/g, '\\geq').replace(/<=|≤/g, '\\leq')
  s = s.replace(/\*/g, '\\cdot')
  return s
}

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

function isAnswered(a) {
  if (a === undefined || a === null) return false
  if (typeof a === 'number') return true
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return a.length > 0
  return false
}

function scoreQuestion(question, userAnswer) {
  const ca     = question.correct_answer
  const alts   = question.alternative_answers || []
  const points = question.points || 1
  const type   = question.type === 'mcq'  ? 'multiple_choice'
               : question.type === 'text' ? 'text_input'
               : question.type

  const empty = userAnswer === undefined || userAnswer === null || userAnswer === ''
                || (Array.isArray(userAnswer) && userAnswer.length === 0)
  if (empty) return { partialScore: 0, isCorrect: false, isMSQ: type === 'multiple_select' }

  const getCorrectIndices = () => {
    if (Array.isArray(ca))
      return ca.map(v => typeof v === 'number' ? v : parseInt(String(v).trim())).filter(v => !isNaN(v))
    if (typeof ca === 'number') return [ca]
    const asInt = parseInt(String(ca).trim())
    if (!isNaN(asInt)) return [asInt]
    return (question.options || []).reduce((acc, opt, idx) => {
      if (norm(opt) === norm(String(ca))) acc.push(idx)
      return acc
    }, [])
  }

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
    const correctIndices = getCorrectIndices()
    const userIndices    = [...userAnswer].map(v => typeof v === 'number' ? v : parseInt(String(v).trim()))
    const n              = correctIndices.length
    if (n === 0) return { partialScore: 0, isCorrect: false, isMSQ: true }
    const perCorrect = points / n
    const perWrong   = points / 3
    let raw = 0
    userIndices.forEach(idx => {
      if (correctIndices.includes(idx)) raw += perCorrect
      else                              raw -= perWrong
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

// ─── resolveOptionText ────────────────────────────────────────────────────────
describe('resolveOptionText', () => {
  const q = { options: ['Ans A', 'Ans B', 'Ans C'] }

  it('resolves numeric index', () => expect(resolveOptionText(q, 1)).toBe('Ans B'))
  it('resolves string index',  () => expect(resolveOptionText(q, '0')).toBe('Ans A'))
  it('last valid index',       () => expect(resolveOptionText(q, 2)).toBe('Ans C'))
  it('out-of-range returns string version of value', () => expect(resolveOptionText(q, 5)).toBe('5'))
  it('non-numeric string falls through', () => expect(resolveOptionText(q, 'hello')).toBe('hello'))
  it('null returns empty string',  () => expect(resolveOptionText(q, null)).toBe(''))
  it('undefined returns empty',    () => expect(resolveOptionText(q, undefined)).toBe(''))
  it('no options array',           () => {
    expect(resolveOptionText({}, 0)).toBe('0')
  })
})

// ─── toTeX ────────────────────────────────────────────────────────────────────
describe('toTeX', () => {
  it('empty string returns empty', () => expect(toTeX('')).toBe(''))
  it('converts pi',       () => expect(toTeX('pi')).toBe('\\pi'))
  it('converts Pi',       () => expect(toTeX('Pi')).toBe('\\pi'))
  it('converts inf',      () => expect(toTeX('inf')).toBe('\\infty'))
  it('converts infinity', () => expect(toTeX('infinity')).toBe('\\infty'))
  it('converts sqrt(x)',  () => expect(toTeX('sqrt(x)')).toBe('\\sqrt{x}'))
  it('converts sqrt2',    () => expect(toTeX('sqrt2')).toBe('\\sqrt{2}'))
  it('converts abs(x)',   () => expect(toTeX('abs(x)')).toBe('|x|'))
  it('converts sin(x)',   () => expect(toTeX('sin(x)')).toBe('\\sin(x)'))
  it('converts x^2',      () => expect(toTeX('x^2')).toBe('x^{2}'))
  it('converts a/b to frac', () => expect(toTeX('3/4')).toBe('\\frac{3}{4}'))
  it('converts != to \\neq', () => expect(toTeX('x != 0')).toBe('x \\neq 0'))
  it('converts >= to \\geq', () => expect(toTeX('x >= 0')).toBe('x \\geq 0'))
  it('converts <= to \\leq', () => expect(toTeX('x <= 0')).toBe('x \\leq 0'))
  it('converts * to cdot',   () => expect(toTeX('a*b')).toBe('a\\cdotb'))
  it('nested sqrt(x+1)',  () => expect(toTeX('sqrt(x+1)')).toBe('\\sqrt{x+1}'))
})

// ─── norm ─────────────────────────────────────────────────────────────────────
describe('norm', () => {
  it('null/undefined returns empty', () => {
    expect(norm(null)).toBe('')
    expect(norm(undefined)).toBe('')
  })
  it('strips spaces',          () => expect(norm('x + y')).toBe('x+y'))
  it('strips LaTeX delimiters',() => expect(norm('\\(x\\)')).toBe('x'))
  it('normalises ∞ to inf',    () => expect(norm('∞')).toBe('inf'))
  it('normalises √(x) to sqrt(x)', () => expect(norm('√(x)')).toBe('sqrt(x)'))
  it('normalises ≠ to !=',    () => expect(norm('≠')).toBe('!='))
  it('normalises ≤ to <=',    () => expect(norm('≤')).toBe('<='))
  it('normalises ≥ to >=',    () => expect(norm('≥')).toBe('>='))
  it('normalises × to *',     () => expect(norm('×')).toBe('*'))
  it('normalises ÷ to /',     () => expect(norm('a÷b')).toBe('a/b'))
  it('simplifies fractions',  () => expect(norm('1/2')).toBe('0.5'))
  it('lowercases result',     () => expect(norm('HELLO')).toBe('hello'))
  it('strips trailing .0',    () => expect(norm('3/1')).toBe('3'))
})

// ─── isAnswered ───────────────────────────────────────────────────────────────
describe('isAnswered (IITMMathQuiz)', () => {
  it('number 0 is answered',      () => expect(isAnswered(0)).toBe(true))
  it('non-empty string answered', () => expect(isAnswered('x')).toBe(true))
  it('empty string not answered', () => expect(isAnswered('')).toBe(false))
  it('spaces-only not answered',  () => expect(isAnswered('  ')).toBe(false))
  it('[1,2] answered',            () => expect(isAnswered([1, 2])).toBe(true))
  it('[] not answered',           () => expect(isAnswered([])).toBe(false))
  it('null not answered',         () => expect(isAnswered(null)).toBe(false))
  it('undefined not answered',    () => expect(isAnswered(undefined)).toBe(false))
})

// ─── scoreQuestion — MCQ ─────────────────────────────────────────────────────
describe('scoreQuestion — multiple_choice', () => {
  const q = {
    type: 'multiple_choice',
    correct_answer: 2,
    options: ['A', 'B', 'C', 'D'],
    points: 1,
  }

  it('correct → full score, isCorrect=true',  () => {
    const r = scoreQuestion(q, 2)
    expect(r.isCorrect).toBe(true)
    expect(r.partialScore).toBe(1)
    expect(r.isMSQ).toBe(false)
  })

  it('wrong → 0 score, isCorrect=false', () => {
    const r = scoreQuestion(q, 1)
    expect(r.isCorrect).toBe(false)
    expect(r.partialScore).toBe(0)
  })

  it('empty answer → 0, false', () => {
    expect(scoreQuestion(q, '').isCorrect).toBe(false)
    expect(scoreQuestion(q, null).isCorrect).toBe(false)
  })

  it('string index resolves correctly', () => {
    expect(scoreQuestion(q, '2').isCorrect).toBe(true)
    expect(scoreQuestion(q, '0').isCorrect).toBe(false)
  })

  it('respects points value', () => {
    const q2 = { ...q, points: 3 }
    expect(scoreQuestion(q2, 2).partialScore).toBe(3)
    expect(scoreQuestion(q2, 1).partialScore).toBe(0)
  })

  it('mcq alias works', () => {
    const qm = { type: 'mcq', correct_answer: 0, options: ['A', 'B'], points: 1 }
    expect(scoreQuestion(qm, 0).isCorrect).toBe(true)
    expect(scoreQuestion(qm, 1).isCorrect).toBe(false)
  })

  it('correct_answer stored as text resolves by option match', () => {
    const qt = { type: 'multiple_choice', correct_answer: 'Option B', options: ['Option A', 'Option B'], points: 1 }
    expect(scoreQuestion(qt, 1).isCorrect).toBe(true)
    expect(scoreQuestion(qt, 0).isCorrect).toBe(false)
  })
})

// ─── scoreQuestion — MSQ (IITM partial scoring) ───────────────────────────────
describe('scoreQuestion — multiple_select (IITM partial marking)', () => {
  // 2-correct-option question worth 2 points
  const q = {
    type: 'multiple_select',
    correct_answer: [0, 2],
    options: ['A', 'B', 'C', 'D'],
    points: 2,
  }

  it('all correct → full score', () => {
    const r = scoreQuestion(q, [0, 2])
    expect(r.isCorrect).toBe(true)
    expect(r.partialScore).toBe(2)
    expect(r.isMSQ).toBe(true)
  })

  it('one correct, zero wrong → partial score', () => {
    // perCorrect = 2/2 = 1, perWrong = 2/3 ≈ 0.667
    const r = scoreQuestion(q, [0])
    expect(r.isCorrect).toBe(false)
    expect(r.partialScore).toBe(1)
  })

  it('one correct + one wrong → partial (floored at 0)', () => {
    // +1 (correct) - 0.6667 (wrong) ≈ 0.3333
    const r = scoreQuestion(q, [0, 1])
    expect(r.isCorrect).toBe(false)
    expect(r.partialScore).toBeGreaterThanOrEqual(0)
    expect(r.partialScore).toBeLessThan(2)
  })

  it('all wrong → 0 score (floor prevents going negative)', () => {
    const r = scoreQuestion(q, [1, 3])
    expect(r.isCorrect).toBe(false)
    expect(r.partialScore).toBe(0)
  })

  it('empty selection → 0 score', () => {
    expect(scoreQuestion(q, []).isCorrect).toBe(false)
    expect(scoreQuestion(q, []).partialScore).toBe(0)
  })

  it('null → 0 score', () => {
    expect(scoreQuestion(q, null).partialScore).toBe(0)
  })

  it('score never exceeds max points', () => {
    // selecting more than required correct still capped at max
    const r = scoreQuestion(q, [0, 2])
    expect(r.partialScore).toBeLessThanOrEqual(2)
  })
})

// ─── scoreQuestion — Numeric ──────────────────────────────────────────────────
describe('scoreQuestion — numeric', () => {
  it('exact match', () => {
    const q = { type: 'numeric', correct_answer: '100', points: 1 }
    expect(scoreQuestion(q, '100').isCorrect).toBe(true)
  })

  it('within 1% default tolerance', () => {
    const q = { type: 'numeric', correct_answer: '100', points: 1 }
    expect(scoreQuestion(q, '100.9').isCorrect).toBe(true)  // within 1%
    expect(scoreQuestion(q, '102').isCorrect).toBe(false)   // > 1%
  })

  it('custom tolerance', () => {
    const q = { type: 'numeric', correct_answer: '5', has_tolerance: true, tolerance_value: 0.5, points: 1 }
    expect(scoreQuestion(q, '5.4').isCorrect).toBe(true)
    expect(scoreQuestion(q, '5.6').isCorrect).toBe(false)
  })

  it('NaN input → 0', () => {
    const q = { type: 'numeric', correct_answer: '42', points: 1 }
    expect(scoreQuestion(q, 'xyz').isCorrect).toBe(false)
  })

  it('zero correct answer', () => {
    // tolerance = max(0*0.01, 0.0001) = 0.0001
    const q = { type: 'numeric', correct_answer: '0', points: 1 }
    expect(scoreQuestion(q, '0').isCorrect).toBe(true)
    expect(scoreQuestion(q, '0.0001').isCorrect).toBe(true)
    expect(scoreQuestion(q, '0.001').isCorrect).toBe(false)
  })

  it('alternative answers accepted', () => {
    const q = { type: 'numeric', correct_answer: '1', alternative_answers: ['2'], points: 1 }
    expect(scoreQuestion(q, '2').isCorrect).toBe(true)
  })
})

// ─── scoreQuestion — Text ─────────────────────────────────────────────────────
describe('scoreQuestion — text', () => {
  it('exact match (normalized)', () => {
    const q = { type: 'text_input', correct_answer: 'Domain', points: 1 }
    expect(scoreQuestion(q, 'domain').isCorrect).toBe(true)
    expect(scoreQuestion(q, 'DOMAIN').isCorrect).toBe(true)
  })

  it('numeric equivalence in text answer', () => {
    // norm('1/2') = '0.5', norm('0.5') = '0.5' → match
    const q = { type: 'text_input', correct_answer: '1/2', points: 1 }
    expect(scoreQuestion(q, '0.5').isCorrect).toBe(true)
  })

  it('alternative text answers', () => {
    const q = { type: 'text_input', correct_answer: 'real', alternative_answers: ['ℝ', 'R'], points: 1 }
    expect(scoreQuestion(q, 'ℝ').isCorrect).toBe(true)
  })

  it('wrong answer', () => {
    const q = { type: 'text_input', correct_answer: 'yes', points: 1 }
    expect(scoreQuestion(q, 'no').isCorrect).toBe(false)
  })

  it('text type alias', () => {
    const q = { type: 'text', correct_answer: 'hello', points: 1 }
    expect(scoreQuestion(q, 'hello').isCorrect).toBe(true)
  })
})

// ─── MSQ total score calculation (doSubmit replica) ──────────────────────────
describe('MSQ total score accumulation', () => {
  const questions = [
    { _id: 'q1', type: 'multiple_choice', correct_answer: 0, options: ['A','B'], points: 1 },
    { _id: 'q2', type: 'multiple_select', correct_answer: [0,1], options: ['A','B','C'], points: 2 },
    { _id: 'q3', type: 'numeric', correct_answer: '5', points: 1 },
  ]

  it('all fully correct totals to 4 points', () => {
    const answers = { q1: 0, q2: [0, 1], q3: '5' }
    const total = questions.reduce((sum, q) => {
      return sum + scoreQuestion(q, answers[q._id]).partialScore
    }, 0)
    expect(total).toBe(4)
  })

  it('partial MSQ reduces total', () => {
    const answers = { q1: 0, q2: [0], q3: '5' }  // q2 gets 1 pt (partial)
    const total = questions.reduce((sum, q) => {
      return sum + scoreQuestion(q, answers[q._id]).partialScore
    }, 0)
    expect(total).toBe(3)  // 1 (MCQ) + 1 (partial MSQ) + 1 (numeric)
  })
})
