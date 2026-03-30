import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const DBMS = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/session-info`, { withCredentials: true })
      .then(res => { if (!res.data?.email) navigate('/login', { replace: true }) })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  )

  return (
    <main className="main">
      <section id="hero" className="hero section">
        <div className="container">
          <h2 data-aos="fade-up" data-aos-delay="100">Database Management Systems</h2>
          <p data-aos="fade-up" data-aos-delay="200">
            IITM DBMS — Relational databases, SQL, normalization, and transactions.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container text-center py-5" data-aos="fade-up">
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <i className="bi bi-database-fill text-white" style={{ fontSize: '2rem' }}></i>
            </div>
            <h3 className="fw-bold mb-3">Coming Soon</h3>
            <p className="text-muted mb-4">
              DBMS assessments are being prepared. Topics will include ER diagrams, relational algebra, SQL queries, normalization, and transaction management.
            </p>
            <Link to="/" className="btn btn-primary">
              <i className="bi bi-house me-2"></i>Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default DBMS
