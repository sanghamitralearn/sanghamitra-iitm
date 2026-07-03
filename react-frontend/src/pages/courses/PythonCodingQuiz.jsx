import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const TOPIC_CONFIG = {
  'conditionals':   { topic: 'conditionals',   name: 'Conditionals' },
  'loops':          { topic: 'loops',           name: 'Loops' },
  'functions':      { topic: 'functions',       name: 'Functions' },
  'data-types':     { topic: 'data_types',      name: 'Data Types' },
  'ct-foundation':  { topic: 'CT_foundation',   name: 'CT Foundation' },
}

const LEVEL_INFO = {
  1: { label: 'Level 1', difficulty: 'easy',   color: '#28a745', bgColor: '#d4edda', badge: 'Easy'   },
  2: { label: 'Level 2', difficulty: 'medium', color: '#ffc107', bgColor: '#fff3cd', badge: 'Medium' },
  3: { label: 'Level 3', difficulty: 'hard',   color: '#dc3545', bgColor: '#f8d7da', badge: 'Hard'   },
}

function deepEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b)
  return false
}

const PythonCodingQuiz = () => {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const config = TOPIC_CONFIG[topicId]
  const topic = config?.topic
  const name = config?.name

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const pyodideRef = useRef(null)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)

  const [levelScores, setLevelScores] = useState({ 1: null, 2: null, 3: null })
  const [activeLevel, setActiveLevel] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [codes, setCodes] = useState({})
  const [testResults, setTestResults] = useState({})
  const [runningTests, setRunningTests] = useState(false)
  const [levelSubmitting, setLevelSubmitting] = useState(false)
  const [levelResult, setLevelResult] = useState(null)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState(null)

  useEffect(() => {
    const loadPy = async () => {
      if (window.pyodide) { pyodideRef.current = window.pyodide; setPyodideReady(true); setPyodideLoading(false); return }
      if (window.loadPyodide) { await initPyodide(); return }
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
      s.onload = initPyodide
      s.onerror = () => setPyodideLoading(false)
      document.head.appendChild(s)
    }
    loadPy()
  }, [])

  const initPyodide = async () => {
    try {
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
      pyodideRef.current = py
      window.pyodide = py
      setPyodideReady(true)
    } catch (e) { console.error('Pyodide error:', e) }
    finally { setPyodideLoading(false) }
  }

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        await loadLevelScores(res.data.email)
      } else navigate('/login', { replace: true })
    } catch { navigate('/login', { replace: true }) }
    finally { setAuthLoading(false) }
  }

  const loadLevelScores = async (email) => {
    if (!topic) return
    try {
      const res = await fetch(`${API}/api/coding-submissions?email=${encodeURIComponent(email)}`, { credentials: 'include' })
      const data = await res.json()
      const subs = (data.data || []).filter(s => s.email === email && (s.topic || '').toLowerCase() === topic.toLowerCase())
      const scores = { 1: null, 2: null, 3: null }
      subs.forEach(s => {
        const lv = s.level
        if ([1, 2, 3].includes(lv)) {
          if (scores[lv] === null || s.percentage > scores[lv]) scores[lv] = s.percentage
        }
      })
      setLevelScores(scores)
    } catch {}
  }

  const isLevelUnlocked = (level) => {
    if (level === 1) return true
    if (level === 2) return levelScores[1] !== null && levelScores[1] >= 60
    if (level === 3) return levelScores[1] !== null && levelScores[2] !== null && levelScores[1] >= 60 && levelScores[2] >= 60
    return false
  }

  const startLevel = async (level) => {
    if (!isLevelUnlocked(level)) return
    setActiveLevel(level)
    setQuestionsLoading(true)
    setQuestionsError(null)
    setCurrentIdx(0)
    setCodes({})
    setTestResults({})
    setLevelResult(null)
    try {
      const diff = LEVEL_INFO[level].difficulty
      const res = await fetch(`${API}/api/coding-questions?difficulty=${diff}&limit=5&topic=${encodeURIComponent(topic)}`, { credentials: 'include' })
      const data = await res.json()
      if (data.success && data.questions?.length > 0) {
        const qs = data.questions.map(q => ({ ...q, id: q.questionId, points: q.maxScore || 20 }))
        setQuestions(qs)
        const initCodes = {}
        qs.forEach(q => { initCodes[q.questionId] = q.starterCode || `def ${q.functionName || 'solution'}():\n    pass\n` })
        setCodes(initCodes)
      } else {
        setQuestionsError('No questions available for this level.')
      }
    } catch {
      setQuestionsError('Failed to load questions.')
    } finally {
      setQuestionsLoading(false)
    }
  }

  const clearGlobals = async () => {
    await pyodideRef.current.runPythonAsync(`
import sys
_keep = {'__builtins__','__name__','__doc__','__package__','__loader__','__spec__','__build_class__','__import__'}
for _k in list(globals().keys()):
    if _k not in _keep:
        try: del globals()[_k]
        except: pass
`)
  }

  const runTestsForQuestion = async (q, code) => {
    const results = []
    for (const tc of (q.testCases || [])) {
      try {
        await clearGlobals()
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
    return results
  }

  const runTests = async () => {
    if (!pyodideReady || !pyodideRef.current) { alert('Python environment not ready yet.'); return }
    const q = questions[currentIdx]
    if (!q) return
    setRunningTests(true)
    const results = await runTestsForQuestion(q, codes[q.questionId] || '')
    setTestResults(prev => ({ ...prev, [q.questionId]: results }))
    setRunningTests(false)
  }

  const submitLevel = async () => {
    if (!user || !activeLevel) return
    setLevelSubmitting(true)
    const allResults = []
    let totalScore = 0
    const maxScore = questions.reduce((s, q) => s + (q.points || 20), 0)
    for (const q of questions) {
      const code = codes[q.questionId] || ''
      let qResults = testResults[q.questionId] || []
      if (pyodideReady && pyodideRef.current && qResults.length === 0) {
        qResults = await runTestsForQuestion(q, code)
        setTestResults(prev => ({ ...prev, [q.questionId]: qResults }))
      }
      const passed = qResults.filter(r => r.passed).length
      const total = qResults.length || 1
      const qScore = Math.round((passed / total) * (q.points || 20))
      totalScore += qScore
      allResults.push({ questionId: q.questionId, title: q.title, code, testResults: qResults, score: qScore, maxScore: q.points || 20, passedTests: passed, totalTests: total, difficulty: LEVEL_INFO[activeLevel].difficulty })
    }
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    try {
      await fetch(`${API}/api/coding-submission`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: user.username, email: user.email, topic, score: totalScore, maxScore, percentage, level: activeLevel, questions: allResults, timestamp: new Date().toISOString() }),
      })
    } catch {}
    setLevelResult({ score: totalScore, maxScore, percentage, level: activeLevel })
    setLevelScores(prev => ({ ...prev, [activeLevel]: percentage }))
    setLevelSubmitting(false)
  }

  if (!config) return (
    <div className="container py-5 text-center">
      <div className="alert alert-warning"><h4>Invalid Topic</h4><Link to="/courses/python" className="btn btn-primary mt-2">Back to Python</Link></div>
    </div>
  )

  if (authLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary"></div>
    </div>
  )

  const PageTitle = () => (
    <div className="page-title" style={{ marginBottom: '2rem' }}>
      <div className="heading"><div className="container">
        <div className="row d-flex justify-content-center text-center">
          <div className="col-lg-8"><h1>{name} Coding</h1><p className="mb-0">Python Coding Exercise – {topic}</p></div>
        </div>
      </div></div>
      <nav className="breadcrumbs"><div className="container"><ol>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses/python">Python</Link></li>
        <li className="current">{name} Coding</li>
      </ol></div></nav>
    </div>
  )

  // LEVEL SELECTION
  if (!activeLevel) {
    return (
      <main className="main">
        <PageTitle />
        <div className="container" style={{ maxWidth: 900 }}>
          {pyodideLoading && (
            <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
              <div className="spinner-border spinner-border-sm text-info"></div>
              <span>Loading Python environment (Pyodide)… this may take a moment.</span>
            </div>
          )}

          <div className="row g-4 mb-4">
            {[1, 2, 3].map(level => {
              const info = LEVEL_INFO[level]
              const unlocked = isLevelUnlocked(level)
              const best = levelScores[level]
              return (
                <div className="col-md-4" key={level}>
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, borderTop: `4px solid ${info.color}` }}>
                    <div className="card-body text-center p-4">
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: info.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        {unlocked
                          ? <i className="bi bi-unlock-fill fs-4" style={{ color: info.color }}></i>
                          : <i className="bi bi-lock-fill fs-4 text-muted"></i>}
                      </div>
                      <h5 className="fw-bold mb-1">{info.label}</h5>
                      <span className="badge mb-3" style={{ background: info.color }}>{info.badge}</span>
                      {best !== null && (
                        <div className="mb-3">
                          <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                            <div className="progress-bar" style={{ width: `${best}%`, background: info.color }}></div>
                          </div>
                          <small className="text-muted">Best: {best}%</small>
                        </div>
                      )}
                      {!unlocked && level > 1 && (
                        <small className="text-muted d-block mb-2">Complete Level {level - 1} with ≥60% to unlock</small>
                      )}
                      <button
                        className="btn w-100"
                        style={{ background: unlocked ? info.color : '#6c757d', color: '#fff', borderRadius: 8 }}
                        onClick={() => startLevel(level)}
                        disabled={!unlocked || questionsLoading}
                      >
                        {questionsLoading && activeLevel === level
                          ? <span className="spinner-border spinner-border-sm"></span>
                          : best !== null ? 'Retry' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {questionsError && (
            <div className="alert alert-warning">{questionsError}</div>
          )}
        </div>
      </main>
    )
  }

  // QUIZ VIEW
  const q = questions[currentIdx]
  const currentCode = codes[q?.questionId] || ''
  const currentResults = testResults[q?.questionId] || []

  return (
    <main className="main">
      <PageTitle />
      <div className="container mb-5" style={{ maxWidth: 1100 }}>
        {questionsLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : questionsError ? (
          <div className="alert alert-warning">{questionsError}
            <button className="btn btn-sm btn-outline-secondary ms-3" onClick={() => setActiveLevel(null)}>Back to Levels</button>
          </div>
        ) : !q ? null : (
          <div className="row g-4">
            {/* Left: question */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge" style={{ background: LEVEL_INFO[activeLevel].color }}>{LEVEL_INFO[activeLevel].badge}</span>
                    <span className="text-muted small">{currentIdx + 1}/{questions.length}</span>
                  </div>
                  <h5 className="fw-bold mb-2">{q.title}</h5>
                  <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>{q.description}</p>
                  {q.prompt && <pre className="bg-light p-3 rounded" style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{q.prompt}</pre>}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>← Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === questions.length - 1}>Next →</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: editor + results */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Python Editor</span>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm" onClick={runTests} disabled={runningTests || !pyodideReady}>
                        {runningTests ? <span className="spinner-border spinner-border-sm"></span> : '▶ Run Tests'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="form-control font-monospace"
                    rows={14}
                    value={currentCode}
                    onChange={e => setCodes(prev => ({ ...prev, [q.questionId]: e.target.value }))}
                    style={{ fontSize: '0.85rem', resize: 'vertical', background: '#1e1e2e', color: '#cdd6f4', border: 'none', borderRadius: 8 }}
                    spellCheck={false}
                  />
                </div>
              </div>

              {currentResults.length > 0 && (
                <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                  <div className="card-body p-3">
                    <h6 className="fw-bold mb-2">Test Results</h6>
                    {currentResults.map((r, i) => (
                      <div key={i} className={`d-flex align-items-start gap-2 mb-2 p-2 rounded`} style={{ background: r.passed ? '#d4edda' : '#f8d7da', fontSize: '0.82rem' }}>
                        <i className={`bi ${r.passed ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}></i>
                        <div>
                          <div>Expected: <code>{JSON.stringify(r.expected)}</code></div>
                          {r.error ? <div className="text-danger">Error: {r.error}</div> : <div>Got: <code>{JSON.stringify(r.output)}</code></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {levelResult ? (
                <div className="card border-0 shadow-sm" style={{ borderRadius: 16, borderTop: `4px solid ${levelResult.percentage >= 60 ? '#28a745' : '#dc3545'}` }}>
                  <div className="card-body p-4 text-center">
                    <h4 className="fw-bold mb-1">{levelResult.percentage >= 80 ? 'Excellent!' : levelResult.percentage >= 60 ? 'Good job!' : 'Keep practicing!'}</h4>
                    <p className="text-muted mb-3">Score: {levelResult.score}/{levelResult.maxScore} ({levelResult.percentage}%)</p>
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveLevel(null)}>← Levels</button>
                      {levelResult.level < 3 && isLevelUnlocked(levelResult.level + 1) && (
                        <button className="btn btn-primary btn-sm" onClick={() => startLevel(levelResult.level + 1)}>
                          Next Level →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setActiveLevel(null)}>← Back to Levels</button>
                  <button className="btn btn-success" onClick={submitLevel} disabled={levelSubmitting}>
                    {levelSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</> : 'Submit Level'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default PythonCodingQuiz
