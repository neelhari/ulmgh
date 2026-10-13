import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2, Star, ShoppingCart } from 'lucide-react';
import { Header } from '../components/Header';
import { useWishlistStore } from '../store/useWishlistStore';
import { useStoreData } from '../store/useStoreData';
import { useCartStore } from '../store/useCartStore';

export function WishlistPage() {
  const navigate = useNavigate();
  const { items, toggleWishlist } = useWishlistStore();
  const { products } = useStoreData();
  const { addToCart } = useCartStore();
  
  React.useEffect(() => {
    if (products.length > 0) {
      const validItems = items.filter(id => products.some(p => String(p.id) === String(id)));
      if (validItems.length !== items.length) {
        useWishlistStore.setState({ items: validItems });
      }
    }
  }, [items, products]);

  const wishlistProducts = items.map(id => products.find(p => String(p.id) === String(id))).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-24 font-sans">
      <Header />
      
      <div className="max-w-[1200px] mx-auto px-4 md:px-0 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-8 md:mt-0">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-72 shrink-0">
           <div className="bg-white p-5 mb-6 rounded-3xl flex items-center gap-4 shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-50 to-transparent rounded-bl-full pointer-events-none opacity-50 blur-xl"></div>
              <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-full overflow-hidden shrink-0 shadow-inner group-hover:shadow-md transition-all">
                <img src="https://ui-avatars.com/api/?name=ULMGH369+User&background=fe6603&color=fff" alt="Profile" />
              </div>
              <div className="relative z-10">
                <div className="text-[12px] text-gray-500">Hello,</div>
                <div className="font-bold text-[16px] text-[#022A21]">ULMGH369 User</div>
              </div>
           </div>
           
           <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="border-b border-gray-100 p-5 hover:bg-gray-50 cursor-pointer font-bold text-gray-600 hover:text-brand-orange transition-all" onClick={() => navigate('/my-orders')}>
               My Orders
             </div>
             <div className="p-5 bg-orange-50 cursor-pointer font-bold text-brand-orange border-l-4 border-brand-orange transition-all flex items-center justify-between">
               <span>My Wishlist</span>
               <span className="bg-brand-orange text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{wishlistProducts.length}</span>
             </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 min-h-[60vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h1 className="text-xl font-bold text-[#022A21] flex items-center gap-2 font-serif">
              <span className="w-1.5 h-6 bg-brand-orange rounded-full inline-block shadow-sm"></span>
              My Wishlist <span className="font-medium text-gray-500 text-[14px] ml-2">({wishlistProducts.length})</span>
            </h1>
          </div>

          {wishlistProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 md:py-24 text-center px-4">
               <div className="mb-4 md:mb-6 w-28 h-28 md:w-32 md:h-32 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-inner">
                 <Heart className="w-16 h-16 text-brand-orange/40" />
               </div>
               <h2 className="text-xl font-bold text-[#022A21] mb-2 font-serif">Empty Wishlist</h2>
               <p className="text-gray-500 text-[15px] mb-8 max-w-sm">
                 You have no items in your wishlist. Start adding your favorite pieces!
               </p>
               <Link to="/category/all" className="bg-gradient-to-r from-brand-orange to-yellow-500 text-white px-8 py-3.5 rounded-2xl font-bold text-[15px] shadow-[0_4px_20px_rgba(254,102,3,0.3)] hover:shadow-[0_8px_30px_rgba(254,102,3,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                 Explore Products
               </Link>
             </div>
          ) : (
            <div className="flex flex-col">
              {wishlistProducts.map((product, idx) => {
                
                let parsedSizes = [];
                try {
                  if (typeof product.sizes === 'string') {
                    parsedSizes = JSON.parse(product.sizes);
                  } else if (Array.isArray(product.sizes)) {
                    parsedSizes = product.sizes;
                  }
                } catch (e) {}

                let defaultSize = { size: 'Standard', price: product.price || 0 };
                let firstImg = product.image_url;
                let color = product.color;

                if (parsedSizes && parsedSizes.length > 0) {
                  if (parsedSizes[0].sizes && Array.isArray(parsedSizes[0].sizes) && parsedSizes[0].sizes.length > 0) {
                    defaultSize = parsedSizes[0].sizes[0];
                    color = parsedSizes[0].color;
                    if (parsedSizes[0].images && parsedSizes[0].images.length > 0) {
                      firstImg = parsedSizes[0].images[0];
                    }
                  } else if (parsedSizes[0].size) {
                    defaultSize = parsedSizes[0];
                  }
                }

                if (!firstImg && product.images && product.images.length > 0) {
                  firstImg = product.images[0];
                }
                
                const displayPrice = defaultSize.price;
                const originalPrice = Math.round(displayPrice * 1.4);
                const discountPercent = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);

                return (
                  <div key={product.id} className={`flex gap-4 md:gap-6 p-4 md:p-6 ${idx !== wishlistProducts.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer bg-white rounded-3xl m-2 md:m-3 border border-transparent hover:border-gray-100`} onClick={() => navigate(`/product/${product.id}`)}>
                    
                    <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 relative bg-gray-50 rounded-2xl p-2 border border-gray-200 shadow-inner overflow-hidden">
                      <img src={firstImg} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="flex flex-col flex-grow justify-center">
                      <div className="flex justify-between items-start gap-4">
                        <div className="pr-10 md:pr-12">
                          <h3 className="text-[15px] md:text-lg font-bold text-gray-900 group-hover:text-brand-orange transition-colors line-clamp-2 leading-snug mb-1.5 font-serif">{product.name}</h3>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1 bg-orange-50 border border-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                              4.5 <Star className="w-2.5 h-2.5 fill-current" />
                            </div>
                            <span className="text-gray-500 font-medium text-xs">(1,245 reviews)</span>
                          </div>

                          <div className="flex items-baseline gap-2 md:gap-3 mb-2 flex-wrap">
                            <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">₹{displayPrice}</span>
                            <span className="text-gray-400 line-through text-xs md:text-[14px] font-medium">₹{originalPrice}</span>
                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide">{discountPercent}% off</span>
                          </div>
                        </div>

                        {/* Trash Button */}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className="absolute right-4 top-4 md:right-6 md:top-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all p-2.5 z-10"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center gap-2 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                         <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product, defaultSize);
                              navigate('/cart');
                            }}
                            className="w-full md:w-auto bg-gradient-to-r from-brand-orange to-yellow-500 text-white px-6 py-2.5 text-[14px] font-bold rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(254,102,3,0.25)] hover:shadow-[0_8px_25px_rgba(254,102,3,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                         >
                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                         </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
