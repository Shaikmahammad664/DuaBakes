import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar({ searchQuery, onSearchChange }) {
  const navigate = useNavigate();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('user')));
  const dropdownRef = useRef(null);

  const handleCartClick = () => {
    navigate('/cart');
  };

  const handleAccountClick = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleSignIn = () => {
    navigate('/login');
    setIsAccountDropdownOpen(false);
  };

  const handleSignUp = () => {
    navigate('/signup');
    setIsAccountDropdownOpen(false);
  };

  const handleProfile = () => {
    navigate('/profile');
    setIsAccountDropdownOpen(false);
  };

  const handleMyOrders = () => {
    navigate('/orders');
    setIsAccountDropdownOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setIsAccountDropdownOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAccountDropdownOpen(false);
    navigate('/');
    alert('You have been signed out successfully!');
  };

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('user')));
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    syncLoginState();
    window.addEventListener('storage', syncLoginState);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('storage', syncLoginState);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              onChange={(e) => onSearchChange(e.target.value)}
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
            <Link to="/about">ABOUT US</Link>
            <Link to="/contact">CONTACT US</Link>
          </div>

          <div className="nav-actions">
            <button type="button" className="icon-btn" aria-label="Cart" onClick={handleCartClick}>
              <img src="./assests/cartlogo.png" alt="Cart icon" title="Cart" />
            </button>
            <div className="account-dropdown" ref={dropdownRef}>
              <button type="button" className="icon-btn" aria-label="Account" onClick={handleAccountClick}>
                <img src="./assests/accounticon.png" alt="Account icon" title="Account" />
              </button>
              {isAccountDropdownOpen && (
                <div className="dropdown-menu">
                  {!isLoggedIn ? (
                    <>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={handleSignIn}
                      >
                        Sign In
                      </button>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={handleSignUp}
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={handleProfile}
                      >
                        Profile
                      </button>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={handleMyOrders}
                      >
                        My Orders
                      </button>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={handleSettings}
                      >
                        Settings
                      </button>
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn" 
                        onClick={() => { setIsAccountDropdownOpen(false); navigate('/admin'); }}
                      >
                        Admin Panel
                      </button>
                      <hr className="dropdown-divider" />
                      <button 
                        type="button" 
                        className="dropdown-item dropdown-btn logout" 
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
