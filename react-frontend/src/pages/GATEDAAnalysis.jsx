import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { SUBJECT_STYLE } from './courses/subjectStyle'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const GATE_DA_SECTIONS = [
  'General Aptitude',
  'Engineering Mathematics',
  'Programming & Data Structures',
  'Database Management & Warehousing',
  'Machine Learning',
  'Artificial Intelligence',
]

const SECTION_ICON = {
  'General Aptitude':                    'bi-lightbulb-fill',
  'Engineering Mathematics':              'bi-calculator-fill',
  'Programming & Data Structures':        'bi-code-slash',
  'Database Management & Warehousing':    'bi-database-fill',
  'Machine Learning':                     'bi-cpu-fill',
  'Artificial Intelligence':              'bi-robot',
}

const sectionColor    = sec => (SUBJECT_STYLE[sec] || {}).badge    || '#6c757d'
const sectionGradient = sec => (SUBJECT_STYLE[sec] || {}).gradient || 'linear-gradient(135deg,#6c757d,#495057)'

// Format a (possibly negative, possibly fractional) marks value with an explicit
// sign, e.g. 1 -> "+1", -0.66 -> "-0.66", 0 -> "0". GATE DA has real negative
// marking — never assume marksAwarded >= 0.
function fmtMarks(n) {
  const v = Number(n) || 0
  const rounded = Math.round(v * 100) / 100
  const abs = Math.abs(rounded)
  const str = Number.isInteger(abs) ? String(abs) : abs.toFixed(2)
  if (rounded > 0) return `+${str}`
  if (rounded < 0) return `-${str}`
  return '0'
}

// ─── KaTeX ────────────────────────────────────────────────────────────────────
function loadKaTeX() {
  if (window.renderMathInElement) return
  if (window._gateDaKatexLoading) return
  window._gateDaKatexLoading = true
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
    ar.onload = () => { window._gateDaKatexLoading = false }
    document.head.appendChild(ar)
  }
  document.head.appendChild(core)
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
  }
  setTimeout(run, 50)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOpts    = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOpts && !hasImgOpts) return 'numeric'
  return q.type || 'multiple_choice'
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

// ─── MathText ─────────────────────────────────────────────────────────────────
function MathText({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  const html = (text || '')
    .replace(/\\\$/g, '&#36;')
    .replace(
      /\(structure\)/g,
      '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;' +
      'background:#fff3cd;border:1px dashed #ffc107;border-radius:4px;font-size:0.8rem;' +
      'color:#856404;vertical-align:middle;margin:0 4px;">⬡ Structure</span>'
    )
  return (
    <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

// ─── Passage block ────────────────────────────────────────────────────────────
function PassageBlock({ text }) {
  if (!text) return null
  return (
    <div style={{
      background: '#f8f9ff', border: '1px solid #d0d9f0',
      borderLeft: '4px solid #003D8F', borderRadius: 10,
      padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: '#003D8F', marginBottom: 10, textTransform: 'uppercase' }}>
        Passage
      </div>
      <p style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }}
        dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  )
}

// ─── Question Content ─────────────────────────────────────────────────────────
function QuestionContent({ q }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [q])
  return (
    <div ref={ref}>
      {q.passage && <PassageBlock text={q.passage} />}
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
    </div>
  )
}

// ─── Results Page ─────────────────────────────────────────────────────────────
const ResultsPage = ({ results, enriched, onReview, allAttempts, activeAttemptId, onSwitchAttempt }) => {
  const [selectedView, setSelectedView] = useState('overview')

  const isFullTest = results.testType === 'full'

  const sectionStats = {}
  if (isFullTest) {
    for (const sec of GATE_DA_SECTIONS) {
      const ss = results.sectionScores?.[sec]
      if (!ss) continue
      sectionStats[sec] = {
        score:       ss.score ?? 0,
        max:         ss.maxScore ?? 0,
        correct:     ss.correctAnswers ?? 0,
        wrong:       ss.wrongAnswers ?? 0,
        unattempted: ss.unattempted ?? 0,
        total:       ss.totalQuestions ?? 0,
      }
    }
  } else if (results.subject) {
    sectionStats[results.subject] = {
      score:       results.score ?? 0,
      max:         results.maxScore ?? 0,
      correct:     results.correctAnswers ?? 0,
      wrong:       results.wrongAnswers ?? 0,
      unattempted: results.unattempted ?? 0,
      total:       results.totalQuestions ?? (results.responses || []).length,
    }
  }

  // Only the sections that actually appear in this attempt — works for however
  // many of the 6 GATE DA subjects were part of the test (1 for practice, up to 6 for a full test).
  const sidebarSections = isFullTest
    ? GATE_DA_SECTIONS.filter(sec => sectionStats[sec])
    : (results.subject ? [results.subject] : [])

  const isSectionView = selectedView !== 'overview'
  const currentStats  = isSectionView ? sectionStats[selectedView] : null

  const displayScore       = isSectionView ? (currentStats?.score ?? 0) : (results.score ?? 0)
  const displayMax         = isSectionView ? (currentStats?.max ?? 0) : (results.maxScore ?? 0)
  const displayCorrect     = isSectionView ? (currentStats?.correct ?? 0) : (results.correctAnswers ?? 0)
  const displayWrong       = isSectionView ? (currentStats?.wrong ?? 0) : (results.wrongAnswers ?? 0)
  const displayUnattempted = isSectionView ? (currentStats?.unattempted ?? 0) : (results.unattempted ?? 0)
  const total              = displayCorrect + displayWrong + displayUnattempted || 1

  // Marks actually lost to negative marking, scoped to the current view.
  const relevantResponses = isSectionView ? enriched.filter(r => r.subject === selectedView) : enriched
  const marksDeducted = relevantResponses
    .filter(r => r && !r.isCorrect && !r.unattempted && (r.marksAwarded ?? 0) < 0)
    .reduce((sum, r) => sum + (r.marksAwarded ?? 0), 0)

  const cardGradient = isSectionView
    ? sectionGradient(selectedView)
    : 'linear-gradient(135deg,#198754,#0d6efd)'
  const testLabel = isFullTest ? 'Full GATE DA Test' : `GATE DA — ${results.subject || 'Practice'}`

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/courses/gate-da" style={{ color: '#495057', fontSize: '1.3rem', textDecoration: 'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: {testLabel}</span>
          {results.dateAttempted && (
            <span className="ms-2 text-muted fw-normal">
              — {new Date(results.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>GATE DA</span>
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
                        Attempt {i + 1} — {d} — {fmtMarks(a.score)}/{a.maxScore} ({pct}%)
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
                {fmtMarks(active.score)}/{active.maxScore} · {activePct}%
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
                      <button key={sec}
                        onClick={() => setSelectedView(sec)}
                        className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                        style={{ background: secActive ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                        <span style={{ borderLeft: secActive ? `3px solid ${sectionColor(sec)}` : '3px solid transparent', paddingLeft: 10, color: secActive ? sectionColor(sec) : '#495057', fontWeight: secActive ? 600 : 400, fontSize: '0.95rem' }}>
                          {sec}
                        </span>
                        {secActive && <span style={{ width: 8, height: 8, borderRadius: '50%', background: sectionColor(sec), display: 'inline-block' }} />}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <Link to="/courses/gate-da" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-house me-1" />GATE DA
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
                  <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{fmtMarks(displayScore)}</span>
                  <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                  <span style={{ fontSize: 22, opacity: 0.9 }}>{displayMax}</span>
                </div>
                <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                  Time taken: {Math.floor((results.totalTimeTaken || 0) / 60)}m {(results.totalTimeTaken || 0) % 60}s
                </div>
              </div>
            </div>

            {/* Section cards — full test overview only */}
            {selectedView === 'overview' && isFullTest && sidebarSections.length > 0 && (
              <div className="row g-3 mb-4">
                {sidebarSections.map(sec => {
                  const st = sectionStats[sec]
                  return (
                    <div key={sec} className="col-md-6 col-lg-4">
                      <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius: 12, cursor: 'pointer' }}
                        onClick={() => setSelectedView(sec)}>
                        <div style={{ height: 4, background: sectionGradient(sec), borderRadius: '12px 12px 0 0' }} />
                        <div className="card-body py-3">
                          <i className={`bi ${SECTION_ICON[sec] || 'bi-journal-text'} mb-2`} style={{ fontSize: '1.3rem', color: sectionColor(sec) }} />
                          <div className="fw-bold mb-1" style={{ color: sectionColor(sec), fontSize: '0.85rem' }}>{sec}</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#212529' }}>{fmtMarks(st.score)}</div>
                          <div className="text-muted" style={{ fontSize: '0.82rem' }}>/ {st.max}</div>
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
                  <div className="col-4">
                    <div style={{ background: '#d4edda', borderRadius: 12, padding: '20px 8px' }}>
                      <i className="bi bi-check-circle-fill mb-2" style={{ fontSize: '1.5rem', color: '#28a745' }} />
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#28a745' }}>{displayCorrect}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>Correct</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div style={{ background: '#f8d7da', borderRadius: 12, padding: '20px 8px' }}>
                      <i className="bi bi-x-circle-fill mb-2" style={{ fontSize: '1.5rem', color: '#dc3545' }} />
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc3545' }}>{displayWrong}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {marksDeducted < 0 ? `Marks deducted: ${fmtMarks(marksDeducted)}` : 'Incorrect'}
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div style={{ background: '#e9ecef', borderRadius: 12, padding: '20px 8px' }}>
                      <i className="bi bi-dash-circle-fill mb-2" style={{ fontSize: '1.5rem', color: '#6c757d' }} />
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#6c757d' }}>{displayUnattempted}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>Unattempted</div>
                    </div>
                  </div>
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
const ReviewAnswersPage = ({ enriched, onBack }) => {
  const [sectionFilter, setSectionFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) renderMath(ref.current) }, [expandedIdx])

  const counts = {
    all:         enriched.length,
    correct:     enriched.filter(r => r?.isCorrect).length,
    incorrect:   enriched.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: enriched.filter(r => r?.unattempted).length,
  }

  const availableSections = [...new Set(enriched.map(r => r.subject).filter(Boolean))]

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
              <button key={sec} onClick={() => setSectionFilter(sectionFilter === sec ? null : sec)}
                style={{
                  padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer',
                  fontWeight: 500, fontSize: '0.88rem',
                  borderColor: sectionFilter === sec ? sectionColor(sec) : '#ced4da',
                  background:  sectionFilter === sec ? sectionColor(sec) : '#fff',
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
                  const marksLabel  = r.unattempted ? 'N/A' : fmtMarks(r.marksAwarded)
                  const secColor    = sectionColor(r.subject)

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

// ─── Build one combined full-test attempt object from N per-subject DB records ─
function buildFullAttempt(group) {
  const score       = group.reduce((s, g) => s + (g.score || 0), 0)
  const maxScore    = group.reduce((s, g) => s + (g.maxScore || 0), 0)
  const correct     = group.reduce((s, g) => s + (g.correctAnswers || 0), 0)
  const wrong       = group.reduce((s, g) => s + (g.wrongAnswers || 0), 0)
  const unattempted = group.reduce((s, g) => s + (g.unattempted || 0), 0)
  const sectionScores = {}
  group.forEach(g => {
    sectionScores[g.subject] = {
      score: g.score, maxScore: g.maxScore,
      correctAnswers: g.correctAnswers, wrongAnswers: g.wrongAnswers,
      unattempted: g.unattempted, totalQuestions: g.totalQuestions,
    }
  })
  return {
    _id:            group[0].attemptId || new Date(group[0].dateAttempted).toISOString(),
    testType:       'full',
    score, maxScore,
    correctAnswers: correct,
    wrongAnswers:   wrong,
    unattempted,
    totalTimeTaken: group.reduce((s, g) => s + (g.totalTimeTaken || 0), 0),
    dateAttempted:  group[0].dateAttempted,
    responses: group.flatMap(g => (g.responses || []).map(r => ({ ...r, subject: g.subject }))),
    sectionScores,
  }
}

// Group raw per-subject full-test score records into combined full-test attempts.
// Works for however many of the 6 GATE DA subjects were part of a given sitting
// (unlike SAT's fixed 2-section pairing). Prefers grouping by a shared `attemptId`
// field (set server-side for records saved together); falls back to positional
// pairing across subjects sorted chronologically when no attemptId is present.
function groupFullTestAttempts(records) {
  const fullRecords = (records || []).filter(r => r.testType === 'full')
  if (!fullRecords.length) return []

  if (fullRecords.some(r => r.attemptId)) {
    const byId = new Map()
    fullRecords.forEach(r => {
      const key = r.attemptId || r._id || r.dateAttempted
      if (!byId.has(key)) byId.set(key, [])
      byId.get(key).push(r)
    })
    return Array.from(byId.values())
      .map(buildFullAttempt)
      .sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
  }

  const bySubject = {}
  GATE_DA_SECTIONS.forEach(sec => {
    bySubject[sec] = fullRecords
      .filter(r => r.subject === sec)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
  })
  const activeSecs = GATE_DA_SECTIONS.filter(sec => bySubject[sec].length > 0)
  if (!activeSecs.length) return []
  const count = Math.min(...activeSecs.map(sec => bySubject[sec].length))
  const attempts = []
  for (let i = 0; i < count; i++) {
    attempts.push(buildFullAttempt(activeSecs.map(sec => bySubject[sec][i])))
  }
  return attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
}

// ─── Main Component ───────────────────────────────────────────────────────────
const GATEDAAnalysis = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [results,         setResults]         = useState(null)
  const [enriched,        setEnriched]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [phase,           setPhase]           = useState('results')
  const [allAttempts,     setAllAttempts]     = useState([])
  const [activeAttemptId, setActiveAttemptId] = useState(null)

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
        const stored = JSON.parse(sessionStorage.getItem('gateDaAnalysis') || '{}')
        res = stored.results || null
        qs  = stored.questions || []
      } catch { /* ignore */ }
    }

    if (!res) { navigate('/courses/gate-da', { replace: true }); return }
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
    // (needed when navigating from the GATE DA listing page where questions aren't passed)
    if (res.subject && !qs.length) {
      axios.get(`${API_URL}/api/gate_da_questions?subject=${encodeURIComponent(res.subject)}`, { withCredentials: true })
        .then(({ data }) => {
          const fetched = Array.isArray(data) ? data : []
          if (fetched.length > 0) {
            questionsRef.current = fetched
            setEnriched(buildEnriched(responses, fetched))
          }
        })
        .catch(() => {})
    } else if (res.testType === 'full' && !qs.length) {
      // Full test: fetch whichever subjects appear in this attempt's sectionScores
      const subjectsInAttempt = res.sectionScores
        ? GATE_DA_SECTIONS.filter(sec => res.sectionScores[sec])
        : GATE_DA_SECTIONS
      Promise.all(subjectsInAttempt.map(sec =>
        axios.get(`${API_URL}/api/gate_da_questions?subject=${encodeURIComponent(sec)}`, { withCredentials: true })
          .then(({ data }) => (Array.isArray(data) ? data : []).map(q => ({ ...q, subject: sec })))
          .catch(() => [])
      )).then(lists => {
        const all = lists.flat()
        if (all.length > 0) {
          questionsRef.current = all
          setEnriched(buildEnriched(responses, all))
        }
      })
    }

    // Fetch all attempts so user can switch between them
    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.email) return null
        return axios.get(`${API_URL}/api/gate_da_scores`, {
          params: { email: data.email },
          withCredentials: true,
        })
      })
      .then(resp => {
        if (!resp?.data) return
        const all = Array.isArray(resp.data) ? resp.data : []

        let attempts = []
        if (res.testType === 'full') {
          attempts = groupFullTestAttempts(all)
        } else {
          attempts = res.subject
            ? all.filter(a => a.testType !== 'full' && a.subject === res.subject)
            : []
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        }

        setAllAttempts(attempts)
        if (!res._id && attempts.length > 0) setActiveAttemptId(attempts[0]._id)
      })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border" style={{ color: '#198754' }} role="status" />
    </div>
  )

  if (!results) return null

  if (phase === 'results') return (
    <ResultsPage
      results={results}
      enriched={enriched}
      onReview={() => setPhase('review')}
      allAttempts={allAttempts}
      activeAttemptId={activeAttemptId}
      onSwitchAttempt={switchAttempt}
    />
  )

  return (
    <ReviewAnswersPage
      enriched={enriched}
      onBack={() => setPhase('results')}
    />
  )
}

export default GATEDAAnalysis
