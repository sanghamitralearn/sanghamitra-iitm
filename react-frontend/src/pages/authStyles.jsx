import React from 'react'

export const LeftPanel = ({ title, subtitle, features }) => (
  <div style={s.leftPanel}>
    <div style={s.leftContent}>
      <img src="/img/sbi.logo.png" alt="logo" style={s.panelLogo} />
      <h1 style={s.panelTitle}>{title}</h1>
      <p style={s.panelSubtitle}>{subtitle}</p>
      <div style={s.featureList}>
        {features.map((f) => (
          <div key={f} style={s.featureItem}>
            <span style={s.checkIcon}>✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ ...s.circle, width: 300, height: 300, top: -80, right: -80, opacity: 0.08 }} />
    <div style={{ ...s.circle, width: 180, height: 180, bottom: 60, left: -50, opacity: 0.06 }} />
  </div>
)

export const s = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Poppins', 'Open Sans', sans-serif",
  },
  leftPanel: {
    flex: '0 0 42%',
    background: 'linear-gradient(145deg, #1a6b3a 0%, #2ecc71 60%, #5fcf80 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 48px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftContent: {
    position: 'relative',
    zIndex: 1,
    color: '#fff',
    maxWidth: '360px',
  },
  panelLogo: {
    width: '72px',
    height: '72px',
    marginBottom: '20px',
    filter: 'brightness(0) invert(1)',
  },
  panelTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#fff',
    margin: '0 0 10px 0',
    lineHeight: 1.2,
  },
  panelSubtitle: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 40px 0',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.95rem',
    color: 'rgba(255,255,255,0.92)',
  },
  checkIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: '50%',
    backgroundColor: '#fff',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '40px 24px',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '48px 44px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  formTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 6px 0',
  },
  formSubtitle: {
    fontSize: '0.95rem',
    color: '#718096',
    margin: '0 0 28px 0',
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    color: '#c53030',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.88rem',
    marginBottom: '20px',
  },
  successBox: {
    backgroundColor: '#f0fff4',
    border: '1px solid #9ae6b4',
    color: '#276749',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.88rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#4a5568',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: '#f7fafc',
    transition: 'border-color 0.2s',
    overflow: 'hidden',
  },
  inputIcon: {
    padding: '0 12px',
    fontSize: '1rem',
    color: '#a0aec0',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '13px 12px 13px 0',
    fontSize: '0.95rem',
    color: '#2d3748',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 12px',
    fontSize: '1rem',
    color: '#a0aec0',
    flexShrink: 0,
  },
  forgotLink: {
    fontSize: '0.82rem',
    color: '#5fcf80',
    textDecoration: 'none',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#5fcf80',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
    marginTop: '4px',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '28px 0 20px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: '0.82rem',
    color: '#a0aec0',
    whiteSpace: 'nowrap',
  },
  registerBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    border: '1.5px solid #5fcf80',
    borderRadius: '10px',
    padding: '13px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#5fcf80',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
