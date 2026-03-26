import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const SubjectAnalysis = () => {
  const { subject, userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const subjectDisplayNames = {
    math: 'Mathematics 1',
    math2: 'Mathematics 2',
    statistics: 'Statistics 1',
    stats1: 'Statistics 1',
    stats2: 'Statistics 2',
    programming: 'Python Programming',
    python: 'Python Programming',
    dsa: 'PDSA',
    pdsa: 'PDSA',
    ct: 'Computational Thinking',
    algebra: 'Algebra'
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Get student data from previous page (passed via state)
  const getStudentData = () => {
    if (location.state && location.state.student) {
      return location.state.student;
    }
    return null;
  };

  // Generate analysis from student data without API call
  const generateAnalysisFromData = (studentData) => {
    if (!studentData || !studentData.quizScores || studentData.quizScores.length === 0) {
      return {
        user: { name: 'Unknown', email: 'N/A' },
        subject,
        scores: [],
        examAttempts: [],
        totalScore: 0,
        maxScore: 0,
        overallPercentage: 0,
        analysis: "No exam data available for analysis.",
        feedback: "Please complete some exams to receive personalized analysis.",
        gaps: [],
        recommendations: []
      };
    }

    // Transform quiz scores — each attempt is one row
    const scores = studentData.quizScores.map(quiz => {
      const score = quiz.score ?? quiz.correctAnswers ?? 0;
      const max = quiz.maxScore ?? quiz.totalQuestions ?? 100;
      const pct = quiz.percentage != null
        ? quiz.percentage
        : (max > 0 ? (score / max) * 100 : 0);
      return {
        topic: quiz.topic || quiz.quizType || quiz.subtopic || 'Unknown Topic',
        score,
        maxScore: max,
        percentage: pct,
        timestamp: quiz.timestamp || quiz.dateAttempted || null,
        difficulty: quiz.difficultyLevel || quiz.difficulty || null,
        attemptNumber: quiz.attemptNumber || null,
      };
    });

    // Calculate totals
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const maxScore = scores.reduce((sum, s) => sum + s.maxScore, 0);
    const overallPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    // Aggregate by topic for gap analysis
    const topicMap = new Map();
    scores.forEach(s => {
      if (!topicMap.has(s.topic)) {
        topicMap.set(s.topic, { total: 0, max: 0, count: 0 });
      }
      const t = topicMap.get(s.topic);
      t.total += s.score;
      t.max += s.maxScore;
      t.count += 1;
    });

    const topicSummaries = Array.from(topicMap.entries()).map(([topic, d]) => ({
      topic,
      avgPct: d.max > 0 ? (d.total / d.max) * 100 : 0,
      attempts: d.count,
      total: d.total,
      max: d.max,
    }));

    // Identify weak areas (below 60% average per topic)
    const weakAreas = topicSummaries
      .filter(t => t.avgPct < 60)
      .map(t => ({
        area: t.topic,
        description: `Average score ${t.total}/${t.max} (${t.avgPct.toFixed(1)}%) across ${t.attempts} attempt(s) — needs focused practice`,
        priority: t.avgPct < 40 ? 'high' : 'medium'
      }));

    // Generate recommendations for topics below 70%
    const recommendations = topicSummaries
      .filter(t => t.avgPct < 70)
      .sort((a, b) => a.avgPct - b.avgPct)
      .map(t => ({
        topic: t.topic,
        description: `Average ${t.avgPct.toFixed(1)}% — revisit concepts and attempt more practice problems in ${t.topic}`,
        difficulty: t.avgPct < 40 ? 'beginner' : 'intermediate'
      }));

    const bestTopic = topicSummaries.sort((a, b) => b.avgPct - a.avgPct)[0];
    const worstTopic = [...topicSummaries].sort((a, b) => a.avgPct - b.avgPct)[0];

    const analysisText = weakAreas.length > 0
      ? `${studentData.username || 'Student'} scored ${totalScore}/${maxScore} (${overallPercentage.toFixed(1)}%) overall in ${subjectDisplayNames[subject] || subject} across ${scores.length} exam attempt(s). ` +
        `Strongest topic: "${bestTopic?.topic}" (${bestTopic?.avgPct.toFixed(1)}%). ` +
        `Most challenging: "${worstTopic?.topic}" (${worstTopic?.avgPct.toFixed(1)}%). ` +
        `Topics needing improvement: ${weakAreas.map(g => g.area).join(', ')}.`
      : `${studentData.username || 'Student'} scored ${totalScore}/${maxScore} (${overallPercentage.toFixed(1)}%) overall in ${subjectDisplayNames[subject] || subject} across ${scores.length} exam attempt(s). ` +
        `Performance is strong across all topics. Best topic: "${bestTopic?.topic}" (${bestTopic?.avgPct.toFixed(1)}%).`;

    const feedbackText = weakAreas.length > 0
      ? `Focus on ${weakAreas.slice(0, 3).map(g => g.area).join(', ')}. ` +
        `Reattempt quizzes in these areas after reviewing the study material. ` +
        `Consistent practice will improve scores significantly.`
      : `Great performance! Continue regular practice to maintain your scores. ` +
        `Challenge yourself with harder difficulty questions to further strengthen your understanding.`;

    return {
      user: {
        name: studentData.username || studentData.name || 'Unknown',
        email: studentData.email || 'N/A'
      },
      subject,
      scores,
      totalScore,
      maxScore,
      overallPercentage,
      analysis: analysisText,
      feedback: feedbackText,
      gaps: weakAreas.length > 0
        ? weakAreas
        : [{ area: 'General Practice', description: 'Continue regular practice to maintain and improve skills', priority: 'low' }],
      recommendations: recommendations.length > 0
        ? recommendations
        : [{ topic: 'Advanced Practice', description: 'Attempt harder difficulty questions to push beyond current skill level', difficulty: 'intermediate' }]
    };
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    // First try to get data from previous page
    const studentData = getStudentData();
    
    if (studentData) {
      console.log('Generating analysis from student data:', studentData);
      const generatedAnalysis = generateAnalysisFromData(studentData);
      setAnalysis(generatedAnalysis);
      setLoading(false);
      return;
    }

    // If no student data, try API fallback
    try {
      console.log('Fetching analysis for subject:', subject, 'userId:', userId);
      
      // Try GET method first
      let response;
      try {
        response = await axios.get(`${VITE_API_URL}/api/analysis/${subject}/${userId}`, {
          withCredentials: true
        });
        console.log('GET analysis response:', response.data);
      } catch (getErr) {
        console.log('GET failed, trying POST:', getErr.message);
        // If GET fails, try POST method
        response = await axios.post(`${VITE_API_URL}/api/analyze/${subject}/${userId}`, {}, {
          withCredentials: true
        });
        console.log('POST analysis response:', response.data);
      }
      
      if (response.data.success) {
        setAnalysis(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch analysis');
      }
    } catch (err) {
      console.error('Fetch Analysis Error:', err);
      setError('Failed to fetch analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    setGenerating(true);
    setError(null);
    
    // Try to get fresh student data
    const studentData = getStudentData();
    
    if (studentData) {
      console.log('Regenerating analysis from student data:', studentData);
      const generatedAnalysis = generateAnalysisFromData(studentData);
      setAnalysis(generatedAnalysis);
      setGenerating(false);
      return;
    }

    // Fallback to API
    try {
      const res = await axios.post(`${VITE_API_URL}/api/analyze/${subject}/${userId}`, {}, {
        withCredentials: true
      });
      if (res.data.success) {
        setAnalysis(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Generate Analysis Error:', err);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [subject, userId]);

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
              <h2 className="mb-0">{subjectDisplayNames[subject]} Analysis</h2>
              <p className="text-muted mb-0">Student: {analysis?.user?.name || 'Unknown'}</p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/admin')}
              >
                ← Back to Dashboard
              </button>
              <button
                className="btn btn-success"
                onClick={generateNewAnalysis}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating...
                  </>
                ) : (
                  'Generate New Analysis'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

            {analysis && (
              <div className="row">
                {/* Overview Card */}
                <div className="col-lg-4 mb-4">
                  <div className="card h-100">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0">Performance Overview</h5>
                    </div>
                    <div className="card-body">
                      <div className="text-center mb-4">
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: `conic-gradient(${getScoreColor(analysis.overallPercentage)} ${analysis.overallPercentage}%, #e9ecef ${analysis.overallPercentage}%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 1rem',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getScoreColor(analysis.overallPercentage)
                          }}>
                            {Math.round(analysis.overallPercentage)}%
                          </div>
                        </div>
                        <h6 className="text-muted">Overall Score</h6>
                      </div>
                      
                      <div className="row text-center">
                        <div className="col-6">
                          <h6 className="text-success">{analysis.totalScore}</h6>
                          <small className="text-muted">Total Score</small>
                        </div>
                        <div className="col-6">
                          <h6 className="text-info">{analysis.maxScore}</h6>
                          <small className="text-muted">Maximum Score</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Details */}
                <div className="col-lg-8 mb-4">
                  <div className="card">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">AI Analysis & Feedback</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-4">
                        <h6>Performance Analysis</h6>
                        <p className="text-muted">{analysis.analysis}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h6>Personalized Feedback</h6>
                        <p className="text-muted">{analysis.feedback}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Knowledge Gaps */}
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header bg-warning text-dark">
                      <h5 className="mb-0">Knowledge Gaps</h5>
                    </div>
                    <div className="card-body">
                      {analysis.gaps && analysis.gaps.length > 0 ? (
                        <div className="row">
                          {analysis.gaps.map((gap, index) => (
                            <div className="col-md-4 mb-3" key={index}>
                              <div className="card border-left" style={{ borderLeft: `4px solid ${getPriorityColor(gap.priority)}` }}>
                                <div className="card-body">
                                  <h6 className="card-title" style={{ color: getPriorityColor(gap.priority) }}>
                                    {gap.area}
                                    <span className="badge bg-secondary ms-2">{gap.priority}</span>
                                  </h6>
                                  <p className="card-text text-muted">{gap.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          No significant knowledge gaps identified.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">Study Recommendations</h5>
                    </div>
                    <div className="card-body">
                      {analysis.recommendations && analysis.recommendations.length > 0 ? (
                        <div className="row">
                          {analysis.recommendations.map((rec, index) => (
                            <div className="col-md-6 mb-3" key={index}>
                              <div className="card h-100">
                                <div className="card-body">
                                  <h6 className="card-title text-success">{rec.topic}</h6>
                                  <p className="card-text text-muted">{rec.description}</p>
                                  <span className="badge bg-info">{rec.difficulty}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          No specific recommendations at this time.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic Breakdown */}
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-secondary text-white">
                      <h5 className="mb-0">Topic-wise Performance</h5>
                    </div>
                    <div className="card-body">
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Topic</th>
                              <th>Score</th>
                              <th>Max Score</th>
                              <th>Percentage</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.scores && analysis.scores.length > 0 ? (
                              analysis.scores.map((score, index) => (
                                <tr key={index}>
                                  <td>{score.topic}</td>
                                  <td>{score.score}</td>
                                  <td>{score.maxScore}</td>
                                  <td>
                                    <span style={{ color: getScoreColor(score.percentage) }}>
                                      {score.percentage.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${score.percentage >= 80 ? 'bg-success' : score.percentage >= 60 ? 'bg-warning' : 'bg-danger'}`}>
                                      {score.percentage >= 80 ? 'Excellent' : score.percentage >= 60 ? 'Good' : 'Needs Improvement'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center text-muted">
                                  No topic data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SubjectAnalysis;