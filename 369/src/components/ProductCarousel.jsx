import React, { useRef } from 'react';
import { ProductCard } from './ProductCard';
import { products } from '../data/products';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Link } from 'react-router-dom';

export function ProductCarousel({ title = "You May Also Like", maxItems = 4, categoryId = null }) {
  const container = useRef();
  
  // Filter products, ensure we don't show the exact same category if it's too small, just get random/featured if needed
  let displayProducts = categoryId 
    ? products.filter(p => p.categoryId === categoryId)
    : [...products].sort(() => 0.5 - Math.random());
    
  if (displayProducts.length < 2) {
    displayProducts = [...products].sort(() => 0.5 - Math.random());
  }
  
  displayProducts = displayProducts.slice(0, maxItems);

  if (displayProducts.length === 0) return null;

  useGSAP(() => {
    gsap.from('.carousel-item', {
      scrollTrigger: {
        trigger: container.current,
        start: 'top 85%',
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }, { scope: container });

  return (
    <div ref={container} className="py-16 md:py-24 border-t border-gray-100 mt-12 w-full">
      <div className="flex justify-between items-end mb-12 carousel-item px-4 md:px-0">
        <h2 className="font-serif text-3xl md:text-4xl text-brand-maroon">{title}</h2>
        <Link to="/category/all" className="hidden md:block uppercase font-bold tracking-[0.2em] text-xs border-b border-brand-maroon pb-1 hover:text-brand-orange transition-colors">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 px-4 md:px-0">
        {displayProducts.map((product, idx) => (
          <div key={`${product.id}-${idx}`} className="carousel-item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
