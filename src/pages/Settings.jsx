import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    setPhone(parsed.PhoneNumber || '');
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = { Email: user.Email, PhoneNumber: phone || undefined, Password: password || undefined };
      const response = await authAPI.updateProfile(payload);
      if (response.data.status === 'Success') {
        setMessage('Profile updated successfully.');
        setPassword('');
      } else {
        setError(response.data.message || 'Could not update profile.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">ACCOUNT SETTINGS</h1>
      </header>
      <div className="signup-box">
        <form onSubmit={handleSubmit}>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
          <div>
            <input type="email" value={user?.Email || ''} readOnly />
          </div>
          <div>
            <input
              type="tel"
              placeholder="Mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
