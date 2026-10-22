import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Menu, Search, Heart, ShoppingCart, LogIn, Package, MapPin, LayoutDashboard, LogOut,
  Settings, Shield, ChevronDown, X, Tag, Grid3X3, Home, ShoppingBag, Zap,
  User, Phone, Info, Lock, FileText, ChevronRight, Star, Gift, Wallet, Ticket, Bell, ScanLine, ArrowLeft
} from 'lucide-react';


import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useStoreData } from '../store/useStoreData';
import { getFirstImage, getProductPrice } from './ProductCard';
import logo from '../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

function AvatarDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'My Orders', path: '/my-orders' },
    { icon: MapPin, label: 'My Addresses', path: '/my-addresses' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: Settings, label: 'Account Settings', path: '/account-settings' },
    ...(user?.role === 'admin' ? [{ icon: Shield, label: 'Admin Panel', path: '/admin' }] : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 group">
        <div className="w-8 h-8 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center shadow-sm ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all">
          {initials}
        </div>
        <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform hidden md:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100]">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
          {items.map(({ icon: Icon, label, path }) => (
            <button key={path} onClick={() => { navigate(path); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-brand-orange transition-colors text-left">
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1">
            <button onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const categories = useStoreData(s => s.categories);

  return (
    <div ref={ref} className="relative py-4 -my-4"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-colors">
        Categories <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100]">
          <button onClick={() => { navigate('/category/all'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-orange hover:bg-brand-orange/10 transition-colors">
            <Grid3X3 className="w-4 h-4" /> All Categories
          </button>
          <div className="border-t border-gray-100 my-1" />
          {categories.map(cat => (
            <button key={cat.id} onClick={() => { navigate(`/category/${cat.id}`); setOpen(false); }}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-orange/10 hover:text-brand-orange transition-colors">
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OffersDropdown() {
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/offers/active`)
      .then(r => r.json())
      .then(d => setOffers(d.offers || []))
      .catch(() => { });
  }, []);

  return (
    <div ref={ref} className="relative py-4 -my-4"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-colors">
        Offers <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[100]">
          <button onClick={() => { navigate('/offers'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-orange hover:bg-brand-orange/10 transition-colors">
            <Tag className="w-4 h-4" /> View All Offers
          </button>
          {offers.filter(o => o.offer_type === 'offer' || !o.code).length > 0 && <div className="border-t border-gray-100 my-1" />}
          {offers.filter(o => o.offer_type === 'offer' || !o.code).slice(0, 6).map(offer => (
            <button key={offer.id} onClick={() => { navigate(`/offers?id=${offer.id}`); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-orange/10 transition-colors">
              <span className="text-sm font-semibold text-gray-700 truncate">{offer.name}</span>
              <span className="text-xs font-bold text-brand-orange ml-2 shrink-0">
                {offer.discount_type === 'flat' ? `₹${offer.discount_percent}` : `${offer.discount_percent}%`} OFF
              </span>
            </button>
          ))}
          {offers.filter(o => o.offer_type === 'offer' || !o.code).length === 0 && (
            <p className="px-4 py-3 text-xs text-gray-500">No active offers right now</p>
          )}
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => { navigate('/all-coupons'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-orange hover:bg-brand-orange/10 transition-colors">
            <Ticket className="w-4 h-4" /> All Coupons Available
          </button>
        </div>
      )}
    </div>
  );
}

function DesktopFullHeader({ cartCount, wishlistCount, token, user, handleLogout, hideSearch, localSearch, handleSearchChange, handleSearchEnter, searchResults, setLocalSearch }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="h-[90px] lg:h-[110px] hidden md:block" />
      <header className="fixed top-0 left-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-md px-6 md:px-10 lg:px-12 py-2 hidden md:block transition-all duration-300">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-4">

          {/* Navigation Links */}
          <nav className="flex-1 hidden lg:flex items-center justify-start gap-4 xl:gap-6">
            <Link to="/" className="text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-all relative group whitespace-nowrap">
              Home
              <span className="absolute -bottom-1.5 left-1/2 w-0 h-0.5 bg-brand-orange group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out"></span>
            </Link>
            <CategoriesDropdown />
            <OffersDropdown />
            <Link to="/about" className="text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-all relative group whitespace-nowrap">
              About
              <span className="absolute -bottom-1.5 left-1/2 w-0 h-0.5 bg-brand-orange group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out"></span>
            </Link>
            <Link to="/meditation" className="text-[14px] lg:text-[15px] font-bold text-teal-700 hover:text-teal-500 transition-all relative group whitespace-nowrap">
              Well-being
              <span className="absolute -bottom-1.5 left-1/2 w-0 h-0.5 bg-teal-500 group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out"></span>
            </Link>
            <Link to="/contact" className="text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-all relative group whitespace-nowrap">
              Contact
              <span className="absolute -bottom-1.5 left-1/2 w-0 h-0.5 bg-brand-orange group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out"></span>
            </Link>
            <Link to="/my-orders" className="text-[14px] lg:text-[15px] font-bold text-gray-900 hover:text-brand-orange transition-all relative group whitespace-nowrap">
              Orders
              <span className="absolute -bottom-1.5 left-1/2 w-0 h-0.5 bg-brand-orange group-hover:w-full group-hover:left-0 transition-all duration-300 ease-out"></span>
            </Link>
          </nav>

          {/* Centered Logo */}
          <Link to="/" className="shrink-0 flex items-center justify-center mx-4 group lg:mx-0 relative">
            <img src={logo} alt="Logo" className="relative z-10 h-20 md:h-28 lg:h-32 w-auto max-w-[320px] lg:max-w-[400px] object-contain transition-all duration-500 group-hover:scale-105 filter drop-shadow-md" />
          </Link>

          {/* Right Action Icons & Search */}
          <div className="flex-1 flex items-center justify-end gap-5 lg:gap-8">
            {!hideSearch && (
              <div className="relative hidden xl:block w-[260px] group">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-orange transition-colors z-10" />
                <input type="text" placeholder="Search products..."
                  value={localSearch}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                  className="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange/50 transition-all shadow-inner shadow-gray-100"
                />
                {searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] max-h-[300px] overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setLocalSearch('');
                          navigate(`/product/${product.id}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-brand-orange/5 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                      >
                        <img src={product.displayImg} alt={product.name} 
                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'; }}
                             className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-medium text-brand-orange">₹{product.displayPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 lg:gap-5">


              <Link to="/wishlist" className="relative p-2.5 cursor-pointer bg-white hover:bg-gray-50 rounded-full border border-gray-200 shadow-sm hover:shadow hover:border-brand-orange/40 hover:-translate-y-1 transition-all group">
                <Heart className="w-5 h-5 text-gray-600 group-hover:text-brand-orange transition-colors" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative p-2.5 cursor-pointer bg-white hover:bg-gray-50 rounded-full border border-gray-200 shadow-sm hover:shadow hover:border-brand-orange/40 hover:-translate-y-1 transition-all group">
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-brand-orange transition-colors" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {token ? (
                <div className="ml-2">
                  <AvatarDropdown user={user} onLogout={handleLogout} />
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-700 px-5 lg:px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ml-2 group">
                  <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="tracking-wide">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function Header({ variant = 'default', title, showShare = false, hideSearch = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState('');
  const [locationName, setLocationName] = useState('Allow location access');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('8 min');

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

          if (mapboxToken) {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`);
            const data = await res.json();
            if (data?.features?.length > 0) {
              const feature = data.features[0];
              const shortAddress = feature.text || feature.place_name?.split(',').slice(0, 2).join(',').trim();
              setLocationName(shortAddress || 'Location found');
              setEstimatedTime('12 min');
              return;
            }
          }

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            const parts = data.display_name.split(',');
            const shortAddress = parts.slice(0, 3).join(',').trim();
            setLocationName(shortAddress);
            setEstimatedTime('12 min');
          } else {
            setLocationName('Location found');
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          setLocationName('Location found');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve location. Please check settings.");
        setIsFetchingLocation(false);
      }
    );
  };

  useEffect(() => {
    setLocalSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const isCategoryPage = location.pathname.startsWith('/category');
  const isHomePage = location.pathname === '/';
  const effectiveHideSearch = hideSearch || !(isCategoryPage || isHomePage);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (isCategoryPage) {
      const newParams = Object.fromEntries(searchParams.entries());
      if (val) newParams.search = val;
      else delete newParams.search;
      setSearchParams(newParams);
    }
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter' && localSearch.trim() && !isCategoryPage) {
      navigate(`/category/all?search=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // slide-out drawer for home header
  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/offers/active`)
      .then(r => r.json())
      .then(d => setOffers(d.offers || []))
      .catch(() => { });
  }, []);

  const categories = useStoreData(s => s.categories);
  const products = useStoreData(s => s.products);

  const searchResults = localSearch.length >= 2
    ? products.filter(p =>
      p.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(localSearch.toLowerCase()))
    ).slice(0, 5).map(p => {
      let parsedSizes = [];
      try {
        if (typeof p.sizes === 'string') parsedSizes = JSON.parse(p.sizes);
        else if (Array.isArray(p.sizes)) parsedSizes = p.sizes;
      } catch (e) { }
      return {
        ...p,
        displayImg: getFirstImage(p, parsedSizes),
        displayPrice: getProductPrice(p, parsedSizes)
      };
    })
    : [];

  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;
  const { token, user, logout } = useAuthStore();
  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Offers', path: '/offers' },
    { name: 'Meditation & Well-being', path: '/meditation' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'My Orders', path: '/my-orders' },
    { name: 'My Profile', path: '/profile' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <DesktopFullHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        token={token}
        user={user}
        handleLogout={handleLogout}
        hideSearch={effectiveHideSearch}
        localSearch={localSearch}
        handleSearchChange={handleSearchChange}
        handleSearchEnter={handleSearchEnter}
        searchResults={searchResults}
        setLocalSearch={setLocalSearch}
      />

      {/* Mobile */}
      <div className="md:hidden">
        {/* Sidebar overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          {mobileMenuOpen && (
            <motion.div key="sidebar"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 w-[280px] h-full bg-white border-r border-gray-100 z-[101] shadow-xl flex flex-col">

              <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-orange-50/50">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-24 w-auto max-w-[240px] object-contain" />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-full border border-gray-200 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <motion.nav variants={containerVariants} initial="hidden" animate="visible"
                className="flex flex-col p-4 gap-1 flex-grow overflow-y-auto">

                {/* Categories accordion */}
                <motion.div variants={itemVariants}>
                  <button onClick={() => setMobileCatsOpen(o => !o)}
                    className="w-full flex items-center justify-between text-gray-900 font-bold text-base py-3 px-4 rounded-xl hover:bg-gray-50 hover:text-brand-orange transition-all">
                    Categories
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileCatsOpen ? 'rotate-180 text-brand-orange' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileCatsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="ml-5 border-l-2 border-gray-100 pl-4 py-2 space-y-1 mt-1 mb-2">
                          <Link to="/category/all" onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm font-extrabold text-brand-orange py-2.5 px-3 rounded-lg hover:bg-orange-50 transition-colors">
                            All Categories
                          </Link>
                          {categories.map(cat => (
                            <Link key={cat.id} to={`/category/${cat.id}`} onClick={() => setMobileMenuOpen(false)}
                              className="block text-sm font-medium text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors">
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {navLinks.map(link => (
                  <motion.div key={link.name} variants={itemVariants}>
                    <Link to={link.path} onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-900 font-bold text-base py-3 px-4 rounded-xl hover:bg-gray-50 hover:text-brand-orange transition-all">
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>

              {!token && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="p-5 border-t border-gray-100 bg-gray-50">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-brand-blue text-white font-extrabold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition-all">
                    <LogIn className="w-5 h-5" /> Login to Account
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={effectiveHideSearch ? "h-[56px]" : "h-[108px]"} />
        <header className="fixed top-0 left-0 z-50 w-full bg-gradient-to-r from-[#ff8500] to-[#ffba00] shadow-md pb-2.5">
          <div className="w-full max-w-lg mx-auto px-4 pt-safe pt-2 relative z-10">
            {/* Top Row: Logo & Icons */}
            <div className={`flex items-center justify-between ${effectiveHideSearch ? 'h-10 mb-0' : 'h-10 mb-2'}`}>
              <div className="flex items-center">
                {title ? (
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="bg-white/90 w-11 h-11 flex items-center justify-center rounded-full shadow-sm backdrop-blur-sm text-gray-900 border border-gray-100 active:scale-95 transition-transform" aria-label="Go back">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-white font-bold text-[17px] tracking-wide drop-shadow-sm">{title}</h1>
                  </div>
                ) : (
                  <Link to="/" className="flex items-center">
                    <img src={logo} alt="Logo" className="h-9 w-auto object-contain drop-shadow-sm" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate('/cart')}
                  className="relative text-white w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-6 h-6 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-blue-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#ff8500] shadow-sm px-1">
                      {cartCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setMenuOpen(true)}
                  className="relative text-white w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
                  aria-label="Menu"
                >
                  <Menu className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {!effectiveHideSearch && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, brands and more"
                  className="w-full bg-white border-0 rounded-xl h-10 py-2 pl-10 pr-10 text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
                  value={localSearch}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchEnter}
                />
                {/* <ScanLine className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 cursor-pointer hover:text-brand-orange" /> */}
                {searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] max-h-[250px] overflow-y-auto">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setLocalSearch('');
                          navigate(`/product/${product.id}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-brand-orange/5 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                      >
                        <img src={product.displayImg} alt={product.name} 
                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'; }}
                             className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-medium text-brand-orange">₹{product.displayPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ── SLIDE-OUT MENU DRAWER ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-[320px] bg-white z-[201] flex flex-col overflow-hidden"
              style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.1)' }}
            >
              {/* Top orange accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-orange to-yellow-400" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-8 pb-5 border-b border-gray-100">
                <div>
                  <p className="text-gray-900 font-extrabold text-xl tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
                    ULMGH369
                  </p>
                  <p className="text-brand-orange text-[9px] font-bold tracking-[0.22em] uppercase mt-0.5">
                    Your Choice, From Anywhere.
                  </p>
                </div>
                <button onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm">
                  <X className="w-4.5 h-4.5 text-gray-500" />
                </button>
              </div>

              {/* User section */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                {token && user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-orange to-yellow-400 flex items-center justify-center shadow-md shadow-brand-orange/20">
                      <span className="text-white font-black text-lg">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-[15px] truncate">{user.name}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                      className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { navigate('/login'); setMenuOpen(false); }}
                      className="flex-1 bg-gradient-to-r from-brand-orange to-yellow-400 text-white font-bold py-2.5 rounded-xl text-sm shadow-md hover:shadow-brand-orange/40 hover:opacity-90 transition-all">
                      Login
                    </button>
                    <button onClick={() => { navigate('/signup'); setMenuOpen(false); }}
                      className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">
                      Sign Up
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable nav */}
              <div className="flex-1 overflow-y-auto px-3 py-3">

                {/* Main nav */}
                <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase mb-2 px-3">Menu</p>
                {[
                  { icon: <Home className="w-4.5 h-4.5" />, label: 'Home', path: '/', color: 'text-gray-700' },
                  { icon: <ShoppingBag className="w-4.5 h-4.5" />, label: 'Shop All', path: '/category/all', color: 'text-purple-600' },
                  { id: 'offers', icon: <Zap className="w-4.5 h-4.5 fill-current" />, label: 'Offers & Deals', color: 'text-brand-orange', isAccordion: true },
                  { icon: <Package className="w-4.5 h-4.5" />, label: 'My Orders', path: '/my-orders', color: 'text-blue-600', badge: null },
                  { icon: <Heart className="w-4.5 h-4.5" />, label: 'Wishlist', path: '/wishlist', color: 'text-red-500', badge: wishlistCount > 0 ? wishlistCount : null },
                  { icon: <ShoppingCart className="w-4.5 h-4.5" />, label: 'Cart', path: '/cart', color: 'text-green-600', badge: cartCount > 0 ? cartCount : null },
                  { icon: <MapPin className="w-4.5 h-4.5" />, label: 'My Addresses', path: token ? '/my-addresses' : '/login', color: 'text-indigo-600' },
                  { icon: <User className="w-4.5 h-4.5" />, label: 'My Profile', path: token ? '/profile' : '/login', color: 'text-brand-orange' },
                  { icon: <Gift className="w-4.5 h-4.5" />, label: 'Refer by A 501', path: '/refer', color: 'text-pink-500' },
                ].map(item => {
                  if (item.isAccordion && item.id === 'offers') {
                    return (
                      <div key={item.id} className="mb-0.5">
                        <button
                          onClick={() => setMobileOffersOpen(!mobileOffersOpen)}
                          className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                          <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors ${item.color}`}>
                            {item.icon}
                          </div>
                          <span className="text-gray-800 font-bold text-[14px] group-hover:text-gray-900 transition-colors flex-1">{item.label}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-transform ${mobileOffersOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {mobileOffersOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="ml-7 border-l-2 border-gray-100 pl-3 py-2 space-y-1 mt-1 mb-2">
                                <button onClick={() => { navigate('/offers'); setMenuOpen(false); }} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-orange-50 text-left text-sm font-bold text-brand-orange transition-colors">
                                  <Tag className="w-4 h-4" /> View All Offers
                                </button>
                                {offers.filter(o => o.offer_type === 'offer' || !o.code).slice(0, 6).map(offer => (
                                  <button key={offer.id} onClick={() => { navigate(`/offers?id=${offer.id}`); setMenuOpen(false); }} className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                    <span className="text-[13px] font-medium text-gray-600 truncate">{offer.name}</span>
                                    <span className="text-[11px] font-bold text-brand-orange ml-2 shrink-0">
                                      {offer.discount_type === 'flat' ? `₹${offer.discount_percent}` : `${offer.discount_percent}%`} OFF
                                    </span>
                                  </button>
                                ))}
                                <button onClick={() => { navigate('/all-coupons'); setMenuOpen(false); }} className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-yellow-50 text-left text-sm font-bold text-yellow-600 transition-colors mt-2 border-t border-gray-100 pt-3">
                                  <Ticket className="w-4 h-4" /> All Coupons Available
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <button key={item.path}
                      onClick={() => { navigate(item.path); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group mb-0.5">
                      <div className={`w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors ${item.color}`}>
                        {item.icon}
                      </div>
                      <span className="text-gray-800 font-bold text-[14px] group-hover:text-gray-900 transition-colors flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-brand-orange text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                  );
                })}

                {/* Categories */}
                {categories.length > 0 && (
                  <>
                    <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase mt-4 mb-2 px-3">Categories</p>
                    {categories.slice(0, 6).map(cat => (
                      <button key={cat.id}
                        onClick={() => { navigate(`/category/${cat.slug || cat.id}`); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group mb-0.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gray-100 border border-gray-100 transition-colors">
                          <Tag className="w-4 h-4 text-brand-orange/80" />
                        </div>
                        <span className="text-gray-700 font-medium text-[14px] group-hover:text-gray-900 transition-colors flex-1">{cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </button>
                    ))}
                  </>
                )}

                {/* Info links */}
                <p className="text-gray-400 text-[9px] font-black tracking-[0.2em] uppercase mt-4 mb-2 px-3">Info</p>
                {[
                  { icon: <Info className="w-4 h-4" />, label: 'About Us', path: '/about' },
                  { icon: <Phone className="w-4 h-4" />, label: 'Contact Us', path: '/contact' },
                  { icon: <Lock className="w-4 h-4" />, label: 'Privacy Policy', path: '/privacy-policy' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Terms & Conditions', path: '/terms' },
                ].map(item => (
                  <button key={item.path}
                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group mb-0.5">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 border border-gray-100 transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-gray-500 font-medium text-[13px] group-hover:text-gray-800 transition-colors">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-gray-500 transition-colors" />
                  </button>
                ))}

                <div className="h-4" />
              </div>

              {/* Footer: logout + tagline */}
              <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/50">
                {token ? (
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 font-semibold text-[14px] transition-colors mb-3">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : null}
                <p className="text-gray-400 text-[10px] text-center font-medium">
                  © 2026 ULMGH369 · Crafted with ♥
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

