import React, { useState, useRef } from 'react';
import '../styles/Categories.css';

export default function Categories({ onCategorySelect, selectedCategory }) {
  const [categories] = useState([
    { id: 1, name: 'Cakes', image: '/assests/cake.jpg' },
    { id: 2, name: 'Cupcakes', image: '/assests/cupcakes.jpg' },
    { id: 3, name: 'Donuts', image: '/assests/donuts.jpg' },
    { id: 4, name: 'Breads', image: '/assests/breads.jpg' },
    { id: 5, name: 'Cookies', image: '/assests/cookies.jpg' },
    { id: 6, name: 'Chocolates', image: '/assests/chocolates.jpg' },
    { id: 7, name: 'Ice Creams', image: '/assests/icecream.jpg' },
    { id: 9, name: 'hampers', image: '/assests/hampers.jpg' },
    { id: 8, name: 'Eggless', image: '/assests/eggless.jpg' },
    { id: 10, name: 'Make Your Own', image: '/assests/makeown.jpg' }
    
  ]);

  const [failedImages, setFailedImages] = useState({});
  const categoriesRef = useRef(null);

  const scroll = (direction) => {
    const container = categoriesRef.current;
    const scrollAmount = 300;
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category.name);
    }
  };

  const handleImageError = (id) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="categories-section">
      <div className="categories-carousel">
        <button className="cat-scroll left" aria-label="Scroll categories left" onClick={() => scroll('left')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <polyline points="6 4 18 12 6 20" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="categories-row" ref={categoriesRef}>
          {categories.map((category) => {
            const imagePath = category.image;
            const showFallback = failedImages[category.id];

            return (
              <div key={category.id} className="category-item" onClick={() => handleCategoryClick(category)}>
                {showFallback ? (
                  <div className="category-icon fallback">
                    <span>{category.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <img src={imagePath} alt={category.name} onError={() => handleImageError(category.id)} />
                )}
                <p>{category.name}</p>
              </div>
            );
          })}
        </div>

        <button className="cat-scroll right" aria-label="Scroll categories right" onClick={() => scroll('right')}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <polyline points="6 4 18 12 6 20" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

    </section>
  );
}
