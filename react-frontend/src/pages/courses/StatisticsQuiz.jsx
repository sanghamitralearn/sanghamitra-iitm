import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const DIFF_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' }
const TOPIC_PALETTE = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#6f42c1','#fd7e14','#858796']

// ─── Helper ───────────────────────────────────────────────────────────────────
function resolveOptionText(question, idxOrText) {
  if (idxOrText === undefined || idxOrText === null) return ''
  const opts = question.options || []
  const idx = typeof idxOrText === 'number' ? idxOrText : parseInt(idxOrText)
  if (!isNaN(idx) && idx >= 0 && idx < opts.length) return opts[idx]
  return String(idxOrText)
}

// ─── MathJax ──────────────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax) return
  window.MathJax = {
    tex: { inlineMath:[['$','$'],['\\(','\\)']], displayMath:[['$$','$$'],['\\[','\\]']], processEscapes:true },
    options: { skipHtmlTags:['script','noscript','style','textarea','pre'] }
  }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js'
  s.async = true
  document.head.appendChild(s)
}
function typesetEl(el) {
  if (!el) return
  if (window.MathJax?.typesetPromise) {
    window.MathJax.typesetPromise([el]).catch(() => {})
  } else {
    setTimeout(() => {
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {})
    }, 800)
  }
}

// ─── Inline styles ─────────────────────────────────────────────────────────────
const S = {
  qCard: {
    background: '#E6F1FB',
    borderRadius: 16,
    border: '0.5px solid #85B7EB',
    overflow: 'hidden',
  },
  badgeStrip: {
    background: '#B5D4F4',
    borderBottom: '0.5px solid #85B7EB',
    padding: '8px 18px',
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  qNumBadge: {
    background: '#E6F1FB',
    color: '#0C447C',
    border: '1.5px solid #85B7EB',
    borderRadius: 99,
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 12px',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
    letterSpacing: '0.02em',
  },
  qBody: { padding: '1.2rem 1.4rem' },
  qText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#042C53',
    lineHeight: 1.75,
    marginBottom: '1rem',
  },
  optBase: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #85B7EB', background: '#E6F1FB',
    cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 0,
  },
  optSelected: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 10,
    border: '2px solid #378ADD', background: '#B5D4F4',
    cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 0,
  },
  optHovered: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #378ADD', background: '#d0e7f8',
    cursor: 'pointer', transition: 'all 0.15s ease', marginBottom: 0,
  },
  optLabel: (selected) => ({
    fontSize: '0.94rem',
    fontWeight: selected ? 600 : 400,
    color: selected ? '#042C53' : '#185FA5',
    lineHeight: 1.5, cursor: 'pointer', margin: 0,
  }),
  sidebar: {
    background: '#EEEDFE', borderRadius: 14,
    border: '0.5px solid #CECBF6', padding: 14,
    position: 'sticky', top: 20,
  },
  sbHead: {
    fontSize: '0.72rem', fontWeight: 700, color: '#3C3489',
    marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  navGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 5, marginBottom: 12,
  },
  navBtn: (state) => {
    const base = {
      width: 32, height: 32, padding: 0,
      fontSize: '0.75rem', fontWeight: 600,
      border: 'none', borderRadius: 6, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.1s',
    }
    if (state === 'current')  return { ...base, background: '#7F77DD', color: '#EEEDFE' }
    if (state === 'answered') return { ...base, background: '#1D9E75', color: '#E1F5EE' }
    return { ...base, background: '#D3D1C7', color: '#444441' }
  },
  legend: {
    borderTop: '0.5px solid #CECBF6', paddingTop: 10,
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  legendRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#5F5E5A' },
  legendDot: (color) => ({ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }),
  infoPill: {
    background: '#CECBF6', borderRadius: 8, padding: '7px 12px', marginTop: 12,
    fontSize: '0.72rem', color: '#3C3489', display: 'flex',
    justifyContent: 'space-between', fontWeight: 500,
  },
  progBar: { height: 5, background: '#D3D1C7', borderRadius: 3, marginBottom: 16 },
  progFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#7F77DD', borderRadius: 3, transition: 'width 0.3s' }),
  navPrev: {
    padding: '7px 18px', borderRadius: 8,
    border: '1.5px solid #AFA9EC', background: 'transparent',
    color: '#534AB7', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500,
  },
  navNext: {
    padding: '7px 18px', borderRadius: 8,
    border: '1.5px solid #AFA9EC', background: 'transparent',
    color: '#534AB7', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500,
  },
  navSubmit: {
    padding: '7px 18px', borderRadius: 8,
    border: 'none', background: '#1D9E75',
    color: '#E1F5EE', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600,
  },
}

// ─── isAnswered helper ────────────────────────────────────────────────────────
const isAnswered = (a) => {
  if (a === undefined || a === null) return false
  if (typeof a === 'number') return true
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return a.length > 0 && a.some(item => item && String(item).trim() !== '')
  return false
}

// ─── Calculator ───────────────────────────────────────────────────────────────
const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)

  const pressNum = v => { if (fresh){setDisplay(String(v));setFresh(false)} else setDisplay(d=>d==='0'?String(v):d+v) }
  const pressOp  = o => { setPrev(parseFloat(display)); setOp(o); setFresh(true) }
  const pressDot = () => setDisplay(d=>d.includes('.')?d:d+'.')
  const del      = () => setDisplay(d=>d.length>1?d.slice(0,-1):'0')
  const clear    = () => { setDisplay('0');setPrev(null);setOp(null);setFresh(true) }
  const equals   = () => {
    const cur=parseFloat(display); if(prev===null||!op)return
    const res={'+':prev+cur,'-':prev-cur,'*':prev*cur,'/':prev/cur,'^':Math.pow(prev,cur)}[op]
    setDisplay(String(parseFloat(res.toFixed(10)))); setPrev(null);setOp(null);setFresh(true)
  }
  const fn = f => {
    const v=parseFloat(display)
    const m={sqrt:Math.sqrt(v),log:Math.log10(v),ln:Math.log(v),sin:Math.sin(v*Math.PI/180),
      cos:Math.cos(v*Math.PI/180),tan:Math.tan(v*Math.PI/180),'1/x':1/v,'x²':v*v,'π':Math.PI,'e':Math.E}
    setDisplay(String(parseFloat(m[f].toFixed(10)))); setFresh(true)
  }
  const B=(label,action,color='#495057')=>(
    <button key={label} onClick={action} style={{padding:'7px 4px',border:'none',borderRadius:6,fontSize:'0.8rem',fontWeight:600,cursor:'pointer',background:color,color:'#fff'}}>{label}</button>
  )
  return (
    <div style={{position:'fixed',bottom:80,right:20,width:260,background:'#1a1a2e',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:9999,padding:12}}
      onContextMenu={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span style={{color:'#aaa',fontSize:'0.78rem'}}>🧮 Calculator</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#aaa',fontSize:18,cursor:'pointer',lineHeight:1}}>×</button>
      </div>
      <div style={{background:'#0f0f1a',borderRadius:8,padding:'8px 12px',marginBottom:8,textAlign:'right',minHeight:42}}>
        {op&&<div style={{fontSize:'0.68rem',color:'#888'}}>{prev} {op}</div>}
        <div style={{fontSize:'1.2rem',fontWeight:700,color:'#fff',wordBreak:'break-all'}}>{display}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,marginBottom:4}}>
        {B('sin',()=>fn('sin'),'#6f42c1')} {B('cos',()=>fn('cos'),'#6f42c1')}
        {B('tan',()=>fn('tan'),'#6f42c1')} {B('log',()=>fn('log'),'#6f42c1')}
        {B('ln',()=>fn('ln'),'#6f42c1')}   {B('√',()=>fn('sqrt'),'#6f42c1')}
        {B('x²',()=>fn('x²'),'#6f42c1')}  {B('1/x',()=>fn('1/x'),'#6f42c1')}
        {B('π',()=>fn('π'),'#0d6efd')}    {B('e',()=>fn('e'),'#0d6efd')}
        {B('^',()=>pressOp('^'),'#fd7e14')} {B('C',clear,'#dc3545')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
        {B('7',()=>pressNum('7'))} {B('8',()=>pressNum('8'))} {B('9',()=>pressNum('9'))} {B('÷',()=>pressOp('/'),'#343a40')}
        {B('4',()=>pressNum('4'))} {B('5',()=>pressNum('5'))} {B('6',()=>pressNum('6'))} {B('×',()=>pressOp('*'),'#343a40')}
        {B('1',()=>pressNum('1'))} {B('2',()=>pressNum('2'))} {B('3',()=>pressNum('3'))} {B('−',()=>pressOp('-'),'#343a40')}
        {B('0',()=>pressNum('0'))} {B('.',pressDot)}            {B('+',()=>pressOp('+'),'#343a40')} {B('⌫',del,'#6c757d')}
        <button onClick={equals} style={{gridColumn:'1/-1',padding:'8px',border:'none',borderRadius:6,fontWeight:700,cursor:'pointer',background:'#28a745',color:'#fff',fontSize:'0.9rem'}}>=</button>
      </div>
    </div>
  )
}

// ─── Question Navigator Sidebar ────────────────────────────────────────────────
const QuestionNav = ({ questions, answers, currentIndex, goTo }) => {
  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k]
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0)
  }).length

  return (
    <div style={S.sidebar}>
      <div style={S.sbHead}>Navigator</div>
      <div style={S.navGrid}>
        {questions.map((qItem, i) => {
          const ans = answers[qItem._id]
          const answered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0)
          const state = i === currentIndex ? 'current' : answered ? 'answered' : 'default'
          return (
            <button key={qItem._id} onClick={() => goTo(i)} style={S.navBtn(state)}>
              {i + 1}
            </button>
          )
        })}
      </div>
      <div style={S.legend}>
        {[['#7F77DD','Current'],['#1D9E75','Answered'],['#D3D1C7','Unanswered']].map(([c,l]) => (
          <div key={l} style={S.legendRow}>
            <div style={S.legendDot(c)}/>{l}
          </div>
        ))}
      </div>
      <div style={S.infoPill}>
        <span>Answered</span>
        <strong>{answeredCount} / {questions.length}</strong>
      </div>
    </div>
  )
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, quizName, onRetake, topicColorMap }) => {
  const [expanded, setExpanded] = useState(null)
  const ref = useRef(null)
  useEffect(()=>{ if(ref.current) typesetEl(ref.current) },[expanded])

  const getDisplayAnswer = (q, answer) => {
    if (answer === null || answer === undefined || answer === '') return '(no answer)'
    if (q.type === 'multiple_choice' || q.type === 'mcq') {
      const idx = typeof answer === 'string' ? parseInt(answer) : answer
      return q.options?.[idx] ?? String(answer)
    }
    if (q.type === 'multiple_select') {
      const arr = Array.isArray(answer) ? answer : [answer]
      return arr.map(i => {
        if (typeof i === 'number' || !isNaN(parseInt(i))) {
          const idx = typeof i === 'number' ? i : parseInt(i)
          return q.options?.[idx] ?? String(i)
        }
        return String(i)
      }).join(', ')
    }
    if ((q.type === 'numeric' || q.type === 'numeric_input') && !isNaN(parseFloat(answer))) {
      const num = parseFloat(answer)
      return num % 1 === 0 ? num.toString() : num.toFixed(4).replace(/\.?0+$/, '')
    }
    return String(answer)
  }

  const getCorrectDisplay = (q) => {
    const ca = q.correct_answer
    if (q.type === 'multiple_choice' || q.type === 'mcq') return resolveOptionText(q, ca)
    if (q.type === 'multiple_select') {
      const arr = Array.isArray(ca) ? ca : [ca]
      return arr.map(i => resolveOptionText(q, i)).join(', ')
    }
    if ((q.type === 'numeric' || q.type === 'numeric_input') && !isNaN(parseFloat(ca))) {
      const num = parseFloat(ca)
      return num % 1 === 0 ? num.toString() : num.toFixed(4).replace(/\.?0+$/, '')
    }
    return String(ca)
  }

  return (
    <main className="main" ref={ref}>
      <div className="page-title" style={{marginBottom:'2rem'}}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8"><h1>{quizName} — Review</h1></div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics">Statistics</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="card border-0 shadow-sm mb-4 text-center" style={{borderRadius:16}}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{width:120,height:120,borderRadius:'50%',
                  background:results.percentage>=60?'linear-gradient(135deg,#28a745,#20c997)':'linear-gradient(135deg,#dc3545,#c82333)',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:28,fontWeight:700,color:'#fff'}}>{results.percentage}%</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.85)'}}>
                    {Number.isInteger(results.score) ? results.score : results.score.toFixed(2)}/{results.totalPossible}
                  </span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">{results.percentage>=80?'Excellent!':results.percentage>=60?'Good job!':'Keep practicing!'}</h4>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{results.questionResults.filter(r => r.isCorrect).length} Q ({Number.isInteger(results.score) ? results.score : results.score.toFixed(1)} pts)</strong> &nbsp;|&nbsp; 
                  Wrong: <strong className="text-danger">{results.questionResults.filter(r => !r.isCorrect).length} Q</strong>
                </p>
                <p className="text-muted mb-0">Total time: {Math.floor(results.totalTime/60)}m {results.totalTime%60}s</p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}><i className="bi bi-arrow-clockwise me-1"/>Retake</button>
              <Link to="/courses/statistics" className="btn btn-outline-secondary"><i className="bi bi-arrow-left me-1"/>Back</Link>
            </div>
          </div>
        </div>

        {questions.map((q, idx) => {
          const res = results.questionResults[idx]
          const isOpen = expanded === idx
          const topicColor = topicColorMap?.[q.originalTopic||q.topic] || '#6c757d'
          return (
            <div key={q._id} className="card border-0 shadow-sm mb-3"
              style={{borderRadius:12, borderLeft:`4px solid ${res?.isCorrect?'#28a745': (res?.isMSQ && res?.partialScore > 0) ? '#f6c23e' : '#dc3545'}`}}>
              <div className="card-body" style={{cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:idx)}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,
                    background: res?.isCorrect ? '#28a745'
                              : (res?.isMSQ && res?.partialScore > 0) ? '#f6c23e'
                              : '#dc3545',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className={`bi ${res?.isCorrect ? 'bi-check-lg' : (res?.isMSQ && res?.partialScore > 0) ? 'bi-dash-lg' : 'bi-x-lg'} text-white`} style={{fontSize:13}}/>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <p className="mb-1 fw-semibold" style={{fontSize:'0.95rem', flex:1}}>
                        {!isOpen && q.question_text.length>100 ? q.question_text.slice(0,100)+'…' : q.question_text}
                      </p>
                      <div className="d-flex align-items-center gap-2" style={{flexShrink:0}}>
                        <span style={{fontSize:'0.72rem',fontWeight:600,color:'#0C447C',
                          background:'#E6F1FB',border:'1.5px solid #85B7EB',
                          borderRadius:99,padding:'2px 10px',whiteSpace:'nowrap'}}>Q{idx+1}</span>
                        <i className={`bi bi-chevron-${isOpen?'up':'down'} text-muted`}/>
                      </div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className={`badge bg-${DIFF_COLORS[q.difficulty]||'secondary'}`}>{q.difficulty}</span>
                      <span className="badge" style={{background:topicColor}}>{q.originalTopic||q.topic}</span>
                      {res?.timeTaken>0 && <span className="badge bg-light text-dark"><i className="bi bi-clock me-1"/>{res.timeTaken}s</span>}
                      {res?.isMSQ && <span className="badge" style={{background: res.isCorrect?'#28a745': res.partialScore>0?'#f6c23e':'#dc3545',color:'#fff'}}>{res.partialScore}/{res.maxScore} pts</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {q.img_file && <img src={q.img_file} alt="question diagram" className="img-fluid mb-3 rounded" style={{maxHeight:200}}/>}

                    {(q.type==='multiple_choice'||q.type==='mcq'||q.type==='multiple_select') && q.options && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          const caArr = q.type==='multiple_select'
                            ? (() => {
                                const ca = q.correct_answer;
                                const toOptText = (val) => {
                                  const asInt = typeof val === 'number' ? val : parseInt(String(val).trim())
                                  if (!isNaN(asInt) && asInt >= 0 && asInt < (q.options||[]).length)
                                    return q.options[asInt]
                                  return String(val)
                                }
                                if (Array.isArray(ca)) return ca.map(toOptText)
                                if (typeof ca === 'string') {
                                  try {
                                    const parsed = JSON.parse(ca)
                                    if (Array.isArray(parsed)) return parsed.map(toOptText)
                                  } catch (e) {}
                                  return ca.split(',').map(v => toOptText(v.trim()))
                                }
                                if (typeof ca === 'number') return [toOptText(ca)]
                                return []
                              })() : []

                          const resolvedCorrectIdx = (q.type==='multiple_choice'||q.type==='mcq')
                            ? (typeof q.correct_answer==='number'
                                ? q.correct_answer
                                : !isNaN(parseInt(String(q.correct_answer).trim()))
                                  ? parseInt(String(q.correct_answer).trim())
                                  : q.options?.findIndex(o =>
                                      o?.toLowerCase().trim() === String(q.correct_answer).toLowerCase().trim()
                                    ) ?? -1)
                            : -1

                          const isCorrectOpt = (q.type==='multiple_choice'||q.type==='mcq')
                            ? (resolvedCorrectIdx !== -1 && oi === resolvedCorrectIdx)
                            : caArr.includes(opt)

                          const userPicked = (q.type==='multiple_choice'||q.type==='mcq')
                            ? (typeof answers[q._id]==='number'
                                ? answers[q._id]===oi
                                : parseInt(answers[q._id])===oi)
                            : (() => {
                                const ans = answers[q._id];
                                if (!ans || !Array.isArray(ans)) return false
                                return ans.includes(opt)
                              })();

                          let bg = 'transparent'
                          if (isCorrectOpt && userPicked) bg = '#d4edda'
                          else if (isCorrectOpt) bg = '#d4edda'
                          else if (userPicked && !isCorrectOpt) bg = '#f8d7da'

                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{background:bg}}>
                              {isCorrectOpt && userPicked  && <i className="bi bi-check-circle-fill text-success"/>}
                              {isCorrectOpt && !userPicked && <i className="bi bi-check-circle text-success"/>}
                              {!isCorrectOpt && userPicked && <i className="bi bi-x-circle-fill text-danger"/>}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted"/>}
                              <span style={{fontSize:'0.9rem'}}>{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type!=='multiple_choice' && q.type!=='mcq' && q.type!=='multiple_select' && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border">Your answer: <strong>{getDisplayAnswer(q, answers[q._id])}</strong></span>
                        <span className="badge bg-success">Correct: <strong>{getCorrectDisplay(q)}</strong></span>
                        {q.has_tolerance&&q.tolerance_value>0&&<span className="badge bg-info">±{q.tolerance_value} tolerance</span>}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="alert alert-info py-2 mb-0" style={{fontSize:'0.88rem'}}>
                        <i className="bi bi-lightbulb me-2"/><strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

// ─── Main Quiz Component ───────────────────────────────────────────────────────
const StatisticsQuiz = () => {
  const { topic } = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { quizName, topics: multiTopics, countPerTopic=10 } = location.state || {}
  const displayName = quizName || topic?.replace(/_/g,' ').replace(/-/g,' ')

  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [saving, setSaving]       = useState(false)
  const [showCalc, setShowCalc]   = useState(false)
  const showCalcRef = useRef(false)
  const [warningOverlay, setWarningOverlay] = useState(false)
  const [topicColorMap, setTopicColorMap]   = useState({})
  const [hoveredOpt, setHoveredOpt]         = useState(null)
  const [showMobileNav, setShowMobileNav]   = useState(false)

  const questionStartRef  = useRef(Date.now())
  const timesRef          = useRef({})
  const cheatingRef       = useRef(0)
  const devToolsWarnedRef = useRef(false)
  const userRef           = useRef(null)
  const questionRef       = useRef(null)
  const devToolsInterval  = useRef(null)
  const lastCheatTimeRef    = useRef({})
  const baseWindowRef       = useRef({ outerHeight:0, outerWidth:0, innerHeight:0, innerWidth:0 })
  const CHEAT_COOLDOWN_MS   = 30_000
  const CHEAT_THRESHOLD     = 5

  useEffect(()=>{ loadMathJax() },[])
  useEffect(()=>{ if(questionRef.current) typesetEl(questionRef.current) },[currentIndex,questions])
  useEffect(()=>{ checkAuth() },[])

  useEffect(() => {
    baseWindowRef.current = {
      outerHeight: window.outerHeight, outerWidth: window.outerWidth,
      innerHeight: window.innerHeight, innerWidth: window.innerWidth,
    }
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`,{withCredentials:true})
      if(res.data?.email){ setUser(res.data); userRef.current=res.data; fetchQuestions(res.data.email) }
      else navigate('/login',{replace:true})
    } catch { navigate('/login',{replace:true}) }
  }

  const fetchQuestions = async email => {
    try {
      let allQuestions=[]
      if(multiTopics&&multiTopics.length>0){
        const colorMap={}
        multiTopics.forEach((t,i)=>{ colorMap[t.name]=TOPIC_PALETTE[i%TOPIC_PALETTE.length] })
        setTopicColorMap(colorMap)
        const fetches=multiTopics.map(t=>
          axios.get(`${API_URL}/api/iitm-stats-questions/${encodeURIComponent(t.endpoint)}?email=${encodeURIComponent(email)}&count=${countPerTopic}`,{withCredentials:true})
            .then(r=>(r.data.questions||[]).map((q,i)=>{
              const rawId = q._id || q.id || q.question_id || q.question_number || i
              return { ...q, _id: `${t.name}__${rawId}`, originalTopic: t.name }
            }))
            .catch(()=>[])
        )
        const res=await Promise.all(fetches)
        allQuestions=res.flat()
        allQuestions=allQuestions.map((q,i)=>({...q,_id:`${q.originalTopic}__idx${i}__${q._id}`}))
        for(let i=allQuestions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[allQuestions[i],allQuestions[j]]=[allQuestions[j],allQuestions[i]]}
      } else {
        const res=await axios.get(`${API_URL}/api/iitm-stats-questions/${encodeURIComponent(topic)}?email=${encodeURIComponent(email)}&count=50`,{withCredentials:true})
        allQuestions=(res.data.questions||[]).map((q,i)=>{
          const rawId = q._id || q.id || q.question_id || q.question_number || i
          return { ...q, _id: `${topic}__idx${i}__${rawId}`, originalTopic: q.topic||topic }
        })
        const colorMap={}; colorMap[topic]=TOPIC_PALETTE[0]; setTopicColorMap(colorMap)
      }
      if(allQuestions.length===0) setError('No questions found for this topic yet.')
      else setQuestions(allQuestions)
    } catch { setError('Failed to load questions. Please try again.') }
    finally { setLoading(false) }
  }

  // Anti-cheat
  const recordCheat = useCallback(async (type) => {
    const now = Date.now()
    const lastTime = lastCheatTimeRef.current[type] || 0
    if (now - lastTime < CHEAT_COOLDOWN_MS) return
    lastCheatTimeRef.current[type] = now

    cheatingRef.current += 1
    const u = userRef.current
    if (u?.email) {
      axios.post(`${API_URL}/api/log-cheating`, {
        username: u.username || u.email, email: u.email,
        cheatingType: type, timestamp: new Date(),
        currentQuestion: cheatingRef.current, quizType: topic
      }, { withCredentials: true }).catch(() => {})
    }
    if (cheatingRef.current >= CHEAT_THRESHOLD) {
      alert('Too many suspicious activities detected. Quiz will be auto-submitted.')
      doSubmit()
    }
  }, [topic])

  useEffect(()=>{
    const onCtx=e=>{e.preventDefault();recordCheat('right_click');return false}
    const onKey=e=>{
      if(e.keyCode===123||(e.ctrlKey&&e.shiftKey&&e.keyCode===73)||(e.ctrlKey&&e.keyCode===85)||(e.ctrlKey&&e.keyCode===83)||e.keyCode===44){e.preventDefault();recordCheat('keyboard_shortcut');return false}
      if(e.ctrlKey&&(e.keyCode===65||e.keyCode===67||e.keyCode===86)){e.preventDefault();recordCheat('copy_paste');return false}
    }
    const onSel=()=>{recordCheat('text_selection');return false}
    
    let blurTimer = null
    const onBlur = () => {
      blurTimer = setTimeout(() => {
        if (!document.hasFocus() && !showCalcRef.current) {
          recordCheat('tab_switch')
          setWarningOverlay(true)
        }
      }, 5_000)
    }
    const onFocus = () => { clearTimeout(blurTimer); setWarningOverlay(false) }

    document.addEventListener('contextmenu',onCtx)
    document.addEventListener('keydown',onKey)
    document.onselectstart=onSel
    window.addEventListener('focus',onFocus)
    window.addEventListener('blur',onBlur)

    // Screenshot detection
    const onKeyUp = (e) => {
      if (e.keyCode === 44 || e.key === 'PrintScreen') {
        recordCheat('screenshot_attempt')
        alert('Screenshots are not allowed during the quiz!')
      }
      if (e.key === 's' && e.metaKey && e.shiftKey) {
        recordCheat('snipping_tool')
        alert('Snippets are not allowed during the quiz!')
      }
      if (e.key === 's' && e.ctrlKey && e.shiftKey) {
        recordCheat('screenshot_attempt')
        alert('Screenshots are not allowed during the quiz!')
      }
    }

    const onPaste = (e) => {
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            recordCheat('screenshot_paste')
            alert('Pasting screenshots is not allowed!')
            e.preventDefault()
            return
          }
        }
      }
    }

    const onCopy = (e) => {
      recordCheat('copy_attempt')
      e.preventDefault()
      return false
    }

    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('paste', onPaste)
    document.addEventListener('copy', onCopy)

    devToolsInterval.current = setInterval(() => {
      const base = baseWindowRef.current
      const heightDiff = window.outerHeight - window.innerHeight
      const widthDiff  = window.outerWidth  - window.innerWidth
      const outerChanged =
        Math.abs(window.outerHeight - base.outerHeight) > 100 ||
        Math.abs(window.outerWidth  - base.outerWidth)  > 100
      if (outerChanged) {
        baseWindowRef.current = {
          outerHeight: window.outerHeight, outerWidth: window.outerWidth,
          innerHeight: window.innerHeight, innerWidth: window.innerWidth,
        }
        devToolsWarnedRef.current = false
        return
      }
      if (heightDiff > 200 || widthDiff > 200) {
        if (!devToolsWarnedRef.current) {
          devToolsWarnedRef.current = true
          recordCheat('developer_tools')
          alert('Developer tools detected! This attempt has been logged.')
        }
      } else { devToolsWarnedRef.current = false }
    }, 500)

    return()=>{
      document.removeEventListener('contextmenu',onCtx)
      document.removeEventListener('keydown',onKey)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('copy', onCopy)
      document.onselectstart=null
      window.removeEventListener('focus',onFocus)
      window.removeEventListener('blur',onBlur)
      clearTimeout(blurTimer)
      clearInterval(devToolsInterval.current)
    }
  },[recordCheat])

  const saveCurrentTime = qId => {
    const elapsed=Math.round((Date.now()-questionStartRef.current)/1000)
    timesRef.current[qId]=(timesRef.current[qId]||0)+elapsed
    questionStartRef.current=Date.now()
  }

  const toggleCalc = () => {
    setShowCalc(v => {
      const nv = !v
      showCalcRef.current = nv
      return nv
    })
  }

  const goTo = newIdx => {
    const q=questions[currentIndex]; if(q) saveCurrentTime(q._id)
    setCurrentIndex(newIdx)
    setHoveredOpt(null)
    setShowMobileNav(false)
  }

  const handleAnswer = (qId,value) => setAnswers(p=>({...p,[qId]:value}))
  
  const handleMultiSelect = (qId, optIdx, checked, optText) => {
    setAnswers(p => {
      const cur = p[qId] || []
      return { ...p, [qId]: checked ? [...cur, optText] : cur.filter(t => t !== optText) }
    })
  }

  // ─── norm helper ──────────────────────────────────────────────────────────
  const norm = (t) => {
    if (t === undefined || t === null) return ''
    let str = String(t).trim()
    str = str.replace(/\s+/g,'').replace(/\\\(/g,'').replace(/\\\)/g,'')
      .replace(/\\\[/g,'').replace(/\\\]/g,'').replace(/\$/g,'')
      .replace(/infinity|∞/gi,'inf').replace(/√\(([^)]+)\)/g,'sqrt($1)')
      .replace(/√(\d+)/g,'sqrt($1)').replace(/≠/g,'!=').replace(/≤/g,'<=')
      .replace(/≥/g,'>=').replace(/×/g,'*').replace(/÷/g,'/')
      .replace(/∪/g,'U').replace(/∩/g,'n').replace(/∈/g,'in')
      .replace(/⊂/g,'subset').replace(/⊆/g,'subseteq')
    if (str.includes('/') && !str.includes('sqrt')) {
      const parts = str.split('/')
      if (parts.length===2 && !isNaN(parts[0]) && !isNaN(parts[1]))
        str = String(parseFloat(parts[0]) / parseFloat(parts[1]))
    }
    return str.replace(/\.0$/,'').toLowerCase()
  }

  // ─── scoreQuestion — returns { partialScore, isCorrect, isMSQ } ───────────
  const scoreQuestion = (question, userAnswer) => {
    const ca     = question.correct_answer
    const alts   = question.alternative_answers || []
    const points = question.points || 1
    const type   = question.type === 'mcq' ? 'multiple_choice'
                 : question.type === 'text' ? 'text_input'
                 : question.type

    const empty = userAnswer === undefined || userAnswer === null || userAnswer === ''
                  || (Array.isArray(userAnswer) && userAnswer.length === 0)
    if (empty) return { partialScore: 0, isCorrect: false, isMSQ: type === 'multiple_select' }

    // ── MCQ ─────────────────────────────────────────────────────────────────
    if (type === 'multiple_choice') {
      const resolveToIndex = (val) => {
        if (val === undefined || val === null) return -1
        if (typeof val === 'number' && !isNaN(val)) return val
        const asInt = parseInt(String(val).trim())
        if (!isNaN(asInt)) return asInt
        return (question.options || []).findIndex(o => norm(o) === norm(String(val)))
      }
      const userIdx    = resolveToIndex(userAnswer)
      const correctIdx = resolveToIndex(ca)
      let correct = (userIdx !== -1 && correctIdx !== -1 && userIdx === correctIdx)
      if (!correct) {
        const uText = norm(question.options?.[userIdx] ?? userAnswer)
        const cText = norm(question.options?.[correctIdx] ?? ca)
        correct = !!(uText && cText && uText === cText)
      }
      if (!correct) correct = alts.some(alt => resolveToIndex(alt) === userIdx)
      return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
    }

    // ── MSQ — IITM partial marking (stores option TEXT in answers) ──────
    if (type === 'multiple_select') {
      if (!Array.isArray(userAnswer) || userAnswer.length === 0)
        return { partialScore: 0, isCorrect: false, isMSQ: true }

      const toText = (val) => {
        if (val === undefined || val === null) return ''
        const asInt = typeof val === 'number' ? val : parseInt(String(val).trim())
        if (!isNaN(asInt) && asInt >= 0 && asInt < (question.options || []).length)
          return norm(question.options[asInt])
        return norm(String(val))
      }

      let correctTexts = []
      if (Array.isArray(ca)) {
        correctTexts = ca.map(toText)
      } else if (typeof ca === 'string') {
        try {
          const parsed = JSON.parse(ca)
          correctTexts = Array.isArray(parsed) ? parsed.map(toText) : [toText(ca)]
        } catch { correctTexts = ca.split(',').map(v => toText(v.trim())) }
      } else {
        correctTexts = [toText(ca)]
      }

      const n = correctTexts.length
      if (n === 0) return { partialScore: 0, isCorrect: false, isMSQ: true }

      const perCorrect = points / n
      const perWrong   = points / 3
      const userTexts  = userAnswer.map(v => norm(String(v)))

      let raw = 0
      userTexts.forEach(ut => {
        if (correctTexts.includes(ut)) raw += perCorrect
        else                           raw -= perWrong
      })

      const partialScore = parseFloat(Math.max(0, Math.min(points, raw)).toFixed(4))
      const isCorrect    = partialScore === points
      return { partialScore, isCorrect, isMSQ: true }
    }

    // ── Numeric ──────────────────────────────────────────────────────────────
    if (type === 'numeric' || type === 'numeric_input') {
      const uNum = parseFloat(String(userAnswer).trim())
      const cNum = parseFloat(String(ca).trim())
      if (isNaN(uNum) || isNaN(cNum)) return { partialScore: 0, isCorrect: false, isMSQ: false }
      const tolerance = question.has_tolerance && question.tolerance_value > 0
        ? question.tolerance_value
        : Math.max(Math.abs(cNum) * 0.01, 0.0001)
      let correct = Math.abs(uNum - cNum) <= tolerance
      if (!correct) correct = alts.some(alt => {
        const altNum = parseFloat(String(alt).trim())
        return !isNaN(altNum) && Math.abs(uNum - altNum) <= Math.max(Math.abs(altNum) * 0.01, 0.0001)
      })
      return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
    }

    // ── Text / other ─────────────────────────────────────────────────────────
    const nUser = norm(String(userAnswer).trim())
    const nCorr = norm(String(ca).trim())
    let correct = nUser === nCorr
    if (!correct) {
      const uNum = parseFloat(nUser), cNum = parseFloat(nCorr)
      if (!isNaN(uNum) && !isNaN(cNum)) correct = Math.abs(uNum-cNum) <= Math.max(Math.abs(cNum)*0.01, 0.0001)
    }
    if (!correct) correct = alts.some(a => norm(String(a).trim()) === nUser)
    return { partialScore: correct ? points : 0, isCorrect: correct, isMSQ: false }
  }

  const doSubmit = async () => {
    const q=questions[currentIndex]; if(q) saveCurrentTime(q._id)
    const questionResults = questions.map(question => {
      const ua = answers[question._id]
      const fmt = (a) => Array.isArray(a) ? a.join(', ') : String(a ?? '')
      const { partialScore, isCorrect, isMSQ } = scoreQuestion(question, ua)
      return {
        questionId: question._id, questionNumber: question.question_number,
        questionText: question.question_text, userAnswer: fmt(ua),
        correctAnswer: fmt(question.correct_answer),
        isCorrect,
        isMSQ,
        partialScore: Math.round(partialScore * 100) / 100,
        maxScore: question.points || 1,
        timeTaken: timesRef.current[question._id] || 0
      }
    })
    const rawScore = questionResults.reduce((sum, r) => sum + r.partialScore, 0)
    const score = Math.round(rawScore * 100) / 100
    const totalPossible = questions.reduce((sum, q) => sum + (q.points || 1), 0)
    const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
    const totalTime = Object.values(timesRef.current).reduce((s,t)=>s+t,0)
    setSaving(true)
    try {
      const u=userRef.current
      await axios.post(`${API_URL}/api/statistics_scores`,{
        email:u.email, username:u.username||u.name||u.email,
        quizData:{topic,score,maxScore:totalPossible,totalQuestions:questions.length,percentage,timestamp:new Date(),questionResults}
      },{withCredentials:true})
    } catch(err){ console.error('Score save failed:',err) }
    finally{ setSaving(false) }
    setResults({ score, percentage, totalTime, totalPossible, questionResults })
    setSubmitted(true)
    clearInterval(devToolsInterval.current)
    document.onselectstart=null
  }

  const handleRetake = () => {
    setAnswers({});setCurrentIndex(0);setSubmitted(false);setResults(null)
    timesRef.current={};cheatingRef.current=0;devToolsWarnedRef.current=false
    lastCheatTimeRef.current = {}
    questionStartRef.current=Date.now()
    if(userRef.current){fetchQuestions(userRef.current.email);setLoading(true)}
  }

  const renderInput = question => {
    const { _id, type, options, format_hint, img_file } = question
    const answer = answers[_id]
    const normalType = type==='mcq'?'multiple_choice':type==='text'?'text_input':type

    if (normalType === 'multiple_choice') {
      return (
        <div className="mt-3" style={{display:'flex',flexDirection:'column',gap:9}}>
          {options?.map((opt,idx) => {
            const isSelected = (typeof answer==='string'?parseInt(answer):answer)===idx
            const isHovered  = hoveredOpt===`${_id}-${idx}`
            const style      = isSelected ? S.optSelected : isHovered ? S.optHovered : S.optBase
            return (
              <div key={idx} style={style}
                onClick={()=>handleAnswer(_id,idx)}
                onMouseEnter={()=>setHoveredOpt(`${_id}-${idx}`)}
                onMouseLeave={()=>setHoveredOpt(null)}>
                <input className="form-check-input" type="radio" name={`q-${_id}`}
                  id={`opt-${_id}-${idx}`} checked={isSelected}
                  onChange={()=>handleAnswer(_id,idx)}
                  style={{flexShrink:0,accentColor:'#378ADD',marginTop:0}}/>
                <label htmlFor={`opt-${_id}-${idx}`} style={S.optLabel(isSelected)}>{opt}</label>
              </div>
            )
          })}
        </div>
      )
    }

    if (normalType === 'multiple_select') {
      const sel = answer || []
      return (
        <div className="mt-3">
          <small className="text-muted d-block mb-2"><i className="bi bi-info-circle me-1"/>Select all that apply</small>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {options?.map((opt,idx) => {
              const isSelected = sel.includes(opt)
              const isHovered  = hoveredOpt===`${_id}-${idx}`
              const style      = isSelected ? S.optSelected : isHovered ? S.optHovered : S.optBase
              return (
                <div key={idx} style={style}
                  onClick={()=>handleMultiSelect(_id, idx, !sel.includes(opt), opt)}
                  onMouseEnter={()=>setHoveredOpt(`${_id}-${idx}`)}
                  onMouseLeave={()=>setHoveredOpt(null)}>
                  <input className="form-check-input" type="checkbox"
                    id={`opt-${_id}-${idx}`} checked={isSelected}
                    onChange={e=>e.stopPropagation()}
                    onClick={e=>e.stopPropagation()}
                    style={{flexShrink:0,accentColor:'#378ADD',marginTop:0}}/>
                  <label htmlFor={`opt-${_id}-${idx}`} style={S.optLabel(isSelected)}>{opt}</label>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (normalType === 'numeric' || normalType === 'numeric_input') {
      return (
        <div className="mt-3">
          {img_file&&<img src={img_file} alt="diagram" className="img-fluid mb-3 rounded" style={{maxHeight:200}}/>}
          {format_hint&&<small className="text-muted d-block mb-1">{format_hint}</small>}
          {question.has_tolerance&&question.tolerance_value>0&&<small className="text-info d-block mb-1"><i className="bi bi-info-circle me-1"/>Accepted within ±{question.tolerance_value}</small>}
          <input type="number" className="form-control"
            style={{maxWidth:240,background:'#E6F1FB',borderColor:'#85B7EB',color:'#042C53'}}
            value={answer??''} placeholder="e.g. 3.14, −5, 1/3"
            onChange={e=>handleAnswer(_id,e.target.value)} autoComplete="off"/>
        </div>
      )
    }

    const placeholders={interval_input:'e.g. (-∞, 3]',coordinate_input:'e.g. (2, 3)',equation_input:'e.g. y = 2x + 1',set_notation:'e.g. {x | x ≠ 0}'}
    return (
      <div className="mt-3">
        {img_file&&<img src={img_file} alt="diagram" className="img-fluid mb-3 rounded" style={{maxHeight:200}}/>}
        {format_hint&&<small className="text-muted d-block mb-1">{format_hint}</small>}
        <input type="text" className="form-control"
          style={{maxWidth:420,background:'#E6F1FB',borderColor:'#85B7EB',color:'#042C53'}}
          value={answer??''} placeholder={placeholders[normalType]||'Type your answer here'}
          onChange={e=>handleAnswer(_id,e.target.value)} autoComplete="off" spellCheck="false"/>
      </div>
    )
  }

  if(loading) return(
    <div className="d-flex justify-content-center align-items-center" style={{height:'50vh'}}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{color:'#7F77DD'}} role="status"/>
        {multiTopics&&<p className="text-muted">Loading from {multiTopics.length} topics…</p>}
      </div>
    </div>
  )
  if(error) return(<div className="container mt-5 text-center"><div className="alert alert-warning">{error}</div><Link to="/courses/statistics" className="btn btn-primary">Back to Statistics</Link></div>)
  if(submitted&&results) return(<ReviewPage questions={questions} answers={answers} results={results} quizName={displayName} onRetake={handleRetake} topicColorMap={topicColorMap}/>)

  const q = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k]
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length===0)
  }).length
  const progress = Math.round(((currentIndex+1)/questions.length)*100)
  const topicColor = topicColorMap?.[q.originalTopic||q.topic] || '#6c757d'

  return(
    <main className="main" style={{userSelect:'none',WebkitUserSelect:'none'}}>
      {warningOverlay&&(
        <div style={{position:'fixed',inset:0,background:'rgba(220,53,69,0.96)',zIndex:10000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
          <i className="bi bi-exclamation-triangle-fill" style={{fontSize:64,marginBottom:16}}/>
          <h2>Focus Lost!</h2>
          <p style={{fontSize:'1.2rem'}}>Please return to the quiz. This has been logged.</p>
          <button className="btn btn-light btn-lg mt-3" onClick={()=>setWarningOverlay(false)}>Return to Quiz</button>
        </div>
      )}

      {showCalc&&<Calculator onClose={toggleCalc}/>}

      {/* Floating calc button */}
      <button onClick={toggleCalc}
        style={{position:'fixed',bottom:20,right:20,width:52,height:52,borderRadius:'50%',
          background:'#7F77DD',border:'none',color:'#fff',fontSize:20,cursor:'pointer',
          zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 8px rgba(127,119,221,0.4)'}}>
        🧮
      </button>

      {/* Mobile: floating nav button */}
      <button className="d-md-none" onClick={()=>setShowMobileNav(v=>!v)}
        style={{position:'fixed',bottom:82,right:20,width:52,height:52,borderRadius:'50%',
          background:'#378ADD',border:'none',color:'#fff',fontSize:11,fontWeight:700,
          cursor:'pointer',zIndex:9997,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',lineHeight:1.2,
          boxShadow:'0 2px 8px rgba(55,138,221,0.4)'}}>
        <span style={{fontSize:16}}>≡</span>
        <span>Qs</span>
      </button>

      {/* Mobile nav drawer */}
      {showMobileNav&&(
        <div className="d-md-none" style={{position:'fixed',inset:0,zIndex:10001,background:'rgba(4,44,83,0.5)'}}
          onClick={()=>setShowMobileNav(false)}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'#fff',
            borderRadius:'16px 16px 0 0',padding:'20px 16px 30px'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontWeight:700,color:'#042C53',fontSize:'0.9rem'}}>Question Navigator</span>
              <button onClick={()=>setShowMobileNav(false)} style={{background:'none',border:'none',fontSize:22,color:'#888',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{...S.navGrid,gridTemplateColumns:'repeat(8,1fr)'}}>
              {questions.map((qItem,i)=>{
                const ans = answers[qItem._id]
                const answered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length===0)
                const state = i===currentIndex ? 'current' : answered ? 'answered' : 'default'
                return(<button key={qItem._id} onClick={()=>goTo(i)} style={S.navBtn(state)}>{i+1}</button>)
              })}
            </div>
            <div style={{display:'flex',gap:16,marginTop:12,flexWrap:'wrap'}}>
              {[['#7F77DD','Current'],['#1D9E75','Answered'],['#D3D1C7','Unanswered']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#5F5E5A'}}>
                  <div style={{width:10,height:10,borderRadius:3,background:c,flexShrink:0}}/>{l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="page-title" style={{marginBottom:'2rem'}}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">IITM Statistics — {questions.length} questions{multiTopics&&<span className="ms-2 badge bg-primary">{multiTopics.length} topics</span>}</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics">Statistics</Link></li>
          <li className="current">{displayName}</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-8">
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Question {currentIndex+1} of {questions.length}</small>
                <small className="text-muted">{answeredCount} answered</small>
              </div>
              <div style={S.progBar}><div style={S.progFill(progress)}/></div>
            </div>

            <div style={S.qCard} ref={questionRef}>
              <div style={S.badgeStrip}>
                <span className={`badge bg-${DIFF_COLORS[q.difficulty]||'secondary'}`} style={{fontSize:'0.75rem'}}>{q.difficulty}</span>
                <span className="badge" style={{background:topicColor,fontSize:'0.75rem'}}>{q.originalTopic||q.topic||topic}</span>
                <span className="badge" style={{background:'#CECBF6',color:'#3C3489',fontSize:'0.75rem',textTransform:'capitalize'}}>
                  {(q.type==='mcq'?'multiple choice':q.type==='text'?'text input':q.type)?.replace(/_/g,' ')}
                </span>
                {q.points>1&&<span className="badge" style={{background:'#CECBF6',color:'#3C3489',fontSize:'0.75rem'}}>{q.points} pts</span>}
                <span style={S.qNumBadge}>Q {currentIndex+1}</span>
              </div>
              <div style={S.qBody}>
                <h5 style={S.qText}>{q.question_text}</h5>
                {q.img_file&&<img src={q.img_file} alt="diagram" className="img-fluid mb-3 rounded" style={{maxHeight:200,border:'1.5px solid #85B7EB'}}/>}
                {renderInput(q)}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
              <button style={{...S.navPrev, opacity:currentIndex===0?0.4:1, cursor:currentIndex===0?'not-allowed':'pointer'}}
                onClick={()=>currentIndex>0&&goTo(currentIndex-1)} disabled={currentIndex===0}>
                <i className="bi bi-chevron-left me-1"/>Prev
              </button>
              {currentIndex<questions.length-1
                ?<button style={S.navNext} onClick={()=>goTo(currentIndex+1)}>Next<i className="bi bi-chevron-right ms-1"/></button>
                :<button style={S.navSubmit} onClick={doSubmit} disabled={saving}>
                  {saving?<><span className="spinner-border spinner-border-sm me-1"/>Saving…</>:<><i className="bi bi-check-circle me-1"/>Submit</>}
                </button>
              }
            </div>
          </div>

          <div className="col-md-4 col-lg-3 d-none d-md-block">
            <QuestionNav questions={questions} answers={answers} currentIndex={currentIndex} goTo={goTo}/>
          </div>
        </div>
      </div>
    </main>
  )
}

export default StatisticsQuiz
