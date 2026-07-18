import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import '../styles/Home.css';

export default function Home({ searchQuery = '', onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const location = useLocation();

  // Reset category filter when navigating to home
  useEffect(() => {
    setSelectedCategory(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Listen for manual home button clicks (when already on home page)
  useEffect(() => {
    const handleNavigation = () => {
      setSelectedCategory(null);
      window.scrollTo(0, 0);
    };

    // Store the function globally so navbar can call it
    window.resetCategoryFilter = handleNavigation;
    
    return () => {
      delete window.resetCategoryFilter;
    };
  }, []);

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  return (
    <main className="page-content">
      <Categories onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} />
      <Hero selectedCategory={selectedCategory} searchQuery={searchQuery} onAddToCart={onAddToCart} />
    </main>
  );
}
