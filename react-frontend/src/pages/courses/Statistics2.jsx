import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Statistics2 = () => {
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
        navigate('/login', { state: { from: { pathname: '/courses/statistics2' } }, replace: true })
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
      navigate('/login', { state: { from: { pathname: '/courses/statistics2' } }, replace: true })
    } finally {
      setLoading(false)
    }
  }

  const fetchScores = async (email) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/iitm_stats2_scores?email=${encodeURIComponent(email)}`, {
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
      'Advanced Probability': ['advanced_probability', 'stochastic_processes', 'markov_chains', 'bayesian_statistics'],
      'Multivariate Analysis': ['multivariate_analysis', 'factor_analysis', 'cluster_analysis', 'principal_component_analysis'],
      'Time Series Analysis': ['time_series', 'forecasting', 'seasonal_decomposition', 'autoregressive_models'],
      'Non-parametric Statistics': ['non_parametric', 'rank_based_tests', 'bootstrap_methods', 'resampling_techniques'],
      'Statistical Learning': ['statistical_learning', 'machine_learning', 'data_mining', 'predictive_modeling'],
      'Big Data Analytics': ['big_data', 'data_science', 'hadoop', 'spark', 'data_visualization']
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

  const availableTopics = [
    {
      id: 'advanced_probability',
      name: 'Advanced Probability',
      displayName: 'Advanced Probability',
      description: 'Stochastic Processes, Markov Chains, and Bayesian Statistics',
      icon: 'bi-pie-chart',
      url: '/subjects/statistics2/advanced-probability'
    },
    {
      id: 'multivariate_analysis',
      name: 'Multivariate Analysis',
      displayName: 'Multivariate Analysis',
      description: 'Factor Analysis, Cluster Analysis, and PCA',
      icon: 'bi-bar-chart',
      url: '/subjects/statistics2/multivariate'
    },
    {
      id: 'time_series_analysis',
      name: 'Time Series Analysis',
      displayName: 'Time Series Analysis',
      description: 'Forecasting and Seasonal Decomposition',
      icon: 'bi-line-chart',
      url: '/subjects/statistics2/time-series'
    },
    {
      id: 'non_parametric_statistics',
      name: 'Non-parametric Statistics',
      displayName: 'Non-parametric Statistics',
      description: 'Rank-based Tests and Bootstrap Methods',
      icon: 'bi-graph-up',
      url: '/subjects/statistics2/non-parametric'
    },
    {
      id: 'statistical_learning',
      name: 'Statistical Learning',
      displayName: 'Statistical Learning',
      description: 'Machine Learning and Predictive Modeling',
      icon: 'bi-cpu',
      url: '/subjects/statistics2/statistical-learning'
    },
    {
      id: 'big_data_analytics',
      name: 'Big Data Analytics',
      displayName: 'Big Data Analytics',
      description: 'Data Science and Advanced Analytics',
      icon: 'bi-database',
      url: '/subjects/statistics2/big-data'
    }
  ]

  const topicGroups = {
    'Advanced Probability': ['advanced_probability', 'stochastic_processes', 'markov_chains', 'bayesian_statistics'],
    'Multivariate Analysis': ['multivariate_analysis', 'factor_analysis', 'cluster_analysis', 'principal_component_analysis'],
    'Time Series Analysis': ['time_series', 'forecasting', 'seasonal_decomposition', 'autoregressive_models'],
    'Non-parametric Statistics': ['non_parametric', 'rank_based_tests', 'bootstrap_methods', 'resampling_techniques'],
    'Statistical Learning': ['statistical_learning', 'machine_learning', 'data_mining', 'predictive_modeling'],
    'Big Data Analytics': ['big_data', 'data_science', 'hadoop', 'spark', 'data_visualization']
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
    navigate('/login', { state: { from: { pathname: '/courses/statistics2' } }, replace: true })
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
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/statistics2.png" alt="Statistics2" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Advanced Statistics (Statistics2) Assessments
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Comprehensive advanced statistics assessments covering higher-level statistical concepts and modern data analysis techniques.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/statistics" className="btn-get-started">Back to Statistics</Link>
          </div>
        </div>
      </section>

      {/* Statistics2 Sections */}
      <section id="statistics2-content" className="statistics2-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Advanced Statistics Topics</h2>
          <p className="">Modern Statistical Analysis and Data Science</p>
        </div>

        <div className="container">
          <div className="row">
            {availableTopics.map((topic, index) => {
              const topicAssessment = findTopicAssessment(topic.name)
              const isCompleted = topicAssessment && topicAssessment.score !== undefined && topicAssessment.score !== null
              const score = topicAssessment ? Math.round(topicAssessment.score || 0) : 0
              const actualScore = topicAssessment ? topicAssessment.actualScore : 0
              const totalQuestions = topicAssessment ? topicAssessment.totalQuestions : 15
              const lastAttempted = topicAssessment ? topicAssessment.timestamp : null
              const attemptCount = topicAssessment ? topicAssessment.attemptCount : 0
              
              const displayName = topicAssessment?.displayName || topic.displayName || topic.name
              
              let progressBarClass = 'bg-primary'
              let badgeStyle = 'background: linear-gradient(45deg, #007bff, #0056b3);'
              
              if (score >= 80) {
                progressBarClass = 'bg-success'
                badgeStyle = 'background: linear-gradient(45deg, #28a745, #20c997);'
              } else if (score >= 60) {
                progressBarClass = 'bg-info'
                badgeStyle = 'background: linear-gradient(45deg, #17a2b8, #138496);'
              } else if (score >= 40) {
                progressBarClass = 'bg-warning'
                badgeStyle = 'background: linear-gradient(45deg, #ffc107, #fd7e14);'
              } else if (score > 0) {
                progressBarClass = 'bg-danger'
                badgeStyle = 'background: linear-gradient(45deg, #dc3545, #c82333);'
              }

              const progressWidth = isCompleted ? score : 0

              return (
                <div className="col-lg-6 col-md-12 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay={index * 100} key={topic.id}>
                  <div className="course-item">
                    <div className="course-content">
                      <div className="row align-items-center">
                        <div className="col-lg-1 col-md-2 text-center">
                          <div className={`icon-box ${isCompleted ? 'bg-success' : 'bg-primary'} text-white rounded-circle p-2`} style={{width: '40px', height: '40px'}}>
                            <i className={`bi ${isCompleted ? 'bi-check-circle' : topic.icon} fs-5`}></i>
                          </div>
                        </div>
                        <div className="col-lg-6 col-md-5">
                          <h4 className="mb-1 fs-5">{displayName}</h4>
                          <p className="text-muted mb-2 fs-6">{topic.description}</p>
                          <div className="progress" style={{height: '6px'}}>
                            <div className={`progress-bar ${progressBarClass}`} role="progressbar" 
                                style={{width: `${progressWidth}%`}}
                                aria-valuenow={score} aria-valuemin="0" aria-valuemax="100">
                            </div>
                          </div>
                          {lastAttempted ? 
                            <small className="text-muted">Last attempt: {new Date(lastAttempted).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</small>
                            : <small className="text-muted">Not attempted yet</small>}
                        </div>
                        <div className="col-lg-2 col-md-2 text-center">
                          <span className="percentage-badge" style={{...{display: 'inline-block'}, ...{padding: '0.3rem 0.8rem'}, ...{borderRadius: '20px'}, ...{fontWeight: '600'}, ...{fontSize: '0.9rem'}, ...{color: 'white'}, ...{boxShadow: '0 2px 4px rgba(0,123,255,0.3)'}, ...badgeStyle}}>{score}%</span>
                        </div>
                        <div className="col-lg-3 col-md-3 text-end">
                          {isCompleted 
                            ? <Link to={topic.url} className="btn btn-primary btn-sm">
                                <span>Retest</span>
                                <i className="bi bi-arrow-clockwise ms-2"></i>
                              </Link>
                            : <Link to={topic.url} className="btn btn-primary btn-sm">
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
      </section>
    </main>
  )
}

export default Statistics2