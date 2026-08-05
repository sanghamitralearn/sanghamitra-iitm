import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Classic ACT sections — all four carry a numeric/scaled score (no optional essay)
const ACT_SECTIONS = ['English', 'Mathematics', 'Reading', 'Science']

const SECTION_COLOR = {
  'English':     '#0d6efd',
  'Mathematics': '#6610f2',
  'Reading':     '#fd7e14',
  'Science':     '#198754',
}
const SECTION_GRADIENT = {
  'English':     'linear-gradient(135deg,#0d6efd,#4dabf7)',
  'Mathematics': 'linear-gradient(135deg,#6610f2,#a370f7)',
  'Reading':     'linear-gradient(135deg,#fd7e14,#ffb26b)',
  'Science':     'linear-gradient(135deg,#198754,#63d3a6)',
}
const SECTION_ICON = {
  'English':     'bi-pencil-square',
  'Mathematics': 'bi-calculator-fill',
  'Reading':     'bi-book-half',
  'Science':     'bi-flask-fill',
}

// Combines the four ACT section scaled scores (1-36 each) into the official
// composite score — the rounded average of the 4 sections. Same approximation
// used server-side and in ACTQuiz.jsx's actTotalScaledScore().
function actTotalScaledScore(englishScaled, mathScaled, readingScaled, scienceScaled) {
  if (englishScaled == null || mathScaled == null || readingScaled == null || scienceScaled == null) return null
  return Math.round((englishScaled + mathScaled + readingScaled + scienceScaled) / 4)
}

// ─── KaTeX ────────────────────────────────────────────────────────────────────
function loadKaTeX() {
  if (window.renderMathInElement) return
  if (window._actKatexLoading) return
  window._actKatexLoading = true
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
    ar.onload = () => { window._actKatexLoading = false }
    document.head.appendChild(ar)
  }
  document.head.appendChild(core)
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

function renderMath(el) {
  if (!el) return
  const run = () => {
    if (typeof window.renderMathInElement === 'undefined') { setTimeout(run, 300); return }
    window.renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      trust: true,
      strict: false,
    })
    stripEscapedDollarSigns(el)
  }
  setTimeout(run, 50)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveType(q) {
  const t = q.type || ''
  if (t === 'numeric' || t === 'numeric_entry' || t === 'integer') return 'numeric'
  if (t === 'multiple_select') return 'multiple_select'

  const hasOpts    = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOpts && !hasImgOpts) return 'numeric'

  if (Array.isArray(q.correct_answer) && q.correct_answer.length > 1) return 'multiple_select'

  return 'multiple_choice'
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

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

function latexListToHtml(text) {
  text = text.replace(
    /\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1).map(i => `<li>${i.trim()}</li>`).join('')
      return `<ol style="padding-left:1.5rem;margin:8px 0">${items}</ol>`
    }
  )
  text = text.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_match, body) => {
      const items = body.split(/\\item\s*/).slice(1).map(i => `<li>${i.trim()}</li>`).join('')
      return `<ul style="padding-left:1.5rem;margin:8px 0">${items}</ul>`
    }
  )
  return text
}

// ─── MathText ─────────────────────────────────────────────────────────────────
function MathText({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')
  return (
    <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Passage block (colour follows the question's subject, same as ACTQuiz.jsx) ─
function PassageBlock({ text, subject }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  if (!text) return null
  const accent = SECTION_COLOR[subject] || SECTION_COLOR['Reading']
  let html = (text || '')
    .replace(/\\%/g, '%')
    .replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>')
    .replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>')
  html = latexTabularToHtml(html)
  html = latexListToHtml(html)
  html = html.replace(/\\\\/g, '<br>')
  return (
    <div style={{
      background: `${accent}0d`, border: `1px solid ${accent}44`,
      borderLeft: `4px solid ${accent}`, borderRadius: 10,
      padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: accent, marginBottom: 10, textTransform: 'uppercase' }}>
        Passage
      </div>
      <div ref={ref} style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

// ─── Question Content ─────────────────────────────────────────────────────────
function QuestionContent({ q }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [q])

  // English, Mathematics & Science: show every question inside one uniform box,
  // with no "Passage" label — Reading keeps the labelled passage block.
  const isUniformBox = q.subject === 'English' || q.subject === 'Mathematics' || q.subject === 'Science'
  const accent = SECTION_COLOR[q.subject] || SECTION_COLOR['English']

  const body = (
    <>
      {q.passage && (
        isUniformBox
          ? <p className="mb-3" style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
              <MathText text={q.passage} />
            </p>
          : <PassageBlock text={q.passage} subject={q.subject} />
      )}
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        <MathText text={q.question_text} />
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <a href={imgSrc(q.image_url)} target="_blank" rel="noopener noreferrer">
            <img src={imgSrc(q.image_url)} alt="Question diagram"
              style={{ maxWidth: '100%', maxHeight: 700, borderRadius: 10, border: '1px solid #dee2e6' }}
              onError={e => e.target.style.display = 'none'} />
          </a>
        </div>
      )}
    </>
  )

  if (isUniformBox) {
    return (
      <div ref={ref}>
        <div style={{
          background: `${accent}0d`, border: `1px solid ${accent}44`,
          borderLeft: `4px solid ${accent}`, borderRadius: 10,
          padding: '16px 20px', marginBottom: 20,
        }}>
          {body}
        </div>
      </div>
    )
  }

  return <div ref={ref}>{body}</div>
}

// ─── Results Page ─────────────────────────────────────────────────────────────
const ResultsPage = ({ results, onReview, allAttempts, activeAttemptId, onSwitchAttempt }) => {
  const [selectedView, setSelectedView] = useState('overview')

  const sectionStats = {}
  for (const sec of ACT_SECTIONS) {
    const ss = results.sectionScores?.[sec] || {}
    sectionStats[sec] = {
      score:       ss.score ?? 0,
      max:         ss.maxScore ?? 0,
      correct:     ss.correctAnswers ?? 0,
      wrong:       ss.wrongAnswers ?? 0,
      unattempted: ss.unattempted ?? 0,
      total:       ss.totalQuestions ?? 0,
      scaledScore: ss.scaledScore ?? null,
    }
  }

  const isFullTest = results.testType === 'full'

  // For practice tests, populate section stats from overall results
  if (!isFullTest) {
    const sub = results.subject || ''
    if (sub) {
      sectionStats[sub] = {
        score:       results.score ?? 0,
        max:         results.maxScore ?? 0,
        correct:     results.correctAnswers ?? 0,
        wrong:       results.wrongAnswers ?? 0,
        unattempted: results.unattempted ?? 0,
        total:       results.totalQuestions ?? (results.responses || []).length,
        scaledScore: results.scaledScore ?? null,
      }
    }
  }

  const sidebarSections = isFullTest
    ? ACT_SECTIONS
    : (results.subject ? [results.subject] : [])

  const isSectionView  = selectedView !== 'overview'

  const currentStats = isSectionView ? sectionStats[selectedView] : null

  const displayScore       = isSectionView ? (currentStats?.score ?? 0) : (results.score ?? 0)
  const displayMax         = isSectionView ? (currentStats?.max ?? 0) : (results.maxScore ?? 0)
  const displayCorrect     = isSectionView ? (currentStats?.correct ?? 0) : (results.correctAnswers ?? 0)
  const displayWrong       = isSectionView ? (currentStats?.wrong ?? 0) : (results.wrongAnswers ?? 0)
  const displayUnattempted = isSectionView ? (currentStats?.unattempted ?? 0) : (results.unattempted ?? 0)
  const total              = displayCorrect + displayWrong + displayUnattempted || 1

  const cardGradient = isSectionView
    ? (SECTION_GRADIENT[selectedView] || 'linear-gradient(135deg,#6c757d,#495057)')
    : 'linear-gradient(135deg,#b71c1c,#1a1a2e)'
  const displaySubject = results.subject || ''
  const testLabel = isFullTest ? 'Full ACT Test' : `ACT — ${displaySubject || 'Practice'}`

  // Combined composite score (English + Math + Reading + Science) for full tests
  const totalScaled = isFullTest
    ? (results.totalScaledScore ?? actTotalScaledScore(
        sectionStats['English'].scaledScore,
        sectionStats['Mathematics'].scaledScore,
        sectionStats['Reading'].scaledScore,
        sectionStats['Science'].scaledScore,
      ))
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/courses/act" style={{ color: '#495057', fontSize: '1.3rem', textDecoration: 'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: {testLabel}</span>
          {results.dateAttempted && (
            <span className="ms-2 text-muted fw-normal">
              — {new Date(results.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>ACT</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onReview}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

      {/* Attempt switcher */}
      {allAttempts.length > 0 && (() => {
        const sorted    = [...allAttempts].reverse()
        const activeIdx = sorted.findIndex(a => activeAttemptId ? a._id === activeAttemptId : false)
        const dispIdx   = activeIdx >= 0 ? activeIdx : sorted.length - 1
        const active    = sorted[dispIdx]
        const activePct = active.maxScore > 0 ? Math.round(Math.max(0, active.score) / active.maxScore * 100) : 0
        return (
          <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="text-muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                <i className="bi bi-clock-history me-1" />{allAttempts.length} attempt{allAttempts.length !== 1 ? 's' : ''}
              </span>
              <div style={{ position: 'relative', minWidth: 240 }}>
                <select value={dispIdx} onChange={e => onSwitchAttempt(sorted[Number(e.target.value)])}
                  style={{
                    appearance: 'none', width: '100%', padding: '6px 36px 6px 12px',
                    borderRadius: 10, border: '1.5px solid #ced4da', background: '#f8f9fa',
                    fontSize: '0.83rem', fontWeight: 600, color: '#212529', cursor: 'pointer', outline: 'none',
                  }}>
                  {sorted.map((a, i) => {
                    const d   = new Date(a.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    const pct = a.maxScore > 0 ? Math.round(Math.max(0, a.score) / a.maxScore * 100) : 0
                    return (
                      <option key={a._id || i} value={i}>
                        Attempt {i + 1} — {d} — {a.score}/{a.maxScore} ({pct}%)
                      </option>
                    )
                  })}
                </select>
                <i className="bi bi-chevron-down" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.75rem', color: '#666' }} />
              </div>
              <span className="badge px-3 py-2" style={{
                background: activePct >= 60 ? '#28a745' : activePct >= 35 ? '#ffc107' : '#dc3545',
                color: '#fff', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
              }}>
                {active.score}/{active.maxScore} · {activePct}%
              </span>
            </div>
          </div>
        )
      })()}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {sidebarSections.length > 0 && (
                <>
                  <div className="w-100 p-3 d-flex align-items-center justify-content-between"
                    style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ paddingLeft: 10, fontWeight: 500, color: '#495057', fontSize: '0.9rem' }}>Sections</span>
                  </div>
                  {sidebarSections.map(sec => {
                    const secActive = selectedView === sec
                    return (
                      <button
                        key={sec}
                        onClick={() => setSelectedView(sec)}
                        className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                        style={{ background: secActive ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                        <span style={{ borderLeft: secActive ? `3px solid ${SECTION_COLOR[sec]}` : '3px solid transparent', paddingLeft: 10, color: secActive ? SECTION_COLOR[sec] : '#495057', fontWeight: secActive ? 600 : 400, fontSize: '0.95rem' }}>
                          {sec}
                        </span>
                        {secActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLOR[sec], display: 'inline-block' }} />}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <Link to="/courses/act" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-house me-1" />ACT
              </Link>
            </div>
          </div>

          {/* Main */}
          <div className="col-md-9">
            {/* Score card */}
            <div className="text-white mb-4" style={{ background: cardGradient, borderRadius: 16, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <h5 className="fw-bold mb-4" style={{ opacity: 0.95 }}>
                {isSectionView ? `${selectedView} Report` : 'Overall'}
              </h5>
              <div className="text-center">
                <div style={{ width: 150, height: 150, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {isSectionView && currentStats?.scaledScore != null ? (
                    <>
                      <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{currentStats.scaledScore}</span>
                      <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                      <span style={{ fontSize: 18, opacity: 0.9 }}>/ 36</span>
                    </>
                  ) : !isSectionView && totalScaled != null ? (
                    <>
                      <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{totalScaled}</span>
                      <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                      <span style={{ fontSize: 18, opacity: 0.9 }}>/ 36</span>
                    </>
                  ) : !isSectionView && results.scaledScore != null ? (
                    <>
                      <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{results.scaledScore}</span>
                      <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                      <span style={{ fontSize: 18, opacity: 0.9 }}>/ 36</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{displayScore}</span>
                      <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                      <span style={{ fontSize: 22, opacity: 0.9 }}>{displayMax}</span>
                    </>
                  )}
                </div>
                <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                  Time taken: {Math.floor((results.totalTimeTaken || 0) / 60)}m {(results.totalTimeTaken || 0) % 60}s
                </div>
              </div>
            </div>

            {/* Section cards — full test overview only */}
            {selectedView === 'overview' && isFullTest && (
              <div className="row g-3 mb-4">
                {ACT_SECTIONS.map(sec => {
                  const st = sectionStats[sec]
                  return (
                    <div key={sec} className="col-md-3">
                      <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius: 12, cursor: 'pointer' }}
                        onClick={() => setSelectedView(sec)}>
                        <div style={{ height: 4, background: SECTION_GRADIENT[sec], borderRadius: '12px 12px 0 0' }} />
                        <div className="card-body py-3">
                          <i className={`bi ${SECTION_ICON[sec]} mb-2`} style={{ fontSize: '1.3rem', color: SECTION_COLOR[sec] }} />
                          <div className="fw-bold mb-1" style={{ color: SECTION_COLOR[sec] }}>{sec}</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#212529' }}>
                            {st.scaledScore ?? st.score}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.82rem' }}>
                            {st.scaledScore != null ? '/ 36 scaled' : `/ ${st.max}`}
                          </div>
                          <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '0.75rem' }}>
                            <span className="text-success">{st.correct}✓</span>
                            <span className="text-danger">{st.wrong}✗</span>
                            <span className="text-muted">{st.unattempted}—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Marks Summary */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Marks Summary</h5>
                <p className="text-muted small mb-4">
                  You've answered {Math.round(displayCorrect / total * 100)}% questions correctly
                </p>
                <div className="row g-3 text-center">
                  {[
                    { label: 'Correct',     count: displayCorrect,     color: '#28a745', bg: '#d4edda', icon: 'bi-check-circle-fill' },
                    { label: 'Incorrect',   count: displayWrong,       color: '#dc3545', bg: '#f8d7da', icon: 'bi-x-circle-fill' },
                    { label: 'Unattempted', count: displayUnattempted, color: '#6c757d', bg: '#e9ecef', icon: 'bi-dash-circle-fill' },
                  ].map(({ label, count, color, bg, icon }) => (
                    <div key={label} className="col-4">
                      <div style={{ background: bg, borderRadius: 12, padding: '20px 8px' }}>
                        <i className={`bi ${icon} mb-2`} style={{ fontSize: '1.5rem', color }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Answers Page ──────────────────────────────────────────────────────
const ReviewAnswersPage = ({ enriched, onBack, results }) => {
  const [sectionFilter, setSectionFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) renderMath(ref.current) }, [expandedIdx])

  const availableSections = [...new Set(enriched.map(r => r.subject).filter(Boolean))]

  const selectSection = sec => {
    setSectionFilter(sectionFilter === sec ? null : sec)
  }

  const sectionScoped = enriched.filter(r => {
    if (sectionFilter && r.subject !== sectionFilter) return false
    return true
  })

  const counts = {
    all:         sectionScoped.length,
    correct:     sectionScoped.filter(r => r?.isCorrect).length,
    incorrect:   sectionScoped.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: sectionScoped.filter(r => r?.unattempted).length,
  }

  const filtered = enriched.filter(r => {
    if (sectionFilter && r.subject !== sectionFilter) return false
    if (statusFilter === 'correct'     && !r?.isCorrect) return false
    if (statusFilter === 'incorrect'   && (r?.unattempted || r?.isCorrect)) return false
    if (statusFilter === 'unattempted' && !r?.unattempted) return false
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }} ref={ref}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
        <strong>Review Answers</strong>
      </div>

      {/* Section chips */}
      {availableSections.length > 1 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
          <div className="d-flex gap-2 flex-wrap">
            {availableSections.map(sec => (
              <button key={sec} onClick={() => selectSection(sec)}
                style={{
                  padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                  fontWeight: 500, fontSize: '0.88rem',
                  borderColor: sectionFilter === sec ? (SECTION_COLOR[sec] || '#0d6efd') : '#ced4da',
                  background:  sectionFilter === sec ? (SECTION_COLOR[sec] || '#0d6efd') : '#fff',
                  color:       sectionFilter === sec ? '#fff' : '#495057',
                }}>
                {sec} {sectionFilter === sec && '×'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Status sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {sectionFilter && (
                <div className="px-3 pt-3 pb-1 text-muted" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {sectionFilter}
                </div>
              )}
              {[
                { key: 'all',         label: `All (${counts.all})` },
                { key: 'incorrect',   label: `Incorrect (${counts.incorrect})` },
                { key: 'unattempted', label: `Unattempted (${counts.unattempted})` },
                { key: 'correct',     label: `Correct (${counts.correct})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                  style={{ borderBottom: '1px solid #e9ecef', background: statusFilter === key ? '#f0f4ff' : '#fff', cursor: 'pointer' }}>
                  <span style={{ borderLeft: statusFilter === key ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft: 10, color: statusFilter === key ? '#0d6efd' : '#212529', fontWeight: statusFilter === key ? 600 : 400 }}>
                    {label}
                  </span>
                  {statusFilter === key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d6efd', display: 'inline-block' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="col-md-9">
            {filtered.length === 0
              ? <div className="text-center py-5 text-muted">No questions match the selected filter.</div>
              : filtered.map((r, fi) => {
                  const q           = r.questionData
                  const i           = r.globalIndex
                  const isOpen      = expandedIdx === i
                  const statusColor = r.unattempted ? '#6c757d' : r.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel  = r.unattempted ? 'N/A' : r.isCorrect ? '+1' : '0'
                  const secColor    = SECTION_COLOR[r.subject] || '#6c757d'

                  return (
                    <div key={fi} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
                      {/* Top strip */}
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.82rem' }}>
                          ⊙ CORRECT: {r.unattempted ? 'N/A' : (r.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          {r.subject && <span className="badge" style={{ background: secColor, fontSize: '0.68rem' }}>{r.subject}</span>}
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize: '0.8rem' }} />
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {q?.difficulty && (
                            <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.7rem' }}>
                              {q.difficulty}
                            </span>
                          )}
                          <span className="ms-auto fw-bold" style={{ color: statusColor }}>{marksLabel}</span>
                        </div>

                        <div style={{ cursor: 'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen && q
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize: '0.93rem', lineHeight: 1.6 }}>
                                {(() => { const t = q?.question_text || '(Question not available)'; return t.length > 220 ? t.slice(0, 220) + '…' : t })()}
                              </p>
                          }
                        </div>

                        {isOpen && q && (
                          <div className="mt-3">
                            {resolveType(q) === 'multiple_choice' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const isCrr     = String(q.correct_answer ?? '').trim() === opt.option_id
                                  const userPicked = String(r.userResponse ?? '').trim() === opt.option_id
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr     && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <div>
                                        <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                        {q.option_images?.[opt.option_id] && (
                                          <div className="mt-1">
                                            <img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`}
                                              style={{ maxWidth: 280, borderRadius: 6, border: '1px solid #dee2e6' }}
                                              onError={e => e.target.style.display = 'none'} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'multiple_select' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const corrArr   = (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(String)
                                  const isCrr     = corrArr.includes(opt.option_id)
                                  const userPicked = Array.isArray(r.userResponse) && r.userResponse.includes(opt.option_id)
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr     && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'numeric' && (
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                <span className="badge bg-light text-dark border fs-6">
                                  Your answer: <strong>{r.userResponse ?? '(not answered)'}</strong>
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
                            <div className="text-center pt-2" style={{ borderTop: '1px solid #e9ecef' }}>
                              <span className="text-primary" style={{ fontSize: '0.88rem', cursor: 'default' }}>⊞ View solution (coming soon)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pair English + Mathematics + Reading + Science DB records into one full-test attempt ─
function buildFullAttempt(english, math, reading, science) {
  const score       = (english.score       || 0) + (math.score       || 0) + (reading.score       || 0) + (science.score       || 0)
  const maxScore    = (english.maxScore    || 0) + (math.maxScore    || 0) + (reading.maxScore    || 0) + (science.maxScore    || 0)
  const correct     = (english.correctAnswers || 0) + (math.correctAnswers || 0) + (reading.correctAnswers || 0) + (science.correctAnswers || 0)
  const wrong       = (english.wrongAnswers   || 0) + (math.wrongAnswers   || 0) + (reading.wrongAnswers   || 0) + (science.wrongAnswers   || 0)
  const unattempted = (english.unattempted    || 0) + (math.unattempted    || 0) + (reading.unattempted    || 0) + (science.unattempted    || 0)
  return {
    _id:            new Date(english.dateAttempted).toISOString(), // unique per attempt
    testType:       'full',
    score, maxScore,
    correctAnswers: correct,
    wrongAnswers:   wrong,
    unattempted,
    totalTimeTaken: 0,
    dateAttempted:  english.dateAttempted,
    responses: [
      ...(english.responses || []).map(r => ({ ...r, subject: 'English' })),
      ...(math.responses    || []).map(r => ({ ...r, subject: 'Mathematics' })),
      ...(reading.responses || []).map(r => ({ ...r, subject: 'Reading' })),
      ...(science.responses || []).map(r => ({ ...r, subject: 'Science' })),
    ],
    sectionScores: {
      'English': {
        score: english.score,   maxScore: english.maxScore,
        correctAnswers: english.correctAnswers,   wrongAnswers: english.wrongAnswers,
        unattempted: english.unattempted,         totalQuestions: english.totalQuestions,
        scaledScore: english.scaledScore ?? null,
      },
      'Mathematics': {
        score: math.score, maxScore: math.maxScore,
        correctAnswers: math.correctAnswers, wrongAnswers: math.wrongAnswers,
        unattempted: math.unattempted,       totalQuestions: math.totalQuestions,
        scaledScore: math.scaledScore ?? null,
      },
      'Reading': {
        score: reading.score, maxScore: reading.maxScore,
        correctAnswers: reading.correctAnswers, wrongAnswers: reading.wrongAnswers,
        unattempted: reading.unattempted,       totalQuestions: reading.totalQuestions,
        scaledScore: reading.scaledScore ?? null,
      },
      'Science': {
        score: science.score, maxScore: science.maxScore,
        correctAnswers: science.correctAnswers, wrongAnswers: science.wrongAnswers,
        unattempted: science.unattempted,       totalQuestions: science.totalQuestions,
        scaledScore: science.scaledScore ?? null,
      },
    },
  }
}

// Pair English, Mathematics, Reading and Science score arrays into full-test attempts.
// Strategy: sort lists oldest-first, then pair by index.
function pairFullTestAttempts(englishScores, mathScores, readingScores, scienceScores) {
  if (!englishScores.length || !mathScores.length || !readingScores.length || !scienceScores.length) return []
  const count  = Math.min(englishScores.length, mathScores.length, readingScores.length, scienceScores.length)
  const paired = []
  for (let i = 0; i < count; i++) {
    paired.push(buildFullAttempt(englishScores[i], mathScores[i], readingScores[i], scienceScores[i]))
  }
  return paired
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ACTAnalysis = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [results,         setResults]         = useState(null)
  const [enriched,        setEnriched]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [phase,           setPhase]           = useState('results')
  const [allAttempts,     setAllAttempts]     = useState([])
  const [activeAttemptId, setActiveAttemptId] = useState(null)
  const [saveWarning,     setSaveWarning]     = useState(location.state?.saveWarning || null)

  const questionsRef = useRef([])

  const buildEnriched = (responseList, questionList) => {
    const qMap = {}
    questionList.forEach(q => { qMap[String(q._id)] = q })
    return responseList.map((r, i) => ({
      ...r,
      questionData: qMap[String(r.questionId)] || questionList[i] || null,
      globalIndex:  i,
    }))
  }

  const switchAttempt = (attempt) => {
    setActiveAttemptId(attempt._id)
    setResults(attempt)
    // Use already-loaded question pool if available; otherwise questions show as previews only
    setEnriched(buildEnriched(attempt.responses || [], questionsRef.current))
    setPhase('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => { loadKaTeX() }, [])

  useEffect(() => {
    let res = null
    let qs  = []

    if (location.state?.results) {
      res = location.state.results
      qs  = location.state.questions || []
    } else {
      try {
        const stored = JSON.parse(sessionStorage.getItem('actAnalysis') || '{}')
        res = stored.results || null
        qs  = stored.questions || []
      } catch { /* ignore */ }
    }

    if (!res) { navigate('/courses/act', { replace: true }); return }
    setResults(res)
    setActiveAttemptId(res._id || null)

    const responses = res.responses || []

    if (qs.length > 0) {
      questionsRef.current = qs
      setEnriched(buildEnriched(responses, qs))
    } else {
      setEnriched(responses.map((r, i) => ({ ...r, questionData: null, globalIndex: i })))
    }
    setLoading(false)

    // Fetch questions by subject so the review page can show full question content
    // (needed when navigating from the ACT listing page where questions aren't passed)
    if (res.subject && !qs.length) {
      axios.get(`${API_URL}/api/act_questions?subject=${encodeURIComponent(res.subject)}`, { withCredentials: true })
        .then(({ data }) => {
          const fetched = Array.isArray(data) ? data : []
          if (fetched.length > 0) {
            questionsRef.current = fetched
            setEnriched(buildEnriched(responses, fetched))
          }
        })
        .catch(() => {})
    } else if (res.testType === 'full' && !qs.length) {
      // Full test: fetch all four sections and tag each question with its section
      Promise.all([
        axios.get(`${API_URL}/api/act_questions?subject=${encodeURIComponent('English')}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/act_questions?subject=${encodeURIComponent('Mathematics')}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/act_questions?subject=${encodeURIComponent('Reading')}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/act_questions?subject=${encodeURIComponent('Science')}`, { withCredentials: true }),
      ]).then(([englishRes, mathRes, readingRes, scienceRes]) => {
        const english = (Array.isArray(englishRes.data) ? englishRes.data : []).map(q => ({ ...q, subject: 'English' }))
        const math    = (Array.isArray(mathRes.data)    ? mathRes.data    : []).map(q => ({ ...q, subject: 'Mathematics' }))
        const reading = (Array.isArray(readingRes.data) ? readingRes.data : []).map(q => ({ ...q, subject: 'Reading' }))
        const science = (Array.isArray(scienceRes.data) ? scienceRes.data : []).map(q => ({ ...q, subject: 'Science' }))
        const all  = [...english, ...math, ...reading, ...science]
        if (all.length > 0) {
          questionsRef.current = all
          setEnriched(buildEnriched(responses, all))
        }
      }).catch(() => {})
    }

    // Fetch all attempts so user can switch between them
    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.email) return null
        return axios.get(`${API_URL}/api/act_scores`, {
          params: { email: data.email },
          withCredentials: true,
        })
      })
      .then(resp => {
        if (!resp?.data) return
        const all = Array.isArray(resp.data) ? resp.data : []

        let attempts = []
        if (res.testType === 'full') {
          // Pair each English record with its nearest Mathematics/Reading/Science record
          const englishScores = all.filter(s => s.subject === 'English')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          const mathScores    = all.filter(s => s.subject === 'Mathematics')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          const readingScores = all.filter(s => s.subject === 'Reading')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          const scienceScores = all.filter(s => s.subject === 'Science')
                               .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          attempts = pairFullTestAttempts(englishScores, mathScores, readingScores, scienceScores)
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        } else {
          // Section-level: match by subject
          attempts = res.subject
            ? all.filter(a => a.subject === res.subject)
            : []
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        }

        setAllAttempts(attempts)
        // activeAttemptId defaults to res._id; fall back to most-recent if not set
        if (!res._id && attempts.length > 0) setActiveAttemptId(attempts[0]._id)
      })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border" style={{ color: '#b71c1c' }} role="status" />
    </div>
  )

  if (!results) return null

  if (phase === 'results') return (
    <>
      {saveWarning && (
        <div className="alert alert-warning d-flex justify-content-between align-items-start m-3" role="alert">
          <span><i className="bi bi-exclamation-triangle-fill me-2" />{saveWarning}</span>
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => setSaveWarning(null)} />
        </div>
      )}
      <ResultsPage
        results={results}
        enriched={enriched}
        onReview={() => setPhase('review')}
        allAttempts={allAttempts}
        activeAttemptId={activeAttemptId}
        onSwitchAttempt={switchAttempt}
      />
    </>
  )

  return (
    <ReviewAnswersPage
      enriched={enriched}
      results={results}
      onBack={() => setPhase('results')}
    />
  )
}

export default ACTAnalysis
