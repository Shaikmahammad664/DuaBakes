import React, { useState } from 'react';
import '../styles/Auth.css';

export default function Contact() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (event) => {
    setFormState((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setFormState({ name: '', email: '', message: '' });
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">Contact Us</h1>
      </header>
      <div className="signup-box">
        {submitted ? (
          <div className="success-message">
            Thank you! Your message has been received. We'll get back to you shortly.
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              value={formState.name}
              onChange={handleChange('name')}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <input
              type="email"
              value={formState.email}
              onChange={handleChange('email')}
              placeholder="Your email"
              required
            />
          </div>
          <div>
            <textarea
              value={formState.message}
              onChange={handleChange('message')}
              placeholder="Your message"
              rows={6}
              style={{ width: '100%', padding: '0.95rem 1rem', borderRadius: '12px', border: '1px solid #ccc', fontFamily: 'karala, sans-serif', fontSize: '1rem' }}
              required
            />
          </div>
          <div className="actions">
            <button type="submit">Send Message</button>
          </div>
        </form>
      </div>
    </main>
  );
}
