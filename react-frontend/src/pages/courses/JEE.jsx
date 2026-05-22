import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SUBJECTS = [
  {
    id: 'physics',
    subject: 'Physics',
    displayName: 'Physics',
    description: 'Mechanics, Electrostatics, Optics, Modern Physics, Thermodynamics and more',
    icon: 'bi-lightning-charge-fill',
    color: '#0d6efd',
    gradient: 'linear-gradient(135deg, #0d6efd, #6610f2)',
    url: '/courses/jee/quiz/Physics',
  },
  {
    id: 'chemistry',
    subject: 'Chemistry',
    displayName: 'Chemistry',
    description: 'Physical, Organic and Inorganic Chemistry — ionic equilibrium, reactions, compounds',
    icon: 'bi-eyedropper',
    color: '#198754',
    gradient: 'linear-gradient(135deg, #198754, #20c997)',
    url: '/courses/jee/quiz/Chemistry',
  },
  {
    id: 'mathematics',
    subject: 'Mathematics',
    displayName: 'Mathematics',
    description: 'Calculus, Algebra, Coordinate Geometry, Vectors, Trigonometry and more',
    icon: 'bi-calculator-fill',
    color: '#dc3545',
    gradient: 'linear-gradient(135deg, #dc3545, #fd7e14)',
    url: '/courses/jee/quiz/Mathematics',
  },
]

const JEE = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
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
      const res = await axios.get(`${API_URL}/api/jee_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (Array.isArray(res.data)) setScores(res.data)
    } catch { /* scores optional */ }
  }

  // Latest attempt stats per subject
  const getSubjectStats = (subject) => {
    const attempts = scores.filter(s => s.subject === subject)
    if (!attempts.length) return null
    const latest = attempts[0] // already sorted by dateAttempted desc
    const pct = latest.maxScore > 0
      ? Math.round((latest.score / latest.maxScore) * 100)
      : 0
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
                <h1>JEE Advanced Practice</h1>
                <p className="mb-0">
                  Subject-wise quizzes from JEE Advanced 2024 &amp; 2025 — Physics, Chemistry, Mathematics.
                  Full JEE marking scheme (+3 / −1 for MCQ).
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">JEE Advanced</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Subject cards */}
      <div className="container mb-5">
        <div className="course-list" style={{ maxWidth: 900, margin: '0 auto', padding: '0 15px' }}>
          {SUBJECTS.map((sub) => {
            const stats = getSubjectStats(sub.subject)
            const score = stats?.percentage ?? 0
            const isAttempted = stats != null

            let progressBarColor = '#0d6efd'
            if (score >= 80) progressBarColor = '#28a745'
            else if (score >= 60) progressBarColor = '#17a2b8'
            else if (score >= 40) progressBarColor = '#ffc107'
            else if (score > 0)  progressBarColor = '#dc3545'

            return (
              <div className="course-item mb-4" key={sub.id}>
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ borderRadius: 16, transition: 'all 0.3s ease', overflow: 'hidden' }}
                >
                  {/* Coloured top bar */}
                  <div style={{ height: 6, background: sub.gradient }} />

                  <div className="card-body p-4">
                    <div className="row align-items-center">
                      {/* Icon */}
                      <div className="col-lg-1 col-md-2 text-center mb-3 mb-md-0">
                        <div
                          className="text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 52, height: 52, background: sub.gradient, margin: '0 auto' }}
                        >
                          <i className={`bi ${isAttempted ? 'bi-check-circle-fill' : sub.icon} fs-4`} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="col-lg-6 col-md-5 mb-3 mb-md-0">
                        <h4 className="mb-1">{sub.displayName}</h4>
                        <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>{sub.description}</p>

                        {/* Progress bar */}
                        <div className="progress mb-1" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ width: `${isAttempted ? score : 0}%`, background: progressBarColor }}
                          />
                        </div>

                        {stats
                          ? <small className="text-muted">
                              Last attempt: {new Date(stats.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {stats.attemptCount > 1 && ` · ${stats.attemptCount} attempts`}
                            </small>
                          : <small className="text-muted">Not attempted yet</small>
                        }
                      </div>

                      {/* Score badge */}
                      <div className="col-lg-2 col-md-2 text-center mb-3 mb-md-0">
                        <span
                          className="d-inline-block px-3 py-1 rounded-pill text-white fw-bold"
                          style={{ background: sub.gradient, fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        >
                          {isAttempted ? `${score}%` : '—'}
                        </span>
                        {stats && (
                          <div className="mt-1">
                            <small className="text-muted d-block">
                              Score: {stats.score}/{stats.maxScore}
                            </small>
                            <small className="text-muted d-block">
                              {stats.correctAnswers}/{stats.totalQuestions} correct
                            </small>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="col-lg-3 col-md-3 text-end">
                        <Link
                          to={sub.url}
                          className="btn btn-sm text-white"
                          style={{ background: sub.gradient, minWidth: 130, borderRadius: 8, padding: '0.45rem 1.1rem' }}
                        >
                          {isAttempted ? (
                            <><i className="bi bi-arrow-clockwise me-1" />Retry Quiz</>
                          ) : (
                            <><i className="bi bi-play-fill me-1" />Start Quiz</>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info strip */}
        <div className="row g-3 mt-2" style={{ maxWidth: 900, margin: '0 auto' }}>
          {[
            { icon: 'bi-check-circle-fill', color: '#28a745', label: '+3 marks', desc: 'for each correct answer' },
            { icon: 'bi-x-circle-fill', color: '#dc3545', label: '−1 mark', desc: 'for each wrong MCQ answer' },
            { icon: 'bi-dash-circle-fill', color: '#6c757d', label: '0 marks', desc: 'for unattempted questions' },
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

export default JEE
