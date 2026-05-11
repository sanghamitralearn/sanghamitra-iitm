import React from 'react';
import { Link } from 'react-router-dom';

const CompetitiveExamFoundation = () => {
  // Course data array for better maintainability
  const courses = [
    {
      id: 1,
      title: "Physics",
      image: "/img/physics-competitive.png",
      link: "/competitive-exam-foundation/physics",
      description: "Master Physics concepts for competitive exams including JEE, NEET, and other entrance examinations. Covering mechanics, thermodynamics, electromagnetism, optics, and modern physics with problem-solving techniques and numerical practice.",
      likes: 67,
      aosDelay: "100"
    },
    {
      id: 2,
      title: "Mathematics",
      image: "/img/mathematics-competitive.png",
      link: "/competitive-exam-foundation/mathematics",
      description: "Build strong mathematical foundations for banking, SSC, railways, and other competitive exams. Comprehensive coverage of arithmetic, algebra, geometry, trigonometry, calculus, and data interpretation with shortcut techniques.",
      likes: 89,
      aosDelay: "100"
    },
    {
      id: 3,
      title: "Science",
      image: "/img/science-competitive.png",
      link: "/competitive-exam-foundation/science",
      description: "Comprehensive Science module covering Physics, Chemistry, and Biology for various competitive exams. Perfect for SSC, Railways, NDA, CDS, and state-level examinations with concept clarity and practice questions.",
      likes: 72,
      aosDelay: "100"
    },
    {
      id: 4,
      title: "Logical Reasoning",
      image: "/img/logical-reasoning.png",
      link: "/competitive-exam-foundation/logical-reasoning",
      description: "Enhance your analytical and logical thinking skills essential for competitive exams. Master verbal and non-verbal reasoning, puzzles, seating arrangements, syllogisms, blood relations, and critical thinking.",
      likes: 94,
      aosDelay: "200"
    },
    {
      id: 5,
      title: "Quantitative Aptitude",
      image: "/img/quantitative-aptitude.png",
      link: "/competitive-exam-foundation/quantitative-aptitude",
      description: "Master quantitative aptitude for banking, SSC, and other competitive exams. Speed maths, number systems, percentages, profit-loss, time-speed-distance, averages, ratios, and advanced problem-solving techniques.",
      likes: 88,
      aosDelay: "200"
    },
    {
      id: 6,
      title: "English Language",
      image: "/img/english-competitive.png",
      link: "/competitive-exam-foundation/english",
      description: "Comprehensive English module for competitive exams covering grammar, vocabulary, reading comprehension, cloze tests, para jumbles, and error detection. Essential for banking, SSC, and management entrance exams.",
      likes: 76,
      aosDelay: "200"
    },
    {
      id: 7,
      title: "General Awareness",
      image: "/img/general-awareness.png",
      link: "/competitive-exam-foundation/general-awareness",
      description: "Stay updated with current affairs, history, geography, polity, economics, and static GK for competitive exams. Regular updates and comprehensive coverage for banking, SSC, Railways, and state-level exams.",
      likes: 83,
      aosDelay: "300"
    },
    {
      id: 8,
      title: "Chemistry",
      image: "/img/chemistry-competitive.png",
      link: "/competitive-exam-foundation/chemistry",
      description: "Master Chemistry concepts for JEE, NEET, and other competitive exams. Physical chemistry, organic chemistry, inorganic chemistry, and problem-solving techniques with numerical practice.",
      likes: 61,
      aosDelay: "300"
    },
    {
      id: 9,
      title: "Biology",
      image: "/img/biology-competitive.png",
      link: "/competitive-exam-foundation/biology",
      description: "Comprehensive Biology for NEET and other medical entrance exams. Covering botany, zoology, human physiology, genetics, ecology, and biotechnology with NCERT-based approach.",
      likes: 79,
      aosDelay: "300"
    }
  ];

  return (
    <main className="main">
      {/* Page Title Section */}
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Competitive Exam Foundation Course</h1>
                <p className="mb-0">
                  Master the fundamentals required for various competitive exams including banking, SSC, railways, 
                  JEE, NEET, and state-level examinations. Our comprehensive course covers quantitative aptitude, 
                  logical reasoning, verbal ability, general awareness, physics, chemistry, mathematics, and biology. 
                  Get access to topic-wise modules, practice tests, time management strategies, and exam-specific 
                  preparation techniques designed to help you crack competitive exams with confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">Competitive Exam Foundation Course</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Courses List Section */}
      <section id="courses-list" className="section courses-list">
        <div className="container">
          <div className="row">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="col-lg-4 col-md-6 d-flex align-items-stretch"
                data-aos="zoom-in"
                data-aos-delay={course.aosDelay}
              >
                <div className="course-item">
                  <img 
                    src={course.image} 
                    className="img-fluid" 
                    alt={course.title} 
                  />
                  <div className="course-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Link to={course.link}>
                        <button className="category">{course.title}</button>
                      </Link>
                    </div>
                    <p className="description">{course.description}</p>
                    <div className="trainer d-flex justify-content-between align-items-center">
                      <div className="trainer-rank d-flex align-items-center">
                        <i className="bi bi-heart heart-icon"></i>&nbsp;{course.likes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default CompetitiveExamFoundation;