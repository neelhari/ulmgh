import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Truck, Award, Headset, Percent, Smartphone, Shirt, Monitor, Sofa, Sparkles, Zap, Calendar, RefreshCw } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { AdBanner } from '../components/AdBanner';
import { useStoreData } from '../store/useStoreData';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';

import imgHeroBanner from '../assets/hero_banner.png';
import imgHeroBannerPremium from '../assets/hero_banner_premium.jpg';
import imgAarti from '../assets/story_aarti.png';

const AnimatedBannerCarousel = () => {
  const scrollRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const allBanners = useStoreData(state => state.banners) || [];
  const storeBanners = React.useMemo(() => allBanners.filter(b => b.is_active), [allBanners]);
  
  const fallbackBanners = [
    {
      id: 'f1',
      bg: 'bg-gradient-to-r from-[#991b54] to-[#c81e51]',
      logo: 'boAt',
      title: 'This Rakhi,\nGift Great Audio.',
      subtitle: 'Up to 80% Off',
      image: 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?w=500&q=80',
      tag: 'INDIA\'S #1 AUDIO BRAND'
    },
    {
      id: 'f2',
      bg: 'bg-gradient-to-r from-blue-800 to-blue-600',
      logo: 'SAMSUNG',
      title: 'Galaxy Days\nAre Here.',
      subtitle: 'Flat ₹5000 Off',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80',
      tag: 'TOP RATED SMARTPHONES'
    },
    {
      id: 'f3',
      bg: 'bg-gradient-to-r from-green-800 to-green-600',
      logo: 'LAKMÉ',
      title: 'Glow Like\nNever Before.',
      subtitle: 'Min 40% Off',
      image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=500&q=80',
      tag: 'BEAUTY ESSENTIALS'
    }
  ];

  const displayBanners = storeBanners.length > 0 ? storeBanners : fallbackBanners;

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % displayBanners.length;
        if (scrollRef.current) {
          const slideWidth = scrollRef.current.clientWidth;
          scrollRef.current.scrollTo({
            left: next * slideWidth,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [displayBanners.length]);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const slideWidth = e.target.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank');
      } else {
        window.location.href = banner.link_url;
      }
    }
  };

  return (
    <div className="relative w-full rounded-2xl my-6">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full rounded-2xl shadow-md border border-gray-100 bg-white"
        style={{ scrollBehavior: 'smooth' }}
      >
        {displayBanners.map((banner, idx) => {
          const isCustom = !!banner.image_url;
          return (
          <div key={banner.id || idx} onClick={() => handleBannerClick(banner)} className={`w-full shrink-0 snap-center relative ${banner.link_url ? 'cursor-pointer' : ''}`}>
            {isCustom ? (
               <div className="w-full h-[190px] md:h-[220px] relative overflow-hidden bg-gray-50 flex items-center justify-center">
                 <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
               </div>
            ) : (
            <div className={`w-full h-[190px] md:h-[220px] ${banner.bg} p-5 flex items-center relative overflow-hidden`}>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full transform -translate-y-1/2"></div>
              {/* Fake laser rays or light effects */}
              <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/10 rotate-45 transform origin-center"></div>
              <div className="absolute top-0 right-1/3 w-[1px] h-full bg-white/10 -rotate-45 transform origin-center"></div>
              
              <div className="relative z-10 w-[65%] text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl md:text-2xl font-black tracking-tighter">{banner.logo}</span>
                  <div className="w-[1px] h-4 bg-white/40"></div>
                  <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-white/90 leading-tight">
                    {banner.tag}
                  </span>
                </div>
                
                <h2 className="text-[20px] md:text-[26px] font-bold leading-tight mb-2 tracking-tight">
                  {banner.title.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
                </h2>
                
                <div className="text-[17px] md:text-[20px] font-extrabold text-white">
                  {banner.subtitle}
                </div>
              </div>
              
              <div className="absolute right-[-5%] bottom-0 h-[90%] w-[50%] flex items-end justify-center z-10">
                <img src={banner.image} alt={banner.logo} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'; }} className="h-full object-contain drop-shadow-2xl mix-blend-luminosity brightness-[1.3] contrast-[1.1]" style={{ filter: 'drop-shadow(0 20px 13px rgba(0,0,0,0.4)) saturate(0) brightness(2) contrast(1.5)' }} />
              </div>
              
              <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white/80 text-[8px] px-1.5 py-0.5 rounded font-bold">AD</div>
            </div>
            )}
          </div>
        )})}
      </div>
      
      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3 w-full">
        {displayBanners.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-4 bg-gray-400' : 'w-1.5 bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

const GroupedCategories = () => {
  const groups = [
    {
      title: "Grocery",
      items: [
        { name: "Fresh fruits", img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80" },
        { name: "Fresh vegetables", img: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=200&q=80" },
        { name: "Atta, rice & dal", img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80" },
        { name: "Oil, Ghee & masala", img: "https://images.unsplash.com/photo-1620860228392-f04b2b2a60a7?w=200&q=80" },
        { name: "Dairy, bread & eggs", img: "https://images.unsplash.com/photo-1628088062854-d1870b455389?w=200&q=80" },
        { name: "Cereals & dry fruits", img: "https://images.unsplash.com/photo-1596422846543-74c6fb0e3148?w=200&q=80" },
        { name: "Chicken, fish & meats", img: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=200&q=80" },
        { name: "Instant & frozen food", img: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=200&q=80" }
      ]
    },
    {
      title: "Snacks & drinks",
      items: [
        { name: "Chips & namkeens", img: "https://images.unsplash.com/photo-1566478989037-e924e526d15a?w=200&q=80" },
        { name: "Drinks & juices", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&q=80" },
        { name: "Bakery & biscuits", img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&q=80" },
        { name: "Sweets", img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80" },
        { name: "Chocolates", img: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=200&q=80" },
        { name: "Ice creams", img: "https://images.unsplash.com/photo-1570197781417-0f5a2f5ed9cd?w=200&q=80" },
        { name: "Sauces & spreads", img: "https://images.unsplash.com/photo-1584228695015-fa8340d859d5?w=200&q=80" },
        { name: "Tea, coffee", img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=200&q=80" }
      ]
    },
    {
      title: "Beauty & personal care",
      items: [
        { name: "Bath & body", img: "https://images.unsplash.com/photo-1608248593842-8021f92e2124?w=200&q=80" },
        { name: "Hair care", img: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&q=80" },
        { name: "Skin care", img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&q=80" },
        { name: "Fragrances", img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&q=80" }
      ]
    }
  ];

  return (
    <div className="w-full my-6 flex flex-col gap-6 md:gap-8">
      {groups.map((group, idx) => (
        <div key={idx} className="bg-white px-3 py-5 md:px-6 md:py-6 rounded-[24px] shadow-sm border border-gray-100">
          <h3 className="text-[19px] font-extrabold text-gray-900 mb-5">{group.title}</h3>
          <div className="grid grid-cols-4 gap-x-2 gap-y-5">
            {group.items.map((item, itemIdx) => (
              <div key={itemIdx} className="flex flex-col items-center cursor-pointer group">
                <div className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] md:w-[90px] md:h-[90px] rounded-[18px] bg-[#fff5f8] p-2 mb-2 group-hover:scale-105 group-hover:bg-pink-100 transition-all duration-300 relative overflow-hidden flex items-center justify-center">
                  <img src={item.img} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'; }} className="w-[85%] h-[85%] object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-[11px] md:text-[13px] font-bold text-gray-800 text-center leading-tight line-clamp-2 px-0.5">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ShopByStore = () => {
  const stores = [
    { name: "Gift store", img: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&q=80", bg: "bg-pink-100" },
    { name: "Pooja store", img: "https://images.unsplash.com/photo-1614217154211-13da74be0a1a?w=200&q=80", bg: "bg-amber-100" },
    { name: "Travel store", img: "https://images.unsplash.com/photo-1551524162-849553f1d93b?w=200&q=80", bg: "bg-blue-100" },
    { name: "Snacks store", img: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&q=80", bg: "bg-red-50" },
    { name: "Sports store", img: "https://images.unsplash.com/photo-1518605368461-1e12d1b54a2a?w=200&q=80", bg: "bg-red-100" },
    { name: "Pet store", img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&q=80", bg: "bg-orange-100" },
    { name: "Auto store", img: "https://images.unsplash.com/photo-1600868843232-a9b0c9fbf8f0?w=200&q=80", bg: "bg-yellow-100" },
    { name: "House of Flipkart", img: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=200&q=80", bg: "bg-cyan-50" },
  ];

  return (
    <div className="w-full my-6 px-4">
      <h3 className="text-[20px] font-extrabold text-gray-900 mb-5 tracking-tight">Shop by store</h3>
      <div className="grid grid-cols-4 gap-x-3 gap-y-6">
        {stores.map((store, idx) => (
          <div key={idx} className="flex flex-col items-center cursor-pointer group">
            <div className={`w-[75px] h-[75px] sm:w-[85px] sm:h-[85px] md:w-[100px] md:h-[100px] rounded-[22px] ${store.bg} p-2.5 mb-2.5 group-hover:scale-105 group-hover:shadow-sm transition-all duration-300 relative overflow-hidden flex items-center justify-center`}>
              <img src={store.img} alt={store.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'; }} className="w-[95%] h-[95%] object-cover rounded-[12px] mix-blend-multiply group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-[12px] md:text-[14px] font-bold text-gray-900 text-center leading-[1.2] px-0.5">
              {store.name.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function HomePage() {
  const container = useRef(null);
  const navigate = useNavigate();
  const { products, categories, loading } = useStoreData();
  const [banners, setBanners] = React.useState([]);
  const [vendors, setVendors] = React.useState([
    { id: 'v1', business_name: 'ULMGH369 Silks', store_image: 'https://vaarahisilks.com/cdn/shop/articles/Home_Banner_B_1080_x_1650_FHD_49daaf56-8dd9-4544-934c-f17ec4672e1c.jpg?v=1765869118' },
    { id: 'v2', business_name: 'Kavya Creations', store_image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80' },
    { id: 'v3', business_name: 'The Loom Story', store_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80' },
    { id: 'v4', business_name: 'Ethnic Aura', store_image: 'https://vaarahisilks.com/cdn/shop/articles/Home_Banner_B_1080_x_1650_FHD_49daaf56-8dd9-4544-934c-f17ec4672e1c.jpg?v=1765869118' },
  ]);

  React.useEffect(() => {
    const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
    fetch(`${url}/general/banners`)
      .then(r => r.json())
      .then(d => { if (d.banners) setBanners(d.banners); })
      .catch(e => console.error(e));

    fetch(`${url}/general/vendors`)
      .then(r => r.json())
      .then(d => { if (d.vendors && d.vendors.length > 0) setVendors(d.vendors); })
      .catch(e => console.error(e));
  }, []);

  useGSAP(() => {
    if (!loading) {
      gsap.from('.animate-section', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }
  }, { scope: container, dependencies: [loading] });

  return (
    <div ref={container} className="bg-gray-50/50 min-h-screen pb-8 md:pb-8 font-sans">
      <Header variant="home" />

      <div className="max-w-lg mx-auto md:max-w-6xl w-full">
        {/* 1. Hero Banner: Dynamic Banners */}
        <div className="animate-section px-3 mt-4 md:px-4 md:mt-20">
          <AnimatedBannerCarousel />
        </div>

        {/* 2. Categories Grid */}
        <div className="animate-section px-2 md:px-3 mt-6 mb-4">
          <div className="bg-white rounded-[20px] md:rounded-[24px] shadow-sm border border-gray-100 p-2.5 md:p-6">
            <div className="grid grid-cols-5 gap-y-5 gap-x-1 sm:gap-x-2 md:gap-x-4">
              {/* "All Categories" Item */}
              <Link to="/category/all" className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#f0f4ff] flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden p-3">
                  <Smartphone className="w-6 h-6 text-blue-900 fill-gray-900" />
                </div>
                <span className="text-[10px] md:text-[12px] font-medium text-gray-800 text-center leading-tight">All Categories</span>
              </Link>
              
              {categories.slice(0, 8).map((cat, idx) => {
                const bgColors = ['bg-[#e8f5e9]', 'bg-[#e3f2fd]', 'bg-[#fce4ec]', 'bg-[#fff3e0]', 'bg-[#fff8e1]', 'bg-[#e0f2f1]', 'bg-[#f3e5f5]', 'bg-[#ffebee]', 'bg-[#eceff1]'];
                const bg = bgColors[idx % bgColors.length];
                return (
                  <Link key={cat.id || idx} to={`/category/${cat.id}`} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${bg} flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden p-2.5`}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} 
                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'; }}
                             className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-[10px] md:text-[12px] font-medium text-gray-800 text-center leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                );
              })}
              
              {/* "More" Item */}
              <Link to="/category/all" className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#f3f4f6] flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                </div>
                <span className="text-[10px] md:text-[12px] font-medium text-gray-800 text-center leading-tight">More</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Info Cards Grid */}
        <div className="animate-section px-3 mt-6">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-2">
            {/* SuperCoin */}
            <div className="shrink-0 snap-start w-[175px] md:w-[200px] bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm relative group hover:shadow-md transition-all flex flex-col justify-between min-h-[115px]">
              <div className="relative z-10 pr-8">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-4 h-4 bg-[#ffc107] rounded-full flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-white fill-white" strokeWidth={3} />
                  </div>
                  <span className="text-[14px] font-extrabold text-[#0f172a] tracking-tight truncate">SuperCoin</span>
                </div>
                <p className="text-[13px] text-gray-600 font-semibold mb-2">Earned <span className="text-[#16a34a] font-extrabold">120</span></p>
              </div>
              <p className="text-[13px] text-[#2563eb] font-semibold cursor-pointer relative z-10">Use Now</p>

              <div className="absolute right-3 bottom-3 w-[42px] h-[42px] bg-gradient-to-br from-[#ffcd38] to-[#ffb300] rounded-full shadow-sm flex items-center justify-center transform group-hover:scale-105 transition-transform overflow-hidden z-0">
                <Zap className="w-5 h-5 text-white fill-white transform -rotate-12" strokeWidth={2} />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-white/60 rounded-full blur-[1px]"></div>
              </div>
            </div>

            {/* No Cost EMI */}
            <div className="shrink-0 snap-start w-[175px] md:w-[200px] bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm relative group hover:shadow-md transition-all flex flex-col justify-between min-h-[115px]">
              <div className="relative z-10 pr-8">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Calendar className="w-4 h-4 text-[#16a34a] shrink-0" strokeWidth={2.5} />
                  <span className="text-[14px] font-extrabold text-[#0f172a] tracking-tight truncate">No Cost EMI</span>
                </div>
                <p className="text-[13px] text-gray-600 font-semibold mb-2 leading-tight">Up to 12 Months</p>
              </div>
              <p className="text-[13px] text-[#2563eb] font-semibold cursor-pointer relative z-10">Explore Now</p>

              <div className="absolute right-3 bottom-3 w-[42px] h-[42px] bg-[#16a34a] rounded-[12px] flex items-center justify-center transform group-hover:scale-105 transition-transform shadow-sm z-0">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Exchange Offer */}
            <div className="shrink-0 snap-start w-[175px] md:w-[200px] bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm relative group hover:shadow-md transition-all flex flex-col justify-between min-h-[115px]">
              <div className="relative z-10 pr-10">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <RefreshCw className="w-4 h-4 text-[#f97316] shrink-0" strokeWidth={2.5} />
                  <span className="text-[14px] font-extrabold text-[#0f172a] tracking-tight truncate">Exchange Offer</span>
                </div>
                <p className="text-[13px] text-gray-600 font-semibold mb-0.5 leading-tight">Up to ₹15,000 Off</p>
                <p className="text-[13px] text-gray-900 font-semibold leading-tight">On Old Devices</p>
              </div>

              <div className="absolute right-3 bottom-3 w-[42px] h-[42px] flex items-center justify-center transform group-hover:scale-105 transition-transform z-0">
                <RefreshCw className="w-8 h-8 text-[#f97316]" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Deal of the Day */}
        <div className="animate-section px-3 mt-6 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] py-3 px-1">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Deal of the Day</h3>
                <div className="flex items-center bg-[#ffebeb] text-[#ef4444] font-black text-[11px] px-1.5 py-0.5 rounded shadow-sm tracking-widest border border-red-100">
                  12 <span className="text-red-300 px-0.5 animate-pulse">:</span> 45 <span className="text-red-300 px-0.5 animate-pulse">:</span> 30
                </div>
              </div>
              <Link to="/offers" className="text-blue-600 text-[12px] font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors">View All</Link>
            </div>

            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-2 pb-2 snap-x">
              {products.length > 0 ? products.slice(0, 5).map((p, idx) => {
                const discounts = [40, 18, 50, 25, 30];
                const off = discounts[idx] || 20;
                const originalPrice = Math.round(p.price * (1 + (off / 100)));
                return (
                  <div key={p.id} className="w-[145px] md:w-[180px] shrink-0 snap-start h-full pb-2">
                    <motion.div
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="h-[280px] md:h-[310px] bg-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative group flex flex-col hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {/* Discount Tag */}
                      <div className="absolute top-0 left-0 bg-[#16a34a] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-br-lg z-10 flex items-center gap-0.5 shadow-sm">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                         {off}%
                      </div>
                      
                      <div className="h-[140px] md:h-[160px] bg-[#f8fafc] relative flex items-center justify-center border-b border-gray-100 overflow-hidden">
                         <img src={p.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'} alt={p.name} 
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'; }}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                         
                      {/* Add Button */}
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${p.id}`); }} className="absolute top-[122px] md:top-[142px] right-3 w-9 h-9 bg-white border-2 border-[#db2777] rounded-full flex items-center justify-center shadow-md hover:bg-[#db2777] group/btn transition-colors z-20">
                        <svg className="w-5 h-5 text-[#db2777] group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                      </button>
                      
                      <div className="p-3 pt-6 flex-1 flex flex-col bg-white">
                         <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit mb-1.5 border border-gray-200">1 Unit</div>
                         <h4 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1">{p.name}</h4>
                         <div className="flex items-center gap-1.5 mb-2 mt-auto">
                            <span className="text-[11px] text-gray-400 font-bold line-through">₹{originalPrice}</span>
                            <span className="text-[16px] font-black text-gray-900 tracking-tight">₹{p.price}</span>
                         </div>
                         {/* XtraSaver */}
                         <div className="bg-[#fef08a] rounded-md px-2 py-1 flex items-center justify-between border border-[#fde047]">
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                              <span className="text-[10px] font-black text-gray-900">₹{Math.round(p.price * 0.9)}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <span className="text-[9px] font-bold text-gray-800">XtraSaver</span>
                              <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                            </div>
                         </div>
                      </div>
                    </motion.div>
                  </div>
                );
              }) : (
                <div className="w-full text-center py-8 text-gray-500 text-sm">Loading deals...</div>
              )}
            </div>
          </div>
        </div>

        {/* Shop By Store Section */}
        <ShopByStore />

        {/* 5. Sponsored Banner */}
        <div className="animate-section px-3 mb-10">
          <div className="bg-gradient-to-r from-[#0d9488] to-[#14b8a6] rounded-xl p-4 text-white relative overflow-hidden flex items-center shadow-[0_4px_15px_rgba(20,184,166,0.3)]">
            <div className="absolute top-1 left-2 text-white/60 text-[9px] uppercase font-bold tracking-widest">Sponsored</div>
            <div className="z-10 w-[60%] pt-3">
              <h3 className="text-[15px] sm:text-lg font-extrabold leading-tight mb-2 tracking-tight">Extra 10% Off<br />On ICICI Bank Cards</h3>
              <button className="text-white text-[11px] font-bold flex items-center gap-1 hover:underline">
                Shop Now <span className="font-black">→</span>
              </button>
            </div>
            <div className="w-[40%] flex justify-end z-10 relative">
              <div className="w-24 h-14 bg-gradient-to-br from-[#f97316] to-[#dc2626] rounded-lg shadow-xl flex flex-col justify-center px-2 transform -rotate-6 border border-white/20">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="w-2 h-2 bg-yellow-400 rounded-sm"></div>
                  <span className="text-[8px] font-extrabold italic tracking-wider">ICICI Bank</span>
                </div>
                <div className="flex gap-1 opacity-50">
                  <div className="w-3 h-1 bg-white rounded-full"></div>
                  <div className="w-3 h-1 bg-white rounded-full"></div>
                  <div className="w-3 h-1 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-section px-3 mb-0 md:mb-12 flex flex-col gap-8 md:gap-10">
          {/* Best Sellers (Teal Theme) */}
          {products.filter(p => p.is_bestseller).length > 0 && (
            <div className="relative pt-6 mt-2 -mx-3 md:mx-0">
              {/* Background Graphic Box */}
              <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-[#bbf7d0] to-[#ccfbf1] md:rounded-[24px] overflow-hidden z-0 shadow-inner">
                 
                 {/* Burst Sticker */}
                 <div className="absolute right-[40%] top-6">
                   <div className="relative w-[70px] h-[70px] drop-shadow-md hover:scale-105 transition-transform cursor-pointer">
                     <svg viewBox="0 0 100 100" className="w-full h-full text-[#0f766e]">
                       <path fill="currentColor" d="M50 0 L58 12 L72 8 L76 22 L90 24 L88 38 L100 46 L92 58 L100 70 L86 74 L84 88 L70 86 L60 98 L48 88 L36 98 L26 86 L12 88 L10 74 L-4 70 L4 58 L-4 46 L8 38 L6 24 L20 22 L24 8 L38 12 Z" transform="scale(0.9) translate(5, 5)" />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-black leading-[1.1] -rotate-12 z-10">
                       <span className="text-[11px] font-bold">Up to</span>
                       <span className="text-[20px] tracking-tight">60%</span>
                       <span className="text-[12px] font-bold">Off</span>
                     </div>
                   </div>
                 </div>

                 {/* Floating Dummy images for visual effect */}
                 <div className="absolute right-[10%] top-6 flex gap-1 opacity-90 drop-shadow-lg scale-90">
                    <div className="w-[50px] h-[75px] bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-lg -rotate-12 border-2 border-white flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                       <div className="text-[8px] font-black text-red-600 italic">Lays</div>
                       <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border border-white"></div>
                    </div>
                    <div className="w-[50px] h-[75px] bg-gradient-to-b from-blue-300 to-blue-500 rounded-lg rotate-6 border-2 border-white translate-y-3 flex flex-col items-center justify-center shadow-lg">
                       <div className="text-[8px] font-black text-white italic">CLASSIC</div>
                    </div>
                 </div>
              </div>
              
              <div className="relative z-10">
                <div className="px-5 md:px-8 flex justify-between items-start mb-5">
                  <div className="max-w-[150px]">
                    <h2 className="text-[26px] font-extrabold text-[#0f766e] leading-[1.1] tracking-tight">
                      Bestsellers<br/>are here!
                    </h2>
                  </div>
                  <Link to="/collection/best-sellers" className="w-10 h-10 rounded-full bg-[#1c1917] text-white flex items-center justify-center shrink-0 shadow-lg hover:bg-gray-700 transition-colors z-20 mt-2 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                  </Link>
                </div>
                
                {/* Slider */}
                <div className="flex overflow-x-auto gap-3.5 px-4 md:px-8 hide-scrollbar snap-x pb-8">
                  {products.filter(p => p.is_bestseller).slice(0, 8).map((product, i) => {
                    const price = product.price || 0;
                    const originalPrice = Math.round(price * 1.53); // Roughly 53% off
                    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
                    
                    return (
                      <div key={product.id} className="w-[145px] md:w-[180px] shrink-0 snap-start h-full">
                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="h-[280px] md:h-[310px] bg-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative group flex flex-col hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {/* Discount Tag */}
                          <div className="absolute top-0 left-0 bg-[#16a34a] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-br-lg z-10 flex items-center gap-0.5 shadow-sm">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                             {discount}%
                          </div>
                          
                          <div className="h-[140px] md:h-[160px] bg-[#f8fafc] relative flex items-center justify-center border-b border-gray-100 overflow-hidden">
                             <img src={product.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                             
                          {/* Add Button */}
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product.id}`); }} className="absolute top-[122px] md:top-[142px] right-3 w-9 h-9 bg-white border-2 border-[#db2777] rounded-full flex items-center justify-center shadow-md hover:bg-[#db2777] group/btn transition-colors z-20">
                            <svg className="w-5 h-5 text-[#db2777] group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                          </button>
                          
                          <div className="p-3 pt-6 flex-1 flex flex-col bg-white">
                             <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit mb-1.5 border border-gray-200">1 Unit</div>
                             <h4 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1">{product.name}</h4>
                             <div className="flex items-center gap-1.5 mb-2 mt-auto">
                                <span className="text-[11px] text-gray-400 font-bold line-through">₹{originalPrice}</span>
                                <span className="text-[16px] font-black text-gray-900 tracking-tight">₹{price}</span>
                             </div>
                             {/* XtraSaver */}
                             <div className="bg-[#fef08a] rounded-md px-2 py-1 flex items-center justify-between border border-[#fde047]">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                  <span className="text-[10px] font-black text-gray-900">₹{Math.round(price * 0.9)}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[9px] font-bold text-gray-800">XtraSaver</span>
                                  <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}



          {/* Trending (Orange Theme) */}
          {products.filter(p => p.is_trending).length > 0 && (
            <div className="relative pt-6 mt-6 -mx-3 md:mx-0">
              {/* Background Graphic Box */}
              <div className="absolute top-0 left-0 right-0 h-[280px] bg-[#ece9e1] md:rounded-[24px] overflow-hidden z-0 shadow-inner">
                 <div className="absolute top-0 left-0 bottom-0 w-[65%] bg-gradient-to-br from-[#ffa164] to-[#ff7020] rounded-br-[100px] shadow-[4px_0_15px_rgba(0,0,0,0.05)] z-0">
                    {/* Decorative elements */}
                    <svg className="absolute top-4 left-[30%] w-8 h-8 text-white/40 -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>
                    <div className="absolute bottom-12 right-6 w-4 h-4 bg-yellow-300 rounded-sm rotate-45 opacity-80"></div>
                 </div>
                 
                 {/* Floating Dummy images for visual effect */}
                 <div className="absolute right-[5%] top-4 flex gap-1 drop-shadow-lg scale-90 z-10">
                    <div className="w-[55px] h-[80px] bg-gradient-to-b from-green-400 to-green-600 rounded-lg -rotate-6 border-2 border-white flex flex-col items-center justify-center shadow-lg relative overflow-hidden z-10">
                       <div className="text-[7px] font-black text-yellow-300 text-center leading-tight">BANANA<br/>CHIPS</div>
                       <div className="absolute bottom-1 right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                    </div>
                    <div className="w-[55px] h-[80px] bg-gradient-to-b from-purple-500 to-purple-800 rounded-lg rotate-12 border-2 border-white translate-y-3 flex flex-col items-center justify-center shadow-lg">
                       <div className="text-[8px] font-black text-white text-center leading-tight">CHOCO<br/>BITES</div>
                    </div>
                 </div>
              </div>
              
              <div className="relative z-10">
                <div className="px-5 md:px-8 flex justify-between items-start mb-5">
                  <div className="max-w-[180px]">
                    <h2 className="text-[26px] font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-sm">
                      Trendy brands,<br/>major vibes
                    </h2>
                  </div>
                  <Link to="/collection/trending" className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center shrink-0 shadow-lg hover:bg-gray-100 transition-colors z-20 mt-2 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                  </Link>
                </div>
                
                {/* Slider */}
                <div className="flex overflow-x-auto gap-3.5 px-4 md:px-8 hide-scrollbar snap-x pb-8">
                  {products.filter(p => p.is_trending).slice(0, 8).map((product, i) => {
                    const price = product.price || 0;
                    const originalPrice = Math.round(price * 1.34); // Roughly 34% off
                    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
                    
                    return (
                      <div key={product.id} className="w-[145px] md:w-[180px] shrink-0 snap-start h-full">
                        <motion.div
                          initial={{ opacity: 0, x: 50 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                          className="h-[280px] md:h-[310px] bg-white rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden relative group flex flex-col hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {/* Discount Tag */}
                          <div className="absolute top-0 left-0 bg-[#16a34a] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-br-lg z-10 flex items-center gap-0.5 shadow-sm">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                             {discount}%
                          </div>
                          
                          <div className="h-[140px] md:h-[160px] bg-[#f8fafc] relative flex items-center justify-center border-b border-gray-100 overflow-hidden">
                             <img src={product.image_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                             
                          {/* Add Button */}
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/product/${product.id}`); }} className="absolute top-[122px] md:top-[142px] right-3 w-9 h-9 bg-white border-2 border-[#db2777] rounded-full flex items-center justify-center shadow-md hover:bg-[#db2777] group/btn transition-colors z-20">
                            <svg className="w-5 h-5 text-[#db2777] group-hover/btn:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                          </button>
                          
                          <div className="p-3 pt-6 flex-1 flex flex-col bg-white">
                             <div className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit mb-1.5 border border-gray-200">1 Unit</div>
                             <h4 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1">{product.name}</h4>
                             <div className="flex items-center gap-1.5 mb-2 mt-auto">
                                <span className="text-[11px] text-gray-400 font-bold line-through">₹{originalPrice}</span>
                                <span className="text-[16px] font-black text-gray-900 tracking-tight">₹{price}</span>
                             </div>
                             {/* XtraSaver */}
                             <div className="bg-[#fef08a] rounded-md px-2 py-1 flex items-center justify-between border border-[#fde047]">
                                <div className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-gray-800" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                  <span className="text-[10px] font-black text-gray-900">₹{Math.round(price * 0.9)}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[9px] font-bold text-gray-800">XtraSaver</span>
                                  <svg className="w-3 h-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                                </div>
                             </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Grouped Individual Categories */}
          <GroupedCategories />

          {/* Beautiful Collections */}
          {/* <div className="pt-2">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-[#E57E25]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-serif mb-0">Beautiful Collections</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
             
              <Link to="/collection/wedding" className="relative group overflow-hidden rounded-[2rem] aspect-[3/4] bg-gray-100 block">
                <img src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80" alt="Wedding Collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h4 className="text-white font-serif font-bold text-lg md:text-xl leading-tight">Wedding Collection</h4>
                  <div className="mt-3 inline-flex">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg group-hover:bg-orange-600 transition-all">Shop now <span className="group-hover:translate-x-1 transition-transform text-sm leading-none">→</span></span>
                  </div>
                </div>
              </Link>

             
              <Link to="/collection/festival" className="relative group overflow-hidden rounded-[2rem] aspect-[3/4] bg-gray-100 block">
                <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80" alt="Festival Collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h4 className="text-white font-serif font-bold text-lg md:text-xl leading-tight">Festival Collection</h4>
                  <div className="mt-3 inline-flex">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg group-hover:bg-orange-600 transition-all">Shop now <span className="group-hover:translate-x-1 transition-transform text-sm leading-none">→</span></span>
                  </div>
                </div>
              </Link>

             
              <Link to="/collection/office" className="relative group overflow-hidden rounded-[2rem] aspect-[3/4] bg-gray-100 block">
                <img src="https://images.unsplash.com/photo-1583391733958-d25e07fac04f?w=800&q=80" alt="Office Wear" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h4 className="text-white font-serif font-bold text-lg md:text-xl leading-tight">Office Wear</h4>
                  <div className="mt-3 inline-flex">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg group-hover:bg-orange-600 transition-all">Shop now <span className="group-hover:translate-x-1 transition-transform text-sm leading-none">→</span></span>
                  </div>
                </div>
              </Link>

              
              <Link to="/collection/casual" className="relative group overflow-hidden rounded-[2rem] aspect-[3/4] bg-gray-100 block">
                <img src="https://images.unsplash.com/photo-1606902965551-dce093cda6e7?w=800&q=80" alt="Casual Wear" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h4 className="text-white font-serif font-bold text-lg md:text-xl leading-tight">Casual Wear</h4>
                  <div className="mt-3 inline-flex">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-orange text-white text-[11px] font-black uppercase tracking-wider rounded-full shadow-lg group-hover:bg-orange-600 transition-all">Shop now <span className="group-hover:translate-x-1 transition-transform text-sm leading-none">→</span></span>
                  </div>
                </div>
              </Link>
            </div>
          </div> */}

          {/* Recommended for You */}
          {products.length > 6 && (
            <div className="pt-2">
              <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#E57E25]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-serif mb-0">Recommended for You</h3>
                </div>
                <Link to="/collection/recommended" className="text-[#88313A] hover:text-red-900 text-sm font-medium transition-colors">See all {'>'}</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {products.filter(p => !p.is_trending).slice(0, 6).map((product, i) => (
                  <motion.div
                    key={`rec-${product.id}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 120 }}
                    className="hover:-translate-y-2 transition-transform duration-300 h-full"
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Categories horizontally scrolling products */}
          {categories.map((cat) => {
            const catProducts = products.filter(p => p.category === cat.name);
            if (catProducts.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="flex justify-between items-center px-2 py-4 mb-4 border-b border-gray-100">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#022A21] tracking-tight font-serif">{cat.name}</h3>
                  <Link to={`/category/${cat.id}`} className="text-brand-orange hover:text-orange-700 text-sm md:text-base font-semibold flex items-center gap-2 transition-colors">View All →</Link>
                </div>
                <div className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x">
                  {catProducts.slice(0, 8).map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: false, amount: 0.1 }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      className="w-[160px] md:w-[220px] shrink-0 snap-start hover:-translate-y-2 transition-transform duration-300 h-full"
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Customer Reviews */}
          <div className="mb-2 mt-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-[#022A21] mb-2 font-serif" style={{ fontFamily: 'Georgia, serif' }}>What Our Customers Say</h3>
              <p className="text-gray-500">Trusted by thousands of happy shoppers.</p>
            </div>

            <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-4 px-2">
              {[
                { name: "Priya Sharma", rating: 5, review: "Absolutely in love with the silk saree I bought! The quality is top-notch and the delivery was super fast." },
                { name: "Anjali Verma", rating: 5, review: "The festive collection is amazing. Bought a lehenga for my sister's wedding and everyone complimented it." },
                { name: "Sneha Reddy", rating: 4, review: "Great products and good prices. The cotton kurti fits perfectly and is very comfortable." },
                { name: "Riya Kapoor", rating: 5, review: "ULMGH369 never disappoints. The app is so easy to use and the customer service is excellent." }
              ].map((rev, idx) => (
                <div key={idx} className="w-[280px] shrink-0 snap-start bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-3 text-brand-orange text-lg">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.review}"</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-900 text-sm">{rev.name}</p>
                    <p className="text-xs text-gray-400">Verified Buyer</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Bottom Features Block */}
          <div className="px-3 mb-6 mt-4">
            <div className="bg-gradient-to-br from-white to-gray-50 p-5 md:p-8 rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-green-400/10 to-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 relative z-10">
                {/* Free Delivery */}
                <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-[20px] border border-gray-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <Truck className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-extrabold text-[14px] md:text-[15px] tracking-tight mb-0.5">Free Delivery</h4>
                    <p className="text-gray-500 text-[11px] md:text-[12px] font-medium leading-tight">On orders over ₹500</p>
                  </div>
                </div>

                {/* Easy Replacements */}
                <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-[20px] border border-gray-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    <RefreshCw className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-extrabold text-[14px] md:text-[15px] tracking-tight mb-0.5">Easy Returns</h4>
                    <p className="text-gray-500 text-[11px] md:text-[12px] font-medium leading-tight">30-day replacement</p>
                  </div>
                </div>

                {/* Secure Payments */}
                <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-[20px] border border-gray-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-extrabold text-[14px] md:text-[15px] tracking-tight mb-0.5">100% Secure</h4>
                    <p className="text-gray-500 text-[11px] md:text-[12px] font-medium leading-tight">Safe encrypted checkout</p>
                  </div>
                </div>

                {/* Best Prices */}
                <div className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-[20px] border border-gray-50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col gap-3 md:gap-4">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-[14px] bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                    <Award className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-extrabold text-[14px] md:text-[15px] tracking-tight mb-0.5">Best Prices</h4>
                    <p className="text-gray-500 text-[11px] md:text-[12px] font-medium leading-tight">Guaranteed top deals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
