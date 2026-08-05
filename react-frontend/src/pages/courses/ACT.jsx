import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official classic ACT structure — one continuous section per subject
// (no Module 1/2 split like GRE).
const SECTIONS = [
  {
    id: 'english',
    subject: 'English',
    dbSubject: 'English',
    label: 'English',
    icon: 'bi-pencil-square',
    gradient: 'linear-gradient(135deg, #0d6efd, #4dabf7)',
    badge: '#0d6efd',
    description: 'Usage/Mechanics, Rhetorical Skills and Sentence Structure — evaluates grammar, punctuation, and effective writing.',
    totalQuestions: 75,
    modules: [
      { number: 1, questionCount: 75, timeMin: 45, description: 'One continuous section covering all English usage and rhetorical skills.' },
    ],
  },
  {
    id: 'math',
    subject: 'Mathematics',
    dbSubject: 'Mathematics',
    label: 'Mathematics',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg, #6610f2, #a370f7)',
    badge: '#6610f2',
    description: 'Pre-Algebra, Elementary & Intermediate Algebra, Plane & Coordinate Geometry and Trigonometry — evaluates mathematical skills through problem solving.',
    totalQuestions: 60,
    modules: [
      { number: 1, questionCount: 60, timeMin: 60, description: 'One continuous section covering all Mathematics domains.' },
    ],
  },
  {
    id: 'reading',
    subject: 'Reading',
    dbSubject: 'Reading',
    label: 'Reading',
    icon: 'bi-book-half',
    gradient: 'linear-gradient(135deg, #fd7e14, #ffb26b)',
    badge: '#fd7e14',
    description: 'Literary Narrative, Social Science, Humanities and Natural Science passages — evaluates reading comprehension and referring/reasoning skills.',
    totalQuestions: 40,
    modules: [
      { number: 1, questionCount: 40, timeMin: 35, description: 'One continuous section covering all four passage types.' },
    ],
  },
  {
    id: 'science',
    subject: 'Science',
    dbSubject: 'Science',
    label: 'Science',
    icon: 'bi-flask-fill',
    gradient: 'linear-gradient(135deg, #198754, #63d3a6)',
    badge: '#198754',
    description: 'Data Representation, Research Summaries and Conflicting Viewpoints — evaluates interpretation, analysis, and problem-solving skills in science.',
    totalQuestions: 40,
    modules: [
      { number: 1, questionCount: 40, timeMin: 35, description: 'One continuous section covering all Science reasoning formats.' },
    ],
  },
]

const ACT = () => {
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
      const res = await axios.get(`${API_URL}/api/act_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
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

  // Combines the most-recent PAIRED English+Mathematics+Reading+Science scores into a full-test result object.
  const getFullTestStats = () => {
    const [englishSection, mathSection, readingSection, scienceSection] = SECTIONS

    const allEnglish = scores.filter(s => s.subject === englishSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allMath    = scores.filter(s => s.subject === mathSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allReading = scores.filter(s => s.subject === readingSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))
    const allScience = scores.filter(s => s.subject === scienceSection.dbSubject)
      .sort((a, b) => new Date(a.dateAttempted) - new Date(b.dateAttempted))

    const pairCount = Math.min(allEnglish.length, allMath.length, allReading.length, allScience.length)
    if (pairCount === 0) return null

    const englishLatest = allEnglish[pairCount - 1]
    const mathLatest    = allMath[pairCount - 1]
    const readingLatest = allReading[pairCount - 1]
    const scienceLatest = allScience[pairCount - 1]

    const score       = englishLatest.score + mathLatest.score + readingLatest.score + scienceLatest.score
    const maxScore    = (englishLatest.maxScore || 0) + (mathLatest.maxScore || 0) + (readingLatest.maxScore || 0) + (scienceLatest.maxScore || 0)
    const correct     = (englishLatest.correctAnswers || 0) + (mathLatest.correctAnswers || 0) + (readingLatest.correctAnswers || 0) + (scienceLatest.correctAnswers || 0)
    const wrong       = (englishLatest.wrongAnswers || 0) + (mathLatest.wrongAnswers || 0) + (readingLatest.wrongAnswers || 0) + (scienceLatest.wrongAnswers || 0)
    const unattempted = (englishLatest.unattempted || 0) + (mathLatest.unattempted || 0) + (readingLatest.unattempted || 0) + (scienceLatest.unattempted || 0)
    const total       = (englishLatest.totalQuestions || 0) + (mathLatest.totalQuestions || 0) + (readingLatest.totalQuestions || 0) + (scienceLatest.totalQuestions || 0)
    const pct         = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0

    const combinedResults = {
      testType:       'full',
      score,
      maxScore,
      correctAnswers: correct,
      wrongAnswers:   wrong,
      unattempted,
      totalTimeTaken: 0,
      dateAttempted:  englishLatest.dateAttempted,
      responses: [
        ...(englishLatest.responses || []).map(r => ({ ...r, subject: 'English' })),
        ...(mathLatest.responses    || []).map(r => ({ ...r, subject: 'Mathematics' })),
        ...(readingLatest.responses || []).map(r => ({ ...r, subject: 'Reading' })),
        ...(scienceLatest.responses || []).map(r => ({ ...r, subject: 'Science' })),
      ],
      sectionScores: {
        'English': {
          score: englishLatest.score, maxScore: englishLatest.maxScore,
          correctAnswers: englishLatest.correctAnswers, wrongAnswers: englishLatest.wrongAnswers,
          unattempted: englishLatest.unattempted, totalQuestions: englishLatest.totalQuestions,
          scaledScore: englishLatest.scaledScore ?? null,
        },
        'Mathematics': {
          score: mathLatest.score, maxScore: mathLatest.maxScore,
          correctAnswers: mathLatest.correctAnswers, wrongAnswers: mathLatest.wrongAnswers,
          unattempted: mathLatest.unattempted, totalQuestions: mathLatest.totalQuestions,
          scaledScore: mathLatest.scaledScore ?? null,
        },
        'Reading': {
          score: readingLatest.score, maxScore: readingLatest.maxScore,
          correctAnswers: readingLatest.correctAnswers, wrongAnswers: readingLatest.wrongAnswers,
          unattempted: readingLatest.unattempted, totalQuestions: readingLatest.totalQuestions,
          scaledScore: readingLatest.scaledScore ?? null,
        },
        'Science': {
          score: scienceLatest.score, maxScore: scienceLatest.maxScore,
          correctAnswers: scienceLatest.correctAnswers, wrongAnswers: scienceLatest.wrongAnswers,
          unattempted: scienceLatest.unattempted, totalQuestions: scienceLatest.totalQuestions,
          scaledScore: scienceLatest.scaledScore ?? null,
        },
      },
    }

    return {
      pct, score, maxScore, correct, total,
      dateAttempted: englishLatest.dateAttempted,
      scaledEnglish: englishLatest.scaledScore ?? null,
      scaledMath:    mathLatest.scaledScore ?? null,
      scaledReading: readingLatest.scaledScore ?? null,
      scaledScience: scienceLatest.scaledScore ?? null,
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
                <h1>ACT Practice</h1>
                <p className="mb-0">
                  Classic ACT structure — English, Mathematics, Reading and Science,
                  each a single continuous section. Scaled score 1–36 per section, composite 1–36.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">ACT</li>
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
                        {section.modules[0].timeMin} min
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
                        {stats.scaledScore ? 'Scaled / 36' : `Best: ${stats.score}/${stats.maxScore}`}
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
                              to={`/courses/act/quiz/${section.id}/${mod.number}`}
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
                    to={`/courses/act/quiz/${section.id}/1`}
                    className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : 'Start Practice'}
                  </Link>
                  {stats && latestAttempt && (
                    <Link
                      to="/courses/act/analysis"
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

        {/* Full ACT Test — combined English + Mathematics + Reading + Science, all 4 sections back-to-back */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #b71c1c, #1a1a2e)'
          const fullStats = getFullTestStats()
          const fullPct   = fullStats?.pct ?? 0

          let progressBarColor = '#0d6efd'
          if (fullPct >= 80)      progressBarColor = '#28a745'
          else if (fullPct >= 60) progressBarColor = '#17a2b8'
          else if (fullPct >= 40) progressBarColor = '#ffc107'
          else if (fullPct > 0)   progressBarColor = '#dc3545'

          const totalScaled = fullStats?.scaledEnglish != null && fullStats?.scaledMath != null
            && fullStats?.scaledReading != null && fullStats?.scaledScience != null
            ? Math.round((fullStats.scaledEnglish + fullStats.scaledMath + fullStats.scaledReading + fullStats.scaledScience) / 4)
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
                      <h4 className="mb-0">Full ACT Test</h4>
                      <span className="badge text-white" style={{ background: '#0d6efd', fontSize: '0.75rem' }}>
                        215 questions
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        4 sections
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete classic ACT experience — English, Mathematics, Reading and Science,
                      back-to-back. Get one combined score report on the official 1–36 composite scale.
                    </p>
                  </div>

                  {fullStats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: FULL_GRADIENT, fontSize: '1rem' }}>
                        {totalScaled != null ? `${totalScaled}/36` : `${fullPct}%`}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        E: {fullStats.scaledEnglish ?? '—'} · M: {fullStats.scaledMath ?? '—'} · R: {fullStats.scaledReading ?? '—'} · S: {fullStats.scaledScience ?? '—'}
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
                    to="/courses/act/full-test"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full ACT Test'}
                  </Link>
                  {fullStats && (
                    <Link
                      to="/courses/act/analysis"
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
            { icon: 'bi-graph-up-arrow',    color: '#b71c1c', label: '1–36',       desc: 'scaled score per section (English / Math / Reading / Science)' },
            { icon: 'bi-dash-circle-fill',  color: '#6c757d', label: '0 marks',   desc: 'for wrong answers — no penalty' },
            { icon: 'bi-collection',        color: '#0d6efd', label: '4 Sections', desc: 'one continuous section each' },
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

export default ACT
