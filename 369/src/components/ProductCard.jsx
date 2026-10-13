import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Share2 } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useStoreData } from '../store/useStoreData';

// Category-based image fallback — high quality Unsplash images per category keyword
const CATEGORY_IMAGES = {
  saree: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80',
  silk: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80',
  kurta: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&q=80',
  kurti: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&q=80',
  lehenga: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80',
  dupatta: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80',
  dress: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&q=80',
  shirt: 'https://images.unsplash.com/photo-1602810316693-3667c854239a?w=500&q=80',
  tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
  pant: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
  footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  shoes: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  sandal: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  jewelry: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80',
  jewellery: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80',
  necklace: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80',
  ring: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
  bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
  handbag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
  mobile: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80',
  phone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80',
  laptop: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80',
  headphone: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80',
  watch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80',
  sofa: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=80',
  appliance: 'https://images.unsplash.com/photo-1584269600519-112d00e42a1f?w=500&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
  beauty: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80',
  cosmetic: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80',
  clothing: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80',
  default: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80',
};

export function getCategoryFallback(product) {
  const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (key !== 'default' && text.includes(key)) return url;
  }
  return CATEGORY_IMAGES.default;
}

// Safely extract first valid image URL from any field format
export function getFirstImage(product, parsedSizes) {
  // 1. Try hierarchical variant images
  if (parsedSizes?.length > 0 && parsedSizes[0].images?.length > 0) {
    const img = parsedSizes[0].images[0];
    if (img && typeof img === 'string' && img.startsWith('http')) return img;
  }

  // 2. Try product.images (array or JSON string)
  if (product.images) {
    let imgs = product.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch (e) { }
    }
    if (Array.isArray(imgs) && imgs.length > 0) {
      const img = imgs[0];
      if (img && typeof img === 'string' && img.startsWith('http')) return img;
    }
  }

  // 3. Try product.image_url (may be JSON string)
  if (product.image_url) {
    let url = product.image_url;
    if (typeof url === 'string' && url.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(url);
        if (Array.isArray(arr) && arr[0] && arr[0].startsWith('http')) return arr[0];
      } catch (e) { }
    }
    if (typeof url === 'string' && url.startsWith('http')) return url;
  }

  // 4. Smart category/name fallback
  return getCategoryFallback(product);
}

export function getProductPrice(product, parsedSizes) {
  let defaultSize = { size: 'Standard', price: product.price || 0 };
  if (parsedSizes?.length > 0) {
    if (Array.isArray(parsedSizes[0].sizes) && parsedSizes[0].sizes.length > 0) {
      defaultSize = parsedSizes[0].sizes[0];
    } else if (parsedSizes[0].size) {
      defaultSize = parsedSizes[0];
    }
  }
  return defaultSize.price || product.price || 0;
}


export function ProductCard({ product, layout = 'grid' }) {
  const navigate = useNavigate();
  const { toggleWishlist, items: wishlistItems } = useWishlistStore();
  const { addToCart } = useCartStore();
  const [imgErr, setImgErr] = useState(false);

  const isWishlisted = wishlistItems.includes(product.id);

  let parsedSizes = [];
  try {
    if (typeof product.sizes === 'string') parsedSizes = JSON.parse(product.sizes);
    else if (Array.isArray(product.sizes)) parsedSizes = product.sizes;
  } catch (e) { }

  let defaultSize = { size: 'Standard', price: product.price || 0 };

  if (parsedSizes?.length > 0) {
    if (Array.isArray(parsedSizes[0].sizes) && parsedSizes[0].sizes.length > 0) {
      defaultSize = parsedSizes[0].sizes[0];
    } else if (parsedSizes[0].size) {
      defaultSize = parsedSizes[0];
    }
  }

  const firstImg = getFirstImage(product, parsedSizes);
  const displayPrice = getProductPrice(product, parsedSizes);
  const { offers } = useStoreData();

  // Find best matching auto-applied offer for this product
  const matchingOffer = offers
    .filter(o => o.offer_type === 'offer' && o.is_active !== false)
    .find(o => {
      if (o.scope === 'all') return true;
      if (o.scope === 'category') {
        const cats = typeof o.category_ids === 'string' ? JSON.parse(o.category_ids) : (o.category_ids || []);
        return cats.includes(product?.category);
      }
      if (o.scope === 'product') {
        const pids = typeof o.product_ids === 'string' ? JSON.parse(o.product_ids) : (o.product_ids || []);
        return pids.includes(product?.id?.toString()) || pids.includes(product?.id);
      }
      return false;
    });

  const offerDiscount = matchingOffer ? parseFloat(matchingOffer.discount_percent) : 0;
  const effectivePrice = offerDiscount > 0 ? Math.round(displayPrice * (1 - offerDiscount / 100)) : displayPrice;
  const originalPrice = Number(product?.mrp) || Math.round(displayPrice * 1.4);
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0;
  // firstImg always returns a valid URL (category fallback if needed)
  // onError swaps to category fallback in case of network issues
  const fallbackImg = getCategoryFallback(product);

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleShare = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const url = window.location.origin + `/product/${product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, text: `Check out ${product.name} on ULMGH369!`, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart(product, defaultSize);
  };

  const handleBuyNow = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart(product, defaultSize);
    navigate('/checkout');
  };

  const handleCardClick = () => navigate(`/product/${product.id}`);

  /* ── LIST LAYOUT ── */
  if (layout === 'list') {
    return (
      <Link to={`/product/${product.id}`}
        className="flex gap-4 p-4 rounded-2xl mb-3 relative hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 border border-gray-100 group bg-white">
        <div className="w-24 h-24 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 relative">
          <img src={imgErr ? fallbackImg : firstImg} alt={product.name}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="flex flex-col justify-center flex-grow pr-8">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-[#022A21] transition-colors">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
            <span className="text-[10px] font-medium text-gray-600">4.5</span>
            <span className="text-[10px] text-gray-400 ml-1">(1,256)</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">₹{effectivePrice?.toLocaleString('en-IN')}</span>
              {originalPrice > effectivePrice && <span className="text-xs text-gray-400 line-through">₹{originalPrice?.toLocaleString('en-IN')}</span>}
            </div>
            <button onClick={handleAddToCart}
              className="bg-brand-orange hover:bg-orange-600 text-white transition-colors p-2.5 rounded-xl relative z-20 active:scale-95 shadow-sm hover:shadow-md">
              <ShoppingCart className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button onClick={handleWishlist} className="hover:scale-110 transition-transform">
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-900'}`} strokeWidth={isWishlisted ? 0 : 1.5} />
          </button>
          <button onClick={handleShare} className="hover:scale-110 transition-transform mt-1">
            <Share2 className="w-4 h-4 text-gray-400 hover:text-gray-900" strokeWidth={1.5} />
          </button>
        </div>
      </Link>
    );
  }

  /* ── GRID LAYOUT ── */
  return (
    <div onClick={handleCardClick}
      className="group flex flex-col rounded-[1.5rem] md:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-1 h-full relative bg-white border border-gray-100 pb-3">

      {/* Discount badge */}
      {discountPercent > 0 && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-full z-20 shadow-md tracking-wider">
          {discountPercent}% OFF
        </div>
      )}

      {/* Wishlist */}
      <div className="absolute top-3 right-3 z-20">
        <button onClick={handleWishlist}
          className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
          <Heart className={`w-4 h-4 md:w-4.5 md:h-4.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-900'}`} strokeWidth={isWishlisted ? 0 : 2} />
        </button>
      </div>

      {/* Image */}
      <div className="relative bg-gray-50 w-full aspect-[4/5] overflow-hidden rounded-b-2xl md:rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <img
          src={imgErr ? fallbackImg : firstImg}
          alt={product.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-grow px-3 pt-4 md:px-5">
        <p className="text-gray-400 text-[10px] md:text-[11px] font-semibold tracking-widest uppercase mb-1.5 truncate">
          {product.short_description || product.brand || product.category || 'ULMGH369'}
        </p>

        <h3 className="text-[15px] md:text-[17px] font-bold text-gray-900 truncate mb-3 group-hover:text-brand-orange transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end gap-2.5 mb-4">
          <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">₹{effectivePrice?.toLocaleString('en-IN')}</span>
          {originalPrice > effectivePrice && <span className="text-xs md:text-sm text-gray-400 line-through mb-1 font-medium">₹{originalPrice?.toLocaleString('en-IN')}</span>}
        </div>

        <div className="mt-auto pt-2 pb-1">
          <div className="flex gap-2">
            <button 
              onClick={handleAddToCart} 
              className="flex-1 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:text-brand-orange hover:border-brand-orange/30 font-bold py-2 rounded-xl text-xs md:text-sm transition-all shadow-sm"
            >
              Add to Cart
            </button>
            <button 
              onClick={handleBuyNow} 
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-xs md:text-sm transition-all shadow-sm"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
