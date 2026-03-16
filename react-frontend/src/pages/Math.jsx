import React from 'react'
import { Link } from 'react-router-dom'

const Math = () => {
  return (
    <main className="main">
      {/* Page Title */}
      <div className="page-title" data-aos="fade">
        <div className="heading">
          <div className="container">
            <div className="row d-flex justify-content-center text-center">
              <div className="col-lg-8">
                <h1>Mathematics</h1>
                <p className="mb-0">
                  Welcome to our Mathematics Hub, where numbers come alive and logic reigns supreme. Dive into our comprehensive resources and interactive lessons designed to demystify mathematical concepts. Whether you're tackling algebra or mastering calculus, discover the beauty and power of mathematics with us.
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="container">
            <ol>
              <li><Link to="/">Home</Link></li>
              <li className="current">Math</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Courses List Section */}
      <section id="courses-list" className="section courses-list">
        <div className="container">
          <div className="row">

            {/* Algebra */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch" data-aos="zoom-in" data-aos-delay="100">
              <div className="course-item">
                <img src="/img/Algebra.png" className="img-fluid" alt="Algebra" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/algebra"><button className="category">Algebra</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Algebra Arena, where equations are solved and formulas are mastered. Delve into our curated resources and step-by-step tutorials designed to conquer the complexities of algebra. Whether you're simplifying expressions or solving quadratic equations, unleash your mathematical prowess and conquer the world of algebra with confidence.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;65
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arithmetic */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Arithmetic.png" className="img-fluid" alt="Arithmetic" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/arithmetic"><button className="category">Arithmetic</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Arithmetic Avenue, where numbers come together in perfect harmony. Dive into our comprehensive resources and engaging exercises designed to strengthen your foundational math skills. Whether you're adding fractions or mastering long division, join us on a mathematical journey through the fundamental operations of arithmetic.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;42
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IITM Math */}
            <div className="col-lg-4 col-md-6 d-flex align-items-stretch mt-4 mt-md-0" data-aos="zoom-in" data-aos-delay="200">
              <div className="course-item">
                <img src="/img/Arithmetic.png" className="img-fluid" alt="IITM Math" />
                <div className="course-content">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Link to="/courses/IIITM-math"><button className="category">IITM Math</button></Link>
                  </div>
                  <p className="description">
                    Welcome to our Avenue, where numbers come together in perfect harmony. Dive into our comprehensive resources and engaging exercises designed to strengthen your foundational math skills. Whether you're adding fractions or mastering long division, join us on a mathematical journey through the fundamental operations of arithmetic.
                  </p>
                  <div className="trainer d-flex justify-content-between align-items-center">
                    <div className="trainer-rank d-flex align-items-center">
                      <i className="bi bi-heart heart-icon"></i>&nbsp;42
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}

export default Math
