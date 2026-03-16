import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Quiz6 = () => {
  const navigate = useNavigate()
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [showScore, setShowScore] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})

  const questions = [
    {
      id: 1,
      question: "What is the time complexity of finding the kth smallest element using quickselect?",
      options: [
        "O(n)",
        "O(n log n)",
        "O(n²)",
        "O(log n)"
      ],
      correctAnswer: 0
    },
    {
      id: 2,
      question: "Which data structure is used for implementing priority queues?",
      options: [
        "Array",
        "Linked List",
        "Heap",
        "Tree"
      ],
      correctAnswer: 2
    },
    {
      id: 3,
      question: "What is the space complexity of iterative DFS?",
      options: [
        "O(V)",
        "O(E)",
        "O(V + E)",
        "O(1)"
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: "Which algorithm finds the minimum spanning tree?",
      options: [
        "Dijkstra's Algorithm",
        "Prim's Algorithm",
        "Bellman-Ford Algorithm",
        "Floyd-Warshall Algorithm"
      ],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "What is the time complexity of finding the longest common subsequence using dynamic programming?",
      options: [
        "O(n)",
        "O(n log n)",
        "O(n²)",
        "O(2^n)"
      ],
      correctAnswer: 2
    }
  ]

  const handleAnswerClick = (questionId, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndex
    })
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateScore()
    }
  }

  const calculateScore = () => {
    let calculatedScore = 0
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        calculatedScore++
      }
    })
    setScore(calculatedScore)
    setShowScore(true)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScore(0)
    setShowScore(false)
    setSelectedAnswers({})
  }

  const handleBackToCourse = () => {
    navigate('/courses/pdsa')
  }

  return (
    <div className="quiz-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">PDSA Quiz 6: Advanced Algorithms II</h3>
              </div>
              <div className="card-body">
                {showScore ? (
                  <div className="score-section text-center">
                    <h4 className="text-success">Quiz Completed!</h4>
                    <h2 className="mb-4">
                      Your Score: {score} out of {questions.length}
                    </h2>
                    <div className="mb-4">
                      {score === questions.length ? (
                        <p className="text-success">Excellent! You got all questions correct! 🎉</p>
                      ) : score >= questions.length * 0.7 ? (
                        <p className="text-primary">Good job! Keep practicing! 👍</p>
                      ) : (
                        <p className="text-warning">Keep studying! You can do better! 💪</p>
                      )}
                    </div>
                    <button className="btn btn-primary me-3" onClick={resetQuiz}>
                      Try Again
                    </button>
                    <button className="btn btn-secondary" onClick={handleBackToCourse}>
                      Back to PDSA Course
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="badge bg-primary">Question {currentQuestion + 1} of {questions.length}</span>
                      <span className="badge bg-info">Score: {Object.keys(selectedAnswers).length} answered</span>
                    </div>
                    
                    <div className="question-card mb-4 p-3 border rounded">
                      <h5 className="text-primary">Question:</h5>
                      <p className="lead">{questions[currentQuestion].question}</p>
                    </div>

                    <div className="options-container">
                      {questions[currentQuestion].options.map((option, index) => (
                        <div key={index} className="mb-2">
                          <button
                            className={`btn btn-outline-primary w-100 text-start ${
                              selectedAnswers[questions[currentQuestion].id] === index ? 'active' : ''
                            }`}
                            onClick={() => handleAnswerClick(questions[currentQuestion].id, index)}
                            disabled={showScore}
                          >
                            <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 d-flex justify-content-between">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/courses/pdsa')}
                        disabled={showScore}
                      >
                        ← Back to Course
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswers[questions[currentQuestion].id] && selectedAnswers[questions[currentQuestion].id] !== 0}
                      >
                        {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quiz-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 0;
        }
        .card {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: none;
          border-radius: 15px;
        }
        .question-card {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
        }
        .btn-outline-primary.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }
        .score-section h2 {
          color: #28a745;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default Quiz6