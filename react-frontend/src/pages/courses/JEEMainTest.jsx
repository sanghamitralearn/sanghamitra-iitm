import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const EXAM_DURATION = 3 * 60 * 60  // 10800 seconds

// ─── MathJax ─────────────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax?.typesetPromise) return
  if (window._mjLoading) return
  window._mjLoading = true
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
    },
    options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'] },
  }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
  s.async = true
  document.head.appendChild(s)
}

function typesetEl(el) {
  if (!el) return
  const doRun = () => {
    if (!window.MathJax?.typesetPromise) return false
    window.MathJax.typesetClear?.([el])
    window.MathJax.typesetPromise([el]).catch(() => {})
    return true
  }
  if (!doRun()) {
    let n = 0
    const id = setInterval(() => { if (doRun() || ++n >= 100) clearInterval(id) }, 100)
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBJECT_ORDER = ['Physics', 'Chemistry', 'Mathematics']
const SUBJECT_STYLE = {
  Physics:     { color: '#0d6efd', gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', icon: 'bi-lightning-charge-fill', label: 'Physics' },
  Chemistry:   { color: '#198754', gradient: 'linear-gradient(135deg,#198754,#20c997)', icon: 'bi-eyedropper',            label: 'Chemistry' },
  Mathematics: { color: '#dc3545', gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', icon: 'bi-calculator-fill',       label: 'Mathematics' },
}
const ACCENT = '#5fcf80'
const ACCENT_DARK = '#37423b'

const imgSrc = (filename) => filename ? `/img/Graph_questions/${filename}` : null

function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOptions && !hasImgOpts) return 'numeric'
  return q.type || 'multiple_choice'
}

function calcMarks(q, userAns) {
  const scheme = q.marking_scheme || { full: 4, negative: -1, zero: 0 }
  const type   = resolveType(q)
  const empty  = userAns === undefined || userAns === null || userAns === '' || (Array.isArray(userAns) && !userAns.length)
  if (empty) return { isCorrect: false, marksAwarded: scheme.zero ?? 0, unattempted: true }

  if (type === 'multiple_choice') {
    const ok = String(q.correct_answer ?? '').trim() === String(userAns).trim()
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 4) : (scheme.negative ?? -1) }
  }
  if (type === 'multiple_select') {
    const corrSet = new Set((Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(a => String(a).trim()))
    const userSet = new Set((Array.isArray(userAns) ? userAns : [userAns]).map(a => String(a).trim()))
    const ok = corrSet.size === userSet.size && [...corrSet].every(a => userSet.has(a))
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 4) : 0 }
  }
  if (type === 'numeric') {
    const given = parseFloat(String(userAns).trim())
    if (isNaN(given)) return { isCorrect: false, marksAwarded: 0 }
    let ok = false
    const ca = q.correct_answer
    if (ca !== null && typeof ca === 'object' && 'min' in ca && 'max' in ca) {
      ok = given >= ca.min && given <= ca.max
    } else {
      ok = Math.abs(given - parseFloat(String(ca))) < 0.01
    }
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 4) : 0 }
  }
  return { isCorrect: false, marksAwarded: 0 }
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// "22 January 2025 Morning Shift" → { date:"22-January-2025", shift:"Morning Shift" }
function parseExamLabel(year) {
  if (!year && year !== 0) return { date: 'N/A', shift: null }
  const s = String(year)
  const shiftMatch = s.match(/(Morning|Afternoon|Evening|Night)\s+Shift/i)
  if (shiftMatch) {
    const shift = shiftMatch[0]
    const date  = s.replace(shift, '').trim().replace(/\s+/g, '-')
    return { date, shift }
  }
  return { date: s, shift: null }
}

function formatDisplayPaper(paper) {
  if (!paper) return 'N/A'
  if (paper.length > 5) return paper
  if (/^P[12]$/i.test(paper)) return `JEE Main Paper ${paper.slice(1)}`
  return paper
}

// ─── Question content (with List matching support) ────────────────────────────
function renderTextWithStructures(text) {
  if (!text || !text.includes('(structure)')) return text
  const parts = text.split('(structure)')
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', background:'#fff3cd', border:'1px dashed #ffc107', borderRadius:4, fontSize:'0.8rem', color:'#856404', verticalAlign:'middle', margin:'0 4px' }}>
          ⬡ Structure
        </span>
      )}
    </React.Fragment>
  ))
}

function QuestionContent({ q }) {
  const text = q.question_text || ''
  return (
    <>
      <p className="mb-3" style={{ fontSize:'1.02rem', lineHeight:1.85, whiteSpace:'pre-wrap' }}>
        {renderTextWithStructures(text)}
      </p>
      {q.image_url && (
        <div className="mb-3 text-center">
          <img
            src={imgSrc(q.image_url)} alt="Question diagram"
            style={{ maxWidth:'100%', maxHeight:280, borderRadius:8, border:'1px solid #dee2e6' }}
            onError={e => { e.target.style.display='none' }}
          />
        </div>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const JEEMainTest = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { year, paper, paperMeta } = location.state || {}

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers]     = useState({})
  const [marked, setMarked]       = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSection, setActiveSection] = useState('Physics')
  const [timeLeft, setTimeLeft]   = useState(EXAM_DURATION)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [tabWarning, setTabWarning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const timerRef        = useRef(null)
  const userRef         = useRef(null)
  const questionRef     = useRef(null)
  const questionStartRef = useRef(Date.now())
  const timesRef        = useRef({})

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!year || !paper) { navigate('/courses/jee-main', { replace: true }); return }
    loadMathJax()
    checkAuth()
  }, [])

  useEffect(() => {
    if (questionRef.current) typesetEl(questionRef.current)
  }, [currentIndex, questions])

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted || loading || questions.length === 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); doSubmit(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [submitted, loading, questions.length])

  // ── Tab warning ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (submitted || loading) return
    const onBlur  = () => setTabWarning(true)
    const onFocus = () => setTabWarning(false)
    window.addEventListener('blur',  onBlur)
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus) }
  }, [submitted, loading])

  // ── Auth + load ────────────────────────────────────────────────────────────
  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data); userRef.current = res.data
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
      const res = await axios.get(
        `${API_URL}/api/jee_main_questions_by_paper?year=${encodeURIComponent(year)}&paper=${encodeURIComponent(paper)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) { setError('No questions found for this paper.'); setLoading(false); return }

      // Sort: Physics → Chemistry → Mathematics, then by question_number
      qs.sort((a, b) => {
        const sd = (SUBJECT_ORDER.indexOf(a.subject) ?? 9) - (SUBJECT_ORDER.indexOf(b.subject) ?? 9)
        return sd !== 0 ? sd : (a.question_number ?? 0) - (b.question_number ?? 0)
      })
      setQuestions(qs)
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = (timesRef.current[currentIndex] || 0) + elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => {
    recordTime()
    setCurrentIndex(idx)
    setActiveSection(questions[idx]?.subject || 'Physics')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const switchSection = (sub) => {
    const idx = questions.findIndex(q => q.subject === sub)
    if (idx >= 0) goTo(idx)
    else setActiveSection(sub)
  }

  // ── Answer helpers ─────────────────────────────────────────────────────────
  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
    })
  }

  const clearAnswer = (idx) => setAnswers(prev => { const n = { ...prev }; delete n[idx]; return n })

  const toggleMark = (idx) => setMarked(prev => ({ ...prev, [idx]: !prev[idx] }))

  const isAnswered = (idx) => {
    const a = answers[idx]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmitClick = () => {
    clearInterval(timerRef.current)
    setShowConfirm(true)
  }

  const doSubmit = async (forced = false) => {
    clearInterval(timerRef.current)
    setShowConfirm(false)
    recordTime()

    const subjectScores = {}
    let totalCorrect = 0, totalWrong = 0, totalUnat = 0, totalScore = 0, totalMax = 0
    const responses = []

    questions.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted } = calcMarks(q, answers[i])
      const sub = q.subject
      if (!subjectScores[sub]) subjectScores[sub] = { totalQuestions: 0, correctAnswers: 0, wrongAnswers: 0, unattempted: 0, score: 0, maxScore: 0 }
      subjectScores[sub].totalQuestions++
      subjectScores[sub].maxScore += (q.points || 4)
      if (unattempted) { subjectScores[sub].unattempted++; totalUnat++ }
      else if (isCorrect) { subjectScores[sub].correctAnswers++; totalCorrect++ }
      else { subjectScores[sub].wrongAnswers++; totalWrong++ }
      subjectScores[sub].score += marksAwarded
      totalScore += marksAwarded
      totalMax   += (q.points || 4)
      responses.push({
        questionId:   q._id,
        subject:      sub,
        userResponse: answers[i] ?? null,
        isCorrect,
        marksAwarded,
        unattempted:  !!unattempted,
        timeTaken:    timesRef.current[i] || 0,
      })
    })

    const totalTimeTaken = EXAM_DURATION - timeLeft
    const percentage     = totalMax > 0 ? Math.round(Math.max(0, totalScore / totalMax) * 100) : 0

    const analysisData = {
      year, paper,
      totalQuestions: questions.length,
      correctAnswers: totalCorrect,
      wrongAnswers:   totalWrong,
      unattempted:    totalUnat,
      score:          totalScore,
      maxScore:       totalMax,
      percentage,
      subjectScores,
      responses,
      totalTimeTaken,
      dateAttempted:  new Date().toISOString(),
    }

    setSubmitted(true)

    // Save to DB (non-blocking)
    const u = userRef.current
    if (u?.email) {
      setSaving(true)
      try {
        await axios.post(`${API_URL}/api/jee_main_full_scores`, {
          email: u.email,
          name:  u.username || u.name || u.email,
          ...analysisData,
        }, { withCredentials: true })
      } catch (e) {
        console.error('Score save failed:', e)
      } finally {
        setSaving(false)
      }
    }

    // Persist in sessionStorage so analysis page survives a refresh
    try {
      sessionStorage.setItem('jeeMainAnalysis', JSON.stringify({ results: analysisData, questions }))
    } catch { /* ignore quota errors */ }

    navigate('/courses/jee-main/analysis', { state: { results: analysisData, questions } })
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: ACCENT }} role="status" />
        <p className="text-muted">Loading questions…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <Link to="/courses/jee-main" className="btn btn-outline-secondary mt-3">
        <i className="bi bi-arrow-left me-1" />Back to JEE Main
      </Link>
    </div>
  )

  if (questions.length === 0) return null

  // ── Derived values ─────────────────────────────────────────────────────────
  const q         = questions[currentIndex]
  const qStyle    = SUBJECT_STYLE[q.subject] || SUBJECT_STYLE.Physics
  const qType     = resolveType(q)
  const userAns   = answers[currentIndex]
  const isAns     = isAnswered(currentIndex)
  const isMarked  = !!marked[currentIndex]

  const answeredCount = questions.filter((_, i) => isAnswered(i)).length

  // Per-subject counts for navigator
  const subjectRanges = {}
  let cursor = 0
  for (const sub of SUBJECT_ORDER) {
    const cnt = questions.filter(q => q.subject === sub).length
    if (cnt > 0) { subjectRanges[sub] = { start: cursor, end: cursor + cnt - 1 }; cursor += cnt }
  }

  // Timer colour
  const timerColor = timeLeft < 600 ? '#dc3545' : timeLeft < 1800 ? '#ffc107' : '#37423b'

  return (
    <main className="main" style={{ background: '#f4f6f9', minHeight: '100vh' }}>
      {/* ── Tab warning ── */}
      {tabWarning && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:10001, background:'#dc3545', color:'#fff', textAlign:'center', padding:'8px 16px', fontWeight:600 }}>
          ⚠️ Tab switch detected — stay on this page!
          <button onClick={() => setTabWarning(false)} style={{ marginLeft:16, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.5)', color:'#fff', borderRadius:4, padding:'2px 10px', cursor:'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* ── Fixed top bar ── */}
      {(() => {
        const { date, shift } = parseExamLabel(year)
        return (
      <div style={{ position:'sticky', top:0, zIndex:1000, background:ACCENT_DARK, color:'#fff', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
        {/* Left: paper info */}
        <div className="d-flex align-items-center gap-3">
          <Link to="/courses/jee-main" className="text-white text-decoration-none" title="Exit test">
            <i className="bi bi-house-fill" style={{ fontSize:'1.1rem' }} />
          </Link>
          <div style={{ width:1, height:24, background:'rgba(255,255,255,0.3)' }} />
          <div>
            <div className="fw-bold" style={{ fontSize:'0.88rem', lineHeight:1.2 }}>
              {date}{shift ? ` · ${shift}` : ''}
            </div>
            <div style={{ fontSize:'0.72rem', opacity:0.75 }}>{formatDisplayPaper(paper)}</div>
          </div>
        </div>

        {/* Centre: timer */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <i className="bi bi-clock" style={{ fontSize:'1rem' }} />
          <span style={{ fontFamily:'monospace', fontSize:'1.3rem', fontWeight:700, color: timeLeft < 600 ? '#ff6b6b' : '#fff' }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Right: progress + submit */}
        <div className="d-flex align-items-center gap-3">
          <span style={{ fontSize:'0.8rem', opacity:0.85 }}>
            {answeredCount}/{questions.length} answered
          </span>
          <button
            className="btn btn-sm fw-semibold"
            style={{ background: ACCENT, border:'none', color: ACCENT_DARK, borderRadius:8, padding:'6px 16px' }}
            onClick={handleSubmitClick}
            disabled={saving}
          >
            {saving ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-check2-all me-1" />Submit</>}
          </button>
        </div>
      </div>
        )
      })()}

      {/* ── Section tabs ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e0e0e0', padding:'0 20px', display:'flex', gap:0 }}>
        {SUBJECT_ORDER.filter(sub => subjectRanges[sub]).map(sub => {
          const s    = SUBJECT_STYLE[sub]
          const rng  = subjectRanges[sub]
          const done = questions.slice(rng.start, rng.end + 1).filter((_, i) => isAnswered(rng.start + i)).length
          const total = rng.end - rng.start + 1
          const active = activeSection === sub
          return (
            <button
              key={sub}
              onClick={() => switchSection(sub)}
              style={{
                padding:'10px 20px', border:'none', background:'transparent', cursor:'pointer',
                borderBottom: active ? `3px solid ${s.color}` : '3px solid transparent',
                color: active ? s.color : '#6c757d',
                fontWeight: active ? 700 : 500,
                fontSize:'0.9rem',
                transition:'all 0.2s',
              }}
            >
              <i className={`bi ${s.icon} me-1`} />
              {sub.slice(0,4)}.
              <span className="ms-1 badge" style={{ background: active ? s.color : '#e9ecef', color: active ? '#fff' : '#555', fontSize:'0.68rem' }}>
                {done}/{total}
              </span>
            </button>
          )
        })}
      </div>

      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="row g-3">
          {/* ── Question panel ── */}
          <div className="col-lg-8" ref={questionRef}>
            <div className="card border-0 shadow-sm" style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:5, background: qStyle.gradient }} />
              <div className="card-body p-4">
                {/* Meta row */}
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <span className="text-muted small">
                    <span className="fw-bold" style={{ color: qStyle.color }}>{q.subject}</span>
                    {' · '}Q{currentIndex + 1} of {questions.length}
                    {q.topic && ` · ${q.topic}`}
                  </span>
                  <div className="d-flex gap-2 flex-wrap">
                    {isAns && <span className="badge bg-success">Answered</span>}
                    {isMarked && <span className="badge" style={{ background:'#9b59b6' }}>Marked for Review</span>}
                    <span className="badge" style={{ background: qStyle.color }}>{q.type?.replace('_',' ')}</span>
                    {q.difficulty && (
                      <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`}>
                        {q.difficulty}
                      </span>
                    )}
                    <span className="badge bg-light text-dark border">{q.points||4} pts</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress mb-4" style={{ height:4 }}>
                  <div className="progress-bar" style={{ width:`${((currentIndex+1)/questions.length)*100}%`, background: qStyle.gradient }} />
                </div>

                {/* Question */}
                <QuestionContent q={q} />

                {/* ── MCQ ── */}
                {qType === 'multiple_choice' && (
                  <div className="mt-2">
                    {(Array.isArray(q.options) && q.options.length > 0
                      ? q.options
                      : Object.keys(q.option_images || {}).sort().map(id => ({ option_id: id, text: '' }))
                    ).map((opt, oi) => {
                      const selected = String(userAns ?? '') === opt.option_id
                      return (
                        <div
                          key={oi}
                          onClick={() => setAnswer(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary' : 'border-light'}`}
                          style={{ cursor:'pointer', background: selected ? 'rgba(13,110,253,0.06)' : '#fdfdfd', transition:'all 0.15s' }}
                        >
                          <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2, border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`, background: selected?'#0d6efd':'transparent' }} />
                          <div className="flex-grow-1">
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            {opt.text && <span style={{ fontSize:'0.95rem' }}>{opt.text}</span>}
                            {q.option_images?.[opt.option_id] && (
                              <div className="mt-2">
                                <img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`}
                                  style={{ maxWidth:280, borderRadius:6, border:'1px solid #dee2e6' }}
                                  onError={e => { e.target.style.display='none' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── MSQ ── */}
                {qType === 'multiple_select' && (
                  <div className="mt-2">
                    <p className="text-muted small mb-2">Select one or more correct options</p>
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                      return (
                        <div
                          key={oi}
                          onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary' : 'border-light'}`}
                          style={{ cursor:'pointer', background: selected ? 'rgba(13,110,253,0.06)' : '#fdfdfd', transition:'all 0.15s' }}
                        >
                          <div style={{ width:20, height:20, borderRadius:4, flexShrink:0, marginTop:2, border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`, background: selected?'#0d6efd':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {selected && <i className="bi bi-check text-white" style={{ fontSize:12 }} />}
                          </div>
                          <div>
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            <span style={{ fontSize:'0.95rem' }}>{opt.text}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Numeric ── */}
                {qType === 'numeric' && (
                  <div className="mt-2">
                    <p className="text-muted small mb-2">Enter your numeric answer (no negative marking)</p>
                    <input
                      type="number" step="any"
                      className="form-control form-control-lg"
                      placeholder="Enter answer…"
                      value={userAns ?? ''}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{ maxWidth:260, fontFamily:'monospace', fontSize:'1.1rem' }}
                    />
                  </div>
                )}

                {/* ── Navigation buttons ── */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top flex-wrap gap-2">
                  <button className="btn btn-outline-secondary btn-sm"
                    onClick={() => currentIndex > 0 && goTo(currentIndex-1)}
                    disabled={currentIndex===0}>
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm"
                      style={{ background: isMarked ? '#9b59b6' : '#e9ecef', color: isMarked ? '#fff' : '#555', border:'none', borderRadius:8 }}
                      onClick={() => toggleMark(currentIndex)}
                    >
                      <i className={`bi ${isMarked ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`} />
                      {isMarked ? 'Marked' : 'Mark for Review'}
                    </button>
                    {isAns && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => clearAnswer(currentIndex)}>
                        <i className="bi bi-eraser me-1" />Clear
                      </button>
                    )}
                  </div>

                  {currentIndex < questions.length - 1 ? (
                    <button className="btn btn-primary btn-sm" onClick={() => goTo(currentIndex+1)}>
                      Next<i className="bi bi-arrow-right ms-1" />
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSubmitClick}
                      disabled={saving}
                    >
                      <i className="bi bi-check-lg me-1" />Submit Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="col-lg-4">
            {/* Question Navigator */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-grid-3x3 me-2" style={{ color: ACCENT }} />Question Navigator
                </h6>

                {SUBJECT_ORDER.filter(sub => subjectRanges[sub]).map(sub => {
                  const s   = SUBJECT_STYLE[sub]
                  const rng = subjectRanges[sub]
                  const qList = questions.slice(rng.start, rng.end + 1)
                  return (
                    <div key={sub} className="mb-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <div style={{ width:10, height:10, borderRadius:'50%', background: s.color }} />
                        <span className="fw-semibold small" style={{ color: s.color }}>{sub}</span>
                        <span className="text-muted" style={{ fontSize:'0.72rem' }}>({qList.length} Q)</span>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {qList.map((_, qi) => {
                          const absIdx = rng.start + qi
                          const done   = isAnswered(absIdx)
                          const curr   = absIdx === currentIndex
                          const mrk    = !!marked[absIdx]
                          let bg = '#e9ecef'; let clr = '#555'
                          if (curr)      { bg = s.color; clr = '#fff' }
                          else if (mrk && done) { bg = '#9b59b6'; clr = '#fff' }
                          else if (mrk)  { bg = 'rgba(155,89,182,0.18)'; clr = '#9b59b6' }
                          else if (done) { bg = '#d4edda'; clr = '#28a745' }
                          return (
                            <button
                              key={qi}
                              onClick={() => goTo(absIdx)}
                              style={{ width:32, height:32, padding:0, border: curr ? `2px solid ${s.color}` : mrk ? '1px dashed #9b59b6' : '1px solid #dee2e6', borderRadius:6, background:bg, color:clr, fontWeight:curr?700:500, fontSize:'0.75rem', cursor:'pointer', transition:'all 0.15s' }}
                            >
                              {rng.start + qi + 1}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Legend */}
                <hr className="my-2" />
                <div className="d-flex flex-wrap gap-2" style={{ fontSize:'0.7rem' }}>
                  {[
                    { color:'#d4edda', border:'1px solid #28a745', label:'Answered' },
                    { color:'#e9ecef', border:'1px solid #dee2e6', label:'Not visited' },
                    { color:'rgba(155,89,182,0.18)', border:'1px dashed #9b59b6', label:'Marked' },
                  ].map(l => (
                    <span key={l.label} className="d-flex align-items-center gap-1">
                      <span style={{ width:14, height:14, borderRadius:3, background:l.color, border:l.border, display:'inline-block' }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Marking Scheme */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">Marking Scheme</h6>
                <div className="d-flex flex-column gap-1" style={{ fontSize:'0.83rem' }}>
                  <span className="text-success fw-semibold"><i className="bi bi-check-circle me-1" />MCQ Correct: +4</span>
                  <span className="text-danger fw-semibold"><i className="bi bi-x-circle me-1" />MCQ Wrong: −1</span>
                  <span className="text-success fw-semibold"><i className="bi bi-check-circle me-1" />Numeric Correct: +4</span>
                  <span className="text-secondary"><i className="bi bi-dash-circle me-1" />Numeric Wrong: 0</span>
                  <span className="text-secondary"><i className="bi bi-dash-circle me-1" />Unattempted: 0</span>
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="card border-0 shadow-sm" style={{ borderRadius:16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-1">{answeredCount} of {questions.length} answered</p>
                <div className="progress mb-2" style={{ height:6 }}>
                  <div className="progress-bar" style={{ width:`${(answeredCount/questions.length)*100}%`, background:`linear-gradient(90deg,${ACCENT},${ACCENT_DARK})` }} />
                </div>
                <button
                  className="btn w-100 fw-bold text-white mb-2"
                  style={{ background:`linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, border:'none', borderRadius:8 }}
                  onClick={handleSubmitClick}
                  disabled={saving}
                >
                  <i className="bi bi-check2-all me-1" />Submit Test
                </button>
                <Link to="/courses/jee-main" className="btn btn-outline-secondary w-100 btn-sm" style={{ borderRadius:8 }}>
                  <i className="bi bi-arrow-left me-1" />Exit (without saving)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit confirmation modal ── */}
      {showConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', borderRadius:16, maxWidth:440, width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ background:`linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, padding:'20px 24px', color:'#fff' }}>
              <h5 className="mb-0 fw-bold"><i className="bi bi-question-circle me-2" />Submit Test?</h5>
            </div>
            <div className="p-4">
              {/* Summary */}
              <div className="row g-2 mb-4">
                {SUBJECT_ORDER.filter(sub => subjectRanges[sub]).map(sub => {
                  const s    = SUBJECT_STYLE[sub]
                  const rng  = subjectRanges[sub]
                  const total = rng.end - rng.start + 1
                  const done  = questions.slice(rng.start, rng.end+1).filter((_,i) => isAnswered(rng.start+i)).length
                  const skip  = total - done
                  return (
                    <div key={sub} className="col-4 text-center">
                      <div className="p-2 rounded" style={{ background:'#f8f9fa', border:`1px solid ${s.color}22` }}>
                        <div style={{ color: s.color, fontSize:'0.7rem', fontWeight:700 }}>{sub.slice(0,4).toUpperCase()}</div>
                        <div className="fw-bold">{done}<span className="text-muted fw-normal">/{total}</span></div>
                        {skip > 0 && <div style={{ fontSize:'0.65rem', color:'#dc3545' }}>{skip} skipped</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {(questions.length - answeredCount) > 0 && (
                <div className="rounded p-2 mb-3" style={{ background:'#fff3cd', border:'1px solid #ffc107' }}>
                  <small><i className="bi bi-exclamation-triangle me-1 text-warning" />
                    <strong>{questions.length - answeredCount}</strong> question(s) unanswered — they'll score 0.
                  </small>
                </div>
              )}

              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary flex-fill" onClick={() => { setShowConfirm(false); /* restart timer */ }}>
                  Continue Test
                </button>
                <button
                  className="btn flex-fill text-white fw-bold"
                  style={{ background:`linear-gradient(135deg,${ACCENT},${ACCENT_DARK})`, border:'none', borderRadius:8 }}
                  onClick={() => doSubmit(false)}
                >
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default JEEMainTest
