import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  loadKaTeX, SUBJECT_STYLE, calcMarks,
  QuestionReviewItem, TabWarningBanner, QuizPanel,
} from './GATEDAQuiz'
import GATEDAScoreDashboard, { buildChapterItems } from './GATEDAScoreDashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// The 6 GATE DA subjects, in exam order
const SUBJECT_LIST = [
  { subject: 'General Aptitude' },
  { subject: 'Engineering Mathematics' },
  { subject: 'Programming & Data Structures' },
  { subject: 'Database Management & Warehousing' },
  { subject: 'Machine Learning' },
  { subject: 'Artificial Intelligence' },
]

const FULL_TEST_STYLE = { gradient: 'linear-gradient(135deg, #198754, #0d6efd)', badge: '#0d6efd' }

function isAnswered(a) {
  return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
}

function shuffleWithinSubject(qs) {
  const a = [...qs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const GATEDAFullTest = () => {
  const navigate   = useNavigate()
  const location   = useLocation()
  const paperName  = location.state?.paper ?? null
  const paperYear  = location.state?.year  ?? null

  // phase: loading | error | quiz | review
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)

  const [allQuestions, setAllQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef = useRef({})
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
      const responses = await Promise.all(
        SUBJECT_LIST.map(s =>
          axios.get(`${API_URL}/api/gate_da_questions?subject=${encodeURIComponent(s.subject)}${paperParam}`, { withCredentials: true })
        )
      )
      const pools = responses.map(r => shuffleWithinSubject(Array.isArray(r.data) ? r.data : []))

      if (pools.some(p => !p.length)) {
        try {
          const dbg = await axios.get(`${API_URL}/api/gate_da_debug`, { withCredentials: true })
          setDebugInfo(dbg.data)
        } catch { /* ignore */ }
        setError('Not enough questions found in the database to build the full test.')
        setPhase('error')
        return
      }

      // One flat list, in exam order (GA → Math → Prog → DBMS → ML → AI),
      // tagged with each question's subject for per-section scoring later.
      const combined = SUBJECT_LIST.flatMap((s, i) => pools[i].map(q => ({ ...q, subject: s.subject })))

      setAllQuestions(combined)
      setAnswers({})
      setCurrentIndex(0)
      timesRef.current = {}
      setPhase('quiz')
    } catch {
      setError('Failed to load questions. Please try again.')
      setPhase('error')
    }
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => setAnswers(prev => {
    const cur = Array.isArray(prev[idx]) ? prev[idx] : []
    return {
      ...prev,
      [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId],
    }
  })

  // Only meaningful while actively viewing a question in the quiz phase
  const recordTime = () => {
    if (phase !== 'quiz') return
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => {
    recordTime()
    setCurrentIndex(idx)
    questionStartRef.current = Date.now()
  }

  const finishTest = async () => {
    const totalUnanswered = allQuestions.filter((_, i) => !isAnswered(answers[i])).length
    if (totalUnanswered > 0 && !window.confirm(
      `${totalUnanswered} question(s) are unanswered. Finish the test anyway?`
    )) return

    recordTime()

    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
    const maxScore = allQuestions.reduce((s, q) => s + (q.points || 1), 0)
    const responses = []

    allQuestions.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted } = calcMarks(q, answers[i])
      if (unattempted) unattemptedCount++
      else if (isCorrect) correctCount++
      else wrongCount++
      totalScore += marksAwarded

      responses.push({
        questionId: q._id,
        userResponse: answers[i] ?? null,
        isCorrect,
        marksAwarded,
        unattempted: !!unattempted,
        timeSpent: timesRef.current[i] || 0,
        subject: q.subject,
      })
    })

    const totalTime = Object.values(timesRef.current).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    const combined = {
      totalQuestions: allQuestions.length,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unattempted: unattemptedCount,
      score: totalScore,
      maxScore,
      percentage,
      totalTime,
      responses,
    }

    await finalizeTest(combined)
  }

  const finalizeTest = async (combined) => {
    const perSubjectResult = {}
    SUBJECT_LIST.forEach(s => {
      const subjResponses = combined.responses.filter(r => r.subject === s.subject)
      perSubjectResult[s.subject] = {
        totalQuestions: subjResponses.length,
        correctAnswers: subjResponses.filter(r => r.isCorrect).length,
        wrongAnswers: subjResponses.filter(r => !r.isCorrect && !r.unattempted).length,
        unattempted: subjResponses.filter(r => r.unattempted).length,
        score: subjResponses.reduce((s2, r) => s2 + r.marksAwarded, 0),
        maxScore: allQuestions.filter(q => q.subject === s.subject).reduce((s2, q) => s2 + (q.points || 1), 0),
        responses: subjResponses,
      }
    })

    const sectionScores = {}
    SUBJECT_LIST.forEach(s => {
      const r = perSubjectResult[s.subject]
      sectionScores[s.subject] = {
        score: r.score, maxScore: r.maxScore,
        correctAnswers: r.correctAnswers, wrongAnswers: r.wrongAnswers,
        unattempted: r.unattempted, totalQuestions: r.totalQuestions,
      }
    })

    const analysisResults = {
      testType:    'full',
      score:       combined.score,
      maxScore:    combined.maxScore,
      correctAnswers: combined.correctAnswers,
      wrongAnswers:   combined.wrongAnswers,
      unattempted:    combined.unattempted,
      totalTimeTaken: combined.totalTime || 0,
      responses:   combined.responses,
      sectionScores,
      dateAttempted: new Date().toISOString(),
    }

    try {
      sessionStorage.setItem('gateDaAnalysis', JSON.stringify({ results: analysisResults, questions: allQuestions }))
    } catch { /* ignore quota errors */ }

    setResults(combined)
    setPhase('review')

    const u = userRef.current
    if (!u?.email) {
      navigate('/courses/gate-da/analysis', { state: { results: analysisResults, questions: allQuestions } })
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        // Per-subject scores (6x — one per GATE DA subject)
        ...SUBJECT_LIST.map(s => {
          const r = perSubjectResult[s.subject]
          return axios.post(`${API_URL}/api/gate_da_scores`, {
            email: u.email, name: u.username || u.name || u.email, subject: s.subject,
            totalQuestions: r.totalQuestions, correctAnswers: r.correctAnswers,
            wrongAnswers: r.wrongAnswers, unattempted: r.unattempted,
            score: r.score, maxScore: r.maxScore, responses: r.responses,
            source: 'FullTest',
          }, { withCredentials: true })
        }),
        // Full-paper score (always saved, so it shows up on the admin dashboard
        // and the paper listing page even when started without a named paper)
        axios.post(`${API_URL}/api/gate_da_full_scores`, {
          email: u.email, name: u.username || u.name || u.email,
          paper: paperName || 'GATE DA Full Test', year: paperYear,
          totalQuestions: combined.totalQuestions,
          correctAnswers: combined.correctAnswers,
          wrongAnswers: combined.wrongAnswers,
          unattempted: combined.unattempted,
          score: combined.score, maxScore: combined.maxScore,
          sectionScores: analysisResults.sectionScores,
          responses: analysisResults.responses,
          totalTimeTaken: combined.totalTime || 0,
        }, { withCredentials: true }),
      ])
    } catch (e) {
      console.error('Failed to save full test scores:', e)
    } finally {
      setSaving(false)
      navigate('/courses/gate-da/analysis', { state: { results: analysisResults, questions: allQuestions } })
    }
  }

  const handleRetake = () => {
    setCurrentIndex(0)
    setAnswers({})
    setResults(null)
    setExpanded(null)
    timesRef.current = {}
    fetchAllQuestions()
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: FULL_TEST_STYLE.badge }} role="status" />
        <p className="text-muted">Loading the Full GATE DA Test…</p>
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
              What's in your <code>gate_da_questions</code> collection
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
        <Link to="/courses/gate-da/modules" className="btn btn-outline-secondary">Back to GATE DA</Link>
      </div>
    </div>
  )

  // ── Active quiz — one continuous list of every question ─────────────────
  if (phase === 'quiz') {
    const q = allQuestions[currentIndex]
    const style = SUBJECT_STYLE[q.subject] || FULL_TEST_STYLE

    return (
      <main className="main">
        <TabWarningBanner show={tabWarning} onDismiss={() => setTabWarning(false)} />

        <div className="page-title" data-aos="fade" style={{ marginBottom: '1.25rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full GATE DA Test</h1>
                  <p className="mb-0">
                    <span className="fw-semibold">{q.subject}</span>
                    &nbsp;·&nbsp; {allQuestions.length} questions across 6 subjects
                    &nbsp;·&nbsp; +1/+2 correct · negative marking for wrong MCQ
                  </p>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/gate-da/modules">GATE DA</Link></li>
                <li className="current">Full Test</li>
              </ol>
            </div>
          </nav>
        </div>

        <QuizPanel
          questions={allQuestions}
          currentIndex={currentIndex}
          answers={answers}
          setAnswer={setAnswer}
          toggleMSQ={toggleMSQ}
          goTo={goTo}
          style={style}
          saving={saving}
          onSubmit={finishTest}
          submitLabel="Finish Test"
          exitTo="/courses/gate-da/modules"
          exitLabel="Exit"
        />
      </main>
    )
  }

  // ── Combined review ──────────────────────────────────────────────────────
  if (phase === 'review' && results) {
    const sections = SUBJECT_LIST.map(s => {
      const subjResponses = results.responses.filter(r => r.subject === s.subject)
      return {
        label: s.subject,
        result: {
          totalQuestions: subjResponses.length,
          correctAnswers: subjResponses.filter(r => r.isCorrect).length,
          wrongAnswers: subjResponses.filter(r => !r.isCorrect && !r.unattempted).length,
          unattempted: subjResponses.filter(r => r.unattempted).length,
          score: subjResponses.reduce((s2, r) => s2 + r.marksAwarded, 0),
          maxScore: allQuestions.filter(q => q.subject === s.subject).reduce((s2, q) => s2 + (q.points || 1), 0),
        },
      }
    })
    const chapterItems = SUBJECT_LIST.flatMap(s => {
      const idxs = allQuestions.map((q, i) => (q.subject === s.subject ? i : -1)).filter(i => i !== -1)
      const subjQuestions = idxs.map(i => allQuestions[i])
      const subjResponses = idxs.map(i => results.responses[i])
      return buildChapterItems(subjQuestions, subjResponses, s.subject)
    })

    return (
      <main className="main">
        <div className="page-title" style={{ marginBottom: '2rem' }}>
          <div className="heading">
            <div className="container">
              <div className="row d-flex justify-content-center text-center">
                <div className="col-lg-8">
                  <h1>Full GATE DA Test — Results</h1>
                </div>
              </div>
            </div>
          </div>
          <nav className="breadcrumbs">
            <div className="container">
              <ol>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/courses/gate-da/modules">GATE DA</Link></li>
                <li className="current">Full Test Review</li>
              </ol>
            </div>
          </nav>
        </div>

        <div className="container mb-5">
          <GATEDAScoreDashboard
            results={results}
            sections={sections}
            chapterItems={chapterItems}
            onRetake={handleRetake}
            saving={saving}
            dateAttempted={new Date().toLocaleDateString()}
            heroTitle="Full Test Completed!"
            retakeLabel="Retake Full Test"
            backTo="/courses/gate-da/modules"
            backLabel="Back to GATE DA"
          />

          {/* Per-question review, in exam order */}
          <h5 className="fw-bold mb-3 mt-4">Question-by-Question Review</h5>
          {allQuestions.map((q, idx) => (
            <QuestionReviewItem
              key={q._id || idx}
              q={q}
              idx={idx}
              answer={answers[idx]}
              res={results.responses[idx]}
              isOpen={expanded === idx}
              onToggle={() => setExpanded(expanded === idx ? null : idx)}
            />
          ))}
        </div>
      </main>
    )
  }

  return null
}

export default GATEDAFullTest
