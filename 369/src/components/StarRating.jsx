import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '../utils/cn';

export function StarRating({ rating, reviewsCount, className }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex bg-brand-green text-white px-1.5 py-0.5 rounded text-xs font-bold items-center gap-0.5">
        <span>{rating}</span>
        <Star className="w-3 h-3 fill-current" />
      </div>
      {reviewsCount && (
        <span className="text-xs text-brand-gray ml-1">({reviewsCount} reviews)</span>
      )}
    </div>
  );
}
