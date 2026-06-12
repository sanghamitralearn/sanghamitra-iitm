import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import CodingReview from './CodingReview'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Helpers ────────────────────────────────────────────────────────────────
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

function safeParseJSON(str, fallback) {
  if (str === undefined || str === null || str === '') return fallback
  try { return JSON.parse(str) } catch { return str }
}

const CodingPage = () => {
  const { course, week: weekParam } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const weekNum = parseInt(weekParam, 10)
  const { quizName } = location.state || {}
  const displayName = quizName || `${course?.toUpperCase()} — Week ${weekNum} Coding`

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [codes, setCodes] = useState({})
  const [testResults, setTestResults] = useState({})
  const [runningTests, setRunningTests] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)

  const userRef = useRef(null)

  // Pyodide (python / dsa)
  const pyodideRef = useRef(null)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)

  // sql.js (sql)
  const sqlJsRef = useRef(null)
  const [sqlReady, setSqlReady] = useState(false)
  const [sqlLoading, setSqlLoading] = useState(false)

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
        `${API}/api/coding-questions?course=${course}&week=${weekNum}`,
        { withCredentials: true }
      )
      const qs = res.data.questions || []
      if (!qs.length) { setError(`No coding questions found for ${course} Week ${weekNum}.`); return }
      setQuestions(qs)

      const initCodes = {}
      qs.forEach(q => {
        initCodes[q._id] = q.starter_code || defaultStarter(q)
      })
      setCodes(initCodes)

      // Lazily load runtimes needed for the languages present
      const languages = new Set(qs.map(q => q.language))
      if (languages.has('python')) loadPyodide()
      if (languages.has('sql')) loadSqlJs()
    } catch {
      setError('Failed to load coding questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const defaultStarter = (q) => {
    if (q.language === 'python') return `def ${q.expected_function_name || 'solution'}():\n    pass\n`
    if (q.language === 'sql') return '-- write your SQL query here\n'
    if (q.language === 'java') return `public class Solution {\n    // write your code here\n}\n`
    return ''
  }

  // ─── Pyodide setup ──────────────────────────────────────────────────────
  const loadPyodide = async () => {
    if (pyodideRef.current || window.pyodide) {
      pyodideRef.current = pyodideRef.current || window.pyodide
      setPyodideReady(true)
      return
    }
    setPyodideLoading(true)
    const init = async () => {
      try {
        const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' })
        pyodideRef.current = py
        window.pyodide = py
        setPyodideReady(true)
      } catch (e) {
        console.error('Pyodide load error:', e)
      } finally {
        setPyodideLoading(false)
      }
    }
    if (window.loadPyodide) { await init(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
    s.onload = init
    s.onerror = () => setPyodideLoading(false)
    document.head.appendChild(s)
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

  // ─── sql.js setup ───────────────────────────────────────────────────────
  const loadSqlJs = async () => {
    if (sqlJsRef.current || window.__SQL) {
      sqlJsRef.current = sqlJsRef.current || window.__SQL
      setSqlReady(true)
      return
    }
    setSqlLoading(true)
    const init = async () => {
      try {
        const SQL = await window.initSqlJs({
          locateFile: f => `https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/${f}`
        })
        sqlJsRef.current = SQL
        window.__SQL = SQL
        setSqlReady(true)
      } catch (e) {
        console.error('sql.js load error:', e)
      } finally {
        setSqlLoading(false)
      }
    }
    if (window.initSqlJs) { await init(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js'
    s.onload = init
    s.onerror = () => setSqlLoading(false)
    document.head.appendChild(s)
  }

  // ─── Test execution ─────────────────────────────────────────────────────
  const runPythonTests = async (q, code) => {
    const out = []
    for (const tc of (q.testCases || [])) {
      try {
        await clearGlobals()
        await pyodideRef.current.runPythonAsync(code)
        const args = safeParseJSON(tc.input, [])
        const argList = Array.isArray(args) ? args : [args]
        const call = `${q.expected_function_name}(${argList.map(v => JSON.stringify(v)).join(', ')})`
        const raw = await pyodideRef.current.runPythonAsync(call)
        const output = raw && typeof raw === 'object' && raw.toJs ? raw.toJs({ dict_converter: Object.fromEntries }) : raw
        const expected = safeParseJSON(tc.expected_output, tc.expected_output)
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input, expected_output: tc.expected_output,
          output: JSON.stringify(output),
          passed: deepEqual(output, expected),
          is_hidden: tc.is_hidden,
          error: null
        })
      } catch (e) {
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input, expected_output: tc.expected_output,
          output: null, passed: false, is_hidden: tc.is_hidden,
          error: e.message
        })
      }
    }
    return out
  }

  const runSqlTests = (q, code) => {
    const out = []
    for (const tc of (q.testCases || [])) {
      try {
        const db = new sqlJsRef.current.Database()
        if (q.setup_code) db.run(q.setup_code)
        const res = db.exec(code)
        const rows = res.length > 0 ? res[0].values : []
        const expected = safeParseJSON(tc.expected_output, [])
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input, expected_output: tc.expected_output,
          output: JSON.stringify(rows),
          passed: deepEqual(rows, expected),
          is_hidden: tc.is_hidden,
          error: null
        })
        db.close()
      } catch (e) {
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input, expected_output: tc.expected_output,
          output: null, passed: false, is_hidden: tc.is_hidden,
          error: e.message
        })
      }
    }
    return out
  }

  const runTestsForQuestion = async (q, code) => {
    if (q.language === 'python') {
      if (!pyodideReady || !pyodideRef.current) return null
      return runPythonTests(q, code)
    }
    if (q.language === 'sql') {
      if (!sqlReady || !sqlJsRef.current) return null
      return runSqlTests(q, code)
    }
    return null // java: no client-side execution available
  }

  const runTests = async () => {
    const q = questions[currentIndex]
    if (!q) return
    if (q.language === 'java') {
      alert('Auto-grading for Java is not available yet. Your code will be saved for manual review on submit.')
      return
    }
    if ((q.language === 'python' && !pyodideReady) || (q.language === 'sql' && !sqlReady)) {
      alert('The runtime for this language is still loading. Please wait a moment.')
      return
    }
    setRunningTests(true)
    const out = await runTestsForQuestion(q, codes[q._id] || '')
    if (out) setTestResults(prev => ({ ...prev, [q._id]: out }))
    setRunningTests(false)
  }

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const u = userRef.current
    if (!u?.email) { navigate('/login', { replace: true }); return }

    setSaving(true)
    const gradedResults = []
    const submitPayload = []

    for (const q of questions) {
      const code = codes[q._id] || ''
      let qResults = testResults[q._id]

      if (!qResults && q.language !== 'java') {
        qResults = await runTestsForQuestion(q, code)
        if (qResults) setTestResults(prev => ({ ...prev, [q._id]: qResults }))
      }

      let verdict, passed, total, score, percentage

      if (q.language === 'java' || !qResults) {
        verdict = 'Pending Review'
        passed = 0
        total = (q.testCases || []).length
        score = 0
        percentage = 0
      } else {
        passed = qResults.filter(r => r.passed).length
        total = qResults.length || 1
        percentage = Math.round((passed / total) * 100)
        score = Math.round((passed / total) * (q.points || 10))
        verdict = passed === total ? 'Accepted' : (passed > 0 ? 'Partially Accepted' : 'Wrong Answer')
      }

      gradedResults.push({
        questionId: q._id,
        title: q.title,
        question_text: q.question_text,
        language: q.language,
        difficulty: q.difficulty,
        topic: q.topic,
        subtopic: q.subtopic,
        points: q.points || 10,
        code,
        testResults: qResults || [],
        verdict, passed, total, score, percentage
      })

      submitPayload.push({
        questionId: q._id,
        language: q.language,
        sourceCode: code,
        verdict,
        passed_testcases: passed,
        total_testcases: total,
        score,
        percentage,
        topic: q.topic
      })
    }

    const totalScore = gradedResults.reduce((s, r) => s + r.score, 0)
    const maxScore = gradedResults.reduce((s, r) => s + r.points, 0)
    const solvedQuestions = gradedResults.filter(r => r.verdict === 'Accepted').length
    const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    try {
      await axios.post(`${API}/api/coding-submit`, {
        email: u.email,
        username: u.username || u.name || u.email,
        course,
        week: weekNum,
        topic: questions[0]?.topic || `Week ${weekNum}`,
        results: submitPayload
      }, { withCredentials: true })

      setResults({
        stats: {
          totalScore, maxScore, percentage: overallPercentage,
          totalQuestions: gradedResults.length, solvedQuestions
        },
        question_results: gradedResults
      })
      setSubmitted(true)
    } catch (e) {
      console.error('Submit failed:', e)
      alert('Failed to submit coding quiz. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setSubmitted(false); setResults(null)
    setCurrentIndex(0); setTestResults({})
    fetchQuestions()
  }

  // ─── Render states ───────────────────────────────────────────────────────
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
    <CodingReview results={results} onRetake={handleRetake} course={course} week={weekNum} />
  )

  const q = questions[currentIndex]
  const code = codes[q._id] || ''
  const qResults = testResults[q._id] || []
  const runtimeReady = q.language === 'python' ? pyodideReady : q.language === 'sql' ? sqlReady : true
  const runtimeLoading = q.language === 'python' ? pyodideLoading : q.language === 'sql' ? sqlLoading : false

  return (
    <main className="main">
      {/* Page title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">{course?.toUpperCase()} — Week {weekNum} Coding Practice</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li><Link to={`/programming/courses/${course}`}>Course</Link></li>
          <li className="current">Coding Quiz</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="badge bg-primary">{q.language}</span>
            {q.difficulty && <span className="badge bg-light text-dark border">{q.difficulty}</span>}
            <span className="badge bg-light text-dark border">{q.points || 10} pts</span>
          </div>
        </div>

        {(pyodideLoading || sqlLoading) && (
          <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
            <span className="spinner-border spinner-border-sm"></span>
            <span>Loading {pyodideLoading ? 'Python' : 'SQL'} environment… this may take a moment.</span>
          </div>
        )}

        <div className="row g-3">
          {/* Problem panel */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="mb-0">{q.title || `Question ${currentIndex + 1}`}</h5>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.7 }}>{q.question_text}</p>

                {q.input_description && (
                  <p className="small mb-1"><strong>Input:</strong> {q.input_description}</p>
                )}
                {q.output_description && (
                  <p className="small mb-2"><strong>Output:</strong> {q.output_description}</p>
                )}

                {Array.isArray(q.constraints) && q.constraints.length > 0 && (
                  <>
                    <h6 className="mt-3 mb-1">Constraints:</h6>
                    <ul className="small mb-2">
                      {q.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </>
                )}

                {Array.isArray(q.examples) && q.examples.length > 0 && (
                  <>
                    <h6 className="mt-3 mb-2">Examples:</h6>
                    {q.examples.map((ex, i) => (
                      <div key={i} className="small mb-2 p-2 rounded" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>
                        <div>Input: {ex.input}</div>
                        <div>Output: {ex.output}</div>
                        {ex.explanation && <div className="text-muted">Explanation: {ex.explanation}</div>}
                      </div>
                    ))}
                  </>
                )}

                {/* Sample test cases */}
                {Array.isArray(q.testCases) && q.testCases.some(tc => !tc.is_hidden) && (
                  <>
                    <h6 className="mt-3 mb-2">Sample Test Cases:</h6>
                    {q.testCases.filter(tc => !tc.is_hidden).map((tc, i) => {
                      const result = qResults.find(r => r.testcase_number === tc.testcase_number)
                      return (
                        <div key={i} className="small mb-2 p-2 rounded" style={{ background: '#f8f9fa', fontFamily: 'monospace' }}>
                          {tc.input && <div>Input: {tc.input}</div>}
                          <div>Expected: {tc.expected_output}</div>
                          {result && (
                            <span className={`badge mt-1 ${result.passed ? 'bg-success' : 'bg-danger'}`}>
                              {result.passed ? '✓ Passed' : `✗ Got: ${result.output ?? result.error}`}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Code editor */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0"><i className="bi bi-code-slash me-2"></i>Code ({q.language})</h6>
                  {q.language === 'java'
                    ? <small className="text-muted">Manual review</small>
                    : runtimeReady
                      ? <small className="text-success"><i className="bi bi-check-circle me-1"></i>Ready</small>
                      : <small className="text-warning"><span className="spinner-border spinner-border-sm me-1"></span>Loading…</small>
                  }
                </div>
                <textarea
                  style={{ width: '100%', minHeight: 320, fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: '0.88rem', background: '#1e1e1e', color: '#d4d4d4', border: 'none', borderRadius: 8, resize: 'vertical', padding: '12px', lineHeight: 1.6 }}
                  value={code}
                  onChange={e => setCodes(prev => ({ ...prev, [q._id]: e.target.value }))}
                  spellCheck={false}
                />
                <div className="d-flex justify-content-between mt-2">
                  <button className="btn btn-sm btn-outline-secondary"
                    onClick={() => setCodes(prev => ({ ...prev, [q._id]: q.starter_code || defaultStarter(q) }))}>
                    Reset Code
                  </button>
                  <button className="btn btn-sm" style={{ background: '#17a2b8', color: 'white' }}
                    onClick={runTests} disabled={runningTests || (q.language !== 'java' && !runtimeReady)}>
                    {runningTests ? <><span className="spinner-border spinner-border-sm me-1"></span>Running…</> : <>🧪 Run Tests</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button className="btn btn-outline-secondary" onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0}>
                <i className="bi bi-arrow-left me-1" />Prev
              </button>
              <div className="d-flex gap-1 flex-wrap">
                {questions.map((qq, i) => {
                  const r = testResults[qq._id]
                  const done = !!r
                  const allPass = done && r.every(x => x.passed)
                  return (
                    <button key={i} onClick={() => setCurrentIndex(i)}
                      className={`btn btn-sm rounded-circle p-0 ${i === currentIndex ? 'btn-primary' : done ? (allPass ? 'btn-success' : 'btn-warning') : 'btn-outline-secondary'}`}
                      style={{ width: 32, height: 32, fontSize: '0.78rem' }}>
                      {i + 1}
                    </button>
                  )
                })}
              </div>
              {currentIndex < questions.length - 1
                ? <button className="btn btn-primary" onClick={() => setCurrentIndex(i => i + 1)}>
                    Next<i className="bi bi-arrow-right ms-1" />
                  </button>
                : <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</> : <><i className="bi bi-check-lg me-1" />Submit</>}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default CodingPage
