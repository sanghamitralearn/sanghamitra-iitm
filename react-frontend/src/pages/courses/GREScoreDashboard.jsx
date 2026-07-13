import React, { useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Overall hero gradient — purple→blue, matching the GRE Verbal/Quant accent ─
const OVERALL_GRADIENT = 'linear-gradient(135deg, #6f42c1 0%, #0d6efd 100%)'

// ─── Section accent colours — must match GREMain.jsx's SECTION_STYLE exactly ──
const SUBJECT_STYLE = {
  'Verbal Reasoning': {
    gradient: 'linear-gradient(135deg,#6f42c1,#a370f7)', badge: '#6f42c1',
  },
  'Quantitative Reasoning': {
    gradient: 'linear-gradient(135deg,#0d6efd,#4dabf7)', badge: '#0d6efd',
  },
  'Analytical Writing': {
    gradient: 'linear-gradient(135deg,#d63384,#f783ac)', badge: '#d63384',
  },
}

const scoreColor = (pct) => pct >= 80 ? '#198754' : pct >= 60 ? '#ffc107' : '#dc3545'

const accuracyColor = (pct) => pct >= 70 ? '#198754' : pct >= 40 ? '#ffc107' : '#dc3545'

// ─── Build flat per-question items used for the "Chapters" tab ──────────────
// questions: array of question docs (must have .topic, .points)
// responses: array aligned with questions, each { isCorrect, marksAwarded }
// subject: subject label to tag each item with (e.g. "Quantitative Reasoning")
export function buildChapterItems(questions, responses, subject) {
  return (questions || []).map((q, i) => ({
    topic: q.topic || 'General',
    subject,
    isCorrect: !!responses?.[i]?.isCorrect,
    marksAwarded: responses?.[i]?.marksAwarded || 0,
    points: q.points || 1,
  }))
}

function computeChapterStats(items) {
  const map = new Map()
  ;(items || []).forEach(({ topic, subject, isCorrect, marksAwarded, points }) => {
    const key = `${subject}::${topic}`
    if (!map.has(key)) map.set(key, { topic, subject, correct: 0, total: 0, score: 0, maxScore: 0 })
    const t = map.get(key)
    t.total += 1
    t.maxScore += points
    if (isCorrect) t.correct += 1
    t.score += marksAwarded
  })
  return Array.from(map.values()).sort((a, b) => (a.correct / a.total) - (b.correct / b.total))
}

// ─── GRE Score Dashboard — shown right after a quiz / the full test is submitted ─
// results:      { correctAnswers, wrongAnswers, unattempted, score, maxScore, percentage, scaledScore?, totalTime, totalQuestions?, responses? }
// sections:      [{ label, result }] — one entry per subject (Subjects tab; hidden if only one)
// chapterItems:  flat array from buildChapterItems() — powers the Chapters tab
const GREScoreDashboard = ({
  results, sections = [], chapterItems = [],
  onRetake, saving, dateAttempted,
  heroTitle = 'Test Completed!', retakeLabel = 'Retake', backTo = '/courses/gre', backLabel = 'Back to GRE',
}) => {
  const tabs = sections.length > 1 ? ['Overview', 'Sections', 'Chapters'] : ['Overview', 'Chapters']
  const [tab, setTab] = useState('Overview')

  const pct = results.percentage ?? 0
  const totalQuestions = results.totalQuestions ?? results.responses?.length ?? 0
  const accuracy = totalQuestions > 0
    ? Math.round((results.correctAnswers / totalQuestions) * 100)
    : 0

  const chapterStats = computeChapterStats(chapterItems)

  const message = pct >= 80
    ? 'Outstanding performance! 🏆'
    : pct >= 60
      ? 'Good job — keep practicing! 👍'
      : 'Keep practicing, you’ll get there! 📚'

  return (
    <>
      {/* ── Hero score card ── */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ background: OVERALL_GRADIENT, color: '#fff' }} className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-4 text-center">
              <div style={{
                width: 170, height: 170, borderRadius: '50%', margin: '0 auto',
                background: `conic-gradient(#fff ${pct}%, rgba(255,255,255,0.25) ${pct}%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 138, height: 138, borderRadius: '50%', background: 'rgba(0,0,0,0.25)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  {results.scaledScore != null ? (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{results.scaledScore}</span>
                      <span style={{ fontSize: 13, opacity: 0.85, color: '#fff' }}>/ 170 scaled</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{results.score}</span>
                      <span style={{ fontSize: 13, opacity: 0.85, color: '#fff' }}>/ {results.maxScore}</span>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 mb-0 fw-semibold" style={{ color: '#fff' }}>{pct}% Score</p>
            </div>
            <div className="col-12 col-md-8">
              <h2 className="mb-2" style={{ color: '#fff' }}>{heroTitle}</h2>
              <p className="mb-3" style={{ color: '#fff', opacity: 0.9 }}>{message}</p>
              <div className="d-flex gap-4 flex-wrap" style={{ fontSize: '0.95rem' }}>
                <div>
                  <div style={{ opacity: 0.75 }}>Questions</div>
                  <div className="fw-bold fs-5">{totalQuestions}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.75 }}>Accuracy</div>
                  <div className="fw-bold fs-5">{accuracy}%</div>
                </div>
                {results.scaledScore != null && (
                  <div>
                    <div style={{ opacity: 0.75 }}>Scaled Score</div>
                    <div className="fw-bold fs-5">{results.scaledScore}/170</div>
                  </div>
                )}
                <div>
                  <div style={{ opacity: 0.75 }}>Time Taken</div>
                  <div className="fw-bold fs-5">{Math.floor(results.totalTime / 60)}m {results.totalTime % 60}s</div>
                </div>
                {dateAttempted && (
                  <div>
                    <div style={{ opacity: 0.75 }}>Date</div>
                    <div className="fw-bold fs-5">{dateAttempted}</div>
                  </div>
                )}
              </div>
              <div className="d-flex gap-2 mt-4 flex-wrap">
                <button className="btn btn-light fw-semibold" onClick={onRetake} disabled={saving}>
                  <i className="bi bi-arrow-clockwise me-1" />{retakeLabel}
                </button>
                <Link to={backTo} className="btn btn-outline-light fw-semibold">
                  <i className="bi bi-arrow-left me-1" />{backLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="d-inline-flex p-1 rounded-pill bg-light mb-4 shadow-sm flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn btn-sm rounded-pill px-4 py-2"
            style={{
              background: tab === t ? OVERALL_GRADIENT : 'transparent',
              color: tab === t ? '#fff' : '#495057',
              fontWeight: 600, border: 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'Overview' && (
        <>
          <h5 className="fw-bold mb-1">Marks Summary</h5>
          <p className="text-muted mb-3">
            You've answered <strong style={{ color: accuracyColor(accuracy) }}>{accuracy}%</strong> questions correctly.
          </p>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, borderLeft: '4px solid #198754' }}>
                <div className="card-body">
                  <div className="text-muted small mb-1">Correct</div>
                  <div className="fs-3 fw-bold text-success mb-0">{results.correctAnswers}</div>
                  <div className="text-muted small">+{results.score} marks</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, borderLeft: '4px solid #dc3545' }}>
                <div className="card-body">
                  <div className="text-muted small mb-1">Incorrect</div>
                  <div className="fs-3 fw-bold text-danger mb-0">{results.wrongAnswers}</div>
                  <div className="text-muted small">No penalty</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, borderLeft: '4px solid #6c757d' }}>
                <div className="card-body">
                  <div className="text-muted small mb-1">Unattempted</div>
                  <div className="fs-3 fw-bold text-secondary mb-0">{results.unattempted}</div>
                  <div className="text-muted small">&nbsp;</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3">Overall Net Score</h6>
              <div className="progress mb-2" style={{ height: 10 }}>
                <div
                  className="progress-bar"
                  style={{ width: `${pct}%`, background: scoreColor(pct) }}
                />
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>{results.score} / {results.maxScore} pts</span>
                <span>{pct}%{results.scaledScore != null ? ` · Scaled: ${results.scaledScore}/170` : ''}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sections tab ── */}
      {tab === 'Sections' && (
        <div className="row g-3">
          {sections.map(({ label, result: r }) => {
            const p = r.maxScore > 0 ? Math.round(Math.max(0, r.score / r.maxScore) * 100) : 0
            const style = SUBJECT_STYLE[label] || {}
            return (
              <div className="col-md-6" key={label}>
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 6, background: style.gradient }} />
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0 fw-bold">{label}</h5>
                      <span className="badge text-white fs-6" style={{ background: style.gradient }}>
                        {r.scaledScore != null ? `${r.scaledScore}/170` : `${p}%`}
                      </span>
                    </div>
                    <div className="progress mb-3" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: `${p}%`, background: style.gradient }} />
                    </div>
                    <div className="row text-center">
                      <div className="col-3">
                        <div className="fw-bold fs-5">{r.score}/{r.maxScore}</div>
                        <div className="text-muted small">Score</div>
                      </div>
                      <div className="col-3">
                        <div className="fw-bold fs-5 text-success">{r.correctAnswers}</div>
                        <div className="text-muted small">Correct</div>
                      </div>
                      <div className="col-3">
                        <div className="fw-bold fs-5 text-danger">{r.wrongAnswers}</div>
                        <div className="text-muted small">Wrong</div>
                      </div>
                      <div className="col-3">
                        <div className="fw-bold fs-5 text-secondary">{r.unattempted ?? 0}</div>
                        <div className="text-muted small">Skipped</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Chapters tab ── */}
      {tab === 'Chapters' && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            {chapterStats.length === 0 ? (
              <p className="text-muted mb-0">No chapter-wise data available.</p>
            ) : chapterStats.map((c, i) => {
              const p = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0
              const style = SUBJECT_STYLE[c.subject] || {}
              return (
                <div key={i} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div>
                      <span className="fw-semibold">{c.topic}</span>
                      {sections.length > 1 && (
                        <span className="badge ms-2 text-white" style={{ background: style.badge || '#6c757d', fontSize: '0.7rem' }}>
                          {c.subject}
                        </span>
                      )}
                    </div>
                    <small className="text-muted">{c.correct}/{c.total} ({p}%)</small>
                  </div>
                  <div className="progress" style={{ height: 7 }}>
                    <div className="progress-bar" style={{ width: `${p}%`, background: accuracyColor(p) }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

export default GREScoreDashboard
