import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import confetti from 'canvas-confetti';

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Fire a beautiful confetti burst on mount
    const end = Date.now() + 1.5 * 1000;
    const colors = ['#036e26', '#7D2A2A', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans flex flex-col">
      <Header title="Order Confirmation" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 mt-8 max-w-2xl mx-auto w-full">
        
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-60 scale-150"></div>
          <CheckCircle2 className="w-28 h-28 text-green-500 relative z-10 drop-shadow-md" strokeWidth={1.5} />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center space-y-3 mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-gray-500 text-sm md:text-base">Thank you for shopping with ULMGH369. Your items are being prepared.</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-full -z-0"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-lg font-bold text-brand-orange">#{orderId}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-brand-orange" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Est. Delivery</p>
                <p className="text-sm font-semibold text-gray-900">Within 3-5 Days</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full space-y-4"
        >
          <button 
            onClick={() => navigate('/category/all')}
            className="w-full bg-gradient-to-r from-brand-orange to-brand-maroon text-white font-bold text-base rounded-2xl py-4 shadow-lg shadow-brand-orange/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ShoppingBag className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-gray-700 font-bold text-base rounded-2xl py-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            Go to Home
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
