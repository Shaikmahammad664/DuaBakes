import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      const timeoutId = setTimeout(() => {
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timeoutId);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      if (response.data.status === 'Success') {
        // Store token if provided
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message || err.response?.data?.detail;
      if (status === 401) {
        setError('Email or password wrong');
      } else {
        setError(backendMessage || 'An error occurred during login');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">LOG IN</h1>
      </header>

      <div className="signup-box">
        <form onSubmit={handleSubmit}>
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
          <div>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Your Email"
              title="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Your Password"
              title="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="forgot-link">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>

          <div className="actions">
            <button type="submit" title="Click to Sign in" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </div>

          <div>
            <p>Don't have an account? <Link to="/signup">Signup here</Link></p>
          </div>
        </form>
      </div>
    </main>
  );
}
