import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import '../styles/ProductList.css';
import '../styles/Home.css';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((item) => item.id === Number(id));
  const weightCategories = ['Cakes', 'Eggless', 'Breads', 'Chocolates', 'Ice Creams', 'hampers'];
  const isWeightProduct = weightCategories.includes(product?.category);
  const sizes = product?.category === 'Breads' || product?.category === 'Chocolates' || product?.category === 'Ice Creams'
    ? [
        { id: '250g', label: '250g', mult: 1 },
        { id: '500g', label: '500g', mult: 2 },
      ]
    : [
        { id: '500g', label: '500g', mult: 1 },
        { id: '1kg', label: '1kg', mult: 2 },
      ];
  const [size, setSize] = useState(isWeightProduct ? sizes[0].id : '500g');
  const [quantity, setQuantity] = useState(1);

  const sizeMultiplier = isWeightProduct ? sizes.find((s) => s.id === size)?.mult || 1 : 1;
  const computedPrice = product ? product.price * sizeMultiplier * Math.max(1, Number(quantity)) : 0;

  if (!product) {
    return (
      <main className="page-content">
        <div className="product-detail-missing">
          <h2>Product not found</h2>
          <p>We could not find the item you selected. Please go back and try again.</p>
          <button type="button" onClick={() => navigate('/')}>Back to shop</button>
        </div>
      </main>
    );
  }

  return (
    <main className="product-detail-page page-content">
      <div className="product-detail-card">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className={`product-detail-body ${product.badge ? 'has-badge' : 'no-badge'}`}>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <h1>{product.name}</h1>
          <p className="product-price">Rs. {computedPrice.toLocaleString()}</p>

          <div className="product-size-qty">
            {isWeightProduct ? (
              <div className="product-sizes">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`size-btn ${size === s.id ? 'active' : ''}`}
                    onClick={() => setSize(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="product-unit-label">Pack of 4</div>
            )}
          </div>

          <div className="product-quantity">
            <label htmlFor="qty">Quantity</label>
            <input
              id="qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: 80, padding: '0.5rem', borderRadius: 6 }}
            />
          </div>
          <div className="select-control location-select">
            <label htmlFor="location">SELECT DELIVERY CITY</label>
            <select id="location" name="location">
              <option value="location1">Pileru</option>
            </select>
            {/* <span className="select-icon">▾</span> */}
          </div>

          <div className="select-control date-select">
            <label htmlFor="delivery-date">PREFERRED DATE</label>
            <input type="date" id="delivery-date" name="delivery-date" min={new Date().toISOString().split('T')[0]} />
            {/* <span className="select-icon">📅</span> */}
          </div>

          <div className="select-control time-select">
            <label htmlFor="delivery-time">PREFERRED TIME</label>
            <input type="time" id="delivery-time" name="delivery-time" />
          </div>
          <p className="product-description">{product.description}</p>

            
          <div className="product-detail-actions">
            <button
              type="button"
              className="product-add-button"
              disabled={!product.available}
              onClick={() => {
                if (product.available && onAddToCart) {
                  onAddToCart(product, { size: isWeightProduct ? size : null, quantity });
                }
              }}
            >
              {product.available ? `Add to cart (Rs. ${computedPrice.toLocaleString()})` : 'Unavailable'}
            </button>

            <button type="button" className="product-add-button product-secondary-button" onClick={() => navigate('/')}>Continue shopping</button>
          </div>
        </div>
      </div>
    </main>
  );
}
