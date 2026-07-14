import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// GATE DA (Data Science & Artificial Intelligence) structure — 6 subjects.
// Each subject is one continuous practice set using every question available
// for it (question counts are fetched live, not hardcoded).
const SECTIONS = [
  {
    id: 'ga',
    subject: 'General Aptitude',
    label: 'General Aptitude',
    icon: 'bi-lightbulb-fill',
    gradient: 'linear-gradient(135deg,#fd7e14,#ffc107)',
    badge: '#fd7e14',
    description: 'Verbal ability, quantitative aptitude, analytical reasoning, and spatial reasoning — common across all GATE papers.',
  },
  {
    id: 'math',
    subject: 'Engineering Mathematics',
    label: 'Engineering Mathematics',
    icon: 'bi-calculator-fill',
    gradient: 'linear-gradient(135deg,#0d6efd,#4dabf7)',
    badge: '#0d6efd',
    description: 'Linear algebra, probability & statistics, calculus, and optimization — the mathematical foundation for DA/AI.',
  },
  {
    id: 'prog',
    subject: 'Programming & Data Structures',
    label: 'Programming & DS',
    icon: 'bi-code-slash',
    gradient: 'linear-gradient(135deg,#6610f2,#8540f5)',
    badge: '#6610f2',
    description: 'Programming in Python, basic data structures (stacks, queues, trees, graphs) and their applications.',
  },
  {
    id: 'dbms',
    subject: 'Database Management & Warehousing',
    label: 'DBMS & Warehousing',
    icon: 'bi-database-fill',
    gradient: 'linear-gradient(135deg,#20c997,#0dcaf0)',
    badge: '#20c997',
    description: 'ER-models, relational algebra, SQL, normalization, and data warehousing / ETL concepts.',
  },
  {
    id: 'ml',
    subject: 'Machine Learning',
    label: 'Machine Learning',
    icon: 'bi-cpu-fill',
    gradient: 'linear-gradient(135deg,#d63384,#f783ac)',
    badge: '#d63384',
    description: 'Supervised & unsupervised learning, regression, classification, evaluation metrics, and model selection.',
  },
  {
    id: 'ai',
    subject: 'Artificial Intelligence',
    label: 'Artificial Intelligence',
    icon: 'bi-robot',
    gradient: 'linear-gradient(135deg,#198754,#20c997)',
    badge: '#198754',
    description: 'Search, knowledge representation, reasoning under uncertainty, and the fundamentals of intelligent agents.',
  },
]

const GATEDA = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])
  const [questionCounts, setQuestionCounts] = useState({})

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        fetchScores(res.data.email)
        fetchQuestionCounts()
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
      const res = await axios.get(`${API_URL}/api/gate_da_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (Array.isArray(res.data)) setScores(res.data)
    } catch { /* scores optional */ }
  }

  // Live per-subject question counts, so the cards never show a stale number
  const fetchQuestionCounts = async () => {
    try {
      const responses = await Promise.all(
        SECTIONS.map(sec =>
          axios.get(`${API_URL}/api/gate_da_questions?subject=${encodeURIComponent(sec.subject)}`, { withCredentials: true })
        )
      )
      const counts = {}
      SECTIONS.forEach((sec, i) => { counts[sec.subject] = Array.isArray(responses[i].data) ? responses[i].data.length : 0 })
      setQuestionCounts(counts)
    } catch { /* counts optional — cards fall back to 0 */ }
  }

  // Returns computed stats for the score badge / progress bar
  const getSectionStats = (section) => {
    const attempts = scores.filter(s => s.subject === section.subject)
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

  // Returns the full latest attempt object (for "View Analysis")
  const getLatestAttempt = (section) => {
    const attempts = scores.filter(s => s.subject === section.subject)
    if (!attempts.length) return null
    return attempts[0]
  }

  // Combines the most-recent attempt of EACH of the 6 subjects into one
  // full-test summary. Unlike SAT's strict index-pairing across exactly 2
  // sections, here we simply take each subject's latest attempt (if any)
  // and sum whatever is available — simpler and works fine for 6 subjects.
  const getFullTestStats = () => {
    const latestPerSection = SECTIONS
      .map(sec => scores.filter(s => s.subject === sec.subject)
        .sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))[0])
      .filter(Boolean)

    if (!latestPerSection.length) return null

    const score       = latestPerSection.reduce((s, a) => s + (a.score || 0), 0)
    const maxScore     = latestPerSection.reduce((s, a) => s + (a.maxScore || 0), 0)
    const correct      = latestPerSection.reduce((s, a) => s + (a.correctAnswers || 0), 0)
    const wrong        = latestPerSection.reduce((s, a) => s + (a.wrongAnswers || 0), 0)
    const unattempted  = latestPerSection.reduce((s, a) => s + (a.unattempted || 0), 0)
    const total        = latestPerSection.reduce((s, a) => s + (a.totalQuestions || 0), 0)
    const pct          = maxScore > 0 ? Math.round(Math.max(0, score) / maxScore * 100) : 0
    const mostRecent   = latestPerSection.reduce((latest, a) =>
      new Date(a.dateAttempted) > new Date(latest.dateAttempted) ? a : latest, latestPerSection[0])

    const sectionScores = {}
    SECTIONS.forEach(sec => {
      const a = latestPerSection.find(x => x.subject === sec.subject)
      if (a) {
        sectionScores[sec.subject] = {
          score: a.score, maxScore: a.maxScore,
          correctAnswers: a.correctAnswers, wrongAnswers: a.wrongAnswers,
          unattempted: a.unattempted, totalQuestions: a.totalQuestions,
        }
      }
    })

    const combinedResults = {
      testType: 'full',
      score,
      maxScore,
      correctAnswers: correct,
      wrongAnswers: wrong,
      unattempted,
      totalTimeTaken: 0,
      dateAttempted: mostRecent.dateAttempted,
      responses: latestPerSection.flatMap(a =>
        (a.responses || []).map(r => ({ ...r, subject: a.subject }))
      ),
      sectionScores,
    }

    return { pct, score, maxScore, correct, total, dateAttempted: mostRecent.dateAttempted, combinedResults }
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
                <h1>GATE DA Practice</h1>
                <p className="mb-0">
                  GATE Data Science &amp; Artificial Intelligence — 6 subjects, every question available for practice.
                  Real negative marking applies for wrong MCQ answers.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">GATE DA</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {SECTIONS.map((section) => {
          const stats         = getSectionStats(section)
          const latestAttempt = getLatestAttempt(section)
          const pct           = stats?.percentage ?? 0
          const questionCount = questionCounts[section.subject] ?? 0

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
                        {questionCount} question{questionCount === 1 ? '' : 's'} total
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

                {/* Section-level action buttons (Reattempt + View Analysis) */}
                <div className="d-flex flex-column gap-2 mt-3">
                  <Link
                    to={`/courses/gate-da/quiz/${section.id}/1`}
                    className="btn fw-semibold text-white w-100"
                    style={{ background: section.gradient, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${stats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {stats ? 'Reattempt' : `Start Practice — All ${questionCount} Questions`}
                  </Link>
                  {stats && latestAttempt && (
                    <Link
                      to="/courses/gate-da/analysis"
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

        {/* Full GATE DA Test — combined all 6 subjects, every question, back-to-back */}
        {(() => {
          const FULL_GRADIENT = 'linear-gradient(135deg, #198754, #0d6efd)'
          const fullStats = getFullTestStats()
          const fullPct   = fullStats?.pct ?? 0
          const fullTotalQuestions = Object.values(questionCounts).reduce((s, n) => s + n, 0)

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
                      <h4 className="mb-0">Full GATE DA Test</h4>
                      <span className="badge text-white" style={{ background: '#0d6efd', fontSize: '0.75rem' }}>
                        {fullTotalQuestions} questions total
                      </span>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        6 sections
                      </span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.88rem' }}>
                      The complete GATE DA experience — all 6 subjects, every question, back-to-back.
                      Get one combined score report with real negative marking applied.
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
                    to="/courses/gate-da/full-test"
                    className="btn fw-semibold text-white w-100"
                    style={{ background: FULL_GRADIENT, borderRadius: 10, padding: '0.55rem 1.4rem' }}>
                    <i className={`bi ${fullStats ? 'bi-arrow-clockwise' : 'bi-play-fill'} me-2`} />
                    {fullStats ? 'Reattempt' : 'Start Full GATE DA Test'}
                  </Link>
                  {fullStats && (
                    <Link
                      to="/courses/gate-da/analysis"
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
            { icon: 'bi-check-circle-fill', color: '#28a745', label: '+1/+2 marks', desc: 'for each correct answer' },
            { icon: 'bi-dash-circle-fill',  color: '#dc3545', label: '−1/3 or −2/3', desc: 'for wrong MCQ answers' },
            { icon: 'bi-shield-check',      color: '#6c757d', label: 'No penalty',  desc: 'for wrong MSQ / NAT answers' },
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

export default GATEDA
