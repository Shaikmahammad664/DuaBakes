import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProductList.css';
import { products } from '../data/products';

export default function ProductList({ selectedCategory, searchQuery = '', startIndex = 0, limit = products.length, showHeader = true, onAddToCart }) {
  const navigate = useNavigate();
  const [addedItems, setAddedItems] = useState([]);

  const normalizedQuery = searchQuery?.trim().toLowerCase() || '';

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesSearch = !normalizedQuery || [product.name, product.category, product.description]
      .some((value) => value?.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesSearch;
  });

  const displayedProducts = filteredProducts.slice(startIndex, startIndex + limit);

  return (
    <section className="product-list-section">
      {showHeader && (
        <div className="product-list-header">
          <p className="eyebrow">Best sellers</p>
          <h2>Featured bakery products</h2>
          <p className="product-list-copy">
            Browse our latest cakes and treats, each prepared fresh and priced for your next order.
          </p>
        </div>
      )}
      {displayedProducts.length === 0 ? (
        <p className="product-list-copy">No products found for "{searchQuery}".</p>
      ) : (
      <div className="product-grid">
        {displayedProducts.map((product) => (
          <article key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="product-card-image">
              <img src={product.image} alt={product.name} />
              {product.badge && <span className="product-badge">{product.badge}</span>}
              {!product.available && <span className="product-sold-out">Sold Out</span>}
            </div>

            <div className="product-card-body">
              <h3>{product.name}</h3>
              <p className="product-price">Rs. {product.price.toLocaleString()}</p>
              <button
                type="button"
                className={`product-add-button ${addedItems.includes(product.id) ? 'product-added' : ''}`}
                disabled={!product.available}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!product.available) return;

                  if (onAddToCart) {
                    onAddToCart(product, { quantity: 1 });
                  }

                  setAddedItems((current) => current.includes(product.id) ? current : [...current, product.id]);
                }}
              >
                {product.available ? (addedItems.includes(product.id) ? 'Added' : 'ADD') : 'Sold Out'}
              </button>
            </div>
          </article>
        ))}
      </div>
      )}
    </section>
  );
}
