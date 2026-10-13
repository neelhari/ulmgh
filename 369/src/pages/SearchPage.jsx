import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowLeft, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';
import { motion } from 'framer-motion';

const searchSuggestions = {
  types: ['Cotton', 'Silk', 'Banarasi', 'Party Wear', 'Office Wear', 'Wedding', 'Festival'],
  prices: ['Under ₹1,000', 'Under ₹1,500', 'Under ₹2,000', 'Under ₹2,500', 'Under ₹3,000'],
  regions: ['Kanchipuram', 'Hyderabad', 'Varanasi', 'Jaipur', 'Lucknow', 'Thrissur', 'Mumbai', 'New Delhi', 'Bengaluru']
};

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { products, categories, loading } = useStoreData();
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const filteredProducts = products.filter(product => {
    if (!query) return false;
    const searchLower = query.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  });

  const handleTagClick = (tag) => {
    setQuery(tag);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans pb-24">
      {/* Search Header */}
      <div className="bg-[#FFFDF9] sticky top-0 z-40 px-4 py-4 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => navigate('/')} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative group">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-orange transition-colors" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shop name, products, categories"
            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-10 text-[15px] text-gray-900 focus:outline-none focus:ring-1 focus:border-brand-orange focus:shadow-sm transition-all placeholder-gray-400"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button className="w-10 h-10 bg-[#8E112E] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#720e25] transition-colors shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Results Area */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-5">
        {!query ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
            {/* Breadcrumb Context */}
            <div className="flex items-center text-sm font-medium">
              <span className="text-[#8E112E] cursor-pointer hover:underline">Categories</span>
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              <span className="text-gray-800 flex items-center gap-1">
                <span className="text-base">🥻</span> Sarees
              </span>
            </div>

            {/* TYPES */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider mb-3">TYPES</p>
              <div className="flex flex-wrap gap-2.5">
                {searchSuggestions.types.map(type => (
                  <button key={type} onClick={() => handleTagClick(type)}
                    className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 hover:border-[#8E112E] hover:text-[#8E112E] transition-colors shadow-sm">
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* PRICE */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider mb-3">PRICE</p>
              <div className="flex flex-wrap gap-2.5">
                {searchSuggestions.prices.map(price => (
                  <button key={price} onClick={() => handleTagClick(price.split(' ')[1])}
                    className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 hover:border-[#8E112E] hover:text-[#8E112E] transition-colors shadow-sm">
                    {price}
                  </button>
                ))}
              </div>
            </div>

            {/* REGION */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider mb-3">REGION · SAREES</p>
              <div className="flex flex-wrap gap-2.5">
                {searchSuggestions.regions.map(region => (
                  <button key={region} onClick={() => handleTagClick(region)}
                    className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 hover:border-[#8E112E] hover:text-[#8E112E] transition-colors shadow-sm">
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* ADMIN ADDED CATEGORIES / COLLECTIONS */}
            {categories.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 tracking-wider mb-3">COLLECTIONS & CATEGORIES</p>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => navigate(`/category/${cat.id}`)}
                      className="relative h-32 rounded-2xl overflow-hidden group cursor-pointer shadow-sm"
                    >
                      <img 
                        src={cat.image_url || 'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?auto=format&fit=crop&q=80'} 
                        alt={cat.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1583391733958-d25e07fac04f?auto=format&fit=crop&q=80'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      <span className="absolute bottom-3 left-3 text-white font-bold text-sm tracking-wide z-10">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </motion.div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#8E112E] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div>
            <h3 className="text-gray-900 font-bold mb-4">
              Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{query}"
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="hover:-translate-y-1 transition-transform">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 text-sm max-w-xs">We couldn't find anything matching "{query}". Try adjusting your spelling or try different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
