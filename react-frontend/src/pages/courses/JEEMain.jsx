import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const ACCENT      = '#5fcf80'
const ACCENT_DARK = '#37423b'

const SUBJECT_STYLE = {
  Physics:     { color: '#0d6efd', gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', icon: 'bi-lightning-charge-fill', short: 'Physics'     },
  Chemistry:   { color: '#198754', gradient: 'linear-gradient(135deg,#198754,#20c997)', icon: 'bi-eyedropper',            short: 'Chemistry'   },
  Mathematics: { color: '#dc3545', gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', icon: 'bi-calculator-fill',       short: 'Mathematics' },
}

// ─── Year / Shift helpers ─────────────────────────────────────────────────────
// "22 January 2025 Morning Shift"
//   → { date: "22-January-2025", shift: "Morning Shift" }
// 2025 (number)  → { date: "2025", shift: null }
function parseExamLabel(year) {
  if (!year && year !== 0) return { date: 'N/A', shift: null }
  const s = String(year)
  const shiftMatch = s.match(/(Morning|Afternoon|Evening|Night)\s+Shift/i)
  if (shiftMatch) {
    const shift    = shiftMatch[0]
    const datePart = s.replace(shift, '').trim()           // "22 January 2025"
    const formatted = datePart.replace(/\s+/g, '-')        // "22-January-2025"
    return { date: formatted, shift }
  }
  // Short codes like "P2" or numeric years
  return { date: s, shift: null }
}

// Extract 4-digit year for grouping (both numeric and string years)
function extractGroupYear(year) {
  const s   = String(year ?? '')
  const m   = s.match(/\d{4}/)
  return m ? m[0] : (s || 'Unknown')
}

function formatDisplayPaper(paper) {
  if (!paper) return 'N/A'
  if (paper.length > 5) return paper
  if (/^P[12]$/i.test(paper)) return `JEE Main Paper ${paper.slice(1)}`
  return paper
}

function groupByYear(papers) {
  return papers.reduce((acc, p) => {
    const key = extractGroupYear(p.year)
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})
}

// Shift badge colour
const shiftColor = (shift) => {
  if (!shift) return { bg: '#6c757d', text: '#fff' }
  const s = shift.toLowerCase()
  if (s.includes('morning'))   return { bg: '#f59e0b', text: '#fff' }
  if (s.includes('evening'))   return { bg: '#7c3aed', text: '#fff' }
  if (s.includes('afternoon')) return { bg: '#0ea5e9', text: '#fff' }
  return { bg: '#6c757d', text: '#fff' }
}

// ─── Component ────────────────────────────────────────────────────────────────
const JEEMain = () => {
  const navigate = useNavigate()

  const [loading, setLoading]       = useState(true)
  const [papers, setPapers]         = useState([])
  const [myAttempts, setMyAttempts] = useState([])
  const [apiError, setApiError]     = useState(null)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showPreTest, setShowPreTest]     = useState(false)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        await Promise.all([fetchPapers(), fetchMyAttempts(res.data.email)])
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchPapers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jee_main_papers`, { withCredentials: true })
      if (Array.isArray(res.data)) {
        setPapers(res.data)
        setApiError(null)
      } else {
        setApiError('Unexpected response from server.')
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load papers'
      setApiError(msg)
    }
  }

  const fetchMyAttempts = async (email) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/jee_main_full_scores?email=${encodeURIComponent(email)}`,
        { withCredentials: true }
      )
      if (Array.isArray(res.data)) setMyAttempts(res.data)
    } catch { /* optional */ }
  }

  const getMyAttempt = (year, paper) =>
    myAttempts.find(a => String(a.year) === String(year) && a.paper === paper) || null

  const getAttemptCount = (year, paper) =>
    myAttempts.filter(a => String(a.year) === String(year) && a.paper === paper).length

  const handleOpenPreTest = (p) => { setSelectedPaper(p); setShowPreTest(true) }
  const handleClosePreTest = () => { setShowPreTest(false); setSelectedPaper(null) }

  const handleStartTest = () => {
    if (!selectedPaper) return
    navigate('/courses/jee-main/test', {
      state: { year: selectedPaper.year, paper: selectedPaper.paper, paperMeta: selectedPaper }
    })
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" style={{ color: ACCENT }} role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )

  const grouped    = groupByYear(papers)
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="main">
      {/* ── Hero ── */}
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>JEE Main</h1>
                <p className="mb-0">
                  Full-length JEE Main papers with official marking scheme.
                  Select a paper to attempt all three subjects together and get a detailed analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">JEE Main</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5 mt-4">

        {/* ── API error banner ── */}
        {apiError && (
          <div className="alert d-flex align-items-center gap-2 mb-3" style={{ borderRadius: 12, background: '#fff3cd', border: '1px solid #ffc107' }}>
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5" />
            <div className="flex-grow-1">
              <strong>Could not load papers:</strong> {apiError}
              <div className="small text-muted mt-1">
                Make sure the server is running and restart it after recent code changes, then{' '}
                <button className="btn btn-sm btn-link p-0" onClick={fetchPapers}>retry</button>.
              </div>
            </div>
          </div>
        )}

        {/* ── Paper listing ── */}
        {papers.length === 0 && !apiError ? (
          <div className="text-center py-5">
            <i className="bi bi-journal-x fs-1 text-muted" />
            <h5 className="mt-3 text-muted">No papers available yet</h5>
            <p className="text-muted">
              Papers will appear automatically once question sets are added to the database.<br />
              <small>If you just added questions, make sure you <strong>restart the server</strong> and{' '}
                <button className="btn btn-sm btn-link p-0" onClick={fetchPapers}>retry</button>.
              </small>
            </p>
          </div>
        ) : papers.length > 0 && (
          <>
            <div className="d-flex align-items-center gap-2 mb-4">
              <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(180deg,${ACCENT},${ACCENT_DARK})` }} />
              <h5 className="mb-0 fw-bold" style={{ color: ACCENT_DARK }}>
                <i className="bi bi-journal-richtext me-2" style={{ color: ACCENT }} />
                Available Question Papers
              </h5>
            </div>

            {sortedKeys.map(yearKey => (
              <div key={yearKey} className="mb-5">
                {/* Year group header */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-calendar3" style={{ color: ACCENT, fontSize: '1.1rem' }} />
                  <h5 className="mb-0 fw-bold" style={{ color: ACCENT_DARK }}>{yearKey}</h5>
                  <span className="badge ms-1" style={{ background: ACCENT, color: '#fff', fontSize: '0.72rem' }}>
                    {grouped[yearKey].length} paper{grouped[yearKey].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {grouped[yearKey].map((p, idx) => {
                  const { date, shift } = parseExamLabel(p.year)
                  const displayPaper    = formatDisplayPaper(p.paper)
                  const attempt         = getMyAttempt(p.year, p.paper)
                  const attemptCount    = getAttemptCount(p.year, p.paper)
                  const pct             = attempt ? Math.round((attempt.score / attempt.maxScore) * 100) : null
                  const sc              = shiftColor(shift)

                  let progressBarColor = '#0d6efd'
                  if (pct !== null) {
                    if (pct >= 80)      progressBarColor = '#28a745'
                    else if (pct >= 60) progressBarColor = '#17a2b8'
                    else if (pct >= 40) progressBarColor = '#ffc107'
                    else if (pct > 0)   progressBarColor = '#dc3545'
                  }

                  return (
                    <div
                      key={idx}
                      className="card border-0 shadow-sm mb-3 course-item"
                      style={{ borderRadius: 16, overflow: 'hidden' }}
                    >
                      {/* Top accent bar */}
                      <div style={{ height: 5, background: `linear-gradient(90deg,${ACCENT},${ACCENT_DARK})` }} />

                      <div className="card-body p-4">
                        <div className="row align-items-center g-3">

                          {/* ── Left: title + shift + paper + subjects ── */}
                          <div className="col-lg-6">
                            <div className="d-flex align-items-start gap-3">
                              {/* Icon */}
                              <div style={{
                                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                                background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <i className="bi bi-file-earmark-text-fill text-white" style={{ fontSize: '1.4rem' }} />
                              </div>

                              <div>
                                {/* Date title */}
                                <h5 className="mb-1 fw-bold" style={{ color: ACCENT_DARK, fontSize: '1.05rem' }}>
                                  {date}
                                </h5>

                                {/* Shift badge */}
                                {shift && (
                                  <span
                                    className="badge mb-2"
                                    style={{ background: sc.bg, color: sc.text, fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20 }}
                                  >
                                    {shift}
                                  </span>
                                )}

                                {/* Paper name */}
                                <p className="mb-2 text-muted small">{displayPaper}</p>

                                {/* Subject pills */}
                                <div className="d-flex gap-2 flex-wrap">
                                  {['Physics', 'Chemistry', 'Mathematics'].map(sub => {
                                    const s   = SUBJECT_STYLE[sub]
                                    const cnt = p.subjects?.[sub]?.count
                                    if (!cnt) return null
                                    return (
                                      <span
                                        key={sub}
                                        className="badge d-inline-flex align-items-center gap-1"
                                        style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, fontSize: '0.72rem', padding: '4px 9px', borderRadius: 20, fontWeight: 600 }}
                                      >
                                        <i className={`bi ${s.icon}`} style={{ fontSize: 10 }} />
                                        {sub.slice(0,4)}: {cnt}Q
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ── Centre: question / marks counts + scorecard ── */}
                          <div className="col-lg-3">
                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="p-2 rounded text-center" style={{ background: '#f0fff4', border: '1px solid #c3e6cb' }}>
                                  <div className="fw-bold fs-5" style={{ color: '#28a745' }}>{p.totalQuestions}</div>
                                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>Questions</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="p-2 rounded text-center" style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
                                  <div className="fw-bold fs-5" style={{ color: '#856404' }}>{p.totalMarks}</div>
                                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>Max Marks</div>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="progress mb-2" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{ width: `${attempt ? pct : 0}%`, background: progressBarColor }}
                              />
                            </div>

                            {/* Score badge + details */}
                            <div className="text-center">
                              <span
                                className="d-inline-block px-3 py-1 rounded-pill text-white fw-bold mb-1"
                                style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                              >
                                {attempt ? `${pct}%` : '—'}
                              </span>
                              {attempt ? (
                                <div>
                                  <small className="text-muted d-block">Score: {attempt.score}/{attempt.maxScore}</small>
                                  <small className="text-muted d-block">{attempt.correctAnswers}/{attempt.totalQuestions} correct</small>
                                  <small className="text-muted d-block">
                                    Last: {new Date(attempt.dateAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    {attemptCount > 1 && <> · <strong style={{ color: ACCENT_DARK }}>{attemptCount} attempts</strong></>}
                                  </small>
                                </div>
                              ) : (
                                <small className="text-muted d-block">Not attempted yet</small>
                              )}
                            </div>
                          </div>

                          {/* ── Right: actions ── */}
                          <div className="col-lg-3 d-flex flex-column gap-2 align-items-lg-end">
                            <button
                              className="btn fw-semibold text-white"
                              style={{
                                background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`,
                                border: 'none', borderRadius: 10,
                                padding: '0.55rem 1.4rem', minWidth: 150,
                              }}
                              onClick={() => handleOpenPreTest(p)}
                            >
                              <i className={`bi ${attempt ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                              {attempt ? 'Reattempt' : 'Start Test'}
                            </button>
                            {attempt && (
                              <Link
                                to="/courses/jee-main/analysis"
                                state={{ results: attempt, questions: null }}
                                className="btn btn-outline-secondary btn-sm"
                                style={{ borderRadius: 10, minWidth: 150 }}
                              >
                                <i className="bi bi-bar-chart-line me-1" />View Analysis
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}

        {/* ── Subject-wise Practice ── */}
        <div className="mt-5 pt-4 border-top">
          <h5 className="fw-bold mb-1" style={{ color: ACCENT_DARK }}>
            <i className="bi bi-grid-3x3-gap-fill me-2" style={{ color: ACCENT }} />
            Subject-wise Practice
          </h5>
          <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>
            Focus on a single subject from the full question pool.
          </p>
          <div className="row g-3">
            {[
              { subject: 'Physics',     url: '/courses/jee-main/quiz/Physics'     },
              { subject: 'Chemistry',   url: '/courses/jee-main/quiz/Chemistry'   },
              { subject: 'Mathematics', url: '/courses/jee-main/quiz/Mathematics' },
            ].map(sub => {
              const s = SUBJECT_STYLE[sub.subject]
              return (
                <div key={sub.subject} className="col-md-4">
                  <Link
                    to={sub.url}
                    className="card border-0 shadow-sm text-center py-4 text-decoration-none d-block course-item"
                    style={{ borderRadius: 14, overflow: 'hidden' }}
                  >
                    <div style={{ height: 4, background: s.gradient }} />
                    <div className="card-body">
                      <i className={`bi ${s.icon} fs-2 mb-2 d-block`} style={{ color: s.color }} />
                      <h6 className="fw-bold mb-0" style={{ color: ACCENT_DARK }}>{sub.subject}</h6>
                      <small className="text-muted">Subject-wise Quiz</small>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ══════ Pre-test modal ══════ */}
      {showPreTest && selectedPaper && (() => {
        const { date, shift } = parseExamLabel(selectedPaper.year)
        const displayPaper    = formatDisplayPaper(selectedPaper.paper)
        const sc              = shiftColor(shift)
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={handleClosePreTest}
          >
            <div
              style={{ background: '#fff', borderRadius: 20, maxWidth: 560, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, padding: '22px 28px', color: '#fff' }}>
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-file-earmark-text-fill fs-2" />
                  <div className="flex-grow-1">
                    <h5 className="mb-0 fw-bold">{date}</h5>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      {shift && (
                        <span style={{ background: sc.bg, color: sc.text, borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px' }}>
                          {shift}
                        </span>
                      )}
                      <span style={{ opacity: 0.8, fontSize: '0.82rem' }}>{displayPaper}</span>
                    </div>
                  </div>
                  <button onClick={handleClosePreTest} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '4px 10px', cursor: 'pointer' }}>
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* Exam info grid */}
                <div className="row g-2 mb-4">
                  {[
                    { icon: 'bi-calendar3',       color: ACCENT,    label: 'Exam Date',        value: date },
                    { icon: 'bi-sun',             color: '#f59e0b', label: 'Shift',            value: shift || '—' },
                    { icon: 'bi-journal-text',    color: '#0d6efd', label: 'Paper',            value: displayPaper },
                    { icon: 'bi-question-circle', color: '#6610f2', label: 'Total Questions',  value: selectedPaper.totalQuestions ?? 90 },
                    { icon: 'bi-trophy',          color: '#ffc107', label: 'Total Marks',      value: selectedPaper.totalMarks ?? 360 },
                    { icon: 'bi-clock',           color: '#28a745', label: 'Duration',         value: '3 Hours' },
                  ].map(item => (
                    <div key={item.label} className="col-6">
                      <div className="d-flex align-items-start gap-2 p-2 rounded" style={{ background: '#f8f9fa', minHeight: 52 }}>
                        <i className={`bi ${item.icon} mt-1`} style={{ color: item.color, fontSize: '1rem', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.64rem', color: '#6c757d', lineHeight: 1.2 }}>{item.label}</div>
                          <div className="fw-semibold" style={{ fontSize: '0.82rem', lineHeight: 1.3 }}>{item.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subject distribution */}
                <h6 className="fw-bold mb-2" style={{ color: ACCENT_DARK }}>
                  <i className="bi bi-bar-chart-steps me-2" style={{ color: ACCENT }} />Subject Distribution
                </h6>
                <div className="mb-4">
                  {['Physics', 'Chemistry', 'Mathematics'].map(sub => {
                    const s    = SUBJECT_STYLE[sub]
                    const info = selectedPaper.subjects?.[sub] || { count: 30, totalMarks: 120 }
                    const total = selectedPaper.totalQuestions || 90
                    const barW = Math.round(((info.count || 30) / total) * 100)
                    return (
                      <div key={sub} className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold d-flex align-items-center gap-1">
                            <i className={`bi ${s.icon}`} style={{ color: s.color }} />{sub}
                          </span>
                          <div className="d-flex gap-2">
                            <span className="badge" style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, fontSize: '0.68rem' }}>{info.count ?? 30} Questions</span>
                            <span className="badge" style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, fontSize: '0.68rem' }}>{info.totalMarks ?? 120} Marks</span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: 6, background: '#e9ecef', borderRadius: 6 }}>
                          <div className="progress-bar" style={{ width: `${barW}%`, background: s.gradient, borderRadius: 6 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Instructions */}
                <div className="rounded p-3 mb-4" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                  <p className="mb-1 fw-semibold small">
                    <i className="bi bi-info-circle-fill me-1" style={{ color: '#f59e0b' }} />Instructions
                  </p>
                  <ul className="mb-0 ps-3" style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.8 }}>
                    <li>+4 marks for each correct answer</li>
                    <li>−1 mark for each wrong MCQ answer</li>
                    <li>0 marks for unattempted or wrong numeric</li>
                    <li>You can navigate freely between Physics, Chemistry and Mathematics</li>
                    <li>Do not switch browser tabs — violations are recorded</li>
                  </ul>
                </div>

                {/* Buttons */}
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary flex-fill" onClick={handleClosePreTest}>
                    Cancel
                  </button>
                  <button
                    className="btn flex-fill fw-bold text-white"
                    style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, border: 'none', borderRadius: 8 }}
                    onClick={handleStartTest}
                  >
                    <i className="bi bi-play-fill me-2" />Start Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </main>
  )
}

export default JEEMain
