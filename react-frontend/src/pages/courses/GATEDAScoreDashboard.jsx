import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBJECT_STYLE } from './subjectStyle'
import { resolveMisconception } from './gateDaMisconceptions'

// ─── Overall hero gradient — matches the platform's accent green theme ──────
const OVERALL_GRADIENT = 'linear-gradient(135deg, #28a745 0%, #5fcf80 100%)'

const scoreColor = (pct) => pct >= 80 ? '#198754' : pct >= 60 ? '#ffc107' : '#dc3545'

const accuracyColor = (pct) => pct >= 70 ? '#198754' : pct >= 40 ? '#ffc107' : '#dc3545'

// Format a (possibly negative, possibly fractional) marks value with an explicit
// sign, e.g. 1 -> "+1", -0.66 -> "-0.66", 0 -> "0". GATE DA has real negative
// marking, so marksAwarded must never be treated as >= 0.
export function fmtMarks(n) {
  const v = Number(n) || 0
  const rounded = Math.round(v * 100) / 100
  const abs = Math.abs(rounded)
  const str = Number.isInteger(abs) ? String(abs) : abs.toFixed(2)
  if (rounded > 0) return `+${str}`
  if (rounded < 0) return `-${str}`
  return '0'
}

// Resolve an option_id / raw value to display text (works for MCQ and grid-in numeric answers)
const answerText = (options, value) => {
  if (value == null || value === '') return 'Not attempted'
  if (Array.isArray(options) && options.length > 0) {
    const ids = Array.isArray(value) ? value : [value]
    return ids
      .map(id => {
        const opt = options.find(o => o.option_id === id || o.option_id === String(id))
        return opt ? `${opt.option_id}. ${opt.text}` : String(id)
      })
      .join(', ')
  }
  return Array.isArray(value) ? value.join(', ') : String(value)
}

// ─── Build flat per-question items ────────────────────────────────────────────
// Powers the topic-mastery bars, the Mistakes tab, and the behavioral-insight cards.
// questions: array of question docs (.topic, .points, .options, .correct_answer,
//            .question_text, .average_time_seconds, .answer_explanation / .solution_explanation)
// responses: array aligned with questions, each { isCorrect, marksAwarded, userResponse, unattempted, timeSpent }
// subject:   subject label to tag each item with (e.g. "Machine Learning")
// moduleNum: optional module number — only used to disambiguate question numbers when a single
//            subject has multiple attempt "modules" (kept for parity with SAT's shape)
export function buildChapterItems(questions, responses, subject, moduleNum = null) {
  return (questions || []).map((q, i) => {
    const r = responses?.[i] || {}
    return {
      questionNumber: q.question_number || i + 1,
      moduleNum,
      subject,
      topic: q.topic || 'General',
      subtopic: q.subtopic || '',
      questionText: q.question_text,
      options: q.options || [],
      correctAnswer: q.correct_answer,
      userAnswer: r.userResponse ?? null,
      isCorrect: !!r.isCorrect,
      unattempted: !!r.unattempted,
      // GATE DA has real negative marking — marksAwarded can be < 0. Do NOT clamp to 0 here.
      marksAwarded: r.marksAwarded ?? 0,
      points: q.points || 1,
      timeSpent: r.timeSpent || 0,
      averageTimeSeconds: q.average_time_seconds || null,
      explanation: q.answer_explanation || q.solution_explanation || '',
    }
  })
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

// Green = mastered, amber = partial, red = struggling — mirrors the topic-mastery mockup
function masteryStyle(correct, total) {
  if (total === 0) return { color: '#adb5bd', label: '—' }
  if (correct === total) return { color: '#198754', label: 'Great!' }
  if (correct === 0) return { color: '#dc3545', label: 'Focus here' }
  return { color: '#fd7e14', label: 'Getting there' }
}

// A wrong answer counts as "rushed" if it came in well under the question's own
// average completion time (or under 12s outright, when we have no average to compare to).
const RUSH_SECONDS = 12
const RUSH_RATIO = 0.4

function isRushedMiss(it) {
  return !it.unattempted && !it.isCorrect && it.timeSpent > 0 &&
    (it.timeSpent <= RUSH_SECONDS || (it.averageTimeSeconds && it.timeSpent < it.averageTimeSeconds * RUSH_RATIO))
}

function computeInsights(items) {
  const rushed = (items || []).filter(isRushedMiss)
  const skipped = (items || []).filter(it => it.unattempted)
  return { rushed, skipped }
}

const qLabel = (it) => `Q${it.questionNumber}${it.moduleNum ? ` (${it.subject} · M${it.moduleNum})` : ''}`

// ─── One "what went wrong" card for a single missed/skipped question ─────────
const MistakeCard = ({ item }) => {
  const [showFull, setShowFull] = useState(false)
  const rushed = isRushedMiss(item)

  const userText = answerText(item.options, item.userAnswer)
  const correctText = answerText(item.options, item.correctAnswer)
  const explanation = item.explanation || ''
  const isLong = explanation.length > 320
  const shownExplanation = isLong && !showFull ? explanation.slice(0, 320) + '…' : explanation
  const misconception = resolveMisconception(item, rushed)

  return (
    <div
      className="card border-0 shadow-sm mb-3"
      style={{ borderRadius: 14, borderLeft: `4px solid ${item.unattempted ? '#6c757d' : '#dc3545'}` }}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <span className="badge bg-light text-dark border">{qLabel(item)}</span>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border">
              {item.topic}{item.subtopic ? ` › ${item.subtopic}` : ''}
            </span>
            {!item.unattempted && (
              <span className="badge" style={{ background: item.marksAwarded < 0 ? '#dc3545' : '#6c757d', color: '#fff' }}>
                {fmtMarks(item.marksAwarded)} marks
              </span>
            )}
          </div>
        </div>

        {item.unattempted ? (
          <div className="alert alert-secondary d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-skip-forward-fill" />
            You skipped this question — an unanswered question can't tell us what you know.
          </div>
        ) : rushed ? (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" style={{ fontSize: '0.9rem' }}>
            <i className="bi bi-lightning-charge-fill" />
            Answered in {item.timeSpent}s. You may not have read the question fully — this could be why you got it wrong.
          </div>
        ) : null}

        {!item.unattempted && (
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)' }}>
                <div className="text-danger fw-semibold small mb-1">You answered</div>
                <div style={{ fontSize: '0.92rem' }}>{userText}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ background: 'rgba(25,135,84,0.08)', border: '1px solid rgba(25,135,84,0.25)' }}>
                <div className="text-success fw-semibold small mb-1">Right answer</div>
                <div style={{ fontSize: '0.92rem' }}>{correctText}</div>
              </div>
            </div>
          </div>
        )}

        {!item.unattempted && (
          <div className="mb-3">
            <div className="fw-semibold small mb-1"><i className="bi bi-question-circle me-1 text-warning" />What happened here?</div>
            <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
              You selected <strong>{userText}</strong>, but the correct answer was <strong>{correctText}</strong>
              {item.marksAwarded < 0 && <> — this cost you <strong>{fmtMarks(item.marksAwarded)}</strong> marks under GATE DA's negative marking.</>}.
            </p>
          </div>
        )}

        {misconception && (
          <div className="mb-3">
            <div className="fw-semibold small mb-1"><i className="bi bi-key-fill me-1 text-warning" />Why did this happen?</div>
            <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
              <strong>{misconception.name}</strong> — {misconception.why}
            </p>
          </div>
        )}

        {misconception?.risks?.length > 0 && (
          <div
            className="p-3 rounded mb-3"
            style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.2)' }}
          >
            <div className="fw-semibold small text-danger mb-1">
              <i className="bi bi-exclamation-triangle-fill me-1" />Why fixing this now is important
            </div>
            <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>
              This concept is a building block for topics you'll study later. If this gap isn't cleared, it can make
              future topics much harder:
            </p>
            {misconception.risks.map((r, idx) => (
              <div key={idx} className={idx < misconception.risks.length - 1 ? 'mb-3' : ''}>
                <div className="small mb-1">
                  <strong>{r.pct}% chance</strong> of struggling with <strong>{r.topic}</strong> — if not addressed{' '}
                  {r.by}
                </div>
                <div className="progress" style={{ height: 6, borderRadius: 4 }}>
                  <div className="progress-bar bg-danger" style={{ width: `${r.pct}%`, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {explanation && (
          <div>
            <div className="fw-semibold small mb-1"><i className="bi bi-key-fill me-1 text-warning" />Why is that the answer?</div>
            <p className="mb-1 text-muted" style={{ fontSize: '0.88rem', whiteSpace: 'pre-line' }}>{shownExplanation}</p>
            {isLong && (
              <button className="btn btn-link btn-sm p-0" onClick={() => setShowFull(s => !s)}>
                {showFull ? 'Show less' : 'Show full explanation'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── GATE DA Score Dashboard — shown right after a quiz / the full test is submitted ─
// results:      { correctAnswers, wrongAnswers, unattempted, score, maxScore, percentage, totalTime, totalQuestions?, responses? }
// sections:      [{ label, result }] — one entry per subject (Subjects tab; hidden if only one)
// chapterItems:  flat array from buildChapterItems() — powers topic mastery, insights, and the Mistakes tab
const GATEDAScoreDashboard = ({
  results, sections = [], chapterItems = [],
  onRetake, saving, dateAttempted,
  heroTitle = 'Test Completed!', retakeLabel = 'Retake', backTo = '/courses/gate-da', backLabel = 'Back to GATE DA',
}) => {
  const chapterStats = computeChapterStats(chapterItems)
  const mistakeItems = (chapterItems || []).filter(it => !it.isCorrect)
  const { rushed, skipped } = computeInsights(chapterItems)

  const tabs = [
    'Overview',
    ...(sections.length > 1 ? ['Subjects'] : []),
    ...(mistakeItems.length > 0 ? ['Mistakes'] : []),
  ]
  // Open straight on the per-question review when there's something to review —
  // that's the report a student actually needs to see first after finishing.
  const [tab, setTab] = useState(mistakeItems.length > 0 ? 'Mistakes' : 'Overview')
  const [mistakeLimit, setMistakeLimit] = useState(8)

  const pct = results.percentage ?? 0
  const totalQuestions = results.totalQuestions ?? results.responses?.length ?? 0
  const accuracy = totalQuestions > 0
    ? Math.round((results.correctAnswers / totalQuestions) * 100)
    : 0

  // Marks actually lost to GATE DA's negative marking — sum of marksAwarded for
  // every wrong (attempted, incorrect) response where marksAwarded < 0.
  const marksDeducted = (results.responses || chapterItems || [])
    .filter(r => r && !r.isCorrect && !r.unattempted && (r.marksAwarded ?? 0) < 0)
    .reduce((sum, r) => sum + (r.marksAwarded ?? 0), 0)

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
                background: `conic-gradient(#fff ${Math.max(0, pct)}%, rgba(255,255,255,0.25) ${Math.max(0, pct)}%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 138, height: 138, borderRadius: '50%', background: 'rgba(0,0,0,0.25)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{fmtMarks(results.score)}</span>
                  <span style={{ fontSize: 13, opacity: 0.85, color: '#fff' }}>/ {results.maxScore}</span>
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

      {/* ── How you did by topic — always visible ── */}
      {chapterStats.length > 0 && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">How you did by topic</h5>
            <p className="text-muted small mb-3">Green = strong · Yellow = needs practice · Red = needs attention</p>
            {chapterStats.map((c, i) => {
              const fillPct = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0
              const { color, label } = masteryStyle(c.correct, c.total)
              return (
                <div key={i} className="row align-items-center mb-3 gx-2">
                  <div className="col-5 col-md-3">
                    <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{c.topic}</span>
                    {sections.length > 1 && (
                      <div>
                        <span
                          className="badge text-white"
                          style={{ background: (SUBJECT_STYLE[c.subject] || {}).badge || '#6c757d', fontSize: '0.65rem' }}
                        >
                          {c.subject}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-4 col-md-6">
                    <div className="progress" style={{ height: 10, borderRadius: 6 }}>
                      <div className="progress-bar" style={{ width: `${fillPct}%`, background: color, borderRadius: 6 }} />
                    </div>
                  </div>
                  <div className="col-3 text-end">
                    <span className="fw-semibold small me-2">{c.correct}/{c.total}</span>
                    <span className="small fw-semibold" style={{ color }}>{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Behavioral insights — only shown when something was detected ── */}
      {(rushed.length > 0 || skipped.length > 0) && (
        <div className="mb-4">
          {rushed.length > 0 && (
            <div
              className="alert d-flex align-items-start gap-2 mb-2"
              style={{ background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)' }}
            >
              <i className="bi bi-lightning-charge-fill text-danger mt-1" />
              <div>
                <div className="fw-bold text-danger">Rushed answers led to mistakes</div>
                <div className="small text-muted">
                  You answered {rushed.length} question{rushed.length > 1 ? 's' : ''} very quickly and got{' '}
                  {rushed.length > 1 ? 'them' : 'it'} wrong — {rushed.map(qLabel).join(', ')}. With GATE DA's negative
                  marking, slowing down to read the full question before picking an answer can directly protect your score.
                </div>
              </div>
            </div>
          )}
          {skipped.length > 0 && (
            <div
              className="alert d-flex align-items-start gap-2 mb-0"
              style={{ background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)' }}
            >
              <i className="bi bi-skip-forward-fill mt-1" style={{ color: '#b8860b' }} />
              <div>
                <div className="fw-bold" style={{ color: '#8a6d00' }}>
                  You skipped {skipped.length} question{skipped.length > 1 ? 's' : ''}
                </div>
                <div className="small text-muted">
                  Skipping means we cannot tell what you know, but it also means no marks were deducted. Next time,
                  only guess if you can eliminate at least one option — otherwise skipping is often the safer call.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                  <div className="text-muted small">{fmtMarks(results.score)} marks</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14, borderLeft: '4px solid #dc3545' }}>
                <div className="card-body">
                  <div className="text-muted small mb-1">Incorrect</div>
                  <div className="fs-3 fw-bold text-danger mb-0">{results.wrongAnswers}</div>
                  <div className="text-muted small">
                    {marksDeducted < 0
                      ? <>Marks deducted: <span className="text-danger fw-semibold">{fmtMarks(marksDeducted)}</span></>
                      : 'No marks deducted'}
                  </div>
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
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: scoreColor(pct) }}
                />
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>{fmtMarks(results.score)} / {results.maxScore} pts</span>
                <span>{pct}%</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Subjects tab ── */}
      {tab === 'Subjects' && (
        <div className="row g-3">
          {sections.map(({ label, result: r }) => {
            const p = r.maxScore > 0 ? Math.round(Math.max(0, r.score / r.maxScore) * 100) : 0
            const style = SUBJECT_STYLE[label] || {}
            return (
              <div className="col-md-6" key={label}>
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 6, background: style.gradient || '#6c757d' }} />
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0 fw-bold">{label}</h5>
                      <span className="badge text-white fs-6" style={{ background: style.gradient || '#6c757d' }}>{p}%</span>
                    </div>
                    <div className="progress mb-3" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: `${p}%`, background: style.gradient || '#6c757d' }} />
                    </div>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="fw-bold fs-5">{fmtMarks(r.score)}/{r.maxScore}</div>
                        <div className="text-muted small">Score</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold fs-5 text-success">{r.correctAnswers}</div>
                        <div className="text-muted small">Correct</div>
                      </div>
                      <div className="col-4">
                        <div className="fw-bold fs-5 text-danger">{r.wrongAnswers}</div>
                        <div className="text-muted small">Wrong</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Mistakes tab ── */}
      {tab === 'Mistakes' && (
        <div>
          {mistakeItems.slice(0, mistakeLimit).map((item, i) => (
            <MistakeCard key={i} item={item} />
          ))}
          {mistakeItems.length > mistakeLimit && (
            <button
              className="btn btn-outline-secondary w-100"
              onClick={() => setMistakeLimit(l => l + 8)}
            >
              Show {Math.min(8, mistakeItems.length - mistakeLimit)} more
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default GATEDAScoreDashboard
