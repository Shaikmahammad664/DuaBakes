import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.status) {
        setStatusMessage('If the email exists, a reset link has been sent.');
      } else {
        setError(response.data.message || 'Unable to send reset link.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while sending reset instructions.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="forgot-title">RESET PASSWORD</h1>
      </header>

      <div className="signup-box">
        <form onSubmit={handleSubmit}>
          {statusMessage && <div className="success-message">{statusMessage}</div>}
          {error && <div className="error-message">{error}</div>}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              title="Enter the email associated with your account"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>
          </div>

          <div>
            <p>Remembered your password? <Link to="/login">Back to login</Link></p>
          </div>
        </form>
      </div>
    </main>
  );
}
