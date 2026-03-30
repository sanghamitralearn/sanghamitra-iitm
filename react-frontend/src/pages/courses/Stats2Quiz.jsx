import React, { useState, useEffect, useRef } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
  const run = () => window.MathJax?.typesetPromise?.([el]).catch(()=>{})
  if (window.MathJax?.typesetPromise) run()
  else setTimeout(run, 800)
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

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, quizName, weekNum, onRetake }) => {
  const [expanded, setExpanded] = useState(null)
  const ref = useRef(null)
  useEffect(()=>{ if(ref.current) typesetEl(ref.current) },[expanded])

  return (
    <main className="main" ref={ref}>
      <div className="page-title" style={{marginBottom:'2rem'}}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{quizName} — Review</h1>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics2">Statistics 2</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="card border-0 shadow-sm mb-4 text-center" style={{borderRadius:16}}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{width:120,height:120,borderRadius:'50%',
                  background: results.percentage>=60 ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:28,fontWeight:700,color:'#fff'}}>{results.percentage}%</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.85)'}}>{results.correctAnswers}/{questions.length}</span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">{results.percentage>=80?'Excellent!':results.percentage>=60?'Good job!':'Keep practicing!'}</h4>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{results.correctAnswers}</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{questions.length - results.correctAnswers}</strong>
                </p>
                <p className="text-muted mb-0">
                  Points: <strong>{results.totalScore}</strong> &nbsp;|&nbsp;
                  Time: {Math.floor(results.totalTime/60)}m {results.totalTime%60}s
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1"/>Retake
              </button>
              <Link to="/courses/statistics2" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1"/>Back
              </Link>
            </div>
          </div>
        </div>

        {questions.map((q, idx) => {
          const res = results.responses[idx]
          const isOpen = expanded === idx
          return (
            <div key={q._id || idx} className="card border-0 shadow-sm mb-3"
              style={{borderRadius:12, borderLeft:`4px solid ${res?.isCorrect?'#28a745':'#dc3545'}`}}>
              <div className="card-body" style={{cursor:'pointer'}} onClick={()=>setExpanded(isOpen?null:idx)}>
                <div className="d-flex align-items-start gap-3">
                  <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,
                    background:res?.isCorrect?'#28a745':'#dc3545',
                    display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <i className={`bi ${res?.isCorrect?'bi-check-lg':'bi-x-lg'} text-white`} style={{fontSize:13}}/>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-semibold" style={{fontSize:'0.95rem'}}>
                        Q{idx+1}. {!isOpen && q.questionText.length>100 ? q.questionText.slice(0,100)+'…' : q.questionText}
                      </p>
                      <i className={`bi bi-chevron-${isOpen?'up':'down'} ms-2 text-muted`} style={{flexShrink:0}}/>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className="badge bg-secondary">{q.questionType}</span>
                      {q.subtopic && <span className="badge bg-info text-dark">{q.subtopic}</span>}
                      <span className="badge bg-light text-dark border">{q.marks||1} pt{(q.marks||1)!==1?'s':''}</span>
                      {res?.marksAwarded > 0 && <span className="badge bg-success">+{res.marksAwarded} earned</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {(q.questionType==='MCQ'||q.questionType==='MSQ') && q.options && (
                      <div className="mb-3">
                        {q.options.map((opt,oi)=>{
                          const isCorrectOpt = q.correctAnswers.includes(opt)
                          const userPicked = q.questionType==='MCQ'
                            ? answers[idx] === opt
                            : (Array.isArray(answers[idx]) ? answers[idx].includes(opt) : false)
                          const bg = isCorrectOpt ? '#d4edda' : userPicked ? '#f8d7da' : 'transparent'
                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{background:bg}}>
                              {isCorrectOpt && <i className="bi bi-check-circle-fill text-success"/>}
                              {userPicked && !isCorrectOpt && <i className="bi bi-x-circle-fill text-danger"/>}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted"/>}
                              <span style={{fontSize:'0.9rem'}}>{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {q.questionType==='VALUE' && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border">
                          Your answer: <strong>{String(answers[idx]||'(no answer)')}</strong>
                        </span>
                        <span className="badge bg-success">
                          Correct: <strong>{String(q.correctAnswers[0])}</strong>
                        </span>
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
const Stats2Quiz = () => {
  const { week: weekParam } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const weekNum = parseInt(weekParam, 10)
  const { quizName } = location.state || {}
  const displayName = quizName || `Week ${weekNum}`

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
  const [tabWarning, setTabWarning] = useState(false)

  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const cheatingRef      = useRef(0)
  const userRef          = useRef(null)
  const questionRef      = useRef(null)
  const devToolsIntervalRef = useRef(null)

  useEffect(() => { loadMathJax() }, [])
  useEffect(() => { if (questionRef.current) typesetEl(questionRef.current) }, [currentIndex, questions])
  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data); userRef.current = res.data
        fetchQuestions()
      } else {
        navigate('/login', { replace: true })
      }
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/iitm_stats2_questions?week=${weekNum}`, { withCredentials: true })
      const data = res.data
      const qs = Array.isArray(data) ? data : (data.questions || [])
      if (!qs.length) { setError('No questions found for this week.'); setLoading(false); return }
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

  useEffect(() => {
    if (submitted || loading) return
    const onContext = e => e.preventDefault()
    const onKey = e => {
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) ||
          (e.ctrlKey && ['U','u'].includes(e.key))) {
        e.preventDefault(); logCheat('keyboard_shortcut')
      }
      if (e.ctrlKey && ['A','a','C','c','V','v'].includes(e.key)) e.preventDefault()
    }
    const onBlur = () => { setTabWarning(true); logCheat('tab_switch') }
    const onFocus = () => setTabWarning(false)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('keydown', onKey)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    devToolsIntervalRef.current = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
        logCheat('devtools_open')
      }
    }, 2000)
    return () => {
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      clearInterval(devToolsIntervalRef.current)
    }
  }, [submitted, loading])

  const logCheat = async (type) => {
    cheatingRef.current += 1
    try {
      await axios.post(`${API_URL}/api/log-cheating`, {
        email: userRef.current?.email, type, quiz: displayName, timestamp: new Date().toISOString()
      }, { withCredentials: true })
    } catch {}
    if (cheatingRef.current >= 5) handleSubmit(true)
  }

  const setAnswer = (idx, val) => setAnswers(prev => ({ ...prev, [idx]: val }))
  const toggleMSQ = (idx, opt) => {
    setAnswers(prev => {
      const cur = Array.isArray(prev[idx]) ? prev[idx] : []
      return { ...prev, [idx]: cur.includes(opt) ? cur.filter(x=>x!==opt) : [...cur, opt] }
    })
  }

  const recordTime = () => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[currentIndex] = elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (idx) => { recordTime(); setCurrentIndex(idx) }

  const handleSubmit = async (forced = false) => {
    if (!forced) {
      const unanswered = questions.filter((_,i) => {
        const a = answers[i]
        return a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
      }).length
      if (unanswered > 0 && !window.confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return
    }
    recordTime()

    let correctCount = 0
    let totalScore = 0
    const responses = []

    questions.forEach((q, i) => {
      const userAns = answers[i]
      let isCorrect = false
      let marksAwarded = 0

      if (q.questionType === 'MCQ') {
        isCorrect = userAns === q.correctAnswers[0]
      } else if (q.questionType === 'MSQ') {
        const userSet = new Set((Array.isArray(userAns) ? userAns : []).map(a => String(a).trim()))
        const corrSet = new Set(q.correctAnswers.map(a => String(a).trim()))
        isCorrect = userSet.size === corrSet.size && [...userSet].every(a => corrSet.has(a))
      } else if (q.questionType === 'VALUE') {
        isCorrect = String(userAns||'').trim() === String(q.correctAnswers[0]||'').trim()
      }

      if (isCorrect) {
        correctCount++
        marksAwarded = q.marks || 1
        totalScore += marksAwarded
      }

      responses.push({
        questionId: q._id,
        questionText: q.questionText,
        userResponse: Array.isArray(userAns) ? userAns : [userAns || ''],
        correctAnswers: q.correctAnswers,
        isCorrect,
        marksAwarded
      })
    })

    const totalTime = Object.values(timesRef.current).reduce((a,b)=>a+b, 0)
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

    setResults({ correctAnswers: correctCount, totalScore, percentage, totalTime, responses })
    setSubmitted(true)

    const u = userRef.current
    if (!u?.email) return
    setSaving(true)
    try {
      const subtopic = questions[0]?.subtopic || `Week ${weekNum} Mixed Topics`
      await axios.post(`${API_URL}/api/iitm_stats2_scores`, {
        email: u.email,
        name: u.username || u.name || u.email,
        week: weekNum,
        subtopic,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        score: totalScore,
        responses
      }, { withCredentials: true })
    } catch (e) {
      console.error('Failed to save score:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setAnswers({}); setSubmitted(false); setResults(null)
    setCurrentIndex(0); timesRef.current = {}; cheatingRef.current = 0
    fetchQuestions()
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height:'60vh'}}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"/>
        <p className="text-muted">Loading {displayName}…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="container py-5 text-center">
      <i className="bi bi-exclamation-triangle fs-1 text-danger"/>
      <h4 className="mt-3">{error}</h4>
      <button className="btn btn-primary mt-3" onClick={fetchQuestions}>Retry</button>
      <Link to="/courses/statistics2" className="btn btn-outline-secondary mt-3 ms-2">Back</Link>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage
      questions={questions} answers={answers} results={results}
      quizName={displayName} weekNum={weekNum} onRetake={handleRetake}
    />
  )

  const q = questions[currentIndex]
  const userAns = answers[currentIndex]
  const isAnswered = userAns !== undefined && userAns !== null && userAns !== '' &&
    !(Array.isArray(userAns) && !userAns.length)
  const answeredCount = questions.filter((_,i) => {
    const a = answers[i]
    return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
  }).length

  return (
    <main className="main">
      {tabWarning && (
        <div style={{position:'fixed',top:0,left:0,right:0,zIndex:10000,background:'#dc3545',color:'#fff',textAlign:'center',padding:'8px',fontWeight:600}}>
          ⚠️ Tab switching detected! Please stay on this page.
          <button onClick={()=>setTabWarning(false)} style={{marginLeft:16,background:'none',border:'1px solid #fff',color:'#fff',borderRadius:4,padding:'2px 10px',cursor:'pointer'}}>Dismiss</button>
        </div>
      )}

      <div className="page-title" data-aos="fade" style={{marginBottom:'2rem'}}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">IITM Statistics 2 — Week {weekNum} Assessment</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/statistics2">Statistics 2</Link></li>
          <li className="current">{displayName}</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5" ref={questionRef}>
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm" style={{borderRadius:16}}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted small">Question {currentIndex+1} of {questions.length}</span>
                  <div className="d-flex gap-2 align-items-center">
                    <span className={`badge ${isAnswered?'bg-success':'bg-secondary'}`}>
                      {isAnswered?'Answered':'Unanswered'}
                    </span>
                    <span className="badge bg-primary">{q.questionType}</span>
                    {q.subtopic && <span className="badge bg-info text-dark" style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.subtopic}</span>}
                    <span className="badge bg-light text-dark border">{q.marks||1} pt{(q.marks||1)!==1?'s':''}</span>
                  </div>
                </div>
                <div className="progress mb-4" style={{height:6}}>
                  <div className="progress-bar bg-primary" style={{width:`${((currentIndex+1)/questions.length)*100}%`}}/>
                </div>

                <p className="mb-4" style={{fontSize:'1.05rem',lineHeight:1.75,whiteSpace:'pre-wrap'}}>{q.questionText}</p>

                {q.questionType === 'MCQ' && q.options && (
                  <div>
                    {q.options.map((opt, oi) => (
                      <div key={oi}
                        onClick={() => setAnswer(currentIndex, opt)}
                        className={`d-flex align-items-center gap-2 mb-2 p-3 rounded border ${userAns===opt?'border-primary bg-primary bg-opacity-10':''}`}
                        style={{cursor:'pointer',transition:'all 0.15s'}}>
                        <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${userAns===opt?'#0d6efd':'#adb5bd'}`,background:userAns===opt?'#0d6efd':'transparent',flexShrink:0}}/>
                        <span style={{fontSize:'0.95rem'}}>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {q.questionType === 'MSQ' && q.options && (
                  <div>
                    <p className="text-muted small mb-2">Select all that apply</p>
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(userAns) && userAns.includes(opt)
                      return (
                        <div key={oi}
                          onClick={() => toggleMSQ(currentIndex, opt)}
                          className={`d-flex align-items-center gap-2 mb-2 p-3 rounded border ${selected?'border-primary bg-primary bg-opacity-10':''}`}
                          style={{cursor:'pointer',transition:'all 0.15s'}}>
                          <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${selected?'#0d6efd':'#adb5bd'}`,background:selected?'#0d6efd':'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {selected && <i className="bi bi-check text-white" style={{fontSize:12}}/>}
                          </div>
                          <span style={{fontSize:'0.95rem'}}>{opt}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.questionType === 'VALUE' && (
                  <div>
                    <p className="text-muted small mb-2">Enter your numeric answer</p>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter answer..."
                      value={userAns || ''}
                      onChange={e => setAnswer(currentIndex, e.target.value)}
                      style={{maxWidth:300,fontFamily:'monospace',fontSize:'1.1rem'}}
                    />
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <button className="btn btn-outline-secondary" onClick={()=>goTo(currentIndex-1)} disabled={currentIndex===0}>
                    <i className="bi bi-arrow-left me-1"/>Prev
                  </button>
                  <span className="text-muted small">{answeredCount}/{questions.length} answered</span>
                  {currentIndex < questions.length-1
                    ? <button className="btn btn-primary" onClick={()=>goTo(currentIndex+1)}>
                        Next<i className="bi bi-arrow-right ms-1"/>
                      </button>
                    : <button className="btn btn-success" onClick={()=>handleSubmit(false)} disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check-lg me-1"/>Submit</>}
                      </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3" style={{borderRadius:16}}>
              <div className="card-body p-3">
                <h6 className="fw-bold mb-3">Question Navigator</h6>
                <div className="d-flex flex-wrap gap-2">
                  {questions.map((_,i) => {
                    const a = answers[i]
                    const done = a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && !a.length)
                    return (
                      <button key={i} onClick={()=>goTo(i)}
                        className={`btn btn-sm ${i===currentIndex?'btn-primary':done?'btn-success':'btn-outline-secondary'}`}
                        style={{width:36,height:36,padding:0,fontWeight:600}}>
                        {i+1}
                      </button>
                    )
                  })}
                </div>
                <hr/>
                <div className="d-flex justify-content-between small text-muted">
                  <span><span className="badge bg-success me-1">■</span>Answered</span>
                  <span><span className="badge bg-secondary me-1">■</span>Skipped</span>
                  <span><span className="badge bg-primary me-1">■</span>Current</span>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm" style={{borderRadius:16}}>
              <div className="card-body p-3 text-center">
                <p className="text-muted small mb-2">{answeredCount}/{questions.length} answered</p>
                <button className="btn btn-success w-100" onClick={()=>handleSubmit(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check-lg me-1"/>Submit Quiz</>}
                </button>
                <Link to="/courses/statistics2" className="btn btn-outline-secondary w-100 mt-2 btn-sm">
                  <i className="bi bi-arrow-left me-1"/>Exit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={()=>setShowCalc(v=>!v)}
        style={{position:'fixed',bottom:20,right:20,width:48,height:48,borderRadius:'50%',
          background:'linear-gradient(135deg,#667eea,#764ba2)',border:'none',color:'#fff',
          fontSize:22,cursor:'pointer',boxShadow:'0 4px 12px rgba(102,126,234,0.5)',zIndex:9998}}>
        🧮
      </button>
      {showCalc && <Calculator onClose={()=>setShowCalc(false)}/>}
    </main>
  )
}

export default Stats2Quiz
