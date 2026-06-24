import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const FULL_TEST_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics']

const SUBJECT_COLOR = {
  Physics:     '#0d6efd',
  Chemistry:   '#198754',
  Mathematics: '#dc3545',
}
const SUBJECT_GRADIENT = {
  Physics:     'linear-gradient(135deg,#0d6efd,#6610f2)',
  Chemistry:   'linear-gradient(135deg,#198754,#20c997)',
  Mathematics: 'linear-gradient(135deg,#dc3545,#fd7e14)',
}
const SUBJECT_ICON = {
  Physics:     'bi-lightning-charge-fill',
  Chemistry:   'bi-eyedropper',
  Mathematics: 'bi-calculator-fill',
}

const imgSrc = f => f ? `/img/Graph_questions/${f}` : null

// ─── MathJax ─────────────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax?.typesetPromise) return
  if (window._mjLoading) return
  window._mjLoading = true
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

function resolveType(q) {
  if (q.type === 'integer') return 'numeric'
  const hasOpts = Array.isArray(q.options) && q.options.length > 0
  const hasImgOpts = q.option_images && Object.keys(q.option_images).length > 0
  if (!hasOpts && !hasImgOpts) return 'numeric'
  return q.type || 'multiple_choice'
}

function parseExamLabel(year) {
  if (!year && year !== 0) return { date: 'N/A', shift: null }
  const s = String(year)
  const m = s.match(/(Morning|Afternoon|Evening|Night)\s+Shift/i)
  if (m) {
    const shift = m[0]
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

// ─── QuestionContent ──────────────────────────────────────────────────────────
function renderTextWithStructures(text) {
  if (!text || !text.includes('(structure)')) return text
  return text.split('(structure)').map((part, i, arr) => (
    <React.Fragment key={i}>
      {part}
      {i < arr.length - 1 && (
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

function QuestionContent({ q }) {
  const parsed = parseMatchingLists(q.question_text)
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
const ResultsPage = ({ results, enriched, year, paper, onReview, allAttempts, activeAttemptId, onSwitchAttempt }) => {
  const [selectedView, setSelectedView] = useState('overview')
  const [subjectsOpen, setSubjectsOpen] = useState(false)

  const subjectStats = {}
  for (const sub of FULL_TEST_SUBJECTS) {
    const ss = results.subjectScores?.[sub] || {}
    subjectStats[sub] = {
      score:       ss.score ?? 0,
      max:         ss.maxScore ?? 0,
      correct:     ss.correctAnswers ?? 0,
      wrong:       ss.wrongAnswers ?? 0,
      unattempted: ss.unattempted ?? 0,
      total:       ss.totalQuestions ?? 0,
    }
  }

  const { date, shift } = parseExamLabel(year)
  const displayPaper    = formatDisplayPaper(paper)

  const isSubjectView      = selectedView !== 'overview'
  const stats              = isSubjectView ? subjectStats[selectedView] : null
  const displayScore       = isSubjectView ? (stats?.score ?? 0) : results.score
  const displayMax         = isSubjectView ? (stats?.max ?? 0) : results.maxScore
  const displayCorrect     = isSubjectView ? (stats?.correct ?? 0) : results.correctAnswers
  const displayWrong       = isSubjectView ? (stats?.wrong ?? 0) : results.wrongAnswers
  const displayUnattempted = isSubjectView ? (stats?.unattempted ?? 0) : results.unattempted
  const total              = displayCorrect + displayWrong + displayUnattempted || 1

  const cardGradient = isSubjectView
    ? (SUBJECT_GRADIENT[selectedView] || 'linear-gradient(135deg,#6c757d,#495057)')
    : 'linear-gradient(135deg,#5fcf80,#37423b)'

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'14px 24px', display:'flex', alignItems:'center', gap:16 }}>
        <Link to="/courses/jee-main" style={{ color:'#495057', fontSize:'1.3rem', textDecoration:'none' }}>←</Link>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: JEE MAIN</span>
          <span className="ms-2 text-muted fw-normal">— {date}{shift ? ` · ${shift}` : ''} · {displayPaper}</span>
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize:'0.75rem' }}>JEE (Main)</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onReview}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

      {/* Attempt switcher */}
      {allAttempts.length > 1 && (() => {
        const sorted = [...allAttempts].reverse() // oldest → newest
        const activeIdx = sorted.findIndex(a =>
          activeAttemptId ? a._id === activeAttemptId : false
        )
        const displayIdx = activeIdx >= 0 ? activeIdx : sorted.length - 1
        const active = sorted[displayIdx]
        const activePct = active.maxScore > 0 ? Math.round(Math.max(0, active.score) / active.maxScore * 100) : 0

        return (
          <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'10px 24px' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="text-muted" style={{ fontSize:'0.82rem', whiteSpace:'nowrap' }}>
                <i className="bi bi-clock-history me-1" />{allAttempts.length} attempts
              </span>

              <div style={{ position:'relative', minWidth:240 }}>
                <select
                  value={displayIdx}
                  onChange={e => onSwitchAttempt(sorted[Number(e.target.value)])}
                  style={{
                    appearance:'none', width:'100%', padding:'6px 36px 6px 12px',
                    borderRadius:10, border:'1.5px solid #ced4da', background:'#f8f9fa',
                    fontSize:'0.83rem', fontWeight:600, color:'#212529', cursor:'pointer',
                    outline:'none',
                  }}
                >
                  {sorted.map((a, i) => {
                    const d   = new Date(a.dateAttempted).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                    const pct = a.maxScore > 0 ? Math.round(Math.max(0, a.score) / a.maxScore * 100) : 0
                    return (
                      <option key={a._id || i} value={i}>
                        Attempt {i + 1} — {d} — {a.score}/{a.maxScore} ({pct}%)
                      </option>
                    )
                  })}
                </select>
                <i className="bi bi-chevron-down" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:'0.75rem', color:'#666' }} />
              </div>

              {/* Score pill for the active attempt */}
              <span className="badge px-3 py-2" style={{
                background: activePct >= 60 ? '#28a745' : activePct >= 35 ? '#ffc107' : '#dc3545',
                color: '#fff', borderRadius:20, fontSize:'0.78rem', fontWeight:700,
              }}>
                {active.score}/{active.maxScore} · {activePct}%
              </span>
            </div>
          </div>
        )
      })()}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:'hidden' }}>
              <button onClick={() => setSelectedView('overview')}
                className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                style={{ background: selectedView === 'overview' ? '#f0f4ff' : '#fff', borderBottom:'1px solid #e9ecef', cursor:'pointer' }}>
                <span style={{ borderLeft: selectedView === 'overview' ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft:10, fontWeight: selectedView === 'overview' ? 600 : 400, color: selectedView === 'overview' ? '#0d6efd' : '#212529' }}>
                  Overview
                </span>
                {selectedView === 'overview' && <span style={{ width:8, height:8, borderRadius:'50%', background:'#0d6efd', display:'inline-block' }} />}
              </button>

              <button onClick={() => setSubjectsOpen(o => !o)}
                className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                style={{ background:'#fff', borderBottom:'1px solid #e9ecef', cursor:'pointer' }}>
                <span style={{ paddingLeft:10 }}>Subjects</span>
                <i className={`bi bi-chevron-${subjectsOpen ? 'up' : 'down'} text-muted`} style={{ fontSize:'0.8rem' }} />
              </button>
              {subjectsOpen && FULL_TEST_SUBJECTS.map(sub => (
                <button key={sub} onClick={() => setSelectedView(sub)}
                  className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                  style={{ background: selectedView === sub ? '#f8f9fa' : '#fff', borderBottom:'1px solid #f0f0f0', cursor:'pointer' }}>
                  <span style={{ borderLeft: selectedView === sub ? `3px solid ${SUBJECT_COLOR[sub]}` : '3px solid transparent', paddingLeft:10, color: selectedView === sub ? SUBJECT_COLOR[sub] : '#495057', fontWeight: selectedView === sub ? 600 : 400, fontSize:'0.95rem' }}>
                    {sub}
                  </span>
                  {selectedView === sub && <span style={{ width:8, height:8, borderRadius:'50%', background: SUBJECT_COLOR[sub], display:'inline-block' }} />}
                </button>
              ))}
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <Link to="/courses/jee-main" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-house me-1" />JEE Main
              </Link>
            </div>
          </div>

          {/* Main */}
          <div className="col-md-9">
            {/* Score card */}
            <div className="text-white mb-4" style={{ background:cardGradient, borderRadius:16, padding:'32px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-30, top:-30, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
              <div style={{ position:'absolute', right:60, bottom:-40, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
              <h5 className="fw-bold mb-4" style={{ opacity:0.95 }}>
                {isSubjectView ? `${selectedView} Report` : 'Overall'}
              </h5>
              <div className="text-center">
                <div style={{ width:150, height:150, borderRadius:'50%', border:'5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.12)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <span style={{ fontSize:36, fontWeight:700, lineHeight:1 }}>{displayScore}</span>
                  <div style={{ width:'55%', height:2, background:'rgba(255,255,255,0.55)', margin:'6px 0' }} />
                  <span style={{ fontSize:22, opacity:0.9 }}>{displayMax}</span>
                </div>
                <div style={{ opacity:0.85, fontSize:'0.9rem' }}>
                  Time taken: {Math.floor((results.totalTimeTaken || 0) / 60)}m {(results.totalTimeTaken || 0) % 60}s
                </div>
              </div>
            </div>

            {/* Subject cards — overview only */}
            {!isSubjectView && (
              <div className="row g-3 mb-4">
                {FULL_TEST_SUBJECTS.map(sub => {
                  const st = subjectStats[sub]
                  return (
                    <div key={sub} className="col-md-4">
                      <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius:12, cursor:'pointer' }}
                        onClick={() => { setSubjectsOpen(true); setSelectedView(sub) }}>
                        <div style={{ height:4, background: SUBJECT_GRADIENT[sub], borderRadius:'12px 12px 0 0' }} />
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
                  You've answered {Math.round(displayCorrect / total * 100)}% questions correctly
                </p>
                <div className="row g-3 text-center">
                  {[
                    { label:'Correct',    count: displayCorrect,     color:'#28a745', bg:'#d4edda', icon:'bi-check-circle-fill' },
                    { label:'Incorrect',  count: displayWrong,       color:'#dc3545', bg:'#f8d7da', icon:'bi-x-circle-fill' },
                    { label:'Unattempted',count: displayUnattempted, color:'#6c757d', bg:'#e9ecef', icon:'bi-dash-circle-fill' },
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Answers Page ──────────────────────────────────────────────────────
const ReviewAnswersPage = ({ enriched, onBack }) => {
  const [subjectFilter, setSubjectFilter] = useState(null)
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [expandedIdx,   setExpandedIdx]   = useState(null)
  const ref = useRef(null)

  useEffect(() => { if (ref.current) typesetEl(ref.current) }, [expandedIdx])

  const counts = {
    all:         enriched.length,
    correct:     enriched.filter(r => r?.isCorrect).length,
    incorrect:   enriched.filter(r => r && !r.isCorrect && !r.unattempted).length,
    unattempted: enriched.filter(r => r?.unattempted).length,
  }

  const filtered = enriched.filter(r => {
    if (subjectFilter && r.subject !== subjectFilter) return false
    if (statusFilter === 'correct'     && !r?.isCorrect) return false
    if (statusFilter === 'incorrect'   && (r?.unattempted || r?.isCorrect)) return false
    if (statusFilter === 'unattempted' && !r?.unattempted) return false
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
      <div style={{ background:'#fff', borderBottom:'1px solid #e9ecef', padding:'10px 24px' }}>
        <div className="d-flex gap-2 flex-wrap">
          {FULL_TEST_SUBJECTS.map(sub => (
            <button key={sub} onClick={() => setSubjectFilter(subjectFilter === sub ? null : sub)}
              style={{ padding:'4px 14px', borderRadius:20, border:'1px solid', cursor:'pointer', fontWeight:500, fontSize:'0.88rem',
                borderColor: subjectFilter === sub ? SUBJECT_COLOR[sub] : '#ced4da',
                background:  subjectFilter === sub ? SUBJECT_COLOR[sub] : '#fff',
                color:       subjectFilter === sub ? '#fff' : '#495057',
              }}>
              {sub} {subjectFilter === sub && '×'}
            </button>
          ))}
        </div>
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
              : filtered.map((r, fi) => {
                  const q = r.questionData
                  const i = r.globalIndex
                  const isOpen = expandedIdx === i
                  const statusColor = r.unattempted ? '#6c757d' : r.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel = r.unattempted ? 'N/A' : r.marksAwarded > 0 ? `+${r.marksAwarded}` : String(r.marksAwarded ?? 0)

                  return (
                    <div key={fi} className="card border-0 shadow-sm mb-3" style={{ borderRadius:12 }}>
                      {/* Top strip */}
                      <div style={{ padding:'10px 16px', borderBottom:'1px solid #e9ecef', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
                        onClick={() => setExpandedIdx(isOpen ? null : i)}>
                        <span style={{ color:statusColor, fontWeight:600, fontSize:'0.82rem' }}>
                          ⊙ CORRECT: {r.unattempted ? 'N/A' : (r.isCorrect ? 'Yes' : 'No')} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge" style={{ background: SUBJECT_COLOR[r.subject] || '#6c757d', fontSize:'0.68rem' }}>{r.subject}</span>
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize:'0.8rem' }} />
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {i + 1}</span>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:statusColor, display:'inline-block' }} />
                          {q?.difficulty && <span className={`badge ${q.difficulty==='hard'?'bg-danger':q.difficulty==='medium'?'bg-warning text-dark':'bg-success'}`} style={{ fontSize:'0.7rem' }}>{q.difficulty}</span>}
                          <span className="ms-auto fw-bold" style={{ color:statusColor }}>{marksLabel}</span>
                        </div>

                        <div style={{ cursor:'pointer' }} onClick={() => setExpandedIdx(isOpen ? null : i)}>
                          {isOpen && q
                            ? <QuestionContent q={q} />
                            : <p className="text-muted mb-0" style={{ fontSize:'0.93rem', lineHeight:1.6 }}>
                                {(() => { const t = q?.question_text || '(Question not available)'; return t.length > 220 ? t.slice(0,220)+'…' : t })()}
                              </p>
                          }
                        </div>

                        {isOpen && q && (
                          <div className="mt-3">
                            {resolveType(q) === 'multiple_choice' && Array.isArray(q.options) && (
                              <div className="mb-3">
                                {q.options.map((opt, oi) => {
                                  const isCrr = String(q.correct_answer ?? '').trim() === opt.option_id
                                  const userPicked = String(r.userResponse ?? '').trim() === opt.option_id
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
                                  const userPicked = Array.isArray(r.userResponse) && r.userResponse.includes(opt.option_id)
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
                                <span className="badge bg-light text-dark border fs-6">Your answer: <strong>{r.userResponse ?? '(not answered)'}</strong></span>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const JEEMainAnalysis = () => {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [results,         setResults]         = useState(null)
  const [enriched,        setEnriched]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [phase,           setPhase]           = useState('results')
  const [allAttempts,     setAllAttempts]     = useState([])
  const [activeAttemptId, setActiveAttemptId] = useState(null)

  const questionsRef = useRef([])

  const buildEnriched = (responseList, questionList) => {
    const qMap = {}
    questionList.forEach(q => { qMap[String(q._id)] = q })
    return responseList.map((r, i) => ({
      ...r,
      questionData: qMap[String(r.questionId)] || questionList[i] || null,
      globalIndex:  i,
    }))
  }

  const switchAttempt = (attempt) => {
    setActiveAttemptId(attempt._id)
    setResults(attempt)
    setEnriched(buildEnriched(attempt.responses || [], questionsRef.current))
    setPhase('results')
  }

  useEffect(() => { loadMathJax() }, [])

  useEffect(() => {
    let res = null
    let qs  = []

    if (location.state?.results) {
      res = location.state.results
      qs  = location.state.questions || []
    } else {
      try {
        const stored = JSON.parse(sessionStorage.getItem('jeeMainAnalysis') || '{}')
        res = stored.results || null
        qs  = stored.questions || []
      } catch { /* ignore */ }
    }

    if (!res) { navigate('/courses/jee-main', { replace: true }); return }
    setResults(res)
    setActiveAttemptId(res._id || null)

    const responses = res.responses || []

    if (qs.length > 0) {
      questionsRef.current = qs
      setEnriched(buildEnriched(responses, qs))
    } else {
      setEnriched(responses.map((r, i) => ({ ...r, questionData: null, globalIndex: i })))
    }
    setLoading(false)

    // Fetch questions from API (works even after page refresh)
    if (res.year != null && res.paper) {
      axios.get(`${API_URL}/api/jee_main_questions_by_paper`, {
        params: { year: res.year, paper: res.paper }
      })
        .then(({ data }) => {
          const fetched = Array.isArray(data) ? data : (data.questions || [])
          if (fetched.length > 0) {
            questionsRef.current = fetched
            setEnriched(buildEnriched(responses, fetched))
          }
        })
        .catch(() => {})
    }

    // Fetch all attempts for this paper so user can switch between them
    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(({ data }) => {
        if (!data?.email) return
        return axios.get(`${API_URL}/api/jee_main_full_scores`, {
          params: { email: data.email },
          withCredentials: true,
        })
      })
      .then(resp => {
        if (!resp?.data) return
        const all = Array.isArray(resp.data) ? resp.data : []
        const paperAttempts = all.filter(
          a => String(a.year) === String(res.year) && a.paper === res.paper
        )
        // sorted newest first (server already does this, but ensure it)
        paperAttempts.sort((a, b) => new Date(b.dateAttempted) - new Date(a.dateAttempted))
        setAllAttempts(paperAttempts)
        // If we don't have a DB _id yet, mark the most recent as active
        if (!res._id && paperAttempts.length > 0) setActiveAttemptId(paperAttempts[0]._id)
      })
      .catch(() => {})
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height:'60vh' }}>
      <div className="spinner-border" style={{ color:'#5fcf80' }} role="status" />
    </div>
  )

  if (!results) return null

  if (phase === 'results') return (
    <ResultsPage
      results={results}
      enriched={enriched}
      year={results.year}
      paper={results.paper}
      onReview={() => setPhase('review')}
      allAttempts={allAttempts}
      activeAttemptId={activeAttemptId}
      onSwitchAttempt={switchAttempt}
    />
  )

  return (
    <ReviewAnswersPage
      enriched={enriched}
      onBack={() => setPhase('results')}
    />
  )
}

export default JEEMainAnalysis
