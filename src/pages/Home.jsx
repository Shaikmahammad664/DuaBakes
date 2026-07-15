import React from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import '../styles/Home.css';

export default function Home() {
  return (
    <main className="page-content">
      <Categories />
      <Hero />
    </main>
  );
}
