import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Arithmetic = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/session-info`, { withCredentials: true })
      .then(res => {
        if (res.data && res.data.email) setUser(res.data)
        else navigate('/login', { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
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
        <h2>Please Login to Access Arithmetic Content</h2>
        <p className="lead">You need to be logged in to view Arithmetic lessons and exercises.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/arithmetic.png" alt="Arithmetic Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master Arithmetic
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Build a strong foundation in arithmetic operations and problem-solving skills.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/math" className="btn-get-started">Back to Math</Link>
          </div>
        </div>
      </section>

      {/* Arithmetic Sections */}
      <section id="arithmetic-content" className="arithmetic-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Arithmetic Topics</h2>
          <p className="">Comprehensive Arithmetic Curriculum</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Addition */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/addition.png" className="img-fluid" alt="Addition" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/addition"><button className="category">Addition</button></Link>
                  </div>
                  <p className="description">
                    Master addition operations with whole numbers, decimals, and fractions.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;85
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtraction */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/subtraction.png" className="img-fluid" alt="Subtraction" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/subtraction"><button className="category">Subtraction</button></Link>
                  </div>
                  <p className="description">
                    Learn subtraction techniques for various number types and applications.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;82
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Multiplication */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/multiplication.png" className="img-fluid" alt="Multiplication" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/multiplication"><button className="category">Multiplication</button></Link>
                  </div>
                  <p className="description">
                    Master multiplication facts and techniques for all number types.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;78
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Division */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/division.png" className="img-fluid" alt="Division" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/division"><button className="category">Division</button></Link>
                  </div>
                  <p className="description">
                    Learn division methods, remainders, and applications in problem-solving.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;75
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dealing with Negative Signs */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/negative-numbers.png" className="img-fluid" alt="Negative Numbers" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/negative"><button className="category">Negative Numbers</button></Link>
                  </div>
                  <p className="description">
                    Understand operations with negative numbers and their applications.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;70
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratio, Proportion, Percentage */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/ratio-percentage.png" className="img-fluid" alt="Ratio and Percentage" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/subjects/arithmetic/ratio"><button className="category">Ratio & Percentage</button></Link>
                  </div>
                  <p className="description">
                    Master ratios, proportions, and percentage calculations for real-world problems.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Arithmetic Practice Section */}
      <section id="practice" className="practice section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Arithmetic Practice</h2>
          <p className="">Interactive Exercises</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Practice Areas</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> Basic operations with whole numbers</li>
                <li><i className="bi bi-check-circle-fill"></i> Decimal and fraction arithmetic</li>
                <li><i className="bi bi-check-circle-fill"></i> Word problems and applications</li>
                <li><i className="bi bi-check-circle-fill"></i> Mental math strategies</li>
                <li><i className="bi bi-check-circle-fill"></i> Estimation and rounding</li>
                <li><i className="bi bi-check-circle-fill"></i> Problem-solving techniques</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Learning Benefits</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Strong foundation for advanced math</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Improved calculation speed and accuracy</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Better number sense and estimation</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Enhanced problem-solving abilities</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Preparation for standardized tests</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Real-world application skills</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Arithmetic Tips Section */}
      <section id="tips" className="tips section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Arithmetic Tips</h2>
          <p className="">Study Strategies</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="tip-box">
                <h4>Master the Basics</h4>
                <p>Ensure you have a solid understanding of number sense before moving to complex operations.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="tip-box">
                <h4>Practice Regularly</h4>
                <p>Solve arithmetic problems daily to build speed and accuracy with calculations.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="tip-box">
                <h4>Use Mental Math</h4>
                <p>Develop mental calculation strategies to improve number sense and speed.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="400">
              <div className="tip-box">
                <h4>Check Your Work</h4>
                <p>Always verify your answers using inverse operations or estimation.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="500">
              <div className="tip-box">
                <h4>Learn Shortcuts</h4>
                <p>Master arithmetic shortcuts and tricks to solve problems more efficiently.</p>
              </div>
            </div>
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="600">
              <div className="tip-box">
                <h4>Apply to Real Life</h4>
                <p>Practice arithmetic in everyday situations like shopping, cooking, and budgeting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Arithmetic