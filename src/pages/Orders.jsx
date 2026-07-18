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
    const email = user.Email || user.email;

    ordersAPI.getByUser(email)
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
                <div>Items:</div>
                <ul>
                  {(order.Items || []).map((item, itemIndex) => (
                    <li key={`${order.Order_Id || index}-${itemIndex}`}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
