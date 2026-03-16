import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Algebra = () => {
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
        <h2>Please Login to Access Algebra Content</h2>
        <p className="lead">You need to be logged in to view Algebra lessons and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/algebra.png" alt="Algebra Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master Algebra
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Build a strong foundation in algebraic concepts and problem-solving skills.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/math" className="btn-get-started">Back to Math</Link>
          </div>
        </div>
      </section>

      {/* Algebra Sections */}
      <section id="algebra-content" className="algebra-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Algebra Topics</h2>
          <p className="">Comprehensive Algebra Curriculum</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Basic Algebra */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/basic-algebra.png" className="img-fluid" alt="Basic Algebra" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/basic"><button className="category">Basic Algebra</button></Link>
                  </div>
                  <p className="description">
                    Introduction to algebraic expressions, equations, and fundamental operations.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;78
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fractions */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/fractions.png" className="img-fluid" alt="Fractions" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/fractions"><button className="category">Fractions</button></Link>
                  </div>
                  <p className="description">
                    Master fraction operations, simplification, and applications in algebra.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;72
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decimals */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/decimals.png" className="img-fluid" alt="Decimals" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/decimals"><button className="category">Decimals</button></Link>
                  </div>
                  <p className="description">
                    Learn decimal operations, conversions, and their relationship to fractions.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;69
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Linear Equations */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/linear-equations.png" className="img-fluid" alt="Linear Equations" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/linear"><button className="category">Linear Equations</button></Link>
                  </div>
                  <p className="description">
                    Solve and graph linear equations, understand slope and intercepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;64
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quadratic Equations */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/quadratic-equations.png" className="img-fluid" alt="Quadratic Equations" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/quadratic"><button className="category">Quadratic Equations</button></Link>
                  </div>
                  <p className="description">
                    Master quadratic formula, factoring, and solving quadratic equations.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;58
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Functions */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/functions.png" className="img-fluid" alt="Functions" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/algebra/functions"><button className="category">Functions</button></Link>
                  </div>
                  <p className="description">
                    Understand function notation, domain, range, and various function types.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;55
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Algebra Practice Section */}
      <section id="practice" className="practice section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Algebra Practice</h2>
          <p className="">Interactive Exercises</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Practice Areas</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Solving equations step-by-step</li>
                <li><i className="bi bi-check-circle-fill"></i> Graphing linear and quadratic functions</li>
                <li><i className="bi bi-check-circle-fill"></i> Word problems and applications</li>
                <li><i className="bi bi-check-circle-fill"></i> Factoring and simplification</li>
                <li><i className="bi bi-check-circle-fill"></i> Systems of equations</li>
                <li><i className="bi bi-check-circle-fill"></i> Algebraic proofs and reasoning</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Learning Benefits</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Improved problem-solving skills</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Better logical thinking and reasoning</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Foundation for advanced mathematics</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Enhanced analytical abilities</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Preparation for standardized tests</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Real-world application skills</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Algebra Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Algebra Tips</h2>
          <p className="">Study Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Master the Basics</h4>
                <p>Ensure you have a solid understanding of arithmetic operations before moving to algebraic concepts.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Practice Regularly</h4>
                <p>Solve algebra problems daily to build fluency and confidence with different problem types.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Show Your Work</h4>
                <p>Always write out each step clearly to avoid mistakes and make it easier to check your work.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="tip-box">
                <h4>Check Your Answers</h4>
                <p>Substitute your solutions back into the original equations to verify they are correct.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="tip-box">
                <h4>Use Visual Aids</h4>
                <p>Graph equations and use diagrams to better understand algebraic relationships.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="tip-box">
                <h4>Learn from Mistakes</h4>
                <p>Analyze errors in your work to understand where you went wrong and how to improve.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Algebra