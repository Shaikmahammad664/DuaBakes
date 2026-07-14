import React, { useEffect, useRef, useState } from 'react';
import '../styles/Hero.css';
import cakeImage from '../../assests/slidephoto.png';

export default function Hero() {
  const [showImage, setShowImage] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowImage(entry.isIntersecting);
      },
      {
        threshold: 0.35,
        rootMargin: '-20% 0px -40% 0px',
      }
    );

    observer.observe(heroElement);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section>
        <div className="section-heading">
          <p className="eyebrow">Shop by category</p>
          <h2>Browse our bakery collections</h2>
          <p className="section-copy">Tap any category below to explore delicious products made fresh for you.</p>
        </div>
      </section>
      <section className="hero" ref={heroRef}>
        <div className="hero-copy">
          <p className="eyebrow">Freshly baked on demand</p>
          <h1>Discover your favorite bakery treats</h1>
          <p className="hero-text">From cakes and cupcakes to donuts, breads, and cookies — order the sweetest snacks with fast delivery and daily freshness.</p>
        </div>
        <div className="hero-visual">
          <div className={`hero-image-card ${showImage ? 'loaded' : 'hidden'}`}>
            {showImage && (
              <>
                <img src={cakeImage} alt="Fresh bakery treats" />
                {/* <div className="hero-image-glow" /> */}
                <div className="hero-image-badge">Made fresh daily</div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
