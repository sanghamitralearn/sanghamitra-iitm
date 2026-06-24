import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics']

const pct = (score, max) => max > 0 ? Math.round((score / max) * 100) : 0

function ScoreBadge({ value }) {
  const color = value >= 70 ? '#28a745' : value >= 40 ? '#fd7e14' : '#dc3545'
  return <span style={{ color, fontWeight: 600 }}>{value}%</span>
}

function TopicBar({ topic, subtopic, accuracy, correct, total, avgTime }) {
  const color = accuracy >= 70 ? '#28a745' : accuracy >= 40 ? '#fd7e14' : '#dc3545'
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <div>
          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{topic}</span>
          {subtopic && <span className="text-muted ms-2" style={{ fontSize: '0.8rem' }}>{subtopic}</span>}
        </div>
        <div className="d-flex gap-3 align-items-center">
          <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>{correct}/{total} correct</span>
          <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>~{avgTime}s avg</span>
          <span style={{ color, fontWeight: 600, fontSize: '0.9rem', minWidth: 40, textAlign: 'right' }}>{accuracy}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: '#e9ecef', borderRadius: 4 }}>
        <div style={{ width: `${accuracy}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

export default function JEEAdminPage() {
  const [tab, setTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  // Student detail
  const [selectedEmail, setSelectedEmail] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Physics')
  const [topicData, setTopicData] = useState([])
  const [topicLoading, setTopicLoading] = useState(false)
  const [topicDate, setTopicDate] = useState(null)

  // Question stats
  const [qSubject, setQSubject] = useState('Physics')
  const [qStats, setQStats] = useState([])
  const [qLoading, setQLoading] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/jee_admin`, { withCredentials: true })
      .then(r => setStudents(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadTopicAnalysis = async () => {
    if (!selectedEmail || !selectedSubject) return
    setTopicLoading(true)
    setTopicData([])
    try {
      const r = await axios.get(`${API}/api/jee_admin/topic_analysis`, {
        params: { email: selectedEmail, subject: selectedSubject },
        withCredentials: true
      })
      setTopicData(r.data.data || [])
      setTopicDate(r.data.dateAttempted)
    } catch {}
    setTopicLoading(false)
  }

  const loadQuestionStats = async (sub) => {
    setQLoading(true)
    setQStats([])
    try {
      const r = await axios.get(`${API}/api/jee_admin/question_stats`, {
        params: { subject: sub },
        withCredentials: true
      })
      setQStats(r.data.data || [])
    } catch {}
    setQLoading(false)
  }

  useEffect(() => {
    if (tab === 'questions') loadQuestionStats(qSubject)
  }, [tab, qSubject])

  const tabStyle = (t) => ({
    padding: '0.5rem 1.25rem',
    border: 'none',
    borderBottom: tab === t ? '2px solid #dc3545' : '2px solid transparent',
    background: 'none',
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#dc3545' : '#6c757d',
    cursor: 'pointer',
  })

  return (
    <div style={{ background: '#f5f7fb', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(220,53,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#dc3545' }}>
            <i className="bi bi-trophy" />
          </div>
          <div>
            <h4 className="mb-0">JEE Advanced — Admin Dashboard</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{students.length} students on record</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #dee2e6', marginBottom: '1.5rem' }}>
          <button style={tabStyle('overview')} onClick={() => setTab('overview')}>Overview</button>
          <button style={tabStyle('student')} onClick={() => setTab('student')}>Topic Analysis</button>
          <button style={tabStyle('questions')} onClick={() => setTab('questions')}>Hardest Questions</button>
        </div>

        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
              ) : students.length === 0 ? (
                <p className="text-center text-muted py-5">No JEE Advanced submissions yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th>Student</th>
                        {SUBJECTS.map(s => <th key={s} className="text-center">{s}</th>)}
                        <th className="text-center">Attempts</th>
                        <th>Last Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(st => {
                        const subMap = {}
                        st.subjects?.forEach(s => { subMap[s.subject] = s })
                        const totalAttempts = st.subjects?.reduce((a, s) => a + s.attemptCount, 0) || 0
                        const lastDate = st.subjects?.reduce((latest, s) => {
                          const d = new Date(s.dateAttempted)
                          return !latest || d > latest ? d : latest
                        }, null)
                        return (
                          <tr key={st.email} style={{ cursor: 'pointer' }}
                            onClick={() => { setSelectedEmail(st.email); setTab('student') }}>
                            <td>
                              <div className="fw-semibold">{st.name || st.email}</div>
                              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{st.email}</div>
                            </td>
                            {SUBJECTS.map(sub => {
                              const s = subMap[sub]
                              return (
                                <td key={sub} className="text-center">
                                  {s ? <ScoreBadge value={pct(s.score, s.maxScore)} /> : <span className="text-muted">—</span>}
                                  {s && <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{s.score}/{s.maxScore}</div>}
                                </td>
                              )
                            })}
                            <td className="text-center">{totalAttempts}</td>
                            <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                              {lastDate ? lastDate.toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Topic Analysis Tab ── */}
        {tab === 'student' && (
          <div>
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-semibold">Student</label>
                    <select className="form-select" value={selectedEmail}
                      onChange={e => { setSelectedEmail(e.target.value); setTopicData([]) }}>
                      <option value="">— select student —</option>
                      {students.map(st => (
                        <option key={st.email} value={st.email}>{st.name || st.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Subject</label>
                    <select className="form-select" value={selectedSubject}
                      onChange={e => { setSelectedSubject(e.target.value); setTopicData([]) }}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-danger w-100" onClick={loadTopicAnalysis}
                      disabled={!selectedEmail || topicLoading}>
                      {topicLoading ? <span className="spinner-border spinner-border-sm" /> : 'Analyse'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {topicData.length > 0 && (
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Topic-wise Weakness — {selectedSubject}</h6>
                  {topicDate && <small className="text-muted">Latest attempt: {new Date(topicDate).toLocaleDateString()}</small>}
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">Sorted weakest first. Accuracy below 40% needs attention.</p>
                  {topicData.map((t, i) => (
                    <TopicBar key={i} {...t} />
                  ))}
                </div>
              </div>
            )}

            {!topicLoading && selectedEmail && topicData.length === 0 && (
              <p className="text-muted text-center mt-4">No data — student may not have attempted {selectedSubject} yet.</p>
            )}
          </div>
        )}

        {/* ── Hardest Questions Tab ── */}
        {tab === 'questions' && (
          <div>
            <div className="d-flex gap-2 mb-4">
              {SUBJECTS.map(s => (
                <button key={s}
                  className={`btn btn-sm ${qSubject === s ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => setQSubject(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="mb-0">Per-Question Accuracy — {qSubject} <span className="text-muted fw-normal">(hardest first)</span></h6>
              </div>
              <div className="card-body p-0">
                {qLoading ? (
                  <div className="text-center py-5"><div className="spinner-border text-danger" /></div>
                ) : qStats.length === 0 ? (
                  <p className="text-center text-muted py-5">No data yet for {qSubject}.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th>#</th>
                          <th>Topic</th>
                          <th>Subtopic</th>
                          <th>Question</th>
                          <th className="text-center">Students</th>
                          <th className="text-center">Correct</th>
                          <th className="text-center">Accuracy</th>
                          <th className="text-center">Avg Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qStats.map((q, i) => (
                          <tr key={q.questionId}>
                            <td className="text-muted" style={{ fontSize: '0.8rem' }}>{i + 1}</td>
                            <td style={{ fontSize: '0.85rem' }}>{q.topic || '—'}</td>
                            <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>{q.subtopic || '—'}</td>
                            <td style={{ fontSize: '0.82rem', color: '#6c757d', maxWidth: 220 }}>
                              {q.questionPreview || '—'}
                            </td>
                            <td className="text-center">{q.total}</td>
                            <td className="text-center">{q.correct}</td>
                            <td className="text-center"><ScoreBadge value={q.accuracy} /></td>
                            <td className="text-center" style={{ fontSize: '0.85rem' }}>{q.avgTime}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
