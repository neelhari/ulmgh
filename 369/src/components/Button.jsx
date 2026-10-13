import React from 'react';
import { cn } from '../utils/cn';

export function Button({ 
  children, 
  variant = 'solid', 
  size = 'md', 
  className = '', 
  icon: Icon,
  ...props 
}) {
  const baseClass = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-full cursor-pointer active:scale-[0.97]";
  
  const sizeClasses = {
    sm: "px-4 py-1.5 text-xs md:text-sm",
    md: "px-6 py-2 md:py-2.5 text-sm md:text-base",
    lg: "px-8 py-3 md:py-3.5 text-base md:text-lg w-full md:w-auto"
  };

  const variantClasses = {
    solid: "bg-gradient-to-r from-brand-orange to-[#ff7b1c] text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5",
    outline: "border-2 border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white shadow-sm hover:-translate-y-0.5",
    ghost: "text-brand-gray hover:text-brand-orange hover:bg-orange-50"
  };

  return (
    <button 
      className={cn(baseClass, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 mr-2" strokeWidth={2} />}
      {children}
    </button>
  );
}
