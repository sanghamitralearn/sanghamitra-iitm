import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  loadKaTeX, SUBJECT_STYLE, calcMarks, greScaledScore, isAnswerFilled, formatTime,
  TabWarningBanner, QuizPanel,
} from './GREQuiz'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Official (current, shortened) GRE General Test structure:
// Verbal Reasoning M1 & 2, Quantitative Reasoning M1 & 2
// (Analytical Writing is temporarily excluded — no essay questions in the bank yet)
// Exported so listing pages (GREMain.jsx) can show the real question/mark totals
// for a full-test attempt instead of the size of the whole question bank.
export const STAGES = [
  { key: 'verbal1', subject: 'Verbal Reasoning',         scoreSubject: 'Verbal Reasoning',         label: 'Verbal Reasoning',         module: 1, questionCount: 12, timeMin: 18 },
  { key: 'verbal2', subject: 'Verbal Reasoning',         scoreSubject: 'Verbal Reasoning',         label: 'Verbal Reasoning',         module: 2, questionCount: 12, timeMin: 18 },
  { key: 'quant1',  subject: 'Quantitative Reasoning',   scoreSubject: 'Quantitative Reasoning',   label: 'Quantitative Reasoning',   module: 1, questionCount: 12, timeMin: 21 },
  { key: 'quant2',  subject: 'Quantitative Reasoning',   scoreSubject: 'Quantitative Reasoning',   label: 'Quantitative Reasoning',   module: 2, questionCount: 15, timeMin: 26 },
]

const FULL_TEST_STYLE = { gradient: 'linear-gradient(135deg, #6f42c1, #0d6efd)', badge: '#0d6efd' }

const EMPTY_ANSWERS = { verbal1: {}, verbal2: {}, quant1: {}, quant2: {} }
const EMPTY_TIMES = () => ({ verbal1: {}, verbal2: {}, quant1: {}, quant2: {} })
const EMPTY_INDEXES = { verbal1: 0, verbal2: 0, quant1: 0, quant2: 0 }

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

const GREFullTest = () => {
  const navigate   = useNavigate()
  const location   = useLocation()
  const paperName  = location.state?.paper ?? null
  const paperYear  = location.state?.year  ?? null
  // Falls back to the paper/year on the fetched questions themselves when the
  // page was opened without router state (e.g. a hard refresh on /full-test),
  // so the full-paper score always has somewhere to save to — otherwise the
  // "View Analysis" card on the papers list never lights up after finishing.
  const paperRef = useRef({ paper: paperName, year: paperYear })

  // phase: loading | error | quiz | finalizing — modules run one after another
  // automatically; there is no intermediate "choose a module" screen, and
  // finishing the last module hands off to the separate analysis page.
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const [stageIndex, setStageIndex] = useState(0)
  const [stageQuestions, setStageQuestions] = useState(null)
  const [stageAnswers, setStageAnswers] = useState(EMPTY_ANSWERS)
  const [currentIndexByStage, setCurrentIndexByStage] = useState(EMPTY_INDEXES)
  const [stageResults, setStageResults] = useState({})
  const [saving, setSaving] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  // Display order of the 4 module cards — shuffled once per attempt (indices
  // into STAGES, so stageIndex / STAGES[i] lookups elsewhere stay untouched).
  const [stageOrder, setStageOrder] = useState(() => shuffle(STAGES.map((_, i) => i)))

  const questionStartRef = useRef(Date.now())
  const timesRef = useRef(EMPTY_TIMES())
  const userRef = useRef(null)
  const authCheckedRef = useRef(false)
  const submitStageRef = useRef(() => {})

  useEffect(() => { loadKaTeX() }, [])
  useEffect(() => {
    // Guard against React StrictMode's double-invocation of mount effects in
    // dev, which otherwise fires two competing fetches right after the test
    // starts and can make it look like the module didn't really begin.
    if (authCheckedRef.current) return
    authCheckedRef.current = true
    checkAuth()
  }, [])

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

  // ── Per-module timer: counts down while a module is open, auto-submits at 0 ──
  useEffect(() => {
    if (phase !== 'quiz' || timeLeft === null) return
    if (timeLeft <= 0) { submitStageRef.current(true); return }
    const t = setTimeout(() => setTimeLeft(tl => (tl === null ? null : tl - 1)), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

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
      const [verbalRes, quantRes] = await Promise.all([
        axios.get(`${API_URL}/api/gre_questions?subject=${encodeURIComponent('Verbal Reasoning')}${paperParam}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/gre_questions?subject=${encodeURIComponent('Quantitative Reasoning')}${paperParam}`, { withCredentials: true }),
      ])
      const verbal = shuffle(Array.isArray(verbalRes.data) ? verbalRes.data : [])
      const quant  = shuffle(Array.isArray(quantRes.data)  ? quantRes.data  : [])

      if (!paperRef.current.paper) {
        const sample = verbal[0] || quant[0]
        if (sample?.paper) paperRef.current = { paper: sample.paper, year: sample.year ?? null }
      }

      if (!verbal.length || !quant.length) {
        try {
          const dbg = await axios.get(`${API_URL}/api/gre_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError('Not enough questions found in the database to build the full test.')
        setPhase('error')
        return
      }

      const verbalHalf = Math.ceil(verbal.length / 2)
      const quantHalf  = Math.ceil(quant.length / 2)

      setStageQuestions({
        verbal1: verbal.slice(0, verbalHalf).slice(0, STAGES[0].questionCount),
        verbal2: verbal.slice(verbalHalf).slice(0, STAGES[1].questionCount),
        quant1:  quant.slice(0, quantHalf).slice(0, STAGES[2].questionCount),
        quant2:  quant.slice(quantHalf).slice(0, STAGES[3].questionCount),
      })

      // Jump straight into the first (randomized) module — no extra
      // "choose a module" screen between starting the test and question 1.
      const order = shuffle(STAGES.map((_, i) => i))
      setStageOrder(order)
      const firstIdx = order[0]
      questionStartRef.current = Date.now()
      setStageIndex(firstIdx)
      setTimeLeft(STAGES[firstIdx].timeMin * 60)
      setPhase('quiz')
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

  const setBlankAnswer = (idx, blankLabel, optId) => setStageAnswers(prev => ({
    ...prev,
    [stage.key]: {
      ...prev[stage.key],
      [idx]: { ...(prev[stage.key][idx] || {}), [blankLabel]: optId },
    },
  }))

  const toggleBlankMSQ = (idx, blankLabel, optId) => setStageAnswers(prev => {
    const blankAns = prev[stage.key][idx] || {}
    const cur = Array.isArray(blankAns[blankLabel]) ? blankAns[blankLabel] : []
    return {
      ...prev,
      [stage.key]: {
        ...prev[stage.key],
        [idx]: {
          ...blankAns,
          [blankLabel]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId],
        },
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

  // Open a module and start its own timer. Callers that are switching away
  // from a still-active module should call recordTime() themselves first.
  const selectStage = (idx) => {
    setStageIndex(idx)
    questionStartRef.current = Date.now()
    setPhase('quiz')
    setTimeLeft(STAGES[idx].timeMin * 60)
  }

  // Submit & permanently lock the current module, then move straight into the
  // next module in this attempt's (randomized) order — no in-between screen.
  // If it was the last remaining module, the whole test finalizes immediately.
  const submitStage = (forced = false) => {
    if (!forced) {
      const qs = stageQuestions[stage.key]
      const ans = stageAnswers[stage.key]
      const unanswered = qs.filter((q, i) => !isAnswerFilled(q, ans[i])).length
      if (unanswered > 0 && !window.confirm(
        `${unanswered} question(s) in this module are unanswered. Submit this module anyway? ` +
        `You won't be able to change your answers after submitting.`
      )) return
    }
    recordTime()
    const result = computeStageResult(stage.key)
    const updated = { ...stageResults, [stage.key]: result }
    setStageResults(updated)
    if (STAGES.every(s => updated[s.key])) {
      setTimeLeft(null)
      finalizeTest(updated)
      return
    }
    const nextIdx = stageOrder.find(i => !updated[STAGES[i].key])
    selectStage(nextIdx)
  }

  const computeStageResult = (stageKey) => {
    const qs = stageQuestions[stageKey]
    const ans = stageAnswers[stageKey]

    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
    const maxScore = qs.reduce((sum, q) => sum + (q.points || 1), 0)
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

    const totalTime = Object.values(timesRef.current[stageKey]).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    return {
      correctAnswers: correctCount, wrongAnswers: wrongCount, unattempted: unattemptedCount,
      score: totalScore, maxScore, percentage, totalTime, responses,
    }
  }


  const finalizeTest = async (allResults) => {
    const combined = mergeResults(STAGES.map(s => allResults[s.key]))
    combined.percentage = combined.maxScore > 0 ? Math.round(Math.max(0, combined.score / combined.maxScore) * 100) : 0

    const verbalResult = mergeResults([allResults.verbal1, allResults.verbal2])
    const quantResult  = mergeResults([allResults.quant1, allResults.quant2])

    const verbalScaled = greScaledScore(verbalResult.correctAnswers, verbalResult.totalQuestions)
    const quantScaled  = greScaledScore(quantResult.correctAnswers, quantResult.totalQuestions)

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
        'Verbal Reasoning': {
          score: verbalResult.score, maxScore: verbalResult.maxScore,
          correctAnswers: verbalResult.correctAnswers, wrongAnswers: verbalResult.wrongAnswers,
          unattempted: verbalResult.unattempted, totalQuestions: verbalResult.totalQuestions,
          scaledScore: verbalScaled,
        },
        'Quantitative Reasoning': {
          score: quantResult.score, maxScore: quantResult.maxScore,
          correctAnswers: quantResult.correctAnswers, wrongAnswers: quantResult.wrongAnswers,
          unattempted: quantResult.unattempted, totalQuestions: quantResult.totalQuestions,
          scaledScore: quantScaled,
        },
      },
      dateAttempted: new Date().toISOString(),
    }

    try {
      sessionStorage.setItem('greAnalysis', JSON.stringify({ results: analysisResults, questions: allQuestions }))
    } catch { /* ignore quota errors */ }

    // A lightweight "finalizing" spinner, not the full review UI — this page
    // always hands off to the separate /courses/gre/analysis page next, so
    // rendering a full results screen here first just flashes one screen
    // before immediately replacing it with a different one.
    setPhase('finalizing')

    const u = userRef.current
    if (!u?.email) {
      navigate('/courses/gre/analysis', { state: { results: analysisResults, questions: allQuestions } })
      return
    }
    setSaving(true)
    let saveWarning = null
    if (!paperRef.current.paper) {
      saveWarning = "Couldn't determine which paper this attempt belongs to, so it won't appear on the papers list — your score below is still accurate."
    }
    try {
      // Promise.allSettled (not .all) so one failing save doesn't hide the
      // others, and we can report exactly which save failed instead of a
      // generic silent console error.
      const [verbalRes, quantRes, fullRes] = await Promise.allSettled([
        axios.post(`${API_URL}/api/gre_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Verbal Reasoning',
          totalQuestions: verbalResult.totalQuestions, correctAnswers: verbalResult.correctAnswers,
          wrongAnswers: verbalResult.wrongAnswers, unattempted: verbalResult.unattempted,
          score: verbalResult.score, maxScore: verbalResult.maxScore, responses: verbalResult.responses,
        }, { withCredentials: true }),
        axios.post(`${API_URL}/api/gre_scores`, {
          email: u.email, name: u.username || u.name || u.email, subject: 'Quantitative Reasoning',
          totalQuestions: quantResult.totalQuestions, correctAnswers: quantResult.correctAnswers,
          wrongAnswers: quantResult.wrongAnswers, unattempted: quantResult.unattempted,
          score: quantResult.score, maxScore: quantResult.maxScore, responses: quantResult.responses,
        }, { withCredentials: true }),
        // Full-paper score (for the paper listing page)
        ...(paperRef.current.paper ? [
          axios.post(`${API_URL}/api/gre_full_scores`, {
            email: u.email, name: u.username || u.name || u.email,
            paper: paperRef.current.paper, year: paperRef.current.year,
            totalQuestions: combined.totalQuestions,
            correctAnswers: combined.correctAnswers,
            wrongAnswers: combined.wrongAnswers,
            unattempted: combined.unattempted,
            score: combined.score, maxScore: combined.maxScore,
            sectionScores: analysisResults.sectionScores,
            responses: analysisResults.responses,
            totalTimeTaken: analysisResults.totalTimeTaken,
          }, { withCredentials: true }),
        ] : []),
      ])
      if (verbalRes.status === 'rejected') console.error('Failed to save Verbal score:', verbalRes.reason)
      if (quantRes.status === 'rejected') console.error('Failed to save Quant score:', quantRes.reason)
      if (fullRes?.status === 'rejected') {
        console.error('Failed to save full-paper score:', fullRes.reason)
        const serverMsg = fullRes.reason?.response?.data?.error
        saveWarning = `Your test result couldn't be saved to the papers list (${serverMsg || fullRes.reason?.message || 'unknown error'}). ` +
          `Your score below is still accurate — please retry or contact support if this keeps happening.`
      }
    } catch (e) {
      console.error('Failed to save full test scores:', e)
      saveWarning = `Your test result couldn't be saved (${e?.message || 'unknown error'}). Your score below is still accurate.`
    } finally {
      setSaving(false)
      navigate('/courses/gre/analysis', {
        state: { results: analysisResults, questions: allQuestions, saveWarning },
      })
    }
  }

  submitStageRef.current = submitStage

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: FULL_TEST_STYLE.badge }} role="status" />
        <p className="text-muted">Loading the Full GRE Test…</p>
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
              What's in your <code>gre_questions</code> collection
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
        <Link to="/courses/gre" className="btn btn-outline-secondary">Back to GRE</Link>
      </div>
    </div>
  )

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
                  <h1>Full GRE Test — {stage.label}</h1>
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
                <li><Link to="/courses/gre">GRE</Link></li>
                <li className="current">Full Test — {stage.label} Module {stage.module}</li>
              </ol>
            </div>
          </nav>
        </div>

        {timeLeft !== null && (
          <div className="container mb-3 d-flex justify-content-end">
            <span
              className="badge d-inline-flex align-items-center gap-2"
              style={{
                background: timeLeft < 120 ? '#dc3545' : timeLeft < 300 ? '#ffc107' : style.badge,
                color: timeLeft < 300 && timeLeft >= 120 ? '#212529' : '#fff',
                fontSize: '0.95rem', fontFamily: 'monospace', padding: '0.5rem 0.9rem', borderRadius: 8,
              }}
            >
              <i className="bi bi-clock-history" />Time left: {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {/* Module switcher — other modules are locked while this one is open */}
        <div className="container mb-3">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {stageOrder.map((i, displayPos) => {
              const s = STAGES[i]
              const sStyle = SUBJECT_STYLE[s.label] || FULL_TEST_STYLE
              const current = i === stageIndex
              const qs = stageQuestions[s.key]
              const ans = stageAnswers[s.key]
              const answered = qs.filter((q, idx) => isAnswerFilled(q, ans[idx])).length
              const submittedStage = !!stageResults[s.key]
              return (
                <span
                  key={s.key}
                  className="badge border-0"
                  title={current ? undefined : 'Locked — submit the current module to switch'}
                  style={{
                    background: current ? sStyle.gradient : submittedStage ? '#e2e3e5' : '#f8f9fa',
                    color: current ? '#fff' : submittedStage ? '#495057' : '#adb5bd',
                    border: current ? 'none' : '1px solid #e8ecf0',
                    fontSize: '0.75rem', padding: '0.4rem 0.7rem', cursor: 'not-allowed',
                  }}
                >
                  {!current && <i className={`bi ${submittedStage ? 'bi-check-lg' : 'bi-lock-fill'} me-1`} />}
                  {displayPos + 1}. {s.label} — M{s.module} ({answered}/{qs.length})
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
          setBlankAnswer={setBlankAnswer}
          toggleBlankMSQ={toggleBlankMSQ}
          goTo={goTo}
          style={style}
          moduleNum={stage.module}
          saving={saving}
          mode="full"
          onSubmitStage={() => submitStage()}
        />
      </main>
    )
  }

  // ── Finalizing: brief spinner while scores save, then we hand off to the
  // separate /courses/gre/analysis page — no intermediate results screen here
  // to avoid flashing two different results UIs back to back.
  if (phase === 'finalizing') return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: FULL_TEST_STYLE.badge }} role="status" />
        <p className="text-muted">Calculating your results…</p>
      </div>
    </div>
  )

  return null
}

export default GREFullTest
