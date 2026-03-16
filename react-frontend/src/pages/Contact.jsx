import React, { useState } from 'react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // TODO: Implement actual form submission
      console.log('Form data:', formData)
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="main">
      <section id="contact" className="contact section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Contact</h2>
          <p>Get in Touch</p>
        </div>

        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row">
            <div className="col-lg-6">
              <div className="row gy-4">
                <div className="col-md-6">
                  <div className="info-item" data-aos="fade" data-aos-delay="200">
                    <i className="bi bi-geo-alt"></i>
                    <h3>Address</h3>
                    <p>GacchiBowli<br />Hyderabad, TS 500032</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="info-item" data-aos="fade" data-aos-delay="300">
                    <i className="bi bi-telephone"></i>
                    <h3>Call Us</h3>
                    <p>+91 7020102729<br />+91 7020102729</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="info-item" data-aos="fade" data-aos-delay="400">
                    <i className="bi bi-envelope"></i>
                    <h3>Email Us</h3>
                    <p>sanghamitra.learnworlds@gmail.com</p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="info-item" data-aos="fade" data-aos-delay="500">
                    <i className="bi bi-clock"></i>
                    <h3>Open Hours</h3>
                    <p>Monday - Friday<br />9:00AM - 05:00PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <form onSubmit={handleSubmit} className="php-email-form" data-aos="fade-up" data-aos-delay="200">
                <div className="row gy-4">
                  <div className="col-md-6">
                    <input 
                      type="text" 
                      name="name" 
                      className="form-control" 
                      placeholder="Your Name" 
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 ">
                    <input 
                      type="email" 
                      className="form-control" 
                      name="email" 
                      placeholder="Your Email" 
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-12">
                    <input 
                      type="text" 
                      className="form-control" 
                      name="subject" 
                      placeholder="Subject" 
                      required
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-12">
                    <textarea 
                      className="form-control" 
                      name="message" 
                      rows="6" 
                      placeholder="Message" 
                      required
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="col-md-12 text-center">
                    {submitStatus === 'success' && (
                      <div className="sent-message">Your message has been sent. Thank you!</div>
                    )}
                    {submitStatus === 'error' && (
                      <div className="error-message">Something went wrong. Please try again later.</div>
                    )}
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Contact