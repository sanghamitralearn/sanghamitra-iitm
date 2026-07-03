import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const availableTopics = [
  {
    id: 'Python-basics',
    name: 'Python Basics',
    displayName: 'WEEK 1: Python Codes',
    description: 'Assessment on basic data structures: Lists and Tuples',
    icon: 'bi-list-ul',
    url: '/courses/pdsa/coding/1',
    testUrl: '/courses/pdsa/test/1',
    interviewUrl: '/courses/pdsa/interview/1',
  },
  {
    id: 'Sorting-Algorithms',
    name: 'Sorting Algorithms',
    displayName: 'WEEK 2: Sorting Algorithms',
    description: 'Assessment on Quick Sort, Merge Sort, Selection Sort, Insertion Sort, and Bubble Sort',
    icon: 'bi-diagram-3',
    url: '/courses/pdsa/coding/2',
    testUrl: '/courses/pdsa/test/2',
    interviewUrl: '/courses/pdsa/interview/2',
  },
  {
    id: 'Linear-Data-Structures',
    name: 'Linear Data Structures',
    displayName: 'WEEK 3: Linear Data Structures',
    description: 'Assessment on Linked Lists, Arrays, Stacks, Queues, and Hashing',
    icon: 'bi-arrow-repeat',
    url: '/courses/pdsa/coding/3',
    testUrl: '/courses/pdsa/test/3',
    interviewUrl: '/courses/pdsa/interview/3',
  },
  {
    id: 'Introduction-to-Graphs',
    name: 'Introduction to Graphs',
    displayName: 'WEEK 4: Introduction to Graphs',
    description: 'Assessment on BFS (Breadth-First Search), DFS (Depth-First Search), Directed Acyclic Graphs (DAGs), and Topological Sorting',
    icon: 'bi-diagram-2',
    url: '/courses/pdsa/coding/4',
    testUrl: '/courses/pdsa/test/4',
    interviewUrl: '/courses/pdsa/interview/4',
  },
  {
    id: 'Midterm-1',
    name: 'Midterm-1',
    displayName: 'Midterm-1',
    description: '',
    icon: 'bi-journal-check',
    testUrl: '/courses/pdsa/test/midterm1',
  },
  {
    id: 'Graph-Algorithms',
    name: 'Graph Algorithms',
    displayName: 'WEEK 5: Graph Algorithms',
    description: "Assessment on Dijkstra's Algorithm, Bellman-Ford Algorithm, Floyd-Warshall Algorithm, Prim's Algorithm, and Kruskal's Algorithm",
    icon: 'bi-graph-up',
    url: '/courses/pdsa/coding/5',
    testUrl: '/courses/pdsa/test/5',
    interviewUrl: '/courses/pdsa/interview/5',
  },
  {
    id: 'Advanced-Data-Structures',
    name: 'Advanced Data Structures',
    displayName: 'WEEK 6: Advanced Data Structures',
    description: 'Assessment on Union-Find Data Structure, Priority Queues, Heaps, and Binary Search Trees',
    icon: 'bi-database',
    url: '/courses/pdsa/coding/6',
    testUrl: '/courses/pdsa/test/6',
    interviewUrl: '/courses/pdsa/interview/6',
  },
  {
    id: 'Advanced-Algorithms',
    name: 'Advanced Algorithms',
    displayName: 'WEEK 7: Advanced Algorithms',
    description: 'Assessment on Balanced search tree, Scheduling algorithms, Huffman algorithms.',
    icon: 'bi-cpu',
    url: '/courses/pdsa/coding/7',
    testUrl: '/courses/pdsa/test/7',
    interviewUrl: '/courses/pdsa/interview/7',
  },
  {
    id: 'Divide-and-Conquer-Algorithms',
    name: 'Divide and Conquer Algorithms',
    displayName: 'WEEK 8: Divide and Conquer Algorithms',
    description: 'Assessment on Closest Pair of Points, Integer Multiplication, Recursion Trees, Quick Select/Fast Select Algorithms',
    icon: 'bi-scissors',
    url: '/courses/pdsa/coding/8',
    testUrl: '/courses/pdsa/test/8',
    interviewUrl: '/courses/pdsa/interview/8',
  },
  {
    id: 'Midterm-2',
    name: 'Midterm-2',
    displayName: 'Midterm-2',
    description: '',
    icon: 'bi-journal-check',
    testUrl: '/courses/pdsa/test/midterm2',
  },
  {
    id: 'Dynamic-programming',
    name: 'Dynamic programming',
    displayName: 'WEEK 9: Dynamic programming',
    description: '',
    icon: 'bi-layers',
    url: '/courses/pdsa/coding/9',
    testUrl: '/courses/pdsa/test/9',
    interviewUrl: '/courses/pdsa/interview/9',
  },
  {
    id: 'Linear-Programming',
    name: 'Linear Programming',
    displayName: 'WEEK 10: Linear Programming',
    description: '',
    icon: 'bi-bar-chart-line',
    url: '/courses/pdsa/coding/10',
    testUrl: '/courses/pdsa/test/10',
    interviewUrl: '/courses/pdsa/interview/10',
  },
  {
    id: 'End-Term',
    name: 'End Term',
    displayName: 'End Term',
    description: '',
    icon: 'bi-flag',
    testUrl: '/courses/pdsa/test/endterm',
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

const PDSA = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [codingSubs, setCodingSubs] = useState([])
  const [pdsaSubs, setPdsaSubs] = useState([])
  const [interviewSubs, setInterviewSubs] = useState([])


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

    const [codingRes, pdsaRes, interviewRes] = await Promise.allSettled([
      axios.get(`${API}/api/coding-submissions`, { withCredentials: true }),
      axios.get(`${API}/api/pdsa-submissions`, { withCredentials: true }),
      axios.get(`${API}/api/interview-submissions`, { withCredentials: true }),
    ])

    setCodingSubs(filterByUser(codingRes.status === 'fulfilled' ? codingRes.value.data.submissions : []))
    setPdsaSubs(filterByUser(pdsaRes.status === 'fulfilled' ? pdsaRes.value.data.submissions : []))
    setInterviewSubs(filterByUser(interviewRes.status === 'fulfilled' ? interviewRes.value.data.submissions : []))
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 mb-0">Loading course data...</p>
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
                <h1>IITM-PDSA</h1>
                <p className="mb-0">
                  From basic data structures to advanced algorithms, master problem-solving with Python every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">PDSA</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div style={{ padding: '0 0 12px' }} className="d-flex justify-content-end">
          <Link to="/courses/pdsa/review" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-clock-history me-1"></i> Review Past Submissions
          </Link>
        </div>
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
          let topicsAttempted = 0, overallTotal = 0, codingCount = 0, quizCount = 0, interviewCount = 0
          availableTopics.forEach(topic => {
            const coding    = getMostRecent(codingSubs, topic.name)
            const mcq       = getMostRecent(pdsaSubs, topic.name)
            const interview = getMostRecent(interviewSubs, topic.name)
            const parts = [
              coding    && Math.round(coding.percentage),
              mcq       && Math.round(mcq.percentage),
              interview && Math.round(interview.percentage),
            ].filter(x => x !== false && x !== null && x !== undefined)
            if (parts.length > 0) {
              topicsAttempted++
              overallTotal += Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
            }
            if (coding)    codingCount++
            if (mcq)       quizCount++
            if (interview) interviewCount++
          })
          const avgScore = topicsAttempted > 0 ? Math.round(overallTotal / topicsAttempted) : 0
          const totalTopics = availableTopics.length

          return (
            <div className="row g-3 mb-4" style={{ maxWidth: 900, margin: '0 auto 1.5rem' }}>
              {[
                { label: 'Topics Attempted', value: `${topicsAttempted} / ${totalTopics}`, icon: 'bi-journals', color: '#0d6efd' },
                { label: 'Avg Score', value: `${avgScore}%`, icon: 'bi-bar-chart-line', color: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#17a2b8' : avgScore >= 40 ? '#ffc107' : avgScore > 0 ? '#dc3545' : '#6c757d' },
                { label: 'Coding Done', value: codingCount, icon: 'bi-code-square', color: '#007bff' },
                { label: 'Quiz-Tests Done', value: quizCount, icon: 'bi-card-checklist', color: '#28a745' },
                { label: 'Interviews Done', value: interviewCount, icon: 'bi-mic-fill', color: '#6f42c1' },
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
            const coding    = isAuthenticated ? getMostRecent(codingSubs, topic.name) : null
            const mcq       = isAuthenticated ? getMostRecent(pdsaSubs, topic.name) : null
            const interview = isAuthenticated ? getMostRecent(interviewSubs, topic.name) : null

            const codingPct    = coding    ? Math.round(coding.percentage)    : 0
            const mcqPct       = mcq       ? Math.round(mcq.percentage)       : 0
            const interviewPct = interview ? Math.round(interview.percentage) : 0

            const attempted = coding || mcq || interview
            const parts = [coding && codingPct, mcq && mcqPct, interview && interviewPct].filter(x => x !== false && x !== null)
            const overall = parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0

            const timestamps = [coding, mcq, interview]
              .filter(Boolean)
              .map(s => s.timestamp && new Date(s.timestamp))
              .filter(Boolean)
            const lastDate = timestamps.length > 0
              ? new Date(Math.max(...timestamps)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
                          ? <small className="text-muted d-block mt-1">Last: {lastDate}</small>
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
                          {/* Coding button — only if topic has url */}
                          {topic.url && (
                            isAuthenticated
                              ? <Link to={topic.url}
                                  className={`btn btn-sm d-flex align-items-center justify-content-between ${coding ? 'btn-primary' : 'btn-outline-primary'}`}
                                  style={{ minWidth: 200 }}>
                                  <span>{coding ? `Coding: ${codingPct}%` : 'Start Coding'}</span>
                                  <i className={`bi ${coding ? 'bi-code-square ms-2' : 'bi-arrow-right ms-2'}`}></i>
                                </Link>
                              : <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between"
                                  style={{ minWidth: 200, opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                                  <span>Login Required</span>
                                  <i className="bi bi-lock ms-2"></i>
                                </button>
                          )}

                          {/* Quiz-Test button — if topic has testUrl */}
                          {topic.testUrl && (
                            isAuthenticated
                              ? <Link to={topic.testUrl}
                                  className={`btn btn-sm d-flex align-items-center justify-content-between ${mcq ? '' : 'btn-outline-success'}`}
                                  style={{
                                    minWidth: 200,
                                    ...(mcq ? {
                                      background: 'linear-gradient(45deg, #28a745, #20c997)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 8,
                                    } : {}),
                                  }}>
                                  <span>{mcq ? `Quiz-Test: ${mcqPct}%` : 'Take Quiz-Test'}</span>
                                  <i className={`bi ${mcq ? 'bi-card-checklist ms-2' : 'bi-file-text ms-2'}`}></i>
                                </Link>
                              : <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-between"
                                  style={{ minWidth: 200, opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}>
                                  <span>Login Required</span>
                                  <i className="bi bi-lock ms-2"></i>
                                </button>
                          )}

                          {/* Interview button — if topic has interviewUrl */}
                          {topic.interviewUrl && (
                            isAuthenticated
                              ? <Link to={topic.interviewUrl}
                                  className="btn btn-sm d-flex align-items-center justify-content-between"
                                  style={{
                                    minWidth: 200,
                                    background: interview
                                      ? 'linear-gradient(45deg, #6f42c1, #8a63d2)'
                                      : 'transparent',
                                    color: interview ? 'white' : '#6f42c1',
                                    border: interview ? 'none' : '1px solid #6f42c1',
                                    borderRadius: 8,
                                  }}>
                                  <span>{interview ? `Interview: ${interviewPct}%` : 'Take Interview'}</span>
                                  <i className={`bi ${interview ? 'bi-mic-fill ms-2' : 'bi-mic ms-2'}`}></i>
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
      </div>
    </main>
  )
}

export default PDSA
