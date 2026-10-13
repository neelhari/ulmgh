import React from 'react';
import { cn } from '../utils/cn';

export function Badge({ children, className }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-brand-orange",
      className
    )}>
      {children}
    </span>
  );
}
