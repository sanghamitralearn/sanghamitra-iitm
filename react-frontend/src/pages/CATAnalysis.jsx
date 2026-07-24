import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const VARC = 'Verbal Ability & Reading Comprehension'
const DILR = 'Data Interpretation & Logical Reasoning'
const QA   = 'Quantitative Ability'
const CAT_SECTIONS = [VARC, DILR, QA]

const SECTION_COLOR = { [VARC]: '#e8590c', [DILR]: '#c92a2a', [QA]: '#f08c00' }
const SECTION_GRADIENT = {
  [VARC]: 'linear-gradient(135deg,#e8590c,#ff922b)',
  [DILR]: 'linear-gradient(135deg,#c92a2a,#ff6b6b)',
  [QA]:   'linear-gradient(135deg,#f08c00,#ffd43b)',
}
const SECTION_ICON = { [VARC]: 'bi-chat-square-text-fill', [DILR]: 'bi-diagram-3-fill', [QA]: 'bi-calculator-fill' }
const SECTION_SHORT = { [VARC]: 'VARC', [DILR]: 'DILR', [QA]: 'QA' }

// ─── KaTeX ────────────────────────────────────────────────────────────────────
function loadKaTeX() {
  if (window.renderMathInElement) return
  if (window._catKatexLoading) return
  window._catKatexLoading = true
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
    ar.onload = () => { window._catKatexLoading = false }
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
      throwOnError: false, trust: true, strict: false,
    })
  }
  setTimeout(run, 50)
}

function resolveType(q) {
  const t = q.type || ''
  if (t === 'numeric' || t === 'numeric_entry' || t === 'integer') return 'numeric'
  if (t === 'multiple_select') return 'multiple_select'
  const hasOpts = Array.isArray(q.options) && q.options.length > 0
  if (!hasOpts) return 'numeric'
  if (Array.isArray(q.correct_answer) && q.correct_answer.length > 1) return 'multiple_select'
  return 'multiple_choice'
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

// ─── MathText ─────────────────────────────────────────────────────────────────
function MathText({ text }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  const html = (text || '').replace(/\\%/g, '%').replace(/\\\\/g, '<br>')
  return <span ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
}

function PassageBlock({ text, subject }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [text])
  if (!text) return null
  const accent = SECTION_COLOR[subject] || SECTION_COLOR[VARC]
  const html = (text || '').replace(/\\%/g, '%').replace(/\\\\/g, '<br>')
  return (
    <div style={{
      background: `${accent}0d`, border: `1px solid ${accent}44`,
      borderLeft: `4px solid ${accent}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', color: accent, marginBottom: 10, textTransform: 'uppercase' }}>Passage / Data</div>
      <div ref={ref} style={{ fontSize: '1rem', lineHeight: 1.85, whiteSpace: 'pre-wrap', margin: 0, color: '#1a1a2e' }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function QuestionContent({ q }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) renderMath(ref.current) }, [q])
  return (
    <div ref={ref}>
      {q.passage && <PassageBlock text={q.passage} subject={q.subject} />}
      <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}><MathText text={q.question_text} /></p>
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
const ResultsPage = ({ results, onReview, allAttempts, activeAttemptId, onSwitchAttempt }) => {
  const [selectedView, setSelectedView] = useState('overview')

  const sectionStats = {}
  for (const sec of CAT_SECTIONS) {
    const ss = results.sectionScores?.[sec] || {}
    sectionStats[sec] = {
      score: ss.score ?? 0, max: ss.maxScore ?? 0,
      correct: ss.correctAnswers ?? 0, wrong: ss.wrongAnswers ?? 0,
      unattempted: ss.unattempted ?? 0, total: ss.totalQuestions ?? 0,
    }
  }

  const isFullTest = results.testType === 'full'

  if (!isFullTest) {
    const sub = results.subject || ''
    if (sub) {
      sectionStats[sub] = {
        score: results.score ?? 0, max: results.maxScore ?? 0,
        correct: results.correctAnswers ?? 0, wrong: results.wrongAnswers ?? 0,
        unattempted: results.unattempted ?? 0, total: results.totalQuestions ?? (results.responses || []).length,
      }
    }
  }

  const sidebarSections = isFullTest ? CAT_SECTIONS : (results.subject ? [results.subject] : [])
  const isSectionView = selectedView !== 'overview'
  const currentStats = isSectionView ? sectionStats[selectedView] : null

  const displayScore       = isSectionView ? (currentStats?.score ?? 0) : (results.score ?? 0)
  const displayMax         = isSectionView ? (currentStats?.max ?? 0) : (results.maxScore ?? 0)
  const displayCorrect     = isSectionView ? (currentStats?.correct ?? 0) : (results.correctAnswers ?? 0)
  const displayWrong       = isSectionView ? (currentStats?.wrong ?? 0) : (results.wrongAnswers ?? 0)
  const displayUnattempted = isSectionView ? (currentStats?.unattempted ?? 0) : (results.unattempted ?? 0)
  const total = displayCorrect + displayWrong + displayUnattempted || 1

  const cardGradient = isSectionView ? (SECTION_GRADIENT[selectedView] || 'linear-gradient(135deg,#6c757d,#495057)') : 'linear-gradient(135deg,#e8590c,#c92a2a)'
  const displaySubject = results.subject || ''
  const testLabel = isFullTest ? 'Full CAT Test' : `CAT — ${SECTION_SHORT[displaySubject] || displaySubject || 'Practice'}`

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/courses/cat" style={{ color: '#495057', fontSize: '1.3rem', textDecoration: 'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: {testLabel}</span>
          {results.dateAttempted && (
            <span className="ms-2 text-muted fw-normal">
              — {new Date(results.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>CAT</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onReview}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

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
                  style={{ appearance: 'none', width: '100%', padding: '6px 36px 6px 12px', borderRadius: 10, border: '1.5px solid #ced4da', background: '#f8f9fa', fontSize: '0.83rem', fontWeight: 600, color: '#212529', cursor: 'pointer', outline: 'none' }}>
                  {sorted.map((a, i) => {
                    const d = new Date(a.dateAttempted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    const pct = a.maxScore > 0 ? Math.round(Math.max(0, a.score) / a.maxScore * 100) : 0
                    return <option key={a._id || i} value={i}>Attempt {i + 1} — {d} — {a.score}/{a.maxScore} ({pct}%)</option>
                  })}
                </select>
                <i className="bi bi-chevron-down" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.75rem', color: '#666' }} />
              </div>
              <span className="badge px-3 py-2" style={{ background: activePct >= 60 ? '#28a745' : activePct >= 35 ? '#ffc107' : '#dc3545', color: '#fff', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                {active.score}/{active.maxScore} · {activePct}%
              </span>
            </div>
          </div>
        )
      })()}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {sidebarSections.length > 0 && (
                <>
                  <div className="w-100 p-3 d-flex align-items-center justify-content-between" style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ paddingLeft: 10, fontWeight: 500, color: '#495057', fontSize: '0.9rem' }}>Sections</span>
                  </div>
                  {sidebarSections.map(sec => {
                    const secActive = selectedView === sec
                    return (
                      <button key={sec} onClick={() => setSelectedView(sec)}
                        className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                        style={{ background: secActive ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                        <span style={{ borderLeft: secActive ? `3px solid ${SECTION_COLOR[sec]}` : '3px solid transparent', paddingLeft: 10, color: secActive ? SECTION_COLOR[sec] : '#495057', fontWeight: secActive ? 600 : 400, fontSize: '0.95rem' }}>
                          {SECTION_SHORT[sec] || sec}
                        </span>
                        {selectedView === sec && <span style={{ width: 8, height: 8, borderRadius: '50%', background: SECTION_COLOR[sec], display: 'inline-block' }} />}
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <Link to="/courses/cat" className="btn btn-outline-dark btn-sm"><i className="bi bi-house me-1" />CAT</Link>
            </div>
          </div>

          <div className="col-md-9">
            <div className="text-white mb-4" style={{ background: cardGradient, borderRadius: 16, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <h5 className="fw-bold mb-4" style={{ opacity: 0.95 }}>
                {isSectionView ? `${SECTION_SHORT[selectedView] || selectedView} Report` : 'Overall'}
              </h5>
              <div className="text-center">
                <div style={{ width: 150, height: 150, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{displayScore}</span>
                  <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                  <span style={{ fontSize: 22, opacity: 0.9 }}>{displayMax}</span>
                </div>
                <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                  Time taken: {Math.floor((results.totalTimeTaken || 0) / 60)}m {(results.totalTimeTaken || 0) % 60}s
                </div>
              </div>
            </div>

            {selectedView === 'overview' && isFullTest && (
              <div className="row g-3 mb-4">
                {CAT_SECTIONS.map(sec => {
                  const st = sectionStats[sec]
                  return (
                    <div key={sec} className="col-md-4">
                      <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius: 12, cursor: 'pointer' }} onClick={() => setSelectedView(sec)}>
                        <div style={{ height: 4, background: SECTION_GRADIENT[sec], borderRadius: '12px 12px 0 0' }} />
                        <div className="card-body py-3">
                          <i className={`bi ${SECTION_ICON[sec]} mb-2`} style={{ fontSize: '1.3rem', color: SECTION_COLOR[sec] }} />
                          <div className="fw-bold mb-1" style={{ color: SECTION_COLOR[sec] }}>{SECTION_SHORT[sec]}</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#212529' }}>{st.score}</div>
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

            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Marks Summary</h5>
                <p className="text-muted small mb-4">You've answered {Math.round(displayCorrect / total * 100)}% questions correctly</p>
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
const ReviewAnswersPage = ({ enriched, onBack }) => {
  const [sectionFilter, setSectionFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) renderMath(ref.current) }, [expandedIdx])

  const availableSections = [...new Set(enriched.map(r => r.subject).filter(Boolean))]

  const selectSection = sec => setSectionFilter(sectionFilter === sec ? null : sec)

  const sectionScoped = enriched.filter(r => !sectionFilter || r.subject === sectionFilter)

  const counts = {
    all: sectionScoped.length,
    correct: sectionScoped.filter(r => r?.isCorrect).length,
    incorrect: sectionScoped.filter(r => r && !r.isCorrect && !r.unattempted).length,
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
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
        <strong>Review Answers</strong>
      </div>

      {availableSections.length > 1 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
          <div className="d-flex gap-2 flex-wrap">
            {availableSections.map(sec => (
              <button key={sec} onClick={() => selectSection(sec)}
                style={{
                  padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
                  borderColor: sectionFilter === sec ? (SECTION_COLOR[sec] || '#e8590c') : '#ced4da',
                  background: sectionFilter === sec ? (SECTION_COLOR[sec] || '#e8590c') : '#fff',
                  color: sectionFilter === sec ? '#fff' : '#495057',
                }}>
                {SECTION_SHORT[sec] || sec} {sectionFilter === sec && '×'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {sectionFilter && (
                <div className="px-3 pt-3 pb-1 text-muted" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {SECTION_SHORT[sectionFilter] || sectionFilter}
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
                  <span style={{ borderLeft: statusFilter === key ? '3px solid #e8590c' : '3px solid transparent', paddingLeft: 10, color: statusFilter === key ? '#e8590c' : '#212529', fontWeight: statusFilter === key ? 600 : 400 }}>{label}</span>
                  {statusFilter === key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8590c', display: 'inline-block' }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-9">
            {filtered.length === 0
              ? <div className="text-center py-5 text-muted">No questions match the selected filter.</div>
              : filtered.map((r, fi) => {
                  const q = r.questionData
                  const i = r.globalIndex
                  const isOpen = expandedIdx === i
                  const statusColor = r.unattempted ? '#6c757d' : r.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel = `${r.marksAwarded > 0 ? '+' : ''}${r.marksAwarded ?? 0}`
                  const secColor = SECTION_COLOR[r.subject] || '#6c757d'
                  const qType = q ? resolveType(q) : null

                  return (
                    <div key={fi} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.82rem' }}>
                          ⊙ CORRECT: {r.unattempted ? 'N/A' : (r.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          {r.subject && <span className="badge" style={{ background: secColor, fontSize: '0.68rem' }}>{SECTION_SHORT[r.subject] || r.subject}</span>}
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize: '0.8rem' }} />
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {q?.difficulty && (
                            <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.7rem' }}>{q.difficulty}</span>
                          )}
                          <span className="ms-auto fw-bold" style={{ color: statusColor }}>{marksLabel}</span>
                        </div>

                        <div style={{ cursor: 'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen && q
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize: '0.93rem', lineHeight: 1.6 }}>
                                {(() => { const t = q?.question_text || '(Question not available)'; return t.length > 220 ? t.slice(0, 220) + '…' : t })()}
                              </p>}
                        </div>

                        {isOpen && q && (
                          <div className="mt-3">
                            {qType === 'multiple_choice' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const isCrr = String(q.correct_answer ?? '').trim() === opt.option_id
                                  const userPicked = String(r.userResponse ?? '').trim() === opt.option_id
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded" style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {qType === 'multiple_select' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const corrArr = (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(String)
                                  const isCrr = corrArr.includes(opt.option_id)
                                  const userPicked = Array.isArray(r.userResponse) && r.userResponse.includes(opt.option_id)
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded" style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth: 24 }}>{opt.option_id}.</span>
                                      {isCrr && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <span style={{ fontSize: '0.9rem' }}><MathText text={opt.text} /></span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {qType === 'numeric' && (
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                <span className="badge bg-light text-dark border fs-6">Your answer: <strong>{r.userResponse ?? '(not answered)'}</strong></span>
                                <span className="badge bg-success fs-6">
                                  Correct: <strong>
                                    {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                                      ? `${q.correct_answer.min} – ${q.correct_answer.max}` : String(q.correct_answer)}
                                  </strong>
                                </span>
                              </div>
                            )}
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

// ─── Pair VARC + DILR + QA DB records into one full-test attempt object ──────
function buildFullAttempt(varc, dilr, qa) {
  const score       = (varc.score       || 0) + (dilr.score       || 0) + (qa.score       || 0)
  const maxScore    = (varc.maxScore    || 0) + (dilr.maxScore    || 0) + (qa.maxScore    || 0)
  const correct     = (varc.correctAnswers || 0) + (dilr.correctAnswers || 0) + (qa.correctAnswers || 0)
  const wrong       = (varc.wrongAnswers   || 0) + (dilr.wrongAnswers   || 0) + (qa.wrongAnswers   || 0)
  const unattempted = (varc.unattempted    || 0) + (dilr.unattempted    || 0) + (qa.unattempted    || 0)
  return {
    _id: new Date(varc.dateAttempted).toISOString(),
    testType: 'full', score, maxScore,
    correctAnswers: correct, wrongAnswers: wrong, unattempted,
    totalTimeTaken: 0, dateAttempted: varc.dateAttempted,
    responses: [
      ...(varc.responses || []).map(r => ({ ...r, subject: VARC })),
      ...(dilr.responses || []).map(r => ({ ...r, subject: DILR })),
      ...(qa.responses   || []).map(r => ({ ...r, subject: QA })),
    ],
    sectionScores: {
      [VARC]: { score: varc.score, maxScore: varc.maxScore, correctAnswers: varc.correctAnswers, wrongAnswers: varc.wrongAnswers, unattempted: varc.unattempted, totalQuestions: varc.totalQuestions },
      [DILR]: { score: dilr.score, maxScore: dilr.maxScore, correctAnswers: dilr.correctAnswers, wrongAnswers: dilr.wrongAnswers, unattempted: dilr.unattempted, totalQuestions: dilr.totalQuestions },
      [QA]:   { score: qa.score,   maxScore: qa.maxScore,   correctAnswers: qa.correctAnswers,   wrongAnswers: qa.wrongAnswers,   unattempted: qa.unattempted,   totalQuestions: qa.totalQuestions },
    },
  }
}

function pairFullTestAttempts(varcScores, dilrScores, qaScores) {
  if (!varcScores.length || !dilrScores.length || !qaScores.length) return []
  const count = Math.min(varcScores.length, dilrScores.length, qaScores.length)
  const paired = []
  for (let i = 0; i < count; i++) paired.push(buildFullAttempt(varcScores[i], dilrScores[i], qaScores[i]))
  return paired
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CATAnalysis = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [results, setResults]                 = useState(null)
  const [enriched, setEnriched]                = useState([])
  const [loading, setLoading]                  = useState(true)
  const [phase, setPhase]                      = useState('results')
  const [allAttempts, setAllAttempts]          = useState([])
  const [activeAttemptId, setActiveAttemptId]  = useState(null)
  const [saveWarning, setSaveWarning]          = useState(location.state?.saveWarning || null)

  const questionsRef = useRef([])

  const buildEnriched = (responseList, questionList) => {
    const qMap = {}
    questionList.forEach(q => { qMap[String(q._id)] = q })
    return responseList.map((r, i) => ({ ...r, questionData: qMap[String(r.questionId)] || questionList[i] || null, globalIndex: i }))
  }

  const switchAttempt = (attempt) => {
    setActiveAttemptId(attempt._id)
    setResults(attempt)
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
        const stored = JSON.parse(sessionStorage.getItem('catAnalysis') || '{}')
        res = stored.results || null
        qs  = stored.questions || []
      } catch { /* ignore */ }
    }

    if (!res) { navigate('/courses/cat', { replace: true }); return }
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

    if (res.subject && !qs.length) {
      axios.get(`${API_URL}/api/cat_questions?subject=${encodeURIComponent(res.subject)}`, { withCredentials: true })
        .then(({ data }) => {
          const fetched = Array.isArray(data) ? data : []
          if (fetched.length > 0) { questionsRef.current = fetched; setEnriched(buildEnriched(responses, fetched)) }
        }).catch(() => {})
    } else if (res.testType === 'full' && !qs.length) {
      Promise.all(CAT_SECTIONS.map(sec =>
        axios.get(`${API_URL}/api/cat_questions?subject=${encodeURIComponent(sec)}`, { withCredentials: true })
      )).then((resList) => {
        const all = resList.flatMap((r, i) => (Array.isArray(r.data) ? r.data : []).map(q => ({ ...q, subject: CAT_SECTIONS[i] })))
        if (all.length > 0) { questionsRef.current = all; setEnriched(buildEnriched(responses, all)) }
      }).catch(() => {})
    }

    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.email) return null
        return axios.get(`${API_URL}/api/cat_scores`, { params: { email: data.email }, withCredentials: true })
      })
      .then(resp => {
        if (!resp?.data) return
        const all = Array.isArray(resp.data) ? resp.data : []

        let attempts = []
        if (res.testType === 'full') {
          const bySub = sub => all.filter(s => s.subject === sub).sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
          attempts = pairFullTestAttempts(bySub(VARC), bySub(DILR), bySub(QA))
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        } else {
          attempts = res.subject ? all.filter(a => a.subject === res.subject) : []
          attempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        }

        setAllAttempts(attempts)
        if (!res._id && attempts.length > 0) setActiveAttemptId(attempts[0]._id)
      })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border" style={{ color: '#e8590c' }} role="status" />
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
        onReview={() => setPhase('review')}
        allAttempts={allAttempts}
        activeAttemptId={activeAttemptId}
        onSwitchAttempt={switchAttempt}
      />
    </>
  )

  return <ReviewAnswersPage enriched={enriched} onBack={() => setPhase('results')} />
}

export default CATAnalysis
