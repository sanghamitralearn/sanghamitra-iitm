import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [courseProgress, setCourseProgress] = useState({})
  const [recentActivity, setRecentActivity] = useState([])

  const navigate = useNavigate()

  // Define all courses with their API endpoints and data paths
  const allCourses = [
    {
      id: 'math',
      title: 'Mathematics',
      icon: 'bi-calculator',
      color: '#5fcf80',
      route: '/math',
      description: 'Master algebra, calculus, and more',
      apiEndpoint: `${API_URL}/api/iitmmath_scores`,
      dataPath: 'data.quizScores',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'timestamp'
    },
    {
      id: 'math2',
      title: 'Mathematics II',
      icon: 'bi-graph-up',
      color: '#4ecdc4',
      route: '/math2',
      description: 'Advanced mathematical concepts',
      apiEndpoint: `${API_URL}/api/iitm_math2_scores`,
      dataPath: 'scores',
      scoreKey: 'score',
      topicKey: 'subtopic',
      timestampKey: 'dateAttempted'
    },
    {
      id: 'statistics',
      title: 'Statistics',
      icon: 'bi-bar-chart',
      color: '#45b7d1',
      route: '/statistics',
      description: 'Learn data analysis and probability',
      apiEndpoint: `${API_URL}/api/statistics_scores`,
      dataPath: 'data.quizScores',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'timestamp'
    },
    {
      id: 'statistics2',
      title: 'Statistics II',
      icon: 'bi-pie-chart',
      color: '#96ceb4',
      route: '/statistics2',
      description: 'Advanced statistical methods',
      apiEndpoint: `${API_URL}/api/iitm_stats2_scores_databases`,
      dataPath: 'data.quizScores',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'timestamp'
    },
    {
      id: 'computational-thinking',
      title: 'Computational Thinking',
      icon: 'bi-cpu',
      color: '#845ec2',
      route: '/computational-thinking',
      description: 'Problem-solving approach',
      apiEndpoint: `${API_URL}/api/iitm_ct_scores`,
      dataPath: 'data.quizScores',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'timestamp'
    },
    {
      id: 'python',
      title: 'Programming in Python',
      icon: 'bi-filetype-py',
      color: '#3776ab',
      route: '/programming/courses/python',
      description: 'Master Python from basics to advanced',
      apiEndpoint: `${API_URL}/api/mcq-quiz/attempts?course=python`,
      dataPath: 'attempts',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'submitted_at'
    },
    {
      id: 'java',
      title: 'Java Programming',
      icon: 'bi-cup-hot-fill',
      color: '#f89820',
      route: '/programming/courses/java',
      description: 'Complete Java development',
      apiEndpoint: `${API_URL}/api/mcq-quiz/attempts?course=java`,
      dataPath: 'attempts',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'submitted_at'
    },
    {
      id: 'dbms',
      title: 'Database Management Systems',
      icon: 'bi-server',
      color: '#2d4059',
      route: '/programming/courses/dbms',
      description: 'Complete DBMS concepts',
      apiEndpoint: `${API_URL}/api/mcq-quiz/attempts?course=dbms`,
      dataPath: 'attempts',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'submitted_at'
    },
    {
      id: 'pdsa',
      title: 'PDSA using Python',
      icon: 'bi-code-square',
      color: '#00b4d8',
      route: '/courses/pdsa',
      description: 'Programming, data structures and Algorithms using Python',
      apiEndpoint: `${API_URL}/api/pdsa-submissions`,
      dataPath: 'data',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'timestamp'
    },
    {
      id: 'competitive-exam',
      title: 'Competitive Exam Foundation',
      icon: 'bi-trophy',
      color: '#ff6b6b',
      route: '/competitive-exam-foundation',
      description: 'Crack banking, SSC & more',
      apiEndpoint: `${API_URL}/api/competitive_math_quiz_attempts`,
      dataPath: 'data.quizScores',
      scoreKey: 'percentage',
      topicKey: 'topic',
      timestampKey: 'submitted_at'
    },
    {
      id: 'jee',
      title: 'JEE Advanced',
      icon: 'bi-lightning',
      color: '#dc3545',
      route: '/courses/jee',
      description: 'Practice JEE Advanced questions',
      apiEndpoint: `${API_URL}/api/jee_scores`,
      dataPath: '',
      scoreKey: 'score',
      topicKey: 'subject',
      timestampKey: 'dateAttempted'
    },
    {
      id: 'sat',
      title: 'SAT Practice',
      icon: 'bi-book',
      color: '#003D8F',
      route: '/courses/sat',
      description: 'SAT preparation & practice',
      apiEndpoint: `${API_URL}/api/sat_scores`,
      dataPath: '',
      scoreKey: 'score',
      topicKey: 'subject',
      timestampKey: 'dateAttempted'
    }
  ]

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)

      // Check auth
      const authCheck = await axios.get(`${API_URL}/api/check-auth`, {
        withCredentials: true,
      })
      if (!authCheck.data.authenticated) {
        navigate('/login', { state: { from: { pathname: '/dashboard' } }, replace: true })
        return
      }

      // Fetch user data
      const dashboardResponse = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true
      })
      
      setUser(dashboardResponse.data)
      const userEmail = dashboardResponse.data.email

      // Fetch progress for all courses with their specific endpoints
      const progressData = {}
      const allActivities = []

      for (const course of allCourses) {
        try {
          let response
          let attempts = []
          
          // Build the API URL with email parameter
          let apiUrl = course.apiEndpoint
          if (!apiUrl.includes('?') && !apiUrl.includes('email')) {
            // If no query params, add email
            apiUrl = `${apiUrl}?email=${userEmail}`
          } else if (!apiUrl.includes('email')) {
            // If has query params but no email, add email
            apiUrl = `${apiUrl}&email=${userEmail}`
          }

          response = await axios.get(apiUrl, {
            withCredentials: true
          })

          // Extract attempts based on data path
          if (course.dataPath) {
            const pathParts = course.dataPath.split('.')
            let data = response.data
            for (const part of pathParts) {
              data = data?.[part]
            }
            attempts = Array.isArray(data) ? data : []
          } else {
            // For JEE, SAT which return array directly
            attempts = Array.isArray(response.data) ? response.data : []
          }

          if (attempts.length > 0) {
            // Calculate course progress
            const scores = attempts.map(a => a[course.scoreKey] || 0)
            const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
            
            // Get unique weeks/topics
            const uniqueTopics = new Set(attempts.map(a => a[course.topicKey] || '')).size
            
            // Total weeks estimate based on course type
            let totalWeeks = 0
            if (['python', 'java', 'dbms', 'sql', 'dsa'].includes(course.id)) {
              totalWeeks = course.id === 'python' ? 10 : course.id === 'java' ? 12 : course.id === 'dbms' ? 8 : 10
            } else if (['math', 'math2', 'statistics', 'statistics2', 'computational-thinking'].includes(course.id)) {
              totalWeeks = 12
            } else {
              totalWeeks = 10
            }

            const progress = totalWeeks > 0 ? Math.round((uniqueTopics / totalWeeks) * 100) : 50

            progressData[course.id] = {
              attempts: attempts.length,
              averageScore: avgScore,
              weeksAttempted: uniqueTopics,
              totalWeeks: totalWeeks,
              lastAttempt: attempts[attempts.length - 1]?.[course.timestampKey] || new Date().toISOString(),
              progress: Math.min(progress, 100),
              course: course,
              latestScore: scores[scores.length - 1] || 0
            }

            // Add to recent activities
            allActivities.push({
              course: course.title,
              courseId: course.id,
              date: attempts[attempts.length - 1]?.[course.timestampKey] || new Date().toISOString(),
              score: scores[scores.length - 1] || 0,
              action: `Completed ${attempts.length} quiz${attempts.length > 1 ? 'zes' : ''}`
            })
          }
        } catch (error) {
          // Course not started or error - skip it
          console.log(`No data for ${course.id}:`, error.message)
        }
      }

      setCourseProgress(progressData)

      // Sort activities by date and get most recent
      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentActivity(allActivities.slice(0, 5))

      // Fetch streak
      try {
        const streakResponse = await axios.get(`${API_URL}/api/login-history?email=${userEmail}`, {
          withCredentials: true
        })
        const loginHistory = streakResponse.data?.loginHistory || []
        const calculatedStreak = calculateStreak(loginHistory)
        setStreak(calculatedStreak)
      } catch (error) {
        console.log('Error fetching streak:', error.message)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745'
    if (score >= 60) return '#ffc107'
    if (score >= 40) return '#fd7e14'
    return '#dc3545'
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success'
    if (progress >= 50) return 'warning'
    if (progress >= 25) return 'info'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Get only courses that user has started
  const startedCourses = Object.values(courseProgress)
    .filter(progress => progress && progress.attempts > 0)
    .sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt))

  const totalStarted = startedCourses.length
  const totalQuizzes = startedCourses.reduce((sum, p) => sum + p.attempts, 0)
  const avgAllScores = startedCourses.length > 0 
    ? Math.round(startedCourses.reduce((sum, p) => sum + p.averageScore, 0) / startedCourses.length)
    : 0
  const completedCourses = startedCourses.filter(p => p.progress >= 80).length

  return (
    <div className="dashboard-wrapper">
      <div className="container-fluid px-4 py-4">
        <div className="row">
          {/* Main Content Area */}
          <div className="col-lg-12">
            {/* Welcome Section */}
            <div className="welcome-card mb-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-6 fw-bold mb-2">
                    <i className="bi bi-person-circle me-2 text-success"></i>
                    Welcome back, {user.name}!
                  </h1>
                  <p className="text-muted mb-0">Track your learning progress across all courses</p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="streak-badge">
                    <i className="bi bi-fire flame-icon"></i>
                    <span className="streak-number">{streak}</span>
                    <span className="streak-label">Day Streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row mb-4">
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon bg-success">
                    <i className="bi bi-book"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{totalStarted}</h3>
                    <span>Courses Started</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon bg-primary">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{totalQuizzes}</h3>
                    <span>Total Quizzes</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon bg-warning">
                    <i className="bi bi-trophy"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{avgAllScores}%</h3>
                    <span>Average Score</span>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="stat-card">
                  <div className="stat-icon bg-info">
                    <i className="bi bi-award"></i>
                  </div>
                  <div className="stat-content">
                    <h3>{completedCourses}</h3>
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="activity-card mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-clock-history me-2 text-success"></i>
                  Recent Activity
                </h5>
                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <i className={`bi bi-${allCourses.find(c => c.id === activity.courseId)?.icon || 'book'}`}></i>
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.course}</div>
                        <div className="activity-action">{activity.action}</div>
                      </div>
                      <div className="activity-score">
                        <span className="badge" style={{ 
                          backgroundColor: getScoreColor(activity.score),
                          color: 'white'
                        }}>
                          {activity.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Started Courses Grid */}
            {startedCourses.length > 0 ? (
              <div className="courses-grid">
                <h5 className="mb-3">
                  <i className="bi bi-grid-3x3-gap-fill me-2 text-success"></i>
                  Your Courses
                </h5>
                <div className="row g-3">
                  {startedCourses.map((progress) => {
                    const course = progress.course
                    return (
                      <div key={course.id} className="col-md-6 col-xl-4">
                        <div className="course-card" style={{ borderLeft: `4px solid ${course.color}` }}>
                          <div className="course-header">
                            <div className="course-icon" style={{ backgroundColor: course.color + '20' }}>
                              <i className={`bi ${course.icon}`} style={{ color: course.color }}></i>
                            </div>
                            <Link to={course.route} className="course-title-link">
                              <h6 className="course-title">{course.title}</h6>
                            </Link>
                          </div>
                          
                          <p className="course-description">{course.description}</p>
                          
                          <div className="progress-info">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted small">Progress</span>
                              <span className="text-muted small">{progress.progress}%</span>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className={`progress-bar bg-${getProgressColor(progress.progress)}`}
                                style={{ width: `${progress.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="course-stats">
                            <div className="stat-item">
                              <i className="bi bi-check-circle-fill text-success"></i>
                              <span>{progress.weeksAttempted || 0} topics</span>
                            </div>
                            <div className="stat-item">
                              <i className="bi bi-star-fill" style={{ color: getScoreColor(progress.averageScore) }}></i>
                              <span>{progress.averageScore}% avg</span>
                            </div>
                            <div className="stat-item">
                              <i className="bi bi-play-circle-fill text-primary"></i>
                              <span>{progress.attempts} attempt{progress.attempts > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          
                          <Link to={course.route} className="btn btn-sm btn-outline-success w-100 mt-2">
                            Continue Learning
                            <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="text-center py-5">
                  <i className="bi bi-book-empty" style={{ fontSize: '4rem', color: '#dee2e6' }}></i>
                  <h5 className="mt-3">No courses started yet</h5>
                  <p className="text-muted">Start your learning journey by exploring our courses</p>
                  <Link to="/" className="btn btn-success">
                    <i className="bi bi-plus-circle me-2"></i>
                    Browse Courses
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 20px 0;
        }

        .welcome-card {
          background: white;
          border-radius: 15px;
          padding: 25px 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .streak-badge {
          display: inline-flex;
          align-items: center;
          background: #fff5f5;
          padding: 8px 18px;
          border-radius: 50px;
          border: 2px solid #ff6b6b;
          gap: 8px;
        }

        .flame-icon {
          color: #ff6b6b;
          font-size: 1.5rem;
        }

        .streak-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #ff6b6b;
        }

        .streak-label {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-3px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .stat-content span {
          font-size: 0.85rem;
          color: #6c757d;
        }

        .activity-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #f1f3f5;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #28a745;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .activity-action {
          font-size: 0.8rem;
          color: #6c757d;
        }

        .activity-score .badge {
          font-size: 0.8rem;
          padding: 4px 10px;
        }

        .courses-grid {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .empty-state-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .course-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 18px;
          transition: all 0.3s;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .course-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }

        .course-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .course-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .course-title {
          margin: 0;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .course-title-link {
          color: #212529;
          text-decoration: none;
        }

        .course-title-link:hover {
          color: #28a745;
        }

        .course-description {
          font-size: 0.8rem;
          color: #6c757d;
          margin-bottom: 12px;
          flex: 1;
        }

        .progress-info {
          margin-bottom: 10px;
        }

        .course-stats {
          display: flex;
          gap: 15px;
          margin: 8px 0;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #495057;
        }

        @media (max-width: 992px) {
          .col-lg-9 {
            margin-bottom: 30px;
          }
        }

        @media (max-width: 576px) {
          .stat-card {
            margin-bottom: 10px;
          }
          .welcome-card {
            padding: 15px;
          }
          .streak-badge {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
