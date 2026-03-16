import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Python = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/session-info`, { withCredentials: true })
      if (res.data && res.data.email) {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/programming_scores?email=${encodeURIComponent(email)}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch scores')
      }
      
      const data = await response.json()
      if (data.success && data.data && data.data.quizScores) {
        setScores(data.data.quizScores)
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
      'Python Basics': ['python_basics', 'python_fundamentals', 'python_introduction', 'python_syntax'],
      'Data Structures': ['python_data_structures', 'lists', 'dictionaries', 'tuples', 'sets'],
      'Object-Oriented Programming': ['python_oop', 'classes', 'objects', 'inheritance', 'polymorphism'],
      'File Handling': ['python_file_handling', 'file_operations', 'reading_files', 'writing_files'],
      'Error Handling': ['python_error_handling', 'exceptions', 'try_except', 'error_management'],
      'Advanced Python': ['advanced_python', 'decorators', 'generators', 'context_managers', 'metaprogramming']
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
      if (!score.topic) return
      
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
      id: 'python_basics',
      name: 'Python Basics',
      displayName: 'Python Basics',
      description: 'Python Fundamentals, Syntax, and Basic Programming Concepts',
      icon: 'bi-code-slash',
      url: '/subjects/python/basics'
    },
    {
      id: 'python_data_structures',
      name: 'Data Structures',
      displayName: 'Data Structures',
      description: 'Lists, Dictionaries, Tuples, and Sets in Python',
      icon: 'bi-diagram-3',
      url: '/subjects/python/data-structures'
    },
    {
      id: 'python_oop',
      name: 'Object-Oriented Programming',
      displayName: 'Object-Oriented Programming',
      description: 'Classes, Objects, Inheritance, and Polymorphism',
      icon: 'bi-gear',
      url: '/subjects/python/oop'
    },
    {
      id: 'python_file_handling',
      name: 'File Handling',
      displayName: 'File Handling',
      description: 'Reading, Writing, and Managing Files in Python',
      icon: 'bi-file-earmark',
      url: '/subjects/python/file-handling'
    },
    {
      id: 'python_error_handling',
      name: 'Error Handling',
      displayName: 'Error Handling',
      description: 'Exceptions, Try-Except Blocks, and Error Management',
      icon: 'bi-exclamation-triangle',
      url: '/subjects/python/error-handling'
    },
    {
      id: 'advanced_python',
      name: 'Advanced Python',
      displayName: 'Advanced Python',
      description: 'Decorators, Generators, and Advanced Programming Techniques',
      icon: 'bi-cpu',
      url: '/subjects/python/advanced'
    }
  ]

  const topicGroups = {
    'Python Basics': ['python_basics', 'python_fundamentals', 'python_introduction', 'python_syntax'],
    'Data Structures': ['python_data_structures', 'lists', 'dictionaries', 'tuples', 'sets'],
    'Object-Oriented Programming': ['python_oop', 'classes', 'objects', 'inheritance', 'polymorphism'],
    'File Handling': ['python_file_handling', 'file_operations', 'reading_files', 'writing_files'],
    'Error Handling': ['python_error_handling', 'exceptions', 'try_except', 'error_management'],
    'Advanced Python': ['advanced_python', 'decorators', 'generators', 'context_managers', 'metaprogramming']
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
    return (
      <div className="container text-center" style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Please Login to Access Python Content</h2>
        <p className="lead">You need to be logged in to view Python assessments.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/python.png" alt="Python" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Python Programming Assessments
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Comprehensive Python programming assessments covering all topics from basic concepts to advanced programming techniques.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/programming" className="btn-get-started">Back to Programming</Link>
          </div>
        </div>
      </section>

      {/* Python Sections */}
      <section id="python-content" className="python-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Python Topics</h2>
          <p className="">Python Programming and Development</p>
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
              
              const displayName = topicAssessment?.displayName || topic.displayName
              
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

export default Python