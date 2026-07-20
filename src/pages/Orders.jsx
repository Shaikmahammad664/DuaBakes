import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/Auth.css';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    const identifier = user.PhoneNumber || user.phone || user.Email || user.email;

    ordersAPI.getByUser(identifier)
      .then((response) => {
        setOrders(response.data.orders || []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">MY ORDERS</h1>
      </header>
      <div className="signup-box">
        {loading ? <p>Loading orders...</p> : orders.length === 0 ? <p>No previous orders yet.</p> : (
          <ul>
            {orders.map((order, index) => (
              <li key={order.Order_Id || index} style={{ marginBottom: '1rem' }}>
                <strong>Order #{order.Order_Id || index + 1}</strong>
                <div>Total: Rs. {Number(order.TotalAmount || 0).toLocaleString()}</div>
                <div>Date: {order.CreatedAt ? new Date(order.CreatedAt).toLocaleString() : 'N/A'}</div>
                <div>Delivery Date: {(
                  (() => {
                    const raw = order.DeliveryDate || order.Items?.[0]?.delivery?.deliveryDate;
                    if (!raw) return 'N/A';
                    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;
                    const parsed = new Date(raw);
                    if (!isNaN(parsed.getTime())) {
                      const dd = String(parsed.getDate()).padStart(2, '0');
                      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
                      const yyyy = parsed.getFullYear();
                      return `${dd}-${mm}-${yyyy}`;
                    }
                    const parts = String(raw).split('-');
                    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    return raw;
                  })()
                )}</div>
                <div>Delivery Slot: {order.DeliveryTime || order.Items?.[0]?.delivery?.deliveryTime || 'N/A'}</div>
                <div>Status: {order.Order_Status || order.status || 'Pending'}</div>
                <div>Items:</div>
                <ul>
                  {(order.Items || []).map((item, itemIndex) => (
                    <li key={`${order.Order_Id || index}-${itemIndex}`}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                <button type="button" className="profile-action-button" onClick={() => navigate(`/track-order/${order.Order_Id || order.id || index + 1}`)}>
                  Track Order
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
