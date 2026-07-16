import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductList.css';
import { products } from '../data/products';

export default function ProductList({ selectedCategory, startIndex = 0, limit = products.length }) {
  const navigate = useNavigate();

  return (
    <section className="product-list-section">
      <div className="product-list-header">
        <p className="eyebrow">Best sellers</p>
        <h2>Featured bakery products</h2>
        <p className="product-list-copy">
          Browse our latest cakes and treats, each prepared fresh and priced for your next order.
        </p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="product-card-image">
              <img src={product.image} alt={product.name} />
              <span className="product-badge">{product.badge}</span>
              {!product.available && <span className="product-sold-out">Sold Out</span>}
            </div>
          
            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p className="product-price">Rs. {product.price.toLocaleString()}</p>
              <button
                type="button"
                className="product-add-button"
                disabled={!product.available}
                onClick={(event) => {
                  event.stopPropagation();
                  if (product.available) {
                    navigate(`/product/${product.id}`);
                  }
                }}
              >
                {product.available ? 'ADD' : 'Sold Out'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
