import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Quiz18 = () => {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quizData, setQuizData] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    checkAuth()
    loadQuizData()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/session-info`, { withCredentials: true })
      if (res.data && res.data.email) {
        setUser(res.data)
      } else {
        navigate('/login', { state: { from: { pathname: window.location.pathname } }, replace: true })
      }
    } catch {
      navigate('/login', { state: { from: { pathname: window.location.pathname } }, replace: true })
    } finally {
      setLoading(false)
    }
  }

  const loadQuizData = () => {
    const sampleQuestions = [
      {
        id: 1,
        question: "What is a function concept?",
        options: ["Relation between variables", "Type of equation", "Geometric shape", "Algebraic expression"],
        correctAnswer: 0
      },
      {
        id: 2,
        question: "What is the domain of a function?",
        options: ["Set of input values", "Set of output values", "Range of function", "Function values"],
        correctAnswer: 0
      },
      {
        id: 3,
        question: "What is the range of a function?",
        options: ["Set of output values", "Set of input values", "Domain of function", "Function domain"],
        correctAnswer: 0
      }
    ]
    setQuizData(sampleQuestions)
  }

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers({...selectedAnswers, [questionId]: answerIndex})
  }

  const handleSubmit = () => {
    if (!quizData) return
    let correctCount = 0
    quizData.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) correctCount++
    })
    setScore(correctCount)
    setShowResults(true)
    saveScore(correctCount, quizData.length)
  }

  const saveScore = async (correctAnswers, totalQuestions) => {
    try {
      await fetch('https://sanghamitra-learnworld.vercel.app/api/iitmmath_scores', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: user.email, topic: 'Quiz18', score: correctAnswers,
          totalQuestions: totalQuestions, percentage: Math.round((correctAnswers / totalQuestions) * 100),
          answers: selectedAnswers
        }),
        credentials: 'include'
      })
    } catch (error) { console.error('Error saving score:', error) }
  }

  const resetQuiz = () => {
    setCurrentQuestion(0); setSelectedAnswers({}); setShowResults(false); setScore(0)
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  if (!quizData) return <div className="container text-center"><h2>Loading Quiz...</h2></div>

  return (
    <main className="main">
      <section id="hero" className="hero section">
        <img src="/img/quiz-background.png" alt="Quiz" data-aos="fade-in" />
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">IITM Math Quiz 18</h2>
          <p data-aos="fade-up" data-aos-delay="200">Quiz 1 Midterm - 2</p>
          <div className="d-flex mt-4" data-aos="fade-up" data-aos-delay="300">
            <Link to="/courses/IIITM-math" className="btn-get-started">Back to IITM Math</Link>
          </div>
        </div>
      </section>

      <section className="quiz-section section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {!showResults ? (
                <div className="quiz-container">
                  <div className="quiz-header">
                    <h3>Question {currentQuestion + 1} of {quizData.length}</h3>
                    <div className="progress mb-4">
                      <div className="progress-bar" style={{width: `${((currentQuestion + 1) / quizData.length) * 100}%`}}></div>
                    </div>
                  </div>

                  <div className="question-card">
                    <h4>{quizData[currentQuestion].question}</h4>
                    <div className="options mt-4">
                      {quizData[currentQuestion].options.map((option, index) => (
                        <div key={index} className="form-check">
                          <input className="form-check-input" type="radio" 
                            name={`question-${quizData[currentQuestion].id}`}
                            id={`option-${quizData[currentQuestion].id}-${index}`}
                            checked={selectedAnswers[quizData[currentQuestion].id] === index}
                            onChange={() => handleAnswerSelect(quizData[currentQuestion].id, index)}
                          />
                          <label className="form-check-label" htmlFor={`option-${quizData[currentQuestion].id}-${index}`}>
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="quiz-actions mt-4">
                      <button className="btn btn-primary me-2" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0}>
                        Previous
                      </button>
                      <button className="btn btn-primary me-2" onClick={() => setCurrentQuestion(Math.min(quizData.length - 1, currentQuestion + 1))} disabled={currentQuestion === quizData.length - 1}>
                        Next
                      </button>
                      <button className="btn btn-success" onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length !== quizData.length}>
                        Submit Quiz
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="results-container text-center">
                  <div className="result-card">
                    <h3>Quiz Results</h3>
                    <div className="score-display">
                      <h2 className="text-primary">{score}/{quizData.length}</h2>
                      <p className="text-muted">Correct Answers</p>
                      <p className="percentage">{Math.round((score / quizData.length) * 100)}%</p>
                    </div>
                    <div className="result-actions mt-4">
                      <button className="btn btn-primary me-2" onClick={resetQuiz}>Retake Quiz</button>
                      <Link to="/courses/IIITM-math" className="btn btn-secondary">Back to IITM Math</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Quiz18