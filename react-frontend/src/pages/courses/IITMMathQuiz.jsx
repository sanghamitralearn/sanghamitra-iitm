import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const DIFF_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' }

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, topic, quizName, onRetake }) => {
  const [expanded, setExpanded] = useState(null)

  const getOptionLabel = (question, answer) => {
    if (answer === null || answer === undefined || answer === '') return '(no answer)'
    if (question.type === 'multiple_choice') {
      const idx = typeof answer === 'string' ? parseInt(answer) : answer
      return question.options?.[idx] ?? String(answer)
    }
    if (question.type === 'multiple_select') {
      const arr = Array.isArray(answer) ? answer : [answer]
      return arr.map(i => question.options?.[i] ?? String(i)).join(', ')
    }
    return String(answer)
  }

  const getCorrectLabel = (question) => {
    const ca = question.correct_answer
    if (question.type === 'multiple_choice') {
      const idx = typeof ca === 'string' ? parseInt(ca) : ca
      return question.options?.[idx] ?? String(ca)
    }
    if (question.type === 'multiple_select') {
      const arr = Array.isArray(ca) ? ca : [ca]
      return arr.map(i => question.options?.[i] ?? String(i)).join(', ')
    }
    return String(ca)
  }

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{quizName} — Review</h1>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/IIITM-math">IITM Math</Link></li>
              <li className="current">Review</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        {/* Score Summary */}
        <div className="card border-0 shadow-sm mb-4 text-center" style={{ borderRadius: 16 }}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: results.percentage >= 60 ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#c82333)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{results.percentage}%</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{results.score}/{questions.length}</span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">{results.percentage >= 80 ? 'Excellent!' : results.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}</h4>
                <p className="text-muted mb-1">Correct: <strong className="text-success">{results.score}</strong> / Wrong: <strong className="text-danger">{questions.length - results.score}</strong></p>
                <p className="text-muted mb-0">Total time: {Math.round(results.questionResults.reduce((s, r) => s + (r.timeTaken || 0), 0) / 60)} min {results.questionResults.reduce((s, r) => s + (r.timeTaken || 0), 0) % 60} sec</p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" /> Retake
              </button>
              <Link to="/courses/IIITM-math" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1" /> Back
              </Link>
            </div>
          </div>
        </div>

        {/* Question-by-question review */}
        {questions.map((q, idx) => {
          const result = results.questionResults[idx]
          const userAnswer = answers[q._id]
          const isOpen = expanded === idx

          return (
            <div key={q._id} className={`card border-0 shadow-sm mb-3`} style={{ borderRadius: 12, borderLeft: `4px solid ${result?.isCorrect ? '#28a745' : '#dc3545'}` }}>
              <div
                className="card-body"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : idx)}
              >
                <div className="d-flex align-items-start gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: result?.isCorrect ? '#28a745' : '#dc3545', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${result?.isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 14 }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                        Q{idx + 1}. {q.question_text.length > 120 && !isOpen ? q.question_text.slice(0, 120) + '…' : q.question_text}
                      </p>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className={`badge bg-${DIFF_COLORS[q.difficulty] || 'secondary'}`}>{q.difficulty}</span>
                      <span className="badge bg-secondary text-capitalize">{q.type?.replace(/_/g, ' ')}</span>
                      {result?.timeTaken > 0 && <span className="badge bg-light text-dark"><i className="bi bi-clock me-1" />{result.timeTaken}s</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5">
                    {/* Options for MCQ */}
                    {(q.type === 'multiple_choice' || q.type === 'multiple_select') && q.options && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const correctIdx = q.type === 'multiple_choice'
                            ? (typeof q.correct_answer === 'string' ? parseInt(q.correct_answer) : q.correct_answer)
                            : null
                          const correctArr = q.type === 'multiple_select'
                            ? (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer])
                            : []
                          const isCorrectOpt = q.type === 'multiple_choice' ? oi === correctIdx : correctArr.includes(oi)
                          const userPicked = q.type === 'multiple_choice'
                            ? (typeof userAnswer === 'string' ? parseInt(userAnswer) : userAnswer) === oi
                            : (Array.isArray(userAnswer) ? userAnswer.includes(oi) : false)

                          let bg = 'transparent'
                          if (isCorrectOpt) bg = '#d4edda'
                          else if (userPicked && !isCorrectOpt) bg = '#f8d7da'

                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success" />}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger" />}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                              <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* For non-MCQ types */}
                    {q.type !== 'multiple_choice' && q.type !== 'multiple_select' && (
                      <div className="row g-2 mb-3">
                        <div className="col-auto">
                          <span className="badge bg-light text-dark border">Your answer: <strong>{getOptionLabel(q, userAnswer)}</strong></span>
                        </div>
                        <div className="col-auto">
                          <span className="badge bg-success text-white">Correct: <strong>{getCorrectLabel(q)}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                        <i className="bi bi-lightbulb me-2" />
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ─── Main Quiz Component ───────────────────────────────────────────────────────
const IITMMathQuiz = () => {
  const { topic } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const quizName = location.state?.quizName || topic?.replace(/_/g, ' ').replace(/-/g, ' ')

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef = useRef({})

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        fetchQuestions(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchQuestions = async (email) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/iitm-math-questions/${encodeURIComponent(topic)}?email=${encodeURIComponent(email)}&count=15`,
        { withCredentials: true }
      )
      const qs = res.data.questions || []
      setQuestions(qs)
      if (qs.length === 0) setError('No questions found for this topic yet.')
    } catch (err) {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentTime = (qId) => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[qId] = (timesRef.current[qId] || 0) + elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (newIdx) => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)
    setCurrentIndex(newIdx)
  }

  const handleAnswer = (qId, value) => setAnswers(p => ({ ...p, [qId]: value }))

  const handleMultiSelect = (qId, optIdx, checked) => {
    setAnswers(p => {
      const cur = p[qId] || []
      return { ...p, [qId]: checked ? [...cur, optIdx] : cur.filter(i => i !== optIdx) }
    })
  }

  const checkCorrect = (question, userAnswer) => {
    const ca = question.correct_answer
    const alts = question.alternative_answers || []

    if (question.type === 'multiple_choice') {
      const caIdx = typeof ca === 'string' ? parseInt(ca) : ca
      const uaIdx = typeof userAnswer === 'string' ? parseInt(userAnswer) : userAnswer
      return uaIdx === caIdx
    }
    if (question.type === 'multiple_select') {
      if (!Array.isArray(userAnswer)) return false
      const ua = [...userAnswer].map(Number).sort((a, b) => a - b)
      const expected = (Array.isArray(ca) ? ca : [ca]).map(Number).sort((a, b) => a - b)
      return JSON.stringify(ua) === JSON.stringify(expected)
    }
    if (question.type === 'numeric' || question.type === 'numeric_input') {
      const uNum = parseFloat(userAnswer)
      const cNum = parseFloat(ca)
      if (isNaN(uNum) || isNaN(cNum)) return false
      if (Math.abs(uNum - cNum) <= 0.001) return true
      return alts.some(a => Math.abs(uNum - parseFloat(a)) <= 0.001)
    }
    const ua = String(userAnswer || '').trim().toLowerCase()
    const cStr = String(ca || '').trim().toLowerCase()
    return ua === cStr || alts.some(a => String(a).trim().toLowerCase() === ua)
  }

  const handleSubmit = async () => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)

    const questionResults = questions.map((question) => {
      const userAnswer = answers[question._id]
      const correct = checkCorrect(question, userAnswer)
      const formatAnswer = (a) => {
        if (a === null || a === undefined) return ''
        if (Array.isArray(a)) return a.join(', ')
        return String(a)
      }
      return {
        questionId: question._id,
        questionNumber: question.question_number,
        questionText: question.question_text,
        userAnswer: formatAnswer(userAnswer),
        correctAnswer: formatAnswer(question.correct_answer),
        isCorrect: correct,
        timeTaken: timesRef.current[question._id] || 0
      }
    })

    const score = questionResults.filter(r => r.isCorrect).length
    const percentage = Math.round((score / questions.length) * 100)

    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/iitmmath_scores`, {
        email: user.email,
        username: user.username || user.name || user.email,
        quizData: { topic, score, totalQuestions: questions.length, percentage, timestamp: new Date(), questionResults }
      }, { withCredentials: true })
    } catch (err) {
      console.error('Score save failed:', err)
    } finally {
      setSaving(false)
    }

    setResults({ score, percentage, questionResults })
    setSubmitted(true)
  }

  const handleRetake = () => {
    setAnswers({})
    setCurrentIndex(0)
    setSubmitted(false)
    setResults(null)
    timesRef.current = {}
    questionStartRef.current = Date.now()
    // Re-fetch questions for fresh random set
    if (user) fetchQuestions(user.email)
  }

  const renderInput = (question) => {
    const { _id, type, options, format_hint } = question
    const answer = answers[_id]

    if (type === 'multiple_choice') {
      return (
        <div className="mt-3">
          {options?.map((opt, idx) => (
            <div key={idx} className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                name={`q-${_id}`}
                id={`opt-${_id}-${idx}`}
                checked={(typeof answer === 'string' ? parseInt(answer) : answer) === idx}
                onChange={() => handleAnswer(_id, idx)}
              />
              <label className="form-check-label" htmlFor={`opt-${_id}-${idx}`} style={{ fontSize: '0.95rem' }}>
                {opt}
              </label>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'multiple_select') {
      const selected = answer || []
      return (
        <div className="mt-3">
          <small className="text-muted d-block mb-2"><i className="bi bi-info-circle me-1" />Select all that apply</small>
          {options?.map((opt, idx) => (
            <div key={idx} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={`opt-${_id}-${idx}`}
                checked={selected.includes(idx)}
                onChange={(e) => handleMultiSelect(_id, idx, e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`opt-${_id}-${idx}`} style={{ fontSize: '0.95rem' }}>
                {opt}
              </label>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'numeric' || type === 'numeric_input') {
      return (
        <div className="mt-3">
          {format_hint && <small className="text-muted d-block mb-1"><i className="bi bi-pencil me-1" />{format_hint}</small>}
          <input
            type="number"
            className="form-control"
            style={{ maxWidth: 220 }}
            value={answer ?? ''}
            onChange={(e) => handleAnswer(_id, e.target.value)}
            placeholder="Enter a number"
          />
        </div>
      )
    }

    // text_input, equation_input, interval_input, coordinate_input
    const placeholder = type === 'interval_input' ? 'e.g. [0, 1] or (−∞, 2]' : type === 'coordinate_input' ? 'e.g. (3, −2)' : type === 'equation_input' ? 'e.g. y = 2x + 1' : 'Your answer'
    return (
      <div className="mt-3">
        {format_hint && <small className="text-muted d-block mb-1"><i className="bi bi-pencil me-1" />{format_hint}</small>}
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 400 }}
          value={answer ?? ''}
          onChange={(e) => handleAnswer(_id, e.target.value)}
          placeholder={placeholder}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-warning">{error}</div>
        <Link to="/courses/IIITM-math" className="btn btn-primary">Back to IITM Math</Link>
      </div>
    )
  }

  if (submitted && results) {
    return (
      <ReviewPage
        questions={questions}
        answers={answers}
        results={results}
        topic={topic}
        quizName={quizName}
        onRetake={handleRetake}
      />
    )
  }

  const q = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <main className="main">
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{quizName}</h1>
                <p className="mb-0">IITM Mathematics — {questions.length} questions</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/IIITM-math">IITM Math</Link></li>
              <li className="current">{quizName}</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">

            {/* Progress bar */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Question {currentIndex + 1} of {questions.length}</small>
                <small className="text-muted">{answeredCount} answered</small>
              </div>
              <div className="progress" style={{ height: 6 }}>
                <div className="progress-bar bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Question card */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex gap-2 mb-3">
                  <span className={`badge bg-${DIFF_COLORS[q.difficulty] || 'secondary'}`}>{q.difficulty}</span>
                  <span className="badge bg-secondary text-capitalize">{q.type?.replace(/_/g, ' ')}</span>
                  {q.points > 1 && <span className="badge bg-info">{q.points} pts</span>}
                </div>

                <h5 className="mb-3" style={{ lineHeight: 1.6 }}>
                  <span className="text-muted me-2">{currentIndex + 1}.</span>
                  {q.question_text}
                </h5>

                {renderInput(q)}
              </div>
            </div>

            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center">
              <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                <i className="bi bi-chevron-left me-1" />Prev
              </button>

              <div className="d-flex gap-1 flex-wrap justify-content-center" style={{ maxWidth: 400 }}>
                {questions.map((qItem, i) => {
                  const answered = answers[qItem._id] !== undefined && answers[qItem._id] !== ''
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={qItem._id}
                      className={`btn btn-sm ${isCurrent ? 'btn-primary' : answered ? 'btn-success' : 'btn-outline-secondary'}`}
                      style={{ width: 36, height: 36, padding: 0, fontSize: '0.8rem' }}
                      onClick={() => goTo(i)}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex + 1)}>
                  Next<i className="bi bi-chevron-right ms-1" />
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={answeredCount < questions.length || saving}
                >
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />Saving…</> : <><i className="bi bi-check-circle me-1" />Submit</>}
                </button>
              )}
            </div>

            {answeredCount < questions.length && currentIndex === questions.length - 1 && (
              <div className="alert alert-warning mt-3 py-2" style={{ fontSize: '0.88rem' }}>
                <i className="bi bi-exclamation-triangle me-2" />
                {questions.length - answeredCount} question{questions.length - answeredCount > 1 ? 's' : ''} unanswered. Use the number buttons to go back.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default IITMMathQuiz
