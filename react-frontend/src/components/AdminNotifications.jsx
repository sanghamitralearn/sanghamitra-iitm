import { useState, useEffect, useRef, useCallback } from 'react'

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
  gmat:        { background: 'rgba(0,137,123,0.1)',   color: '#00897b' },
  cat:         { background: 'rgba(232,89,12,0.1)',   color: '#e8590c' },
  jee:         { background: 'rgba(220,53,69,0.1)',   color: '#dc3545' },
  'jee-adv':     { background: 'rgba(102,16,242,0.1)',  color: '#6610f2' },
  'gate-da':     { background: 'rgba(32,201,151,0.1)',  color: '#20c997' },
}

const LAST_SEEN_KEY = 'admin_notif_last_seen'

const s = {
  wrap: { position: 'fixed', top: 18, right: 24, zIndex: 2000 },
  bellButton: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative', border: 'none',
  },
  bellIcon: { fontSize: '1.3rem', color: 'white' },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    color: 'white', borderRadius: '50%',
    padding: '0.2rem 0.45rem', fontSize: '0.65rem', minWidth: '18px', textAlign: 'center',
  },
  dropdown: {
    position: 'absolute', top: '56px', right: 0, width: '400px',
    background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    zIndex: 2001, maxHeight: '500px', overflowY: 'auto',
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
  notifItem: { padding: '1rem', borderBottom: '1px solid #e9ecef', display: 'flex', alignItems: 'center', transition: 'background-color 0.3s' },
  notifIcon: { width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontSize: '1.3rem', flexShrink: 0 },
}

// Shared notification bell + dropdown — same design, data source (GET /api/admin-notifications)
// and read/unread behavior (localStorage "last seen" timestamp) as the original AdminDashboard.jsx
// implementation, extracted so every Admin page can show identical Recent Activity notifications.
const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [hasNewNotifs, setHasNewNotifs] = useState(false)

  const dropdownRef = useRef(null)
  const refreshTimer = useRef(null)

  const getLastSeen = () => parseInt(localStorage.getItem(LAST_SEEN_KEY) || '0', 10)

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetchFromAPI(`${VITE_API_URL}/api/admin-notifications`)
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
    localStorage.setItem(LAST_SEEN_KEY, Date.now().toString())
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    setHasNewNotifs(false)
  }

  return (
    <>
      <style>{`
        @keyframes admin-notif-pulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.2); background-color: #ff4444; }
          100% { transform: scale(1); }
        }
        @keyframes admin-notif-blink {
          0%   { opacity: 1; }
          50%  { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes admin-notif-slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .admin-notif-item:hover { background-color: #f8f9fa; }
        .admin-notif-bell:hover { transform: scale(1.06); }
        .admin-notif-score-high  { background: rgba(40,167,69,0.1);  color: #28a745; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .admin-notif-score-medium{ background: rgba(255,193,7,0.1);  color: #ffc107; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .admin-notif-score-low   { background: rgba(220,53,69,0.1);  color: #dc3545; padding: 0.2rem 0.5rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .admin-notif-blink { animation: admin-notif-blink 1s infinite; }
        @media (max-width: 768px) {
          .admin-notif-dropdown { width: 300px !important; }
        }
      `}</style>

      <div ref={dropdownRef} style={s.wrap}>
        <button
          type="button"
          style={s.bellButton}
          className={`admin-notif-bell ${hasNewNotifs ? 'admin-notif-blink' : ''}`}
          onClick={handleBellClick}
          aria-label="Notifications"
        >
          <i className="bi bi-bell-fill" style={s.bellIcon}></i>
          {!notifLoading && (
            <span style={{ ...s.badge, backgroundColor: unreadCount > 0 ? '#dc3545' : '#6c757d', animation: unreadCount > 0 ? 'admin-notif-pulse 2s infinite' : 'none' }}>{unreadCount}</span>
          )}
        </button>

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
                    style={{ ...s.notifItem, backgroundColor: n.read ? 'white' : '#e8f4fd', animation: 'admin-notif-slideIn 0.3s ease-out' }}
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
                        <span className={`admin-notif-${getScoreClass(n.score)}`} style={{ display: 'inline-block', marginTop: '0.25rem' }}>
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
                onClick={() => loadNotifications()}
              >
                Refresh Notifications
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminNotifications
