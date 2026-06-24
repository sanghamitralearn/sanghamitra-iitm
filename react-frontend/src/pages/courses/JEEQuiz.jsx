import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const FULL_TEST_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics']
const TIMER_SECS = 180 * 60 // 3 hours for Paper1 / Paper2

// JEE Advanced 2026 section structure per subject per paper
const SECTIONS = [
  { id: 'I',   label: 'Section I',   type: 'MCQ',     count: 4, full: 3, neg: -1 },
  { id: 'II',  label: 'Section II',  type: 'MSQ',     count: 3, full: 4, neg: -2 },
  { id: 'III', label: 'Section III', type: 'Numeric', count: 6, full: 4, neg: 0  },
  { id: 'IV',  label: 'Section IV',  type: 'Matching',count: 4, full: 3, neg: -1 },
]

// ─── MathJax ─────────────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax) return
  window.MathJax = {
    tex: { inlineMath: [['$','$'],['\\(','\\)']], displayMath: [['$$','$$'],['\\[','\\]']], processEscapes: true },
    options: { skipHtmlTags: ['script','noscript','style','textarea','pre'] },
  }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
  s.async = true
  document.head.appendChild(s)
}
function typesetEl(el) {
  if (!el) return
  const run = () => window.MathJax?.typesetPromise?.([el]).catch(() => {})
  if (window.MathJax?.typesetPromise) run()
  else setTimeout(run, 800)
}

function stripLatex(text) {
  if (!text) return ''
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, '[math]')
    .replace(/\$[^$\n]+\$/g, '[math]')
    .replace(/\\\([^)]*\\\)/g, '[math]')
    .replace(/\\\[[^\]]*\\\]/g, '[math]')
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}$]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

const SUBJECT_STYLE = {
  Physics:     { gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', badge: '#0d6efd' },
  Chemistry:   { gradient: 'linear-gradient(135deg,#198754,#20c997)', badge: '#198754' },
  Mathematics: { gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', badge: '#dc3545' },
  Full:        { gradient: 'linear-gradient(135deg,#6610f2,#0d6efd,#198754)', badge: '#6610f2' },
  Paper1:      { gradient: 'linear-gradient(135deg,#f7931e,#f7c59f)', badge: '#f7931e' },
  Paper2:      { gradient: 'linear-gradient(135deg,#6610f2,#ae63f7)', badge: '#6610f2' },
}
const SUBJECT_COLOR   = { Physics: '#0d6efd', Chemistry: '#198754', Mathematics: '#dc3545' }
const SUBJECT_GRADIENT = {
  Physics:     'linear-gradient(135deg,#0d6efd,#6610f2)',
  Chemistry:   'linear-gradient(135deg,#198754,#20c997)',
  Mathematics: 'linear-gradient(135deg,#dc3545,#fd7e14)',
}

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOpts = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOpts && !hasImgOpts) return 'numeric'
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
  out = out.replace(/\b([A-Za-z][A-Za-z0-9]*)\^\$\\([a-zA-Z]+)\$/g, (_, b, c) => `$${b}^{\\${c}}$`)
  return out
}

function renderTextWithStructures(text) {
  const clean = preprocessText(text)
  if (!clean || !clean.includes('(structure)')) return clean
  const parts = clean.split('(structure)')
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'2px 10px',background:'#fff3cd',border:'1px dashed #ffc107',borderRadius:4,fontSize:'0.8rem',color:'#856404',verticalAlign:'middle',margin:'0 4px' }}>⬡ Structure</span>
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
    if (['\n','\r',' ','\t'].includes(prev) || m.index === 0)
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

function selectBySection(all) {
  const isMatchingQ = q => Boolean(parseMatchingLists(preprocessText(q.question_text)))
  const sh = shuffle(all)
  const matching = sh.filter(isMatchingQ)
  const numeric  = sh.filter(q => resolveType(q) === 'numeric')
  const msq      = sh.filter(q => resolveType(q) === 'multiple_select')
  const mcq      = sh.filter(q => resolveType(q) === 'multiple_choice' && !isMatchingQ(q))
  return [
    ...mcq.slice(0, 4).map(q => ({ ...q, _section: 'I' })),
    ...msq.slice(0, 3).map(q => ({ ...q, _section: 'II' })),
    ...numeric.slice(0, 6).map(q => ({ ...q, _section: 'III' })),
    ...matching.slice(0, 4).map(q => ({ ...q, _section: 'IV' })),
  ]
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function calcMarks(q, userAns) {
  const sec = q._section ? SECTIONS.find(s => s.id === q._section) : null
  const scheme = sec ? { full: sec.full, negative: sec.neg, zero: 0 }
    : (q.marking_scheme || { full: 3, negative: -1, zero: 0 })
  const type = resolveType(q)
  const empty = userAns === undefined || userAns === null || userAns === '' || (Array.isArray(userAns) && !userAns.length)
  if (empty) return { isCorrect: false, marksAwarded: 0, unattempted: true }
  if (type === 'multiple_choice') {
    const ok = String(q.correct_answer ?? '').trim() === String(userAns).trim()
    return { isCorrect: ok, marksAwarded: ok ? scheme.full : scheme.negative }
  }
  if (type === 'multiple_select') {
    const corrSet = new Set((Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]).map(a => String(a).trim()))
    const userSet = new Set((Array.isArray(userAns) ? userAns : [userAns]).map(a => String(a).trim()))
    const ok = corrSet.size === userSet.size && [...corrSet].every(a => userSet.has(a))
    if (ok) return { isCorrect: true, marksAwarded: scheme.full }
    if ([...userSet].some(a => !corrSet.has(a))) return { isCorrect: false, marksAwarded: scheme.negative }
    const cnt = [...userSet].filter(a => corrSet.has(a)).length
    return { isCorrect: false, marksAwarded: q.marking_scheme?.[`partial_${cnt}`] ?? cnt }
  }
  if (type === 'numeric') {
    const given = parseFloat(String(userAns).trim())
    if (isNaN(given)) return { isCorrect: false, marksAwarded: scheme.negative }
    const ca = q.correct_answer
    const ok = (ca !== null && typeof ca === 'object' && 'min' in ca)
      ? given >= ca.min && given <= ca.max
      : Math.abs(given - parseFloat(String(ca))) < 0.01
    return { isCorrect: ok, marksAwarded: ok ? scheme.full : scheme.negative }
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
    const listImg = alt => <img src={imgSrc(q.image_url)} alt={alt} style={{ maxWidth:'100%', borderRadius:6, marginBottom: hasL1 ? 10 : 0 }} onError={e => e.target.style.display='none'} />
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
          <div className="col-md-6"><div style={{ background:'#f0f7ff', border:'1px solid #b8d4f5', borderRadius:10, padding:16 }}>
            <h6 style={{ color:'#0d6efd', fontWeight:700, marginBottom:12, borderBottom:'1px solid #b8d4f5', paddingBottom:8 }}>List-I</h6>
            {imgInL1 && listImg('List-I')}
            {parsed.listI.filter(x => imgInL1 ? x.content.trim() && !x.content.trim().startsWith('(structure)') : true).map(x => row(x, '#0d6efd'))}
          </div></div>
          <div className="col-md-6"><div style={{ background:'#f0fff4', border:'1px solid #a3d9b7', borderRadius:10, padding:16 }}>
            <h6 style={{ color:'#198754', fontWeight:700, marginBottom:12, borderBottom:'1px solid #a3d9b7', paddingBottom:8 }}>List-II</h6>
            {imgInL2 && listImg('List-II')}
            {parsed.listII.map(x => row(x, '#198754'))}
          </div></div>
        </div>
      </div>
    )
  }
  return (
    <>
      <p className="mb-3" style={{ fontSize:'1.05rem', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{renderTextWithStructures(q.question_text)}</p>
      {q.image_url && (
        <div className="mb-4 text-center">
          <a href={imgSrc(q.image_url)} target="_blank" rel="noopener noreferrer">
            <img src={imgSrc(q.image_url)} alt="Question diagram" style={{ maxWidth:'100%', maxHeight:700, borderRadius:10, border:'1px solid #dee2e6' }} onError={e => e.target.style.display='none'} />
          </a>
        </div>
      )}
    </>
  )
}

// ─── Allen-style Results Page ─────────────────────────────────────────────────
const ResultsPage = ({ questions, answers, results, subject, isPaper, paperNum, onRetake, onReview }) => {
  const [selectedView, setSelectedView] = useState('overview')
  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const distinctSubjects = [...new Set(questions.map(q => q.subject).filter(Boolean))]
  const isMultiSubject = distinctSubjects.length > 1

  const subjectStats = useMemo(() => {
    const stats = {}
    const subs = isMultiSubject ? FULL_TEST_SUBJECTS : [subject]
    for (const sub of subs) {
      const items = questions.map((q, i) => ({ q, i })).filter(({ q }) => isMultiSubject ? q.subject === sub : true)
      let score = 0, max = 0, correct = 0, wrong = 0, unattempted = 0
      items.forEach(({ q, i }) => {
        const r = results.responses[i]
        if (!r) return
        if (r.unattempted) unattempted++
        else if (r.isCorrect) correct++
        else wrong++
        score += r.marksAwarded
        const sec = SECTIONS.find(s => s.id === q._section)
        max += sec?.full ?? q.points ?? 3
      })
      stats[sub] = { score, max, correct, wrong, unattempted, total: items.length }
    }
    return stats
  }, [questions, results, subject, isMultiSubject])

  const isSubjectView = selectedView !== 'overview'
  const stats = isSubjectView ? subjectStats[selectedView] : null
  const displayScore = isSubjectView ? (stats?.score ?? 0) : results.score
  const displayMax   = isSubjectView ? (stats?.max ?? 60) : results.maxScore
  const displayCorrect = isSubjectView ? (stats?.correct ?? 0) : results.correctAnswers
  const displayWrong   = isSubjectView ? (stats?.wrong ?? 0) : results.wrongAnswers
  const displayUnattempted = isSubjectView ? (stats?.unattempted ?? 0) : results.unattempted

  const cardGradient = isSubjectView
    ? (SUBJECT_GRADIENT[selectedView] || 'linear-gradient(135deg,#6c757d,#495057)')
    : (SUBJECT_STYLE[subject]?.gradient || 'linear-gradient(135deg,#f7931e,#f7c59f)')

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'14px 24px', display:'flex', alignItems:'center', gap:16 }}>
        <Link to="/courses/jee" style={{ color:'#495057', fontSize:'1.3rem', textDecoration:'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: JEE ADVANCED</span>
          {isPaper && <span className="ms-2 text-muted fw-normal">— Paper {paperNum}</span>}
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize:'0.75rem' }}>JEE (Advanced)</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onReview}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {/* Overview */}
              <button onClick={() => setSelectedView('overview')}
                className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                style={{ background: selectedView === 'overview' ? '#f0f4ff' : '#fff', borderBottom: '1px solid #e9ecef', cursor:'pointer' }}>
                <span style={{ borderLeft: selectedView === 'overview' ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft: 10, fontWeight: selectedView === 'overview' ? 600 : 400, color: selectedView === 'overview' ? '#0d6efd' : '#212529' }}>
                  Overview
                </span>
                {selectedView === 'overview' && <span style={{ width:8, height:8, borderRadius:'50%', background:'#0d6efd', display:'inline-block' }} />}
              </button>

              {/* Subjects (multi-subject modes) */}
              {isMultiSubject && (
                <>
                  <button onClick={() => setSubjectsOpen(o => !o)}
                    className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                    style={{ background:'#fff', borderBottom:'1px solid #e9ecef', cursor:'pointer' }}>
                    <span style={{ paddingLeft: 10 }}>Subjects</span>
                    <i className={`bi bi-chevron-${subjectsOpen ? 'up' : 'down'} text-muted`} style={{ fontSize:'0.8rem' }} />
                  </button>
                  {subjectsOpen && FULL_TEST_SUBJECTS.map(sub => (
                    <button key={sub} onClick={() => setSelectedView(sub)}
                      className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                      style={{ background: selectedView === sub ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor:'pointer' }}>
                      <span style={{ borderLeft: selectedView === sub ? `3px solid ${SUBJECT_COLOR[sub]}` : '3px solid transparent', paddingLeft: 10, color: selectedView === sub ? SUBJECT_COLOR[sub] : '#495057', fontWeight: selectedView === sub ? 600 : 400, fontSize:'0.95rem' }}>
                        {sub}
                      </span>
                      {selectedView === sub && <span style={{ width:8, height:8, borderRadius:'50%', background:SUBJECT_COLOR[sub], display:'inline-block' }} />}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="d-flex flex-column gap-2 mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1" />Retake
              </button>
              <Link to="/courses/jee" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-house me-1" />JEE Home
              </Link>
            </div>
          </div>

          {/* Main */}
          <div className="col-md-9">
            {/* Score card */}
            <div className="text-white mb-4" style={{ background: cardGradient, borderRadius: 16, padding: '32px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
              <div style={{ position:'absolute', right:60, bottom:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
              <h5 className="fw-bold mb-4" style={{ opacity:0.95 }}>
                {isSubjectView ? `${selectedView} Report` : isPaper ? `Paper ${paperNum}` : 'Overall'}
              </h5>
              <div className="text-center">
                <div style={{ width:150, height:150, borderRadius:'50%', border:'5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.12)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <span style={{ fontSize:36, fontWeight:700, lineHeight:1 }}>{displayScore}</span>
                  <div style={{ width:'55%', height:2, background:'rgba(255,255,255,0.55)', margin:'6px 0' }} />
                  <span style={{ fontSize:22, opacity:0.9 }}>{displayMax}</span>
                </div>
                <div style={{ opacity:0.85, fontSize:'0.9rem' }}>
                  Time taken: {Math.floor(results.totalTime / 60)}m {results.totalTime % 60}s
                </div>
              </div>
            </div>

            {/* Subject cards row — overview multi-subject only */}
            {!isSubjectView && isMultiSubject && (
              <div className="row g-3 mb-4">
                {FULL_TEST_SUBJECTS.map(sub => {
                  const st = subjectStats[sub]
                  if (!st) return null
                  return (
                    <div key={sub} className="col-md-4">
                      <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius:12, cursor:'pointer' }}
                        onClick={() => { setSubjectsOpen(true); setSelectedView(sub) }}>
                        <div style={{ height:4, background:SUBJECT_GRADIENT[sub], borderRadius:'12px 12px 0 0' }} />
                        <div className="card-body py-3">
                          <div className="fw-bold mb-1" style={{ color: SUBJECT_COLOR[sub] }}>{sub}</div>
                          <div style={{ fontSize:'1.6rem', fontWeight:700, color: st.score < 0 ? '#dc3545' : '#212529' }}>{st.score}</div>
                          <div className="text-muted" style={{ fontSize:'0.82rem' }}>/ {st.max}</div>
                          <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize:'0.75rem' }}>
                            <span className="text-success">{st.correct}✓</span>
                            <span className="text-danger">{st.wrong}✗</span>
                            <span className="text-muted">{st.unattempted}—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Marks Summary */}
            <div className="card border-0 shadow-sm" style={{ borderRadius:12 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Marks Summary</h5>
                <p className="text-muted small mb-4">
                  You've answered {Math.round(displayCorrect / (displayCorrect + displayWrong + displayUnattempted || 1) * 100)}% questions correctly
                </p>
                <div className="row g-3 text-center">
                  {[
                    { label:'Correct',    count: displayCorrect,     color:'#28a745', bg:'#d4edda', icon:'bi-check-circle-fill' },
                    { label:'Incorrect',  count: displayWrong,       color:'#dc3545', bg:'#f8d7da', icon:'bi-x-circle-fill' },
                    { label:'Unattempted',count: displayUnattempted, color:'#6c757d', bg:'#e9ecef', icon:'bi-dash-circle-fill' },
                  ].map(({ label, count, color, bg, icon }) => (
                    <div key={label} className="col-4">
                      <div style={{ background: bg, borderRadius: 12, padding: '20px 8px' }}>
                        <i className={`bi ${icon} mb-2`} style={{ fontSize:'1.5rem', color }} />
                        <div style={{ fontSize:'2rem', fontWeight:700, color }}>{count}</div>
                        <div className="text-muted" style={{ fontSize:'0.78rem' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Answers Page ──────────────────────────────────────────────────────
const ReviewAnswersPage = ({ questions, answers, results, subject, onBack }) => {
  const [subjectFilter, setSubjectFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) typesetEl(ref.current) }, [expandedIdx])

  const isMultiSubject = [...new Set(questions.map(q => q.subject).filter(Boolean))].length > 1
  const counts = {
    all:         questions.length,
    correct:     results.responses.filter(r => r?.isCorrect).length,
    incorrect:   results.responses.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: results.responses.filter(r => r?.unattempted).length,
  }

  const filtered = questions.map((q, i) => ({ q, i, res: results.responses[i] })).filter(({ q, res }) => {
    if (subjectFilter && q.subject !== subjectFilter) return false
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
        <strong>Review Answers</strong>
      </div>

      {/* Subject chips */}
      {isMultiSubject && (
        <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'10px 24px' }}>
          <div className="d-flex gap-2 flex-wrap">
            {FULL_TEST_SUBJECTS.map(sub => (
              <button key={sub} onClick={() => setSubjectFilter(subjectFilter === sub ? null : sub)}
                style={{ padding:'4px 14px', borderRadius:20, border:'1px solid', cursor:'pointer', fontWeight:500, fontSize:'0.88rem',
                  borderColor: subjectFilter === sub ? SUBJECT_COLOR[sub] : '#ced4da',
                  background: subjectFilter === sub ? SUBJECT_COLOR[sub] : '#fff',
                  color: subjectFilter === sub ? '#fff' : '#495057',
                }}>
                {sub} {subjectFilter === sub && '×'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        <div className="row g-4">
          {/* Status sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:'hidden' }}>
              {[
                { key:'all',         label:`All(${counts.all})` },
                { key:'incorrect',   label:`Incorrect(${counts.incorrect})` },
                { key:'unattempted', label:`Unattempted(${counts.unattempted})` },
                { key:'correct',     label:`Correct(${counts.correct})` },
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
                  const sec = q._section ? SECTIONS.find(s => s.id === q._section) : null
                  const isOpen = expandedIdx === i
                  const statusColor = res?.unattempted ? '#6c757d' : res?.isCorrect ? '#28a745' : '#dc3545'
                  const statusLabel = res?.unattempted ? 'UNATTEMPTED' : res?.isCorrect ? 'CORRECT' : 'INCORRECT'
                  const marksLabel  = res?.unattempted ? 'N/A' : res?.marksAwarded > 0 ? `+${res.marksAwarded}` : String(res?.marksAwarded ?? 0)

                  return (
                    <div key={i} className="card border-0 shadow-sm mb-3" style={{ borderRadius:12 }}>
                      {/* Top strip */}
                      <div style={{ padding:'10px 16px', borderBottom:'1px solid #e9ecef', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color: statusColor, fontWeight:600, fontSize:'0.82rem' }}>
                          ⊙ CORRECT: {res?.unattempted ? 'N/A' : (res?.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted" style={{ fontSize:'0.8rem' }}>⏱ YOUR TIME: N/A</span>
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize:'0.8rem' }} />
                        </div>
                      </div>

                      <div className="card-body">
                        {/* Q number + badges */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width:8, height:8, borderRadius:'50%', background: statusColor, display:'inline-block' }} />
                          {q.difficulty && <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`} style={{ fontSize:'0.7rem', textTransform:'uppercase' }}>{q.difficulty}</span>}
                          {sec && <span className="badge bg-secondary" style={{ fontSize:'0.7rem' }}>{sec.label}</span>}
                          {isMultiSubject && q.subject && <span className="badge" style={{ background: SUBJECT_COLOR[q.subject], fontSize:'0.7rem' }}>{q.subject}</span>}
                          <span className="ms-auto fw-bold" style={{ color: statusColor }}>{marksLabel}</span>
                        </div>

                        {/* Topic / Subtopic */}
                        {q.topic && <p className="text-muted small mb-2">{q.topic}{q.subtopic ? ` › ${q.subtopic}` : ''}</p>}

                        {/* Question text */}
                        <div style={{ cursor:'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize:'0.93rem', lineHeight:1.6 }}>
                                {(() => { const t = stripLatex(q.question_text); return t.length > 220 ? t.slice(0,220)+'…' : t })()}
                              </p>
                          }
                        </div>

                        {/* Expanded answers */}
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
                                      <span style={{ fontSize:'0.9rem' }}>{opt.text}</span>
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
const JEEQuiz = () => {
  const { subject } = useParams()
  const navigate    = useNavigate()
  const isFull   = subject === 'Full'
  const isPaper  = subject === 'Paper1' || subject === 'Paper2'
  const paperNum = isPaper ? parseInt(subject.replace('Paper', '')) : null
  const showTimer = isPaper

  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [phase, setPhase]         = useState('quiz')   // 'quiz' | 'results' | 'review'
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [tabWarning, setTabWarning] = useState(false)
  const [paperMap, setPaperMap]         = useState(null)
  const [timeLeft, setTimeLeft]         = useState(null)
  const [activeNavSubject, setActiveNavSubject] = useState(FULL_TEST_SUBJECTS[0])

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const userRef          = useRef(null)
  const questionRef      = useRef(null)
  const handleSubmitRef  = useRef(null)

  const style = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics

  const currentPaper = useMemo(() => {
    if (!isFull || !paperMap) return 1
    const p2Start = paperMap[2]?.[FULL_TEST_SUBJECTS[0]]?.start ?? Infinity
    return currentIndex >= p2Start ? 2 : 1
  }, [currentIndex, isFull, paperMap])

  useEffect(() => { loadMathJax() }, [])
  useEffect(() => { if (questionRef.current) typesetEl(questionRef.current) }, [currentIndex, questions])
  useEffect(() => { checkAuth() }, [])

  // Tab-switch
  useEffect(() => {
    if (phase !== 'quiz' || loading) return
    const onBlur  = () => setTabWarning(true)
    const onFocus = () => setTabWarning(false)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus) }
  }, [phase, loading])

  // Sync activeNavSubject when currentIndex crosses a subject boundary
  useEffect(() => {
    if ((!isPaper && !isFull) || !paperMap) return
    const pKey = isPaper ? 1 : currentPaper
    for (const sub of FULL_TEST_SUBJECTS) {
      const info = paperMap[pKey]?.[sub]
      if (info && currentIndex >= info.start && currentIndex < info.start + info.count) {
        setActiveNavSubject(sub)
        break
      }
    }
  }, [currentIndex, paperMap, isPaper, isFull, currentPaper])

  // Timer countdown
  useEffect(() => {
    if (!showTimer || phase !== 'quiz' || timeLeft === null || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, showTimer, phase])

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (showTimer && timeLeft === 0 && phase === 'quiz') {
      handleSubmitRef.current?.(true)
    }
  }, [timeLeft, showTimer, phase])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) { userRef.current = res.data; fetchQuestions() }
      else navigate('/login', { replace: true })
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchQuestions = async () => {
    try {
      if (isPaper || isFull) {
        const responses = await Promise.all(
          FULL_TEST_SUBJECTS.map(sub =>
            axios.get(`${API_URL}/api/jee_questions?subject=${encodeURIComponent(sub)}`, { withCredentials: true })
          )
        )
        const allQs = []
        const map   = {}
        const papers = isFull ? [1, 2] : [1]

        for (const paper of papers) {
          map[paper] = {}
          for (let si = 0; si < FULL_TEST_SUBJECTS.length; si++) {
            const sub  = FULL_TEST_SUBJECTS[si]
            const pool = shuffle(responses[si].data || [])
            const usedIds = new Set(allQs.filter(q => q.subject === sub).map(q => String(q._id)))
            const fresh   = pool.filter(q => !usedIds.has(String(q._id)))
            const work    = fresh.length >= 17 ? fresh : pool
            const sectionQs = selectBySection(work)
            const start = allQs.length
            sectionQs.forEach(q => allQs.push({ ...q, subject: sub, _paper: paper }))
            map[paper][sub] = { start, count: sectionQs.length }
          }
        }
        if (!allQs.length) { setError('No questions found.'); setLoading(false); return }
        setQuestions(allQs)
        setPaperMap(map)
        if (showTimer) setTimeLeft(TIMER_SECS)
        return
      }

      // Single subject
      const res = await axios.get(`${API_URL}/api/jee_questions?subject=${encodeURIComponent(subject)}`, { withCredentials: true })
      const qs  = Array.isArray(res.data) ? res.data : []
      if (!qs.length) { setError(`No questions found for ${subject}.`); setLoading(false); return }
      setQuestions(selectBySection(qs))
    } catch { setError('Failed to load questions. Please try again.') }
    finally   { setLoading(false) }
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))
  const toggleMSQ = (idx, optId) => setAnswers(prev => {
    const cur = Array.isArray(prev[idx]) ? prev[idx] : []
    return { ...prev, [idx]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
  })
  const recordTime = () => {
    timesRef.current[currentIndex] = Math.round((Date.now() - questionStartRef.current) / 1000)
    questionStartRef.current = Date.now()
  }
  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }
  const goToPaper  = (p) => { if (!paperMap) return; goTo(paperMap[p]?.[FULL_TEST_SUBJECTS[0]]?.start ?? 0) }
  const goToSubject = (sub) => { if (!paperMap) return; const idx = paperMap[currentPaper]?.[sub]?.start; if (idx !== undefined) goTo(idx) }
  const goToSection = (secId) => { const idx = questions.findIndex(q => q._section === secId); if (idx >= 0) goTo(idx) }

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_, i) => { const a = answers[i]; return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length) }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()
    let correct = 0, wrong = 0, unattempted = 0, totalScore = 0
    const maxScore  = questions.reduce((s, q) => { const sec = SECTIONS.find(s => s.id === q._section); return s + (sec?.full ?? q.points ?? 3) }, 0)
    const responses = []
    questions.forEach((q, i) => {
      const { isCorrect, marksAwarded, unattempted: ua } = calcMarks(q, answers[i])
      if (ua) unattempted++
      else if (isCorrect) correct++
      else wrong++
      totalScore += marksAwarded
      responses.push({ questionId: q._id, questionText: q.question_text, userResponse: answers[i] ?? null, correctAnswer: q.correct_answer, isCorrect, marksAwarded, unattempted: !!ua })
    })
    const totalTime  = Object.values(timesRef.current).reduce((a, b) => a + b, 0)
    const percentage = maxScore > 0 ? Math.round(Math.max(0, totalScore / maxScore) * 100) : 0
    setResults({ correctAnswers: correct, wrongAnswers: wrong, unattempted, score: totalScore, maxScore, percentage, totalTime, responses })
    setPhase('results')

    // Save scores
    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      if (isPaper || isFull) {
        await Promise.all(FULL_TEST_SUBJECTS.map(async (sub) => {
          const subQs = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.subject === sub)
          if (!subQs.length) return
          let sc = 0, sw = 0, su = 0, ss = 0, sm = 0; const sr = []
          subQs.forEach(({ q, i }) => {
            const r = responses[i]
            if (r.unattempted) su++; else if (r.isCorrect) sc++; else sw++
            ss += r.marksAwarded
            const sec = SECTIONS.find(s => s.id === q._section)
            sm += sec?.full ?? q.points ?? 3
            sr.push(r)
          })
          await axios.post(`${API_URL}/api/jee_scores`, { email: u.email, name: u.username || u.name || u.email, subject: sub, totalQuestions: subQs.length, correctAnswers: sc, wrongAnswers: sw, unattempted: su, score: ss, maxScore: sm, responses: sr }, { withCredentials: true })
        }))
      } else {
        await axios.post(`${API_URL}/api/jee_scores`, { email: u.email, name: u.username || u.name || u.email, subject, totalQuestions: questions.length, correctAnswers: correct, wrongAnswers: wrong, unattempted, score: totalScore, maxScore, responses }, { withCredentials: true })
      }
    } catch (e) { console.error('Failed to save score:', e) }
    finally { setSaving(false) }
  }

  handleSubmitRef.current = handleSubmit

  const handleRetake = () => {
    setAnswers({}); setPhase('quiz'); setResults(null)
    setCurrentIndex(0); timesRef.current = {}; setPaperMap(null); setTimeLeft(null); setActiveNavSubject(FULL_TEST_SUBJECTS[0])
    setLoading(true); fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height:'60vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{ color: style.badge }} role="status" />
        <p className="text-muted">Loading {isPaper ? `Paper ${paperNum}` : isFull ? 'Full Test' : subject} questions…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger" />
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={fetchQuestions}>Retry</button>
      <Link to="/courses/jee" className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (phase === 'results' && results) return (
    <ResultsPage questions={questions} answers={answers} results={results} subject={subject}
      isPaper={isPaper} paperNum={paperNum}
      onRetake={handleRetake} onReview={() => setPhase('review')} />
  )

  if (phase === 'review' && results) return (
    <ReviewAnswersPage questions={questions} answers={answers} results={results} subject={subject}
      onBack={() => setPhase('results')} />
  )

  // ── Quiz UI ─────────────────────────────────────────────────────────────────
  const q       = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered   = userAns !== undefined && userAns !== null && userAns !== '' && !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_, i) => { const a = answers[i]; return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length) }).length
  const currentSection = q?._section ? SECTIONS.find(s => s.id === q._section) : null
  const accentColor    = (isPaper || isFull) ? (SUBJECT_COLOR[q?.subject] || style.badge) : style.badge

  // Navigator shows only the active subject's questions (17) for Paper/Full modes
  const navItems = (isFull || isPaper) && paperMap
    ? (() => {
        const pKey = isPaper ? 1 : currentPaper
        const info = paperMap[pKey]?.[activeNavSubject]
        if (!info) return []
        return Array.from({ length: info.count }, (_, i) => ({
          globalIdx: info.start + i,
          displayNum: i + 1,
        }))
      })()
    : questions.map((_, gi) => ({ globalIdx: gi, displayNum: gi + 1 }))

  return (
    <main className="main">
      {/* Timer badge */}
      {showTimer && timeLeft !== null && (
        <div style={{ position:'fixed', top:0, right:0, zIndex:9999, background: timeLeft < 600 ? '#dc3545' : '#198754', color:'#fff', padding:'6px 16px', fontWeight:700, fontSize:'1rem', borderRadius:'0 0 0 10px' }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      )}

      {/* Tab warning */}
      {tabWarning && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:10000, background:'#dc3545', color:'#fff', textAlign:'center', padding:'8px', fontWeight:600 }}>
          ⚠️ Tab switching detected!
          <button onClick={() => setTabWarning(false)} style={{ marginLeft:16, background:'none', border:'1px solid #fff', color:'#fff', borderRadius:4, padding:'2px 10px', cursor:'pointer' }}>Dismiss</button>
        </div>
      )}

      <div className="page-title" data-aos="fade" style={{ marginBottom:'2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>JEE Advanced — {isPaper ? `Paper ${paperNum}` : isFull ? 'Full Test' : subject}</h1>
              <p className="mb-0">
                {isPaper || isFull
                  ? `${isPaper ? '51' : '102'} questions · 3 subjects · Section I–IV · 60 marks per subject`
                  : 'Section I–IV · 17 questions · 60 marks'}
              </p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/jee">JEE Advanced</Link></li>
          <li className="current">{isPaper ? `Paper ${paperNum}` : isFull ? 'Full Test' : subject}</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5" ref={questionRef}>
        <div className="row g-4">
          {/* Question panel */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ height:5, background: (isFull || isPaper) ? accentColor : style.gradient }} />
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <span className="text-muted small d-flex align-items-center gap-2">
                    {(isFull || isPaper) && <>
                      <span className="badge bg-dark">Paper {q?._paper ?? paperNum}</span>
                      <strong style={{ color: accentColor }}>{q?.subject}</strong>·
                    </>}
                    Q {currentIndex + 1} / {questions.length}
                  </span>
                  <div className="d-flex gap-2 flex-wrap">
                    {currentSection && <span className="badge bg-secondary">{currentSection.label} — {currentSection.type}</span>}
                    <span className={`badge ${isAnswered ? 'bg-success' : 'bg-secondary'}`}>{isAnswered ? 'Answered' : 'Not answered'}</span>
                    {q?.difficulty && <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`}>{q.difficulty}</span>}
                    {currentSection && <span className="badge bg-light text-dark border">+{currentSection.full}{currentSection.neg < 0 ? ` / ${currentSection.neg}` : ' / 0'}</span>}
                  </div>
                </div>

                <div className="progress mb-4" style={{ height:5 }}>
                  <div className="progress-bar" style={{ width:`${((currentIndex+1)/questions.length)*100}%`, background:(isFull||isPaper)?accentColor:style.gradient }} />
                </div>

                <QuestionContent q={q} />

                {/* MCQ */}
                {resolveType(q) === 'multiple_choice' && (
                  <div>
                    {(Array.isArray(q.options) && q.options.length > 0 ? q.options : Object.keys(q.option_images||{}).sort().map(id=>({option_id:id,text:''}))).map((opt,oi) => {
                      const selected = String(userAns??'') === opt.option_id
                      return (
                        <div key={oi} onClick={() => setAnswer(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected?'border-primary bg-primary bg-opacity-10':''}`}
                          style={{ cursor:'pointer', transition:'all 0.15s' }}>
                          <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2, border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`, background:selected?'#0d6efd':'transparent' }} />
                          <div>
                            <span className="fw-semibold me-2">{opt.option_id}.</span>
                            {opt.text && <span style={{ fontSize:'0.95rem' }}>{opt.text}</span>}
                            {q.option_images?.[opt.option_id] && <div className="mt-2"><img src={imgSrc(q.option_images[opt.option_id])} alt={`Option ${opt.option_id}`} style={{ maxWidth:280, borderRadius:6, border:'1px solid #dee2e6' }} onError={e=>e.target.style.display='none'} /></div>}
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
                    {q.options.map((opt,oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt.option_id)
                      return (
                        <div key={oi} onClick={() => toggleMSQ(currentIndex, opt.option_id)}
                          className={`d-flex align-items-start gap-3 mb-2 p-3 rounded border ${selected?'border-primary bg-primary bg-opacity-10':''}`}
                          style={{ cursor:'pointer', transition:'all 0.15s' }}>
                          <div style={{ width:20, height:20, borderRadius:4, flexShrink:0, marginTop:2, border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`, background:selected?'#0d6efd':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {selected && <i className="bi bi-check text-white" style={{ fontSize:12 }} />}
                          </div>
                          <div><span className="fw-semibold me-2">{opt.option_id}.</span><span style={{ fontSize:'0.95rem' }}>{opt.text}</span></div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Numeric */}
                {resolveType(q) === 'numeric' && (
                  <div>
                    <p className="text-muted small mb-2">Enter your numeric answer{q.correct_answer!==null&&typeof q.correct_answer==='object'&&'min' in q.correct_answer?' (accepted within a range)':''}</p>
                    <input type="number" step="any" className="form-control form-control-lg" placeholder="Enter answer…" value={userAns??''} onChange={e=>setAnswer(currentIndex,e.target.value)} style={{ maxWidth:260, fontFamily:'monospace', fontSize:'1.1rem' }} />
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => goTo(currentIndex-1)} disabled={currentIndex===0}><i className="bi bi-arrow-left me-1" />Prev</button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length-1
                    ? <button className="btn btn-primary" onClick={() => goTo(currentIndex+1)}>Next<i className="bi bi-arrow-right ms-1" /></button>
                    : <button className="btn btn-success" onClick={() => handleSubmit(false)} disabled={saving}>{saving?<><span className="spinner-border spinner-border-sm me-2" />Saving…</>:<><i className="bi bi-check-lg me-1" />Submit</>}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            {/* Paper tabs (Full Test only) */}
            {isFull && (
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
                <div className="card-body p-3">
                  <h6 className="fw-bold mb-2">Paper</h6>
                  <div className="d-flex gap-2">
                    {[1,2].map(p => {
                      const total = paperMap ? FULL_TEST_SUBJECTS.reduce((s,sub)=>s+(paperMap[p]?.[sub]?.count??0),0) : 51
                      const done  = paperMap ? FULL_TEST_SUBJECTS.reduce((s,sub) => {
                        const info=paperMap[p]?.[sub]; if(!info)return s
                        return s+Array.from({length:info.count},(_,i)=>info.start+i).filter(gi=>{const a=answers[gi];return a!==undefined&&a!==null&&a!==''&&!(Array.isArray(a)&&!a.length)}).length
                      },0) : 0
                      return (
                        <button key={p} onClick={() => goToPaper(p)}
                          className={`btn btn-sm flex-fill ${currentPaper===p?'btn-dark':'btn-outline-dark'}`}>
                          Paper {p} <span style={{ fontSize:'0.7rem', opacity:0.75 }}>({done}/{total})</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Subject nav (Paper/Full) or Section nav (single subject) */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                {(isPaper || isFull) ? (
                  <>
                    <h6 className="fw-bold mb-2">Subject {isFull ? `— Paper ${currentPaper}` : ''}</h6>
                    <div className="d-flex flex-column gap-2">
                      {FULL_TEST_SUBJECTS.map(sub => {
                        const info = paperMap?.[isPaper ? 1 : currentPaper]?.[sub]
                        const done = info ? Array.from({length:info.count},(_,i)=>info.start+i).filter(gi=>{const a=answers[gi];return a!==undefined&&a!==null&&a!==''&&!(Array.isArray(a)&&!a.length)}).length : 0
                        const isCur = q?.subject===sub && (isFull ? q?._paper===currentPaper : true)
                        return (
                          <button key={sub} onClick={() => { setActiveNavSubject(sub); isPaper ? goTo(info?.start??0) : goToSubject(sub) }}
                            className={`btn btn-sm text-start ${isCur?'btn-primary':'btn-outline-secondary'}`} style={{ borderRadius:8 }}>
                            <span style={{ color:isCur?'#fff':SUBJECT_COLOR[sub], fontWeight:600 }}>{sub}</span>
                            <span className="float-end" style={{ fontSize:'0.75rem', opacity:0.75 }}>{done}/{info?.count??17}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <h6 className="fw-bold mb-2">Jump to Section</h6>
                    <div className="d-flex flex-column gap-1">
                      {SECTIONS.map(sec => {
                        const start = questions.findIndex(qq => qq._section===sec.id)
                        const secQs = questions.filter(qq => qq._section===sec.id)
                        const done  = secQs.filter((_,i) => { const gi=start+i; const a=answers[gi]; return a!==undefined&&a!==null&&a!==''&&!(Array.isArray(a)&&!a.length) }).length
                        return (
                          <button key={sec.id} onClick={() => goToSection(sec.id)} disabled={start<0}
                            className={`btn btn-sm text-start ${q?._section===sec.id?'btn-primary':'btn-outline-secondary'}`} style={{ borderRadius:8, fontSize:'0.82rem' }}>
                            <span className="fw-semibold">{sec.label} ({sec.type})</span>
                            <span className="float-end" style={{ fontSize:'0.72rem', opacity:0.75 }}>{done}/{secQs.length} · +{sec.full}{sec.neg<0?`/${sec.neg}`:'/0'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Question navigator */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">
                  {(isFull || isPaper) ? `${activeNavSubject} — Q1–${navItems.length}` : 'Question Navigator'}
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {navItems.map(({ globalIdx, displayNum }) => {
                    const a    = answers[globalIdx]
                    const done = a!==undefined&&a!==null&&a!==''&&!(Array.isArray(a)&&!a.length)
                    const isCur = globalIdx===currentIndex
                    const navQ  = questions[globalIdx]
                    return (
                      <button key={globalIdx} onClick={() => goTo(globalIdx)}
                        className={`btn btn-sm ${isCur?'btn-primary':done?'btn-success':'btn-outline-secondary'}`}
                        style={{ width:36, height:36, padding:0, fontWeight:600 }}
                        title={`${navQ?.subject||''} §${navQ?._section||''}`}>
                        {displayNum}
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

            {/* Marking scheme */}
            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:16 }}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">Marking Scheme</h6>
                <div className="d-flex flex-column gap-1" style={{ fontSize:'0.82rem' }}>
                  {SECTIONS.map(sec => (
                    <div key={sec.id} className="px-2 py-1 rounded" style={{ background:q?._section===sec.id?'#f0f4ff':'transparent', border:q?._section===sec.id?'1px solid #b8d4f5':'1px solid transparent', borderRadius:6 }}>
                      <div className="fw-semibold" style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.04em', color:'#6c757d' }}>{sec.label} — {sec.type}</div>
                      <div><span className="text-success">+{sec.full} correct</span>{sec.neg<0?<span className="text-danger ms-2">{sec.neg} wrong</span>:<span className="text-secondary ms-2">0 wrong</span>}<span className="text-secondary ms-2">· 0 skip</span></div>
                    </div>
                  ))}
                  <div className="text-muted mt-1 px-2" style={{ fontSize:'0.72rem' }}>* Sec II partial: +1/+2/+3 when no wrong option</div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="card border-0 shadow-sm" style={{ borderRadius:16 }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button className="btn btn-success w-100" onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving?<><span className="spinner-border spinner-border-sm me-2" />Saving…</>:<><i className="bi bi-check-lg me-1" />Submit Quiz</>}
                </button>
                <Link to="/courses/jee" className="btn btn-outline-secondary w-100 mt-2 btn-sm"><i className="bi bi-arrow-left me-1" />Exit</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default JEEQuiz
