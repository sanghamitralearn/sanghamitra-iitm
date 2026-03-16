import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer id="footer" className="footer position-relative">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6 footer-about">
            <Link to="/" className="logo d-flex align-items-center">
              <span className="">Sanghamitra Learning</span>
            </Link>
            <div className="footer-contact pt-3">
              <p>GacchiBowli</p>
              <p>Hyderabad, TS 500032</p>
              <p className="mt-3"><strong>Phone:</strong> <span>+91 7020102729</span></p>
              <p><strong>Email:</strong> <span>sanghamitra.learnworlds@gmail.com</span></p>
            </div>
            <div className="social-links d-flex mt-4">
              <a href=""><i className="bi bi-twitter"></i></a>
              <a href=""><i className="bi bi-facebook"></i></a>
              <a href=""><i className="bi bi-instagram"></i></a>
              <a href=""><i className="bi bi-linkedin"></i></a>
            </div>
          </div>

          <div className="col-lg-4 col-md-12 footer-newsletter">
          </div>
        </div>
      </div>
      <div className="container copyright text-center mt-4">
        <p>© <span>Copyright</span> <strong className="px-1">Sanghamitra Learning</strong> <span>All Rights Reserved</span></p>
        <div className="credits">
          Designed by <a href="">Sanghamitra</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer