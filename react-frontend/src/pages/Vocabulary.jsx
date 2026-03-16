import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Vocabulary = () => {
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
        <h2>Please Login to Access Vocabulary Content</h2>
        <p className="lead">You need to be logged in to view Vocabulary lessons and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/vocabulary.png" alt="Vocabulary Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Expand Your Vocabulary
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Build a rich vocabulary with word lists, definitions, and contextual usage examples.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/english" className="btn-get-started">Back to English</Link>
          </div>
        </div>
      </section>

      {/* Vocabulary Sections */}
      <section id="vocabulary-content" className="vocabulary-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Vocabulary Building</h2>
          <p className="">Word Learning Resources</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Word Lists */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/word-lists.png" className="img-fluid" alt="Word Lists" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/word-lists"><button className="category">Word Lists</button></Link>
                  </div>
                  <p className="description">
                    Organized word lists by theme, difficulty level, and frequency of use.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;65
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Word Definitions */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/word-definitions.png" className="img-fluid" alt="Word Definitions" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/definitions"><button className="category">Word Definitions</button></Link>
                  </div>
                  <p className="description">
                    Clear, concise definitions with examples and usage notes for each word.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;58
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Synonyms and Antonyms */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/synonyms-antonyms.png" className="img-fluid" alt="Synonyms and Antonyms" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/synonyms"><button className="category">Synonyms & Antonyms</button></Link>
                  </div>
                  <p className="description">
                    Expand your word choices with synonyms and understand contrasts with antonyms.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;52
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextual Usage */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/contextual-usage.png" className="img-fluid" alt="Contextual Usage" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/context"><button className="category">Contextual Usage</button></Link>
                  </div>
                  <p className="description">
                    Learn how words are used in different contexts with real-life examples.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;49
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Word Roots and Etymology */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/word-roots.png" className="img-fluid" alt="Word Roots" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/roots"><button className="category">Word Roots</button></Link>
                  </div>
                  <p className="description">
                    Understand word origins and roots to help remember and understand new words.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;44
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vocabulary Games */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/vocabulary-games.png" className="img-fluid" alt="Vocabulary Games" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english/vocabulary/games"><button className="category">Vocabulary Games</button></Link>
                  </div>
                  <p className="description">
                    Interactive games and quizzes to make vocabulary learning fun and engaging.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;71
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vocabulary Practice Section */}
      <section id="practice" className="practice section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Vocabulary Practice</h2>
          <p className="">Interactive Learning</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Practice Methods</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Flashcards and spaced repetition</li>
                <li><i className="bi bi-check-circle-fill"></i> Fill-in-the-blank exercises</li>
                <li><i className="bi bi-check-circle-fill"></i> Matching games</li>
                <li><i className="bi bi-check-circle-fill"></i> Crossword puzzles</li>
                <li><i className="bi bi-check-circle-fill"></i> Word association activities</li>
                <li><i className="bi bi-check-circle-fill"></i> Context-based quizzes</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Learning Benefits</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Improved reading comprehension</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Enhanced writing skills</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Better communication ability</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Academic and test success</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Professional vocabulary</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Confidence in language use</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vocabulary Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Vocabulary Tips</h2>
          <p className="">Effective Learning Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Learn in Context</h4>
                <p>Always learn new words in sentences or paragraphs, not in isolation. This helps you understand how to use them correctly.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Use Spaced Repetition</h4>
                <p>Review words at increasing intervals to move them from short-term to long-term memory.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Create Word Associations</h4>
                <p>Connect new words to words you already know, images, or personal experiences to make them more memorable.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="tip-box">
                <h4>Read Widely</h4>
                <p>Encounter new words in different contexts through reading books, articles, and other materials.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="tip-box">
                <h4>Use New Words</h4>
                <p>Practice using new vocabulary in your speaking and writing to reinforce learning and make words active.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="tip-box">
                <h4>Learn Word Families</h4>
                <p>Study related words (nouns, verbs, adjectives) together to understand word patterns and relationships.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Vocabulary