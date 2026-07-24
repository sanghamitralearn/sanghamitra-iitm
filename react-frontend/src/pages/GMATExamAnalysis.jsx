import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const difficultyColor = { easy: '#28a745', medium: '#ffc107', hard: '#dc3545', unknown: '#6c757d' };
const difficultyBg   = { easy: 'rgba(40,167,69,0.1)', medium: 'rgba(255,193,7,0.1)', hard: 'rgba(220,53,69,0.1)', unknown: 'rgba(108,117,125,0.1)' };

const pct = (c, t) => t > 0 ? ((c / t) * 100).toFixed(0) : 0;

const Skel = ({ w = '100%', h = 16 }) => (
  <div style={{ width: w, height: h, background: '#e9ecef', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
);

const getOptionText = (options, id) => {
  if (id == null) return null;
  const opt = (options || []).find(o => o.option_id === id || o.option_id === String(id));
  return opt ? opt.text : (Array.isArray(id) ? id.join(', ') : String(id));
};

export default function GMATExamAnalysis() {
  const { email, subject, attemptNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const [filter, setFilter] = useState('all');

  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState(null);
  const [countdown,  setCountdown]  = useState(0);

  const countdownRef = useRef(null);
  const studentName = location.state?.studentName || email;

  useEffect(() => () => clearInterval(countdownRef.current), []);

  const fetchAI = async (examData) => {
    clearInterval(countdownRef.current);
    setAiLoading(true);
    setAiError(null);
    setCountdown(0);
    try {
      const res = await axios.post(
        `${API_URL}/api/gmat_exam_ai_feedback`,
        { student: examData.student, attempt: examData.attempt, enrichedResults: examData.enrichedResults, insights: examData.insights },
        { withCredentials: true }
      );
      if (res.data.success) setAiFeedback(res.data.feedback);
      else setAiError(res.data.message);
    } catch (e) {
      const msg  = e.response?.data?.message || 'AI service unavailable.';
      const secs = e.response?.data?.retryAfter;
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

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/gmat_exam_detail`, {
          params: { email, subject, attemptNumber },
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
  }, [email, subject, attemptNumber]);

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
  const { difficultyStats, typeStats, hardestQuestions } = insights || {};
  const scoreColor = attempt.percentage >= 80 ? '#28a745' : attempt.percentage >= 60 ? '#ffc107' : '#dc3545';

  const filtered = enrichedResults.filter(r => {
    if (filter === 'wrong')   return !r.isCorrect && r.userAnswer != null;
    if (filter === 'correct') return r.isCorrect;
    if (filter === 'unattempted') return r.userAnswer == null;
    return true;
  });

  return (
    <div className="container my-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">GMAT Exam Analysis</h2>
          <p className="text-muted mb-0">
            <strong>{studentName}</strong> · Section: <strong>{attempt.subject}</strong> · Attempt #{attempt.attemptNumber} · {attempt.dateAttempted ? new Date(attempt.dateAttempted).toLocaleString() : 'N/A'}
            {attempt.scaledScore != null && <> · Scaled Score: <strong>{attempt.scaledScore}/90</strong></>}
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

          {aiLoading && (
            <>
              <Skel w="100%" h={18} /><Skel w="80%" h={14} /><Skel w="90%" h={14} /><Skel w="65%" h={14} />
              <div className="row mt-3">
                {[1,2,3].map(i => <div key={i} className="col-md-4 mb-2"><div style={{ height: 80, background: '#e9ecef', borderRadius: 8 }} /></div>)}
              </div>
            </>
          )}

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
                    <h6 className="text-secondary"><i className="bi bi-clock me-1" />Pacing Analysis</h6>
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

      {/* Stats Row */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card h-100 text-center">
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <div style={{ width:110,height:110,borderRadius:'50%',background:`conic-gradient(${scoreColor} ${attempt.percentage}%,#e9ecef ${attempt.percentage}%)`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
                <div style={{ width:74,height:74,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',fontWeight:'bold',color:scoreColor }}>
                  {attempt.scaledScore != null ? attempt.scaledScore : `${Math.round(attempt.percentage)}%`}
                </div>
              </div>
              <h6 className="mb-0">{attempt.scaledScore != null ? 'Scaled Score / 90' : 'Overall Score'}</h6>
              <small className="text-muted">{attempt.correctAnswers}/{attempt.totalQuestions} correct</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Score</h6>
              <h3 className="mb-0" style={{ color: scoreColor }}>{attempt.score} / {attempt.maxScore}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Correct / Wrong</h6>
              <p className="mb-1"><span className="badge bg-success me-2">{attempt.correctAnswers}</span>Correct</p>
              <p className="mb-0"><span className="badge bg-danger me-2">{attempt.wrongAnswers ?? 0}</span>Wrong</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="card-title text-muted">Unattempted</h6>
              <h3 className="mb-0 text-secondary">{attempt.unattempted ?? 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty / Type breakdown + Hardest Questions */}
      {(difficultyStats || typeStats || hardestQuestions?.length > 0) && (
        <div className="row mb-4">
          {difficultyStats && (
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
          )}

          {typeStats && (
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
          )}

          {hardestQuestions?.length > 0 && (
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
        </div>
      )}

      {/* Question Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">Question-by-Question Breakdown</h5>
          <div className="btn-group btn-group-sm">
            {[['all','All'],['correct','Correct'],['wrong','Wrong'],['unattempted','Unattempted']].map(([v,l]) => (
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
                  <th>Result</th>
                  <th style={{ width:60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="text-center text-muted py-4">No questions match this filter.</td></tr>
                  : filtered.map((r, i) => {
                    const userAnswerText = r.type === 'numeric'
                      ? r.userAnswer
                      : getOptionText(r.options, r.userAnswer);
                    const correctAnswerText = r.type === 'numeric'
                      ? (Array.isArray(r.correctAnswer) ? r.correctAnswer.join(', ') : r.correctAnswer)
                      : getOptionText(r.options, r.correctAnswer);

                    return (
                      <React.Fragment key={i}>
                        <tr
                          style={{ cursor:'pointer', background: r.userAnswer == null ? 'rgba(108,117,125,0.04)' : (r.isCorrect?'rgba(40,167,69,0.03)':'rgba(220,53,69,0.04)') }}
                          onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                        >
                          <td><strong>Q{r.questionNumber}</strong></td>
                          <td style={{ maxWidth:350, fontSize:'0.88rem' }}>{r.questionText?.slice(0,90)}{r.questionText?.length>90?'…':''}</td>
                          <td><span className="badge bg-secondary" style={{ fontSize:'0.72rem' }}>{(r.type||'unknown').replace(/_/g,' ')}</span></td>
                          <td>
                            {r.difficulty
                              ? <span className="badge" style={{ background:difficultyBg[r.difficulty],color:difficultyColor[r.difficulty],fontSize:'0.75rem' }}>{r.difficulty}</span>
                              : <span className="text-muted">—</span>}
                          </td>
                          <td style={{ fontSize:'0.85rem',maxWidth:150,wordBreak:'break-word' }}>{userAnswerText ?? <span className="text-muted">Not attempted</span>}</td>
                          <td>
                            {r.userAnswer == null
                              ? <span className="badge bg-secondary">Unattempted</span>
                              : <span className={`badge ${r.isCorrect?'bg-success':'bg-danger'}`}>{r.isCorrect?'✓ Correct':'✗ Wrong'}</span>}
                          </td>
                          <td><button className="btn btn-outline-primary btn-sm">{expandedQ===i?'▲':'▼'}</button></td>
                        </tr>

                        {expandedQ === i && (
                          <tr>
                            <td colSpan={7} style={{ background:'#f8f9ff',padding:'1rem 1.5rem' }}>
                              <div className="row">
                                <div className="col-md-6">
                                  <p className="mb-1"><strong>Full Question:</strong></p>
                                  <p className="mb-2" style={{ fontSize:'0.9rem' }}>{r.questionText}</p>
                                  {r.options?.length > 0 && (
                                    <div className="mb-2">
                                      <strong>Options:</strong>
                                      <ul className="mb-0 mt-1">
                                        {r.options.map((opt, oi) => {
                                          const isCorrectOpt = opt.option_id === r.correctAnswer || (Array.isArray(r.correctAnswer) && r.correctAnswer.includes(opt.option_id));
                                          const isUserOpt = opt.option_id === r.userAnswer;
                                          return (
                                            <li key={oi} style={{ color: isCorrectOpt?'#28a745':isUserOpt?'#dc3545':'inherit', fontWeight:(isCorrectOpt||isUserOpt)?600:400, fontSize:'0.87rem' }}>
                                              {opt.text}{isCorrectOpt?' ✓':''}{isUserOpt && !isCorrectOpt?' ✗':''}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-6">
                                  <div className="mb-2">
                                    <span className="text-muted">Your Answer: </span>
                                    <span style={{ color:r.userAnswer==null?'#6c757d':r.isCorrect?'#28a745':'#dc3545',fontWeight:600 }}>{userAnswerText ?? 'Not attempted'}</span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-muted">Correct Answer: </span>
                                    <span style={{ color:'#28a745',fontWeight:600 }}>{correctAnswerText}</span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="text-muted">Marks Awarded: </span>
                                    <span style={{ fontWeight:600 }}>{r.marksAwarded ?? 0} / {r.points ?? 1}</span>
                                  </div>
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
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
