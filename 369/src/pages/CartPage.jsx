import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, Tag, X, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { useCartStore } from '../store/useCartStore';
import { useStoreData } from '../store/useStoreData';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getSubtotal, getTotal, deliveryCharge } = useCartStore();
  const { offers } = useStoreData();
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  
  const container = React.useRef(null);
  
  useGSAP(() => {
    if (items.length > 0) {
      gsap.from('.animate-cart-item', {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      });
      gsap.from('.animate-cart-summary', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }
  }, { scope: container });

  const handleCheckout = () => {
    navigate('/checkout', { state: { couponCode: coupon?.code || couponCode, discount } });
  };

  const subtotal = getSubtotal();
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const discount = (() => {
    if (!coupon) return 0;
    const type = coupon.type || coupon.discount_type;
    const val = Number(coupon.value || coupon.discount_value || coupon.discount_percent || 0);

    let applicableSubtotal = subtotal;

    if (coupon.source === 'vendor' && coupon.vendor_id) {
       applicableSubtotal = items.reduce((acc, item) => {
         if (item.product?.vendor_id === coupon.vendor_id) {
            return acc + (item.variant?.price || item.product.price || 0) * item.qty;
         }
         return acc;
       }, 0);
    }
    
    if (applicableSubtotal === 0) return 0;

    if (type === 'percentage' || type === 'percent') {
      return Math.round((applicableSubtotal * val) / 100);
    }
    return Math.min(val, applicableSubtotal);
  })();

  const grandTotal = Math.max(0, subtotal - discount) + (subtotal > 0 ? deliveryCharge : 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCoupon(null);
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        items: items.map(i => ({
           vendor_id: i.product?.vendor_id,
           price: i.variant?.price || i.product.price || 0,
           quantity: i.qty
        }))
      };
      const res = await fetch(`${BACKEND_URL}/general/coupon/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');
      setCoupon(data.coupon);
    } catch (e) {
      setCouponError(e.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => { setCoupon(null); setCouponCode(''); setCouponError(''); };

  // Get matching offer for a product
  const getMatchingOffer = (product) => {
    return offers
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
  };

  // Build cart items with REAL MRP and offer discounts
  const cartItemsWithDiscount = items.map((item) => {
    const itemPrice = item.variant?.price || item.product?.price || 0;
    const mrp = Number(item.product?.mrp) || Math.round(itemPrice * 1.4);
    const matchingOffer = getMatchingOffer(item.product);
    const offerPct = matchingOffer ? parseFloat(matchingOffer.discount_percent) : 0;
    const effectivePrice = offerPct > 0 ? Math.round(itemPrice * (1 - offerPct / 100)) : itemPrice;
    const off = mrp > effectivePrice ? Math.round(((mrp - effectivePrice) / mrp) * 100) : 0;
    return { ...item, itemPrice: effectivePrice, originalPrice: mrp, off, offerPct };
  });

  const totalOriginalPrice = cartItemsWithDiscount.reduce((acc, curr) => acc + curr.originalPrice * curr.qty, 0);
  const totalItemPrice = cartItemsWithDiscount.reduce((acc, curr) => acc + curr.itemPrice * curr.qty, 0);
  const totalMockupDiscount = totalOriginalPrice - totalItemPrice;
  const delivery = totalItemPrice > 0 ? deliveryCharge : 0;
  const finalAmount = totalItemPrice + delivery - discount;

  return (
    <div ref={container} className="min-h-screen bg-gray-50 pb-24 font-sans">
      <Header hideSearch={true} />
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-20 max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="w-12 h-12 text-[#2874f0]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 text-center text-sm">Add items to it now.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-[#fb641b] text-white px-6 py-3.5 rounded-sm font-bold shadow-sm transition-all"
          >
            Shop Now
          </button>
        </div>
      ) : (
        <div className="md:max-w-3xl mx-auto md:mt-4">
          
          <div className="bg-white p-4 border-b border-gray-100 flex items-center shadow-sm mb-2 md:rounded-sm">
            <h1 className="text-gray-900 font-bold text-lg">My Cart ({items.length})</h1>
          </div>
          
          {/* Cart Items List */}
          <div className="bg-white flex flex-col md:rounded-sm md:shadow-sm">
            {cartItemsWithDiscount.map((item) => (
              <div key={`${item.product.id}-${item.variant?.size || 'default'}`} className="animate-cart-item p-4 border-b border-gray-100 relative flex gap-4">
                
                {/* Trash Icon */}
                <button 
                  onClick={() => removeFromCart(item.product.id, item.variant)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                </button>
                
                {/* Left: Image */}
                <div className="w-[85px] h-[85px] shrink-0 p-1 flex items-center justify-center">
                  <img src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : item.product.image_url} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                </div>
                
                {/* Right: Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="pr-8">
                    <h3 className="text-[15px] font-semibold text-gray-800 leading-tight mb-1">{item.product.name}</h3>
                    <p className="text-[12px] text-gray-500 mb-1">{item.product.category || 'Product'}</p>
                    {item.variant?.size || item.product.color ? (
                      <p className="text-[12px] text-gray-500">
                        {item.variant?.size ? `${item.variant.size}` : ''} 
                        {item.product.color ? ` ${item.product.color}` : ''}
                      </p>
                    ) : null}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[16px] font-extrabold text-gray-900">₹{item.itemPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[12px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[12px] font-bold text-green-600">{item.off}% OFF</span>
                  </div>
                  
                  {/* Quantity Control */}
                  <div className="absolute bottom-4 right-4 flex items-center border border-gray-200 rounded-[4px] overflow-hidden h-7 shadow-sm">
                     <button 
                       onClick={() => updateQuantity(item.product.id, item.variant, Math.max(1, item.qty - 1))}
                       className="w-8 h-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                     >
                       <Minus className="w-3 h-3" strokeWidth={2} />
                     </button>
                     <span className="w-8 h-full flex items-center justify-center text-[13px] font-bold border-x border-gray-200 bg-white">
                       {item.qty}
                     </span>
                     <button 
                       onClick={() => updateQuantity(item.product.id, item.variant, item.qty + 1)}
                       className="w-8 h-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                     >
                       <Plus className="w-3 h-3" strokeWidth={2} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Section (Hidden visually in mockup, placed here cleanly) */}
          <div className="bg-white mt-2 px-4 py-4 md:rounded-sm md:shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-600" />
                <span className="text-[14px] font-bold text-gray-800">Apply Coupon</span>
             </div>
             {coupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{coupon.code}</span>
                      <span className="text-xs text-green-700 font-medium">You save ₹{discount}</span>
                   </div>
                   <button onClick={handleRemoveCoupon} className="text-red-500 text-sm font-bold">Remove</button>
                </div>
             ) : (
                <div className="flex gap-2">
                   <input type="text" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter coupon code" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                   <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="bg-gray-800 text-white font-bold text-sm px-4 py-2 rounded disabled:opacity-50">APPLY</button>
                </div>
             )}
             {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
          </div>

          {/* Price Details */}
          <div className="bg-white mt-2 px-4 py-5 shadow-sm md:rounded-sm">
             <h3 className="text-[15px] font-bold text-gray-900 mb-4 tracking-wide border-b border-gray-100 pb-3">Price Details</h3>
             <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between text-[14px] text-gray-700">
                   <span>Total Price ({items.length} items)</span>
                   <span>₹{totalOriginalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[14px] text-gray-700">
                   <span>Discount</span>
                   <span className="text-green-600">-₹{(totalMockupDiscount + discount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[14px] text-gray-700">
                   <span>Delivery Charges</span>
                   <span className="text-green-600">{delivery > 0 ? `₹${delivery}` : 'FREE'}</span>
                </div>
             </div>
             <div className="flex justify-between items-center text-[16px] font-bold text-gray-900 mb-3">
                <span>Total Amount</span>
                <span>₹{finalAmount.toLocaleString('en-IN')}</span>
             </div>
             <div className="text-[13px] font-medium text-green-600">
                You will save ₹{(totalMockupDiscount + discount).toLocaleString('en-IN')} on this order
             </div>
          </div>

        </div>
      )}

      {/* Fixed Bottom Bar */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-safe z-50 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:max-w-3xl md:mx-auto md:px-4">
           <div className="flex flex-col pl-1">
              <span className="text-[11px] text-gray-600 font-bold mb-0.5">Total Amount</span>
              <span className="text-[18px] font-extrabold text-gray-900 leading-none">₹{finalAmount.toLocaleString('en-IN')}</span>
           </div>
           <button onClick={handleCheckout} className="bg-[#fb641b] text-white text-[15px] font-bold w-[160px] py-3 rounded-sm shadow-sm hover:bg-[#f05a12] transition-colors">
              PLACE ORDER
           </button>
        </div>
      )}
    </div>
  );
}
