import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const BLUE   = '#2563EB';
const NAVY   = '#1E293B';
const BG     = '#F0F4FF';
const GREEN  = '#10B981';
const RED    = '#EF4444';
const GRAY   = '#94A3B8';
const BORDER = '#E2E8F0';
const ACCENT = BLUE;
const ORANGE = '#F59E0B';
const FULLPAPER_COLOR = '#5fcf80';
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];
const SUBJECT_COLOR = { Physics: '#0d6efd', Chemistry: '#198754', Mathematics: '#dc3545' };

// ── Sub-component: Full Paper session history + trend ────────────────────────
const FullPaperInsightsSection = ({ selectedStudent, getScoreColor, handleAnalyze }) => {
  const [tooltip, setTooltip] = useState(null);

  const sessions = (selectedStudent.quizScores || [])
    .filter(q => q.type === 'FullPaper')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((q, i) => ({ ...q, n: i + 1 }));
  if (!sessions.length) return null;

  const W = 400, H = 180, PX = 44, PY = 18;
  const maxV = Math.max(...sessions.map(s => s.maxScore || 0), 100);
  const xSc = (i, len) => PX + (len <= 1 ? (W - 2 * PX) / 2 : (i / (len - 1)) * (W - 2 * PX));
  const ySc = v => PY + ((maxV - v) / maxV) * (H - 2 * PY);
  const steps = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxV * f));

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: FULLPAPER_COLOR, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Full Paper — Insights</span>
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Session History
              <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.76rem' }}>({sessions.length} session{sessions.length !== 1 ? 's' : ''})</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>#</th>
                    <th style={{ color: SUBJECT_COLOR.Physics }}>Phy</th>
                    <th style={{ color: SUBJECT_COLOR.Chemistry }}>Che</th>
                    <th style={{ color: SUBJECT_COLOR.Mathematics }}>Mat</th>
                    <th>Total</th><th>Paper</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sessions].reverse().map((s, i) => {
                    const pct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                    const fmt = (sub) => {
                      const ss = s.subjectScores?.[sub];
                      if (!ss) return <span className="text-muted">—</span>;
                      return <span style={{ fontWeight: 600, color: SUBJECT_COLOR[sub] }}>{ss.score > 0 ? '+' : ''}{ss.score}</span>;
                    };
                    return (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => handleAnalyze(s)} title="Click to view full paper analysis">
                        <td className="text-muted">#{s.n}</td>
                        <td>{fmt('Physics')}</td>
                        <td>{fmt('Chemistry')}</td>
                        <td>{fmt('Mathematics')}</td>
                        <td><span style={{ fontWeight: 700, color: getScoreColor(pct) }}>{s.score}/{s.maxScore}</span></td>
                        <td className="text-muted">{s.paper || '—'}</td>
                        <td className="text-muted">{s.timestamp ? new Date(s.timestamp).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Score Trend (out of {maxV})
            </div>
            <div className="card-body p-3">
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                {steps.map(v => (
                  <g key={v}>
                    <line x1={PX} y1={ySc(v)} x2={W - 8} y2={ySc(v)}
                      stroke={v === 0 ? '#ced4da' : '#efefef'} strokeWidth={1}
                      strokeDasharray={v === 0 ? '4 2' : ''} />
                    <text x={PX - 4} y={ySc(v) + 4} textAnchor="end" fontSize={9} fill="#adb5bd">{v}</text>
                  </g>
                ))}
                {sessions.length > 1 && (
                  <path d={sessions.map((s, i) => `${i === 0 ? 'M' : 'L'}${xSc(i, sessions.length)},${ySc(s.score)}`).join(' ')}
                    stroke={FULLPAPER_COLOR} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                )}
                {sessions.map((s, i) => {
                  const cx = xSc(i, sessions.length), cy = ySc(s.score);
                  return (
                    <g key={i} style={{ cursor: 'pointer' }}
                       onMouseEnter={() => setTooltip({ text: `S${s.n}: ${s.score}/${s.maxScore}`, x: cx, y: cy })}
                       onMouseLeave={() => setTooltip(null)}>
                      <circle cx={cx} cy={cy} r={7} fill={FULLPAPER_COLOR} stroke="#fff" strokeWidth={2} />
                      <text x={cx} y={cy - 11} textAnchor="middle" fontSize={9} fill={FULLPAPER_COLOR} fontWeight="bold">{s.score}</text>
                      <text x={cx} y={H - 2} textAnchor="middle" fontSize={8} fill="#adb5bd">S{s.n}</text>
                    </g>
                  );
                })}
                {tooltip && (
                  <g>
                    <rect x={tooltip.x - 52} y={tooltip.y - 30} width={104} height={20} rx={4} fill="rgba(0,0,0,0.82)" />
                    <text x={tooltip.x} y={tooltip.y - 15} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="bold">{tooltip.text}</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-component: Subject Practice insights ──────────────────────────────────
const SubjectPracticeInsightsSection = ({ practiceAttempts, getScoreColor, handleAnalyze }) => {
  const [tooltip, setTooltip] = useState(null);

  const bySub = {};
  SUBJECTS.forEach(sub => {
    bySub[sub] = practiceAttempts.filter(q => q.subject === sub)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  const maxV = Math.max(...practiceAttempts.map(q => q.maxScore || 0), 60);
  const minV = Math.min(...practiceAttempts.map(q => q.score || 0), 0);
  const W = 400, H = 160, PX = 36, PY = 16;
  const xSc = (i, len) => PX + (len <= 1 ? (W - 2 * PX) / 2 : (i / (len - 1)) * (W - 2 * PX));
  const ySc = v => PY + ((maxV - v) / (maxV - minV)) * (H - 2 * PY);
  const steps = [minV < 0 ? minV : null, 0, Math.round(maxV * 0.33), Math.round(maxV * 0.66), maxV].filter(v => v !== null && v >= minV);

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: NAVY, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Subject Practice — Insights</span>
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Practice History
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="table table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                  <tr><th>Subject</th><th>#</th><th>Score</th><th>✓</th><th>✗</th><th>Acc</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {[...practiceAttempts].reverse().map((q, i) => {
                    const pct = q.maxScore > 0 ? Math.round((q.score / q.maxScore) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td><span style={{ color: SUBJECT_COLOR[q.subject], fontWeight: 700 }}>{q.subject?.slice(0, 4)}</span></td>
                        <td className="text-muted">#{q.attemptNumber || i + 1}</td>
                        <td><span style={{ fontWeight: 700, color: getScoreColor(pct) }}>{q.score}/{q.maxScore}</span></td>
                        <td className="text-success fw-semibold">{q.correctAnswers}</td>
                        <td className="text-danger fw-semibold">{q.wrongAnswers}</td>
                        <td><span style={{ color: getScoreColor(q.accuracy || 0), fontWeight: 600 }}>{q.accuracy ?? 0}%</span></td>
                        <td className="text-muted">{q.timestamp ? new Date(q.timestamp).toLocaleDateString() : '—'}</td>
                        <td>
                          <button className="btn btn-primary btn-sm py-0 px-1" style={{ fontSize: '0.7rem' }} onClick={() => handleAnalyze(q)}>
                            <i className="bi bi-bar-chart-line" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Subject Score Trend
              <div className="d-flex gap-2">
                {SUBJECTS.map(sub => bySub[sub].length > 0 && (
                  <span key={sub} style={{ fontSize: '0.7rem', color: SUBJECT_COLOR[sub], fontWeight: 600 }}>● {sub.slice(0, 3)}</span>
                ))}
              </div>
            </div>
            <div className="card-body p-3">
              {practiceAttempts.length < 1 ? (
                <div className="text-center text-muted py-4" style={{ fontSize: '0.82rem' }}>No subject practice attempts</div>
              ) : (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                  {steps.map(v => (
                    <g key={v}>
                      <line x1={PX} y1={ySc(v)} x2={W - 8} y2={ySc(v)}
                        stroke={v === 0 ? '#ced4da' : '#efefef'} strokeWidth={1}
                        strokeDasharray={v === 0 ? '4 2' : ''} />
                      <text x={PX - 4} y={ySc(v) + 4} textAnchor="end" fontSize={9} fill="#adb5bd">{v}</text>
                    </g>
                  ))}
                  {SUBJECTS.map(sub => {
                    const pts = bySub[sub];
                    if (!pts.length) return null;
                    return (
                      <g key={sub}>
                        {pts.length > 1 && (
                          <path d={pts.map((q, i) => `${i === 0 ? 'M' : 'L'}${xSc(i, pts.length)},${ySc(q.score)}`).join(' ')}
                            stroke={SUBJECT_COLOR[sub]} strokeWidth={2} fill="none" strokeLinejoin="round" />
                        )}
                        {pts.map((q, i) => {
                          const cx = xSc(i, pts.length), cy = ySc(q.score);
                          return (
                            <g key={i} style={{ cursor: 'pointer' }}
                               onMouseEnter={() => setTooltip({ text: `${sub.slice(0,4)} #${i+1}: ${q.score}/${q.maxScore}`, x: cx, y: cy })}
                               onMouseLeave={() => setTooltip(null)}>
                              <circle cx={cx} cy={cy} r={5} fill={SUBJECT_COLOR[sub]} stroke="#fff" strokeWidth={1.5} />
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                  {tooltip && (
                    <g>
                      <rect x={tooltip.x - 58} y={tooltip.y - 30} width={116} height={20} rx={4} fill="rgba(0,0,0,0.82)" />
                      <text x={tooltip.x} y={tooltip.y - 15} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="bold">{tooltip.text}</text>
                    </g>
                  )}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const JEEMainDashboard = () => {
  const navigate = useNavigate();
  const [jeeData, setJeeData]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadJEEData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/jee_main_admin_scores`, { withCredentials: true });
      if (res.data.success && res.data.data) {
        setJeeData(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
      } else setJeeData([]);
    } catch (err) { setError(`Fetch failed: ${err?.response?.status || ''} ${err?.message}`); setJeeData([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadJEEData(); }, []);

  const getScoreColor = (pct) => pct >= 50 ? GREEN : pct >= 25 ? ORANGE : RED;

  const getLatestFullPaper = (student) => {
    const entries = (student.quizScores || []).filter(q => q.type === 'FullPaper')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return entries[0] || null;
  };

  // Standalone subject practice; falls back to the latest Full Paper's per-subject
  // breakdown when the student has never done standalone practice for that subject.
  const getLatestPractice = (student, subject) => {
    const entries = (student.quizScores || []).filter(q => q.type === 'Practice' && q.subject === subject)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (entries[0]) return entries[0];

    const fullPapers = (student.quizScores || [])
      .filter(q => q.type === 'FullPaper' && q.subjectScores?.[subject])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const fp = fullPapers[0];
    if (!fp) return null;
    const ss = fp.subjectScores[subject];
    const attempted = (ss.correctAnswers || 0) + (ss.wrongAnswers || 0);
    return {
      type: 'FullPaperSubject',
      fullPaperEntry: fp,
      subject,
      score: ss.score, maxScore: ss.maxScore,
      correctAnswers: ss.correctAnswers, wrongAnswers: ss.wrongAnswers, unattempted: ss.unattempted,
      totalQuestions: ss.totalQuestions,
      accuracy: attempted > 0 ? Math.round((ss.correctAnswers / attempted) * 100) : 0,
      timestamp: fp.timestamp,
    };
  };

  // Open the existing student-facing analysis page for one attempt
  const handleAnalyze = (quiz) => {
    if (quiz.type === 'FullPaperSubject') {
      handleAnalyze(quiz.fullPaperEntry);
      return;
    }
    if (quiz.type === 'FullPaper') {
      navigate('/courses/jee-main/analysis', {
        state: {
          results: {
            _id:            quiz.attemptId,
            year:           quiz.year,
            paper:          quiz.paper,
            totalQuestions: quiz.totalQuestions,
            correctAnswers: quiz.correctAnswers,
            wrongAnswers:   quiz.wrongAnswers,
            unattempted:    quiz.unattempted,
            score:          quiz.score,
            maxScore:       quiz.maxScore,
            percentage:     quiz.percentage,
            subjectScores:  quiz.subjectScores,
            responses:      quiz.responses || [],
            totalTimeTaken: quiz.totalTimeTaken,
            dateAttempted:  quiz.timestamp,
          },
          questions: null,
        },
      });
    } else {
      navigate('/courses/jee-main/analysis', {
        state: {
          results: {
            subject:        quiz.subject,
            totalQuestions: quiz.totalQuestions,
            correctAnswers: quiz.correctAnswers,
            wrongAnswers:   quiz.wrongAnswers,
            unattempted:    quiz.unattempted,
            score:          quiz.score,
            maxScore:       quiz.maxScore,
            percentage:     quiz.percentage,
            responses:      quiz.responses || [],
            dateAttempted:  quiz.timestamp,
          },
          questions: null,
        },
      });
    }
  };

  const calculateStats = () => {
    let totalScore = 0, totalMax = 0, totalSubmissions = 0;
    jeeData.forEach(s => (s.quizScores || []).forEach(q => {
      totalScore += q.score || 0; totalMax += q.maxScore || 0; totalSubmissions++;
    }));
    return { totalStudents: jeeData.length, avgScore: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0, totalSubmissions };
  };
  const stats = calculateStats();

  if (loading) return (
    <div className="container my-4 d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" style={{ color: ACCENT }} role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  // ── Student detail ───────────────────────────────────────────────────────────
  if (selectedStudent) {
    const latestFullPaper  = getLatestFullPaper(selectedStudent);
    const practiceAttempts = (selectedStudent.quizScores || [])
      .filter(q => q.type === 'Practice')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const fullPaperCount = (selectedStudent.quizScores || []).filter(q => q.type === 'FullPaper').length;

    const FullPaperCard = () => {
      const hasData = !!latestFullPaper;
      const pct = hasData && latestFullPaper.maxScore > 0 ? Math.round((latestFullPaper.score / latestFullPaper.maxScore) * 100) : 0;
      return (
        <div className="card border-0 h-100" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderTop: `4px solid ${FULLPAPER_COLOR}` }}>
          <div className="d-flex justify-content-between align-items-center px-4 pt-3 pb-2">
            <span style={{ fontWeight: 800, fontSize: '1rem', color: NAVY, letterSpacing: 0.3 }}>Full Paper</span>
            {hasData && (
              <div className="text-end">
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(pct), lineHeight: 1 }}>{latestFullPaper.score}</span>
                <span style={{ color: GRAY, fontSize: '0.88rem' }}> / {latestFullPaper.maxScore}</span>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: getScoreColor(pct), color: '#fff', borderRadius: 20, padding: '1px 8px' }}>{pct}%</span>
                </div>
              </div>
            )}
          </div>
          <hr className="mx-3 mt-0 mb-0" style={{ borderColor: '#f0f0f0' }} />
          <div className="card-body p-0">
            {!hasData ? (
              <div className="text-center py-4" style={{ color: GRAY, fontSize: '0.9rem' }}>Not attempted</div>
            ) : (
              <>
                {SUBJECTS.map(sub => {
                  const s = latestFullPaper.subjectScores?.[sub];
                  if (!s) return (
                    <div key={sub} className="d-flex justify-content-between align-items-center px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                      <span style={{ color: GRAY, fontSize: '0.8rem' }}>Not attempted</span>
                    </div>
                  );
                  const sp = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;
                  return (
                    <div key={sub} className="d-flex justify-content-between align-items-center px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: getScoreColor(sp) }}>
                        {s.score}<span style={{ color: GRAY, fontWeight: 400, fontSize: '0.8rem' }}>/{s.maxScore}</span>
                      </span>
                    </div>
                  );
                })}
                <div className="px-4 py-3">
                  <button style={{ background: FULLPAPER_COLOR, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.78rem', padding: '6px 16px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                    onClick={() => handleAnalyze(latestFullPaper)}>
                    View Full Analysis →
                  </button>
                  <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 8 }}>
                    {fullPaperCount} attempt{fullPaperCount !== 1 ? 's' : ''} · {latestFullPaper.timestamp ? new Date(latestFullPaper.timestamp).toLocaleDateString() : ''}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      );
    };

    const SubjectPracticeCard = () => {
      const totals = SUBJECTS.reduce((acc, sub) => {
        const latest = getLatestPractice(selectedStudent, sub);
        if (latest) { acc.score += latest.score || 0; acc.max += latest.maxScore || 0; acc.any = true; }
        return acc;
      }, { score: 0, max: 0, any: false });
      const pct = totals.max > 0 ? Math.round((totals.score / totals.max) * 100) : 0;

      return (
        <div className="card border-0 h-100" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderTop: `4px solid ${NAVY}` }}>
          <div className="d-flex justify-content-between align-items-center px-4 pt-3 pb-2">
            <span style={{ fontWeight: 800, fontSize: '1rem', color: NAVY, letterSpacing: 0.3 }}>Subject Practice</span>
            {totals.any && (
              <div className="text-end">
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(pct), lineHeight: 1 }}>{totals.score}</span>
                <span style={{ color: GRAY, fontSize: '0.88rem' }}> / {totals.max}</span>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: getScoreColor(pct), color: '#fff', borderRadius: 20, padding: '1px 8px' }}>{pct}%</span>
                </div>
              </div>
            )}
          </div>
          <hr className="mx-3 mt-0 mb-0" style={{ borderColor: '#f0f0f0' }} />
          <div className="card-body p-0">
            {!totals.any ? (
              <div className="text-center py-4" style={{ color: GRAY, fontSize: '0.9rem' }}>Not attempted</div>
            ) : (
              SUBJECTS.map(sub => {
                const latest = getLatestPractice(selectedStudent, sub);
                const attempts = practiceAttempts.filter(q => q.subject === sub);
                if (!latest) return (
                  <div key={sub} className="d-flex justify-content-between align-items-center px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                    <span style={{ color: GRAY, fontSize: '0.8rem' }}>Not attempted</span>
                  </div>
                );
                const sp = latest.maxScore > 0 ? Math.round((latest.score / latest.maxScore) * 100) : 0;
                const isDerived = latest.type === 'FullPaperSubject';
                return (
                  <div key={sub} className="px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                        <span style={{ fontSize: '0.68rem', color: GRAY, background: '#f4f6fb', borderRadius: 10, padding: '1px 7px' }}>
                          {isDerived ? 'from Full Paper' : `${attempts.length} att`}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: getScoreColor(sp), minWidth: 56, textAlign: 'right' }}>
                          {latest.score}<span style={{ color: GRAY, fontWeight: 400, fontSize: '0.8rem' }}>/{latest.maxScore}</span>
                        </span>
                        <button style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.7rem', padding: '3px 10px', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => handleAnalyze(latest)}>
                          Analyze
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>
                      <span style={{ color: GREEN, fontWeight: 600 }}>{latest.correctAnswers}✓</span>{' '}
                      <span style={{ color: RED, fontWeight: 600 }}>{latest.wrongAnswers}✗</span>{' '}
                      <span>{latest.unattempted}—</span>{' · acc '}{latest.accuracy ?? 0}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ background: BG, minHeight: '100vh', padding: '24px' }}>
        <div className="d-flex align-items-center gap-2 mb-4">
          <button onClick={() => navigate('/admin')}
            style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Admin Home
          </button>
          <button onClick={() => setSelectedStudent(null)}
            style={{ background: '#fff', color: NAVY, border: `1px solid #e0e0e0`, borderRadius: 8, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Back to List
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: `4px solid ${BLUE}`, padding: '22px 28px', marginBottom: 16 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: NAVY, marginBottom: 18 }}>
            Student Details: <span style={{ color: BLUE }}>{selectedStudent.name || 'Unknown'}</span>
          </div>
          <div className="row">
            <div className="col-md-6" style={{ borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: '0.8rem', color: BLUE, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Student Information</div>
              <div className="mb-2" style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Email: </span><strong>{selectedStudent.email}</strong></div>
              <div style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Name: </span><strong>{selectedStudent.name || 'Unknown'}</strong></div>
            </div>
            <div className="col-md-6 ps-4">
              <div style={{ fontSize: '0.8rem', color: BLUE, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Performance Summary</div>
              <div className="mb-2" style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Total Submissions: </span><strong>{(selectedStudent.quizScores || []).length}</strong></div>
              {latestFullPaper && (
                <div style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Latest Full Paper: </span>
                  <strong style={{ color: getScoreColor(latestFullPaper.percentage || 0), fontSize: '1.1rem' }}>{latestFullPaper.score}</strong>
                  <span style={{ color: '#555', fontSize: '0.92rem' }}> / {latestFullPaper.maxScore} ({latestFullPaper.percentage || 0}%)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {latestFullPaper && (
          <div className="mb-4" style={{
            background: latestFullPaper.score < 0
              ? 'linear-gradient(135deg, #c0392b, #e67e22)'
              : (latestFullPaper.percentage || 0) >= 50
                ? `linear-gradient(135deg, ${NAVY}, ${FULLPAPER_COLOR})`
                : `linear-gradient(135deg, #e67e22, #f39c12)`,
            borderRadius: 16, padding: '28px 36px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h3 className="fw-bold mb-2" style={{ fontSize: '1.6rem' }}>Combined Score</h3>
              <div style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>Physics + Chemistry + Mathematics · JEE Main</div>
              <div style={{ marginTop: 14, fontSize: '1rem', opacity: 0.85 }}>
                {(selectedStudent.quizScores || []).length} total attempts across all subjects
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 130, height: 130, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.5)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1 }}>{latestFullPaper.score}</span>
                <div style={{ width: '55%', height: 1, background: 'rgba(255,255,255,0.6)', margin: '6px 0' }} />
                <span style={{ fontSize: '1.2rem', opacity: 0.9 }}>{latestFullPaper.maxScore}</span>
              </div>
              <div style={{ opacity: 0.9, fontSize: '1rem', marginTop: 8, fontWeight: 700 }}>{latestFullPaper.percentage || 0}%</div>
            </div>
          </div>
        )}

        <div className="row g-4 mb-4">
          <div className="col-md-6"><FullPaperCard /></div>
          <div className="col-md-6"><SubjectPracticeCard /></div>
        </div>

        <FullPaperInsightsSection selectedStudent={selectedStudent} getScoreColor={getScoreColor} handleAnalyze={handleAnalyze} />
        {practiceAttempts.length > 0 && <SubjectPracticeInsightsSection practiceAttempts={practiceAttempts} getScoreColor={getScoreColor} handleAnalyze={handleAnalyze} />}
      </div>
    );
  }

  // ── Student list ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '24px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 style={{ fontWeight: 800, color: NAVY, marginBottom: 2 }}>JEE Main Dashboard</h4>
          <div style={{ color: GRAY, fontSize: '0.85rem' }}>Monitor Full Paper & subject practice performance</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => navigate('/admin')}
            style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Admin
          </button>
          <button onClick={loadJEEData}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        {[
          { icon: 'bi-people-fill', color: BLUE,  value: stats.totalStudents,    label: 'Total Students',    bg: '#EFF6FF' },
          { icon: 'bi-bar-chart',   color: GREEN, value: `${stats.avgScore}%`,   label: 'Average Score',     bg: '#ECFDF5' },
          { icon: 'bi-journals',    color: NAVY,  value: stats.totalSubmissions, label: 'Total Submissions', bg: '#F8FAFC' },
        ].map(({ icon, color, value, label, bg }) => (
          <div className="col-md-4 mb-3" key={label}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`bi ${icon}`} style={{ fontSize: '1.4rem', color }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: NAVY, lineHeight: 1 }}>{value}</div>
                <div style={{ color: GRAY, fontSize: '0.8rem', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem' }}>Recent Exam Activity</span>
          <span style={{ background: BLUE, color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{jeeData.length} students</span>
        </div>
        <div className="card-body p-0">
          {jeeData.length === 0 ? (
            <p className="text-center text-muted py-5">No JEE Main data available yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: BG }}>
                  <tr style={{ fontSize: '0.8rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ paddingLeft: 24 }}>Student</th>
                    <th>Full Paper</th>
                    <th>Physics</th>
                    <th>Chemistry</th>
                    <th>Mathematics</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...jeeData]
                    .sort((a, b) => {
                      const aT = (a.quizScores || []).reduce((m, q) => Math.max(m, new Date(q.timestamp || 0)), 0);
                      const bT = (b.quizScores || []).reduce((m, q) => Math.max(m, new Date(q.timestamp || 0)), 0);
                      return bT - aT;
                    })
                    .map((student, idx) => {
                      const fullPaper = getLatestFullPaper(student);
                      const phy  = getLatestPractice(student, 'Physics');
                      const che  = getLatestPractice(student, 'Chemistry');
                      const math = getLatestPractice(student, 'Mathematics');
                      const lastActive = (student.quizScores || []).reduce((m, q) =>
                        !m || new Date(q.timestamp) > new Date(m) ? q.timestamp : m, null);

                      const ScoreCell = ({ q }) => {
                        if (!q) return <span className="text-muted">—</span>;
                        const pct = q.maxScore > 0 ? Math.round((q.score / q.maxScore) * 100) : 0;
                        return <span style={{ fontWeight: 700, color: getScoreColor(pct) }}>{q.score}/{q.maxScore}</span>;
                      };

                      return (
                        <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ fontWeight: 700, color: NAVY }}>{student.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.78rem', color: GRAY }}>{student.email}</div>
                          </td>
                          <td><ScoreCell q={fullPaper} /></td>
                          <td><ScoreCell q={phy} /></td>
                          <td><ScoreCell q={che} /></td>
                          <td><ScoreCell q={math} /></td>
                          <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                            {lastActive ? new Date(lastActive).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <button onClick={e => { e.stopPropagation(); setSelectedStudent(student); }}
                              style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                              View →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JEEMainDashboard;
