import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official Digital SAT structure
const SECTIONS = [
  {
    id: 'rw',
    subject: 'Reading & Writing',
    dbSubject: 'Reading and Writing',
    label: 'Reading & Writing',
    icon: 'bi-book-fill',
    gradient: 'linear-gradient(135deg, #198754, #20c997)',
    badge: '#198754',
    description: 'Evidence-Based Reading & Writing — Information & Ideas, Craft & Structure, Cross-Text Connections, Standard English Conventions.',
    totalQuestions: 54,
    modules: [
      { number: 1, questionCount: 27, timeMin: 32, description: 'First module — adaptive difficulty based on score unlocks Module 2.' },
      { number: 2, questionCount: 27, timeMin: 32, description: 'Second module — questions calibrated to your Module 1 performance.' },
    ],
  },
  {
    id: 'math',
    subject: 'Mathematics',
    dbSubject: 'Mathematics',
    label: 'Mathematics',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg, #003D8F, #0d6efd)',
    badge: '#003D8F',
    description: 'Algebra, Advanced Math, Problem Solving & Data Analysis, Geometry and Trigonometry.',
    totalQuestions: 44,
    modules: [
      { number: 1, questionCount: 22, timeMin: 35, description: 'First module — covers all Math domains at baseline difficulty.' },
      { number: 2, questionCount: 22, timeMin: 35, description: 'Second module — advanced problems calibrated to your Module 1 performance.' },
    ],
  },
]

const SAT = () => {
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
      const res = await axios.get(`${API_URL}/api/sat_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (Array.isArray(res.data)) setScores(res.data)
    } catch { /* scores optional */ }
  }

  // Returns computed stats for the score badge / progress bar
  const getSectionStats = (section) => {
    const attempts = scores.filter(s =>
      s.subject === section.subject || s.subject === section.dbSubject
    )
    if (!attempts.length) return null
    const latest = attempts[0]
    const pct = latest.maxScore > 0 ? Math.round((latest.score / latest.maxScore) * 100) : 0
    return {
      score: latest.score,
      maxScore: latest.maxScore,
      percentage: pct,
      correctAnswers: latest.correctAnswers,
      totalQuestions: latest.totalQuestions,
      attemptCount: attempts.length,
      timestamp: latest.dateAttempted,
    }
  }

  // Returns the full latest attempt object (for "View Analysis")
  const getLatestAttempt = (section) => {
    const attempts = scores.filter(s =>
      s.subject === section.subject || s.subject === section.dbSubject
    )
    if (!attempts.length) return null
    return attempts[0]
  }

  // Combines the most-recent PAIRED RW+Math scores into a full-test result object.
  // Uses index pairing (oldest RW with oldest Math, etc.) so module-quiz-only scores
  // don't get mixed with full-test scores.
  const getFullTestStats = () => {
    const rwSection   = SECTIONS[0]
    const mathSection = SECTIONS[1]

    // Collect all scores for each section (both & and and spellings)
    const allRW   = scores.filter(s => s.subject === rwSection.subject   || s.subject === rwSection.dbSubject)
                          .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allMath = scores.filter(s => s.subject === mathSection.subject || s.subject === mathSection.dbSubject)
                          .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))

    const pairCount = Math.min(allRW.length, allMath.length)
    if (pairCount === 0) return null

    // Latest paired attempt = last index in the sorted (oldest-first) arrays
    const rwLatest   = allRW[pairCount - 1]
    const mathLatest = allMath[pairCount - 1]

    const score       = rwLatest.score + mathLatest.score
    const maxScore    = (rwLatest.maxScore || 0) + (mathLatest.maxScore || 0)
    const correct     = (rwLatest.correctAnswers || 0) + (mathLatest.correctAnswers || 0)
    const wrong       = (rwLatest.wrongAnswers || 0) + (mathLatest.wrongAnswers || 0)
    const unattempted = (rwLatest.unattempted || 0) + (mathLatest.unattempted || 0)
    const total       = (rwLatest.totalQuestions || 0) + (mathLatest.totalQuestions || 0)
    const pct         = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0

    const combinedResults = {
      testType:       'full',
      score,
      maxScore,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      unattempted,
      totalTimeTaken: 0,
      dateAttempted:  rwLatest.dateAttempted,
      responses: [
        ...(rwLatest.responses   || []).map(r => ({ ...r, subject: 'Reading & Writing' })),
        ...(mathLatest.responses || []).map(r => ({ ...r, subject: 'Mathematics' })),
      ],
      sectionScores: {
        'Reading & Writing': {
          score: rwLatest.score, maxScore: rwLatest.maxScore,
          correctAnswers: rwLatest.correctAnswers, wrongAnswers: rwLatest.wrongAnswers,
          unattempted: rwLatest.unattempted, totalQuestions: rwLatest.totalQuestions,
        },
        'Mathematics': {
          score: mathLatest.score, maxScore: mathLatest.maxScore,
          correctAnswers: mathLatest.correctAnswers, wrongAnswers: mathLatest.wrongAnswers,
          unattempted: mathLatest.unattempted, totalQuestions: mathLatest.totalQuestions,
        },
      },
    }

    return { pct, score, maxScore, correct, total, dateAttempted: rwLatest.dateAttempted, combinedResults }
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
                <h1>SAT Practice</h1>
                <p className="mb-0">
                  Official Digital SAT structure — Reading &amp; Writing and Mathematics, each with 2 adaptive modules.
                  SAT marking: +1 correct, 0 wrong (no negative marking).
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">SAT</li>
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
              {/* Section header bar */}
              <div style={{ height: 6, background: section.gradient }} />

              <div className="card-body p-4">
                {/* Section title row */}
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

                  {/* Score badge + View Analysis */}
                  {stats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: section.gradient, fontSize: '1rem' }}>
                        {pct}%
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Best: {stats.score}/{stats.maxScore}
                      </small>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        {new Date(stats.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {stats.attemptCount > 1 && <> · <strong>{stats.attemptCount} attempts</strong></>}
                      </small>
                    </div>
                  )}
                </div>

                {/* Progress bar (if attempted) */}
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

                {/* Module cards */}
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
                                  {pct}%
                                </span>
                              )}
                            </div>

                            <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {mod.description}
                            </p>

                            {/* Action button */}
                            <Link
                              to={`/courses/sat/quiz/${section.id}/${mod.number}`}
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

                {/* Section-level action buttons (Reattempt + View Analysis) */}
                <div className="d-flex flex-column gap-2 mt-3">
                  <Link
                    to={`/courses/sat/quiz/${section.id}/1`}
                    className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : 'Start Practice'}
                  </Link>
                  {stats && latestAttempt && (
                    <Link
                      to="/courses/sat/analysis"
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

        {/* Full SAT Test — combined RW + Math, all 4 modules back-to-back */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #198754, #0d6efd)'
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

                {/* Header row */}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: FULL_GRADIENT }}>
                    <i className="bi bi-stopwatch-fill fs-4" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">Full SAT Test</h4>
                      <span className="badge text-white" style={{ background: '#0d6efd', fontSize: '0.75rem' }}>
                        98 questions total
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        4 modules
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete Digital SAT experience — Reading &amp; Writing Module 1 &amp; 2, then Mathematics Module 1 &amp; 2,
                      back-to-back. Get one combined score report covering both sections.
                    </p>
                  </div>

                  {/* Score badge (when attempted) */}
                  {fullStats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: FULL_GRADIENT, fontSize: '1rem' }}>
                        {fullPct}%
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Best: {fullStats.score}/{fullStats.maxScore}
                      </small>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        {new Date(fullStats.dateAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </small>
                    </div>
                  )}
                </div>

                {/* Progress bar + last attempt summary */}
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

                {/* Action buttons */}
                <div className="d-flex flex-column gap-2">
                  <Link
                    to="/courses/sat/full-test"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full SAT Test'}
                  </Link>
                  {fullStats && (
                    <Link
                      to="/courses/sat/analysis"
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
            { icon: 'bi-check-circle-fill', color: '#28a745', label: '+1 mark',   desc: 'for each correct answer' },
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

export default SAT
