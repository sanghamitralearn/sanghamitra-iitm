import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Real CAT format: VARC, DILR, QA — each a single fixed-length section (no
// adaptive modules, no essay), unlike GRE's 2-module-per-section structure.
const SECTIONS = [
  {
    id: 'varc',
    subject: 'Verbal Ability & Reading Comprehension',
    dbSubject: 'Verbal Ability & Reading Comprehension',
    label: 'VARC',
    icon: 'bi-chat-square-text-fill',
    gradient: 'linear-gradient(135deg, #e8590c, #ff922b)',
    badge: '#e8590c',
    description: 'Reading Comprehension passages, para-jumbles, vocabulary and critical reasoning — all MCQ, no TITA.',
    questionCount: 24,
    timeMin: 40,
  },
  {
    id: 'dilr',
    subject: 'Data Interpretation & Logical Reasoning',
    dbSubject: 'Data Interpretation & Logical Reasoning',
    label: 'DILR',
    icon: 'bi-diagram-3-fill',
    gradient: 'linear-gradient(135deg, #c92a2a, #ff6b6b)',
    badge: '#c92a2a',
    description: 'Data sets, charts, seating/arrangement puzzles and logical deduction — a mix of MCQ and TITA.',
    questionCount: 20,
    timeMin: 40,
  },
  {
    id: 'qa',
    subject: 'Quantitative Ability',
    dbSubject: 'Quantitative Ability',
    label: 'QA',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg, #f08c00, #ffd43b)',
    badge: '#f08c00',
    description: 'Arithmetic, Algebra, Geometry, Number Systems — a mix of MCQ and TITA (Type-In-The-Answer).',
    questionCount: 22,
    timeMin: 40,
  },
]

const CAT = () => {
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
      const res = await axios.get(`${API_URL}/api/cat_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (Array.isArray(res.data)) setScores(res.data)
    } catch { /* scores optional */ }
  }

  const getSectionStats = (section) => {
    const attempts = scores.filter(s => s.subject === section.dbSubject)
    if (!attempts.length) return null
    const latest = attempts[0]
    const pct = latest.maxScore > 0 ? Math.round(Math.max(0, latest.score / latest.maxScore) * 100) : 0
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

  const getLatestAttempt = (section) => {
    const attempts = scores.filter(s => s.subject === section.dbSubject)
    if (!attempts.length) return null
    return attempts[0]
  }

  // Combines the most-recent VARC+DILR+QA scores into a full-test-shaped result object.
  const getFullTestStats = () => {
    const bySubject = sub => scores.filter(s => s.subject === sub)
      .sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))

    const latestVarc = bySubject(SECTIONS[0].dbSubject)[0]
    const latestDilr = bySubject(SECTIONS[1].dbSubject)[0]
    const latestQa   = bySubject(SECTIONS[2].dbSubject)[0]
    if (!latestVarc || !latestDilr || !latestQa) return null

    const score       = latestVarc.score + latestDilr.score + latestQa.score
    const maxScore    = (latestVarc.maxScore || 0) + (latestDilr.maxScore || 0) + (latestQa.maxScore || 0)
    const correct     = (latestVarc.correctAnswers || 0) + (latestDilr.correctAnswers || 0) + (latestQa.correctAnswers || 0)
    const wrong       = (latestVarc.wrongAnswers || 0) + (latestDilr.wrongAnswers || 0) + (latestQa.wrongAnswers || 0)
    const unattempted = (latestVarc.unattempted || 0) + (latestDilr.unattempted || 0) + (latestQa.unattempted || 0)
    const total       = (latestVarc.totalQuestions || 0) + (latestDilr.totalQuestions || 0) + (latestQa.totalQuestions || 0)
    const pct         = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0

    const combinedResults = {
      testType: 'full', score, maxScore, correctAnswers: correct, wrongAnswers: wrong,
      unattempted, totalTimeTaken: 0, dateAttempted: latestVarc.dateAttempted,
      responses: [
        ...(latestVarc.responses || []).map(r => ({ ...r, subject: SECTIONS[0].dbSubject })),
        ...(latestDilr.responses || []).map(r => ({ ...r, subject: SECTIONS[1].dbSubject })),
        ...(latestQa.responses   || []).map(r => ({ ...r, subject: SECTIONS[2].dbSubject })),
      ],
      sectionScores: {
        [SECTIONS[0].dbSubject]: { score: latestVarc.score, maxScore: latestVarc.maxScore, correctAnswers: latestVarc.correctAnswers, wrongAnswers: latestVarc.wrongAnswers, unattempted: latestVarc.unattempted, totalQuestions: latestVarc.totalQuestions },
        [SECTIONS[1].dbSubject]: { score: latestDilr.score, maxScore: latestDilr.maxScore, correctAnswers: latestDilr.correctAnswers, wrongAnswers: latestDilr.wrongAnswers, unattempted: latestDilr.unattempted, totalQuestions: latestDilr.totalQuestions },
        [SECTIONS[2].dbSubject]: { score: latestQa.score, maxScore: latestQa.maxScore, correctAnswers: latestQa.correctAnswers, wrongAnswers: latestQa.wrongAnswers, unattempted: latestQa.unattempted, totalQuestions: latestQa.totalQuestions },
      },
    }

    return { pct, score, maxScore, correct, total, dateAttempted: latestVarc.dateAttempted, combinedResults }
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
                <h1>CAT Practice</h1>
                <p className="mb-0">
                  Real CAT (Common Admission Test) structure — VARC, DILR and Quantitative Ability, each a single
                  40-minute section. +3 for a correct MCQ, −1 for a wrong MCQ, +3/0 for TITA (no negative marking).
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">CAT</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {SECTIONS.map((section) => {
          const stats = getSectionStats(section)
          const latestAttempt = getLatestAttempt(section)
          const pct = stats?.percentage ?? 0

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
                        {section.questionCount} questions
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-clock me-1" />{section.timeMin} min
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>{section.description}</p>
                  </div>

                  {stats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold" style={{ background: section.gradient, fontSize: '1rem' }}>
                        {stats.score}/{stats.maxScore}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
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

                <div className="d-flex flex-column gap-2 mt-3">
                  <Link to={`/courses/cat/quiz/${section.id}/1`} className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : 'Start Practice'}
                  </Link>
                  {stats && latestAttempt && (
                    <Link to="/courses/cat/analysis"
                      state={{ results: { ...latestAttempt, testType: 'module', subject: section.subject }, questions: [] }}
                      className="btn btn-outline-secondary btn-sm w-100" style={{ borderRadius: 10 }}>
                      <i className="bi bi-bar-chart-line me-1" />View Analysis
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Full CAT Test — VARC + DILR + QA back-to-back, fixed order */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #e8590c, #c92a2a)'
          const fullStats = getFullTestStats()
          const fullPct = fullStats?.pct ?? 0

          let progressBarColor = '#e8590c'
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
                      <h4 className="mb-0">Full CAT Test</h4>
                      <span className="badge text-white" style={{ background: '#e8590c', fontSize: '0.75rem' }}>66 questions</span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>3 sections</span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete CAT experience — VARC, DILR then Quantitative Ability, 40 minutes each, run strictly
                      in order with no going back. One combined score report at the end.
                    </p>
                  </div>

                  {fullStats && (
                    <div className="text-center flex-shrink-0">
                      <span className="d-block px-3 py-1 rounded-pill text-white fw-bold" style={{ background: FULL_GRADIENT, fontSize: '1rem' }}>
                        {fullStats.score}/{fullStats.maxScore}
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
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
                  <Link to="/courses/cat/full-test" className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full CAT Test'}
                  </Link>
                  {fullStats && (
                    <Link to="/courses/cat/analysis" state={{ results: fullStats.combinedResults, questions: [] }}
                      className="btn btn-outline-secondary btn-sm w-100" style={{ borderRadius: 10 }}>
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
            { icon: 'bi-plus-circle-fill', color: '#e8590c', label: '+3 / −1',   desc: 'per correct/wrong MCQ (TITA: +3 / 0, no penalty)' },
            { icon: 'bi-lock-fill',        color: '#c92a2a', label: 'No going back', desc: 'sections run VARC → DILR → QA, strictly in order' },
            { icon: 'bi-stopwatch-fill',   color: '#f08c00', label: '120 min total', desc: '40 minutes per section' },
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

export default CAT
