import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Statistics = () => {
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
        <h2>Please Login to Access Statistics Content</h2>
        <p className="lead">You need to be logged in to view Statistics course materials and assessments.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/Statistics.png" alt="Statistics Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master Statistics and Data Analysis
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Learn to collect, analyze, and interpret data to make informed decisions and draw meaningful conclusions.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/statistics/introduction" className="btn-get-started">Start Learning</Link>
          </div>
        </div>
      </section>

      {/* Statistics Sections */}
      <section id="statistics-content" className="statistics-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Statistics</h2>
          <p className="">Comprehensive Statistics Learning Resources</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Introduction Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/statistics-intro.png" className="img-fluid" alt="Introduction to Statistics" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/introduction"><button className="category">Introduction</button></Link>
                  </div>
                  <p className="description">
                    Learn the fundamentals of statistics, data types, and basic statistical concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;48
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Descriptive Statistics Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/descriptive-stats.png" className="img-fluid" alt="Descriptive Statistics" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/descriptive"><button className="category">Descriptive Statistics</button></Link>
                  </div>
                  <p className="description">
                    Master measures of central tendency, dispersion, and data visualization techniques.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;55
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/probability.png" className="img-fluid" alt="Probability" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/probability"><button className="category">Probability</button></Link>
                  </div>
                  <p className="description">
                    Understand probability theory, distributions, and their applications in statistics.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;42
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inferential Statistics Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/inferential-stats.png" className="img-fluid" alt="Inferential Statistics" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/inferential"><button className="category">Inferential Statistics</button></Link>
                  </div>
                  <p className="description">
                    Learn hypothesis testing, confidence intervals, and statistical inference methods.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;39
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Regression Analysis Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/regression-analysis.png" className="img-fluid" alt="Regression Analysis" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/regression"><button className="category">Regression Analysis</button></Link>
                  </div>
                  <p className="description">
                    Master linear and multiple regression techniques for predictive modeling.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;46
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Visualization Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/data-visualization.png" className="img-fluid" alt="Data Visualization" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics/visualization"><button className="category">Data Visualization</button></Link>
                  </div>
                  <p className="description">
                    Learn to create effective charts, graphs, and visualizations for data communication.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;51
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Features Section */}
      <section id="features" className="features section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Statistics Features</h2>
          <p className="">What You'll Learn</p>
        </div>

        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="features-item">
                <i className="bi bi-bar-chart"></i>
                <h3>Data Analysis</h3>
                <p>Learn to collect, organize, and analyze data effectively.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="features-item">
                <i className="bi bi-pie-chart"></i>
                <h3>Statistical Methods</h3>
                <p>Master various statistical techniques and their applications.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="features-item">
                <i className="bi bi-calculator"></i>
                <h3>Probability Theory</h3>
                <p>Understand probability concepts and their role in statistics.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="features-item">
                <i className="bi bi-graph-up"></i>
                <h3>Data Interpretation</h3>
                <p>Learn to interpret statistical results and draw meaningful conclusions.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
              <div className="features-item">
                <i className="bi bi-award"></i>
                <h3>Real-world Applications</h3>
                <p>Apply statistical methods to solve real-world problems.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
              <div className="features-item">
                <i className="bi bi-lightbulb"></i>
                <h3>Critical Thinking</h3>
                <p>Develop analytical skills for evaluating data and statistical claims.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
              <div className="features-item">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Research Methods</h3>
                <p>Learn proper research design and data collection techniques.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
              <div className="features-item">
                <i className="bi bi-clock"></i>
                <h3>Software Skills</h3>
                <p>Gain proficiency in statistical software and tools.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Applications Section */}
      <section id="applications" className="applications section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Statistics Applications</h2>
          <p className="">Where Statistics is Used</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Fields Using Statistics</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> <strong>Business:</strong> Market research, quality control, financial analysis</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Healthcare:</strong> Clinical trials, epidemiology, public health</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Science:</strong> Experimental design, data analysis, research</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Social Sciences:</strong> Surveys, behavioral studies, policy analysis</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>Technology:</strong> Machine learning, data mining, A/B testing</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Skills You'll Develop</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Data collection and cleaning</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Statistical analysis and interpretation</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Hypothesis testing and inference</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Data visualization and communication</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Critical evaluation of statistical claims</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Statistics
