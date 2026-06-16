import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// 17 questions per subject per paper — official JEE Advanced structure (Sections I–IV)
const QUESTIONS_PER_ATTEMPT = 17
const FULL_TEST_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics']

// ─── MathJax ─────────────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax) return
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
    },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] },
  }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
  s.async = true
  document.head.appendChild(s)
}

function typesetEl(el) {
  if (!el) return
  const run = () => window.MathJax?.typesetPromise?.([el]).catch(() => {})
  if (window.MathJax?.typesetPromise) run()
  else setTimeout(run, 800)
}

// ─── Image helper ─────────────────────────────────────────────────────────────
// Images live at react-frontend/public/img/Graph_questions/
const imgSrc = (filename) =>
  filename ? `/img/Graph_questions/${filename}` : null

// ─── Subject accent colours ───────────────────────────────────────────────────
const SUBJECT_STYLE = {
  Physics:     { gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', badge: '#0d6efd' },
  Chemistry:   { gradient: 'linear-gradient(135deg,#198754,#20c997)', badge: '#198754' },
  Mathematics: { gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', badge: '#dc3545' },
  Full:        { gradient: 'linear-gradient(135deg,#6610f2,#0d6efd,#198754)', badge: '#6610f2' },
}

// ─── Shuffle helper ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ─── Normalise question type ──────────────────────────────────────────────────
function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  const hasImageOptions = q.option_images && Object.keys(q.option_images).length > 0
  // image_options questions have options:null but option_images — treat as MCQ
  if (!hasOptions && !hasImageOptions) return 'numeric'
  return q.type || 'multiple_choice'
}

// ─── Preprocess question text: fix literal \n and **bold** safety-net ────────
function preprocessText(text) {
  if (!text) return text
  // Convert literal backslash+n (two chars) to real newline
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 92 && i + 1 < text.length && text.charCodeAt(i + 1) === 110) {
      out += '\n'; i++
    } else {
      out += text[i]
    }
  }
  // Strip **bold** markdown
  out = out.replace(/\*\*([^*]*)\*\*/g, '$1')
  // Convert literal \times (outside math) → Unicode × as safety net
  out = out.replace(/\\times/g, '×')
  // Fix letter^\greek_cmd pattern left by plain-math converter → wrap in $
  out = out.replace(/\b([A-Za-z][A-Za-z0-9]*)\^\$\\([a-zA-Z]+)\$/g,
    (_, base, cmd) => `$${base}^{\\${cmd}}$`)
  return out
}

// ─── Replace (structure) with styled placeholder ──────────────────────────────
function renderTextWithStructures(text) {
  const clean = preprocessText(text)
  if (!clean || !clean.includes('(structure)')) return clean
  const parts = clean.split('(structure)')
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 10px', background: '#fff3cd',
          border: '1px dashed #ffc107', borderRadius: 4,
          fontSize: '0.8rem', color: '#856404',
          verticalAlign: 'middle', margin: '0 4px',
        }}>
          ⬡ Structure
        </span>
      )}
    </React.Fragment>
  ))
}

// ─── Parse List-I / List-II from question text ────────────────────────────────
// Handles both interleaved format: (P)...(1)...(Q)...(2)...
// and separate-section format: List-I: (P)...(Q)... List-II: (1)...(2)...
function parseMatchingLists(text) {
  if (!text) return null

  // Match (P/Q/R/S) or (1-9) only when preceded by line-start or whitespace
  // This avoids false matches inside chemical formulas like (NH4), (CO3), etc.
  const itemRe = /\(([PQRS]|[1-9])\)/g
  const positions = []
  let m
  while ((m = itemRe.exec(text)) !== null) {
    const prevChar = m.index > 0 ? text[m.index - 1] : '\n'
    if (prevChar === '\n' || prevChar === '\r' || prevChar === ' ' || prevChar === '\t' || m.index === 0) {
      positions.push({ id: m[1], matchStart: m.index, contentStart: m.index + m[0].length })
    }
  }

  if (positions.length === 0) return null

  // Each item's content runs until the next item label (any type)
  const items = positions.map((pos, i) => ({
    id: pos.id,
    content: text.substring(pos.contentStart, i + 1 < positions.length ? positions[i + 1].matchStart : text.length).trim(),
  }))

  const listI  = items.filter(item => 'PQRS'.includes(item.id))
  const listII = items.filter(item => /[1-9]/.test(item.id))
  if (listI.length === 0 && listII.length === 0) return null

  // Preamble = everything before the first item, stripped of bare List-I/II headers
  const preamble = text.substring(0, positions[0].matchStart)
    .replace(/\bList[ -]?I{1,2}\b[:\s]*/gi, ' ')
    .trim()

  return { preamble, listI, listII }
}

// ─── Question content renderer ────────────────────────────────────────────────
function QuestionContent({ q }) {
  const parsed = parseMatchingLists(preprocessText(q.question_text))

  if (parsed) {
    const hasListIText  = parsed.listI.length > 0
    const hasListIIText = parsed.listII.length > 0

    // Image placement:
    // • Only List-I has text  → image belongs to List-II column
    // • Only List-II has text → image belongs to List-I column
    // • Both have text        → image goes at top of List-I (usually the structure diagram)
    const imgInListI  = q.image_url && (!hasListIText || (hasListIText && hasListIIText))
    const imgInListII = q.image_url && hasListIText && !hasListIIText

    const listImg = (alt) => (
      <img src={imgSrc(q.image_url)} alt={alt}
        style={{ maxWidth: '100%', borderRadius: 6, marginBottom: hasListIText ? 10 : 0 }}
        onError={e => { e.target.style.display = 'none' }} />
    )

    const itemRow = (item, color) => (
      <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 10, lineHeight: 1.6, fontSize: '0.95rem', alignItems: 'flex-start' }}>
        <span style={{ fontWeight: 700, minWidth: 30, color, flexShrink: 0 }}>({item.id})</span>
        <span>{renderTextWithStructures(item.content)}</span>
      </div>
    )

    return (
      <div>
        {parsed.preamble && (
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {renderTextWithStructures(parsed.preamble)}
          </p>
        )}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div style={{ background: '#f0f7ff', border: '1px solid #b8d4f5', borderRadius: 10, padding: 16 }}>
              <h6 style={{ color: '#0d6efd', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #b8d4f5', paddingBottom: 8 }}>
                List-I
              </h6>
              {imgInListI && listImg('List-I diagram')}
              {parsed.listI
                // When image covers List-I, hide items that are pure structure placeholders
                .filter(item => imgInListI
                  ? item.content.trim() !== '' && !item.content.trim().startsWith('(structure)')
                  : true)
                .map(item => itemRow(item, '#0d6efd'))}
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ background: '#f0fff4', border: '1px solid #a3d9b7', borderRadius: 10, padding: 16 }}>
              <h6 style={{ color: '#198754', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #a3d9b7', paddingBottom: 8 }}>
                List-II
              </h6>
              {imgInListII && listImg('List-II diagram')}
              {parsed.listII.map(item => itemRow(item, '#198754'))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        {renderTextWithStructures(q.question_text)}
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <a href={imgSrc(q.image_url)} target="_blank" rel="noopener noreferrer">
            <img src={imgSrc(q.image_url)} alt="Question diagram"
              style={{ maxWidth: '100%', maxHeight: 700, borderRadius: 10, border: '1px solid #dee2e6' }}
              onError={e => { e.target.style.display = 'none' }} />
          </a>
        </div>
      )}
    </>
  )
}

// ─── JEE marking ─────────────────────────────────────────────────────────────
function calcMarks(q, userAns) {
  const scheme = q.marking_scheme || { full: 3, negative: -1, zero: 0 }
  const type = resolveType(q)

  // Unattempted
  const empty =
    userAns === undefined || userAns === null || userAns === '' ||
    (Array.isArray(userAns) && userAns.length === 0)
  if (empty) return { isCorrect: false, marksAwarded: scheme.zero ?? 0, unattempted: true }

  if (type === 'multiple_choice') {
    const correct = String(q.correct_answer ?? '').trim()
    const given   = String(userAns).trim()
    const ok = correct === given
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 3) : (scheme.negative ?? -1) }
  }

  if (type === 'multiple_select') {
    const corrSet = new Set(
      (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer])
        .map(a => String(a).trim())
    )
    const userSet = new Set((Array.isArray(userAns) ? userAns : [userAns]).map(a => String(a).trim()))
    const ok = corrSet.size === userSet.size && [...corrSet].every(a => userSet.has(a))
    if (ok) return { isCorrect: true, marksAwarded: scheme.full ?? 4 }

    // JEE Advanced MSQ rule: any wrong option selected -> negative marks
    const wrongSelected = [...userSet].some(a => !corrSet.has(a))
    if (wrongSelected) return { isCorrect: false, marksAwarded: scheme.negative ?? -2 }

    // Otherwise: partial credit for the number of correct options selected
    const correctSelectedCount = [...userSet].filter(a => corrSet.has(a)).length
    const partial = scheme[`partial_${correctSelectedCount}`]
    return { isCorrect: false, marksAwarded: partial ?? 0 }
  }

  if (type === 'numeric') {
    const given = parseFloat(String(userAns).trim())
    if (isNaN(given)) return { isCorrect: false, marksAwarded: scheme.negative ?? -1 }
    let ok = false
    const ca = q.correct_answer
    if (ca !== null && typeof ca === 'object' && 'min' in ca && 'max' in ca) {
      ok = given >= ca.min && given <= ca.max
    } else {
      ok = Math.abs(given - parseFloat(String(ca))) < 0.01
    }
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 3) : (scheme.negative ?? -1) }
  }

  return { isCorrect: false, marksAwarded: 0 }
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, subject, onRetake }) => {
  const [expanded, setExpanded] = useState(null)
  const ref = useRef(null)
  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics
  const isFull = subject === 'Full'

  useEffect(() => {
    if (ref.current) typesetEl(ref.current)
  }, [expanded])

  const scoreColor = results.percentage >= 60 ? '#28a745' : '#dc3545'

  return (
    <main className="main" ref={ref}>
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>JEE {isFull ? 'Full Test' : subject} — Review</h1>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/jee">JEE Advanced</Link></li>
              <li className="current">Review</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {/* Score card */}
        <div className="card border-0 shadow-sm mb-4 text-center" style={{ borderRadius: 16 }}>
          <div style={{ height: 6, background: style.gradient, borderRadius: '16px 16px 0 0' }} />
          <div className="card-body py-4">
            <div className="row justify-content-center g-4 align-items-center">
              <div className="col-auto">
                <div style={{
                  width: 130, height: 130, borderRadius: '50%',
                  background: results.percentage >= 60
                    ? 'linear-gradient(135deg,#28a745,#20c997)'
                    : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 30, fontWeight: 700, color: '#fff' }}>{results.percentage}%</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                    {results.score}/{results.maxScore} pts
                  </span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-2">
                  {results.percentage >= 80 ? '🏆 Excellent!'
                    : results.percentage >= 60 ? '👍 Good job!'
                    : '📚 Keep practicing!'}
                </h4>
                <p className="mb-1 text-muted">
                  Correct: <strong className="text-success">{results.correctAnswers}</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{results.wrongAnswers}</strong> &nbsp;|&nbsp;
                  Unattempted: <strong className="text-secondary">{results.unattempted}</strong>
                </p>
                <p className="mb-0 text-muted">
                  Net Score: <strong style={{ color: scoreColor }}>{results.score}</strong> / {results.maxScore}
                  &nbsp;|&nbsp;Time: {Math.floor(results.totalTime / 60)}m {results.totalTime % 60}s
                </p>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center mt-4">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" />Retake
              </button>
              <Link to="/courses/jee" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1" />Back to JEE
              </Link>
            </div>
          </div>
        </div>

        {/* Per-question review */}
        {questions.map((q, idx) => {
          const res = results.responses[idx]
          const isOpen = expanded === idx
          const borderColor = res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'

          return (
            <div
              key={q._id || idx}
              className="card border-0 shadow-sm mb-3"
              style={{ borderRadius: 12, borderLeft: `4px solid ${borderColor}` }}
            >
              <div
                className="card-body"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : idx)}
              >
                <div className="d-flex align-items-start gap-3">
                  {/* Status circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${res?.unattempted ? 'bi-dash' : res?.isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                        Q{idx + 1}. {!isOpen && q.question_text.length > 120
                          ? q.question_text.slice(0, 120) + '…'
                          : q.question_text}
                      </p>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      {isFull && <span className="badge bg-dark">{q.subject}</span>}
                      <span className="badge bg-secondary">{q.type}</span>
                      {q.subtopic && <span className="badge bg-info text-dark">{q.subtopic}</span>}
                      <span className="badge bg-light text-dark border">{q.points || 3} pts</span>
                      {res?.marksAwarded > 0 && (
                        <span className="badge bg-success">+{res.marksAwarded} earned</span>
                      )}
                      {res?.marksAwarded < 0 && (
                        <span className="badge bg-danger">{res.marksAwarded} penalty</span>
                      )}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {/* Question image */}
                    {q.image_url && (
                      <div className="mb-3">
                        <img
                          src={imgSrc(q.image_url)}
                          alt="Question diagram"
                          style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #dee2e6' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}

                    {/* MCQ options */}
                    {resolveType(q) === 'multiple_choice' && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const corrAns = String(q.correct_answer ?? '').trim()
                          const isCorrectOpt = corrAns === opt.option_id
                          const userPicked = String(answers[idx] ?? '').trim() === opt.option_id
                          const bg = isCorrectOpt
                            ? '#d4edda'
                            : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div
                              key={oi}
                              className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                              style={{ background: bg }}
                            >
                              <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                              <div>
                                <span style={{ fontSize: '0.9rem' }}>{opt.text}</span>
                                {q.option_images?.[opt.option_id] && (
                                  <div className="mt-1">
                                    <img
                                      src={imgSrc(q.option_images[opt.option_id])}
                                      alt={`Option ${opt.option_id}`}
                                      style={{ maxWidth: 280, borderRadius: 6, border: '1px solid #dee2e6' }}
                                      onError={e => { e.target.style.display = 'none' }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* MSQ options */}
                    {resolveType(q) === 'multiple_select' && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const corrArr = Array.isArray(q.correct_answer)
                            ? q.correct_answer.map(String)
                            : [String(q.correct_answer)]
                          const isCorrectOpt = corrArr.includes(opt.option_id)
                          const userPicked = Array.isArray(answers[idx])
                            ? answers[idx].includes(opt.option_id)
                            : false
                          const bg = isCorrectOpt
                            ? '#d4edda'
                            : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div
                              key={oi}
                              className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                              style={{ background: bg }}
                            >
                              <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                              <span style={{ fontSize: '0.9rem' }}>{opt.text}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Numeric */}
                    {resolveType(q) === 'numeric' && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border fs-6">
                          Your answer: <strong>{answers[idx] ?? '(not answered)'}</strong>
                        </span>
                        <span className="badge bg-success fs-6">
                          Correct:{' '}
                          <strong>
                            {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                              ? `${q.correct_answer.min} – ${q.correct_answer.max}`
                              : String(q.correct_answer)}
                          </strong>
                        </span>
                      </div>
                    )}

                    {/* Concept tags */}
                    {q.concept_tags?.length > 0 && (
                      <div className="mt-2">
                        <small className="text-muted me-1">Topics:</small>
                        {q.concept_tags.map(t => (
                          <span key={t} className="badge bg-light text-dark border me-1" style={{ fontSize: '0.75rem' }}>{t}</span>
                        ))}
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

// ─── Main Quiz Component ──────────────────────────────────────────────────────
const JEEQuiz = () => {
  const { subject } = useParams()
  const navigate = useNavigate()
  const isFull = subject === 'Full'

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const userRef          = useRef(null)
  const questionRef      = useRef(null)

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics

  useEffect(() => { loadMathJax() }, [])
  useEffect(() => { if (questionRef.current) typesetEl(questionRef.current) }, [currentIndex, questions])
  useEffect(() => { checkAuth() }, [])

  // Tab-switch detection
  useEffect(() => {
    if (submitted || loading) return
    const onBlur  = () => setTabWarning(true)
    const onFocus = () => setTabWarning(false)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [submitted, loading])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data); userRef.current = res.data
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchQuestions = async () => {
    try {
      if (isFull) {
        // Full test: pool QUESTIONS_PER_ATTEMPT questions from each subject
        const responses = await Promise.all(
          FULL_TEST_SUBJECTS.map(sub =>
            axios.get(`${API_URL}/api/jee_questions?subject=${encodeURIComponent(sub)}`, { withCredentials: true })
          )
        )
        const pooled = responses.flatMap(res => {
          const qs = Array.isArray(res.data) ? res.data : []
          return shuffle(qs).slice(0, QUESTIONS_PER_ATTEMPT)
        })
        if (!pooled.length) { setError('No questions found for the Full Test.'); setLoading(false); return }
        setQuestions(shuffle(pooled))
        return
      }

      const res = await axios.get(
        `${API_URL}/api/jee_questions?subject=${encodeURIComponent(subject)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) { setError(`No questions found for ${subject}.`); setLoading(false); return }

      setQuestions(shuffle(qs).slice(0, QUESTIONS_PER_ATTEMPT))
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Answer helpers ──────────────────────────────────────────────────────────
  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return {
        ...prev,
        [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId],
      }
    })
  }

  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_, i) => {
        const a = answers[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    let correctCount = 0
    let wrongCount = 0
    let unattemptedCount = 0
    let totalScore = 0
    const maxScore = questions.reduce((s, q) => s + (q.points || 3), 0)
    const responses = []

    questions.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted } = calcMarks(q, answers[i])
      if (unattempted) unattemptedCount++
      else if (isCorrect) correctCount++
      else wrongCount++
      totalScore += marksAwarded

      responses.push({
        questionId: q._id,
        questionText: q.question_text,
        userResponse: answers[i] ?? null,
        correctAnswer: q.correct_answer,
        isCorrect,
        marksAwarded,
        unattempted: !!unattempted,
      })
    })

    const totalTime = Object.values(timesRef.current).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    setResults({
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unattempted: unattemptedCount,
      score: totalScore,
      maxScore,
      percentage,
      totalTime,
      responses,
    })
    setSubmitted(true)

    // Persist score
    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      if (isFull) {
        // Split responses/questions by their actual subject and save one record per subject
        await Promise.all(FULL_TEST_SUBJECTS.map(async (sub) => {
          const idxs = questions.map((q, i) => i).filter(i => questions[i].subject === sub)
          if (!idxs.length) return
          let subCorrect = 0, subWrong = 0, subUnattempted = 0, subScore = 0, subMax = 0
          const subResponses = []
          idxs.forEach(i => {
            const r = responses[i]
            if (r.unattempted) subUnattempted++
            else if (r.isCorrect) subCorrect++
            else subWrong++
            subScore += r.marksAwarded
            subMax += questions[i].points || 3
            subResponses.push(r)
          })
          await axios.post(`${API_URL}/api/jee_scores`, {
            email: u.email,
            name: u.username || u.name || u.email,
            subject: sub,
            totalQuestions: idxs.length,
            correctAnswers: subCorrect,
            wrongAnswers: subWrong,
            unattempted: subUnattempted,
            score: subScore,
            maxScore: subMax,
            responses: subResponses,
          }, { withCredentials: true })
        }))
      } else {
        await axios.post(`${API_URL}/api/jee_scores`, {
          email: u.email,
          name: u.username || u.name || u.email,
          subject,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          unattempted: unattemptedCount,
          score: totalScore,
          maxScore,
          responses,
        }, { withCredentials: true })
      }
    } catch (e) {
      console.error('Failed to save score:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setAnswers({}); setSubmitted(false); setResults(null)
    setCurrentIndex(0); timesRef.current = {}
    setLoading(true)
    fetchQuestions()
  }

  // ── States ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading JEE {isFull ? 'Full Test' : `${subject} questions`}…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={fetchQuestions}>Retry</button>
      <Link to="/courses/jee" className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage
      questions={questions}
      answers={answers}
      results={results}
      subject={subject}
      onRetake={handleRetake}
    />
  )

  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered =
    userAns !== undefined && userAns !== null && userAns !== '' &&
    !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  return (
    <main className="main">
      {/* Tab warning banner */}
      {tabWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
          background: '#dc3545', color: '#fff', textAlign: 'center',
          padding: '8px', fontWeight: 600,
        }}>
          ⚠️ Tab switching detected! Please stay on this page.
          <button
            onClick={() => setTabWarning(false)}
            style={{ marginLeft: 16, background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>JEE Advanced — {isFull ? 'Full Test' : subject}</h1>
                <p className="mb-0">17 questions per subject · MCQ +3/−1 · MSQ +4/−2 · Numeric +3 · Matching +3/−1</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/jee">JEE Advanced</Link></li>
              <li className="current">{isFull ? 'Full Test' : subject}</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5" ref={questionRef}>
        <div className="row g-4">
          {/* ── Question panel ── */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 5, background: style.gradient }} />
              <div className="card-body p-4">
                {/* Progress row */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small">
                    {isFull && <strong className="me-2">{q.subject}</strong>}
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>
                      {isAnswered ? 'Answered' : 'Not answered'}
                    </span>
                    <span className="badge" style={{ background: style.badge }}>{q.type}</span>
                    {q.difficulty && (
                      <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                        {q.difficulty}
                      </span>
                    )}
                    <span className="badge bg-light text-dark border">{q.points || 3} pts</span>
                  </div>
                </div>

                <div className="progress mb-4" style={{ height: 5 }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: style.gradient }}
                  />
                </div>

                {/* Question text */}
                {q.topic && <p className="text-muted small mb-1">{q.topic} › {q.subtopic}</p>}
                <QuestionContent q={q} />

                {/* ── MCQ ── */}
                {resolveType(q) === 'multiple_choice' && (
                  <div>
                    {/* Synthesise options for image-only questions (options: null) */}
                    {(Array.isArray(q.options) && q.options.length > 0
                      ? q.options
                      : Object.keys(q.option_images || {}).sort().map(id => ({ option_id: id, text: '' }))
                    ).map((opt, oi) => {
                      const selected = String(userAns ?? '') === opt.option_id
                      return (
                        <div
                          key={oi}
                          onClick={() => setAnswer(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          {/* Radio dot */}
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                            border: `2px solid ${selected ? '#0d6efd' : '#adb5bd'}`,
                            background: selected ? '#0d6efd' : 'transparent',
                          }} />
                          <div>
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            {opt.text && <span style={{ fontSize: '0.95rem' }}>{opt.text}</span>}
                            {q.option_images?.[opt.option_id] && (
                              <div className="mt-2">
                                <img
                                  src={imgSrc(q.option_images[opt.option_id])}
                                  alt={`Option ${opt.option_id}`}
                                  style={{ maxWidth: 280, borderRadius: 6, border: '1px solid #dee2e6' }}
                                  onError={e => { e.target.style.display = 'none' }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── MSQ ── */}
                {resolveType(q) === 'multiple_select' && (
                  <div>
                    <p className="text-muted small mb-2">Select one or more correct options</p>
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                      return (
                        <div
                          key={oi}
                          onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                            border: `2px solid ${selected ? '#0d6efd' : '#adb5bd'}`,
                            background: selected ? '#0d6efd' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {selected && <i className="bi bi-check text-white" style={{ fontSize: 12 }} />}
                          </div>
                          <div>
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            <span style={{ fontSize: '0.95rem' }}>{opt.text}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Numeric ── */}
                {resolveType(q) === 'numeric' && (
                  <div>
                    <p className="text-muted small mb-2">
                      Enter your numeric answer
                      {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                        ? ' (answer accepted within a range)'
                        : ''}
                    </p>
                    <input
                      type="number"
                      step="any"
                      className="form-control form-control-lg"
                      placeholder="Enter answer…"
                      value={userAns ?? ''}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{ maxWidth: 260, fontFamily: 'monospace', fontSize: '1.1rem' }}
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => goTo(currentIndex - 1)}
                    disabled={currentIndex === 0}
                  >
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length - 1
                    ? (
                      <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                        Next<i className="bi bi-arrow-right ms-1" />
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => handleSubmit(false)}
                        disabled={saving}
                      >
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                          : <><i className="bi bi-check-lg me-1" />Submit</>}
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="col-lg-4">
            {/* Question navigator */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((qn, i) => {
                    const a = answers[i]
                    const done = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    return (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`btn btn-sm ${i === currentIndex ? 'btn-primary' : done ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{ width: 36, height: 36, padding: 0, fontWeight: 600 }}
                      >
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

            {/* Marking scheme */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">Marking Scheme</h6>
                <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                  <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section I — MCQ (single correct)</span>
                  <span className="text-success">✓ Correct: +3 &nbsp;|&nbsp; ✗ Wrong: −1</span>
                  <span className="text-muted fw-semibold mt-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section II — MSQ (one or more)</span>
                  <span className="text-success">✓ All correct: +4</span>
                  <span className="text-success">✓ Partial (no wrong): +1/+2/+3</span>
                  <span className="text-danger">✗ Any wrong option: −2</span>
                  <span className="text-muted fw-semibold mt-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section III — Numeric (integer)</span>
                  <span className="text-success">✓ Correct: +3 &nbsp;|&nbsp; ✗ Wrong: 0 / −1</span>
                  <span className="text-muted fw-semibold mt-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section IV — Matching List</span>
                  <span className="text-success">✓ Correct: +3 &nbsp;|&nbsp; ✗ Wrong: −1</span>
                  <span className="text-secondary mt-1">— Unattempted: 0</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button
                  className="btn btn-success w-100"
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : <><i className="bi bi-check-lg me-1" />Submit Quiz</>}
                </button>
                <Link to="/courses/jee" className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                  <i className="bi bi-arrow-left me-1" />Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default JEEQuiz
