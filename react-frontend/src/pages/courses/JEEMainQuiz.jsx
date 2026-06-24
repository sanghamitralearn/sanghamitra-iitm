import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

// ─── Subject styles ───────────────────────────────────────────────────────────
const SUBJECT_STYLE = {
  Physics:     { gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', badge: '#0d6efd' },
  Chemistry:   { gradient: 'linear-gradient(135deg,#198754,#20c997)', badge: '#198754' },
  Mathematics: { gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', badge: '#dc3545' },
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOptions = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOptions && !hasImgOpts) return 'numeric'
  return q.type || 'multiple_choice'
}

function preprocessText(text) {
  if (!text) return text
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 92 && i + 1 < text.length && text.charCodeAt(i + 1) === 110) { out += '\n'; i++ }
    else out += text[i]
  }
  out = out.replace(/\*\*([^*]*)\*\*/g, '$1')
  out = out.replace(/\\times/g, '×')
  return out
}

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

function parseMatchingLists(text) {
  if (!text) return null
  const itemRe = /\(([PQRS]|[1-9])\)/g
  const positions = []
  let m
  while ((m = itemRe.exec(text)) !== null) {
    const prev = m.index > 0 ? text[m.index - 1] : '\n'
    if (['\n', '\r', ' ', '\t'].includes(prev) || m.index === 0)
      positions.push({ id: m[1], matchStart: m.index, contentStart: m.index + m[0].length })
  }
  if (!positions.length) return null
  const items = positions.map((pos, i) => ({
    id: pos.id,
    content: text.substring(pos.contentStart, i + 1 < positions.length ? positions[i + 1].matchStart : text.length).trim(),
  }))
  const listI  = items.filter(x => 'PQRS'.includes(x.id))
  const listII = items.filter(x => /[1-9]/.test(x.id))
  if (!listI.length && !listII.length) return null
  const preamble = text.substring(0, positions[0].matchStart).replace(/\bList[ -]?I{1,2}\b[:\s]*/gi, ' ').trim()
  return { preamble, listI, listII }
}

function calcMarks(q, userAns) {
  const scheme = q.marking_scheme || { full: 4, negative: -1, zero: 0 }
  const type = resolveType(q)
  const empty = userAns === undefined || userAns === null || userAns === '' || (Array.isArray(userAns) && !userAns.length)
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
    const ca = q.correct_answer
    const ok = (ca !== null && typeof ca === 'object' && 'min' in ca)
      ? given >= ca.min && given <= ca.max
      : Math.abs(given - parseFloat(String(ca))) < 0.01
    return { isCorrect: ok, marksAwarded: ok ? (scheme.full ?? 4) : 0 }
  }
  return { isCorrect: false, marksAwarded: 0 }
}

// ─── QuestionContent ──────────────────────────────────────────────────────────
function QuestionContent({ q }) {
  const parsed = parseMatchingLists(preprocessText(q.question_text))
  if (parsed) {
    const hasL1 = parsed.listI.length > 0, hasL2 = parsed.listII.length > 0
    const imgInL1 = q.image_url && (!hasL1 || (hasL1 && hasL2))
    const imgInL2 = q.image_url && hasL1 && !hasL2
    const listImg = alt => (
      <img src={imgSrc(q.image_url)} alt={alt}
        style={{ maxWidth:'100%', borderRadius:6, marginBottom: hasL1 ? 10 : 0 }}
        onError={e => e.target.style.display='none'} />
    )
    const row = (item, color) => (
      <div key={item.id} style={{ display:'flex', gap:8, marginBottom:10, lineHeight:1.6, fontSize:'0.95rem', alignItems:'flex-start' }}>
        <span style={{ fontWeight:700, minWidth:30, color, flexShrink:0 }}>({item.id})</span>
        <span>{renderTextWithStructures(item.content)}</span>
      </div>
    )
    return (
      <div>
        {parsed.preamble && <p style={{ fontSize:'1.05rem', lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom:16 }}>{renderTextWithStructures(parsed.preamble)}</p>}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div style={{ background:'#f0f7ff', border:'1px solid #b8d4f5', borderRadius:10, padding:16 }}>
              <h6 style={{ color:'#0d6efd', fontWeight:700, marginBottom:12, borderBottom:'1px solid #b8d4f5', paddingBottom:8 }}>List-I</h6>
              {imgInL1 && listImg('List-I')}
              {parsed.listI.filter(x => imgInL1 ? x.content.trim() && !x.content.trim().startsWith('(structure)') : true).map(x => row(x, '#0d6efd'))}
            </div>
          </div>
          <div className="col-md-6">
            <div style={{ background:'#f0fff4', border:'1px solid #a3d9b7', borderRadius:10, padding:16 }}>
              <h6 style={{ color:'#198754', fontWeight:700, marginBottom:12, borderBottom:'1px solid #a3d9b7', paddingBottom:8 }}>List-II</h6>
              {imgInL2 && listImg('List-II')}
              {parsed.listII.map(x => row(x, '#198754'))}
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <>
      <p className="mb-3" style={{ fontSize:'1.05rem', lineHeight:1.8, whiteSpace:'pre-wrap' }}>
        {renderTextWithStructures(preprocessText(q.question_text))}
      </p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <a href={imgSrc(q.image_url)} target="_blank" rel="noopener noreferrer">
            <img src={imgSrc(q.image_url)} alt="Question diagram"
              style={{ maxWidth:'100%', maxHeight:700, borderRadius:10, border:'1px solid #dee2e6' }}
              onError={e => e.target.style.display='none'} />
          </a>
        </div>
      )}
    </>
  )
}

// ─── Allen-style Results Page ─────────────────────────────────────────────────
const ResultsPage = ({ questions, answers, results, subject, onRetake, onReview }) => {
  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics
  const { score, maxScore, correctAnswers, wrongAnswers, unattempted, totalTime } = results
  const total = correctAnswers + wrongAnswers + unattempted || 1

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'14px 24px', display:'flex', alignItems:'center', gap:16 }}>
        <Link to="/courses/jee-main" style={{ color:'#495057', fontSize:'1.3rem', textDecoration:'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: JEE MAIN — {subject}</span>
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize:'0.75rem' }}>JEE (Main)</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onReview}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>
        {/* Score card */}
        <div className="text-white mb-4" style={{ background: style.gradient, borderRadius:16, padding:'32px 24px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', right:60, bottom:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
          <h5 className="fw-bold mb-4" style={{ opacity:0.95 }}>{subject} Report</h5>
          <div className="text-center">
            <div style={{ width:150, height:150, borderRadius:'50%', border:'5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.12)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <span style={{ fontSize:36, fontWeight:700, lineHeight:1 }}>{score}</span>
              <div style={{ width:'55%', height:2, background:'rgba(255,255,255,0.55)', margin:'6px 0' }} />
              <span style={{ fontSize:22, opacity:0.9 }}>{maxScore}</span>
            </div>
            <div style={{ opacity:0.85, fontSize:'0.9rem' }}>
              Time taken: {Math.floor(totalTime / 60)}m {totalTime % 60}s
            </div>
          </div>
        </div>

        {/* Marks Summary */}
        <div className="card border-0 shadow-sm" style={{ borderRadius:12 }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Marks Summary</h5>
            <p className="text-muted small mb-4">
              You've answered {Math.round(correctAnswers / total * 100)}% questions correctly
            </p>
            <div className="row g-3 text-center">
              {[
                { label:'Correct',    count: correctAnswers, color:'#28a745', bg:'#d4edda', icon:'bi-check-circle-fill' },
                { label:'Incorrect',  count: wrongAnswers,   color:'#dc3545', bg:'#f8d7da', icon:'bi-x-circle-fill' },
                { label:'Unattempted',count: unattempted,    color:'#6c757d', bg:'#e9ecef', icon:'bi-dash-circle-fill' },
              ].map(({ label, count, color, bg, icon }) => (
                <div key={label} className="col-4">
                  <div style={{ background:bg, borderRadius:12, padding:'20px 8px' }}>
                    <i className={`bi ${icon} mb-2`} style={{ fontSize:'1.5rem', color }} />
                    <div style={{ fontSize:'2rem', fontWeight:700, color }}>{count}</div>
                    <div className="text-muted" style={{ fontSize:'0.78rem' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-outline-secondary flex-fill btn-sm" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" />Retake
              </button>
              <Link to="/courses/jee-main" className="btn btn-outline-dark flex-fill btn-sm">
                <i className="bi bi-house me-1" />JEE Main
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Answers Page ──────────────────────────────────────────────────────
const ReviewAnswersPage = ({ questions, answers, results, subject, onBack }) => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedIdx, setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) typesetEl(ref.current) }, [expandedIdx])

  const counts = {
    all:         questions.length,
    correct:     results.responses.filter(r => r?.isCorrect).length,
    incorrect:   results.responses.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: results.responses.filter(r => r?.unattempted).length,
  }

  const filtered = questions.map((q, i) => ({ q, i, res: results.responses[i] })).filter(({ res }) => {
    if (statusFilter === 'correct'     && !res?.isCorrect) return false
    if (statusFilter === 'incorrect'   && (res?.unattempted || res?.isCorrect)) return false
    if (statusFilter === 'unattempted' && !res?.unattempted) return false
    return true
  })

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }} ref={ref}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'14px 24px', display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', fontSize:'1.3rem', color:'#495057', cursor:'pointer' }}>←</button>
        <strong>Review Answers — {subject}</strong>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        <div className="row g-4">
          {/* Status sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:'hidden' }}>
              {[
                { key:'all',         label:`All (${counts.all})` },
                { key:'incorrect',   label:`Incorrect (${counts.incorrect})` },
                { key:'unattempted', label:`Unattempted (${counts.unattempted})` },
                { key:'correct',     label:`Correct (${counts.correct})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                  style={{ borderBottom:'1px solid #e9ecef', background: statusFilter === key ? '#f0f4ff' : '#fff', cursor:'pointer' }}>
                  <span style={{ borderLeft: statusFilter === key ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft:10, color: statusFilter === key ? '#0d6efd' : '#212529', fontWeight: statusFilter === key ? 600 : 400 }}>
                    {label}
                  </span>
                  {statusFilter === key && <span style={{ width:8, height:8, borderRadius:'50%', background:'#0d6efd', display:'inline-block' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="col-md-9">
            {filtered.length === 0
              ? <div className="text-center py-5 text-muted">No questions match the selected filter.</div>
              : filtered.map(({ q, i, res }) => {
                  const isOpen = expandedIdx === i
                  const statusColor = res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel = res?.unattempted ? 'N/A' : res?.marksAwarded > 0 ? `+${res.marksAwarded}` : String(res?.marksAwarded ?? 0)

                  return (
                    <div key={i} className="card border-0 shadow-sm mb-3" style={{ borderRadius:12 }}>
                      {/* Top strip */}
                      <div style={{ padding:'10px 16px', borderBottom:'1px solid #e9ecef', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color:statusColor, fontWeight:600, fontSize:'0.82rem' }}>
                          ⊙ CORRECT: {res?.unattempted ? 'N/A' : (res?.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize:'0.8rem' }} />
                      </div>

                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:statusColor, display:'inline-block' }} />
                          {q.difficulty && <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`} style={{ fontSize:'0.7rem' }}>{q.difficulty}</span>}
                          <span className="ms-auto fw-bold" style={{ color:statusColor }}>{marksLabel}</span>
                        </div>

                        <div style={{ cursor:'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize:'0.93rem', lineHeight:1.6 }}>
                                {(() => { const t = q.question_text || ''; return t.length > 220 ? t.slice(0,220)+'…' : t })()}
                              </p>
                          }
                        </div>

                        {isOpen && (
                          <div className="mt-3">
                            {resolveType(q) === 'multiple_choice' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const isCrr = String(q.correct_answer ?? '').trim() === opt.option_id
                                  const userPicked = String(answers[i] ?? '').trim() === opt.option_id
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth:24 }}>{opt.option_id}.</span>
                                      {isCrr && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <div>
                                        <span style={{ fontSize:'0.9rem' }}>{opt.text}</span>
                                        {q.option_images?.[opt.option_id] && (
                                          <div className="mt-1">
                                            <img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`}
                                              style={{ maxWidth:280, borderRadius:6, border:'1px solid #dee2e6' }}
                                              onError={e => e.target.style.display='none'} />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'multiple_select' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const corrArr = (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(String)
                                  const isCrr = corrArr.includes(opt.option_id)
                                  const userPicked = Array.isArray(answers[i]) && answers[i].includes(opt.option_id)
                                  return (
                                    <div key={oi} className="d-flex align-items-start gap-2 mb-2 px-3 py-2 rounded"
                                      style={{ background: isCrr ? '#d4edda' : userPicked ? '#f8d7da' : '#f8f9fa' }}>
                                      <span className="fw-bold text-muted" style={{ minWidth:24 }}>{opt.option_id}.</span>
                                      {isCrr && <i className="bi bi-check-circle-fill text-success mt-1" />}
                                      {userPicked && !isCrr && <i className="bi bi-x-circle-fill text-danger mt-1" />}
                                      <span style={{ fontSize:'0.9rem' }}>{opt.text}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {resolveType(q) === 'numeric' && (
                              <div className="d-flex gap-2 flex-wrap mb-3">
                                <span className="badge bg-light text-dark border fs-6">Your answer: <strong>{answers[i] ?? '(not answered)'}</strong></span>
                                <span className="badge bg-success fs-6">Correct: <strong>
                                  {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer
                                    ? `${q.correct_answer.min} – ${q.correct_answer.max}` : String(q.correct_answer)}
                                </strong></span>
                              </div>
                            )}
                            <div className="text-center pt-2" style={{ borderTop:'1px solid #e9ecef' }}>
                              <span className="text-primary" style={{ fontSize:'0.88rem', cursor:'default' }}>⊞ View solution (coming soon)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Quiz Component ──────────────────────────────────────────────────────
const JEEMainQuiz = () => {
  const { subject } = useParams()
  const navigate    = useNavigate()

  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [phase, setPhase]         = useState('quiz')  // 'quiz' | 'results' | 'review'
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const userRef          = useRef(null)
  const questionRef      = useRef(null)

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics

  useEffect(() => { loadMathJax() }, [])
  useEffect(() => { if (questionRef.current) typesetEl(questionRef.current) }, [currentIndex, questions])
  useEffect(() => { checkAuth() }, [])

  useEffect(() => {
    if (phase !== 'quiz' || loading) return
    const onBlur  = () => setTabWarning(true)
    const onFocus = () => setTabWarning(false)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus) }
  }, [phase, loading])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) { userRef.current = res.data; fetchQuestions() }
      else navigate('/login', { replace: true })
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/jee_main_questions?subject=${encodeURIComponent(subject)}`,
        { withCredentials: true }
      )
      const qs = Array.isArray(res.data) ? res.data : []
      if (!qs.length) { setError(`No questions found for ${subject}.`); setLoading(false); return }
      const shuffled = [...qs]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setQuestions(shuffled)
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))

  const toggleMSQ = (idx, optId) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
    })
  }

  const recordTime = () => {
    timesRef.current[currentIndex] = Math.round((Date.now() - questionStartRef.current) / 1000)
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_, i) => {
        const a = answers[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    let correctCount = 0, wrongCount = 0, unattemptedCount = 0, totalScore = 0
    const maxScore = questions.reduce((s, q) => s + (q.points || 4), 0)
    const responses = []

    questions.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted } = calcMarks(q, answers[i])
      if (unattempted) unattemptedCount++
      else if (isCorrect) correctCount++
      else wrongCount++
      totalScore += marksAwarded
      responses.push({
        questionId: q._id,
        questionText: q.question_text,
        userResponse: answers[i] ?? null,
        correctAnswer: q.correct_answer,
        isCorrect,
        marksAwarded,
        unattempted: !!unattempted,
      })
    })

    const totalTime = Object.values(timesRef.current).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0

    setResults({ correctAnswers: correctCount, wrongAnswers: wrongCount, unattempted: unattemptedCount, score: totalScore, maxScore, percentage, totalTime, responses })
    setPhase('results')

    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      await axios.post(`${API_URL}/api/jee_main_scores`, {
        email: u.email,
        name: u.username || u.name || u.email,
        subject,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        unattempted: unattemptedCount,
        score: totalScore,
        maxScore,
        responses,
      }, { withCredentials: true })
    } catch (e) { console.error('Failed to save score:', e) }
    finally { setSaving(false) }
  }

  const handleRetake = () => {
    setAnswers({}); setPhase('quiz'); setResults(null)
    setCurrentIndex(0); timesRef.current = {}
    setLoading(true); fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height:'60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading JEE Main {subject} questions…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={fetchQuestions}>Retry</button>
      <Link to="/courses/jee-main" className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (phase === 'results' && results) return (
    <ResultsPage questions={questions} answers={answers} results={results} subject={subject}
      onRetake={handleRetake} onReview={() => setPhase('review')} />
  )

  if (phase === 'review' && results) return (
    <ReviewAnswersPage questions={questions} answers={answers} results={results} subject={subject}
      onBack={() => setPhase('results')} />
  )

  // ── Quiz UI ─────────────────────────────────────────────────────────────────
  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered =
    userAns !== undefined && userAns !== null && userAns !== '' &&
    !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  return (
    <main className="main">
      {/* Tab warning */}
      {tabWarning && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:10000, background:'#dc3545', color:'#fff', textAlign:'center', padding:'8px', fontWeight:600 }}>
          ⚠️ Tab switching detected! Please stay on this page.
          <button onClick={() => setTabWarning(false)} style={{ marginLeft:16, background:'none', border:'1px solid #fff', color:'#fff', borderRadius:4, padding:'2px 10px', cursor:'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Page title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom:'2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>JEE Main — {subject}</h1>
                <p className="mb-0">+4 correct · −1 wrong (MCQ) · 0 unattempted / wrong numeric</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses/jee-main">JEE Main</Link></li>
              <li className="current">{subject}</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container mb-5" ref={questionRef}>
        <div className="row g-4">
          {/* Question panel */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:5, background: style.gradient }} />
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <span className="text-muted small">Question {currentIndex + 1} of {questions.length}</span>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>
                      {isAnswered ? 'Answered' : 'Not answered'}
                    </span>
                    <span className="badge" style={{ background: style.badge }}>{q.type}</span>
                    {q.difficulty && (
                      <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`}>
                        {q.difficulty}
                      </span>
                    )}
                    <span className="badge bg-light text-dark border">{q.points || 4} pts</span>
                  </div>
                </div>

                <div className="progress mb-4" style={{ height:5 }}>
                  <div className="progress-bar" style={{ width:`${((currentIndex+1)/questions.length)*100}%`, background: style.gradient }} />
                </div>

                {q.topic && <p className="text-muted small mb-1">{q.topic} › {q.subtopic}</p>}
                <QuestionContent q={q} />

                {/* MCQ */}
                {resolveType(q) === 'multiple_choice' && (
                  <div>
                    {(Array.isArray(q.options) && q.options.length > 0
                      ? q.options
                      : Object.keys(q.option_images || {}).sort().map(id => ({ option_id: id, text: '' }))
                    ).map((opt, oi) => {
                      const selected = String(userAns ?? '') === opt.option_id
                      return (
                        <div key={oi} onClick={() => setAnswer(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor:'pointer', transition:'all 0.15s' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2, border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`, background: selected?'#0d6efd':'transparent' }} />
                          <div>
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            {opt.text && <span style={{ fontSize:'0.95rem' }}>{opt.text}</span>}
                            {q.option_images?.[opt.option_id] && (
                              <div className="mt-2">
                                <img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`}
                                  style={{ maxWidth:280, borderRadius:6, border:'1px solid #dee2e6' }}
                                  onError={e => e.target.style.display='none'} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* MSQ */}
                {resolveType(q) === 'multiple_select' && (
                  <div>
                    <p className="text-muted small mb-2">Select one or more correct options</p>
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                      return (
                        <div key={oi} onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor:'pointer', transition:'all 0.15s' }}>
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

                {/* Numeric */}
                {resolveType(q) === 'numeric' && (
                  <div>
                    <p className="text-muted small mb-2">
                      Enter your numeric answer
                      {q.correct_answer !== null && typeof q.correct_answer === 'object' && 'min' in q.correct_answer ? ' (answer accepted within a range)' : ''}
                    </p>
                    <input type="number" step="any" className="form-control form-control-lg"
                      placeholder="Enter answer…" value={userAns ?? ''}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{ maxWidth:260, fontFamily:'monospace', fontSize:'1.1rem' }} />
                  </div>
                )}

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
                    <i className="bi bi-arrow-left me-1" />Prev
                  </button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length - 1
                    ? <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>Next<i className="bi bi-arrow-right ms-1" /></button>
                    : <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit</>}
                      </button>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((_, i) => {
                    const a = answers[i]
                    const done = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    return (
                      <button key={i} onClick={() => goTo(i)}
                        className={`btn btn-sm ${i === currentIndex ? 'btn-primary' : done ? 'btn-success' : 'btn-outline-secondary'}`}
                        style={{ width:36, height:36, padding:0, fontWeight:600 }}>
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <hr />
                <div className="d-flex justify-content-between small text-muted">
                  <span><span className="badge bg-success me-1">■</span>Answered</span>
                  <span><span className="badge bg-secondary me-1">■</span>Skipped</span>
                  <span><span className="badge bg-primary me-1">■</span>Current</span>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">Marking Scheme</h6>
                <div className="d-flex flex-column gap-1" style={{ fontSize:'0.85rem' }}>
                  <span className="text-success fw-semibold">✓ Correct MCQ: +4</span>
                  <span className="text-danger fw-semibold">✗ Wrong MCQ: −1</span>
                  <span className="text-success fw-semibold">✓ Correct Numeric: +4</span>
                  <span className="text-secondary">✗ Wrong Numeric: 0</span>
                  <span className="text-secondary">— Unattempted: 0</span>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm" style={{ borderRadius:16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button className="btn btn-success w-100" onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />Submit Quiz</>}
                </button>
                <Link to="/courses/jee-main" className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                  <i className="bi bi-arrow-left me-1" />Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default JEEMainQuiz
