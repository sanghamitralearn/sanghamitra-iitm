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
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch {
      return false
    }
  }
  return false
}

function safeParseJSON(str, fallback) {
  if (str === undefined || str === null || str === '') return fallback
  try { return JSON.parse(str) } catch { return str }
}

function formatValue(value) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

// ─── Pyodide Runner with Console Support ──────────────────────────────────
class PyodideRunner {
  constructor() {
    this.pyodide = null
    this.ready = false
    this.loading = false
    this.initPromise = null
    this.consoleOutput = []
  }

  async init() {
    if (this.ready && this.pyodide) return
    if (this.initPromise) return this.initPromise

    this.loading = true
    this.initPromise = this._loadPyodide()
    await this.initPromise
    this.loading = false
    return this.initPromise
  }

  async _loadPyodide() {
    try {
      if (window.pyodide) {
        this.pyodide = window.pyodide
        this.ready = true
        this._setupConsole()
        console.log('✅ Pyodide already loaded globally')
        return
      }

      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      console.log('🔄 Loading Pyodide...')
      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      
      window.pyodide = this.pyodide
      this.ready = true
      this._setupConsole()
      console.log('✅ Pyodide loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load Pyodide:', error)
      this.ready = false
      throw error
    }
  }

  _setupConsole() {
    if (!this.pyodide) return
    
    // Override print to capture output
    this.pyodide.runPython(`
import sys
from io import StringIO

class CaptureIO:
    def __init__(self):
        self.buffer = StringIO()
    
    def write(self, text):
        self.buffer.write(text)
    
    def getvalue(self):
        return self.buffer.getvalue()
    
    def clear(self):
        self.buffer = StringIO()

_capture_stdout = CaptureIO()
_capture_stderr = CaptureIO()

# Store original stdout/stderr
_original_stdout = sys.stdout
_original_stderr = sys.stderr

def start_capture():
    sys.stdout = _capture_stdout
    sys.stderr = _capture_stderr

def stop_capture():
    sys.stdout = _original_stdout
    sys.stderr = _original_stderr

def get_captured_output():
    return {
        'stdout': _capture_stdout.getvalue(),
        'stderr': _capture_stderr.getvalue()
    }

def clear_captured_output():
    _capture_stdout.clear()
    _capture_stderr.clear()

# Start capturing by default
start_capture()
`)
  }

  async clearGlobals() {
    if (!this.ready || !this.pyodide) return
    try {
      await this.pyodide.runPythonAsync(`
import sys
_keep = {'__builtins__','__name__','__doc__','__package__','__loader__','__spec__','__build_class__','__import__',
         'sys', 'CaptureIO', '_capture_stdout', '_capture_stderr', '_original_stdout', '_original_stderr',
         'start_capture', 'stop_capture', 'get_captured_output', 'clear_captured_output'}
for _k in list(globals().keys()):
    if _k not in _keep:
        try: del globals()[_k]
        except: pass
`)
      await this.pyodide.runPythonAsync(`clear_captured_output()`)
    } catch (e) {
      console.warn('Error clearing globals:', e)
    }
  }

  async runCode(code) {
    if (!this.ready || !this.pyodide) {
      throw new Error('Pyodide not ready')
    }

    try {
      await this.clearGlobals()
      
      await this.pyodide.runPythonAsync(code)
      
      const output = await this.pyodide.runPythonAsync(`
import json
output = get_captured_output()
json.dumps(output)
`)
      const parsed = JSON.parse(output)
      
      return {
        stdout: parsed.stdout || '',
        stderr: parsed.stderr || '',
        error: null
      }
    } catch (error) {
      return {
        stdout: '',
        stderr: '',
        error: error.message
      }
    }
  }

  async runPythonFunction(code, functionName, args) {
    if (!this.ready || !this.pyodide) {
      throw new Error('Pyodide not ready')
    }

    try {
      await this.clearGlobals()
      await this.pyodide.runPythonAsync(code)

      const argList = Array.isArray(args) ? args : [args]
      const callArgs = argList.map(v => {
        if (typeof v === 'string') return `"${v.replace(/"/g, '\\"')}"`
        if (typeof v === 'object') return JSON.stringify(v)
        return String(v)
      }).join(', ')
      
      const call = `${functionName}(${callArgs})`
      console.log('🔧 Executing:', call)

      const result = await this.pyodide.runPythonAsync(call)
      
      if (result && typeof result === 'object' && result.toJs) {
        return result.toJs({ dict_converter: Object.fromEntries })
      }
      
      return result
    } catch (error) {
      console.error('❌ Python execution error:', error)
      throw error
    }
  }

  async runTests(code, question) {
    const results = []
    const testCases = question.testCases || question.test_cases || []
    
    if (testCases.length === 0) {
      try {
        const result = await this.runPythonFunction(code, question.expected_function_name || 'solution', [])
        const expected = safeParseJSON(question.expected_output, question.expected_output)
        const passed = deepEqual(result, expected)
        
        results.push({
          testcase_number: 1,
          input: '',
          expected_output: question.expected_output || '',
          output: formatValue(result),
          passed: passed,
          is_hidden: false,
          error: null
        })
      } catch (e) {
        results.push({
          testcase_number: 1,
          input: '',
          expected_output: question.expected_output || '',
          output: null,
          passed: false,
          is_hidden: false,
          error: e.message
        })
      }
      return results
    }

    for (const tc of testCases) {
      try {
        const input = safeParseJSON(tc.input, tc.input)
        const expected = safeParseJSON(tc.expected_output, tc.expected_output)
        
        const output = await this.runPythonFunction(
          code,
          question.expected_function_name || 'solution',
          input
        )
        
        const passed = deepEqual(output, expected)
        
        results.push({
          testcase_number: tc.testcase_number || results.length + 1,
          input: tc.input,
          expected_output: tc.expected_output,
          output: formatValue(output),
          passed: passed,
          is_hidden: tc.is_hidden || false,
          error: null
        })
      } catch (error) {
        results.push({
          testcase_number: tc.testcase_number || results.length + 1,
          input: tc.input,
          expected_output: tc.expected_output,
          output: null,
          passed: false,
          is_hidden: tc.is_hidden || false,
          error: error.message
        })
      }
    }
    
    return results
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────
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

  const [consoleOutput, setConsoleOutput] = useState([])
  const [isRunningCode, setIsRunningCode] = useState(false)
  const consoleEndRef = useRef(null)

  const pyodideRunnerRef = useRef(null)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)

  const editorRef = useRef(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [consoleOutput])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/coding-questions?course=${course}&week=${weekNum}&limitPerDifficulty=2`,
        { withCredentials: true }
      )
      const qs = res.data.questions || []
      
      console.log('Questions fetched:', qs.length)
      
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

      const hasPython = formattedQs.some(q => q.language === 'python')
      if (hasPython) {
        await initPyodide()
      }

    } catch (err) {
      setError('Failed to load coding questions. Please try again.')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const defaultStarter = (q) => {
    if (q.language === 'python') {
      const funcName = q.expected_function_name || 'solution'
      return `def ${funcName}():\n    # Write your solution here\n    pass\n`
    }
    if (q.language === 'sql') return '-- write your SQL query here\n'
    if (q.language === 'java') return `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your code here\n    }\n}\n`
    return ''
  }

  const initPyodide = async () => {
    if (pyodideRunnerRef.current) {
      setPyodideReady(true)
      return
    }

    setPyodideLoading(true)
    try {
      const runner = new PyodideRunner()
      await runner.init()
      pyodideRunnerRef.current = runner
      setPyodideReady(true)
      console.log('✅ Pyodide runner ready')
      
      addConsoleOutput('info', '🐍 Python environment ready!')
      addConsoleOutput('info', '💡 You can run any Python code using the "Run Code" button')
    } catch (error) {
      console.error('❌ Failed to initialize Pyodide:', error)
      setError('Failed to load Python environment. Please refresh the page.')
    } finally {
      setPyodideLoading(false)
    }
  }

  const addConsoleOutput = (type, message) => {
    setConsoleOutput(prev => [...prev, { type, message, timestamp: Date.now() }])
  }

  const clearConsole = () => {
    setConsoleOutput([])
  }

  const runCode = async () => {
    const q = questions[currentIndex]
    if (!q) return

    if (q.language !== 'python') {
      addConsoleOutput('warning', `⚠️ Run Code is only available for Python. This question is ${q.language}.`)
      return
    }

    if (!pyodideReady || !pyodideRunnerRef.current) {
      addConsoleOutput('error', '⏳ Python environment is loading... Please wait.')
      await initPyodide()
      if (!pyodideReady) {
        addConsoleOutput('error', '❌ Failed to load Python environment. Please refresh.')
        return
      }
    }

    setIsRunningCode(true)
    const code = codes[q._id] || ''
    
    addConsoleOutput('info', '─'.repeat(60))
    addConsoleOutput('info', `▶️ Running code...`)

    try {
      const result = await pyodideRunnerRef.current.runCode(code)
      
      if (result.error) {
        addConsoleOutput('error', `❌ Error:\n${result.error}`)
      } else {
        if (result.stdout) {
          addConsoleOutput('output', result.stdout)
        }
        if (result.stderr) {
          addConsoleOutput('error', result.stderr)
        }
        if (!result.stdout && !result.stderr && !result.error) {
          addConsoleOutput('info', '✅ Code executed successfully (no output)')
        }
      }
    } catch (error) {
      addConsoleOutput('error', `❌ Execution error:\n${error.message}`)
    } finally {
      setIsRunningCode(false)
      addConsoleOutput('info', `⏱️ Execution finished`)
    }
  }

  const runTestsForQuestion = async (q, code) => {
    if (q.language === 'python') {
      if (!pyodideReady || !pyodideRunnerRef.current) {
        await initPyodide()
        if (!pyodideReady || !pyodideRunnerRef.current) {
          throw new Error('Python environment not ready. Please wait.')
        }
      }
      
      console.log('🔧 Running Python tests for:', q.title)
      return await pyodideRunnerRef.current.runTests(code, q)
    }
    
    if (q.language === 'java') {
      return await runJavaTests(q, code)
    }
    
    return null
  }

  const runJavaTests = async (q, code) => {
    const results = []
    const testCases = q.testCases || q.test_cases || []
    
    const cases = testCases.length > 0 ? testCases : [{
      testcase_number: 1,
      input: '',
      expected_output: q.expected_output || 'Test passed',
      is_hidden: false
    }]

    for (const tc of cases) {
      try {
        const response = await axios.post(
          `${API}/api/run-code`,
          {
            language: 'java',
            source: code,
            stdin: tc.input || ''
          },
          {
            withCredentials: true,
            timeout: 30000
          }
        )

        const stdout = response.data.stdout || ''
        const stderr = response.data.stderr || ''
        const compileOutput = response.data.compile_output || ''

        if (compileOutput) {
          results.push({
            testcase_number: tc.testcase_number || results.length + 1,
            input: tc.input,
            expected_output: tc.expected_output,
            output: null,
            passed: false,
            is_hidden: tc.is_hidden || false,
            error: `Compilation error:\n${compileOutput}`
          })
          continue
        }

        if (stderr) {
          results.push({
            testcase_number: tc.testcase_number || results.length + 1,
            input: tc.input,
            expected_output: tc.expected_output,
            output: null,
            passed: false,
            is_hidden: tc.is_hidden || false,
            error: `Runtime error:\n${stderr}`
          })
          continue
        }

        const actual = stdout.trim()
        const expected = (tc.expected_output || '').trim()
        const passed = actual === expected

        results.push({
          testcase_number: tc.testcase_number || results.length + 1,
          input: tc.input,
          expected_output: tc.expected_output,
          output: actual || '',
          passed: passed,
          is_hidden: tc.is_hidden || false,
          error: null
        })

      } catch (error) {
        results.push({
          testcase_number: tc.testcase_number || results.length + 1,
          input: tc.input,
          expected_output: tc.expected_output,
          output: null,
          passed: false,
          is_hidden: tc.is_hidden || false,
          error: error.response?.data?.error || error.message || 'Unknown error'
        })
      }
    }

    return results
  }

  const runTests = async () => {
    const q = questions[currentIndex]
    if (!q) return

    setRunningTests(true)
    
    addConsoleOutput('info', '─'.repeat(60))
    addConsoleOutput('info', `🧪 Running tests for: ${q.title}`)
    
    try {
      const results = await runTestsForQuestion(q, codes[q._id] || '')
      
      if (results) {
        setTestResults(prev => ({ ...prev, [q._id]: results }))
        
        const passed = results.filter(r => r.passed).length
        const total = results.length
        addConsoleOutput('info', `📊 Results: ${passed}/${total} passed`)
        
        results.forEach((r, i) => {
          if (r.passed) {
            addConsoleOutput('success', `  ✅ Test ${i+1}: PASSED`)
          } else {
            addConsoleOutput('error', `  ❌ Test ${i+1}: FAILED`)
            if (r.error) {
              addConsoleOutput('error', `     Error: ${r.error}`)
            } else {
              addConsoleOutput('error', `     Expected: ${r.expected_output}`)
              addConsoleOutput('error', `     Got: ${r.output || '(no output)'}`)
            }
          }
        })
        
        console.log('✅ Test results:', results)
      } else {
        addConsoleOutput('error', '❌ No test results returned')
      }
    } catch (error) {
      console.error('❌ Error running tests:', error)
      addConsoleOutput('error', `❌ ${error.message || 'Failed to run tests'}`)
    } finally {
      setRunningTests(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.email) {
      navigate('/login', { replace: true })
      return
    }

    setSaving(true)
    const gradedResults = []
    const submitPayload = []

    for (const q of questions) {
      const code = codes[q._id] || ''
      let qResults = testResults[q._id]

      if (!qResults) {
        try {
          qResults = await runTestsForQuestion(q, code)
          if (qResults) {
            setTestResults(prev => ({ ...prev, [q._id]: qResults }))
          }
        } catch (error) {
          console.error('Error running tests for submission:', error)
          qResults = [{
            testcase_number: 0,
            input: '',
            expected_output: '',
            output: null,
            passed: false,
            is_hidden: false,
            error: error.message || 'Test execution failed'
          }]
        }
      }

      let verdict, passed, total, score, percentage

      if (!qResults || qResults.length === 0) {
        verdict = 'Pending Review'
        passed = 0
        total = (q.testCases || q.test_cases || []).length || 1
        score = 0
        percentage = 0
      } else {
        passed = qResults.filter(r => r.passed).length
        total = qResults.length
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
        verdict,
        passed,
        total,
        score,
        percentage
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
        email: user.email,
        username: user.username || user.name || user.email,
        course,
        week: weekNum,
        topic: questions[0]?.topic || `Week ${weekNum}`,
        results: submitPayload
      }, { withCredentials: true })

      setResults({
        stats: {
          totalScore,
          maxScore,
          percentage: overallPercentage,
          totalQuestions: gradedResults.length,
          solvedQuestions
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
    setSubmitted(false)
    setResults(null)
    setCurrentIndex(0)
    setTestResults({})
    setConsoleOutput([])
    fetchQuestions()
  }

  // ✅ FIXED: Editor mount handler with correct keyboard shortcut
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

    // ✅ CORRECT: Use monaco.KeyMod and monaco.KeyCode
    // Ctrl+Enter to run code (only for Python)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (questions[currentIndex]?.language === 'python') {
          runCode()
        }
      }
    )

    editor.onDidPaste(() => {
      editor.getAction('editor.action.formatDocument')?.run()
    })
  }

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

  // ─── Render ──────────────────────────────────────────────────────────────
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
  if (!q) return <div>No question found</div>

  const code = codes[q._id] || ''
  const qResults = testResults[q._id] || []
  const editorLanguage = getEditorLanguage(q.language)

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>{displayName}</h1>
                <p className="mb-0">{course?.toUpperCase()} — Week {weekNum} Coding Practice</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/programming/courses">Programming</Link></li>
              <li><Link to={`/programming/courses/${course}`}>Course</Link></li>
              <li className="current">Coding Quiz</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5" style={{ maxWidth: 1200 }}>
        {(pyodideLoading) && (
          <div className="alert alert-info d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm"></span>
            <span>Loading Python environment… this may take a moment.</span>
          </div>
        )}
        
        {!pyodideReady && !pyodideLoading && q.language === 'python' && (
          <div className="alert alert-warning d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle"></i>
            <span>Python environment not ready. Click "Run Code" to initialize.</span>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
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

        <div className="row g-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="mb-0">{q.title || `Question ${currentIndex + 1}`}</h5>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      if (confirm('Generate new set of questions?')) {
                        setSubmitted(false)
                        setResults(null)
                        setCurrentIndex(0)
                        setTestResults({})
                        setConsoleOutput([])
                        fetchQuestions()
                      }
                    }}
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
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-0">
                <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                  <h6 className="mb-0"><i className="bi bi-code-slash me-2"></i>Code ({q.language})</h6>
                  <div className="d-flex gap-2">
                    {q.language === 'python' && (
                      pyodideReady
                        ? <span className="badge bg-success">✓ Python Ready</span>
                        : <span className="badge bg-warning text-dark">⏳ Loading Python...</span>
                    )}
                    <span className="text-muted small">Ctrl+Enter to run</span>
                  </div>
                </div>
                
                <div style={{
                  border: '1px solid #444',
                  borderRadius: 2,
                  overflow: 'hidden',
                  height: '400px',
                  background: '#1e1e1e'
                }}>
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    value={code}
                    onChange={(value) => setCodes(prev => ({ ...prev, [q._id]: value || '' }))}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      lineNumbers: 'on',
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
                      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
                      fontSize: 16,
                      fontWeight: '400',
                      fontLigatures: true,
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

                <div className="d-flex justify-content-between align-items-center p-2 border-top">
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCodes(prev => ({ ...prev, [q._id]: q.starter_code || defaultStarter(q) }))}>
                      🔄 Reset
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
                  <div className="d-flex gap-2">
                    {q.language === 'python' && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={runCode}
                        disabled={isRunningCode || !pyodideReady}
                      >
                        {isRunningCode ? (
                          <><span className="spinner-border spinner-border-sm me-1"></span>Running…</>
                        ) : (
                          '▶️ Run Code'
                        )}
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={runTests}
                      disabled={runningTests}
                    >
                      {runningTests ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>Testing…</>
                      ) : (
                        '🧪 Run Tests'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Console Output */}
            <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: 12 }}>
              <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-1">
                <h6 className="mb-0"><i className="bi bi-terminal me-2"></i>Console</h6>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-light"
                    onClick={clearConsole}
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
              <div className="card-body p-2" style={{ 
                background: '#1e1e1e', 
                maxHeight: '250px', 
                overflowY: 'auto',
                fontFamily: 'Consolas, monospace',
                fontSize: '13px'
              }}>
                {consoleOutput.length === 0 ? (
                  <div className="text-muted" style={{ fontStyle: 'italic' }}>
                    {q.language === 'python' ? 
                      '▶️ Run your Python code or tests to see output here' : 
                      `▶️ Output will appear here (${q.language} execution)`}
                  </div>
                ) : (
                  consoleOutput.map((item, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        color: item.type === 'error' ? '#f48771' :
                               item.type === 'success' ? '#6a9955' :
                               item.type === 'warning' ? '#dcdcaa' :
                               item.type === 'output' ? '#d4d4d4' :
                               '#569cd6',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        padding: '1px 0',
                        borderBottom: item.type === 'info' && item.message.includes('─') ? 
                          '1px solid #333' : 'none',
                        marginBottom: item.type === 'info' && item.message.includes('─') ? 
                          '4px' : '0'
                      }}
                    >
                      {item.message}
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>

            {/* Test Results 
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
                      <div key={idx} className={`p-3 mb-2 rounded ${result.passed ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'}`} 
                           style={{ borderLeft: `4px solid ${result.passed ? '#28a745' : '#dc3545'}` }}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <span className={`badge ${result.passed ? 'bg-success' : 'bg-danger'} me-2`}>
                              {result.passed ? '✅ PASSED' : '❌ FAILED'}
                            </span>
                            <span className="fw-semibold">Test Case #{result.testcase_number || idx + 1}</span>
                            {result.is_hidden && <span className="badge bg-secondary ms-1">Hidden</span>}
                          </div>
                        </div>
                        
                        {!result.passed && (
                          <div className="mt-2">
                            {result.error ? (
                              <div className="text-danger small" style={{ whiteSpace: 'pre-wrap' }}>
                                <strong>⚠️ Error:</strong> {result.error}
                              </div>
                            ) : (
                              <div className="row g-2">
                                <div className="col-md-6">
                                  <div className="p-2 bg-light rounded border">
                                    <div className="text-muted small">📤 Expected Output:</div>
                                    <code className="fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
                                      {result.expected_output || '(empty)'}
                                    </code>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="p-2 bg-light rounded border">
                                    <div className="text-muted small">📥 Got Output:</div>
                                    <code className="fw-medium" style={{ whiteSpace: 'pre-wrap', color: '#dc3545' }}>
                                      {result.output !== null ? result.output : '(no output)'}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {result.passed && result.input && (
                          <div className="mt-1">
                            <span className="text-muted small">Input: </span>
                            <code className="text-muted">{result.input}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div> */}

            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <button className="btn btn-outline-secondary"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}>
                <i className="bi bi-arrow-left me-1" />Prev
              </button>
              
              <div className="d-flex gap-1 flex-wrap justify-content-center">
                {questions.map((qq, i) => {
                  const r = testResults[qq._id]
                  const done = !!r && r.length > 0
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
