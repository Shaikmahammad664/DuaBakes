import React from 'react';
import '../styles/Hero.css';

export default function Hero() {
  return (
    <>
      <section>
        <div className="section-heading">
          <p className="eyebrow">Shop by category</p>
          <h2>Browse our bakery collections</h2>
          <p className="section-copy">Tap any category below to explore delicious products made fresh for you.</p>
        </div>
      </section>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Freshly baked on demand</p>
          <h1>Discover your favorite bakery treats</h1>
          <p className="hero-text">From cakes and cupcakes to donuts, breads, and cookies — order the sweetest snacks with fast delivery and daily freshness.</p>
        </div>
      </section>
    </>
  );
}
