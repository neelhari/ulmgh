import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export function FloatingActionButton({ onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-[5.5rem] md:bottom-8 right-4 md:right-8 z-40 bg-gradient-to-r from-green-500 to-green-600 text-white p-3.5 md:p-4 rounded-full shadow-[0_8px_30px_rgba(34,197,94,0.4)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.6)] hover:-translate-y-1 transition-all duration-300 group active:scale-95 cursor-pointer flex items-center justify-center border border-green-400/50",
        className
      )}
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="w-7 h-7" />
    </button>
  );
}
