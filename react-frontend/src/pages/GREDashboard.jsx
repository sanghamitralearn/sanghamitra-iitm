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
const ORANGE = '#F59E0B';
const AWA_COLOR = '#d63384';

const SECTIONS = ['Verbal Reasoning', 'Quantitative Reasoning'];
const SECTION_COLOR = {
  'Verbal Reasoning':       '#6f42c1',
  'Quantitative Reasoning': '#0d6efd',
  'Analytical Writing':     AWA_COLOR,
};
const SECTION_SHORT = {
  'Verbal Reasoning':       'Verbal',
  'Quantitative Reasoning': 'Quant',
  'Analytical Writing':     'Writing',
};

// ── Sub-component: Section Practice session history + scaled-score trend ─────
const SectionInsightsSection = ({ verbalAttempts, quantAttempts, getScaledScoreColor, onAnalyze }) => {
  const [tooltip, setTooltip] = useState(null);

  const bySub = {
    'Verbal Reasoning':       verbalAttempts,
    'Quantitative Reasoning': quantAttempts,
  };
  const allAttempts = [...verbalAttempts, ...quantAttempts];
  if (allAttempts.length === 0) return null;

  const W = 400, H = 160, PX = 36, PY = 16;
  const minV = 130, maxV = 170;
  const xSc = (i, len) => PX + (len <= 1 ? (W - 2 * PX) / 2 : (i / (len - 1)) * (W - 2 * PX));
  const ySc = v => PY + ((maxV - v) / (maxV - minV)) * (H - 2 * PY);
  const steps = [130, 140, 150, 160, 170];

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: NAVY, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Section Practice — Insights</span>
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Practice History
              <span className="text-muted fw-normal ms-1" style={{ fontSize: '0.76rem' }}>({allAttempts.length} attempt{allAttempts.length !== 1 ? 's' : ''})</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table table-hover mb-0" style={{ fontSize: '0.8rem' }}>
                <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr><th>Section</th><th>#</th><th>Scaled</th><th>Correct</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {[...allAttempts]
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((q, i) => (
                      <tr key={i}>
                        <td><span style={{ color: SECTION_COLOR[q.topic], fontWeight: 700 }}>{SECTION_SHORT[q.topic]}</span></td>
                        <td className="text-muted">#{q.attemptNumber}</td>
                        <td><span style={{ fontWeight: 700, color: getScaledScoreColor(q.scaledScore) }}>{q.scaledScore ?? '—'}</span></td>
                        <td className="text-muted">{q.correctAnswers ?? '—'}/{q.totalQuestions ?? '—'}</td>
                        <td className="text-muted">{q.timestamp ? new Date(q.timestamp).toLocaleDateString() : '—'}</td>
                        <td>
                          <button className="btn btn-primary btn-sm py-0 px-1" style={{ fontSize: '0.7rem' }} onClick={() => onAnalyze(q)}>
                            <i className="bi bi-bar-chart-line" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Scaled Score Trend (130–170)
              <div className="d-flex gap-2">
                {SECTIONS.map(sub => bySub[sub].length > 0 && (
                  <span key={sub} style={{ fontSize: '0.7rem', color: SECTION_COLOR[sub], fontWeight: 600 }}>● {SECTION_SHORT[sub]}</span>
                ))}
              </div>
            </div>
            <div className="card-body p-3">
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                {steps.map(v => (
                  <g key={v}>
                    <line x1={PX} y1={ySc(v)} x2={W - 8} y2={ySc(v)} stroke="#efefef" strokeWidth={1} />
                    <text x={PX - 4} y={ySc(v) + 4} textAnchor="end" fontSize={9} fill="#adb5bd">{v}</text>
                  </g>
                ))}
                {SECTIONS.map(sub => {
                  const pts = bySub[sub];
                  if (!pts.length) return null;
                  return (
                    <g key={sub}>
                      {pts.length > 1 && (
                        <path d={pts.map((q, i) => `${i === 0 ? 'M' : 'L'}${xSc(i, pts.length)},${ySc(q.scaledScore)}`).join(' ')}
                          stroke={SECTION_COLOR[sub]} strokeWidth={2} fill="none" strokeLinejoin="round" />
                      )}
                      {pts.map((q, i) => {
                        const cx = xSc(i, pts.length), cy = ySc(q.scaledScore);
                        return (
                          <g key={i} style={{ cursor: 'pointer' }}
                             onMouseEnter={() => setTooltip({ text: `${SECTION_SHORT[sub]} #${i + 1}: ${q.scaledScore}`, x: cx, y: cy })}
                             onMouseLeave={() => setTooltip(null)}>
                            <circle cx={cx} cy={cy} r={5} fill={SECTION_COLOR[sub]} stroke="#fff" strokeWidth={1.5} />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-component: Analytical Writing attempt list (no numeric score) ────────
const WritingAttemptsSection = ({ attempts }) => {
  if (!attempts.length) return null;
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-2">
        <span style={{ width: 4, height: 18, background: AWA_COLOR, borderRadius: 2, display: 'inline-block' }} />
        <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#333' }}>Analytical Writing — Attempts</span>
      </div>
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: '0.85rem' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr><th>#</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {[...attempts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((q, i) => (
                <tr key={i}>
                  <td className="text-muted">#{q.attemptNumber}</td>
                  <td>
                    <span className="badge" style={{ background: AWA_COLOR, color: '#fff' }}>
                      {q.essayStatus === 'pending_review' || !q.essayStatus ? 'Pending Review' : q.essayStatus}
                    </span>
                  </td>
                  <td className="text-muted">{q.timestamp ? new Date(q.timestamp).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GREDashboard = () => {
  const navigate = useNavigate();
  const [greData, setGreData]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadGREData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/gre_admin_scores`, { withCredentials: true });
      if (res.data.success && res.data.data) {
        setGreData(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
      } else {
        setGreData([]);
      }
    } catch (err) {
      setError('Unable to fetch GRE data');
      setGreData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGREData(); }, []);

  const getScoreColor = (pct) => pct >= 50 ? GREEN : pct >= 25 ? ORANGE : RED;

  // Colour a scaled score (130-170) the same way as a percentage, by mapping it onto 0-100 first
  const getScaledScoreColor = (scaledScore) => {
    if (scaledScore == null) return GRAY;
    const pct = ((scaledScore - 130) / 40) * 100;
    return getScoreColor(pct);
  };

  const getSectionAttempts = (student, section) =>
    (student.quizScores || []).filter(q => q.topic === section);

  const getLatestBySection = (student, section) => {
    const entries = getSectionAttempts(student, section)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return entries[0] || null;
  };

  const handleAnalyze = (student, quiz) => {
    navigate(
      `/admin/gre/exam/${encodeURIComponent(student.email)}/${encodeURIComponent(quiz.topic)}/${quiz.attemptNumber}`,
      { state: { studentName: student.name || student.email } }
    );
  };

  const handleGenerateAnalysis = (student) => {
    navigate(`/admin/analysis/gre/${student._id || student.email}`, { state: { student } });
  };

  const calculateStats = () => {
    if (!greData.length) return { totalStudents: 0, avgScaledScore: 0, totalSubmissions: 0 };
    let totalScaled = 0, scaledCount = 0, totalSubmissions = 0;
    greData.forEach(student => {
      (student.quizScores || []).forEach(quiz => {
        totalSubmissions++;
        if (quiz.scaledScore != null) { totalScaled += quiz.scaledScore; scaledCount++; }
      });
    });
    return {
      totalStudents: greData.length,
      avgScaledScore: scaledCount > 0 ? Math.round((totalScaled / scaledCount) * 10) / 10 : 0,
      totalSubmissions,
    };
  };
  const stats = calculateStats();

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" style={{ color: BLUE }} role="status"><span className="visually-hidden">Loading…</span></div>
    </div>
  );

  // ── Student detail ───────────────────────────────────────────────────────────
  if (selectedStudent) {
    const totalSubmissions = (selectedStudent.quizScores || []).length;

    const verbalAttemptsAsc  = getSectionAttempts(selectedStudent, 'Verbal Reasoning')
      .filter(q => q.scaledScore != null)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const quantAttemptsAsc   = getSectionAttempts(selectedStudent, 'Quantitative Reasoning')
      .filter(q => q.scaledScore != null)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const writingAttempts    = getSectionAttempts(selectedStudent, 'Analytical Writing');

    const latestVerbal  = getLatestBySection(selectedStudent, 'Verbal Reasoning');
    const latestQuant   = getLatestBySection(selectedStudent, 'Quantitative Reasoning');
    const latestWriting = getLatestBySection(selectedStudent, 'Analytical Writing');

    const combinedScaled = (latestVerbal?.scaledScore != null && latestQuant?.scaledScore != null)
      ? latestVerbal.scaledScore + latestQuant.scaledScore
      : null;

    const SectionRow = ({ section, latest }) => {
      const attempts = getSectionAttempts(selectedStudent, section);
      const isEssay  = section === 'Analytical Writing';
      if (!latest) return (
        <div className="d-flex justify-content-between align-items-center px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <span style={{ color: SECTION_COLOR[section], fontWeight: 700, fontSize: '0.88rem' }}>{section}</span>
          <span style={{ color: GRAY, fontSize: '0.8rem' }}>Not attempted</span>
        </div>
      );
      return (
        <div className="px-4 py-2" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ color: SECTION_COLOR[section], fontWeight: 700, fontSize: '0.88rem' }}>{section}</span>
              <span style={{ fontSize: '0.68rem', color: GRAY, background: '#f4f6fb', borderRadius: 10, padding: '1px 7px' }}>
                {attempts.length} att
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              {isEssay ? (
                <span className="badge" style={{ background: AWA_COLOR, color: '#fff', fontSize: '0.72rem' }}>
                  {latest.essayStatus === 'pending_review' || !latest.essayStatus ? 'Pending Review' : latest.essayStatus}
                </span>
              ) : (
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: getScaledScoreColor(latest.scaledScore) }}>
                  {latest.scaledScore != null ? latest.scaledScore : latest.score}
                  <span style={{ color: GRAY, fontWeight: 400, fontSize: '0.8rem' }}>{latest.scaledScore != null ? '/170' : `/${latest.maxScore}`}</span>
                </span>
              )}
              <button style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.7rem', padding: '3px 10px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => handleAnalyze(selectedStudent, latest)}>
                Analyze
              </button>
            </div>
          </div>
          {!isEssay && (
            <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>
              {latest.correctAnswers ?? 0}/{latest.totalQuestions ?? 0} correct · {latest.timestamp ? new Date(latest.timestamp).toLocaleDateString() : ''}
            </div>
          )}
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
            style={{ background: '#fff', color: NAVY, border: '1px solid #e0e0e0', borderRadius: 8, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
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
              <div style={{ fontSize: '0.95rem', color: NAVY }}><span style={{ color: '#555' }}>Total Submissions: </span><strong>{totalSubmissions}</strong></div>
            </div>
          </div>
        </div>

        {combinedScaled != null && (
          <div className="mb-4" style={{
            background: (combinedScaled / 340 * 100) >= 50
              ? `linear-gradient(135deg, ${NAVY}, #7C3AED)`
              : `linear-gradient(135deg, #e67e22, #f39c12)`,
            borderRadius: 16, padding: '28px 36px', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h3 className="fw-bold mb-2" style={{ fontSize: '1.6rem' }}>Combined Score</h3>
              <div style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>Verbal Reasoning + Quantitative Reasoning</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1 }}>{combinedScaled}</div>
              <div style={{ opacity: 0.85, fontSize: '0.95rem' }}>/ 340</div>
            </div>
          </div>
        )}

        <div className="card border-0 mb-4" style={{ borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderTop: `4px solid ${BLUE}` }}>
          <div className="px-4 pt-3 pb-2">
            <span style={{ fontWeight: 800, fontSize: '1rem', color: NAVY, letterSpacing: 0.3 }}>Section Practice</span>
          </div>
          <hr className="mx-3 mt-0 mb-0" style={{ borderColor: '#f0f0f0' }} />
          <div className="card-body p-0">
            <SectionRow section="Verbal Reasoning" latest={latestVerbal} />
            <SectionRow section="Quantitative Reasoning" latest={latestQuant} />
            <SectionRow section="Analytical Writing" latest={latestWriting} />
          </div>
        </div>

        <SectionInsightsSection
          verbalAttempts={verbalAttemptsAsc}
          quantAttempts={quantAttemptsAsc}
          getScaledScoreColor={getScaledScoreColor}
          onAnalyze={(q) => handleAnalyze(selectedStudent, q)}
        />

        <WritingAttemptsSection attempts={writingAttempts} />

        <div className="mt-2 mb-4 d-flex gap-2">
          <button
            style={{ background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => handleGenerateAnalysis(selectedStudent)}>
            <i className="bi bi-magic me-1" />Generate AI Analysis
          </button>
        </div>
      </div>
    );
  }

  // ── Student list ─────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '24px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 style={{ fontWeight: 800, color: NAVY, marginBottom: 2 }}>GRE Dashboard</h4>
          <div style={{ color: GRAY, fontSize: '0.85rem' }}>Monitor GRE exam performance across Verbal Reasoning, Quantitative Reasoning and Analytical Writing sections</div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => navigate('/admin')}
            style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ← Admin
          </button>
          <button onClick={loadGREData}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        {[
          { icon: 'bi-people-fill', color: BLUE,  value: stats.totalStudents, label: 'Total Students', bg: '#EFF6FF' },
          { icon: 'bi-bar-chart',   color: GREEN, value: stats.avgScaledScore > 0 ? `${stats.avgScaledScore}/170` : '—', label: 'Average Scaled Score (Verbal/Quant)', bg: '#ECFDF5' },
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
          <span style={{ background: BLUE, color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: '0.75rem', fontWeight: 700 }}>{greData.length} students</span>
        </div>
        <div className="card-body p-0">
          {greData.length === 0 ? (
            <p className="text-center text-muted py-5">No GRE data available yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: BG }}>
                  <tr style={{ fontSize: '0.8rem', color: GRAY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ paddingLeft: 24 }}>Student</th>
                    <th>Verbal</th>
                    <th>Quant</th>
                    <th>Writing</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...greData]
                    .sort((a, b) => {
                      const aT = (a.quizScores || []).reduce((m, q) => Math.max(m, new Date(q.timestamp || 0)), 0);
                      const bT = (b.quizScores || []).reduce((m, q) => Math.max(m, new Date(q.timestamp || 0)), 0);
                      return bT - aT;
                    })
                    .map((student, idx) => {
                      const verbal  = getLatestBySection(student, 'Verbal Reasoning');
                      const quant   = getLatestBySection(student, 'Quantitative Reasoning');
                      const writing = getLatestBySection(student, 'Analytical Writing');
                      const lastActive = (student.quizScores || []).reduce((m, q) =>
                        !m || new Date(q.timestamp) > new Date(m) ? q.timestamp : m, null);

                      const ScaledCell = ({ q }) => {
                        if (!q) return <span className="text-muted">—</span>;
                        return <span style={{ fontWeight: 700, color: getScaledScoreColor(q.scaledScore) }}>{q.scaledScore != null ? `${q.scaledScore}/170` : `${q.score}/${q.maxScore}`}</span>;
                      };

                      return (
                        <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ fontWeight: 700, color: NAVY }}>{student.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.78rem', color: GRAY }}>{student.email}</div>
                          </td>
                          <td><ScaledCell q={verbal} /></td>
                          <td><ScaledCell q={quant} /></td>
                          <td>
                            {writing ? (
                              <span className="badge" style={{ background: AWA_COLOR, color: '#fff', fontSize: '0.7rem' }}>
                                {writing.essayStatus === 'pending_review' || !writing.essayStatus ? 'Pending Review' : writing.essayStatus}
                              </span>
                            ) : <span className="text-muted">—</span>}
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

export default GREDashboard;
