import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'

Chart.register(ArcElement, Tooltip, Legend)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [vocabScores, setVocabScores] = useState([])
  const [mathTopics, setMathTopics] = useState([])
  const [rcScores, setRcScores] = useState({})
  const [programmingScores, setProgrammingScores] = useState([])
  const [ctFingerScores, setCtFingerScores] = useState([])
  const [programmingFingerScores, setProgrammingFingerScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  const navigate = useNavigate()
  const chartRefs = useRef({})

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)

      // Check auth first — redirect immediately if not logged in
      const authCheck = await axios.get(`${API_URL}/api/check-auth`, {
        withCredentials: true,
      })
      if (!authCheck.data.authenticated) {
        console.log('User not authenticated, redirecting to login')
        navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true })
        return
      }

      // Fetch user dashboard data
      const dashboardResponse = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true
      })
      
      setUser(dashboardResponse.data)
      
      // Fetch all scores in parallel with error handling
      const [
        vocabResponse, 
        mathResponse, 
        rcResponse, 
        programmingResponse, 
        ctFingerResponse, 
        programmingFingerResponse, 
        streakResponse
      ] = await Promise.allSettled([
        axios.get(`${API_URL}/api/vocabscores?email=${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/algebra_scores?email=${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/readingcomprehensionscore?email=${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/programming?email=${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/CT_finger_scores/${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/finger-exercise?email=${dashboardResponse.data.email}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/login-history?email=${dashboardResponse.data.email}`, { withCredentials: true })
      ])
      
      // Handle each response individually
      setVocabScores(vocabResponse.status === 'fulfilled' ? (vocabResponse.value?.data?.assessments || []) : [])
      setMathTopics(mathResponse.status === 'fulfilled' ? (mathResponse.value?.data?.[0]?.topics || []) : [])
      setRcScores(rcResponse.status === 'fulfilled' ? (rcResponse.value?.data || {}) : {})
      setProgrammingScores(programmingResponse.status === 'fulfilled' ? (programmingResponse.value?.data?.quizzes || []) : [])
      setCtFingerScores(ctFingerResponse.status === 'fulfilled' ? (ctFingerResponse.value?.data?.quizzes || []) : [])
      setProgrammingFingerScores(programmingFingerResponse.status === 'fulfilled' ? (programmingFingerResponse.value?.data?.topics || []) : [])
      
      // Calculate streak
      const loginHistory = (streakResponse.status === 'fulfilled' ? streakResponse.value?.data?.loginHistory : []) || []
      const calculatedStreak = calculateStreak(loginHistory)
      setStreak(calculatedStreak)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true })
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = (loginHistory) => {
    const uniqueDays = new Set(
      loginHistory.map(entry => new Date(entry.loginTimestamp).setHours(0, 0, 0, 0))
    )

    const sortedLogins = Array.from(uniqueDays).sort((a, b) => b - a)
    let streak = 0
    const today = new Date().setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedLogins.length; i++) {
      const expectedDate = new Date(today - i * 86400000)
      if (sortedLogins[i] === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const displayVocabScores = () => {
    if (vocabScores.length === 0) {
      return (
        <div>
          <p className="no-data">Start learning and improve your Vocabulary</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/vocabulary'}>
            Start Learning
          </button>
        </div>
      )
    }

    const recentAssessments = vocabScores.slice(-6).reverse()

    return (
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Date</th>
            <th>Percentage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recentAssessments.map((assessment, index) => {
            const totalQuestions = assessment.questions.length
            const correctAnswers = assessment.questions.filter(q => q.is_correct).length
            const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(2) : '0.00'

            return (
              <tr key={index}>
                <td>{assessment.assess_topic || 'N/A'}</td>
                <td>{new Date(assessment.date).toLocaleDateString()}</td>
                <td>{percentage}%</td>
                <td>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => goToQuizAnalytics(assessment.date)}
                  >
                    Analytics
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const displayMathTopics = () => {
    if (mathTopics.length === 0) {
      return (
        <div className="card-custom">
          <p className="no-data">No data available for any topic</p>
        </div>
      )
    }

    return (
      <div className="row">
        {mathTopics.map((topic, index) => {
          const { topic: topicName, questions, current_level } = topic
          const correctAnswers = questions.filter(q => q.correct).length
          const incorrectAnswers = questions.length - correctAnswers

          return (
            <div className="col-lg-6 col-md-12 mb-4" key={index}>
              <div className="card-custom">
                <div>
                  <h4>{capitalizeFirstLetter(topicName)} Performance</h4>
                  <p><strong>Accuracy:</strong> {correctAnswers}/{questions.length}</p>
                  <p><strong>Current Level:</strong> {capitalizeFirstLetter(current_level)}</p>
                </div>
                <div className="canvas-container">
                  <canvas 
                    id={`${topicName}-performance-chart`} 
                    width="500" 
                    height="500"
                    ref={(canvas) => {
                      if (canvas) {
                        renderTopicPerformanceChart(canvas, correctAnswers, incorrectAnswers)
                      }
                    }}
                  ></canvas>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const displayRCScores = () => {
    if (!rcScores || Object.keys(rcScores).length === 0) {
      return (
        <div>
          <p className="no-data">Start learning and improve your Reading Comprehension</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/reading-comprehension'}>
            Start Learning
          </button>
        </div>
      )
    }

    const topicEntries = Object.entries(rcScores.topics || {})
    
    if (topicEntries.length === 0) {
      return (
        <div>
          <p className="no-data">Start learning and improve your Reading Comprehension</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/reading-comprehension'}>
            Start Learning
          </button>
        </div>
      )
    }

    return (
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Topic</th>
            <th>Total Passages Solved</th>
            <th>Current Level</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {topicEntries.map(([topicName, topicDetails], index) => {
            const totalPassages = topicDetails.solvedPassages?.length || 0
            const currentLevel = topicDetails.current_level || 'N/A'
            
            const lastActivity = topicDetails.solvedPassages?.reduce((latest, passage) => {
              const passageDate = new Date(passage.timestamp)
              return passageDate > latest ? passageDate : latest
            }, new Date(0))
            
            const lastActivityFormatted = lastActivity.getTime() !== 0
              ? lastActivity.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A'

            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{topicName}</td>
                <td>{totalPassages}</td>
                <td>{currentLevel}</td>
                <td>{lastActivityFormatted}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => exploreTopic(topicName)}
                  >
                    Explore
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const displayProgrammingScores = () => {
    if (programmingScores.length === 0) {
      return (
        <div>
          <p className="no-data">Start practicing to improve your programming skills</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/programming'}>
            Start Coding
          </button>
        </div>
      )
    }

    const sortedQuizzes = [...programmingScores].sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    const recentQuizzes = sortedQuizzes.slice(0, 1)

    return (
      <div>
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Date</th>
              <th>Score(%)</th>
              <th>Questions Passed Out of 20</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentQuizzes.map((quiz, index) => {
              const quizDate = new Date(quiz.datetime).toLocaleDateString()
              const passedQuestions = quiz.submissions.filter(sub => sub.test_cases_passed > 0).length
              
              return (
                <tr key={index}>
                  <td>{quizDate}</td>
                  <td>{(quiz.score/20*100).toFixed(0)}</td>
                  <td>{passedQuestions}</td>
                  <td>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => viewProgrammingQuiz(quiz._id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <button 
          className="btn btn-primary solve-more-btn mt-3" 
          onClick={() => window.location.href = '/programming'}
        >
          Practice More
        </button>
      </div>
    )
  }

  const displayCTFingerExercises = () => {
    if (ctFingerScores.length === 0) {
      return (
        <div>
          <p className="no-data">Start practicing CT finger exercises</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/programming'}>
            Start Learning
          </button>
        </div>
      )
    }

    // Aggregate scores by topic
    const topicScores = {}
    ctFingerScores.forEach(quiz => {
      const correctAnswers = quiz.answers ? quiz.answers.filter(a => a.isCorrect).length : 0
      if (!topicScores[quiz.topic]) {
        topicScores[quiz.topic] = 0
      }
      topicScores[quiz.topic] += correctAnswers
    })

    const tableData = Object.entries(topicScores).map(([topic, score], index) => ({
      srNo: index + 1,
      topic: topic.replace(/_/g, ' ').toUpperCase(),
      score: score
    }))

    return (
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Sr No.</th>
            <th>Topic</th>
            <th>Scores(%)</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map(row => (
            <tr key={row.srNo}>
              <td>{row.srNo}</td>
              <td>{row.topic}</td>
              <td>{((row.score/30)*100).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const displayProgrammingFingerExercises = () => {
    if (programmingFingerScores.length === 0) {
      return (
        <div>
          <p className="no-data">Start practicing programming finger exercises</p>
          <button className="btn btn-success start-learning-btn" onClick={() => window.location.href = '/programming'}>
            Start Learning
          </button>
        </div>
      )
    }

    // Calculate scores per topic - only count unique questions answered correctly
    const topicScores = {}
    programmingFingerScores.forEach(topic => {
      const submissions = topic.submissions || []
      const correctCount = new Set(submissions.filter(sub => sub.isCorrect).map(sub => sub.questionId)).size
      topicScores[topic.topicName] = correctCount
    })

    const tableData = Object.entries(topicScores).map(([topic, score], index) => ({
      srNo: index + 1,
      topic: topic.replace(/_/g, ' ').toUpperCase(),
      score: score
    }))

    return (
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Sr No.</th>
            <th>Topic</th>
            <th>Scores(%)</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map(row => (
            <tr key={row.srNo}>
              <td>{row.srNo}</td>
              <td>{row.topic}</td>
              <td>{((row.score/20)*100).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const goToQuizAnalytics = (quizId) => {
    window.location.href = `/vocab-analytics?quizId=${encodeURIComponent(quizId)}`
  }

  const exploreTopic = (topicName) => {
    window.location.href = `/english/rc-dashboard?topic=${encodeURIComponent(topicName)}`
  }

  const viewProgrammingQuiz = (quizId) => {
    window.location.href = `/programming/details?quizId=${quizId}`
  }

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  const renderTopicPerformanceChart = (canvas, correctAnswers, incorrectAnswers) => {
    // Simple chart rendering - in a real implementation, you'd use Chart.js
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw a simple donut chart representation
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#e9ecef'
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#fff'
    ctx.fill()
    
    // Draw progress
    const total = correctAnswers + incorrectAnswers
    const percentage = total > 0 ? correctAnswers / total : 0
    const angle = percentage * 2 * Math.PI
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle)
    ctx.closePath()
    ctx.fillStyle = '#5fcf80'
    ctx.fill()
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true })
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Redirecting...</span>
          </div>
          <p className="mt-3">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <section className="dashboard-container">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="card shadow-sm mb-4">
              <div className="card-header" style={{ backgroundColor: '#3498db' }}>
                <h3 className="mb-1">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Activity and Performance Dashboard
                </h3>
              </div>
              <div className="card-body">
                {/* User Information Section */}
                <div className="card-custom mb-4">
                  <div className="info-container">
                    <div className="user-info">
                      <h3><i className="bi bi-person-circle me-2"></i>User Information</h3>
                      <p><strong>Username:</strong> <span>{user.name}</span></p>
                      <p><strong>Email:</strong> <span>{user.email}</span></p>
                    </div>
                    
                    <div className="quiz-count">
                      <h3><i className="bi bi-bar-chart-line me-2"></i>Quiz Count</h3>
                      <p>Math: <span className="badge bg-primary">{mathTopics.length}</span></p>
                      <p>RC: <span className="badge bg-success">{Object.keys(rcScores.topics || {}).length}</span></p>
                      <p>Vocabulary: <span className="badge bg-warning text-dark">{vocabScores.length}</span></p>
                      <p>Programming: <span className="badge bg-info text-dark">{programmingScores.length}</span></p>
                    </div>
                  </div>
                  
                  <div className="streak-container">
                    <div className="streak-title">
                      <i className="bi bi-fire me-1"></i>Current Streak
                    </div>
                    <div className="streak-circle">
                      <i className="bi bi-fire"></i>
                      <span id="userStreak">{streak}</span>
                    </div>
                  </div>
                </div>

                {/* Vocabulary and Mathematics Section */}
                <div className="row mb-4">
                  <div className="col-lg-6 col-md-12">
                    <div className="card-custom">
                      <h3><i className="bi bi-book me-2"></i>Vocabulary</h3>
                      <div id="vocab-quiz-summary">
                        {displayVocabScores()}
                      </div>
                      <button 
                        className="btn btn-primary solve-more-btn" 
                        onClick={() => window.location.href = '/vocabulary'}
                      >
                        <i className="bi bi-pencil me-1"></i>Solve More
                      </button>
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-12">
                    <div className="card-custom">
                      <h3><i className="bi bi-calculator me-2"></i>Mathematics</h3>
                      <div id="topics-container">
                        {displayMathTopics()}
                      </div>
                      <button 
                        className="btn btn-primary solve-more-btn" 
                        onClick={() => window.location.href = '/math'}
                      >
                        <i className="bi bi-pencil me-1"></i>Solve More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full-Width Reading Comprehension Section */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card-custom">
                      <h3><i className="bi bi-journal-text me-2"></i>Reading Comprehension</h3>
                      <div id="rc-table-container">
                        {displayRCScores()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Programming Quizzes Section */}
                <div className="row">
                  <div className="col-12">
                    <div className="card-custom">
                      <h3><i className="bi bi-cpu me-2"></i>CT Finger Exercises</h3>
                      <div id="ct-finger-container">
                        {displayCTFingerExercises()}
                      </div>
                      
                      <h3><i className="bi bi-code-slash me-2"></i>Programming Finger Exercises</h3>
                      <div id="programming-finger-container">
                        {displayProgrammingFingerExercises()}
                      </div>
                      
                      <h3><i className="bi bi-braces me-2"></i>Programming Diagnostic</h3>
                      <div id="programming-container">
                        {displayProgrammingScores()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section
