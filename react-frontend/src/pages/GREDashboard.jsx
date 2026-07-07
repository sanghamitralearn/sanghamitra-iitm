import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const GREDashboard = () => {
  const navigate = useNavigate();
  const [greData, setGreData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    loadGREData();
  }, []);

  // Only Verbal Reasoning / Quantitative Reasoning attempts carry a scaled score (130-170).
  // Analytical Writing attempts are excluded from the average-scaled-score calculation
  // since they are never auto-scored (essayStatus stays 'pending_review').
  const calculateStats = () => {
    if (!greData.length) return { totalStudents: 0, avgScaledScore: 0, totalSubmissions: 0 };
    let totalScaled = 0, scaledCount = 0, totalSubmissions = 0;
    greData.forEach(student => {
      if (student.quizScores && student.quizScores.length) {
        student.quizScores.forEach(quiz => {
          totalSubmissions++;
          if (quiz.scaledScore != null) {
            totalScaled += quiz.scaledScore;
            scaledCount++;
          }
        });
      }
    });
    const avgScaledScore = scaledCount > 0 ? totalScaled / scaledCount : 0;
    return {
      totalStudents: greData.length,
      avgScaledScore: Math.round(avgScaledScore * 10) / 10,
      totalSubmissions,
    };
  };

  const stats = calculateStats();

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  // Colour a scaled score (130-170) the same way as a percentage, by mapping it onto 0-100 first
  const getScaledScoreColor = (scaledScore) => {
    if (scaledScore == null) return '#6c757d';
    const pct = ((scaledScore - 130) / 40) * 100;
    return getScoreColor(pct);
  };

  const handleStudentClick = (student) => setSelectedStudent(student);
  const handleBackToDashboard = () => setSelectedStudent(null);

  const handleGenerateAnalysis = (student) => {
    navigate(`/admin/analysis/gre/${student._id || student.email}`, {
      state: { student },
    });
  };

  const getTopicProgress = (student) => {
    if (!student.quizScores || student.quizScores.length === 0) return [];
    const topicMap = new Map();
    student.quizScores.forEach(quiz => {
      const topic = quiz.topic || 'Unknown Section';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { topic, correctAnswers: 0, totalQuestions: 0, progress: 0, scaledScores: [] });
      }
      const t = topicMap.get(topic);
      t.correctAnswers += quiz.correctAnswers || 0;
      t.totalQuestions += quiz.totalQuestions || 0;
      t.progress = t.totalQuestions > 0 ? (t.correctAnswers / t.totalQuestions) * 100 : 0;
      if (quiz.scaledScore != null) t.scaledScores.push(quiz.scaledScore);
    });
    return Array.from(topicMap.values()).map(t => ({
      ...t,
      avgScaledScore: t.scaledScores.length
        ? Math.round((t.scaledScores.reduce((a, b) => a + b, 0) / t.scaledScores.length) * 10) / 10
        : null,
    }));
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
              <h2 className="mb-0">GRE Dashboard</h2>
              <p className="text-muted mb-0">Monitor GRE exam performance across Verbal Reasoning, Quantitative Reasoning and Analytical Writing sections.</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                ← Back to Admin Dashboard
              </button>
              <button className="btn btn-success" onClick={loadGREData}>
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {!selectedStudent ? (
            <>
              {/* Statistics Overview */}
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
                      <h4 className="mt-2" style={{ color: getScaledScoreColor(stats.avgScaledScore) }}>
                        {stats.avgScaledScore > 0 ? `${stats.avgScaledScore}/170` : '—'}
                      </h4>
                      <p className="text-muted">Average Scaled Score (Verbal / Quant)</p>
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

              {/* Students List */}
              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Recent Exam Activity</h5>
                </div>
                <div className="card-body">
                  {greData.length === 0 ? (
                    <div className="text-center text-muted py-4">No GRE data available yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Recent Section</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...greData].sort((a, b) => {
                            const aLatest = (a.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0);
                            const bLatest = (b.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0);
                            return bLatest - aLatest;
                          }).map((student, index) => {
                            const scores = student.quizScores || [];
                            const recentExam = scores.length > 0
                              ? scores.reduce((latest, current) =>
                                  new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest)
                              : null;
                            const isEssay = recentExam?.topic === 'Analytical Writing';

                            return (
                              <tr key={index} style={{ cursor: 'pointer' }} onClick={() => handleStudentClick(student)}>
                                <td><strong>{student.name || 'Unknown'}</strong></td>
                                <td>{student.email || 'N/A'}</td>
                                <td>
                                  {recentExam ? (
                                    <span className="badge bg-primary">
                                      {recentExam.topic || 'GRE Section'}
                                    </span>
                                  ) : (
                                    <span className="text-muted">No exams</span>
                                  )}
                                </td>
                                <td>
                                  {recentExam ? (
                                    isEssay ? (
                                      <span className="badge" style={{ background: '#d63384', color: '#fff' }}>
                                        {recentExam.essayStatus === 'pending_review' || !recentExam.essayStatus ? 'Pending Review' : recentExam.essayStatus}
                                      </span>
                                    ) : (
                                      <span style={{ color: getScaledScoreColor(recentExam.scaledScore), fontWeight: 'bold' }}>
                                        {recentExam.scaledScore != null ? `${recentExam.scaledScore}/170` : `${recentExam.score || 0}/${recentExam.maxScore || 0}`}
                                        {' '}({Math.round(recentExam.percentage || 0)}%)
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {recentExam ? new Date(recentExam.timestamp).toLocaleDateString() : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <div className="btn-group" role="group">
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={(e) => { e.stopPropagation(); handleStudentClick(student); }}
                                    >
                                      View Details
                                    </button>
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={(e) => { e.stopPropagation(); handleGenerateAnalysis(student); }}
                                    >
                                      AI Analysis
                                    </button>
                                  </div>
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
            /* Student Detail View */
            <div className="card">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Student Details: {selectedStudent.name || 'Unknown'}</h5>
                <button className="btn btn-light btn-sm" onClick={handleBackToDashboard}>
                  ← Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Student Information</h6>
                    <p><strong>Email:</strong> {selectedStudent.email || 'N/A'}</p>
                    <p><strong>Name:</strong> {selectedStudent.name || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Performance Summary</h6>
                    {selectedStudent.quizScores && selectedStudent.quizScores.length > 0 ? (
                      <>
                        <p><strong>Total Submissions:</strong> {selectedStudent.quizScores.length}</p>
                        <p><strong>Total Score:</strong> {selectedStudent.quizScores.reduce((sum, q) => sum + (q.score || 0), 0)}</p>
                        <p><strong>Maximum Possible:</strong> {selectedStudent.quizScores.reduce((sum, q) => sum + (q.maxScore || 0), 0)}</p>
                      </>
                    ) : (
                      <p>No submissions yet.</p>
                    )}
                  </div>
                </div>

                {/* Section-wise progress */}
                {getTopicProgress(selectedStudent).length > 0 && (
                  <div className="mt-3 mb-3">
                    <h6>Section Progress</h6>
                    <div className="row">
                      {getTopicProgress(selectedStudent).map((t, i) => (
                        <div key={i} className="col-md-6 mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small><strong>{t.topic}</strong></small>
                            <small style={{ color: getScoreColor(t.progress) }}>
                              {t.avgScaledScore != null ? `${t.avgScaledScore}/170` : `${Math.round(t.progress)}%`}
                            </small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              style={{ width: `${t.progress}%`, backgroundColor: getScoreColor(t.progress) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exam-wise Data */}
                {selectedStudent.quizScores && selectedStudent.quizScores.length > 0 && (
                  <div className="mt-4">
                    <h6>Exam-wise Performance</h6>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Section</th>
                            <th>Attempt</th>
                            <th>Score</th>
                            <th>Correct / Total</th>
                            <th>Scaled / Status</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...selectedStudent.quizScores]
                            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                            .map((quiz, index) => {
                              const isEssay = quiz.topic === 'Analytical Writing';
                              return (
                                <tr key={index}>
                                  <td><strong>{quiz.topic || 'GRE Section'}</strong></td>
                                  <td>#{quiz.attemptNumber || index + 1}</td>
                                  <td>{quiz.score || 0}/{quiz.maxScore || 0}</td>
                                  <td>{quiz.correctAnswers ?? '-'} / {quiz.totalQuestions ?? '-'}</td>
                                  <td>
                                    {isEssay ? (
                                      <span className="badge" style={{ background: '#d63384', color: '#fff' }}>
                                        {quiz.essayStatus === 'pending_review' || !quiz.essayStatus ? 'Pending Review' : quiz.essayStatus}
                                      </span>
                                    ) : (
                                      <span style={{ color: getScaledScoreColor(quiz.scaledScore), fontWeight: 'bold' }}>
                                        {quiz.scaledScore != null ? `${quiz.scaledScore}/170` : `${Math.round(quiz.percentage || 0)}%`}
                                      </span>
                                    )}
                                  </td>
                                  <td>{quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString() : 'N/A'}</td>
                                  <td>
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => navigate(
                                        `/admin/gre/exam/${encodeURIComponent(selectedStudent.email)}/${encodeURIComponent(quiz.topic)}/${quiz.attemptNumber || index + 1}`,
                                        { state: { studentName: selectedStudent.name || selectedStudent.email } }
                                      )}
                                    >
                                      <i className="bi bi-bar-chart-line me-1"></i>Analyze
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                
                {/* Action Buttons */}
                <div className="mt-4">
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleGenerateAnalysis(selectedStudent)}
                  >
                    <i className="bi bi-magic"></i> Generate AI Analysis
                  </button>
                  <button className="btn btn-outline-secondary" onClick={handleBackToDashboard}>
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

export default GREDashboard;
