import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helper function to format multi-line text ───────────────────────────────
const formatMultiLineText = (text) => {
  if (!text) return ''
  // Handle both actual newlines and escaped \n
  return text.replace(/\\n/g, '\n')
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ results, onRetake, course, week }) => {
  const { stats, question_results: qrs } = results
  const [expanded, setExpanded] = useState(null)

  const coursePath = `/programming/courses/${course}`

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Week {week} — Review</h1>
              <p className="mb-0">Check your answers and see where you can improve.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li><Link to={coursePath}>Course</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {/* Score card */}
        <div className="card border-0 shadow-sm mb-4 text-center" style={{ borderRadius: 16 }}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: stats.percentage >= 60
                    ? 'linear-gradient(135deg,#28a745,#20c997)'
                    : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{stats.percentage}%</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{stats.correct}/{stats.total}</span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">
                  {stats.percentage >= 80 ? 'Excellent!' : stats.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
                </h4>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{stats.correct}</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{stats.total - stats.correct}</strong>
                </p>
                <p className="text-muted mb-0">
                  Points: <strong>{stats.score} / {stats.maxPossibleScore}</strong>
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" />Retake
              </button>
              <Link to={coursePath} className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1" />Back to Course
              </Link>
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        {qrs && qrs.map((qr, idx) => {
          const isOpen = expanded === idx
          const optionText = (optIdOrText) => {
            if (!optIdOrText) return '(no answer)'
            if (!Array.isArray(qr.options)) return String(optIdOrText)
            const opt = qr.options.find(o => o.id === optIdOrText || o.text === optIdOrText)
            return opt ? opt.text : String(optIdOrText)
          }

          const userAnsDisplay = (() => {
            const ua = qr.userAnswer
            if (ua === null || ua === undefined || ua === '') return '(no answer)'
            if (Array.isArray(ua)) return ua.map(optionText).join(', ')
            return optionText(ua)
          })()

          const correctAnsDisplay = (() => {
            const ca = qr.correct_answer
            if (ca === null || ca === undefined) return '—'
            if (Array.isArray(ca)) return ca.map(optionText).join(', ')
            return optionText(ca)
          })()

          return (
            <div key={idx} className="card border-0 shadow-sm mb-3"
              style={{ borderRadius: 12, borderLeft: `4px solid ${qr.isCorrect ? '#28a745' : '#dc3545'}` }}>
              <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : idx)}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: qr.isCorrect ? '#28a745' : '#dc3545',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className={`bi ${qr.isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                        Q{idx + 1}. {!isOpen && qr.question_text?.length > 100
                          ? qr.question_text.slice(0, 100) + '…'
                          : qr.question_text}
                      </p>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className="badge bg-secondary">{qr.question_type}</span>
                      {qr.subtopic && <span className="badge bg-info text-dark">{qr.subtopic}</span>}
                      {qr.difficulty && <span className="badge bg-light text-dark border">{qr.difficulty}</span>}
                      <span className="badge bg-light text-dark border">{qr.points || 1} pt{(qr.points || 1) !== 1 ? 's' : ''}</span>
                      {qr.marksAwarded > 0 && <span className="badge bg-success">+{qr.marksAwarded} earned</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {/* Code snippet */}
                    {qr.code_snippet && (
                      <pre className="bg-light text-dark rounded p-3 mb-4" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                        <code>{qr.code_snippet}</code>
                      </pre>
                    )}

                    {/* MCQ / MSQ options with multi-line support */}
                    {(qr.question_type === 'mcq' || qr.question_type === 'msq') && Array.isArray(qr.options) && (
                      <div className="mb-3">
                        {qr.options.map((opt, oi) => {
                          const correct = qr.correct_answer
                          const correctIds = Array.isArray(correct) ? correct : (correct ? [correct] : [])
                          const userIds = Array.isArray(qr.userAnswer) ? qr.userAnswer : (qr.userAnswer ? [qr.userAnswer] : [])
                          const isCorrectOpt = correctIds.includes(opt.id) || correctIds.includes(opt.text)
                          const userPicked = userIds.includes(opt.id) || userIds.includes(opt.text)
                          const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div key={oi} className="d-flex align-items-start gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                              <div className="mt-1">
                                {isCorrectOpt && <i className="bi bi-check-circle-fill text-success" />}
                                {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger" />}
                                {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                              </div>
                              <span style={{ fontSize: '0.9rem', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                                {formatMultiLineText(opt.text)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Numeric / True-False */}
                    {(qr.question_type === 'numeric' || qr.question_type === 'true-false') && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className={`badge ${qr.isCorrect ? 'bg-success' : 'bg-danger'}`}>
                          Your answer: <strong>{userAnsDisplay}</strong>
                        </span>
                        {!qr.isCorrect && (
                          <span className="badge bg-success">
                            Correct: <strong>{correctAnsDisplay}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Solution */}
                    {qr.solution && (
                      <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                        <strong>Solution:</strong> {qr.solution}
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
const QuizPage = () => {
  const { course, week: weekParam } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const weekNum = parseInt(weekParam, 10)
  const { quizName } = location.state || {}
  const displayName = quizName || `${course?.toUpperCase()} — Week ${weekNum}`

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const cheatingRef      = useRef(0)
  const userRef          = useRef(null)
  const startTimeRef     = useRef(new Date().toISOString())
  const questionRef      = useRef(null)
  const devToolsRef      = useRef(null)

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data); userRef.current = res.data
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/mcq-questions?course=${course}&week=${weekNum}&count=15`,
        { withCredentials: true }
      )
      const qs = res.data.questions || []
      if (!qs.length) { setError(`No questions found for ${course} Week ${weekNum}.`); return }
      setQuestions(qs)
      startTimeRef.current = new Date().toISOString()
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Anti-cheat
  useEffect(() => {
    if (submitted || loading) return
    const onContext = e => e.preventDefault()
    const onKey = e => {
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) ||
          (e.ctrlKey && ['U','u'].includes(e.key))) {
        e.preventDefault(); logCheat('keyboard_shortcut')
      }
      if (e.ctrlKey && ['A','a','C','c','V','v'].includes(e.key)) e.preventDefault()
    }
    const onBlur  = () => { setTabWarning(true); logCheat('tab_switch') }
    const onFocus = () => setTabWarning(false)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    devToolsRef.current = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        logCheat('devtools_open')
      }
    }, 2000)
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      clearInterval(devToolsRef.current)
    }
  }, [submitted, loading])

  const logCheat = async (type) => {
    cheatingRef.current += 1
    try {
      await axios.post(`${API}/api/log-cheating`, {
        email: userRef.current?.email, type, quiz: displayName, timestamp: new Date().toISOString()
      }, { withCredentials: true })
    } catch {}
    if (cheatingRef.current >= 5) handleSubmit(true)
  }

  // Answer helpers — options use {id, text}; we store the option id
  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
    })
  }

  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = (timesRef.current[currentIndex] || 0) + elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_, i) => {
        const a = answers[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    const u = userRef.current
    if (!u?.email) { navigate('/login', { replace: true }); return }

    setSaving(true)
    const endTime = new Date().toISOString()
    const totalTimeTaken = Object.values(timesRef.current).reduce((a, b) => a + b, 0)

    const questionResults = questions.map((q, i) => ({
      questionId: q._id,
      userAnswer: answers[i] ?? null,
      timeTaken: timesRef.current[i] || 0
    }))

    try {
      const res = await axios.post(`${API}/api/mcq-quiz/submit`, {
        email: u.email,
        username: u.username || u.name || u.email,
        quizData: {
          course,
          week: weekNum,
          topic: questions[0]?.topic || `Week ${weekNum}`,
          questionResults,
          startTime: startTimeRef.current,
          endTime,
          totalTimeTaken,
          cheatCount: cheatingRef.current
        }
      }, { withCredentials: true })

      if (res.data.success) {
        setResults(res.data)
        setSubmitted(true)
      } else {
        alert('Failed to save quiz. Please try again.')
      }
    } catch (e) {
      console.error('Submit failed:', e)
      alert('Failed to submit quiz. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setAnswers({}); setSubmitted(false); setResults(null)
    setCurrentIndex(0); timesRef.current = {}; cheatingRef.current = 0
    fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Loading {displayName}…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={fetchQuestions}>Retry</button>
      <Link to={`/programming/courses/${course}`} className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage results={results} onRetake={handleRetake} course={course} week={weekNum} />
  )

  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered = userAns !== undefined && userAns !== null && userAns !== '' &&
    !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  return (
    <main className="main">
      {/* Tab-switch warning */}
      {tabWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
          background: '#dc3545', color: '#fff', textAlign: 'center',
          padding: '8px', fontWeight: 600
        }}>
          ⚠️ Tab switching detected! Please stay on this page.
          <button onClick={() => setTabWarning(false)} style={{
            marginLeft: 16, background: 'none', border: '1px solid #fff',
            color: '#fff', borderRadius: 4, padding: '2px 10px', cursor: 'pointer'
          }}>Dismiss</button>
        </div>
      )}

      {/* Page title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">{course?.toUpperCase()} — Week {weekNum} Assessment</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li><Link to={`/programming/courses/${course}`}>Course</Link></li>
          <li className="current">Quiz</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5" ref={questionRef}>
        <div className="row g-4">
          {/* Question panel */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
                {/* Header badges */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>
                      {isAnswered ? 'Answered' : 'Unanswered'}
                    </span>
                    <span className="badge bg-primary">{q.question_type}</span>
                    {q.difficulty && <span className="badge bg-light text-dark border">{q.difficulty}</span>}
                    {q.subtopic && (
                      <span className="badge bg-info text-dark" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.subtopic}
                      </span>
                    )}
                    <span className="badge bg-light text-dark border">{q.points || 1} pt{(q.points || 1) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="progress mb-4" style={{ height: 6 }}>
                  <div className="progress-bar bg-primary" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                </div>

                {/* Question text */}
                <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {q.question_text}
                </p>

                {/* Code snippet */}
                {q.code_snippet && (
                  <pre className="bg-light text-dark rounded p-3 mb-4" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                    <code>{q.code_snippet}</code>
                  </pre>
                )}

                {/* Image */}
                {q.image_url && (
                  <img src={q.image_url} alt="question" className="img-fluid rounded mb-4" style={{ maxHeight: 300 }} />
                )}

                {/* MCQ with multi-line support */}
                {q.question_type === 'mcq' && Array.isArray(q.options) && (
                  <div>
                    {q.options.map((opt) => (
                      <div key={opt.id}
                        onClick={() => setAnswer(currentIndex, opt.id)}
                        className={`d-flex align-items-start gap-2 mb-2 p-3 rounded border ${userAns === opt.id ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                          border: `2px solid ${userAns === opt.id ? '#0d6efd' : '#adb5bd'}`,
                          background: userAns === opt.id ? '#0d6efd' : 'transparent'
                        }} />
                        <span style={{ fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.5', flex: 1 }}>
                          {formatMultiLineText(opt.text)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* MSQ with multi-line support */}
                {q.question_type === 'msq' && Array.isArray(q.options) && (
                  <div>
                    <p className="text-muted small mb-2">Select all that apply</p>
                    {q.options.map((opt) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.id)
                      return (
                        <div key={opt.id}
                          onClick={() => toggleMSQ(currentIndex, opt.id)}
                          className={`d-flex align-items-start gap-2 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: '2px',
                            border: `2px solid ${selected ? '#0d6efd' : '#adb5bd'}`,
                            background: selected ? '#0d6efd' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {selected && <i className="bi bi-check text-white" style={{ fontSize: 12 }} />}
                          </div>
                          <span style={{ fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.5', flex: 1 }}>
                            {formatMultiLineText(opt.text)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Numeric */}
                {q.question_type === 'numeric' && (
                  <div>
                    <p className="text-muted small mb-2">Enter your numeric answer</p>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="Enter answer…"
                      value={userAns || ''}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{ maxWidth: 280, fontFamily: 'monospace', fontSize: '1.1rem' }}
                    />
                  </div>
                )}

                {/* True/False */}
                {q.question_type === 'true-false' && (
                  <div className="d-flex gap-3">
                    {['true', 'false'].map(val => (
                      <div key={val}
                        onClick={() => setAnswer(currentIndex, val)}
                        className={`flex-grow-1 d-flex align-items-center justify-content-center p-3 rounded border ${userAns === val ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: 600, transition: 'all 0.15s' }}>
                        {val === 'true' ? '✅ True' : '❌ False'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length - 1
                    ? <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                        Next<i className="bi bi-arrow-right ms-1" />
                      </button>
                    : <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                          : <><i className="bi bi-check-lg me-1" />Submit</>}
                      </button>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Question navigator */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((_, i) => {
                    const a = answers[i]
                    const done = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    return (
                      <button key={i} onClick={() => goTo(i)}
                        className={`btn btn-sm ${i === currentIndex ? 'btn-primary' : done ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{ width: 36, height: 36, padding: 0, fontWeight: 600 }}>
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <hr />
                <div className="d-flex justify-content-between small text-muted">
                  <span><span className="badge bg-success me-1">■</span>Answered</span>
                  <span><span className="badge bg-secondary me-1">■</span>Skipped</span>
                  <span><span className="badge bg-primary me-1">■</span>Current</span>
                </div>
              </div>
            </div>

            {/* Submit card */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button className="btn btn-success w-100" onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : <><i className="bi bi-check-lg me-1" />Submit Quiz</>}
                </button>
                <Link to={`/programming/courses/${course}`} className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                  <i className="bi bi-arrow-left me-1" />Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default QuizPage
