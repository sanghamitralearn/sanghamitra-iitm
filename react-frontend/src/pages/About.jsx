import React from 'react'
import { Link } from 'react-router-dom'

const About = () => {
  return (
    <main className="main">
      <section id="about" className="about section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-6 order-1 order-lg-2" data-aos="fade-up" data-aos-delay="100">
              <img src="/img/Index page Image2.png" className="img-fluid" alt="About Sanghamitra Learning" />
            </div>

            <div className="col-lg-6 order-2 order-lg-1 content" data-aos="fade-up" data-aos-delay="200">
              <h3>Empowering Marginalized Learners: Our Mission to Democratize Education</h3>
              <p className="fst-italic">
                Breaking Barriers, Unlocking Potential
              </p>
              <ul>
                <li><i className="bi bi-check-circle"></i> <span>On our platform, we are dedicated to democratizing education by breaking down barriers and providing equal opportunities for all.</span></li>
                <li><i className="bi bi-check-circle"></i> <span>Our primary goal is to offer high-quality education to marginalized students who may otherwise lack access to competitive advantages.</span></li>
                <li><i className="bi bi-check-circle"></i> <span>Through our platform, we aim to bridge the gap by providing resources, support, and opportunities for personal and academic growth. By doing so, we strive to empower individuals from underserved communities to reach their full potential and pursue their dreams. Join us in our mission to create a more inclusive and equitable educational landscape for all learners.</span></li>
              </ul>
              <Link to="/contact" className="read-more"><span>Contact Us</span><i className="bi bi-arrow-right"></i></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default About