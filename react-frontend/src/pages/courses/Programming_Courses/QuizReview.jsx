import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helper function to format multi-line text ───────────────────────────────
const formatMultiLineText = (text) => {
  if (!text) return ''
  return text.replace(/\\n/g, '\n')
}

// ─── Match Pairs Component ──────────────────────────────────────────────────
const MatchPairsComponent = ({ matchPairs, userAnswer, onMatch, readOnly = false }) => {
  const [selectedMatches, setSelectedMatches] = useState(userAnswer || {})
  const leftItems = matchPairs?.left_column || []
  const rightItems = matchPairs?.right_column || []

  const handleMatch = (leftId, rightId) => {
    if (readOnly) return
    const newMatches = { ...selectedMatches, [leftId]: rightId }
    setSelectedMatches(newMatches)
    onMatch(newMatches)
  }

  return (
    <div className="match-pairs-container mb-4">
      <div className="row">
        <div className="col-md-6">
          <div className="fw-bold mb-2">Concepts</div>
          {leftItems.map((item) => (
            <div key={item.id} className="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
              <span className="fw-bold">{item.id}.</span>
              <span>{formatMultiLineText(item.text)}</span>
            </div>
          ))}
        </div>
        <div className="col-md-6">
          <div className="fw-bold mb-2">Definitions</div>
          {leftItems.map((leftItem) => {
            const selectedRightId = selectedMatches[leftItem.id] || ''
            return (
              <div key={`match-${leftItem.id}`} className="d-flex align-items-center gap-2 mb-2">
                <span className="fw-bold me-2">{leftItem.id} →</span>
                {readOnly ? (
                  <span className="p-2 bg-light rounded w-100">
                    {rightItems.find(r => r.id === selectedRightId)?.text || 'Not matched'}
                  </span>
                ) : (
                  <select
                    className="form-select form-select-sm"
                    value={selectedRightId}
                    onChange={(e) => handleMatch(leftItem.id, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {rightItems.map((rightItem) => (
                      <option key={rightItem.id} value={rightItem.id}>
                        {rightItem.id}. {formatMultiLineText(rightItem.text)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Submission Overview Component ──────────────────────────────────────────
const SubmissionOverview = ({ results, onRetake, onReview, course, week, quizId }) => {
  const { stats } = results
  const [showReview, setShowReview] = useState(false)

  const difficultyData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        label: 'Attempted',
        data: [
          stats.easy_attempted || 0,
          stats.medium_attempted || 0,
          stats.hard_attempted || 0,
        ],
        backgroundColor: 'rgba(13, 110, 253, 0.5)',
        borderColor: '#0d6efd',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Correct',
        data: [
          stats.easy_correct || 0,
          stats.medium_correct || 0,
          stats.hard_correct || 0,
        ],
        backgroundColor: 'rgba(40, 167, 69, 0.5)',
        borderColor: '#28a745',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  }

  const subtopicCounts = {}
  const subtopicCorrect = {}
  results.question_results?.forEach(q => {
    if (q.subtopic) {
      subtopicCounts[q.subtopic] = (subtopicCounts[q.subtopic] || 0) + 1
      if (q.isCorrect) {
        subtopicCorrect[q.subtopic] = (subtopicCorrect[q.subtopic] || 0) + 1
      }
    }
  })

  const subtopicLabels = Object.keys(subtopicCounts).sort()
  const attemptedData = subtopicLabels.map(key => subtopicCounts[key] || 0)
  const correctData = subtopicLabels.map(key => subtopicCorrect[key] || 0)

  const subtopicData = {
    labels: subtopicLabels,
    datasets: [
      {
        label: 'Attempted',
        data: attemptedData,
        backgroundColor: 'rgba(13, 110, 253, 0.5)',
        borderColor: '#0d6efd',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Correct',
        data: correctData,
        backgroundColor: 'rgba(40, 167, 69, 0.5)',
        borderColor: '#28a745',
        borderWidth: 2,
        borderRadius: 4,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  const horizontalChartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  }

  const handleRetakeClick = () => {
    onRetake()
  }

  const handleReviewClick = () => {
    setShowReview(true)
    onReview()
  }

  if (showReview) {
    return <ReviewPage results={results} course={course} week={week} />
  }

  const correct = stats.correct || 0
  const total = stats.total || 0
  const incorrect = total - correct
  const unanswered = stats.unattempted || 0

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Submission Overview</h1>
              <p className="mb-0">Review your performance and choose your next step</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li><Link to={`/programming/courses/${course}`}>Course</Link></li>
          <li className="current">Overview</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body py-4">
            <div className="row align-items-center">
              <div className="col-md-3 text-center">
                <div style={{
                  width: 140, height: 140, borderRadius: '50%',
                  background: stats.percentage >= 80 
                    ? 'linear-gradient(135deg,#28a745,#20c997)'
                    : stats.percentage >= 60
                    ? 'linear-gradient(135deg,#ffc107,#fd7e14)'
                    : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto'
                }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{stats.percentage || 0}%</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{correct}/{total}</span>
                </div>
              </div>
              <div className="col-md-9">
                <div className="row mt-3 mt-md-0">
                  <div className="col-6 col-md-3 text-center">
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>{correct}</div>
                    <small className="text-muted">Correct</small>
                  </div>
                  <div className="col-6 col-md-3 text-center">
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#fd7e14' }}>0</div>
                    <small className="text-muted">Partial</small>
                  </div>
                  <div className="col-6 col-md-3 text-center">
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#dc3545' }}>{incorrect}</div>
                    <small className="text-muted">Incorrect</small>
                  </div>
                  <div className="col-6 col-md-3 text-center">
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#6c757d' }}>{unanswered}</div>
                    <small className="text-muted">Unattempted</small>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Submitted on {stats.submitted_at ? new Date(stats.submitted_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} IST
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-info-circle me-2 text-primary"></i>
              Instructions
            </h5>
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li className="mb-2">Read each question carefully before selecting an answer.</li>
              <li className="mb-2">For single-selection questions, choose the best answer from the options provided.</li>
              <li className="mb-2">For multiple-selection questions, select all options that apply.</li>
              <li className="mb-0">Your progress is saved automatically when you navigate between questions.</li>
            </ul>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-bar-chart me-2 text-primary"></i>
                  Difficulty Level Distribution
                </h6>
                <div style={{ height: 250 }}>
                  <Bar data={difficultyData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-bar-chart-horizontal me-2 text-primary"></i>
                  Subtopics Distribution
                </h6>
                <div style={{ height: Math.max(250, subtopicLabels.length * 40 + 50) }}>
                  <Bar data={subtopicData} options={horizontalChartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <button className="btn btn-primary btn-lg px-5" onClick={handleRetakeClick}>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Retake
          </button>
          <button className="btn btn-outline-primary btn-lg px-5" onClick={handleReviewClick}>
            <i className="bi bi-eye me-2"></i>
            Review
          </button>
          <Link to={`/programming/courses/${course}`} className="btn btn-outline-secondary btn-lg px-5">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Course
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ results, course, week }) => {
  const { stats, question_results: qrs } = results
  const [currentIndex, setCurrentIndex] = useState(0)

  const coursePath = `/programming/courses/${course}`

  if (!qrs || qrs.length === 0) {
    return (
      <main className="main">
        <div className="container py-5 text-center">
          <i className="bi bi-exclamation-triangle fs-1 text-warning" />
          <h4 className="mt-3">No review data available</h4>
          <p className="text-muted">Please take the quiz first to see the review.</p>
          <Link to={coursePath} className="btn btn-primary mt-3">Back to Course</Link>
        </div>
      </main>
    )
  }

  const goTo = (idx) => setCurrentIndex(idx)
  const q = qrs[currentIndex]
  const totalQuestions = qrs.length

  const isOptionSelected = (optId) => {
    const userAns = q.userAnswer
    if (!userAns) return false
    if (Array.isArray(userAns)) return userAns.includes(optId)
    return userAns === optId
  }

  const isOptionCorrect = (optId) => {
    const correct = q.correct_answer
    if (!correct) return false
    if (Array.isArray(correct)) return correct.includes(optId)
    return correct === optId
  }

  const getOptionStyle = (optId) => {
    const selected = isOptionSelected(optId)
    const correct = isOptionCorrect(optId)
    
    if (correct && selected) {
      return { 
        background: '#d4edda', 
        borderColor: '#28a745',
        label: 'Correct',
        labelColor: '#155724'
      }
    } else if (correct && !selected) {
      return { 
        background: '#fff3cd', 
        borderColor: '#ffc107',
        label: 'Expected',
        labelColor: '#856404'
      }
    } else if (!correct && selected) {
      return { 
        background: '#f8d7da', 
        borderColor: '#dc3545',
        label: 'Wrong',
        labelColor: '#721c24'
      }
    } else {
      return { 
        background: 'transparent', 
        borderColor: '#dee2e6',
        label: '',
        labelColor: ''
      }
    }
  }

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Week {week} — Review Mode</h1>
              <p className="mb-0">Review your answers and see where you can improve</p>
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
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Question {currentIndex + 1} of {totalQuestions}</span>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <span className={`badge ${q.isCorrect ? 'bg-success' : 'bg-danger'}`}>
                      {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="badge bg-primary">{q.question_type || 'unknown'}</span>
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
                  <div className={`progress-bar ${q.isCorrect ? 'bg-success' : 'bg-danger'}`} 
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
                </div>

                <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {q.question_text || 'Question text not available'}
                </p>

                {/* Conditional Rendering: Code Snippet */}
                {q.code_snippet && (
                  <pre className="bg-light text-dark rounded p-3 mb-4" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                    <code>{q.code_snippet}</code>
                  </pre>
                )}

                {/* Conditional Rendering: Image */}
                {q.image_url && (
                  <img src={q.image_url} alt="question" className="img-fluid rounded mb-4" style={{ maxHeight: 300 }} />
                )}

                {/* Conditional Rendering: Match Pairs */}
                {q.match_pairs && q.question_type === 'match-pairs' && (
                  <MatchPairsComponent 
                    matchPairs={q.match_pairs}
                    userAnswer={q.userAnswer}
                    onMatch={() => {}}
                    readOnly={true}
                  />
                )}

                {/* MCQ */}
                {q.question_type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 && (
                  <div>
                    {q.options.map((opt) => {
                      const style = getOptionStyle(opt.id)
                      return (
                        <div key={opt.id}
                          className={`d-flex align-items-center gap-3 mb-2 p-3 rounded border`}
                          style={{ 
                            cursor: 'default', 
                            background: style.background,
                            borderColor: style.borderColor,
                            borderWidth: '2px'
                          }}>
                          <span style={{ 
                            fontSize: '0.95rem', 
                            whiteSpace: 'pre-line', 
                            lineHeight: '1.5', 
                            flex: 1 
                          }}>
                            {formatMultiLineText(opt.text)}
                          </span>
                          {style.label && (
                            <span style={{ 
                              fontWeight: 600, 
                              color: style.labelColor,
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              marginLeft: 'auto',
                              paddingLeft: '10px'
                            }}>
                              {style.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* MSQ */}
                {q.question_type === 'msq' && Array.isArray(q.options) && q.options.length > 0 && (
                  <div>
                    <p className="text-muted small mb-2">Select all that apply</p>
                    {q.options.map((opt) => {
                      const style = getOptionStyle(opt.id)
                      return (
                        <div key={opt.id}
                          className={`d-flex align-items-center gap-3 mb-2 p-3 rounded border`}
                          style={{ 
                            cursor: 'default',
                            background: style.background,
                            borderColor: style.borderColor,
                            borderWidth: '2px'
                          }}>
                          <span style={{ 
                            fontSize: '0.95rem', 
                            whiteSpace: 'pre-line', 
                            lineHeight: '1.5', 
                            flex: 1 
                          }}>
                            {formatMultiLineText(opt.text)}
                          </span>
                          {style.label && (
                            <span style={{ 
                              fontWeight: 600, 
                              color: style.labelColor,
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              marginLeft: 'auto',
                              paddingLeft: '10px'
                            }}>
                              {style.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Numeric */}
                {q.question_type === 'numeric' && (
                  <div>
                    <div className="d-flex gap-4 align-items-center">
                      <div>
                        <p className="text-muted small mb-1">Your answer:</p>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          value={q.userAnswer || ''}
                          readOnly
                          style={{ 
                            maxWidth: 200, 
                            fontFamily: 'monospace', 
                            fontSize: '1.1rem',
                            backgroundColor: q.isCorrect ? '#d4edda' : '#f8d7da',
                            borderColor: q.isCorrect ? '#28a745' : '#dc3545'
                          }}
                        />
                        {!q.isCorrect && (
                          <span style={{ color: '#dc3545', fontSize: '0.85rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
                            Wrong
                          </span>
                        )}
                        {q.isCorrect && (
                          <span style={{ color: '#28a745', fontSize: '0.85rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
                            Correct
                          </span>
                        )}
                      </div>
                      {!q.isCorrect && (
                        <div>
                          <p className="text-muted small mb-1">Correct answer:</p>
                          <input
                            type="number"
                            className="form-control form-control-lg"
                            value={q.correct_answer || ''}
                            readOnly
                            style={{ 
                              maxWidth: 200, 
                              fontFamily: 'monospace', 
                              fontSize: '1.1rem',
                              backgroundColor: '#d4edda',
                              borderColor: '#28a745'
                            }}
                          />
                          <span style={{ color: '#155724', fontSize: '0.85rem', fontWeight: 600, marginTop: 4, display: 'block' }}>
                            Expected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* True/False */}
                {q.question_type === 'true-false' && (
                  <div className="d-flex gap-3">
                    {['true', 'false'].map(val => {
                      const selected = q.userAnswer === val
                      const correct = q.correct_answer === val
                      const isCorrectAnswer = selected && correct
                      const isWrongAnswer = selected && !correct
                      
                      let bgColor = ''
                      let label = ''
                      let labelColor = ''
                      
                      if (isCorrectAnswer) {
                        bgColor = '#d4edda'
                        label = 'Correct'
                        labelColor = '#155724'
                      } else if (isWrongAnswer) {
                        bgColor = '#f8d7da'
                        label = 'Wrong'
                        labelColor = '#721c24'
                      } else if (correct) {
                        bgColor = '#fff3cd'
                        label = 'Expected'
                        labelColor = '#856404'
                      }
                      
                      return (
                        <div key={val}
                          className={`flex-grow-1 d-flex align-items-center justify-content-between p-3 rounded border`}
                          style={{ 
                            cursor: 'default',
                            background: bgColor,
                            borderColor: bgColor ? (isCorrectAnswer ? '#28a745' : isWrongAnswer ? '#dc3545' : '#ffc107') : '#dee2e6',
                            borderWidth: '2px'
                          }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {val === 'true' ? '✅ True' : '❌ False'}
                          </span>
                          {label && (
                            <span style={{ 
                              fontWeight: 600, 
                              color: labelColor,
                              fontSize: '0.85rem'
                            }}>
                              {label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>
                  <span className="text-muted small">{currentIndex + 1} of {totalQuestions}</span>
                  {currentIndex < totalQuestions - 1
                    ? <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                        Next<i className="bi bi-arrow-right ms-1" />
                      </button>
                    : <Link to={coursePath} className="btn btn-success">
                        <i className="bi bi-check-lg me-1" />Done
                      </Link>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-lightbulb me-2 text-warning"></i>
                  Solution & Explanation
                </h6>
                {q.solution ? (
                  <div style={{ 
                    fontSize: '0.95rem', 
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 400,
                    overflowY: 'auto'
                  }}>
                    {formatMultiLineText(q.solution)}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-info-circle fs-1 d-block mb-2"></i>
                    <p className="mb-0">No solution provided for this question</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
  const [showOverview, setShowOverview] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [hasPreviousAttempt, setHasPreviousAttempt] = useState(false)
  const [previousResults, setPreviousResults] = useState(null)

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
        await checkPreviousAttempts(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch { navigate('/login', { replace: true }) }
  }

  const checkPreviousAttempts = async (email) => {
    try {
      const res = await axios.get(
        `${API}/api/mcq-quiz/attempts?email=${encodeURIComponent(email)}&course=${course}`,
        { withCredentials: true }
      )
      
      console.log('API Response for attempts:', res.data)
      
      const weekAttempts = res.data?.attempts?.filter(a => a.week === weekNum) || []
      
      if (weekAttempts.length > 0) {
        const latestAttempt = weekAttempts[weekAttempts.length - 1]
        setHasPreviousAttempt(true)
        
        console.log('Latest attempt data:', latestAttempt)
        
        let questionResults = []
        try {
          const resultRes = await axios.get(
            `${API}/api/mcq-quiz/attempt/${latestAttempt._id}/results`,
            { withCredentials: true }
          )
          console.log('Question results response:', resultRes.data)
          questionResults = resultRes.data?.results || []
          
          if (questionResults.length > 0) {
            const questionIds = questionResults.map(r => r.question_id).filter(Boolean)
            if (questionIds.length > 0) {
              const questionsRes = await axios.get(
                `${API}/api/mcq-questions/by-ids?ids=${questionIds.join(',')}`,
                { withCredentials: true }
              )
              const questionMap = {}
              questionsRes.data?.questions?.forEach(q => {
                questionMap[q._id] = q
              })
              
              questionResults = questionResults.map(r => ({
                ...r,
                question_text: questionMap[r.question_id]?.question_text || 'Question text not available',
                options: questionMap[r.question_id]?.options || [],
                code_snippet: questionMap[r.question_id]?.code_snippet || null,
                image_url: questionMap[r.question_id]?.image_url || null,
                match_pairs: questionMap[r.question_id]?.match_pairs || null,
                solution: questionMap[r.question_id]?.solution || null,
                points: questionMap[r.question_id]?.points || 1,
                difficulty: questionMap[r.question_id]?.difficulty || r.difficulty || 'medium',
                subtopic: questionMap[r.question_id]?.subtopic || r.subtopic || '',
                question_type: questionMap[r.question_id]?.question_type || r.question_type || 'mcq',
                correct_answer: questionMap[r.question_id]?.answers?.correct || r.correct_answer || null,
                isCorrect: r.is_correct || false,
                marksAwarded: r.marks_awarded || 0,
                userAnswer: r.user_answer || null,
                timeTaken: r.time_taken_seconds || 0
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching question results:', error)
          if (latestAttempt.questionResults) {
            questionResults = latestAttempt.questionResults
          }
        }
        
        const correctCount = latestAttempt.correct_answers || 0
        const totalCount = latestAttempt.total_questions || 0
        
        setPreviousResults({
          stats: {
            correct: correctCount,
            total: totalCount,
            percentage: latestAttempt.percentage || 0,
            score: latestAttempt.score || 0,
            maxPossibleScore: latestAttempt.max_possible_score || totalCount,
            easy_attempted: latestAttempt.easy_attempted || 0,
            easy_correct: latestAttempt.easy_correct || 0,
            medium_attempted: latestAttempt.medium_attempted || 0,
            medium_correct: latestAttempt.medium_correct || 0,
            hard_attempted: latestAttempt.hard_attempted || 0,
            hard_correct: latestAttempt.hard_correct || 0,
            unattempted: 0,
            submitted_at: latestAttempt.submitted_at || latestAttempt.createdAt || new Date().toISOString()
          },
          question_results: questionResults
        })
        
        setShowOverview(true)
        setLoading(false)
      } else {
        fetchQuestions()
      }
    } catch (error) {
      console.error('Error checking previous attempts:', error)
      fetchQuestions()
    }
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
    } catch (err) {
      console.error('Error fetching questions:', err)
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Anti-cheat
  useEffect(() => {
    if (submitted || loading || showOverview) return
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
  }, [submitted, loading, showOverview])

  const logCheat = async (type) => {
    cheatingRef.current += 1
    try {
      await axios.post(`${API}/api/log-cheating`, {
        email: userRef.current?.email, type, quiz: displayName, timestamp: new Date().toISOString()
      }, { withCredentials: true })
    } catch {}
    if (cheatingRef.current >= 5) handleSubmit(true)
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
    })
  }

  const handleMatchAnswer = (idx, matches) => {
    setAnswers(prev => ({ ...prev, [idx]: matches }))
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
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length) || (typeof a === 'object' && Object.keys(a).length === 0)
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
        setShowOverview(true)
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
    setShowOverview(false)
    setShowReview(false)
    fetchQuestions()
  }

  const handleReview = () => {
    setShowReview(true)
    setShowOverview(false)
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

  if (showOverview && (previousResults || results)) {
    const data = results || previousResults
    return (
      <SubmissionOverview 
        results={data} 
        onRetake={handleRetake}
        onReview={handleReview}
        course={course}
        week={weekNum}
        quizId={data?.quizId}
      />
    )
  }

  if (showReview && (results || previousResults)) {
    const data = results || previousResults
    return <ReviewPage results={data} course={course} week={weekNum} />
  }

  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  
  // Check if answer is provided for the current question type
  const isAnswered = (() => {
    if (q.question_type === 'match-pairs') {
      return userAns && typeof userAns === 'object' && Object.keys(userAns).length > 0
    }
    return userAns !== undefined && userAns !== null && userAns !== '' && 
      !(Array.isArray(userAns) && !userAns.length)
  })()
  
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    if (questions[i]?.question_type === 'match-pairs') {
      return a && typeof a === 'object' && Object.keys(a).length > 0
    }
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  return (
    <main className="main">
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
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
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

                {/* Question Text */}
                <p className="mb-3" style={{ fontSize: '1.05rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {q.question_text}
                </p>

                {/* ─── CONDITIONAL RENDERING ─── */}

                {/* 1. Code Snippet */}
                {q.code_snippet && (
                  <pre className="bg-light text-dark rounded p-3 mb-4" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                    <code>{q.code_snippet}</code>
                  </pre>
                )}

                {/* 2. Image */}
                {q.image_url && (
                  <img src={q.image_url} alt="question" className="img-fluid rounded mb-4" style={{ maxHeight: 300 }} />
                )}

                {/* 3. Match Pairs */}
                {q.match_pairs && q.question_type === 'match-pairs' && (
                  <MatchPairsComponent 
                    matchPairs={q.match_pairs}
                    userAnswer={userAns}
                    onMatch={(matches) => handleMatchAnswer(currentIndex, matches)}
                    readOnly={false}
                  />
                )}

                {/* 4. MCQ */}
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

                {/* 5. MSQ */}
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

                {/* 6. Numeric */}
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

                {/* 7. True/False */}
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

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((_, i) => {
                    const a = answers[i]
                    const done = (() => {
                      if (questions[i]?.question_type === 'match-pairs') {
                        return a && typeof a === 'object' && Object.keys(a).length > 0
                      }
                      return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    })()
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
