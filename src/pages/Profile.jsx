import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/Auth.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [addressHistory, setAddressHistory] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUser);
    const userData = parsed.user || parsed;

    const resolveValue = (keys) => {
      for (const key of keys) {
        const value = userData?.[key];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
      return '';
    };

    setUser(userData);
    setFirstName(resolveValue(['FirstName', 'firstName', 'first_name', 'name']));
    setLastName(resolveValue(['LastName', 'lastName', 'last_name']));
    setEmail(resolveValue(['Email', 'email']));
    const storedAddressHistory = (userData.addressHistory || [])
      .map((entry) => ({
        ...entry,
        createdAt: entry.createdAt || new Date().toISOString(),
      }));
    setAddressHistory(storedAddressHistory);

    const emailAddress = resolveValue(['Email', 'email']);
    if (!emailAddress) {
      setLoading(false);
      return;
    }

    ordersAPI.getByUser(emailAddress)
      .then((response) => {
        setOrders(response.data.orders || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <main className="page-content profile-page">
      <header>
        <h1 className="header-title">MY ACCOUNT</h1>
      </header>
      <div className="profile-notice">
        <span>Hello, {firstName || email || 'Customer'}</span>
        {user && (
          <button type="button" className="profile-signout-button" onClick={handleSignOut}>
            Log Out
          </button>
        )}
      </div>

      <div className="profile-content">
        <section className="profile-section">
          <h2>Order History</h2>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="profile-empty-banner">
              <span className="profile-empty-icon">✓</span>
              <div>
                <a href="/" className="profile-empty-link">
                  Make your first order.
                </a>
                You haven't placed any orders yet.
              </div>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order, index) => (
                <article key={order.Order_Id || index} className="order-card">
                  <div className="order-row">
                    <span>Order #{order.Order_Id || index + 1}</span>
                    <span>{order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="order-row order-summary">
                    <span>Total:</span>
                    <strong>Rs. {Number(order.TotalAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div className="order-items">
                    {(order.Items || []).map((item, itemIndex) => (
                      <div key={`${order.Order_Id || index}-${itemIndex}`} className="order-item">
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section">
          <h2>Account Details</h2>
          <div className="profile-details-grid">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Name</span>
              <span className="profile-detail-value">{`${firstName} ${lastName}`.trim() || 'N/A'}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">{email || 'N/A'}</span>
            </div>
          </div>
          <button
            type="button"
            className="profile-action-button"
            onClick={() => setShowAddresses((current) => !current)}
          >
            VIEW ADDRESSES ({addressHistory.length})
          </button>
          {showAddresses && (
            <div className="address-history-section">
              {addressHistory.length === 0 ? (
                <p>No saved addresses yet.</p>
              ) : (
                addressHistory.map((entry, index) => (
                  <div key={entry.createdAt || index} className="address-card">
                    <div className="address-card-header">
                      <span>Address {index + 1}</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="address-block">
                      <strong>Shipping Address</strong>
                      <p>{entry.shippingAddress.firstName} {entry.shippingAddress.lastName}</p>
                      <p>{entry.shippingAddress.address}{entry.shippingAddress.apartment ? `, ${entry.shippingAddress.apartment}` : ''}</p>
                      <p>{entry.shippingAddress.city}, {entry.shippingAddress.state} {entry.shippingAddress.pinCode}</p>
                      <p>{entry.shippingAddress.country}</p>
                      <p>Phone: {entry.shippingAddress.phone}</p>
                    </div>
                    <div className="address-block">
                      <strong>Billing Address</strong>
                      <p>{entry.billingAddress.firstName} {entry.billingAddress.lastName}</p>
                      <p>{entry.billingAddress.address}{entry.billingAddress.apartment ? `, ${entry.billingAddress.apartment}` : ''}</p>
                      <p>{entry.billingAddress.city}, {entry.billingAddress.state} {entry.billingAddress.pinCode}</p>
                      <p>{entry.billingAddress.country}</p>
                      <p>Phone: {entry.billingAddress.phone}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
