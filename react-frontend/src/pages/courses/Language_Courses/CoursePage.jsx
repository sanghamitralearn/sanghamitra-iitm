import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Per-course config ────────────────────────────────────────────────────────
const COURSE_CONFIG = {
  java: {
    title: 'Java Programming',
    icon: 'bi-cup-hot-fill',
    color: '#f89820',
    description: 'From Java basics to advanced OOP, collections, and real-world patterns.',
    weeks: [
    { 
        week: 1,  
        topic: 'Introduction to Programming',        
        description: 'Types, Memory management, Abstraction and Modularity, Object Oriented Programming, Classes and Objects' 
    },
    { 
        week: 2,  
        topic: 'Introduction to Java',        
        description: 'Basic data types in Java, Control flow in Java, Defining classes and objects in Java, Basic input and output in Java' 
    },
    { 
        week: 3,  
        topic: 'Object Oriented Programming',        
        description: 'Subclasses and Inheritance, Dynamic dispatch and polymorphism, Class Hierarchy' 
    },
    { 
        week: 4,  
        topic: 'Abstract Classes & Interfaces',        
        description: 'Abstract classes, Interfaces, Private classes, Controlled interaction with objects, Callbacks, Iterators' 
    },
    { 
        week: 5,  
        topic: 'Polymorphism & Generics',        
        description: 'Polymorphism, Generic programming, Java Generics and Subtyping, Reflection' 
    },
    { 
        week: 6,  
        topic: 'Collections & Indirection',        
        description: 'Indirection, Collection, MAP' 
    },
    { 
        week: 7,  
        topic: 'Error Handling & Logging',        
        description: 'Errors and Exceptions, Packages, Assertions, Logging' 
    },
    { 
        week: 8,  
        topic: 'Advanced Features',        
        description: 'Cloning, Type interface, Higher order functions, Streams' 
    },
    { 
        week: 9,  
        topic: 'Streams & I/O',        
        description: 'Optional types, Collecting Results from Streams, Input output streams, Serialisation' 
    },
    { 
        week: 10,  
        topic: 'Concurrency Fundamentals',        
        description: 'Concurrency: Threads and processes, Race conditions, Mutual Exclusion, Test and Set, Monitors' 
    },
    { 
        week: 11,  
        topic: 'Concurrent Programming',        
        description: 'Monitoring, Thread, Concurrent Programming, Thread safe collection' 
    },
    { 
        week: 12,  
        topic: 'GUI Programming & Practice',        
        description: 'Graphical interface and event driven programming, Swing toolkit, Activity questions, Practice questions, Graded questions' 
    },
    ],
  },

  
  python: {
    title: 'Python Programming',
    icon: 'bi-filetype-py',
    color: '#3776ab',
    description: 'Python fundamentals to advanced topics for data science and web development.',
    weeks: [
      { week: 1,  topic: 'Python Basics',           description: 'Syntax, variables, data types, operators' },
      { week: 2,  topic: 'Control Flow',            description: 'Conditionals, loops, comprehensions' },
      { week: 3,  topic: 'Functions & Modules',     description: 'def, args/kwargs, modules, packages' },
      { week: 4,  topic: 'Data Structures',         description: 'Lists, tuples, dicts, sets' },
      { week: 5,  topic: 'OOP in Python',           description: 'Classes, inheritance, dunder methods' },
      { week: 6,  topic: 'File Handling & I/O',     description: 'Open, read, write, context managers' },
      { week: 7,  topic: 'Error Handling',          description: 'Exceptions, try/except, custom errors' },
      { week: 8,  topic: 'Libraries & Practice',    description: 'NumPy, Pandas, mixed revision' },
    ],
  },
  sql: {
    title: 'SQL & Databases',
    icon: 'bi-database-fill',
    color: '#4479a1',
    description: 'Database fundamentals, SQL queries, and optimization techniques.',
    weeks: [
      { week: 1, topic: 'SQL Basics',               description: 'SELECT, WHERE, ORDER BY, LIMIT' },
      { week: 2, topic: 'Joins',                    description: 'INNER, LEFT, RIGHT, FULL OUTER joins' },
      { week: 3, topic: 'Aggregate Functions',      description: 'COUNT, SUM, AVG, GROUP BY, HAVING' },
      { week: 4, topic: 'Subqueries & CTEs',        description: 'Nested queries, WITH clause' },
      { week: 5, topic: 'DDL & Data Modeling',      description: 'CREATE, ALTER, DROP, normalization' },
      { week: 6, topic: 'Indexing & Optimization',  description: 'Indexes, EXPLAIN, query tuning' },
      { week: 7, topic: 'Transactions & ACID',      description: 'BEGIN, COMMIT, ROLLBACK, isolation' },
      { week: 8, topic: 'Stored Procedures & Views',description: 'Procedures, triggers, views' },
    ],
  },
  dsa: {
    title: 'Data Structures & Algorithms',
    icon: 'bi-diagram-3-fill',
    color: '#f4b41a',
    description: 'Core DSA concepts essential for coding interviews and problem solving.',
    weeks: [
      { week: 1,  topic: 'Arrays & Strings',        description: 'Traversal, sliding window, two pointers' },
      { week: 2,  topic: 'Linked Lists',            description: 'Singly, doubly, circular lists' },
      { week: 3,  topic: 'Stacks & Queues',         description: 'LIFO/FIFO, deque, monotonic stack' },
      { week: 4,  topic: 'Hashing',                 description: 'Hash maps, hash sets, collision resolution' },
      { week: 5,  topic: 'Binary Trees',            description: 'Traversals, BST, height, diameter' },
      { week: 6,  topic: 'Heaps & Priority Queues', description: 'Min/max heap, heap sort' },
      { week: 7,  topic: 'Graphs',                  description: 'BFS, DFS, topological sort' },
      { week: 8,  topic: 'Sorting Algorithms',      description: 'Merge sort, quick sort, counting sort' },
      { week: 9,  topic: 'Dynamic Programming',     description: 'Memoization, tabulation, classic problems' },
      { week: 10, topic: 'Greedy & Backtracking',   description: 'Interval scheduling, N-queens, subsets' },
      { week: 11, topic: 'Divide & Conquer',        description: 'Binary search, merge sort, matrix multiply' },
      { week: 12, topic: 'Revision & Practice',     description: 'Mixed DSA revision questions' },
    ],
  },
}

function badgeStyle(pct) {
  if (pct >= 80) return 'linear-gradient(45deg, #28a745, #20c997)'
  if (pct >= 60) return 'linear-gradient(45deg, #17a2b8, #138496)'
  if (pct >= 40) return 'linear-gradient(45deg, #ffc107, #fd7e14)'
  if (pct > 0)   return 'linear-gradient(45deg, #dc3545, #c82333)'
  return 'linear-gradient(45deg, #007bff, #0056b3)'
}

function progressBarClass(pct) {
  if (pct >= 80) return 'bg-success'
  if (pct >= 60) return 'bg-info'
  if (pct >= 40) return 'bg-warning'
  if (pct > 0)   return 'bg-danger'
  return 'bg-primary'
}

const CoursePage = () => {
  const { course } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState([])

  const config = COURSE_CONFIG[course?.toLowerCase()]

  useEffect(() => {
    if (!config) { navigate('/programming/courses', { replace: true }); return }
    const init = async () => {
      try {
        const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        if (res.data?.email) {
          setUser(res.data)
          fetchAttempts(res.data.email)
        }
      } catch {
        // not logged in
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [course])

  const fetchAttempts = async (email) => {
    try {
      const res = await axios.get(
        `${API}/api/quiz/attempts?email=${encodeURIComponent(email)}&course=${course.toLowerCase()}`,
        { withCredentials: true }
      )
      if (res.data?.attempts) setAttempts(res.data.attempts)
    } catch {
      // attempts unavailable
    }
  }

  // Get best attempt for a given week
  const getBestAttempt = (weekNum) => {
    const weekAttempts = attempts.filter(a => a.week === weekNum)
    if (!weekAttempts.length) return null
    return weekAttempts.sort((a, b) => b.percentage - a.percentage)[0]
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  if (!config) return null

  // Summary stats
  const weeksAttempted = config.weeks.filter(w => getBestAttempt(w.week)).length
  const totalAttempts = attempts.length
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
    : 0
  const bestScore = attempts.length > 0
    ? Math.round(Math.max(...attempts.map(a => a.percentage)))
    : 0

  return (
    <main className="main">
      {/* Page Title */}
      <div className="page-title" data-aos="fade">
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                <i className={`bi ${config.icon} fs-2`} style={{ color: config.color }}></i>
                <h1 className="mb-0">{config.title}</h1>
              </div>
              <p className="mb-0">{config.description}</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming Courses</Link></li>
          <li className="current">{config.title}</li>
        </ol></div></nav>
      </div>

      <div className="container">
        {/* Auth warning */}
        {!user && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <span>
              <Link to="/login" className="alert-link">Log in</Link> to save your scores and track progress.
            </span>
          </div>
        )}

        {/* Stats row */}
        {user && (
          <div className="row g-3 mb-4" style={{ maxWidth: 820, margin: '0 auto 1.5rem' }}>
            {[
              { label: 'Weeks Attempted', value: `${weeksAttempted} / ${config.weeks.length}`, icon: 'bi-journals', color: '#0d6efd' },
              { label: 'Total Attempts',  value: totalAttempts,  icon: 'bi-arrow-repeat',      color: '#6f42c1' },
              { label: 'Average Score',   value: `${avgScore}%`, icon: 'bi-bar-chart-line',    color: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore > 0 ? '#ffc107' : '#6c757d' },
              { label: 'Best Score',      value: `${bestScore}%`,icon: 'bi-trophy-fill',       color: bestScore >= 80 ? '#28a745' : bestScore >= 60 ? '#17a2b8' : bestScore > 0 ? '#ffc107' : '#6c757d' },
            ].map(stat => (
              <div className="col-6 col-md-3" key={stat.label}>
                <div className="card border-0 shadow-sm text-center py-3 px-2 h-100" style={{ borderRadius: 12 }}>
                  <i className={`bi ${stat.icon} fs-3 mb-1`} style={{ color: stat.color }}></i>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Week list */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 15px' }}>
          {config.weeks.map((w) => {
            const best = user ? getBestAttempt(w.week) : null
            const pct = best ? Math.round(best.percentage) : 0
            const attempted = !!best
            const lastDate = best?.submitted_at
              ? new Date(best.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : null

            return (
              <div key={w.week} className="mb-3">
                <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      {/* Icon */}
                      <div className="col-auto">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{
                            width: 44, height: 44,
                            background: attempted ? config.color : '#dee2e6',
                          }}>
                          {attempted
                            ? <i className="bi bi-check-lg fs-5"></i>
                            : <span className="fw-bold" style={{ color: '#6c757d', fontSize: '0.9rem' }}>{w.week}</span>
                          }
                        </div>
                      </div>

                      {/* Info */}
                      <div className="col">
                        <h5 className="mb-0 fw-semibold" style={{ fontSize: '1rem' }}>
                          Week {w.week}: {w.topic}
                        </h5>
                        <p className="text-muted mb-1" style={{ fontSize: '0.82rem' }}>{w.description}</p>
                        {user && (
                          <>
                            <div className="progress" style={{ height: 5 }}>
                              <div className={`progress-bar ${progressBarClass(pct)}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <small className="text-muted">
                              {lastDate ? `Last attempt: ${lastDate}` : 'Not attempted yet'}
                            </small>
                          </>
                        )}
                      </div>

                      {/* Badge */}
                      {user && (
                        <div className="col-auto text-center">
                          <span style={{
                            display: 'inline-block', padding: '0.25rem 0.75rem',
                            borderRadius: 20, fontWeight: 600, fontSize: '0.88rem',
                            color: 'white', background: badgeStyle(pct),
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}>
                            {pct}%
                          </span>
                        </div>
                      )}

                      {/* Button */}
                      <div className="col-auto">
                        {user
                          ? <Link
                              to={`/quiz/${course}/week/${w.week}`}
                              state={{ quizName: `Week ${w.week}: ${w.topic}`, course, week: w.week }}
                              className="btn btn-sm"
                              style={{
                                background: attempted ? config.color : 'transparent',
                                color: attempted ? '#fff' : config.color,
                                border: `1px solid ${config.color}`,
                                borderRadius: 8, minWidth: 110,
                              }}>
                              {attempted ? <><i className="bi bi-arrow-clockwise me-1"></i>Retake</> : <><i className="bi bi-play-fill me-1"></i>Take Quiz</>}
                            </Link>
                          : <Link to="/login" className="btn btn-sm btn-outline-secondary" style={{ minWidth: 110, opacity: 0.7 }}>
                              <i className="bi bi-lock me-1"></i>Login
                            </Link>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default CoursePage
