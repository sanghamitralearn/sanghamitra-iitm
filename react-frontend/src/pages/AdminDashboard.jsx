import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL


function getTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown time'
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago'
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
  if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago'
  return new Date(timestamp).toLocaleDateString()
}

function getScoreClass(score) {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

async function fetchFromAPI(url) {
  const res = await fetch(url, { credentials: 'include' })
  return res.json()
}

async function loadCoding() {
  try {
    const data = await fetchFromAPI(`${VITE_API_URL}/api/coding-submissions`)
    const arr = Array.isArray(data) ? data : (data.submissions || data.data || [])
    return arr.filter(s => s.email && s.email.toLowerCase() !== 'test@example.com').map(s => ({
      userName: s.username || s.name || s.email,
      subject: 'Programming', subjectKey: 'coding',
      topic: s.topic || 'Coding Assignment',
      score: s.percentage || ((s.score / (s.maxScore || 100)) * 100) || 0,
      timestamp: s.timestamp || new Date().toISOString(),
      icon: 'bi-code-slash', iconClass: 'programming',
    }))
  } catch { return [] }
}

async function loadPDSA() {
  try {
    const data = await fetchFromAPI(`${VITE_API_URL}/api/pdsa-submissions`)
    const arr = Array.isArray(data) ? data : (data.submissions || data.data || [])
    return arr.filter(s => s.email && s.email.toLowerCase() !== 'test@example.com').map(s => ({
      userName: s.username || s.name || s.email,
      subject: 'Quiz Test (PDSA)', subjectKey: 'pdsa',
      topic: s.topic || 'Quiz Test',
      score: s.percentage || ((s.score / (s.maxScore || 100)) * 100) || 0,
      timestamp: s.timestamp || new Date().toISOString(),
      icon: 'bi-pencil-square', iconClass: 'dsa',
    }))
  } catch { return [] }
}

async function loadInterview() {
  try {
    const data = await fetchFromAPI(`${VITE_API_URL}/api/interview-submissions`)
    const arr = Array.isArray(data) ? data : (data.submissions || data.data || [])
    return arr.filter(s => s.email && s.email.toLowerCase() !== 'test@example.com').map(s => ({
      userName: s.username || s.name || s.email,
      subject: 'Interview', subjectKey: 'interview',
      topic: s.topic || 'Interview Assessment',
      score: s.percentage || ((s.score / (s.maxScore || 100)) * 100) || 0,
      timestamp: s.timestamp || new Date().toISOString(),
      icon: 'bi-mic', iconClass: 'interview',
    }))
  } catch { return [] }
}

async function loadMath1() {
  try {
    const result = await fetchFromAPI(`${VITE_API_URL}/api/iitmmath_scores`)
    const data = result.success && result.data ? (Array.isArray(result.data) ? result.data : [result.data]) : (Array.isArray(result) ? result : [])
    const activities = []
    data.forEach(student => {
      if (student.quizScores?.length) {
        student.quizScores.forEach(quiz => {
          activities.push({
            userName: student.username || student.name || student.email,
            subject: 'Mathematics-1', subjectKey: 'math1',
            topic: quiz.topic || 'Quiz',
            score: quiz.percentage || ((quiz.correctAnswers / quiz.totalQuestions) * 100) || 0,
            timestamp: quiz.timestamp || new Date().toISOString(),
            icon: 'bi-calculator', iconClass: 'math',
          })
        })
      }
    })
    return activities
  } catch { return [] }
}

async function loadMath2() {
  try {
    const result = await fetchFromAPI(`${VITE_API_URL}/api/iitm_maths2_scores_databases`)
    const activities = []
    if (result.success && Array.isArray(result.data)) {
      result.data.forEach(student => {
        if (student.quizScores?.length) {
          student.quizScores.forEach(quiz => {
            const pct = quiz.percentage || ((quiz.score / quiz.totalQuestions) * 100) || ((quiz.correctAnswers / quiz.totalQuestions) * 100) || 0
            activities.push({
              userName: student.username || student.name || student.email || 'Unknown User',
              subject: 'Mathematics-2', subjectKey: 'math2',
              topic: quiz.topic || `Quiz Attempt ${quiz.attemptNumber || 1}`,
              score: Math.round(pct * 100) / 100,
              timestamp: quiz.timestamp || student.updatedAt || new Date().toISOString(),
              icon: 'bi-calculator', iconClass: 'math2',
            })
          })
        }
      })
    }
    return activities
  } catch { return [] }
}

async function loadCT() {
  try {
    const result = await fetchFromAPI(`${VITE_API_URL}/api/iitm_ct_scores`)
    const activities = []
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data]
      data.forEach(student => {
        if (student.scores?.length) {
          student.scores.forEach(score => {
            activities.push({
              userName: student.username || student.name || student.email,
              subject: 'Computational Thinking', subjectKey: 'ct',
              topic: score.topic || 'CT Exercise',
              score: score.percentage || ((score.score / (score.totalQuestions || 1)) * 100) || 0,
              timestamp: score.timestamp || new Date().toISOString(),
              icon: 'bi-cpu', iconClass: 'ct',
            })
          })
        }
      })
    }
    return activities
  } catch { return [] }
}

async function loadStats1() {
  try {
    const result = await fetchFromAPI(`${VITE_API_URL}/api/statistics_scores`)
    const activities = []
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data]
      data.forEach(student => {
        if (student.quizScores?.length) {
          student.quizScores.forEach(quiz => {
            activities.push({
              userName: student.username || student.name || student.email,
              subject: 'Statistics-1', subjectKey: 'stats1',
              topic: quiz.topic || 'Statistics Quiz',
              score: quiz.percentage || ((quiz.correctAnswers / quiz.totalQuestions) * 100) || 0,
              timestamp: quiz.timestamp || new Date().toISOString(),
              icon: 'bi-bar-chart', iconClass: 'stats',
            })
          })
        }
      })
    }
    return activities
  } catch { return [] }
}

async function loadStats2() {
  try {
    const result = await fetchFromAPI(`${VITE_API_URL}/api/iitm_stats2_scores`)
    const activities = []
    const arr = Array.isArray(result) ? result : []
    arr.forEach(student => {
      if (student.scores?.length) {
        student.scores.forEach(score => {
          activities.push({
            userName: student.name || student.email,
            subject: 'Statistics-2', subjectKey: 'stats2',
            topic: score.subtopic || `Week ${score.week}`,
            score: ((score.score / (score.totalQuestions || 1)) * 100) || 0,
            timestamp: score.dateAttempted || new Date().toISOString(),
            icon: 'bi-bar-chart', iconClass: 'stats2',
          })
        })
      }
    })
    return activities
  } catch { return [] }
}

const s = {
  page: { backgroundColor: '#f5f7fb', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1rem 0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  headerTitle: { margin: 0, fontSize: '1.5rem' },
  notifContainer: { position: 'relative', marginRight: '1.5rem', cursor: 'pointer' },
  bell: { fontSize: '1.5rem', color: 'white', position: 'relative', transition: 'transform 0.3s', display: 'inline-block' },
  badge: {
    position: 'absolute', top: '-8px', right: '-8px',
    backgroundColor: '#dc3545', color: 'white', borderRadius: '50%',
    padding: '0.25rem 0.5rem', fontSize: '0.7rem', minWidth: '20px', textAlign: 'center',
    animation: 'pulse 2s infinite',
  },
  dropdown: {
    position: 'absolute', top: '40px', right: '-10px', width: '400px',
    background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    zIndex: 1000, maxHeight: '500px', overflowY: 'auto',
  },
  dropdownHeader: {
    padding: '1rem', borderBottom: '1px solid #e9ecef',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', borderRadius: '12px 12px 0 0',
    position: 'sticky', top: 0, zIndex: 1,
  },
  dropdownFooter: {
    padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #e9ecef',
    background: 'white', position: 'sticky', bottom: 0,
  },
  sidebar: { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: '100%' },
  sidebarSticky: { position: 'sticky', top: '20px' },
  navLink: { color: '#343a40', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.5rem', transition: 'all 0.3s', display: 'flex', alignItems: 'center', textDecoration: 'none' },
  navLinkActive: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' },
  dashCard: { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.3s, box-shadow 0.3s', height: '100%' },
  cardIcon: { width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '1rem' },
  welcomeCard: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#667eea', marginRight: '1.5rem', flexShrink: 0 },
  userAvatarSm: { width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white', marginRight: '0.5rem' },
  notifItem: { padding: '1rem', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', transition: 'background-color 0.3s' },
  notifIcon: { width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.3rem', flexShrink: 0 },
}

const iconColors = {
  ct:          { background: 'rgba(102,126,234,0.1)', color: '#667eea' },
  python:      { background: 'rgba(52,152,219,0.1)',  color: '#3498db' },
  dsa:         { background: 'rgba(155,89,182,0.1)',  color: '#9b59b6' },
  math:        { background: 'rgba(46,204,113,0.1)',  color: '#2ecc71' },
  stats:       { background: 'rgba(241,196,15,0.1)',  color: '#f1c40f' },
  math2:       { background: 'rgba(230,126,34,0.1)',  color: '#e67e22' },
  stats2:      { background: 'rgba(231,76,60,0.1)',   color: '#e74c3c' },
  programming: { background: 'rgba(52,152,219,0.1)',  color: '#3498db' },
  interview:   { background: 'rgba(155,89,182,0.1)',  color: '#9b59b6' },
}

const dashboardCards = [
  { key: 'ct',    icon: 'bi-cpu',         iconStyle: { background: 'rgba(155,89,182,0.1)', color: '#9b59b6' }, title: 'Computational Thinking', desc: 'Monitor Computational Thinking assignments, logic exercises, and problem-solving tasks.', to: '/admin/iitm-ct' },
  { key: 'py',    icon: 'bi-code-slash',  iconStyle: { background: 'rgba(52,152,219,0.1)', color: '#3498db' }, title: 'Python Dashboard',         desc: 'Monitor Python programming assignments, code submissions, and evaluation results.',     to: '/admin/python' },
  { key: 'dsa',   icon: 'bi-diagram-3',   iconStyle: { background: 'rgba(102,126,234,0.1)', color: '#667eea' }, title: 'DSA Dashboard',          desc: 'View and manage Data Structures and Algorithms submissions, scores, and student performance.', to: '/admin/dsa' },
  { key: 'm1',    icon: 'bi-calculator',  iconStyle: { background: 'rgba(52,152,219,0.1)', color: '#3498db' }, title: 'Mathematics-1 Dashboard', desc: 'Track mathematics assignments, problem sets, and analytical reasoning exercises.',          to: '/admin/iitm-math' },
  { key: 'm2',    icon: 'bi-calculator',  iconStyle: { background: 'rgba(52,152,219,0.1)', color: '#3498db' }, title: 'Mathematics-2 Dashboard', desc: 'Monitor advanced mathematics concepts, proofs, and mathematical modeling assignments.',     to: '/admin/iitm-math2' },
  { key: 's1',    icon: 'bi-bar-chart',   iconStyle: { background: 'rgba(52,152,219,0.1)', color: '#3498db' }, title: 'Statistics-1 Dashboard',  desc: 'View statistical analysis assignments, data interpretation tasks, and probability exercises.', to: '/admin/stats1' },
  { key: 's2',    icon: 'bi-bar-chart',   iconStyle: { background: 'rgba(52,152,219,0.1)', color: '#3498db' }, title: 'Statistics-2 Dashboard',  desc: 'Monitor advanced statistical methods, inferential statistics, and data modeling assignments.', to: '/admin/stats2' },
]

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasNewNotifs, setHasNewNotifs] = useState(false)

  const dropdownRef = useRef(null)
  const refreshTimer = useRef(null)

  // Auth check
  useEffect(() => {
    axios.get(`${VITE_API_URL}/api/session-info`, { withCredentials: true })
      .then(res => {
        if (res.data && res.data.email) setUser(res.data)
        else navigate('/login', { state: { from: { pathname: '/admin' } }, replace: true })
      })
      .catch(() => navigate('/login', { state: { from: { pathname: '/admin' } }, replace: true }))
      .finally(() => setAuthLoading(false))
  }, [navigate])

  const loadNotifications = useCallback(async (prevCount = 0) => {
    setNotifLoading(true)
    try {
      const results = await Promise.allSettled([
        loadCoding(), loadPDSA(), loadInterview(),
        loadMath1(), loadMath2(), loadCT(),
        loadStats1(), loadStats2(),
      ])
      let all = []
      results.forEach(r => { if (r.status === 'fulfilled') all = [...all, ...r.value] })
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      const top50 = all.slice(0, 50).map(n => ({ ...n, read: false }))
      const isNew = top50.length > prevCount
      setNotifications(top50)
      setHasNewNotifs(isNew)
      setUnreadCount(isNew ? top50.length : 0)
    } catch {
      // keep existing
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      loadNotifications(0)
      refreshTimer.current = setInterval(() => {
        setNotifications(prev => { loadNotifications(prev.length); return prev })
      }, 30000)
    }
    return () => clearInterval(refreshTimer.current)
  }, [authLoading, user, loadNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    if (!dropdownOpen) markAllRead()
    setDropdownOpen(v => !v)
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    setHasNewNotifs(false)
  }

  const handleLogout = async () => {
    try { await axios.post(`${VITE_API_URL}/api/signout`, {}, { withCredentials: true }) } catch {}
    navigate('/login', { replace: true })
  }

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    )
  }

  const navItems = [
    { to: '/admin',          icon: 'bi-speedometer2', label: 'Dashboard Overview', exact: true },
    { to: '/admin/iitm-ct',  icon: 'bi-cpu',          label: 'Computational Thinking' },
    { to: '/admin/python',   icon: 'bi-code-slash',   label: 'Python Dashboard' },
    { to: '/admin/dsa',      icon: 'bi-diagram-3',    label: 'DSA Dashboard' },
    { to: '/admin/iitm-math',icon: 'bi-diagram-3',    label: 'MATH Dashboard' },
    { to: '/admin/iitm-math2',icon:'bi-diagram-3',    label: 'Math-2 Dashboard' },
    { to: '/admin/stats1',   icon: 'bi-diagram-3',    label: 'Statistics Dashboard' },
    { to: '/admin/stats2',   icon: 'bi-diagram-3',    label: 'Statistics-2 Dashboard' },
    { to: '/admin/activity', icon: 'bi-diagram-3',    label: 'Activity Dashboard' },
    { to: '/admin/content',  icon: 'bi-diagram-3',    label: 'Content Dashboard' },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.2); background-color: #ff4444; }
          100% { transform: scale(1); }
        }
        @keyframes blink {
          0%   { opacity: 1; }
          50%  { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .admin-nav-link:hover { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; }
        .admin-dash-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px rgba(0,0,0,0.1) !important; }
        .admin-notif-item:hover { background-color: #f8f9fa; }
        .score-high  { background: rgba(40,167,69,0.1);  color: #28a745; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .score-medium{ background: rgba(255,193,7,0.1);  color: #ffc107; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .score-low   { background: rgba(220,53,69,0.1);  color: #dc3545; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .blink { animation: blink 1s infinite; }
        @media (max-width: 768px) {
          .admin-notif-dropdown { width: 300px !important; right: -50px !important; }
        }
      `}</style>

      <div style={s.page}>
        {/* Header */}
        <header style={s.header}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-lock-fill me-2 fs-4"></i>
                <h1 style={s.headerTitle}>IITM Admin Dashboard</h1>
              </div>

              <div className="d-flex align-items-center">
                {/* Notification Bell */}
                <div ref={dropdownRef} style={s.notifContainer}>
                  <div
                    style={{ ...s.bell, ...(hasNewNotifs ? {} : {}) }}
                    className={hasNewNotifs ? 'blink' : ''}
                    onClick={handleBellClick}
                  >
                    <i className="bi bi-bell-fill"></i>
                    {unreadCount > 0 && (
                      <span style={s.badge}>{unreadCount}</span>
                    )}
                  </div>

                  {dropdownOpen && (
                    <div style={s.dropdown} className="admin-notif-dropdown">
                      <div style={s.dropdownHeader}>
                        <h6 style={{ margin: 0, fontWeight: 600 }}>Recent Activity</h6>
                        <button
                          className="btn btn-link btn-sm text-white p-0"
                          onClick={markAllRead}
                        >
                          <i className="bi bi-check-all"></i>
                        </button>
                      </div>

                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {notifLoading ? (
                          <li style={{ padding: '2rem', textAlign: 'center' }}>
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 text-muted">Loading notifications...</p>
                          </li>
                        ) : notifications.length === 0 ? (
                          <li style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
                            <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: '#dee2e6', display: 'block', marginBottom: '1rem' }}></i>
                            <p>No recent activity</p>
                            <small className="text-muted">New submissions will appear here</small>
                          </li>
                        ) : (
                          notifications.slice(0, 20).map((n, i) => (
                            <li
                              key={i}
                              style={{ ...s.notifItem, backgroundColor: n.read ? 'white' : '#e8f4fd', animation: 'slideIn 0.3s ease-out' }}
                              className="admin-notif-item"
                            >
                              <div style={{ ...s.notifIcon, ...(iconColors[n.iconClass] || iconColors.programming) }}>
                                <i className={`bi ${n.icon}`}></i>
                              </div>
                              <div style={{ flex: 1 }}>
                                <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#343a40', fontSize: '0.95rem' }}>
                                  {n.userName || 'Unknown User'}
                                </strong>
                                <small style={{ color: '#6c757d', fontSize: '0.8rem', display: 'block' }}>
                                  {n.subject} - {n.topic || 'Exercise'}
                                </small>
                                {n.score != null && (
                                  <span className={getScoreClass(n.score)} style={{ display: 'inline-block', marginTop: '0.25rem' }}>
                                    {Math.round(n.score)}%
                                  </span>
                                )}
                                <div style={{ fontSize: '0.7rem', color: '#adb5bd', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <i className="bi bi-clock"></i> {getTimeAgo(n.timestamp)}
                                </div>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>

                      <div style={s.dropdownFooter}>
                        <a
                          style={{ color: '#667eea', textDecoration: 'none', fontSize: '0.9rem', cursor: 'pointer' }}
                          onClick={() => loadNotifications(notifications.length)}
                        >
                          Refresh Notifications
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <div style={{ ...s.userAvatarSm, background: '#e9ecef', color: '#343a40' }}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <span>{user?.username || user?.email || 'Admin'}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/dashboard"><i className="bi bi-speedometer2 me-2"></i>User Dashboard</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container my-4">
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 mb-4">
              <div style={s.sidebar}>
                <div style={s.sidebarSticky}>
                  <ul className="nav flex-column">
                    {navItems.map((item) => (
                      <li className="nav-item" key={item.to}>
                        <Link
                          to={item.to}
                          style={s.navLink}
                          className="admin-nav-link"
                        >
                          <i className={`bi ${item.icon}`} style={{ marginRight: '10px', width: '20px', textAlign: 'center' }}></i>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 pt-3 border-top">
                    <h6 className="text-muted mb-3">Quick Actions</h6>
                    <div>
                      <button
                        className="btn btn-outline-success btn-sm me-2 mb-2"
                        onClick={() => alert('Export functionality would be implemented here')}
                      >
                        <i className="bi bi-download"></i> Export Data
                      </button>
                      <button
                        className="btn btn-outline-primary btn-sm mt-2"
                        onClick={() => loadNotifications(0)}
                      >
                        <i className="bi bi-arrow-repeat"></i> Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Panel */}
            <div className="col-lg-9">
              {/* Welcome Card */}
              <div style={s.welcomeCard}>
                <div className="d-flex align-items-center">
                  <div style={s.avatar}>
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div>
                    <h2 className="mb-1">Welcome back, {user?.username || 'Admin'}!</h2>
                    <p className="mb-0">Here's what's happening with your platform today.</p>
                  </div>
                </div>
              </div>

              {/* Dashboard Cards */}
              <div className="row">
                {dashboardCards.map((card) => (
                  <div className="col-md-4 mb-4" key={card.key}>
                    <div style={s.dashCard} className="admin-dash-card">
                      <div style={{ ...s.cardIcon, ...card.iconStyle }}>
                        <i className={`bi ${card.icon}`}></i>
                      </div>
                      <h4>{card.title}</h4>
                      <p className="text-muted">{card.desc}</p>
                      <Link to={card.to} className="btn btn-primary">Open Dashboard</Link>
                    </div>
                  </div>
                ))}

                {/* User Management */}
                <div className="col-md-6 mb-4">
                  <div style={s.dashCard} className="admin-dash-card">
                    <div style={{ ...s.cardIcon, background: 'rgba(40,167,69,0.1)', color: '#28a745' }}>
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <h4>User Management</h4>
                    <p className="text-muted">Manage student accounts, permissions, and access controls across the platform.</p>
                    <Link to="/admin/users" className="btn btn-primary">Manage Users</Link>
                  </div>
                </div>

                {/* Analytics */}
                <div className="col-md-6 mb-4">
                  <div style={s.dashCard} className="admin-dash-card">
                    <div style={{ ...s.cardIcon, background: 'rgba(255,193,7,0.1)', color: '#ffc107' }}>
                      <i className="bi bi-bar-chart"></i>
                    </div>
                    <h4>Analytics</h4>
                    <p className="text-muted">Deep dive into platform analytics, performance metrics, and learning trends.</p>
                    <Link to="/admin/analytics" className="btn btn-primary">View Analytics</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
