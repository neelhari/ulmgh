import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toast } from './Toast';
import { Footer } from './Footer';

export function AppLayout({ children }) {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Hide BottomNav on product detail, cart, and checkout pages — they have their own sticky action bars
  const hideBottomNav = pathname.startsWith('/product/') || pathname.startsWith('/cart') || pathname.startsWith('/checkout');

  return (
    <div className="min-h-screen bg-transparent flex justify-center w-full">
      <div className="w-full md:max-w-full max-w-5xl mx-auto bg-transparent relative min-h-screen flex flex-col overflow-x-hidden">
        <Toast />
        
        {/* Main Content Area */}
        <main className={`flex-grow flex flex-col ${hideBottomNav ? 'pb-0' : 'pb-20 md:pb-0'}`}>
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Bottom Navigation */}
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
