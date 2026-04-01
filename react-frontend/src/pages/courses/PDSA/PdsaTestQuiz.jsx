import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const WEEK_CONFIG = {
  '1':  { topic: 'Python Basics',                 name: 'Python Basics Quiz' },
  '2':  { topic: 'Sorting Algorithms',            name: 'Sorting Algorithms Quiz' },
  '3':  { topic: 'Linear Data Structures',        name: 'Linear Data Structures Quiz' },
  '4':  { topic: 'Introduction to Graphs',        name: 'Introduction to Graphs Quiz' },
  '5':  { topic: 'Graph Algorithms',              name: 'Graph Algorithms Quiz' },
  '6':  { topic: 'Advanced Data Structures',      name: 'Advanced Data Structures Quiz' },
  '7':  { topic: 'Advanced Algorithms',           name: 'Advanced Algorithms Quiz' },
  '8':  { topic: 'Divide and Conquer Algorithms', name: 'Divide and Conquer Algorithms Quiz' },
  '9':  { topic: 'Dynamic Programming',           name: 'Dynamic Programming Quiz' },
  '10': { topic: 'Linear Programming',            name: 'Linear Programming Quiz' },
  'midterm1': { topic: 'Midterm-1', name: 'Midterm 1 Exam' },
  'midterm2': { topic: 'Midterm-2', name: 'Midterm 2 Exam' },
  'endterm':  { topic: 'End Term',  name: 'End Term Exam'  },
}

const PdsaTestQuiz = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const config = WEEK_CONFIG[weekId]
  const topic = config?.topic
  const quizName = config?.name

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
    if (!topic) { setError('Invalid quiz configuration'); setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/questions/${encodeURIComponent(topic)}?limit=50`, { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.questions?.length > 0) {
        setQuestions(data.questions)
      } else {
        setError(data.message || 'No questions found for this topic')
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
        return { ...prev, [questionId]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] }
      }
      return { ...prev, [questionId]: value }
    })
  }

  const calculateScore = () => {
    let score = 0, totalPossible = 0
    const breakdown = []
    questions.forEach(q => {
      const max = q.maxScore || 1
      totalPossible += max
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
      }
      score += earned
      breakdown.push({ questionId: q.questionId, title: q.title, type: q.type, userAnswer: ua, correctAnswer: q.correctAnswer, score: earned, maxScore: max })
    })
    return { score, totalPossible, breakdown }
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    const { score, totalPossible, breakdown } = calculateScore()
    const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
    try {
      await fetch(`${API}/api/pdsa-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user.email, username: user.username, topic, quizName, score, totalPossible, percentage, timestamp: new Date().toISOString(), answers: breakdown }),
      })
    } catch {}
    setResult({ score, totalPossible, percentage, breakdown })
    setSubmitted(true)
    setSubmitting(false)
  }

  const resetQuiz = () => {
    setSubmitted(false); setCurrentIdx(0); setAnswers({}); setResult(null)
    setLoading(true); fetchQuestions()
  }

  if (!config) return (
    <div className="container py-5 text-center">
      <div className="alert alert-warning"><h4>Invalid Quiz Week</h4><Link to="/courses/pdsa" className="btn btn-primary mt-2">Back to PDSA</Link></div>
    </div>
  )

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center"><div className="spinner-border text-primary mb-3"></div><p>Loading {quizName}...</p></div>
    </div>
  )

  if (error) return (
    <div className="container py-5">
      <div className="alert alert-danger text-center">
        <h4>Error Loading Quiz</h4><p>{error}</p>
        <button className="btn btn-primary me-2" onClick={() => { setError(null); setLoading(true); fetchQuestions() }}>Retry</button>
        <Link to="/courses/pdsa" className="btn btn-secondary">Back to PDSA</Link>
      </div>
    </div>
  )

  const PageTitle = () => (
    <div className="page-title" style={{ marginBottom: '2rem' }}>
      <div className="heading"><div className="container">
        <div className="row d-flex justify-content-center text-center">
          <div className="col-lg-8"><h1>{quizName}</h1><p className="mb-0">{topic}</p></div>
        </div>
      </div></div>
      <nav className="breadcrumbs"><div className="container"><ol>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses/pdsa">PDSA</Link></li>
        <li className="current">{quizName}</li>
      </ol></div></nav>
    </div>
  )

  if (submitted && result) {
    const pct = result.percentage
    const grade = pct >= 80 ? { label: 'Excellent!', cls: 'bg-success' } : pct >= 60 ? { label: 'Good!', cls: 'bg-info' } : { label: 'Keep Practicing!', cls: 'bg-warning text-dark' }
    return (
      <main className="main">
        <PageTitle />
        <div className="container py-4" style={{ maxWidth: 900 }}>
          <div className="card border-0 shadow text-center mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body p-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16 }}>
              <h2 className="text-white mb-1">Quiz Complete!</h2>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: 'white' }}>{pct}%</div>
              <p className="text-white mb-2">{result.score} / {result.totalPossible} points</p>
              <span className={`badge mt-1 px-3 py-2 fs-6 ${grade.cls}`}>{grade.label}</span>
            </div>
          </div>
          <h5 className="mb-3">Question Breakdown</h5>
          {result.breakdown.map((item, i) => (
            <div key={i} className="card mb-2 border-0 shadow-sm" style={{ borderRadius: 8, borderLeft: `4px solid ${item.score === item.maxScore ? '#28a745' : '#dc3545'}` }}>
              <div className="card-body py-2 px-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <small className="text-muted">Q{i + 1}</small>
                    <p className="mb-1 fw-medium">{item.title}</p>
                    <small className="text-muted">Your answer: {Array.isArray(item.userAnswer) ? item.userAnswer.join(', ') : (item.userAnswer ?? 'Not answered')}</small>
                    {item.score !== item.maxScore && <><br /><small className="text-success">Correct: {Array.isArray(item.correctAnswer) ? item.correctAnswer.join(', ') : item.correctAnswer}</small></>}
                  </div>
                  <span className={`badge ${item.score === item.maxScore ? 'bg-success' : 'bg-danger'}`}>{item.score}/{item.maxScore}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="d-flex gap-3 mt-4 justify-content-center">
            <button className="btn btn-primary" onClick={resetQuiz}>Retake Quiz</button>
            <Link to="/courses/pdsa" className="btn btn-outline-secondary">Back to PDSA</Link>
          </div>
        </div>
      </main>
    )
  }

  const q = questions[currentIdx]
  const total = questions.length
  const answered = Object.keys(answers).length

  return (
    <main className="main">
      <PageTitle />
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Progress */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
          <div className="card-body py-2 px-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Question {currentIdx + 1} of {total}</span>
              <span className="text-muted small">{answered} / {total} answered</span>
            </div>
            <div className="progress" style={{ height: 8 }}>
              <div className="progress-bar" style={{ width: `${((currentIdx + 1) / total) * 100}%`, background: '#667eea' }}></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        {q && (
          <div className="card border-0 shadow mb-3" style={{ borderRadius: 12, borderLeft: '5px solid #667eea' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0">Q{currentIdx + 1}: {q.title}</h5>
                <span className="badge px-3 py-2" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', fontSize: '0.85rem' }}>
                  {q.maxScore || 1} pt{(q.maxScore || 1) > 1 ? 's' : ''}
                </span>
              </div>
              {q.description && <p className="text-muted">{q.description}</p>}
              {q.code && (
                <pre className="p-3 mb-3 rounded" style={{ background: '#1e1e1e', color: '#d4d4d4', fontSize: '0.88rem', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{q.code}</pre>
              )}

              {q.type === 'mcq-single' && (
                <div className="d-flex flex-column gap-2 mt-3">
                  {q.options?.map((opt, i) => {
                    const sel = answers[q.questionId] === opt
                    return (
                      <div key={i} onClick={() => handleAnswer(q.questionId, opt, 'mcq-single')}
                        className="p-3 rounded" style={{ cursor: 'pointer', transition: 'all 0.2s', background: sel ? 'rgba(102,126,234,0.12)' : '#f8f9fa', border: `1px solid ${sel ? '#667eea' : '#dee2e6'}` }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: sel ? '#667eea' : '#dee2e6', color: sel ? 'white' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span>{opt}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {q.type === 'mcq-multiple' && (
                <div className="d-flex flex-column gap-2 mt-3">
                  <small className="text-muted"><i className="bi bi-info-circle me-1"></i>Select all that apply</small>
                  {q.options?.map((opt, i) => {
                    const cur = Array.isArray(answers[q.questionId]) ? answers[q.questionId] : []
                    const sel = cur.includes(opt)
                    return (
                      <div key={i} onClick={() => handleAnswer(q.questionId, opt, 'mcq-multiple')}
                        className="p-3 rounded" style={{ cursor: 'pointer', transition: 'all 0.2s', background: sel ? 'rgba(102,126,234,0.12)' : '#f8f9fa', border: `1px solid ${sel ? '#667eea' : '#dee2e6'}` }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 20, height: 20, border: `2px solid ${sel ? '#667eea' : '#dee2e6'}`, borderRadius: 4, background: sel ? '#667eea' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <i className="bi bi-check text-white" style={{ fontSize: '0.7rem' }}></i>}
                          </div>
                          <span>{opt}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {q.type === 'numerical' && (
                <div className="mt-3">
                  <label className="form-label fw-medium">Your Answer (numerical)</label>
                  <input type="number" className="form-control" style={{ maxWidth: 200 }}
                    value={answers[q.questionId] || ''}
                    onChange={e => handleAnswer(q.questionId, e.target.value, 'numerical')}
                    placeholder="Enter number" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-outline-secondary" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
            <i className="bi bi-chevron-left me-1"></i>Previous
          </button>
          <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ maxWidth: 500 }}>
            {questions.map((qn, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`btn btn-sm rounded-circle p-0 ${i === currentIdx ? 'btn-primary' : answers[qn?.questionId] !== undefined ? 'btn-success' : 'btn-outline-secondary'}`}
                style={{ width: 30, height: 30, fontSize: '0.75rem', flexShrink: 0 }}>
                {i + 1}
              </button>
            ))}
          </div>
          {currentIdx < total - 1
            ? <button className="btn btn-primary" onClick={() => setCurrentIdx(i => Math.min(total - 1, i + 1))}>Next<i className="bi bi-chevron-right ms-1"></i></button>
            : <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Submitting...</> : 'Submit Quiz'}
              </button>
          }
        </div>
      </div>
    </main>
  )
}

export default PdsaTestQuiz
