import React, { useState, useEffect } from 'react';
import { Warehouse, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export function AdminWarehousePage() {
  const [formData, setFormData] = useState({
    pickup_contact_name: '',
    pickup_phone: '',
    pickup_line1: '',
    pickup_line2: '',
    pickup_city: '',
    pickup_state: '',
    pickup_pincode: '',
  });

  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const fetchAddress = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/warehouse-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setFormData({
          pickup_contact_name: data.address.pickup_contact_name || '',
          pickup_phone: data.address.pickup_phone || '',
          pickup_line1: data.address.pickup_line1 || '',
          pickup_line2: data.address.pickup_line2 || '',
          pickup_city: data.address.pickup_city || '',
          pickup_state: data.address.pickup_state || '',
          pickup_pincode: data.address.pickup_pincode || '',
        });
        setHasSavedAddress(true);
      } else {
        setHasSavedAddress(false);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error connecting to backend' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFeedback(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/warehouse-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'Admin pickup address saved successfully!'
        });
        setHasSavedAddress(true);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save address' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving warehouse address' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="p-2 bg-[#036e26]/10 text-[#036e26] rounded-xl">
          <Warehouse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Warehouse Address</h1>
          <p className="text-xs text-gray-500">
            Pickup address used exclusively for admin-owned products
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-7 h-7 border-3 border-[#036e26]/20 border-t-[#036e26] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-3">Loading address...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-5">
          {!hasSavedAddress && !feedback && (
            <p className="text-xs text-gray-500 italic">No admin pickup address saved.</p>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`text-xs rounded-lg px-3.5 py-2.5 flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pickup_contact_name"
                  value={formData.pickup_contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Warehouse Manager"
                  required
                  className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="pickup_phone"
                  value={formData.pickup_phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                  className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address (Line 1) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pickup_line1"
                value={formData.pickup_line1}
                onChange={handleChange}
                placeholder="Building, street, or landmark"
                required
                className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                name="pickup_line2"
                value={formData.pickup_line2}
                onChange={handleChange}
                placeholder="Suite, unit, floor, etc."
                className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pickup_city"
                  value={formData.pickup_city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                  className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="pickup_state"
                  value={formData.pickup_state}
                  onChange={handleChange}
                  required
                  className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pickup_pincode"
                  value={formData.pickup_pincode}
                  onChange={handleChange}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  required
                  className="w-full text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#036e26]/20 focus:border-[#036e26]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#036e26] hover:bg-[#02581f] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Address'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

