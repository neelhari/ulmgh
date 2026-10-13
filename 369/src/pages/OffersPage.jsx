import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tag, ShoppingBag, Calendar, Zap, ChevronRight, Sparkles, Clock } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';
import { motion } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('id');
  const { products } = useStoreData();

  useEffect(() => {
    fetch(`${BACKEND_URL}/offers/active`)
      .then(r => r.json())
      .then(d => {
        const list = d.offers || [];
        setOffers(list);
        if (list.length > 0) {
          const highlighted = highlightId ? list.find(o => String(o.id) === highlightId) : null;
          setActiveOffer(highlighted || list[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [highlightId]);

  const discountLabel = (o) =>
    o.discount_type === 'flat' ? `₹${o.discount_percent} OFF` : `${parseFloat(o.discount_percent).toFixed(0)}% OFF`;

  const productOffers = offers.filter(o => o.offer_type === 'offer' || !o.code);

  const getOfferProducts = (offer) => {
    if (!offer || !products.length) return [];
    if (offer.scope === 'all') return products.slice(0, 8);
    if (offer.scope === 'category') {
      const cats = typeof offer.category_ids === 'string' ? JSON.parse(offer.category_ids) : (offer.category_ids || []);
      return products.filter(p => cats.includes(p.category)).slice(0, 8);
    }
    if (offer.scope === 'product') {
      const pids = typeof offer.product_ids === 'string' ? JSON.parse(offer.product_ids) : (offer.product_ids || []);
      return products.filter(p => pids.includes(p.id?.toString()) || pids.includes(p.id)).slice(0, 8);
    }
    return [];
  };

  const offerProducts = getOfferProducts(activeOffer);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-orange rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <Header />

      <div className="h-4 md:h-6" />

      {/* Hero Banner - compact on mobile */}
      <div className="bg-[#022A21] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-brand-orange/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 px-4 py-8 md:py-14 md:text-center">
          <div className="inline-flex items-center gap-1.5 bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-[10px] font-bold px-3 py-1 rounded-full mb-3">
            <Zap className="w-3 h-3 fill-current" /> EXCLUSIVE DEALS
          </div>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white mb-1.5 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Offers & Deals
          </h1>
          <p className="text-gray-300 text-xs md:text-base font-medium">Save more on every order with our latest active offers</p>
        </div>
      </div>

      {productOffers.length === 0 ? (
        <div className="text-center py-24 px-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 max-w-sm mx-auto">
            <Tag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-6 font-medium">No active offers right now. Check back soon!</p>
            <button onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-[#022A21] text-white rounded-xl text-sm font-bold w-max">
              <ShoppingBag className="w-4 h-4" /> Shop Now
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Offer Tabs — horizontal scroll on mobile */}
          {productOffers.length > 1 && (
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
              <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
                {productOffers.map((offer) => (
                  <button
                    key={offer.id}
                    onClick={() => setActiveOffer(offer)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      activeOffer?.id === offer.id
                        ? 'bg-[#022A21] text-white border-[#022A21] shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#022A21]'
                    }`}>
                    <Sparkles className="w-3 h-3" />
                    {offer.name || discountLabel(offer)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeOffer && (
            <motion.div
              key={activeOffer.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>

              {/* Active Offer Banner — mobile-first horizontal layout */}
              <div className="mx-3 mt-4 md:mx-auto md:max-w-7xl md:px-4 rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #022A21 0%, #054335 60%, #0a6645 100%)' }}>
                <div className="relative p-4 md:p-8 flex items-center gap-4">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                  {/* Left: Disc badge */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-brand-orange/15 border-2 border-brand-orange/40 rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="text-brand-orange font-black text-lg md:text-2xl leading-tight text-center">
                        {discountLabel(activeOffer)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Text */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2">
                      <Tag className="w-2.5 h-2.5" /> ACTIVE OFFER
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                      {discountLabel(activeOffer)}
                    </h2>
                    {activeOffer.name && (
                      <p className="text-sm md:text-lg font-bold text-orange-200 mt-0.5 truncate">{activeOffer.name}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">
                      {activeOffer.scope === 'all' ? '✅ All products' : activeOffer.scope === 'category' ? '📂 Selected categories' : '🎯 Selected products'}
                    </p>
                    {activeOffer.expires_at && (
                      <p className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5">
                        <Clock className="w-3 h-3" /> Expires {new Date(activeOffer.expires_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div className="px-3 md:px-0 md:max-w-7xl md:mx-auto md:px-4 mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base md:text-lg font-bold text-gray-900">
                    {activeOffer.scope === 'all' ? '🔥 Featured Products' : '🎯 Products in this Offer'}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">({offerProducts.length})</span>
                  </h3>
                  {activeOffer.scope === 'all' && products.length > 8 && (
                    <button onClick={() => navigate('/')}
                      className="flex items-center gap-0.5 text-xs font-bold text-brand-orange">
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {offerProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {offerProducts.map((product, i) => (
                      <motion.div key={product.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
                    No products found for this offer.
                  </div>
                )}
              </div>

              {/* Other Offers Quick Pills — only show if multiple offers */}
              {productOffers.length > 1 && (
                <div className="px-3 mt-8 md:max-w-7xl md:mx-auto md:px-4">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">More Offers</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {productOffers.filter(o => o.id !== activeOffer.id).map(offer => (
                      <button key={offer.id} onClick={() => setActiveOffer(offer)}
                        className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-brand-orange/30 hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-[#022A21]/5 border border-[#022A21]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-[#022A21] font-black text-xs text-center leading-tight">{discountLabel(offer)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{offer.name || discountLabel(offer)}</p>
                          <p className="text-xs text-gray-400 capitalize mt-0.5">
                            {offer.scope === 'all' ? 'On all products' : offer.scope === 'category' ? 'Selected categories' : 'Selected products'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
