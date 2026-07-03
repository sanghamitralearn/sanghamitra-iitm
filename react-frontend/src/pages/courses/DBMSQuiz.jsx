import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const WEEK_CONFIG = {
  '1':  { week: 1, topic: 'Introduction to DBMS', name: 'Introduction to DBMS Quiz' },
  '2':  { week: 2, topic: 'Relational Model and Basic SQL', name: 'Relational Model and Basic SQL Quiz' },
  '3':  { week: 3, topic: 'Intermediate and Advanced SQL', name: 'Intermediate and Advanced SQL Quiz' },
  '4':  { week: 4, topic: 'Relational Query Languages and Database Design', name: 'Relational Query Languages and Database Design Quiz' },
  '5':  { week: 5, topic: 'Functional Dependency and Normal Forms', name: 'Functional Dependency and Normal Forms Quiz' },
  '6':  { week: 6, topic: 'Functional Dependency and Normal Forms Continued', name: 'Functional Dependency and Normal Forms Continued Quiz' },
  '7':  { week: 7, topic: 'Application Development', name: 'Application Development Quiz' },
  '8':  { week: 8, topic: 'Storage Management', name: 'Storage Management Quiz' },
  '9':  { week: 9, topic: 'Indexing and Hashing', name: 'Indexing and Hashing Quiz' },
  '10': { week: 10, topic: 'Transactions', name: 'Transactions Quiz' },
  '11': { week: 11, topic: 'Backup and Recovery', name: 'Backup and Recovery Quiz' },
  '12': { week: 12, topic: 'Query Optimization and Conclusion', name: 'Query Optimization and Conclusion Quiz' },

  'midterm1': { week: null, topic: 'Midterm-1', name: 'DBMS Midterm 1 Exam' },
  'midterm2': { week: null, topic: 'Midterm-2', name: 'DBMS Midterm 2 Exam' },
  'endterm':  { week: null, topic: 'End Term',  name: 'DBMS End Term Exam' },
}


const DBMSTestQuiz = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const config = WEEK_CONFIG[weekId]
  const topic = config?.topic
  const quizName = config?.name
  const week = config?.week

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [showMobileNav, setShowMobileNav] = useState(false)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data && res.data.email) {
        setUser(res.data)
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchQuestions = async () => {
    if (!topic && !week) { 
      setError('Invalid quiz configuration')
      setLoading(false)
      return
    }
    
    try {
      let url = `${API}/api/dbms/questions`
      const params = new URLSearchParams()
      
      if (week) {
        url = `${API}/api/dbms/questions/week/${week}`
      } else if (topic) {
        params.append('topic', topic)
      }
      
      const res = await fetch(`${url}?${params.toString()}`, { credentials: 'include' })
      const data = await res.json()
      
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions)
      } else {
        setError(data.message || 'No questions found for this topic/week')
      }
    } catch {
      setError('Failed to load questions. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId, value, type) => {
    setAnswers(prev => {
      if (type === 'mcq-single') return { ...prev, [questionId]: value }

      if (type === 'mcq-multiple') {
        const cur = Array.isArray(prev[questionId]) ? prev[questionId] : []
        return {
          ...prev,
          [questionId]: cur.includes(value)
            ? cur.filter(v => v !== value)
            : [...cur, value]
        }
      }

      return { ...prev, [questionId]: value }
    })
  }

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const calculateScore = () => {
    let score = 0
    let maxScore = 0
    const breakdown = []

    questions.forEach(q => {
      const max = q.maxScore || 1
      maxScore += max
      const ua = answers[q.questionId]
      let earned = 0
      
      if (q.type === 'mcq-single') {
        if (ua === q.correctAnswer) earned = max
      } else if (q.type === 'mcq-multiple') {
        const ua2 = Array.isArray(ua) ? [...ua].sort() : []
        const ca2 = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : []
        if (JSON.stringify(ua2) === JSON.stringify(ca2)) earned = max
      } else if (q.type === 'numerical') {
        if (String(ua || '').trim() === String(q.correctAnswer).trim()) earned = max
      } else if (q.type === 'interview') {
        earned = 0
      }
      
      score += earned

      breakdown.push({ 
        questionId: q.questionId, 
        title: q.title, 
        description: q.description || '',
        explanation: q.explanation || '',
        type: q.type,
        userAnswer: ua, 
        correctAnswer: q.correctAnswer, 
        score: earned, 
        maxScore: max,
      })
    })

    return { score, maxScore, breakdown }
  }

  const handleSubmit = async () => {
    if (!user) return
    
    setSubmitting(true)

    const { score, maxScore, breakdown } = calculateScore()
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    
    const submissionData = {
      email: user.email,
      username: user.username,
      topic: topic || `Week ${week}`,
      score,
      maxScore,
      percentage,
      timestamp: new Date().toISOString(),
      questions: breakdown,
    }
    
    try {
      await fetch(`${API}/api/dbms-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      })
    } catch (error) {
      console.error('Error saving DBMS submission:', error)
    }
    
    setResult({ score, maxScore, percentage, breakdown, flaggedQuestions })
    setSubmitted(true)
    setSubmitting(false)
  }

  const resetQuiz = () => {
    setSubmitted(false)
    setCurrentIdx(0)
    setAnswers({})
    setFlaggedQuestions({})
    setResult(null)
    setLoading(true)
    fetchQuestions()
  }

  if (!config) return (
    <div className="container py-5 text-center">
      <div className="alert alert-warning">
        <h4>Invalid Quiz Week</h4>
        <Link to="/courses/dbms" className="btn btn-primary mt-2">
          Back to DBMS Course
        </Link>
      </div>
    </div>
  )

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-success mb-3"></div>
        <p>Loading {quizName}...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5">
      <div className="alert alert-danger text-center">
        <h4>Error Loading Quiz</h4>
        <p>{error}</p>
        <button
          className="btn btn-success me-2"
          onClick={() => {
            setError(null)
            setLoading(true)
            fetchQuestions()
          }}
        >
          Retry
        </button>
        <Link to="/courses/dbms" className="btn btn-secondary">
          Back to DBMS Course
        </Link>
      </div>
    </div>
  )

  const PageTitle = () => (
    <div className="page-title" style={{ marginBottom: '2rem' }}>
      <nav className="breadcrumbs">
        <div className="container">
          <ol className="mb-0">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses/dbms">DBMS Course</Link></li>
            <li className="current">{quizName}</li>
          </ol>
        </div>
      </nav>
    </div>
  )

  if (submitted && result) {
    const pct = result.percentage

    const grade =
      pct >= 80
        ? { label: 'Excellent!', cls: 'bg-success' }
        : pct >= 60
          ? { label: 'Good!', cls: 'bg-info' }
          : { label: 'Keep Practicing!', cls: 'bg-warning text-dark' }

    return (
      <main className="main">
        <PageTitle />

        <div className="container py-4" style={{ maxWidth: 1200 }}>
          <div className="card border-0 shadow text-center mb-4" style={{ borderRadius: 16 }}>
            <div
              className="card-body p-5"
              style={{
                background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                borderRadius: 16
              }}
            >
              <h2 className="text-white mb-1">Quiz Complete!</h2>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: 'white' }}>
                {pct}%
              </div>
              <p className="text-white mb-2">
                {result.score} / {result.maxScore} points
              </p>
              <span className={`badge mt-1 px-3 py-2 fs-6 ${grade.cls}`}>
                {grade.label}
              </span>
            </div>
          </div>
          
          <h5 className="mb-3">Question Breakdown</h5>

          {result.breakdown.map((item, i) => {
            const correctAnswerDisplay = Array.isArray(item.correctAnswer)
              ? item.correctAnswer.join(', ')
              : item.correctAnswer
            
            const userAnswerDisplay = (() => {
              if (item.userAnswer === undefined || item.userAnswer === null || item.userAnswer === '') {
                return 'Not answered'
              }

              if (Array.isArray(item.userAnswer)) {
                return item.userAnswer.length > 0
                  ? item.userAnswer.join(', ')
                  : 'No answer selected'
              }

              return item.userAnswer
            })()

            return (
              <div
                key={i}
                className="card mb-3 border-0 shadow-sm"
                style={{
                  borderRadius: 12,
                  borderLeft: `4px solid ${item.score === item.maxScore ? '#4caf50' : '#dc3545'}`
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <small className="text-muted text-uppercase fw-bold">
                        Q {i + 1}
                      </small>
                      <h6 className="mb-1 mt-1 fw-bold">{item.title}</h6>
                    </div>

                    <span className={`badge px-3 py-2 fs-6 ${item.score === item.maxScore ? 'bg-success' : 'bg-danger'}`}>
                      {item.score}/{item.maxScore} pts
                    </span>
                  </div>
                  
                  {item.description && (
                    <div className="mb-3 p-3 rounded" style={{ background: '#f8f9fa' }}>
                      <small className="text-muted d-block mb-2 fw-semibold">
                        <i className="bi bi-question-circle me-1"></i>
                        Question:
                      </small>
                      <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="mb-2">
                    <small className="text-muted fw-semibold">
                      <i className="bi bi-person me-1"></i>
                      Your Answer:
                    </small>
                    <p className={`mb-0 mt-1 ${item.score === item.maxScore ? 'text-success' : 'text-danger'}`}>
                      {userAnswerDisplay}
                    </p>
                  </div>
                  
                  {item.score !== item.maxScore && item.type !== 'interview' && (
                    <div className="mb-2">
                      <small className="text-success fw-semibold">
                        <i className="bi bi-check-circle me-1"></i>
                        Correct Answer:
                      </small>
                      <p className="text-success mb-0 mt-1">
                        {correctAnswerDisplay}
                      </p>
                    </div>
                  )}
                  
                  {item.explanation && (
                    <div
                      className="mt-3 p-3 rounded"
                      style={{
                        background: '#e8f5e9',
                        borderLeft: '3px solid #4caf50'
                      }}
                    >
                      <small className="text-success fw-semibold d-block mb-2">
                        <i className="bi bi-lightbulb me-1"></i>
                        Explanation:
                      </small>
                      <p className="mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {item.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div className="d-flex gap-3 mt-4 justify-content-center">
            <button className="btn btn-success" onClick={resetQuiz}>
              Retake Quiz
            </button>
            <Link to="/courses/dbms" className="btn btn-outline-secondary">
              Back to DBMS Course
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const q = questions[currentIdx]
  const total = questions.length
  const answered = Object.keys(answers).length
  const flaggedCount = Object.values(flaggedQuestions).filter(v => v === true).length

  const renderImage = (question) => {
    const imageUrl = question.image || question.images
    
    if (imageUrl && imageUrl.trim()) {
      const fullImageUrl = `/${imageUrl}`
      
      return (
        <div className="mb-4 text-center">
          <img
            src={fullImageUrl}
            alt={`Question ${currentIdx + 1} illustration`}
            className="img-fluid rounded shadow-sm"
            style={{
              maxHeight: '300px',
              objectFit: 'contain',
              cursor: 'pointer',
              backgroundColor: '#f5f5f5'
            }}
            onError={(e) => {
              console.error('Failed to load image:', fullImageUrl)
              e.target.style.display = 'none'

              const parent = e.target.parentElement
              const fallback = document.createElement('div')
              fallback.className = 'alert alert-warning mt-2'
              fallback.innerHTML = '⚠️ Image not available'
              parent.appendChild(fallback)
            }}
            onClick={() => window.open(fullImageUrl, '_blank')}
          />
        </div>
      )
    }

    return null
  }

  const MobileNavToggle = () => (
    <button
      className="d-lg-none btn btn-success rounded-circle position-fixed"
      onClick={() => setShowMobileNav(!showMobileNav)}
      style={{
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        width: '50px',
        height: '50px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <i className="bi bi-list" style={{ fontSize: '1.5rem' }}></i>
    </button>
  )

  return (
    <main className="main" style={{ background: '#ffffff', minHeight: '100vh' }}>
      <PageTitle />
      
      <div className="container-fluid px-3 px-lg-4" style={{ maxWidth: 1400 }}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {q && (
              <div
                className="card border-0 shadow-lg mb-4"
                style={{ borderRadius: 16, borderLeft: '5px solid #4caf50' }}
              >
                <div className="card-body p-4 p-lg-5">
                  <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                    <h4 className="mb-0">
                      Q{currentIdx + 1}: {q.title}
                    </h4>

                    <div className="d-flex gap-2">
                      <button
                        onClick={() => toggleFlag(q.questionId)}
                        className="btn btn-sm rounded-pill"
                        style={{
                          background: flaggedQuestions[q.questionId] ? '#ffc107' : '#f8f9fa',
                          border: `1px solid ${flaggedQuestions[q.questionId] ? '#ffc107' : '#dee2e6'}`,
                          color: flaggedQuestions[q.questionId] ? '#000' : '#6c757d'
                        }}
                        title={flaggedQuestions[q.questionId] ? 'Remove flag' : 'Flag for review'}
                      >
                        <i className={`bi ${flaggedQuestions[q.questionId] ? 'bi-flag-fill' : 'bi-flag'}`}></i>
                        {flaggedQuestions[q.questionId] && <span className="ms-1">Flagged</span>}
                      </button>

                      <span
                        className="badge px-3 py-2"
                        style={{
                          background: 'linear-gradient(135deg,#2e7d32,#4caf50)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <i className="bi bi-star-fill me-1"></i>
                        {q.maxScore || 1} pt{(q.maxScore || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  {q.description && (
                    <p className="text-muted lead mb-4" style={{ fontSize: '1rem' }}>
                      {q.description}
                    </p>
                  )}
                  
                  {renderImage(q)}
                  
                  {q.code && (
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-code-square me-2"></i>
                        Code:
                      </label>

                      <pre
                        className="p-3 rounded"
                        style={{
                          background: '#f8f9fa',
                          color: '#333333',
                          fontSize: '0.88rem',
                          overflowX: 'auto',
                          borderRadius: '12px',
                          fontFamily: 'monospace'
                        }}
                      >
                        {q.code}
                      </pre>
                    </div>
                  )}

                  {q.type === 'mcq-single' && (
                    <div className="d-flex flex-column gap-3 mt-4">
                      <label className="fw-semibold mb-2">
                        Select your answer:
                      </label>

                      {q.options?.map((opt, i) => {
                        const sel = answers[q.questionId] === opt

                        return (
                          <div
                            key={i}
                            onClick={() => handleAnswer(q.questionId, opt, 'mcq-single')}
                            className="p-3 rounded transition-all"
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: sel
                                ? 'linear-gradient(135deg, rgba(76,175,80,0.12), rgba(46,125,50,0.12))'
                                : '#f8f9fa',
                              border: `2px solid ${sel ? '#4caf50' : '#dee2e6'}`,
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  background: sel ? '#4caf50' : '#dee2e6',
                                  color: sel ? 'white' : '#666',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}
                              >
                                {String.fromCharCode(65 + i)}
                              </div>

                              <span className="flex-grow-1">{opt}</span>

                              {sel && <i className="bi bi-check-circle-fill text-success"></i>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'mcq-multiple' && (
                    <div className="d-flex flex-column gap-3 mt-4">
                      <label className="fw-semibold mb-2">
                        <i className="bi bi-check2-square me-2"></i>
                        Select all that apply:
                      </label>

                      <small className="text-muted mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Click on options to select/deselect
                      </small>

                      {q.options?.map((opt, i) => {
                        const cur = Array.isArray(answers[q.questionId])
                          ? answers[q.questionId]
                          : []

                        const sel = cur.includes(opt)

                        return (
                          <div
                            key={i}
                            onClick={() => handleAnswer(q.questionId, opt, 'mcq-multiple')}
                            className="p-3 rounded transition-all"
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              background: sel ? 'rgba(76,175,80,0.12)' : '#f8f9fa',
                              border: `2px solid ${sel ? '#4caf50' : '#dee2e6'}`
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  border: `2px solid ${sel ? '#4caf50' : '#dee2e6'}`,
                                  borderRadius: 6,
                                  background: sel ? '#4caf50' : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {sel && (
                                  <i
                                    className="bi bi-check text-white"
                                    style={{ fontSize: '0.8rem' }}
                                  ></i>
                                )}
                              </div>

                              <span className="flex-grow-1">{opt}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'numerical' && (
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-calculator me-2"></i>
                        Your Answer:
                      </label>

                      <input
                        type="number"
                        className="form-control form-control-lg"
                        style={{ maxWidth: 250 }}
                        value={answers[q.questionId] || ''}
                        onChange={e => handleAnswer(q.questionId, e.target.value, 'numerical')}
                        placeholder="Enter your answer"
                      />
                    </div>
                  )}

                  {q.type === 'interview' && (
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-mic me-2"></i>
                        Your Answer:
                      </label>

                      <textarea
                        className="form-control"
                        rows={5}
                        value={answers[q.questionId] || ''}
                        onChange={e => handleAnswer(q.questionId, e.target.value, 'interview')}
                        placeholder="Type your answer here..."
                      />

                      <small className="text-muted mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i>
                        This is an interview-style question. Your answer will be reviewed by instructors.
                      </small>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center gap-3 mt-5 pt-3 border-top">
                    <button
                      className="btn btn-outline-success px-4 py-2"
                      onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                      disabled={currentIdx === 0}
                    >
                      <i className="bi bi-chevron-left me-2"></i>
                      Previous
                    </button>
                    
                    {currentIdx < total - 1 ? (
                      <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))}
                      >
                        Next
                        <i className="bi bi-chevron-right ms-2"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => handleSubmit()}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Submit Quiz
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-12 col-lg-4">
            <div
              className={`card border-0 shadow-lg ${showMobileNav ? 'd-block' : 'd-none d-lg-block'}`}
              style={{ borderRadius: 16, marginBottom: '20px' }}
            >
              <div
                className="card-header"
                style={{
                  background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                  borderRadius: '16px 16px 0 0',
                  padding: '16px 20px'
                }}
              >
                <h5 className="mb-0 text-white">
                  <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                  Question Navigator
                </h5>

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <p className="text-white-50 small mb-0">
                    {answered} of {total} answered
                  </p>

                  {flaggedCount > 0 && (
                    <p className="text-white-50 small mb-0">
                      <i className="bi bi-flag-fill me-1"></i>
                      {flaggedCount} flagged
                    </p>
                  )}
                </div>
              </div>

              <div className="card-body p-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {questions.map((qn, i) => {
                    const isAnswered =
                      answers[qn?.questionId] !== undefined &&
                      answers[qn?.questionId] !== null &&
                      (
                        Array.isArray(answers[qn?.questionId])
                          ? answers[qn?.questionId].length > 0
                          : answers[qn?.questionId] !== ''
                      )

                    const isCurrent = i === currentIdx
                    const isFlagged = flaggedQuestions[qn?.questionId]
                    
                    let bgColor = '#f8f9fa'
                    let textColor = '#6c757d'
                    
                    if (isCurrent) {
                      bgColor = 'linear-gradient(135deg, #2e7d32, #4caf50)'
                      textColor = 'white'
                    } else if (isAnswered) {
                      bgColor = '#4caf50'
                      textColor = 'white'
                    }
                    
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentIdx(i)
                          setShowMobileNav(false)
                        }}
                        className="btn rounded-circle p-0 position-relative"
                        style={{
                          width: 44,
                          height: 44,
                          fontSize: '0.9rem',
                          fontWeight: isCurrent ? 'bold' : 'normal',
                          background: bgColor,
                          color: textColor,
                          border: isCurrent
                            ? '3px solid #ffc107'
                            : isFlagged
                              ? '2px solid #ffc107'
                              : '1px solid #dee2e6',
                          transition: 'all 0.2s ease',
                          boxShadow: isCurrent
                            ? '0 4px 12px rgba(76,175,80,0.4)'
                            : 'none'
                        }}
                        title={`Question ${i + 1}${isAnswered ? ' (Answered)' : ' (Not answered)'}${isFlagged ? ' - Flagged' : ''}`}
                      >
                        {i + 1}

                        {isFlagged && (
                          <span style={{ position: 'absolute', top: '-5px', right: '-5px' }}>
                            <i
                              className="bi bi-flag-fill"
                              style={{ fontSize: '0.7rem', color: '#ffc107' }}
                            ></i>
                          </span>
                        )}

                        {isAnswered && !isCurrent && (
                          <span style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}>
                            <i
                              className="bi bi-check-circle-fill text-white"
                              style={{
                                fontSize: '0.7rem',
                                background: '#4caf50',
                                borderRadius: '50%'
                              }}
                            ></i>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex justify-content-around flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                          border: '2px solid #ffc107'
                        }}
                      ></div>
                      <small>Current</small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#4caf50'
                        }}
                      ></div>
                      <small>Answered</small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#f8f9fa',
                          border: '1px solid #dee2e6'
                        }}
                      ></div>
                      <small>Pending</small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-flag-fill" style={{ color: '#ffc107' }}></i>
                      <small>Flagged</small>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <div className="p-2 rounded" style={{ background: '#e8f5e9' }}>
                        <div className="fs-4 fw-bold text-success">
                          {Math.round((answered / total) * 100)}%
                        </div>
                        <small className="text-muted">Complete</small>
                      </div>
                    </div>

                    <div className="col-4">
                      <div className="p-2 rounded" style={{ background: '#e8f5e9' }}>
                        <div className="fs-4 fw-bold text-success">
                          {answered}
                        </div>
                        <small className="text-muted">Done</small>
                      </div>
                    </div>

                    <div className="col-4">
                      <div className="p-2 rounded" style={{ background: '#fff3cd' }}>
                        <div className="fs-4 fw-bold" style={{ color: '#ffc107' }}>
                          {flaggedCount}
                        </div>
                        <small className="text-muted">Flagged</small>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileNavToggle />

      {showMobileNav && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            cursor: 'pointer'
          }}
          onClick={() => setShowMobileNav(false)}
        ></div>
      )}
      
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />
    </main>
  )
}

export default DBMSTestQuiz
