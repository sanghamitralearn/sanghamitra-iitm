import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Assessment = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container text-center" style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Please Login to Access Assessments</h2>
        <p className="lead">You need to be logged in to view and take assessments.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/assessment.png" alt="Assessment" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Track Your Progress
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Regular assessments help you monitor your learning progress and identify areas for improvement.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Assessment Sections */}
      <section id="assessment-content" className="assessment-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Learning Assessments</h2>
          <p className="">Progress Evaluation Tools</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Weekly Assessments */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/weekly-assessments.png" className="img-fluid" alt="Weekly Assessments" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/weekly"><button className="category">Weekly</button></Link>
                  </div>
                  <p className="description">
                    Regular weekly tests to track your progress and reinforce learning from the past week.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;78
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chapter Assessments */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/chapter-assessments.png" className="img-fluid" alt="Chapter Assessments" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/chapter"><button className="category">Chapter</button></Link>
                  </div>
                  <p className="description">
                    Comprehensive tests at the end of each chapter to evaluate understanding of key concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;72
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Quizzes */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/practice-quizzes.png" className="img-fluid" alt="Practice Quizzes" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/practice"><button className="category">Practice</button></Link>
                  </div>
                  <p className="description">
                    Interactive quizzes for immediate feedback and reinforcement of specific topics.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;85
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Tests */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/mock-tests.png" className="img-fluid" alt="Mock Tests" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/mock"><button className="category">Mock Tests</button></Link>
                  </div>
                  <p className="description">
                    Full-length practice exams that simulate real test conditions and time constraints.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;69
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Assessments */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/skill-assessments.png" className="img-fluid" alt="Skill Assessments" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/skills"><button className="category">Skills</button></Link>
                  </div>
                  <p className="description">
                    Focused evaluations on specific skills like grammar, vocabulary, or problem-solving.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;63
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Reports */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/progress-reports.png" className="img-fluid" alt="Progress Reports" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/assessment/reports"><button className="category">Progress Reports</button></Link>
                  </div>
                  <p className="description">
                    Detailed analytics and reports showing your learning progress over time.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;57
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Features Section */}
      <section id="features" className="features section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Assessment Features</h2>
          <p className="">What Makes Our Assessments Effective</p>
        </div>

        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="features-item">
                <i className="bi bi-check-circle-fill"></i>
                <h3>Instant Feedback</h3>
                <p>Receive immediate results and explanations for each question to enhance learning.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="features-item">
                <i className="bi bi-graph-up"></i>
                <h3>Progress Tracking</h3>
                <p>Monitor your improvement over time with detailed performance analytics.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="features-item">
                <i className="bi bi-lightbulb"></i>
                <h3>Personalized Insights</h3>
                <p>Get tailored recommendations based on your performance and learning patterns.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="features-item">
                <i className="bi bi-clock"></i>
                <h3>Flexible Timing</h3>
                <p>Take assessments at your own pace or under timed conditions for exam practice.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
              <div className="features-item">
                <i className="bi bi-bar-chart"></i>
                <h3>Detailed Analytics</h3>
                <p>View comprehensive breakdowns of your performance by topic and skill area.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
              <div className="features-item">
                <i className="bi bi-award"></i>
                <h3>Achievement Badges</h3>
                <p>Earn recognition for your accomplishments and milestones throughout your learning journey.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
              <div className="features-item">
                <i className="bi bi-download"></i>
                <h3>Exportable Results</h3>
                <p>Download and share your assessment results and progress reports.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
              <div className="features-item">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Adaptive Difficulty</h3>
                <p>Assessments adjust to your skill level to provide appropriate challenges.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Assessment Tips</h2>
          <p className="">Maximize Your Performance</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Before Taking Assessments</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Review the material thoroughly</li>
                <li><i className="bi bi-check-circle-fill"></i> Get adequate rest the night before</li>
                <li><i className="bi bi-check-circle-fill"></i> Ensure a quiet, distraction-free environment</li>
                <li><i className="bi bi-check-circle-fill"></i> Have necessary materials ready</li>
                <li><i className="bi bi-check-circle-fill"></i> Review previous assessment results</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>During Assessments</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Read questions carefully</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Manage your time effectively</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Don't rush through questions</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Use the process of elimination</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Review your answers if time permits</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Assessment