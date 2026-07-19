import React from 'react';
import '../styles/Auth.css';

export default function About() {
  return (
    <main className="page-content signup-page">
      <header>
        <h1 className="header-title">About Us</h1>
      </header>
      <div className="about-box">
        <section style={{ marginBottom: '1.75rem' }}>
          <h2>Who we are</h2>
          <p>
            DuaBakes is a homegrown bakery dedicated to delivering fresh, handcrafted cakes,
            desserts, and treats for every celebration. We combine traditional recipes with
            modern flavors to create memorable moments for our customers.
          </p>
        </section>

        <section style={{ marginBottom: '1.75rem' }}>
          <h2>Our mission</h2>
          <p>
            Our mission is to make every order feel special by providing delicious bakery items,
            reliable delivery, and warm customer service. We believe sweet moments bring people together.
          </p>
        </section>

        <section>
          <h2>Why choose us?</h2>
          <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.8', color: '#4e4e4e' }}>
            <li>Freshly baked products made to order.</li>
            <li>Wide range of cakes, cookies, breads, and specialty treats.</li>
            <li>Easy ordering and fast local delivery.</li>
            <li>Secure and transparent checkout experience.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
