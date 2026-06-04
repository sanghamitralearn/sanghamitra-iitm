import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'


const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const STATS_TOPIC_NAMES = {
  // Week 1
  'Week1_Basics_of_Data':               'Week 1 - Basics of Data',
  'basics_of_data':                     'Week 1 - Basics of Data',
  'Basics of Data':                     'Week 1 - Basics of Data',
  'Week 1 - Basics of Data':            'Week 1 - Basics of Data',
  // Week 2
  'Week2_Categorical_Analysis':         'Week 2 - Categorical Analysis',
  'categorical_analysis':               'Week 2 - Categorical Analysis',
  'Categorical Analysis':               'Week 2 - Categorical Analysis',
  'Week 2 - Categorical Analysis':      'Week 2 - Categorical Analysis',
  // Week 3
  'Week3_Descriptive_Statistics':       'Week 3 - Descriptive Statistics',
  'descriptive_statistics':             'Week 3 - Descriptive Statistics',
  'Descriptive Statistics':             'Week 3 - Descriptive Statistics',
  'Week 3 - Descriptive Statistics':    'Week 3 - Descriptive Statistics',
  // Week 4
  'Week4_Variable_Association':         'Week 4 - Variable Association',
  'variable_association':               'Week 4 - Variable Association',
  'Variable Association':               'Week 4 - Variable Association',
  'Week 4 - Variable Association':      'Week 4 - Variable Association',
  // Week 5
  'Week5_Basic_Principles_of_Counting': 'Week 5 - Basic Principles of Counting',
  'basic_principles_of_counting':       'Week 5 - Basic Principles of Counting',
  'Basic Principles of Counting':       'Week 5 - Basic Principles of Counting',
  'Week 5 - Basic Principles of Counting': 'Week 5 - Basic Principles of Counting',
  // Week 6
  'Week6_Permutations_and_Combinations':'Week 6 - Permutations & Combinations',
  'permutations_and_combinations':      'Week 6 - Permutations & Combinations',
  'Permutations and Combinations':      'Week 6 - Permutations & Combinations',
  'Week 6 - Permutations and Combinations': 'Week 6 - Permutations & Combinations',
}

function getDisplayTopicName(topic) {
  if (!topic) return 'Unknown Topic'
  if (STATS_TOPIC_NAMES[topic]) return STATS_TOPIC_NAMES[topic]
  return topic.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const Stats1Dashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${VITE_API_URL}/api/statistics_scores`, { withCredentials: true })
      const arr = res.data?.success && res.data?.data
        ? (Array.isArray(res.data.data) ? res.data.data : [res.data.data])
        : []
      setData(arr)
    } catch {
      setError('Failed to load Statistics 1 data')
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
    data.forEach(s => (s.quizScores || []).forEach(q => {
      totalSubmissions++
      totalCorrect += q.score || q.correctAnswers || 0
      totalQ += q.maxScore || q.totalPossible || 50
    }))
    return {
      totalStudents: data.length,
      totalSubmissions,
      avgScore: totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0
    }
  })()

  const sortedData = [...data].filter(s => s.quizScores?.length > 0).sort((a, b) => {
    const aLatest = (a.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0)
    const bLatest = (b.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0)
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
          <h2 className="mb-0">Statistics 1 Dashboard</h2>
          <p className="text-muted mb-0">Data analysis, probability, and descriptive statistics assessments</p>
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
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              {sortedData.length === 0 ? (
                <div className="text-center text-muted py-4">No Statistics 1 data available yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Recent Topic</th>
                        <th>Score</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedData.map((student, i) => {
                        const scores = student.quizScores || []
                        const recent = scores.length > 0
                          ? scores.reduce((a, b) => new Date(a.timestamp || 0) > new Date(b.timestamp || 0) ? a : b)
                          : null
                        const pct = recent ? Math.round(recent.percentage || 0) : 0
                        return (
                          <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                            <td><strong>{student.username || student.name || student.email}</strong></td>
                            <td>{student.email}</td>
                            <td>
                              {recent
                                ? <span className="badge bg-success">{getDisplayTopicName(recent.topic)}</span>
                                : <span className="text-muted">No attempts</span>}
                            </td>
                            <td>
                              {recent
                                ? <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>
                                    {recent.score || recent.correctAnswers || 0}/{recent.maxScore || recent.totalPossible || 50} ({pct}%)
                                  </span>
                                : <span className="text-muted">—</span>}
                            </td>
                            <td>{recent?.timestamp ? new Date(recent.timestamp).toLocaleDateString() : '—'}</td>
                            <td>
                              <button
                                className="btn btn-outline-success btn-sm"
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
            <h5 className="mb-0">Student: {selectedStudent.username || selectedStudent.name || selectedStudent.email}</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-warning btn-sm" onClick={() => navigate(`/admin/analysis/stats1/${selectedStudent.email}`, { state: { student: selectedStudent } })}>
                <i className="bi bi-magic me-1"></i>AI Analysis
              </button>
              <button className="btn btn-light btn-sm" onClick={() => setSelectedStudent(null)}>← Back to List</button>
            </div>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Username:</strong> {selectedStudent.username || '—'}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Total Attempts:</strong> {(selectedStudent.quizScores || []).length}</p>
                <p><strong>Topics Attempted:</strong> {[...new Set((selectedStudent.quizScores || []).map(q => q.topic))].length}</p>
              </div>
            </div>

            {selectedStudent.quizScores?.length > 0 && (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedStudent.quizScores]
                      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                      .map((q, i) => {
                        const pct = Math.round(q.percentage || 0)
                        return (
                          <tr key={i}>
                            <td><strong>{getDisplayTopicName(q.topic)}</strong></td>
                            <td>{q.score || q.correctAnswers || 0}/{q.maxScore || q.totalPossible || 50}</td>
                            <td><span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span></td>
                            <td>{q.timestamp ? new Date(q.timestamp).toLocaleDateString() : '—'}</td>
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

export default Stats1Dashboard
