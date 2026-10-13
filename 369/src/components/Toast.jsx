import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

export function Toast() {
  const { toast } = useToastStore();

  if (!toast) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-[slideIn_0.3s_ease-out] w-max max-w-[90vw]">
      <div className="bg-white rounded-xl border border-gray-100 px-4 md:px-5 py-3 md:py-3.5 shadow-xl flex items-center gap-3">
        {toast.type === 'success' ? (
          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-brand-green" strokeWidth={1.5} />
        ) : (
          <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" strokeWidth={1.5} />
        )}
        <span className="font-semibold font-sans text-sm md:text-base text-gray-900">{toast.message}</span>
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
