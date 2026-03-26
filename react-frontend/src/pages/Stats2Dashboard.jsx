import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const Stats2Dashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${VITE_API_URL}/api/iitm_stats2_scores`, { withCredentials: true })
      const arr = Array.isArray(res.data) ? res.data
        : res.data?.success && res.data?.data ? (Array.isArray(res.data.data) ? res.data.data : [res.data.data])
        : []
      setData(arr)
    } catch {
      setError('Failed to load Statistics 2 data')
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

  const stats = (() => {
    let totalSubmissions = 0, totalCorrect = 0, totalQ = 0
    data.forEach(s => (s.scores || []).forEach(q => {
      totalSubmissions++
      totalCorrect += q.correctAnswers || 0
      totalQ += q.totalQuestions || 0
    }))
    return {
      totalStudents: data.length,
      totalSubmissions,
      avgScore: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0
    }
  })()

  const sortedData = [...data].sort((a, b) => {
    const aLatest = (a.scores || []).reduce((max, s) => Math.max(max, new Date(s.dateAttempted || 0)), 0)
    const bLatest = (b.scores || []).reduce((max, s) => Math.max(max, new Date(s.dateAttempted || 0)), 0)
    return bLatest - aLatest
  })

  if (loading) return (
    <div className="container my-4 d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Statistics 2 Dashboard</h2>
          <p className="text-muted mb-0">Advanced statistics — weekly assessments</p>
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

          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {sortedData.length === 0 ? (
                <div className="text-center text-muted py-4">No Statistics 2 data available yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Recent Week</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((student, i) => {
                        const scores = student.scores || []
                        const recent = scores.length > 0
                          ? scores.reduce((a, b) => new Date(a.dateAttempted || 0) > new Date(b.dateAttempted || 0) ? a : b)
                          : null
                        const pct = recent && recent.totalQuestions
                          ? Math.round((recent.correctAnswers / recent.totalQuestions) * 100)
                          : 0
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                            <td><strong>{student.name || student.email}</strong></td>
                            <td>{student.email}</td>
                            <td>
                              {recent
                                ? <span className="badge bg-warning text-dark">Week {recent.week} — {recent.subtopic || ''}</span>
                                : <span className="text-muted">No attempts</span>}
                            </td>
                            <td>
                              {recent
                                ? <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>
                                    {recent.correctAnswers}/{recent.totalQuestions} ({pct}%)
                                  </span>
                                : <span className="text-muted">—</span>}
                            </td>
                            <td>{recent?.dateAttempted ? new Date(recent.dateAttempted).toLocaleDateString() : '—'}</td>
                            <td>
                              <button
                                className="btn btn-outline-warning btn-sm"
                                onClick={e => { e.stopPropagation(); setSelectedStudent(student) }}
                              >
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
          <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Student: {selectedStudent.name || selectedStudent.email}</h5>
            <button className="btn btn-light btn-sm" onClick={() => setSelectedStudent(null)}>← Back to List</button>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Name:</strong> {selectedStudent.name || '—'}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Total Attempts:</strong> {(selectedStudent.scores || []).length}</p>
                <p><strong>Weeks Attempted:</strong> {[...new Set((selectedStudent.scores || []).map(s => s.week))].sort().join(', ') || '—'}</p>
              </div>
            </div>

            {selectedStudent.scores?.length > 0 && (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Subtopic</th>
                      <th>Score</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedStudent.scores]
                      .sort((a, b) => new Date(b.dateAttempted || 0) - new Date(a.dateAttempted || 0))
                      .map((s, i) => {
                        const pct = Math.round((s.correctAnswers / (s.totalQuestions || 1)) * 100)
                        return (
                          <tr key={i}>
                            <td><strong>Week {s.week}</strong></td>
                            <td>{s.subtopic || '—'}</td>
                            <td>{s.correctAnswers}/{s.totalQuestions}</td>
                            <td>{s.score ?? '—'}</td>
                            <td><span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span></td>
                            <td>{s.dateAttempted ? new Date(s.dateAttempted).toLocaleDateString() : '—'}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Stats2Dashboard
