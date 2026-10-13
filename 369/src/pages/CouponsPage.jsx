import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tag, Ticket, Copy, Check, ShoppingBag, Calendar } from 'lucide-react';
import { Header } from '../components/Header';
import { motion } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function CouponsPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('id');

  useEffect(() => {
    fetch(`${BACKEND_URL}/offers/active`)
      .then(r => r.json())
      .then(d => setOffers(d.offers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const discountLabel = (o) =>
    o.discount_type === 'flat' ? `₹${o.discount_percent} OFF` : `${o.discount_percent}% OFF`;

  const restrictionLabel = (o) => {
    if (!o.min_value && !o.restriction_value) return null;
    const val = o.min_value || o.restriction_value;
    const type = o.min_type || o.restriction_type;
    if (type === 'qty' || type === 'min_qty') return `Min. ${val} items`;
    return `Min. order ₹${val}`;
  };

  const coupons = offers.filter(o => o.offer_type === 'coupon' || o.code);

  if (loading) return (
    <div className="min-h-screen bg-transparent">
      <Header />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-white/10 border-t-brand-orange rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Header />

      {/* Hero */}
      <div className="bg-[#022A21] px-6 py-12 md:py-16 text-center border-b border-[#054335] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-orange/20 border border-brand-orange/30 text-brand-orange shadow-[0_0_10px_rgba(254,102,3,0.2)] text-xs font-bold px-4 py-1.5 rounded-full mb-4">
            <Tag className="w-3.5 h-3.5" /> EXCLUSIVE DEALS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>All Coupons Available</h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">Save more on every order with our latest deals</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Coupons */}
        {coupons.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6 px-2">
              <Ticket className="w-6 h-6 text-brand-orange" />
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Coupon Codes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((c, i) => {
                const isHighlighted = highlightId && String(c.id) === highlightId;
                const restriction = restrictionLabel(c);
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-[#022A21] rounded-3xl border-2 p-6 relative overflow-hidden transition-all shadow-lg ${isHighlighted ? 'border-brand-orange shadow-[0_0_20px_rgba(254,102,3,0.3)]' : 'border-[#054335] hover:border-[#076655] hover:shadow-[0_10px_30px_rgba(2,42,33,0.2)]'}`}>
                    
                    {/* decorative circles */}
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full border-r-2 border-dashed border-[#054335]" />
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 rounded-full border-l-2 border-dashed border-[#054335]" />

                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-3xl font-black text-brand-orange tracking-tight">{discountLabel(c)}</p>
                        {restriction && <p className="text-xs text-gray-300 mt-1 font-medium">{restriction}</p>}
                      </div>
                      {c.usage === 'one_time' || c.usage_type === 'single'
                        ? <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full shadow-sm">ONE TIME</span>
                        : <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full shadow-sm">UNLIMITED</span>
                      }
                    </div>

                    <div className="flex items-center gap-3 bg-brand-orange/10 border border-dashed border-brand-orange/50 rounded-xl px-5 py-3">
                      <span className="flex-1 font-bold tracking-widest text-white text-base">{c.code}</span>
                      <button onClick={() => handleCopy(c.code, c.id)}
                        className="flex items-center gap-1.5 text-sm font-bold text-brand-orange hover:text-orange-400 transition-all bg-brand-orange/20 hover:bg-brand-orange/30 px-3 py-1.5 rounded-lg border border-brand-orange/20">
                        {copied === c.id ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                      </button>
                    </div>

                    {c.expires_at && (
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-4 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> Expires {new Date(c.expires_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {coupons.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Tag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-6 text-lg font-medium">No active coupons right now. Check back soon!</p>
            <button onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-[#022A21] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#034032] transition-all hover:-translate-y-0.5 w-max">
              <ShoppingBag className="w-4 h-4" /> Shop Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
