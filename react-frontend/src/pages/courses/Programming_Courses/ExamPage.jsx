import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const ExamPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('java')

  const exams = [
    {
      id: 'midterm1',
      title: 'Midterm 1',
      description: 'Covers Week 1 to Week 4',
      weekRange: '1-4',
      totalQuestions: 20,
      icon: 'bi-clock-history',
      color: '#0d6efd'
    },
    {
      id: 'midterm2',
      title: 'Midterm 2',
      description: 'Covers Week 1 to Week 8',
      weekRange: '5-8',
      totalQuestions: 20,
      icon: 'bi-clock',
      color: '#fd7e14'
    },
    {
      id: 'endterm',
      title: 'End Term',
      description: 'Covers Week 1 to Week 12',
      weekRange: '9-12',
      totalQuestions: 25,
      icon: 'bi-trophy',
      color: '#dc3545'
    }
  ]

  const courses = [
    { id: 'java', label: 'Java Programming' },
    { id: 'python', label: 'Python Programming' },
    { id: 'sql', label: 'SQL & Databases' }
  ]

  const startExam = async (exam) => {
    setLoading(true)
    try {
      // Check if user has previous attempts for this exam
      const email = localStorage.getItem('userEmail') // Or get from context
      if (email) {
        const res = await axios.get(
          `${API}/api/mcq-quiz/attempts?email=${encodeURIComponent(email)}&course=${selectedCourse}`,
          { withCredentials: true }
        )
        
        // Check if user has already taken this exam
        const examAttempts = res.data?.attempts?.filter(
          a => a.topic === `Exam: ${exam.title} (Weeks ${exam.weekRange})`
        ) || []
        
        if (examAttempts.length > 0) {
          const confirmRetake = window.confirm(
            `You have already taken this exam. Do you want to retake it?`
          )
          if (!confirmRetake) {
            setLoading(false)
            return
          }
        }
      }

      // Navigate to quiz with exam parameters
      navigate(`/quiz/${selectedCourse}/exam`, {
        state: {
          examId: exam.id,
          examTitle: `${exam.title} - ${exam.weekRange}`,
          weekRange: exam.weekRange,
          totalQuestions: exam.totalQuestions,
          quizName: `${exam.title} (Weeks ${exam.weekRange})`
        }
      })
    } catch (error) {
      console.error('Error starting exam:', error)
      alert('Failed to start exam. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="main">
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading"><div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1>Exams</h1>
              <p className="mb-0">Test your knowledge with comprehensive exams covering multiple weeks</p>
            </div>
          </div>
        </div></div>
        <nav className="breadcrumbs"><div className="container"><ol>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/programming/courses">Programming</Link></li>
          <li className="current">Exams</li>
        </ol></div></nav>
      </div>

      <div className="container mb-5">
        {/* Course Selector */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-book me-2 text-primary"></i>
              Select Course
            </h5>
            <div className="d-flex flex-wrap gap-3">
              {courses.map(course => (
                <button
                  key={course.id}
                  className={`btn ${selectedCourse === course.id ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  {course.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exam Cards */}
        <div className="row g-4">
          {exams.map(exam => (
            <div key={exam.id} className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16, transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div style={{
                      width: 50, height: 50, borderRadius: 12,
                      background: `${exam.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <i className={`bi ${exam.icon} fs-2`} style={{ color: exam.color }}></i>
                    </div>
                    <div>
                      <h4 className="fw-bold mb-0">{exam.title}</h4>
                      <span className="badge bg-primary">{exam.weekRange}</span>
                    </div>
                  </div>
                  
                  <p className="text-muted mb-3">{exam.description}</p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted">
                      <i className="bi bi-question-circle me-1"></i>
                      {exam.totalQuestions} Questions
                    </small>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {Math.ceil(exam.totalQuestions * 1.5)} min
                    </small>
                  </div>

                  <button
                    className="btn btn-primary w-100"
                    onClick={() => startExam(exam)}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Starting...</>
                    ) : (
                      <><i className="bi bi-play-fill me-2"></i>Start Exam</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exam Rules */}
        <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 16 }}>
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-info-circle me-2 text-primary"></i>
              Exam Guidelines
            </h5>
            <ul className="mb-0">
              <li className="mb-2">Each exam covers all topics from the specified week range</li>
              <li className="mb-2">Questions are randomly selected from the question bank</li>
              <li className="mb-2">You can retake exams to improve your score</li>
              <li className="mb-0">Your best score will be recorded in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ExamPage
