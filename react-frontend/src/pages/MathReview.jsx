import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const DIFF_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' }
const TOPIC_PALETTE = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#6f42c1','#fd7e14','#858796']

const TOPIC_NAMES = {
  'Quiz1': 'Domain and Range Quiz',
  'Quiz2_Domain_Range': 'Domain and Range - 2 Quiz',
  'Quiz3_Linear_functions': 'Week 2 - Linear Functions Quiz',
  'Quiz4_Quadratic_functions': 'Week 3 - Quadratic Functions Quiz',
  'Quiz5_Linear_functions': 'Week 2 - Linear Functions - 1 Quiz',
  'Quiz6_Sets_and_Relations': 'Week 4 - Sets and Relations Quiz',
  'function_concepts': 'Week 4 - Polynomials Quiz',
  'Function_Limits': 'Week 7 - Sequences, Limits, and Continuity Quiz',
  'logarithmic_functions': 'Week 6 - Logarithmic Functions Quiz',
  'Limit_Concepts': 'Week 8 - Limits, Continuity and Differentiation Quiz',
  'Derivatives_Integrals': 'Week 9 - Derivatives and Integrals Quiz',
  'graph_theory': 'Week 10 - Graph Theory Quiz',
  'graph_properties': 'Week 11 - Graph Properties Quiz',
  'Limit': 'Limit Quiz',
}

const getDisplayName = (topic) => TOPIC_NAMES[topic] || topic || 'Quiz'

const fmtDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const fmtShortDate = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const fmtAnswer = (ans) => {
  if (ans === undefined || ans === null || ans === '') return '(no answer)'
  if (Array.isArray(ans)) return ans.join(', ') || '(no answer)'
  return String(ans)
}

function formatAnswerPreview(value, questionType) {
  if (!value) return ''
  let formatted = String(value).trim()
  if (questionType === 'interval_input') {
    formatted = formatted
      .replace(/infinity|∞/gi, '∞')
      .replace(/-inf/gi, '-∞')
      .replace(/\+inf/gi, '∞')
  } else if (questionType === 'numeric' || questionType === 'numeric_input') {
    formatted = formatted
      .replace(/infinity|∞/gi, '∞')
      .replace(/sqrt\(/g, '√(')
  }
  formatted = formatted
    .replace(/\*/g, '×')
    .replace(/pi/gi, 'π')
    .replace(/sqrt\(([^)]+)\)/g, '√($1)')
    .replace(/(\d+)\^(\d+)/g, '$1^$2')
    .replace(/≠/g, '≠')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥')
  return formatted
}

const MathReview = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [sortedTests, setSortedTests] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [activeTest, setActiveTest] = useState(null)

  const [pageLoading, setPageLoading] = useState(true)
  const [testLoading, setTestLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  // ── Auth + load scores ────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const sessRes = await axios.get(`${VITE_API_URL}/api/session-info`, { withCredentials: true })
        setUser(sessRes.data)
        await loadResults(sessRes.data.email)
      } catch (err) {
        console.error('Failed to load review data:', err)
        setError('Failed to load review data.')
      } finally {
        setPageLoading(false)
      }
    }
    init()
  }, [navigate])

  const loadResults = async (email) => {
    if (!email) { setError('Please login to view your results'); return }
    setError(null)
    try {
      const res = await axios.get(
        `${VITE_API_URL}/api/iitmmath_scores?email=${encodeURIComponent(email)}`,
        { withCredentials: true }
      )
      if (!res.data.success || !res.data.data) {
        setSortedTests([])
        setError('No quiz results found for your account.')
        return
      }
      const userData = res.data.data
      if (!userData?.quizScores?.length) {
        setSortedTests([])
        setError('No quiz results found for your account.')
        return
      }
      const tests = userData.quizScores.map((quiz) => {
        const topic = quiz.topic || ''
        const questionResults = quiz.questionResults || []
        return {
          originalTopic: topic,
          displayName: getDisplayName(topic),
          totalQuestions: quiz.totalQuestions || questionResults.length,
          correctAnswers: quiz.score || questionResults.filter(q => q.isCorrect).length,
          timestamp: quiz.timestamp || null,
          totalPossible: quiz.totalPossible || quiz.maxScore || questionResults.length,
          percentage: quiz.percentage || 0,
          responses: questionResults.map(q => ({
            questionId:     q.questionId     || '',
            questionNumber: q.questionNumber || '',
            questionText:   q.questionText   || q.question || 'Question not available',
            userAnswer:     q.userAnswer     !== undefined ? q.userAnswer : '',
            correctAnswer:  q.correctAnswer  || '',
            isCorrect:      q.isCorrect      || false,
            timeTaken:      q.timeTaken      || 0,
            points:         q.points         || 1,
            difficulty:     q.difficulty     || '',
            explanation:    q.explanation    || '',
            topic:          q.topic          || quiz.topic || '',
            questionType:   q.questionType   || q.type || '',
            options:        q.options        || [],
          })),
        }
      })
      tests.sort((a, b) => {
        if (a.timestamp && b.timestamp) return new Date(b.timestamp) - new Date(a.timestamp)
        return 0
      })
      setSortedTests(tests)
      if (tests.length > 0) {
        setSelectedIdx(0)
        await enrichAndShow(tests[0])
      }
    } catch (err) {
      console.error('Error fetching scores:', err)
      if (err.response?.status === 404) {
        setError('Scores endpoint not found. Please contact support.')
      } else {
        setError('Failed to load quiz results. Please try again.')
      }
    }
  }

  // ── Fetch explanations ────────────────────────────────────────────────
  const enrichWithExplanations = async (responses) => {
    // Skip fetch if all explanations are already stored in the score record
    const allHaveExplanation = responses.every(r => r.explanation && r.explanation.trim())
    if (allHaveExplanation) {
      console.log('All explanations already present, skipping fetch')
      return responses
    }

    // Collect every possible ID from each response (deduplicated)
    const ids = []
    responses.forEach(r => {
      if (r.questionId && !ids.includes(r.questionId))
        ids.push(r.questionId)
      if (r.questionNumber && !ids.includes(String(r.questionNumber)))
        ids.push(String(r.questionNumber))
    })

    console.log('=== EXPLANATION DEBUG ===')
    console.log('Sending IDs:', ids)

    if (ids.length === 0) {
      console.log('No IDs found — explanations cannot be fetched')
      return responses
    }

    try {
      const res = await axios.post(
        `${VITE_API_URL}/api/get-question-explanations`,
        { questionIds: ids },
        { withCredentials: true }
      )

      console.log('API response:', res.data)

      if (!res.data.success) {
        console.log('API returned failure')
        return responses
      }

      // Build a lookup map from whatever format the backend returns
      const map = {}

      if (res.data.explanationMap && typeof res.data.explanationMap === 'object') {
        // Backend returns a pre-built map keyed by ID
        Object.assign(map, res.data.explanationMap)
        console.log('Using explanationMap, keys:', Object.keys(map).length)

      } else if (Array.isArray(res.data.explanations)) {
        // Backend returns an array — build map from all possible ID fields
        console.log('Building map from explanations array, length:', res.data.explanations.length)
        res.data.explanations.forEach(q => {
          const entry = {
            explanation:   q.explanation                    || '',
            difficulty:    q.difficulty                     || '',
            points:        q.points                         || 1,
            questionType:  q.questionType  || q.type        || '',  // DB uses "type"
            options:       q.options                        || [],
            topic:         q.topic                         || '',
            correctAnswer: q.correctAnswer || q.correct_answer || '', // DB uses "correct_answer"
            questionText:  q.questionText  || q.question_text  || '', // DB uses "question_text"
          }
          // Map by every ID field the question might carry
          if (q._id)             map[String(q._id)]             = entry
          if (q.id)              map[String(q.id)]              = entry
          if (q.questionId)      map[String(q.questionId)]      = entry
          if (q.questionNumber)  map[String(q.questionNumber)]  = entry
        })
        console.log('Built map keys:', Object.keys(map))
      } else {
        console.log('Unexpected response shape:', Object.keys(res.data))
        return responses
      }

      // Merge explanation data into each response
      const enriched = responses.map(r => {
        // Try every possible key to find a match
        const keysToTry = [
          r.questionId,
          String(r.questionId),
          r.questionNumber ? String(r.questionNumber) : null,
        ].filter(Boolean)

        let info = {}
        for (const key of keysToTry) {
          if (map[key]) { info = map[key]; break }
        }

        if (!info.explanation) {
          console.log(`No match for questionId="${r.questionId}" questionNumber="${r.questionNumber}"`)
        } else {
          console.log(`Matched explanation for questionId="${r.questionId}"`)
        }

        return {
          ...r,
          // Only overwrite if the stored value is empty
          explanation:   r.explanation   || info.explanation   || '',
          difficulty:    r.difficulty    || info.difficulty    || '',
          points:        r.points        || info.points        || 1,
          questionType:  r.questionType  || info.questionType  || '',
          options:       r.options?.length ? r.options : (info.options || []),
          topic:         r.topic         || info.topic         || '',
          correctAnswer: r.correctAnswer || info.correctAnswer || '',
          questionText:  r.questionText  || info.questionText  || '',
        }
      })

      const withExp = enriched.filter(r => r.explanation).length
      console.log(`Explanations found: ${withExp} / ${enriched.length}`)
      return enriched

    } catch (err) {
      console.error('Failed to fetch explanations:', err)
      return responses
    }
  }

  const enrichAndShow = async (test) => {
    setTestLoading(true)
    try {
      const copy = JSON.parse(JSON.stringify(test))
      copy.responses = await enrichWithExplanations(copy.responses)
      setActiveTest(copy)
    } finally {
      setTestLoading(false)
    }
  }

  const handleTestSelect = async (e) => {
    const idx = parseInt(e.target.value)
    if (isNaN(idx) || !sortedTests[idx]) {
      setActiveTest(null)
      return
    }
    setSelectedIdx(idx)
    await enrichAndShow(sortedTests[idx])
  }

  const handleRefresh = async () => {
    if (!user?.email) return
    setPageLoading(true)
    setActiveTest(null)
    await loadResults(user.email)
    setPageLoading(false)
  }

  // ── Derived summary values ────────────────────────────────────────────
  const getSummary = (test) => {
    if (!test) return null
    const totalPossible = test.totalPossible || test.responses?.reduce((sum, r) => sum + (r.points || 1), 0) || test.totalQuestions
    const score = test.correctAnswers || test.responses?.reduce((sum, r) => sum + (r.isCorrect ? (r.points || 1) : 0), 0)
    const percentage = test.percentage || (totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0)
    let heading = test.displayName
    if (heading.includes(' - ')) heading = heading.split(' - ').slice(1).join(' - ')
    const weekMatch = test.displayName.match(/Week\s*(\d+)/i)
    const weekText = weekMatch ? `Week ${weekMatch[1]}` : test.originalTopic
    return { pct: percentage, incorrect: test.totalQuestions - score, heading, weekText, score, totalPossible }
  }

  const getDisplayAnswer = (r) => {
    if (r.questionType === 'multiple_choice') {
      const idx = typeof r.userAnswer === 'string' ? parseInt(r.userAnswer) : r.userAnswer
      return r.options?.[idx] ?? String(r.userAnswer)
    }
    if (r.questionType === 'multiple_select') {
      const arr = Array.isArray(r.userAnswer) ? r.userAnswer : [r.userAnswer]
      return arr.map(i => r.options?.[i] ?? String(i)).join(', ')
    }
    return formatAnswerPreview(r.userAnswer, r.questionType) || fmtAnswer(r.userAnswer)
  }

  const getCorrectDisplay = (r) => {
    if (r.questionType === 'multiple_choice') {
      const idx = typeof r.correctAnswer === 'string' ? parseInt(r.correctAnswer) : r.correctAnswer
      return r.options?.[idx] ?? String(r.correctAnswer)
    }
    if (r.questionType === 'multiple_select') {
      const arr = Array.isArray(r.correctAnswer) ? r.correctAnswer : [r.correctAnswer]
      return arr.map(i => r.options?.[i] ?? String(i)).join(', ')
    }
    return formatAnswerPreview(r.correctAnswer, r.questionType) || fmtAnswer(r.correctAnswer)
  }

  // ── Render ────────────────────────────────────────────────────────────
  if (pageLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: '#7F77DD' }} role="status" />
        <p className="text-muted">Loading your results...</p>
      </div>
    </div>
  )

  const summary = getSummary(activeTest)

  return (
    <main className="main" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div className="page-title" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Math I — Performance Review</h1>
                {user && <p className="mb-0">Welcome back, {user.username || user.email}</p>}
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
        {/* Error display */}
        {error && (
          <div className="alert alert-warning text-center" style={{ borderRadius: 16 }}>
            <i className="bi bi-info-circle me-2" />
            {error}
            <div className="mt-3">
              <button className="btn btn-primary me-2" onClick={handleRefresh}>
                <i className="bi bi-arrow-clockwise me-1" />Try Again
              </button>
              <Link to="/courses/IIITM-math" className="btn btn-outline-secondary">
                Back to IITM Math
              </Link>
            </div>
          </div>
        )}

        {/* Test selector */}
        {sortedTests.length > 0 && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Select Test to Review:
                </label>
                <button className="btn btn-outline-primary btn-sm" onClick={handleRefresh}>
                  <i className="bi bi-arrow-clockwise me-1" />Refresh
                </button>
              </div>
              <select
                className="form-select"
                value={selectedIdx ?? ''}
                onChange={handleTestSelect}
                style={{ borderRadius: 10 }}
              >
                <option value="">Select a test...</option>
                {sortedTests.map((test, i) => (
                  <option key={i} value={i}>
                    {test.displayName}{test.timestamp ? ` (${fmtShortDate(test.timestamp)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {testLoading && (
          <div className="text-center py-5">
            <div className="spinner-border mb-3" style={{ color: '#7F77DD' }} role="status" />
            <p className="text-muted">Loading question details...</p>
          </div>
        )}

        {/* Summary and review */}
        {!testLoading && activeTest && summary && (
          <>
            {/* Score summary card */}
            <div className="card border-0 shadow-sm mb-4 text-center" style={{ borderRadius: 16 }}>
              <div className="card-body py-4">
                <div className="row justify-content-center g-4">
                  <div className="col-auto">
                    <div style={{
                      width: 120, height: 120, borderRadius: '50%',
                      background: summary.pct >= 60
                        ? 'linear-gradient(135deg,#28a745,#20c997)'
                        : 'linear-gradient(135deg,#dc3545,#c82333)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{summary.pct}%</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                        {summary.score}/{summary.totalPossible}
                      </span>
                    </div>
                  </div>
                  <div className="col-auto d-flex flex-column justify-content-center text-start">
                    <h4 className="mb-1">
                      {summary.pct >= 80 ? 'Excellent!' : summary.pct >= 60 ? 'Good job!' : 'Keep practicing!'}
                    </h4>
                    <p className="text-muted mb-1">
                      Correct: <strong className="text-success">{summary.score} Q ({summary.score} pts)</strong> &nbsp;|&nbsp;
                      Wrong: <strong className="text-danger">{summary.incorrect} Q</strong>
                    </p>
                    {activeTest.timestamp && (
                      <p className="text-muted mb-0">{fmtDate(activeTest.timestamp)}</p>
                    )}
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <Link to="/courses/IIITM-math" className="btn btn-primary">
                    <i className="bi bi-arrow-clockwise me-1"/>Take Another Quiz
                  </Link>
                  <Link to="/courses/IIITM-math" className="btn btn-outline-secondary">
                    <i className="bi bi-arrow-left me-1"/>Back
                  </Link>
                </div>
              </div>
            </div>

            {/* Question-by-question review */}
            {activeTest.responses?.length > 0 ? (
              activeTest.responses.map((r, idx) => {
                const isOpen = expanded === idx
                const isCorrect = r.isCorrect
                const topicColor = TOPIC_PALETTE[idx % TOPIC_PALETTE.length]

                return (
                  <div key={idx} className="card border-0 shadow-sm mb-3"
                    style={{ borderRadius: 12, borderLeft: `4px solid ${isCorrect ? '#28a745' : '#dc3545'}` }}>
                    <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : idx)}>
                      <div className="d-flex align-items-start gap-3">
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: isCorrect ? '#28a745' : '#dc3545',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <i className={`bi ${isCorrect ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem', flex: 1 }}>
                              {!isOpen && r.questionText?.length > 100
                                ? r.questionText.slice(0, 100) + '…'
                                : r.questionText}
                            </p>
                            <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
                              <span style={{
                                fontSize: '0.72rem', fontWeight: 600, color: '#0C447C',
                                background: '#E6F1FB', border: '1.5px solid #85B7EB',
                                borderRadius: 99, padding: '2px 10px', whiteSpace: 'nowrap'
                              }}>Q{idx + 1}</span>
                              <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted`} />
                            </div>
                          </div>
                          <div className="d-flex gap-2 flex-wrap mt-1">
                            {r.difficulty && (
                              <span className={`badge bg-${DIFF_COLORS[r.difficulty] || 'secondary'}`}>
                                {r.difficulty}
                              </span>
                            )}
                            {r.topic && (
                              <span className="badge" style={{ background: topicColor }}>
                                {r.topic}
                              </span>
                            )}
                            {r.timeTaken > 0 && (
                              <span className="badge bg-light text-dark">
                                <i className="bi bi-clock me-1" />{r.timeTaken}s
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isOpen && (
                        <div className="mt-3 ms-5 ps-2">
                          {/* Multiple choice / multiple select options */}
                          {(r.questionType === 'multiple_choice' || r.questionType === 'multiple_select') && r.options?.length > 0 && (
                            <div className="mb-3">
                              {r.options.map((opt, oi) => {
                                let isCorrectOpt = false
                                let userPicked = false

                                if (r.questionType === 'multiple_choice') {
                                  isCorrectOpt = String(oi) === String(r.correctAnswer)
                                  userPicked = String(oi) === String(r.userAnswer)
                                } else {
                                  const correctArr = Array.isArray(r.correctAnswer)
                                    ? r.correctAnswer
                                    : String(r.correctAnswer).split(',')
                                  const userArr = Array.isArray(r.userAnswer)
                                    ? r.userAnswer
                                    : String(r.userAnswer).split(',')
                                  isCorrectOpt = correctArr.some(ca =>
                                    String(ca).trim() === String(oi) || String(ca).trim() === opt
                                  )
                                  userPicked = userArr.some(ua =>
                                    String(ua).trim() === String(oi) || String(ua).trim() === opt
                                  )
                                }

                                let bg = 'transparent'
                                if (isCorrectOpt) bg = '#d4edda'
                                else if (userPicked && !isCorrectOpt) bg = '#f8d7da'

                                return (
                                  <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                                    {isCorrectOpt && userPicked && <i className="bi bi-check-circle-fill text-success" />}
                                    {isCorrectOpt && !userPicked && <i className="bi bi-check-circle text-success" />}
                                    {!isCorrectOpt && userPicked && <i className="bi bi-x-circle-fill text-danger" />}
                                    {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                                    <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Non-MCQ answers */}
                          {r.questionType !== 'multiple_choice' && r.questionType !== 'multiple_select' && (
                            <div className="d-flex gap-2 flex-wrap mb-3">
                              <span className="badge bg-light text-dark border">
                                Your answer: <strong>{getDisplayAnswer(r)}</strong>
                              </span>
                              <span className="badge bg-success">
                                Correct: <strong>{getCorrectDisplay(r)}</strong>
                              </span>
                            </div>
                          )}

                          {/* Explanation */}
                          {r.explanation && r.explanation.trim() ? (
                            <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                              <i className="bi bi-lightbulb me-2" />
                              <strong>Explanation:</strong> {r.explanation}
                            </div>
                          ) : (
                            <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                              <i className="bi bi-exclamation-circle me-2" />
                              <em>No explanation available for this question.</em>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-clipboard-x" style={{ fontSize: 48 }} />
                <p className="mt-2">No question data available for this test.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default MathReview
