import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Coding Quiz Review Page ───────────────────────────────────────────────────
// Props:
//  - results: { stats: {totalScore, maxScore, percentage, totalQuestions, solvedQuestions},
//                question_results: [{ questionId, title, question_text, language, difficulty,
//                  topic, subtopic, points, code, verdict, passed, total, score, percentage,
//                  testResults: [{testcase_number, input, expected_output, output, passed, error, is_hidden}] }] }
//  - onRetake: () => void
//  - course, week
const CodingReview = ({ results, onRetake, course, week }) => {
  const { stats, question_results: qrs } = results
  const [expanded, setExpanded] = useState(null)

  const coursePath = `/programming/courses/${course}`

  const verdictBadge = (verdict) => {
    switch (verdict) {
      case 'Accepted': return 'bg-success'
      case 'Partially Accepted': return 'bg-warning text-dark'
      case 'Pending Review': return 'bg-secondary'
      default: return 'bg-danger'
    }
  }

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Week {week} — Coding Review</h1>
              <p className="mb-0">Review your code and test results.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li><Link to={coursePath}>Course</Link></li>
          <li className="current">Coding Review</li>
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
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                    {stats.solvedQuestions}/{stats.totalQuestions} solved
                  </span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">
                  {stats.percentage >= 80 ? 'Excellent!' : stats.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
                </h4>
                <p className="text-muted mb-1">
                  Solved: <strong className="text-success">{stats.solvedQuestions}</strong> &nbsp;|&nbsp;
                  Unsolved: <strong className="text-danger">{stats.totalQuestions - stats.solvedQuestions}</strong>
                </p>
                <p className="text-muted mb-0">
                  Points: <strong>{stats.totalScore} / {stats.maxScore}</strong>
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
          return (
            <div key={idx} className="card border-0 shadow-sm mb-3"
              style={{ borderRadius: 12, borderLeft: `4px solid ${qr.verdict === 'Accepted' ? '#28a745' : qr.verdict === 'Partially Accepted' ? '#ffc107' : '#dc3545'}` }}>
              <div className="card-body" style={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : idx)}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: qr.verdict === 'Accepted' ? '#28a745' : qr.verdict === 'Partially Accepted' ? '#ffc107' : '#dc3545',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <i className={`bi ${qr.verdict === 'Accepted' ? 'bi-check-lg' : 'bi-x-lg'} text-white`} style={{ fontSize: 13 }} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-semibold" style={{ fontSize: '0.95rem' }}>
                        Q{idx + 1}. {qr.title || qr.question_text?.slice(0, 80)}
                      </p>
                      <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-2 text-muted`} style={{ flexShrink: 0 }} />
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className="badge bg-secondary">{qr.language}</span>
                      {qr.difficulty && <span className="badge bg-light text-dark border">{qr.difficulty}</span>}
                      {qr.subtopic && <span className="badge bg-info text-dark">{qr.subtopic}</span>}
                      <span className={`badge ${verdictBadge(qr.verdict)}`}>{qr.verdict}</span>
                      <span className="badge bg-light text-dark border">
                        {qr.passed}/{qr.total} test cases
                      </span>
                      <span className="badge bg-light text-dark border">{qr.score}/{qr.points} pts</span>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    <p className="mb-3" style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>{qr.question_text}</p>

                    {/* Submitted code */}
                    <h6 className="mb-2">Your Code:</h6>
                    <pre className="bg-dark text-light rounded p-3 mb-3" style={{ fontSize: '0.85rem', overflowX: 'auto' }}>
                      <code>{qr.code}</code>
                    </pre>

                    {/* Test case results */}
                    {qr.testResults && qr.testResults.length > 0 && (
                      <>
                        <h6 className="mb-2">Test Cases:</h6>
                        {qr.testResults.map((tr, ti) => (
                          <div key={ti} className="small mb-2 p-2 rounded" style={{ background: tr.passed ? '#d4edda' : '#f8d7da', fontFamily: 'monospace' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span>Test {tr.testcase_number}{tr.is_hidden ? ' (hidden)' : ''}</span>
                              <span className={`badge ${tr.passed ? 'bg-success' : 'bg-danger'}`}>
                                {tr.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            {!tr.is_hidden && (
                              <>
                                {tr.input && <div>Input: {tr.input}</div>}
                                <div>Expected: {tr.expected_output}</div>
                                <div>Got: {tr.output ?? '—'}</div>
                              </>
                            )}
                            {tr.error && <div className="text-danger mt-1">{tr.error}</div>}
                          </div>
                        ))}
                      </>
                    )}

                    {qr.verdict === 'Pending Review' && (
                      <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.88rem' }}>
                        Auto-grading isn't available for this language yet — your submission has been saved for manual review.
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

export default CodingReview
