import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search for:', searchQuery);
  };

  const handleCartClick = () => {
    // TODO: Navigate to cart
  };

  const handleAccountClick = () => {
    // TODO: Navigate to account/profile
  };

  return (
    <>
      <div className="announcebox">
        <div id="announcetext">
          <marquee behavior="scroll" direction="left" scrollAmount="6" style={{display: 'block'}}>
            <p>Welcome to DuaBakes! We bake freshly when you order.</p>
          </marquee>
        </div>
      </div>

      <nav className="nav-bar">
        <div className="brand">
          <Link to="/" onClick={() => {
            if (window.resetCategoryFilter) {
              window.resetCategoryFilter();
            }
          }}>
            <img src="./assests/bakes logo.png" alt="DuaBakes Logo" title="DuaBakes Logo" />
          </Link>
        </div>

        <div className="search-nav">
          <div className="searchbarout">
            <span className="searchicon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>Search</title>
                <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="#717478" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M16 16L21 21" stroke="#717478" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </span>
            <input 
              type="text" 
              id="search-bar" 
              name="search" 
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSubmit={handleSearch}
            />
          </div>
        </div>

        <div className="nav-right-group">
          <div className="components">
            <Link to="/" onClick={() => {
              if (window.resetCategoryFilter) {
                window.resetCategoryFilter();
              }
            }}>
              HOME
            </Link>
            <a href="#about">ABOUT US</a>
            <a href="#contact">CONTACT US</a>
          </div>

          <div className="nav-actions">
            <button type="button" className="icon-btn" aria-label="Cart" onClick={handleCartClick}>
              <img src="./assests/cartlogo.png" alt="Cart icon" title="Cart" />
            </button>
            <button type="button" className="icon-btn" aria-label="Account" onClick={handleAccountClick}>
              <img src="./assests/accounticon.png" alt="Account icon" title="Account" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
