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

const PdsaCodingQuiz = () => {
  const { weekId } = useParams()
  const navigate = useNavigate()
  const config = WEEK_CONFIG[weekId]
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
      const res = await fetch(`${API}/api/coding-submissions?email=${encodeURIComponent(email)}&topic=${encodeURIComponent(topic)}`, { credentials: 'include' })
      const data = await res.json()
      const subs = (data.submissions || []).filter(s => s.email === email && (s.topic || '').toLowerCase() === topic.toLowerCase())
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
      <div className="alert alert-warning"><h4>Invalid Quiz Week</h4><Link to="/courses/pdsa" className="btn btn-primary mt-2">Back to PDSA</Link></div>
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
        <li><Link to="/courses/pdsa">PDSA</Link></li>
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
              <span className="spinner-border spinner-border-sm"></span>
              <span>Loading Python environment... This may take a moment on first load.</span>
            </div>
          )}
          {pyodideReady && !pyodideLoading && (
            <div className="alert alert-success mb-4"><i className="bi bi-check-circle me-2"></i>Python environment ready!</div>
          )}
          <h4 className="mb-4">Select a Level to Start</h4>
          <div className="row g-4 mb-4">
            {[1, 2, 3].map(lv => {
              const info = LEVEL_INFO[lv]
              const unlocked = isLevelUnlocked(lv)
              const score = levelScores[lv]
              return (
                <div className="col-md-4" key={lv}>
                  <div className="card border-0 shadow h-100" style={{ borderRadius: 16, opacity: unlocked ? 1 : 0.65 }}>
                    <div className="card-body p-4 text-center">
                      <span className="badge px-3 py-2 fs-6 mb-3 d-inline-block" style={{ background: info.bgColor, color: info.color }}>{info.badge}</span>
                      <h5 className="mb-2">{info.label}</h5>
                      <p className="text-muted small mb-3">
                        {lv === 1 ? 'Fundamental concepts' : lv === 2 ? 'Intermediate problems' : 'Advanced challenges'}
                        <br /><span className="badge bg-secondary mt-1">5 Questions</span>
                      </p>
                      {score !== null && (
                        <div className="mb-3">
                          <div className="progress mb-1" style={{ height: 8 }}>
                            <div className="progress-bar" style={{ width: `${score}%`, background: info.color }}></div>
                          </div>
                          <small className="fw-bold" style={{ color: info.color }}>Best: {score}%</small>
                          {score >= 60 && <i className="bi bi-check-circle-fill text-success ms-1"></i>}
                        </div>
                      )}
                      {!unlocked && (
                        <p className="text-muted small mb-2">
                          <i className="bi bi-lock-fill me-1"></i>
                          {lv === 2 ? 'Complete Level 1 (≥60%) to unlock' : 'Complete Levels 1 & 2 (≥60%) to unlock'}
                        </p>
                      )}
                      <button className="btn w-100"
                        style={{ background: unlocked ? info.color : '#dee2e6', color: unlocked ? 'white' : '#666', border: 'none', borderRadius: 8 }}
                        onClick={() => startLevel(lv)}
                        disabled={!unlocked || pyodideLoading}>
                        {score !== null ? 'Retake Level' : unlocked ? `Start ${info.label}` : 'Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-center">
            <Link to="/courses/pdsa" className="btn btn-outline-secondary">← Back to PDSA</Link>
          </div>
        </div>
      </main>
    )
  }

  // LEVEL RESULT
  if (levelResult) {
    const pct = levelResult.percentage
    return (
      <main className="main">
        <PageTitle />
        <div className="container text-center" style={{ maxWidth: 700 }}>
          <div className="card border-0 shadow mb-4" style={{ borderRadius: 16 }}>
            <div className="card-body p-5" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16 }}>
              <h2 className="text-white">Level {levelResult.level} Complete!</h2>
              <div style={{ fontSize: '4rem', fontWeight: 800, color: 'white' }}>{pct}%</div>
              <p className="text-white">{levelResult.score} / {levelResult.maxScore} points</p>
              {pct >= 60 && levelResult.level < 3 && (
                <div className="alert alert-success d-inline-block mt-2">🎉 Level {levelResult.level + 1} Unlocked!</div>
              )}
            </div>
          </div>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="btn btn-primary" onClick={() => startLevel(activeLevel)}>Retake Level</button>
            {pct >= 60 && activeLevel < 3 && (
              <button className="btn btn-success" onClick={() => { setLevelResult(null); startLevel(activeLevel + 1) }}>
                Start Level {activeLevel + 1}
              </button>
            )}
            <button className="btn btn-outline-secondary" onClick={() => { setActiveLevel(null); setLevelResult(null) }}>Level Selection</button>
          </div>
        </div>
      </main>
    )
  }

  if (questionsLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center"><div className="spinner-border text-primary mb-3"></div><p>Loading Level {activeLevel} questions...</p></div>
    </div>
  )

  if (questionsError) return (
    <main className="main">
      <PageTitle />
      <div className="container py-4 text-center">
        <div className="alert alert-danger">{questionsError}</div>
        <button className="btn btn-primary me-2" onClick={() => startLevel(activeLevel)}>Retry</button>
        <button className="btn btn-secondary" onClick={() => setActiveLevel(null)}>Back to Level Selection</button>
      </div>
    </main>
  )

  const q = questions[currentIdx]
  const info = LEVEL_INFO[activeLevel]
  const currentCode = codes[q?.questionId] || ''
  const qResults = testResults[q?.questionId] || []

  return (
    <main className="main">
      <PageTitle />
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ background: info.bgColor }}>
          <div>
            <span className="badge me-2" style={{ background: info.color }}>Level {activeLevel} – {info.badge}</span>
            <span className="text-muted small">Question {currentIdx + 1} of {questions.length}</span>
          </div>
          <button className="btn btn-sm btn-outline-secondary"
            onClick={() => { if (window.confirm('Exit to level selection? Progress will be lost.')) { setActiveLevel(null); setLevelResult(null) } }}>
            Exit Level
          </button>
        </div>

        <div className="row g-3">
          {/* Problem Panel */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{q?.title}</h5>
                  <span className="badge bg-primary">{q?.points || 20} pts</span>
                </div>
                <p className="text-muted mb-3">{q?.description}</p>
                {q?.prompt && (
                  <div className="alert alert-info small mb-3">
                    <strong>Problem:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0', fontSize: '0.85rem' }}>{q.prompt}</pre>
                  </div>
                )}
                <h6 className="mt-3 mb-2">Test Cases:</h6>
                {q?.testCases?.map((tc, i) => (
                  <div key={i} className="small mb-2 p-2 rounded" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>
                    <div>Input: {JSON.stringify(tc.input)} → Expected: <strong>{JSON.stringify(tc.expected)}</strong></div>
                    {qResults[i] && (
                      <span className={`badge mt-1 ${qResults[i].passed ? 'bg-success' : 'bg-danger'}`}>
                        {qResults[i].passed ? '✓ Passed' : `✗ Got: ${JSON.stringify(qResults[i].output)}`}
                      </span>
                    )}
                    {qResults[i]?.error && <div className="text-danger small mt-1">{qResults[i].error}</div>}
                  </div>
                ))}
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
                  style={{ width: '100%', minHeight: 300, fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: '0.88rem', background: '#1e1e1e', color: '#d4d4d4', border: 'none', borderRadius: 8, resize: 'vertical', padding: '12px', lineHeight: 1.6 }}
                  value={currentCode}
                  onChange={e => setCodes(prev => ({ ...prev, [q.questionId]: e.target.value }))}
                  spellCheck={false}
                />
                <div className="d-flex justify-content-between mt-2">
                  <button className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCodes(prev => ({ ...prev, [q.questionId]: q?.starterCode || '' }))}>
                    Reset Code
                  </button>
                  <button className="btn btn-sm" style={{ background: '#17a2b8', color: 'white' }}
                    onClick={runTests} disabled={runningTests || !pyodideReady}>
                    {runningTests ? <><span className="spinner-border spinner-border-sm me-1"></span>Running...</> : '🧪 Run Tests'}
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                ← Previous
              </button>
              <div className="d-flex gap-1">
                {questions.map((_, i) => {
                  const qR = testResults[questions[i]?.questionId] || []
                  const done = qR.length > 0
                  const allPass = done && qR.every(r => r.passed)
                  return (
                    <button key={i} onClick={() => setCurrentIdx(i)}
                      className={`btn btn-sm rounded-circle p-0 ${i === currentIdx ? 'btn-primary' : done ? (allPass ? 'btn-success' : 'btn-warning') : 'btn-outline-secondary'}`}
                      style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              {currentIdx < questions.length - 1
                ? <button className="btn btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>Next →</button>
                : <button className="btn btn-success" onClick={submitLevel} disabled={levelSubmitting}>
                    {levelSubmitting ? <><span className="spinner-border spinner-border-sm me-1"></span>Submitting...</> : '📊 Submit Level'}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PdsaCodingQuiz
