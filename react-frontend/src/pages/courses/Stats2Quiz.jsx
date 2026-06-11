import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Topic map: each week number maps to the exact topic string the backend expects.
const WEEK_TOPIC_MAP = {
  1:  'Multiple Random Variables',
  2:  'Independence and Variable Functions',
  3:  'Expectations Variance and Bivariate Data',
  4:  'Discrete vs Continuous Random Variables',
  5:  'Jointly Gaussian Random Variables',
  6:  'Marginal and Conditional Densities',
  7:  'Empirical Distribution',
  8:  'Moment Generating Functions',
  9:  'Parameter Estimation',
  10: 'Bayesian Estimation',
  11: 'Hypotheses Testing',
}

// KaTeX loader
function loadKaTeX() {
  if (window.renderMathInElement) return Promise.resolve()
  return new Promise((resolve) => {
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
      document.head.appendChild(link)
    }
    const core = document.createElement('script')
    core.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
    core.onload = () => {
      const ar = document.createElement('script')
      ar.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
      ar.onload = () => resolve()
      document.head.appendChild(ar)
    }
    document.head.appendChild(core)
  })
}

function renderMathContent(element) {
  if (!element) return
  const run = () => {
    if (typeof window.renderMathInElement === 'undefined') return
    window.renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }
  setTimeout(run, 100)
}

function formatMathText(text) {
  if (!text) return text

  let result = text

  const matrices = []
  result = result.replace(/\[\s*\[([\s\S]*?)\]\s*\]/g, (match) => {
    try {
      let inner = match.slice(1, -1).trim()
      let rowsRaw = inner.split(/\]\s*,\s*\[/)
      let rows = rowsRaw.map(row =>
        row.replace(/^\[|\]$/g, '').trim().split(',').map(x => x.trim()).join(' & ')
      )
      const matrixCode = `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`
      matrices.push(matrixCode)
      return ` __MATRIX${matrices.length - 1}__ `
    } catch { return match }
  })

  result = result.replace(/detdet/g, 'det')
  result = result.replace(/det\(/g, '__DET__(')
  result = result.replace(/trace\(/g, '__TRACE__(')

  result = result.replace(/\(([^)]*,[^)]*)\)\^([A-Za-z])/g, '__PARENCOMMA_$1_EXP_$2__')
  result = result.replace(/\(([A-Za-z\s+\-*/]+)\)\^([A-Za-z])/g, '__PARENEXPR_$1_EXP_$2__')
  result = result.replace(/\(([A-Za-z]{2,})\)\^([A-Za-z])/g, '__PARENVAR_$1_EXP_$2__')
  result = result.replace(/\(([A-Za-z\s+\-*/]+)\)\^(\d+)/g, '__PARENEXPR_$1_EXP_$2__')
  result = result.replace(/\(([^)]+)\)\^(\d+)/g, '__PAREN_$1_EXP_$2__')
  result = result.replace(/([A-Za-z])\^([A-Za-z])/g, '__VAR_$1_EXP_$2__')
  result = result.replace(/([A-Za-z])\^(-?\d+)/g, '__VAR_$1_EXP_$2__')
  result = result.replace(/([A-Za-z])\^\{([^}]+)\}/g, '__VAR_$1_EXP_$2__')
  result = result.replace(/([A-Za-z])\^\(([^)]+)\)/g, '__VAR_$1_EXP_$2__')

  const words = result.split(/(\s+)/)
  const processed = words.map(word => {
    if (/^\s+$/.test(word)) return word
    if (word.includes('__')) return word
    if (/^[A-Z]$/.test(word)) return `$${word}$`
    if (/^[b-z]$/.test(word)) return `$${word}$`
    if (/^\([A-Za-z0-9\s+\-]+\)$/.test(word)) return `$${word}$`
    return word
  })
  result = processed.join('')

  result = result.replace(/__DET__/g, '$\\det$')
  result = result.replace(/__TRACE__/g, '$\\text{trace}$')
  result = result.replace(/__PARENCOMMA_([^_]+)_EXP_([A-Za-z])__/g, '$$($1)^{$2}$$')
  result = result.replace(/__PARENEXPR_([^_]+)_EXP_([A-Za-z0-9]+)__/g, '$$($1)^{$2}$$')
  result = result.replace(/__PARENVAR_([^_]+)_EXP_([A-Za-z])__/g, '$$($1)^{$2}$$')
  result = result.replace(/__PAREN_([^_]+)_EXP_(\d+)__/g, '$$($1)^{$2}$$')
  result = result.replace(/__VAR_([A-Za-z])_EXP_([A-Za-z0-9\-]+)__/g, '$$$1^{$2}$$')
  matrices.forEach((matrix, i) => {
    result = result.replace(`__MATRIX${i}__`, `$$${matrix}$$`)
  })

  result = result.replace(/\$\$\s*\$\$/g, ' ')
  result = result.replace(/\$\s+\$/g, ' ')

  return result
}

const answerNormalizer = {
  normalizeInterval: (answer) =>
    (answer || '').toString().trim()
      .replace(/\s+/g, '')
      .replace(/infinity|Infinity|INFINITY|∞/gi, 'inf')
      .replace(/\+inf/gi, 'inf')
      .replace(/-\s*inf/gi, '-inf')
      .replace(/union|∪/gi, '∪')
      .toLowerCase(),

  normalizeSetNotation: (answer) =>
    (answer || '').toString().trim()
      .replace(/\s+/g, '')
      .replace(/[{}]/g, '')
      .replace(/x∈R|x∈ℝ/gi, 'ℝ')
      .replace(/R|ℝ/gi, 'ℝ')
      .replace(/[|:]/g, ',')
      .toLowerCase(),

  normalizeNumeric: (num) => {
    const str = (num || '').toString().trim().toLowerCase()
    if (['inf', 'infinity', '+inf', '+infinity', '∞', '+∞'].includes(str)) return Infinity
    if (['-inf', '-infinity', '-∞'].includes(str)) return -Infinity
    const cleaned = str.replace(/[^\d.\-]/g, '')
    return cleaned ? parseFloat(cleaned) : NaN
  },

  normalizeGeneral: (text) =>
    (text || '').toString()
      .replace(/\s+/g, '')
      .replace(/infinity|Infinity|INFINITY|∞/gi, 'inf')
      .replace(/√(\d+)/g, 'sqrt($1)')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/≠/g, '!=')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .toLowerCase(),

  normalizeAnswer(answer, type) {
    if (!answer) return ''
    const str = answer.toString().trim()
    if (type === 'interval_input') return this.normalizeInterval(str)
    if (type === 'set_notation')   return this.normalizeSetNotation(str)
    if (type === 'numeric' || type === 'numeric_input') {
      const n = this.normalizeNumeric(str)
      return isFinite(n) ? n.toString() : n === Infinity ? 'inf' : n === -Infinity ? '-inf' : this.normalizeGeneral(str)
    }
    return this.normalizeGeneral(str)
  },
}

function gradeQuestion(question, userAnswer) {
  if (userAnswer === undefined || userAnswer === null) return false

  const type = question.type
  const normUser = answerNormalizer.normalizeAnswer(userAnswer, type)
  const normCorrect = answerNormalizer.normalizeAnswer(question.correct_answer, type)

  if (type === 'interval_input' || type === 'set_notation') {
    if (normUser === normCorrect) return true
    return (question.alternative_answers || []).some(alt =>
      answerNormalizer.normalizeAnswer(alt, type) === normUser
    )
  }

  if (type === 'multiple_choice' || type === 'text_input') {
    return normUser === normCorrect
  }

  if (type === 'multiple_select') {
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correct_answer)) return false
    const ua = userAnswer.map(a => answerNormalizer.normalizeGeneral(a)).sort()
    const ca = question.correct_answer.map(a => answerNormalizer.normalizeGeneral(a)).sort()
    return ua.length === ca.length && ua.every((a, i) => a === ca[i])
  }

  if (type === 'numeric' || type === 'numeric_input' || type === 'coordinate_input') {
    const uNum = answerNormalizer.normalizeNumeric(userAnswer)
    const cNum = answerNormalizer.normalizeNumeric(question.correct_answer)
    if (!isNaN(uNum) && !isNaN(cNum)) {
      if (uNum === cNum) return true
      if (isFinite(uNum) && isFinite(cNum)) {
        const tolerance = Math.max(Math.abs(cNum) * 0.01, 0.01)
        if (Math.abs(uNum - cNum) <= tolerance) return true
      }
    }
    if ((question.alternative_answers || []).some(alt => {
      const aNum = answerNormalizer.normalizeNumeric(alt)
      if (!isNaN(uNum) && !isNaN(aNum)) {
        if (uNum === aNum) return true
        if (isFinite(uNum) && isFinite(aNum)) {
          const tol = Math.max(Math.abs(aNum) * 0.01, 0.01)
          return Math.abs(uNum - aNum) <= tol
        }
      }
      return false
    })) return true
    return normUser === normCorrect
  }

  return normUser === normCorrect
}

const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)

  const pressNum = v => { if (fresh) { setDisplay(String(v)); setFresh(false) } else setDisplay(d => d === '0' ? String(v) : d + v) }
  const pressOp  = o => { setPrev(parseFloat(display)); setOp(o); setFresh(true) }
  const pressDot = () => setDisplay(d => d.includes('.') ? d : d + '.')
  const del      = () => setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0')
  const clear    = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true) }
  const equals   = () => {
    const cur = parseFloat(display); if (prev === null || !op) return
    const res = { '+': prev + cur, '-': prev - cur, '*': prev * cur, '/': prev / cur, '^': Math.pow(prev, cur) }[op]
    setDisplay(String(parseFloat(res.toFixed(10)))); setPrev(null); setOp(null); setFresh(true)
  }
  const fn = f => {
    const v = parseFloat(display)
    const m = { sqrt: Math.sqrt(v), log: Math.log10(v), ln: Math.log(v), sin: Math.sin(v * Math.PI / 180), cos: Math.cos(v * Math.PI / 180), tan: Math.tan(v * Math.PI / 180), '1/x': 1 / v, 'x²': v * v, 'π': Math.PI, 'e': Math.E }
    setDisplay(String(parseFloat(m[f].toFixed(10)))); setFresh(true)
  }
  const B = (label, action, color = '#495057') => (
    <button key={label} onClick={action} style={{ padding: '7px 4px', border: 'none', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: color, color: '#fff' }}>{label}</button>
  )
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 20, width: 260, background: '#1a1a2e', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, padding: 12 }}
      onContextMenu={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span style={{ color: '#aaa', fontSize: '0.78rem' }}>🧮 Calculator</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ background: '#0f0f1a', borderRadius: 8, padding: '8px 12px', marginBottom: 8, textAlign: 'right', minHeight: 42 }}>
        {op && <div style={{ fontSize: '0.68rem', color: '#888' }}>{prev} {op}</div>}
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', wordBreak: 'break-all' }}>{display}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginBottom: 4 }}>
        {B('sin', () => fn('sin'), '#6f42c1')} {B('cos', () => fn('cos'), '#6f42c1')}
        {B('tan', () => fn('tan'), '#6f42c1')} {B('log', () => fn('log'), '#6f42c1')}
        {B('ln', () => fn('ln'), '#6f42c1')} {B('√', () => fn('sqrt'), '#6f42c1')}
        {B('x²', () => fn('x²'), '#6f42c1')} {B('1/x', () => fn('1/x'), '#6f42c1')}
        {B('π', () => fn('π'), '#0d6efd')} {B('e', () => fn('e'), '#0d6efd')}
        {B('^', () => pressOp('^'), '#fd7e14')} {B('C', clear, '#dc3545')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
        {B('7', () => pressNum('7'))} {B('8', () => pressNum('8'))} {B('9', () => pressNum('9'))} {B('÷', () => pressOp('/'), '#343a40')}
        {B('4', () => pressNum('4'))} {B('5', () => pressNum('5'))} {B('6', () => pressNum('6'))} {B('×', () => pressOp('*'), '#343a40')}
        {B('1', () => pressNum('1'))} {B('2', () => pressNum('2'))} {B('3', () => pressNum('3'))} {B('−', () => pressOp('-'), '#343a40')}
        {B('0', () => pressNum('0'))} {B('.', pressDot)} {B('+', () => pressOp('+'), '#343a40')} {B('⌫', del, '#6c757d')}
        <button onClick={equals} style={{ gridColumn: '1/-1', padding: '8px', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', background: '#28a745', color: '#fff', fontSize: '0.9rem' }}>=</button>
      </div>
    </div>
  )
}

const MathText = ({ text, style, className }) => {
  const ref = useRef(null)
  useEffect(() => { renderMathContent(ref.current) }, [text])

  // If text already has $ or \( \) / \[ \] delimiters, it's proper LaTeX — don't run formatMathText
  // formatMathText is only for plain text that needs auto-detection
  const formatted = (text && (text.includes('$') || text.includes('\\('))) ? text : formatMathText(text || '')

  return (
    <span
      ref={ref}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: formatted }}
    />
  )
}

// ─── Pipe-table detection/rendering ───────────────────────────────────────────
// Recognizes both standard markdown tables (with a |---|---| separator row)
// and plain pipe-delimited tables like:
//   X \ Y | Y=1 | Y=2 | Y=3
//   X=1   | 0.10 | 0.15 | 0.05
function splitCells(line) {
  let l = line.trim()
  if (l.startsWith('|')) l = l.slice(1)
  if (l.endsWith('|')) l = l.slice(0, -1)
  return l.split('|').map(c => c.trim())
}

function isSeparatorRow(line) {
  const t = line.trim()
  return /^[\s|:-]+$/.test(t) && t.includes('-')
}

function looksLikeTableRow(line) {
  const t = line.trim()
  if (!t.includes('|')) return false
  if (isSeparatorRow(t)) return true
  return splitCells(t).filter(c => c.length).length >= 2
}

function parseTable(lines) {
  const dataLines = lines.filter(l => !isSeparatorRow(l))
  if (dataLines.length < 2) return null
  const header = splitCells(dataLines[0])
  const cols = header.length
  if (cols < 2) return null
  const rows = dataLines.slice(1).map(splitCells)
  if (!rows.every(r => r.length === cols)) return null
  return { header, rows }
}

const QuestionRenderer = ({ text, style }) => {
  if (!text) return null
  const lines = text.split('\n')
  const segments = []
  let buffer = []
  let i = 0
  while (i < lines.length) {
    if (looksLikeTableRow(lines[i])) {
      let j = i
      while (j < lines.length && looksLikeTableRow(lines[j])) j++
      if (j - i >= 2) {
        const table = parseTable(lines.slice(i, j))
        if (table) {
          if (buffer.length) { segments.push({ type: 'text', content: buffer.join('\n') }); buffer = [] }
          segments.push({ type: 'table', table })
          i = j
          continue
        }
      }
    }
    buffer.push(lines[i])
    i++
  }
  if (buffer.length) segments.push({ type: 'text', content: buffer.join('\n') })

  return (
    <span style={style}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return seg.content.trim()
            ? <MathText key={idx} text={seg.content} style={{ whiteSpace: 'pre-wrap' }} />
            : null
        }
        return (
          <div key={idx} className="table-responsive my-3">
            <table className="table table-bordered table-sm text-center w-auto">
              <thead className="table-light">
                <tr>{seg.table.header.map((h, hi) => <th key={hi}><MathText text={h} /></th>)}</tr>
              </thead>
              <tbody>
                {seg.table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      ci === 0
                        ? <th key={ci} className="table-light"><MathText text={cell} /></th>
                        : <td key={ci}><MathText text={cell} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </span>
  )
}

const ReviewPage = ({ questions, answers, results, quizName, onRetake }) => {
  const [expanded, setExpanded] = useState(null)

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{quizName} — Review</h1>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics2">IITM Statistics 2</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="card border-0 shadow-sm mb-4 text-center" style={{ borderRadius: 16 }}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: results.percentage >= 60
                    ? 'linear-gradient(135deg,#28a745,#20c997)'
                    : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{results.percentage}%</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                    {results.correctCount}/{questions.length}
                  </span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">
                  {results.percentage >= 80 ? 'Excellent!' : results.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
                </h4>
                <p className="text-muted mb-1">
                  Score: <strong>{results.score}/{results.maxPossibleScore}</strong> points
                </p>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{results.correctCount}</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{questions.length - results.correctCount}</strong>
                </p>
                <p className="text-muted mb-0">
                  Time: {Math.floor(results.totalTime / 60)}m {results.totalTime % 60}s
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" />Retake
              </button>
              <Link to="/courses/statistics2" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1" />Back
              </Link>
            </div>
          </div>
        </div>

        {questions.map((q, idx) => {
          const res = results.responses[idx]
          const isOpen = expanded === idx
          const diffColor = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545' }

          return (
            <div key={q._id || idx} className="card border-0 shadow-sm mb-3"
              style={{ borderRadius: 12, borderLeft: `4px solid ${res?.isCorrect ? '#28a745' : '#dc3545'}` }}>
              <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : idx)}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: res?.isCorrect ? '#28a745' : '#dc3545',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className={`bi ${res?.isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                        Q{idx + 1}.&nbsp;
                        {isOpen
                          ? <QuestionRenderer text={q.question_text} />
                          : <MathText text={
                              (q.question_text || '').length > 100
                                ? q.question_text.slice(0, 100) + '…'
                                : q.question_text
                            } />
                        }
                      </p>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className="badge bg-secondary">{q.type}</span>
                      <span className="badge" style={{ background: diffColor[q.difficulty] || '#6c757d', color: q.difficulty === 'medium' ? '#333' : '#fff' }}>
                        {q.difficulty}
                      </span>
                      <span className="badge bg-light text-dark border">{q.points || 1} pt{(q.points || 1) !== 1 ? 's' : ''}</span>
                      {res?.marksAwarded > 0 && <span className="badge bg-success">+{res.marksAwarded} earned</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {q.type === 'multiple_choice' && Array.isArray(q.options) && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const isCorrectOpt = opt.option_id === q.correct_answer
                          const userPicked   = answers[idx] === opt.option_id
                          const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success" />}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger" />}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                              <strong className="me-1">{opt.option_id}.</strong>
                              <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type === 'multiple_select' && Array.isArray(q.options) && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const correctArr   = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]
                          const isCorrectOpt = correctArr.includes(opt.option_id)
                          const userPicked   = Array.isArray(answers[idx]) && answers[idx].includes(opt.option_id)
                          const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success" />}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger" />}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                              <strong className="me-1">{opt.option_id}.</strong>
                              <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {['numeric', 'numeric_input', 'interval_input', 'coordinate_input', 'set_notation', 'text_input'].includes(q.type) && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border">
                          Your answer: <strong><MathText text={String(answers[idx] || '(no answer)')} /></strong>
                        </span>
                        <span className="badge bg-success">
                          Correct: <strong><MathText text={String(q.correct_answer)} /></strong>
                        </span>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="mt-2 p-2 rounded" style={{ background: '#f0f4ff', fontSize: '0.88rem' }}>
                        <strong>Explanation: </strong>
                        <MathText text={q.explanation} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ─── Main Quiz Component ───────────────────────────────────────────────────────
const Stats2Quiz = () => {
  const { week } = useParams()  // Now using 'week' parameter from route
  const navigate = useNavigate()
  const location = useLocation()

  // Parse week number from URL parameter
  const weekNum = week ? parseInt(week, 10) : 1

  // Validate week number (1-11), default to 1 if invalid
  const validWeekNum = !isNaN(weekNum) && weekNum >= 1 && weekNum <= 11 ? weekNum : 1

  // Get topic from the mapping
  const topic = WEEK_TOPIC_MAP[validWeekNum] || `Week_${validWeekNum}`

  const { quizName } = location.state || {}
  const displayName = quizName || `Week ${validWeekNum} — ${topic.replace(/_/g, ' ')}`

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const quizStartRef = useRef(Date.now())
  const timesRef = useRef({})
  const cheatingRef = useRef(0)
  const userRef = useRef(null)
  const questionRef = useRef(null)

  // Load KaTeX once on mount
  useEffect(() => { loadKaTeX() }, [])

  // Re-render math whenever the displayed question changes
  useEffect(() => {
    if (questionRef.current) renderMathContent(questionRef.current)
  }, [currentIndex, questions])

  // Reset quiz state when week parameter changes
  useEffect(() => {
    if (!userRef.current?.email) return

    setQuestions([])
    setAnswers({})
    setCurrentIndex(0)
    setSubmitted(false)
    setResults(null)
    setError(null)
    timesRef.current = {}
    cheatingRef.current = 0
    quizStartRef.current = Date.now()

    fetchQuestions()
  }, [week])  // Re-run when week parameter changes

  // Auth - runs once on mount
  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        userRef.current = res.data
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/api/iitm_stats2_questions_databases?week=${validWeekNum}&email=${encodeURIComponent(userRef.current.email)}&count=25`;
      const res  = await axios.get(url, { withCredentials: true });
      const qs   = res.data.questions || [];

      if (!qs.length) {
        setError('No questions found for this week.');
        setLoading(false);
        return;
      }
      setQuestions(qs);
      quizStartRef.current = Date.now();
    } catch (e) {
      console.error('Fetch questions error:', e);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetUserProgress = async (email, currentTopic) => {
    try {
      await axios.post(`${API_URL}/api/reset-user-progress`,
        { email, topic: currentTopic },
        { withCredentials: true }
      )
    } catch (e) {
      console.error('Failed to reset progress:', e)
    }
  }

  // Anti-cheat
  useEffect(() => {
    if (submitted || loading) return
    const onContext = e => e.preventDefault()
    const onKey = e => {
      if (e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'u'].includes(e.key))) {
        e.preventDefault()
        logCheat('keyboard_shortcut')
      }
      if (e.ctrlKey && ['A', 'a', 'C', 'c', 'V', 'v'].includes(e.key)) e.preventDefault()
    }
    const onBlur = () => { setTabWarning(true); logCheat('tab_switch') }
    const onFocus = () => setTabWarning(false)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    const interval = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        logCheat('devtools_open')
      }
    }, 2000)
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [submitted, loading])

  const logCheat = async (type) => {
    cheatingRef.current += 1
    try {
      await axios.post(`${API_URL}/api/log-cheating`,
        { email: userRef.current?.email, type, quiz: displayName, timestamp: new Date().toISOString() },
        { withCredentials: true }
      )
    } catch {}
    if (cheatingRef.current >= 5) handleSubmit(true)
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))
  const toggleMSQ = (idx, opt) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] }
    })
  }

  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }
  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_, i) => {
        const a = answers[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    let score = 0
    let maxPossibleScore = 0
    const difficultyBreakdown = {
      easy:   { attempted: 0, correct: 0, points: 0 },
      medium: { attempted: 0, correct: 0, points: 0 },
      hard:   { attempted: 0, correct: 0, points: 0 },
    }
    const questionResults = []

    questions.forEach((q, i) => {
      const userAnswer = answers[i]
      const isCorrect  = gradeQuestion(q, userAnswer)
      const pts        = q.points || 1
      maxPossibleScore += pts
      if (isCorrect) score += pts

      const diff = q.difficulty || 'medium'
      difficultyBreakdown[diff].attempted++
      if (isCorrect) {
        difficultyBreakdown[diff].correct++
        difficultyBreakdown[diff].points += pts
      }

      questionResults.push({
        questionId:   q._id,
        questionText: q.question_text,
        difficulty:   diff,
        points:       pts,
        userAnswer:   userAnswer != null ? userAnswer : null,  // keep original type — arrays stay arrays
        correctAnswer:q.correct_answer,                        // keep original type — don't stringify
        explanation:  q.explanation  || '',
        isCorrect,
        timeTaken:    timesRef.current[i] || 0,
        marksAwarded: isCorrect ? pts : 0,
        subtopic:     q.subtopic     || '',
        questionType: q.type         || '',
        conceptTags:  q.concept_tags || [],
        bloomLevel:   q.bloom_level  || 'apply'
      })
    })

    const endTime   = new Date()
    const startTime = new Date(quizStartRef.current)
    const totalTime = Math.round((endTime - startTime) / 1000)
    const correctCount = questionResults.filter(r => r.isCorrect).length
    const percentage   = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0

    setResults({
      score,
      maxPossibleScore,
      percentage,
      correctCount,
      totalTime,
      responses: questionResults,
    })
    setSubmitted(true)

    const u = userRef.current
    if (!u?.email) return
    setSaving(true)

    try {
      const quizData = {
        week:            validWeekNum,        // ✅ inside quizData where route expects it
        topic,
        quizType:        'practice',
        score,
        maxPossibleScore,
        totalQuestions:  questions.length,
        correctAnswers:  correctCount,
        percentage,
        difficultyBreakdown,
        questionResults,
        startTime,
        endTime,
        totalTimeTaken:  totalTime,
        cheatCount:      cheatingRef.current,
        isCompleted:     true,
      }

      await axios.post(`${API_URL}/api/iitm_stats2_quiz_attempt`, {
        email:    u.email,
        username: u.username || u.name || u.email,
        quizData  // ✅ week is inside quizData, not at root level
      }, { withCredentials: true })

    } catch (e) {
      console.error('Failed to save score:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setAnswers({})
    setSubmitted(false)
    setResults(null)
    setCurrentIndex(0)
    timesRef.current = {}
    cheatingRef.current = 0
    quizStartRef.current = Date.now()
    if (userRef.current?.email) fetchQuestions()
  }

  // Loading / error states
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Loading {displayName}…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={() => userRef.current?.email && fetchQuestions()}>Retry</button>
      <Link to="/courses/statistics2" className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage
      questions={questions} answers={answers} results={results}
      quizName={displayName} onRetake={handleRetake}
    />
  )

  // Quiz render
  const q = questions[currentIndex]
  if (!q) return null

  const userAns = answers[currentIndex]
  const isAnswered = userAns !== undefined && userAns !== null && userAns !== '' && !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  const diffColor = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545' }

  return (
    <main className="main">
      {tabWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, background: '#dc3545', color: '#fff', textAlign: 'center', padding: '8px', fontWeight: 600 }}>
          ⚠️ Tab switching detected!
          <button onClick={() => setTabWarning(false)} style={{ marginLeft: 16, background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">IITM Statistics II Assessment</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics2">IITM Statistics 2</Link></li>
          <li className="current">{displayName}</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-4" ref={questionRef}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>
                      {isAnswered ? 'Answered' : 'Unanswered'}
                    </span>
                    <span className="badge bg-secondary">{q.type}</span>
                    <span className="badge"
                      style={{ background: diffColor[q.difficulty] || '#6c757d', color: q.difficulty === 'medium' ? '#333' : '#fff' }}>
                      {q.difficulty}
                    </span>
                    <span className="badge bg-light text-dark border">{q.points || 1} pt{(q.points || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="progress mb-4" style={{ height: 6 }}>
                  <div className="progress-bar bg-primary" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>

                <p className="mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.75 }}>
                  <QuestionRenderer text={q.question_text} />
                </p>

                {q.type === 'multiple_choice' && Array.isArray(q.options) && (
                  <div>
                    {q.options.map((opt, oi) => (
                      <div key={oi}
                        onClick={() => setAnswer(currentIndex, opt.option_id)}
                        className={`d-flex align-items-center gap-2 mb-2 p-3 rounded border ${userAns === opt.option_id ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${userAns === opt.option_id ? '#0d6efd' : '#adb5bd'}`,
                          background: userAns === opt.option_id ? '#0d6efd' : 'transparent',
                        }} />
                        <strong className="me-1" style={{ minWidth: 20 }}>{opt.option_id}.</strong>
                        <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'multiple_select' && Array.isArray(q.options) && (
                  <div>
                    <p className="text-muted small mb-2">Select all that apply</p>
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                      return (
                        <div key={oi}
                          onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                          className={`d-flex align-items-center gap-2 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${selected ? '#0d6efd' : '#adb5bd'}`,
                            background: selected ? '#0d6efd' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selected && <i className="bi bi-check text-white" style={{ fontSize: 12 }} />}
                          </div>
                          <strong className="me-1" style={{ minWidth: 20 }}>{opt.option_id}.</strong>
                          <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />
                        </div>
                      )
                    })}
                  </div>
                )}

                {['numeric', 'numeric_input', 'interval_input', 'coordinate_input', 'set_notation', 'text_input'].includes(q.type) && (
                  <div>
                    <p className="text-muted small mb-2">
                      {q.type === 'interval_input' ? 'Enter interval notation, e.g. (-∞, 3] or (-inf, 3]'
                        : q.type === 'set_notation' ? 'Enter set notation, e.g. {x ∈ ℝ | x ≠ 0}'
                        : q.type === 'coordinate_input' ? 'Enter coordinates, e.g. (2, 3)'
                        : 'Enter your numeric answer'}
                    </p>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder={
                        q.type === 'interval_input' ? 'e.g., (-inf, 3], [1,5)∪(5,∞)'
                          : q.type === 'set_notation' ? 'e.g., {x | x != 0}'
                          : q.type === 'coordinate_input' ? 'e.g., (2, 3) or (-1/2, sqrt(2))'
                          : 'e.g., 3.14, -5, sqrt(2), 1/3'
                      }
                      value={String(userAns ?? '')}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{ maxWidth: 320, fontFamily: 'monospace', fontSize: '1.1rem' }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length - 1
                    ? <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                        Next<i className="bi bi-arrow-right ms-1" />
                      </button>
                    : <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit</>}
                      </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((_, i) => {
                    const a = answers[i]
                    const done = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    return (
                      <button key={i} onClick={() => goTo(i)}
                        className={`btn btn-sm ${i === currentIndex ? 'btn-primary' : done ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{ width: 36, height: 36, padding: 0, fontWeight: 600 }}>
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <hr />
                <div className="d-flex justify-content-between small text-muted">
                  <span><span className="badge bg-success me-1">■</span>Answered</span>
                  <span><span className="badge bg-secondary me-1">■</span>Skipped</span>
                  <span><span className="badge bg-primary me-1">■</span>Current</span>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button className="btn btn-success w-100" onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit Quiz</>}
                </button>
                <Link to="/courses/statistics2" className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                  <i className="bi bi-arrow-left me-1" />Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowCalc(v => !v)}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 48, height: 48,
          borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)',
          border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(102,126,234,0.5)', zIndex: 9998,
        }}>
        🧮
      </button>
      {showCalc && <Calculator onClose={() => setShowCalc(false)} />}
    </main>
  )
}

export default Stats2Quiz
