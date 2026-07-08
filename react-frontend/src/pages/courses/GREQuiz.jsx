import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import GREScoreDashboard, { buildChapterItems } from './GREScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Section accent colours — must match GREMain.jsx's SECTION_STYLE exactly ──
export const SUBJECT_STYLE = {
  'Verbal Reasoning': {
    gradient: 'linear-gradient(135deg,#6f42c1,#a370f7)', badge: '#6f42c1',
  },
  'Quantitative Reasoning': {
    gradient: 'linear-gradient(135deg,#0d6efd,#4dabf7)', badge: '#0d6efd',
  },
  'Analytical Writing': {
    gradient: 'linear-gradient(135deg,#d63384,#f783ac)', badge: '#d63384',
  },
}

// ─── Section config (section slug → subject name + module timing/question counts) ─
// subject must match what is stored in the DB
const SECTION_CONFIG = {
  verbal: {
    subject: 'Verbal Reasoning',
    label: 'Verbal Reasoning',
    modules: {
      1: { questionCount: 12, timeMin: 18 },
      2: { questionCount: 12, timeMin: 18 },
    },
  },
  quant: {
    subject: 'Quantitative Reasoning',
    label: 'Quantitative Reasoning',
    modules: {
      1: { questionCount: 12, timeMin: 21 },
      2: { questionCount: 15, timeMin: 26 },
    },
  },
  awa: {
    subject: 'Analytical Writing',
    label: 'Analytical Writing',
    modules: {
      1: { questionCount: 1, timeMin: 30 },
    },
  },
}

// Maps 0-100% raw accuracy onto the official GRE 130-170 scaled-score range.
// Mirrors the server-side greScaledScore() helper for instant client-side display.
// Not applicable to Analytical Writing (essay), which is never auto-scored.
export function greScaledScore(correctAnswers, totalQuestions) {
  if (!totalQuestions) return null
  const pct = Math.max(0, Math.min(1, correctAnswers / totalQuestions))
  return 130 + Math.round(pct * 40)
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

// After KaTeX has decided which $...$ spans are real math (and left backslash-escaped
// \$ currency amounts alone as plain text, per its own delimiter rules), strip the now
// no-longer-needed backslash so the user just sees a clean "$" in the leftover text.
function stripEscapedDollarSigns(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach(n => {
    if (n.nodeValue.indexOf('\\$') !== -1) n.nodeValue = n.nodeValue.replace(/\\\$/g, '$')
  })
}

function renderMathContent(element) {
  if (!element) return
  const run = () => {
    if (typeof window.renderMathInElement === 'undefined') return
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
    stripEscapedDollarSigns(element)
  }
  setTimeout(run, 50)
}

// ─── Convert \begin{tabular} or \begin{array} to an HTML table ───────────────
function processCell(c) {
  return c.trim()
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\%/g, '%')
}

function latexTabularToHtml(text) {
  return text.replace(
    /\\begin\{(tabular|array)\}\*?(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
    (_match, _env, body) => {
      const rows = body.split(/\\\\/).map(r => r.replace(/\\hline/g, '').trim()).filter(r => r)
      if (rows.length === 0) return ''
      const [header, ...dataRows] = rows
      const headerCells = header.split('&').map(c => `<th>${processCell(c)}</th>`).join('')
      const bodyRows = dataRows
        .map(r => '<tr>' + r.split('&').map(c => `<td>${processCell(c)}</td>`).join('') + '</tr>')
        .join('')
      return `<table class="sat-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
    }
  )
}

// ─── Convert \begin{enumerate}/\begin{itemize} to HTML lists ─────────────────
function latexListToHtml(text) {
  text = text.replace(
    /\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1)
        .map(i => `<li>${i.trim()}</li>`).join('')
      return `<ol style="padding-left:1.5rem;margin:8px 0">${items}</ol>`
    }
  )
  text = text.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1)
        .map(i => `<li>${i.trim()}</li>`).join('')
      return `<ul style="padding-left:1.5rem;margin:8px 0">${items}</ul>`
    }
  )
  return text
}

// ─── MathText: renders $...$ LaTeX, tabular tables, and (structure) markers ──
export const MathText = ({ text, style, className }) => {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])

  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\(structure\)/g,
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;' +
      'background:#fff3cd;border:1px dashed #ffc107;border-radius:4px;font-size:0.8rem;' +
      'color:#856404;vertical-align:middle;margin:0 4px;">⬡ Structure</span>'
    )
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')

  return (
    <span
      ref={ref}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ─── Image helper ─────────────────────────────────────────────────────────────
export const imgSrc = (filename) =>
  filename ? `/img/Graph_questions/${filename}` : null

// ─── Normalise question type ──────────────────────────────────────────────────
export function resolveType(q) {
  if (q.type === 'essay') return 'essay'
  if (q.type === 'integer') return 'numeric'
  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  const hasImageOptions = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOptions && !hasImageOptions) return 'numeric'

  const t = q.type || ''
  if (t === 'multiple_select') return 'multiple_select'
  if (t === 'text_completion_multi_blank') return 'text_completion_multi_blank'
  if (t === 'numeric') return 'numeric'
  // Any other value (e.g. "multiple_choice_single", "quantitative_comparison")
  // is a single-choice question with an options array, so render it as such.
  return 'multiple_choice'
}

// ─── Passage block (GRE Verbal Reasoning reading passages) ───────────────────
function PassageBlock({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])

  if (!text) return null

  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')

  return (
    <div style={{
      background: '#f8f6ff',
      border: '1px solid #d9cdf5',
      borderLeft: '4px solid #6f42c1',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 20,
    }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px',
        color: '#6f42c1', marginBottom: 10, textTransform: 'uppercase',
      }}>
        Passage
      </div>
      <div
        ref={ref}
        style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

// ─── Question content renderer ────────────────────────────────────────────────
export function QuestionContent({ q }) {
  return (
    <>
      <PassageBlock text={q.passage} />
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        <MathText text={q.question_text} />
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <img src={imgSrc(q.image_url)} alt="Question diagram"
            style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 10, border: '1px solid #dee2e6' }}
            onError={e => { e.target.style.display = 'none' }} />
        </div>
      )}
    </>
  )
}

// ─── Checks whether a question has been answered, including multi-blank text-completion ──
export function isAnswerFilled(q, ans) {
  if (resolveType(q) === 'text_completion_multi_blank') {
    if (!ans || typeof ans !== 'object' || Array.isArray(ans)) return false
    return (q.options || []).every(b => !!ans[b.blank_label])
  }
  return ans !== undefined && ans !== null && ans !== '' && !(Array.isArray(ans) && !ans.length)
}

// ─── GRE marking (+1 correct, 0 wrong — no negative marking; N/A for essays) ──
export function calcMarks(q, userAns) {
  const scheme = q.marking_scheme || { full: 1, negative: 0, zero: 0 }
  const type = resolveType(q)

  if (type === 'essay') return { isCorrect: false, marksAwarded: 0, unattempted: false, isEssay: true }

  if (type === 'text_completion_multi_blank') {
    if (!isAnswerFilled(q, userAns)) return { isCorrect: false, marksAwarded: scheme.zero ?? 0, unattempted: true }
    const corr = q.correct_answer || {}
    const ok = Object.keys(corr).every(b => String(userAns[b]).trim() === String(corr[b]).trim())
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 1) : (scheme.negative ?? 0) }
  }

  const empty =
    userAns === undefined || userAns === null || userAns === '' ||
    (Array.isArray(userAns) && userAns.length === 0)
  if (empty) return { isCorrect: false, marksAwarded: scheme.zero ?? 0, unattempted: true }

  if (type === 'multiple_choice') {
    const correct = String(q.correct_answer ?? '').trim()
    const given   = String(userAns).trim()
    const ok = correct === given
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 1) : (scheme.negative ?? 0) }
  }

  if (type === 'multiple_select') {
    const corrSet = new Set(
      (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer])
        .map(a => String(a).trim())
    )
    const userSet = new Set((Array.isArray(userAns) ? userAns : [userAns]).map(a => String(a).trim()))
    const ok = corrSet.size === userSet.size && [...corrSet].every(a => userSet.has(a))
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 1) : 0 }
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
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 1) : (scheme.negative ?? 0) }
  }

  return { isCorrect: false, marksAwarded: 0 }
}

// ─── Per-question review item (used by ReviewPage and GREFullTest combined report) ─
export const QuestionReviewItem = ({ q, idx, answer, res, isOpen, onToggle }) => {
  const isEssay = resolveType(q) === 'essay'
  const borderColor = isEssay ? '#d63384' : res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'

  return (
    <div
      className="card border-0 shadow-sm mb-3"
      style={{ borderRadius: 12, borderLeft: `4px solid ${borderColor}` }}
    >
      <div
        className="card-body"
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
      >
        <div className="d-flex align-items-start gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: isEssay ? '#d63384' : res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className={`bi ${isEssay ? 'bi-pencil-square' : res?.unattempted ? 'bi-dash' : res?.isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
          </div>

          <div className="flex-grow-1">
            <div className="d-flex justify-content-between">
              <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                Q{idx + 1}.{' '}
                {!isOpen
                  ? (q.question_text.replace(/\$[^$]*\$/g, '…').slice(0, 120) + (q.question_text.length > 120 ? '…' : ''))
                  : <MathText text={q.question_text} />}
              </p>
              <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
            </div>
            <div className="d-flex gap-2 flex-wrap mt-1">
              <span className="badge bg-secondary">{q.type}</span>
              {q.subtopic && <span className="badge bg-info text-dark">{q.subtopic}</span>}
              {!isEssay && <span className="badge bg-light text-dark border">{q.points || 1} pt</span>}
              {isEssay && <span className="badge bg-light text-dark border">Pending Review</span>}
              {!isEssay && res?.marksAwarded > 0 && (
                <span className="badge bg-success">+{res.marksAwarded} earned</span>
              )}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 ms-5 ps-2">
            <PassageBlock text={q.passage} />
            {q.image_url && (
              <div className="mb-3">
                <img
                  src={imgSrc(q.image_url)}
                  alt="Question diagram"
                  style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8, border: '1px solid #dee2e6' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
            )}

            {isEssay && (
              <div className="mb-3">
                <p className="text-muted small mb-2">Your essay response:</p>
                <div style={{
                  background: '#fdf2f8', border: '1px solid #f3c6dd', borderRadius: 10,
                  padding: '14px 18px', whiteSpace: 'pre-wrap', fontSize: '0.92rem', lineHeight: 1.7,
                }}>
                  {answer || <span className="text-muted">(no response submitted)</span>}
                </div>
              </div>
            )}

            {resolveType(q) === 'multiple_choice' && (
              <div className="mb-3">
                {q.options.map((opt, oi) => {
                  const corrAns = String(q.correct_answer ?? '').trim()
                  const isCorrectOpt = corrAns === opt.option_id
                  const userPicked = String(answer ?? '').trim() === opt.option_id
                  const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
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
                        <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
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

            {resolveType(q) === 'multiple_select' && (
              <div className="mb-3">
                {q.options.map((opt, oi) => {
                  const corrArr = Array.isArray(q.correct_answer)
                    ? q.correct_answer.map(String)
                    : [String(q.correct_answer)]
                  const isCorrectOpt = corrArr.includes(opt.option_id)
                  const userPicked = Array.isArray(answer)
                    ? answer.includes(opt.option_id)
                    : false
                  const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                  return (
                    <div
                      key={oi}
                      className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                      style={{ background: bg }}
                    >
                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                      {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                      {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                      <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                    </div>
                  )
                })}
              </div>
            )}

            {resolveType(q) === 'text_completion_multi_blank' && (
              <div className="mb-3">
                {(q.options || []).map((blank, bi) => {
                  const corrId = q.correct_answer?.[blank.blank_label]
                  const userId = answer?.[blank.blank_label]
                  return (
                    <div key={bi} className="mb-3">
                      <p className="fw-semibold small mb-1">{blank.blank_label}</p>
                      {(blank.choices || []).map((opt, oi) => {
                        const isCorrectOpt = corrId === opt.option_id
                        const userPicked = userId === opt.option_id
                        const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                        return (
                          <div
                            key={oi}
                            className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                            style={{ background: bg }}
                          >
                            <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                            {isCorrectOpt && <i className="bi bi-check-circle-fill text-success mt-1" />}
                            {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                            <MathText text={opt.text} style={{ fontSize: '0.9rem' }} />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}

            {resolveType(q) === 'numeric' && (
              <div className="d-flex gap-2 flex-wrap mb-3">
                <span className="badge bg-light text-dark border fs-6">
                  Your answer: <strong>{answer ?? '(not answered)'}</strong>
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
const ReviewPage = ({ questions, answers, results, label, moduleNum, onRetake }) => {
  const [expanded, setExpanded] = useState(null)
  const isEssaySection = label === 'Analytical Writing'
  const chapterItems = isEssaySection ? [] : buildChapterItems(questions, results.responses, label)

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>GRE {label}{isEssaySection ? '' : ` — Module ${moduleNum} Review`}</h1>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/gre">GRE</Link></li>
              <li className="current">Review</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {isEssaySection ? (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ background: SUBJECT_STYLE['Analytical Writing'].gradient, color: '#fff' }} className="p-4 p-md-5 text-center">
              <i className="bi bi-pencil-square mb-2" style={{ fontSize: '2.5rem' }} />
              <h2 className="mb-2" style={{ color: '#fff' }}>Essay Submitted!</h2>
              <p className="mb-0" style={{ color: '#fff', opacity: 0.9 }}>
                Your Analytical Writing response has been recorded and is pending review. It is not auto-scored.
              </p>
              <div className="d-flex gap-2 mt-4 justify-content-center flex-wrap">
                <button className="btn btn-light fw-semibold" onClick={onRetake}>
                  <i className="bi bi-arrow-clockwise me-1" />Retake
                </button>
                <Link to="/courses/gre" className="btn btn-outline-light fw-semibold">
                  <i className="bi bi-arrow-left me-1" />Back to GRE
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <GREScoreDashboard
            results={results}
            chapterItems={chapterItems}
            onRetake={onRetake}
            heroTitle={`Module ${moduleNum} Completed!`}
          />
        )}

        {/* Per-question review */}
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
      background: '#dc3545', color: '#fff', textAlign: 'center',
      padding: '8px', fontWeight: 600,
    }}>
      ⚠️ Tab switching detected! Please stay on this page.
      <button
        onClick={onDismiss}
        style={{ marginLeft: 16, background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
      >
        Dismiss
      </button>
    </div>
  )
}

// ─── Quiz panel: question card + sidebar (used by GREQuiz and GREFullTest) ───
export const QuizPanel = ({
  questions, currentIndex, answers, setAnswer, toggleMSQ, setBlankAnswer, goTo,
  style, moduleNum, saving, onSubmit,
  submitLabel = 'Submit Quiz', exitTo = '/courses/gre', exitLabel = 'Exit',
  mode = 'single', onBackToOverview, onFinishTest,
}) => {
  const q = questions[currentIndex]
  const qType = resolveType(q)
  const isEssay = qType === 'essay'
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
                  <span className="badge" style={{ background: style.badge }}>{q.type}</span>
                  {q.difficulty && (
                    <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {q.difficulty}
                    </span>
                  )}
                  {!isEssay && <span className="badge bg-light text-dark border">{q.points || 1} pt</span>}
                </div>
              </div>

              <div className="progress mb-4" style={{ height: 5 }}>
                <div
                  className="progress-bar"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: style.gradient }}
                />
              </div>

              {q.topic && <p className="text-muted small mb-1">{q.topic}{q.subtopic ? ` › ${q.subtopic}` : ''}</p>}
              <QuestionContent q={q} />

              {/* ── Essay (Analytical Writing) ── */}
              {isEssay && (
                <div>
                  <p className="text-muted small mb-2">
                    Write your response below. There is no word limit, but aim for a well-organised, developed essay.
                  </p>
                  <textarea
                    className="form-control"
                    rows={16}
                    placeholder="Type your essay response here…"
                    value={userAns ?? ''}
                    onChange={e => setAnswer(currentIndex, e.target.value)}
                    style={{ fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
                  />
                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-muted">
                      {(userAns || '').trim().split(/\s+/).filter(Boolean).length} words
                    </small>
                    <small className="text-muted">{(userAns || '').length} characters</small>
                  </div>
                </div>
              )}

              {/* ── MCQ ── */}
              {qType === 'multiple_choice' && (
                <div>
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
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                          border: `2px solid ${selected ? style.badge : '#adb5bd'}`,
                          background: selected ? style.badge : 'transparent',
                        }} />
                        <div>
                          <span className="fw-semibold me-2">{opt.option_id}.</span>
                          {opt.text && <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />}
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
              {qType === 'multiple_select' && (
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

              {/* ── Text completion (multiple blanks) ── */}
              {qType === 'text_completion_multi_blank' && (
                <div>
                  {(q.options || []).map((blank, bi) => (
                    <div key={bi} className="mb-4">
                      <p className="fw-semibold mb-2" style={{ fontSize: '0.9rem', color: style.badge }}>
                        {blank.blank_label}
                      </p>
                      {(blank.choices || []).map((opt, oi) => {
                        const selected = (userAns && userAns[blank.blank_label]) === opt.option_id
                        return (
                          <div
                            key={oi}
                            onClick={() => setBlankAnswer(currentIndex, blank.blank_label, opt.option_id)}
                            className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                              border: `2px solid ${selected ? style.badge : '#adb5bd'}`,
                              background: selected ? style.badge : 'transparent',
                            }} />
                            <MathText text={opt.text} style={{ fontSize: '0.95rem' }} />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Numeric ── */}
              {qType === 'numeric' && (
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
                  ) : mode === 'full' ? (
                    <button className="btn btn-primary" onClick={onBackToOverview}>
                      <i className="bi bi-grid me-1" />Module Overview
                    </button>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={onSubmit}
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
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <h6 className="fw-bold mb-3">Question Navigator</h6>
              <div className="d-flex flex-wrap gap-2">
                {questions.map((qn, i) => {
                  const done = isAnswerFilled(qn, answers[i])
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

          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <h6 className="fw-bold mb-2">{isEssay ? 'Scoring' : 'Marking Scheme'}</h6>
              {isEssay ? (
                <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                  <i className="bi bi-info-circle me-1" />
                  This essay is not auto-graded. It will be marked "Pending Review" after submission.
                </div>
              ) : (
                <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                  <span className="text-success fw-semibold">✓ Correct: +1</span>
                  <span className="text-secondary">✗ Wrong: 0 (no penalty)</span>
                  <span className="text-secondary">— Unattempted: 0</span>
                </div>
              )}
              <hr className="my-2" />
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                <i className="bi bi-info-circle me-1" />
                Module {moduleNum} · {questions.length} question{questions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
              {mode === 'full' ? (
                <>
                  <button className="btn btn-primary w-100" onClick={onBackToOverview}>
                    <i className="bi bi-grid me-1" />Module Overview
                  </button>
                  <button
                    className="btn btn-success w-100 mt-2"
                    onClick={onFinishTest}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <><i className="bi bi-flag-fill me-1" />Finish Test</>}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-success w-100"
                    onClick={onSubmit}
                    disabled={saving}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                      : <><i className="bi bi-check-lg me-1" />{submitLabel}</>}
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

// ─── Main Quiz Component ──────────────────────────────────────────────────────
const GREQuiz = () => {
  const { section, module } = useParams()
  const navigate = useNavigate()

  // Resolve section config — fall back gracefully if slug is unknown
  const config = SECTION_CONFIG[section] || SECTION_CONFIG.verbal
  const { subject, label } = config
  const moduleNum = parseInt(module, 10) || 1
  const moduleConfig = config.modules[moduleNum] || config.modules[1]
  const { questionCount } = moduleConfig
  const isEssaySection = subject === 'Analytical Writing'

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE['Quantitative Reasoning']

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

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const userRef          = useRef(null)

  useEffect(() => { loadKaTeX() }, [])
  useEffect(() => { checkAuth() }, [])

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
      const res = await axios.get(
        `${API_URL}/api/gre_questions?subject=${encodeURIComponent(subject)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) {
        // Fetch debug info to show what subject values actually exist in the DB
        try {
          const dbg = await axios.get(`${API_URL}/api/gre_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError(`No questions found for "${subject}".`)
        setLoading(false)
        return
      }

      if (isEssaySection) {
        // Analytical Writing: a single essay task
        setQuestions(qs.slice(0, questionCount))
        setLoading(false)
        return
      }

      // Shuffle all questions, then take the required count for this module
      const shuffled = [...qs]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      // Module 1 takes first half, Module 2 takes second half (or same pool if fewer questions)
      const half = Math.ceil(shuffled.length / 2)
      const pool = shuffled.length >= questionCount * 2
        ? (moduleNum === 1 ? shuffled.slice(0, half) : shuffled.slice(half))
        : shuffled
      setQuestions(pool.slice(0, questionCount))
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
      return {
        ...prev,
        [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId],
      }
    })
  }

  const setBlankAnswer = (idx, blankLabel, optId) => setAnswers(prev => ({
    ...prev,
    [idx]: { ...(prev[idx] || {}), [blankLabel]: optId },
  }))

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

    // ── Analytical Writing: essay — skip scoring entirely ──────────────────
    if (isEssaySection) {
      const essayResponse = answers[0] || ''
      setResults({
        correctAnswers: 0, wrongAnswers: 0, unattempted: 0,
        score: 0, maxScore: 0, percentage: 0, totalTime,
        essayResponse, essayStatus: 'pending_review',
        responses: [{
          questionId: questions[0]?._id,
          questionText: questions[0]?.question_text,
          userResponse: essayResponse,
          correctAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          unattempted: !essayResponse.trim(),
        }],
      })
      setSubmitted(true)

      if (!u?.email) return
      setSaving(true)
      try {
        await axios.post(`${API_URL}/api/gre_scores`, {
          email: u.email,
          name: u.username || u.name || u.email,
          subject: 'Analytical Writing',
          totalQuestions: 1,
          correctAnswers: 0,
          wrongAnswers: 0,
          unattempted: 0,
          score: 0,
          maxScore: 0,
          essayResponse,
          responses: [],
        }, { withCredentials: true })
      } catch (e) {
        console.error('Failed to save essay:', e)
      } finally {
        setSaving(false)
      }
      return
    }

    // ── Verbal / Quant: standard MCQ/MSQ/numeric scoring ───────────────────
    let correctCount = 0
    let wrongCount = 0
    let unattemptedCount = 0
    let totalScore = 0
    const maxScore = questions.reduce((s, q) => s + (q.points || 1), 0)
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
    const scaledScore = greScaledScore(correctCount, questions.length)

    setResults({
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unattempted: unattemptedCount,
      score: totalScore,
      maxScore,
      percentage,
      scaledScore,
      totalTime,
      responses,
    })
    setSubmitted(true)

    if (!u?.email) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/gre_scores`, {
        email: u.email,
        name: u.username || u.name || u.email,
        subject,  // "Verbal Reasoning" or "Quantitative Reasoning"
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
    setCurrentIndex(0); timesRef.current = {}
    fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading GRE {label} — Module {moduleNum} questions…</p>
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
              What's in your <code>gre_questions</code> collection
            </h6>
            <p className="mb-1 text-muted small">
              Total documents: <strong>{debugInfo.totalQuestions}</strong>
            </p>
            <p className="mb-2 text-muted small">Subject values found in DB:</p>
            {debugInfo.distinctSubjects.length > 0 ? (
              <ul className="mb-0 ps-3">
                {debugInfo.distinctSubjects.map(s => (
                  <li key={s} className="small">
                    <code>{s}</code>
                    {s === subject
                      ? <span className="badge bg-success ms-2">matches ✓</span>
                      : <span className="badge bg-danger ms-2">no match</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-danger small mb-0">Collection is empty — no documents found.</p>
            )}
            <hr className="my-3" />
            <p className="text-muted small mb-0">
              Quiz is searching for: <code className="text-primary">subject = "{subject}"</code>
              <br />
              Make sure your questions use that exact value in the <code>subject</code> field.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 d-flex gap-2 justify-content-center">
        <button className="btn btn-primary" onClick={fetchQuestions}>Retry</button>
        <Link to="/courses/gre" className="btn btn-outline-secondary">Back to GRE</Link>
      </div>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage
      questions={questions}
      answers={answers}
      results={results}
      label={label}
      moduleNum={moduleNum}
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
                <h1>GRE — {label}</h1>
                <p className="mb-0">
                  {isEssaySection
                    ? <>Analyze an Issue &nbsp;·&nbsp; {moduleConfig.timeMin} min &nbsp;·&nbsp; Scored 0-6 by human/AI review</>
                    : <>Module {moduleNum} &nbsp;·&nbsp; {questionCount} questions
                        &nbsp;·&nbsp; +1 correct · 0 wrong (no penalty)</>}
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/gre">GRE</Link></li>
              <li className="current">{label}{isEssaySection ? '' : ` — Module ${moduleNum}`}</li>
            </ol>
          </div>
        </nav>
      </div>

      <QuizPanel
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        setAnswer={setAnswer}
        toggleMSQ={toggleMSQ}
        setBlankAnswer={setBlankAnswer}
        goTo={goTo}
        style={style}
        moduleNum={moduleNum}
        saving={saving}
        onSubmit={() => handleSubmit(false)}
        submitLabel="Submit Quiz"
        exitTo="/courses/gre"
        exitLabel="Exit"
      />
    </main>
  )
}

export default GREQuiz
