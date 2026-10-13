import React, { useState, useEffect } from 'react';
import { User, Store, Mail, Phone, MapPin, CreditCard, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function VendorProfilePage() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [renewLoading, setRenewLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const token = localStorage.getItem('vendor_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/me`, { headers });
      const data = await res.json();
      if (res.ok && data.vendor) setVendor(data.vendor);
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProfile();
    fetch(`${BACKEND_URL}/subscriptions/plans`)
      .then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {});
  }, []);

  const handleRenew = async () => {
    if (!selectedPlan) return toast.error('Select a plan first');
    setRenewLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/create-order`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'ULMGH369',
        description: `${selectedPlan.name} Vendor Subscription`,
        order_id: data.order.id,
        handler: async (response) => {
          const subRes = await fetch(`${BACKEND_URL}/subscriptions/subscribe`, {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: selectedPlan.id, payment_id: response.razorpay_payment_id }),
          });
          const subData = await subRes.json();
          if (!subRes.ok) return toast.error(subData.error);
          toast.success('Subscription renewed!');
          setShowPlans(false);
          fetchProfile();
        },
        prefill: { name: vendor?.name, email: vendor?.email, contact: vendor?.phone },
        theme: { color: '#fe6603' },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRenewLoading(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading profile...</div>;
  if (!vendor) return <div className="py-12 text-center text-gray-500">Profile data not found.</div>;

  const days = daysLeft(vendor.subscription_expires_at);
  const isExpired = days !== null && days <= 0;
  const isExpiringSoon = days !== null && days > 0 && days <= 10;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Store Profile</h1>
          <p className="text-gray-500 mt-1.5 font-medium">View your store and subscription details.</p>
        </div>
      </div>

      {/* Expiry Banner */}
      {(isExpired || isExpiringSoon) && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
              {isExpired ? 'Subscription Expired' : `Subscription expiring in ${days} day${days !== 1 ? 's' : ''}`}
            </p>
            <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isExpired ? 'Renew now to continue selling on ULMGH369.' : 'Renew early to avoid interruption.'}
            </p>
          </div>
          <button onClick={() => setShowPlans(true)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors ${isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
            <RefreshCw className="w-3.5 h-3.5" /> Renew
          </button>
        </div>
      )}

      {/* No subscription at all */}
      {!vendor.plan_name && !vendor.subscription_expires_at && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border bg-red-50 border-red-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-red-700">No Active Subscription</p>
            <p className="text-xs mt-0.5 text-red-600">Your products are currently hidden from customers. Subscribe to start selling.</p>
          </div>
          <button onClick={() => setShowPlans(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
            <CreditCard className="w-3.5 h-3.5" /> Subscribe
          </button>
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#fe6603]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-orange-50 flex items-center justify-center text-[#fe6603] shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
          </div>
          {!isExpired && (
            <button onClick={() => setShowPlans(!showPlans)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white rounded-[12px] text-sm font-bold shadow-[0_4px_12px_rgba(254,102,3,0.3)] hover:shadow-[0_6px_16px_rgba(254,102,3,0.4)] hover:-translate-y-0.5 transition-all">
              <RefreshCw className="w-4 h-4" /> Renew / Upgrade
            </button>
          )}
        </div>

        {vendor.plan_name ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Current Plan', value: vendor.plan_name },
              { label: 'Duration', value: `${vendor.months} month${vendor.months > 1 ? 's' : ''}` },
              { label: 'Expires On', value: vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Status', value: isExpired ? 'Expired' : days !== null ? `${days} days left` : 'Active' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50/80 border border-gray-100 rounded-[16px] p-5">
                <p className="text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{item.label}</p>
                <p className={`text-base font-extrabold ${item.label === 'Status' && isExpired ? 'text-red-500' : item.label === 'Status' && isExpiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm mb-3">No active subscription found.</p>
            <button onClick={() => setShowPlans(true)}
              className="px-5 py-2 bg-[#fe6603] text-white rounded-xl text-sm font-semibold hover:bg-[#e55c02] transition-colors">
              Subscribe Now
            </button>
          </div>
        )}

        {/* Plan Selector */}
        {showPlans && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Select a plan to renew</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {plans.map(plan => {
                const features = plan.features || {};
                const featureList = [
                  { label: 'Products', value: features.product_limit || 'Unlimited' },
                  { label: 'Commission', value: `${features.commission_percent || '0'}%` },
                  features.seo_enabled ? { label: 'Advanced SEO' } : null,
                  features.verification_badge_enabled ? { label: 'Verification Badge' } : null,
                ].filter(Boolean);

                return (
                  <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan)}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all flex flex-col ${selectedPlan?.id === plan.id ? 'border-[#fe6603] bg-[#fe6603]/5' : 'border-gray-200 hover:border-[#fe6603]/40'}`}>
                    {selectedPlan?.id === plan.id && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#fe6603]" />}
                    <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
                    <p className="text-[#fe6603] font-extrabold text-2xl mt-1">₹{plan.price}</p>
                    <p className="text-gray-500 text-sm mt-0.5 mb-4">{plan.months} month{plan.months > 1 ? 's' : ''}</p>
                    
                    <ul className="space-y-2 mt-auto">
                      {featureList.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#fe6603] mt-0.5 flex-shrink-0" />
                          <span>{f.label}{f.value ? `: ${f.value}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <button onClick={handleRenew} disabled={renewLoading || !selectedPlan}
              className="w-full py-3 bg-[#fe6603] text-white rounded-xl text-sm font-semibold hover:bg-[#e55c02] transition-colors disabled:opacity-50">
              {renewLoading ? 'Opening payment...' : selectedPlan ? `Pay ₹${selectedPlan.price}` : 'Select a plan'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fe6603]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        <div className="h-40 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>
        <div className="px-8 pb-10 relative z-10">
          <div className="relative flex justify-between items-end -mt-16 mb-8">
            <div className="w-32 h-32 bg-white rounded-[24px] shadow-lg border-4 border-white flex items-center justify-center text-[#fe6603]">
              <Store className="w-14 h-14" />
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-sm ${
              vendor.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
              vendor.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>{vendor.status} Status</span>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{vendor.store_name}</h2>
              <p className="text-gray-500 font-medium mt-1">Joined {new Date(vendor.created_at).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-100/80">
              <div className="space-y-5">
                <h3 className="font-extrabold text-gray-900 text-lg mb-4">Owner Information</h3>
                {[
                  { icon: <User className="w-4 h-4 text-gray-500" />, label: 'Full Name', value: vendor.name },
                  { icon: <Mail className="w-4 h-4 text-gray-500" />, label: 'Email Address', value: vendor.email },
                  { icon: <Phone className="w-4 h-4 text-gray-500" />, label: 'Phone Number', value: vendor.phone },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 text-gray-600 bg-gray-50/50 p-3 rounded-[16px] border border-gray-100">
                    <div className="w-10 h-10 rounded-[12px] bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-5">
                <h3 className="font-extrabold text-gray-900 text-lg mb-4">Business Information</h3>
                <div className="flex items-start gap-4 text-gray-600 bg-gray-50/50 p-3 rounded-[16px] border border-gray-100">
                  <div className="w-10 h-10 rounded-[12px] bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Store Address</p>
                    <p className="font-bold text-gray-900 leading-snug mt-0.5">{vendor.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
