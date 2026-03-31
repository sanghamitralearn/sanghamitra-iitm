import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const TABS = [
  { key: 'coding', label: 'Coding' },
  { key: 'test', label: 'Quiz / Test' },
  { key: 'interview', label: 'Interview' }
]

const PDSAReview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('coding')
  const [data, setData] = useState({ coding: [], test: [], interview: [] })
  const [selectedItem, setSelectedItem] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const authCheck = await axios.get(`${API}/api/check-auth`, { withCredentials: true })
        if (!authCheck.data.authenticated) {
          navigate('/login', { state: { from: { pathname: '/courses/pdsa/review' } }, replace: true })
          return
        }
        const session = await axios.get(`${API}/api/session-info`, { withCredentials: true })
        const email = session.data.email

        const [codingRes, pdsaRes, interviewRes] = await Promise.allSettled([
          axios.get(`${API}/api/coding-submissions?email=${encodeURIComponent(email)}`, { withCredentials: true }),
          axios.get(`${API}/api/pdsa-submissions?email=${encodeURIComponent(email)}`, { withCredentials: true }),
          axios.get(`${API}/api/interview-submissions?email=${encodeURIComponent(email)}`, { withCredentials: true })
        ])

        const extract = (res, key) => {
          if (res.status !== 'fulfilled') return []
          const d = res.value.data
          // Try various response shapes
          const arr = d?.submissions || d?.data || []
          return Array.isArray(arr) ? arr : []
        }

        const coding = extract(codingRes, 'coding').sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        const test = extract(pdsaRes, 'test').sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
        const interview = extract(interviewRes, 'interview').sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))

        setData({ coding, test, interview })
      } catch {
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const getScoreColor = (pct) => pct >= 80 ? '#28a745' : pct >= 60 ? '#ffc107' : '#dc3545'

  const current = data[tab] || []
  const filtered = filter
    ? current.filter(s => (s.topic || '').toLowerCase().includes(filter.toLowerCase()))
    : current

  const handleTabChange = (t) => {
    setTab(t)
    setSelectedItem(null)
    setFilter('')
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>PDSA — Submission Review</h1>
              <p className="mb-0">Review your previous coding, quiz, and interview submissions.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/pdsa">PDSA</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {selectedItem ? (
          <SubmissionDetail item={selectedItem} tab={tab} onBack={() => setSelectedItem(null)} getScoreColor={getScoreColor} />
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Your Submissions</h4>
              <Link to="/courses/pdsa" className="btn btn-outline-primary btn-sm">← Back to Topics</Link>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
              {TABS.map(t => (
                <li className="nav-item" key={t.key}>
                  <button
                    className={`nav-link ${tab === t.key ? 'active' : ''}`}
                    onClick={() => handleTabChange(t.key)}
                  >
                    {t.label}
                    <span className="badge bg-secondary ms-2">{data[t.key].length}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Filter by topic..."
                value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '350px' }} />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                {current.length === 0 ? 'No submissions yet for this category.' : 'No matching topics.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>#</th><th>Topic</th><th>Score</th><th>Percentage</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{idx + 1}</td>
                        <td><strong>{s.topic || 'Unknown'}</strong></td>
                        <td>{s.score ?? '—'}/{s.maxScore ?? '—'}</td>
                        <td>
                          <span style={{ color: getScoreColor(s.percentage || 0), fontWeight: 'bold' }}>{Math.round(s.percentage || 0)}%</span>
                          <div className="progress mt-1" style={{ height: '4px' }}>
                            <div className="progress-bar" style={{ width: `${s.percentage || 0}%`, backgroundColor: getScoreColor(s.percentage || 0) }} />
                          </div>
                        </td>
                        <td className="text-muted">{s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                        <td><button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedItem(s)}>Review</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

const SubmissionDetail = ({ item, tab, onBack, getScoreColor }) => {
  const isCoding = tab === 'coding'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0">{item.topic || 'Submission'}</h4>
          <small className="text-muted">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</small>
        </div>
        <button className="btn btn-outline-secondary" onClick={onBack}>← Back to list</button>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Score', val: `${Math.round(item.percentage || 0)}%`, color: getScoreColor(item.percentage || 0) },
          { label: 'Marks', val: `${item.score ?? '—'}/${item.maxScore ?? '—'}`, color: '#17a2b8' },
          { label: 'Questions', val: item.questions?.length || 0, color: '#6c757d' }
        ].map(({ label, val, color }) => (
          <div className="col-6 col-md-3" key={label}>
            <div className="card text-center h-100"><div className="card-body py-3">
              <div className="fs-4 fw-bold" style={{ color }}>{val}</div>
              <div className="text-muted small">{label}</div>
            </div></div>
          </div>
        ))}
      </div>

      {item.questions?.length > 0 ? (
        <div className="accordion" id="questionsAccordion">
          {item.questions.map((q, idx) => {
            if (isCoding) {
              const passed = q.passedTests || 0
              const total = q.totalTests || 0
              const allPassed = passed === total && total > 0
              return (
                <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button collapsed py-2 px-3 ${allPassed ? 'bg-success-subtle' : 'bg-warning-subtle'}`}
                      type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                      style={{ fontWeight: '500', fontSize: '0.95rem' }}
                    >
                      <span className={`badge me-2 ${allPassed ? 'bg-success' : 'bg-warning text-dark'}`}>{passed}/{total}</span>
                      Q{idx + 1}.&nbsp;
                      <span className="text-truncate" style={{ maxWidth: '500px' }}>{q.title || `Question ${idx + 1}`}</span>
                      <span className="ms-auto me-4 text-muted small">{q.score ?? 0}/{q.maxScore ?? 0} marks</span>
                    </button>
                  </h2>
                  <div id={`q${idx}`} className="accordion-collapse collapse">
                    <div className="accordion-body py-3">
                      {q.userCode && (
                        <div className="mb-3">
                          <strong>Your Code:</strong>
                          <pre className="bg-light p-2 rounded mt-1" style={{ fontSize: '0.85rem', maxHeight: '200px', overflow: 'auto' }}>{q.userCode}</pre>
                        </div>
                      )}
                      {q.testResults?.length > 0 && (
                        <div>
                          <strong>Test Results:</strong>
                          <div className="mt-2">
                            {q.testResults.map((t, ti) => (
                              <div key={ti} className={`p-2 mb-1 rounded small ${t.passed ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                                <span className={`badge me-2 ${t.passed ? 'bg-success' : 'bg-danger'}`}>{t.passed ? 'PASS' : 'FAIL'}</span>
                                <strong>Input:</strong> {JSON.stringify(t.input)} &nbsp;
                                <strong>Expected:</strong> {JSON.stringify(t.expectedAnswer ?? t.expected)} &nbsp;
                                {!t.passed && <><strong>Got:</strong> {JSON.stringify(t.output)}</>}
                                {t.error && <span className="text-danger ms-2">Error: {t.error}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            } else {
              // MCQ / interview question
              const isCorrect = q.isCorrect || (q.score > 0)
              return (
                <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button collapsed py-2 px-3 ${isCorrect ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                      type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                      style={{ fontWeight: '500', fontSize: '0.95rem' }}
                    >
                      <span className={`badge me-2 ${isCorrect ? 'bg-success' : 'bg-danger'}`}>{isCorrect ? '✓' : '✗'}</span>
                      Q{idx + 1}.&nbsp;
                      <span className="text-truncate" style={{ maxWidth: '500px' }}>{q.title || `Question ${idx + 1}`}</span>
                      <span className="ms-auto me-4 text-muted small">{q.score ?? 0}/{q.maxScore ?? 0} marks</span>
                    </button>
                  </h2>
                  <div id={`q${idx}`} className="accordion-collapse collapse">
                    <div className="accordion-body py-3">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div className={`p-2 rounded ${isCorrect ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                            <strong>Your Answer:</strong> {Array.isArray(q.userAnswer) ? q.userAnswer.join(', ') : (q.userAnswer || '(no answer)')}
                          </div>
                        </div>
                        {!isCorrect && q.correctAnswer && (
                          <div className="col-md-6">
                            <div className="p-2 rounded bg-success-subtle border border-success">
                              <strong>Correct Answer:</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                            </div>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="col-12 mt-2">
                            <div className="p-2 rounded bg-light border">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          })}
        </div>
      ) : (
        <div className="alert alert-info">No detailed question breakdown available for this submission.</div>
      )}
    </div>
  )
}

export default PDSAReview
