import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const WEEK_TOPICS = {
  1: 'Descriptive Statistics',
  2: 'Probability Basics',
  3: 'Random Variables',
  4: 'Distributions',
  5: 'Sampling',
  6: 'Hypothesis Testing',
  7: 'Regression',
  8: 'Linear Algebra I',
  9: 'Linear Algebra II',
  10: 'Calculus I',
  11: 'Calculus II',
  12: 'Optimization'
}

const MathReview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const authCheck = await axios.get(`${API}/api/check-auth`, { withCredentials: true })
        if (!authCheck.data.authenticated) {
          navigate('/login', { state: { from: { pathname: '/courses/math2/review' } }, replace: true })
          return
        }
        const session = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        const res = await axios.get(`${API}/api/iitm_math2_scores?email=${encodeURIComponent(session.data.email)}`, { withCredentials: true })
        if (res.data?.scores) {
          const sorted = [...res.data.scores].sort((a, b) => new Date(b.dateAttempted || 0) - new Date(a.dateAttempted || 0))
          setScores(sorted)
        }
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getScoreColor = (pct) => pct >= 80 ? '#28a745' : pct >= 60 ? '#ffc107' : '#dc3545'

  const getPct = (s) => s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0

  const getLabel = (s) => {
    if (s.subtopic) return `Week ${s.week} — ${s.subtopic}`
    return `Week ${s.week}${WEEK_TOPICS[s.week] ? ' — ' + WEEK_TOPICS[s.week] : ''}`
  }

  const filtered = filter
    ? scores.filter(s => getLabel(s).toLowerCase().includes(filter.toLowerCase()))
    : scores

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Math 2 — Quiz Review</h1>
              <p className="mb-0">Review your previous quiz attempts and check your answers.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/math2">Math 2</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {selectedAttempt ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-0">{getLabel(selectedAttempt)}</h4>
                <small className="text-muted">{selectedAttempt.dateAttempted ? new Date(selectedAttempt.dateAttempted).toLocaleString() : ''}</small>
              </div>
              <button className="btn btn-outline-secondary" onClick={() => setSelectedAttempt(null)}>← Back to list</button>
            </div>

            <div className="row g-3 mb-4">
              {[
                { label: 'Score', val: `${getPct(selectedAttempt)}%`, color: getScoreColor(getPct(selectedAttempt)) },
                { label: 'Correct', val: selectedAttempt.correctAnswers || 0, color: '#28a745' },
                { label: 'Incorrect', val: (selectedAttempt.totalQuestions || 0) - (selectedAttempt.correctAnswers || 0), color: '#dc3545' },
                { label: 'Total Q', val: selectedAttempt.totalQuestions || 0, color: '#6c757d' }
              ].map(({ label, val, color }) => (
                <div className="col-6 col-md-3" key={label}>
                  <div className="card text-center h-100"><div className="card-body py-3">
                    <div className="fs-4 fw-bold" style={{ color }}>{val}</div>
                    <div className="text-muted small">{label}</div>
                  </div></div>
                </div>
              ))}
            </div>

            {selectedAttempt.responses?.length > 0 ? (
              <div className="accordion" id="questionsAccordion">
                {selectedAttempt.responses.map((q, idx) => (
                  <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button collapsed py-2 px-3 ${q.isCorrect ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                        type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                        style={{ fontWeight: '500', fontSize: '0.95rem' }}
                      >
                        <span className={`badge me-2 ${q.isCorrect ? 'bg-success' : 'bg-danger'}`}>{q.isCorrect ? '✓' : '✗'}</span>
                        Q{idx + 1}.&nbsp;
                        <span className="text-truncate" style={{ maxWidth: '600px' }}>{q.questionText || 'Question'}</span>
                        {q.marksAwarded > 0 && <span className="ms-auto me-4 text-muted small">+{q.marksAwarded} marks</span>}
                      </button>
                    </h2>
                    <div id={`q${idx}`} className="accordion-collapse collapse">
                      <div className="accordion-body py-3">
                        <p className="mb-2"><strong>Question:</strong> {q.questionText || '—'}</p>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <div className={`p-2 rounded ${q.isCorrect ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                              <strong>Your Answer:</strong>{' '}
                              {Array.isArray(q.userResponse) ? q.userResponse.join(', ') : (q.userResponse || '(no answer)')}
                            </div>
                          </div>
                          {!q.isCorrect && (
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-success-subtle border border-success">
                                <strong>Correct Answer:</strong>{' '}
                                {Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : (q.correctAnswers || '—')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">Detailed per-question breakdown is not available for this attempt.</div>
            )}
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Your Quiz Attempts ({scores.length})</h4>
              <Link to="/courses/math2" className="btn btn-outline-primary btn-sm">← Back to Topics</Link>
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Filter by week or topic..."
                value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '350px' }} />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                {scores.length === 0 ? 'No quiz attempts yet.' : 'No matching topics.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>#</th><th>Week / Topic</th><th>Score</th><th>Percentage</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => {
                      const pct = getPct(s)
                      return (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td><strong>{getLabel(s)}</strong></td>
                          <td>{s.correctAnswers ?? '—'}/{s.totalQuestions ?? '—'}</td>
                          <td>
                            <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span>
                            <div className="progress mt-1" style={{ height: '4px' }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
                            </div>
                          </td>
                          <td className="text-muted">{s.dateAttempted ? new Date(s.dateAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          <td><button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedAttempt(s)}>Review</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default MathReview