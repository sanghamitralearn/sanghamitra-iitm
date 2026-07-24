import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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
      icon: 'bi-pencil-square', iconClass: 'pdsa',
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
    const result = await fetchFromAPI(`${VITE_API_URL}/api/iitm_stats2_scores_databases`)
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
    color: 'white', borderRadius: '50%',
    padding: '0.25rem 0.5rem', fontSize: '0.7rem', minWidth: '20px', textAlign: 'center',
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
  math:        { background: 'rgba(46,204,113,0.1)',  color: '#2ecc71' },
  stats:       { background: 'rgba(241,196,15,0.1)',  color: '#f1c40f' },
  math2:       { background: 'rgba(230,126,34,0.1)',  color: '#e67e22' },
  stats2:      { background: 'rgba(231,76,60,0.1)',   color: '#e74c3c' },
  programming: { background: 'rgba(52,152,219,0.1)',  color: '#3498db' },
  interview:   { background: 'rgba(155,89,182,0.1)',  color: '#9b59b6' },
  java:        { background: 'rgba(248,152,32,0.1)',  color: '#f89820' },
  dbms:        { background: 'rgba(68,121,161,0.1)',  color: '#4479a1' },
  python:      { background: 'rgba(52,152,219,0.1)',  color: '#3498db' },
  pdsa:        { background: 'rgba(155,89,182,0.1)',  color: '#9b59b6' },
  sat:         { background: 'rgba(0,61,143,0.1)',    color: '#003D8F' },
  gre:         { background: 'rgba(111,66,193,0.1)',  color: '#6f42c1' },
  jee:         { background: 'rgba(220,53,69,0.1)',   color: '#dc3545' },
  jee_adv:     { background: 'rgba(255,107,0,0.1)',   color: '#ff6b00' },
  gmat:        { background: 'rgba(0,137,123,0.1)', color: '#00897b' },
  cat:         { background: 'rgba(232,89,12,0.1)',   color: '#e8590c' },
  "gate-da" :  { background: 'rgba(32,201,151,0.1)',  color: '#20c997' },
}

const LAST_SEEN_KEY = 'admin_notif_last_seen'

const subjectApis = [
  { key: 'm1',        url: '/api/iitmmath_scores',                    countFn: d => (d.data || d || []).length },
  { key: 'm2',        url: '/api/iitm_math2_scores',                  countFn: d => (d.data || d || []).length },
  { key: 's1',        url: '/api/statistics_scores',                  countFn: d => (d.data || d || []).length },
  { key: 's2',   url: '/api/iitm_stats2_scores_databases',    countFn: d => (Array.isArray(d) ? d : (d.data || [])).length },
  { key: 'ct',        url: '/api/iitm_ct_scores',                     countFn: d => (d.data || d || []).length },
  { key: 'prog_java',   url: '/api/mcq-quiz/admin/attempts?course=java',   countFn: d => new Set((d.attempts || []).map(a => a.email).filter(Boolean)).size },
  { key: 'prog_python', url: '/api/mcq-quiz/admin/attempts?course=python', countFn: d => new Set((d.attempts || []).map(a => a.email).filter(Boolean)).size },
  { key: 'prog_dbms',    url: '/api/mcq-quiz/admin/attempts?course=dbms',    countFn: d => new Set((d.attempts || []).map(a => a.email).filter(Boolean)).size },
  { key: 'prog_pdsa',      url: '/api/pdsa-submissions',                   countFn: d => {
      const arr = Array.isArray(d) ? d : (d.submissions || d.data || [])
      const uniqueStudents = new Set(
        arr
          .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
          .map(s => s.email.toLowerCase())
      )
      return uniqueStudents.size
    }
  },
  { key: 'sat',       url: '/api/sat_scores',                         countFn: d => new Set((Array.isArray(d) ? d : []).map(e => e.email).filter(Boolean)).size },
  { key: 'gre',       url: '/api/gre_scores',                         countFn: d => new Set((Array.isArray(d) ? d : []).map(e => e.email).filter(Boolean)).size },
  { key: 'jee',       url: '/api/jee_main_admin_scores',              countFn: d => ((d && d.data) || []).length },
  { key: 'jee_adv',   url: '/api/jee_admin_scores',                   countFn: d => ((d && d.data) || (Array.isArray(d) ? d : [])).length },
  { key: 'gmat', url: '/api/gmat_scores', countFn: d => new Set((Array.isArray(d) ? d : []).map(e => e.email).filter(Boolean)).size },
  { key: 'cat',     url: '/api/cat_scores',                countFn: d => new Set((Array.isArray(d) ? d : (d.data || [])).map(e => e.email).filter(Boolean)).size },
  { key: 'gate-da', url: '/api/gate_da_admin_scores',      countFn: d => ((d && d.data) || (Array.isArray(d) ? d : [])).length },

]

const AdminDashboard = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasNewNotifs, setHasNewNotifs] = useState(false)
  const [subjectCounts, setSubjectCounts] = useState({})

  const dropdownRef = useRef(null)
  const refreshTimer = useRef(null)

  // Returns the timestamp (ms) of the last time admin opened the dropdown
  const getLastSeen = () => parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10)

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetchFromAPI(`${VITE_API_URL}/api/admin-notifications`)
      console.log('Notifications API Response:', res) 
      const all = res.success ? res.data : []

      let lastSeen = getLastSeen()

      // First visit ever — initialize lastSeen to the latest notification's timestamp
      // so we don't flood the badge with all historical data
      if (!lastSeen && all.length > 0) {
        const latestTs = new Date(all[0].timestamp || 0).getTime()
        localStorage.setItem(LAST_SEEN_KEY, latestTs.toString())
        lastSeen = latestTs
      }
  

      const top50 = all.slice(0, 50).map(n => ({
        ...n,
        read: new Date(n.timestamp || 0).getTime() <= lastSeen
      }))

      const newCount = top50.filter(n => !n.read).length
      setNotifications(top50)
      setUnreadCount(newCount)
      setHasNewNotifs(newCount > 0)
    } catch {
      // keep existing
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    refreshTimer.current = setInterval(loadNotifications, 30000)
    const onVisible = () => { if (document.visibilityState === 'visible') loadNotifications() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(refreshTimer.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadNotifications])

  useEffect(() => {
    subjectApis.forEach(async ({ key, url, countFn }) => {
      try {
        const data = await fetchFromAPI(`${VITE_API_URL}${url}`)
        setSubjectCounts(prev => ({ ...prev, [key]: countFn(data) }))
      } catch { 
        // leave as undefined
      }
    })
  }, [])

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
    if (!dropdownOpen) {
      loadNotifications()
      markAllRead()
    }
    setDropdownOpen(v => !v)
  }

  const markAllRead = () => {
    // Save current time so future loads know what was already seen
    localStorage.setItem(LAST_SEEN_KEY, Date.now().toString())
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    setHasNewNotifs(false)
  }

  const navItems = [
    { to: '/admin',            icon: 'bi-speedometer2', label: 'Dashboard Overview' },
    { to: '/admin/math',       icon: 'bi-calculator',   label: 'Mathematics 1' },
    { to: '/admin/iitm-math2', icon: 'bi-calculator',   label: 'Mathematics 2' },
    { to: '/admin/stats1',     icon: 'bi-bar-chart',    label: 'Statistics 1' },
    { to: '/admin/stats2',     icon: 'bi-bar-chart',    label: 'Statistics 2' },
    { to: '/admin/iitm-ct',    icon: 'bi-cpu',          label: 'Computational Thinking' },
    { to: '/admin/programming?course=java',   icon: 'bi-cup-hot-fill',   label: 'Java' },
    { to: '/admin/programming?course=python', icon: 'bi-filetype-py',    label: 'Python' },
    { to: '/admin/programming?course=dbms',    icon: 'bi-database-fill',  label: 'DBMS' },
    { to: '/admin/pdsa',       icon: 'bi-diagram-3-fill', label: 'PDSA' },
    { to: '/admin/sat',        icon: 'bi-pencil-fill',    label: 'SAT' },
    { to: '/admin/gre',        icon: 'bi-mortarboard-fill', label: 'GRE' },
    { to: '/admin/jee-main',   icon: 'bi-mortarboard-fill', label: 'JEE Main' },
    { to: '/admin/jee-advanced',  icon: 'bi-trophy-fill',      label: 'JEE Advanced' },
    { to: '/admin/gmat', icon: 'bi-briefcase-fill',   label: 'GMAT' },
    { to: '/admin/cat',        icon: 'bi-journal-check',  label: 'CAT' },
    { to: '/admin/gate-da',    icon: 'bi-cpu-fill',       label: 'GATE DA' },

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
                    {!notifLoading && (
                      <span style={{ ...s.badge, backgroundColor: unreadCount > 0 ? '#dc3545' : '#6c757d', animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none' }}>{unreadCount}</span>
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
                                    {n.marks != null && n.maxMarks != null
                                      ? `${Math.round(n.marks * 100) / 100}/${n.maxMarks} · ${Math.round(n.score)}%`
                                      : `${Math.round(n.score)}%`}
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
                    <h2 className="mb-1">Welcome to Admin Dashboard!</h2>
                    <p className="mb-0">Here's what's happening with your platform today.</p>
                  </div>
                </div>
              </div>

              {/* Foundation Courses */}
              <h5 className="text-muted mb-3 fw-semibold" style={{ letterSpacing: '0.03em' }}>
                <i className="bi bi-mortarboard-fill me-2" style={{ color: '#667eea' }}></i>Foundation Courses
              </h5>
              <div className="row mb-4">
                {[
                  { key: 'm1',   icon: 'bi-calculator',  iconStyle: { background: 'rgba(52,152,219,0.1)',   color: '#3498db' }, title: 'Mathematics 1',           to: '/admin/math' },
                  { key: 'm2',   icon: 'bi-calculator',  iconStyle: { background: 'rgba(230,126,34,0.1)',   color: '#e67e22' }, title: 'Mathematics 2',           to: '/admin/iitm-math2' },
                  { key: 's1',   icon: 'bi-bar-chart',   iconStyle: { background: 'rgba(241,196,15,0.1)',   color: '#f1c40f' }, title: 'Statistics 1',            to: '/admin/stats1' },
                  { key: 's2',   icon: 'bi-bar-chart',   iconStyle: { background: 'rgba(231,76,60,0.1)',    color: '#e74c3c' }, title: 'Statistics 2',            to: '/admin/stats2' },
                  { key: 'ct',   icon: 'bi-cpu',         iconStyle: { background: 'rgba(155,89,182,0.1)',   color: '#9b59b6' }, title: 'Computational Thinking',  to: '/admin/iitm-ct' },
                ].map((card) => (
                  <div className="col-md-4 mb-4" key={card.key}>
                    <div style={s.dashCard} className="admin-dash-card">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div style={{ ...s.cardIcon, marginBottom: 0, ...card.iconStyle }}>
                          <i className={`bi ${card.icon}`}></i>
                        </div>
                        {subjectCounts[card.key] != null && (
                          <span className="badge rounded-pill" style={{ background: card.iconStyle.color, color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            {subjectCounts[card.key]} students
                          </span>
                        )}
                      </div>
                      <h5 className="mb-3">{card.title}</h5>
                      <Link to={card.to} className="btn btn-primary btn-sm">Open Dashboard</Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Programming Courses */}
              <h5 className="text-muted mb-3 fw-semibold" style={{ letterSpacing: '0.03em' }}>
                <i className="bi bi-code-square me-2" style={{ color: '#f89820' }}></i>Programming Courses
              </h5>
              <div className="row mb-4">
                {[
                  { key: 'prog_java',   icon: 'bi-cup-hot-fill',   iconStyle: { background: 'rgba(248,152,32,0.1)',  color: '#f89820' }, title: 'Java',    to: '/admin/programming?course=java' },
                  { key: 'prog_python', icon: 'bi-filetype-py',    iconStyle: { background: 'rgba(55,118,171,0.1)',  color: '#3776ab' }, title: 'Python',  to: '/admin/programming?course=python' },
                  { key: 'prog_dbms',   icon: 'bi-database-fill',  iconStyle: { background: 'rgba(68,121,161,0.1)',  color: '#4479a1' }, title: 'DBMS',     to: '/admin/programming?course=dbms' },
                  { key: 'prog_pdsa',   icon: 'bi-diagram-3-fill', iconStyle: { background: 'rgba(155,89,182,0.1)',  color: '#9b59b6' }, title: 'PDSA',     to: '/admin/pdsa' },
                ].map((card) => (
                  <div className="col-md-3 mb-4" key={card.key}>
                    <div style={s.dashCard} className="admin-dash-card">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div style={{ ...s.cardIcon, marginBottom: 0, ...card.iconStyle }}>
                          <i className={`bi ${card.icon}`}></i>
                        </div>
                        {subjectCounts[card.key] != null && (
                          <span className="badge rounded-pill" style={{ background: card.iconStyle.color, color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            {subjectCounts[card.key]} students
                          </span>
                        )}
                      </div>
                      <h5 className="mb-3">{card.title}</h5>
                      <Link to={card.to} className="btn btn-primary btn-sm">Open Dashboard</Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Entrance / Competitive Exam Courses */}
              <h5 className="text-muted mb-3 fw-semibold" style={{ letterSpacing: '0.03em' }}>
                <i className="bi bi-trophy me-2" style={{ color: '#ff6b6b' }}></i>Competitive Exam Courses
              </h5>
              <div className="row mb-4">
                {[
                  { key: 'sat', icon: 'bi-pencil-fill',    iconStyle: { background: 'rgba(0,61,143,0.1)',    color: '#003D8F' }, title: 'SAT',           to: '/admin/sat' },
                  { key: 'gre', icon: 'bi-mortarboard-fill', iconStyle: { background: 'rgba(111,66,193,0.1)',  color: '#6f42c1' }, title: 'GRE',           to: '/admin/gre' },
                  { key: 'jee', icon: 'bi-mortarboard-fill', iconStyle: { background: 'rgba(220,53,69,0.1)',   color: '#dc3545' }, title: 'JEE Main',      to: '/admin/jee-main' },
                  { key: 'jee_adv', icon: 'bi-trophy-fill',      iconStyle: { background: 'rgba(255,107,0,0.1)',  color: '#ff6b00' }, title: 'JEE Advanced',  to: '/admin/jee-advanced' },
                  { key: 'gmat', icon: 'bi-briefcase-fill',   iconStyle: { background: 'rgba(0,137,123,0.1)',  color: '#00897b' }, title: 'GMAT', to: '/admin/gmat' },
                  { key: 'cat', icon: 'bi-journal-check', iconStyle: { background: 'rgba(232,89,12,0.1)', color: '#e8590c' }, title: 'CAT', to: '/admin/cat' },
                  { key: 'gate-da', icon: 'bi-cpu-fill', iconStyle: { background: 'rgba(32,201,151,0.1)', color: '#20c997' }, title: 'GATE DA', to: '/admin/gate-da' },

                ].map((card) => (
                  <div className="col-md-3 mb-4" key={card.key}>
                    <div style={s.dashCard} className="admin-dash-card">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div style={{ ...s.cardIcon, marginBottom: 0, ...card.iconStyle }}>
                          <i className={`bi ${card.icon}`}></i>
                        </div>
                        {subjectCounts[card.key] != null && (
                          <span className="badge rounded-pill" style={{ background: card.iconStyle.color, color: '#fff', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                            {subjectCounts[card.key]} students
                          </span>
                        )}
                      </div>
                      <h5 className="mb-3">{card.title}</h5>
                      <Link to={card.to} className="btn btn-primary btn-sm">Open Dashboard</Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row">
                {/* AI-Powered Analysis */}
                <div className="col-12 mb-4">
                  <div style={s.dashCard} className="admin-dash-card">
                    <div style={{ ...s.cardIcon, background: 'rgba(102,126,234,0.1)', color: '#667eea' }}>
                      <i className="bi bi-magic"></i>
                    </div>
                    <h4>AI-Powered Subject Analysis</h4>
                    <p className="text-muted">Generate intelligent performance analysis for students across all subjects. Get detailed insights, identify knowledge gaps, and receive personalized recommendations for improvement.</p>
                    <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      Open a subject dashboard, select a student, then click <strong>AI Analysis</strong> to view insights.
                    </p>
                    <div className="row">
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/math" className="btn btn-primary w-100">
                          <i className="bi bi-calculator me-2"></i>Math
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/stats1" className="btn btn-success w-100">
                          <i className="bi bi-bar-chart me-2"></i>Statistics-1
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/stats2" className="btn btn-success w-100">
                          <i className="bi bi-bar-chart me-2"></i>Statistics-2
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/programming?course=python" className="btn btn-info w-100 text-white">
                          <i className="bi bi-code-slash me-2"></i>Python
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/pdsa" className="btn btn-danger w-100">
                          <i className="bi bi-diagram-3 me-2"></i>DSA
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/iitm-ct" className="btn btn-secondary w-100">
                          <i className="bi bi-cpu me-2"></i>Comp. Thinking
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/sat" className="btn btn-primary w-100">
                          <i className="bi bi-pencil-fill me-2"></i>SAT
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/gre" className="btn w-100 text-white" style={{ background: '#6f42c1', borderColor: '#6f42c1' }}>
                          <i className="bi bi-mortarboard-fill me-2"></i>GRE
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/jee-main" className="btn btn-danger w-100">
                          <i className="bi bi-mortarboard-fill me-2"></i>JEE Main
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/jee-advanced" className="btn w-100 text-white" style={{ background: '#ff6b00', borderColor: '#ff6b00' }}>
                          <i className="bi bi-trophy-fill me-2"></i>JEE Advanced
                        </Link>
                      </div>
                        <div className="col-md-3 mb-2">
                        <Link to="/admin/cat" className="btn w-100 text-white" style={{ background: '#e8590c', borderColor: '#e8590c' }}>
                          <i className="bi bi-journal-check me-2"></i>CAT
                        </Link>
                      </div>
                      <div className="col-md-3 mb-2">
                        <Link to="/admin/gmat" className="btn w-100 text-white" style={{ background: '#00897b', borderColor: '#00897b' }}>
                          <i className="bi bi-briefcase-fill me-2"></i>GMAT
                        </Link>
                      </div>
                       <div className="col-md-3 mb-2">
                        <Link to="/admin/gate-da" className="btn w-100 text-white" style={{ background: '#20c997', borderColor: '#20c997' }}>
                          <i className="bi bi-cpu-fill me-2"></i>GATE DA
                        </Link>
                      </div>
                    </div>     
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
