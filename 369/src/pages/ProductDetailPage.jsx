import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Share2, Heart, ShoppingCart, Star, MapPin, Zap, X, ChevronLeft, Truck, RefreshCcw, ShieldCheck, Package } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useStoreData } from '../store/useStoreData';
import { motion, AnimatePresence } from 'framer-motion';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useStoreData();
  const product = products.find(p => p.id.toString() === id);
  const { addToCart } = useCartStore();
  const { toggleWishlist, items: wishlistItems } = useWishlistStore();

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeOffers, setActiveOffers] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetch(`${BACKEND_URL}/offers/active`)
      .then(r => r.json())
      .then(d => setActiveOffers(d.offers || []))
      .catch(() => {});
  }, []);

  const isWishlisted = product ? wishlistItems.includes(product.id) : false;
  const relatedProducts = product ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 10) : [];

  let parsedSizes = [];
  try {
    if (typeof product?.sizes === 'string') parsedSizes = JSON.parse(product.sizes);
    else if (Array.isArray(product?.sizes)) parsedSizes = product.sizes;
  } catch (e) { }

  const isHierarchical = parsedSizes.length > 0 && Array.isArray(parsedSizes[0].sizes);
  const currentVariant = isHierarchical ? parsedSizes[selectedVariantIdx] : null;
  const currentSizesArray = isHierarchical ? currentVariant.sizes : parsedSizes;
  const selectedSizeObj = currentSizesArray && currentSizesArray.length > 0
    ? currentSizesArray[selectedSizeIdx]
    : { size: 'Standard', price: product?.price || 0 };

  const productImages = (currentVariant?.images?.length > 0)
    ? currentVariant.images
    : (product ? (product.images?.length > 0 ? product.images : (product.image_url ? [product.image_url] : [])) : []);

  const [mainImg, setMainImg] = useState(null);

  useEffect(() => {
    if (productImages.length > 0 && !productImages.includes(mainImg)) {
      setMainImg(productImages[0]);
      setImgError(false);
    }
  }, [productImages, selectedVariantIdx]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-lg font-bold text-gray-700">Product not found</p>
        <button onClick={() => navigate('/')} className="bg-[#022A21] text-white px-6 py-3 rounded-2xl font-semibold hover:bg-[#054335] transition-all shadow-md">
          Go Home
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    const variantWithColor = { ...selectedSizeObj, color: parsedSizes[selectedVariantIdx]?.color || '' };
    addToCart(product, variantWithColor, quantity);
  };

  const handleBuyNow = () => {
    const variantWithColor = { ...selectedSizeObj, color: parsedSizes[selectedVariantIdx]?.color || '' };
    addToCart(product, variantWithColor, quantity);
    navigate('/cart');
  };

  const handleShare = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, text: `Check out ${product.name} on ULMGH369!`, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const originalPrice = Number(product?.mrp) || (selectedSizeObj ? Math.round(selectedSizeObj.price * 1.4) : 0);

  // Find best matching auto-applied offer for this product
  const matchingOffer = activeOffers
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
  const effectivePrice = offerDiscount > 0
    ? Math.round(selectedSizeObj.price * (1 - offerDiscount / 100))
    : selectedSizeObj.price;
  const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0;

  let customAttrs = {};
  try {
    customAttrs = typeof product.custom_attributes === 'string' ? JSON.parse(product.custom_attributes) : product.custom_attributes || {};
  } catch (e) { }

  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  // Prepare all available specs
  const allSpecs = {
    ...(product.brand && { Brand: product.brand }),
    ...(product.sku && { SKU: product.sku }),
    ...(product.gender && product.gender !== 'Any' && { Gender: product.gender }),
    ...(product.category && { Category: product.category }),
    ...(currentVariant?.color && { Color: currentVariant.color }),
    ...customAttrs
  };

  const hiddenKeys = ['seo_title', 'seo_keywords', 'meta_description', 'search_tags', 'delivery_cod'];

  const specGroups = [
    { title: "Basic Information", keys: ['Brand', 'SKU', 'Gender', 'Category', 'Color', 'product_code', 'condition', 'product_type'] },
    { title: "Physical Attributes", keys: ['weight', 'shipping_weight', 'length', 'width', 'height', 'material'] },
    { title: "Policies & Delivery", keys: ['warranty_period', 'return_policy', 'replacement_policy', 'shipping_charge', 'free_shipping', 'cod_available', 'available_cities', 'pickup_location', 'warehouse'] },
    { title: "Manufacturing Details", keys: ['manufacturer_name', 'country_of_origin', 'hsn_code', 'gst_number'] },
    { title: "Documents & Resources", keys: ['user_manual_url', 'brochure_url', 'certificate_urls'] },
    { title: "Vendor Contact", keys: ['contact_number', 'whatsapp_number', 'vendor_email'] }
  ];

  const groupedSpecs = specGroups.map(group => {
    const items = [];
    group.keys.forEach(k => {
      if (allSpecs[k]) {
        items.push({ k, v: allSpecs[k] });
        delete allSpecs[k];
      }
    });
    return { ...group, items };
  }).filter(g => g.items.length > 0);

  const remainingItems = Object.entries(allSpecs)
    .filter(([k, v]) => !hiddenKeys.includes(k) && v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => ({ k, v }));

  if (remainingItems.length > 0) {
    groupedSpecs.push({ title: "Other Details", items: remainingItems });
  }
  const PLACEHOLDER = 'https://placehold.co/400x400/f5f5f5/999?text=No+Image';

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-40 md:pb-12">
      <div className="hidden md:block">
        <Header />
      </div>

      {/* ── MOBILE: Full-width image section ── */}
      <div className="md:hidden">
        {/* Image container */}
        <div className="relative w-full aspect-[3/4] bg-gray-100">
          {/* Back + actions */}
          <div className="absolute top-safe pt-4 left-0 right-0 z-20 flex items-center justify-between px-4">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <div className="flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#88313A] text-[#88313A]' : 'text-gray-800'}`} strokeWidth={isWishlisted ? 0 : 1.5} />
              </button>
              <button onClick={handleShare}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
                <Share2 className="w-5 h-5 text-gray-800" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Main image */}
          <div className="w-full h-full" onClick={() => setIsImageModalOpen(true)}>
            <img
              src={imgError ? PLACEHOLDER : (mainImg || productImages[0] || PLACEHOLDER)}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Mobile thumbnail row */}
        {productImages.length > 1 && (
          <div className="flex gap-3 px-4 py-4 bg-white border-b border-gray-100 overflow-x-auto hide-scrollbar">
            {productImages.map((img, i) => (
              <button key={i} onClick={() => { setMainImg(img); setImgError(false); }}
                className={`w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden ring-2 transition-all ${mainImg === img ? 'ring-brand-orange ring-offset-2' : 'ring-transparent hover:ring-gray-200'}`}>
                <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1400px] mx-auto md:px-8 lg:px-12 md:pt-20 md:pb-16 md:grid md:grid-cols-[45%_55%] md:gap-8 lg:gap-12">

        {/* ── DESKTOP LEFT: Images ── */}
        <div className="hidden md:block">
          <div className="sticky top-[100px] flex gap-3">
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex flex-col gap-2 w-[72px]">
                {productImages.map((img, i) => (
                  <button key={i} onClick={() => setMainImg(img)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 flex-shrink-0 transition-all overflow-hidden ${mainImg === img ? 'border-brand-orange shadow-sm bg-orange-50' : 'border-gray-200 bg-white hover:border-brand-orange'}`}>
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover rounded-lg"
                      onError={(e) => { e.target.src = PLACEHOLDER; }} />
                  </button>
                ))}
              </div>
            )}
            {/* Main */}
            <div className="flex-1 relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md aspect-square flex items-center justify-center cursor-zoom-in group"
              onClick={() => setIsImageModalOpen(true)}>
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:scale-110 hover:border-red-400 transition-all shadow-sm">
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={isWishlisted ? 0 : 1.5} />
                </button>
                <button onClick={handleShare}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:scale-110 hover:border-brand-orange transition-all shadow-sm">
                  <Share2 className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                </button>
              </div>
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow z-10">
                  {discountPercent}% OFF
                </div>
              )}
              <img src={mainImg || productImages[0] || PLACEHOLDER} alt={product.name}
                className="w-5/6 h-5/6 object-contain group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = PLACEHOLDER; }} />
            </div>
          </div>

          {/* Desktop action buttons */}
          <div className="flex gap-3 mt-5">
            <button onClick={() => toggleWishlist(product.id)}
              className="w-16 shrink-0 border-2 border-gray-200 rounded-2xl flex items-center justify-center hover:border-red-200 hover:bg-red-50 transition-all active:scale-95"
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}>
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} strokeWidth={isWishlisted ? 0 : 1.5} />
            </button>
            <button onClick={handleAddToCart}
              className="flex-[1] border-2 border-brand-orange text-brand-orange font-bold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 hover:bg-orange-50 transition-all shadow-sm active:scale-95">
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
            <button onClick={handleBuyNow}
              className="flex-[1.4] bg-gradient-to-r from-brand-orange to-yellow-400 text-white font-bold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 shadow-md hover:shadow-[0_8px_25px_rgba(254,102,3,0.4)] hover:-translate-y-0.5 transition-all active:scale-95">
              <Zap className="w-5 h-5 fill-white" /> Buy Now
            </button>
          </div>
        </div>

        {/* ── RIGHT / MOBILE BOTTOM: Product Info ── */}
        <div className="bg-white md:rounded-3xl md:shadow-md md:border md:border-gray-100 px-4 py-5 md:p-8 mt-0 md:mt-0">

          {/* Category tag */}
          {product.category && (
            <div className="text-gray-500 text-[11px] font-semibold mb-1 uppercase tracking-wide">
              {product.category} · KANCHIPURAM, TN
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {product.name}
          </h1>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-gray-900 font-bold text-[13px]">4.7</span>
            <span className="text-gray-500 text-[13px]">(214 reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">₹{effectivePrice.toLocaleString()}</span>
            {originalPrice > effectivePrice && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base text-gray-400 line-through font-medium">₹{originalPrice.toLocaleString()}</span>
                <span className="text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-500 px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                  {discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Offer badge */}
          {matchingOffer && (
            <div className="flex items-center gap-2 mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <span className="text-green-600 text-lg">🏷️</span>
              <div>
                <p className="text-green-700 font-bold text-sm">{matchingOffer.name || `${offerDiscount}% Off Applied`}</p>
                <p className="text-green-600 text-xs">You save ₹{(selectedSizeObj.price - effectivePrice).toLocaleString()} with this offer</p>
              </div>
            </div>
          )}


          {/* Colors */}
          {isHierarchical && parsedSizes.length > 0 && (
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Color</span>
                {currentVariant?.color && <span className="text-sm text-gray-500">{currentVariant.color}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {parsedSizes.map((variant, idx) => (
                  <button key={idx}
                    onClick={() => { setSelectedVariantIdx(idx); setSelectedSizeIdx(0); }}
                    className={`px-5 py-2.5 rounded-full border-2 transition-all text-sm font-bold tracking-wide ${selectedVariantIdx === idx
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                      : 'border-gray-200 text-gray-700 hover:border-gray-900'}`}>
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {currentSizesArray && currentSizesArray.length > 0 && (
            <div className="mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Size</span>
                {selectedSizeObj?.size && <span className="text-sm text-gray-500">{selectedSizeObj.size}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {currentSizesArray.map((sizeObj, idx) => (
                  <button key={idx}
                    onClick={() => setSelectedSizeIdx(idx)}
                    className={`px-5 py-2.5 rounded-full border-2 transition-all text-sm font-bold tracking-wide ${selectedSizeIdx === idx
                      ? 'border-gray-900 bg-gray-900 text-white shadow-md'
                      : 'border-gray-200 text-gray-700 hover:border-gray-900'}`}>
                    {sizeObj.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide block mb-3">Quantity</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:border-brand-orange hover:text-brand-orange font-bold text-xl transition-all">−</button>
              <span className="text-lg font-bold text-gray-900 w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:border-brand-orange hover:text-brand-orange font-bold text-xl transition-all">+</button>
            </div>
          </div>

          {/* Delivery */}
          <div className="mb-5 pb-5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide block mb-3">Delivery</span>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus-within:border-[#022A21] transition-colors">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <input type="text" placeholder="Enter pincode to check delivery"
                value={pincode} onChange={(e) => setPincode(e.target.value)}
                className="flex-1 outline-none text-sm placeholder-gray-400 font-medium bg-transparent text-gray-900" maxLength={6} />
              <button className="text-brand-orange font-bold text-sm hover:opacity-80 transition-opacity">Check</button>
            </div>
            <p className="text-sm text-gray-700 font-medium">
              Delivery by <span className="font-bold text-gray-900">{deliveryDate}</span> &nbsp;|&nbsp;
              <span className="text-green-600 font-bold">Free</span>
              <span className="text-gray-400 line-through ml-1 text-xs">₹40</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">If ordered before 4:00 PM</p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-gray-100">
            {[
              { icon: <Truck className="w-5 h-5 text-[#022A21]" />, label: 'Free Delivery' },
              { icon: <ShieldCheck className="w-5 h-5 text-[#022A21]" />, label: '100% Genuine' },
              { icon: <RefreshCcw className="w-5 h-5 text-[#022A21]" />, label: 'Easy Returns' },
            ].map(b => (
              <div key={b.label} className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
                {b.icon}
                <span className="text-[11px] font-semibold text-gray-700">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="w-1 h-5 bg-brand-orange rounded-full inline-block" />
              Product Description
            </h2>
            {product.short_description && (
              <p className="text-[15px] font-semibold text-gray-800 mb-2 leading-snug">{product.short_description}</p>
            )}
            <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description || 'Experience the perfect blend of tradition and quality. This product is carefully crafted to meet your daily needs while maintaining an authentic feel. Suitable for all occasions and built to last.'}
            </p>
          </div>

          {/* Specs */}
          {groupedSpecs.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <span className="w-1 h-5 bg-brand-orange rounded-full inline-block" />
                Specifications
              </h2>
              
              <div className="flex flex-col gap-6">
                {groupedSpecs.map((group, gIdx) => (
                  <div key={gIdx}>
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 pl-1">{group.title}</h3>
                    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      {group.items.map((row, i) => (
                        <div key={row.k} className={`flex gap-4 px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                          <span className="text-gray-500 w-1/3 shrink-0 capitalize font-medium">
                            {row.k.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-900 font-semibold w-2/3 break-words">
                            {String(row.v).startsWith('http')
                              ? <a href={row.v} target="_blank" rel="noreferrer" className="text-brand-orange hover:underline truncate block">View Document</a>
                              : row.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>You may also like</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-4 snap-x">
            {relatedProducts.map(rp => (
              <div key={rp.id} className="w-[160px] md:w-[200px] flex-shrink-0 snap-start">
                <ProductCard product={rp} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE sticky action bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex gap-3 px-4 py-3 z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe">
        <button onClick={() => toggleWishlist(product.id)}
          className="w-12 shrink-0 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWishlisted ? 'bg-red-50' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#88313A] text-[#88313A]' : 'text-gray-600'}`} strokeWidth={isWishlisted ? 0 : 1.5} />
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-none">{isWishlisted ? 'Saved' : 'Save'}</span>
        </button>
        <button onClick={handleAddToCart}
          className="flex-[1.2] bg-white text-gray-900 border-2 border-gray-200 font-bold py-3 rounded-2xl text-[14px] active:scale-95 transition-all hover:bg-gray-50 hover:border-gray-300">
          Add to Cart
        </button>
        <button onClick={handleBuyNow}
          className="flex-[1.3] bg-gradient-to-r from-brand-orange to-yellow-500 text-white font-bold py-3 rounded-2xl text-[14px] active:scale-95 transition-all shadow-[0_4px_15px_rgba(254,102,3,0.25)]">
          Buy Now
        </button>
      </div>

      {/* ── Image Zoom Modal ── */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setIsImageModalOpen(false)}>
            <button onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[101]">
              <X className="w-8 h-8" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl px-4 flex flex-col items-center gap-4"
              onClick={e => e.stopPropagation()}>
              <img src={mainImg || productImages[0] || PLACEHOLDER} alt={product.name}
                className="w-full max-h-[70vh] object-contain rounded-2xl"
                onError={(e) => { e.target.src = PLACEHOLDER; }} />
              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar max-w-full pb-2">
                  {productImages.map((img, i) => (
                    <button key={i} onClick={() => setMainImg(img)}
                      className={`w-14 h-14 rounded-xl border-2 p-0.5 flex-shrink-0 overflow-hidden transition-all ${mainImg === img ? 'border-brand-orange' : 'border-white/20'}`}>
                      <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover rounded-lg"
                        onError={(e) => { e.target.src = PLACEHOLDER; }} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
