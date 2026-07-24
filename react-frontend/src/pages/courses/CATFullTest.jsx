import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  loadKaTeX, SUBJECT_STYLE, calcMarks, isAnswerFilled, formatTime,
  TabWarningBanner, QuizPanel, VARC, DILR, QA,
} from './CATQuiz'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'


// Real CAT format: VARC, DILR, QA — each a single fixed-length, fixed-order
// section (no adaptive modules, no essay). Sections run strictly in this
// order and, once submitted, cannot be reopened — matching the real exam
// (unlike GRE's shuffled module order).
export const STAGES = [
  { key: 'varc', subject: VARC, scoreSubject: VARC, label: 'VARC', questionCount: 24, timeMin: 40 },
  { key: 'dilr', subject: DILR, scoreSubject: DILR, label: 'DILR', questionCount: 20, timeMin: 40 },
  { key: 'qa',   subject: QA,   scoreSubject: QA,   label: 'QA',   questionCount: 22, timeMin: 40 },
]

const FULL_TEST_STYLE = { gradient: 'linear-gradient(135deg, #e8590c, #c92a2a)', badge: '#e8590c' }

const EMPTY_ANSWERS = { varc: {}, dilr: {}, qa: {} }
const EMPTY_TIMES = () => ({ varc: {}, dilr: {}, qa: {} })
const EMPTY_INDEXES = { varc: 0, dilr: 0, qa: 0 }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

const CATFullTest = () => {
  const navigate   = useNavigate()
  const location   = useLocation()
  const paperName  = location.state?.paper ?? null
  const paperYear  = location.state?.year  ?? null
  const paperRef = useRef({ paper: paperName, year: paperYear })

  // phase: loading | error | quiz | finalizing — sections run one after another
  // automatically in the fixed VARC → DILR → QA order; no going back.
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

  const questionStartRef = useRef(Date.now())
  const timesRef = useRef(EMPTY_TIMES())
  const userRef = useRef(null)
  const authCheckedRef = useRef(false)
  const submitStageRef = useRef(() => {})

  useEffect(() => { loadKaTeX() }, [])
  useEffect(() => {
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

  // ── Per-section timer: counts down while a section is open, auto-submits at 0 ──
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
      const [varcRes, dilrRes, qaRes] = await Promise.all([
        axios.get(`${API_URL}/api/cat_questions?subject=${encodeURIComponent(VARC)}${paperParam}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/cat_questions?subject=${encodeURIComponent(DILR)}${paperParam}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/cat_questions?subject=${encodeURIComponent(QA)}${paperParam}`, { withCredentials: true }),
      ])
      const varc = shuffle(Array.isArray(varcRes.data) ? varcRes.data : [])
      const dilr = shuffle(Array.isArray(dilrRes.data) ? dilrRes.data : [])
      const qa   = shuffle(Array.isArray(qaRes.data)   ? qaRes.data   : [])

      if (!paperRef.current.paper) {
        const sample = varc[0] || dilr[0] || qa[0]
        if (sample?.paper) paperRef.current = { paper: sample.paper, year: sample.year ?? null }
      }

      if (!varc.length || !dilr.length || !qa.length) {
        try {
          const dbg = await axios.get(`${API_URL}/api/cat_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError('Not enough questions found in the database to build the full test.')
        setPhase('error')
        return
      }

      setStageQuestions({
        varc: varc.slice(0, STAGES[0].questionCount),
        dilr: dilr.slice(0, STAGES[1].questionCount),
        qa:   qa.slice(0, STAGES[2].questionCount),
      })

      // Fixed order (no shuffle) — real CAT sections run strictly VARC → DILR → QA.
      questionStartRef.current = Date.now()
      setStageIndex(0)
      setTimeLeft(STAGES[0].timeMin * 60)
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

  const selectStage = (idx) => {
    setStageIndex(idx)
    questionStartRef.current = Date.now()
    setPhase('quiz')
    setTimeLeft(STAGES[idx].timeMin * 60)
  }

  // Submit & permanently lock the current section, then move straight into the
  // next section in the fixed VARC → DILR → QA order — no going back, matching
  // the real CAT exam. The last section finalizes the whole test immediately.
  const submitStage = (forced = false) => {
    if (!forced) {
      const qs = stageQuestions[stage.key]
      const ans = stageAnswers[stage.key]
      const unanswered = qs.filter((q, i) => !isAnswerFilled(q, ans[i])).length
      if (unanswered > 0 && !window.confirm(
        `${unanswered} question(s) in this section are unanswered. Submit this section anyway? ` +
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
    selectStage(stageIndex + 1)
  }

  const computeStageResult = (stageKey) => {
    const qs = stageQuestions[stageKey]
    const ans = stageAnswers[stageKey]

    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
    const maxScore = qs.reduce((sum, q) => sum + (q.points || 3), 0)
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
      sectionScores: STAGES.reduce((acc, s) => {
        const r = allResults[s.key]
        acc[s.scoreSubject] = {
          score: r.score, maxScore: r.maxScore,
          correctAnswers: r.correctAnswers, wrongAnswers: r.wrongAnswers,
          unattempted: r.unattempted, totalQuestions: r.responses.length,
        }
        return acc
      }, {}),
      dateAttempted: new Date().toISOString(),
    }

    try {
      sessionStorage.setItem('catAnalysis', JSON.stringify({ results: analysisResults, questions: allQuestions }))
    } catch { /* ignore quota errors */ }

    setPhase('finalizing')

    const u = userRef.current
    if (!u?.email) {
      navigate('/courses/cat/analysis', { state: { results: analysisResults, questions: allQuestions } })
      return
    }
    setSaving(true)
    let saveWarning = null
    if (!paperRef.current.paper) {
      saveWarning = "Couldn't determine which paper this attempt belongs to, so it won't appear on the papers list — your score below is still accurate."
    }
    try {
      const sectionPosts = STAGES.map(s => axios.post(`${API_URL}/api/cat_scores`, {
        email: u.email, name: u.username || u.name || u.email, subject: s.scoreSubject,
        totalQuestions: allResults[s.key].responses.length, correctAnswers: allResults[s.key].correctAnswers,
        wrongAnswers: allResults[s.key].wrongAnswers, unattempted: allResults[s.key].unattempted,
        score: allResults[s.key].score, maxScore: allResults[s.key].maxScore, responses: allResults[s.key].responses,
        source: 'FullTest',
      }, { withCredentials: true }))

      const results = await Promise.allSettled([
        ...sectionPosts,
        ...(paperRef.current.paper ? [
          axios.post(`${API_URL}/api/cat_full_scores`, {
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
      const fullRes = paperRef.current.paper ? results[results.length - 1] : null
      results.slice(0, sectionPosts.length).forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Failed to save ${STAGES[i].scoreSubject} score:`, r.reason)
      })
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
      navigate('/courses/cat/analysis', {
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
        <p className="text-muted">Loading the Full CAT Test…</p>
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
              What's in your <code>cat_questions</code> collection
            </h6>
            <p className="mb-1 text-muted small">Total documents: <strong>{debugInfo.totalQuestions}</strong></p>
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
        <Link to="/courses/cat" className="btn btn-outline-secondary">Back to CAT</Link>
      </div>
    </div>
  )

  // ── Active quiz section ───────────────────────────────────────────────────
  if (phase === 'quiz') {
    const style = SUBJECT_STYLE[stage.label] || SUBJECT_STYLE[stage.subject] || FULL_TEST_STYLE

    return (
      <main className="main">
        <TabWarningBanner show={tabWarning} onDismiss={() => setTabWarning(false)} />

        <div className="page-title" data-aos="fade" style={{ marginBottom: '1.25rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full CAT Test — {stage.subject}</h1>
                  <p className="mb-0">
                    Section {stageIndex + 1} of {STAGES.length} &nbsp;·&nbsp; {questions.length} questions
                    &nbsp;·&nbsp; +3 correct MCQ · −1 wrong MCQ · +3/0 TITA
                  </p>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/cat">CAT</Link></li>
                <li className="current">Full Test — {stage.label}</li>
              </ol>
            </div>
          </nav>
        </div>

        {timeLeft !== null && (
          <div className="container mb-3 d-flex justify-content-end">
            <span className="badge d-inline-flex align-items-center gap-2" style={{
              background: timeLeft < 120 ? '#dc3545' : timeLeft < 300 ? '#ffc107' : style.badge,
              color: timeLeft < 300 && timeLeft >= 120 ? '#212529' : '#fff',
              fontSize: '0.95rem', fontFamily: 'monospace', padding: '0.5rem 0.9rem', borderRadius: 8,
            }}>
              <i className="bi bi-clock-history" />Time left: {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {/* Section progress — fixed order, no jumping ahead or going back */}
        <div className="container mb-3">
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {STAGES.map((s, i) => {
              const sStyle = SUBJECT_STYLE[s.label] || FULL_TEST_STYLE
              const current = i === stageIndex
              const qs = stageQuestions[s.key]
              const ans = stageAnswers[s.key]
              const answered = qs.filter((q, idx) => isAnswerFilled(q, ans[idx])).length
              const submittedStage = !!stageResults[s.key]
              return (
                <span key={s.key} className="badge border-0"
                  title={current ? undefined : submittedStage ? 'Submitted — cannot be reopened' : 'Not started yet'}
                  style={{
                    background: current ? sStyle.gradient : submittedStage ? '#e2e3e5' : '#f8f9fa',
                    color: current ? '#fff' : submittedStage ? '#495057' : '#adb5bd',
                    border: current ? 'none' : '1px solid #e8ecf0',
                    fontSize: '0.75rem', padding: '0.4rem 0.7rem', cursor: 'not-allowed',
                  }}>
                  {!current && <i className={`bi ${submittedStage ? 'bi-check-lg' : 'bi-lock-fill'} me-1`} />}
                  {i + 1}. {s.label} ({answered}/{qs.length})
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
          saving={saving}
          mode="full"
          onSubmitStage={() => submitStage()}
        />
      </main>
    )
  }

  // ── Finalizing ───────────────────────────────────────────────────────────
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

export default CATFullTest
