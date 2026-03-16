import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { s, LeftPanel } from './authStyles.jsx'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/forgot-password`, { email })
      if (response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data.error || 'Failed to send reset link')
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
        title="Reset Password"
        subtitle="We'll send a reset link to your inbox."
        features={[
          'Quick & secure reset process',
          'Link expires in 1 hour',
          'Check your spam folder too',
          'Contact support if needed',
        ]}
      />

      <div style={s.rightPanel}>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>Forgot password?</h2>
          <p style={s.formSubtitle}>
            Enter your email and we'll send you a reset link.
          </p>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📬</div>
              <div style={s.successBox}>
                Reset link sent! Check your inbox and follow the instructions.
              </div>
              <button onClick={() => navigate('/login')} style={{ ...s.submitBtn, marginTop: '16px' }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={s.input}
                      onFocus={e => e.target.parentElement.style.borderColor = '#5fcf80'}
                      onBlur={e => e.target.parentElement.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} style={s.submitBtn}>
                  {isLoading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={s.spinner} /> Sending link...</span>
                    : 'Send Reset Link'}
                </button>
              </form>

              <div style={s.divider}>
                <span style={s.dividerLine} />
                <span style={s.dividerText}>Remember your password?</span>
                <span style={s.dividerLine} />
              </div>

              <button onClick={() => navigate('/login')} style={s.registerBtn}>
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
