import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  loadKaTeX, SUBJECT_STYLE, calcMarks,
  QuestionReviewItem, TabWarningBanner, QuizPanel,
} from './SATQuiz'
import SATScoreDashboard, { buildChapterItems } from './SATScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official Digital SAT structure: RW Module 1 → RW Module 2 → Math Module 1 → Math Module 2
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
  const navigate = useNavigate()

  // phase: loading | error | intro | quiz | transition | review
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const [stageIndex, setStageIndex] = useState(0)
  const [stageQuestions, setStageQuestions] = useState(null)
  const [stageAnswers, setStageAnswers] = useState(EMPTY_ANSWERS)
  const [stageResults, setStageResults] = useState({})
  const [combinedResults, setCombinedResults] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
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
      const [rwRes, mathRes] = await Promise.all([
        axios.get(`${API_URL}/api/sat_questions?subject=${encodeURIComponent('Reading and Writing')}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/sat_questions?subject=${encodeURIComponent('Mathematics')}`, { withCredentials: true }),
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
      setPhase('intro')
    } catch {
      setError('Failed to load questions. Please try again.')
      setPhase('error')
    }
  }

  const stage = STAGES[stageIndex]
  const questions = stageQuestions ? stageQuestions[stage.key] : []
  const answers = stageAnswers[stage.key]

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

  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[stage.key][currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  const startStage = (idx) => {
    setStageIndex(idx)
    setCurrentIndex(0)
    questionStartRef.current = Date.now()
    setPhase('quiz')
  }

  const computeStageResult = () => {
    const qs = stageQuestions[stage.key]
    const ans = stageAnswers[stage.key]
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
      })
    })

    const totalTime = Object.values(timesRef.current[stage.key]).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    return {
      correctAnswers: correctCount, wrongAnswers: wrongCount, unattempted: unattemptedCount,
      score: totalScore, maxScore, percentage, totalTime, responses,
    }
  }

  const handleStageSubmit = async (forced = false) => {
    if (!forced) {
      const qs = stageQuestions[stage.key]
      const ans = stageAnswers[stage.key]
      const unanswered = qs.filter((_, i) => {
        const a = ans[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered in this module. Submit anyway?`)) return
    }
    recordTime()

    const result = computeStageResult()
    const newStageResults = { ...stageResults, [stage.key]: result }
    setStageResults(newStageResults)

    if (stageIndex < STAGES.length - 1) {
      setPhase('transition')
    } else {
      await finalizeTest(newStageResults)
    }
  }

  const finalizeTest = async (allResults) => {
    const combined = mergeResults(STAGES.map(s => allResults[s.key]))
    combined.percentage = combined.maxScore > 0 ? Math.round(Math.max(0, combined.score / combined.maxScore) * 100) : 0
    setCombinedResults(combined)
    setPhase('review')

    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      const rwResult   = mergeResults([allResults.rw1, allResults.rw2])
      const mathResult = mergeResults([allResults.math1, allResults.math2])

      await Promise.all([
        axios.post(`${API_URL}/api/sat_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Reading & Writing',
          totalQuestions: rwResult.totalQuestions, correctAnswers: rwResult.correctAnswers,
          wrongAnswers: rwResult.wrongAnswers, unattempted: rwResult.unattempted,
          score: rwResult.score, maxScore: rwResult.maxScore, responses: rwResult.responses,
        }, { withCredentials: true }),
        axios.post(`${API_URL}/api/sat_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Mathematics',
          totalQuestions: mathResult.totalQuestions, correctAnswers: mathResult.correctAnswers,
          wrongAnswers: mathResult.wrongAnswers, unattempted: mathResult.unattempted,
          score: mathResult.score, maxScore: mathResult.maxScore, responses: mathResult.responses,
        }, { withCredentials: true }),
      ])
    } catch (e) {
      console.error('Failed to save full test scores:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setStageIndex(0)
    setCurrentIndex(0)
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

  // ── Intro / Transition between modules ──────────────────────────────────
  if (phase === 'intro' || phase === 'transition') {
    const nextIndex = phase === 'intro' ? 0 : stageIndex + 1
    const nextStage = STAGES[nextIndex]
    const nextStyle = SUBJECT_STYLE[nextStage.label] || FULL_TEST_STYLE
    const prevStage = phase === 'transition' ? STAGES[stageIndex] : null

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
          <div className="card border-0 shadow-sm mx-auto text-center" style={{ maxWidth: 600, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ height: 6, background: FULL_TEST_STYLE.gradient }} />
            <div className="card-body p-4 p-md-5">
              {phase === 'intro' ? (
                <>
                  <h3 className="mb-2">Ready to begin?</h3>
                  <p className="text-muted mb-4">
                    You'll complete all four modules back-to-back, just like the real Digital SAT:
                    Reading &amp; Writing Module 1 &amp; 2, then Mathematics Module 1 &amp; 2.
                    Your combined score report will be shown at the end.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="mb-2">
                    <i className="bi bi-check-circle-fill text-success me-2" />
                    Module Complete
                  </h3>
                  <p className="text-muted mb-4">
                    {prevStage.label} — Module {prevStage.module} submitted ({stageQuestions[prevStage.key].length} questions).
                  </p>
                </>
              )}

              <hr />

              <p className="text-muted text-uppercase small fw-bold mb-2" style={{ letterSpacing: 1 }}>Up Next</p>
              <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                <span className="badge text-white" style={{ background: nextStyle.gradient, fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
                  MODULE {nextIndex + 1} / {STAGES.length}
                </span>
                <div className="text-start">
                  <div className="fw-bold">{nextStage.label} — Module {nextStage.module}</div>
                  <small className="text-muted">{nextStage.questionCount} questions · {nextStage.timeMin} min</small>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn text-white"
                  style={{ background: nextStyle.gradient, borderRadius: 8, padding: '0.5rem 1.75rem' }}
                  onClick={() => startStage(nextIndex)}
                >
                  <i className="bi bi-play-fill me-1" />
                  {phase === 'intro' ? 'Start Full Test' : `Continue to Module ${nextIndex + 1}`}
                </button>
                <Link to="/courses/sat" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-1" />Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Active quiz module ───────────────────────────────────────────────────
  if (phase === 'quiz') {
    const style = SUBJECT_STYLE[stage.label] || FULL_TEST_STYLE
    const isLastStage = stageIndex === STAGES.length - 1

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

        {/* Stage progress strip */}
        <div className="container mb-3">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {STAGES.map((s, i) => {
              const sStyle = SUBJECT_STYLE[s.label] || FULL_TEST_STYLE
              const done = i < stageIndex
              const current = i === stageIndex
              return (
                <span
                  key={s.key}
                  className="badge"
                  style={{
                    background: current ? sStyle.gradient : done ? '#e9ecef' : '#f8f9fa',
                    color: current ? '#fff' : done ? '#495057' : '#adb5bd',
                    border: current ? 'none' : '1px solid #e8ecf0',
                    fontSize: '0.75rem', padding: '0.4rem 0.7rem',
                  }}
                >
                  {done && <i className="bi bi-check-lg me-1" />}
                  {i + 1}. {s.label} — M{s.module}
                </span>
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
          onSubmit={() => handleStageSubmit(false)}
          submitLabel={isLastStage ? 'Submit Full Test' : 'Submit Module'}
          exitTo="/courses/sat"
          exitLabel="Exit Full Test"
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
      buildChapterItems(stageQuestions[s.key], stageResults[s.key]?.responses, s.label)
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
