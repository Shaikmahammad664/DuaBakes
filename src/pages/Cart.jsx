import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductList.css';
import '../styles/Cart.css';

export default function Cart({ cartItems, setCartItems }) {
  const navigate = useNavigate();
  const isSignedIn = Boolean(localStorage.getItem('user') || localStorage.getItem('token'));

  const updateQuantity = (itemId, size, newQuantity) => {
    setCartItems((currentItems) => currentItems.map((item) => {
      if (item.id !== itemId || item.size !== size) return item;
      return { ...item, quantity: Math.max(1, newQuantity) };
    }));
  };

  const removeItem = (itemId, size) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== itemId || item.size !== size));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="cart-page page-content">
      <div className="cart-panel">
        <div className="cart-header-row">
          <div>
            <h1>Shopping Cart</h1>
            <p>{cartItems.length ? `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart` : 'Your cart is empty.'}</p>
          </div>
          {cartItems.length > 0 && (
            <button type="button" className="cart-clear" onClick={() => setCartItems([])}>
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty. Add something tasty to get started.</p>
            <button type="button" className="product-add-button" onClick={() => navigate('/')}>Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.size || 'default'}`} className="cart-item-card">
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-content">
                    <div className="cart-item-title-row">
                      <h3>{item.name}</h3>
                      <button type="button" className="cart-remove-link" onClick={() => removeItem(item.id, item.size)}>
                        Remove
                      </button>
                    </div>
                    {item.size && <p className="cart-item-meta">Qty: {item.size}</p>}
                    <div className="cart-item-meta-row">
                      <p className="cart-item-meta">Price: Rs. {item.price.toLocaleString()}</p>
                      <p className="cart-item-meta">Total: Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <div className="quantity-control">
                      <button type="button" onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary-panel">
              <div className="cart-summary-box">
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <strong>Rs. {totalPrice.toLocaleString()}</strong>
                </div>
                <button
                  type="button"
                  className="checkout-btn"
                  onClick={() => {
                    if (!isSignedIn) {
                      navigate('/login', { state: { from: '/payment' } });
                      return;
                    }
                    navigate('/payment');
                  }}
                  disabled={!isSignedIn}
                >
                  {isSignedIn ? 'CHECK OUT' : 'SIGN IN TO CHECK OUT'}
                </button>
                <button type="button" className="view-cart-btn" onClick={() => navigate('/')}>Continue shopping</button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
