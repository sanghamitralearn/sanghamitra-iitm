import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  
const MathDashboard = () => {
  const navigate = useNavigate();
  const [mathData, setMathData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Load math scores from the API
  const loadMathData = async () => {
    setLoading(true);
    setError(null);
    
    // Try multiple endpoints in order of preference
    const endpointsToTry = [
      `${VITE_API_URL}/api/iitmmath_scores`,
      `${VITE_API_URL}/api/math-dashboard`,
      `${VITE_API_URL}/api/math-scores`,
      `${VITE_API_URL}/api/math-data`,
      `${VITE_API_URL}/api/users`,
      `${VITE_API_URL}/api/math-records`
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const res = await axios.get(endpoint, {
          withCredentials: true
        });
        console.log(`Success with ${endpoint}:`, res.data);
        
        if (res.data.success && res.data.data) {
          // Transform the data to match our expected format
          const transformedData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          console.log('Transformed data:', transformedData);
          setMathData(transformedData);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log(`Failed with ${endpoint}:`, err.message);
        // Continue to next endpoint
      }
    }

    // If all endpoints fail
    setError('Unable to fetch math data from any available endpoint');
    setMathData([]);
    setLoading(false);
  };

  useEffect(() => {
    loadMathData();
  }, []);

  // Calculate overall statistics
  const calculateStats = () => {
    if (!mathData.length) return { totalStudents: 0, avgScore: 0, totalSubmissions: 0 };

    let totalScore = 0;
    let totalMaxScore = 0;
    let totalSubmissions = 0;

    mathData.forEach(student => {
      if (student.quizScores && student.quizScores.length) {
        student.quizScores.forEach(quiz => {
          totalScore += quiz.score || 0;
          totalMaxScore += quiz.maxScore || 100;
          totalSubmissions++;
        });
      }
    });

    const avgScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      totalStudents: mathData.length,
      avgScore: Math.round(avgScore * 100) / 100,
      totalSubmissions
    };
  };

  const stats = calculateStats();

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
  };

  const handleBackToDashboard = () => {
    setSelectedStudent(null);
  };

  const handleGenerateAnalysis = (student) => {
    // Pass student data to analysis page and navigate to subject analysis
    navigate(`/admin/analysis/math/${student._id || student.email}`, {
      state: { student: student }
    });
  };

  const getTopicProgress = (student) => {
    if (!student.quizScores || student.quizScores.length === 0) {
      return [];
    }

    // Group scores by topic
    const topicMap = new Map();
    student.quizScores.forEach(quiz => {
      const topic = quiz.topic || 'Unknown Topic';
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          topic,
          correctAnswers: 0,
          totalQuestions: 0,
          progress: 0
        });
      }
      const topicData = topicMap.get(topic);
      topicData.correctAnswers += quiz.score || 0;
      topicData.totalQuestions += quiz.maxScore || 100;
      topicData.progress = topicData.totalQuestions > 0 
        ? (topicData.correctAnswers / topicData.totalQuestions) * 100 
        : 0;
    });

    return Array.from(topicMap.values());
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
              <h2 className="mb-0">Mathematics Dashboard</h2>
              <p className="text-muted mb-0">Monitor mathematics assignments, problem sets, and analytical reasoning exercises.</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin')}
              >
                ← Back to Admin Dashboard
              </button>
              <button
                className="btn btn-success"
                onClick={loadMathData}
              >
                <i className="bi bi-arrow-repeat"></i> Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

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
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Recent Exam Activity</h5>
                </div>
                <div className="card-body">
                  {mathData.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      No math data available yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Recent Exam</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...mathData].sort((a, b) => {
                            const aLatest = (a.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp||0)), 0)
                            const bLatest = (b.quizScores || []).reduce((max, q) => Math.max(max, new Date(q.timestamp||0)), 0)
                            return bLatest - aLatest
                          }).map((student, index) => {
                            const scores = student.quizScores || [];
                            const recentExam = scores.length > 0
                              ? scores.reduce((latest, current) => {
                                  return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
                                })
                              : null;

                            return (
                              <tr key={index} style={{ cursor: 'pointer' }} onClick={() => handleStudentClick(student)}>
                                <td>
                                  <strong>{student.username || student.name || 'Unknown'}</strong>
                                </td>
                                <td>{student.email || 'N/A'}</td>
                                <td>
                                  {recentExam ? (
                                    <span className={`badge ${recentExam.difficultyLevel === 'hard' ? 'bg-danger' : recentExam.difficultyLevel === 'medium' ? 'bg-warning' : 'bg-success'}`}>
                                      {recentExam.topic || 'Unknown Topic'}
                                    </span>
                                  ) : (
                                    <span className="text-muted">No exams</span>
                                  )}
                                </td>
                                <td>
                                  {recentExam ? (
                                    <span style={{ color: getScoreColor(recentExam.percentage || 0), fontWeight: 'bold' }}>
                                      {recentExam.score || 0}/{recentExam.maxScore || 100} ({Math.round(recentExam.percentage || 0)}%)
                                    </span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {recentExam ? (
                                    new Date(recentExam.timestamp).toLocaleDateString()
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <div className="btn-group" role="group">
                                    <button
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStudentClick(student);
                                      }}
                                    >
                                      View Details
                                    </button>
                                    <button
                                      className="btn btn-outline-success btn-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGenerateAnalysis(student);
                                      }}
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
                <h5 className="mb-0">Student Details: {selectedStudent.username || selectedStudent.name || 'Unknown'}</h5>
                <button className="btn btn-light btn-sm" onClick={handleBackToDashboard}>
                  ← Back to List
                </button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Student Information</h6>
                    <p><strong>Email:</strong> {selectedStudent.email || 'N/A'}</p>
                    <p><strong>Username:</strong> {selectedStudent.username || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Performance Summary</h6>
                    {selectedStudent.quizScores && selectedStudent.quizScores.length > 0 ? (
                      <>
                        <p><strong>Total Submissions:</strong> {selectedStudent.quizScores.length}</p>
                        <p><strong>Total Score:</strong> {selectedStudent.quizScores.reduce((sum, quiz) => sum + (quiz.score || 0), 0)}</p>
                        <p><strong>Maximum Possible:</strong> {selectedStudent.quizScores.reduce((sum, quiz) => sum + (quiz.maxScore || 100), 0)}</p>
                      </>
                    ) : (
                      <p>No submissions yet.</p>
                    )}
                  </div>
                </div>

                {/* Exam-wise Data (like HTML framework) */}
                {selectedStudent.quizScores && selectedStudent.quizScores.length > 0 && (
                  <div className="mt-4">
                    <h6>Exam-wise Performance</h6>
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Exam Topic</th>
                            <th>Attempt</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...selectedStudent.quizScores].sort((a, b) => new Date(b.timestamp||0) - new Date(a.timestamp||0)).map((quiz, index) => (
                            <tr key={index}>
                              <td><strong>{quiz.topic || 'Unknown Topic'}</strong></td>
                              <td>#{quiz.attemptNumber || index + 1}</td>
                              <td>{quiz.score || 0}/{quiz.maxScore || quiz.totalPossible || 50}</td>
                              <td>
                                <span style={{ color: getScoreColor(quiz.percentage || 0), fontWeight: 'bold' }}>
                                  {Math.round(quiz.percentage || 0)}%
                                </span>
                              </td>
                              <td>{quiz.timestamp ? new Date(quiz.timestamp).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => navigate(
                                    `/admin/math/exam/${encodeURIComponent(selectedStudent.email)}/${encodeURIComponent(quiz.topic)}/${quiz.attemptNumber || index + 1}`,
                                    { state: { studentName: selectedStudent.username || selectedStudent.email } }
                                  )}
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

                {/* Action Buttons */}
                <div className="mt-4">
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleGenerateAnalysis(selectedStudent)}
                  >
                    <i className="bi bi-magic"></i> Generate AI Analysis
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleBackToDashboard}
                  >
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

export default MathDashboard;
