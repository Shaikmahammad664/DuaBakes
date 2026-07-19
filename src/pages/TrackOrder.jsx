import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/Auth.css';

const TRACKING_STAGES = [
  { key: 'placed', title: 'Order placed', description: 'We have received your order and it is being prepared.' },
  { key: 'preparing', title: 'Preparing', description: 'Your bakery order is being prepared and packed.' },
  { key: 'out_for_delivery', title: 'Out for delivery', description: 'Your order is on the way to your delivery address.' },
  { key: 'delivered', title: 'Delivered', description: 'Your order has been delivered successfully.' },
];

function getStageFromStatus(status) {
  return TRACKING_STAGES.findIndex((stage) => stage.key === status);
}

function getStageFromDate(createdAt) {
  const orderTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  const elapsed = Date.now() - orderTime;

  if (elapsed < 60000) return 0;
  if (elapsed < 120000) return 1;
  if (elapsed < 180000) return 2;
  return 3;
}

export default function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(id);
        const orderData = response.data.order || response.data;
        setOrder(orderData);
        const stage = getStageFromStatus(orderData.Order_Status || orderData.status) >= 0
          ? getStageFromStatus(orderData.Order_Status || orderData.status)
          : getStageFromDate(orderData.CreatedAt);
        setCurrentStage(stage);
      } catch (err) {
        setError('Unable to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order) return undefined;

    const interval = setInterval(() => {
      const stage = getStageFromStatus(order.Order_Status || order.status);
      setCurrentStage(stage >= 0 ? stage : getStageFromDate(order.CreatedAt));
    }, 5000);

    return () => clearInterval(interval);
  }, [order]);

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">Track Order</h1>
      </header>
      <div className="signup-box tracking-box">
        {loading ? (
          <p>Loading tracking details...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <div className="tracking-summary">
              <div>
                <p className="tracking-label">Order #{order.Order_Id || order.id || id}</p>
                <p className="tracking-meta">{order.CreatedAt ? new Date(order.CreatedAt).toLocaleString() : 'Date unavailable'}</p>
              </div>
              <button type="button" className="profile-action-button" onClick={() => navigate('/orders')}>
                Back to Orders
              </button>
            </div>
            <div className="tracking-status-card">
              <p className="tracking-current-title">Current status</p>
              <h2>{TRACKING_STAGES[currentStage].title}</h2>
              <p>{TRACKING_STAGES[currentStage].description}</p>
            </div>
            <div className="tracking-steps">
              {TRACKING_STAGES.map((stage, index) => (
                <div key={stage.key} className={`tracking-step ${index <= currentStage ? 'active' : ''}`}>
                  <div className="tracking-step-icon">{index <= currentStage ? '✓' : index + 1}</div>
                  <div>
                    <h3>{stage.title}</h3>
                    <p>{stage.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
