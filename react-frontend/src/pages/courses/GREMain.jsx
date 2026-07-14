import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { STAGES } from './GREFullTest'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const ACCENT      = '#8a63d2'
const ACCENT_DARK = '#3c2a5e'

const SECTION_STYLE = {
  'Verbal Reasoning': {
    color: '#6f42c1', gradient: 'linear-gradient(135deg,#6f42c1,#a370f7)',
    icon: 'bi-chat-square-text-fill', short: 'Verbal',
  },
  'Quantitative Reasoning': {
    color: '#0d6efd', gradient: 'linear-gradient(135deg,#0d6efd,#4dabf7)',
    icon: 'bi-calculator-fill', short: 'Quant',
  },
}

// A full-test attempt only ever draws the fixed question set defined by GREFullTest's
// STAGES (currently 51: 24 Verbal + 27 Quant) — NOT the whole question bank, which
// /api/gre_papers aggregates over (and can be far larger, e.g. 100). +1 mark per
// question, no negative marking, so marks == question count.
const FULL_TEST_SECTION_COUNTS = STAGES.reduce((acc, s) => {
  acc[s.subject] = (acc[s.subject] || 0) + s.questionCount
  return acc
}, {})
const FULL_TEST_TOTAL_QUESTIONS = STAGES.reduce((sum, s) => sum + s.questionCount, 0)

// Extract 4-digit year for grouping; fall back to paper name itself
function extractGroupYear(year, paper) {
  if (year && !isNaN(Number(year))) return String(year)
  if (paper) {
    const m = String(paper).match(/\d{4}/)
    if (m) return m[0]
  }
  return 'Full Tests'
}

function groupByYear(papers) {
  return papers.reduce((acc, p) => {
    const key = extractGroupYear(p.year, p.paper)
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})
}

const GREMain = () => {
  const navigate = useNavigate()

  const [loading, setLoading]           = useState(true)
  const [papers, setPapers]             = useState([])
  const [myAttempts, setMyAttempts]     = useState([])
  const [subjectScores, setSubjectScores] = useState([])
  const [apiError, setApiError]         = useState(null)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [showPreTest, setShowPreTest]   = useState(false)
  const [userEmail, setUserEmail]       = useState(null)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUserEmail(res.data.email)
        await Promise.all([fetchPapers(), fetchMyAttempts(res.data.email), fetchSubjectScores(res.data.email)])
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
      const res = await axios.get(`${API_URL}/api/gre_papers`, { withCredentials: true })
      if (Array.isArray(res.data)) {
        setPapers(res.data)
        setApiError(null)
      } else {
        setApiError('Unexpected response from server.')
      }
    } catch (err) {
      setApiError(err?.response?.data?.error || err.message || 'Failed to load papers')
    }
  }

  const fetchMyAttempts = async (email) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/gre_full_scores?email=${encodeURIComponent(email)}`,
        { withCredentials: true }
      )
      if (Array.isArray(res.data)) setMyAttempts(res.data)
    } catch { /* optional */ }
  }

  // Per-subject (Verbal/Quant) scores always save independently of the combined
  // full-paper record, so they're a more reliable signal of "did they finish a
  // full test" — used as a fallback below if the full-paper save ever fails.
  const fetchSubjectScores = async (email) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/gre_scores?email=${encodeURIComponent(email)}`,
        { withCredentials: true }
      )
      if (Array.isArray(res.data)) setSubjectScores(res.data)
    } catch { /* optional */ }
  }

  // Builds a full-test-shaped result by pairing the latest Verbal + Quant
  // per-subject scores — mirrors GRE.jsx's getFullTestStats(). Used when no
  // gre_full_scores record exists yet for this paper (there's currently only
  // one paper in the system, so this pairing is unambiguous).
  const getSyntheticFullAttempt = () => {
    const bySubject = sub => subjectScores
      .filter(s => s.subject === sub)
      .sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
    const v = bySubject('Verbal Reasoning')[0]
    const q = bySubject('Quantitative Reasoning')[0]
    if (!v || !q) return null
    return {
      testType: 'full',
      score: (v.score || 0) + (q.score || 0),
      maxScore: (v.maxScore || 0) + (q.maxScore || 0),
      correctAnswers: (v.correctAnswers || 0) + (q.correctAnswers || 0),
      wrongAnswers: (v.wrongAnswers || 0) + (q.wrongAnswers || 0),
      unattempted: (v.unattempted || 0) + (q.unattempted || 0),
      totalQuestions: (v.totalQuestions || 0) + (q.totalQuestions || 0),
      dateAttempted: v.dateAttempted,
      responses: [
        ...(v.responses || []).map(r => ({ ...r, subject: 'Verbal Reasoning' })),
        ...(q.responses || []).map(r => ({ ...r, subject: 'Quantitative Reasoning' })),
      ],
      sectionScores: {
        'Verbal Reasoning': {
          score: v.score, maxScore: v.maxScore, correctAnswers: v.correctAnswers,
          wrongAnswers: v.wrongAnswers, unattempted: v.unattempted, totalQuestions: v.totalQuestions,
          scaledScore: v.scaledScore ?? null,
        },
        'Quantitative Reasoning': {
          score: q.score, maxScore: q.maxScore, correctAnswers: q.correctAnswers,
          wrongAnswers: q.wrongAnswers, unattempted: q.unattempted, totalQuestions: q.totalQuestions,
          scaledScore: q.scaledScore ?? null,
        },
      },
    }
  }

  const getMyAttempt = (paper) =>
    myAttempts.find(a => a.paper === paper) || getSyntheticFullAttempt()

  const getAttemptCount = (paper) => {
    const real = myAttempts.filter(a => a.paper === paper).length
    return real > 0 ? real : (getSyntheticFullAttempt() ? 1 : 0)
  }

  const handleOpenPreTest  = (p) => { setSelectedPaper(p); setShowPreTest(true) }
  const handleClosePreTest = () => { setShowPreTest(false); setSelectedPaper(null) }

  const handleStartTest = () => {
    if (!selectedPaper) return
    navigate('/courses/gre/full-test', {
      state: { paper: selectedPaper.paper, year: selectedPaper.year, paperMeta: selectedPaper }
    })
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" style={{ color: ACCENT }} role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )

  const grouped    = groupByYear(papers)
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <main className="main">
      {/* ── Hero ── */}
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>GRE</h1>
                <p className="mb-0">
                  Full-length GRE papers with the official section structure.
                  Select a paper to attempt Verbal Reasoning and Quantitative Reasoning together and get a detailed analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">GRE</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5 mt-4">

        {/* ── API error banner ── */}
        {apiError && (
          <div className="alert d-flex align-items-center gap-2 mb-3"
            style={{ borderRadius: 12, background: '#fff3cd', border: '1px solid #ffc107' }}>
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5" />
            <div className="flex-grow-1">
              <strong>Could not load papers:</strong> {apiError}
              <div className="small text-muted mt-1">
                Make sure the server is running, then{' '}
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
              Papers appear automatically once GRE questions are added to the database.<br />
              <small>
                <button className="btn btn-sm btn-link p-0" onClick={fetchPapers}>Retry</button>
              </small>
            </p>
          </div>
        ) : papers.length > 0 && (
          <>
            {sortedKeys.map(yearKey => (
              <div key={yearKey} className="mb-5">
                {/* Year / category header */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-calendar3" style={{ color: ACCENT, fontSize: '1.1rem' }} />
                  <h5 className="mb-0 fw-bold" style={{ color: ACCENT_DARK }}>{yearKey}</h5>
                  <span className="badge ms-1" style={{ background: ACCENT, color: '#fff', fontSize: '0.72rem' }}>
                    {grouped[yearKey].length} paper{grouped[yearKey].length !== 1 ? 's' : ''}
                  </span>
                </div>

                {grouped[yearKey].map((p, idx) => {
                  const attempt      = getMyAttempt(p.paper)
                  const attemptCount = getAttemptCount(p.paper)
                  const pct          = attempt
                    ? Math.round(Math.max(0, attempt.score / attempt.maxScore) * 100)
                    : null

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
                      <div style={{ height: 5, background: `linear-gradient(90deg,${ACCENT},${ACCENT_DARK})` }} />

                      <div className="card-body p-4">
                        <div className="row align-items-center g-3">

                          {/* ── Left: paper name + section pills ── */}
                          <div className="col-lg-6">
                            <div className="d-flex align-items-start gap-3">
                              <div style={{
                                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                                background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <i className="bi bi-file-earmark-text-fill text-white" style={{ fontSize: '1.4rem' }} />
                              </div>

                              <div>
                                <h5 className="mb-1 fw-bold" style={{ color: ACCENT_DARK, fontSize: '1.05rem' }}>
                                  {p.paper || 'GRE Practice Test'}
                                </h5>
                                <p className="mb-0 text-muted small">GRE Full-Length Paper</p>
                              </div>
                            </div>
                          </div>

                          {/* ── Centre: counts + score ── */}
                          <div className="col-lg-3">
                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="p-2 rounded text-center"
                                  style={{ background: '#f0fff4', border: '1px solid #c3e6cb' }}>
                                  <div className="fw-bold fs-5" style={{ color: '#28a745' }}>{FULL_TEST_TOTAL_QUESTIONS}</div>
                                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>Questions</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="p-2 rounded text-center"
                                  style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
                                  <div className="fw-bold fs-5" style={{ color: '#856404' }}>{FULL_TEST_TOTAL_QUESTIONS}</div>
                                  <div className="text-muted" style={{ fontSize: '0.68rem' }}>Max Marks</div>
                                </div>
                              </div>
                            </div>

                            <div className="progress mb-2" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${pct ?? 0}%`, background: progressBarColor }}
                              />
                            </div>

                            <div className="text-center">
                              <span
                                className="d-inline-block px-3 py-1 rounded-pill text-white fw-bold mb-1"
                                style={{
                                  background: `linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`,
                                  fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}
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
                            {attempt ? (
                              <Link
                                to="/courses/gre/analysis"
                                state={{ results: { ...attempt, testType: 'full' }, questions: null }}
                                className="btn btn-outline-secondary btn-sm"
                                style={{ borderRadius: 10, minWidth: 150 }}
                              >
                                <i className="bi bi-bar-chart-line me-1" />View Analysis
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                style={{ borderRadius: 10, minWidth: 150 }}
                                disabled
                                title="Attempt this test to view its analysis"
                              >
                                <i className="bi bi-bar-chart-line me-1" />View Analysis
                              </button>
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

        {/* ── Info strip ── */}
        <div className="row g-3 mt-2">
          {[
            { icon: 'bi-graph-up-arrow',    color: '#6f42c1', label: '130–170',      desc: 'scaled score per section (Verbal / Quant)' },
            { icon: 'bi-dash-circle-fill',  color: '#6c757d', label: '0 marks',      desc: 'for wrong answers — no penalty' },
            { icon: 'bi-clock-fill',        color: '#0d6efd', label: '~1h 23m total', desc: 'Verbal + Quant' },
          ].map(item => (
            <div className="col-md-4" key={item.label}>
              <div className="card border-0 shadow-sm text-center py-3" style={{ borderRadius: 12 }}>
                <i className={`bi ${item.icon} mb-1`} style={{ fontSize: '1.5rem', color: item.color }} />
                <div className="fw-bold">{item.label}</div>
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ══════ Pre-test modal ══════ */}
      {showPreTest && selectedPaper && (
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
                  <h5 className="mb-0 fw-bold">{selectedPaper.paper || 'GRE Practice Test'}</h5>
                  <div className="mt-1" style={{ opacity: 0.85, fontSize: '0.82rem' }}>GRE Full-Length Paper</div>
                </div>
                <button onClick={handleClosePreTest}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', padding: '4px 10px', cursor: 'pointer' }}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Exam info grid */}
              <div className="row g-2 mb-4">
                {[
                  { icon: 'bi-journal-text',    color: ACCENT,    label: 'Paper',           value: selectedPaper.paper || 'GRE Practice Test' },
                  { icon: 'bi-question-circle', color: '#6610f2', label: 'Total Questions', value: FULL_TEST_TOTAL_QUESTIONS },
                  { icon: 'bi-trophy',          color: '#ffc107', label: 'Total Marks',     value: FULL_TEST_TOTAL_QUESTIONS },
                  { icon: 'bi-clock',           color: '#28a745', label: 'Duration',        value: '~1h 23m' },
                  { icon: 'bi-check2-circle',   color: '#198754', label: 'Correct Answer',  value: '+1 mark' },
                  { icon: 'bi-dash-circle',     color: '#6c757d', label: 'Wrong Answer',    value: '0 (no penalty)' },
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

              {/* Section distribution */}
              <h6 className="fw-bold mb-2" style={{ color: ACCENT_DARK }}>
                <i className="bi bi-bar-chart-steps me-2" style={{ color: ACCENT }} />Section Distribution
              </h6>
              <div className="mb-4">
                {Object.entries(SECTION_STYLE).map(([sec, s]) => {
                  const count = FULL_TEST_SECTION_COUNTS[sec] || 0
                  const barW  = Math.round((count / FULL_TEST_TOTAL_QUESTIONS) * 100)
                  return (
                    <div key={sec} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold d-flex align-items-center gap-1">
                          <i className={`bi ${s.icon}`} style={{ color: s.color }} />{sec}
                        </span>
                        <div className="d-flex gap-2">
                          <span className="badge"
                            style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, fontSize: '0.68rem' }}>
                            {count} Questions
                          </span>
                          <span className="badge"
                            style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}44`, fontSize: '0.68rem' }}>
                            {count} Marks
                          </span>
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
                  <li>+1 mark for each correct MCQ answer, 0 for wrong or unattempted — no negative marking</li>
                  <li>Verbal &amp; Quantitative sections report a scaled score from 130–170</li>
                  <li>You can navigate freely between sections within the time allotted</li>
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
      )}
    </main>
  )
}

export default GREMain
