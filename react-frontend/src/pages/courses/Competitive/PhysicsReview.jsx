import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const WEEK_TOPICS = {
  1: 'Electricity',
  2: 'Kinematics',
  3: 'Laws of Motion',
  4: 'Work Energy Power',
  5: 'System of Particles',
  6: 'Gravitation',
  7: 'Properties of Matter',
  8: 'Thermodynamics',
  9: 'Oscillations',
  10: 'Waves',
  11: 'Electrostatics'
}

const PhysicsReview = () => {
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
          navigate('/login', { state: { from: { pathname: '/courses/physics/review' } }, replace: true })
          return
        }
        const session = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        const res = await axios.get(`${API}/api/physics_scores_databases?email=${encodeURIComponent(session.data.email)}`, { withCredentials: true })
        if (res.data?.quizScores) {
          const sorted = [...res.data.quizScores].sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))
          setScores(sorted)
        }
      } catch (error) {
        console.error('Error loading scores:', error)
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [navigate])

  const getScoreColor = (pct) => pct >= 80 ? '#28a745' : pct >= 60 ? '#ffc107' : '#dc3545'

  const getPct = (s) => s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0

  const getLabel = (s) => {
    if (s.topic) return `Week ${s.week} — ${s.topic}`
    return `Week ${s.week}${WEEK_TOPICS[s.week] ? ' — ' + WEEK_TOPICS[s.week] : ''}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <h1>Physics — Quiz Review</h1>
              <p className="mb-0">Review your previous quiz attempts and check your answers.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/physics">Physics</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {selectedAttempt ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h4 className="mb-0">{getLabel(selectedAttempt)}</h4>
                <small className="text-muted">Submitted: {formatDate(selectedAttempt.submitted_at)}</small>
                {selectedAttempt.started_at && (
                  <div><small className="text-muted">Started: {formatDate(selectedAttempt.started_at)}</small></div>
                )}
              </div>
              <button className="btn btn-outline-secondary" onClick={() => setSelectedAttempt(null)}>← Back to list</button>
            </div>

            <div className="row g-3 mb-4">
              {[
                { label: 'Score', val: `${selectedAttempt.score || 0}/${selectedAttempt.max_possible_score || 0}`, color: getScoreColor(getPct(selectedAttempt)) },
                { label: 'Percentage', val: `${getPct(selectedAttempt)}%`, color: getScoreColor(getPct(selectedAttempt)) },
                { label: 'Correct', val: selectedAttempt.correct_answers || 0, color: '#28a745' },
                { label: 'Incorrect', val: (selectedAttempt.total_questions || 0) - (selectedAttempt.correct_answers || 0), color: '#dc3545' },
                { label: 'Total Questions', val: selectedAttempt.total_questions || 0, color: '#6c757d' },
                { label: 'Time Taken', val: formatTime(selectedAttempt.total_time_seconds || 0), color: '#6c757d' }
              ].map(({ label, val, color }) => (
                <div className="col-6 col-md-4" key={label}>
                  <div className="card text-center h-100"><div className="card-body py-3">
                    <div className="fs-4 fw-bold" style={{ color }}>{val}</div>
                    <div className="text-muted small">{label}</div>
                  </div></div>
                </div>
              ))}
            </div>

            {/* Difficulty Breakdown */}
            {selectedAttempt.easy_attempted + selectedAttempt.medium_attempted + selectedAttempt.hard_attempted > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <strong>Performance by Difficulty</strong>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {['easy', 'medium', 'hard'].map(diff => {
                      const attempted = selectedAttempt[`${diff}_attempted`] || 0
                      const correct = selectedAttempt[`${diff}_correct`] || 0
                      const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
                      const diffColors = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545' }
                      return (
                        <div className="col-md-4" key={diff}>
                          <div className="text-center p-2 border rounded">
                            <div className="text-capitalize fw-bold" style={{ color: diffColors[diff] }}>{diff}</div>
                            <div className="fs-5">{correct}/{attempted}</div>
                            <div className="small text-muted">{pct}% correct</div>
                            <div className="progress mt-1" style={{ height: '4px' }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: diffColors[diff] }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedAttempt.questionResults && selectedAttempt.questionResults.length > 0 ? (
              <div className="accordion" id="questionsAccordion">
                {selectedAttempt.questionResults.map((q, idx) => (
                  <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button collapsed py-2 px-3 ${q.is_correct ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                        type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                        style={{ fontWeight: '500', fontSize: '0.95rem' }}
                      >
                        <span className={`badge me-2 ${q.is_correct ? 'bg-success' : 'bg-danger'}`}>{q.is_correct ? '✓' : '✗'}</span>
                        Q{idx + 1}.&nbsp;
                        <span className="text-truncate" style={{ maxWidth: '600px' }}>{q.question_text || 'Question'}</span>
                        {q.marks_awarded > 0 && <span className="ms-auto me-4 text-muted small">+{q.marks_awarded} marks</span>}
                        {q.time_taken_seconds > 0 && <span className="text-muted small">{Math.floor(q.time_taken_seconds / 60)}:{String(q.time_taken_seconds % 60).padStart(2, '0')}</span>}
                      </button>
                    </h2>
                    <div id={`q${idx}`} className="accordion-collapse collapse">
                      <div className="accordion-body py-3">
                        <p className="mb-2"><strong>Question:</strong> {q.question_text || '—'}</p>
                        
                        {/* Display options for MCQ/MSQ */}
                        {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="mb-2">
                            <strong>Options:</strong>
                            <div className="mt-1">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className={`p-1 small ${q.user_answer === opt.option_id ? 'bg-light' : ''}`}>
                                  <strong>{opt.option_id}.</strong> {opt.text}
                                  {q.user_answer === opt.option_id && (
                                    <span className="ms-2 badge bg-info">Your choice</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="row g-2">
                          <div className="col-md-6">
                            <div className={`p-2 rounded ${q.is_correct ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                              <strong>Your Answer:</strong>{' '}
                              {Array.isArray(q.user_answer) 
                                ? q.user_answer.join(', ') 
                                : (q.user_answer || q.user_answer === 0 ? String(q.user_answer) : '(no answer)')}
                            </div>
                          </div>
                          {!q.is_correct && q.correct_answer && (
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-success-subtle border border-success">
                                <strong>Correct Answer:</strong>{' '}
                                {Array.isArray(q.correct_answer) 
                                  ? q.correct_answer.join(', ') 
                                  : String(q.correct_answer || '—')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-3 p-2 rounded" style={{ background: '#f8f9fa' }}>
                            <strong>Explanation:</strong>
                            <p className="mb-0 mt-1">{q.explanation}</p>
                          </div>
                        )}

                        {/* Metadata tags */}
                        {(q.subtopic || q.difficulty || q.bloom_level) && (
                          <div className="mt-2 d-flex gap-2 flex-wrap">
                            {q.subtopic && <span className="badge bg-secondary">Topic: {q.subtopic}</span>}
                            {q.difficulty && <span className="badge" style={{ 
                              background: q.difficulty === 'easy' ? '#28a745' : q.difficulty === 'medium' ? '#ffc107' : '#dc3545',
                              color: q.difficulty === 'medium' ? '#000' : '#fff'
                            }}>{q.difficulty}</span>}
                            {q.bloom_level && <span className="badge bg-info">Bloom: {q.bloom_level}</span>}
                            {q.concept_tags && q.concept_tags.length > 0 && (
                              <span className="badge bg-dark">Tags: {q.concept_tags.slice(0, 3).join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                Detailed per-question breakdown is not available for this attempt.
                {selectedAttempt.questionResults && <div>Note: {selectedAttempt.questionResults.length} questions found in attempt data.</div>}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h4 className="mb-0">Your Quiz Attempts ({scores.length})</h4>
              <Link to="/courses/physics" className="btn btn-outline-primary btn-sm">← Back to Topics</Link>
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Filter by week or topic..."
                value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '350px' }} />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                {scores.length === 0 ? 'No quiz attempts yet. Take a quiz to see your results here!' : 'No matching topics found.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Week / Topic</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Correct/Total</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => {
                      const pct = getPct(s)
                      const correctCount = s.correct_answers || 0
                      const totalQ = s.total_questions || 0
                      return (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>
                            <strong>{getLabel(s)}</strong>
                            {s.topic && s.topic !== WEEK_TOPICS[s.week] && (
                              <div><small className="text-muted">Topic: {s.topic}</small></div>
                            )}
                          </td>
                          <td>
                            <span className="fw-bold">{s.score || 0}/{s.max_possible_score || 0}</span>
                          </td>
                          <td>
                            <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span>
                            <div className="progress mt-1" style={{ height: '4px' }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
                            </div>
                          </td>
                          <td>{correctCount}/{totalQ}</td>
                          <td className="text-muted">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          <td>
                            <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedAttempt(s)}>
                              <i className="bi bi-eye me-1"></i>Review
                            </button>
                          </td>
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

// Helper function to format time in minutes:seconds
const formatTime = (seconds) => {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default PhysicsReview