import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const availableWeeks = [
  {
    id: 'week1',
    week: 1,
    displayName: 'Week 1 - Multiple Random Variables',
    description: 'Joint distributions, marginal and conditional distributions',
    icon: 'bi-bar-chart',
    url: '/courses/statistics2/quiz/1',
    linkState: { quizName: 'Week 1 - Multiple Random Variables' }
  },
  {
    id: 'week2',
    week: 2,
    displayName: 'Week 2 - Covariance & Correlation',
    description: 'Covariance, correlation, and bivariate distributions',
    icon: 'bi-graph-up',
    url: '/courses/statistics2/quiz/2',
    linkState: { quizName: 'Week 2 - Covariance & Correlation' }
  },
  {
    id: 'week3',
    week: 3,
    displayName: 'Week 3 - Parameter Estimation',
    description: 'Point estimation, MLE, and method of moments',
    icon: 'bi-bullseye',
    url: '/courses/statistics2/quiz/3',
    linkState: { quizName: 'Week 3 - Parameter Estimation' }
  },
  {
    id: 'week4',
    week: 4,
    displayName: 'Week 4 - Interval Estimation',
    description: 'Confidence intervals and sampling distributions',
    icon: 'bi-activity',
    url: '/courses/statistics2/quiz/4',
    linkState: { quizName: 'Week 4 - Interval Estimation' }
  },
  {
    id: 'week5',
    week: 5,
    displayName: 'Week 5 - Hypothesis Testing',
    description: 'Test of significance, p-values, and decision rules',
    icon: 'bi-check2-circle',
    url: '/courses/statistics2/quiz/5',
    linkState: { quizName: 'Week 5 - Hypothesis Testing' }
  },
  {
    id: 'week6',
    week: 6,
    displayName: 'Week 6 - Regression Analysis',
    description: 'Simple and multiple linear regression',
    icon: 'bi-diagram-3',
    url: '/courses/statistics2/quiz/6',
    linkState: { quizName: 'Week 6 - Regression Analysis' }
  }
]

const Statistics2 = () => {
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
      const res = await axios.get(`${API_URL}/api/iitm_stats2_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (res.data) setScoreData(res.data)
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  // Find the latest score entry for a given week number
  const findWeekAssessment = (weekNumber) => {
    if (!scoreData?.scores || !Array.isArray(scoreData.scores)) return null
    const weekScores = scoreData.scores.filter(s => s.week === weekNumber)
    if (!weekScores.length) return null
    const latest = weekScores.sort((a, b) => new Date(b.dateAttempted || 0) - new Date(a.dateAttempted || 0))[0]
    const pct = latest.totalQuestions > 0
      ? Math.round((latest.correctAnswers / latest.totalQuestions) * 100)
      : (latest.score || 0)
    return {
      score: pct,
      percentage: pct,
      correctAnswers: latest.correctAnswers,
      totalQuestions: latest.totalQuestions,
      subtopic: latest.subtopic,
      dateAttempted: latest.dateAttempted,
      attemptCount: weekScores.length
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
        <img src="/img/statistics2.png" alt="Statistics 2" data-aos="fade-in" />
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">Statistics 2 Assessments</h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Advanced statistics — probability distributions, estimation, hypothesis testing, and regression.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/statistics" className="btn-get-started">Back to Statistics</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Weekly Assessments</h2>
          <p>IITM Statistics 2 — Weekly Topics</p>
        </div>

        <div className="container">
          <div style={{ padding: '0 0 12px' }} className="d-flex justify-content-end">
            <Link to="/courses/statistics2/review" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-clock-history me-1"></i> Review Past Quizzes
            </Link>
          </div>
          <div className="row">
            {availableWeeks.map((week, index) => {
              const assessment = findWeekAssessment(week.week)
              const isCompleted = !!assessment
              const score = assessment?.percentage ?? 0
              const correctAnswers = assessment?.correctAnswers ?? 0
              const totalQuestions = assessment?.totalQuestions ?? 0
              const lastAttempted = assessment?.dateAttempted ?? null
              const attemptCount = assessment?.attemptCount ?? 0

              let progressBarClass = 'bg-primary'
              let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
              if (score >= 80) { progressBarClass = 'bg-success'; badgeStyle = { background: 'linear-gradient(45deg,#28a745,#20c997)' } }
              else if (score >= 60) { progressBarClass = 'bg-info'; badgeStyle = { background: 'linear-gradient(45deg,#17a2b8,#138496)' } }
              else if (score >= 40) { progressBarClass = 'bg-warning'; badgeStyle = { background: 'linear-gradient(45deg,#ffc107,#fd7e14)' } }
              else if (score > 0) { progressBarClass = 'bg-danger'; badgeStyle = { background: 'linear-gradient(45deg,#dc3545,#c82333)' } }

              return (
                <div className="col-lg-6 col-md-12 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay={index * 100} key={week.id}>
                  <div className="course-item">
                    <div className="course-content">
                      <div className="row align-items-center">
                        <div className="col-lg-1 col-md-2 text-center">
                          <div className={`icon-box ${isCompleted ? 'bg-success' : 'bg-primary'} text-white rounded-circle p-2`} style={{width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            <i className={`bi ${isCompleted ? 'bi-check-circle' : week.icon} fs-5`}></i>
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-5">
                          <h4 className="mb-1 fs-5">{week.displayName}</h4>
                          <p className="text-muted mb-2 fs-6">{week.description}</p>
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
                          <Link to={week.url} state={week.linkState} className="btn btn-primary btn-sm">
                            {isCompleted ? <><span>Retake</span><i className="bi bi-arrow-clockwise ms-2"></i></> : <><span>Start</span><i className="bi bi-arrow-right ms-2"></i></>}
                          </Link>
                          {isCompleted && (
                            <div className="mt-2">
                              <small className="text-muted d-block">Score: {correctAnswers}/{totalQuestions}</small>
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

export default Statistics2
