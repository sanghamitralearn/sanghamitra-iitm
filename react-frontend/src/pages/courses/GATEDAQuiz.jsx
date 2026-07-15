import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { SUBJECT_STYLE } from './subjectStyle'
import GATEDAScoreDashboard, { buildChapterItems } from './GATEDAScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Section config (section slug → subject name) ───────────────────────────────
// subject must match the exact enum string stored in the DB
export const SECTION_CONFIG = {
  ga:   { subject: 'General Aptitude',                 label: 'General Aptitude' },
  math: { subject: 'Engineering Mathematics',           label: 'Engineering Mathematics' },
  prog: { subject: 'Programming & Data Structures',     label: 'Programming & Data Structures' },
  dbms: { subject: 'Database Management & Warehousing', label: 'Database Management & Warehousing' },
  ml:   { subject: 'Machine Learning',                  label: 'Machine Learning' },
  ai:   { subject: 'Artificial Intelligence',           label: 'Artificial Intelligence' },
}

// ─── KaTeX ───────────────────────────────────────────────────────────────────
// Cache the load promise on `window` (not a module-level let) so that every
// page which copy-pastes its own loadKaTeX() still shares one in-flight load
// and nobody double-appends <script> tags (also survives React StrictMode's
// double-invoked effects in dev).
export function loadKaTeX() {
  if (window.renderMathInElement) return Promise.resolve()
  if (window._katexLoadPromise) return window._katexLoadPromise
  window._katexLoadPromise = new Promise((resolve) => {
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
      document.head.appendChild(link)
    }
    const loadAutoRender = () => {
      if (window.renderMathInElement) { resolve(); return }
      const existingAr = document.querySelector('script[src*="auto-render"]')
      if (existingAr) { existingAr.addEventListener('load', () => resolve()); return }
      const ar = document.createElement('script')
      ar.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
      ar.onload = () => resolve()
      document.head.appendChild(ar)
    }
    const existingCore = document.querySelector('script[src*="katex.min.js"]')
    if (existingCore) {
      if (window.katex) loadAutoRender()
      else existingCore.addEventListener('load', loadAutoRender)
    } else {
      const core = document.createElement('script')
      core.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
      core.onload = loadAutoRender
      document.head.appendChild(core)
    }
  })
  return window._katexLoadPromise
}

// Waits for KaTeX to actually finish loading before rendering, instead of
// guessing with a fixed setTimeout — fixes questions that silently never
// rendered when the CDN script hadn't loaded in time yet.
function renderMathContent(element) {
  if (!element) return
  loadKaTeX().then(() => {
    if (!element.isConnected || !window.renderMathInElement) return
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
  })
}

// ─── Convert common LaTeX/pandoc text-mode macros & escapes to plain HTML ────
// KaTeX's auto-render only touches text between math delimiters, so any of
// these left outside $...$ (e.g. \emph{...}, \textquotedbl) show up as
// literal backslash-commands unless converted here first.
function unescapeLatexText(text) {
  return text
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
    .replace(/\\textsuperscript\{([^}]*)\}/g, '<sup>$1</sup>')
    .replace(/\\textsubscript\{([^}]*)\}/g, '<sub>$1</sub>')
    // \texttt{...} commonly wraps code (dicts/lists), which contains its own
    // literal { } — a plain [^}]* group would stop at the first inner brace,
    // so allow one level of nested { ... } before requiring the closing brace.
    .replace(/\\texttt\{((?:[^{}]|\{[^{}]*\})*)\}/g,
      '<code style="font-family:monospace;background:#f1f3f5;padding:1px 5px;border-radius:4px;">$1</code>')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\textquotedbl(?:\{\})?/g, '"')
    .replace(/\\textquotesingle(?:\{\})?/g, "'")
    .replace(/\\textbackslash(?:\{\})?/g, '\\')
    .replace(/\\textasciitilde(?:\{\})?/g, '~')
    .replace(/\\textasciicircum(?:\{\})?/g, '^')
    .replace(/\\(?:ldots|dots|textellipsis)/g, '…')
    .replace(/\\&/g, '&amp;')
    .replace(/\\#/g, '#')
    .replace(/\\\$/g, '&#36;')
    .replace(/\\_/g, '_')
    .replace(/\\%/g, '%')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
}

function processCell(c) {
  return unescapeLatexText(c.trim())
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

// ─── Escape currency dollar signs so they don't trigger KaTeX math mode ──────
function escapeCurrencyDollars(text) {
  return text.replace(/\$(\d[\d,]*(?:\.\d{1,2})?)(?![a-zA-Z\\])/g, '&#36;$1')
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

  let html = unescapeLatexText(text || '')
    .replace(/\(structure\)/g,
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;' +
      'background:#fff3cd;border:1px dashed #ffc107;border-radius:4px;font-size:0.8rem;' +
      'color:#856404;vertical-align:middle;margin:0 4px;">⬡ Structure</span>'
    )
  html = escapeCurrencyDollars(html)
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)

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

// ─── Subject accent colours (re-exported for backwards compatibility) ────────
export { SUBJECT_STYLE }

// ─── Normalise question type ──────────────────────────────────────────────────
export function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  const hasImageOptions = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOptions && !hasImageOptions) return 'numeric'
  if (q.type === 'multiple_select') return 'multiple_select'
  if (q.type === 'numeric') return 'numeric'
  // Any other value (e.g. "multiple_choice_single", "quantitative_comparison")
  // is a single-choice question with an options array, so render it as such.
  return 'multiple_choice'
}

// ─── Parse List-I / List-II from question text ────────────────────────────────
function parseMatchingLists(text) {
  if (!text) return null

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

  const items = positions.map((pos, i) => ({
    id: pos.id,
    content: text.substring(pos.contentStart, i + 1 < positions.length ? positions[i + 1].matchStart : text.length).trim(),
  }))

  const listI  = items.filter(item => 'PQRS'.includes(item.id))
  const listII = items.filter(item => /[1-9]/.test(item.id))
  if (listI.length === 0 && listII.length === 0) return null

  const preamble = text.substring(0, positions[0].matchStart)
    .replace(/\bList[ -]?I{1,2}\b[:\s]*/gi, ' ')
    .trim()

  return { preamble, listI, listII }
}

// ─── Passage block (kept for question formats that embed supporting text) ───
function PassageBlock({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])

  if (!text) return null

  let html = unescapeLatexText(text || '')
  html = escapeCurrencyDollars(html)
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)

  return (
    <div style={{
      background: '#f8f9ff',
      border: '1px solid #d0d9f0',
      borderLeft: '4px solid #003D8F',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 20,
    }}>
      <div style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px',
        color: '#003D8F', marginBottom: 10, textTransform: 'uppercase',
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
  const parsed = parseMatchingLists(q.question_text)

  if (parsed) {
    const hasListIText  = parsed.listI.length > 0
    const hasListIIText = parsed.listII.length > 0

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
        <MathText text={item.content} />
      </div>
    )

    return (
      <div>
        <PassageBlock text={q.passage} />
        {parsed.preamble && (
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            <MathText text={parsed.preamble} />
          </p>
        )}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div style={{ background: '#eef3fb', border: '1px solid #b8cff5', borderRadius: 10, padding: 16 }}>
              <h6 style={{ color: '#003D8F', fontWeight: 700, marginBottom: 12, borderBottom: '1px solid #b8cff5', paddingBottom: 8 }}>
                List-I
              </h6>
              {imgInListI && listImg('List-I diagram')}
              {parsed.listI
                .filter(item => imgInListI
                  ? item.content.trim() !== '' && !item.content.trim().startsWith('(structure)')
                  : true)
                .map(item => itemRow(item, '#003D8F'))}
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

// ─── GATE DA marking (real negative marking for wrong MCQ) ───────────────────
// MCQ:  correct → +full, wrong → scheme.negative (typically -full/3)
// MSQ:  correct → +full, wrong → 0 (no penalty)
// NAT:  correct → +full, wrong → 0 (no penalty)
// Default fallback scheme (if a question document is missing marking_scheme):
//   { full: points, negative: -points/3, zero: 0 }
export function calcMarks(q, userAns) {
  const scheme = q.marking_scheme || { full: q.points || 1, negative: -(q.points || 1) / 3, zero: 0 }
  const type = resolveType(q)

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
    if (isNaN(given)) return { isCorrect: false, marksAwarded: 0 }
    let ok = false
    const ca = q.correct_answer
    if (ca !== null && typeof ca === 'object' && 'min' in ca && 'max' in ca) {
      ok = given >= ca.min && given <= ca.max
    } else {
      ok = Math.abs(given - parseFloat(String(ca))) < 0.01
    }
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 1) : 0 }
  }

  return { isCorrect: false, marksAwarded: 0 }
}

// ─── Format a question's marking scheme for the sidebar info card ───────────
function formatMarkingScheme(q) {
  const scheme = q.marking_scheme || { full: q.points || 1, negative: -(q.points || 1) / 3, zero: 0 }
  const type = resolveType(q)
  const full = scheme.full ?? (q.points || 1)

  if (type === 'multiple_choice') {
    const neg = scheme.negative ?? -(full / 3)
    const ratio = full !== 0 ? neg / full : 0
    let fraction = ''
    if (Math.abs(ratio + 1 / 3) < 0.01) fraction = ' (−1/3)'
    else if (Math.abs(ratio + 2 / 3) < 0.01) fraction = ' (−2/3)'
    else if (Math.abs(ratio + 1 / 2) < 0.01) fraction = ' (−1/2)'
    return { full, wrongText: `${neg.toFixed(2)}${fraction}`, penalty: true }
  }

  return { full, wrongText: '0 (no penalty)', penalty: false }
}

// ─── Per-question review item (used by ReviewPage and GATEDAFullTest combined report) ─
export const QuestionReviewItem = ({ q, idx, answer, res, isOpen, onToggle }) => {
  const borderColor = res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'

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
                  ? (q.question_text.replace(/\$[^$]*\$/g, '…').slice(0, 120) + (q.question_text.length > 120 ? '…' : ''))
                  : <MathText text={q.question_text} />}
              </p>
              <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
            </div>
            <div className="d-flex gap-2 flex-wrap mt-1">
              <span className="badge bg-secondary">{q.type}</span>
              {q.subtopic && <span className="badge bg-info text-dark">{q.subtopic}</span>}
              <span className="badge bg-light text-dark border">{q.points || 1} pt</span>
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
            {/* Passage */}
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
                <h1>GATE DA {label} — Review</h1>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/gate-da/modules">GATE DA</Link></li>
              <li className="current">Review</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        <GATEDAScoreDashboard
          results={results}
          chapterItems={chapterItems}
          onRetake={onRetake}
          heroTitle="Practice Completed!"
          backTo="/courses/gate-da/modules"
          backLabel="Back to GATE DA"
        />

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

// ─── Quiz panel: question card + sidebar (used by GATEDAQuiz and GATEDAFullTest) ───
export const QuizPanel = ({
  questions, currentIndex, answers, setAnswer, toggleMSQ, goTo,
  style, moduleNum, saving, onSubmit,
  submitLabel = 'Submit Quiz', exitTo = '/courses/gate-da/modules', exitLabel = 'Exit',
  mode = 'single', onBackToOverview, onFinishTest,
}) => {
  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered =
    userAns !== undefined && userAns !== null && userAns !== '' &&
    !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  const { full: schemeFull, wrongText: schemeWrongText } = formatMarkingScheme(q)

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
                  <span className="badge bg-light text-dark border">{q.points || 1} pt</span>
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

              {/* ── MCQ ── */}
              {resolveType(q) === 'multiple_choice' && (
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
                      <i className="bi bi-grid me-1" />Section Overview
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

          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
            <div className="card-body p-3">
              <h6 className="fw-bold mb-2">Marking Scheme</h6>
              <div className="d-flex flex-column gap-1" style={{ fontSize: '0.85rem' }}>
                <span className="text-success fw-semibold">✓ Correct: +{schemeFull}</span>
                <span className={schemeWrongText.startsWith('0') ? 'text-secondary' : 'text-danger fw-semibold'}>
                  ✗ Wrong: {schemeWrongText}
                </span>
                <span className="text-secondary">— Unattempted: 0</span>
              </div>
              <hr className="my-2" />
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                <i className="bi bi-info-circle me-1" />
                {moduleNum ? `Module ${moduleNum} · ` : ''}{questions.length} questions
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-body p-3 text-center">
              <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
              {mode === 'full' ? (
                <>
                  <button className="btn btn-primary w-100" onClick={onBackToOverview}>
                    <i className="bi bi-grid me-1" />Section Overview
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
const GATEDAQuiz = () => {
  const { section } = useParams()
  const navigate = useNavigate()

  // Resolve section config — fall back gracefully if slug is unknown
  const config = SECTION_CONFIG[section] || SECTION_CONFIG.ga
  const { subject, label } = config

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE['Engineering Mathematics']

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
        `${API_URL}/api/gate_da_questions?subject=${encodeURIComponent(subject)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) {
        // Fetch debug info to show what subject values actually exist in the DB
        try {
          const dbg = await axios.get(`${API_URL}/api/gate_da_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError(`No questions found for "${subject}".`)
        setLoading(false)
        return
      }

      // Shuffle and use every matching question — no per-module cap
      const shuffled = [...qs]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setQuestions(shuffled)
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
        timeSpent: timesRef.current[i] || 0,
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

    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/gate_da_scores`, {
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
    setCurrentIndex(0); timesRef.current = {}
    fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading GATE DA {label} questions…</p>
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
              What's in your <code>gate_da_questions</code> collection
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
        <Link to="/courses/gate-da/modules" className="btn btn-outline-secondary">Back to GATE DA</Link>
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
                <h1>GATE DA — {label}</h1>
                <p className="mb-0">
                  {questions.length} questions &nbsp;·&nbsp; +1/+2 correct · negative marking for wrong MCQ
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/gate-da/modules">GATE DA</Link></li>
              <li className="current">{label}</li>
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
        goTo={goTo}
        style={style}
        saving={saving}
        onSubmit={() => handleSubmit(false)}
        submitLabel="Submit Quiz"
        exitTo="/courses/gate-da/modules"
        exitLabel="Exit"
      />
    </main>
  )
}

export default GATEDAQuiz
