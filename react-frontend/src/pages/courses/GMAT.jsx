import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official GMAT Focus Edition structure — one continuous, question-adaptive
// section per subject (no Module 1/2 split like GRE).
const SECTIONS = [
  {
    id: 'quant',
    subject: 'Quantitative Reasoning',
    dbSubject: 'Quantitative Reasoning',
    label: 'Quantitative Reasoning',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg, #0d6efd, #4dabf7)',
    badge: '#0d6efd',
    description: 'Problem Solving across arithmetic, algebra and geometry — evaluates basic mathematical skills and quantitative reasoning.',
    totalQuestions: 21,
    modules: [
      { number: 1, questionCount: 21, timeMin: 45, description: 'One continuous, question-adaptive section covering all Quant domains.' },
    ],
  },
  {
    id: 'verbal',
    subject: 'Verbal Reasoning',
    dbSubject: 'Verbal Reasoning',
    label: 'Verbal Reasoning',
    icon: 'bi-chat-square-text-fill',
    gradient: 'linear-gradient(135deg, #6610f2, #a370f7)',
    badge: '#6610f2',
    description: 'Reading Comprehension and Critical Reasoning — evaluates ability to analyze and evaluate written arguments and passages.',
    totalQuestions: 23,
    modules: [
      { number: 1, questionCount: 23, timeMin: 45, description: 'One continuous, question-adaptive section covering Reading Comprehension and Critical Reasoning.' },
    ],
  },
  {
    id: 'dataInsights',
    subject: 'Data Insights',
    dbSubject: 'Data Insights',
    label: 'Data Insights',
    icon: 'bi-bar-chart-steps',
    gradient: 'linear-gradient(135deg, #fd7e14, #ffb26b)',
    badge: '#fd7e14',
    description: 'Data Sufficiency, Table Analysis, Graphics Interpretation, Multi-Source Reasoning & Two-Part Analysis — evaluates data literacy and integrated reasoning.',
    totalQuestions: 20,
    modules: [
      { number: 1, questionCount: 20, timeMin: 45, description: 'One continuous, question-adaptive section covering all Data Insights question formats.' },
    ],
  },
]

const GMAT = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        fetchScores(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchScores = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/api/gmat_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (Array.isArray(res.data)) setScores(res.data)
    } catch { /* scores optional */ }
  }

  const getSectionStats = (section) => {
    const attempts = scores.filter(s => s.subject === section.dbSubject)
    if (!attempts.length) return null
    const latest = attempts[0]
    const pct = latest.maxScore > 0 ? Math.round((latest.score / latest.maxScore) * 100) : 0
    return {
      score: latest.score,
      maxScore: latest.maxScore,
      percentage: pct,
      correctAnswers: latest.correctAnswers,
      totalQuestions: latest.totalQuestions,
      scaledScore: latest.scaledScore ?? null,
      attemptCount: attempts.length,
      timestamp: latest.dateAttempted,
    }
  }

  const getLatestAttempt = (section) => {
    const attempts = scores.filter(s => s.subject === section.dbSubject)
    if (!attempts.length) return null
    return attempts[0]
  }

  // Combines the most-recent PAIRED Quant+Verbal+Data Insights scores into a full-test result object.
  const getFullTestStats = () => {
    const [quantSection, verbalSection, diSection] = SECTIONS

    const allQuant  = scores.filter(s => s.subject === quantSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allVerbal = scores.filter(s => s.subject === verbalSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allDI     = scores.filter(s => s.subject === diSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))

    const pairCount = Math.min(allQuant.length, allVerbal.length, allDI.length)
    if (pairCount === 0) return null

    const quantLatest  = allQuant[pairCount - 1]
    const verbalLatest = allVerbal[pairCount - 1]
    const diLatest     = allDI[pairCount - 1]

    const score       = quantLatest.score + verbalLatest.score + diLatest.score
    const maxScore    = (quantLatest.maxScore || 0) + (verbalLatest.maxScore || 0) + (diLatest.maxScore || 0)
    const correct     = (quantLatest.correctAnswers || 0) + (verbalLatest.correctAnswers || 0) + (diLatest.correctAnswers || 0)
    const wrong       = (quantLatest.wrongAnswers || 0) + (verbalLatest.wrongAnswers || 0) + (diLatest.wrongAnswers || 0)
    const unattempted = (quantLatest.unattempted || 0) + (verbalLatest.unattempted || 0) + (diLatest.unattempted || 0)
    const total       = (quantLatest.totalQuestions || 0) + (verbalLatest.totalQuestions || 0) + (diLatest.totalQuestions || 0)
    const pct         = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0

    const combinedResults = {
      testType:       'full',
      score,
      maxScore,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      unattempted,
      totalTimeTaken: 0,
      dateAttempted:  quantLatest.dateAttempted,
      responses: [
        ...(quantLatest.responses  || []).map(r => ({ ...r, subject: 'Quantitative Reasoning' })),
        ...(verbalLatest.responses || []).map(r => ({ ...r, subject: 'Verbal Reasoning' })),
        ...(diLatest.responses     || []).map(r => ({ ...r, subject: 'Data Insights' })),
      ],
      sectionScores: {
        'Quantitative Reasoning': {
          score: quantLatest.score, maxScore: quantLatest.maxScore,
          correctAnswers: quantLatest.correctAnswers, wrongAnswers: quantLatest.wrongAnswers,
          unattempted: quantLatest.unattempted, totalQuestions: quantLatest.totalQuestions,
          scaledScore: quantLatest.scaledScore ?? null,
        },
        'Verbal Reasoning': {
          score: verbalLatest.score, maxScore: verbalLatest.maxScore,
          correctAnswers: verbalLatest.correctAnswers, wrongAnswers: verbalLatest.wrongAnswers,
          unattempted: verbalLatest.unattempted, totalQuestions: verbalLatest.totalQuestions,
          scaledScore: verbalLatest.scaledScore ?? null,
        },
        'Data Insights': {
          score: diLatest.score, maxScore: diLatest.maxScore,
          correctAnswers: diLatest.correctAnswers, wrongAnswers: diLatest.wrongAnswers,
          unattempted: diLatest.unattempted, totalQuestions: diLatest.totalQuestions,
          scaledScore: diLatest.scaledScore ?? null,
        },
      },
    }

    return {
      pct, score, maxScore, correct, total,
      dateAttempted: quantLatest.dateAttempted,
      scaledQuant:  quantLatest.scaledScore ?? null,
      scaledVerbal: verbalLatest.scaledScore ?? null,
      scaledDI:     diLatest.scaledScore ?? null,
      combinedResults,
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  )

  return (
    <main className="main">
      {/* Hero */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>GMAT Practice</h1>
                <p className="mb-0">
                  Official GMAT Focus Edition structure — Quantitative Reasoning, Verbal Reasoning and Data Insights,
                  each a single question-adaptive section. Scaled score 60–90 per section, 205–805 total.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">GMAT</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {SECTIONS.map((section) => {
          const stats         = getSectionStats(section)
          const latestAttempt = getLatestAttempt(section)
          const pct           = stats?.percentage ?? 0

          let progressBarColor = section.badge
          if (pct >= 80)      progressBarColor = '#28a745'
          else if (pct >= 60) progressBarColor = '#17a2b8'
          else if (pct >= 40) progressBarColor = '#ffc107'
          else if (pct > 0)   progressBarColor = '#dc3545'

          return (
            <div key={section.id} className="card border-0 shadow-sm mb-4" style={{ borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ height: 6, background: section.gradient }} />

              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: section.gradient }}>
                    <i className={`bi ${section.icon} fs-4`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">{section.label}</h4>
                      <span className="badge text-white" style={{ background: section.badge, fontSize: '0.75rem' }}>
                        {section.totalQuestions} questions
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        45 min
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      {section.description}
                    </p>
                  </div>

                  {stats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: section.gradient, fontSize: '1rem' }}>
                        {stats.scaledScore ?? `${pct}%`}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        {stats.scaledScore ? 'Scaled / 90' : `Best: ${stats.score}/${stats.maxScore}`}
                      </small>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        {new Date(stats.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {stats.attemptCount > 1 && <> · <strong>{stats.attemptCount} attempts</strong></>}
                      </small>
                    </div>
                  )}
                </div>

                {stats && (
                  <div className="mb-3">
                    <div className="progress" style={{ height: 5, backgroundColor: '#f0f0f0' }}>
                      <div className="progress-bar" style={{ width: `${pct}%`, background: progressBarColor }} />
                    </div>
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                      Last attempt: {stats.correctAnswers}/{stats.totalQuestions} correct
                    </small>
                  </div>
                )}

                <div className="row g-3 mt-1">
                  {section.modules.map((mod) => {
                    const isAttempted = stats != null
                    return (
                      <div className="col-md-6" key={mod.number}>
                        <div className="card border h-100"
                          style={{ borderRadius: 14, borderColor: '#e8ecf0', transition: 'box-shadow 0.2s ease' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                          <div style={{ height: 4, background: section.gradient, borderRadius: '14px 14px 0 0' }} />
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="fw-bold mb-0">
                                  <span className="badge me-2" style={{ background: section.gradient, color: '#fff', fontSize: '0.7rem' }}>
                                    SECTION
                                  </span>
                                </h6>
                                <div className="d-flex gap-2 mt-1 flex-wrap">
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                                    <i className="bi bi-question-circle me-1" />{mod.questionCount} questions
                                  </span>
                                  <span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>
                                    <i className="bi bi-clock me-1" />{mod.timeMin} min
                                  </span>
                                </div>
                              </div>
                              {isAttempted && (
                                <span className="badge text-white" style={{ background: section.gradient, fontSize: '0.8rem' }}>
                                  {stats.scaledScore ?? `${pct}%`}
                                </span>
                              )}
                            </div>

                            <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {mod.description}
                            </p>

                            <Link
                              to={`/courses/gmat/quiz/${section.id}/${mod.number}`}
                              className="btn btn-sm text-white w-100"
                              style={{ background: section.gradient, borderRadius: 8, padding: '0.4rem 1rem' }}>
                              {isAttempted ? (
                                <><i className="bi bi-arrow-clockwise me-1" />Retry Section</>
                              ) : (
                                <><i className="bi bi-play-fill me-1" />Start Section</>
                              )}
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="d-flex flex-column gap-2 mt-3">
                  <Link
                    to={`/courses/gmat/quiz/${section.id}/1`}
                    className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : 'Start Practice'}
                  </Link>
                  {stats && latestAttempt && (
                    <Link
                      to="/courses/gmat/analysis"
                      state={{ results: { ...latestAttempt, testType: 'module', subject: section.subject }, questions: [] }}
                      className="btn btn-outline-secondary btn-sm w-100"
                      style={{ borderRadius: 10 }}>
                      <i className="bi bi-bar-chart-line me-1" />View Analysis
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Full GMAT Test — combined Quant + Verbal + Data Insights, all 3 sections back-to-back */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #00897b, #154360)'
          const fullStats = getFullTestStats()
          const fullPct   = fullStats?.pct ?? 0

          let progressBarColor = '#0d6efd'
          if (fullPct >= 80)      progressBarColor = '#28a745'
          else if (fullPct >= 60) progressBarColor = '#17a2b8'
          else if (fullPct >= 40) progressBarColor = '#ffc107'
          else if (fullPct > 0)   progressBarColor = '#dc3545'

          const totalScaled = fullStats?.scaledQuant != null && fullStats?.scaledVerbal != null && fullStats?.scaledDI != null
            ? 205 + Math.round((((fullStats.scaledQuant - 60) + (fullStats.scaledVerbal - 60) + (fullStats.scaledDI - 60)) / 90) * 600)
            : null

          return (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ height: 6, background: FULL_GRADIENT }} />
              <div className="card-body p-4">

                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: FULL_GRADIENT }}>
                    <i className="bi bi-stopwatch-fill fs-4" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">Full GMAT Test</h4>
                      <span className="badge text-white" style={{ background: '#0d6efd', fontSize: '0.75rem' }}>
                        64 questions
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        3 sections
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete GMAT Focus Edition experience — Quantitative Reasoning, Verbal Reasoning and Data
                      Insights, back-to-back. Get one combined score report on the official 205–805 scale.
                    </p>
                  </div>

                  {fullStats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: FULL_GRADIENT, fontSize: '1rem' }}>
                        {totalScaled != null ? `${totalScaled}/805` : `${fullPct}%`}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Q: {fullStats.scaledQuant ?? '—'} · V: {fullStats.scaledVerbal ?? '—'} · DI: {fullStats.scaledDI ?? '—'}
                      </small>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        {new Date(fullStats.dateAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </small>
                    </div>
                  )}
                </div>

                {fullStats && (
                  <div className="mb-3">
                    <div className="progress" style={{ height: 5, backgroundColor: '#f0f0f0' }}>
                      <div className="progress-bar" style={{ width: `${fullPct}%`, background: progressBarColor }} />
                    </div>
                    <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                      Last attempt: {fullStats.correct}/{fullStats.total} correct
                    </small>
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  <Link
                    to="/courses/gmat/full-test"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full GMAT Test'}
                  </Link>
                  {fullStats && (
                    <Link
                      to="/courses/gmat/analysis"
                      state={{ results: fullStats.combinedResults, questions: [] }}
                      className="btn btn-outline-secondary btn-sm w-100"
                      style={{ borderRadius: 10 }}>
                      <i className="bi bi-bar-chart-line me-1" />View Analysis
                    </Link>
                  )}
                </div>

              </div>
            </div>
          )
        })()}

        {/* Info strip */}
        <div className="row g-3 mt-2">
          {[
            { icon: 'bi-graph-up-arrow',    color: '#00897b', label: '60–90',    desc: 'scaled score per section (Quant / Verbal / Data Insights)' },
            { icon: 'bi-dash-circle-fill',  color: '#6c757d', label: '0 marks',  desc: 'for wrong answers — no penalty' },
            { icon: 'bi-collection',        color: '#0d6efd', label: '3 Sections', desc: 'one continuous, question-adaptive section each' },
          ].map((item) => (
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
    </main>
  )
}

export default GMAT
