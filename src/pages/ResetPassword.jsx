import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (tokenParam) {
      setToken(tokenParam);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setError('');

    if (!token && !email) {
      setError('Invalid reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = token
        ? await authAPI.resetPasswordWithToken(token, newPassword)
        : await authAPI.resetPassword(email, newPassword);

      if (response.data.status) {
        setStatusMessage('Password reset successful. Please log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(response.data.message || 'Unable to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="forgot-title">Reset your password</h1>
      </header>

      <div className="signup-box">
        <form onSubmit={handleSubmit}>
          {statusMessage && <div className="success-message">{statusMessage}</div>}
          {error && <div className="error-message">{error}</div>}

          {!token && (
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
          )}

          <div>
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'RESETTING...' : 'RESET PASSWORD'}
            </button>
          </div>

          <div>
            <p>
              Remembered your password? <Link to="/login">Back to login</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
