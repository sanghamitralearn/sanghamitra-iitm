import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ReadingComprehension = () => {
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
        <h2>Please Login to Access Reading Comprehension Content</h2>
        <p className="lead">You need to be logged in to view Reading Comprehension passages and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/reading-comprehension.png" alt="Reading Comprehension" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Improve Your Reading Skills
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Enhance comprehension, analysis, and critical thinking through engaging reading passages and questions.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Reading Comprehension Sections */}
      <section id="reading-content" className="reading-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Reading Comprehension</h2>
          <p className="">Passages and Exercises</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Fiction Passages */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/fiction-passages.png" className="img-fluid" alt="Fiction Passages" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/fiction"><button className="category">Fiction</button></Link>
                  </div>
                  <p className="description">
                    Engage with short stories and literary passages to improve narrative comprehension.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;56
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Non-Fiction Passages */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/non-fiction-passages.png" className="img-fluid" alt="Non-Fiction Passages" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/non-fiction"><button className="category">Non-Fiction</button></Link>
                  </div>
                  <p className="description">
                    Analyze informational texts, articles, and expository writing for academic comprehension.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;62
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Poetry Analysis */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/poetry-analysis.png" className="img-fluid" alt="Poetry Analysis" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/poetry"><button className="category">Poetry</button></Link>
                  </div>
                  <p className="description">
                    Interpret poems and understand literary devices, themes, and figurative language.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;48
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Types */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/question-types.png" className="img-fluid" alt="Question Types" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/questions"><button className="category">Question Types</button></Link>
                  </div>
                  <p className="description">
                    Master different question formats: main idea, inference, vocabulary, and detail questions.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;51
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Speed Reading */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/speed-reading.png" className="img-fluid" alt="Speed Reading" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/speed"><button className="category">Speed Reading</button></Link>
                  </div>
                  <p className="description">
                    Learn techniques to read faster while maintaining comprehension and retention.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;44
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Analysis */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/critical-analysis.png" className="img-fluid" alt="Critical Analysis" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/reading/critical"><button className="category">Critical Analysis</button></Link>
                  </div>
                  <p className="description">
                    Develop skills to evaluate arguments, identify bias, and analyze author's purpose and tone.
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

      {/* Reading Strategies Section */}
      <section id="strategies" className="strategies section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Reading Strategies</h2>
          <p className="">Effective Techniques</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Comprehension Strategies</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Previewing and predicting</li>
                <li><i className="bi bi-check-circle-fill"></i> Active reading and annotation</li>
                <li><i className="bi bi-check-circle-fill"></i> Summarizing and paraphrasing</li>
                <li><i className="bi bi-check-circle-fill"></i> Making connections and inferences</li>
                <li><i className="bi bi-check-circle-fill"></i> Questioning and clarifying</li>
                <li><i className="bi bi-check-circle-fill"></i> Visualizing and mental imagery</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Question Answering Tips</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Read questions before the passage</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Identify key words in questions</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Find evidence in the text</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Eliminate obviously wrong answers</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Watch for distractors and traps</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Trust your first instinct when unsure</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reading Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Reading Tips</h2>
          <p className="">Improvement Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Active Reading</h4>
                <p>Engage with the text by asking questions, making predictions, and connecting ideas as you read.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Vocabulary Building</h4>
                <p>Keep a vocabulary journal of new words encountered in reading passages.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Practice Regularly</h4>
                <p>Read different types of texts daily to build familiarity with various writing styles and topics.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="tip-box">
                <h4>Time Management</h4>
                <p>Practice reading under timed conditions to improve speed and efficiency.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="tip-box">
                <h4>Context Clues</h4>
                <p>Use surrounding words and sentences to understand unfamiliar vocabulary.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="tip-box">
                <h4>Multiple Readings</h4>
                <p>Read passages multiple times: first for overview, then for details and questions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ReadingComprehension