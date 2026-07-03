import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics']

const SUBJECT_STYLE = {
  Physics:     { gradient: 'linear-gradient(135deg,#0d6efd,#6610f2)', color: '#0d6efd' },
  Chemistry:   { gradient: 'linear-gradient(135deg,#198754,#20c997)', color: '#198754' },
  Mathematics: { gradient: 'linear-gradient(135deg,#dc3545,#fd7e14)', color: '#dc3545' },
}
const PAPER_STYLE = {
  Paper1: { gradient: 'linear-gradient(135deg,#f7931e,#f7c59f)', color: '#f7931e' },
  Paper2: { gradient: 'linear-gradient(135deg,#6610f2,#ae63f7)', color: '#6610f2' },
}

// ── Review Answers ────────────────────────────────────────────────────────────
function ReviewPanel({ subjectQuestions, subjectResponses, onBack, activeSubject, setActiveSubject }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandIdx, setExpandIdx]       = useState(null)

  const questions  = subjectQuestions[activeSubject] || []
  const responses  = subjectResponses[activeSubject] || []
  const responseMap = {}
  responses.forEach(r => { responseMap[String(r.questionId)] = r })

  const enriched = questions.map(q => ({ q, res: responseMap[String(q._id)] || null }))

  const counts = {
    all:         enriched.length,
    correct:     enriched.filter(({ res }) => res?.isCorrect).length,
    incorrect:   enriched.filter(({ res }) => res && !res.isCorrect && !res.unattempted).length,
    unattempted: enriched.filter(({ res }) => !res || res.unattempted).length,
  }

  const filtered = enriched.filter(({ res }) => {
    if (statusFilter === 'correct')     return res?.isCorrect
    if (statusFilter === 'incorrect')   return res && !res.isCorrect && !res.unattempted
    if (statusFilter === 'unattempted') return !res || res.unattempted
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
        <strong>Review Answers</strong>
      </div>

      {/* Subject chips */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '10px 24px' }}>
        <div className="d-flex gap-2 flex-wrap">
          {SUBJECTS.map(sub => (
            <button key={sub} onClick={() => { setActiveSubject(sub); setExpandIdx(null) }}
              style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem',
                borderColor: activeSubject === sub ? SUBJECT_STYLE[sub].color : '#ced4da',
                background:  activeSubject === sub ? SUBJECT_STYLE[sub].color : '#fff',
                color:       activeSubject === sub ? '#fff' : '#495057',
              }}>
              {sub}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          {/* Status sidebar */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              {[
                { key: 'all',         label: `All (${counts.all})` },
                { key: 'incorrect',   label: `Incorrect (${counts.incorrect})` },
                { key: 'unattempted', label: `Unattempted (${counts.unattempted})` },
                { key: 'correct',     label: `Correct (${counts.correct})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                  style={{ borderBottom: '1px solid #e9ecef', background: statusFilter === key ? '#f0f4ff' : '#fff', cursor: 'pointer' }}>
                  <span style={{ borderLeft: statusFilter === key ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft: 10, color: statusFilter === key ? '#0d6efd' : '#212529', fontWeight: statusFilter === key ? 600 : 400 }}>
                    {label}
                  </span>
                  {statusFilter === key && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d6efd', display: 'inline-block' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Question list */}
          <div className="col-md-9">
            {filtered.length === 0
              ? <div className="text-center py-5 text-muted">No questions match the selected filter.</div>
              : filtered.map(({ q, res }, idx) => {
                  const isOpen      = expandIdx === idx
                  const statusColor = (!res || res.unattempted) ? '#6c757d' : res.isCorrect ? '#28a745' : '#dc3545'
                  const marksLabel  = (!res || res.unattempted) ? 'N/A' : res.marksAwarded > 0 ? `+${res.marksAwarded}` : String(res.marksAwarded ?? 0)
                  return (
                    <div key={idx} className="card border-0 shadow-sm mb-3" style={{ borderRadius: 12 }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => setExpandIdx(isOpen ? null : idx)}>
                        <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.82rem' }}>
                          ⊙ CORRECT: {(!res || res.unattempted) ? 'N/A' : res.isCorrect ? 'Yes' : 'No'} &nbsp;·&nbsp; Marks: {marksLabel}
                        </span>
                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'right'} text-muted`} style={{ fontSize: '0.8rem' }} />
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="fw-bold">Question {idx + 1}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                          {q.difficulty && <span className={`badge ${q.difficulty === 'hard' ? 'bg-danger' : q.difficulty === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`} style={{ fontSize: '0.7rem' }}>{q.difficulty}</span>}
                          <span className="ms-auto fw-bold" style={{ color: statusColor }}>{marksLabel}</span>
                        </div>
                        {q.topic && <p className="text-muted small mb-2">{q.topic}</p>}
                        <p className="text-muted mb-0" style={{ fontSize: '0.93rem', lineHeight: 1.6 }}>
                          {isOpen ? q.question_text : (q.question_text?.length > 220 ? q.question_text.slice(0, 220) + '…' : q.question_text)}
                        </p>
                        {isOpen && (
                          <div className="d-flex gap-2 flex-wrap mt-3">
                            <span className="badge bg-light text-dark border">Your answer: <strong>{res?.userResponse ?? '(not answered)'}</strong></span>
                            <span className="badge bg-success text-white">Correct answer: <strong>{String(q.correct_answer ?? '?')}</strong></span>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function JEEAdvancedAnalysis() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const results   = state?.results

  const isPaper = results?.isPaper === true
  const paper   = results?.paper || ''

  const [page,          setPage]          = useState('result')   // 'result' | 'review'
  const [selectedView,  setSelectedView]  = useState('overview') // 'overview' | 'Physics' | ...
  const [subjectsOpen,  setSubjectsOpen]  = useState(false)
  const [reviewSubject, setReviewSubject] = useState('Physics')

  // Fetched questions per subject
  const [questionsBySubject, setQuestionsBySubject] = useState({})

  useEffect(() => {
    if (!results) return
    const toLoad = isPaper ? SUBJECTS : [results.subject || 'Physics']
    toLoad.forEach(sub => {
      axios.get(`${API_URL}/api/jee_questions?subject=${encodeURIComponent(sub)}`, { withCredentials: true })
        .then(r => setQuestionsBySubject(prev => ({ ...prev, [sub]: Array.isArray(r.data) ? r.data : [] })))
        .catch(() => {})
    })
  }, [])

  if (!results) {
    return (
      <div className="container py-5 text-center">
        <h5 className="text-muted">No analysis data. Please go back.</h5>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    )
  }

  // ── Paper mode ──────────────────────────────────────────────────────────────
  if (isPaper) {
    const subjects   = results.subjects || {}
    const totalScore = results.total ?? 0
    const totalMax   = results.max   ?? 180
    const paperStyle = PAPER_STYLE[paper] || PAPER_STYLE.Paper1
    const paperLabel = paper === 'Paper1' ? 'Paper 1' : 'Paper 2'

    // What to display in the main score card
    const isSubjectView  = selectedView !== 'overview'
    const subData        = isSubjectView ? subjects[selectedView] : null
    const displayScore   = isSubjectView ? (subData?.score ?? 0)         : totalScore
    const displayMax     = isSubjectView ? (subData?.maxScore ?? 60)     : totalMax
    const displayCorrect = isSubjectView ? (subData?.correctAnswers ?? 0): SUBJECTS.reduce((s, k) => s + (subjects[k]?.correctAnswers ?? 0), 0)
    const displayWrong   = isSubjectView ? (subData?.wrongAnswers ?? 0)  : SUBJECTS.reduce((s, k) => s + (subjects[k]?.wrongAnswers ?? 0), 0)
    const displayUnatt   = isSubjectView ? (subData?.unattempted ?? 0)   : SUBJECTS.reduce((s, k) => s + (subjects[k]?.unattempted ?? 0), 0)
    const cardGradient   = isSubjectView ? (SUBJECT_STYLE[selectedView]?.gradient || paperStyle.gradient) : paperStyle.gradient

    // responses per subject for review
    const subjectResponses = {}
    SUBJECTS.forEach(sub => { subjectResponses[sub] = subjects[sub]?.responses || [] })

    if (page === 'review') {
      return (
        <ReviewPanel
          subjectQuestions={questionsBySubject}
          subjectResponses={subjectResponses}
          onBack={() => setPage('result')}
          activeSubject={reviewSubject}
          setActiveSubject={setReviewSubject}
        />
      )
    }

    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
          <div className="flex-grow-1">
            <span className="fw-bold">Result: JEE ADVANCED</span>
            <span className="ms-2 text-muted fw-normal">— {paperLabel}</span>
            <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>JEE (Advanced)</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('review')}>
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
                  style={{ background: selectedView === 'overview' ? '#f0f4ff' : '#fff', borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}>
                  <span style={{ borderLeft: selectedView === 'overview' ? '3px solid #0d6efd' : '3px solid transparent', paddingLeft: 10, fontWeight: selectedView === 'overview' ? 600 : 400, color: selectedView === 'overview' ? '#0d6efd' : '#212529' }}>
                    Overview
                  </span>
                  {selectedView === 'overview' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d6efd', display: 'inline-block' }} />}
                </button>

                {/* Subjects dropdown */}
                <button onClick={() => setSubjectsOpen(o => !o)}
                  className="w-100 text-start border-0 p-3 d-flex align-items-center justify-content-between"
                  style={{ background: '#fff', borderBottom: '1px solid #e9ecef', cursor: 'pointer' }}>
                  <span style={{ paddingLeft: 10 }}>Subjects</span>
                  <i className={`bi bi-chevron-${subjectsOpen ? 'up' : 'down'} text-muted`} style={{ fontSize: '0.8rem' }} />
                </button>
                {subjectsOpen && SUBJECTS.map(sub => (
                  <button key={sub} onClick={() => setSelectedView(sub)}
                    className="w-100 text-start border-0 px-4 py-2 d-flex align-items-center justify-content-between"
                    style={{ background: selectedView === sub ? '#f8f9fa' : '#fff', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                    <span style={{ borderLeft: selectedView === sub ? `3px solid ${SUBJECT_STYLE[sub].color}` : '3px solid transparent', paddingLeft: 10, color: selectedView === sub ? SUBJECT_STYLE[sub].color : '#495057', fontWeight: selectedView === sub ? 600 : 400, fontSize: '0.95rem' }}>
                      {sub}
                    </span>
                    {selectedView === sub && <span style={{ width: 8, height: 8, borderRadius: '50%', background: SUBJECT_STYLE[sub].color, display: 'inline-block' }} />}
                  </button>
                ))}
              </div>

              {/* Back button */}
              <div className="d-flex flex-column gap-2 mt-3">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                  <i className="bi bi-arrow-left me-1" />Back to Admin
                </button>
              </div>
            </div>

            {/* Main */}
            <div className="col-md-9">
              {/* Score card */}
              <div className="text-white mb-4" style={{ background: cardGradient, borderRadius: 16, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', right: 60, bottom: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <h5 className="fw-bold mb-4" style={{ opacity: 0.95 }}>
                  {isSubjectView ? `${selectedView} Report` : paperLabel}
                </h5>
                <div className="text-center">
                  <div style={{ width: 150, height: 150, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{displayScore}</span>
                    <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                    <span style={{ fontSize: 22, opacity: 0.9 }}>{displayMax}</span>
                  </div>
                  {results.date && (
                    <div style={{ opacity: 0.85, fontSize: '0.9rem' }}>
                      {new Date(results.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject cards row — overview only */}
              {!isSubjectView && (
                <div className="row g-3 mb-4">
                  {SUBJECTS.map(sub => {
                    const d = subjects[sub]
                    if (!d) return null
                    return (
                      <div key={sub} className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 text-center" style={{ borderRadius: 12, cursor: 'pointer' }}
                          onClick={() => { setSubjectsOpen(true); setSelectedView(sub) }}>
                          <div style={{ height: 4, background: SUBJECT_STYLE[sub].gradient, borderRadius: '12px 12px 0 0' }} />
                          <div className="card-body py-3">
                            <div className="fw-bold mb-1" style={{ color: SUBJECT_STYLE[sub].color }}>{sub}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: d.score < 0 ? '#dc3545' : '#212529' }}>{d.score}</div>
                            <div className="text-muted" style={{ fontSize: '0.82rem' }}>/ {d.maxScore}</div>
                            <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '0.75rem' }}>
                              <span className="text-success">{d.correctAnswers}✓</span>
                              <span className="text-danger">{d.wrongAnswers}✗</span>
                              <span className="text-muted">{d.unattempted}—</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Marks Summary */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-1">Marks Summary</h5>
                  <p className="text-muted small mb-4">
                    You've answered {Math.round(displayCorrect / ((displayCorrect + displayWrong + displayUnatt) || 1) * 100)}% questions correctly
                  </p>
                  <div className="row g-3 text-center">
                    {[
                      { label: 'Correct',     count: displayCorrect, color: '#28a745', bg: '#d4edda', icon: 'bi-check-circle-fill' },
                      { label: 'Incorrect',   count: displayWrong,   color: '#dc3545', bg: '#f8d7da', icon: 'bi-x-circle-fill' },
                      { label: 'Unattempted', count: displayUnatt,   color: '#6c757d', bg: '#e9ecef', icon: 'bi-dash-circle-fill' },
                    ].map(({ label, count, color, bg, icon }) => (
                      <div key={label} className="col-4">
                        <div style={{ background: bg, borderRadius: 12, padding: '20px 8px' }}>
                          <i className={`bi ${icon} mb-2`} style={{ fontSize: '1.5rem', color }} />
                          <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
                          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</div>
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

  // ── Single subject mode ──────────────────────────────────────────────────────
  const subject    = results.subject || results.topic || 'Physics'
  const subjStyle  = SUBJECT_STYLE[subject] || SUBJECT_STYLE.Physics
  const responses  = results.responses || []
  const responseMap = {}
  responses.forEach(r => { responseMap[String(r.questionId)] = r })

  if (page === 'review') {
    const subjectResponses = { [subject]: responses }
    return (
      <ReviewPanel
        subjectQuestions={{ [subject]: questionsBySubject[subject] || [] }}
        subjectResponses={subjectResponses}
        onBack={() => setPage('result')}
        activeSubject={subject}
        setActiveSubject={() => {}}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#495057', cursor: 'pointer' }}>←</button>
        <div className="flex-grow-1">
          <span className="fw-bold">Result: JEE ADVANCED</span>
          <span className="ms-2 badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>JEE (Advanced)</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setPage('review')}>
          <i className="bi bi-list-task me-1" />View test solution
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <div className="p-3" style={{ borderLeft: `3px solid ${subjStyle.color}`, paddingLeft: 10, fontWeight: 600, color: subjStyle.color }}>
                {subject}
              </div>
            </div>
            <div className="d-flex flex-column gap-2 mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-1" />Back to Admin
              </button>
            </div>
          </div>

          <div className="col-md-9">
            <div className="text-white mb-4" style={{ background: subjStyle.gradient, borderRadius: 16, padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <h5 className="fw-bold mb-4">{subject} Report</h5>
              <div className="text-center">
                <div style={{ width: 150, height: 150, borderRadius: '50%', border: '5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{results.score}</span>
                  <div style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.55)', margin: '6px 0' }} />
                  <span style={{ fontSize: 22, opacity: 0.9 }}>{results.maxScore}</span>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-1">Marks Summary</h5>
                <p className="text-muted small mb-4">
                  You've answered {Math.round((results.correctAnswers ?? 0) / ((results.totalQuestions) || 1) * 100)}% questions correctly
                </p>
                <div className="row g-3 text-center">
                  {[
                    { label: 'Correct',     count: results.correctAnswers, color: '#28a745', bg: '#d4edda', icon: 'bi-check-circle-fill' },
                    { label: 'Incorrect',   count: results.wrongAnswers,   color: '#dc3545', bg: '#f8d7da', icon: 'bi-x-circle-fill' },
                    { label: 'Unattempted', count: results.unattempted,    color: '#6c757d', bg: '#e9ecef', icon: 'bi-dash-circle-fill' },
                  ].map(({ label, count, color, bg, icon }) => (
                    <div key={label} className="col-4">
                      <div style={{ background: bg, borderRadius: 12, padding: '20px 8px' }}>
                        <i className={`bi ${icon} mb-2`} style={{ fontSize: '1.5rem', color }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color }}>{count}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{label}</div>
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
