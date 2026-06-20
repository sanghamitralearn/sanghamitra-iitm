import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const courses = [
  {
    id: 'java',
    title: 'Java Programming',
    description: 'Master Java from basics to advanced OOP, multithreading, collections, and design patterns.',
    icon: 'bi-cup-hot-fill',
    color: '#f89820',
    totalWeeks: 12,
    features: ['OOP Concepts', 'Multithreading', 'Collections', 'Exception Handling', 'JDBC'],
  },
  {
    id: 'python',
    title: 'Python Programming',
    description: 'Comprehensive Python covering data structures, OOP, file handling, and libraries.',
    icon: 'bi-filetype-py',
    color: '#3776ab',
    totalWeeks: 10,
    features: ['Data Structures', 'Functions & Modules', 'File Handling', 'OOP', 'NumPy/Pandas'],
  },
  {
    id: 'sql',
    title: 'SQL & Databases',
    description: 'Learn SQL from basic queries to joins, subqueries, indexing, and stored procedures.',
    icon: 'bi-database-fill',
    color: '#4479a1',
    totalWeeks: 8,
    features: ['CRUD Operations', 'Joins & Subqueries', 'Normalization', 'Indexing', 'Transactions'],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    description: 'Arrays, trees, graphs, dynamic programming, sorting — essential for coding interviews.',
    icon: 'bi-diagram-3-fill',
    color: '#f4b41a',
    totalWeeks: 12,
    features: ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Recursion', 'Sorting'],
  },
]

const Programming = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({})

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        if (res.data?.email) {
          setUser(res.data)
          fetchProgress(res.data.email)
        }
      } catch {
        // not logged in — show page anyway
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const fetchProgress = async (email) => {
    try {
      const results = await Promise.allSettled(
        courses.map(c =>
          axios.get(`${API}/api/mcq-quiz/attempts?email=${encodeURIComponent(email)}&course=${c.id}`, { withCredentials: true })
        )
      )
      const prog = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.data?.analytics?.overall) {
          prog[courses[i].id] = r.value.data.analytics.overall
        }
      })
      setProgress(prog)
    } catch {
      // progress unavailable
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <main className="main">
      <div className="page-title" data-aos="fade">
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Programming Courses</h1>
              <p className="mb-0">Master Java, Python, SQL, and DSA through week-wise quizzes, progress tracking, and detailed reviews.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li className="current">Programming Courses</li>
        </ol></div></nav>
      </div>

      {!user && (
        <div className="container mt-3">
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <span>
              <Link to="/login" className="alert-link">Log in</Link> to track your progress and save quiz scores.
            </span>
          </div>
        </div>
      )}

      <section className="section">
        <div className="container">
          <div className="row g-4">
            {courses.map(course => {
              const p = progress[course.id]
              const avgScore = p ? Math.round(p.average_score || 0) : 0
              const attempts = p?.total_attempts || 0
              const weeksAttempted = p?.weeks_attempted || 0

              return (
                <div key={course.id} className="col-lg-6 col-md-12" data-aos="fade-up">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div className="card-body p-4">
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div style={{
                          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                          background: `${course.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <i className={`bi ${course.icon} fs-3`} style={{ color: course.color }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <h4 className="mb-1 fw-bold">{course.title}</h4>
                          <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{course.description}</p>
                        </div>
                      </div>

                      {/* Feature tags */}
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {course.features.map(f => (
                          <span key={f} className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>{f}</span>
                        ))}
                      </div>

                      {/* Progress bar */}
                      {user && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">
                              {attempts > 0 ? `${weeksAttempted} / ${course.totalWeeks} weeks attempted` : 'Not started yet'}
                            </small>
                            {attempts > 0 && (
                              <small className="fw-bold" style={{ color: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore >= 40 ? '#ffc107' : '#dc3545' }}>
                                {avgScore}% avg
                              </small>
                            )}
                          </div>
                          <div className="progress" style={{ height: 6 }}>
                            <div className="progress-bar"
                              style={{
                                width: `${course.totalWeeks > 0 ? Math.round((weeksAttempted / course.totalWeeks) * 100) : 0}%`,
                                backgroundColor: course.color
                              }} />
                          </div>
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-3">
                        <Link
                          to={`/programming/courses/${course.id}`}
                          className="btn btn-primary flex-grow-1"
                          style={{ background: course.color, borderColor: course.color }}>
                          <i className="bi bi-book me-2"></i>View Course
                        </Link>
                        <span className="badge bg-light text-muted border align-self-center px-3 py-2">
                          {course.totalWeeks} weeks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Programming
