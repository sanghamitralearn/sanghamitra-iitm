import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const PythonDashboard = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${VITE_API_URL}/api/coding-submissions`, { withCredentials: true })
      const arr = res.data?.success ? (res.data.data || []) : []
      setSubmissions(arr)
    } catch {
      setError('Failed to load Python data')
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
      <div className="spinner-border text-success" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Python Dashboard</h2>
          <p className="text-muted mb-0">Coding assignments and programming assessments</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>← Back to Admin</button>
          <button className="btn btn-success" onClick={load}><i className="bi bi-arrow-repeat"></i> Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                  <i className="bi bi-filetype-py text-success" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2" style={{ color: getScoreColor(stats.avgScore) }}>{stats.avgScore}%</h4>
                  <p className="text-muted">Average Score</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="card h-100 text-center">
                <div className="card-body">
                  <i className="bi bi-file-code text-warning" style={{ fontSize: '2rem' }}></i>
                  <h4 className="mt-2">{stats.totalSubmissions}</h4>
                  <p className="text-muted">Total Submissions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header text-white" style={{ background: 'linear-gradient(135deg,#2ecc71,#27ae60)' }}>
              <h5 className="mb-0 text-white">Student Activity</h5>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div className="text-center text-muted py-4">No Python submissions yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
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
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                            <td><strong>{student.username}</strong></td>
                            <td className="text-muted">{student.email}</td>
                            <td><span className="badge" style={{ background: '#2ecc71' }}>{recent?.topic || '—'}</span></td>
                            <td><span style={{ color: getScoreColor(best), fontWeight: 'bold' }}>{Math.round(best)}%</span></td>
                            <td><span className="badge bg-secondary">{student.submissions.length}</span></td>
                            <td>{recent?.timestamp ? new Date(recent.timestamp).toLocaleDateString() : '—'}</td>
                            <td>
                              <button className="btn btn-outline-success btn-sm"
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
            style={{ background: 'linear-gradient(135deg,#2ecc71,#27ae60)' }}>
            <h5 className="mb-0">{selectedStudent.username}</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-warning btn-sm" onClick={() => navigate(`/admin/analysis/python/${selectedStudent.email}`, { state: { student: { ...selectedStudent, quizScores: selectedStudent.submissions.map(s => ({ topic: s.topic, score: s.score, totalQuestions: s.maxScore, percentage: s.percentage || 0, timestamp: s.timestamp })) } } })}>
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
                  <tr><th>Topic</th><th>Score</th><th>Percentage</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {selectedStudent.submissions.map((s, i) => {
                    const pct = Math.round(s.percentage || 0)
                    return (
                      <tr key={i}>
                        <td><strong>{s.topic || '—'}</strong></td>
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

export default PythonDashboard
