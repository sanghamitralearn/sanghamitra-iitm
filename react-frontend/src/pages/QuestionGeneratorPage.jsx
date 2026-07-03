import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ── Course definitions (mirrors backend COURSE_CONFIG) ────────────────────────
const COURSES = {
  jee:   { label: 'JEE Advanced',  types: ['multiple_choice','multiple_select','numeric'], hasSubject: true,  hasWeek: false },
  math2: { label: 'Maths 2',       types: ['multiple_choice','multiple_select','numeric','numeric_range','text_input'], hasSubject: false, hasWeek: true, maxWeek: 11 },
  stats2:{ label: 'Stats 2',       types: ['multiple_choice','multiple_select','numeric','numeric_range','text_input'], hasSubject: false, hasWeek: true, maxWeek: 12 },
  dbms:  { label: 'DBMS',          types: ['mcq-single','mcq-multiple','numerical','interview'], hasSubject: false, hasWeek: true, maxWeek: 12 },
  pdsa:  { label: 'PDSA',          types: ['mcq-single','mcq-multiple','numerical','interview'], hasSubject: false, hasWeek: false },
}

const DIFFICULTY = ['easy', 'medium', 'hard']
const SUBJECTS   = ['Physics', 'Chemistry', 'Mathematics']
const BLOOM      = ['remember','understand','apply','analyze','evaluate','create']
const DIFF_COLOR = { easy: '#28a745', medium: '#fd7e14', hard: '#dc3545' }

const TYPE_LABEL = {
  multiple_choice: 'MCQ (one correct)',
  multiple_select: 'MSQ (multiple correct)',
  numeric:         'Numeric',
  numeric_range:   'Numeric Range',
  text_input:      'Text Input',
  'mcq-single':    'MCQ Single',
  'mcq-multiple':  'MCQ Multiple',
  numerical:       'Numerical',
  interview:       'Interview',
}

function Badge({ label, color }) {
  return <span style={{ background: color+'20', color, border:`1px solid ${color}40`, padding:'2px 10px', borderRadius:12, fontSize:'0.75rem', fontWeight:600 }}>{label}</span>
}

function ProgressBar({ value }) {
  return (
    <div style={{ height:8, background:'#e9ecef', borderRadius:4, overflow:'hidden' }}>
      <div style={{ width:`${value}%`, height:'100%', background: value===100?'#28a745':'#667eea', borderRadius:4, transition:'width 0.4s' }} />
    </div>
  )
}

function QuestionCard({ r }) {
  const [open, setOpen]       = useState(false)
  const [showJSON, setShowJSON] = useState(false)
  const color = r.success ? '#28a745' : '#dc3545'

  return (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:10 }}>
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <span className="fw-bold text-muted" style={{ fontSize:'0.82rem' }}>#{r.index}</span>
            <span style={{ color, fontWeight:700, fontSize:'0.82rem' }}>{r.success ? '✓ PASSED' : '✗ FAILED'}</span>
            {r.savedId && <Badge label="Saved to DB" color="#28a745" />}
            {r.attempts > 1 && <span className="text-muted" style={{ fontSize:'0.75rem' }}>{r.attempts} attempts</span>}
          </div>
          <div className="d-flex gap-2">
            {r.success && (
              <button className="btn btn-sm btn-outline-secondary py-0" style={{ fontSize:'0.75rem' }}
                onClick={() => { setShowJSON(j=>!j); setOpen(false) }}>
                {showJSON ? 'Hide JSON' : '{ } View JSON'}
              </button>
            )}
            <button className="btn btn-sm btn-link p-0 text-muted" onClick={() => { setOpen(o=>!o); setShowJSON(false) }}>
              {open ? 'Hide' : 'Preview'}
            </button>
          </div>
        </div>

        {r.question && (
          <p className="mb-1 mt-2" style={{ fontSize:'0.88rem', lineHeight:1.5 }}>
            {r.question.length > 200 ? r.question.slice(0,200)+'…' : r.question}
          </p>
        )}
        {r.error && <p className="text-danger small mb-0 mt-1">{r.error}</p>}

        {/* Full JSON view */}
        {showJSON && r.generated && (
          <div className="mt-3 position-relative">
            <pre style={{ background:'#1e1e2e', color:'#cdd6f4', borderRadius:8, padding:'1rem',
              fontSize:'0.78rem', maxHeight:400, overflowY:'auto', margin:0 }}>
              {JSON.stringify(r.generated, null, 2)}
            </pre>
            <button className="btn btn-sm btn-light position-absolute"
              style={{ top:8, right:8, fontSize:'0.72rem' }}
              onClick={() => navigator.clipboard.writeText(JSON.stringify(r.generated, null, 2))}>
              Copy
            </button>
          </div>
        )}

        {/* Validation preview */}
        {open && (
          <div className="mt-3 p-3 rounded" style={{ background:'#f8f9fa', fontSize:'0.83rem' }}>
            {r.validation && (
              <>
                <div><span className="fw-semibold">Validator answer: </span><code>{String(r.validation.your_answer)}</code> — <span className="text-muted">{r.validation.confidence} confidence</span></div>
                {r.validation.issues?.length > 0 && (
                  <ul className="text-danger mt-1 mb-0">{r.validation.issues.map((iss,i)=><li key={i}>{iss}</li>)}</ul>
                )}
              </>
            )}
            <div className="mt-1"><span className="fw-semibold">Correct answer: </span><code>{JSON.stringify(r.answer)}</code></div>
            {r.savedId && <div className="mt-1 text-muted">DB id: <code>{r.savedId}</code></div>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuestionGeneratorPage() {
  const [course, setCourse]   = useState('jee')
  const [mode, setMode]       = useState('batch')
  const [form, setForm]       = useState({ subject:'Physics', topic:'', subtopic:'', difficulty:'medium', type:'multiple_choice', week:1, count:5, save:false })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [job, setJob]         = useState(null)
  const [single, setSingle]   = useState(null)
  const pollRef = useRef(null)

  const cfg = COURSES[course]

  // Reset type when course changes
  useEffect(() => {
    setForm(f => ({ ...f, type: cfg.types[0] }))
    setJob(null); setSingle(null); setError('')
  }, [course])

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current=null } }
  useEffect(() => () => stopPolling(), [])

  const pollJob = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await axios.get(`${API}/api/gen/job/${jobId}`, { withCredentials:true })
        setJob(r.data)
        if (r.data.status === 'done') { stopPolling(); setLoading(false) }
      } catch { stopPolling(); setLoading(false) }
    }, 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.topic.trim()) { setError('Topic is required'); return }
    setError(''); setJob(null); setSingle(null); setLoading(true)

    const payload = { ...form, course }

    try {
      if (mode === 'single') {
        const r = await axios.post(`${API}/api/gen/question`, payload, { withCredentials:true })
        setSingle(r.data)
        setLoading(false)
      } else {
        const r = await axios.post(`${API}/api/gen/batch`, payload, { withCredentials:true })
        setJob({ jobId:r.data.jobId, status:'running', total:r.data.total, done:0, passed:0, failed:0, progress:0, results:[] })
        pollJob(r.data.jobId)
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      setLoading(false)
    }
  }

  const inp = { borderRadius:8, border:'1px solid #dee2e6', padding:'0.45rem 0.75rem', width:'100%', fontSize:'0.88rem' }
  const lbl = { fontWeight:600, fontSize:'0.82rem', color:'#495057', marginBottom:3, display:'block' }

  return (
    <div style={{ background:'#f5f7fb', minHeight:'100vh', padding:'2rem' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(102,126,234,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', color:'#667eea' }}>
            <i className="bi bi-robot" />
          </div>
          <div>
            <h4 className="mb-0">AI Question Generator</h4>
            <p className="text-muted mb-0" style={{ fontSize:'0.83rem' }}>Generate + validate questions automatically using Groq / Llama</p>
          </div>
        </div>

        {/* Course selector */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {Object.entries(COURSES).map(([key, c]) => (
            <button key={key}
              className={`btn btn-sm ${course===key ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setCourse(key)} disabled={loading}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="d-flex gap-2 mb-4">
          {['single','batch'].map(m => (
            <button key={m}
              className={`btn btn-sm ${mode===m ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setMode(m)} disabled={loading}>
              {m === 'single' ? '⚡ Single' : '📦 Batch'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius:12 }}>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">

                {/* Subject — JEE only */}
                {cfg.hasSubject && (
                  <div className="col-md-4">
                    <label style={lbl}>Subject</label>
                    <select style={inp} value={form.subject} onChange={e => set('subject', e.target.value)}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {/* Week — IITM courses */}
                {cfg.hasWeek && (
                  <div className="col-md-3">
                    <label style={lbl}>Week <span className="text-muted fw-normal">(1–{cfg.maxWeek})</span></label>
                    <input type="number" style={inp} min={1} max={cfg.maxWeek} value={form.week}
                      onChange={e => set('week', parseInt(e.target.value)||1)} />
                  </div>
                )}

                <div className={cfg.hasSubject ? 'col-md-4' : cfg.hasWeek ? 'col-md-4' : 'col-md-5'}>
                  <label style={lbl}>Difficulty</label>
                  <select style={inp} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                    {DIFFICULTY.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div className={cfg.hasSubject ? 'col-md-4' : cfg.hasWeek ? 'col-md-5' : 'col-md-7'}>
                  <label style={lbl}>Question Type</label>
                  <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                    {cfg.types.map(t => <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>)}
                  </select>
                </div>

                <div className="col-md-6">
                  <label style={lbl}>Topic <span className="text-danger">*</span></label>
                  <input style={inp} value={form.topic} onChange={e => set('topic', e.target.value)}
                    placeholder={course==='jee' ? 'e.g. Mechanics, Thermodynamics' : course==='pdsa' ? 'e.g. Binary Trees, Sorting' : course==='dbms' ? 'e.g. Normalization, SQL Joins' : 'e.g. Calculus, Probability'} />
                </div>

                <div className="col-md-6">
                  <label style={lbl}>Subtopic <span className="text-muted fw-normal">(optional{course==='pdsa'?' — not required':''})</span></label>
                  <input style={inp} value={form.subtopic} onChange={e => set('subtopic', e.target.value)}
                    placeholder="e.g. Kinematics, Ideal Gas Law" />
                </div>

                {mode === 'batch' && (
                  <div className="col-md-3">
                    <label style={lbl}>Count <span className="text-muted fw-normal">(max 20)</span></label>
                    <input type="number" style={inp} min={1} max={20} value={form.count}
                      onChange={e => set('count', parseInt(e.target.value)||1)} />
                  </div>
                )}

                <div className={mode==='batch' ? 'col-md-9' : 'col-12'}>
                  <label style={lbl}>Auto-save to MongoDB</label>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <div className="form-check form-switch mb-0">
                      <input className="form-check-input" type="checkbox" checked={form.save}
                        onChange={e => set('save', e.target.checked)} style={{ cursor:'pointer' }} />
                    </div>
                    <span className="text-muted" style={{ fontSize:'0.8rem' }}>
                      {form.save ? 'Valid questions saved automatically' : 'Preview only — nothing saved (enable once MongoDB is up)'}
                    </span>
                  </div>
                </div>

              </div>

              {error && <div className="alert alert-danger mt-3 py-2 mb-0" style={{ fontSize:'0.85rem' }}>{error}</div>}

              <div className="mt-4">
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Generating…</>
                    : mode==='single' ? '⚡ Generate 1 Question' : `📦 Generate ${form.count} Questions`
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Batch progress */}
        {job && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius:12 }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">{job.status==='done' ? '✓ Done' : '⏳ Generating…'} &nbsp;
                  <span className="fw-normal text-muted" style={{ fontSize:'0.85rem' }}>{job.done}/{job.total}</span>
                </span>
                <div className="d-flex gap-2">
                  <Badge label={`${job.passed} passed`} color="#28a745" />
                  {job.failed > 0 && <Badge label={`${job.failed} failed`} color="#dc3545" />}
                  <Badge label={`${job.progress}%`} color="#667eea" />
                </div>
              </div>
              <ProgressBar value={job.progress} />

              {job.results?.length > 0 && (
                <div className="mt-4">
                  <p className="fw-semibold mb-3" style={{ fontSize:'0.88rem' }}>
                    Results
                    <span className="text-muted fw-normal ms-2">
                      {COURSES[course]?.label} · {job.params?.topic} · {job.params?.difficulty}
                      {job.params?.week ? ` · Week ${job.params.week}` : ''}
                    </span>
                  </p>
                  {job.results.map((r,i) => <QuestionCard key={i} r={r} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Single result */}
        {single && (
          <div className="card border-0 shadow-sm" style={{ borderRadius:12 }}>
            <div className="card-body">
              <p className="fw-semibold mb-3">Result</p>
              <QuestionCard r={{
                index: 1, success: single.success, savedId: single.savedId,
                question: single.generated?.question_text || single.generated?.title,
                answer:   single.generated?.correct_answer || single.generated?.correctAnswer,
                validation: single.validation, error: single.error, attempts: single.attempt,
              }} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
