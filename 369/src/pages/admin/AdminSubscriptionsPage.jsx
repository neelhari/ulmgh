import React, { useEffect, useState } from 'react';
import { CreditCard, Edit2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function daysLeft(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

export function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${BACKEND_URL}/subscriptions/admin/plans`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/subscriptions/admin/vendors`, { headers }).then(r => r.json()).catch(() => ({})),
    ]).then(([p, v]) => {
      setPlans(p.plans || []);
      setVendors(v.vendors || []);
    }).finally(() => setLoading(false));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          price: editingPlan.price, 
          is_active: editingPlan.is_active,
          features: editingPlan.features || {} 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update plan');
      
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? data.plan : p));
      setEditingPlan(null);
      toast.success('Plan updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newPlan) return;
    if (!newPlan.name || !newPlan.price || !newPlan.months) {
      return toast.error("Name, Price and Months are required fields.");
    }

    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/plans`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newPlan.name,
          price: newPlan.price, 
          months: newPlan.months,
          is_active: newPlan.is_active,
          features: newPlan.features || {} 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create plan');
      
      setPlans(prev => [...prev, data.plan]);
      setNewPlan(null);
      toast.success('Plan created successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };


  const handleFeatureChange = (key, value, isNew = false) => {
    if (isNew) {
      setNewPlan(prev => ({
        ...prev,
        features: { ...(prev.features || {}), [key]: value }
      }));
    } else {
      setEditingPlan(prev => ({
        ...prev,
        features: { ...(prev.features || {}), [key]: value }
      }));
    }
  };

  const togglePlan = async (plan) => {
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          price: plan.price, 
          is_active: !plan.is_active,
          features: plan.features || {} 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlans(prev => prev.map(p => p.id === plan.id ? data.plan : p));
      toast.success(`Plan ${data.plan.is_active ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-400 text-sm mt-1">Manage subscription plans and view vendor subscriptions</p>
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-700 text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#036e26]" /> Subscription Plans
          </h2>
          <button 
            onClick={() => setNewPlan({ name: '', price: '', months: 1, is_active: true, features: {} })}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#036e26] hover:bg-[#025a1f] px-4 py-2 rounded-lg transition-colors shadow-sm shadow-[#036e26]/20"
          >
            + Add Plan
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${plan.is_active ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.months} month{plan.months > 1 ? 's' : ''}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {plan.is_active ? 'Active' : 'Off'}
                </span>
              </div>

              <div className="flex items-end gap-1 mb-4">
                <span className="text-[#036e26] font-extrabold text-2xl">₹{plan.price}</span>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-xs text-gray-500 line-clamp-2">
                  Product Limit: {plan.features?.product_limit || 'Unlimited'}<br/>
                  Commission: {plan.features?.commission_percent || '0'}%
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <button onClick={() => togglePlan(plan)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${plan.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}>
                  {plan.is_active ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => setEditingPlan({ ...plan })}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#036e26] bg-[#036e26]/10 hover:bg-[#036e26]/20 px-3 py-1.5 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Subscriptions */}
      <div>
        <h2 className="font-bold text-gray-700 text-base mb-4">Vendor Subscriptions ({vendors.length})</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Vendor</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs hidden sm:table-cell">Plan</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs hidden md:table-cell">Amount</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Expires</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-400 py-10 text-sm">No vendor subscriptions yet.</td></tr>
                ) : vendors.map(v => {
                  const days = daysLeft(v.subscription_expires_at);
                  const expired = days !== null && days <= 0;
                  const expiringSoon = days !== null && days > 0 && days <= 10;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{v.store_name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{v.email}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 hidden sm:table-cell font-medium">{v.plan_name || '—'}</td>
                      <td className="px-5 py-4 font-bold text-gray-900 hidden md:table-cell">{v.amount ? `₹${v.amount}` : '—'}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm font-medium">
                        {v.subscription_expires_at
                          ? new Date(v.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {days === null ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">No Plan</span>
                        ) : expired ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5" /> Expired
                          </span>
                        ) : expiringSoon ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 w-fit block">{days}d left</span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 w-fit block">{days}d left</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Edit Plan: <span className="text-[#036e26]">{editingPlan.name}</span>
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Configure pricing and specific feature limits</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="flex-1 overflow-y-auto p-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Price (₹)</label>
                  <input type="number" required min="0" step="1"
                    value={editingPlan.price || ''} 
                    onChange={e => setEditingPlan({...editingPlan, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.1"
                    value={editingPlan.features?.commission_percent || ''} 
                    onChange={e => handleFeatureChange('commission_percent', e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent transition-all" />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Quantitative Limits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { key: 'product_limit', label: 'Product Limit', placeholder: 'e.g. 100 (Leave blank for unlimited)' },
                    { key: 'category_limit', label: 'Categories Allowed', placeholder: 'e.g. 5' },
                    { key: 'images_per_product', label: 'Images / Product', placeholder: 'e.g. 4' },
                    { key: 'videos_per_product', label: 'Videos / Product', placeholder: 'e.g. 1' },
                    { key: 'featured_product_limit', label: 'Featured Products', placeholder: 'e.g. 10' },
                    { key: 'enquiries_limit', label: 'Enquiries / Month', placeholder: 'e.g. 50' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input type="number" min="0" step="1"
                        value={editingPlan.features?.[f.key] || ''} 
                        onChange={e => handleFeatureChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Type</label>
                    <input type="text"
                      value={editingPlan.features?.support_type || ''} 
                      onChange={e => handleFeatureChange('support_type', e.target.value)}
                      placeholder="e.g. Basic, Priority Email, Dedicated Manager"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Feature Toggles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {[
                    { key: 'homepage_featured', label: 'Homepage Featured' },
                    { key: 'seo_enabled', label: 'Advanced SEO' },
                    { key: 'whatsapp_button_enabled', label: 'WhatsApp Button' },
                    { key: 'contact_visible', label: 'Contact Visible' },
                    { key: 'coupons_enabled', label: 'Create Coupons' },
                    { key: 'analytics_enabled', label: 'Store Analytics' },
                    { key: 'order_management_enabled', label: 'Order Management' },
                    { key: 'inventory_management_enabled', label: 'Inventory Sync' },
                    { key: 'reviews_enabled', label: 'Customer Reviews' },
                    { key: 'verification_badge_enabled', label: 'Verification Badge' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only peer"
                          checked={editingPlan.features?.[f.key] === true || editingPlan.features?.[f.key] === "true"}
                          onChange={e => handleFeatureChange(f.key, e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#036e26]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#036e26]"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingPlan(null)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSavePlan}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#036e26] hover:bg-[#025a1f] rounded-xl transition-colors shadow-sm shadow-[#036e26]/20">
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {newPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Create New Plan
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Configure details, pricing, and specific feature limits</p>
              </div>
              <button onClick={() => setNewPlan(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="flex-1 overflow-y-auto p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name *</label>
                  <input type="text" required
                    value={newPlan.name || ''} 
                    onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="e.g. Pro Plan"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Price (₹) *</label>
                  <input type="number" required min="0" step="1"
                    value={newPlan.price || ''} 
                    onChange={e => setNewPlan({...newPlan, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Months) *</label>
                  <input type="number" required min="1" step="1"
                    value={newPlan.months || ''} 
                    onChange={e => setNewPlan({...newPlan, months: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent transition-all" />
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Quantitative Limits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { key: 'product_limit', label: 'Product Limit', placeholder: 'e.g. 100 (Leave blank for unlimited)' },
                    { key: 'category_limit', label: 'Categories Allowed', placeholder: 'e.g. 5' },
                    { key: 'images_per_product', label: 'Images / Product', placeholder: 'e.g. 4' },
                    { key: 'videos_per_product', label: 'Videos / Product', placeholder: 'e.g. 1' },
                    { key: 'featured_product_limit', label: 'Featured Products', placeholder: 'e.g. 10' },
                    { key: 'enquiries_limit', label: 'Enquiries / Month', placeholder: 'e.g. 50' },
                    { key: 'commission_percent', label: 'Commission Rate (%)', placeholder: 'e.g. 5' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                      <input type="number" min="0" step={f.key === 'commission_percent' ? '0.1' : '1'}
                        value={newPlan.features?.[f.key] || ''} 
                        onChange={e => handleFeatureChange(f.key, e.target.value, true)}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                    </div>
                  ))}
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Type</label>
                    <input type="text"
                      value={newPlan.features?.support_type || ''} 
                      onChange={e => handleFeatureChange('support_type', e.target.value, true)}
                      placeholder="e.g. Basic, Priority Email"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Feature Toggles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {[
                    { key: 'homepage_featured', label: 'Homepage Featured' },
                    { key: 'seo_enabled', label: 'Advanced SEO' },
                    { key: 'whatsapp_button_enabled', label: 'WhatsApp Button' },
                    { key: 'contact_visible', label: 'Contact Visible' },
                    { key: 'coupons_enabled', label: 'Create Coupons' },
                    { key: 'analytics_enabled', label: 'Store Analytics' },
                    { key: 'order_management_enabled', label: 'Order Management' },
                    { key: 'inventory_management_enabled', label: 'Inventory Sync' },
                    { key: 'reviews_enabled', label: 'Customer Reviews' },
                    { key: 'verification_badge_enabled', label: 'Verification Badge' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only peer"
                          checked={newPlan.features?.[f.key] === true || newPlan.features?.[f.key] === "true"}
                          onChange={e => handleFeatureChange(f.key, e.target.checked, true)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#036e26]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#036e26]"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button type="button" onClick={() => setNewPlan(null)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleAddPlan}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#036e26] hover:bg-[#025a1f] rounded-xl transition-colors shadow-sm shadow-[#036e26]/20">
                Create Plan
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
