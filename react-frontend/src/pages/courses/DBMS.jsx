import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const availableTopics = [
  {
    id: 'introduction-to-dbms',
    name: 'Introduction to DBMS',
    displayName: 'WEEK 1: Introduction to DBMS',
    description: 'Course overview, introduction to databases, uses of DBMS, database applications, drawbacks of file systems, and DBMS prerequisites.',
    icon: 'bi-database',
    testUrl: '/courses/dbms/1',
  },
  {
    id: 'relational-model-basic-sql',
    name: 'Relational Model and Basic SQL',
    displayName: 'WEEK 2: Relational Model and Basic SQL',
    description: 'Assessment on relational model concepts, tables, keys, schemas, and basic SQL queries.',
    icon: 'bi-table',
    testUrl: '/courses/dbms/2',
  },
  {
    id: 'intermediate-advanced-sql',
    name: 'Intermediate and Advanced SQL',
    displayName: 'WEEK 3: Intermediate and Advanced SQL',
    description: 'Assessment on joins, nested queries, aggregation, views, constraints, and advanced SQL concepts.',
    icon: 'bi-code-square',
    testUrl: '/courses/dbms/3',
  },
  {
    id: 'relational-query-languages-database-design',
    name: 'Relational Query Languages and Database Design',
    displayName: 'WEEK 4: Relational Query Languages and Database Design',
    description: 'Assessment on relational algebra, relational calculus, ER models, and database design principles.',
    icon: 'bi-diagram-3',
    testUrl: '/courses/dbms/4',
  },
  {
    id: 'functional-dependency-normal-forms',
    name: 'Functional Dependency and Normal Forms',
    displayName: 'WEEK 5: Functional Dependency and Normal Forms',
    description: 'Assessment on functional dependencies, closure, keys, decomposition, and basic normalization.',
    icon: 'bi-diagram-2',
    testUrl: '/courses/dbms/5',
  },
  {
    id: 'functional-dependency-normal-forms-cont',
    name: 'Functional Dependency and Normal Forms Continued',
    displayName: 'WEEK 6: Functional Dependency and Normal Forms Continued',
    description: 'Assessment on advanced normalization concepts including 2NF, 3NF, BCNF, lossless join, and dependency preservation.',
    icon: 'bi-diagram-2-fill',
    testUrl: '/courses/dbms/6',
  },
  {
    id: 'application-development',
    name: 'Application Development',
    displayName: 'WEEK 7: Application Development',
    description: 'Assessment on database application development, embedded SQL, APIs, transactions in applications, and web database connectivity.',
    icon: 'bi-window',
    testUrl: '/courses/dbms/7',
  },
  {
    id: 'storage-management',
    name: 'Storage Management',
    displayName: 'WEEK 8: Storage Management',
    description: 'Assessment on storage devices, file organization, records, blocks, buffering, and storage structures.',
    icon: 'bi-hdd-stack',
    testUrl: '/courses/dbms/8',
  },
  {
    id: 'indexing-hashing',
    name: 'Indexing and Hashing',
    displayName: 'WEEK 9: Indexing and Hashing',
    description: 'Assessment on ordered indices, B+ trees, hashing, static hashing, dynamic hashing, and index performance.',
    icon: 'bi-search',
    testUrl: '/courses/dbms/9',
  },
  {
    id: 'transactions',
    name: 'Transactions',
    displayName: 'WEEK 10: Transactions',
    description: 'Assessment on ACID properties, schedules, serializability, concurrency control, locks, and transaction management.',
    icon: 'bi-arrow-left-right',
    testUrl: '/courses/dbms/10',
  },
  {
    id: 'backup-recovery',
    name: 'Backup and Recovery',
    displayName: 'WEEK 11: Backup and Recovery',
    description: 'Assessment on failure types, logs, checkpoints, recovery algorithms, backup strategies, and database reliability.',
    icon: 'bi-shield-check',
    testUrl: '/courses/dbms/11',
  },
  {
    id: 'query-optimization-conclusion',
    name: 'Query Optimization and Conclusion',
    displayName: 'WEEK 12: Query Optimization and Conclusion',
    description: 'Assessment on query processing, query optimization, cost estimation, execution plans, and course conclusion.',
    icon: 'bi-speedometer2',
    testUrl: '/courses/dbms/12',
  },
  {
    id: 'Midterm-1',
    name: 'Midterm-1',
    displayName: 'Midterm 1 Exam',
    description: 'Comprehensive exam covering DBMS Weeks 1-5.',
    icon: 'bi-journal-check',
    testUrl: '/courses/dbms/midterm1',
  },
  {
    id: 'Midterm-2',
    name: 'Midterm-2',
    displayName: 'Midterm 2 Exam',
    description: 'Comprehensive exam covering DBMS Weeks 6-8.',
    icon: 'bi-journal-check',
    testUrl: '/courses/dbms/midterm2',
  },
  {
    id: 'End-Term',
    name: 'End Term',
    displayName: 'End Term Exam',
    description: 'Final comprehensive exam covering all DBMS weeks.',
    icon: 'bi-flag',
    testUrl: '/courses/dbms/endterm',
  },
]

function getMostRecent(submissions, topicName) {
  if (!submissions || submissions.length === 0) return null

  const matches = submissions.filter(s => {
    const st = (s.topic || '').trim().toLowerCase()
    const tt = topicName.toLowerCase()
    return st === tt || st.includes(tt) || tt.includes(st)
  })

  if (matches.length === 0) return null

  matches.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))

  return {
    percentage: matches[0].percentage || 0,
    timestamp: matches[0].timestamp,
  }
}

function badgeStyle(pct) {
  if (pct >= 80) return 'linear-gradient(45deg, #28a745, #20c997)'
  if (pct >= 60) return 'linear-gradient(45deg, #17a2b8, #138496)'
  if (pct >= 40) return 'linear-gradient(45deg, #ffc107, #fd7e14)'
  if (pct > 0) return 'linear-gradient(45deg, #dc3545, #c82333)'
  return 'linear-gradient(45deg, #007bff, #0056b3)'
}

function progressClass(pct) {
  if (pct >= 80) return 'bg-success'
  if (pct >= 60) return 'bg-info'
  if (pct >= 40) return 'bg-warning'
  if (pct > 0) return 'bg-danger'
  return 'bg-primary'
}

const DBMS = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dbmsSubs, setDbmsSubs] = useState([])

  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    setLoading(true)

    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })

      if (res.data && res.data.email) {
        setIsAuthenticated(true)
        await loadCourseData(res.data)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadCourseData(user) {
    try {
      const dbmsRes = await axios.get(`${API}/api/dbms-submission`, {
        withCredentials: true,
      })

      const filtered = (dbmsRes.data.data || []).filter(s =>
        s.email === user.email || s.username === user.username
      )

      setDbmsSubs(filtered)
    } catch (error) {
      console.error('Error loading DBMS course data:', error)
      setDbmsSubs([])
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 mb-0">Loading DBMS course data...</p>
      </div>
    )
  }

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>DBMS Course</h1>
                <p className="mb-0">
                  Learn Database Management Systems from basics to advanced concepts including relational model,
                  SQL, normalization, indexing, transactions, recovery, and query optimization.
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">DBMS Course</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        {!isAuthenticated && (
          <div
            className="auth-warning"
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              color: '#856404',
              padding: '1.5rem',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              Authentication Required
            </h3>
            <p>You must be logged in to access quizzes, tests, and view your progress.</p>
            <p>
              Please <Link to="/login" style={{ color: '#856404', fontWeight: 'bold' }}>login</Link> to continue or{' '}
              <Link to="/register" style={{ color: '#856404', fontWeight: 'bold' }}>register</Link> if you do not have an account.
            </p>
          </div>
        )}

        {isAuthenticated && (() => {
          let topicsAttempted = 0
          let overallTotal = 0
          let quizCount = 0

          availableTopics.forEach(topic => {
            const quiz = getMostRecent(dbmsSubs, topic.name)

            if (quiz) {
              topicsAttempted++
              overallTotal += Math.round(quiz.percentage)
              quizCount++
            }
          })

          const avgScore = topicsAttempted > 0 ? Math.round(overallTotal / topicsAttempted) : 0
          const totalTopics = availableTopics.length

          return (
            <div className="row g-3 mb-4" style={{ maxWidth: 900, margin: '0 auto 1.5rem' }}>
              {[
                {
                  label: 'Topics Attempted',
                  value: `${topicsAttempted} / ${totalTopics}`,
                  icon: 'bi-journals',
                  color: '#0d6efd',
                },
                {
                  label: 'Avg Score',
                  value: `${avgScore}%`,
                  icon: 'bi-bar-chart-line',
                  color: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore >= 40 ? '#ffc107' : avgScore > 0 ? '#dc3545' : '#6c757d',
                },
                {
                  label: 'Quizzes Completed',
                  value: quizCount,
                  icon: 'bi-card-checklist',
                  color: '#28a745',
                },
                {
                  label: 'Total Points Earned',
                  value: `${Math.round(overallTotal / 100 * 1000)}`,
                  icon: 'bi-trophy',
                  color: '#ffc107',
                },
              ].map(stat => (
                <div className="col" key={stat.label}>
                  <div
                    className="card border-0 shadow-sm text-center py-3 px-2 h-100"
                    style={{ borderRadius: 12 }}
                  >
                    <i className={`bi ${stat.icon} fs-3 mb-1`} style={{ color: stat.color }}></i>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>
          {availableTopics.map(topic => {
            const quiz = isAuthenticated ? getMostRecent(dbmsSubs, topic.name) : null
            const quizPct = quiz ? Math.round(quiz.percentage) : 0
            const attempted = quiz !== null
            const overall = attempted ? quizPct : 0

            const lastDate = quiz?.timestamp
              ? new Date(quiz.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null

            return (
              <div className="course-item mb-3" key={topic.id} style={{ marginBottom: '2rem' }}>
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                >
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-lg-1 col-md-2 text-center">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                            attempted ? 'bg-info' : isAuthenticated ? 'bg-primary' : 'bg-secondary'
                          }`}
                          style={{ width: 40, height: 40 }}
                        >
                          <i className={`bi ${attempted ? 'bi-arrow-repeat' : topic.icon} fs-5`}></i>
                        </div>
                      </div>

                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{topic.displayName}</h4>

                        {topic.description && (
                          <p className="text-muted mb-2 fs-6">{topic.description}</p>
                        )}

                        <div className="progress" style={{ height: 8, backgroundColor: '#e9ecef' }}>
                          <div
                            className={`progress-bar ${isAuthenticated ? progressClass(overall) : 'bg-secondary'}`}
                            role="progressbar"
                            style={{ width: `${isAuthenticated ? overall : 0}%` }}
                          />
                        </div>

                        {isAuthenticated && lastDate ? (
                          <small className="text-muted d-block mt-1">
                            Last attempted: {lastDate}
                          </small>
                        ) : (
                          <small className="text-muted d-block mt-1">
                            {isAuthenticated ? 'Not attempted yet' : 'Login to view progress'}
                          </small>
                        )}
                      </div>

                      <div className="col-lg-2 col-md-2 text-center">
                        <span
                          style={{
                            background: isAuthenticated
                              ? badgeStyle(overall)
                              : 'linear-gradient(45deg, #6c757d, #495057)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            padding: '0.3rem 0.8rem',
                            borderRadius: 20,
                            boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                            display: 'inline-block',
                          }}
                        >
                          {isAuthenticated ? `${overall}%` : 'N/A'}
                        </span>
                      </div>

                      <div className="col-lg-3 col-md-3">
                        <div className="d-flex flex-column align-items-stretch gap-2">
                          {topic.testUrl && (
                            isAuthenticated ? (
                              <Link
                                to={topic.testUrl}
                                className={`btn btn-sm d-flex align-items-center justify-content-between ${
                                  quiz ? '' : 'btn-outline-success'
                                }`}
                                style={{
                                  minWidth: 200,
                                  ...(quiz
                                    ? {
                                        background: 'linear-gradient(45deg, #28a745, #20c997)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 8,
                                      }
                                    : {}),
                                }}
                              >
                                <span>{quiz ? `Quiz: ${quizPct}%` : 'Take Quiz'}</span>
                                <i className={`bi ${quiz ? 'bi-card-checklist ms-2' : 'bi-file-text ms-2'}`}></i>
                              </Link>
                            ) : (
                              <button
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between"
                                style={{
                                  minWidth: 200,
                                  opacity: 0.5,
                                  cursor: 'not-allowed',
                                  pointerEvents: 'none',
                                }}
                              >
                                <span>Login Required</span>
                                <i className="bi bi-lock ms-2"></i>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {isAuthenticated && (
          <div style={{ maxWidth: '900px', margin: '40px auto 0', padding: '20px' }}>
            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <div className="card-body p-4 text-center text-white">
                <i className="bi bi-book-heart fs-1 mb-2"></i>
                <h4 className="mb-2">Additional Resources</h4>
                <p className="mb-3">
                  Practice more with SQL, database design, normalization, transactions, and query optimization materials.
                </p>

                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <a
                    href="https://www.w3schools.com/sql/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-light"
                  >
                    <i className="bi bi-file-text me-2"></i>
                    SQL Tutorial
                  </a>

                  <a
                    href="https://www.postgresql.org/docs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-light"
                  >
                    <i className="bi bi-book me-2"></i>
                    PostgreSQL Docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default DBMS