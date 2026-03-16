import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { s, LeftPanel } from './authStyles.jsx'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/signin`, formData, {
        withCredentials: true,
      })
      if (response.data.success) {
        navigate(from, { replace: true })
      } else {
        setError(response.data.error || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <LeftPanel
        title="Welcome back"
        subtitle="Educating Minds, Empowering Futures."
        features={[
          'IITM & GRE Exam Preparation',
          'English, Math & Programming',
          'Track your progress daily',
          'Expert curated content',
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Sign in</h2>
          <p style={s.formSubtitle}>Enter your credentials to continue</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Email address</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>✉</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={s.input}
                  onFocus={e => e.target.parentElement.style.borderColor = '#5fcf80'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            <div style={s.fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={s.label}>Password</label>
                <Link to="/forgot-password" style={s.forgotLink}>Forgot password?</Link>
              </div>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  style={{ ...s.input, paddingRight: '48px' }}
                  onFocus={e => e.target.parentElement.style.borderColor = '#5fcf80'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={s.submitBtn}>
              {isLoading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={s.spinner} /> Signing in...</span>
                : 'Sign In'}
            </button>
          </form>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>New to Sanghamitra?</span>
            <span style={s.dividerLine} />
          </div>

          <button onClick={() => navigate('/register')} style={s.registerBtn}>
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
