import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const Statistics = () => {
  const navigate = useNavigate()
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])

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
      const res = await axios.get(`${API_URL}/api/statistics_scores?email=${encodeURIComponent(email)}`, { withCredentials: true })
      if (res.data.success && res.data.data?.quizScores) {
        setScores(res.data.data.quizScores)
      }
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  // topic endpoints exactly as in the HTML quiz files
  const availableTopics = [
    {
      id: 'quiz1_midterm',
      name: 'Quiz 1 Midterm',
      displayName: 'Quiz 1 Midterm',
      description: 'Cumulative assessment on all Stats 1 topics',
      icon: 'bi-trophy',
      url: '/courses/statistics/quiz/Quiz1_midterm',
      linkState: { quizName: 'Quiz 1 Midterm' }
    },
    {
      id: 'week1',
      name: 'Basics of Data',
      displayName: 'Week 1 - Basics of Data',
      description: 'Types of data, scales of measurement, data collection',
      icon: 'bi-database',
      url: '/courses/statistics/quiz/Basics of Data',
      linkState: { quizName: 'Week 1 - Basics of Data' }
    },
    {
      id: 'week2',
      name: 'Categorical Analysis',
      displayName: 'Week 2 - Categorical Analysis',
      description: 'Frequency tables, bar charts, pie charts, cross-tabulation',
      icon: 'bi-bar-chart',
      url: '/courses/statistics/quiz/Categorical Analysis',
      linkState: { quizName: 'Week 2 - Categorical Analysis' }
    },
    {
      id: 'week3',
      name: 'Descriptive Statistics',
      displayName: 'Week 3 - Descriptive Statistics',
      description: 'Mean, median, mode, variance, standard deviation',
      icon: 'bi-graph-up',
      url: '/courses/statistics/quiz/Descriptive Statistics',
      linkState: { quizName: 'Week 3 - Descriptive Statistics' }
    },
    {
      id: 'week4',
      name: 'Variable Association',
      displayName: 'Week 4 - Variable Association',
      description: 'Correlation, scatter plots, regression introduction',
      icon: 'bi-arrow-left-right',
      url: '/courses/statistics/quiz/Variable Association',
      linkState: { quizName: 'Week 4 - Variable Association' }
    },
    {
      id: 'week5',
      name: 'Counting and Factorial',
      displayName: 'Week 5 - Counting and Factorial',
      description: 'Counting principles, factorials, combinations, permutations',
      icon: 'bi-123',
      url: '/courses/statistics/quiz/week-5 - Counting_and_Factorial',
      linkState: { quizName: 'Week 5 - Counting and Factorial' }
    },
    {
      id: 'week6',
      name: 'Permutations and Combinations',
      displayName: 'Week 6 - Permutations and Combinations',
      description: 'nPr, nCr, binomial theorem applications',
      icon: 'bi-shuffle',
      url: '/courses/statistics/quiz/week-6_permutations_and_combinations',
      linkState: { quizName: 'Week 6 - Permutations and Combinations' }
    },
    {
      id: 'week7',
      name: 'Probability',
      displayName: 'Week 7 - Probability',
      description: 'Probability rules, events, sample space, addition theorem',
      icon: 'bi-pie-chart',
      url: '/courses/statistics/quiz/week_7_probability',
      linkState: { quizName: 'Week 7 - Probability' }
    },
    {
      id: 'week8',
      name: 'Conditional Probability',
      displayName: 'Week 8 - Conditional Probability',
      description: "Conditional probability, Bayes' theorem, independence",
      icon: 'bi-diagram-3',
      url: '/courses/statistics/quiz/conditional_probability',
      linkState: { quizName: 'Week 8 - Conditional Probability' }
    }
  ]

  // Match saved scores to topics using flexible topic name matching
  const topicGroups = {
    'Quiz 1 Midterm':                    ['Quiz1_midterm','Quiz1 midterm','quiz1_midterm'],
    'Week 1 - Basics of Data':           ['Basics of Data','Basics%20of%20Data','basics_of_data'],
    'Week 2 - Categorical Analysis':     ['Categorical Analysis','Categorical%20Analysis','categorical_analysis'],
    'Week 3 - Descriptive Statistics':   ['Descriptive Statistics','Descriptive%20Statistics','descriptive_statistics'],
    'Week 4 - Variable Association':     ['Variable Association','Variable%20Association','variable_association'],
    'Week 5 - Counting and Factorial':   ['week-5 - Counting_and_Factorial','Counting_and_Factorial','counting_and_factorial'],
    'Week 6 - Permutations and Combinations': ['week-6_permutations_and_combinations','permutations_and_combinations'],
    'Week 7 - Probability':              ['week_7_probability','probability','Probability'],
    'Week 8 - Conditional Probability':  ['conditional_probability','Conditional Probability','Conditional%20Probability']
  }

  const findTopicAssessment = (topicId) => {
    if (!scores?.length) return null
    const topic = availableTopics.find(t => t.id === topicId)
    if (!topic) return null
    const variations = topicGroups[topic.displayName] || [topic.name]

    const matched = scores.filter(score => {
      if (!score?.topic) return false
      const st = score.topic.trim().toLowerCase()
      return variations.some(v => {
        const vl = v.toLowerCase()
        return st === vl || st.includes(vl) || vl.includes(st) ||
               st.replace(/_/g,' ') === vl.replace(/_/g,' ')
      })
    })
    if (!matched.length) return null

    const latest = matched.sort((a,b) => new Date(b.timestamp||0) - new Date(a.timestamp||0))[0]
    let percentage = 0
    if (latest.percentage != null) percentage = Math.round(parseFloat(latest.percentage))
    else if (latest.score != null && latest.totalQuestions) percentage = Math.round((latest.score/latest.totalQuestions)*100)

    return {
      score: percentage, percentage,
      actualScore: latest.score || 0,
      totalQuestions: latest.totalQuestions || 20,
      timestamp: latest.timestamp,
      attemptCount: matched.length
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height:'50vh'}}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{marginBottom:'2rem'}}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>IITM Statistics 1</h1>
                <p className="mb-0">From data basics to probability — comprehensive weekly assessments for IITM Stats 1.</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">IITM Statistics</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px 12px' }} className="d-flex justify-content-end">
          <Link to="/courses/statistics/review" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-clock-history me-1"></i> Review Past Quizzes
          </Link>
        </div>
        <div className="course-list" style={{maxWidth:'900px',margin:'0 auto',padding:'0 15px'}}>
          {availableTopics.map((topic) => {
            const assessment = findTopicAssessment(topic.id)
            const isCompleted = assessment != null
            const score = assessment?.score || 0
            const actualScore = assessment?.actualScore || 0
            const totalQuestions = assessment?.totalQuestions || 20
            const lastAttempted = assessment?.timestamp || null
            const attemptCount = assessment?.attemptCount || 0

            let progressBarClass = 'bg-primary'
            let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
            if (score >= 80)      { progressBarClass='bg-success'; badgeStyle={background:'linear-gradient(45deg,#28a745,#20c997)'} }
            else if (score >= 60) { progressBarClass='bg-info';    badgeStyle={background:'linear-gradient(45deg,#17a2b8,#138496)'} }
            else if (score >= 40) { progressBarClass='bg-warning'; badgeStyle={background:'linear-gradient(45deg,#ffc107,#fd7e14)'} }
            else if (score > 0)   { progressBarClass='bg-danger';  badgeStyle={background:'linear-gradient(45deg,#dc3545,#c82333)'} }

            return (
              <div className="course-item mb-3" key={topic.id}>
                <div className="card course-card h-100 border-0 shadow-sm" style={{borderRadius:'12px',transition:'all 0.3s ease'}}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-lg-1 col-md-2 text-center">
                        <div className={`icon-box ${isCompleted?'bg-success':'bg-primary'} text-white rounded-circle p-2`}
                          style={{width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <i className={`bi ${isCompleted?'bi-check-circle':topic.icon} fs-5`}></i>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{topic.displayName}</h4>
                        <p className="text-muted mb-2 fs-6">{topic.description}</p>
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
                          ? <Link to={topic.url} state={topic.linkState} className="btn btn-primary btn-sm"
                              style={{minWidth:'120px',padding:'0.4rem 1rem',borderRadius:'8px',display:'inline-flex',alignItems:'center',justifyContent:'space-between'}}>
                              <span>Retest</span><i className="bi bi-arrow-clockwise ms-2"></i>
                            </Link>
                          : <Link to={topic.url} state={topic.linkState} className="btn btn-primary btn-sm"
                              style={{minWidth:'120px',padding:'0.4rem 1rem',borderRadius:'8px',display:'inline-flex',alignItems:'center',justifyContent:'space-between'}}>
                              <span>Start Assessment</span><i className="bi bi-arrow-right ms-2"></i>
                            </Link>
                        }
                        {isCompleted && (
                          <div className="mt-2">
                            <small className="text-muted d-block">Score: {actualScore}/{totalQuestions}</small>
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

export default Statistics
