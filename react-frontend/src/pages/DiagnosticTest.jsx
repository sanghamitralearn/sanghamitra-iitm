import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DiagnosticTest = () => {
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
        <h2>Please Login to Access Diagnostic Test</h2>
        <p className="lead">You need to be logged in to take the diagnostic test and assess your proficiency level.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/diagnostic-test.png" alt="Diagnostic Test" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Assess Your Current Level
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Take our comprehensive diagnostic test to evaluate your current knowledge and identify areas for improvement.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Diagnostic Test Sections */}
      <section id="diagnostic-content" className="diagnostic-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Diagnostic Assessment</h2>
          <p className="">Comprehensive Level Evaluation</p>
        </div>

        <div className="container">
          <div className="row">
            {/* English Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/english-diagnostic.png" className="img-fluid" alt="English Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/english"><button className="category">English</button></Link>
                  </div>
                  <p className="description">
                    Evaluate your grammar, vocabulary, reading comprehension, and writing skills.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;82
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Math Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/math-diagnostic.png" className="img-fluid" alt="Math Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/math"><button className="category">Mathematics</button></Link>
                  </div>
                  <p className="description">
                    Test your arithmetic, algebra, geometry, and problem-solving abilities.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;76
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/statistics-diagnostic.png" className="img-fluid" alt="Statistics Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/statistics"><button className="category">Statistics</button></Link>
                  </div>
                  <p className="description">
                    Assess your understanding of data analysis, probability, and statistical concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Programming Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/programming-diagnostic.png" className="img-fluid" alt="Programming Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/programming"><button className="category">Programming</button></Link>
                  </div>
                  <p className="description">
                    Evaluate your coding skills, logical thinking, and understanding of programming concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;71
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Comprehension Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/reading-diagnostic.png" className="img-fluid" alt="Reading Comprehension Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/reading"><button className="category">Reading Comprehension</button></Link>
                  </div>
                  <p className="description">
                    Test your ability to understand, analyze, and interpret written passages.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;64
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Writing Diagnostic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/writing-diagnostic.png" className="img-fluid" alt="Writing Diagnostic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/diagnostic/writing"><button className="category">Writing</button></Link>
                  </div>
                  <p className="description">
                    Assess your writing skills including grammar, structure, coherence, and style.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;59
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Features Section */}
      <section id="features" className="features section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Test Features</h2>
          <p className="">What to Expect</p>
        </div>

        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="features-item">
                <i className="bi bi-clock"></i>
                <h3>Timed Assessment</h3>
                <p>Complete tests within specified time limits to simulate real exam conditions.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="features-item">
                <i className="bi bi-bar-chart"></i>
                <h3>Detailed Analysis</h3>
                <p>Receive comprehensive feedback on your performance and areas needing improvement.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="features-item">
                <i className="bi bi-lightbulb"></i>
                <h3>Personalized Recommendations</h3>
                <p>Get tailored suggestions for courses and study materials based on your results.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="features-item">
                <i className="bi bi-award"></i>
                <h3>Progress Tracking</h3>
                <p>Monitor your improvement over time with regular diagnostic assessments.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
              <div className="features-item">
                <i className="bi bi-check-circle"></i>
                <h3>Multiple Question Types</h3>
                <p>Experience various question formats including multiple choice, short answer, and problem-solving.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
              <div className="features-item">
                <i className="bi bi-graph-up"></i>
                <h3>Performance Analytics</h3>
                <p>View detailed analytics showing your strengths, weaknesses, and progress trends.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
              <div className="features-item">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Adaptive Difficulty</h3>
                <p>Tests adjust difficulty based on your performance for accurate assessment.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
              <div className="features-item">
                <i className="bi bi-download"></i>
                <h3>Downloadable Reports</h3>
                <p>Save and share your diagnostic test results and progress reports.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Test Tips</h2>
          <p className="">Preparation Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Before the Test</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Get a good night's sleep</li>
                <li><i className="bi bi-check-circle-fill"></i> Eat a healthy meal</li>
                <li><i className="bi bi-check-circle-fill"></i> Review basic concepts</li>
                <li><i className="bi bi-check-circle-fill"></i> Ensure stable internet connection</li>
                <li><i className="bi bi-check-circle-fill"></i> Find a quiet, distraction-free environment</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>During the Test</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Read instructions carefully</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Manage your time effectively</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Answer easier questions first</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Don't spend too much time on difficult questions</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Review your answers if time permits</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default DiagnosticTest