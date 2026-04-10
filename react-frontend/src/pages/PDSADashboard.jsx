import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const PDSADashboard = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showScorecard, setShowScorecard] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${VITE_API_URL}/api/pdsa-submissions`, { withCredentials: true })
      const arr = res.data?.success ? (res.data.data || []) : []
      setSubmissions(arr)
    } catch {
      setError('Failed to load PDSA data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#28a745'
    if (pct >= 60) return '#ffc107'
    return '#dc3545'
  }

  // Function to get quiz type display name and badge color
  const getQuizTypeInfo = (quizType, questionType) => {
    if (quizType === 'coding') {
      return { label: 'Coding', color: '#198754', icon: 'bi-code-slash' }
    }
    if (quizType === 'interview') {
      return { label: 'Interview', color: '#6f42c1', icon: 'bi-mic' }
    }
    if (quizType === 'test') {
      if (questionType === 'mcq-single') {
        return { label: 'MCQ (Single)', color: '#0d6efd', icon: 'bi-check-circle' }
      }
      if (questionType === 'mcq-multiple') {
        return { label: 'MCQ (Multiple)', color: '#0dcaf0', icon: 'bi-check2-square' }
      }
      if (questionType === 'numerical') {
        return { label: 'Numerical', color: '#fd7e14', icon: 'bi-calculator' }
      }
      return { label: 'Test', color: '#0d6efd', icon: 'bi-pencil-square' }
    }
    return { label: quizType || 'Unknown', color: '#6c757d', icon: 'bi-question-circle' }
  }

  // Group submissions by student email
  const students = Object.values(
    submissions.reduce((acc, s) => {
      const key = s.email
      if (!acc[key]) acc[key] = { email: s.email, username: s.username || s.name || s.email, submissions: [] }
      acc[key].submissions.push(s)
      return acc
    }, {})
  ).sort((a, b) => {
    const aLatest = Math.max(...a.submissions.map(s => new Date(s.timestamp || 0)))
    const bLatest = Math.max(...b.submissions.map(s => new Date(s.timestamp || 0)))
    return bLatest - aLatest
  })

  const stats = {
    totalStudents: students.length,
    totalSubmissions: submissions.length,
    avgScore: submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissions.length)
      : 0
  }

  if (loading) return (
    <div className="container my-4 d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">PDSA Dashboard</h2>
          <p className="text-muted mb-0">Programming, Data Structures and Algorithms assessments</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>← Back to Admin</button>
          <button className="btn btn-info" onClick={() => setShowScorecard(true)}>
            <i className="bi bi-graph-up me-1"></i> Scorecard
          </button>
          <button className="btn btn-success" onClick={load}><i className="bi bi-arrow-repeat"></i> Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Scorecard Modal */}
      {showScorecard && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white' }}>
                <h5 className="modal-title">
                  <i className="bi bi-trophy me-2"></i>
                  PDSA Performance Scorecard
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowScorecard(false)}></button>
              </div>
              <div className="modal-body">
                {/* Overall Stats */}
                <div className="row mb-4">
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <i className="bi bi-people-fill fs-1 text-primary"></i>
                      <h3 className="mt-2">{stats.totalStudents}</h3>
                      <p className="text-muted mb-0">Total Students</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <i className="bi bi-file-text-fill fs-1 text-warning"></i>
                      <h3 className="mt-2">{stats.totalSubmissions}</h3>
                      <p className="text-muted mb-0">Total Submissions</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <i className="bi bi-graph-up fs-1 text-success"></i>
                      <h3 className="mt-2" style={{ color: getScoreColor(stats.avgScore) }}>{stats.avgScore}%</h3>
                      <p className="text-muted mb-0">Average Score</p>
                    </div>
                  </div>
                </div>

                {/* Score Distribution */}
                <h6 className="mb-3">📊 Score Distribution</h6>
                <div className="mb-4">
                  {(() => {
                    const ranges = { '90-100%': 0, '75-89%': 0, '60-74%': 0, 'Below 60%': 0 }
                    submissions.forEach(s => {
                      const pct = s.percentage || 0
                      if (pct >= 90) ranges['90-100%']++
                      else if (pct >= 75) ranges['75-89%']++
                      else if (pct >= 60) ranges['60-74%']++
                      else ranges['Below 60%']++
                    })
                    return Object.entries(ranges).map(([range, count]) => (
                      <div key={range} className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span>{range}</span>
                          <span>{count} students</span>
                        </div>
                        <div className="progress">
                          <div className="progress-bar" role="progressbar" 
                            style={{ width: `${(count / students.length) * 100}%`, 
                                     background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                </div>

                {/* Top Performers */}
                <h6 className="mb-3">🏆 Top Performers</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th>Best Score</th>
                        <th>Avg Score</th>
                        <th>Submissions</th>
                       </tr>
                    </thead>
                    <tbody>
                      {students
                        .map(s => ({
                          ...s,
                          bestScore: Math.max(...s.submissions.map(sub => sub.percentage || 0)),
                          avgScore: s.submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / s.submissions.length
                        }))
                        .sort((a, b) => b.bestScore - a.bestScore)
                        .slice(0, 10)
                        .map((student, idx) => (
                          <tr key={idx}>
                            <td>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}th`}</td>
                            <td><strong>{student.username}</strong></td>
                            <td style={{ color: getScoreColor(student.bestScore), fontWeight: 'bold' }}>
                              {Math.round(student.bestScore)}%
                            </td>
                            <td>{Math.round(student.avgScore)}%</td>
                            <td>{student.submissions.length}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Recent Activity Summary */}
                <h6 className="mb-3">📈 Recent Activity</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Topic</th>
                        <th>Score</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions
                        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                        .slice(0, 5)
                        .map((sub, idx) => (
                          <tr key={idx}>
                            <td>{sub.username || sub.name || sub.email}</td>
                            <td>{sub.topic || 'Quiz'}</td>
                            <td style={{ color: getScoreColor(sub.percentage || 0), fontWeight: 'bold' }}>
                              {Math.round(sub.percentage || 0)}%
                            </td>
                            <td>{sub.timestamp ? new Date(sub.timestamp).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowScorecard(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => {
                  const exportData = {
                    stats,
                    topPerformers: students.map(s => ({
                      name: s.username,
                      email: s.email,
                      bestScore: Math.max(...s.submissions.map(sub => sub.percentage || 0)),
                      submissions: s.submissions.length
                    })).sort((a, b) => b.bestScore - a.bestScore),
                    allSubmissions: submissions
                  }
                  console.log('Export Data:', exportData)
                  alert('Scorecard data exported to console! You can enhance this to download as CSV or PDF.')
                }}>
                  <i className="bi bi-download me-1"></i> Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedStudent ? (
        <>
          <div className="row mb-4">
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2">{stats.totalStudents}</h4>
                  <p className="text-muted">Total Students</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-diagram-3 text-primary" style={{ fontSize: '2rem' }}></i>
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

          <div className="card">
            <div className="card-header text-white" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
              <h5 className="mb-0 text-white">Student Activity</h5>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div className="text-center text-muted py-4">No PDSA submissions yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Type</th>
                        <th>Recent Topic</th>
                        <th>Best Score</th>
                        <th>Submissions</th>
                        <th>Last Attempt</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, i) => {
                        const recent = student.submissions[0]
                        const best = Math.max(...student.submissions.map(s => s.percentage || 0))
                        // Get the most recent quiz type
                        const recentQuizType = recent?.quizType || 'test'
                        const recentQuestionType = recent?.questionType || ''
                        const typeInfo = getQuizTypeInfo(recentQuizType, recentQuestionType)
                        
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                            <td><strong>{student.username}</strong></td>
                            <td>
                              <span className="badge" style={{ background: typeInfo.color }}>
                                <i className={`bi ${typeInfo.icon} me-1`} style={{ fontSize: '0.75rem' }}></i>
                                {typeInfo.label}
                              </span>
                            </td>
                            <td><span className="badge" style={{ background: '#667eea' }}>{recent?.topic || '—'}</span></td>
                            <td><span style={{ color: getScoreColor(best), fontWeight: 'bold' }}>{Math.round(best)}%</span></td>
                            <td><span className="badge bg-secondary">{student.submissions.length}</span></td>
                            <td>{recent?.timestamp ? new Date(recent.timestamp).toLocaleDateString() : '—'}</td>
                            <td>
                              <button className="btn btn-outline-primary btn-sm"
                                onClick={e => { e.stopPropagation(); setSelectedStudent(student) }}>
                                View Details
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
        <div className="card">
          <div className="card-header text-white d-flex justify-content-between align-items-center"
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
            <h5 className="mb-0">{selectedStudent.username}</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-warning btn-sm" onClick={() => navigate(`/admin/analysis/pdsa/${selectedStudent.email}`, { state: { student: { ...selectedStudent, quizScores: selectedStudent.submissions.map(s => ({ topic: s.topic, score: s.score, totalQuestions: s.maxScore, percentage: s.percentage || 0, timestamp: s.timestamp, quizType: s.quizType, questionType: s.questionType })) } } })}>
                <i className="bi bi-magic me-1"></i>AI Analysis
              </button>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedStudent(null)}>← Back to List</button>
            </div>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <p><strong>Email:</strong> {selectedStudent.email}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Total Submissions:</strong> {selectedStudent.submissions.length}</p>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Question Type</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.submissions.map((s, i) => {
                    const pct = Math.round(s.percentage || 0)
                    const typeInfo = getQuizTypeInfo(s.quizType, s.questionType)
                    return (
                      <tr key={i}>
                        <td><strong>{s.topic || '—'}</strong></td>
                        <td>
                          <span className="badge" style={{ background: typeInfo.color }}>
                            <i className={`bi ${typeInfo.icon} me-1`}></i>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td>
                          {s.questionType ? (
                            <span className="badge bg-secondary">
                              {s.questionType === 'mcq-single' ? 'Single Select' : 
                               s.questionType === 'mcq-multiple' ? 'Multiple Select' : 
                               s.questionType === 'numerical' ? 'Numerical' : s.questionType}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{s.score}/{s.maxScore}</td>
                        <td><span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span></td>
                        <td>{s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDSADashboard
