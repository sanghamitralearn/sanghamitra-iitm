import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official Digital SAT structure
const SECTIONS = [
  {
    id: 'rw',
    subject: 'Reading & Writing',
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

  const getSectionStats = (subject) => {
    const attempts = scores.filter(s => s.subject === subject)
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
          const stats = getSectionStats(section.subject)
          const pct = stats?.percentage ?? 0

          return (
            <div
              key={section.id}
              className="card border-0 shadow-sm mb-4"
              style={{ borderRadius: 18, overflow: 'hidden' }}
            >
              {/* Section header bar */}
              <div style={{ height: 6, background: section.gradient }} />

              <div className="card-body p-4">
                {/* Section title row */}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 52, height: 52, background: section.gradient }}
                  >
                    <i className={`bi ${section.icon} fs-4`} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0">{section.label}</h4>
                      <span
                        className="badge text-white"
                        style={{ background: section.badge, fontSize: '0.75rem' }}
                      >
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

                  {/* Overall score badge */}
                  {stats && (
                    <div className="text-center flex-shrink-0">
                      <span
                        className="d-block px-3 py-1 rounded-pill text-white fw-bold"
                        style={{ background: section.gradient, fontSize: '1rem' }}
                      >
                        {pct}%
                      </span>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        Best: {stats.score}/{stats.maxScore}
                      </small>
                    </div>
                  )}
                </div>

                {/* Module cards */}
                <div className="row g-3 mt-1">
                  {section.modules.map((mod) => {
                    const isAttempted = stats != null

                    let barColor = section.badge
                    if (pct >= 80) barColor = '#28a745'
                    else if (pct >= 60) barColor = '#17a2b8'
                    else if (pct >= 40) barColor = '#ffc107'
                    else if (pct > 0)  barColor = '#dc3545'

                    return (
                      <div className="col-md-6" key={mod.number}>
                        <div
                          className="card border h-100"
                          style={{
                            borderRadius: 14,
                            borderColor: '#e8ecf0',
                            transition: 'box-shadow 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div style={{ height: 4, background: section.gradient, borderRadius: '14px 14px 0 0' }} />
                          <div className="card-body p-3">
                            {/* Module header */}
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="fw-bold mb-0">
                                  <span
                                    className="badge me-2"
                                    style={{ background: section.gradient, color: '#fff', fontSize: '0.7rem' }}
                                  >
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
                                <span
                                  className="badge text-white"
                                  style={{ background: section.gradient, fontSize: '0.8rem' }}
                                >
                                  {pct}%
                                </span>
                              )}
                            </div>

                            <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                              {mod.description}
                            </p>

                            {/* Progress bar (show on Module 1 if attempted) */}
                            {isAttempted && mod.number === 1 && (
                              <>
                                <div className="progress mb-1" style={{ height: 5, backgroundColor: '#f0f0f0' }}>
                                  <div
                                    className="progress-bar"
                                    style={{ width: `${pct}%`, background: barColor }}
                                  />
                                </div>
                                <small className="text-muted d-block mb-2" style={{ fontSize: '0.75rem' }}>
                                  Last attempt: {stats.correctAnswers}/{stats.totalQuestions} correct
                                  {stats.attemptCount > 1 && ` · ${stats.attemptCount} attempts`}
                                </small>
                              </>
                            )}

                            {/* Action button */}
                            <Link
                              to={`/courses/sat/quiz/${section.id}/${mod.number}`}
                              className="btn btn-sm text-white w-100"
                              style={{ background: section.gradient, borderRadius: 8, padding: '0.4rem 1rem' }}
                            >
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
              </div>
            </div>
          )
        })}

        {/* Full SAT Test — combined RW + Math, all 4 modules back-to-back */}
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <div style={{ height: 6, background: 'linear-gradient(135deg, #198754, #0d6efd)' }} />
          <div className="card-body p-4">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div
                className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #198754, #0d6efd)' }}
              >
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
              <Link
                to="/courses/sat/full-test"
                className="btn text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #198754, #0d6efd)', borderRadius: 8, padding: '0.6rem 1.5rem' }}
              >
                <i className="bi bi-play-fill me-1" />Start Full SAT Test
              </Link>
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="row g-3 mt-2">
          {[
            { icon: 'bi-check-circle-fill', color: '#28a745', label: '+1 mark', desc: 'for each correct answer' },
            { icon: 'bi-dash-circle-fill', color: '#6c757d', label: '0 marks', desc: 'for wrong answers — no penalty' },
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
