import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'


const availableTopics = [
  {
    id: 'review_page',
    topicName: 'review_page',
    displayName: 'Review Page',
    description: 'Review your submitted answers',
    icon: 'bi-cpu',
    url: '/courses/statistics2/review',
    linkState: { quizName: 'Review Page' }
  },
  {
    id: 'week1',
    topicName: 'Multiple_Random_Variables',
    displayName: 'Week 1 - Multiple Random Variable',
    description: 'Probability distributions and random variables',
    icon: 'bi-bar-chart',
    url: '/courses/statistics2/quiz/1',
    linkState: { quizName: 'Week 1 - Multiple Random Variable' }
  },
  {
    id: 'week2',
    topicName: 'Independence and Variable Functions',
    displayName: 'Week 2 - Independence and Variable Functions',
    description: 'Independence of variables and function transformations',
    icon: 'bi-graph-up',
    url: '/courses/statistics2/quiz/2',
    linkState: { quizName: 'Week 2 - Independence and Variable Functions' }
  },
  {
    id: 'week3',
    topicName: 'Expectations Variance and Bivariate Data',
    displayName: 'Week 3 - Expectations, Variance, and Bivariate Data',
    description: 'Expectations, variance calculations, and bivariate analysis',
    icon: 'bi-bullseye',
    url: '/courses/statistics2/quiz/3',
    linkState: { quizName: 'Week 3 - Expectations, Variance, and Bivariate Data' }
  },
  {
    id: 'week4',
    topicName: 'Discrete vs Continuous Random Variables',
    displayName: 'Week 4 - Discrete vs continuous Random Variables',
    description: 'Understanding discrete and continuous distributions',
    icon: 'bi-activity',
    url: '/courses/statistics2/quiz/4',
    linkState: { quizName: 'Week 4 - Discrete vs continuous Random Variables' }
  },
  {
    id: 'week5',
    topicName: 'Jointly Gaussian Random Variables',
    displayName: 'Week 5 - Jointly Gaussian Random Variables',
    description: 'Joint Gaussian distributions and properties',
    icon: 'bi-distribute-horizontal',
    url: '/courses/statistics2/quiz/5',
    linkState: { quizName: 'Week 5 - Jointly Gaussian Random Variables' }
  },
  {
    id: 'week6',
    topicName: 'Marginal and Conditional Densities',
    displayName: 'Week 6 - Marginal and Conditional Densities',
    description: 'Marginal and conditional probability densities',
    icon: 'bi-diagram-3',
    url: '/courses/statistics2/quiz/6',
    linkState: { quizName: 'Week 6 - Marginal and Conditional Densities' }
  },
  {
    id: 'week7',
    topicName: 'Empirical Distribution',
    displayName: 'Week 7 - Emperical Distributions',
    description: 'Empirical distributions and data analysis',
    icon: 'bi-pie-chart',
    url: '/courses/statistics2/quiz/7',
    linkState: { quizName: 'Week 7 - Emperical Distributions' }
  },
  {
    id: 'week8',
    topicName: 'Moment Generating Functions',
    displayName: 'Week 8 - Moment Generating Functions',
    description: 'Moment generating functions and their applications',
    icon: 'bi-function',
    url: '/courses/statistics2/quiz/8',
    linkState: { quizName: 'Week 8 - Moment Generating Functions' }
  },
  {
    id: 'week9',
    topicName: 'Parameter Estimation',
    displayName: 'Week 9 - Parameter Estimation',
    description: 'Point estimation, MLE, and method of moments',
    icon: 'bi-calculator',
    url: '/courses/statistics2/quiz/9',
    linkState: { quizName: 'Week 9 - Parameter Estimation' }
  },
  {
    id: 'week10',
    topicName: 'Bayesian Estimation',
    displayName: 'Week 10 - Bayesian Estimation',
    description: 'Bayesian methods for parameter estimation',
    icon: 'bi-shield-check',
    url: '/courses/statistics2/quiz/10',
    linkState: { quizName: 'Week 10 - Bayesian Estimation' }
  },
  {
    id: 'week11',
    topicName: 'Hypotheses Testing',
    displayName: 'week 11- Hypotheses Testing',
    description: 'Hypothesis testing and statistical inference',
    icon: 'bi-check2-circle',
    url: '/courses/statistics2/quiz/11',
    linkState: { quizName: 'week 11- Hypotheses Testing' }
  },
  {
    id: 'week12',
    topicName: 'Sample Testing',
    displayName: 'week 12- Sample Testing',
    description: 'Sample testing and statistical inference',
    icon: 'bi-check2-circle',
    url: '/courses/statistics2/quiz/12',
    linkState: { quizName: 'week 12- Sample Testing' }
  },
  {
    id: 'Endterm',
    topicName: 'End Term',
    displayName: 'End Term - Statistics II',
    description: 'End Term assessment covering the core Statistics II syllabus',
    icon: 'bi-journal-check',
    url: '/courses/statistics2/quiz/102',
    linkState: { quizName: 'End Term - Statistics II' }
  }
]


// Topic grouping for flexible score matching
const topicGroups = {
  Multiple_Random_Variables: ['Multiple_Random_Variables', 'Week1', 'week1'],
  Independence_and_Variable_Functions: ['Independence_and_Variable_Functions', 'Week2', 'week2'],
  Expectations_Variance_and_Bivariate_Data: ['Expectations_Variance_and_Bivariate_Data', 'Week3', 'week3'],
  Discrete_vs_Continuous_Random_Variables: ['Discrete_vs_Continuous_Random_Variables', 'Week4', 'week4'],
  Jointly_Gaussian_Random_Variables: ['Jointly_Gaussian_Random_Variables', 'Week5', 'week5'],
  Marginal_and_Conditional_Densities: ['Marginal_and_Conditional_Densities', 'Week6', 'week6'],
  Empirical_Distributions: ['Empirical_Distributions', 'Week7', 'week7'],
  Moment_Generating_Functions: ['Moment_Generating_Functions', 'Week8', 'week8'],
  Parameter_Estimation: ['Parameter_Estimation', 'Week9', 'week9'],
  Bayesian_Estimation: ['Bayesian_Estimation', 'Week10', 'week10'],
  Hypotheses_Testing: ['Hypotheses_Testing', 'Week11', 'week11'],
  Sample_Testing: ['Sample_Testing', 'Week12', 'week12'],
  End_Term: ['End_Term', 'endterm', 'Week102', 'week102'],

}


function getDisplayTopic(topicName) {
  if (!topicName) return null
  const searchName = topicName.toLowerCase().trim()


  for (const [displayTopic, variations] of Object.entries(topicGroups)) {
    for (const variation of variations) {
      const variationLower = variation.toLowerCase()
      if (
        variationLower === searchName ||
        searchName.includes(variationLower) ||
        variationLower.includes(searchName) ||
        searchName.replace(/_/g, ' ') === variationLower.replace(/_/g, ' ')
      ) {
        return displayTopic
      }
    }
  }
  return topicName
}


function findTopicAssessment(scores, topicId) {
  if (!scores || !Array.isArray(scores) || !topicId) return null


  const topicConfig = availableTopics.find(t => t.id === topicId)
  if (!topicConfig) return null


  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const displayNorm = norm(topicConfig.displayName)
  const nameNorm = norm(topicConfig.topicName)


  const matched = scores.filter(s => {
    if (!s.topic) return false
    const st = norm(s.topic)
    return displayNorm.includes(st) || st.includes(nameNorm) ||
           nameNorm.includes(st) || st === nameNorm || st === displayNorm
  })


  if (!matched.length) return null


  const latest = matched.sort(
    (a, b) => new Date(b.timestamp || b.dateAttempted || 0) - new Date(a.timestamp || a.dateAttempted || 0)
  )[0]


  const percentage = latest.percentage != null
    ? Math.round(parseFloat(latest.percentage))
    : latest.totalQuestions > 0
      ? Math.round((latest.score / latest.totalQuestions) * 100)
      : 0


  return {
    percentage,
    totalQuestions: latest.totalQuestions || 0,
    correctAnswers: latest.correctAnswers || latest.score || 0,
    timestamp:      latest.timestamp || latest.dateAttempted,
    attemptCount:   matched.length
  }
}




const Statistics2 = () => {
  const navigate = useNavigate()
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState([])


  useEffect(() => { checkAuth() }, [])


  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      if (res.data?.email) {
        setUser(res.data)
        fetchScores(res.data.email)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }


  const fetchScores = async (email) => {
    try {
      const res = await axios.get(`${API_URL}/api/iitm_stats2_scores_databases?email=${encodeURIComponent(email)}`, { withCredentials: true })
      const d = res.data
      // Handle both response shapes
      const quizScores = d?.data?.quizScores || d?.scores || d?.quizScores || []
      setScores(Array.isArray(quizScores) ? quizScores : [])
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }


  if (!user) { navigate('/login', { replace: true }); return null }


  return (
    <main className="main">
      {/* Page title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>IITM Statistics II</h1>
                <p className="mb-0">
                  Master advanced statistical concepts including probability distributions, estimation,
                  hypothesis testing, and Bayesian methods for real-world applications.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">IITM Statistics II</li>
            </ol>
          </div>
        </nav>
      </div>


      <div className="container">
        <div className="course-list" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>


          {availableTopics.map((topic) => {
            const assessment    = findTopicAssessment(scores, topic.id)
            const isCompleted   = assessment != null
            const score         = assessment?.percentage    || 0
            const correctAnswers = assessment?.correctAnswers || 0
            const totalQuestions = assessment?.totalQuestions || 0
            const lastAttempted = assessment?.timestamp      || null
            const attemptCount  = assessment?.attemptCount   || 0


            // Colour logic
            let progressBarClass = 'bg-primary'
            let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
            if      (score >= 80) { progressBarClass = 'bg-success'; badgeStyle = { background: 'linear-gradient(45deg,#28a745,#20c997)' } }
            else if (score >= 60) { progressBarClass = 'bg-info';    badgeStyle = { background: 'linear-gradient(45deg,#17a2b8,#138496)' } }
            else if (score >= 40) { progressBarClass = 'bg-warning'; badgeStyle = { background: 'linear-gradient(45deg,#ffc107,#fd7e14)' } }
            else if (score >  0)  { progressBarClass = 'bg-danger';  badgeStyle = { background: 'linear-gradient(45deg,#dc3545,#c82333)' } }


            return (
              <div className="course-item mb-3" key={topic.id}>
                <div
                  className="card course-card h-100 border-0 shadow-sm"
                  style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                >
                  <div className="card-body p-3">
                    <div className="row align-items-center">


                      {/* Icon */}
                      <div className="col-lg-1 col-md-2 text-center">
                        <div
                          className={`icon-box ${isCompleted ? 'bg-success' : 'bg-primary'} text-white rounded-circle p-2`}
                          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <i className={`bi ${isCompleted ? 'bi-check-circle' : topic.icon} fs-5`}></i>
                        </div>
                      </div>


                      {/* Title, description, progress bar */}
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5">{topic.displayName}</h4>
                        <p className="text-muted mb-2 fs-6">{topic.description}</p>
                        <div className="progress" style={{ height: '6px', backgroundColor: '#f0f0f0' }}>
                          <div
                            className={`progress-bar ${progressBarClass}`}
                            role="progressbar"
                            style={{ width: `${isCompleted ? score : 0}%` }}
                            aria-valuenow={score}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                        {lastAttempted
                          ? <small className="text-muted">
                              Last attempt: {new Date(lastAttempted).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </small>
                          : <small className="text-muted">Not attempted yet</small>
                        }
                      </div>


                      {/* Percentage badge */}
                      <div className="col-lg-2 col-md-2 text-center">
                        <span style={{
                          display: 'inline-block', padding: '0.3rem 0.8rem',
                          borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem',
                          color: 'white', boxShadow: '0 2px 4px rgba(0,123,255,0.3)',
                          ...badgeStyle
                        }}>
                          {score}%
                        </span>
                      </div>


                      {/* Action button */}
                      <div className="col-lg-3 col-md-3 text-end">
                        <Link to={topic.url} state={topic.linkState} className="btn btn-primary btn-sm">
                          {isCompleted ? <><span>Retake</span><i className="bi bi-arrow-clockwise ms-2"></i></> : <><span>Start</span><i className="bi bi-arrow-right ms-2"></i></>}
                        </Link>
                        {isCompleted && (
                          <div className="mt-2">
                            <small className="text-muted d-block">Score: {correctAnswers}/{totalQuestions}</small>
                            {attemptCount > 1 && <small className="text-muted d-block">{attemptCount} attempts</small>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}


export default Statistics2



