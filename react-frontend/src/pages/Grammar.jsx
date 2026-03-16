import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Grammar = () => {
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
        <h2>Please Login to Access Grammar Content</h2>
        <p className="lead">You need to be logged in to view Grammar lessons and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/grammar.png" alt="Grammar Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master English Grammar
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Improve your writing and communication skills with comprehensive grammar lessons and exercises.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Grammar Sections */}
      <section id="grammar-content" className="grammar-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Grammar Lessons</h2>
          <p className="">Comprehensive Grammar Topics</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Parts of Speech */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/parts-of-speech.png" className="img-fluid" alt="Parts of Speech" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/parts-of-speech"><button className="category">Parts of Speech</button></Link>
                  </div>
                  <p className="description">
                    Learn about nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions, and interjections.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;52
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sentence Structure */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/sentence-structure.png" className="img-fluid" alt="Sentence Structure" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/sentence-structure"><button className="category">Sentence Structure</button></Link>
                  </div>
                  <p className="description">
                    Understand subject-verb agreement, sentence types, and proper sentence construction.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;48
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tenses */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/tenses.png" className="img-fluid" alt="Tenses" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/tenses"><button className="category">Tenses</button></Link>
                  </div>
                  <p className="description">
                    Master present, past, and future tenses with their perfect and continuous forms.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;61
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Punctuation */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/punctuation.png" className="img-fluid" alt="Punctuation" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/punctuation"><button className="category">Punctuation</button></Link>
                  </div>
                  <p className="description">
                    Learn proper use of commas, periods, semicolons, colons, and other punctuation marks.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;44
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Articles and Determiners */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/articles-determiners.png" className="img-fluid" alt="Articles and Determiners" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/articles"><button className="category">Articles & Determiners</button></Link>
                  </div>
                  <p className="description">
                    Understand when and how to use 'a', 'an', 'the', and other determiners correctly.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;39
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Errors */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/common-errors.png" className="img-fluid" alt="Common Errors" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/grammar/common-errors"><button className="category">Common Errors</button></Link>
                  </div>
                  <p className="description">
                    Identify and avoid common grammatical mistakes in writing and speaking.
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

      {/* Grammar Practice Section */}
      <section id="practice" className="practice section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Grammar Practice</h2>
          <p className="">Interactive Exercises</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Practice Activities</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Fill-in-the-blank exercises</li>
                <li><i className="bi bi-check-circle-fill"></i> Multiple choice questions</li>
                <li><i className="bi bi-check-circle-fill"></i> Sentence correction</li>
                <li><i className="bi bi-check-circle-fill"></i> Error identification</li>
                <li><i className="bi bi-check-circle-fill"></i> Grammar quizzes</li>
                <li><i className="bi bi-check-circle-fill"></i> Writing practice</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Learning Benefits</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Improved writing clarity</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Better communication skills</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Enhanced reading comprehension</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Professional writing ability</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Academic success</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Confidence in English usage</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Grammar Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Grammar Tips</h2>
          <p className="">Quick Reference</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Subject-Verb Agreement</h4>
                <p>The verb must agree with the subject in number. Singular subjects take singular verbs, plural subjects take plural verbs.</p>
                <p><strong>Example:</strong> She <em>runs</em> every morning. (not run)</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Comma Usage</h4>
                <p>Use commas to separate items in a list, after introductory phrases, and to set off non-essential information.</p>
                <p><strong>Example:</strong> After the meeting, we went to lunch.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Tense Consistency</h4>
                <p>Maintain consistent verb tenses within a sentence and paragraph unless there's a logical reason to change.</p>
                <p><strong>Example:</strong> She <em>went</em> to the store and <em>bought</em> some milk.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Grammar