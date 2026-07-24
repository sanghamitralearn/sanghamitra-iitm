import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CATScoreDashboard, { buildChapterItems } from './CATScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Real CAT section names ─────────────────────────────────────────────────
export const VARC = 'Verbal Ability & Reading Comprehension'
export const DILR = 'Data Interpretation & Logical Reasoning'
export const QA   = 'Quantitative Ability'

// ─── Section accent colours — warm palette distinct from GRE/SAT/GMAT/GATE-DA ─
export const SUBJECT_STYLE = {
  [VARC]: { gradient: 'linear-gradient(135deg,#e8590c,#ff922b)', badge: '#e8590c' },
  [DILR]: { gradient: 'linear-gradient(135deg,#c92a2a,#ff6b6b)', badge: '#c92a2a' },
  [QA]:   { gradient: 'linear-gradient(135deg,#f08c00,#ffd43b)', badge: '#f08c00' },
}

// ─── Section config — real CAT format: one fixed-length section each, no adaptive modules ─
// subject must match what is stored in the DB. "modules" keeps the {1: {...}} shape so
// this config plugs into the same section/module route (/courses/cat/quiz/:section/:module)
// used by every other exam family, even though CAT only ever has module 1.
export const SECTION_CONFIG = {
  varc: { subject: VARC, label: 'VARC', modules: { 1: { questionCount: 24, timeMin: 40 } } },
  dilr: { subject: DILR, label: 'DILR', modules: { 1: { questionCount: 20, timeMin: 40 } } },
  qa:   { subject: QA,   label: 'QA',   modules: { 1: { questionCount: 22, timeMin: 40 } } },
}

// ─── Timer formatting (m:ss) ───────────────────────────────────────────────────
export function formatTime(totalSeconds) {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── KaTeX ───────────────────────────────────────────────────────────────────
export function loadKaTeX() {
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
    if (typeof window.renderMathInElement === 'undefined') { setTimeout(run, 300); return }
    window.renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }
  setTimeout(run, 50)
}

// ─── MathText: renders $...$ LaTeX for question/option bodies ────────────────
export const MathText = ({ text, style, className }) => {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])
  const html = (text || '').replace(/\\%/g, '%').replace(/\\\\/g, '<br>')
  return (
    <span ref={ref} className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Image helper ─────────────────────────────────────────────────────────────
export const imgSrc = (filename) =>
  filename ? `/img/Graph_questions/${filename}` : null

// ─── Normalise question type ──────────────────────────────────────────────────
// cat_questions collection uses: multiple_choice / multiple_choice_single, multiple_select, numeric (TITA).
export function resolveType(q) {
  const t = q.type || ''
  if (t === 'numeric' || t === 'numeric_entry' || t === 'integer') return 'numeric'
  if (t === 'multiple_select') return 'multiple_select'

  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  if (!hasOptions) return 'numeric'

  if (Array.isArray(q.correct_answer) && q.correct_answer.length > 1) return 'multiple_select'
  return 'multiple_choice'
}

// ─── Passage block (shared-context box shown above a question) ───────────────
function PassageBlock({ text, subject }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])
  if (!text) return null
  const accent = (SUBJECT_STYLE[subject] || SUBJECT_STYLE[VARC]).badge
  const html = (text || '').replace(/\\%/g, '%').replace(/\\\\/g, '<br>')
  return (
    <div style={{
      background: `${accent}0d`, border: `1px solid ${accent}44`,
      borderLeft: `4px solid ${accent}`, borderRadius: 10,
      padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: accent, marginBottom: 10, textTransform: 'uppercase' }}>
        Passage / Data
      </div>
      <div ref={ref} style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ─── Question content renderer ────────────────────────────────────────────────
export function QuestionContent({ q }) {
  return (
    <>
      {q.passage && <PassageBlock text={q.passage} subject={q.subject} />}
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        <MathText text={q.question_text} />
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <img src={imgSrc(q.image_url)} alt="Question diagram"
            style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 10, border: '1px solid #dee2e6' }}
            onError={e => { e.target.style.display = 'none' }} />
        </div>
      )}
    </>
  )
}

// ─── Checks whether a question has been answered ──────────────────────────────
export function isAnswerFilled(q, ans) {
  return ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && !ans.length)
}

// ─── Real CAT marking: MCQ +3 correct / -1 wrong / 0 unattempted;
// TITA (numeric) +3 correct / 0 wrong / 0 unattempted — no negative marking on TITA ─
export function calcMarks(q, userAns) {
  const type = resolveType(q)
  const scheme = q.marking_scheme || { full: q.points || 3, negative: type === 'numeric' ? 0 : -1, zero: 0 }

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
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 3) : (scheme.negative ?? -1) }
  }

  if (type === 'numeric') {
    const given = parseFloat(String(userAns).trim())
    if (isNaN(given)) return { isCorrect: false, marksAwarded: scheme.negative ?? 0 }
    let ok = false
    const ca = q.correct_answer
    if (ca !== null && typeof ca === 'object' && 'min' in ca && 'max' in ca) {
      ok = given >= ca.min && given <= ca.max
    } else {
      ok = Math.abs(given - parseFloat(String(ca))) < 0.01
    }
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 3) : (scheme.negative ?? 0) }
  }

  return { isCorrect: false, marksAwarded: 0 }
}

// ─── Per-question review item ─────────────────────────────────────────────────
export const QuestionReviewItem = ({ q, idx, answer, res, isOpen, onToggle }) => {
  const borderColor = res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'
  const type = resolveType(q)

  return (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12, borderLeft: `4px solid ${borderColor}` }}>
      <div className="card-body" style={{ cursor: 'pointer' }} onClick={onToggle}>
        <div className="d-flex align-items-start gap-3">
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
                Q{idx + 1}.{' '}
                {!isOpen
                  ? (q.question_text.slice(0, 120) + (q.question_text.length > 120 ? '…' : ''))
                  : <MathText text={q.question_text} />}
              </p>
              <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
            </div>
            <div className="d-flex gap-2 flex-wrap mt-1">
              <span className="badge bg-secondary">{type === 'numeric' ? 'TITA' : 'MCQ'}</span>
              {q.subtopic && <span className="badge bg-info text-dark">{q.subtopic}</span>}
              <span className="badge bg-light text-dark border">{q.points || 3} pt</span>
              {res?.marksAwarded > 0 && <span className="badge bg-success">+{res.marksAwarded} earned</span>}
              {res?.marksAwarded < 0 && <span className="badge bg-danger">{res.marksAwarded} penalty</span>}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 ms-5 ps-2">
            {q.passage && <PassageBlock text={q.passage} subject={q.subject} />}
            {q.image_url && (
              <div className="mb-3">
                <img src={imgSrc(q.image_url)} alt="Question diagram"
                  style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, border: '1px solid #dee2e6' }}
                  onError={e => { e.target.style.display = 'none' }} />
              </div>
            )}

            {type === 'multiple_choice' && (
              <div className="mb-3">
                {q.options.map((opt, oi) => {
                  const corrAns = String(q.correct_answer ?? '').trim()
                  const isCorrectOpt = corrAns === opt.option_id
                  const userPicked = String(answer ?? '').trim() === opt.option_id
                  const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                  return (
                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded" style={{ background: bg }}>
                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                      {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                      {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                      <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                    </div>
                  )
                })}
              </div>
            )}

            {type === 'multiple_select' && (
              <div className="mb-3">
                {q.options.map((opt, oi) => {
                  const corrArr = Array.isArray(q.correct_answer) ? q.correct_answer.map(String) : [String(q.correct_answer)]
                  const isCorrectOpt = corrArr.includes(opt.option_id)
                  const userPicked = Array.isArray(answer) ? answer.includes(opt.option_id) : false
                  const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                  return (
                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded" style={{ background: bg }}>
                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                      {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                      {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                      <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                    </div>
                  )
                })}
              </div>
            )}

            {type === 'numeric' && (
              <div className="d-flex gap-2 flex-wrap mb-3">
                <span className="badge bg-light text-dark border fs-6">
                  Your answer: <strong>{answer ?? '(not answered)'}</strong>
                </span>
                <span className="badge bg-success fs-6">
                  Correct: <strong>
                    {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                      ? `${q.correct_answer.min} – ${q.correct_answer.max}`
                      : String(q.correct_answer)}
                  </strong>
                </span>
              </div>
            )}

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
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, label, onRetake }) => {
  const [expanded, setExpanded] = useState(null)
  const chapterItems = buildChapterItems(questions, results.responses, label)

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>CAT {label} — Review</h1>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/cat">CAT</Link></li>
              <li className="current">Review</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        <CATScoreDashboard
          results={results}
          chapterItems={chapterItems}
          onRetake={onRetake}
          heroTitle={`${label} Completed!`}
        />

        <h5 className="fw-bold mb-3 mt-4">Question-by-Question Review</h5>
        {questions.map((q, idx) => (
          <QuestionReviewItem
            key={q._id || idx}
            q={q}
            idx={idx}
            answer={answers[idx]}
            res={results.responses[idx]}
            isOpen={expanded === idx}
            onToggle={() => setExpanded(expanded === idx ? null : idx)}
          />
        ))}
      </div>
    </main>
  )
}

// ─── Tab-switch warning banner ────────────────────────────────────────────────
export const TabWarningBanner = ({ show, onDismiss }) => {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      background: '#dc3545', color: '#fff', textAlign: 'center', padding: '8px', fontWeight: 600,
    }}>
      ⚠️ Tab switching detected! Please stay on this page.
      <button onClick={onDismiss}
        style={{ marginLeft: 16, background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>
        Dismiss
      </button>
    </div>
  )
}

// ─── Quiz panel: question card + sidebar (used by CATQuiz and CATFullTest) ───
export const QuizPanel = ({
  questions, currentIndex, answers, setAnswer, toggleMSQ, goTo,
  style, saving, onSubmit,
  submitLabel = 'Submit Section', exitTo = '/courses/cat', exitLabel = 'Exit',
  mode = 'single', onSubmitStage,
}) => {
  const q = questions[currentIndex]
  const qType = resolveType(q)
  const userAns = answers[currentIndex]
  const isAnswered = isAnswerFilled(q, userAns)
  const answeredCount = questions.filter((qn, i) => isAnswerFilled(qn, answers[i])).length

  return (
    <div className="container mb-5">
      <div className="row g-4">
        {/* ── Question panel ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ height: 5, background: style.gradient }} />
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
                <div className="d-flex gap-2 flex-wrap">
                  <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>
                    {isAnswered ? 'Answered' : 'Not answered'}
                  </span>
                  <span className="badge" style={{ background: style.badge }}>{qType === 'numeric' ? 'TITA' : 'MCQ'}</span>
                  {q.difficulty && (
                    <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {q.difficulty}
                    </span>
                  )}
                  <span className="badge bg-light text-dark border">{q.points || 3} pt</span>
                </div>
              </div>

              <div className="progress mb-4" style={{ height: 5 }}>
                <div className="progress-bar" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: style.gradient }} />
              </div>

              {q.topic && <p className="text-muted small mb-1">{q.topic}{q.subtopic ? ` › ${q.subtopic}` : ''}</p>}
              <QuestionContent q={q} />

              {/* ── MCQ ── */}
              {qType === 'multiple_choice' && (
                <div>
                  {q.options.map((opt, oi) => {
                    const selected = String(userAns ?? '') === opt.option_id
                    return (
                      <div key={oi} onClick={() => setAnswer(currentIndex, opt.option_id)}
                        className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          border: `2px solid ${selected ? style.badge : '#adb5bd'}`,
                          background: selected ? style.badge : 'transparent',
                        }} />
                        <div>
                          <span className="fw-semibold me-2">{opt.option_id}.</span>
                          <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── MSQ ── */}
              {qType === 'multiple_select' && (
                <div>
                  <p className="text-muted small mb-2">Select one or more correct options</p>
                  {q.options.map((opt, oi) => {
                    const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                    return (
                      <div key={oi} onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                        className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                          border: `2px solid ${selected ? style.badge : '#adb5bd'}`,
                          background: selected ? style.badge : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <i className="bi bi-check text-white" style={{ fontSize: 12 }} />}
                        </div>
                        <div>
                          <span className="fw-semibold me-2">{opt.option_id}.</span>
                          <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── TITA (numeric) ── */}
              {qType === 'numeric' && (
                <div>
                  <p className="text-muted small mb-2">
                    Type in the answer (TITA) — no negative marking on this question
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

              <div className="d-flex justify-content-between align-items-center mt-4">
                <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                  <i className="bi bi-arrow-left me-1" />Prev
                </button>
                <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                {currentIndex < questions.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                    Next<i className="bi bi-arrow-right ms-1" />
                  </button>
                ) : mode === 'full' ? (
                  <button className="btn btn-success" onClick={onSubmitStage} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit Section</>}
                  </button>
                ) : (
                  <button className="btn btn-success" onClick={onSubmit} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <h6 className="fw-bold mb-3">Question Navigator</h6>
              <div className="d-flex flex-wrap gap-2">
                {questions.map((qn, i) => {
                  const done = isAnswerFilled(qn, answers[i])
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

          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <h6 className="fw-bold mb-2">Marking Scheme</h6>
              <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                <span className="text-success fw-semibold">✓ Correct MCQ: +3</span>
                <span className="text-danger">✗ Wrong MCQ: −1</span>
                <span className="text-success fw-semibold">✓ Correct TITA: +3</span>
                <span className="text-secondary">✗ Wrong / Unattempted TITA: 0</span>
              </div>
              <hr className="my-2" />
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                <i className="bi bi-info-circle me-1" />
                {questions.length} question{questions.length !== 1 ? 's' : ''} · no going back once submitted
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
              {mode === 'full' ? (
                <>
                  <button className="btn btn-success w-100" onClick={onSubmitStage} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit Section</>}
                  </button>
                  <Link to={exitTo} className="btn btn-outline-secondary w-100 mt-2 btn-sm"
                    onClick={e => { if (!window.confirm('Exit the test? Unsubmitted answers in this section will be lost.')) e.preventDefault() }}>
                    <i className="bi bi-arrow-left me-1" />{exitLabel}
                  </Link>
                </>
              ) : (
                <>
                  <button className="btn btn-success w-100" onClick={onSubmit} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />{submitLabel}</>}
                  </button>
                  <Link to={exitTo} className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                    <i className="bi bi-arrow-left me-1" />{exitLabel}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Quiz Component (single-section practice) ────────────────────────────
const CATQuiz = () => {
  const { section, module } = useParams()
  const navigate = useNavigate()

  const config = SECTION_CONFIG[section] || SECTION_CONFIG.varc
  const { subject, label } = config
  const moduleNum = parseInt(module, 10) || 1
  const moduleConfig = config.modules[moduleNum] || config.modules[1]
  const { questionCount } = moduleConfig

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE[QA]

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [timeLeft, setTimeLeft]   = useState(null)

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const userRef          = useRef(null)
  const authCheckedRef   = useRef(false)
  const handleSubmitRef  = useRef(() => {})

  useEffect(() => { loadKaTeX() }, [])
  useEffect(() => {
    if (authCheckedRef.current) return
    authCheckedRef.current = true
    checkAuth()
  }, [])

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

  // ── Section timer: starts once questions are loaded, auto-submits at 0 ────
  useEffect(() => {
    if (loading || submitted || !questions.length) return
    if (timeLeft === null) { setTimeLeft(moduleConfig.timeMin * 60); return }
    if (timeLeft <= 0) { handleSubmitRef.current(true); return }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000)
    return () => clearTimeout(t)
  }, [loading, submitted, questions.length, timeLeft])

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
      const res = await axios.get(
        `${API_URL}/api/cat_questions?subject=${encodeURIComponent(subject)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) {
        try {
          const dbg = await axios.get(`${API_URL}/api/cat_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError(`No questions found for "${subject}".`)
        setLoading(false)
        return
      }

      const shuffled = [...qs]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setQuestions(shuffled.slice(0, questionCount))
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
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
      const unanswered = questions.filter((q, i) => !isAnswerFilled(q, answers[i])).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    const u = userRef.current
    const totalTime = Object.values(timesRef.current).reduce((a, b) => a + b, 0)

    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
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

    if (!u?.email) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/cat_scores`, {
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
    } catch (e) {
      console.error('Failed to save score:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setAnswers({}); setSubmitted(false); setResults(null)
    setCurrentIndex(0); timesRef.current = {}; setTimeLeft(null)
    fetchQuestions()
  }

  handleSubmitRef.current = handleSubmit

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading CAT {label} questions…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-warning" />
      <h4 className="mt-3">{error}</h4>

      {debugInfo && (
        <div className="card border-0 shadow-sm mx-auto mt-4 text-start" style={{ maxWidth: 480, borderRadius: 12 }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-database me-2 text-primary" />
              What's in your <code>cat_questions</code> collection
            </h6>
            <p className="mb-1 text-muted small">Total documents: <strong>{debugInfo.totalQuestions}</strong></p>
            <p className="mb-2 text-muted small">Subject values found in DB:</p>
            {debugInfo.distinctSubjects.length > 0 ? (
              <ul className="mb-0 ps-3">
                {debugInfo.distinctSubjects.map(s => (
                  <li key={s} className="small">
                    <code>{s}</code>
                    {s === subject ? <span className="badge bg-success ms-2">matches ✓</span> : <span className="badge bg-danger ms-2">no match</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-danger small mb-0">Collection is empty — no documents found. Run <code>node Server/scripts/seed_cat_questions.js</code>.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 d-flex gap-2 justify-content-center">
        <button className="btn btn-primary" onClick={fetchQuestions}>Retry</button>
        <Link to="/courses/cat" className="btn btn-outline-secondary">Back to CAT</Link>
      </div>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage
      questions={questions}
      answers={answers}
      results={results}
      label={label}
      onRetake={handleRetake}
    />
  )

  return (
    <main className="main">
      <TabWarningBanner show={tabWarning} onDismiss={() => setTabWarning(false)} />

      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>CAT — {label}</h1>
                <p className="mb-0">
                  {questionCount} questions &nbsp;·&nbsp; {moduleConfig.timeMin} min &nbsp;·&nbsp; +3 correct MCQ · −1 wrong MCQ · +3/0 TITA
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/cat">CAT</Link></li>
              <li className="current">{label}</li>
            </ol>
          </div>
        </nav>
      </div>

      {timeLeft !== null && (
        <div className="container mb-3 d-flex justify-content-end">
          <span className="badge d-inline-flex align-items-center gap-2" style={{
            background: timeLeft < 120 ? '#dc3545' : timeLeft < 300 ? '#ffc107' : style.badge,
            color: timeLeft < 300 && timeLeft >= 120 ? '#212529' : '#fff',
            fontSize: '0.95rem', fontFamily: 'monospace', padding: '0.5rem 0.9rem', borderRadius: 8,
          }}>
            <i className="bi bi-clock-history" />Time left: {formatTime(timeLeft)}
          </span>
        </div>
      )}

      <QuizPanel
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        setAnswer={setAnswer}
        toggleMSQ={toggleMSQ}
        goTo={goTo}
        style={style}
        saving={saving}
        onSubmit={() => handleSubmit(false)}
        submitLabel="Submit Quiz"
        exitTo="/courses/cat"
        exitLabel="Exit"
      />
    </main>
  )
}

export default CATQuiz
