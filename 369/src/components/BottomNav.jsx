import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';

const BRAND = '#0047FF';
const BRAND_LIGHT = '#2563eb';
const BRAND_GLOW = 'rgba(0,71,255,0.28)';
const INACTIVE = '#94a3b8';

export function BottomNav() {
  const { token } = useAuthStore();
  const location = useLocation();
  const cartCount = useCartStore(s => s.items.reduce((a, i) => a + i.qty, 0));
  const wishlistCount = useWishlistStore(s => s.items.length);

  const isActive = (paths) => paths.some(p =>
    typeof p === 'function' ? p(location.pathname) : location.pathname === p
  );

  const tabs = [
    {
      name: 'Home',
      path: '/',
      active: isActive(['/']),
      icon: (active) => (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke={active ? '#fff' : INACTIVE} strokeWidth="2">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" strokeLinejoin="round"/>
          <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'Shop',
      path: '/category/all',
      active: isActive([p => p.startsWith('/category')]),
      icon: (active) => (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8"/>
        </svg>
      )
    },
    {
      name: 'Wishlist',
      path: '/wishlist',
      active: isActive(['/wishlist']),
      badge: wishlistCount,
      icon: (active) => (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: 'Account',
      path: token ? '/dashboard' : '/login',
      active: isActive(['/dashboard', '/profile', '/my-addresses', '/account-settings', '/login', '/my-orders']),
      icon: (active) => (
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none">
          <circle cx="12" cy="8" r="4" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill={active ? '#fff' : 'none'} stroke={active ? 'none' : INACTIVE} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      )
    },
  ];

  return (
    <>
      <style>{`
        @keyframes bnav-pop {
          0% { transform: scale(0.8); opacity: 0.5; }
          60% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bnav-dot-in {
          0% { opacity: 0; transform: scaleX(0); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .bnav-pill-active {
          animation: bnav-pop 0.35s cubic-bezier(.34,1.56,.64,1) both;
        }
        .bnav-dot {
          animation: bnav-dot-in 0.3s cubic-bezier(.34,1.56,.64,1) both;
          transform-origin: center;
        }
      `}</style>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 w-full z-50 pb-safe"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, #ffffff 100%)',
          borderTop: '1px solid rgba(0,71,255,0.10)',
          boxShadow: '0 -6px 32px rgba(0,71,255,0.10), 0 -1px 0 rgba(0,71,255,0.06)',
        }}
      >
        <div className="flex justify-around items-center h-[68px] px-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className="flex flex-col items-center justify-center h-full gap-[3px] flex-1 relative select-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Icon pill */}
              <div
                className={`relative flex items-center justify-center rounded-2xl transition-all duration-300 ${tab.active ? 'bnav-pill-active' : ''}`}
                style={{
                  width: 54,
                  height: 32,
                  background: tab.active
                    ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)`
                    : 'transparent',
                  boxShadow: tab.active
                    ? `0 4px 18px ${BRAND_GLOW}, 0 1px 4px rgba(0,71,255,0.18)`
                    : 'none',
                }}
              >
                {/* Badge */}
                {tab.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-[5px] z-10 border-[1.5px] border-white"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
                <div className={`transition-transform duration-300 ${tab.active ? 'scale-95' : 'scale-100 hover:scale-110'}`}>
                  {tab.icon(tab.active)}
                </div>
              </div>

              {/* Label */}
              <span
                className="text-[9.5px] font-semibold tracking-wide transition-all duration-300 leading-none"
                style={{
                  color: tab.active ? BRAND : '#94a3b8',
                  fontFamily: "'Poppins', sans-serif",
                  letterSpacing: tab.active ? '0.04em' : '0.02em',
                }}
              >
                {tab.name}
              </span>

              {/* Active dot indicator */}
              {tab.active && (
                <span
                  className="bnav-dot absolute bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] rounded-full"
                  style={{
                    width: 20,
                    background: `linear-gradient(90deg, ${BRAND}, ${BRAND_LIGHT})`,
                    boxShadow: `0 0 8px ${BRAND_GLOW}`,
                  }}
                />
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
