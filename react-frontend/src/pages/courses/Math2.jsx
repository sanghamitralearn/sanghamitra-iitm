import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// ─── CHANGE 1 ────────────────────────────────────────────────────────────────
// Ported topicGroups from HTML.
// Purpose: maps every raw topic string that may come from the DB to one
// canonical "display topic" key.  The score-lookup function uses this so that
// multiple DB entries (e.g. 'Vectors', 'Matrices', 'Week1') all roll up to the
// same card ('Vectors_and_Matrices').
const topicGroups = {
  Vectors_and_Matrices: [
    'Vectors_and_Matrices', 'Vectors', 'Matrices',
    'Systems_of_Linear_Equations', 'Determinants_1', 'Determinants_2', 'Week1'
  ],
  Vector_Spaces_and_Linear_Maps: [
    'Vector_Spaces_and_Linear_Maps', 'Vectors', 'Matrices',
    'Systems_of_Linear_Equations', 'Determinants_1', 'Determinants_2', 'Week1'
  ],
  Vector_Spaces_and_Linear_Independence: ['Vector_Spaces_and_Linear_Independence'],
  Basis_Rank_and_Dimension:             ['Basis_Rank_and_Dimension'],
  Midterm1:                             ['Quiz1_Midterm'],
  Null_Space_and_Linear_Maps:           ['Null_Space_and_Linear_Maps'],
}

// ─── CHANGE 2 ────────────────────────────────────────────────────────────────
// Replaced availableWeeks (week-number based) with availableTopics that mirrors
// the HTML exactly — same ids, displayNames, descriptions, icons, and React
// Router URLs (converted from .html file paths to /courses/math2/... routes).
// A `topicName` field is added so the score-lookup knows which key to search.
const availableTopics = [
  {
    id: 'review_page',
    topicName: 'review_page',
    displayName: 'Review Page',
    description: 'Review your submitted answers',
    icon: 'bi-cpu',
    url: '/courses/math2/review',
    linkState: { quizName: 'Review Page' }
  },
  {
    id: 'Vectors_and_Matrices',
    topicName: 'Vectors_and_Matrices',
    displayName: 'Week 1 - Vectors and Matrices',
    description: 'Assessment on IITM Math - II - Vector and Matrices',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/1',
    linkState: { quizName: 'Week 1 - Vectors and Matrices' }
  },
  {
    id: 'Vector_Spaces_and_Linear_Maps',
    topicName: 'Vector_Spaces_and_Linear_Maps',
    displayName: 'Week 2 - Vector Spaces and Linear Maps',
    description: 'Assessment on IITM Math II - Vector_Spaces_and_Linear_Maps',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/2',
    linkState: { quizName: 'Week 2 - Vector Spaces and Linear Maps' }
  },
  {
    id: 'Vector_Spaces_and_Linear_Independence',
    topicName: 'Vector_Spaces_and_Linear_Independence',
    displayName: 'Week 3 - Vector Spaces and Linear Independence',
    description: 'Assessment on IITM Math II - Vector_Spaces_and_Linear_Independence',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/3',
    linkState: { quizName: 'Week 3 - Vector Spaces and Linear Independence' }
  },
  {
    id: 'Basis_Rank_and_Dimension',
    topicName: 'Basis_Rank_and_Dimension',
    displayName: 'Week 4 - Basis, Rank and Dimension',
    description: 'Assessment on IITM Math II - Basis_Rank_and_Dimension',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/4',
    linkState: { quizName: 'Week 4 - Basis Rank and Dimension' }
  },
  {
    id: 'midterm1',
    topicName: 'Midterm1',
    displayName: 'Midterm 1 - Mathematics II',
    description: 'Midterm 1',
    icon: 'bi-cpu',
    url: '/courses/math2/midterm',
    linkState: { quizName: 'Midterm 1 - Mathematics II' }
  },
  {
    id: 'Null_Space_and_Linear_Maps',
    topicName: 'Null_Space_and_Linear_Maps',
    displayName: 'Week 5 - Null Space and Linear Maps',
    description: 'Assessment on IITM Math II - Null_Space_and_Linear_Maps',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/5',
    linkState: { quizName: 'Week 5 - Null Space and Linear Maps' }
  },
  {
    id: 'Linear_Transformations_Kernel_and_Image',
    topicName: 'Linear_Transformations_Kernel_and_Image',
    displayName: 'Week 6 - Linear Transformations, Kernel and Image',
    description: 'Assessment on IITM Math II - Linear_Transformations_Kernel_and_Image',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/6',
    linkState: { quizName: 'Week 6 - Linear Transformations Kernel and Image' }
  },
  {
    id: 'Similarity_Affine_Maps_and_Inner_Products',
    topicName: 'Similarity_Affine_Maps_and_Inner_Products',
    displayName: 'Week 7 - Similarity, Affine Maps and Inner Products',
    description: 'Assessment on IITM Math II - Similarity_Affine_Maps_and_Inner_Products',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/7',
    linkState: { quizName: 'Week 7 - Similarity Affine Maps and Inner Products' }
  },
  {
    id: 'Orthonormality_Projections_and_Gram_Schmidt',
    topicName: 'Orthonormality_Projections_and_Gram_Schmidt',
    displayName: 'Week 8 - Orthonormality, Projections and Gram-Schmidt',
    description: 'Assessment on IITM Math II - Orthonormality_Projections_and_Gram_Schmidt',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/8',
    linkState: { quizName: 'Week 8 - Orthonormality Projections and Gram Schmidt' }
  },
  {
    id: 'Multivariable_Functions_Partial_and_Directional_Derivatives',
    topicName: 'Multivariable_Functions_Partial_and_Directional_Derivatives',
    displayName: 'Week 9 - Multivariable Functions, Partial and Directional Derivatives',
    description: 'Assessment on IITM Math II - Multivariable Functions, Partial and Directional Derivatives',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/9',
    linkState: { quizName: 'Week 9 - Multivariable Functions Partial and Directional Derivatives' }
  },
  {
    id: 'Directional_Ascent_Descent_Tangent_Plane_Critical_Points',
    topicName: 'Directional_Ascent_Descent_Tangent_Plane_Critical_Points',
    displayName: 'Week 10 - Directional Ascent and Descent, Tangent Plane, Critical Points',
    description: 'Assessment on IITM Math II - Directional Ascent and Descent, Tangent Plane, Critical Points',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/10',
    linkState: { quizName: 'Week 10 - Directional Ascent Descent Tangent Plane Critical Points' }
  },
  {
    id: 'Higher_Order_Partial_Derivatives_Hessian_Matrix_Local_Extrema',
    topicName: 'Higher_Order_Partial_Derivatives_Hessian_Matrix_Local_Extrema',
    displayName: 'Week 11 - Higher Order Partial Derivatives, Hessian Matrix and Local Extrema',
    description: 'Assessment on IITM Math II - Higher Order Partial Derivatives, Hessian Matrix and Local Extrema',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/11',
    linkState: { quizName: 'Week 11 - Higher Order Partial Derivatives Hessian Matrix and Local Extrema' }
  },
  {
    id: 'Hessian_Matrix_Local_Extrema_and_Differentiability',
    topicName: 'Hessian_Matrix_Local_Extrema_and_Differentiability',
    displayName: 'Week 12 - Hessian Matrix, Local Extrema and Differentiability',
    description: 'Assessment on IITM Math II - Hessian Matrix, Local Extrema and Differentiability',
    icon: 'bi-cpu',
    url: '/courses/math2/quiz/12',
    linkState: { quizName: 'Week 12 - Hessian Matrix Local Extrema and Differentiability' }
  }
]

// ─── CHANGE 3 ────────────────────────────────────────────────────────────────
// Ported getDisplayTopic() from HTML.
// Converts any raw DB topic string → canonical topicGroups key using
// case-insensitive, partial, and underscore-normalised matching.
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

// ─── CHANGE 4 ────────────────────────────────────────────────────────────────
// Ported findTopicAssessment() from HTML.
// Old code used `s.week === weekNumber` (integer comparison).
// New code matches by topic string using topicGroups, then sorts by timestamp
// to get the latest attempt — exactly mirroring the HTML logic.
function findTopicAssessment(scores, topicName) {
  if (!scores || !Array.isArray(scores)) return null

  const displayTopic = getDisplayTopic(topicName)
  const variations   = topicGroups[displayTopic] || [topicName]

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
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  )[0]

  // ─── CHANGE 5 ──────────────────────────────────────────────────────────────
  // Percentage calculation: mirrors HTML — prefer stored `percentage` field,
  // fall back to computing from score / totalQuestions.
  // Old React code used correctAnswers / totalQuestions only.
  let percentage = 0
  if (latest.percentage != null) {
    percentage = Math.round(parseFloat(latest.percentage))
  } else if (latest.score != null && latest.totalQuestions) {
    percentage = Math.round((latest.score / latest.totalQuestions) * 100)
  }

  return {
    percentage,
    totalQuestions: latest.totalQuestions || 15,
    // ─── CHANGE 6 ────────────────────────────────────────────────────────────
    // Field rename: HTML uses `score` (raw correct count); old React used
    // `correctAnswers`.  We expose both names so the JSX below stays readable.
    correctAnswers: latest.score || 0,
    timestamp:     latest.timestamp,
    attemptCount:  matched.length
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const Math2 = () => {
  const navigate = useNavigate()
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  // ─── CHANGE 7 ──────────────────────────────────────────────────────────────
  // scoreData now stores the flat `quizScores` array directly (not the whole
  // response object) so every lookup doesn't need to drill into data.data.
  const [scores, setScores]   = useState([])

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
      // ─── CHANGE 8 ────────────────────────────────────────────────────────
      // Endpoint unchanged, but we now extract data.data.quizScores to match
      // the HTML logic: `data.success && data.data.quizScores`.
      // Old React code read res.data directly and then used s.week.
      const res = await axios.get(
        `${API_URL}/api/iitm_maths2_scores_databases?email=${encodeURIComponent(email)}`,
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
      {/* Page title — unchanged from old React, matches HTML heading */}
      <div className="page-title" data-aos="fade" style={{ marginBottom: '2rem' }}>
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>IITM Mathematics II</h1>
                <p className="mb-0">
                  Master advanced mathematical concepts including linear algebra, calculus,
                  and differential equations for engineering applications.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">IITM Mathematics II</li>
            </ol>
          </div>
        </nav>
      </div>

      <div className="container">
        <div className="course-list" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 15px' }}>

          {/* ─── CHANGE 9 ───────────────────────────────────────────────────
              Iterate over availableTopics (was availableWeeks).
              Score lookup now calls findTopicAssessment(scores, topic.topicName)
              instead of findWeekAssessment(week.week).                      */}
          {availableTopics.map((topic) => {
            const assessment    = findTopicAssessment(scores, topic.topicName)
            const isCompleted   = assessment != null
            const score         = assessment?.percentage    || 0
            const correctAnswers = assessment?.correctAnswers || 0
            const totalQuestions = assessment?.totalQuestions || 0
            const lastAttempted = assessment?.timestamp      || null
            const attemptCount  = assessment?.attemptCount   || 0

            // Colour logic — identical to HTML and old React
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

                      {/* ─── CHANGE 10 ──────────────────────────────────────
                          Button label: "Retest" if completed, "Start Assessment"
                          otherwise — matches HTML createCourseHTML().
                          Score detail line uses correctAnswers (mapped from
                          HTML's `actualScore` / `score` field).             */}
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

export default Math2
