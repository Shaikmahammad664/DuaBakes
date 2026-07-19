import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import '../styles/Home.css';

export default function Home({ searchQuery = '', onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const location = useLocation();

  // Reset category filter when navigating to home
  useEffect(() => {
    setSelectedCategory(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Listen for manual home button clicks (when already on home page)
  useEffect(() => {
    const handleNavigation = () => {
      setSelectedCategory(null);
      window.scrollTo(0, 0);
    };

    // Store the function globally so navbar can call it
    window.resetCategoryFilter = handleNavigation;
    
    return () => {
      delete window.resetCategoryFilter;
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage('Please enter a valid email address.');
      return;
    }

    setNewsletterMessage('Thank you! You are now subscribed.');
    setNewsletterEmail('');
  };

  return (
    <main className="page-content">
      <Categories onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
      <Hero selectedCategory={selectedCategory} searchQuery={searchQuery} onAddToCart={onAddToCart} />

      <footer className="home-footer">
        <div className="footer-top-line" />
        <div className="footer-contact-summary">
          <div>
            <p className="footer-label">Write to us</p>
            <p className="footer-value">hello@duabakes.com</p>
          </div>
          <div>
            <p className="footer-label">Get in touch with us</p>
            <p className="footer-value">+ 91 1234567889</p>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-links-row">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms">Terms</a>
          <a href="/refund-policy">Refund Policy</a>
          <a href="/shipping-policy">Shipping Policy</a>
        </div>

        <div className="footer-newsletter-copy">
          Sign up to our newsletter for exclusive access to new arrivals, style updates and seasonal sales.
        </div>

        <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="Enter your email"
            aria-label="Newsletter email"
          />
          <button type="submit">SUBSCRIBE</button>
        </form>

        {newsletterMessage && <div className="footer-newsletter-message">{newsletterMessage}</div>}

        <div className="footer-social-row">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.876v-6.99H7.898v-2.886h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.465h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.886h-2.33v6.99C18.343 21.128 22 16.991 22 12z" fill="#fff"/>
            </svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17.5 6.5h.01" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        <div className="footer-copyright">
          © Copyright DuaBakes 2026. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
