import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const COURSES = [
  { id: 'all',    label: 'All Courses',                  fullTitle: 'Programming Courses Dashboard',            subtitle: 'Java, Python, SQL & DSA — quiz attempts and answer-level review', icon: 'bi-collection',      color: '#667eea' },
  { id: 'java',   label: 'Java',                         fullTitle: 'Java Dashboard',                           subtitle: 'Weekly assessments — Java Programming',                          icon: 'bi-cup-hot-fill',    color: '#f89820' },
  { id: 'python', label: 'Python',                       fullTitle: 'Python Dashboard',                         subtitle: 'Weekly assessments — Python Programming',                        icon: 'bi-filetype-py',     color: '#3776ab' },
  { id: 'sql',    label: 'SQL',                          fullTitle: 'SQL Dashboard',                            subtitle: 'Weekly assessments — SQL & Databases',                           icon: 'bi-database-fill',   color: '#4479a1' },
  { id: 'dsa',    label: 'DSA',                          fullTitle: 'DSA Dashboard',                            subtitle: 'Weekly assessments — Data Structures & Algorithms',              icon: 'bi-diagram-3-fill',  color: '#f4b41a' },
]

const courseInfo = (id) => COURSES.find(c => c.id === id) || { label: id, fullTitle: id, subtitle: '', icon: 'bi-code-slash', color: '#6c757d' }

const ProgrammingDashboard = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [course, setCourse] = useState(() => {
    const c = searchParams.get('course')
    return COURSES.some(x => x.id === c) ? c : 'all'
  })
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Detail view state
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsError, setResultsError] = useState(null)

  const load = async (courseId) => {
    setLoading(true)
    setError(null)
    try {
      const url = courseId && courseId !== 'all'
        ? `${VITE_API_URL}/api/mcq-quiz/admin/attempts?course=${courseId}`
        : `${VITE_API_URL}/api/mcq-quiz/admin/attempts`
      const res = await axios.get(url, { withCredentials: true })
      setAttempts(res.data?.attempts || [])
    } catch (err) {
      setError('Failed to load programming course submissions')
      setAttempts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearchParams(course === 'all' ? {} : { course })
    load(course)
  }, [course])

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#28a745'
    if (pct >= 60) return '#ffc107'
    return '#dc3545'
  }

  // Stats
  const stats = (() => {
    const uniqueStudents = new Set(attempts.map(a => a.email).filter(Boolean))
    const totalSubmissions = attempts.length
    const avgScore = totalSubmissions > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalSubmissions)
      : 0
    return { totalStudents: uniqueStudents.size, totalSubmissions, avgScore }
  })()

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
  )

  const openAttempt = async (attempt) => {
    setSelectedAttempt(attempt)
    setResults([])
    setResultsError(null)
    setResultsLoading(true)
    try {
      const res = await axios.get(
        `${VITE_API_URL}/api/mcq-quiz/admin/attempts/${attempt._id}/results`,
        { withCredentials: true }
      )
      setResults(res.data?.results || [])
    } catch (err) {
      setResultsError('Failed to load question-level results for this attempt')
    } finally {
      setResultsLoading(false)
    }
  }

  if (loading) return (
    <div className="container my-4 d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  const activeCourse = courseInfo(course)
  const isSingleCourse = course !== 'all'

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            {isSingleCourse && (
              <i className={`bi ${activeCourse.icon} me-2`} style={{ color: activeCourse.color }}></i>
            )}
            {activeCourse.fullTitle}
          </h2>
          <p className="text-muted mb-0">{activeCourse.subtitle}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>← Back to Admin</button>
          <button className="btn btn-success" onClick={() => load(course)}><i className="bi bi-arrow-repeat"></i> Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!selectedAttempt ? (
        <>
          {/* Course tabs — only shown in "all courses" mode */}
          {!isSingleCourse && (
            <ul className="nav nav-pills mb-4">
              {COURSES.map(c => (
                <li className="nav-item" key={c.id}>
                  <button
                    className="nav-link"
                    style={course === c.id
                      ? { background: c.color, color: '#fff' }
                      : { color: c.color }}
                    onClick={() => setCourse(c.id)}
                  >
                    <i className={`bi ${c.icon} me-1`}></i>{c.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Stats cards */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2">{stats.totalStudents}</h4>
                  <p className="text-muted">Students</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-bar-chart text-info" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2" style={{ color: getScoreColor(stats.avgScore) }}>{stats.avgScore}%</h4>
                  <p className="text-muted">Average Score</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-file-text-fill text-warning" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2">{stats.totalSubmissions}</h4>
                  <p className="text-muted">Total Submissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attempts table */}
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Quiz Attempts</h5>
            </div>
            <div className="card-body">
              {sortedAttempts.length === 0 ? (
                <div className="text-center text-muted py-4">No programming course submissions yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        {!isSingleCourse && <th>Course</th>}
                        <th>Week / Topic</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAttempts.map((a) => {
                        const ci = courseInfo(a.course)
                        return (
                          <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => openAttempt(a)}>
                            <td><strong>{a.username || a.email}</strong></td>
                            <td>{a.email}</td>
                            {!isSingleCourse && (
                              <td>
                                <span className="badge" style={{ background: ci.color, color: '#fff' }}>
                                  <i className={`bi ${ci.icon} me-1`}></i>{ci.label}
                                </span>
                              </td>
                            )}
                            <td>Week {a.week}{a.topic ? ` — ${a.topic}` : ''}</td>
                            <td>
                              <span style={{ color: getScoreColor(a.percentage), fontWeight: 'bold' }}>
                                {a.correct_answers}/{a.total_questions} ({a.percentage}%)
                              </span>
                            </td>
                            <td>{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}</td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={e => { e.stopPropagation(); openAttempt(a) }}
                              >
                                View Answers
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
          </div>
        </>
      ) : (
        /* Attempt detail — per-question review */
        <div className="card">
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {selectedAttempt.username || selectedAttempt.email} — {courseInfo(selectedAttempt.course).label}, Week {selectedAttempt.week}
            </h5>
            <button className="btn btn-light btn-sm" onClick={() => setSelectedAttempt(null)}>← Back to List</button>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <p><strong>Email:</strong> {selectedAttempt.email}</p>
                <p><strong>Topic:</strong> {selectedAttempt.topic || '—'}</p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Score:</strong>{' '}
                  <span style={{ color: getScoreColor(selectedAttempt.percentage), fontWeight: 'bold' }}>
                    {selectedAttempt.score}/{selectedAttempt.max_possible_score} ({selectedAttempt.percentage}%)
                  </span>
                </p>
                <p><strong>Submitted:</strong> {selectedAttempt.submitted_at ? new Date(selectedAttempt.submitted_at).toLocaleString() : '—'}</p>
              </div>
            </div>

            {resultsLoading ? (
              <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              </div>
            ) : resultsError ? (
              <div className="alert alert-danger">{resultsError}</div>
            ) : results.length === 0 ? (
              <div className="text-center text-muted py-4">No per-question results found for this attempt.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {results.map((r, i) => (
                  <div className="card" key={r._id || i}>
                    <div className={`card-header d-flex justify-content-between align-items-center ${r.is_correct ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                      <strong>Q{i + 1}. {r.topic} {r.subtopic ? `— ${r.subtopic}` : ''}</strong>
                      <span className={`badge ${r.is_correct ? 'bg-success' : 'bg-danger'}`}>
                        {r.is_correct ? 'Correct' : 'Incorrect'} ({r.marks_awarded}/{r.points || 1})
                      </span>
                    </div>
                    <div className="card-body">
                      <p className="mb-2">{r.question_text}</p>

                      {r.code_snippet && (
                        <pre className="bg-dark text-light p-2 rounded" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                          <code>{r.code_snippet}</code>
                        </pre>
                      )}

                      {Array.isArray(r.options) && r.options.length > 0 && (
                        <ul className="list-group mb-2">
                          {r.options.map(opt => {
                            const isUserChoice = Array.isArray(r.user_answer)
                              ? r.user_answer.includes(opt.id)
                              : r.user_answer === opt.id
                            const isCorrectChoice = Array.isArray(r.correct_answer)
                              ? r.correct_answer.includes(opt.id)
                              : r.correct_answer === opt.id
                            let cls = 'list-group-item'
                            if (isCorrectChoice) cls += ' list-group-item-success'
                            if (isUserChoice && !isCorrectChoice) cls += ' list-group-item-danger'
                            return (
                              <li className={cls} key={opt.id}>
                                {opt.text}
                                {isUserChoice && <span className="badge bg-secondary ms-2">Student's answer</span>}
                                {isCorrectChoice && <span className="badge bg-success ms-2">Correct</span>}
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      {(!Array.isArray(r.options) || r.options.length === 0) && (
                        <div className="row">
                          <div className="col-md-6">
                            <strong>Student's Answer:</strong>{' '}
                            <span className={r.is_correct ? 'text-success' : 'text-danger'}>
                              {typeof r.user_answer === 'object' ? JSON.stringify(r.user_answer) : String(r.user_answer ?? '—')}
                            </span>
                          </div>
                          <div className="col-md-6">
                            <strong>Correct Answer:</strong>{' '}
                            <span className="text-success">
                              {typeof r.correct_answer === 'object' ? JSON.stringify(r.correct_answer) : String(r.correct_answer ?? '—')}
                            </span>
                          </div>
                        </div>
                      )}

                      {r.solution && (
                        <div className="alert alert-light mt-2 mb-0">
                          <strong>Solution:</strong> {r.solution}
                        </div>
                      )}

                      <div className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-tag me-1"></i>{r.difficulty} · {r.question_type} · {r.bloom_level}
                        {r.time_taken_seconds != null && <> · <i className="bi bi-clock me-1"></i>{r.time_taken_seconds}s</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgrammingDashboard
