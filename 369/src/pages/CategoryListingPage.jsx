import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, Check } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';
import imgAarti from '../assets/story_aarti.png';

export function CategoryListingPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const { products, categories, loading } = useStoreData();
  
  const modelQuery = searchParams.get('model');
  const searchQuery = searchParams.get('search');
  const priceQuery = searchParams.get('price');
  
  useEffect(() => {
    if (showMobileFilters) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showMobileFilters]);
  
  let categoryName = modelQuery ? `${modelQuery} Products` : 'All Products';
  if (categoryId !== 'all') {
    const cat = categories.find(c => c.id.toString() === categoryId);
    if (cat) categoryName = cat.name;
  }
  if (searchQuery) categoryName = `Search: "${searchQuery}"`;

  const getProductPrice = (p) => {
    let price = p.price || 0;
    try {
      let parsedSizes = [];
      if (typeof p.sizes === 'string') parsedSizes = JSON.parse(p.sizes);
      else if (Array.isArray(p.sizes)) parsedSizes = p.sizes;
      if (parsedSizes?.length > 0) {
        if (Array.isArray(parsedSizes[0].sizes) && parsedSizes[0].sizes.length > 0) {
          price = parsedSizes[0].sizes[0].price || price;
        } else if (parsedSizes[0].price) {
          price = parsedSizes[0].price || price;
        }
      }
    } catch (e) {}
    return Number(price);
  };

  let filteredProducts = products.filter(p => {
    let matchCat = true;
    if (categoryId !== 'all' && !searchQuery) {
      const cat = categories.find(c => c.id.toString() === categoryId);
      matchCat = cat ? p.category === cat.name : false;
    }
    let matchModel = true;
    if (modelQuery) matchModel = p.model === modelQuery;
    let matchSearch = true;
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase();
      matchSearch = p.name.toLowerCase().includes(lowerSearch) || (p.description && p.description.toLowerCase().includes(lowerSearch));
    }
    let matchPrice = true;
    if (priceQuery) {
      const pPrice = getProductPrice(p);
      if (priceQuery === 'under_1000') matchPrice = pPrice < 1000;
      else if (priceQuery === '1000_2000') matchPrice = pPrice >= 1000 && pPrice <= 2000;
      else if (priceQuery === '2000_5000') matchPrice = pPrice > 2000 && pPrice <= 5000;
      else if (priceQuery === 'above_5000') matchPrice = pPrice > 5000;
    }
    return matchCat && matchModel && matchSearch && matchPrice;
  });

  if (sortBy === 'price_asc') {
    filteredProducts.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sortBy === 'price_desc') {
    filteredProducts.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  }

  const handleCategoryChange = (newCatId) => {
    setSearchParams({});
    navigate(`/category/${newCatId}`);
    setShowMobileFilters(false);
  };

  const handlePriceChange = (priceKey) => {
    const newParams = Object.fromEntries(searchParams.entries());
    if (priceKey && newParams.price !== priceKey) newParams.price = priceKey;
    else delete newParams.price;
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9]">
        <div className="w-8 h-8 border-4 border-[#022A21]/20 border-t-[#022A21] rounded-full animate-spin" />
      </div>
    );
  }

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Shop by Price</h3>
        <div className="space-y-3">
          {[
            { id: 'under_1000', label: 'Under ₹1,000' },
            { id: '1000_2000', label: '₹1,000 - ₹2,000' },
            { id: '2000_5000', label: '₹2,000 - ₹5,000' },
            { id: 'above_5000', label: 'Above ₹5,000' },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${priceQuery === opt.id ? 'border-[#022A21] bg-[#022A21] shadow-sm' : 'border-gray-300 group-hover:border-[#022A21] bg-white'}`}>
                {priceQuery === opt.id && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className={`text-sm ${priceQuery === opt.id ? 'text-[#022A21] font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{opt.label}</span>
              <input type="radio" name="price_radio" className="hidden" checked={priceQuery === opt.id} onChange={() => handlePriceChange(opt.id)} />
            </label>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Sort By</h3>
        <div className="space-y-3">
          {[
            { id: 'featured', label: 'Featured' },
            { id: 'price_asc', label: 'Price: Low to High' },
            { id: 'price_desc', label: 'Price: High to Low' },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${sortBy === opt.id ? 'border-[#022A21] bg-[#022A21] shadow-sm' : 'border-gray-300 group-hover:border-[#022A21] bg-white'}`}>
                {sortBy === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className={`text-sm ${sortBy === opt.id ? 'text-[#022A21] font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{opt.label}</span>
              <input type="radio" name="sort_radio" className="hidden" checked={sortBy === opt.id} onChange={() => setSortBy(opt.id)} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfa] min-h-screen pb-24 font-sans">
      <Header />
      
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-6">
        
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-[22px] md:text-[26px] font-extrabold text-gray-900 tracking-tight leading-tight">Explore Categories</h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
            <div 
              onClick={() => handleCategoryChange('all')}
              className={`h-full flex flex-col items-center justify-start gap-2.5 cursor-pointer group p-3 rounded-[20px] transition-all duration-300 hover:-translate-y-1 ${categoryId === 'all' ? 'bg-gradient-to-b from-[#e5f5f1] to-white shadow-md border border-[#022A21]/20' : 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-[#022A21]/20'}`}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden mb-1 transition-all duration-300 ${categoryId === 'all' ? 'bg-[#022A21] shadow-lg shadow-[#022A21]/20 ring-2 ring-offset-2 ring-[#022A21]/20' : 'bg-gray-50 border border-gray-100 group-hover:border-gray-200 flex-shrink-0'}`}>
                <span className={`text-xs md:text-sm font-extrabold text-center leading-tight ${categoryId === 'all' ? 'text-white' : 'text-gray-600'}`}>All<br/>Items</span>
              </div>
              <span className={`text-[11px] sm:text-xs md:text-[13px] font-bold text-center leading-tight line-clamp-2 w-full ${categoryId === 'all' ? 'text-[#022A21]' : 'text-gray-700'}`} title="All Products">All Products</span>
            </div>
            
            {categories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id.toString())}
                className={`h-full flex flex-col items-center justify-start gap-2.5 cursor-pointer group p-3 rounded-[20px] transition-all duration-300 hover:-translate-y-1 ${categoryId === cat.id.toString() ? 'bg-gradient-to-b from-[#e5f5f1] to-white shadow-md border border-[#022A21]/20' : 'bg-white shadow-sm border border-gray-100 hover:shadow-md hover:border-[#022A21]/20'}`}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden mb-1 group-hover:scale-105 transition-all duration-300 flex-shrink-0 ${categoryId === cat.id.toString() ? 'ring-2 ring-offset-2 ring-[#022A21]/40 shadow-lg' : 'bg-gray-50 border border-gray-100'}`}>
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&q=80'; }} className="w-full h-full object-cover" />
                  ) : (
                    <img src={imgAarti} alt="Cat" className="w-full h-full object-cover opacity-50 mix-blend-multiply" />
                  )}
                </div>
                <span className={`text-[11px] sm:text-xs md:text-[13px] font-bold text-center leading-tight line-clamp-2 w-full px-1 ${categoryId === cat.id.toString() ? 'text-[#022A21]' : 'text-gray-700'}`} title={cat.name}>
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-gray-100/50 gap-4 sticky top-[70px] z-30 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 font-serif leading-tight hidden md:block">{categoryName}</h1>
            <span className="text-xs font-extrabold text-[#022A21] bg-gradient-to-r from-[#e5f5f1] to-white border border-[#022A21]/20 px-3 py-1.5 rounded-full shadow-sm">{filteredProducts.length} Items</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 text-sm font-bold text-gray-800 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm px-5 py-2.5 rounded-full transition-all duration-300 w-full sm:w-auto justify-center active:scale-95"
            >
              <Filter className="w-4 h-4 text-[#022A21]" />
              Sort & Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-24 text-center flex flex-col items-center bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#022A21] mb-2 font-serif">No products found</h3>
              <p className="text-gray-500 max-w-md">Try adjusting your filters or selecting a different category.</p>
              <button onClick={() => { handleCategoryChange('all'); setSortBy('featured'); }} className="mt-8 bg-[#022A21] text-white font-bold px-8 py-3 rounded-xl shadow-md hover:bg-black transition-all">
                View All Items
              </button>
            </div>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowMobileFilters(false)} />
          <div className="relative w-[85%] max-w-sm bg-white h-full flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transition-transform duration-300 border-l border-gray-100 rounded-l-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100 bg-white/90 backdrop-blur-md">
              <h2 className="text-lg md:text-xl font-extrabold text-[#022A21] flex items-center gap-2 font-serif">
                <Filter className="w-5 h-5" /> Sort & Filter
              </h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar bg-gray-50/30">
              <FilterContent />
            </div>
            
            <div className="p-5 md:p-6 border-t border-gray-100 bg-white flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <button 
                onClick={() => { handleCategoryChange('all'); setSortBy('featured'); setShowMobileFilters(false); }}
                className="flex-1 px-4 py-3.5 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-2xl transition-all bg-white text-sm active:scale-95"
              >
                Clear
              </button>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="flex-[2] px-4 py-3.5 bg-[#022A21] text-white font-bold rounded-2xl shadow-[0_8px_20px_rgba(2,42,33,0.25)] hover:bg-black text-sm transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
