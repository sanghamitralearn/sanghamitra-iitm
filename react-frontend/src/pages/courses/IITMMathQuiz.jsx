import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const DIFF_COLORS = { easy: 'success', medium: 'warning', hard: 'danger' }
const TOPIC_PALETTE = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#6f42c1','#fd7e14','#858796']

function resolveOptionText(question, idxOrText) {
  if (idxOrText === undefined || idxOrText === null) return ''
  const opts = question.options || []
  const idx = typeof idxOrText === 'number' ? idxOrText : parseInt(idxOrText)
  if (!isNaN(idx) && idx >= 0 && idx < opts.length) return opts[idx]
  return String(idxOrText)
}

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
    setTimeout(() => {
      if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([el]).catch(() => {})
    }, 800)
  }
}

function toTeX(raw) {
  let s = raw.trim()
  if (!s) return ''
  s = s.replace(/\bpi\b/gi, '\\pi')
  s = s.replace(/\binf(inity)?\b/gi, '\\infty')
  s = s.replace(/sqrt\(([^)]+)\)/g, (_, inner) => `\\sqrt{${toTeX(inner)}}`)
  s = s.replace(/sqrt(\d+)/g, (_, n) => `\\sqrt{${n}}`)
  s = s.replace(/\babs\(([^)]+)\)/g, (_, inner) => `|${inner}|`)
  s = s.replace(/\b(sin|cos|tan|cot|sec|csc|log|ln|exp)\(([^)]+)\)/g,
    (_, fn, arg) => `\\${fn}(${toTeX(arg)})`)
  s = s.replace(/([a-zA-Z0-9)]+)\^(\(([^)]+)\)|[a-zA-Z0-9]+)/g, (_, base, exp, grp) =>
    `${base}^{${toTeX(grp || exp)}}`)
  s = s.replace(/(-?[a-zA-Z0-9\\.]+|\([^)]+\))\s*\/\s*(-?[a-zA-Z0-9\\.]+|\([^)]+\))/g,
    (_, num, den) => `\\frac{${toTeX(num)}}{${toTeX(den)}}`)
  s = s.replace(/!=|≠/g, '\\neq').replace(/>=|≥/g, '\\geq').replace(/<=|≤/g, '\\leq')
  s = s.replace(/\*/g, '\\cdot')
  return s
}

const GUIDE_ENTRIES = [
  { type: 'sqrt(2)',    label: '√2' },   { type: 'sqrt(x+1)', label: '√(x+1)' },
  { type: 'x^2',       label: 'x²' },   { type: 'x^(n+1)',   label: 'xⁿ⁺¹' },
  { type: '3/4',        label: '¾' },    { type: '(a+b)/c',   label: '(a+b)/c' },
  { type: 'pi',         label: 'π' },    { type: 'inf',        label: '∞' },
  { type: 'sin(x)',     label: 'sin x' },{ type: 'cos(x)',    label: 'cos x' },
  { type: 'log(x)',     label: 'log x' },{ type: 'ln(x)',     label: 'ln x' },
  { type: 'abs(x)',     label: '|x|' },  { type: '(-inf, 3]', label: '(-∞,3]' },
  { type: 'x != 0',    label: 'x ≠ 0' },{ type: 'x >= 0',   label: 'x ≥ 0' },
]

const MathPreviewInput = ({ value, onChange, placeholder, type = 'text', style = {} }) => {
  const [showGuide, setShowGuide] = useState(false)
  const previewRef = useRef(null)
  const typesetTimer = useRef(null)

  useEffect(() => {
    if (!previewRef.current) return
    if (!value) return

    const tex = toTeX(value)

    previewRef.current.innerHTML = ''
    previewRef.current.textContent = `\\(${tex}\\)`

    clearTimeout(typesetTimer.current)
    typesetTimer.current = setTimeout(() => {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([previewRef.current]).catch(() => {})
      }
    }, 150)

    return () => clearTimeout(typesetTimer.current)
  }, [value])

  return (
    <div className="mt-3">
      <input
        type={type === 'numeric' ? 'number' : 'text'}
        className="form-control"
        style={{ maxWidth: 420, background: '#E6F1FB', borderColor: '#85B7EB', color: '#042C53', ...style }}
        value={value ?? ''}
        placeholder={placeholder || 'Type your answer here'}
        onChange={e => onChange(e.target.value)}
        autoComplete="off" spellCheck="false"
      />

      {value ? (
        <div style={{
          marginTop: 8, padding: '10px 14px', background: '#fff',
          border: '0.5px solid #85B7EB', borderRadius: 10,
          minHeight: 44, display: 'flex', alignItems: 'center'
        }}>
          <span style={{ fontSize: 11, color: '#888', marginRight: 10 }}>Preview:</span>
          <span ref={previewRef} style={{ fontSize: 20, color: '#042C53' }} />
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {['sqrt(2)', 'pi', 'x^2', '1/3', 'inf', 'sin(x)'].map(ins => (
          <button key={ins} type="button" onClick={() => onChange(ins)}
            style={{ fontSize: 12, padding: '3px 10px', background: '#B5D4F4',
              color: '#0C447C', border: '1px solid #85B7EB', borderRadius: 99, cursor: 'pointer' }}>
            {ins}
          </button>
        ))}
      </div>

      <button type="button" onClick={() => setShowGuide(v => !v)}
        style={{ marginTop: 8, background: 'none', border: 'none', color: '#378ADD',
          fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
        {showGuide ? '▲' : '▼'} Typing guide
      </button>

      {showGuide && (
        <div style={{ marginTop: 6, background: '#EEEDFE', border: '0.5px solid #CECBF6',
          borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            {GUIDE_ENTRIES.map(({ type: t, label }) => (
              <div key={t} onClick={() => onChange(t)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px',
                  cursor: 'pointer', borderBottom: '0.5px solid #CECBF6', borderRadius: 4 }}>
                <code style={{ fontSize: 12, color: '#534AB7', background: '#E6F1FB',
                  border: '1px solid #AFA9EC', borderRadius: 4, padding: '1px 6px' }}>{t}</code>
                <span style={{ fontSize: 12, color: '#AFA9EC' }}>→</span>
                <span style={{ fontSize: 14, color: '#3C3489' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline styles ─────────────────────────────────────────────────────────────
const S = {
  // Question card
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
  // Option (unselected)
  optBase: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #85B7EB',
    background: '#E6F1FB',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginBottom: 0,
  },
  optSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    border: '2px solid #378ADD',
    background: '#B5D4F4',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginBottom: 0,
  },
  optHovered: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #378ADD',
    background: '#d0e7f8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    marginBottom: 0,
  },
  optLabel: (selected) => ({
    fontSize: '0.94rem',
    fontWeight: selected ? 600 : 400,
    color: selected ? '#042C53' : '#185FA5',
    lineHeight: 1.5,
    cursor: 'pointer',
    margin: 0,
  }),
  // Sidebar
  sidebar: {
    background: '#EEEDFE',
    borderRadius: 14,
    border: '0.5px solid #CECBF6',
    padding: 14,
    position: 'sticky',
    top: 20,
  },
  sbHead: {
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#3C3489',
    marginBottom: 10,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 5,
    marginBottom: 12,
  },
  navBtn: (state) => {
    const base = {
      width: 32, height: 32, padding: 0,
      fontSize: '0.75rem', fontWeight: 600,
      border: 'none', borderRadius: 6, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.1s',
    }
    if (state === 'current') return { ...base, background: '#7F77DD', color: '#EEEDFE' }
    if (state === 'answered') return { ...base, background: '#1D9E75', color: '#E1F5EE' }
    return { ...base, background: '#D3D1C7', color: '#444441' }
  },
  legend: {
    borderTop: '0.5px solid #CECBF6',
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  legendRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: '0.7rem', color: '#5F5E5A',
  },
  legendDot: (color) => ({
    width: 10, height: 10, borderRadius: 3,
    background: color, flexShrink: 0,
  }),
  infoPill: {
    background: '#CECBF6',
    borderRadius: 8,
    padding: '7px 12px',
    marginTop: 12,
    fontSize: '0.72rem',
    color: '#3C3489',
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 500,
  },
  // Progress
  progBar: { height: 5, background: '#D3D1C7', borderRadius: 3, marginBottom: 16 },
  progFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#7F77DD', borderRadius: 3, transition: 'width 0.3s' }),
  // Prev/Next
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

// ─── Graph Image ──────────────────────────────────────────────────────────────
const GraphImage = ({ imageFile }) => {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!imageFile) { setSrc(null); return }
    const lower = `/img/Graph_questions/${imageFile.replace(/\.[^.]+$/, '.png')}`
    const upper = `/img/Graph_questions/${imageFile.replace(/\.[^.]+$/, '.PNG')}`
    const img = new Image()
    img.onload = () => setSrc(lower)
    img.onerror = () => {
      const img2 = new Image()
      img2.onload = () => setSrc(upper)
      img2.onerror = () => setSrc(null)
      img2.src = upper
    }
    img.src = lower
  }, [imageFile])

  if (!src) return null

  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <img
        src={src}
        alt="Question graph"
        style={{
          maxWidth: '100%',
          maxHeight: 300,
          borderRadius: 10,
          border: '1.5px solid #85B7EB',
          background: '#fff',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </div>
  )
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
            <div style={S.legendDot(c)}/>
            {l}
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
    if ((q.type === 'numeric' || q.type === 'numeric_input') && !isNaN(parseFloat(answer))) {
      const num = parseFloat(answer)
      return num % 1 === 0 ? num.toString() : num.toFixed(4).replace(/\.?0+$/, '')
    }
    return String(answer)
  }

  const getCorrectDisplay = (q) => {
    const ca = q.correct_answer
    if (q.type === 'multiple_choice') return resolveOptionText(q, ca)
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
        <div className="card border-0 shadow-sm mb-4 text-center" style={{borderRadius:16}}>
          <div className="card-body py-4">
            <div className="row justify-content-center g-4">
              <div className="col-auto">
                <div style={{width:120,height:120,borderRadius:'50%',
                  background: results.percentage>=60 ? 'linear-gradient(135deg,#28a745,#20c997)' : 'linear-gradient(135deg,#dc3545,#c82333)',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontSize:28,fontWeight:700,color:'#fff'}}>{results.percentage}%</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.85)'}}>{results.score}/{results.totalPossible}</span>
                </div>
              </div>
              <div className="col-auto d-flex flex-column justify-content-center text-start">
                <h4 className="mb-1">{results.percentage>=80?'Excellent!':results.percentage>=60?'Good job!':'Keep practicing!'}</h4>
                <p className="text-muted mb-1">
                  Correct: <strong className="text-success">{results.questionResults.filter(r => r.isCorrect).length} Q ({results.score} pts)</strong> &nbsp;|&nbsp;
                  Wrong: <strong className="text-danger">{results.questionResults.filter(r => !r.isCorrect).length} Q</strong>
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
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <p className="mb-1 fw-semibold" style={{fontSize:'0.95rem', flex:1}}>
                        {!isOpen && q.question_text.length>100 ? q.question_text.slice(0,100)+'…' : q.question_text}
                      </p>
                      <div className="d-flex align-items-center gap-2" style={{flexShrink:0}}>
                        <span style={{
                          fontSize:'0.72rem', fontWeight:600, color:'#0C447C',
                          background:'#E6F1FB', border:'1.5px solid #85B7EB',
                          borderRadius:99, padding:'2px 10px', whiteSpace:'nowrap'
                        }}>Q{idx+1}</span>
                        <i className={`bi bi-chevron-${isOpen?'up':'down'} text-muted`}/>
                      </div>
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
                    <GraphImage imageFile={q.image_file} />
                    {(q.type === 'multiple_choice' || q.type === 'multiple_select') && q.options && (
                      <div className="mb-3">
                        {q.options.map((opt, oi) => {
                          // AFTER
                          const caArr = q.type === 'multiple_select'
                            ? (Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]) : []

                          // Resolve correct index — handles both numeric index AND text-based correct_answer
                          const resolvedCorrectIdx = q.type === 'multiple_choice'
                            ? (typeof q.correct_answer === 'number'
                                ? q.correct_answer
                                : !isNaN(parseInt(String(q.correct_answer).trim()))
                                  ? parseInt(String(q.correct_answer).trim())
                                  : q.options?.findIndex(o =>
                                      o?.toLowerCase().trim() === String(q.correct_answer).toLowerCase().trim()
                                    ) ?? -1)
                            : -1

                          const isCorrectOpt = q.type === 'multiple_choice'
                          ? (resolvedCorrectIdx !== -1 && oi === resolvedCorrectIdx)
                          : caArr.includes(oi)

                          const userPicked = q.type === 'multiple_choice'
                            ? (typeof answers[q._id] === 'number'
                                ? answers[q._id] === oi
                                : parseInt(answers[q._id]) === oi)
                            : (Array.isArray(answers[q._id]) ? answers[q._id].includes(oi) : false)

                          let bg = 'transparent'
                            if (isCorrectOpt && userPicked) bg = '#d4edda'   // user picked correctly → green
                            else if (isCorrectOpt) bg = '#d4edda'            // correct option not picked → still green
                            else if (userPicked && !isCorrectOpt) bg = '#f8d7da'  // user picked wrong → red
                          return (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-1 px-2 py-1 rounded" style={{background:bg}}>
                             {isCorrectOpt && userPicked && <i className="bi bi-check-circle-fill text-success"/>}
                              {isCorrectOpt && !userPicked && <i className="bi bi-check-circle text-success"/>}
                              {!isCorrectOpt && userPicked && <i className="bi bi-x-circle-fill text-danger"/>}
                              {!isCorrectOpt && !userPicked && <i className="bi bi-circle text-muted"/>}
                              <span style={{fontSize:'0.9rem'}}>{opt}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {q.type !== 'multiple_choice' && q.type !== 'multiple_select' && (
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <span className="badge bg-light text-dark border">
                          Your answer: <strong>{getDisplayAnswer(q, answers[q._id])}</strong>
                        </span>
                        <span className="badge bg-success">
                          Correct: <strong>{getCorrectDisplay(q)}</strong>
                        </span>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="alert alert-info py-2 mb-0" style={{fontSize:'0.88rem'}}>
                        <i className="bi bi-lightbulb me-2"/>
                        <strong>Explanation:</strong> {q.explanation}
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
  const [hoveredOpt, setHoveredOpt] = useState(null)
  const [warningOverlay, setWarningOverlay] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)

  const questionStartRef    = useRef(Date.now())
  const timesRef            = useRef({})
  const cheatingRef         = useRef(0)
  const devToolsWarnedRef   = useRef(false)
  const userRef             = useRef(null)
  const questionRef         = useRef(null)
  const devToolsIntervalRef = useRef(null)

  useEffect(() => { loadMathJax() }, [])
  useEffect(() => {
    if (questionRef.current) typesetEl(questionRef.current)
  }, [currentIndex, questions])

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data); userRef.current = res.data
        fetchQuestions(res.data.email)
      } else { navigate('/login', { replace: true }) }
    } catch { navigate('/login', { replace: true }) }
  }

  const fetchQuestions = async (email) => {
    try {
      let allQuestions = []
      if (multiTopics && multiTopics.length > 0) {
        const colorMap = {}
        multiTopics.forEach((t, i) => { colorMap[t.name] = TOPIC_PALETTE[i % TOPIC_PALETTE.length] })
        setTopicColorMap(colorMap)
        const fetches = multiTopics.map(t =>
          axios.get(`${API_URL}/api/iitm-math-questions/${encodeURIComponent(t.endpoint)}?email=${encodeURIComponent(email)}&count=${countPerTopic}`, { withCredentials: true })
            .then(r => (r.data.questions || []).map(q => ({ ...q, originalTopic: t.name })))
            .catch(() => [])
        )
        const res = await Promise.all(fetches)
        allQuestions = res.flat()
        for (let i = allQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]]
        }
      } else {
        const res = await axios.get(
          `${API_URL}/api/iitm-math-questions/${encodeURIComponent(topic)}?email=${encodeURIComponent(email)}&count=25`,
          { withCredentials: true }
        )
        allQuestions = (res.data.questions || []).map(q => ({ ...q, originalTopic: q.topic || topic }))
        setTopicColorMap({ [topic]: TOPIC_PALETTE[0] })
      }
      if (allQuestions.length === 0) setError('No questions found for this topic yet.')
      else setQuestions(allQuestions)
    } catch { setError('Failed to load questions. Please try again.') }
    finally { setLoading(false) }
  }

  const recordCheat = useCallback(async (type) => {
    cheatingRef.current += 1
    const u = userRef.current
    if (u?.email) {
      axios.post(`${API_URL}/api/log-cheating`, {
        username: u.username || u.email, email: u.email,
        cheatingType: type, timestamp: new Date(),
        currentQuestion: cheatingRef.current, quizType: topic
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

    devToolsIntervalRef.current = setInterval(() => {
      if (window.outerHeight - window.innerHeight > 160 || window.outerWidth - window.innerWidth > 160) {
        if (!devToolsWarnedRef.current) {
          devToolsWarnedRef.current = true
          recordCheat('developer_tools')
          alert('Developer tools detected! This attempt has been logged.')
        }
      } else { devToolsWarnedRef.current = false }
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

  const saveCurrentTime = (qId) => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    timesRef.current[qId] = (timesRef.current[qId] || 0) + elapsed
    questionStartRef.current = Date.now()
  }

  const goTo = (newIdx) => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)
    setCurrentIndex(newIdx)
    setHoveredOpt(null)
    setShowMobileNav(false)
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

  // ── Guard: empty answer is always wrong ──────────────────────────────────
  if (userAnswer === undefined || userAnswer === null || userAnswer === '') return false
  if (Array.isArray(userAnswer) && userAnswer.length === 0) return false

  // ── Normalizer for text answers ───────────────────────────────────────────
  const norm = (t) => {
    if (t === undefined || t === null) return ''
    let str = String(t).trim()
    str = str.replace(/\s+/g, '').replace(/\\\(/g,'').replace(/\\\)/g,'')
      .replace(/\\\[/g,'').replace(/\\\]/g,'').replace(/\$/g,'')
      .replace(/infinity|∞/gi,'inf').replace(/√\(([^)]+)\)/g,'sqrt($1)')
      .replace(/√(\d+)/g,'sqrt($1)').replace(/≠/g,'!=').replace(/≤/g,'<=')
      .replace(/≥/g,'>=').replace(/×/g,'*').replace(/÷/g,'/')
      .replace(/∪/g,'U').replace(/∩/g,'n').replace(/∈/g,'in')
      .replace(/⊂/g,'subset').replace(/⊆/g,'subseteq')
    // Fraction → decimal
    if (str.includes('/') && !str.includes('sqrt')) {
      const parts = str.split('/')
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
        str = String(parseFloat(parts[0]) / parseFloat(parts[1]))
    }
    return str.replace(/\.0$/, '').toLowerCase()
  }

  // ── MULTIPLE CHOICE ───────────────────────────────────────────────────────
  if (question.type === 'multiple_choice') {
    // Resolves a value to an option index.
    // Handles: number 2, string "2", or option text "Paris"
    const resolveToIndex = (val) => {
      if (val === undefined || val === null) return -1
      if (typeof val === 'number' && !isNaN(val)) return val
      const asInt = parseInt(String(val).trim())
      if (!isNaN(asInt)) return asInt
      // Text match fallback
      return (question.options || []).findIndex(o => norm(o) === norm(String(val)))
    }

    const userIdx    = resolveToIndex(userAnswer)
    const correctIdx = resolveToIndex(ca)

    // Primary: index match
    if (userIdx !== -1 && correctIdx !== -1 && userIdx === correctIdx) return true

    // Secondary: text match (both resolved to text)
    const userText    = norm(question.options?.[userIdx] ?? userAnswer)
    const correctText = norm(question.options?.[correctIdx] ?? ca)
    if (userText && correctText && userText === correctText) return true

    // Check alternative_answers
    return alts.some(alt => resolveToIndex(alt) === userIdx)
  }

  // ── MULTIPLE SELECT ───────────────────────────────────────────────────────
  if (question.type === 'multiple_select') {
    if (!Array.isArray(userAnswer) || userAnswer.length === 0) return false

    let correctIndices = []
    if (Array.isArray(ca)) {
      correctIndices = ca.map(v => typeof v === 'number' ? v : parseInt(String(v).trim())).filter(v => !isNaN(v))
    } else if (typeof ca === 'number') {
      correctIndices = [ca]
    } else if (typeof ca === 'string' && !isNaN(parseInt(ca.trim()))) {
      correctIndices = [parseInt(ca.trim())]
    } else {
      // Text-based correct_answer fallback
      correctIndices = (question.options || []).reduce((acc, opt, idx) => {
        if (norm(opt) === norm(String(ca))) acc.push(idx)
        return acc
      }, [])
    }

    const sortedUser    = [...userAnswer].map(v => typeof v === 'number' ? v : parseInt(String(v).trim())).sort((a,b) => a-b)
    const sortedCorrect = [...correctIndices].sort((a,b) => a-b)
    return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
  }

  // ── NUMERIC ───────────────────────────────────────────────────────────────
  if (question.type === 'numeric' || question.type === 'numeric_input') {
    const uNum = parseFloat(String(userAnswer).trim())
    const cNum = parseFloat(String(ca).trim())
    if (isNaN(uNum) || isNaN(cNum)) return false
    const tolerance = Math.max(Math.abs(cNum) * 0.01, 0.0001)
    if (Math.abs(uNum - cNum) <= tolerance) return true
    return alts.some(alt => {
      const altNum = parseFloat(String(alt).trim())
      return !isNaN(altNum) && Math.abs(uNum - altNum) <= Math.max(Math.abs(altNum) * 0.01, 0.0001)
    })
  }

  // ── TEXT / ALL OTHER TYPES (default) ─────────────────────────────────────
  const normalizedUser    = norm(String(userAnswer).trim())
  const normalizedCorrect = norm(String(ca).trim())

  if (normalizedUser === normalizedCorrect) return true

  // Numeric fallback: "29" vs 29, "3.0" vs "3", etc.
  const uNum = parseFloat(normalizedUser)
  const cNum = parseFloat(normalizedCorrect)
  if (!isNaN(uNum) && !isNaN(cNum) && Math.abs(uNum - cNum) <= Math.max(Math.abs(cNum) * 0.01, 0.0001)) return true

  return alts.some(a => norm(String(a).trim()) === normalizedUser)
}

  const doSubmit = async () => {
    const q = questions[currentIndex]
    if (q) saveCurrentTime(q._id)
    const questionResults = questions.map(question => {
      const ua = answers[question._id]
      const fmt = (a) => Array.isArray(a) ? a.join(', ') : String(a ?? '')
      return {
        questionId: question._id, questionNumber: question.question_number,
        questionText: question.question_text, userAnswer: fmt(ua),
        correctAnswer: fmt(question.correct_answer),
        isCorrect: checkCorrect(question, ua),
        timeTaken: timesRef.current[question._id] || 0
      }
    })
    const score = questionResults.reduce((sum, r, i) => {
      return sum + (r.isCorrect ? (questions[i].points || 1) : 0)
    }, 0)
    const totalPossible = questions.reduce((sum, q) => sum + (q.points || 1), 0)
    const percentage = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0
    const totalTime = Object.values(timesRef.current).reduce((s, t) => s + t, 0)
    setSaving(true)
    try {
      const u = userRef.current
      await axios.post(`${API_URL}/api/iitmmath_scores`, {
        email: u.email, username: u.username || u.name || u.email,
        quizData: { topic, score, maxScore: totalPossible, totalQuestions: questions.length, totalPossible, percentage, timestamp: new Date(), questionResults }
      }, { withCredentials: true })
    } catch (err) { console.error('Score save failed:', err) }
    finally { setSaving(false) }
    setResults({ score, percentage, totalTime, totalPossible, questionResults })
    setSubmitted(true)
    clearInterval(devToolsIntervalRef.current)
    document.onselectstart = null
  }

  const handleRetake = () => {
    setAnswers({}); setCurrentIndex(0); setSubmitted(false); setResults(null)
    timesRef.current = {}; cheatingRef.current = 0; devToolsWarnedRef.current = false
    questionStartRef.current = Date.now()
    if (userRef.current) fetchQuestions(userRef.current.email)
    setLoading(true)
  }

  const renderInput = (question) => {
    const { _id, type, options, format_hint } = question
    const answer = answers[_id]

    if (type === 'multiple_choice') {
      return (
        <div className="mt-3" style={{display:'flex', flexDirection:'column', gap:9}}>
          {options?.map((opt, idx) => {
            const isSelected = (typeof answer === 'string' ? parseInt(answer) : answer) === idx
            const isHovered = hoveredOpt === `${_id}-${idx}`
            const style = isSelected ? S.optSelected : isHovered ? S.optHovered : S.optBase
            return (
              <div key={idx} style={style}
                onClick={() => handleAnswer(_id, idx)}
                onMouseEnter={() => setHoveredOpt(`${_id}-${idx}`)}
                onMouseLeave={() => setHoveredOpt(null)}>
                <input className="form-check-input" type="radio" name={`q-${_id}`}
                  id={`opt-${_id}-${idx}`} checked={isSelected}
                  onChange={() => handleAnswer(_id, idx)}
                  style={{ flexShrink:0, accentColor:'#378ADD', marginTop:0 }} />
                <label htmlFor={`opt-${_id}-${idx}`} style={S.optLabel(isSelected)}>
                  {opt}
                </label>
              </div>
            )
          })}
        </div>
      )
    }

    if (type === 'multiple_select') {
      const sel = answer || []
      return (
        <div className="mt-3">
          <small className="text-muted d-block mb-2">
            <i className="bi bi-info-circle me-1"/>Select all that apply
          </small>
          <div style={{display:'flex', flexDirection:'column', gap:9}}>
            {options?.map((opt, idx) => {
              const isSelected = sel.includes(idx)
              const isHovered = hoveredOpt === `${_id}-${idx}`
              const style = isSelected ? S.optSelected : isHovered ? S.optHovered : S.optBase
              return (
                <div key={idx} style={style}
                  onClick={() => handleMultiSelect(_id, idx, !sel.includes(idx))}
                  onMouseEnter={() => setHoveredOpt(`${_id}-${idx}`)}
                  onMouseLeave={() => setHoveredOpt(null)}>
                  <input className="form-check-input" type="checkbox"
                    id={`opt-${_id}-${idx}`} checked={isSelected}
                    onChange={e => handleMultiSelect(_id, idx, e.target.checked)}
                    style={{ flexShrink:0, accentColor:'#378ADD', marginTop:0 }} />
                  <label htmlFor={`opt-${_id}-${idx}`} style={S.optLabel(isSelected)}>
                    {opt}
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    if (type === 'numeric' || type === 'numeric_input') {
      return (
        <>
          {format_hint && <small className="text-muted d-block mt-3 mb-1">{format_hint}</small>}
          <MathPreviewInput type="numeric" value={answer} onChange={v => handleAnswer(_id, v)}
            placeholder="e.g. 3.14, −5, sqrt(2)" />
        </>
      )
    }

    const placeholders = {
      interval_input: 'e.g. (-inf, 3] or [1,5)',
      coordinate_input: 'e.g. (2, 3) or (-1/2, sqrt(2))',
      equation_input: 'e.g. f(x) = x^2 + 1',
      set_notation: 'e.g. x != 0',
    }
    return (
      <>
        {format_hint && <small className="text-muted d-block mt-3 mb-1">{format_hint}</small>}
        <MathPreviewInput value={answer} onChange={v => handleAnswer(_id, v)}
          placeholder={placeholders[type] || 'Type your answer here'} />
      </>
    )
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height:'50vh'}}>
      <div className="text-center">
        <div className="spinner-border mb-3" style={{color:'#7F77DD'}} role="status"/>
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
    const a = answers[k]
    return a !== undefined && a !== '' && !(Array.isArray(a) && a.length===0)
  }).length
  const progress = Math.round(((currentIndex+1)/questions.length)*100)

  return (
    <main className="main" style={{userSelect:'none', WebkitUserSelect:'none'}}>
      {/* Warning overlay */}
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

      {showCalc && <Calculator onClose={()=>setShowCalc(false)} />}

      {/* Floating calc button */}
      <button onClick={()=>setShowCalc(v=>!v)}
        style={{position:'fixed',bottom:20,right:20,width:52,height:52,borderRadius:'50%',
          background:'#7F77DD',border:'none',color:'#fff',
          fontSize:20,cursor:'pointer',zIndex:9998,
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 8px rgba(127,119,221,0.4)'}}>
        🧮
      </button>

      {/* Mobile: floating "Jump to Q" button */}
      <button
        className="d-md-none"
        onClick={()=>setShowMobileNav(v=>!v)}
        style={{position:'fixed',bottom:82,right:20,width:52,height:52,borderRadius:'50%',
          background:'#378ADD',border:'none',color:'#fff',fontSize:11,fontWeight:700,
          cursor:'pointer',zIndex:9997,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',lineHeight:1.2,
          boxShadow:'0 2px 8px rgba(55,138,221,0.4)'}}>
        <span style={{fontSize:16}}>≡</span>
        <span>Qs</span>
      </button>

      {/* Mobile nav drawer */}
      {showMobileNav && (
        <div className="d-md-none" style={{position:'fixed',inset:0,zIndex:10001,background:'rgba(4,44,83,0.5)'}}
          onClick={()=>setShowMobileNav(false)}>
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'#fff',
            borderRadius:'16px 16px 0 0',padding:'20px 16px 30px'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <span style={{fontWeight:700,color:'#042C53',fontSize:'0.9rem'}}>Question Navigator</span>
              <button onClick={()=>setShowMobileNav(false)}
                style={{background:'none',border:'none',fontSize:22,color:'#888',cursor:'pointer',lineHeight:1}}>×</button>
            </div>
            <div style={{...S.navGrid, gridTemplateColumns:'repeat(8,1fr)'}}>
              {questions.map((qItem, i) => {
                const ans = answers[qItem._id]
                const answered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length===0)
                const state = i === currentIndex ? 'current' : answered ? 'answered' : 'default'
                return (
                  <button key={qItem._id} onClick={()=>goTo(i)} style={S.navBtn(state)}>
                    {i+1}
                  </button>
                )
              })}
            </div>
            <div style={{display:'flex',gap:16,marginTop:12,flexWrap:'wrap'}}>
              {[['#7F77DD','Current'],['#1D9E75','Answered'],['#D3D1C7','Unanswered']].map(([c,l]) => (
                <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:'0.72rem',color:'#5F5E5A'}}>
                  <div style={{width:10,height:10,borderRadius:3,background:c,flexShrink:0}}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Page title */}
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
        {/* Desktop: two-column grid — question left, nav right */}
        <div className="row justify-content-center">
          {/* Question column */}
          <div className="col-12 col-md-8 col-lg-8">
            {/* Progress */}
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <small className="text-muted">Question {currentIndex+1} of {questions.length}</small>
                <small className="text-muted">{answeredCount} answered</small>
              </div>
              <div style={S.progBar}>
                <div style={S.progFill(progress)}/>
              </div>
            </div>

            {/* Question card */}
            <div style={S.qCard} ref={questionRef}>
              {/* Badge strip — only difficulty + Q number */}
              <div style={S.badgeStrip}>
                <span className={`badge bg-${DIFF_COLORS[q.difficulty]||'secondary'}`}
                  style={{fontSize:'0.75rem'}}>
                  {q.difficulty}
                </span>
                {q.points > 1 && (
                  <span className="badge"
                    style={{background:'#CECBF6',color:'#3C3489',fontSize:'0.75rem'}}>
                    {q.points} pts
                  </span>
                )}
                <span style={S.qNumBadge}>Q {currentIndex + 1}</span>
              </div>

              <div style={S.qBody}>
                <h5 style={S.qText}>{q.question_text}</h5>

                <GraphImage imageFile={q.image_file} />
                {renderInput(q)}
              </div>
            </div>

            {/* Prev / Next */}
            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
              <button style={{...S.navPrev, opacity: currentIndex===0 ? 0.4 : 1, cursor: currentIndex===0 ? 'not-allowed' : 'pointer'}}
                onClick={()=>currentIndex>0 && goTo(currentIndex-1)} disabled={currentIndex===0}>
                <i className="bi bi-chevron-left me-1"/>Prev
              </button>
              {currentIndex < questions.length - 1
                ? <button style={S.navNext} onClick={()=>goTo(currentIndex+1)}>
                    Next<i className="bi bi-chevron-right ms-1"/>
                  </button>
                : <button style={S.navSubmit} onClick={doSubmit} disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1"/>Saving…</>
                      : <><i className="bi bi-check-circle me-1"/>Submit</>}
                  </button>
              }
            </div>
          </div>

          {/* Navigator column — desktop only */}
          <div className="col-md-4 col-lg-3 d-none d-md-block">
            <QuestionNav
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              goTo={goTo}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

export default IITMMathQuiz
