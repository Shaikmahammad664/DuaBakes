import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Payment from './pages/Payment';
import Settings from './pages/Settings';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import TrackOrder from './pages/TrackOrder';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
// VerifyOtp removed; OTP flow deprecated
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const storedCart = window.localStorage.getItem('cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = setTimeout(() => {
      setToastMessage('');
    }, 2200);

    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleAddToCart = (product, options = {}) => {
    if (!product) return;

    const newItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      badge: product.badge,
      image: product.image,
      category: product.category,
      size: options.size || null,
      quantity: Number(options.quantity || 1),
      delivery: options.delivery || null,
    };

    setCartItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.id === newItem.id
          && item.size === newItem.size
          && JSON.stringify(item.delivery) === JSON.stringify(newItem.delivery)
      );

      if (existingIndex >= 0) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      }

      return [...currentItems, newItem];
    });

    setToastMessage(`${product.name} added to cart.`);
  };

  return (
    <Router>
      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      {toastMessage && (
        <div className="toast-notification">{toastMessage}</div>
      )}
      <Routes>
        <Route path="/" element={<Home searchQuery={searchQuery} onAddToCart={handleAddToCart} />} />
        <Route path="/product/:id" element={<ProductDetail onAddToCart={handleAddToCart} />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
        <Route path="/payment" element={<Payment cartItems={cartItems} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/track-order/:id" element={<TrackOrder />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* OTP route removed */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
