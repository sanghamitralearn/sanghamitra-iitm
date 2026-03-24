import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const availableWeeks = [
  {
    id: 'week5',
    week: 5,
    displayName: 'Week 5 - Linear Algebra',
    description: 'Null space, nullity, rank of matrices, and linear transformations',
    icon: 'bi-calculator',
    url: '/courses/math2/quiz/5',
    linkState: { quizName: 'Week 5 - Linear Algebra' }
  },
  {
    id: 'week6',
    week: 6,
    displayName: 'Week 6 - Vector Spaces',
    description: 'Vector spaces, basis, and dimension',
    icon: 'bi-arrows-angle-expand',
    url: '/courses/math2/quiz/6',
    linkState: { quizName: 'Week 6 - Vector Spaces' }
  },
  {
    id: 'week7',
    week: 7,
    displayName: 'Week 7 - Equivalence',
    description: 'Equivalence, similarity, and inner products',
    icon: 'bi-diagram-3',
    url: '/courses/math2/quiz/7',
    linkState: { quizName: 'Week 7 - Equivalence' }
  },
  {
    id: 'week8',
    week: 8,
    displayName: 'Week 8 - Orthonormal',
    description: 'Orthonormal bases and linear independence',
    icon: 'bi-grid-3x3',
    url: '/courses/math2/quiz/8',
    linkState: { quizName: 'Week 8 - Orthonormal' }
  },
  {
    id: 'week9',
    week: 9,
    displayName: 'Week 9 - Multivariable Calculus',
    description: 'Partial derivatives, gradients, and multivariable calculus',
    icon: 'bi-graph-up',
    url: '/courses/math2/quiz/9',
    linkState: { quizName: 'Week 9 - Multivariable Calculus' }
  },
  {
    id: 'week10',
    week: 10,
    displayName: 'Week 10 - Calculus Continued',
    description: 'Advanced multivariable calculus and applications',
    icon: 'bi-graph-up-arrow',
    url: '/courses/math2/quiz/10',
    linkState: { quizName: 'Week 10 - Calculus Continued' }
  }
]

const Math2 = () => {
  const navigate = useNavigate()
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoreData, setScoreData] = useState(null)

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
      const res = await axios.get(`${API_URL}/api/iitm_math2_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (res.data) setScoreData(res.data)
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  // Find the latest score entry for a given week number
  const findWeekAssessment = (weekNumber) => {
    if (!scoreData?.scores || !Array.isArray(scoreData.scores)) return null
    // Filter all entries for this week, sort by date desc, pick latest
    const weekEntries = scoreData.scores
      .filter(s => s.week === weekNumber)
      .sort((a,b) => new Date(b.dateAttempted||0) - new Date(a.dateAttempted||0))
    if (!weekEntries.length) return null
    const latest = weekEntries[0]
    const percentage = latest.totalQuestions > 0
      ? Math.round((latest.correctAnswers / latest.totalQuestions) * 100)
      : 0
    return {
      percentage,
      totalQuestions: latest.totalQuestions || 0,
      correctAnswers: latest.correctAnswers || 0,
      score: latest.score || 0,
      timestamp: latest.dateAttempted,
      attemptCount: weekEntries.length
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height:'50vh'}}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  if (!user) { navigate('/login', { replace: true }); return null }

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{marginBottom:'2rem'}}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>IITM Mathematics II</h1>
                <p className="mb-0">Linear algebra, vector spaces, and multivariable calculus — weekly assessments for IITM Math 2.</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">IITM Math 2</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div className="course-list" style={{maxWidth:'900px',margin:'0 auto',padding:'0 15px'}}>
          {availableWeeks.map((week) => {
            const assessment = findWeekAssessment(week.week)
            const isCompleted = assessment != null
            const score = assessment?.percentage || 0
            const correctAnswers = assessment?.correctAnswers || 0
            const totalQuestions = assessment?.totalQuestions || 0
            const lastAttempted = assessment?.timestamp || null
            const attemptCount = assessment?.attemptCount || 0

            let progressBarClass = 'bg-primary'
            let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
            if (score >= 80)      { progressBarClass='bg-success'; badgeStyle={background:'linear-gradient(45deg,#28a745,#20c997)'} }
            else if (score >= 60) { progressBarClass='bg-info';    badgeStyle={background:'linear-gradient(45deg,#17a2b8,#138496)'} }
            else if (score >= 40) { progressBarClass='bg-warning'; badgeStyle={background:'linear-gradient(45deg,#ffc107,#fd7e14)'} }
            else if (score > 0)   { progressBarClass='bg-danger';  badgeStyle={background:'linear-gradient(45deg,#dc3545,#c82333)'} }

            return (
              <div className="course-item mb-3" key={week.id}>
                <div className="card course-card h-100 border-0 shadow-sm" style={{borderRadius:'12px',transition:'all 0.3s ease'}}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-lg-1 col-md-2 text-center">
                        <div className={`icon-box ${isCompleted?'bg-success':'bg-primary'} text-white rounded-circle p-2`}
                          style={{width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <i className={`bi ${isCompleted?'bi-check-circle':week.icon} fs-5`}></i>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{week.displayName}</h4>
                        <p className="text-muted mb-2 fs-6">{week.description}</p>
                        <div className="progress" style={{height:'6px',backgroundColor:'#f0f0f0'}}>
                          <div className={`progress-bar ${progressBarClass}`} role="progressbar"
                            style={{width:`${isCompleted?score:0}%`}} aria-valuenow={score} aria-valuemin="0" aria-valuemax="100"/>
                        </div>
                        {lastAttempted
                          ? <small className="text-muted">Last attempt: {new Date(lastAttempted).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small>
                          : <small className="text-muted">Not attempted yet</small>}
                      </div>
                      <div className="col-lg-2 col-md-2 text-center">
                        <span className="percentage-badge" style={{display:'inline-block',padding:'0.3rem 0.8rem',borderRadius:'20px',fontWeight:'600',fontSize:'0.9rem',color:'white',boxShadow:'0 2px 4px rgba(0,123,255,0.3)',...badgeStyle}}>
                          {score}%
                        </span>
                      </div>
                      <div className="col-lg-3 col-md-3 text-end">
                        {isCompleted
                          ? <Link to={week.url} state={week.linkState} className="btn btn-primary btn-sm"
                              style={{minWidth:'120px',padding:'0.4rem 1rem',borderRadius:'8px',display:'inline-flex',alignItems:'center',justifyContent:'space-between'}}>
                              <span>Retest</span><i className="bi bi-arrow-clockwise ms-2"></i>
                            </Link>
                          : <Link to={week.url} state={week.linkState} className="btn btn-primary btn-sm"
                              style={{minWidth:'120px',padding:'0.4rem 1rem',borderRadius:'8px',display:'inline-flex',alignItems:'center',justifyContent:'space-between'}}>
                              <span>Start Assessment</span><i className="bi bi-arrow-right ms-2"></i>
                            </Link>
                        }
                        {isCompleted && (
                          <div className="mt-2">
                            <small className="text-muted d-block">Correct: {correctAnswers}/{totalQuestions}</small>
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
    </main>
  )
}

export default Math2
