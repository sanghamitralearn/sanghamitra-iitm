import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── Topic Groups for Score Matching ─────────────────────────────────────────
// Maps raw topic strings from DB to canonical display topics
const topicGroups = {
  'Number System & Arithmetic': [
    'Number System & Arithmetic', 'Number System', 'Arithmetic', 'Real numbers', 
    'HCF and LCM', 'Rational and irrational numbers', 'Ratio proportion percentages',
    'Profit loss discount', 'Simple interest', 'Compound interest', 'GST', 
    'Shares and mutual funds', 'Currency conversions', 'Scales and map reading', 
    'Speed distance time'
  ],
  'Algebra': [
    'Algebra', 'Polynomials', 'Linear equations', 'Cramer\'s Rule', 
    'Quadratic equations', 'Nature of roots', 'Arithmetic progression', 
    'Geometric progression', 'Algebraic manipulation', 'Linear inequations', 
    'Laws of indices'
  ],
  'Functions': [
    'Functions', 'Function notation', 'Domain and range', 'Composite functions', 
    'Inverse functions', 'One-to-one mappings', 'Vertical line test', 
    'Real-life functions'
  ],
  'Geometry': [
    'Geometry', 'Similarity of triangles', 'Circles tangents secants', 
    'Tangent properties', 'Cyclic quadrilaterals', 'Circle theorems', 
    'Geometric constructions', 'Construction of tangents', 'Construction of similar triangles'
  ],
  'Mensuration': [
    'Mensuration', 'Area', 'Volume', 'Frustum', 'Combination of solids', 
    'Surface area', '2D shapes', '3D shapes'
  ],
  'Trigonometry': [
    'Trigonometry', 'Trigonometric ratios', 'Trigonometric identities', 
    'Heights and distances', 'Bearings', 'Sine rule', 'Cosine rule'
  ],
  'Coordinate Geometry': [
    'Coordinate Geometry', 'Distance formula', 'Section formula', 'Slope', 
    'Line equation', 'Straight lines', 'Midpoint formula'
  ],
  'Statistics': [
    'Statistics', 'Mean median mode', 'Ogive', 'Histograms', 'Scatter plots', 
    'Bar graphs', 'Pie charts', 'Frequency distribution'
  ],
  'Probability': [
    'Probability', 'Basic probability', 'Complementary events', 'Simple events', 
    'Combined events', 'Tree diagrams', 'Mutually exclusive events'
  ],
  'Sets & Venn Diagrams': [
    'Sets & Venn Diagrams', 'Sets', 'Venn Diagrams', 'Union intersection', 
    '3-set problems', 'Set theory'
  ],
  'Vectors & Transformations': [
    'Vectors & Transformations', 'Vectors', 'Transformations', 'Reflection', 
    'Rotation', 'Enlargement', 'Translation', 'Vector operations'
  ],
  'Graphs & Practical Mathematics': [
    'Graphs & Practical Mathematics', 'Graphs', 'Practical Mathematics', 
    'Linear graphs', 'Quadratic graphs', 'Real-life graphs'
  ]
}

// ─── Available Topics for Competitive Math ───────────────────────────────────
// Complete list of all 12 topics + Review Page
const availableTopics = [
  {
    id: 'review_page',
    topicName: 'review_page',
    displayName: 'Review Page',
    description: 'Review your submitted answers across all topics',
    icon: 'bi-journal-bookmark-fill',
    url: '/courses/competitive-math/review',
    linkState: { quizName: 'Review Page' }
  },
  {
    id: 'Number_System_Arithmetic',
    topicName: 'Number System & Arithmetic',
    displayName: 'Number System & Arithmetic',
    description: 'Real numbers, HCF/LCM, ratio, percentages, profit/loss, interest, GST, shares, currency conversion, scales, speed-distance-time',
    icon: 'bi-calculator-fill',
    url: '/courses/competitive-math/quiz/1',
    linkState: { quizName: 'Number System & Arithmetic Quiz' },
    week: 1
  },
  {
    id: 'Algebra',
    topicName: 'Algebra',
    displayName: 'Algebra',
    description: 'Polynomials, linear equations, Cramer\'s Rule, quadratic equations, AP, GP, algebraic manipulation, inequations, indices',
    icon: 'bi-infinity',
    url: '/courses/competitive-math/quiz/2',
    linkState: { quizName: 'Algebra Quiz' },
    week: 2
  },
  {
    id: 'Functions',
    topicName: 'Functions',
    displayName: 'Functions',
    description: 'Function notation, domain & range, composite functions, inverse functions, mappings, vertical line test, real-life functions',
    icon: 'bi-graph-up',
    url: '/courses/competitive-math/quiz/3',
    linkState: { quizName: 'Functions Quiz' },
    week: 3
  },
  {
    id: 'Geometry',
    topicName: 'Geometry',
    displayName: 'Geometry',
    description: 'Similarity of triangles, circles, tangents, secants, cyclic quadrilaterals, circle theorems, geometric constructions',
    icon: 'bi-bounding-box-circles',
    url: '/courses/competitive-math/quiz/4',
    linkState: { quizName: 'Geometry Quiz' },
    week: 4
  },
  {
    id: 'Mensuration',
    topicName: 'Mensuration',
    displayName: 'Mensuration',
    description: 'Area, volume, frustum, combination of solids, surface area of 2D & 3D shapes',
    icon: 'bi-cube',
    url: '/courses/competitive-math/quiz/5',
    linkState: { quizName: 'Mensuration Quiz' },
    week: 5
  },
  {
    id: 'Trigonometry',
    topicName: 'Trigonometry',
    displayName: 'Trigonometry',
    description: 'Trigonometric ratios, identities, heights & distances, bearings, sine/cosine rules',
    icon: 'bi-triangle-fill',
    url: '/courses/competitive-math/quiz/6',
    linkState: { quizName: 'Trigonometry Quiz' },
    week: 6
  },
  {
    id: 'Coordinate_Geometry',
    topicName: 'Coordinate Geometry',
    displayName: 'Coordinate Geometry',
    description: 'Distance formula, section formula, slope, line equations, straight lines',
    icon: 'bi-geo-alt-fill',
    url: '/courses/competitive-math/quiz/7',
    linkState: { quizName: 'Coordinate Geometry Quiz' },
    week: 7
  },
  {
    id: 'Statistics',
    topicName: 'Statistics',
    displayName: 'Statistics',
    description: 'Mean, median, mode, ogive, histograms, scatter plots, bar graphs, pie charts',
    icon: 'bi-bar-chart-steps',
    url: '/courses/competitive-math/quiz/8',
    linkState: { quizName: 'Statistics Quiz' },
    week: 8
  },
  {
    id: 'Probability',
    topicName: 'Probability',
    displayName: 'Probability',
    description: 'Basic probability, complementary events, dice/coin/cards, combined events, tree diagrams, mutually exclusive events',
    icon: 'bi-dice-5-fill',
    url: '/courses/competitive-math/quiz/9',
    linkState: { quizName: 'Probability Quiz' },
    week: 9
  },
  {
    id: 'Sets_Venn_Diagrams',
    topicName: 'Sets & Venn Diagrams',
    displayName: 'Sets & Venn Diagrams',
    description: 'Set notation, union, intersection, complement, 3-set problems, Venn diagram applications',
    icon: 'bi-venn-diagram',
    url: '/courses/competitive-math/quiz/10',
    linkState: { quizName: 'Sets & Venn Diagrams Quiz' },
    week: 10
  },
  {
    id: 'Vectors_Transformations',
    topicName: 'Vectors & Transformations',
    displayName: 'Vectors & Transformations',
    description: 'Vector operations, reflection, rotation, enlargement, translation, transformations',
    icon: 'bi-arrow-repeat',
    url: '/courses/competitive-math/quiz/11',
    linkState: { quizName: 'Vectors & Transformations Quiz' },
    week: 11
  },
  {
    id: 'Graphs_Practical_Maths',
    topicName: 'Graphs & Practical Mathematics',
    displayName: 'Graphs & Practical Mathematics',
    description: 'Linear graphs, quadratic graphs, real-life graphs, practical math applications',
    icon: 'bi-diagram-3-fill',
    url: '/courses/competitive-math/quiz/12',
    linkState: { quizName: 'Graphs & Practical Mathematics Quiz' },
    week: 12
  }
]

// ─── Helper: Get Display Topic from Raw Topic String ─────────────────────────
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
  return topicName // fall back to raw name if no group found
}

// ─── Helper: Find Topic Assessment from Scores ───────────────────────────────
function findTopicAssessment(scores, topicName) {
  if (!scores || !Array.isArray(scores)) return null

  const displayTopic = getDisplayTopic(topicName)
  const variations = topicGroups[displayTopic] || [topicName]

  const matched = scores.filter(s => {
    if (!s.topic) return false
    const st = s.topic.trim().toLowerCase()
    return variations.some(v => {
      const vl = v.toLowerCase()
      return st === vl || st.includes(vl) || vl.includes(st)
    })
  })

  if (!matched.length) return null

  // Sort descending by timestamp, take the most recent
  const latest = matched.sort(
    (a, b) => new Date(b.submitted_at || b.timestamp || 0) - new Date(a.submitted_at || a.timestamp || 0)
  )[0]

  // Calculate percentage
  let percentage = 0
  if (latest.percentage != null) {
    percentage = Math.round(parseFloat(latest.percentage))
  } else if (latest.score != null && latest.total_questions) {
    percentage = Math.round((latest.score / latest.total_questions) * 100)
  }

  return {
    percentage,
    totalQuestions: latest.total_questions || latest.totalQuestions || 15,
    correctAnswers: latest.correct_answers || latest.score || 0,
    timestamp: latest.submitted_at || latest.timestamp,
    attemptCount: matched.length
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────
const CompetitiveMath = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
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
      const res = await axios.get(
        `${API_URL}/api/competitive_math_quiz_attempts?email=${encodeURIComponent(email)}`,
        { withCredentials: true }
      )
      if (res.data?.success && Array.isArray(res.data?.data?.quizScores)) {
        setScores(res.data.data.quizScores)
      }
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )

  if (!user) { navigate('/login', { replace: true }); return null }

  return (
    <main className="main">
      {/* Page Title */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Competitive Mathematics</h1>
                <p className="mb-0">
                  Master essential mathematics concepts for competitive exams including 
                  Number System, Algebra, Geometry, Trigonometry, Probability, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">Competitive Mathematics</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div className="course-list" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>

          {/* Review Page Card - Always First */}
          {availableTopics.filter(t => t.id === 'review_page').map((topic) => {
            return (
              <div className="course-item mb-3" key={topic.id}>
                <div
                  className="card course-card h-100 border-0 shadow-sm"
                  style={{ borderRadius: '12px', transition: 'all 0.3s ease', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-lg-1 col-md-2 text-center">
                        <div className="icon-box text-white rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)' }}>
                          <i className={`bi ${topic.icon} fs-5`}></i>
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-5">
                        <h4 className="mb-1 fs-5 text-white">{topic.displayName}</h4>
                        <p className="text-white-50 mb-2 fs-6">{topic.description}</p>
                      </div>
                      <div className="col-lg-3 col-md-3 text-end">
                        <Link
                          to={topic.url}
                          state={topic.linkState}
                          className="btn btn-light btn-sm"
                          style={{ minWidth: '120px', padding: '0.4rem 1rem', borderRadius: '8px' }}
                        >
                          <span>View Reviews</span>
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Topic Cards */}
          {availableTopics.filter(t => t.id !== 'review_page').map((topic) => {
            const assessment = findTopicAssessment(scores, topic.topicName)
            const isCompleted = assessment != null
            const score = assessment?.percentage || 0
            const correctAnswers = assessment?.correctAnswers || 0
            const totalQuestions = assessment?.totalQuestions || 0
            const lastAttempted = assessment?.timestamp || null
            const attemptCount = assessment?.attemptCount || 0

            // Colour logic based on score
            let progressBarClass = 'bg-primary'
            let badgeStyle = { background: 'linear-gradient(45deg,#007bff,#0056b3)' }
            if (score >= 80) { progressBarClass = 'bg-success'; badgeStyle = { background: 'linear-gradient(45deg,#28a745,#20c997)' } }
            else if (score >= 60) { progressBarClass = 'bg-info'; badgeStyle = { background: 'linear-gradient(45deg,#17a2b8,#138496)' } }
            else if (score >= 40) { progressBarClass = 'bg-warning'; badgeStyle = { background: 'linear-gradient(45deg,#ffc107,#fd7e14)' } }
            else if (score > 0) { progressBarClass = 'bg-danger'; badgeStyle = { background: 'linear-gradient(45deg,#dc3545,#c82333)' } }

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

                      {/* Action Buttons */}
                      <div className="col-lg-3 col-md-3 text-end">
                        <Link
                          to={topic.url}
                          state={topic.linkState}
                          className="btn btn-primary btn-sm"
                          style={{
                            minWidth: '120px', padding: '0.4rem 1rem',
                            borderRadius: '8px', display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'space-between'
                          }}
                        >
                          <span>{isCompleted ? 'Retest' : 'Start Assessment'}</span>
                          <i className={`bi ${isCompleted ? 'bi-arrow-clockwise' : 'bi-arrow-right'} ms-2`}></i>
                        </Link>

                        {isCompleted && (
                          <div className="mt-2">
                            <small className="text-muted d-block">
                              Score: {correctAnswers}/{totalQuestions}
                            </small>
                            {attemptCount > 1 && (
                              <small className="text-muted d-block">{attemptCount} attempts</small>
                            )}
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

export default CompetitiveMath
