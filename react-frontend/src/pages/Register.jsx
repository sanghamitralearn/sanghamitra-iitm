import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { s, LeftPanel } from './authStyles.jsx'

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(response.data.error || 'Registration failed')
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
        title="Join Sanghamitra"
        subtitle="Start your learning journey today."
        features={[
          'Free access to all courses',
          'Track progress across subjects',
          'IITM & GRE preparation',
          'Expert-curated content',
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Create account</h2>
          <p style={s.formSubtitle}>Fill in the details below to get started</p>

          {success && (
            <div style={s.successBox}>
              Registration successful! Redirecting to login...
            </div>
          )}
          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.fieldGroup}>
              <label style={s.label}>Full name</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>👤</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  style={s.input}
                  onFocus={e => e.target.parentElement.style.borderColor = '#5fcf80'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

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
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <span style={s.inputIcon}>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 8 characters"
                  minLength="8"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{ ...s.input, paddingRight: '48px' }}
                  onFocus={e => e.target.parentElement.style.borderColor = '#5fcf80'}
                  onBlur={e => e.target.parentElement.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || success} style={s.submitBtn}>
              {isLoading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={s.spinner} /> Creating account...</span>
                : 'Create Account'}
            </button>
          </form>

          <div style={s.divider}>
            <span style={s.dividerLine} />
            <span style={s.dividerText}>Already have an account?</span>
            <span style={s.dividerLine} />
          </div>

          <button onClick={() => navigate('/login')} style={s.registerBtn}>
            Sign in instead
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register
