import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Percent, Ticket, CheckCircle2, ChevronRight, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
const accent = '#fe6603';

const EMPTY_OFFER = {
  name: '', discount_percent: '', scope: 'all',
  category_ids: [], product_ids: [],
  expires_at: '', is_active: true,
};

const EMPTY_COUPON = {
  code: '', discount_type: 'percent', discount_percent: '', scope: 'all',
  category_ids: [], product_ids: [],
  min_type: 'amount', min_value: '',
  usage_type: 'multiple', expires_at: '', is_active: true,
};

function Wizard({ type, initial, categories, products, onSave, onClose }) {
  const empty = type === 'offer' ? EMPTY_OFFER : EMPTY_COUPON;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const totalSteps = type === 'offer' ? 2 : 3;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (key, id) => setForm(p => {
    const arr = p[key] || [];
    return { ...p, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
  });

  const handleSave = async () => {
    if (type === 'offer' && (!form.name || !form.discount_percent)) return toast.error('Name and discount % are required');
    if (type === 'coupon' && (!form.code || !form.discount_percent)) return toast.error('Code and discount value are required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:border-transparent min-h-[44px]';

  const ScopeStep = () => (
    <>
      <h2 className="font-bold text-gray-900 text-sm sm:text-base">Apply To</h2>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {[{ v: 'all', label: 'All Products' }, { v: 'category', label: 'Categories' }, { v: 'product', label: 'Products' }].map(opt => (
          <button key={opt.v} type="button" onClick={() => set('scope', opt.v)}
            className={`p-2.5 sm:p-3 rounded-xl border-2 text-xs sm:text-sm font-semibold transition-all min-h-[44px] flex items-center justify-center text-center ${form.scope === opt.v ? 'bg-[#fe6603] border-[#fe6603] text-white' : 'border-gray-200 text-gray-600 hover:border-[#fe6603]/40'}`}>
            {opt.label}
          </button>
        ))}
      </div>
      {form.scope === 'category' && (
        <div className="space-y-1 max-h-44 sm:max-h-52 overflow-y-auto mt-2 pr-1">
          {categories.map(c => (
            <label key={c.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={(form.category_ids || []).includes(c.id)}
                onChange={() => toggleArr('category_ids', c.id)} className="w-4 h-4 rounded accent-[#fe6603] shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700">{c.name}</span>
            </label>
          ))}
        </div>
      )}
      {form.scope === 'product' && (
        <div className="space-y-1 max-h-44 sm:max-h-52 overflow-y-auto mt-2 pr-1">
          {products.map(p => (
            <label key={p.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={(form.product_ids || []).includes(p.id)}
                onChange={() => toggleArr('product_ids', p.id)} className="w-4 h-4 rounded accent-[#fe6603] shrink-0" />
              {p.image_url && <img src={p.image_url} className="w-8 h-8 rounded-lg object-cover shrink-0" />}
              <span className="text-xs sm:text-sm text-gray-700 truncate">{p.name}</span>
              <span className="ml-auto text-xs text-gray-400 shrink-0">₹{p.price}</span>
            </label>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
              <React.Fragment key={n}>
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= n ? 'bg-[#fe6603] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {step > n ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : n}
                </div>
                {n < totalSteps && <div className={`w-5 sm:w-8 h-0.5 rounded ${step > n ? 'bg-[#fe6603]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg active:bg-gray-100 min-h-[40px] min-w-[40px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
          {type === 'offer' && step === 1 && (
            <>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Offer Details</h2>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Offer Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="e.g. Weekend Sale" />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Discount %</label>
                <div className="relative">
                  <input type="number" min="1" max="100" value={form.discount_percent}
                    onChange={e => set('discount_percent', e.target.value)}
                    className={inputCls + ' pr-8'} placeholder="e.g. 15" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1 min-h-[44px]">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded accent-[#fe6603]" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Active</span>
              </label>
            </>
          )}
          {type === 'offer' && step === 2 && <ScopeStep />}

          {type === 'coupon' && step === 1 && (
            <>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Coupon Details</h2>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Coupon Code</label>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                  className={inputCls} placeholder="e.g. SAVE20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Discount Type</label>
                  <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={inputCls}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Rupees (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Value</label>
                  <div className="relative">
                    <input type="number" min="1" value={form.discount_percent}
                      onChange={e => set('discount_percent', e.target.value)}
                      className={inputCls + ' pr-8'} placeholder="e.g. 20" />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                      {form.discount_type === 'flat' ? '₹' : '%'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
              </div>
            </>
          )}
          {type === 'coupon' && step === 2 && <ScopeStep />}
          {type === 'coupon' && step === 3 && (
            <>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Conditions</h2>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Minimum Requirement</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select value={form.min_type} onChange={e => set('min_type', e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none w-full sm:w-44 flex-shrink-0 min-h-[44px]">
                    <option value="amount">Min. Amount (₹)</option>
                    <option value="qty">Min. Quantity</option>
                  </select>
                  <input type="number" min="0" value={form.min_value} onChange={e => set('min_value', e.target.value)}
                    className={inputCls} placeholder={form.min_type === 'amount' ? 'e.g. 500' : 'e.g. 2'} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Usage per User</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[{ v: 'single', label: 'Single Use', sub: 'Once per user' }, { v: 'multiple', label: 'Multiple Use', sub: 'Unlimited times' }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('usage_type', opt.v)}
                      className={`p-3 rounded-xl border-2 text-left transition-all min-h-[44px] ${form.usage_type === opt.v ? 'bg-[#fe6603] border-[#fe6603] text-white' : 'border-gray-200 hover:border-[#fe6603]/40'}`}>
                      <p className="font-semibold text-xs sm:text-sm">{opt.label}</p>
                      <p className={`text-[11px] mt-0.5 ${form.usage_type === opt.v ? 'text-white/80' : 'text-gray-400'}`}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer py-1 min-h-[44px]">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded accent-[#fe6603]" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">Active (visible to customers)</span>
              </label>
            </>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 flex gap-2.5 sm:gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 sm:px-5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]">
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#fe6603] text-white hover:bg-[#e55c02] active:bg-[#d45502] transition-colors min-h-[44px]">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#fe6603] text-white hover:bg-[#e55c02] active:bg-[#d45502] transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center">
              {saving ? 'Saving...' : initial?.id ? `Update ${type === 'offer' ? 'Offer' : 'Coupon'}` : `Create ${type === 'offer' ? 'Offer' : 'Coupon'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VendorOffersPage() {
  const [tab, setTab] = useState('offers');
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null);

  const token = localStorage.getItem('vendor_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = () => {
    Promise.all([
      fetch(`${BACKEND_URL}/offers/vendor?type=offer`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/offers/vendor?type=coupon`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/vendor/categories`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/vendor/products`, { headers }).then(r => r.json()),
    ]).then(([o, c, cats, prods]) => {
      setOffers(o.offers || []);
      setCoupons(c.offers || []);
      setCategories(cats.categories || []);
      setProducts(prods.products || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async (form) => {
    const type = wizard.type;
    const isEdit = !!form.id;
    const url = isEdit ? `${BACKEND_URL}/offers/vendor/${form.id}` : `${BACKEND_URL}/offers/vendor`;
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, offer_type: type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    toast.success(isEdit ? 'Updated!' : 'Created!');
    fetchAll();
  };

  const handleDelete = async (id, type) => {
    if (!confirm(`Delete this ${type}?`)) return;
    await fetch(`${BACKEND_URL}/offers/vendor/${id}`, { method: 'DELETE', headers });
    toast.success('Deleted');
    if (type === 'offer') setOffers(p => p.filter(o => o.id !== id));
    else setCoupons(p => p.filter(o => o.id !== id));
  };

  const toggleActive = async (item, type) => {
    const res = await fetch(`${BACKEND_URL}/offers/vendor/${item.id}`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, is_active: !item.is_active, offer_type: type }),
    });
    const data = await res.json();
    if (!res.ok) return;
    if (type === 'offer') setOffers(p => p.map(o => o.id === item.id ? data.offer : o));
    else setCoupons(p => p.map(o => o.id === item.id ? data.offer : o));
  };

  const parseIds = v => typeof v === 'string' ? JSON.parse(v) : (v || []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#fe6603] rounded-full animate-spin" />
    </div>
  );

  const list = tab === 'offers' ? offers : coupons;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {wizard && (
        <Wizard type={wizard.type} initial={wizard.initial}
          categories={categories} products={products}
          onSave={handleSave} onClose={() => setWizard(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 mb-5 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Offers & Coupons</h1>
          <p className="text-gray-500 font-medium text-xs sm:text-sm mt-1">Manage discounts and coupon codes for your store.</p>
        </div>
        <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: {} })}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white rounded-xl sm:rounded-[16px] text-xs sm:text-sm font-bold shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all min-h-[44px]">
          <Plus className="w-5 h-5" /> {tab === 'offers' ? 'New Offer' : 'New Coupon'}
        </button>
      </div>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-[20px] w-full sm:w-fit mb-5 sm:mb-8 shadow-inner border border-gray-200/50">
        {[
          { key: 'offers', label: 'Offers', icon: <Percent className="w-4 h-4" /> },
          { key: 'coupons', label: 'Coupons', icon: <Ticket className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg sm:rounded-[16px] text-xs sm:text-sm font-bold transition-all duration-300 min-h-[44px] ${tab === t.key ? 'bg-white text-gray-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
            {t.icon} <span>{t.label}</span>
            <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full shadow-xs ${tab === t.key ? 'bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white' : 'bg-gray-200/80 text-gray-500'}`}>
              {t.key === 'offers' ? offers.length : coupons.length}
            </span>
          </button>
        ))}
      </div>

      {/* description banner */}
      <div className={`rounded-xl p-3.5 sm:p-4 mb-4 sm:mb-5 text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3 ${tab === 'offers' ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
        {tab === 'offers'
          ? <><Percent className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Offers</strong> are automatic discounts shown directly on product prices — customers see the sale price without entering any code.</span></>
          : <><Ticket className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Coupons</strong> are codes you generate and share with your customers — they enter the code at checkout to get the discount.</span></>
        }
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 sm:p-16 text-center">
          {tab === 'offers' ? <Percent className="w-12 h-12 text-gray-200 mx-auto mb-3" /> : <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />}
          <p className="text-gray-400 text-xs sm:text-sm mb-4">No {tab} yet.</p>
          <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: {} })}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#fe6603] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#e55c02] active:bg-[#d45502] transition-colors min-h-[44px] flex items-center justify-center mx-auto">
            Create First {tab === 'offers' ? 'Offer' : 'Coupon'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {list.map(item => {
            const catIds = parseIds(item.category_ids);
            const prdIds = parseIds(item.product_ids);
            const isOffer = tab === 'offers';
            return (
              <div key={item.id} className="bg-white rounded-2xl sm:rounded-[24px] border border-gray-100 p-4 sm:p-6 relative shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                {!item.is_active && (
                  <span className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600 shadow-xs uppercase">Inactive</span>
                )}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 bg-gradient-to-br from-[#fe6603]/10 to-[#ff7b23]/10 text-[#fe6603] px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wider border border-[#fe6603]/10 shadow-xs">
                    {isOffer ? <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    <span className="truncate max-w-[140px] sm:max-w-none">{isOffer ? item.name : item.code}</span>
                  </div>
                  {!isOffer && (
                    <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('Copied!'); }}
                      className="ml-auto text-gray-400 hover:text-[#fe6603] hover:bg-orange-50 active:bg-orange-100 p-2 rounded-xl transition-all shadow-xs border border-transparent hover:border-[#fe6603]/20 min-h-[40px] min-w-[40px] flex items-center justify-center">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  {item.discount_type === 'flat' ? `₹${item.discount_percent}` : `${item.discount_percent}%`} <span className="text-base sm:text-xl text-[#fe6603]">OFF</span>
                </p>
                <div className="text-xs sm:text-sm text-gray-500 space-y-1.5 mb-4 sm:mb-6">
                  <p className="flex items-center gap-2"><span className="w-16 sm:w-20 font-bold text-gray-400 uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">Applies to</span> <span className="font-semibold text-gray-800 capitalize truncate">
                    {item.scope === 'all' ? 'All Products' : item.scope === 'category' ? `${catIds.length} categor${catIds.length !== 1 ? 'ies' : 'y'}` : `${prdIds.length} product${prdIds.length !== 1 ? 's' : ''}`}
                  </span></p>
                  {!isOffer && <p className="flex items-center gap-2"><span className="w-16 sm:w-20 font-bold text-gray-400 uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">Condition</span> <span className="font-semibold text-gray-800 truncate">Min {item.min_type === 'amount' ? `₹${item.min_value}` : `${item.min_value} qty`} · <span className="capitalize">{item.usage_type} use</span></span></p>}
                  {item.expires_at && <p className="flex items-center gap-2"><span className="w-16 sm:w-20 font-bold text-gray-400 uppercase text-[9px] sm:text-[10px] tracking-wider shrink-0">Expires</span> <span className="font-semibold text-gray-800">{new Date(item.expires_at).toLocaleDateString('en-IN')}</span></p>}
                </div>
                <div className="flex items-center gap-3 pt-3.5 sm:pt-5 border-t border-gray-100">
                  <button onClick={() => toggleActive(item, tab === 'offers' ? 'offer' : 'coupon')}
                    className={`transition-colors p-1.5 rounded-lg active:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center ${item.is_active ? 'text-[#036e26] hover:text-[#024f1b]' : 'text-gray-300 hover:text-[#036e26]'}`}>
                    {item.is_active ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                  <div className="ml-auto flex gap-1 sm:gap-2">
                    <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: { ...item, category_ids: catIds, product_ids: prdIds } })}
                      className="text-gray-500 hover:text-[#fe6603] p-2 rounded-xl hover:bg-orange-50 active:bg-orange-100 border border-transparent hover:border-[#fe6603]/20 transition-all shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id, tab === 'offers' ? 'offer' : 'coupon')}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 active:bg-red-100 border border-transparent hover:border-red-100 transition-all shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
