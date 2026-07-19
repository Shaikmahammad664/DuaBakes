import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier || JSON.parse(localStorage.getItem('pendingAuth') || '{}')?.identifier;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier) {
      setError('Missing identifier for OTP verification.');
      return;
    }
    if (!otp.trim()) {
      setError('Enter the OTP sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(identifier, otp.trim());
      if (res.status === 200) {
        // backend should return final token and user on successful verification
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        localStorage.removeItem('pendingAuth');
        navigate('/');
      } else {
        setError(res.data?.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification error');
      console.error('OTP verify error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">OTP Verification</h1>
      </header>
      <div className="signup-box">
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
