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
    // ─── MIDTERM 1 (After Week 4) ────────────────────────────────────────────
    { 
        week: 'midterm1',  
        topic: '📝 Midterm 1',        
        description: 'Comprehensive exam covering Week 1 to Week 4',
        isExam: true,
        examId: 'midterm1',
        examTitle: 'Midterm 1',
        weekRange: '1-4',
        totalQuestions: 20
    },
    { 
        week: 5,  
        topic: 'Polymorphism',        
        description: 'Polymorphism, Generic programming, Java Generics and Subtyping, Reflection' 
    },
    { 
        week: 6,  
        topic: 'The Benefits of Indirection',        
        description: 'Indirection, Collection, Concrete Collections, MAPs' 
    },
    { 
        week: 7,  
        topic: 'Error Handling & Logging',        
        description: 'Errors and Exceptions, Packages, Assertions, Logging' 
    },
    { 
        week: 8,  
        topic: 'Advanced Java Programming',        
        description: 'Cloning, Type interface, Higher order functions, Streams' 
    },
    // ─── MIDTERM 2 (After Week 8) ────────────────────────────────────────────
    { 
        week: 'midterm2',  
        topic: '📝 Midterm 2',        
        description: 'Comprehensive exam covering Week 1 to Week 8',
        isExam: true,
        examId: 'midterm2',
        examTitle: 'Midterm 2',
        weekRange: '1-8',
        totalQuestions: 20
    },
    { 
        week: 9,  
        topic: 'Java I/O and Streams',        
        description: 'Optional types, Collecting Results from Streams, Input output streams, Serialisation' 
    },
    { 
        week: 10,  
        topic: 'Concurrency in Java',        
        description: 'Concurrency: Threads and processes, Race conditions, Mutual Exclusion, Test and Set, Monitors' 
    },
    { 
        week: 11,  
        topic: 'Advanced Concurrency in Java',        
        description: 'Monitoring, Thread, Concurrent Programming, Thread safe collection' 
    },
    { 
        week: 12,  
        topic: 'Java GUI and Event-Driven Programming',        
        description: 'Graphical interface and event driven programming, Swing toolkit, Activity questions, Practice questions, Graded questions' 
    },
    // ─── ENDTERM (After Week 12) ─────────────────────────────────────────────
    { 
        week: 'endterm',  
        topic: '🏆 End Term',        
        description: 'Final comprehensive exam covering Week 1 to Week 12',
        isExam: true,
        examId: 'endterm',
        examTitle: 'End Term',
        weekRange: '1-12',
        totalQuestions: 20
    },
    ],
  },

  
  python: {
    title: 'Programming in Python',
    icon: 'bi-filetype-py',
    color: '#3776ab',
    description: 'Python fundamentals to advanced topics for data science and web development.',
    weeks: [
      { week: 1,  topic: 'Introduction to basics in Python',           description: 'Introduction to Replit, Syntax, variables, data types, operators' },
      { week: 2,  topic: 'Control Flow - Conditionals',            description: '' },
      { week: 3,  topic: 'Control Flow - Loops',     description: '' },
      { week: 4,  topic: 'Matrix Multiplication',         description: '' },
      // ─── MIDTERM 1 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm1',  
        topic: '📝 Midterm 1',        
        description: 'Comprehensive exam covering Week 1 to Week 4',
        isExam: true,
        examId: 'midterm1',
        examTitle: 'Midterm 1',
        weekRange: '1-4',
        totalQuestions: 30
      },
      { week: 5,  topic: 'Introduction to Functions',           description: '' },
      { week: 6,  topic: 'Data Structures',     description: 'LIsts, Sets, Dictionaries, Tuples' },
      { week: 7,  topic: 'Revision Week',          description: '' },
      { week: 8,  topic: 'Introduction to recursion',    description: '' },

      // ─── MIDTERM 2 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm2',  
        topic: '📝 Midterm 2',        
        description: 'Comprehensive exam covering Week 1 to Week 8',
        isExam: true,
        examId: 'midterm2',
        examTitle: 'Midterm 2',
        weekRange: '1-8',
        totalQuestions: 40
      },
      { week: 9,  topic: 'Introduction to File Handling',    description: '' },
      { week: 10,  topic: 'Introduction to Object Oriented Programming',    description: '' },
      { week: 11,  topic: 'Exception handling',    description: '' },
      { week: 12,  topic: 'Revision Week',    description: '' },
       // ─── ENDTERM ──────────────────────────────────────────────────────────
      { 
        week: 'endterm',  
        topic: '🏆 End Term',        
        description: 'Final comprehensive exam covering Week 1 to Week 12',
        isExam: true,
        examId: 'endterm',
        examTitle: 'End Term',
        weekRange: '1-12',
        totalQuestions: 20
      },
    ],
  },
  dbms: {
    title: 'database management systems',
    icon: 'bi-database-fill',
    color: '#4479a1',
    description: 'Database fundamentals, dbms queries, and optimization techniques.',
    weeks: [
      { week: 1, topic: 'Introduction to DBMS',     description: ''},
      { week: 2, topic: 'SQL Fundamentals',         description: '' },
      { week: 3, topic: 'Intermediate SQL',      description: '' },
      { week: 4, topic: 'Entity-Relationship (ER) Model',        description: '' },
      // ─── MIDTERM 1 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm1',  
        topic: '📝 Midterm 1',        
        description: 'Comprehensive exam covering Week 1 to Week 4',
        isExam: true,
        examId: 'midterm1',
        examTitle: 'Midterm 1',
        weekRange: '1-4',
        totalQuestions: 30
      },
      { week: 5, topic: 'Relational Database Design',      description: 'Closure of attributes, Super Keys and Candidate Keys, Lossless Join Decomposition, Canonical Cover, Dependency Preservation' },
      { week: 6, topic: 'Normal Forms',  description: 'Case Study, MVD & 4NF, Design Summary & Temporal Data, Problem solving on normalization, Multivalued Dependency ' },
      { week: 7, topic: 'Application Design and Development',      description: 'Architecture, Web Applications, SQL and Native Language, Python and PostgreSQL, Application Development and Mobile' },
      { week: 8, topic: 'Algorithms and Data Structures',    description: 'Algorithms & Complexity Analysis, Data Structures, Physical Storage, File Structure ' },
      // ─── MIDTERM 2 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm2',  
        topic: '📝 Midterm 2',        
        description: 'Comprehensive exam covering Week 1 to Week 8',
        isExam: true,
        examId: 'midterm2',
        examTitle: 'Midterm 2',
        weekRange: '1-8',
        totalQuestions: 40
      },
      { week: 9,  topic: 'Indexing and Hashing',     description: 'Indexing, Index Design, B Trees' },
      { week: 10, topic: 'Transactions',   description: 'Serializability, Recoverability, Concurrency Control' },
      { week: 11, topic: 'Backup & Recovery',     description: 'Backup, Recovery, RAID' },
      { week: 12, topic: 'Query Processing and Optimization',     description: 'Processing, Optimization, RDBMS Performance & Architecture' },
      
      // ─── ENDTERM ──────────────────────────────────────────────────────────
      { 
        week: 'endterm',  
        topic: '🏆 End Term',        
        description: 'Final comprehensive exam covering Week 1 to Week 12',
        isExam: true,
        examId: 'endterm',
        examTitle: 'End Term',
        weekRange: '1-12',
        totalQuestions: 20
      },
    ],
  },
  pdsa: {
    title: 'Programming, Data Structures & Algorithms',
    icon: 'bi-diagram-3-fill',
    color: '#f4b41a',
    description: 'Core DSA concepts essential for coding interviews and problem solving.',
    weeks: [
      { week: 1,  topic: 'Python Basics',        description: 'Exception handling, Classes and Objects, Why Efficicency matters?' },
      { week: 2,  topic: 'Sorting Algorithms',            description: 'Assessment on Quick Sort, Merge Sort, Selection Sort, Insertion Sort, and Bubble Sort' },
      { week: 3,  topic: 'Linear Data Structures',         description: 'Assessment on Linked Lists, Arrays, Stacks, Queues, and Hashing' },
      { week: 4,  topic: 'Introduction to Graphs',                 description: 'Assessment on BFS (Breadth-First Search), DFS (Depth-First Search), Directed Acyclic Graphs (DAGs), and Topological Sorting' },
      // ─── MIDTERM 1 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm1',  
        topic: '📝 Midterm 1',        
        description: 'Comprehensive exam covering Week 1 to Week 4',
        isExam: true,
        examId: 'midterm1',
        examTitle: 'Midterm 1',
        weekRange: '1-4',
        totalQuestions: 30
      },
      { week: 5,  topic: 'Graph Algorithms', description: "Assessment on Dijkstra's Algorithm, Bellman-Ford Algorithm, Floyd-Warshall Algorithm, Prim's Algorithm, and Kruskal's Algorithm" },
      { week: 6,  topic: 'Advanced Data Structures', description: 'Assessment on Union-Find Data Structure, Priority Queues, Heaps, and Binary Search Trees' },
      { week: 7,  topic: 'Advanced Algorithms',                  description: 'Assessment on Balanced search tree, Scheduling algorithms, Huffman algorithms.' },
      { week: 8,  topic: 'Divide and Conquer Algorithms',      description: 'Assessment on Closest Pair of Points, Integer Multiplication, Recursion Trees, Quick Select/Fast Select Algorithms' },
      // ─── MIDTERM 2 ─────────────────────────────────────────────────────────
      { 
        week: 'midterm2',  
        topic: '📝 Midterm 2',        
        description: 'Comprehensive exam covering Week 1 to Week 8',
        isExam: true,
        examId: 'midterm2',
        examTitle: 'Midterm 2',
        weekRange: '1-8',
        totalQuestions: 20
      },
      { week: 9,  topic: 'Dynamic Programming',     description: 'Assessment on Fibonacci & Staircase Problems, 0/1 Knapsack, Rod Cutting, Longest Increasing Subsequence, Longest Common Subsequence, Matrix Chain Multiplication, Edit Distance, Coin Change Problem, Weighted Interval Scheduling, Grid Path Problems (Minimum Path Sum, Unique Paths), Palindrome Partitioning' },
      { week: 10, topic: 'Linear Programming',   description: 'Assessment on Graphical Method (2 variables), Simplex Method, Duality Theory, Sensitivity Analysis, Transportation Problem, Assignment Problem, Blending Problems, Diet Problems, Production Planning, Resource Allocation, Cutting Stock Problem, Scheduling Problems, Investment Portfolio Optimization, Supply Chain Optimization, Network Flow (Max Flow, Min Cut), Integer Linear Programming, Branch and Bound Method, Game Theory (Zero-Sum Games), Markov Decision Processes, Stochastic Programming' },
      { week: 11, topic: 'Revision & Practice',     description: 'Mixed DSA revision questions' },
      // ─── ENDTERM ──────────────────────────────────────────────────────────
      { 
        week: 'endterm',  
        topic: '🏆 End Term',        
        description: 'Final comprehensive exam covering Week 1 to Week 12',
        isExam: true,
        examId: 'endterm',
        examTitle: 'End Term',
        weekRange: '1-11',
        totalQuestions: 20
      },
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

// ─── Check if a week is an exam ─────────────────────────────────────────────
const isExamWeek = (week) => {
  return typeof week === 'string' && week.startsWith('midterm') || week === 'endterm'
}

const CoursePage = () => {
  const { course } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState([])
  const [codingProgress, setCodingProgress] = useState([])

  const config = COURSE_CONFIG[course?.toLowerCase()]

  useEffect(() => {
    if (!config) { navigate('/programming/courses', { replace: true }); return }
    const init = async () => {
      try {
        const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        if (res.data?.email) {
          setUser(res.data)
          fetchAttempts(res.data.email)
          fetchCodingProgress(res.data.email)
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
        `${API}/api/mcq-quiz/attempts?email=${encodeURIComponent(email)}&course=${course.toLowerCase()}`,
        { withCredentials: true }
      )
      if (res.data?.attempts) setAttempts(res.data.attempts)
    } catch {
      // attempts unavailable
    }
  }

  const fetchCodingProgress = async (email) => {
    try {
      const res = await axios.get(
        `${API}/api/coding-progress?email=${encodeURIComponent(email)}&course=${course.toLowerCase()}`,
        { withCredentials: true }
      )
      if (res.data?.progress) setCodingProgress(res.data.progress)
    } catch {
      // progress unavailable
    }
  }

  // Get best attempt for a given week
  const getBestAttempt = (weekNum) => {
    const weekAttempts = attempts.filter(a => a.week === weekNum)
    if (!weekAttempts.length) return null
    return weekAttempts.sort((a, b) => b.percentage - a.percentage)[0]
  }

  // Get best attempt for an exam (by topic)
  const getBestExamAttempt = (examTitle) => {
    const examAttempts = attempts.filter(a => a.topic && a.topic.includes(examTitle))
    if (!examAttempts.length) return null
    return examAttempts.sort((a, b) => b.percentage - a.percentage)[0]
  }

  // Get coding progress for a given week
  const getCodingProgress = (weekNum) => {
    return codingProgress.find(p => p.week === weekNum) || null
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  if (!config) return null

  // Summary stats - only count regular weeks (not exams)
  const regularWeeks = config.weeks.filter(w => !isExamWeek(w.week))
  const weeksAttempted = regularWeeks.filter(w => getBestAttempt(w.week)).length
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
              { label: 'Weeks Attempted', value: `${weeksAttempted} / ${regularWeeks.length}`, icon: 'bi-journals', color: '#0d6efd' },
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
            const isExam = isExamWeek(w.week)
            
            // For exams, get attempt by topic name
            let best = null
            let attempted = false
            let pct = 0
            let lastDate = null
            
            if (user && isExam) {
              best = getBestExamAttempt(w.examTitle)
              attempted = !!best
              pct = best ? Math.round(best.percentage) : 0
              lastDate = best?.submitted_at
                ? new Date(best.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : null
            } else if (user && !isExam) {
              best = getBestAttempt(w.week)
              attempted = !!best
              pct = best ? Math.round(best.percentage) : 0
              lastDate = best?.submitted_at
                ? new Date(best.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : null
            }

            const codingAttempted = user && !isExam ? !!getCodingProgress(w.week) : false

            // Exam styling
            let examColor = '#6c757d'
            let examIcon = 'bi-clipboard-check'
            let examBadge = ''
            
            if (isExam) {
              if (w.week === 'midterm1') {
                examColor = '#0d6efd'
                examIcon = 'bi-clock-history'
                examBadge = '📝'
              } else if (w.week === 'midterm2') {
                examColor = '#fd7e14'
                examIcon = 'bi-clock'
                examBadge = '📝'
              } else if (w.week === 'endterm') {
                examColor = '#dc3545'
                examIcon = 'bi-trophy'
                examBadge = '🏆'
              }
            }

            // Get exam stats
            const getExamStats = () => {
              if (!user || !isExam) return null
              const examAttempts = attempts.filter(a => a.topic && a.topic.includes(w.examTitle))
              if (!examAttempts.length) return null
              const best = examAttempts.sort((a, b) => b.percentage - a.percentage)[0]
              return best
            }

            const examStats = isExam ? getExamStats() : null

            return (
              <div key={w.week} className="mb-3">
                <div className="card border-0 shadow-sm" style={{ 
                  borderRadius: 12,
                  borderLeft: isExam ? `4px solid ${examColor}` : 'none'
                }}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      {/* Icon */}
                      <div className="col-auto">
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{
                            width: 44, height: 44,
                            background: attempted ? (isExam ? examColor : config.color) : '#dee2e6',
                          }}>
                          {attempted && !isExam
                            ? <i className="bi bi-check-lg fs-5"></i>
                            : attempted && isExam
                            ? <i className="bi bi-check-lg fs-5"></i>
                            : isExam
                            ? <i className={`bi ${examIcon} fs-5`} style={{ color: '#fff' }}></i>
                            : <span className="fw-bold" style={{ color: '#6c757d', fontSize: '0.9rem' }}>{w.week}</span>
                          }
                        </div>
                      </div>

                      {/* Info */}
                      <div className="col">
                        {isExam ? (
                          <>
                            <h5 className="mb-0 fw-semibold" style={{ fontSize: '1rem', color: examColor }}>
                              {examBadge} {w.topic}
                            </h5>
                            <p className="text-muted mb-1" style={{ fontSize: '0.82rem' }}>{w.description}</p>
                            {user && examStats && (
                              <>
                                <div className="progress" style={{ height: 5 }}>
                                  <div className={`progress-bar ${progressBarClass(examStats.percentage)}`}
                                    style={{ width: `${examStats.percentage}%` }} />
                                </div>
                                <small className="text-muted">
                                  Best Score: {Math.round(examStats.percentage)}% | 
                                  Attempts: {attempts.filter(a => a.topic && a.topic.includes(w.examTitle)).length}
                                </small>
                              </>
                            )}
                            {user && !examStats && (
                              <small className="text-muted">Not attempted yet</small>
                            )}
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>

                      {/* Badge - only show for regular weeks or attempted exams */}
                      {user && !isExam && (
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
                      {user && isExam && examStats && (
                        <div className="col-auto text-center">
                          <span style={{
                            display: 'inline-block', padding: '0.25rem 0.75rem',
                            borderRadius: 20, fontWeight: 600, fontSize: '0.88rem',
                            color: 'white', background: badgeStyle(examStats.percentage),
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}>
                            {Math.round(examStats.percentage)}%
                          </span>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="col-auto d-flex flex-column gap-2">
                        {user ? (
                          isExam ? (
                            <Link
                              to={`/quiz/${course}/exam`}
                              state={{ 
                                isExam: true,
                                examId: w.examId,
                                examTitle: w.examTitle,
                                weekRange: w.weekRange,
                                totalQuestions: w.totalQuestions,
                                quizName: `${w.examTitle} (Weeks ${w.weekRange})`
                              }}
                              className="btn btn-sm"
                              style={{
                                background: examStats ? examColor : 'transparent',
                                color: examStats ? '#fff' : examColor,
                                border: `1px solid ${examColor}`,
                                borderRadius: 8, minWidth: 130,
                              }}>
                              {examStats ? <><i className="bi bi-arrow-clockwise me-1"></i>Retake {w.examTitle}</> : <><i className="bi bi-play-fill me-1"></i>Start {w.examTitle}</>}
                            </Link>
                          ) : (
                            <>
                              <Link
                                to={`/quiz/${course}/week/${w.week}`}
                                state={{ quizName: `Week ${w.week}: ${w.topic}`, course, week: w.week }}
                                className="btn btn-sm"
                                style={{
                                  background: attempted ? config.color : 'transparent',
                                  color: attempted ? '#fff' : config.color,
                                  border: `1px solid ${config.color}`,
                                  borderRadius: 8, minWidth: 130,
                                }}>
                                {attempted ? <><i className="bi bi-arrow-clockwise me-1"></i>Retake MCQ</> : <><i className="bi bi-play-fill me-1"></i>Take MCQ Quiz</>}
                              </Link>
                              <Link
                                to={`/coding/${course}/week/${w.week}`}
                                state={{ quizName: `Week ${w.week}: ${w.topic}`, course, week: w.week }}
                                className="btn btn-sm"
                                style={{
                                  background: codingAttempted ? '#343a40' : 'transparent',
                                  color: codingAttempted ? '#fff' : '#343a40',
                                  border: '1px solid #343a40',
                                  borderRadius: 8, minWidth: 130,
                                }}>
                                {codingAttempted ? <><i className="bi bi-arrow-clockwise me-1"></i>Retake Coding</> : <><i className="bi bi-code-slash me-1"></i>Take Coding Quiz</>}
                              </Link>
                            </>
                          )
                        ) : (
                          <Link to="/login" className="btn btn-sm btn-outline-secondary" style={{ minWidth: 130, opacity: 0.7 }}>
                            <i className="bi bi-lock me-1"></i>Login
                          </Link>
                        )}
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
