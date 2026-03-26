import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const DIFF_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' }
const TOPIC_PALETTE = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#6f42c1','#fd7e14','#858796']

// Resolve option index → option text (or return value as-is if already text)
function resolveOptionText(question, idxOrText) {
  if (idxOrText === undefined || idxOrText === null) return ''
  const opts = question.options || []
  const idx = typeof idxOrText === 'number' ? idxOrText : parseInt(idxOrText)
  if (!isNaN(idx) && idx >= 0 && idx < opts.length) return opts[idx]
  return String(idxOrText)
}

// ─── MathJax helpers ──────────────────────────────────────────────────────────
function loadMathJax() {
  if (window.MathJax) return
  window.MathJax = {
    tex: {
      inlineMath: [['$','$'],['\\(','\\)']],
      displayMath: [['$$','$$'],['\\[','\\]']],
      processEscapes: true,
    },
    options: { skipHtmlTags: ['script','noscript','style','textarea','pre'] }
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
    // MathJax not ready yet — retry shortly
    setTimeout(() => {
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {})
    }, 800)
  }
}

// ─── Calculator ───────────────────────────────────────────────────────────────
const Calculator = ({ onClose }) => {
  const [display, setDisplay] = useState('0')
  const [prev, setPrev] = useState(null)
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true)

  const pressNum = (v) => {
    if (fresh) { setDisplay(String(v)); setFresh(false) }
    else setDisplay(d => d === '0' ? String(v) : d + v)
  }
  const pressOp = (o) => { setPrev(parseFloat(display)); setOp(o); setFresh(true) }
  const pressDot = () => setDisplay(d => d.includes('.') ? d : d + '.')
  const del = () => setDisplay(d => d.length > 1 ? d.slice(0,-1) : '0')
  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(true) }

  const equals = () => {
    const cur = parseFloat(display)
    if (prev === null || !op) return
    const res = { '+': prev+cur, '-': prev-cur, '*': prev*cur, '/': prev/cur, '^': Math.pow(prev,cur) }[op]
    setDisplay(String(parseFloat((res).toFixed(10))))
    setPrev(null); setOp(null); setFresh(true)
  }

  const fn = (f) => {
    const v = parseFloat(display)
    const map = { sqrt: Math.sqrt(v), log: Math.log10(v), ln: Math.log(v),
      sin: Math.sin(v*Math.PI/180), cos: Math.cos(v*Math.PI/180), tan: Math.tan(v*Math.PI/180),
      '1/x': 1/v, 'x²': v*v, 'π': Math.PI, 'e': Math.E }
    setDisplay(String(parseFloat((map[f]).toFixed(10))))
    setFresh(true)
  }

  const btn = (label, action, color='#495057') => (
    <button key={label} onClick={action}
      style={{ padding:'7px 4px', border:'none', borderRadius:6, fontSize:'0.8rem',
        fontWeight:600, cursor:'pointer', background:color, color:'#fff' }}>
      {label}
    </button>
  )

  return (
    <div style={{ position:'fixed', bottom:80, right:20, width:260, background:'#1a1a2e',
      borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:9999, padding:12 }}
      onContextMenu={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span style={{color:'#aaa', fontSize:'0.78rem'}}>🧮 Calculator</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#aaa',fontSize:18,cursor:'pointer',lineHeight:1}}>×</button>
      </div>
      <div style={{background:'#0f0f1a',borderRadius:8,padding:'8px 12px',marginBottom:8,textAlign:'right',minHeight:42}}>
        {op && <div style={{fontSize:'0.68rem',color:'#888'}}>{prev} {op}</div>}
        <div style={{fontSize:'1.2rem',fontWeight:700,color:'#fff',wordBreak:'break-all'}}>{display}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,marginBottom:4}}>
        {btn('sin',()=>fn('sin'),'#6f42c1')} {btn('cos',()=>fn('cos'),'#6f42c1')}
        {btn('tan',()=>fn('tan'),'#6f42c1')} {btn('log',()=>fn('log'),'#6f42c1')}
        {btn('ln',()=>fn('ln'),'#6f42c1')}  {btn('√',()=>fn('sqrt'),'#6f42c1')}
        {btn('x²',()=>fn('x²'),'#6f42c1')} {btn('1/x',()=>fn('1/x'),'#6f42c1')}
        {btn('π',()=>fn('π'),'#0d6efd')}   {btn('e',()=>fn('e'),'#0d6efd')}
        {btn('^',()=>pressOp('^'),'#fd7e14')} {btn('C',clear,'#dc3545')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
        {btn('7',()=>pressNum('7'))} {btn('8',()=>pressNum('8'))} {btn('9',()=>pressNum('9'))} {btn('÷',()=>pressOp('/'), '#343a40')}
        {btn('4',()=>pressNum('4'))} {btn('5',()=>pressNum('5'))} {btn('6',()=>pressNum('6'))} {btn('×',()=>pressOp('*'),'#343a40')}
        {btn('1',()=>pressNum('1'))} {btn('2',()=>pressNum('2'))} {btn('3',()=>pressNum('3'))} {btn('−',()=>pressOp('-'),'#343a40')}
        {btn('0',()=>pressNum('0'))} {btn('.',pressDot)}           {btn('+',()=>pressOp('+'),'#343a40')} {btn('⌫',del,'#6c757d')}
        <button onClick={equals} style={{gridColumn:'1/-1',padding:'8px',border:'none',borderRadius:6,
          fontWeight:700,cursor:'pointer',background:'#28a745',color:'#fff',fontSize:'0.9rem'}}>=</button>
      </div>
    </div>
  )
}

// ─── Review Page ──────────────────────────────────────────────────────────────
const ReviewPage = ({ questions, answers, results, quizName, onRetake, topicColorMap }) => {
  const [expanded, setExpanded] = useState(null)
  const reviewRef = useRef(null)

  useEffect(() => { if (reviewRef.current) typesetEl(reviewRef.current) }, [expanded])

  const getDisplayAnswer = (q, answer) => {
    if (answer === null || answer === undefined || answer === '') return '(no answer)'
    if (q.type === 'multiple_choice') {
      const idx = typeof answer === 'string' ? parseInt(answer) : answer
      return q.options?.[idx] ?? String(answer)
    }
    if (q.type === 'multiple_select') {
      const arr = Array.isArray(answer) ? answer : [answer]
      return arr.map(i => q.options?.[i] ?? String(i)).join(', ')
    }
    return String(answer)
  }

  const getCorrectDisplay = (q) => {
    const ca = q.correct_answer
    if (q.type === 'multiple_choice') {
      return resolveOptionText(q, ca)
    }
    if (q.type === 'multiple_select') {
      const arr = Array.isArray(ca) ? ca : [ca]
      return arr.map(i => resolveOptionText(q, i)).join(', ')
    }
    return String(ca)
  }

  return (
    <main className="main" ref={reviewRef}>
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
          <li><Link to="/courses/IIITM-math">IITM Math</Link></li>
          <li className="current">Review</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {/* Score card */}
        <div className="card border-0 shadow-sm mb-4 text-center" style={{borderRadius:16}}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{width:120,height:120,borderRadius:'50%',
                  background: results.percentage>=60 ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:28,fontWeight:700,color:'#fff'}}>{results.percentage}%</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.85)'}}>{results.score}/{questions.length}</span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">{results.percentage>=80?'Excellent!':results.percentage>=60?'Good job!':'Keep practicing!'}</h4>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{results.score}</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{questions.length - results.score}</strong>
                </p>
                <p className="text-muted mb-0">
                  Total time: {Math.floor(results.totalTime/60)}m {results.totalTime%60}s
                </p>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary" onClick={onRetake}>
                <i className="bi bi-arrow-clockwise me-1"/>Retake
              </button>
              <Link to="/courses/IIITM-math" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1"/>Back
              </Link>
            </div>
          </div>
        </div>

        {/* Per-question */}
        {questions.map((q, idx) => {
          const res = results.questionResults[idx]
          const isOpen = expanded === idx
          const topicColor = topicColorMap?.[q.originalTopic || q.topic] || '#6c757d'

          return (
            <div key={q._id} className="card border-0 shadow-sm mb-3"
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
                        Q{idx+1}. {!isOpen && q.question_text.length>100 ? q.question_text.slice(0,100)+'…' : q.question_text}
                      </p>
                      <i className={`bi bi-chevron-${isOpen?'up':'down'} ms-2 text-muted`} style={{flexShrink:0}}/>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      <span className={`badge bg-${DIFF_COLORS[q.difficulty]||'secondary'}`}>{q.difficulty}</span>
                      <span className="badge" style={{background:topicColor}}>{q.originalTopic||q.topic}</span>
                      {res?.timeTaken>0 && <span className="badge bg-light text-dark"><i className="bi bi-clock me-1"/>{res.timeTaken}s</span>}
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ms-5 ps-2">
                    {/* MCQ options */}
                    {(q.type==='multiple_choice'||q.type==='multiple_select') && q.options && (
                      <div className="mb-3">
                        {q.options.map((opt,oi)=>{
                          const norm = t => String(t??'').replace(/\s+/g,'').replace(/infinity|∞/gi,'inf').replace(/≤/g,'<=').replace(/≥/g,'>=').toLowerCase()
                          const caArr = q.type==='multiple_select' ? (Array.isArray(q.correct_answer)?q.correct_answer:[q.correct_answer]) : []
                          const isCorrectOpt = q.type==='multiple_choice'
                            ? norm(opt) === norm(resolveOptionText(q, q.correct_answer))
                            : caArr.some(ca => norm(resolveOptionText(q, ca)) === norm(opt))
                          const userPicked = q.type==='multiple_choice'
                            ? answers[q._id] === oi
                            : (Array.isArray(answers[q._id]) ? answers[q._id].includes(oi) : false)
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
                    {/* Text types */}
                    {q.type!=='multiple_choice' && q.type!=='multiple_select' && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border">Your answer: <strong>{getDisplayAnswer(q,answers[q._id])}</strong></span>
                        <span className="badge bg-success">Correct: <strong>{getCorrectDisplay(q)}</strong></span>
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
const IITMMathQuiz = () => {
  const { topic } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { quizName, topics: multiTopics, countPerTopic = 10 } = location.state || {}
  const displayName = quizName || topic?.replace(/_/g,' ').replace(/-/g,' ')

  // State
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
  const [topicColorMap, setTopicColorMap] = useState({})

  // Refs
  const questionStartRef = useRef(Date.now())
  const timesRef         = useRef({})
  const cheatingRef      = useRef(0)
  const devToolsWarnedRef = useRef(false)
  const userRef          = useRef(null)
  const questionRef      = useRef(null)
  const devToolsIntervalRef = useRef(null)

  // ── MathJax ──
  useEffect(() => { loadMathJax() }, [])
  useEffect(() => {
    if (questionRef.current) typesetEl(questionRef.current)
  }, [currentIndex, questions])

  // ── Auth + fetch ──
  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        userRef.current = res.data
        fetchQuestions(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchQuestions = async (email) => {
    try {
      let allQuestions = []

      if (multiTopics && multiTopics.length > 0) {
        // Multi-topic: fetch countPerTopic from each topic in parallel
        const colorMap = {}
        multiTopics.forEach((t, i) => { colorMap[t.name] = TOPIC_PALETTE[i % TOPIC_PALETTE.length] })
        setTopicColorMap(colorMap)

        const fetches = multiTopics.map(t =>
          axios.get(`${API_URL}/api/iitm-math-questions/${encodeURIComponent(t.endpoint)}?email=${encodeURIComponent(email)}&count=${countPerTopic}`, { withCredentials: true })
            .then(r => (r.data.questions || []).map(q => ({ ...q, originalTopic: t.name })))
            .catch(() => [])
        )
        const results = await Promise.all(fetches)
        allQuestions = results.flat()
        // Fisher-Yates shuffle
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]]
        }
      } else {
        // Single topic
        const res = await axios.get(
          `${API_URL}/api/iitm-math-questions/${encodeURIComponent(topic)}?email=${encodeURIComponent(email)}&count=50`,
          { withCredentials: true }
        )
        allQuestions = (res.data.questions || []).map(q => ({ ...q, originalTopic: q.topic || topic }))
        const colorMap = {}
        colorMap[topic] = TOPIC_PALETTE[0]
        setTopicColorMap(colorMap)
      }

      if (allQuestions.length === 0) {
        setError('No questions found for this topic yet.')
      } else {
        setQuestions(allQuestions)
      }
    } catch {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Anti-cheat ──
  const recordCheat = useCallback(async (type) => {
    cheatingRef.current += 1
    const u = userRef.current
    if (u?.email) {
      axios.post(`${API_URL}/api/log-cheating`, {
        username: u.username || u.email,
        email: u.email,
        cheatingType: type,
        timestamp: new Date(),
        currentQuestion: cheatingRef.current,
        quizType: topic
      }, { withCredentials: true }).catch(() => {})
    }
    if (cheatingRef.current >= 5) {
      alert('Too many suspicious activities detected. Quiz will be auto-submitted.')
      doSubmit()
    }
  }, [topic])

  useEffect(() => {
    const onContextMenu = (e) => { e.preventDefault(); recordCheat('right_click'); return false }
    const onKeyDown = (e) => {
      if (e.keyCode===123 || (e.ctrlKey&&e.shiftKey&&e.keyCode===73) ||
          (e.ctrlKey&&e.keyCode===85) || (e.ctrlKey&&e.keyCode===83) || e.keyCode===44) {
        e.preventDefault(); recordCheat('keyboard_shortcut'); return false
      }
      if (e.ctrlKey && (e.keyCode===65||e.keyCode===67||e.keyCode===86)) {
        e.preventDefault(); recordCheat('copy_paste'); return false
      }
    }
    const onSelectStart = () => { recordCheat('text_selection'); return false }
    const onFocus = () => { setWarningOverlay(false) }
    const onBlur = () => { if (!showCalc) { recordCheat('tab_switch'); setWarningOverlay(true) } }

    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)
    document.onselectstart = onSelectStart
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)

    // DevTools detection
    devToolsIntervalRef.current = setInterval(() => {
      if (window.outerHeight - window.innerHeight > 160 || window.outerWidth - window.innerWidth > 160) {
        if (!devToolsWarnedRef.current) {
          devToolsWarnedRef.current = true
          recordCheat('developer_tools')
          alert('Developer tools detected! This attempt has been logged.')
        }
      } else {
        devToolsWarnedRef.current = false
      }
    }, 500)

    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
      document.onselectstart = null
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      clearInterval(devToolsIntervalRef.current)
    }
  }, [recordCheat, showCalc])

  const [warningOverlay, setWarningOverlay] = useState(false)

  // ── Helpers ──
  const saveCurrentTime = (qId) => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[qId] = (timesRef.current[qId] || 0) + elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (newIdx) => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)
    setCurrentIndex(newIdx)
  }

  const handleAnswer = (qId, value) => setAnswers(p => ({ ...p, [qId]: value }))

  const handleMultiSelect = (qId, optIdx, checked) => {
    setAnswers(p => {
      const cur = p[qId] || []
      return { ...p, [qId]: checked ? [...cur, optIdx] : cur.filter(i => i !== optIdx) }
    })
  }

  const checkCorrect = (question, userAnswer) => {
    const ca = question.correct_answer
    const alts = question.alternative_answers || []

    // Normalize like the HTML version: remove all whitespace, convert symbols, lowercase
    const norm = t => String(t ?? '')
      .replace(/\s+/g, '')
      .replace(/infinity|∞/gi, 'inf')
      .replace(/√(\d+)/g, 'sqrt($1)')
      .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
      .replace(/≠/g, '!=')
      .replace(/≤/g, '<=')
      .replace(/≥/g, '>=')
      .toLowerCase()

    if (question.type === 'multiple_choice') {
      if (userAnswer === undefined || userAnswer === null) return false
      const selectedText = resolveOptionText(question, userAnswer)
      const correctText = resolveOptionText(question, ca)
      if (norm(selectedText) === norm(correctText)) return true
      return alts.some(a => norm(resolveOptionText(question, a)) === norm(selectedText) || norm(a) === norm(selectedText))
    }

    if (question.type === 'multiple_select') {
      if (!Array.isArray(userAnswer) || userAnswer.length === 0) return false
      const caArr = Array.isArray(ca) ? ca : [ca]
      const selectedTexts = userAnswer.map(i => norm(resolveOptionText(question, i))).sort()
      const correctTexts = caArr.map(a => norm(resolveOptionText(question, a))).sort()
      return JSON.stringify(selectedTexts) === JSON.stringify(correctTexts)
    }

    if (question.type === 'numeric' || question.type === 'numeric_input') {
      const uNum = parseFloat(userAnswer), cNum = parseFloat(ca)
      if (isNaN(uNum) || isNaN(cNum)) return false
      const tol = Math.max(Math.abs(cNum) * 0.01, 0.001)
      if (Math.abs(uNum - cNum) <= tol) return true
      return alts.some(a => { const an = parseFloat(a); return !isNaN(an) && Math.abs(uNum - an) <= Math.max(Math.abs(an) * 0.01, 0.001) })
    }

    // interval_input, coordinate_input, text_input, equation_input etc.
    const ua = norm(userAnswer)
    if (ua === norm(ca)) return true
    return alts.some(a => norm(a) === ua)
  }

  const doSubmit = async () => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)

    const questionResults = questions.map(question => {
      const ua = answers[question._id]
      const fmt = (a) => Array.isArray(a) ? a.join(', ') : String(a ?? '')
      return {
        questionId: question._id,
        questionNumber: question.question_number,
        questionText: question.question_text,
        userAnswer: fmt(ua),
        correctAnswer: fmt(question.correct_answer),
        isCorrect: checkCorrect(question, ua),
        timeTaken: timesRef.current[question._id] || 0
      }
    })

    const score = questionResults.filter(r => r.isCorrect).length
    const percentage = Math.round((score / questions.length) * 100)
    const totalTime = Object.values(timesRef.current).reduce((s, t) => s + t, 0)

    setSaving(true)
    try {
      const u = userRef.current
      await axios.post(`${API_URL}/api/iitmmath_scores`, {
        email: u.email,
        username: u.username || u.name || u.email,
        quizData: { topic, score, totalQuestions: questions.length, percentage, timestamp: new Date(), questionResults }
      }, { withCredentials: true })
    } catch (err) {
      console.error('Score save failed:', err)
    } finally {
      setSaving(false)
    }

    setResults({ score, percentage, totalTime, questionResults })
    setSubmitted(true)
    clearInterval(devToolsIntervalRef.current)
    // Restore context menu / selection on review page
    document.onselectstart = null
  }

  const handleRetake = () => {
    setAnswers({}); setCurrentIndex(0); setSubmitted(false); setResults(null)
    timesRef.current = {}; cheatingRef.current = 0; devToolsWarnedRef.current = false
    questionStartRef.current = Date.now()
    if (userRef.current) fetchQuestions(userRef.current.email)
    setLoading(true)
  }

  // ── Input rendering ──
  const renderInput = (question) => {
    const { _id, type, options, format_hint } = question
    const answer = answers[_id]

    if (type === 'multiple_choice') {
      return (
        <div className="mt-3">
          {options?.map((opt, idx) => (
            <div key={idx} className="form-check mb-2">
              <input className="form-check-input" type="radio" name={`q-${_id}`}
                id={`opt-${_id}-${idx}`}
                checked={(typeof answer==='string'?parseInt(answer):answer)===idx}
                onChange={()=>handleAnswer(_id,idx)} />
              <label className="form-check-label" htmlFor={`opt-${_id}-${idx}`}
                style={{fontSize:'0.95rem',cursor:'pointer'}}>{opt}</label>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'multiple_select') {
      const sel = answer || []
      return (
        <div className="mt-3">
          <small className="text-muted d-block mb-2"><i className="bi bi-info-circle me-1"/>Select all that apply</small>
          {options?.map((opt, idx) => (
            <div key={idx} className="form-check mb-2">
              <input className="form-check-input" type="checkbox"
                id={`opt-${_id}-${idx}`}
                checked={sel.includes(idx)}
                onChange={e=>handleMultiSelect(_id, idx, e.target.checked)} />
              <label className="form-check-label" htmlFor={`opt-${_id}-${idx}`}
                style={{fontSize:'0.95rem',cursor:'pointer'}}>{opt}</label>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'numeric' || type === 'numeric_input') {
      return (
        <div className="mt-3">
          {format_hint && <small className="text-muted d-block mb-1">{format_hint}</small>}
          <input type="number" className="form-control" style={{maxWidth:220}}
            value={answer??''} placeholder="e.g. 3.14, −5, 1/3"
            onChange={e=>handleAnswer(_id,e.target.value)} autoComplete="off" />
        </div>
      )
    }

    const placeholders = {
      interval_input: 'e.g. (-∞, 3] or [1,5)∪(5,∞)',
      coordinate_input: 'e.g. (2, 3) or (−1/2, √2)',
      equation_input: 'e.g. f(x) = x² + 1',
      set_notation: 'e.g. {x | x ≠ 0}',
    }
    return (
      <div className="mt-3">
        {format_hint && <small className="text-muted d-block mb-1">{format_hint}</small>}
        <input type="text" className="form-control" style={{maxWidth:400}}
          value={answer??''} placeholder={placeholders[type]||'Type your answer here'}
          onChange={e=>handleAnswer(_id,e.target.value)} autoComplete="off" spellCheck="false" />
      </div>
    )
  }

  // ── Render guards ──
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height:'50vh'}}>
      <div className="text-center">
        <div className="spinner-border mb-3" role="status"/>
        {multiTopics && <p className="text-muted">Loading questions from {multiTopics.length} topics…</p>}
      </div>
    </div>
  )

  if (error) return (
    <div className="container mt-5 text-center">
      <div className="alert alert-warning">{error}</div>
      <Link to="/courses/IIITM-math" className="btn btn-primary">Back to IITM Math</Link>
    </div>
  )

  if (submitted && results) return (
    <ReviewPage questions={questions} answers={answers} results={results}
      quizName={displayName} onRetake={handleRetake} topicColorMap={topicColorMap} />
  )

  const q = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k]; return a !== undefined && a !== '' && !(Array.isArray(a) && a.length===0)
  }).length
  const progress = Math.round(((currentIndex+1)/questions.length)*100)
  const topicColor = topicColorMap?.[q.originalTopic||q.topic] || '#6c757d'

  return (
    <main className="main" style={{userSelect:'none',WebkitUserSelect:'none'}}>
      {/* Warning overlay for tab switch */}
      {warningOverlay && (
        <div style={{position:'fixed',inset:0,background:'rgba(220,53,69,0.96)',zIndex:10000,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
          <i className="bi bi-exclamation-triangle-fill" style={{fontSize:64,marginBottom:16}}/>
          <h2>Focus Lost!</h2>
          <p style={{fontSize:'1.2rem'}}>Please return to the quiz. This has been logged.</p>
          <button className="btn btn-light btn-lg mt-3" onClick={()=>setWarningOverlay(false)}>
            Return to Quiz
          </button>
        </div>
      )}

      {/* Calculator */}
      {showCalc && <Calculator onClose={()=>setShowCalc(false)} />}

      {/* Floating calculator button */}
      <button onClick={()=>setShowCalc(v=>!v)}
        style={{position:'fixed',bottom:20,right:20,width:56,height:56,borderRadius:'50%',
          background:'linear-gradient(135deg,#667eea,#764ba2)',border:'none',color:'#fff',
          fontSize:22,cursor:'pointer',boxShadow:'0 4px 16px rgba(102,126,234,0.5)',zIndex:9998,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
        🧮
      </button>

      <div className="page-title" style={{marginBottom:'2rem'}}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>{displayName}</h1>
              <p className="mb-0">
                IITM Mathematics — {questions.length} questions
                {multiTopics && <span className="ms-2 badge bg-primary">{multiTopics.length} topics</span>}
              </p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/courses/IIITM-math">IITM Math</Link></li>
          <li className="current">{displayName}</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Progress */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Question {currentIndex+1} of {questions.length}</small>
                <small className="text-muted">{answeredCount} answered</small>
              </div>
              <div className="progress" style={{height:6}}>
                <div className="progress-bar bg-primary" style={{width:`${progress}%`}}/>
              </div>
            </div>

            {/* Question card */}
            <div className="card border-0 shadow-sm mb-3" style={{borderRadius:12}} ref={questionRef}>
              <div className="card-body p-4">
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <span className={`badge bg-${DIFF_COLORS[q.difficulty]||'secondary'}`}>{q.difficulty}</span>
                  <span className="badge" style={{background:topicColor}}>{q.originalTopic||q.topic||topic}</span>
                  <span className="badge bg-secondary text-capitalize">{q.type?.replace(/_/g,' ')}</span>
                  {q.points > 1 && <span className="badge bg-info">{q.points} pts</span>}
                </div>

                <h5 className="mb-3" style={{lineHeight:1.7}}>
                  <span className="text-muted me-2">{currentIndex+1}.</span>
                  {q.question_text}
                </h5>

                {renderInput(q)}
              </div>
            </div>

            {/* Navigation */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-outline-secondary" onClick={()=>goTo(currentIndex-1)} disabled={currentIndex===0}>
                <i className="bi bi-chevron-left me-1"/>Prev
              </button>
              <div className="d-flex gap-1 flex-wrap justify-content-center" style={{maxWidth:380}}>
                {questions.map((qItem, i) => {
                  const ans = answers[qItem._id]
                  const answered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length===0)
                  return (
                    <button key={qItem._id} onClick={()=>goTo(i)}
                      className={`btn btn-sm ${i===currentIndex?'btn-primary':answered?'btn-success':'btn-outline-secondary'}`}
                      style={{width:34,height:34,padding:0,fontSize:'0.78rem'}}>
                      {i+1}
                    </button>
                  )
                })}
              </div>
              {currentIndex < questions.length-1
                ? <button className="btn btn-outline-secondary" onClick={()=>goTo(currentIndex+1)}>
                    Next<i className="bi bi-chevron-right ms-1"/>
                  </button>
                : <button className="btn btn-success" onClick={doSubmit}
                    disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1"/>Saving…</>
                      : <><i className="bi bi-check-circle me-1"/>Submit</>}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default IITMMathQuiz
