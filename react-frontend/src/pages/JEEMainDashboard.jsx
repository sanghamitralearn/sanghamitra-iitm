import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ACCENT = '#5fcf80';

const JEEMainDashboard = () => {
  const navigate = useNavigate();
  const [jeeData, setJeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const loadJEEData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${VITE_API_URL}/api/jee_main_admin_scores`, { withCredentials: true });
      if (res.data.success && res.data.data) {
        setJeeData(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
      } else {
        setJeeData([]);
      }
    } catch (err) {
      setError('Unable to fetch JEE Main data');
      setJeeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJEEData();
  }, []);

  const calculateStats = () => {
    if (!jeeData.length) return { totalStudents: 0, avgScore: 0, totalSubmissions: 0 };
    let totalScore = 0, totalMaxScore = 0, totalSubmissions = 0;
    jeeData.forEach(student => {
      if (student.quizScores && student.quizScores.length) {
        student.quizScores.forEach(quiz => {
          totalScore += quiz.score || 0;
          totalMaxScore += quiz.maxScore || 360;
          totalSubmissions++;
        });
      }
    });
    const avgScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    return {
      totalStudents: jeeData.length,
      avgScore: Math.round(avgScore * 100) / 100,
      totalSubmissions,
    };
  };

  const stats = calculateStats();

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const handleStudentClick = (student) => setSelectedStudent(student);
  const handleBackToDashboard = () => setSelectedStudent(null);

  // Open the existing student-facing analysis page for one attempt
  const handleAnalyze = (quiz) => {
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
  };

  // Aggregate subject-wise progress across all of a student's attempts
  const getSubjectProgress = (student) => {
    if (!student.quizScores || student.quizScores.length === 0) return [];
    const subjectMap = new Map();
    student.quizScores.forEach(quiz => {
      const ss = quiz.subjectScores || {};
      ['Physics', 'Chemistry', 'Mathematics'].forEach(sub => {
        const data = ss[sub];
        if (!data) return;
        if (!subjectMap.has(sub)) {
          subjectMap.set(sub, { topic: sub, score: 0, maxScore: 0, progress: 0 });
        }
        const t = subjectMap.get(sub);
        t.score += data.score || 0;
        t.maxScore += data.maxScore || 0;
        t.progress = t.maxScore > 0 ? (t.score / t.maxScore) * 100 : 0;
      });
    });
    return Array.from(subjectMap.values());
  };

  if (loading) {
    return (
      <div className="container my-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border" style={{ color: ACCENT }} role="status">
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
              <h2 className="mb-0">JEE Main Dashboard</h2>
              <p className="text-muted mb-0">Monitor JEE Main full-length paper performance across Physics, Chemistry and Mathematics.</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                ← Back to Admin Dashboard
              </button>
              <button className="btn btn-success" onClick={loadJEEData}>
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
                      <i className="bi bi-people-fill" style={{ fontSize: '2rem', color: ACCENT }}></i>
                      <h4 className="mt-2">{stats.totalStudents}</h4>
                      <p className="text-muted">Total Students</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-bar-chart text-info" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2" style={{ color: getScoreColor(stats.avgScore) }}>
                        {stats.avgScore}%
                      </h4>
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

              {/* Students List */}
              <div className="card">
                <div className="card-header text-white" style={{ background: ACCENT }}>
                  <h5 className="mb-0">Recent Exam Activity</h5>
                </div>
                <div className="card-body">
                  {jeeData.length === 0 ? (
                    <div className="text-center text-muted py-4">No JEE Main data available yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Recent Paper</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...jeeData].sort((a, b) => {
                            const aLatest = (a.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0);
                            const bLatest = (b.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp || 0)), 0);
                            return bLatest - aLatest;
                          }).map((student, index) => {
                            const scores = student.quizScores || [];
                            const recentExam = scores.length > 0
                              ? scores.reduce((latest, current) =>
                                  new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest)
                              : null;

                            return (
                              <tr key={index} style={{ cursor: 'pointer' }} onClick={() => handleStudentClick(student)}>
                                <td><strong>{student.name || 'Unknown'}</strong></td>
                                <td>{student.email || 'N/A'}</td>
                                <td>
                                  {recentExam ? (
                                    <span className="badge" style={{ background: ACCENT }}>
                                      {recentExam.topic || 'JEE Main Paper'}
                                    </span>
                                  ) : (
                                    <span className="text-muted">No exams</span>
                                  )}
                                </td>
                                <td>
                                  {recentExam ? (
                                    <span style={{ color: getScoreColor(recentExam.percentage || 0), fontWeight: 'bold' }}>
                                      {recentExam.score || 0}/{recentExam.maxScore || 360} ({Math.round(recentExam.percentage || 0)}%)
                                    </span>
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
                                      className="btn btn-outline-success btn-sm"
                                      onClick={(e) => { e.stopPropagation(); handleStudentClick(student); }}
                                    >
                                      View Details
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
                        <p><strong>Maximum Possible:</strong> {selectedStudent.quizScores.reduce((sum, q) => sum + (q.maxScore || 360), 0)}</p>
                      </>
                    ) : (
                      <p>No submissions yet.</p>
                    )}
                  </div>
                </div>

                {/* Subject-wise progress */}
                {getSubjectProgress(selectedStudent).length > 0 && (
                  <div className="mt-3 mb-3">
                    <h6>Subject Progress</h6>
                    <div className="row">
                      {getSubjectProgress(selectedStudent).map((t, i) => (
                        <div key={i} className="col-md-6 mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small><strong>{t.topic}</strong></small>
                            <small style={{ color: getScoreColor(t.progress) }}>{Math.round(t.progress)}%</small>
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
                            <th>Paper</th>
                            <th>Attempt</th>
                            <th>Score</th>
                            <th>Correct / Total</th>
                            <th>Percentage</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...selectedStudent.quizScores]
                            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
                            .map((quiz, index) => (
                              <tr key={index}>
                                <td><strong>{quiz.topic || 'JEE Main Paper'}</strong></td>
                                <td>#{quiz.attemptNumber || index + 1}</td>
                                <td>{quiz.score || 0}/{quiz.maxScore || 360}</td>
                                <td>{quiz.correctAnswers ?? '-'} / {quiz.totalQuestions ?? '-'}</td>
                                <td>
                                  <span style={{ color: getScoreColor(quiz.percentage || 0), fontWeight: 'bold' }}>
                                    {Math.round(quiz.percentage || 0)}%
                                  </span>
                                </td>
                                <td>{quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAnalyze(quiz)}
                                  >
                                    <i className="bi bi-bar-chart-line me-1"></i>Analyze
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-4">
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

export default JEEMainDashboard;
