import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official (current, shortened) GRE General Test structure
const SECTIONS = [
  {
    id: 'verbal',
    subject: 'Verbal Reasoning',
    dbSubject: 'Verbal Reasoning',
    label: 'Verbal Reasoning',
    icon: 'bi-chat-square-text-fill',
    gradient: 'linear-gradient(135deg, #6f42c1, #a370f7)',
    badge: '#6f42c1',
    description: 'Reading Comprehension, Text Completion & Sentence Equivalence — evaluates ability to analyze and evaluate written material.',
    totalQuestions: 24,
    modules: [
      { number: 1, questionCount: 12, timeMin: 18, description: 'First module — adaptive difficulty based on score unlocks Module 2.' },
      { number: 2, questionCount: 12, timeMin: 18, description: 'Second module — questions calibrated to your Module 1 performance.' },
    ],
  },
  {
    id: 'quant',
    subject: 'Quantitative Reasoning',
    dbSubject: 'Quantitative Reasoning',
    label: 'Quantitative Reasoning',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg, #0d6efd, #4dabf7)',
    badge: '#0d6efd',
    description: 'Arithmetic, Algebra, Geometry and Data Analysis — evaluates basic mathematical skills and quantitative reasoning.',
    totalQuestions: 27,
    modules: [
      { number: 1, questionCount: 12, timeMin: 21, description: 'First module — covers all Quant domains at baseline difficulty.' },
      { number: 2, questionCount: 15, timeMin: 26, description: 'Second module — advanced problems calibrated to your Module 1 performance.' },
    ],
  },
]

const AWA_SECTION = {
  id: 'awa',
  subject: 'Analytical Writing',
  dbSubject: 'Analytical Writing',
  label: 'Analytical Writing',
  icon: 'bi-pencil-square',
  gradient: 'linear-gradient(135deg, #d63384, #f783ac)',
  badge: '#d63384',
  description: '"Analyze an Issue" task — evaluates critical thinking and analytical writing skills. Scored 0-6 by human/AI review (not auto-graded).',
  timeMin: 30,
}

const GRE = () => {
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
      const res = await axios.get(`${API_URL}/api/gre_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
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

  const getAwaStats = () => {
    const attempts = scores.filter(s => s.subject === AWA_SECTION.dbSubject)
    if (!attempts.length) return null
    const latest = attempts[0]
    return {
      essayStatus: latest.essayStatus || 'pending_review',
      attemptCount: attempts.length,
      timestamp: latest.dateAttempted,
    }
  }

  // Combines the most-recent PAIRED Verbal+Quant scores into a full-test result object.
  const getFullTestStats = () => {
    const verbalSection = SECTIONS[0]
    const quantSection  = SECTIONS[1]

    const allVerbal = scores.filter(s => s.subject === verbalSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allQuant = scores.filter(s => s.subject === quantSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))

    const pairCount = Math.min(allVerbal.length, allQuant.length)
    if (pairCount === 0) return null

    const verbalLatest = allVerbal[pairCount - 1]
    const quantLatest  = allQuant[pairCount - 1]
    const awa           = getAwaStats()

    const score       = verbalLatest.score + quantLatest.score
    const maxScore    = (verbalLatest.maxScore || 0) + (quantLatest.maxScore || 0)
    const correct     = (verbalLatest.correctAnswers || 0) + (quantLatest.correctAnswers || 0)
    const wrong       = (verbalLatest.wrongAnswers || 0) + (quantLatest.wrongAnswers || 0)
    const unattempted = (verbalLatest.unattempted || 0) + (quantLatest.unattempted || 0)
    const total       = (verbalLatest.totalQuestions || 0) + (quantLatest.totalQuestions || 0)
    const pct         = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0

    const combinedResults = {
      testType:       'full',
      score,
      maxScore,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      unattempted,
      totalTimeTaken: 0,
      dateAttempted:  verbalLatest.dateAttempted,
      responses: [
        ...(verbalLatest.responses || []).map(r => ({ ...r, subject: 'Verbal Reasoning' })),
        ...(quantLatest.responses  || []).map(r => ({ ...r, subject: 'Quantitative Reasoning' })),
      ],
      sectionScores: {
        'Verbal Reasoning': {
          score: verbalLatest.score, maxScore: verbalLatest.maxScore,
          correctAnswers: verbalLatest.correctAnswers, wrongAnswers: verbalLatest.wrongAnswers,
          unattempted: verbalLatest.unattempted, totalQuestions: verbalLatest.totalQuestions,
          scaledScore: verbalLatest.scaledScore ?? null,
        },
        'Quantitative Reasoning': {
          score: quantLatest.score, maxScore: quantLatest.maxScore,
          correctAnswers: quantLatest.correctAnswers, wrongAnswers: quantLatest.wrongAnswers,
          unattempted: quantLatest.unattempted, totalQuestions: quantLatest.totalQuestions,
          scaledScore: quantLatest.scaledScore ?? null,
        },
      },
      essayStatus: awa?.essayStatus ?? null,
    }

    return {
      pct, score, maxScore, correct, total,
      dateAttempted: verbalLatest.dateAttempted,
      scaledVerbal: verbalLatest.scaledScore ?? null,
      scaledQuant:  quantLatest.scaledScore ?? null,
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
                <h1>GRE Practice</h1>
                <p className="mb-0">
                  Official GRE General Test structure — Verbal Reasoning, Quantitative Reasoning (each with 2 adaptive
                  modules) and Analytical Writing. Scaled score 130–170 per section.
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
                        {section.totalQuestions} questions total
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        {section.modules.length} modules
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
                        {stats.scaledScore ? 'Scaled / 170' : `Best: ${stats.score}/${stats.maxScore}`}
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
                                    MODULE {mod.number}
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
                              {isAttempted && mod.number === 1 && (
                                <span className="badge text-white" style={{ background: section.gradient, fontSize: '0.8rem' }}>
                                  {stats.scaledScore ?? `${pct}%`}
                                </span>
                              )}
                            </div>

                            <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {mod.description}
                            </p>

                            <Link
                              to={`/courses/gre/quiz/${section.id}/${mod.number}`}
                              className="btn btn-sm text-white w-100"
                              style={{ background: section.gradient, borderRadius: 8, padding: '0.4rem 1rem' }}>
                              {isAttempted && mod.number === 1 ? (
                                <><i className="bi bi-arrow-clockwise me-1" />Retry Module {mod.number}</>
                              ) : (
                                <><i className="bi bi-play-fill me-1" />Start Module {mod.number}</>
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
                    to={`/courses/gre/quiz/${section.id}/1`}
                    className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : 'Start Practice'}
                  </Link>
                  {stats && latestAttempt && (
                    <Link
                      to="/courses/gre/analysis"
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

        {/* Analytical Writing — single essay task, no adaptive modules */}
        {(() => {
          const awa = getAwaStats()
          return (
            <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ height: 6, background: AWA_SECTION.gradient }} />
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: AWA_SECTION.gradient }}>
                    <i className={`bi ${AWA_SECTION.icon} fs-4`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">{AWA_SECTION.label}</h4>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-clock me-1" />{AWA_SECTION.timeMin} min
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      {AWA_SECTION.description}
                    </p>
                  </div>
                  {awa && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: AWA_SECTION.gradient, fontSize: '0.85rem' }}>
                        Pending Review
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        {new Date(awa.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {awa.attemptCount > 1 && <> · <strong>{awa.attemptCount} attempts</strong></>}
                      </small>
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  <Link
                    to="/courses/gre/quiz/awa/1"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: AWA_SECTION.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${awa ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {awa ? 'Reattempt Essay' : 'Start Analytical Writing'}
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Full GRE Test — combined Verbal + Quant, all 4 modules back-to-back, + AWA essay */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #6f42c1, #0d6efd)'
          const fullStats = getFullTestStats()
          const fullPct   = fullStats?.pct ?? 0

          let progressBarColor = '#0d6efd'
          if (fullPct >= 80)      progressBarColor = '#28a745'
          else if (fullPct >= 60) progressBarColor = '#17a2b8'
          else if (fullPct >= 40) progressBarColor = '#ffc107'
          else if (fullPct > 0)   progressBarColor = '#dc3545'

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
                      <h4 className="mb-0">Full GRE Test</h4>
                      <span className="badge text-white" style={{ background: '#0d6efd', fontSize: '0.75rem' }}>
                        51 questions + essay
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        5 modules
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete GRE General Test experience — Verbal Reasoning Module 1 &amp; 2, Quantitative Reasoning
                      Module 1 &amp; 2, then the Analytical Writing task. Get one combined score report.
                    </p>
                  </div>

                  {fullStats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: FULL_GRADIENT, fontSize: '1rem' }}>
                        {fullStats.scaledVerbal && fullStats.scaledQuant
                          ? `${fullStats.scaledVerbal + fullStats.scaledQuant}/340`
                          : `${fullPct}%`}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        V: {fullStats.scaledVerbal ?? '—'} · Q: {fullStats.scaledQuant ?? '—'}
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
                    to="/courses/gre/full-test"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full GRE Test'}
                  </Link>
                  {fullStats && (
                    <Link
                      to="/courses/gre/analysis"
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
            { icon: 'bi-graph-up-arrow',    color: '#6f42c1', label: '130–170',   desc: 'scaled score per section (Verbal / Quant)' },
            { icon: 'bi-dash-circle-fill',  color: '#6c757d', label: '0 marks',   desc: 'for wrong answers — no penalty' },
            { icon: 'bi-arrow-repeat',      color: '#0d6efd', label: '2 Modules', desc: 'per section, adaptive difficulty' },
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

export default GRE
