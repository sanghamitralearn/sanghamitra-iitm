import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Programming = () => {
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
        <h2>Please Login to Access Programming Content</h2>
        <p className="lead">You need to be logged in to view Programming course materials and assessments.</p>
        <Link to="/login" className="btn btn-primary btn-lg mt-3">Login Now</Link>
      </div>
    )
  }

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/Programming.png" alt="Programming Learning" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">
            Master Programming and Computational Thinking
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Learn to think computationally and develop programming skills with hands-on coding exercises and projects.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/programming/python" className="btn-get-started">Start Learning</Link>
          </div>
        </div>
      </section>

      {/* Programming Sections */}
      <section id="programming-content" className="programming-content section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Programming</h2>
          <p className="">Comprehensive Programming Learning Resources</p>
        </div>

        <div className="container">
          <div className="row">
            {/* Python Basics Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/python-basics.png" className="img-fluid" alt="Python Basics" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/python"><button className="category">Python Basics</button></Link>
                  </div>
                  <p className="description">
                    Learn Python programming fundamentals including syntax, data types, and basic programming concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Computational Thinking Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/computational-thinking.png" className="img-fluid" alt="Computational Thinking" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/computational-thinking"><button className="category">Computational Thinking</button></Link>
                  </div>
                  <p className="description">
                    Develop problem-solving skills through decomposition, pattern recognition, and algorithmic thinking.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;72
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Structures Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-lg-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/data-structures.png" className="img-fluid" alt="Data Structures" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/data-structures"><button className="category">Data Structures</button></Link>
                  </div>
                  <p className="description">
                    Master fundamental data structures like arrays, lists, stacks, queues, and trees.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;54
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithms Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item">
                <img src="/img/algorithms.png" className="img-fluid" alt="Algorithms" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/algorithms"><button className="category">Algorithms</button></Link>
                  </div>
                  <p className="description">
                    Learn algorithm design, analysis, and implementation techniques for efficient problem solving.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;49
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Web Development Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item">
                <img src="/img/web-development.png" className="img-fluid" alt="Web Development" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/web-development"><button className="category">Web Development</button></Link>
                  </div>
                  <p className="description">
                    Build interactive websites using HTML, CSS, JavaScript, and modern web frameworks.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;61
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Section */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item">
                <img src="/img/database.png" className="img-fluid" alt="Database" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/database"><button className="category">Database</button></Link>
                  </div>
                  <p className="description">
                    Learn database design, SQL, and data management techniques for applications.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;45
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programming Features Section */}
      <section id="features" className="features section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Programming Features</h2>
          <p className="">What You'll Learn</p>
        </div>

        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="100">
              <div className="features-item">
                <i className="bi bi-code"></i>
                <h3>Coding Skills</h3>
                <p>Develop proficiency in writing clean, efficient, and maintainable code.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="200">
              <div className="features-item">
                <i className="bi bi-puzzle"></i>
                <h3>Problem Solving</h3>
                <p>Enhance logical thinking and systematic approaches to complex problems.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="300">
              <div className="features-item">
                <i className="bi bi-gear"></i>
                <h3>Software Development</h3>
                <p>Learn software development lifecycle and best practices.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="400">
              <div className="features-item">
                <i className="bi bi-laptop"></i>
                <h3>Hands-on Practice</h3>
                <p>Extensive coding exercises and real-world project examples.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="500">
              <div className="features-item">
                <i className="bi bi-award"></i>
                <h3>Industry Standards</h3>
                <p>Follow industry best practices and coding standards.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="600">
              <div className="features-item">
                <i className="bi bi-lightbulb"></i>
                <h3>Creative Solutions</h3>
                <p>Develop innovative approaches to software challenges.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="700">
              <div className="features-item">
                <i className="bi bi-person-lines-fill"></i>
                <h3>Collaborative Learning</h3>
                <p>Work on team projects and learn version control systems.</p>
              </div>
            </div>

            <div className="col-lg-3 col-md-4" data-aos="fade-up" data-aos-delay="800">
              <div className="features-item">
                <i className="bi bi-clock"></i>
                <h3>Project-Based</h3>
                <p>Learn through building real applications and solving practical problems.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programming Languages Section */}
      <section id="languages" className="languages section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Programming Languages</h2>
          <p className="">Languages You'll Learn</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-right">
              <h3>Core Languages</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-check-circle-fill"></i> <strong>Python:</strong> Versatile language for data science, web development, and automation</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>JavaScript:</strong> Essential for web development and interactive applications</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>HTML/CSS:</strong> Foundation for web page structure and styling</li>
                <li><i className="bi bi-check-circle-fill"></i> <strong>SQL:</strong> Database querying and management</li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <h3>Development Skills</h3>
              <ul className="list-unstyled">
                <li><i className="bi bi-exclamation-triangle-fill"></i> Version control with Git</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Debugging and testing techniques</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Code optimization and performance</li>
                <li><i className="bi bi-exclamation-triangle-fill"></i> Software architecture principles</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Career Opportunities Section */}
      <section id="careers" className="careers section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Career Opportunities</h2>
          <p className="">Programming Career Paths</p>
        </div>

        <div className="container">
          <div className="row">
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
              <div className="career-item">
                <i className="bi bi-laptop"></i>
                <h4>Software Developer</h4>
                <p>Design, develop, and maintain software applications and systems.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
              <div className="career-item">
                <i className="bi bi-graph-up"></i>
                <h4>Data Analyst</h4>
                <p>Analyze data to extract insights and support business decisions.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
              <div className="career-item">
                <i className="bi bi-globe"></i>
                <h4>Web Developer</h4>
                <p>Create and maintain websites and web applications.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="400">
              <div className="career-item">
                <i className="bi bi-database"></i>
                <h4>Database Administrator</h4>
                <p>Manage and optimize database systems for organizations.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="500">
              <div className="career-item">
                <i className="bi bi-shield-check"></i>
                <h4>Cybersecurity Analyst</h4>
                <p>Protect systems and networks from security threats.</p>
              </div>
            </div>
            <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="600">
              <div className="career-item">
                <i className="bi bi-robot"></i>
                <h4>AI/Machine Learning Engineer</h4>
                <p>Develop intelligent systems and machine learning models.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Programming