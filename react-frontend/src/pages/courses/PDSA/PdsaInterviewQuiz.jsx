import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

const WEEK_CONFIG = {
  '1':  { topic: 'Python Basics',                 name: 'Python Basics' },
  '2':  { topic: 'Sorting Algorithms',            name: 'Sorting Algorithms' },
  '3':  { topic: 'Linear Data Structures',        name: 'Linear Data Structures' },
  '4':  { topic: 'Introduction to Graphs',        name: 'Introduction to Graphs' },
  '5':  { topic: 'Graph Algorithms',              name: 'Graph Algorithms' },
  '6':  { topic: 'Advanced Data Structures',      name: 'Advanced Data Structures' },
  '7':  { topic: 'Advanced Algorithms',           name: 'Advanced Algorithms' },
  '8':  { topic: 'Divide and Conquer Algorithms', name: 'Divide and Conquer Algorithms' },
  '9':  { topic: 'Dynamic Programming',           name: 'Dynamic Programming' },
  '10': { topic: 'Linear Programming',            name: 'Linear Programming' },
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b)
  return false
}

const PdsaInterviewQuiz = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const config = WEEK_CONFIG[weekId]
  const topic = config?.topic
  const name = config?.name

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviewData, setInterviewData] = useState(null)
  const [error, setError] = useState(null)

  // Pyodide
  const pyodideRef = useRef(null)
  const [pyodideReady, setPyodideReady] = useState(false)

  // Theory answers: index -> text
  const [theoryAnswers, setTheoryAnswers] = useState({})
  // Coding: index -> { code, testResults, score, maxScore, submitted }
  const [codingState, setCodingState] = useState({})
  // View state: 'theory' | 'coding'
  const [view, setView] = useState('theory')
  const [theoryIdx, setTheoryIdx] = useState(0)
  const [codingIdx, setCodingIdx] = useState(0)
  const [runningTests, setRunningTests] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    checkAuth()
    // Load Pyodide
    const loadPy = async () => {
      if (window.pyodide) { pyodideRef.current = window.pyodide; setPyodideReady(true); return }
      if (window.loadPyodide) { await initPyodide(); return }
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
      s.onload = initPyodide
      document.head.appendChild(s)
    }
    loadPy()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const initPyodide = async () => {
    try {
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
      pyodideRef.current = py
      window.pyodide = py
      setPyodideReady(true)
    } catch (e) { console.error('Pyodide error:', e) }
  }

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        fetchInterviewData(res.data)
      } else navigate('/login', { replace: true })
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchInterviewData = async (userData) => {
    if (!topic) { setError('Invalid interview configuration'); setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/interview?topic=${encodeURIComponent(topic)}&type=interview&codingCount=2&pdsaCount=3`, { credentials: 'include' })
      const data = await res.json()
      if (data && (data.pdsaQuestions || data.codingQuestions)) {
        setInterviewData(data)
        // Init coding state
        const initCoding = {}
        const cqs = data.codingQuestions?.questions || []
        cqs.forEach((q, i) => {
          initCoding[i] = { code: q.starterCode || `def ${q.functionName || 'solution'}():\n    pass\n`, testResults: [], score: 0, maxScore: q.maxScore || 15, submitted: false }
        })
        setCodingState(initCoding)
        // Start timer
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
      } else {
        setError('Failed to load interview questions. The interview service may be unavailable.')
      }
    } catch (e) {
      // Use fallback mock data
      const fallback = {
        topic,
        type: 'interview',
        pdsaQuestions: {
          questions: [
            { questionId: 'q1', title: `Explain the core concepts of ${topic}`, description: 'Provide a detailed explanation.', type: 'interview', maxScore: 10 },
            { questionId: 'q2', title: `What are common use cases for ${topic}?`, description: 'Give real-world examples.', type: 'interview', maxScore: 10 },
            { questionId: 'q3', title: `What are the time and space complexity trade-offs in ${topic}?`, description: 'Analyze complexity.', type: 'interview', maxScore: 10 },
          ]
        },
        codingQuestions: {
          questions: [
            { questionId: 'c1', title: 'Implement a basic algorithm', description: `Write a Python function related to ${topic}.`, functionName: 'solution', starterCode: 'def solution(n):\n    pass\n', testCases: [{ input: 5, expected: 5 }], maxScore: 15 },
            { questionId: 'c2', title: 'Solve an optimization problem', description: `Optimize a solution using ${topic} concepts.`, functionName: 'optimize', starterCode: 'def optimize(arr):\n    pass\n', testCases: [{ input: [1, 2, 3], expected: 6 }], maxScore: 15 },
          ]
        }
      }
      setInterviewData(fallback)
      const initCoding = {}
      fallback.codingQuestions.questions.forEach((q, i) => {
        initCoding[i] = { code: q.starterCode, testResults: [], score: 0, maxScore: q.maxScore || 15, submitted: false }
      })
      setCodingState(initCoding)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const runCodingTests = async (idx) => {
    const cqs = interviewData?.codingQuestions?.questions || []
    const q = cqs[idx]
    if (!q || !pyodideReady || !pyodideRef.current) { alert('Python not ready yet.'); return }
    setRunningTests(true)
    const code = codingState[idx]?.code || ''
    const results = []
    for (const tc of (q.testCases || [])) {
      try {
        await pyodideRef.current.runPythonAsync(`
import sys
_keep = {'__builtins__','__name__','__doc__','__package__','__loader__','__spec__','__build_class__','__import__'}
for _k in list(globals().keys()):
    if _k not in _keep:
        try: del globals()[_k]
        except: pass
`)
        await pyodideRef.current.runPythonAsync(code)
        const call = Array.isArray(tc.input)
          ? `${q.functionName}(${tc.input.map(v => JSON.stringify(v)).join(', ')})`
          : `${q.functionName}(${JSON.stringify(tc.input)})`
        const raw = await pyodideRef.current.runPythonAsync(call)
        const output = raw && typeof raw === 'object' && raw.toJs ? raw.toJs({ dict_converter: Object.fromEntries }) : raw
        results.push({ passed: deepEqual(output, tc.expected), output, expected: tc.expected, error: null })
      } catch (e) {
        results.push({ passed: false, output: null, expected: tc.expected, error: e.message })
      }
    }
    const passed = results.filter(r => r.passed).length
    const total = results.length || 1
    const score = Math.round((passed / total) * (q.maxScore || 15))
    setCodingState(prev => ({ ...prev, [idx]: { ...prev[idx], testResults: results, score, submitted: true } }))
    setRunningTests(false)
  }

  const handleSubmitAll = async () => {
    if (!user || !interviewData) return
    setSubmitting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    const pqs = interviewData.pdsaQuestions?.questions || []
    const cqs = interviewData.codingQuestions?.questions || []
    const questions = []
    pqs.forEach((q, i) => {
      questions.push({ questionId: q.questionId, title: q.title, type: q.type || 'interview', userAnswer: theoryAnswers[i] || '', score: 0, maxScore: q.maxScore || 10 })
    })
    cqs.forEach((q, i) => {
      const cs = codingState[i] || {}
      questions.push({ questionId: q.questionId, title: q.title, type: 'coding', userCode: cs.code || '', testResults: cs.testResults || [], score: cs.score || 0, maxScore: cs.maxScore || 15 })
    })
    const codingScore = cqs.reduce((s, _, i) => s + (codingState[i]?.score || 0), 0)
    const codingMax   = cqs.reduce((s, q) => s + (q.maxScore || 15), 0)
    const percentage  = codingMax > 0 ? Math.round((codingScore / codingMax) * 100) : 0
    const payload = {
      username: user.username, email: user.email, userid: user.userid || '',
      topic: interviewData.topic, type: interviewData.type,
      score: codingScore, maxScore: codingMax, percentage,
      questions, duration: Math.round(elapsed / 60), timestamp: new Date(),
    }
    try {
      await fetch(`${API}/api/interview-submission`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      })
    } catch {}
    setResult({ codingScore, codingMax, percentage, duration: elapsed })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (!config) return (
    <div className="container py-5 text-center">
      <div className="alert alert-warning"><h4>Invalid Interview Week</h4><Link to="/courses/pdsa" className="btn btn-primary mt-2">Back to PDSA</Link></div>
    </div>
  )

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center"><div className="spinner-border text-primary mb-3"></div><p>Loading interview questions...</p></div>
    </div>
  )

  if (error) return (
    <div className="container py-5">
      <div className="alert alert-danger text-center">
        <h4>Error</h4><p>{error}</p>
        <Link to="/courses/pdsa" className="btn btn-secondary">Back to PDSA</Link>
      </div>
    </div>
  )

  const PageTitle = () => (
    <div className="page-title" style={{ marginBottom: '2rem' }}>
      <div className="heading"><div className="container">
        <div className="row d-flex justify-content-center text-center">
          <div className="col-lg-8"><h1>{name} Mock Interview</h1><p className="mb-0">Theory + Coding interview for {topic}</p></div>
        </div>
      </div></div>
      <nav className="breadcrumbs"><div className="container"><ol>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses/pdsa">PDSA</Link></li>
        <li className="current">{name} Interview</li>
      </ol></div></nav>
    </div>
  )

  if (submitted && result) {
    return (
      <main className="main">
        <PageTitle />
        <div className="container text-center" style={{ maxWidth: 700 }}>
          <div className="card border-0 shadow mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body p-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16 }}>
              <h2 className="text-white mb-2">Interview Complete!</h2>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white' }}>{result.percentage}%</div>
              <p className="text-white">Coding: {result.codingScore} / {result.codingMax} pts</p>
              <p className="text-white small">Theory answers submitted for review</p>
              <p className="text-white small">Duration: {formatTime(result.duration)}</p>
            </div>
          </div>
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Coding scores are auto-graded. Theory answers are pending reviewer evaluation.
          </div>
          <Link to="/courses/pdsa" className="btn btn-primary">Back to PDSA</Link>
        </div>
      </main>
    )
  }

  const pqs = interviewData?.pdsaQuestions?.questions || []
  const cqs = interviewData?.codingQuestions?.questions || []
  const theoryQ = pqs[theoryIdx]
  const codingQ = cqs[codingIdx]
  const codingS = codingState[codingIdx] || {}
  const codingResults = codingS.testResults || []

  return (
    <main className="main">
      <PageTitle />
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Top bar */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12 }}>
          <div>
            <span className="text-white fw-bold">{topic} Mock Interview</span>
            <span className="text-white small ms-3 opacity-75">{pqs.length} Theory + {cqs.length} Coding</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <i className="bi bi-clock me-1"></i>{formatTime(elapsed)}
            </span>
            <button className="btn btn-sm btn-light" onClick={handleSubmitAll} disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Submitting...</> : 'Submit Interview'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item">
            <button className={`nav-link ${view === 'theory' ? 'active' : ''}`} onClick={() => setView('theory')}>
              <i className="bi bi-chat-square-text me-2"></i>Theory Questions ({pqs.length})
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${view === 'coding' ? 'active' : ''}`} onClick={() => setView('coding')}>
              <i className="bi bi-code-slash me-2"></i>Coding Questions ({cqs.length})
              {cqs.some((_, i) => codingState[i]?.submitted) && <span className="badge bg-success ms-1">Some Done</span>}
            </button>
          </li>
        </ul>

        {/* THEORY VIEW */}
        {view === 'theory' && theoryQ && (
          <div>
            <div className="card border-0 shadow mb-3" style={{ borderRadius: 12, borderLeft: '5px solid #667eea' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <small className="text-muted text-uppercase fw-bold">Question {theoryIdx + 1} of {pqs.length}</small>
                    <h5 className="mt-1 mb-0">{theoryQ.title}</h5>
                  </div>
                  <span className="badge bg-secondary">{theoryQ.maxScore || 10} pts (reviewed)</span>
                </div>
                {theoryQ.description && <p className="text-muted mb-3">{theoryQ.description}</p>}
                <label className="form-label fw-medium">Your Answer:</label>
                <textarea
                  className="form-control"
                  style={{ minHeight: 160, fontFamily: 'inherit', fontSize: '0.95rem' }}
                  placeholder="Type your answer here... Be thorough and explain your reasoning."
                  value={theoryAnswers[theoryIdx] || ''}
                  onChange={e => setTheoryAnswers(prev => ({ ...prev, [theoryIdx]: e.target.value }))}
                />
                <small className="text-muted mt-1 d-block">
                  <i className="bi bi-info-circle me-1"></i>Theory answers will be reviewed by an instructor.
                </small>
              </div>
            </div>
            <div className="d-flex justify-content-between mb-4">
              <button className="btn btn-outline-secondary" onClick={() => setTheoryIdx(i => Math.max(0, i - 1))} disabled={theoryIdx === 0}>← Previous</button>
              <div className="d-flex gap-1">
                {pqs.map((_, i) => (
                  <button key={i} onClick={() => setTheoryIdx(i)}
                    className={`btn btn-sm rounded-circle p-0 ${i === theoryIdx ? 'btn-primary' : theoryAnswers[i] ? 'btn-success' : 'btn-outline-secondary'}`}
                    style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                    {i + 1}
                  </button>
                ))}
              </div>
              {theoryIdx < pqs.length - 1
                ? <button className="btn btn-primary" onClick={() => setTheoryIdx(i => i + 1)}>Next →</button>
                : <button className="btn btn-info text-white" onClick={() => setView('coding')}>
                    Go to Coding <i className="bi bi-code-slash ms-1"></i>
                  </button>
              }
            </div>
          </div>
        )}

        {/* CODING VIEW */}
        {view === 'coding' && (
          <div>
            {/* Coding question tabs */}
            {cqs.length > 1 && (
              <div className="d-flex gap-2 mb-3">
                {cqs.map((q, i) => (
                  <button key={i} onClick={() => setCodingIdx(i)}
                    className={`btn btn-sm ${i === codingIdx ? 'btn-primary' : codingState[i]?.submitted ? 'btn-success' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: 8 }}>
                    Q{i + 1}: {q.title?.substring(0, 20)}...
                    {codingState[i]?.submitted && <i className="bi bi-check-circle ms-1"></i>}
                  </button>
                ))}
              </div>
            )}

            {codingQ && (
              <div className="row g-3">
                {/* Problem */}
                <div className="col-lg-5">
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">{codingQ.title}</h5>
                        <span className="badge bg-primary">{codingQ.maxScore || 15} pts</span>
                      </div>
                      <p className="text-muted mb-3">{codingQ.description}</p>
                      {codingQ.prompt && (
                        <div className="alert alert-info small mb-3">
                          <strong>Task:</strong><br />
                          <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.85rem' }}>{codingQ.prompt}</pre>
                        </div>
                      )}
                      <h6 className="mt-3 mb-2">Test Cases:</h6>
                      {codingQ.testCases?.map((tc, i) => (
                        <div key={i} className="small mb-2 p-2 rounded" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>
                          <div>Input: {JSON.stringify(tc.input)} → Expected: <strong>{JSON.stringify(tc.expected)}</strong></div>
                          {codingResults[i] && (
                            <div className={`mt-1 badge ${codingResults[i].passed ? 'bg-success' : 'bg-danger'}`}>
                              {codingResults[i].passed ? '✓ Passed' : `✗ Got: ${JSON.stringify(codingResults[i].output)}`}
                            </div>
                          )}
                          {codingResults[i]?.error && <div className="text-danger small">{codingResults[i].error}</div>}
                        </div>
                      ))}
                      {codingS.submitted && (
                        <div className="alert alert-success mt-3 py-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Score: {codingS.score}/{codingS.maxScore} ({Math.round((codingS.score / (codingS.maxScore || 1)) * 100)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="col-lg-7">
                  <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0"><i className="bi bi-code-slash me-2"></i>Python Code</h6>
                        {pyodideReady
                          ? <small className="text-success"><i className="bi bi-check-circle me-1"></i>Python Ready</small>
                          : <small className="text-warning"><span className="spinner-border spinner-border-sm me-1"></span>Loading Python...</small>
                        }
                      </div>
                      <textarea
                        style={{ width: '100%', minHeight: 320, fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: '0.88rem', background: '#1e1e1e', color: '#d4d4d4', border: 'none', borderRadius: 8, resize: 'vertical', padding: '12px', lineHeight: 1.6 }}
                        value={codingS.code || ''}
                        onChange={e => setCodingState(prev => ({ ...prev, [codingIdx]: { ...prev[codingIdx], code: e.target.value } }))}
                        spellCheck={false}
                      />
                      <div className="d-flex justify-content-between mt-2">
                        <button className="btn btn-sm btn-outline-secondary"
                          onClick={() => setCodingState(prev => ({ ...prev, [codingIdx]: { ...prev[codingIdx], code: codingQ.starterCode || '' } }))}>
                          Reset Code
                        </button>
                        <button className="btn btn-sm" style={{ background: '#17a2b8', color: 'white' }}
                          onClick={() => runCodingTests(codingIdx)} disabled={runningTests || !pyodideReady}>
                          {runningTests ? <><span className="spinner-border spinner-border-sm me-1"></span>Running...</> : '🧪 Run & Submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {cqs.length > 1 && codingIdx < cqs.length - 1 && (
                    <div className="text-end mt-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => setCodingIdx(i => i + 1)}>
                        Next Coding Question →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit bar */}
        <div className="d-flex justify-content-between align-items-center mt-4 p-3 rounded" style={{ background: '#f8f9fa', borderRadius: 12 }}>
          <div className="small text-muted">
            Theory: {Object.keys(theoryAnswers).length}/{pqs.length} answered •
            Coding: {Object.values(codingState).filter(s => s?.submitted).length}/{cqs.length} submitted
          </div>
          <button className="btn btn-success" onClick={handleSubmitAll} disabled={submitting}>
            {submitting
              ? <><span className="spinner-border spinner-border-sm me-1"></span>Submitting...</>
              : <><i className="bi bi-check2-all me-2"></i>End Interview & Submit All</>
            }
          </button>
        </div>
      </div>
    </main>
  )
}

export default PdsaInterviewQuiz
