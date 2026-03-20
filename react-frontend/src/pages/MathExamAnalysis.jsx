import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const difficultyColor = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545', unknown: '#6c757d' };
const difficultyBg   = { easy: 'rgba(40,167,69,0.1)', medium: 'rgba(255,193,7,0.1)', hard: 'rgba(220,53,69,0.1)', unknown: 'rgba(108,117,125,0.1)' };

const pct     = (c, t) => t > 0 ? ((c / t) * 100).toFixed(0) : 0;
const fmtTime = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
const Skel    = ({ w = '100%', h = 16 }) => (
  <div style={{ width: w, height: h, background: '#e9ecef', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
);

export default function MathExamAnalysis() {
  const { email, topic, attemptNumber } = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const [filter,    setFilter]    = useState('all');

  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState(null);
  const [countdown,  setCountdown]  = useState(0);

  const countdownRef = useRef(null);
  const studentName  = location.state?.studentName || email;

  // ── Clean up countdown on unmount ──
  useEffect(() => () => clearInterval(countdownRef.current), []);

  // ── Fetch AI feedback (with 429 retry countdown) ──
  const fetchAI = async (examData) => {
    clearInterval(countdownRef.current);
    setAiLoading(true);
    setAiError(null);
    setCountdown(0);
    try {
      const res = await axios.post(
        `${API_URL}/api/math_exam_ai_feedback`,
        { student: examData.student, attempt: examData.attempt, enrichedResults: examData.enrichedResults, insights: examData.insights },
        { withCredentials: true }
      );
      if (res.data.success) setAiFeedback(res.data.feedback);
      else setAiError(res.data.message);
    } catch (e) {
      const msg   = e.response?.data?.message || 'AI service unavailable.';
      const secs  = e.response?.data?.retryAfter;
      setAiError(msg);
      if (e.response?.status === 429 && secs > 0) {
        setCountdown(secs);
        countdownRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              fetchAI(examData);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // ── Load exam detail + kick off AI immediately ──
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/iitmmath_exam_detail`, {
          params: { email, topic, attemptNumber },
          withCredentials: true,
        });
        if (!res.data.success) { setError(res.data.message); return; }
        setData(res.data.data);
        fetchAI(res.data.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [email, topic, attemptNumber]);

  // ── Loading / error guards ──
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
      <div className="spinner-border text-primary" />&nbsp;Loading exam analysis…
    </div>
  );
  if (error) return (
    <div className="container my-4">
      <div className="alert alert-danger">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
    </div>
  );

  const { attempt, enrichedResults, insights } = data;
  const { difficultyStats, typeStats, avgTimeSec, maxTimeSec, totalTimeSec, hardestQuestions, slowestQuestions } = insights;
  const scoreColor = attempt.percentage >= 80 ? '#28a745' : attempt.percentage >= 60 ? '#ffc107' : '#dc3545';

  const filtered = enrichedResults.filter(r => {
    if (filter === 'wrong')   return !r.isCorrect;
    if (filter === 'correct') return r.isCorrect;
    if (filter === 'hard')    return r.difficulty === 'hard';
    return true;
  });

  return (
    <div className="container my-4">

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Exam Analysis</h2>
          <p className="text-muted mb-0">
            <strong>{studentName}</strong> · Topic: <strong>{attempt.topic}</strong> · Attempt #{attempt.attemptNumber} · {new Date(attempt.timestamp).toLocaleString()}
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* ══════════════════════════════════════════
          AI FEEDBACK  (always at top)
      ══════════════════════════════════════════ */}
      <div className="card mb-4" style={{ border: '2px solid #667eea' }}>
        <div className="card-header text-white d-flex align-items-center gap-2"
          style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
          <i className="bi bi-magic" />
          <h5 className="mb-0">AI-Powered Feedback</h5>
          {aiLoading && <span className="spinner-border spinner-border-sm ms-auto" />}
        </div>
        <div className="card-body">

          {/* Skeleton */}
          {aiLoading && (
            <>
              <Skel w="100%" h={18} /><Skel w="80%" h={14} /><Skel w="90%" h={14} /><Skel w="65%" h={14} />
              <div className="row mt-3">
                {[1,2,3].map(i => <div key={i} className="col-md-4 mb-2"><div style={{ height: 80, background: '#e9ecef', borderRadius: 8 }} /></div>)}
              </div>
            </>
          )}

          {/* Error + countdown / retry */}
          {aiError && !aiLoading && (
            <div className="alert alert-warning mb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span><i className="bi bi-exclamation-triangle me-2" />{aiError}</span>
              {countdown > 0
                ? <span className="badge bg-warning text-dark fs-6">Auto-retrying in {countdown}s…</span>
                : <button className="btn btn-sm btn-warning" onClick={() => fetchAI(data)}>
                    <i className="bi bi-arrow-repeat me-1" />Retry
                  </button>
              }
            </div>
          )}

          {/* Feedback */}
          {aiFeedback && !aiLoading && (
            <>
              <div className="alert alert-primary mb-4" style={{ fontSize: '0.95rem' }}>
                {aiFeedback.summary}
              </div>

              <div className="row mb-4">
                {aiFeedback.conceptualGaps?.length > 0 && (
                  <div className="col-md-6 mb-3">
                    <h6 className="text-danger"><i className="bi bi-x-circle me-1" />Conceptual Gaps</h6>
                    <ul className="mb-0" style={{ fontSize: '0.88rem' }}>
                      {aiFeedback.conceptualGaps.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
                {aiFeedback.mistakePatterns?.length > 0 && (
                  <div className="col-md-6 mb-3">
                    <h6 className="text-warning"><i className="bi bi-exclamation-circle me-1" />Mistake Patterns</h6>
                    <ul className="mb-0" style={{ fontSize: '0.88rem' }}>
                      {aiFeedback.mistakePatterns.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="row mb-4">
                {aiFeedback.difficultyInsight && (
                  <div className="col-md-6 mb-3">
                    <h6 className="text-info"><i className="bi bi-bar-chart me-1" />Difficulty Analysis</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>{aiFeedback.difficultyInsight}</p>
                  </div>
                )}
                {aiFeedback.timeInsight && (
                  <div className="col-md-6 mb-3">
                    <h6 className="text-secondary"><i className="bi bi-clock me-1" />Time Analysis</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>{aiFeedback.timeInsight}</p>
                  </div>
                )}
              </div>

              {aiFeedback.priorityActions?.length > 0 && (
                <div className="mb-4">
                  <h6><i className="bi bi-list-check me-1" />Priority Actions</h6>
                  <div className="row">
                    {aiFeedback.priorityActions.map((a, i) => (
                      <div className="col-md-4 mb-2" key={i}>
                        <div className="card h-100" style={{ borderLeft: `4px solid ${a.urgency==='high'?'#dc3545':a.urgency==='medium'?'#ffc107':'#28a745'}` }}>
                          <div className="card-body py-2 px-3">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <strong style={{ fontSize: '0.85rem' }}>{a.action}</strong>
                              <span className={`badge ms-2 ${a.urgency==='high'?'bg-danger':a.urgency==='medium'?'bg-warning text-dark':'bg-success'}`}>{a.urgency}</span>
                            </div>
                            <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{a.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiFeedback.encouragement && (
                <div className="alert alert-success mb-0" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-star me-2" />{aiFeedback.encouragement}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          STATS ROW
      ══════════════════════════════════════════ */}
      <div className="row mb-4">

        {/* Score donut */}
        <div className="col-md-3 mb-3">
          <div className="card h-100 text-center">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <div style={{ width:110,height:110,borderRadius:'50%',background:`conic-gradient(${scoreColor} ${attempt.percentage}%,#e9ecef ${attempt.percentage}%)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
                <div style={{ width:74,height:74,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',fontWeight:'bold',color:scoreColor }}>
                  {Math.round(attempt.percentage)}%
                </div>
              </div>
              <h6 className="mb-0">Overall Score</h6>
              <small className="text-muted">{attempt.correctAnswers}/{attempt.totalQuestions} correct</small>
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Time Stats</h6>
              <div className="d-flex flex-column gap-2 mt-2">
                <div><span className="text-muted">Total</span><br /><strong>{fmtTime(totalTimeSec)}</strong></div>
                <div><span className="text-muted">Avg / Question</span><br /><strong>{fmtTime(avgTimeSec)}</strong></div>
                <div><span className="text-muted">Longest</span><br /><strong>{fmtTime(maxTimeSec)}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">By Difficulty</h6>
              {Object.entries(difficultyStats).map(([d, s]) => s.total === 0 ? null : (
                <div key={d} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span style={{ color: difficultyColor[d], fontWeight:600, textTransform:'capitalize' }}>{d}</span>
                    <small className="text-muted">{s.correct}/{s.total} ({pct(s.correct,s.total)}%)</small>
                  </div>
                  <div style={{ height:6,background:'#e9ecef',borderRadius:3 }}>
                    <div style={{ width:`${pct(s.correct,s.total)}%`,height:'100%',background:difficultyColor[d],borderRadius:3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Type */}
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">By Question Type</h6>
              {Object.entries(typeStats).map(([t, s]) => (
                <div key={t} className="mb-2">
                  <div className="d-flex justify-content-between">
                    <span style={{ fontSize:'0.8rem' }}>{t.replace(/_/g,' ')}</span>
                    <small className="text-muted">{s.correct}/{s.total}</small>
                  </div>
                  <div style={{ height:5,background:'#e9ecef',borderRadius:3 }}>
                    <div style={{ width:`${pct(s.correct,s.total)}%`,height:'100%',background:'#667eea',borderRadius:3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MISSED HARD + SLOWEST
      ══════════════════════════════════════════ */}
      {(hardestQuestions.length > 0 || slowestQuestions.length > 0) && (
        <div className="row mb-4">
          {hardestQuestions.length > 0 && (
            <div className="col-md-6 mb-3">
              <div className="card border-danger h-100">
                <div className="card-header bg-danger text-white">
                  <i className="bi bi-exclamation-triangle me-2" />Missed Hard Questions
                </div>
                <ul className="list-group list-group-flush">
                  {hardestQuestions.map((q, i) => (
                    <li key={i} className="list-group-item">
                      <div className="fw-semibold mb-1" style={{ fontSize:'0.88rem' }}>Q{q.questionNumber}: {q.questionText}</div>
                      {q.explanation && <div className="text-muted" style={{ fontSize:'0.8rem' }}><i className="bi bi-lightbulb me-1 text-warning" />{q.explanation}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {slowestQuestions.length > 0 && (
            <div className="col-md-6 mb-3">
              <div className="card border-warning h-100">
                <div className="card-header bg-warning text-dark">
                  <i className="bi bi-clock me-2" />Slowest Questions
                </div>
                <ul className="list-group list-group-flush">
                  {slowestQuestions.map((q, i) => (
                    <li key={i} className="list-group-item d-flex justify-content-between align-items-start">
                      <div style={{ fontSize:'0.88rem' }}>
                        <strong>Q{q.questionNumber}</strong>: {q.questionText?.slice(0,80)}{q.questionText?.length>80?'…':''}
                      </div>
                      <div className="ms-2 text-nowrap">
                        <span className="badge bg-warning text-dark">{fmtTime(q.timeTaken)}</span>
                        <span className={`badge ms-1 ${q.isCorrect?'bg-success':'bg-danger'}`}>{q.isCorrect?'✓':'✗'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          QUESTION TABLE
      ══════════════════════════════════════════ */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">Question-by-Question Breakdown</h5>
          <div className="btn-group btn-group-sm">
            {[['all','All'],['correct','Correct'],['wrong','Wrong'],['hard','Hard']].map(([v,l]) => (
              <button key={v} className={`btn ${filter===v?'btn-primary':'btn-outline-secondary'}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width:40 }}>#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Your Answer</th>
                  <th>Time</th>
                  <th>Result</th>
                  <th style={{ width:60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="text-center text-muted py-4">No questions match this filter.</td></tr>
                  : filtered.map((r, i) => (
                    <React.Fragment key={i}>
                      <tr
                        style={{ cursor:'pointer', background: r.isCorrect?'rgba(40,167,69,0.03)':'rgba(220,53,69,0.04)' }}
                        onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                      >
                        <td><strong>Q{r.questionNumber}</strong></td>
                        <td style={{ maxWidth:300, fontSize:'0.88rem' }}>{r.questionText?.slice(0,90)}{r.questionText?.length>90?'…':''}</td>
                        <td><span className="badge bg-secondary" style={{ fontSize:'0.72rem' }}>{(r.type||'unknown').replace(/_/g,' ')}</span></td>
                        <td>
                          {r.difficulty
                            ? <span className="badge" style={{ background:difficultyBg[r.difficulty],color:difficultyColor[r.difficulty],fontSize:'0.75rem' }}>{r.difficulty}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td style={{ fontSize:'0.85rem',maxWidth:120,wordBreak:'break-word' }}>{r.userAnswer||<span className="text-muted">—</span>}</td>
                        <td><span className="badge bg-light text-dark border">{fmtTime(r.timeTaken)}</span></td>
                        <td><span className={`badge ${r.isCorrect?'bg-success':'bg-danger'}`}>{r.isCorrect?'✓ Correct':'✗ Wrong'}</span></td>
                        <td><button className="btn btn-outline-primary btn-sm">{expandedQ===i?'▲':'▼'}</button></td>
                      </tr>

                      {expandedQ === i && (
                        <tr>
                          <td colSpan={8} style={{ background:'#f8f9ff',padding:'1rem 1.5rem' }}>
                            <div className="row">
                              <div className="col-md-6">
                                <p className="mb-1"><strong>Full Question:</strong></p>
                                <p className="mb-2" style={{ fontSize:'0.9rem' }}>{r.questionText}</p>
                                {r.options?.length > 0 && (
                                  <div className="mb-2">
                                    <strong>Options:</strong>
                                    <ul className="mb-0 mt-1">
                                      {r.options.map((opt,oi) => (
                                        <li key={oi} style={{ color: opt===r.correctAnswer?'#28a745':opt===r.userAnswer?'#dc3545':'inherit', fontWeight:(opt===r.correctAnswer||opt===r.userAnswer)?600:400, fontSize:'0.87rem' }}>
                                          {opt}{opt===r.correctAnswer?' ✓':''}{opt===r.userAnswer&&opt!==r.correctAnswer?' ✗':''}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="col-md-6">
                                <div className="mb-2">
                                  <span className="text-muted">Your Answer: </span>
                                  <span style={{ color:r.isCorrect?'#28a745':'#dc3545',fontWeight:600 }}>{r.userAnswer||'—'}</span>
                                </div>
                                <div className="mb-2">
                                  <span className="text-muted">Correct Answer: </span>
                                  <span style={{ color:'#28a745',fontWeight:600 }}>{Array.isArray(r.correctAnswer)?r.correctAnswer.join(', '):r.correctAnswer}</span>
                                </div>
                                {r.format_hint && (
                                  <div className="mb-2">
                                    <span className="text-muted">Format: </span>
                                    <code style={{ fontSize:'0.82rem' }}>{r.format_hint}</code>
                                  </div>
                                )}
                                {r.explanation && (
                                  <div className="alert alert-info py-2 px-3 mb-0" style={{ fontSize:'0.85rem' }}>
                                    <i className="bi bi-lightbulb me-1" /><strong>Explanation:</strong> {r.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
