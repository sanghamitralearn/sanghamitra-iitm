import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Writing = () => {
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
        <h2>Please Login to Access Writing Content</h2>
        <p className="lead">You need to be logged in to view Writing lessons and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/writing.png" alt="Writing Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Develop Your Writing Skills
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Learn to write clearly, coherently, and effectively with guided exercises and feedback.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Writing Sections */}
      <section id="writing-content" className="writing-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Writing Skills</h2>
          <p className="">Writing Development Resources</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Essay Writing */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/essay-writing.png" className="img-fluid" alt="Essay Writing" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/essay"><button className="category">Essay Writing</button></Link>
                  </div>
                  <p className="description">
                    Learn to structure and write effective essays with clear thesis statements and supporting arguments.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;63
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Creative Writing */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/creative-writing.png" className="img-fluid" alt="Creative Writing" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/creative"><button className="category">Creative Writing</button></Link>
                  </div>
                  <p className="description">
                    Explore fiction, poetry, and narrative writing to develop your creative expression.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;57
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Writing */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/academic-writing.png" className="img-fluid" alt="Academic Writing" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/academic"><button className="category">Academic Writing</button></Link>
                  </div>
                  <p className="description">
                    Master research papers, reports, and formal writing with proper citations and structure.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;52
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Writing */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/business-writing.png" className="img-fluid" alt="Business Writing" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/business"><button className="category">Business Writing</button></Link>
                  </div>
                  <p className="description">
                    Learn professional communication including emails, reports, proposals, and business correspondence.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;48
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grammar and Style */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/grammar-style.png" className="img-fluid" alt="Grammar and Style" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/grammar"><button className="category">Grammar & Style</button></Link>
                  </div>
                  <p className="description">
                    Improve sentence structure, word choice, and overall writing style and clarity.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;61
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Writing Feedback */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/writing-feedback.png" className="img-fluid" alt="Writing Feedback" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/writing/feedback"><button className="category">Writing Feedback</button></Link>
                  </div>
                  <p className="description">
                    Submit your writing for personalized feedback and improvement suggestions.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;72
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Process Section */}
      <section id="process" className="process section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Writing Process</h2>
          <p className="">Step-by-Step Guide</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>The Writing Process</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> <strong>Pre-writing:</strong> Brainstorming, researching, and planning</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Drafting:</strong> Creating the first version of your writing</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Revising:</strong> Improving content, structure, and organization</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Editing:</strong> Correcting grammar, spelling, and punctuation</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Publishing:</strong> Sharing your final work with an audience</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Writing Tips</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Know your audience and purpose</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Create clear, focused thesis statements</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Use specific examples and evidence</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Vary sentence structure and length</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Read your work aloud for flow</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Take breaks between drafts</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Writing Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Writing Tips</h2>
          <p className="">Improvement Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Start with Outlines</h4>
                <p>Create detailed outlines to organize your thoughts and ensure logical flow before writing.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Write Regularly</h4>
                <p>Practice writing daily, even if just for a few minutes, to build fluency and confidence.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Read Widely</h4>
                <p>Study different writing styles and genres to expand your vocabulary and techniques.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="tip-box">
                <h4>Seek Feedback</h4>
                <p>Share your writing with others and be open to constructive criticism and suggestions.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="tip-box">
                <h4>Edit Ruthlessly</h4>
                <p>Be willing to cut unnecessary words, sentences, or even entire paragraphs for clarity.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="tip-box">
                <h4>Use Active Voice</h4>
                <p>Prefer active voice over passive voice for stronger, more engaging writing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Writing