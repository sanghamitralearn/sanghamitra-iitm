import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  loadKaTeX, SUBJECT_STYLE, calcMarks,
  QuestionReviewItem, TabWarningBanner, QuizPanel,
} from './SATQuiz'
import SATScoreDashboard, { buildChapterItems } from './SATScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official Digital SAT structure: RW Module 1 & 2, then Math Module 1 & 2
// (students may now attempt these in any order)
const STAGES = [
  { key: 'rw1',   subject: 'Reading and Writing', scoreSubject: 'Reading & Writing', label: 'Reading & Writing', module: 1, questionCount: 27, timeMin: 32 },
  { key: 'rw2',   subject: 'Reading and Writing', scoreSubject: 'Reading & Writing', label: 'Reading & Writing', module: 2, questionCount: 27, timeMin: 32 },
  { key: 'math1', subject: 'Mathematics',         scoreSubject: 'Mathematics',       label: 'Mathematics',       module: 1, questionCount: 22, timeMin: 35 },
  { key: 'math2', subject: 'Mathematics',         scoreSubject: 'Mathematics',       label: 'Mathematics',       module: 2, questionCount: 22, timeMin: 35 },
]

const TOTAL_QUESTIONS = STAGES.reduce((s, st) => s + st.questionCount, 0)
const TOTAL_MINUTES = STAGES.reduce((s, st) => s + st.timeMin, 0)

const FULL_TEST_STYLE = { gradient: 'linear-gradient(135deg, #198754, #0d6efd)', badge: '#0d6efd' }

const EMPTY_ANSWERS = { rw1: {}, rw2: {}, math1: {}, math2: {} }
const EMPTY_TIMES = () => ({ rw1: {}, rw2: {}, math1: {}, math2: {} })
const EMPTY_INDEXES = { rw1: 0, rw2: 0, math1: 0, math2: 0 }

function isAnswered(a) {
  return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Sum a list of per-stage result objects into one combined result
function mergeResults(results) {
  return {
    totalQuestions: results.reduce((s, r) => s + r.responses.length, 0),
    correctAnswers: results.reduce((s, r) => s + r.correctAnswers, 0),
    wrongAnswers:   results.reduce((s, r) => s + r.wrongAnswers, 0),
    unattempted:    results.reduce((s, r) => s + r.unattempted, 0),
    score:          results.reduce((s, r) => s + r.score, 0),
    maxScore:       results.reduce((s, r) => s + r.maxScore, 0),
    totalTime:      results.reduce((s, r) => s + (r.totalTime || 0), 0),
    responses:      results.flatMap(r => r.responses),
  }
}

const SATFullTest = () => {
  const navigate   = useNavigate()
  const location   = useLocation()
  const paperName  = location.state?.paper ?? null
  const paperYear  = location.state?.year  ?? null

  // phase: loading | error | overview | quiz | review
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const [stageIndex, setStageIndex] = useState(0)
  const [stageQuestions, setStageQuestions] = useState(null)
  const [stageAnswers, setStageAnswers] = useState(EMPTY_ANSWERS)
  const [currentIndexByStage, setCurrentIndexByStage] = useState(EMPTY_INDEXES)
  const [stageResults, setStageResults] = useState({})
  const [combinedResults, setCombinedResults] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef = useRef(EMPTY_TIMES())
  const userRef = useRef(null)

  useEffect(() => { loadKaTeX() }, [])
  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (phase !== 'quiz') return
    const onBlur  = () => setTabWarning(true)
    const onFocus = () => setTabWarning(false)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [phase])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        userRef.current = res.data
        fetchAllQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchAllQuestions = async () => {
    setPhase('loading')
    setError(null)
    try {
      const paperParam = paperName ? `&paper=${encodeURIComponent(paperName)}` : ''
      const [rwRes, mathRes] = await Promise.all([
        axios.get(`${API_URL}/api/sat_questions?subject=${encodeURIComponent('Reading and Writing')}${paperParam}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/sat_questions?subject=${encodeURIComponent('Mathematics')}${paperParam}`, { withCredentials: true }),
      ])
      const rw = shuffle(Array.isArray(rwRes.data) ? rwRes.data : [])
      const math = shuffle(Array.isArray(mathRes.data) ? mathRes.data : [])

      if (!rw.length || !math.length) {
        try {
          const dbg = await axios.get(`${API_URL}/api/sat_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError('Not enough questions found in the database to build the full test.')
        setPhase('error')
        return
      }

      const rwHalf = Math.ceil(rw.length / 2)
      const mathHalf = Math.ceil(math.length / 2)

      setStageQuestions({
        rw1:   rw.slice(0, rwHalf).slice(0, STAGES[0].questionCount),
        rw2:   rw.slice(rwHalf).slice(0, STAGES[1].questionCount),
        math1: math.slice(0, mathHalf).slice(0, STAGES[2].questionCount),
        math2: math.slice(mathHalf).slice(0, STAGES[3].questionCount),
      })
      setPhase('overview')
    } catch {
      setError('Failed to load questions. Please try again.')
      setPhase('error')
    }
  }

  const stage = STAGES[stageIndex]
  const questions = stageQuestions ? stageQuestions[stage.key] : []
  const answers = stageAnswers[stage.key]
  const currentIndex = currentIndexByStage[stage.key]

  const setAnswer = (idx, val) => setStageAnswers(prev => ({
    ...prev, [stage.key]: { ...prev[stage.key], [idx]: val },
  }))

  const toggleMSQ = (idx, optId) => setStageAnswers(prev => {
    const cur = Array.isArray(prev[stage.key][idx]) ? prev[stage.key][idx] : []
    return {
      ...prev,
      [stage.key]: {
        ...prev[stage.key],
        [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId],
      },
    }
  })

  // Only meaningful while actively viewing a question in the quiz phase
  const recordTime = () => {
    if (phase !== 'quiz') return
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[stage.key][currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => {
    recordTime()
    setCurrentIndexByStage(prev => ({ ...prev, [stage.key]: idx }))
    questionStartRef.current = Date.now()
  }

  // Jump to any module, from the overview or from another module — preserves
  // each module's progress and last-viewed question.
  const selectStage = (idx) => {
    recordTime()
    setStageIndex(idx)
    questionStartRef.current = Date.now()
    setPhase('quiz')
  }

  const backToOverview = () => {
    recordTime()
    setPhase('overview')
  }

  const computeStageResult = (stageKey) => {
    const qs = stageQuestions[stageKey]
    const ans = stageAnswers[stageKey]
    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
    const maxScore = qs.reduce((s, q) => s + (q.points || 1), 0)
    const responses = []

    qs.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted } = calcMarks(q, ans[i])
      if (unattempted) unattemptedCount++
      else if (isCorrect) correctCount++
      else wrongCount++
      totalScore += marksAwarded

      responses.push({
        questionId: q._id,
        userResponse: ans[i] ?? null,
        isCorrect,
        marksAwarded,
        unattempted: !!unattempted,
        timeSpent: timesRef.current[stageKey]?.[i] || 0,
      })
    })

    const totalTime = Object.values(timesRef.current[stageKey]).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    return {
      correctAnswers: correctCount, wrongAnswers: wrongCount, unattempted: unattemptedCount,
      score: totalScore, maxScore, percentage, totalTime, responses,
    }
  }

  const finishTest = async () => {
    const totalUnanswered = STAGES.reduce((sum, s) => {
      const qs = stageQuestions[s.key]
      const ans = stageAnswers[s.key]
      return sum + qs.filter((_, i) => !isAnswered(ans[i])).length
    }, 0)
    if (totalUnanswered > 0 && !window.confirm(
      `${totalUnanswered} question(s) across all modules are unanswered. Finish the test anyway?`
    )) return

    recordTime()

    const allResults = {}
    STAGES.forEach(s => { allResults[s.key] = computeStageResult(s.key) })
    setStageResults(allResults)
    await finalizeTest(allResults)
  }

  const finalizeTest = async (allResults) => {
    const combined = mergeResults(STAGES.map(s => allResults[s.key]))
    combined.percentage = combined.maxScore > 0 ? Math.round(Math.max(0, combined.score / combined.maxScore) * 100) : 0

    const rwResult   = mergeResults([allResults.rw1, allResults.rw2])
    const mathResult = mergeResults([allResults.math1, allResults.math2])

    // Tag each response with its section so the analysis page can filter
    const taggedResponses = STAGES.flatMap(s =>
      (allResults[s.key]?.responses || []).map(r => ({ ...r, subject: s.scoreSubject }))
    )
    const allQuestions = STAGES.flatMap(s =>
      (stageQuestions[s.key] || []).map(q => ({ ...q, subject: s.scoreSubject }))
    )

    const analysisResults = {
      testType:    'full',
      score:       combined.score,
      maxScore:    combined.maxScore,
      correctAnswers: combined.correctAnswers,
      wrongAnswers:   combined.wrongAnswers,
      unattempted:    combined.unattempted,
      totalTimeTaken: combined.totalTime || 0,
      responses:   taggedResponses,
      sectionScores: {
        'Reading & Writing': {
          score: rwResult.score, maxScore: rwResult.maxScore,
          correctAnswers: rwResult.correctAnswers, wrongAnswers: rwResult.wrongAnswers,
          unattempted: rwResult.unattempted, totalQuestions: rwResult.totalQuestions,
        },
        'Mathematics': {
          score: mathResult.score, maxScore: mathResult.maxScore,
          correctAnswers: mathResult.correctAnswers, wrongAnswers: mathResult.wrongAnswers,
          unattempted: mathResult.unattempted, totalQuestions: mathResult.totalQuestions,
        },
      },
      dateAttempted: new Date().toISOString(),
    }

    try {
      sessionStorage.setItem('satAnalysis', JSON.stringify({ results: analysisResults, questions: allQuestions }))
    } catch { /* ignore quota errors */ }

    setCombinedResults(combined)
    setPhase('review')

    const u = userRef.current
    if (!u?.email) {
      navigate('/courses/sat/analysis', { state: { results: analysisResults, questions: allQuestions } })
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        // Per-subject scores (existing flow)
        axios.post(`${API_URL}/api/sat_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Reading & Writing',
          totalQuestions: rwResult.totalQuestions, correctAnswers: rwResult.correctAnswers,
          wrongAnswers: rwResult.wrongAnswers, unattempted: rwResult.unattempted,
          score: rwResult.score, maxScore: rwResult.maxScore, responses: rwResult.responses,
          source: 'FullTest',
        }, { withCredentials: true }),
        axios.post(`${API_URL}/api/sat_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Mathematics',
          totalQuestions: mathResult.totalQuestions, correctAnswers: mathResult.correctAnswers,
          wrongAnswers: mathResult.wrongAnswers, unattempted: mathResult.unattempted,
          score: mathResult.score, maxScore: mathResult.maxScore, responses: mathResult.responses,
          source: 'FullTest',
        }, { withCredentials: true }),
        // Full-paper score (for the paper listing page)
        ...(paperName ? [
          axios.post(`${API_URL}/api/sat_full_scores`, {
            email: u.email, name: u.username || u.name || u.email,
            paper: paperName, year: paperYear,
            totalQuestions: combined.totalQuestions,
            correctAnswers: combined.correctAnswers,
            wrongAnswers: combined.wrongAnswers,
            unattempted: combined.unattempted,
            score: combined.score, maxScore: combined.maxScore,
            sectionScores: analysisResults.sectionScores,
            responses: analysisResults.responses,
            totalTimeTaken: combined.totalTime || 0,
          }, { withCredentials: true }),
        ] : []),
      ])
    } catch (e) {
      console.error('Failed to save full test scores:', e)
    } finally {
      setSaving(false)
      navigate('/courses/sat/analysis', { state: { results: analysisResults, questions: allQuestions } })
    }
  }

  const handleRetake = () => {
    setStageIndex(0)
    setCurrentIndexByStage(EMPTY_INDEXES)
    setStageAnswers(EMPTY_ANSWERS)
    setStageResults({})
    setCombinedResults(null)
    setExpanded(null)
    timesRef.current = EMPTY_TIMES()
    fetchAllQuestions()
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: FULL_TEST_STYLE.badge }} role="status" />
        <p className="text-muted">Loading the Full SAT Test…</p>
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────────────
  if (phase === 'error') return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-warning" />
      <h4 className="mt-3">{error}</h4>

      {debugInfo && (
        <div className="card border-0 shadow-sm mx-auto mt-4 text-start" style={{ maxWidth: 480, borderRadius: 12 }}>
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-database me-2 text-primary" />
              What's in your <code>sat_questions</code> collection
            </h6>
            <p className="mb-1 text-muted small">
              Total documents: <strong>{debugInfo.totalQuestions}</strong>
            </p>
            <p className="mb-2 text-muted small">Subject values found in DB:</p>
            {debugInfo.distinctSubjects.length > 0 ? (
              <ul className="mb-0 ps-3">
                {debugInfo.distinctSubjects.map(s => (
                  <li key={s} className="small"><code>{s}</code></li>
                ))}
              </ul>
            ) : (
              <p className="text-danger small mb-0">Collection is empty — no documents found.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 d-flex gap-2 justify-content-center">
        <button className="btn btn-primary" onClick={fetchAllQuestions}>Retry</button>
        <Link to="/courses/sat" className="btn btn-outline-secondary">Back to SAT</Link>
      </div>
    </div>
  )

  // ── Module overview / hub ────────────────────────────────────────────────
  if (phase === 'overview') {
    const totalAnswered = STAGES.reduce((sum, s) => {
      const qs = stageQuestions[s.key]
      const ans = stageAnswers[s.key]
      return sum + qs.filter((_, i) => isAnswered(ans[i])).length
    }, 0)

    return (
      <main className="main">
        <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full SAT Test</h1>
                  <p className="mb-0">
                    {TOTAL_QUESTIONS} questions across 4 modules &nbsp;·&nbsp; ~{TOTAL_MINUTES} minutes total
                  </p>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/sat">SAT</Link></li>
                <li className="current">Full Test</li>
              </ol>
            </div>
          </nav>
        </div>

        <div className="container mb-5">
          <div className="card border-0 shadow-sm mx-auto mb-4" style={{ maxWidth: 900, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ height: 6, background: FULL_TEST_STYLE.gradient }} />
            <div className="card-body p-4 text-center">
              <h3 className="mb-2">Choose any module to begin</h3>
              <p className="text-muted mb-3">
                Attempt the modules in any order you like, switch between them freely, skip and revisit
                questions, and finish whenever you're ready. Your progress is saved automatically as you go.
              </p>
              <div className="progress mx-auto" style={{ height: 8, maxWidth: 480 }}>
                <div
                  className="progress-bar"
                  style={{ width: `${(totalAnswered / TOTAL_QUESTIONS) * 100}%`, background: FULL_TEST_STYLE.gradient }}
                />
              </div>
              <p className="text-muted small mt-2 mb-0">{totalAnswered}/{TOTAL_QUESTIONS} questions answered</p>
            </div>
          </div>

          <div className="row g-3 justify-content-center">
            {STAGES.map((s, i) => {
              const qs = stageQuestions[s.key]
              const ans = stageAnswers[s.key]
              const answered = qs.filter((_, idx) => isAnswered(ans[idx])).length
              const total = qs.length
              const sStyle = SUBJECT_STYLE[s.label] || FULL_TEST_STYLE
              const status = answered === 0 ? 'Not Started' : answered === total ? 'Completed' : 'In Progress'
              const statusBg = answered === 0 ? '#f8f9fa' : answered === total ? '#d4edda' : '#fff3cd'
              const statusColor = answered === 0 ? '#6c757d' : answered === total ? '#155724' : '#856404'

              return (
                <div className="col-md-6 col-lg-5" key={s.key}>
                  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ height: 5, background: sStyle.gradient }} />
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-0">{s.label}</h5>
                          <small className="text-muted">Module {s.module}</small>
                        </div>
                        <span className="badge" style={{ background: statusBg, color: statusColor }}>{status}</span>
                      </div>
                      <p className="text-muted small mb-2">{total} questions · {s.timeMin} min</p>
                      <div className="progress mb-3" style={{ height: 6 }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${(answered / total) * 100}%`, background: sStyle.gradient }}
                        />
                      </div>
                      <p className="text-muted small mb-3">{answered}/{total} answered</p>
                      <button
                        className="btn text-white w-100"
                        style={{ background: sStyle.gradient, borderRadius: 8 }}
                        onClick={() => selectStage(i)}
                      >
                        <i className="bi bi-play-fill me-1" />
                        {answered === 0 ? 'Start Module' : answered === total ? 'Review / Edit' : 'Continue'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="d-flex gap-2 justify-content-center mt-4">
            <button
              className="btn text-white"
              style={{ background: FULL_TEST_STYLE.gradient, borderRadius: 8, padding: '0.6rem 2rem' }}
              onClick={finishTest}
              disabled={saving}
            >
              {saving
                ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                : <><i className="bi bi-flag-fill me-1" />Finish Test &amp; View Score Report</>}
            </button>
            <Link to="/courses/sat" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1" />Exit
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── Active quiz module ───────────────────────────────────────────────────
  if (phase === 'quiz') {
    const style = SUBJECT_STYLE[stage.label] || FULL_TEST_STYLE

    return (
      <main className="main">
        <TabWarningBanner show={tabWarning} onDismiss={() => setTabWarning(false)} />

        <div className="page-title" data-aos="fade" style={{ marginBottom: '1.25rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full SAT Test — {stage.label}</h1>
                  <p className="mb-0">
                    Module {stage.module} &nbsp;·&nbsp; {questions.length} questions
                    &nbsp;·&nbsp; +1 correct · 0 wrong (no penalty)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/sat">SAT</Link></li>
                <li className="current">Full Test — {stage.label} Module {stage.module}</li>
              </ol>
            </div>
          </nav>
        </div>

        {/* Module switcher — jump to any module at any time */}
        <div className="container mb-3">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {STAGES.map((s, i) => {
              const sStyle = SUBJECT_STYLE[s.label] || FULL_TEST_STYLE
              const current = i === stageIndex
              const qs = stageQuestions[s.key]
              const ans = stageAnswers[s.key]
              const answered = qs.filter((_, idx) => isAnswered(ans[idx])).length
              const done = answered === qs.length
              return (
                <button
                  key={s.key}
                  type="button"
                  className="badge border-0"
                  onClick={() => selectStage(i)}
                  style={{
                    background: current ? sStyle.gradient : done ? '#e9ecef' : '#f8f9fa',
                    color: current ? '#fff' : done ? '#495057' : '#adb5bd',
                    border: current ? 'none' : '1px solid #e8ecf0',
                    fontSize: '0.75rem', padding: '0.4rem 0.7rem', cursor: 'pointer',
                  }}
                >
                  {done && <i className="bi bi-check-lg me-1" />}
                  {i + 1}. {s.label} — M{s.module} ({answered}/{qs.length})
                </button>
              )
            })}
          </div>
        </div>

        <QuizPanel
          questions={questions}
          currentIndex={currentIndex}
          answers={answers}
          setAnswer={setAnswer}
          toggleMSQ={toggleMSQ}
          goTo={goTo}
          style={style}
          moduleNum={stage.module}
          saving={saving}
          mode="full"
          onBackToOverview={backToOverview}
          onFinishTest={finishTest}
        />
      </main>
    )
  }

  // ── Combined review ──────────────────────────────────────────────────────
  if (phase === 'review' && combinedResults) {
    const sectionResults = {
      'Reading & Writing': mergeResults([stageResults.rw1, stageResults.rw2]),
      'Mathematics':       mergeResults([stageResults.math1, stageResults.math2]),
    }

    const sections = Object.entries(sectionResults).map(([label, result]) => ({ label, result }))
    const chapterItems = STAGES.flatMap(s =>
      buildChapterItems(stageQuestions[s.key], stageResults[s.key]?.responses, s.label, s.module)
    )

    return (
      <main className="main">
        <div className="page-title" style={{ marginBottom: '2rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full SAT Test — Results</h1>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/sat">SAT</Link></li>
                <li className="current">Full Test Review</li>
              </ol>
            </div>
          </nav>
        </div>

        <div className="container mb-5">
          <SATScoreDashboard
            results={combinedResults}
            sections={sections}
            chapterItems={chapterItems}
            onRetake={handleRetake}
            saving={saving}
            dateAttempted={new Date().toLocaleDateString()}
            heroTitle="Full Test Completed!"
            retakeLabel="Retake Full Test"
          />

          {/* Per-question review, grouped by module in exam order */}
          <h5 className="fw-bold mb-3 mt-4">Question-by-Question Review</h5>
          {STAGES.map(s => (
            <div key={s.key} className="mb-4">
              <h5 className="mb-3">
                <span className="badge text-white" style={{ background: (SUBJECT_STYLE[s.label] || FULL_TEST_STYLE).gradient }}>
                  {s.label} — Module {s.module}
                </span>
              </h5>
              {stageQuestions[s.key].map((q, idx) => {
                const itemKey = `${s.key}-${idx}`
                return (
                  <QuestionReviewItem
                    key={q._id || itemKey}
                    q={q}
                    idx={idx}
                    answer={stageAnswers[s.key][idx]}
                    res={stageResults[s.key].responses[idx]}
                    isOpen={expanded === itemKey}
                    onToggle={() => setExpanded(expanded === itemKey ? null : itemKey)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </main>
    )
  }

  return null
}

export default SATFullTest
