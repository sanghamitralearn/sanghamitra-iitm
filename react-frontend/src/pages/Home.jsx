import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <main className="main" style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <img src="/img/Index Page Images.png" alt="" data-aos="fade-in" />
        
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100" className="">
            Learning Today,<br />Leading Tomorrow
          </h2>
          <p data-aos="fade-up" data-aos-delay="200">
            Educating Minds, Empowering Futures.
          </p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/about" className="btn-get-started">Learn More</Link>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="courses section">
        {/* Section Title */}
        <div className="container section-title" data-aos="fade-up">
          <h2>Courses</h2>
          <p className="">Popular Courses</p>
        </div>

        <div className="container">
          <div className="row">
            {/* English Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/english.index.png" className="img-fluid" alt="English Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/english"><button className="category">English</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our English Learning Hub, where language mastery meets personalized learning. 
                    Whether you're a beginner or an advanced learner, our comprehensive resources and interactive 
                    lessons are designed to enhance your English proficiency. Join our community of learners and 
                    embark on an enriching journey towards fluency and confidence in English communication.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;65
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mathematics Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/maths.index.png" className="img-fluid" alt="Mathematics Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/math"><button className="category">Mathematics</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Mathematics Hub, where numbers come alive and logic reigns supreme. 
                    Dive into our comprehensive resources and interactive lessons designed to demystify 
                    mathematical concepts. Whether you're tackling algebra or mastering calculus, discover 
                    the beauty and power of mathematics with us.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;42
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Math 2 Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Math_2.png" className="img-fluid" alt="Math 2 Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/math2"><button className="category">Maths 2</button></Link>
                  </div>
                  <p className="description">
                    This section is for testing and validating IITM Math 2 quiz questions. 
                    It ensures that all questions, options, and answers are displayed correctly 
                    and function as expected. The test also includes practice quizzes designed 
                    to match the same difficulty and conceptual level as the original IITM Math 2 course quizzes.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Statistics.png" className="img-fluid" alt="Statistics Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics"><button className="category">Statistics</button></Link>
                  </div>
                  <p className="description">
                    Learn the basics and test your statistics knowledge.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics 2 Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Stats_2.png" className="img-fluid" alt="Statistics 2 Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/statistics2"><button className="category">Statistics II</button></Link>
                  </div>
                  <p className="description">
                    This section is for testing and validating IITM Statistics 2 quiz questions. 
                    It ensures that all questions, options, and answers are displayed correctly 
                    and function as expected. The test also includes practice quizzes designed 
                    to match the same difficulty and conceptual level as the original IITM Statistics 2 course quizzes.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;68
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CT Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/CT.png" className="img-fluid" alt="Computational Thinking Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/computational-thinking"><button className="category">Computational Thinking</button></Link>
                  </div>
                  <p className="description">
                    Computational Thinking is a problem-solving approach that involves breaking down 
                    complex problems into smaller, manageable parts and designing step-by-step solutions 
                    that can be executed by a computer. It includes key skills such as decomposition 
                    (dividing problems), pattern recognition (finding similarities), abstraction 
                    (focusing on important details), and algorithm design (creating clear instructions).
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;89
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Programming Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Programming.png" className="img-fluid" alt="Programming Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming"><button className="category">Programming</button></Link>
                  </div>
                  <p className="description">
                    Learn the basics of programming through computational thinking and Python. 
                    This beginner-friendly course covers key concepts like logic, algorithms, 
                    loops, and functions, helping you develop problem-solving skills for coding. 
                    No prior experience needed!
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;38
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDSA Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/pdsa.png" className="img-fluid" alt="Data Structures and Algorithms Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/pdsa"><button className="category">Data Structures and Algorithms</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Python Data Structures & Algorithms Hub, where programming meets 
                    efficient problem-solving. Master Python fundamentals, explore data structures, 
                    and implement powerful algorithms through hands-on coding exercises and interactive lessons.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;89
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DBMS Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/DBMS.png" className="img-fluid" alt="Database Management Systems Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/dbms"><button className="category">Database Management Systems</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Database Management Systems Hub, where you learn how data is stored,
                    organized, and queried. Explore ER modeling, relational design, SQL fundamentals,
                    normalization, indexing, and transactions through clear notes, quizzes, and hands-on practice.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;89
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* JAVA Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/java.png" className="img-fluid" alt="Data Structures and Algorithms Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/JAVA"><button className="category">JAVA</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Java Programming Hub, where you start your journey from basic syntax to 
                    advanced application development. Master variables, control flow, OOP concepts, data structures, 
                    file I/O, and JDBC through clear explanations, challenging quizzes, and real-world projects.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;89
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitive Exam Foundation Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/competitive-exam-foundation.png" className="img-fluid" alt="Competitive Exam Foundation Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/competitive-exam-foundation"><button className="category">Competitive Exam Foundation</button></Link>
                  </div>
                  <p className="description">
                    Master the fundamentals required for various competitive exams including banking, SSC, railways, and state-level examinations. Our comprehensive course covers quantitative aptitude, logical reasoning, verbal ability, and general awareness. Get access to topic-wise modules, practice tests, time management strategies, and exam-specific preparation techniques designed to help you crack competitive exams with confidence.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;56
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* JEE Advanced Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item" style={{ width: '100%' }}>
                {/* Gradient banner instead of image */}
                <div style={{
                  background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 40%, #dc3545 100%)',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', gap: '18px' }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-lightning-charge-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Physics</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-eyedropper" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Chemistry</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-calculator-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Mathematics</div>
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', letterSpacing: '1px' }}>
                    JEE ADVANCED 2024 &amp; 2025
                  </span>
                </div>

                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/jee"><button className="category">JEE Advanced</button></Link>
                    <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>+3 / −1</span>
                  </div>
                  <p className="description">
                    Practice JEE Advanced 2024 &amp; 2025 questions subject-wise — Physics, Chemistry and Mathematics.
                    Full JEE marking scheme applied: +3 for correct, −1 for wrong MCQ, 0 for unattempted.
                    Includes LaTeX rendering and diagram support.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;95
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-up" data-aos-delay="100">
              <img src="/img/Index page Image2.png" className="img-fluid" alt="About Sanghamitra Learning" />
            </div>

            <div className="col-lg-6 order-2 order-lg-1 content" data-aos="fade-up" data-aos-delay="200">
              <h3>Empowering Marginalized Learners: Our Mission to Democratize Education</h3>
              <p className="fst-italic">
                Breaking Barriers, Unlocking Potential
              </p>
              <ul>
                <li><i className="bi bi-check-circle"></i> <span>On our platform, we are dedicated to democratizing education by breaking down barriers and providing equal opportunities for all.</span></li>
                <li><i className="bi bi-check-circle"></i> <span>Our primary goal is to offer high-quality education to marginalized students who may otherwise lack access to competitive advantages.</span></li>
                <li><i className="bi bi-check-circle"></i> <span>Through our platform, we aim to bridge the gap by providing resources, support, and opportunities for personal and academic growth. By doing so, we strive to empower individuals from underserved communities to reach their full potential and pursue their dreams. Join us in our mission to create a more inclusive and equitable educational landscape for all learners.</span></li>
              </ul>
              <Link to="/about" className="read-more"><span>Read More</span><i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="section why-us">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="why-box">
                <h3>Why Choose Our Products?</h3>
                <p>
                  Innovative AI-driven Feedback: Our platform offers personalized responses tailored to each individual test-taker's performance. Leveraging advanced algorithms, we provide specific feedback to maximize improvement and enhance learning outcomes. Experience the power of tailored guidance on your educational journey.
                </p>
                <div className="text-center">
                  <Link to="/about" className="more-btn"><span>Learn More</span> <i className="bi bi-chevron-right"></i></Link>
                </div>
              </div>
            </div>

            <div className="col-lg-8 d-flex align-items-stretch">
              <div className="row gy-4" data-aos="fade-up" data-aos-delay="200">
                <div className="col-xl-4">
                  <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                    <i className="bi bi-clipboard-data"></i>
                    <h4>Innovative AI-driven Feedback</h4>
                    <p>Unlock your potential with AI-driven Feedback, ensuring personalized guidance for optimal improvement.</p>
                  </div>
                </div>

                <div className="col-xl-4" data-aos="fade-up" data-aos-delay="300">
                  <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                    <i className="bi bi-gem"></i>
                    <h4>Quality Content</h4>
                    <p> Explore our platform's treasure trove of Quality Content, curated to enrich your learning experience.</p>
                  </div>
                </div>

                <div className="col-xl-4" data-aos="fade-up" data-aos-delay="400">
                  <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                    <i className="bi bi-inboxes"></i>
                    <h4>Myriad Assessments</h4>
                    <p>Dive into Myriad Assessments, offering diverse challenges to gauge and enhance your knowledge.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
