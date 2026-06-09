import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SATDashboard = () => {
  const navigate = useNavigate();
  const [satData, setSatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadSATData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/sat_scores`, { withCredentials: true });
      const byEmail = {};
      (res.data || []).forEach(entry => {
        if (!byEmail[entry.email]) {
          byEmail[entry.email] = { email: entry.email, name: entry.name, subjects: [] };
        }
        byEmail[entry.email].subjects.push({
          subject:        entry.subject,
          attemptCount:   entry.attemptCount,
          score:          entry.score,
          maxScore:       entry.maxScore,
          correctAnswers: entry.correctAnswers,
          totalQuestions: entry.totalQuestions,
          dateAttempted:  entry.dateAttempted,
        });
      });
      setSatData(Object.values(byEmail));
    } catch (err) {
      setError('Unable to fetch SAT data');
      setSatData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSATData();
  }, []);

  const calculateStats = () => {
    if (!satData.length) return { totalStudents: 0, avgScore: 0, totalSubmissions: 0 };
    let totalScore = 0, totalMaxScore = 0, totalSubmissions = 0;
    satData.forEach(student => {
      student.subjects.forEach(s => {
        totalScore += s.score || 0;
        totalMaxScore += s.maxScore || 1;
        totalSubmissions++;
      });
    });
    return {
      totalStudents: satData.length,
      avgScore: totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 10000) / 100 : 0,
      totalSubmissions,
    };
  };

  const stats = calculateStats();

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#28a745';
    if (pct >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getLatestDate = (student) => {
    const dates = student.subjects.map(s => new Date(s.dateAttempted || 0));
    return dates.reduce((max, d) => (d > max ? d : max), new Date(0));
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-0">SAT Dashboard</h2>
              <p className="text-muted mb-0">Monitor SAT exam performance across Reading &amp; Writing and Mathematics sections.</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                ← Back to Admin Dashboard
              </button>
              <button className="btn btn-success" onClick={loadSATData}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {!selectedStudent ? (
            <>
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-people-fill text-primary" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2">{stats.totalStudents}</h4>
                      <p className="text-muted">Total Students</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-bar-chart text-info" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2" style={{ color: getScoreColor(stats.avgScore) }}>{stats.avgScore}%</h4>
                      <p className="text-muted">Average Score</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-file-text-fill text-warning" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2">{stats.totalSubmissions}</h4>
                      <p className="text-muted">Total Submissions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">SAT Exam Activity</h5>
                </div>
                <div className="card-body">
                  {satData.length === 0 ? (
                    <div className="text-center text-muted py-4">No SAT data available yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Sections Attempted</th>
                            <th>Best Score %</th>
                            <th>Last Attempt</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...satData]
                            .sort((a, b) => getLatestDate(b) - getLatestDate(a))
                            .map((student, idx) => {
                              const bestPct = student.subjects.reduce((max, s) => {
                                const pct = s.maxScore ? (s.score / s.maxScore) * 100 : 0;
                                return pct > max ? pct : max;
                              }, 0);
                              const latestDate = getLatestDate(student);
                              return (
                                <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(student)}>
                                  <td><strong>{student.name || 'Unknown'}</strong></td>
                                  <td>{student.email}</td>
                                  <td>
                                    {student.subjects.map((s, i) => (
                                      <span key={i} className="badge bg-info text-dark me-1">{s.subject}</span>
                                    ))}
                                  </td>
                                  <td>
                                    <span style={{ color: getScoreColor(bestPct), fontWeight: 'bold' }}>
                                      {Math.round(bestPct)}%
                                    </span>
                                  </td>
                                  <td>{latestDate.getTime() > 0 ? latestDate.toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                                    >
                                      View Details
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
            </>
          ) : (
            <div className="card">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Student Details: {selectedStudent.name || selectedStudent.email}</h5>
                <button className="btn btn-light btn-sm" onClick={() => setSelectedStudent(null)}>
                  ← Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Student Information</h6>
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    <p><strong>Name:</strong> {selectedStudent.name || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Performance Summary</h6>
                    <p><strong>Sections Attempted:</strong> {selectedStudent.subjects.length}</p>
                    <p><strong>Total Attempts:</strong> {selectedStudent.subjects.reduce((sum, s) => sum + (s.attemptCount || 0), 0)}</p>
                  </div>
                </div>

                <h6>Section-wise Performance</h6>
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Attempts</th>
                        <th>Score</th>
                        <th>Correct / Total</th>
                        <th>Percentage</th>
                        <th>Last Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.subjects.map((s, i) => {
                        const pct = s.maxScore ? Math.round((s.score / s.maxScore) * 100) : 0;
                        return (
                          <tr key={i}>
                            <td><strong>{s.subject}</strong></td>
                            <td>{s.attemptCount}</td>
                            <td>{s.score ?? '-'} / {s.maxScore ?? '-'}</td>
                            <td>{s.correctAnswers ?? '-'} / {s.totalQuestions ?? '-'}</td>
                            <td>
                              <span style={{ color: getScoreColor(pct), fontWeight: 'bold' }}>
                                {pct}%
                              </span>
                            </td>
                            <td>{s.dateAttempted ? new Date(s.dateAttempted).toLocaleDateString() : 'N/A'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3">
                  <button className="btn btn-outline-secondary" onClick={() => setSelectedStudent(null)}>
                    ← Back to List
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SATDashboard;
