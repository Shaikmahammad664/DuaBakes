import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, ordersAPI, productsAPI } from '../services/api';
import '../styles/Auth.css';

const emptyProductForm = {
  ProductName: '',
  Description: '',
  Category: '',
  ImageUrl: '',
  Price: '',
  StockQuantity: '',
  Weight: '',
};

const statusOptions = ['placed', 'preparing', 'out_for_delivery', 'delivered'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('adminUser')));
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState('');

  const newOrdersCount = useMemo(
    () => orders.filter((order) => (order.Order_Status || order.status || 'placed') === 'placed').length,
    [orders],
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    loadProducts();
    loadOrders();
  }, [isLoggedIn]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Unable to load products.');
    }
  };

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAdminOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Unable to load orders.');
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authAPI.adminLogin(loginForm);
      if (response.data?.status === 'Success') {
        localStorage.setItem('adminUser', JSON.stringify({ email: loginForm.email }));
        setIsLoggedIn(true);
        setSuccess('Welcome to the admin panel.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setIsLoggedIn(false);
    setLoginForm({ email: '', password: '' });
    setSuccess('');
    navigate('/');
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...productForm,
        Price: Number(productForm.Price || 0),
        StockQuantity: Number(productForm.StockQuantity || 0),
        Weight: Number(productForm.Weight || 0),
      };

      if (editingProductId) {
        await productsAPI.update(editingProductId, payload);
        setSuccess('Product updated successfully.');
      } else {
        await productsAPI.create(payload);
        setSuccess('Product created successfully.');
      }

      setProductForm(emptyProductForm);
      setEditingProductId('');
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to save product.');
    } finally {
      setLoading(false);
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.ProductId);
    setProductForm({
      ProductName: product.ProductName || '',
      Description: product.Description || '',
      Category: product.Category || '',
      ImageUrl: product.ImageUrl || '',
      Price: product.Price || '',
      StockQuantity: product.StockQuantity || '',
      Weight: product.Weight || '',
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from the store?')) return;
    try {
      await productsAPI.delete(productId);
      setSuccess('Product deleted.');
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete product.');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setLoading(true);
    try {
      await ordersAPI.updateStatus(orderId, status, `Status updated to ${status}`);
      setSuccess('Order status updated.');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update status.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="page-content signup-page">
        <header>
          <h1 className="header-title">ADMIN LOGIN</h1>
        </header>
        <div className="signup-box">
          <form onSubmit={handleLogin}>
            {error ? <div className="error-message">{error}</div> : null}
            {success ? <div className="success-message">{success}</div> : null}
            <div>
              <input type="email" placeholder="Admin email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required />
            </div>
            <div>
              <input type="password" placeholder="Password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required />
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login to Admin'}</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">ADMIN DASHBOARD</h1>
      </header>
      <div className="admin-shell">
        {error ? <div className="error-message">{error}</div> : null}
        {success ? <div className="success-message">{success}</div> : null}
        {newOrdersCount > 0 ? (
          <div className="admin-notification-banner">
            You have <strong>{newOrdersCount}</strong> new order{newOrdersCount === 1 ? '' : 's'} awaiting attention.
          </div>
        ) : (
          <div className="admin-notification-banner admin-notification-banner--empty">
            No new orders waiting right now.
          </div>
        )}
        <div className="admin-actions">
          <button type="button" className="profile-action-button" onClick={handleLogout}>Logout</button>
        </div>
        <div className="admin-summary-grid">
          <div className="admin-card">
            <h2>New orders</h2>
            <p>{newOrdersCount}</p>
          </div>
          <div className="admin-card">
            <h2>Total products</h2>
            <p>{products.length}</p>
          </div>
        </div>

        <div className="admin-grid">
          <section className="admin-card">
            <h2>{editingProductId ? 'Edit product' : 'Add product'}</h2>
            <form onSubmit={handleProductSubmit} className="admin-form">
              <input type="text" placeholder="Product name" value={productForm.ProductName} onChange={(event) => setProductForm({ ...productForm, ProductName: event.target.value })} required />
              <input type="text" placeholder="Description" value={productForm.Description} onChange={(event) => setProductForm({ ...productForm, Description: event.target.value })} required />
              <input type="text" placeholder="Category" value={productForm.Category} onChange={(event) => setProductForm({ ...productForm, Category: event.target.value })} required />
              <input type="text" placeholder="Image URL" value={productForm.ImageUrl} onChange={(event) => setProductForm({ ...productForm, ImageUrl: event.target.value })} />
              <input type="number" placeholder="Price" value={productForm.Price} onChange={(event) => setProductForm({ ...productForm, Price: event.target.value })} required />
              <input type="number" placeholder="Stock quantity" value={productForm.StockQuantity} onChange={(event) => setProductForm({ ...productForm, StockQuantity: event.target.value })} required />
              <input type="number" placeholder="Weight" value={productForm.Weight} onChange={(event) => setProductForm({ ...productForm, Weight: event.target.value })} required />
              <button type="submit" disabled={loading}>{editingProductId ? 'Save changes' : 'Add product'}</button>
            </form>
          </section>

          <section className="admin-card">
            <h2>Products</h2>
            <div className="admin-list">
              {products.length === 0 ? <p>No products yet.</p> : products.map((product) => (
                <div key={product.ProductId} className="admin-list-item">
                  <div>
                    <strong>{product.ProductName}</strong>
                    <div>Rs. {Number(product.Price || 0).toLocaleString()} · Stock: {product.StockQuantity}</div>
                  </div>
                  <div className="admin-list-actions">
                    <button type="button" onClick={() => startEditProduct(product)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteProduct(product.ProductId)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card admin-orders-card">
          <h2>Orders</h2>
          {orders.length === 0 ? <p>No orders yet.</p> : (
            <div className="admin-orders-list">
              {orders.map((order) => (
                <div key={order.Order_Id} className="admin-order-item">
                  <div>
                    <strong>Order #{order.Order_Id}</strong>
                    <div>{order.Items?.length || 0} items · Total: Rs. {Number(order.TotalAmount || 0).toLocaleString()}</div>
                    <div>Status: {order.Order_Status || order.status || 'placed'}</div>
                  </div>
                  <select value={order.Order_Status || order.status || 'placed'} onChange={(event) => handleStatusChange(order.Order_Id, event.target.value)}>
                    {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
