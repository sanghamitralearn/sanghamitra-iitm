import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const IIITMMath = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Check auth first — redirect immediately if not logged in
      const authCheck = await axios.get(`${import.meta.env.VITE_API_URL}/api/check-auth`, {
        withCredentials: true,
      })
      if (!authCheck.data.authenticated) {
        navigate('/login', { state: { from: { pathname: '/courses/IIITM-math' } }, replace: true })
        return
      }

      // Fetch user session info
      const sessionResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/session-info`, {
        withCredentials: true
      })
      
      setUser(sessionResponse.data)
      fetchScores(sessionResponse.data.email)
      
    } catch (error) {
      console.error('Error checking authentication:', error)
      navigate('/login', { state: { from: { pathname: '/courses/IIITM-math' } }, replace: true })
    } finally {
      setLoading(false)
    }
  }


  const fetchScores = async (email) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/iitmmath_scores?email=${encodeURIComponent(email)}`, {
        withCredentials: true
      })
      
      if (response.data.success && response.data.data && response.data.data.quizScores) {
        setScores(response.data.data.quizScores)
      }
    } catch (err) {
      console.error('Error fetching scores:', err)
      setError('Failed to load assessment data')
    }
  }

  const getDisplayTopic = (topicName) => {
    if (!topicName) return null
    
    const searchName = topicName.toLowerCase().trim()
    
    const topicGroups = {
      'Week 1 and 2 (Quiz 1)': ['Domain_and_Range', 'Quiz1', 'Week 1 and 2', 'Week1_and_Week2'],
      'Domain and Range (Week 1)': ['Domain_and_Range-2', 'Quiz2', 'Quiz2_Domain_Range', 'Domain and Range-2', 'Domain_and_Range_2'],
      'Linear Functions (Week 2)': ['Quiz3', 'Quiz3_Linear_functions', 'Linear_functions', 'Linear_Functions'],
      'Quadratic Functions (Week 3)': ['Quiz4', 'quadratic', 'Quadratic_functions', 'Quadratic_Functions'],
      'Linear function (Week 2)': ['Quiz5', 'Linear', 'Linear_functions - 2', 'Linear_functions-2'],
      'Sets and Relations (Week 1)': ['Quiz6', 'Sets', 'Relations', 'sets_and_relations', 'Sets And Relations', 'Sets_and_Relations'],
      'Polynomials (Week 4)': ['Quiz7', 'Polynomials', 'Polynomial Function', 'Polynomial_Function'],
      'Exponential Functions (Week-5)': ['Quiz8', 'function_concepts', 'Exponential', 'Function Concepts', 'Function_Concepts'],
      'Logarithmic Functions (Week 6)': ['Quiz9', 'Logarithmic', 'logarithmic_functions', 'Logarithmic Functions', 'Logarithmic_Functions'],
      'Sequence and limit (Week 7)': ['Quiz10', 'Function_Limits', 'Function Limits'],
      'Limits, Continuity and Differentiation (Week 8)': ['Quiz11', 'Limit_Concepts', 'Differentiation'],
      'Derivatives and Integrals (Week 9)': ['Quiz12', 'Derivatives_Integrals', 'Derivatives and Integrals', 'Derivatives', 'Integrals'],
      'Graph Theory (Week 10)': ['Quiz13', 'graph_theory', 'Graph Theory', 'Graph_Theory'],
      'Graph Properties (Week 11)': ['Quiz14', 'graph_properties', 'Graph Properties', 'Graph_Properties']
    }

    for (const [displayTopic, variations] of Object.entries(topicGroups)) {
      for (const variation of variations) {
        const variationLower = variation.toLowerCase()
        if (variationLower === searchName ||
            searchName.includes(variationLower) ||
            variationLower.includes(searchName) ||
            searchName.replace(/_/g, ' ') === variationLower.replace(/_/g, ' ')) {
          return displayTopic
        }
      }
    }
    return topicName
  }

  const findTopicAssessment = (topicName) => {
    if (!scores || !Array.isArray(scores)) return null

    const displayTopic = getDisplayTopic(topicName)
    const variations = topicGroups[displayTopic] || [topicName]
    
    let allTopicScores = []
    
    scores.forEach(score => {
      if (!score || !score.topic) return
      
      const scoreTopic = score.topic.trim()
      const scoreTopicLower = scoreTopic.toLowerCase()
      
      for (const variation of variations) {
        const variationLower = variation.toLowerCase()
        
        if (scoreTopicLower === variationLower ||
            scoreTopicLower.includes(variationLower) ||
            variationLower.includes(scoreTopicLower)) {
          
          if (score.percentage !== undefined && score.percentage !== null) {
            allTopicScores.push({
              ...score,
              displayTopic: displayTopic,
              matchedVariation: variation
            })
          }
          break
        }
      }
    })

    if (allTopicScores.length === 0) return null

    const latestScore = allTopicScores.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0)
      const dateB = new Date(b.timestamp || 0)
      return dateB - dateA
    })[0]
    
    if (!latestScore) return null
    
    let percentage = 0
    if (latestScore.percentage !== undefined && latestScore.percentage !== null) {
      percentage = Math.round(parseFloat(latestScore.percentage))
    } else if (latestScore.score !== undefined && latestScore.totalQuestions) {
      percentage = Math.round((latestScore.score / latestScore.totalQuestions) * 100)
    }
    
    return {
      displayName: displayTopic,
      score: percentage,
      percentage: percentage,
      timeTaken: null,
      timestamp: latestScore.timestamp,
      totalQuestions: latestScore.totalQuestions || 15,
      actualScore: latestScore.score || 0,
      answers: latestScore.answers,
      attemptCount: allTopicScores.length,
      originalTopic: latestScore.topic
    }
  }

  // topic = exact DB topic name (endpoint) from /api/iitm-math-questions/:topic
  // linkState is passed to the quiz page via React Router state
  const QUIZ1_MIDTERM_TOPICS = [
    { name: 'Domain and Range',   endpoint: 'Domain and Range' },
    { name: 'Quadratic Functions', endpoint: 'quadratic_functions' },
    { name: 'Linear Functions',   endpoint: 'linear_functions' },
    { name: 'Sets and Relations', endpoint: 'sets_and_relations' },
    { name: 'Polynomials',        endpoint: 'Polynomials' }
  ]

  const availableTopics = [
    {
      id: 'quiz1_midterm',
      name: 'Quiz 1 Midterm',
      displayName: 'Quiz 1 Midterm',
      description: '50 questions across 5 topics: Domain & Range, Quadratics, Linear, Sets, Polynomials',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Quiz1_Midterm',
      linkState: { quizName: 'Quiz 1 Midterm', topics: QUIZ1_MIDTERM_TOPICS, countPerTopic: 10 }
    },
    {
      id: 'quiz18_midterm2',
      name: 'Quiz 1 Midterm - 2',
      displayName: 'Quiz 1 Midterm - 2',
      description: 'Assessment on IITM Math 1 - Quiz 1 Midterm - 2',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Quiz1_midterm',
      linkState: { quizName: 'Quiz 1 Midterm - 2' }
    },
    {
      id: 'sets_relations',
      name: 'Sets and Relations (Quiz 6)',
      displayName: 'Week 1 - Sets and Relations',
      description: 'Assessment on IITM Math 1 - Sets and Relations',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/sets_and_relations',
      linkState: { quizName: 'Week 1 - Sets and Relations' }
    },
    {
      id: 'domain_range',
      name: 'Domain and Range (Week 1)',
      displayName: 'Week 1 - Domain and Range',
      description: 'Assessment on IITM Math 1 - Domain and Range',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Domain and Range',
      linkState: { quizName: 'Week 1 - Domain and Range' }
    },
    {
      id: 'linear_functions',
      name: 'Linear Functions (Quiz 5)',
      displayName: 'Week 2 - Linear Functions',
      description: 'Assessment on IITM Math 1 - Linear Functions',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/linear_functions',
      linkState: { quizName: 'Week 2 - Linear Functions' }
    },
    {
      id: 'quadratic_functions',
      name: 'Quadratic Functions (Quiz 4)',
      displayName: 'Week 3 - Quadratic Functions',
      description: 'Assessment on IITM Math 1 - Quadratic Functions',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/quadratic_functions',
      linkState: { quizName: 'Week 3 - Quadratic Functions' }
    },
    {
      id: 'polynomial_zeros',
      name: 'Polynomial Zeros (Quiz 15)',
      displayName: 'Week 4 - Polynomial Zeros & Multiplicity',
      description: 'Assessment on polynomial zeros and multiplicity',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/polynomial_zeros_and_multiplicity',
      linkState: { quizName: 'Week 4 - Polynomial Zeros & Multiplicity' }
    },
    {
      id: 'polynomials',
      name: 'Polynomials (Quiz 7)',
      displayName: 'Week 4 - Polynomial Functions',
      description: 'Assessment on IITM Math 1 - Polynomial Functions',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Polynomials',
      linkState: { quizName: 'Week 4 - Polynomial Functions' }
    },
    {
      id: 'exponential_functions',
      name: 'Exponential Functions (Quiz 8)',
      displayName: 'Week 5 - Exponential Functions',
      description: 'Assessment on IITM Math 1 - Exponential Functions',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/exponential_function',
      linkState: { quizName: 'Week 5 - Exponential Functions' }
    },
    {
      id: 'composite_function',
      name: 'Composite Function (Quiz 16)',
      displayName: 'Week 5 - Composite Function',
      description: 'Assessment on IITM Math 1 - Composite Function',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/composite_function',
      linkState: { quizName: 'Week 5 - Composite Function' }
    },
    {
      id: 'inverse_function',
      name: 'Inverse Function (Quiz 17)',
      displayName: 'Week 5 - Inverse Function',
      description: 'Assessment on IITM Math 1 - Inverse Function',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/inverse_function',
      linkState: { quizName: 'Week 5 - Inverse Function' }
    },
    {
      id: 'logarithmic_functions',
      name: 'Logarithmic Functions (Quiz 9)',
      displayName: 'Week 6 - Logarithmic Functions',
      description: 'Assessment on IITM Math 1 - Logarithmic Functions',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/logarithmic_functions',
      linkState: { quizName: 'Week 6 - Logarithmic Functions' }
    },
    {
      id: 'sequence',
      name: 'Sequence (Quiz 19)',
      displayName: 'Week 7 - Sequence',
      description: 'Assessment on Sequence',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/sequences',
      linkState: { quizName: 'Week 7 - Sequence' }
    },
    {
      id: 'sequence_limits',
      name: 'Sequence and Limits (Quiz 10)',
      displayName: 'Week 7 - Sequence and Limits',
      description: 'Assessment on Sequence, Limits and Continuity',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Function_Limits',
      linkState: { quizName: 'Week 7 - Sequence and Limits' }
    },
    {
      id: 'limits_continuity',
      name: 'Limits, Continuity and Differentiation (Quiz 11)',
      displayName: 'Week 8 - Limits, Continuity and Differentiation',
      description: 'Assessment on Limits, Continuity and Differentiation',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Limit Concepts',
      linkState: { quizName: 'Week 8 - Limits, Continuity & Differentiation' }
    },
    {
      id: 'derivatives_integrals',
      name: 'Derivatives and Integrals (Quiz 12)',
      displayName: 'Week 9 - Derivatives and Integrals',
      description: 'Assessment on Derivatives and Integrals',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/Derivatives and Integrals',
      linkState: { quizName: 'Week 9 - Derivatives and Integrals' }
    },
    {
      id: 'graph_theory',
      name: 'Graph Theory (Quiz 13)',
      displayName: 'Week 10 - Graph Theory',
      description: 'Assessment on Graph Theory',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/graph_theory',
      linkState: { quizName: 'Week 10 - Graph Theory' }
    },
    {
      id: 'graph_properties',
      name: 'Graph Properties (Quiz 14)',
      displayName: 'Week 11 - Graph Properties',
      description: 'Assessment on Graph Properties',
      icon: 'bi-cpu',
      url: '/courses/IIITM-math/quiz/graph_properties',
      linkState: { quizName: 'Week 11 - Graph Properties' }
    }
  ]

  const topicGroups = {
    'Quiz 1 Midterm': ['Quiz1_Midterm', 'Domain_and_Range', 'Quiz1', 'Week 1 and 2', 'Week1_and_Week2', 'Domain and Range', 'quadratic_functions', 'linear_functions', 'sets_and_relations', 'Polynomials'],
    'Quiz 1 Midterm - 2': ['Quiz1_midterm', 'Quiz1_Midterm_2'],
    'Week 1 - Sets and Relations': ['sets_and_relations', 'Quiz6', 'Sets', 'Relations', 'Sets And Relations', 'Sets_and_Relations'],
    'Week 1 - Domain and Range': ['Domain and Range', 'Domain_and_Range', 'Domain_and_Range-2', 'Quiz2', 'Domain and Range-2'],
    'Week 2 - Linear Functions': ['linear_functions', 'Linear_functions', 'Quiz3', 'Quiz5', 'Linear_functions-2'],
    'Week 3 - Quadratic Functions': ['quadratic_functions', 'Quadratic_functions', 'Quiz4', 'quadratic'],
    'Week 4 - Polynomial Zeros & Multiplicity': ['polynomial_zeros_and_multiplicity', 'Polynomial_Zeros', 'Quiz15'],
    'Week 4 - Polynomial Functions': ['Polynomials', 'Polynomial_Function', 'Polynomial Function', 'Quiz7'],
    'Week 5 - Exponential Functions': ['exponential_function', 'Function_Concepts', 'function_concepts', 'Exponential', 'Quiz8'],
    'Week 5 - Composite Function': ['composite_function', 'Composite_Function', 'Quiz16'],
    'Week 5 - Inverse Function': ['inverse_function', 'Inverse_function', 'Quiz17'],
    'Week 6 - Logarithmic Functions': ['logarithmic_functions', 'Logarithmic_Functions', 'Logarithmic', 'Quiz9'],
    'Week 7 - Sequence': ['sequences', 'Sequence', 'Quiz19'],
    'Week 7 - Sequence and Limits': ['Function_Limits', 'Function Limits', 'Quiz10'],
    'Week 8 - Limits, Continuity and Differentiation': ['Limit Concepts', 'Limit_Concepts', 'Differentiation', 'Quiz11'],
    'Week 9 - Derivatives and Integrals': ['Derivatives and Integrals', 'Derivatives_Integrals', 'Derivatives', 'Integrals', 'Quiz12'],
    'Week 10 - Graph Theory': ['graph_theory', 'Graph_Theory', 'Graph Theory', 'Quiz13'],
    'Week 11 - Graph Properties': ['graph_properties', 'Graph_Properties', 'Graph Properties', 'Quiz14']
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

  if (!user) {
    navigate('/login', { state: { from: { pathname: '/courses/IIITM-math' } }, replace: true })
    return (
      <div className="container text-center" style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Redirecting to login...</span>
        </div>
        <p className="lead mt-3">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Page Title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>IITM math</h1>
                <p className="mb-0">From basic concepts to advanced IITM math 1 techniques, we guide you every step of the way.</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">IITM math</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div className="course-list" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>
          {availableTopics.map((topic) => {
            const topicAssessment = findTopicAssessment(topic.name)
            const isCompleted = topicAssessment && topicAssessment.score !== undefined && topicAssessment.score !== null
            const score = topicAssessment ? Math.round(topicAssessment.score || 0) : 0
            const actualScore = topicAssessment ? topicAssessment.actualScore : 0
            const totalQuestions = topicAssessment ? topicAssessment.totalQuestions : 15
            const lastAttempted = topicAssessment ? topicAssessment.timestamp : null
            const attemptCount = topicAssessment ? topicAssessment.attemptCount : 0
            const displayName = topicAssessment?.displayName || topic.displayName || topic.name

            let progressBarClass = 'bg-primary'
            let badgeStyle = { background: 'linear-gradient(45deg, #007bff, #0056b3)' }

            if (score >= 80) {
              progressBarClass = 'bg-success'
              badgeStyle = { background: 'linear-gradient(45deg, #28a745, #20c997)' }
            } else if (score >= 60) {
              progressBarClass = 'bg-info'
              badgeStyle = { background: 'linear-gradient(45deg, #17a2b8, #138496)' }
            } else if (score >= 40) {
              progressBarClass = 'bg-warning'
              badgeStyle = { background: 'linear-gradient(45deg, #ffc107, #fd7e14)' }
            } else if (score > 0) {
              progressBarClass = 'bg-danger'
              badgeStyle = { background: 'linear-gradient(45deg, #dc3545, #c82333)' }
            }

            const progressWidth = isCompleted ? score : 0

            return (
              <div className="course-item mb-3" key={topic.id} data-topic={topic.id}>
                <div className="card course-card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-lg-1 col-md-2 text-center">
                        <div
                          className={`icon-box ${isCompleted ? 'bg-success' : 'bg-primary'} text-white rounded-circle p-2`}
                          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className={`bi ${isCompleted ? 'bi-check-circle' : topic.icon} fs-5`}></i>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{displayName}</h4>
                        <p className="text-muted mb-2 fs-6">{topic.description}</p>
                        <div className="progress" style={{ height: '6px', backgroundColor: '#f0f0f0' }}>
                          <div
                            className={`progress-bar ${progressBarClass}`}
                            role="progressbar"
                            style={{ width: `${progressWidth}%` }}
                            aria-valuenow={score} aria-valuemin="0" aria-valuemax="100"
                          />
                        </div>
                        {lastAttempted
                          ? <small className="text-muted">Last attempt: {new Date(lastAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                          : <small className="text-muted">Not attempted yet</small>}
                      </div>
                      <div className="col-lg-2 col-md-2 text-center">
                        <span className="percentage-badge" style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem', color: 'white', boxShadow: '0 2px 4px rgba(0,123,255,0.3)', ...badgeStyle }}>
                          {score}%
                        </span>
                      </div>
                      <div className="col-lg-3 col-md-3 text-end">
                        {isCompleted
                          ? <Link to={topic.url} state={topic.linkState} className="btn btn-primary btn-sm" style={{ minWidth: '120px', padding: '0.4rem 1rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>Retest</span>
                              <i className="bi bi-arrow-clockwise ms-2"></i>
                            </Link>
                          : <Link to={topic.url} state={topic.linkState} className="btn btn-primary btn-sm" style={{ minWidth: '120px', padding: '0.4rem 1rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>Start Assessment</span>
                              <i className="bi bi-arrow-right ms-2"></i>
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

export default IIITMMath