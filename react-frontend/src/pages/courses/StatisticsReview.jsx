import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const StatisticsReview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [quizScores, setQuizScores] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const authCheck = await axios.get(`${API}/api/check-auth`, { withCredentials: true })
        if (!authCheck.data.authenticated) {
          navigate('/login', { state: { from: { pathname: '/courses/statistics/review' } }, replace: true })
          return
        }
        const session = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        const res = await axios.get(`${API}/api/statistics_scores?email=${encodeURIComponent(session.data.email)}`, { withCredentials: true })
        if (res.data?.success && res.data?.data?.quizScores) {
          const sorted = [...res.data.data.quizScores].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
          setQuizScores(sorted)
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

  const formatTime = (secs) => {
    if (!secs) return '—'
    const m = Math.floor(secs / 60), s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const filtered = filter
    ? quizScores.filter(q => (q.topic || '').toLowerCase().includes(filter.toLowerCase()))
    : quizScores

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
              <h1>Statistics 1 — Quiz Review</h1>
              <p className="mb-0">Review your previous quiz attempts and check your answers.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics">Statistics 1</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {selectedAttempt ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-0">{selectedAttempt.topic}</h4>
                <small className="text-muted">
                  {selectedAttempt.timestamp ? new Date(selectedAttempt.timestamp).toLocaleString() : ''}
                  {' · '}Attempt #{selectedAttempt.attemptNumber || '—'}
                </small>
              </div>
              <button className="btn btn-outline-secondary" onClick={() => setSelectedAttempt(null)}>← Back to list</button>
            </div>

            <div className="row g-3 mb-4">
              {[
                { label: 'Score', val: `${Math.round(selectedAttempt.percentage || 0)}%`, color: getScoreColor(selectedAttempt.percentage || 0) },
                { label: 'Correct', val: selectedAttempt.score || 0, color: '#28a745' },
                { label: 'Incorrect', val: (selectedAttempt.totalQuestions || 0) - (selectedAttempt.score || 0), color: '#dc3545' },
                { label: 'Time', val: formatTime(selectedAttempt.totalTime), color: '#17a2b8' }
              ].map(({ label, val, color }) => (
                <div className="col-6 col-md-3" key={label}>
                  <div className="card text-center h-100"><div className="card-body py-3">
                    <div className="fs-4 fw-bold" style={{ color }}>{val}</div>
                    <div className="text-muted small">{label}</div>
                  </div></div>
                </div>
              ))}
            </div>

            {selectedAttempt.questionResults?.length > 0 ? (
              <div className="accordion" id="questionsAccordion">
                {selectedAttempt.questionResults.map((q, idx) => (
                  <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button collapsed py-2 px-3 ${q.isCorrect ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                        type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                        style={{ fontWeight: '500', fontSize: '0.95rem' }}
                      >
                        <span className={`badge me-2 ${q.isCorrect ? 'bg-success' : 'bg-danger'}`}>{q.isCorrect ? '✓' : '✗'}</span>
                        Q{q.questionNumber || idx + 1}.&nbsp;
                        <span className="text-truncate" style={{ maxWidth: '600px' }}>{q.questionText || 'Question'}</span>
                        {q.timeTaken > 0 && <span className="ms-auto me-4 text-muted small">{formatTime(q.timeTaken)}</span>}
                      </button>
                    </h2>
                    <div id={`q${idx}`} className="accordion-collapse collapse">
                      <div className="accordion-body py-3">
                        <p className="mb-2"><strong>Question:</strong> {q.questionText || '—'}</p>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <div className={`p-2 rounded ${q.isCorrect ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                              <strong>Your Answer:</strong> {q.userAnswer || '(no answer)'}
                            </div>
                          </div>
                          {!q.isCorrect && (
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-success-subtle border border-success">
                                <strong>Correct Answer:</strong> {q.correctAnswer || '—'}
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
              <h4 className="mb-0">Your Quiz Attempts ({quizScores.length})</h4>
              <Link to="/courses/statistics" className="btn btn-outline-primary btn-sm">← Back to Topics</Link>
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Filter by topic..."
                value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '350px' }} />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                {quizScores.length === 0 ? 'No quiz attempts yet.' : 'No matching topics.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>#</th><th>Topic</th><th>Attempt</th><th>Score</th><th>Percentage</th><th>Time</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((quiz, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td><strong>{quiz.topic || 'Unknown'}</strong></td>
                        <td>#{quiz.attemptNumber || '—'}</td>
                        <td>{quiz.score ?? '—'}/{quiz.totalQuestions ?? '—'}</td>
                        <td>
                          <span style={{ color: getScoreColor(quiz.percentage || 0), fontWeight: 'bold' }}>{Math.round(quiz.percentage || 0)}%</span>
                          <div className="progress mt-1" style={{ height: '4px' }}>
                            <div className="progress-bar" style={{ width: `${quiz.percentage || 0}%`, backgroundColor: getScoreColor(quiz.percentage || 0) }} />
                          </div>
                        </td>
                        <td className="text-muted">{formatTime(quiz.totalTime)}</td>
                        <td className="text-muted">{quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                        <td><button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedAttempt(quiz)}>Review</button></td>
                      </tr>
                    ))}
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

export default StatisticsReview
