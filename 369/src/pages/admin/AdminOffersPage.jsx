import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, X, Tag, Percent, Ticket, CheckCircle2, ChevronRight, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
const accent = '#036e26';

const EMPTY_OFFER = {
  name: '', discount_percent: '', scope: 'all',
  category_ids: [], product_ids: [],
  expires_at: '', is_active: true,
};

const EMPTY_COUPON = {
  code: '', discount_percent: '', scope: 'all',
  category_ids: [], product_ids: [],
  min_type: 'amount', min_value: '',
  usage_type: 'multiple', expires_at: '', is_active: true,
};

// ── shared wizard ──────────────────────────────────────────────────────────────
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
    if (type === 'coupon' && (!form.code || !form.discount_percent)) return toast.error('Code and discount % are required');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none';

  const ScopeStep = () => (
    <>
      <h2 className="font-bold text-gray-900">Apply To</h2>
      <div className="grid grid-cols-3 gap-3">
        {[{ v: 'all', label: 'All Products' }, { v: 'category', label: 'Categories' }, { v: 'product', label: 'Products' }].map(opt => (
          <button key={opt.v} type="button" onClick={() => set('scope', opt.v)}
            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.scope === opt.v ? 'text-white' : 'border-gray-200 text-gray-600'}`}
            style={form.scope === opt.v ? { borderColor: accent, backgroundColor: accent } : {}}>
            {opt.label}
          </button>
        ))}
      </div>
      {form.scope === 'category' && (
        <div className="space-y-1 max-h-52 overflow-y-auto mt-2">
          {categories.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={(form.category_ids || []).includes(c.id)}
                onChange={() => toggleArr('category_ids', c.id)} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">{c.name}</span>
            </label>
          ))}
        </div>
      )}
      {form.scope === 'product' && (
        <div className="space-y-1 max-h-52 overflow-y-auto mt-2">
          {products.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={(form.product_ids || []).includes(p.id)}
                onChange={() => toggleArr('product_ids', p.id)} className="w-4 h-4 rounded" />
              {p.image_url && <img src={p.image_url} className="w-8 h-8 rounded-lg object-cover" />}
              <span className="text-sm text-gray-700 truncate">{p.name}</span>
              <span className="ml-auto text-xs text-gray-400 flex-shrink-0">₹{p.price}</span>
            </label>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
              <React.Fragment key={n}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= n ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                  style={step >= n ? { backgroundColor: accent } : {}}>
                  {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
                </div>
                {n < totalSteps && <div className="w-8 h-0.5 rounded bg-gray-200" style={step > n ? { backgroundColor: accent } : {}} />}
              </React.Fragment>
            ))}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* OFFER steps */}
          {type === 'offer' && step === 1 && (
            <>
              <h2 className="font-bold text-gray-900">Offer Details</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Offer Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputCls} placeholder="e.g. Summer Sale" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Discount %</label>
                <div className="relative">
                  <input type="number" min="1" max="100" value={form.discount_percent}
                    onChange={e => set('discount_percent', e.target.value)}
                    className={inputCls + ' pr-8'} placeholder="e.g. 20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </>
          )}
          {type === 'offer' && step === 2 && <ScopeStep />}

          {/* COUPON steps */}
          {type === 'coupon' && step === 1 && (
            <>
              <h2 className="font-bold text-gray-900">Coupon Details</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Coupon Code</label>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                  className={inputCls} placeholder="e.g. SAVE20" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Discount %</label>
                <div className="relative">
                  <input type="number" min="1" max="100" value={form.discount_percent}
                    onChange={e => set('discount_percent', e.target.value)}
                    className={inputCls + ' pr-8'} placeholder="e.g. 20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expiry Date (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
              </div>
            </>
          )}
          {type === 'coupon' && step === 2 && <ScopeStep />}
          {type === 'coupon' && step === 3 && (
            <>
              <h2 className="font-bold text-gray-900">Conditions</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Minimum Requirement</label>
                <div className="flex gap-2">
                  <select value={form.min_type} onChange={e => set('min_type', e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none w-44 flex-shrink-0">
                    <option value="amount">Min. Amount (₹)</option>
                    <option value="qty">Min. Quantity</option>
                  </select>
                  <input type="number" min="0" value={form.min_value} onChange={e => set('min_value', e.target.value)}
                    className={inputCls} placeholder={form.min_type === 'amount' ? 'e.g. 500' : 'e.g. 2'} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Usage per User</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'single', label: 'Single Use', sub: 'Once per user' }, { v: 'multiple', label: 'Multiple Use', sub: 'Unlimited times' }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set('usage_type', opt.v)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${form.usage_type === opt.v ? 'text-white' : 'border-gray-200'}`}
                      style={form.usage_type === opt.v ? { borderColor: accent, backgroundColor: accent } : {}}>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className={`text-xs mt-0.5 ${form.usage_type === opt.v ? 'text-white/70' : 'text-gray-400'}`}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-gray-700">Active (visible to customers)</span>
              </label>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}>
              {saving ? 'Saving...' : initial?.id ? `Update ${type === 'offer' ? 'Offer' : 'Coupon'}` : `Create ${type === 'offer' ? 'Offer' : 'Coupon'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
export function AdminOffersPage() {
  const [tab, setTab] = useState('offers'); // 'offers' | 'coupons'
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(null); // { type, initial } | null

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = () => {
    Promise.all([
      fetch(`${BACKEND_URL}/offers/admin?type=offer`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/offers/admin?type=coupon`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/admin/categories`, { headers }).then(r => r.json()),
      fetch(`${BACKEND_URL}/admin/products`, { headers }).then(r => r.json()),
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
    const url = isEdit ? `${BACKEND_URL}/offers/admin/${form.id}` : `${BACKEND_URL}/offers/admin`;
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
    await fetch(`${BACKEND_URL}/offers/admin/${id}`, { method: 'DELETE', headers });
    toast.success('Deleted');
    if (type === 'offer') setOffers(p => p.filter(o => o.id !== id));
    else setCoupons(p => p.filter(o => o.id !== id));
  };

  const toggleActive = async (item, type) => {
    const res = await fetch(`${BACKEND_URL}/offers/admin/${item.id}`, {
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
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offers & Coupons</h1>
          <p className="text-gray-400 text-xs mt-0.5">Manage discounts and coupon codes</p>
        </div>
        <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: {} })}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: accent }}>
          <Plus className="w-4 h-4" /> {tab === 'offers' ? 'New Offer' : 'New Coupon'}
        </button>
      </div>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {[
          { key: 'offers', label: 'Offers', icon: <Percent className="w-3.5 h-3.5" /> },
          { key: 'coupons', label: 'Coupons', icon: <Ticket className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
              style={tab === t.key ? { backgroundColor: accent } : {}}>
              {t.key === 'offers' ? offers.length : coupons.length}
            </span>
          </button>
        ))}
      </div>

      {/* description banner */}
      <div className={`rounded-xl p-4 mb-5 text-sm flex items-start gap-3 ${tab === 'offers' ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
        {tab === 'offers'
          ? <><Percent className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Offers</strong> are automatic discounts applied directly to product prices — customers see the reduced price without entering any code.</span></>
          : <><Ticket className="w-4 h-4 mt-0.5 flex-shrink-0" /><span><strong>Coupons</strong> are codes you generate and share with customers — they enter the code at checkout to get the discount.</span></>
        }
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          {tab === 'offers' ? <Percent className="w-12 h-12 text-gray-200 mx-auto mb-3" /> : <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />}
          <p className="text-gray-400 text-sm mb-4">No {tab} yet.</p>
          <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: {} })}
            className="px-5 py-2 text-white rounded-xl text-sm font-semibold"
            style={{ backgroundColor: accent }}>
            Create First {tab === 'offers' ? 'Offer' : 'Coupon'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(item => {
            const catIds = parseIds(item.category_ids);
            const prdIds = parseIds(item.product_ids);
            const isOffer = tab === 'offers';
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 relative">
                {!item.is_active && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500">Inactive</span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold tracking-wider"
                    style={{ backgroundColor: `${accent}15`, color: accent }}>
                    {isOffer ? <Percent className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                    {isOffer ? item.name : item.code}
                  </div>
                  {!isOffer && (
                    <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('Copied!'); }}
                      className="ml-auto text-gray-300 hover:text-gray-500 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{item.discount_percent}% OFF</p>
                <div className="text-xs text-gray-400 space-y-0.5 mb-4">
                  <p>Applies to: <span className="text-gray-600 font-medium capitalize">
                    {item.scope === 'all' ? 'All Products' : item.scope === 'category' ? `${catIds.length} categor${catIds.length !== 1 ? 'ies' : 'y'}` : `${prdIds.length} product${prdIds.length !== 1 ? 's' : ''}`}
                  </span></p>
                  {!isOffer && <p>Min {item.min_type === 'amount' ? `₹${item.min_value}` : `${item.min_value} qty`} · <span className="capitalize">{item.usage_type} use</span></p>}
                  {item.expires_at && <p>Expires: {new Date(item.expires_at).toLocaleDateString('en-IN')}</p>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                  <button onClick={() => toggleActive(item, tab === 'offers' ? 'offer' : 'coupon')} className="text-gray-400 transition-colors"
                    style={item.is_active ? { color: accent } : {}}>
                    {item.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => setWizard({ type: tab === 'offers' ? 'offer' : 'coupon', initial: { ...item, category_ids: catIds, product_ids: prdIds } })}
                    className="ml-auto text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id, tab === 'offers' ? 'offer' : 'coupon')}
                    className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
