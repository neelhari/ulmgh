import React from 'react';

export function AdBanner({ imageUrl, altText, link = "#" }) {
  return (
    <div className="w-full my-6 overflow-hidden rounded-2xl shadow-sm border border-brand-orange/10 group cursor-pointer relative">
      <a href={link} className="block w-full h-full">
        {/* Placeholder gradient in case image fails or loads slowly */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-brand-green/20 animate-pulse -z-10" />
        <img 
          src={imageUrl} 
          alt={altText || "Advertisement"} 
          className="w-full h-32 md:h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500" 
        />
        {/* Ad label badge */}
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
          Ad
        </div>
      </a>
    </div>
  );
}
