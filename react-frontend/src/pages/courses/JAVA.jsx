import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const availableTopics = [
  {
    id: 'java-basics',
    name: 'Java Basics',
    displayName: 'WEEK 1: Java Basics',
    description: 'Assessment on Java fundamentals: Variables, Data Types, Operators, Control Flow, and Basic Syntax',
    icon: 'bi-code-slash',
    testUrl: '/courses/JAVA/1',
  },
  {
    id: 'oop-concepts',
    name: 'OOP Concepts',
    displayName: 'WEEK 2: Object-Oriented Programming',
    description: 'Assessment on Classes, Objects, Inheritance, Polymorphism, Encapsulation, and Abstraction',
    icon: 'bi-diagram-3',
    testUrl: '/courses/JAVA/2',
  },
  {
    id: 'exception-handling',
    name: 'Exception Handling',
    displayName: 'WEEK 3: Exception Handling',
    description: 'Assessment on Try-Catch, Throw, Throws, Finally, and Custom Exceptions',
    icon: 'bi-exclamation-triangle',
    testUrl: '/courses/JAVA/3',
  },
  {
    id: 'collections-framework',
    name: 'Collections Framework',
    displayName: 'WEEK 4: Collections Framework',
    description: 'Assessment on List, Set, Map, Queue, and their implementations (ArrayList, HashSet, HashMap)',
    icon: 'bi-database',
    testUrl: '/courses/JAVA/4',
  },
  {
    id: 'multithreading',
    name: 'Multithreading',
    displayName: 'WEEK 5: Multithreading',
    description: 'Assessment on Threads, Runnable, Synchronization, Locks, and Concurrency Utilities',
    icon: 'bi-cpu',
    testUrl: '/courses/JAVA/5',
  },
  {
    id: 'lambda-expressions',
    name: 'Lambda Expressions',
    displayName: 'WEEK 6: Lambda Expressions',
    description: 'Assessment on Functional Interfaces, Lambda Syntax, Method References, and Streams Basics',
    icon: 'bi-arrow-repeat',
    testUrl: '/courses/JAVA/6',
  },
  {
    id: 'stream-api',
    name: 'Stream API',
    displayName: 'WEEK 7: Stream API',
    description: 'Assessment on Stream Operations, Filtering, Mapping, Reducing, and Collectors',
    icon: 'bi-water',
    testUrl: '/courses/JAVA/7',
  },
  {
    id: 'file-io',
    name: 'File I/O',
    displayName: 'WEEK 8: File I/O',
    description: 'Assessment on FileReader, FileWriter, BufferedReader, BufferedWriter, and NIO Package',
    icon: 'bi-file-text',
    testUrl: '/courses/JAVA/8',
  },
  {
    id: 'jdbc',
    name: 'JDBC',
    displayName: 'WEEK 9: JDBC',
    description: 'Assessment on Database Connectivity, Statement, PreparedStatement, ResultSet, and Transactions',
    icon: 'bi-database-add',
    testUrl: '/courses/JAVA/9',
  },
  {
    id: 'servlets-jsp',
    name: 'Servlets & JSP',
    displayName: 'WEEK 10: Servlets & JSP',
    description: 'Assessment on Servlets, JSP, Session Management, and MVC Architecture',
    icon: 'bi-server',
    testUrl: '/courses/JAVA/10',
  },
  {
    id: 'spring-boot',
    name: 'Spring Boot Basics',
    displayName: 'WEEK 11: Spring Boot Basics',
    description: 'Assessment on Spring Boot Fundamentals, REST APIs, Dependency Injection, and Annotations',
    icon: 'bi-bootstrap',
    testUrl: '/courses/JAVA/11',
  },
  {
    id: 'Midterm-1',
    name: 'Midterm-1',
    displayName: 'Midterm 1 Exam',
    description: 'Comprehensive exam covering Weeks 1-5',
    icon: 'bi-journal-check',
    testUrl: '/courses/JAVA/midterm1',
  },
  {
    id: 'Midterm-2',
    name: 'Midterm-2',
    displayName: 'Midterm 2 Exam',
    description: 'Comprehensive exam covering Weeks 6-8',
    icon: 'bi-journal-check',
    testUrl: '/courses/JAVA/midterm2',
  },
  {
    id: 'End-Term',
    name: 'End Term',
    displayName: 'End Term Exam',
    description: 'Final comprehensive exam covering all weeks',
    icon: 'bi-flag',
    testUrl: '/courses/JAVA/endterm',
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
  if (pct > 0)   return 'linear-gradient(45deg, #dc3545, #c82333)'
  return 'linear-gradient(45deg, #007bff, #0056b3)'
}

function progressClass(pct) {
  if (pct >= 80) return 'bg-success'
  if (pct >= 60) return 'bg-info'
  if (pct >= 40) return 'bg-warning'
  if (pct > 0)   return 'bg-danger'
  return 'bg-primary'
}

const Java = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [javaSubs, setJavaSubs] = useState([])

  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data && res.data.email) {
        const user = { email: res.data.email, username: res.data.username }
        setIsAuthenticated(true)
        await loadCourseData(user)
      } else {
        setIsAuthenticated(false)
      }
    } catch {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadCourseData(user) {
    const filterByUser = (subs) =>
      (subs || []).filter(s => s.email === user.email || s.username === user.username)

    const [javaRes] = await Promise.allSettled([
      axios.get(`${API}/api/java-submission`, { withCredentials: true }),
    ])

    setJavaSubs(filterByUser(javaRes.status === 'fulfilled' ? javaRes.value.data : []))
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 mb-0">Loading Java course data...</p>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Page Title */}
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Java Programming Course</h1>
                <p className="mb-0">
                  Master Java from basics to advanced concepts including OOP, Collections, Multithreading, 
                  and Spring Boot. Perfect for beginners and experienced developers.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">Java Course</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        {/* Auth Warning */}
        {!isAuthenticated && (
          <div className="auth-warning" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>Authentication Required
            </h3>
            <p>You must be logged in to access quizzes, tests, and view your progress.</p>
            <p>
              Please <Link to="/login" style={{ color: '#856404', fontWeight: 'bold' }}>login</Link> to continue or{' '}
              <Link to="/register" style={{ color: '#856404', fontWeight: 'bold' }}>register</Link> if you don't have an account.
            </p>
          </div>
        )}

        {/* Stats Section */}
        {isAuthenticated && (() => {
          let topicsAttempted = 0, overallTotal = 0, quizCount = 0
          availableTopics.forEach(topic => {
            const quiz = getMostRecent(javaSubs, topic.name)
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
                { label: 'Topics Attempted', value: `${topicsAttempted} / ${totalTopics}`, icon: 'bi-journals', color: '#0d6efd' },
                { label: 'Avg Score', value: `${avgScore}%`, icon: 'bi-bar-chart-line', color: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore >= 40 ? '#ffc107' : avgScore > 0 ? '#dc3545' : '#6c757d' },
                { label: 'Quizzes Completed', value: quizCount, icon: 'bi-card-checklist', color: '#28a745' },
                { label: 'Total Points Earned', value: `${Math.round(overallTotal / 100 * 1000)}`, icon: 'bi-trophy', color: '#ffc107' },
              ].map(stat => (
                <div className="col" key={stat.label}>
                  <div className="card border-0 shadow-sm text-center py-3 px-2 h-100" style={{ borderRadius: 12 }}>
                    <i className={`bi ${stat.icon} fs-3 mb-1`} style={{ color: stat.color }}></i>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Course List */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>
          {availableTopics.map(topic => {
            const quiz = isAuthenticated ? getMostRecent(javaSubs, topic.name) : null
            const quizPct = quiz ? Math.round(quiz.percentage) : 0
            const attempted = quiz !== null
            const overall = attempted ? quizPct : 0

            const lastDate = quiz?.timestamp 
              ? new Date(quiz.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : null

            return (
              <div className="course-item mb-3" key={topic.id} style={{ marginBottom: '2rem' }}>
                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      {/* Icon */}
                      <div className="col-lg-1 col-md-2 text-center">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center text-white ${attempted ? 'bg-info' : isAuthenticated ? 'bg-primary' : 'bg-secondary'}`}
                          style={{ width: 40, height: 40 }}
                        >
                          <i className={`bi ${attempted ? 'bi-arrow-repeat' : topic.icon} fs-5`}></i>
                        </div>
                      </div>

                      {/* Topic info */}
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{topic.displayName}</h4>
                        {topic.description && <p className="text-muted mb-2 fs-6">{topic.description}</p>}
                        <div className="progress" style={{ height: 8, backgroundColor: '#e9ecef' }}>
                          <div
                            className={`progress-bar ${isAuthenticated ? progressClass(overall) : 'bg-secondary'}`}
                            role="progressbar"
                            style={{ width: `${isAuthenticated ? overall : 0}%` }}
                          />
                        </div>
                        {isAuthenticated && lastDate
                          ? <small className="text-muted d-block mt-1">Last attempted: {lastDate}</small>
                          : <small className="text-muted d-block mt-1">{isAuthenticated ? 'Not attempted yet' : 'Login to view progress'}</small>
                        }
                      </div>

                      {/* Badge */}
                      <div className="col-lg-2 col-md-2 text-center">
                        <span style={{
                          background: isAuthenticated ? badgeStyle(overall) : 'linear-gradient(45deg, #6c757d, #495057)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          padding: '0.3rem 0.8rem',
                          borderRadius: 20,
                          boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                          display: 'inline-block',
                        }}>
                          {isAuthenticated ? `${overall}%` : 'N/A'}
                        </span>
                      </div>

                      {/* Buttons */}
                      <div className="col-lg-3 col-md-3">
                        <div className="d-flex flex-column align-items-stretch gap-2">
                          {/* Quiz-Test button — all topics have testUrl */}
                          {topic.testUrl && (
                            isAuthenticated
                              ? <Link to={topic.testUrl}
                                  className={`btn btn-sm d-flex align-items-center justify-content-between ${quiz ? '' : 'btn-outline-success'}`}
                                  style={{
                                    minWidth: 200,
                                    ...(quiz ? {
                                      background: 'linear-gradient(45deg, #28a745, #20c997)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 8,
                                    } : {}),
                                  }}>
                                  <span>{quiz ? `Quiz: ${quizPct}%` : 'Take Quiz'}</span>
                                  <i className={`bi ${quiz ? 'bi-card-checklist ms-2' : 'bi-file-text ms-2'}`}></i>
                                </Link>
                              : <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between"
                                  style={{ minWidth: 200, opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                                  <span>Login Required</span>
                                  <i className="bi bi-lock ms-2"></i>
                                </button>
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

        {/* Java Resources Section */}
        {isAuthenticated && (
          <div style={{ maxWidth: '900px', margin: '40px auto 0', padding: '20px' }}>
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body p-4 text-center text-white">
                <i className="bi bi-book-heart fs-1 mb-2"></i>
                <h4 className="mb-2">Additional Resources</h4>
                <p className="mb-3">Practice more with coding challenges and interview preparation materials</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <a 
                    href="https://docs.oracle.com/en/java/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-light"
                  >
                    <i className="bi bi-file-text me-2"></i>
                    Java Documentation
                  </a>
                  <a 
                    href="https://www.w3schools.com/java/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-light"
                  >
                    <i className="bi bi-book me-2"></i>
                    W3Schools Java
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

export default Java