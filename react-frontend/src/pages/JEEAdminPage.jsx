import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Mobile Apps Prototyping Kit palette — clean blue & white
const BLUE          = '#2563EB';   // primary — buttons, active, accent
const NAVY          = '#1E293B';   // headings, dark text
const BG            = '#F0F4FF';   // page background (very light blue tint)
const GREEN         = '#10B981';   // positive scores / improvement
const RED           = '#EF4444';   // negative scores / decline
const GRAY          = '#94A3B8';   // secondary text
const BORDER        = '#E2E8F0';   // card borders
const ACCENT        = BLUE;
const ORANGE        = '#F59E0B';   // mid-score warning only
const PAPER_COLOR   = { Paper1: '#6610f2', Paper2: '#fd7e14' };
const SUBJECT_COLOR = { Physics: '#2563EB', Chemistry: '#10B981', Mathematics: '#EF4444' };
const SUBJECTS      = ['Physics', 'Chemistry', 'Mathematics'];

// ── Sub-component: Paper 1 & Paper 2 session history + trend ─────────────────
const PaperInsightsSection = ({ selectedStudent, getScoreColor, handleAnalyze }) => {
  const [tooltip, setTooltip] = useState(null);

  const paperAttempts = (selectedStudent.quizScores || [])
    .filter(q => q.paper === 'Paper1' || q.paper === 'Paper2')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  if (!paperAttempts.length) return null;

  const buildSessions = (paperType) => {
    const bySubject = {};
    SUBJECTS.forEach(sub => {
      bySubject[sub] = paperAttempts.filter(q => q.paper === paperType && q.subject === sub);
    });
    const maxLen = Math.max(...Object.values(bySubject).map(a => a.length), 0);
    const sessions = [];
    for (let i = 0; i < maxLen; i++) {
      const subs = {};
      let total = 0, max = 0, date = null;
      SUBJECTS.forEach(sub => {
        const a = bySubject[sub][i];
        if (a) {
          subs[sub] = a;
          total += a.score || 0;
          max   += a.maxScore || 0;
          if (!date || new Date(a.timestamp) > new Date(date)) date = a.timestamp;
        }
      });
      if (Object.keys(subs).length) sessions.push({ n: i + 1, total, max, date, subs });
    }
    return sessions;
  };

  const p1Sessions = buildSessions('Paper1');
  const p2Sessions = buildSessions('Paper2');

  const W = 400, H = 180, PX = 44, PY = 18;
  const minV = 0, maxV = 180;
  const xSc = (i, len) => PX + (len <= 1 ? (W - 2 * PX) / 2 : (i / (len - 1)) * (W - 2 * PX));
  const ySc = v => PY + ((maxV - v) / maxV) * (H - 2 * PY);

  const allRows = [
    ...p1Sessions.map(s => ({ ...s, paper: 'Paper1' })),
    ...p2Sessions.map(s => ({ ...s, paper: 'Paper2' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: BLUE, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Paper 1 & Paper 2 — Insights</span>
      </div>
      <div className="row g-3">
        {/* Session History — subject scores visible as columns, scrolls when full */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Session History
              <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.76rem' }}>({allRows.length} session{allRows.length !== 1 ? 's' : ''})</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th>Paper</th><th>#</th>
                    <th style={{ color: SUBJECT_COLOR.Physics }}>Phy</th>
                    <th style={{ color: SUBJECT_COLOR.Chemistry }}>Che</th>
                    <th style={{ color: SUBJECT_COLOR.Mathematics }}>Mat</th>
                    <th>Total</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((s, i) => {
                    const pct = s.max > 0 ? Math.round((s.total / s.max) * 100) : 0;
                    const bg  = s.paper === 'Paper1' ? PAPER_COLOR.Paper1 : PAPER_COLOR.Paper2;
                    const fmt = (sub) => {
                      const a = s.subs[sub];
                      if (!a) return <span className="text-muted">—</span>;
                      return <span style={{ fontWeight: 600, color: SUBJECT_COLOR[sub] }}>{a.score > 0 ? '+' : ''}{a.score}</span>;
                    };
                    const hasData = Object.keys(s.subs).length > 0;
                    return (
                      <tr key={i}
                        style={{ cursor: hasData ? 'pointer' : 'default' }}
                        className="table-row-hover"
                        onClick={() => hasData && handleAnalyze({ isPaper: true, paper: s.paper, sessionNum: s.n, total: s.total, max: s.max, date: s.date, subjects: s.subs })}
                        title={hasData ? 'Click to view full paper analysis' : ''}>
                        <td><span className="badge" style={{ background: bg, fontSize: '0.65rem' }}>{s.paper === 'Paper1' ? 'P1' : 'P2'}</span></td>
                        <td className="text-muted">#{s.n}</td>
                        <td>{fmt('Physics')}</td>
                        <td>{fmt('Chemistry')}</td>
                        <td>{fmt('Mathematics')}</td>
                        <td><span style={{ fontWeight: 700, color: getScoreColor(pct) }}>{s.total}/{s.max || 180}</span></td>
                        <td className="text-muted">{s.date ? new Date(s.date).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Score Trend — fixed 0-180 Y-axis, hover tooltips */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Score Trend (out of 180)
              <div className="d-flex gap-3">
                <span style={{ fontSize: '0.7rem', color: PAPER_COLOR.Paper1, fontWeight: 600 }}>● Paper 1</span>
                <span style={{ fontSize: '0.7rem', color: PAPER_COLOR.Paper2, fontWeight: 600 }}>● Paper 2</span>
              </div>
            </div>
            <div className="card-body p-3">
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                {[0, 45, 90, 135, 180].map(v => (
                  <g key={v}>
                    <line x1={PX} y1={ySc(v)} x2={W - 8} y2={ySc(v)}
                      stroke={v === 0 ? '#ced4da' : '#efefef'} strokeWidth={1}
                      strokeDasharray={v === 0 ? '4 2' : ''} />
                    <text x={PX - 4} y={ySc(v) + 4} textAnchor="end" fontSize={9} fill="#adb5bd">{v}</text>
                  </g>
                ))}
                {/* Paper 1 line */}
                {p1Sessions.length > 1 && (
                  <path d={p1Sessions.map((s, i) => `${i === 0 ? 'M' : 'L'}${xSc(i, p1Sessions.length)},${ySc(s.total)}`).join(' ')}
                    stroke={PAPER_COLOR.Paper1} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                )}
                {p1Sessions.map((s, i) => {
                  const cx = xSc(i, p1Sessions.length), cy = ySc(s.total);
                  return (
                    <g key={i} style={{ cursor: 'pointer' }}
                       onMouseEnter={() => setTooltip({ text: `P1 S${s.n}: ${s.total}/180`, x: cx, y: cy })}
                       onMouseLeave={() => setTooltip(null)}>
                      <circle cx={cx} cy={cy} r={7} fill={PAPER_COLOR.Paper1} stroke="#fff" strokeWidth={2} />
                      <text x={cx} y={cy - 11} textAnchor="middle" fontSize={9} fill={PAPER_COLOR.Paper1} fontWeight="bold">{s.total}</text>
                      <text x={cx} y={H - 2} textAnchor="middle" fontSize={8} fill="#adb5bd">S{s.n}</text>
                    </g>
                  );
                })}
                {/* Paper 2 line */}
                {p2Sessions.length > 1 && (
                  <path d={p2Sessions.map((s, i) => `${i === 0 ? 'M' : 'L'}${xSc(i, p2Sessions.length)},${ySc(s.total)}`).join(' ')}
                    stroke={PAPER_COLOR.Paper2} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                )}
                {p2Sessions.map((s, i) => {
                  const cx = xSc(i, p2Sessions.length), cy = ySc(s.total);
                  return (
                    <g key={i} style={{ cursor: 'pointer' }}
                       onMouseEnter={() => setTooltip({ text: `P2 S${s.n}: ${s.total}/180`, x: cx, y: cy })}
                       onMouseLeave={() => setTooltip(null)}>
                      <circle cx={cx} cy={cy} r={7} fill={PAPER_COLOR.Paper2} stroke="#fff" strokeWidth={2} />
                      <text x={cx} y={cy - 11} textAnchor="middle" fontSize={9} fill={PAPER_COLOR.Paper2} fontWeight="bold">{s.total}</text>
                      <text x={cx} y={H - 2} textAnchor="middle" fontSize={8} fill="#adb5bd">S{s.n}</text>
                    </g>
                  );
                })}
                {/* Hover tooltip */}
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

// ── Sub-component: Single Subject practice insights ───────────────────────────
const SingleInsightsSection = ({ singleAttempts, getScoreColor, handleAnalyze }) => {
  const [tooltip, setTooltip] = useState(null);

  const bySub = {};
  SUBJECTS.forEach(sub => {
    bySub[sub] = singleAttempts.filter(q => q.subject === sub)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  const allScores = singleAttempts.map(q => q.score);
  const minV = Math.min(...allScores, -15);
  const maxV = 60; // JEE subject max is always 60
  const W = 400, H = 160, PX = 36, PY = 16;
  const xSc = (i, len) => PX + (len <= 1 ? (W - 2 * PX) / 2 : (i / (len - 1)) * (W - 2 * PX));
  const ySc = v => PY + ((maxV - v) / (maxV - minV)) * (H - 2 * PY);

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: NAVY, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Single Subject Practice — Insights</span>
      </div>
      <div className="row g-3">
        {/* Practice history */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Practice History
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="table table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                  <tr><th>Subject</th><th>#</th><th>Score /60</th><th>✓</th><th>✗</th><th>Acc</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {[...singleAttempts].reverse().map((q, i) => {
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

        {/* Subject trend chart with hover tooltips */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Subject Score Trend (out of 60)
              <div className="d-flex gap-2">
                {SUBJECTS.map(sub => bySub[sub].length > 0 && (
                  <span key={sub} style={{ fontSize: '0.7rem', color: SUBJECT_COLOR[sub], fontWeight: 600 }}>● {sub.slice(0, 3)}</span>
                ))}
              </div>
            </div>
            <div className="card-body p-3">
              {singleAttempts.length < 1 ? (
                <div className="text-center text-muted py-4" style={{ fontSize: '0.82rem' }}>No single subject attempts</div>
              ) : (
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                  {[minV < 0 ? minV : null, 0, 20, 40, 60].filter(v => v !== null && v >= minV).map(v => (
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
                  {/* Hover tooltip */}
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


const JEEAdminPage = () => {
  const navigate = useNavigate();
  const [jeeData, setJeeData]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadJEEData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/jee_admin_scores`, { withCredentials: true });
      if (res.data.success && res.data.data) {
        const raw = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        setJeeData(raw);
      } else setJeeData([]);
    } catch (err) { setError(`Fetch failed: ${err?.response?.status || ''} ${err?.message}`); setJeeData([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadJEEData(); }, []);

  // ── helpers ─────────────────────────────────────────────────────────────────
  const getScoreColor = (pct) => pct >= 50 ? GREEN : pct >= 25 ? ORANGE : RED;
  const getBtnStyle   = (primary = true) => ({
    background: primary ? BLUE : '#fff',
    color: primary ? '#fff' : NAVY,
    border: primary ? 'none' : `1px solid ${BORDER}`,
    borderRadius: 8, padding: '7px 18px',
    fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
  });

  // Latest score per subject for a given paper type
  const getLatestByPaper = (student, paperType) => {
    const scores = (student.quizScores || []).filter(q => (q.paper || 'Single') === paperType);
    const result = {};
    SUBJECTS.forEach(sub => {
      const sorted = scores.filter(q => q.subject === sub)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (sorted.length) result[sub] = sorted[0];
    });
    return result;
  };

  const getPaperTotal = (subMap) => {
    const subs = Object.values(subMap);
    if (!subs.length) return { totalScore: null, totalMax: 0, date: null };
    return {
      totalScore: subs.reduce((s, q) => s + (q.score || 0), 0),
      totalMax:   subs.reduce((s, q) => s + (q.maxScore || 0), 0),
      date: subs.reduce((d, q) => !d || new Date(q.timestamp) > new Date(d) ? q.timestamp : d, null),
    };
  };

  const handleAnalyze = (quiz) => {
    if (quiz.isPaper) {
      // Full paper session — pass all 3 subjects
      navigate('/courses/jee/analysis', { state: { results: quiz } });
    } else {
      // Single subject attempt
      navigate('/courses/jee/analysis', {
        state: {
          results: {
            subject: quiz.subject, topic: quiz.topic, paper: quiz.paper,
            attemptNumber: quiz.attemptNumber, totalQuestions: quiz.totalQuestions,
            correctAnswers: quiz.correctAnswers, wrongAnswers: quiz.wrongAnswers,
            unattempted: quiz.unattempted, score: quiz.score, maxScore: quiz.maxScore,
            percentage: quiz.percentage, accuracy: quiz.accuracy,
            responses: quiz.responses || [], timestamp: quiz.timestamp,
          },
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
    const p1Map = getLatestByPaper(selectedStudent, 'Paper1');
    const p2Map = getLatestByPaper(selectedStudent, 'Paper2');
    const p1    = getPaperTotal(p1Map);
    const p2    = getPaperTotal(p2Map);
    const grandScore = (p1.totalScore ?? 0) + (p2.totalScore ?? 0);
    const grandMax   = (p1.totalMax || 0)   + (p2.totalMax || 0);
    const grandPct   = grandMax > 0 ? Math.round((grandScore / grandMax) * 100) : 0;

    const singleAttempts = (selectedStudent.quizScores || [])
      .filter(q => (q.paper || 'Single') === 'Single')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const PaperCard = ({ paperType, subMap, total }) => {
      const pct      = total.totalMax > 0 ? Math.round((total.totalScore / total.totalMax) * 100) : 0;
      const label    = paperType === 'Paper1' ? 'Paper 1' : 'Paper 2';
      const hasData  = total.totalScore !== null;
      const accentCl = PAPER_COLOR[paperType];
      return (
        <div className="card border-0 h-100" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderTop: `4px solid ${accentCl}` }}>
          {/* Header row */}
          <div className="d-flex justify-content-between align-items-center px-4 pt-3 pb-2">
            <span style={{ fontWeight: 800, fontSize: '1rem', color: NAVY, letterSpacing: 0.3 }}>{label}</span>
            {hasData && (
              <div className="text-end">
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: getScoreColor(pct), lineHeight: 1 }}>
                  {total.totalScore > 0 ? '+' : ''}{total.totalScore}
                </span>
                <span style={{ color: GRAY, fontSize: '0.88rem' }}> / {total.totalMax}</span>
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
                  const s = subMap[sub];
                  if (!s) return (
                    <div key={sub} className="d-flex justify-content-between align-items-center px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                      <span style={{ color: GRAY, fontSize: '0.8rem' }}>Not attempted</span>
                    </div>
                  );

                  const allSubAttempts = (selectedStudent.quizScores || [])
                    .filter(q => q.subject === sub && (q.paper || 'Single') === paperType)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                  const latest    = allSubAttempts[allSubAttempts.length - 1];
                  const prev      = allSubAttempts[allSubAttempts.length - 2];
                  const bestScore = Math.max(...allSubAttempts.map(a => a.score));
                  const sp        = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0;

                  const trend = prev
                    ? latest.score > prev.score ? { icon: '↑', color: GREEN }
                    : latest.score < prev.score ? { icon: '↓', color: RED }
                    : { icon: '→', color: GRAY }
                    : null;

                  return (
                    <div key={sub} className="px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span style={{ color: SUBJECT_COLOR[sub], fontWeight: 700, fontSize: '0.88rem' }}>{sub}</span>
                          <span style={{ fontSize: '0.68rem', color: GRAY, background: '#f4f6fb', borderRadius: 10, padding: '1px 7px' }}>
                            {allSubAttempts.length} att
                          </span>
                          {trend && (
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: trend.color }}>
                              {trend.icon} {prev && latest.score !== prev.score ? (latest.score > prev.score ? `+${latest.score - prev.score}` : latest.score - prev.score) : ''}
                            </span>
                          )}
                          {bestScore !== latest.score && (
                            <span style={{ fontSize: '0.67rem', color: BLUE, fontWeight: 600 }}>★ Best {bestScore > 0 ? '+' : ''}{bestScore}</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: getScoreColor(sp), minWidth: 56, textAlign: 'right' }}>
                            {s.score > 0 ? '+' : ''}{s.score}<span style={{ color: GRAY, fontWeight: 400, fontSize: '0.8rem' }}>/{s.maxScore}</span>
                          </span>
                          <button style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.7rem', padding: '3px 10px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => handleAnalyze(s)}>
                            Analyze
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>
                        <span style={{ color: GREEN, fontWeight: 600 }}>{s.correctAnswers}✓</span>{' '}
                        <span style={{ color: RED, fontWeight: 600 }}>{s.wrongAnswers}✗</span>{' '}
                        <span>{s.unattempted}—</span>{' · acc '}{s.accuracy ?? 0}%
                      </div>
                    </div>
                  );
                })}
                <div className="px-4 py-2" style={{ color: GRAY, fontSize: '0.7rem' }}>
                  {total.date ? new Date(total.date).toLocaleDateString() : ''}
                </div>
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={{ background: BG, minHeight: '100vh', padding: '24px' }}>
        {/* Top nav */}
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

        {/* Student info card */}
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
              <div style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Grand Total: </span>
                <strong style={{ color: getScoreColor(grandPct), fontSize: '1.1rem' }}>{grandScore > 0 ? '+' : ''}{grandScore}</strong>
                {grandMax > 0 && <span style={{ color: '#555', fontSize: '0.92rem' }}> / {grandMax} ({grandPct}%)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Combined score — gradient circular card */}
        {grandMax > 0 && (
          <div className="mb-4" style={{
            background: grandScore < 0
              ? 'linear-gradient(135deg, #c0392b, #e67e22)'
              : grandPct >= 50
                ? `linear-gradient(135deg, ${NAVY}, ${BLUE})`
                : `linear-gradient(135deg, #e67e22, #f39c12)`,
            borderRadius: 16, padding: '28px 36px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h3 className="fw-bold mb-2" style={{ fontSize: '1.6rem' }}>Combined Score</h3>
              <div style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>Paper 1 + Paper 2 · JEE Advanced</div>
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
                <span style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1 }}>{grandScore}</span>
                <div style={{ width: '55%', height: 1, background: 'rgba(255,255,255,0.6)', margin: '6px 0' }} />
                <span style={{ fontSize: '1.2rem', opacity: 0.9 }}>{grandMax}</span>
              </div>
              <div style={{ opacity: 0.9, fontSize: '1rem', marginTop: 8, fontWeight: 700 }}>{grandPct}%</div>
            </div>
          </div>
        )}

        {/* Paper 1 + Paper 2 cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6"><PaperCard paperType="Paper1" subMap={p1Map} total={p1} /></div>
          <div className="col-md-6"><PaperCard paperType="Paper2" subMap={p2Map} total={p2} /></div>
        </div>

        <PaperInsightsSection selectedStudent={selectedStudent} getScoreColor={getScoreColor} handleAnalyze={handleAnalyze} />
        {singleAttempts.length > 0 && <SingleInsightsSection singleAttempts={singleAttempts} getScoreColor={getScoreColor} handleAnalyze={handleAnalyze} />}
      </div>
    );
  }

  // ── Student list ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '24px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 style={{ fontWeight: 800, color: NAVY, marginBottom: 2 }}>JEE Advanced Dashboard</h4>
          <div style={{ color: GRAY, fontSize: '0.85rem' }}>Monitor Paper 1 & Paper 2 performance</div>
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

      {/* Stats */}
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

      {/* Student list */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem' }}>Recent Exam Activity</span>
          <span style={{ background: BLUE, color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{jeeData.length} students</span>
        </div>
        <div className="card-body p-0">
          {jeeData.length === 0 ? (
            <p className="text-center text-muted py-5">No JEE Advanced data available yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: BG }}>
                  <tr style={{ fontSize: '0.8rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ paddingLeft: 24 }}>Student</th>
                    <th>Paper 1 <small>/180</small></th>
                    <th>Paper 2 <small>/180</small></th>
                    <th>Total <small>/360</small></th>
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
                      const p1Map = getLatestByPaper(student, 'Paper1');
                      const p2Map = getLatestByPaper(student, 'Paper2');
                      const p1    = getPaperTotal(p1Map);
                      const p2    = getPaperTotal(p2Map);
                      const gScore = (p1.totalScore ?? 0) + (p2.totalScore ?? 0);
                      const gMax   = (p1.totalMax || 0) + (p2.totalMax || 0);
                      const gPct   = gMax > 0 ? Math.round((gScore / gMax) * 100) : 0;
                      const lastActive = (student.quizScores || []).reduce((m, q) =>
                        !m || new Date(q.timestamp) > new Date(m) ? q.timestamp : m, null);

                      const ScoreCell = ({ total }) => {
                        if (total.totalScore === null) return <span className="text-muted">—</span>;
                        const pct = total.totalMax > 0 ? Math.round((total.totalScore / total.totalMax) * 100) : 0;
                        return <span style={{ fontWeight: 700, color: getScoreColor(pct) }}>{total.totalScore}/{total.totalMax}</span>;
                      };

                      return (
                        <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ fontWeight: 700, color: NAVY }}>{student.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.78rem', color: GRAY }}>{student.email}</div>
                          </td>
                          <td><ScoreCell total={p1} /></td>
                          <td><ScoreCell total={p2} /></td>
                          <td>
                            {gMax > 0
                              ? <span style={{ fontWeight: 700, color: getScoreColor(gPct) }}>{gScore}/{gMax} <small>({gPct}%)</small></span>
                              : <span className="text-muted">—</span>}
                          </td>
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


export default JEEAdminPage;
