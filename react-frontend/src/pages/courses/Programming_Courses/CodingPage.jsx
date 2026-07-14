import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import CodingReview from './CodingReview'
import Editor from '@monaco-editor/react'

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
  const [javaError, setJavaError] = useState(null)

  const userRef = useRef(null)

  // Pyodide (python / dsa)
  const pyodideRef = useRef(null)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)

  // sql.js (sql)
  const sqlJsRef = useRef(null)
  const [sqlReady, setSqlReady] = useState(false)
  const [sqlLoading, setSqlLoading] = useState(false)

  // Java: executed via Piston API (server-side proxy), no client runtime to load
  const [javaRunning, setJavaRunning] = useState(false)

  // Editor ref for advanced operations
  const editorRef = useRef(null)

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
        `${API}/api/coding-questions?course=${course}&week=${weekNum}&limitPerDifficulty=2`,
        { withCredentials: true }
      )
      const qs = res.data.questions || []
      const meta = res.data.meta || {}
      
      console.log('📊 Questions fetched:', {
        total: qs.length,
        difficulties: meta.difficulties || {},
        questions: qs.map(q => ({ title: q.title, difficulty: q.difficulty }))
      })
      
      if (!qs.length) { 
        setError(`No coding questions found for ${course} Week ${weekNum}.`)
        setLoading(false)
        return 
      }
      
      const formattedQs = qs.map(q => ({
        ...q,
        testCases: q.test_cases || q.testCases || []
      }))
      
      setQuestions(formattedQs)

      const initCodes = {}
      formattedQs.forEach(q => {
        initCodes[q._id] = q.starter_code || defaultStarter(q)
      })
      setCodes(initCodes)

      const languages = new Set(formattedQs.map(q => q.language))
      if (languages.has('python')) loadPyodide()
      if (languages.has('sql')) loadSqlJs()
      
    } catch (err) {
      setError('Failed to load coding questions. Please try again.')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const defaultStarter = (q) => {
    if (q.language === 'python') return `def ${q.expected_function_name || 'solution'}():\n    pass\n`
    if (q.language === 'sql') return '-- write your SQL query here\n'
    if (q.language === 'java') return `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your code here\n        // read input with sc.nextLine(), sc.nextInt(), etc.\n        // print output with System.out.println()\n    }\n}\n`
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
        setPyodideLoading(false)
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
        setSqlLoading(false)
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

  const runJavaTests = async (q, code) => {
    console.log('🔍 Running Java tests for question:', q._id);
    const out = []
    
    if (!code || code.trim() === '') {
      out.push({
        testcase_number: 0,
        input: '',
        expected_output: '',
        output: null,
        passed: false,
        is_hidden: false,
        error: 'No code provided'
      });
      return out;
    }

    let testCases = q.testCases || q.test_cases || [];
    
    if (testCases.length === 0) {
      const expectedOutput = q.expected_output || 'Alice';
      testCases = [{
        testcase_number: 1,
        input: '',
        expected_output: expectedOutput,
        is_hidden: false,
        is_sample: true,
        weightage: 1
      }];
    }
    
    const hasMainClass = code.includes('public class Main');
    let fullCode = code;
    
    if (!hasMainClass) {
      if (code.includes('public class Student')) {
        fullCode = code + `

public class Main {
    public static void main(String[] args) {
        try {
            Student student = new Student("Alice", 20);
            String result = student.getName();
            System.out.println(result);
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}`;
      } else {
        fullCode = code + `

public class Main {
    public static void main(String[] args) {
        try {
            // Test execution
            System.out.println("Test execution completed");
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}`;
      }
    }
    
    for (const tc of testCases) {
      try {
        const response = await axios.post(
          `${API}/api/run-code`,
          { 
            language: 'java', 
            source: fullCode, 
            stdin: tc.input || '' 
          },
          { 
            withCredentials: true,
            timeout: 30000
          }
        );
        
        const stdout = response.data.stdout || '';
        const stderr = response.data.stderr || '';
        const compile_output = response.data.compile_output || '';
        
        if (compile_output) {
          out.push({
            testcase_number: tc.testcase_number,
            input: tc.input,
            expected_output: tc.expected_output,
            output: null,
            passed: false,
            is_hidden: tc.is_hidden,
            error: `Compilation error:\n${compile_output}`
          });
          continue;
        }
        
        if (stderr) {
          out.push({
            testcase_number: tc.testcase_number,
            input: tc.input,
            expected_output: tc.expected_output,
            output: null,
            passed: false,
            is_hidden: tc.is_hidden,
            error: `Runtime error:\n${stderr}`
          });
          continue;
        }
        
        const actual = stdout.trim();
        const expected = (tc.expected_output || '').trim();
        const passed = actual === expected;
        
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input,
          expected_output: tc.expected_output,
          output: actual || '',
          passed: passed,
          is_hidden: tc.is_hidden,
          error: null
        });
        
      } catch (error) {
        out.push({
          testcase_number: tc.testcase_number,
          input: tc.input,
          expected_output: tc.expected_output,
          output: null,
          passed: false,
          is_hidden: tc.is_hidden,
          error: error.response?.data?.error || error.message || 'Unknown error occurred'
        });
      }
    }
    
    return out;
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
    if (q.language === 'java') {
      return runJavaTests(q, code)
    }
    return null
  }

  const runtimeReadyFor = (q) => {
    if (q.language === 'python') return pyodideReady
    if (q.language === 'sql') return sqlReady
    return true
  }

  const runTests = async () => {
    const q = questions[currentIndex]
    if (!q) {
      console.error('No question found at index:', currentIndex);
      return;
    }
    
    if (!runtimeReadyFor(q)) {
      alert('Runtime is still loading. Please wait a moment.')
      return
    }
    
    setRunningTests(true)
    setJavaError(null)
    
    try {
      if (q.language === 'java') setJavaRunning(true)
      
      const out = await runTestsForQuestion(q, codes[q._id] || '')
      
      if (out) {
        setTestResults(prev => ({ ...prev, [q._id]: out }))
        console.log('✅ Test results saved:', out);
      } else {
        console.error('❌ No test results returned');
        setJavaError('Failed to run tests. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error running tests:', error);
      setJavaError(error.message || 'Failed to run tests');
    } finally {
      setRunningTests(false)
      setJavaRunning(false)
    }
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

      if (!qResults) {
        qResults = await runTestsForQuestion(q, code)
        if (qResults) setTestResults(prev => ({ ...prev, [q._id]: qResults }))
      }

      let verdict, passed, total, score, percentage

      if (!qResults) {
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
        topic: q.topic,
        test_case_results: qResults ? qResults.map(r => ({
          testcase_number: r.testcase_number,
          passed: r.passed,
          output: r.output,
          expected_output: r.expected_output,
          error: r.error,
          is_hidden: r.is_hidden
        })) : []
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

  // ─── Editor mount handler ──────────────────────────────────────────────
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    
    editor.updateOptions({
      bracketPairColorization: { enabled: true },
      autoClosingBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent default save
    })

    editor.onDidPaste(() => {
      editor.getAction('editor.action.formatDocument')?.run()
    })
  }

  // ─── Editor language mapping ──────────────────────────────────────────
  const getEditorLanguage = (lang) => {
    const map = {
      'python': 'python',
      'sql': 'sql',
      'java': 'java',
      'javascript': 'javascript',
      'cpp': 'cpp',
      'c': 'c'
    }
    return map[lang] || 'plaintext'
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
  const runtimeReady = runtimeReadyFor(q)
  const runtimeLoading = q.language === 'python' ? pyodideLoading : q.language === 'sql' ? sqlLoading : false
  const editorLanguage = getEditorLanguage(q.language)

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
        {/* Header with question info and difficulty badges */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
            
            {/* ✅ Difficulty distribution badges */}
            <div className="d-flex gap-1">
              <span className="badge bg-success">
                Easy: {questions.filter(q => q.difficulty === 'easy').length}
              </span>
              <span className="badge bg-warning text-dark">
                Medium: {questions.filter(q => q.difficulty === 'medium').length}
              </span>
              <span className="badge bg-danger">
                Hard: {questions.filter(q => q.difficulty === 'hard').length}
              </span>
            </div>
          </div>
          
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="badge bg-primary">{q.language}</span>
            {q.difficulty && (
              <span className={`badge ${
                q.difficulty === 'easy' ? 'bg-success' : 
                q.difficulty === 'medium' ? 'bg-warning text-dark' : 
                'bg-danger'
              }`}>
                {q.difficulty}
              </span>
            )}
            <span className="badge bg-light text-dark border">{q.points || 10} pts</span>
          </div>
        </div>

        {(pyodideLoading || sqlLoading) && (
          <div className="alert alert-info d-flex align-items-center gap-2 ">
            <span className="spinner-border spinner-border-sm"></span>
            <span>Loading {pyodideLoading ? 'Python' : 'SQL'} environment… this may take a moment.</span>
          </div>
        )}
        {javaRunning && (
          <div className="alert alert-secondary d-flex align-items-center gap-2 mb-3">
            <span className="spinner-border spinner-border-sm"></span>
            <span>Running Java code on server… please wait.</span>
          </div>
        )}
        {javaError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{javaError}</span>
          </div>
        )}

        {/* ✅ MODIFIED: Stacked layout - Problem panel on top, Code editor below */}
        <div className="row g-3">
          {/* Problem panel - TOP */}
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="mb-0">{q.title || `Question ${currentIndex + 1}`}</h5>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      // Regenerate questions
                      if (confirm('Generate new set of questions?')) {
                        setSubmitted(false)
                        setResults(null)
                        setCurrentIndex(0)
                        setTestResults({})
                        fetchQuestions()
                      }
                    }}
                    title="Get a new set of random questions"
                  >
                    🔄 New Set
                  </button>
                </div>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '1.05rem', 
                  lineHeight: 1.8,
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: 8,
                  border: '1px solid #e9ecef'
                }}>
                  {q.question_text}
                </div>
                
                {/* Sample test cases */}
                {Array.isArray(q.testCases || q.test_cases) && 
                  (q.testCases || q.test_cases).some(tc => !tc.is_hidden) && (
                  <>
                    <h6 className="mt-4 mb-2">📋 Sample Test Cases:</h6>
                    <div className="row g-2">
                      {(q.testCases || q.test_cases).filter(tc => !tc.is_hidden).map((tc, i) => {
                        const result = qResults.find(r => r.testcase_number === tc.testcase_number)
                        return (
                          <div key={i} className="col-md-6">
                            <div className="p-2 rounded" style={{ 
                              background: '#f8f9fa', 
                              fontFamily: 'monospace', 
                              fontSize: '0.9rem',
                              border: '1px solid #e9ecef'
                            }}>
                              {tc.input && <div><strong>Input:</strong> {tc.input}</div>}
                              <div><strong>Expected:</strong> {tc.expected_output}</div>
                              {result && (
                                <span className={`badge mt-1 ${result.passed ? 'bg-success' : 'bg-danger'}`}>
                                  {result.passed ? '✓ Passed' : `✗ Got: ${result.output ?? result.error}`}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Code editor panel - BOTTOM */}
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-0">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0"><i className="bi bi-code-slash me-2"></i>Code ({q.language})</h6>
                  
                    {q.language === 'java'
                      ? <small className="text-info"><i className="bi bi-cloud-arrow-up me-1"></i></small>
                      : runtimeReady
                        ? <small className="text-success"><i className="bi bi-check-circle me-1"></i>Ready</small>
                        : <small className="text-warning"><span className="spinner-border spinner-border-sm me-1"></span>Loading…</small>
                    }
                  
                </div>
                
                {/* ✅ Monaco Editor with grey background */}
                <div style={{ 
                  border: '1px solid #444', 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  height: '550px', // Slightly taller for better visibility
                  background: '#9e9393' // Dark background for editor
                }}>
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    value={code}
                    onChange={(value) => setCodes(prev => ({ ...prev, [q._id]: value || '' }))}
                    onMount={handleEditorMount}
                    // theme="github-light"  // vs-dark, hc-black, vs
                    options={{
                      // ✅ VS Code-like features
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      lineNumbersMinChars: 3,
                      bracketPairColorization: { enabled: true },
                      autoClosingBrackets: 'always',
                      autoIndent: 'full',
                      formatOnPaste: true,
                      formatOnType: true,
                      tabSize: 4,
                      insertSpaces: true,
                      detectIndentation: true,
                      automaticLayout: true,
                      renderWhitespace: 'selection',
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                      cursorSmoothCaretAnimation: true,
                      // ✅ INCREASED FONT SIZE
                      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
                      fontSize: 18, // Increased from 13 to 16
                      fontWeight: '400',
                      fontLigatures: true,
                      suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showFunctions: true,
                        showConstructors: true,
                      },
                      matchBrackets: 'always',
                      renderIndentGuides: true,
                      highlightActiveIndentGuide: true,
                      colorDecorators: true,
                      folding: true,
                      foldingStrategy: 'auto',
                      showFoldingControls: 'always',
                      wordWrap: 'on',
                      wrappingStrategy: 'advanced',
                    }}
                  />
                </div>

                <div className="d-flex justify-content-between ">
                  <div className="d-flex">
                    <button className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCodes(prev => ({ ...prev, [q._id]: q.starter_code || defaultStarter(q) }))}>
                      🔄 Reset Code
                    </button>
                    <button className="btn btn-sm btn-outline-info"
                      onClick={() => {
                        if (editorRef.current) {
                          editorRef.current.getAction('editor.action.formatDocument')?.run()
                        }
                      }}>
                      📐 Format
                    </button>
                  </div>
                  <button className="btn btn-sm" style={{ background: '#17a2b8', color: 'white' }}
                    onClick={runTests} disabled={runningTests || !runtimeReady}>
                    {runningTests ? <><span className="spinner-border spinner-border-sm me-1"></span>Running…</> : <>🧪 Run Tests</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <h6 className="mb-3"><i className="bi bi-list-check me-2"></i>Test Results</h6>
                {qResults.length === 0 && !runningTests && (
                  <p className="text-muted small">Run tests to see results here.</p>
                )}
                {runningTests && (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    <span className="small">Running tests...</span>
                  </div>
                )}
                {qResults.length > 0 && !runningTests && (
                  <div className="small">
                    <div className="mb-3 p-2 rounded bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          <strong>Summary:</strong> 
                          <span className="text-success ms-2">✓ {qResults.filter(r => r.passed).length} passed</span>
                          <span className="text-danger ms-2">✗ {qResults.filter(r => !r.passed).length} failed</span>
                        </span>
                        <span className="badge bg-secondary">
                          {Math.round((qResults.filter(r => r.passed).length / qResults.length) * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {qResults.map((result, idx) => (
                      <div key={idx} className={`p-2 mb-2 rounded ${result.passed ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
                        <div className="d-flex justify-content-between">
                          <span>
                            <span className={`badge ${result.passed ? 'bg-success' : 'bg-danger'} me-2`}>
                              {result.passed ? '✓' : '✗'}
                            </span>
                            Test Case #{result.testcase_number || idx + 1}
                            {result.is_hidden && <span className="badge bg-secondary ms-1">Hidden</span>}
                          </span>
                          <span className={`fw-bold ${result.passed ? 'text-success' : 'text-danger'}`}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        {!result.passed && (
                          <div className="mt-1">
                            {result.error && (
                              <div className="text-danger small" style={{ whiteSpace: 'pre-wrap' }}>
                                <strong>Error:</strong> {result.error}
                              </div>
                            )}
                            {result.output !== undefined && result.output !== null && (
                              <div className="text-muted small">
                                <strong>Got:</strong> <code className="bg-light px-1">{result.output || '(empty)'}</code>
                              </div>
                            )}
                            {result.expected_output !== undefined && (
                              <div className="text-muted small">
                                <strong>Expected:</strong> <code className="bg-light px-1">{result.expected_output || '(empty)'}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ Navigation at the bottom */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <button className="btn btn-outline-secondary" 
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} 
                disabled={currentIndex === 0}>
                <i className="bi bi-arrow-left me-1" />Prev
              </button>
              
              <div className="d-flex gap-1 flex-wrap justify-content-center">
                {questions.map((qq, i) => {
                  const r = testResults[qq._id]
                  const done = !!r
                  const allPass = done && r.every(x => x.passed)
                  const isCurrent = i === currentIndex
                  let btnClass = 'btn-outline-secondary'
                  if (isCurrent) btnClass = 'btn-primary'
                  else if (done && allPass) btnClass = 'btn-success'
                  else if (done) btnClass = 'btn-warning'
                  
                  return (
                    <button key={i} onClick={() => setCurrentIndex(i)}
                      className={`btn btn-sm rounded-circle p-0 ${btnClass}`}
                      style={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: isCurrent ? 'bold' : 'normal' }}>
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
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Submitting…</> : <><i className="bi bi-check-lg me-1" />Submit All</>}
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
