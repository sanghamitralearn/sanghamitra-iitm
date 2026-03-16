import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/dashboard', label: 'Dashboard' },
]

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
    checkAuth()
  }, [location.pathname])

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/check-auth`, {
        withCredentials: true,
      })
      setIsAuthenticated(!!res.data.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleLogout = async () => {
    if (!window.confirm('Do you really want to logout?')) return
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/api/logout`, { withCredentials: true })
      document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; SameSite=None'
      setIsAuthenticated(false)
      window.location.href = '/'
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <nav style={styles.navbar}>
      {/* Logo */}
      <Link to="/" style={styles.brand}>
        <img src="/img/sbi.logo.png" alt="logo" style={styles.logo} />
        <span style={styles.brandName}>Sanghamitra&nbsp;Learning</span>
      </Link>

      {/* Desktop Nav */}
      <ul style={styles.navList}>
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              style={{
                ...styles.navLink,
                ...(location.pathname === to ? styles.navLinkActive : {}),
              }}
            >
              {label}
            </Link>
          </li>
        ))}
        <li>
          {isAuthenticated ? (
            <button onClick={handleLogout} style={styles.btnLogout}>
              Logout
            </button>
          ) : (
            <Link to="/login" style={styles.btnLogin}>
              Login
            </Link>
          )}
        </li>
      </ul>

      {/* Hamburger */}
      <button
        style={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span style={styles.hamburgerBar} />
        <span style={styles.hamburgerBar} />
        <span style={styles.hamburgerBar} />
      </button>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <ul style={styles.mobileMenu}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                style={{
                  ...styles.mobileLink,
                  ...(location.pathname === to ? styles.mobileLinkActive : {}),
                }}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            {isAuthenticated ? (
              <button onClick={handleLogout} style={styles.mobileBtnLogout}>
                Logout
              </button>
            ) : (
              <Link to="/login" style={styles.mobileBtnLogin}>
                Login
              </Link>
            )}
          </li>
        </ul>
      )}
    </nav>
  )
}

const styles = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: '0 32px',
    height: '64px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    flexWrap: 'wrap',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logo: {
    height: '38px',
    width: 'auto',
  },
  brandName: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '700',
    fontSize: '1.25rem',
    color: '#5fcf80',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  navList: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  navLink: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.92rem',
    fontWeight: '500',
    color: '#272828',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    transition: 'color 0.2s, background 0.2s',
  },
  navLinkActive: {
    color: '#5fcf80',
    borderBottom: '2px solid #5fcf80',
  },
  btnLogin: {
    display: 'inline-block',
    backgroundColor: '#5fcf80',
    color: '#ffffff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '8px 22px',
    borderRadius: '50px',
    textDecoration: 'none',
    marginLeft: '8px',
    transition: 'background 0.2s',
  },
  btnLogout: {
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '8px 22px',
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    marginLeft: '8px',
    transition: 'background 0.2s',
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  hamburgerBar: {
    display: 'block',
    width: '24px',
    height: '3px',
    backgroundColor: '#272828',
    borderRadius: '3px',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    listStyle: 'none',
    margin: 0,
    padding: '12px 16px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e9ecef',
  },
  mobileLink: {
    display: 'block',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#272828',
    textDecoration: 'none',
    padding: '10px 12px',
    borderRadius: '6px',
  },
  mobileLinkActive: {
    color: '#5fcf80',
    backgroundColor: 'rgba(95, 207, 128, 0.08)',
  },
  mobileBtnLogin: {
    display: 'block',
    textAlign: 'center',
    backgroundColor: '#5fcf80',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '10px',
    borderRadius: '50px',
    textDecoration: 'none',
    marginTop: '6px',
  },
  mobileBtnLogout: {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '10px',
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    marginTop: '6px',
  },
}

// Inject responsive hamburger visibility via a style tag
const responsiveStyle = document.createElement('style')
responsiveStyle.textContent = `
  @media (max-width: 1199px) {
    nav > ul:nth-of-type(1) { display: none !important; }
    nav > button[aria-label="Toggle menu"] { display: flex !important; }
  }
`
if (!document.head.querySelector('[data-nav-responsive]')) {
  responsiveStyle.setAttribute('data-nav-responsive', '')
  document.head.appendChild(responsiveStyle)
}

export default Header
