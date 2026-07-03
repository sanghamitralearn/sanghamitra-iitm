import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'


const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'


const WEEK_TOPICS = {
  1:  'Multiple Random Variables',
  2:  'Independence and Variable Functions',
  3:  'Expectations Variance and Bivariate Data',
  4:  'Discrete vs Continuous Random Variables',
  5:  'Jointly Gaussian Random Variables',
  6:  'Marginal and Conditional Densities',
  7:  'Empirical Distribution',
  8:  'Moment Generating Functions',
  9:  'Parameter Estimation',
  10: 'Bayesian Estimation',
  11: 'Hypotheses Testing',
}


// ─── KaTeX ────────────────────────────────────────────────────────────────────
function loadKaTeX() {
  if (window.renderMathInElement) return Promise.resolve()
  return new Promise((resolve) => {
    if (!document.querySelector('link[href*="katex"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
      document.head.appendChild(link)
    }
    const core = document.createElement('script')
    core.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
    core.onload = () => {
      const ar = document.createElement('script')
      ar.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
      ar.onload = () => resolve()
      document.head.appendChild(ar)
    }
    document.head.appendChild(core)
  })
}


function renderMathContent(element) {
  if (!element) return
  setTimeout(() => {
    if (typeof window.renderMathInElement === 'undefined') return
    window.renderMathInElement(element, {
      delimiters: [{ left: '$', right: '$', display: false }],
      throwOnError: false,
      trust: true,
      strict: false,
    })
  }, 100)
}


// ─── MathText ─────────────────────────────────────────────────────────────────
const MathText = ({ text, style, className }) => {
  const ref = useRef(null)
  useEffect(() => { renderMathContent(ref.current) }, [text])
  return (
    <span ref={ref} className={className} style={style}
      dangerouslySetInnerHTML={{ __html: text || '' }} />
  )
}


// ─── QuestionRenderer (plain text + auto pipe-table detection) ────────────────
const QuestionRenderer = ({ text }) => {
  const ref = useRef(null)


  const segments = useMemo(() => {
    if (!text) return []
    const normalized = text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.split('\n')
    const result = []
    let i = 0
    while (i < lines.length) {
      const pipes = (lines[i].match(/\|/g) || []).length
      if (pipes >= 2) {
        const tableLines = []
        while (i < lines.length && (lines[i].match(/\|/g) || []).length >= 2) {
          tableLines.push(lines[i]); i++
        }
        if (tableLines.length >= 2) {
          const rows = tableLines.map(line => {
            let cells = line.split('|').map(c => c.trim())
            if (cells[0] === '') cells = cells.slice(1)
            if (cells[cells.length - 1] === '') cells = cells.slice(0, -1)
            return cells
          })
          result.push({ type: 'table', rows })
        } else {
          result.push({ type: 'text', content: tableLines.join('\n') })
        }
      } else {
        const textLines = []
        while (i < lines.length && (lines[i].match(/\|/g) || []).length < 2) {
          textLines.push(lines[i]); i++
        }
        const content = textLines.join('\n').trim()
        if (content) result.push({ type: 'text', content })
      }
    }
    return result
  }, [text])


  useEffect(() => { if (ref.current) renderMathContent(ref.current) }, [text])


  return (
    <div ref={ref}>
      {segments.map((seg, si) => {
        if (seg.type === 'table') {
          return (
            <div key={si} className="my-3" style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 120, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <thead>
                  <tr>
                    {seg.rows[0].map((cell, ci) => (
                      <th key={ci} style={{
                        padding: '9px 20px', background: '#1e3a5f', color: '#fff',
                        border: '1px solid #2d568a', textAlign: 'center',
                        fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.3px', whiteSpace: 'nowrap'
                      }} dangerouslySetInnerHTML={{ __html: cell || '&nbsp;' }} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seg.rows.slice(1).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          padding: '8px 20px', border: '1px solid #dee2e6',
                          textAlign: 'center', fontFamily: 'monospace', whiteSpace: 'nowrap',
                          background: ci === 0 ? '#dbeafe' : ri % 2 === 0 ? '#f8f9fa' : '#fff',
                          fontWeight: ci === 0 ? 700 : 400,
                          color: ci === 0 ? '#1e3a5f' : '#212529',
                        }} dangerouslySetInnerHTML={{ __html: cell || '&nbsp;' }} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return (
          <span key={si} style={{ display: 'block' }}
            dangerouslySetInnerHTML={{ __html: seg.content.replace(/\n/g, '<br/>') }} />
        )
      })}
    </div>
  )
}


const Stats2Review = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [scores, setScores] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filter, setFilter] = useState('')


  useEffect(() => { loadKaTeX() }, [])


  useEffect(() => {
    const init = async () => {
      try {
        const authCheck = await axios.get(`${API}/api/check-auth`, { withCredentials: true, timeout: 8000 })
        if (!authCheck.data.authenticated) {
          navigate('/login', { state: { from: { pathname: '/courses/statistics2/review' } }, replace: true })
          return
        }
        const session = await axios.get(`${API}/api/session-info`, { withCredentials: true, timeout: 8000 })
        const res = await axios.get(`${API}/api/iitm_stats2_scores_databases?email=${encodeURIComponent(session.data.email)}`, { withCredentials: true, timeout: 8000 })
        const quizScores = res.data?.data?.quizScores || []
        const sorted = [...quizScores].sort((a, b) => new Date(b.dateAttempted || 0) - new Date(a.dateAttempted || 0))
        setScores(sorted)
      } catch (err) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          setAuthError('Cannot reach the server. Make sure the backend is running on port 4000.')
        } else {
          navigate('/login', { replace: true })
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])


  const openAttempt = async (s) => {
    setSelectedAttempt(s)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await axios.get(`${API}/api/iitm_stats2_scores_databases/${s._id}`, { withCredentials: true, timeout: 8000 })
      setDetail(res.data)
    } catch (err) {
      console.error('Error fetching attempt detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }


  const getScoreColor = (pct) => pct >= 80 ? '#28a745' : pct >= 60 ? '#ffc107' : '#dc3545'


  const getPct = (s) => s.percentage != null
    ? Math.round(s.percentage)
    : (s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0)


  const getLabel = (s) => {
    if (s.topic) return `Week ${s.week} — ${s.topic}`
    return `Week ${s.week}${WEEK_TOPICS[s.week] ? ' — ' + WEEK_TOPICS[s.week] : ''}`
  }


  const filtered = filter
    ? scores.filter(s => getLabel(s).toLowerCase().includes(filter.toLowerCase()))
    : scores


  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Loading your attempts…</p>
      </div>
    </div>
  )


  if (authError) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <i className="bi bi-wifi-off fs-1 text-danger mb-3 d-block" />
        <h5 className="text-danger">Server Unavailable</h5>
        <p className="text-muted">{authError}</p>
        <button className="btn btn-primary me-2" onClick={() => { setAuthError(false); setLoading(true); window.location.reload() }}>Retry</button>
        <Link to="/login" className="btn btn-outline-secondary">Go to Login</Link>
      </div>
    </div>
  )


  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Statistics 2 — Quiz Review</h1>
              <p className="mb-0">Review your previous quiz attempts and check your answers.</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics2">Statistics 2</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>


      <div className="container mb-5">
        {selectedAttempt ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-0">{getLabel(selectedAttempt)}</h4>
                <small className="text-muted">{selectedAttempt.dateAttempted ? new Date(selectedAttempt.dateAttempted).toLocaleString() : ''}</small>
              </div>
              <button className="btn btn-outline-secondary" onClick={() => { setSelectedAttempt(null); setDetail(null) }}>← Back to list</button>
            </div>


            <div className="row g-3 mb-4">
              {[
                { label: 'Score', val: `${getPct(selectedAttempt)}%`, color: getScoreColor(getPct(selectedAttempt)) },
                { label: 'Correct', val: selectedAttempt.correctAnswers || 0, color: '#28a745' },
                { label: 'Incorrect', val: (selectedAttempt.totalQuestions || 0) - (selectedAttempt.correctAnswers || 0), color: '#dc3545' },
                { label: 'Total Q', val: selectedAttempt.totalQuestions || 0, color: '#6c757d' }
              ].map(({ label, val, color }) => (
                <div className="col-6 col-md-3" key={label}>
                  <div className="card text-center h-100"><div className="card-body py-3">
                    <div className="fs-4 fw-bold" style={{ color }}>{val}</div>
                    <div className="text-muted small">{label}</div>
                  </div></div>
                </div>
              ))}
            </div>


            {detailLoading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : detail?.questions?.length > 0 ? (
              <div className="accordion" id="questionsAccordion">
                {detail.questions.map((q, idx) => {
                  const correctArr = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]
                  return (
                    <div className="accordion-item mb-2 border" key={idx} style={{ borderRadius: '8px', overflow: 'hidden' }}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button collapsed py-2 px-3 ${q.is_correct ? 'bg-success-subtle' : 'bg-danger-subtle'}`}
                          type="button" data-bs-toggle="collapse" data-bs-target={`#q${idx}`}
                          style={{ fontWeight: '500', fontSize: '0.95rem' }}
                        >
                          <span className={`badge me-2 ${q.is_correct ? 'bg-success' : 'bg-danger'}`}>{q.is_correct ? '✓' : '✗'}</span>
                          Q{idx + 1}.&nbsp;
                          <span className="text-truncate" style={{ maxWidth: '600px' }}>
                            {(q.question_text || 'Question').replace(/\|/g, ' ').replace(/\s+/g, ' ').slice(0, 110)}
                          </span>
                          {q.marks_awarded > 0 && <span className="ms-auto me-4 text-muted small">+{q.marks_awarded} marks</span>}
                        </button>
                      </h2>
                      <div id={`q${idx}`} className="accordion-collapse collapse">
                        <div className="accordion-body py-3">
                          <div className="mb-3" style={{ fontSize: '1rem', lineHeight: 1.7 }}>
                            <QuestionRenderer text={q.question_text} />
                          </div>


                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="mb-3">
                              {q.options.map((opt, oi) => {
                                const optVal = opt.option_id ?? oi
                                const isCorrectOpt = correctArr.includes(optVal)
                                const userPicked = Array.isArray(q.user_answer)
                                  ? q.user_answer.includes(optVal)
                                  : q.user_answer === optVal
                                const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                                return (
                                  <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{ background: bg }}>
                                    {isCorrectOpt && <i className="bi bi-check-circle-fill text-success" />}
                                    {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger" />}
                                    {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted" />}
                                    {opt.option_id && <strong className="me-1">{opt.option_id}.</strong>}
                                    <MathText text={opt.text ?? String(opt)} style={{ fontSize: '0.92rem' }} />
                                  </div>
                                )
                              })}
                            </div>
                          )}


                          {(!Array.isArray(q.options) || !q.options.length) && (
                            <div className="row g-2 mb-3">
                              <div className="col-md-6">
                                <div className={`p-2 rounded ${q.is_correct ? 'bg-success-subtle border border-success' : 'bg-danger-subtle border border-danger'}`}>
                                  <strong>Your Answer:</strong>{' '}
                                  <MathText text={String(Array.isArray(q.user_answer) ? q.user_answer.join(', ') : (q.user_answer ?? '(no answer)'))} />
                                </div>
                              </div>
                              {!q.is_correct && (
                                <div className="col-md-6">
                                  <div className="p-2 rounded bg-success-subtle border border-success">
                                    <strong>Correct Answer:</strong>{' '}
                                    <MathText text={String(Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : (q.correct_answer ?? '—'))} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}


                          {q.explanation && (
                            <div className="p-2 rounded" style={{ background: '#f0f4ff', fontSize: '0.88rem' }}>
                              <strong>Explanation: </strong><MathText text={q.explanation} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="alert alert-info">Detailed per-question breakdown is not available for this attempt.</div>
            )}
          </div>
        ) : (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Your Quiz Attempts ({scores.length})</h4>
              <Link to="/courses/statistics2" className="btn btn-outline-primary btn-sm">← Back to Topics</Link>
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Filter by week or topic..."
                value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: '350px' }} />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center text-muted py-5">
                {scores.length === 0 ? 'No quiz attempts yet.' : 'No matching topics.'}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>#</th><th>Week / Topic</th><th>Score</th><th>Percentage</th><th>Date</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => {
                      const pct = getPct(s)
                      return (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td><strong>{getLabel(s)}</strong></td>
                          <td>{s.correctAnswers ?? '—'}/{s.totalQuestions ?? '—'}</td>
                          <td>
                            <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>{pct}%</span>
                            <div className="progress mt-1" style={{ height: '4px' }}>
                              <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: getScoreColor(pct) }} />
                            </div>
                          </td>
                          <td className="text-muted">{s.dateAttempted ? new Date(s.dateAttempted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          <td><button className="btn btn-outline-primary btn-sm" onClick={() => openAttempt(s)}>Review</button></td>
                        </tr>
                      )
                    })}
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


export default Stats2Review



