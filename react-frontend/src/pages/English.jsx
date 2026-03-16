import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const English = () => {
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
        <h2>Please Login to Access English Content</h2>
        <p className="lead">You need to be logged in to view English course materials and assessments.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/english.index.png" alt="English Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master English Language Skills
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Enhance your English proficiency through comprehensive lessons, assessments, and practice materials.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english/grammar" className="btn-get-started">Start Learning</Link>
          </div>
        </div>
      </section>

      {/* English Sections */}
      <section id="english-content" className="english-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>English Learning</h2>
          <p className="">Comprehensive English Language Resources</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Grammar Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/grammar.png" className="img-fluid" alt="Grammar" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar"><button className="category">Grammar</button></Link>
                  </div>
                  <p className="description">
                    Master English grammar rules and improve your writing skills with comprehensive lessons and exercises.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;45
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vocabulary Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/vocabulary.png" className="img-fluid" alt="Vocabulary" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary"><button className="category">Vocabulary</button></Link>
                  </div>
                  <p className="description">
                    Expand your vocabulary with word lists, definitions, and contextual usage examples.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;62
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reading Comprehension Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/reading-comprehension.png" className="img-fluid" alt="Reading Comprehension" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading-comprehension"><button className="category">Reading Comprehension</button></Link>
                  </div>
                  <p className="description">
                    Improve your reading skills with passages, questions, and detailed explanations.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;38
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Writing Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/writing.png" className="img-fluid" alt="Writing" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing"><button className="category">Writing</button></Link>
                  </div>
                  <p className="description">
                    Develop your writing skills with guided exercises, templates, and feedback mechanisms.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;51
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Test Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/diagnostic-test.png" className="img-fluid" alt="Diagnostic Test" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/diagnostic-test"><button className="category">Diagnostic Test</button></Link>
                  </div>
                  <p className="description">
                    Take our comprehensive diagnostic test to assess your current English proficiency level.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;73
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/assessment.png" className="img-fluid" alt="Assessment" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/assessment"><button className="category">Assessment</button></Link>
                  </div>
                  <p className="description">
                    Regular assessments to track your progress and identify areas for improvement.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;44
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features section">
        <div className="container section-title" data-aos="fade-up">
          <h2>English Features</h2>
          <p className="">What You'll Learn</p>
        </div>

        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="features-item">
                <i className="bi bi-book"></i>
                <h3>Grammar Rules</h3>
                <p>Comprehensive grammar lessons covering all essential rules and exceptions.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="features-item">
                <i className="bi bi-chat-square-text"></i>
                <h3>Vocabulary Building</h3>
                <p>Expand your word knowledge with contextual learning and usage examples.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="features-item">
                <i className="bi bi-eye"></i>
                <h3>Reading Skills</h3>
                <p>Improve comprehension and analytical reading abilities.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="features-item">
                <i className="bi bi-pencil"></i>
                <h3>Writing Practice</h3>
                <p>Develop clear, coherent, and effective writing skills.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
              <div className="features-item">
                <i className="bi bi-bar-chart"></i>
                <h3>Progress Tracking</h3>
                <p>Monitor your improvement with detailed analytics and feedback.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
              <div className="features-item">
                <i className="bi bi-award"></i>
                <h3>Certification</h3>
                <p>Earn certificates upon completing course modules and assessments.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
              <div className="features-item">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Personalized Learning</h3>
                <p>Customized learning paths based on your proficiency level and goals.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
              <div className="features-item">
                <i className="bi bi-clock"></i>
                <h3>Flexible Schedule</h3>
                <p>Learn at your own pace with 24/7 access to materials.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default English