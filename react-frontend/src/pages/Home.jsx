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
            

            {/* Mathematics Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/maths.index.png" className="img-fluid" alt="Mathematics Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/math"><button className="category">Mathematics </button></Link>
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
                    <Link to="/math2"><button className="category">Mathematics II</button></Link>
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
            
{/* English Course Card 
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
            
             combine programming courses Card 
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/programming.png" className="img-fluid" alt="Database Management Systems Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/courses"><button className="category">Programming Courses</button></Link>
                  </div>
                  <p className="description">
                    Our comprehensive programming courses are designed to equip learners with essential coding skills and prepare 
                    them for successful careers in software development. 
                    This complete package covers the most in-demand programming languages and fundamental computer science concepts.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;89
                    </div>
                  </div>
                </div>
              </div>
            </div>

              JAVA Course Card 
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/java.jpg" className="img-fluid" alt="Data Structures and Algorithms Course" />
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

             DBMS Course Card 
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/DBMS.png" className="img-fluid" alt="Database Management Systems Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/dbms"><button className="category">Database Management Systems</button></Link>
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

            Competitive Exam Foundation Course Card
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

*/}
          

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

            {/* PDSA Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item">
                <img src="/img/pdsa.jpg" className="img-fluid" alt="Data Structures and Algorithms Course" />
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

            {/* Java Course Card - NEW */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/java.jpg" className="img-fluid" alt="Java Programming Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/courses/java"><button className="category">Java Programming</button></Link>
                  </div>
                  <p className="description">
                    Master Java from basics to advanced OOP, multithreading, collections, and design patterns. 
                    Learn enterprise-level Java development with comprehensive hands-on practice.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;84
                    </div>
                    <span className="badge bg-primary">12 Weeks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Python Course Card - NEW 
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/python.jpg" className="img-fluid" alt="Python Programming Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/courses/python"><button className="category">Python Course</button></Link>
                  </div>
                  <p className="description">
                    Comprehensive Python covering data structures, OOP, file handling, and libraries. 
                    Master Python from basics to advanced concepts including NumPy and Pandas for data analysis.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;78
                    </div>
                    <span className="badge bg-primary">10 Weeks</span>
                  </div>
                </div>
              </div>
            </div>
            */}

            {/* DBMS Course Card - NEW */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/DBMS.png" className="img-fluid" alt="Database Management Systems Course" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/programming/courses/dbms"><button className="category">Database Management Systems Course</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Database Management Systems Hub, where you learn how data is stored,
                    organized, and queried. Explore ER modeling, relational design, SQL fundamentals,
                    normalization, indexing, and transactions through clear notes, quizzes, and hands-on practice.
                    Learn SQL from basic queries to joins, subqueries, indexing, and stored procedures. 
                    Master database management and optimization techniques for real-world applications.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;71
                    </div>
                    <span className="badge bg-primary">12 Weeks</span>
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

            {/* JEE Main Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="300">
              <div className="course-item" style={{ width: '100%' }}>
                {/* Gradient banner instead of image */}
                <div style={{
                  background: 'linear-gradient(135deg, #20c997 0%, #0d6efd 40%, #6610f2 100%)',
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
                    JEE MAIN
                  </span>
                </div>

                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/jee-main"><button className="category">JEE Main</button></Link>
                    <span className="badge bg-primary" style={{ fontSize: '0.75rem' }}>+4 / −1</span>
                  </div>
                  <p className="description">
                    Practice JEE Main questions subject-wise — Physics, Chemistry and Mathematics.
                    Official JEE Main marking scheme applied: +4 for correct, −1 for wrong MCQ, 0 for unattempted.
                    Includes LaTeX rendering and diagram support.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;0
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          {/* SAT Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="400">
              <div className="course-item" style={{ width: '100%' }}>
                {/* Navy-blue College Board inspired gradient banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #003D8F 0%, #0d6efd 45%, #6f42c1 100%)',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute', top: -35, right: -35,
                    width: 110, height: 110, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -25, left: -25,
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                  }} />

                  {/* Section icons */}
                  <div style={{ display: 'flex', gap: '22px', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-calculator-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Math</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-book-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Reading</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-pencil-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Writing</div>
                    </div>
                  </div>

                  {/* Label row */}
                  <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', letterSpacing: '1.5px', fontWeight: 600 }}>
                      SAT PRACTICE
                    </span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        padding: '2px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.35)',
                        letterSpacing: '0.5px',
                      }}>
                        Scholastic Assessment Test
                      </span>
                    </div>
                  </div>
                </div>

                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/sat"><button className="category">SAT</button></Link>
                    <span className="badge bg-success" style={{ fontSize: '0.75rem' }}>+1 / No −ve</span>
                  </div>
                  <p className="description">
                    Practice SAT questions section-wise — Mathematics, Reading, and Writing &amp; Language.
                    SAT marking scheme: +1 for correct, 0 for wrong (no negative marking).
                    Includes diagram support and passage-based questions.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;92
                    </div>
                  </div>
                </div>
              </div>
            </div>



                    {/* GRE Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="500">
              <div className="course-item" style={{ width: '100%' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #6f42c1 0%, #a370f7 55%, #d63384 100%)',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute', top: -35, right: -35,
                    width: 110, height: 110, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -25, left: -25,
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                  }} />

                  {/* Section icons */}
                  <div style={{ display: 'flex', gap: '22px', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-chat-square-text-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Verbal</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-calculator-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Quant</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-pencil-square" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Writing</div>
                    </div>
                  </div>

                  {/* Label row */}
                  <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', letterSpacing: '1.5px', fontWeight: 600 }}>
                      GRE PRACTICE
                    </span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        padding: '2px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.35)',
                        letterSpacing: '0.5px',
                      }}>
                        Graduate Record Examination
                      </span>
                    </div>
                  </div>
                </div>

                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/gre"><button className="category">GRE</button></Link>
                    <span className="badge" style={{ background: '#6f42c1', fontSize: '0.75rem' }}>130&ndash;170 scaled</span>
                  </div>
                  <p className="description">
                    Practice GRE questions section-wise — Verbal Reasoning, Quantitative Reasoning, and Analytical Writing.
                    Official GRE scoring: 130&ndash;170 scaled score per section, no negative marking.
                    Includes full-length mock tests and detailed score analysis.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;92
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* GATE DA Course Card */}
            <div className="col-lg-6 col-md-6 d-flex align-items-stretch mt-4" data-aos="zoom-in" data-aos-delay="600">
              <div className="course-item" style={{ width: '100%' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0f5132 0%, #20c997 55%, #0dcaf0 100%)',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute', top: -35, right: -35,
                    width: 110, height: 110, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -25, left: -25,
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                  }} />

                  {/* Section icons */}
                  <div style={{ display: 'flex', gap: '22px', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-calculator-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Math</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-code-slash" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Programming</div>
                    </div>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                      <i className="bi bi-cpu-fill" style={{ fontSize: '1.8rem' }}></i>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>AI/ML</div>
                    </div>
                  </div>

                  {/* Label row */}
                  <div style={{ zIndex: 1, textAlign: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', letterSpacing: '1.5px', fontWeight: 600 }}>
                      GATE DA PRACTICE
                    </span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.18)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        padding: '2px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.35)',
                        letterSpacing: '0.5px',
                      }}>
                        Data Science &amp; Artificial Intelligence
                      </span>
                    </div>
                  </div>
                </div>

                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/gate-da"><button className="category">GATE DA</button></Link>
                    <span className="badge bg-danger" style={{ fontSize: '0.75rem' }}>MCQ &minus;1/3 negative</span>
                  </div>
                  <p className="description">
                    Practice GATE DA questions section-wise — General Aptitude, Engineering Mathematics,
                    Programming &amp; Data Structures, Database Management &amp; Warehousing, Machine Learning, and AI.
                    Real GATE marking: +1/+2 for correct, &minus;1/3 or &minus;2/3 for wrong MCQs (no penalty for MSQ/NAT).
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;92
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
