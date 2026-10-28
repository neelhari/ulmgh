import React, { useState, useEffect } from 'react';
import { User, Store, Mail, Phone, MapPin, CreditCard, CheckCircle2, AlertTriangle, RefreshCw, Edit3, Building2, X } from 'lucide-react';
import { toast } from 'react-toastify';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    store_name: '',
    pickup_contact_name: '',
    pickup_phone: '',
    pickup_line1: '',
    pickup_line2: '',
    pickup_city: '',
    pickup_state: 'Telangana',
    pickup_pincode: '',
  });

  const token = localStorage.getItem('vendor_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/me`, { headers });
      const data = await res.json();
      if (res.ok && data.vendor) {
        setVendor(data.vendor);
        setEditForm({
          store_name: data.vendor.store_name || '',
          pickup_contact_name: data.vendor.pickup_contact_name || data.vendor.name || '',
          pickup_phone: data.vendor.pickup_phone || data.vendor.phone || '',
          pickup_line1: data.vendor.pickup_line1 || '',
          pickup_line2: data.vendor.pickup_line2 || '',
          pickup_city: data.vendor.pickup_city || '',
          pickup_state: data.vendor.pickup_state || 'Telangana',
          pickup_pincode: data.vendor.pickup_pincode || '',
        });
      }
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
            body: JSON.stringify({
              plan_id: selectedPlan.id,
              payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
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

  const handleSavePickup = async (e) => {
    e.preventDefault();
    const contact = editForm.pickup_contact_name.trim();
    if (contact.length < 2) {
      return toast.error('Contact person name must be at least 2 characters.');
    }
    const cleanPhone = editForm.pickup_phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return toast.error('Valid 10-digit Indian mobile number required.');
    }
    if (!editForm.pickup_line1.trim() || editForm.pickup_line1.trim().length < 5) {
      return toast.error('Address Line 1 is required (min 5 characters).');
    }
    if (!editForm.pickup_city.trim()) {
      return toast.error('City is required.');
    }
    if (!editForm.pickup_state.trim()) {
      return toast.error('State is required.');
    }
    const cleanPin = editForm.pickup_pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      return toast.error('Valid 6-digit Indian Pincode is required.');
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendor/profile`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_name: editForm.store_name,
          pickup_contact_name: contact,
          pickup_phone: cleanPhone,
          pickup_line1: editForm.pickup_line1.trim(),
          pickup_line2: editForm.pickup_line2.trim() || null,
          pickup_city: editForm.pickup_city.trim(),
          pickup_state: editForm.pickup_state.trim(),
          pickup_pincode: cleanPin,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update pickup location');
      toast.success('Pickup warehouse address updated successfully!');
      setShowEditModal(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading profile...</div>;
  if (!vendor) return <div className="py-12 text-center text-gray-500">Profile data not found.</div>;

  const days = daysLeft(vendor.subscription_expires_at);
  const isExpired = days !== null && days <= 0;
  const isExpiringSoon = days !== null && days > 0 && days <= 10;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Store Profile</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm font-medium">View your store and subscription details.</p>
        </div>
      </div>

      {/* Expiry Banner */}
      {(isExpired || isExpiringSoon) && (
        <div className={`flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-xs sm:text-sm ${isExpired ? 'text-red-700' : 'text-amber-700'}`}>
              {isExpired ? 'Subscription Expired' : `Subscription expiring in ${days} day${days !== 1 ? 's' : ''}`}
            </p>
            <p className={`text-[11px] sm:text-xs mt-0.5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isExpired ? 'Renew now to continue selling on ULMGH369.' : 'Renew early to avoid interruption.'}
            </p>
          </div>
          <button onClick={() => setShowPlans(true)}
            className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors min-h-[40px] ${isExpired ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
            <RefreshCw className="w-3.5 h-3.5" /> Renew
          </button>
        </div>
      )}

      {/* Missing Structured Pickup Location Banner */}
      {!vendor.pickup_pincode && (
        <div className="flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border bg-amber-50 border-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs sm:text-sm text-amber-800">Pickup Location Setup Needed</p>
            <p className="text-[11px] sm:text-xs mt-0.5 text-amber-700">Please provide your structured warehouse address and 6-digit postal pincode for courier order pickups.</p>
          </div>
          <button onClick={() => setShowEditModal(true)}
            className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors min-h-[40px]">
            <Edit3 className="w-3.5 h-3.5" /> Setup Now
          </button>
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-4 sm:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#fe6603]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-[12px] bg-orange-50 flex items-center justify-center text-[#fe6603] shadow-xs shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Subscription</h2>
          </div>
          {!isExpired && (
            <button onClick={() => setShowPlans(!showPlans)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white rounded-xl sm:rounded-[12px] text-xs sm:text-sm font-bold shadow-[0_4px_12px_rgba(254,102,3,0.3)] hover:shadow-[0_6px_16px_rgba(254,102,3,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all min-h-[44px]">
              <RefreshCw className="w-4 h-4" /> Renew / Upgrade
            </button>
          )}
        </div>

        {vendor.plan_name ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { label: 'Current Plan', value: vendor.plan_name },
              { label: 'Duration', value: `${vendor.months} month${vendor.months > 1 ? 's' : ''}` },
              { label: 'Expires On', value: vendor.subscription_expires_at ? new Date(vendor.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              { label: 'Status', value: isExpired ? 'Expired' : days !== null ? `${days} days left` : 'Active' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50/80 border border-gray-100 rounded-xl sm:rounded-[16px] p-3 sm:p-5">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{item.label}</p>
                <p className={`text-xs sm:text-base font-extrabold truncate ${item.label === 'Status' && isExpired ? 'text-red-500' : item.label === 'Status' && isExpiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 text-xs sm:text-sm mb-3">No active subscription found.</p>
            <button onClick={() => setShowPlans(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#fe6603] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#e55c02] active:bg-[#d45502] transition-colors min-h-[44px] flex items-center justify-center mx-auto">
              Subscribe Now
            </button>
          </div>
        )}

        {/* Plan Selector */}
        {showPlans && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">Select a plan to renew</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
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
                    className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all flex flex-col active:scale-[0.99] ${selectedPlan?.id === plan.id ? 'border-[#fe6603] bg-[#fe6603]/5' : 'border-gray-200 hover:border-[#fe6603]/40'}`}>
                    {selectedPlan?.id === plan.id && <CheckCircle2 className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-5 h-5 text-[#fe6603]" />}
                    <p className="font-bold text-gray-900 text-base sm:text-lg">{plan.name}</p>
                    <p className="text-[#fe6603] font-extrabold text-xl sm:text-2xl mt-1">₹{plan.price}</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-0.5 mb-3 sm:mb-4">{plan.months} month{plan.months > 1 ? 's' : ''}</p>
                    
                    <ul className="space-y-1.5 sm:space-y-2 mt-auto">
                      {featureList.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fe6603] mt-0.5 flex-shrink-0" />
                          <span>{f.label}{f.value ? `: ${f.value}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <button onClick={handleRenew} disabled={renewLoading || !selectedPlan}
              className="w-full py-3.5 bg-[#fe6603] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#e55c02] active:bg-[#d45502] transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center">
              {renewLoading ? 'Opening payment...' : selectedPlan ? `Pay ₹${selectedPlan.price}` : 'Select a plan'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fe6603]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        <div className="h-28 sm:h-40 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>
        <div className="px-4 sm:px-8 pb-6 sm:pb-10 relative z-10">
          <div className="relative flex justify-between items-end -mt-10 sm:-mt-16 mb-4 sm:mb-8">
            <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white rounded-2xl sm:rounded-[24px] shadow-md border-2 sm:border-4 border-white flex items-center justify-center text-[#fe6603] shrink-0">
              <Store className="w-9 h-9 sm:w-14 sm:h-14" />
            </div>
            <span className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border shadow-xs ${
              vendor.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
              vendor.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>{vendor.status} Status</span>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight break-words">{vendor.store_name}</h2>
              <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5 sm:mt-1">Joined {new Date(vendor.created_at).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 pt-5 sm:pt-8 border-t border-gray-100/80">
              <div className="space-y-3 sm:space-y-5">
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg mb-2 sm:mb-4">Owner Information</h3>
                {[
                  { icon: <User className="w-4 h-4 text-gray-500" />, label: 'Full Name', value: vendor.name },
                  { icon: <Mail className="w-4 h-4 text-gray-500" />, label: 'Email Address', value: vendor.email },
                  { icon: <Phone className="w-4 h-4 text-gray-500" />, label: 'Phone Number', value: vendor.phone },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 sm:gap-4 text-gray-600 bg-gray-50/50 p-2.5 sm:p-3 rounded-xl sm:rounded-[16px] border border-gray-100 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-[12px] bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-xs">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 sm:space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-lg">Pickup & Warehouse</h3>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#fe6603] text-xs font-bold rounded-xl transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Location
                  </button>
                </div>

                {/* Structured Warehouse Card */}
                <div className="bg-gray-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-[18px] border border-gray-200/70 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <MapPin className="w-4 h-4 text-[#fe6603]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dispatch Address</p>
                      {vendor.pickup_line1 ? (
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 leading-relaxed">
                          <p>{vendor.pickup_line1}</p>
                          {vendor.pickup_line2 && <p className="text-gray-600 font-normal">{vendor.pickup_line2}</p>}
                          <p className="text-gray-700">{vendor.pickup_city}, {vendor.pickup_state} — <span className="font-bold text-[#fe6603]">{vendor.pickup_pincode}</span></p>
                        </div>
                      ) : (
                        <p className="font-medium text-gray-800 text-xs sm:text-sm leading-snug mt-0.5 break-words">
                          {vendor.address || 'No address provided yet.'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium">Pickup Contact:</span>
                      <p className="font-bold text-gray-900">{vendor.pickup_contact_name || vendor.name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Pickup Mobile:</span>
                      <p className="font-bold text-gray-900">{vendor.pickup_phone || vendor.phone || '—'}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 flex flex-col gap-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Shiprocket Nickname:</span>
                      <span className="px-2 py-0.5 bg-gray-200/70 rounded-md font-mono text-[10px] font-bold text-gray-700">
                        {vendor.shiprocket_pickup_nickname || 'Auto-generated on save'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gray-500 font-medium">Shiprocket Status:</span>
                      {vendor.is_pickup_synced ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-md text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-green-600" /> Synced ({vendor.shiprocket_pickup_id ? `ID: ${vendor.shiprocket_pickup_id}` : 'Active'})
                        </span>
                      ) : vendor.pickup_sync_error ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-[10px] font-bold" title={vendor.pickup_sync_error}>
                          <AlertTriangle className="w-3 h-3 text-red-500" /> Sync Error
                        </span>
                      ) : vendor.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[10px] font-bold">
                          Pending Sync
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">
                          Syncs on approval
                        </span>
                      )}
                    </div>

                    {vendor.pickup_sync_error && (
                      <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded mt-1 border border-red-100">
                        {vendor.pickup_sync_error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Pickup Location Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe6603] flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Pickup Warehouse Address</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePickup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Store / Business Name</label>
                <input
                  type="text"
                  value={editForm.store_name}
                  onChange={(e) => setEditForm({ ...editForm, store_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    value={editForm.pickup_contact_name}
                    onChange={(e) => setEditForm({ ...editForm, pickup_contact_name: e.target.value })}
                    required
                    placeholder="Warehouse Manager"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pickup Phone (10 Digits) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editForm.pickup_phone}
                    onChange={(e) => setEditForm({ ...editForm, pickup_phone: e.target.value.replace(/\D/g, '') })}
                    required
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 1 (Building, Street, Area) *</label>
                <input
                  type="text"
                  value={editForm.pickup_line1}
                  onChange={(e) => setEditForm({ ...editForm, pickup_line1: e.target.value })}
                  required
                  placeholder="Plot No. 12, Industrial Area"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 2 (Landmark, Suite) - Optional</label>
                <input
                  type="text"
                  value={editForm.pickup_line2}
                  onChange={(e) => setEditForm({ ...editForm, pickup_line2: e.target.value })}
                  placeholder="Near Railway Station"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode (6 Digits) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={editForm.pickup_pincode}
                    onChange={(e) => setEditForm({ ...editForm, pickup_pincode: e.target.value.replace(/\D/g, '') })}
                    required
                    placeholder="505325"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={editForm.pickup_city}
                    onChange={(e) => setEditForm({ ...editForm, pickup_city: e.target.value })}
                    required
                    placeholder="Koratla"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                  <select
                    value={editForm.pickup_state}
                    onChange={(e) => setEditForm({ ...editForm, pickup_state: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603]"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#fe6603] hover:bg-[#e55c02] transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Pickup Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
