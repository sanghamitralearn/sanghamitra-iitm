import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const availableTopics = [
  {
    id: 'python-basics',
    topicKey: 'Python Basics',
    displayName: 'Python Basics',
    description: 'Variables, data types, operators, input/output, and basic Python syntax',
    icon: 'bi-code-slash',
    url: '/courses/pdsa/coding/1'
  },
  {
    id: 'conditionals',
    topicKey: 'conditionals',
    displayName: 'Conditionals',
    description: 'if/elif/else statements, boolean logic, and conditional expressions',
    icon: 'bi-diagram-2',
    url: '/courses/python/coding/conditionals'
  },
  {
    id: 'loops',
    topicKey: 'loops',
    displayName: 'Loops',
    description: 'for loops, while loops, break, continue, and nested loops',
    icon: 'bi-arrow-repeat',
    url: '/courses/python/coding/loops'
  },
  {
    id: 'functions',
    topicKey: 'functions',
    displayName: 'Functions',
    description: 'Defining functions, parameters, return values, and scope',
    icon: 'bi-braces',
    url: '/courses/python/coding/functions'
  },
  {
    id: 'data-types',
    topicKey: 'data_types',
    displayName: 'Data Types',
    description: 'Lists, tuples, sets, dictionaries, and type operations',
    icon: 'bi-collection',
    url: '/courses/python/coding/data-types'
  },
  {
    id: 'ct-foundation',
    topicKey: 'CT_foundation',
    displayName: 'CT Foundation',
    description: 'Computational thinking, algorithms, and problem decomposition',
    icon: 'bi-cpu',
    url: '/courses/python/coding/ct-foundation'
  }
]

const Python = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        fetchScores(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchScores = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/api/coding-submissions?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (res.data?.success) setSubmissions(res.data.data || [])
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  // Find best score for a topic from flat submission list
  const findTopicBest = (topicKey) => {
    const topicSubs = submissions.filter(s =>
      (s.topic || '').toLowerCase() === topicKey.toLowerCase()
    )
    if (!topicSubs.length) return null
    const best = topicSubs.reduce((a, b) => (a.percentage >= b.percentage ? a : b))
    return {
      percentage: Math.round(best.percentage || 0),
      score: best.score,
      maxScore: best.maxScore,
      timestamp: best.timestamp,
      attemptCount: topicSubs.length
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="main">
      <section id="hero" className="hero section">
        <img src="/img/python.png" alt="Python" data-aos="fade-in" />
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">Python Programming Assessments</h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Hands-on Python coding exercises covering fundamentals to data structures and algorithms.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/programming" className="btn-get-started">Back to Programming</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Python Topics</h2>
          <p>Python Programming and Development</p>
        </div>

        <div className="container">
          <div className="row">
            {availableTopics.map((topic, index) => {
              const assessment = findTopicBest(topic.topicKey)
              const isCompleted = !!assessment
              const score = assessment?.percentage ?? 0
              const attemptCount = assessment?.attemptCount ?? 0
              const lastAttempted = assessment?.timestamp ?? null

              let progressBarClass = 'bg-primary'
              let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
              if (score >= 80) { progressBarClass = 'bg-success'; badgeStyle = { background: 'linear-gradient(45deg,#28a745,#20c997)' } }
              else if (score >= 60) { progressBarClass = 'bg-info'; badgeStyle = { background: 'linear-gradient(45deg,#17a2b8,#138496)' } }
              else if (score >= 40) { progressBarClass = 'bg-warning'; badgeStyle = { background: 'linear-gradient(45deg,#ffc107,#fd7e14)' } }
              else if (score > 0) { progressBarClass = 'bg-danger'; badgeStyle = { background: 'linear-gradient(45deg,#dc3545,#c82333)' } }

              return (
                <div className="col-lg-6 col-md-12 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay={index * 100} key={topic.id}>
                  <div className="course-item">
                    <div className="course-content">
                      <div className="row align-items-center">
                        <div className="col-lg-1 col-md-2 text-center">
                          <div className={`icon-box ${isCompleted ? 'bg-success' : 'bg-primary'} text-white rounded-circle p-2`} style={{width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <i className={`bi ${isCompleted ? 'bi-check-circle' : topic.icon} fs-5`}></i>
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-5">
                          <h4 className="mb-1 fs-5">{topic.displayName}</h4>
                          <p className="text-muted mb-2 fs-6">{topic.description}</p>
                          <div className="progress" style={{height:'6px'}}>
                            <div className={`progress-bar ${progressBarClass}`} role="progressbar"
                              style={{width:`${isCompleted ? score : 0}%`}}
                              aria-valuenow={score} aria-valuemin="0" aria-valuemax="100">
                            </div>
                          </div>
                          {lastAttempted
                            ? <small className="text-muted">Last attempt: {new Date(lastAttempted).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'})}</small>
                            : <small className="text-muted">Not attempted yet</small>}
                        </div>
                        <div className="col-lg-2 col-md-2 text-center">
                          <span style={{display:'inline-block',padding:'0.3rem 0.8rem',borderRadius:'20px',fontWeight:'600',fontSize:'0.9rem',color:'white',boxShadow:'0 2px 4px rgba(0,123,255,0.3)',...badgeStyle}}>{score}%</span>
                        </div>
                        <div className="col-lg-3 col-md-3 text-end">
                          <Link to={topic.url} className="btn btn-primary btn-sm">
                            {isCompleted ? <><span>Retake</span><i className="bi bi-arrow-clockwise ms-2"></i></> : <><span>Start</span><i className="bi bi-arrow-right ms-2"></i></>}
                          </Link>
                          {isCompleted && (
                            <div className="mt-2">
                              {attemptCount > 1 && <small className="text-muted d-block">{attemptCount} attempts</small>}
                            </div>
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
      </section>
    </main>
  )
}

export default Python
