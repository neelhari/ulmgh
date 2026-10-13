import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Check, X, Home, Briefcase } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Header } from '../components/Header';

const FIELDS = [
  ['name', 'Full Name', 'text'],
  ['line1', 'Address Line 1', 'text'],
  ['line2', 'Address Line 2 (optional)', 'text'],
  ['city', 'City', 'text'],
  ['state', 'State', 'text'],
  ['pincode', 'Pincode', 'text'],
  ['mobile', 'Mobile Number', 'tel'],
];

function AddressForm({ onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: '', line1: '', line2: '', city: '', state: '', pincode: '', mobile: '', is_default: false });
  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-bold text-gray-900">Add New Address</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(([field, label, type]) => (
            <div key={field} className={field === 'line1' || field === 'line2' || field === 'name' ? 'col-span-2' : 'col-span-1'}>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
              <input name={field} type={type} value={form[field]} onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
          <div onClick={() => setForm({ ...form, is_default: !form.is_default })}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${form.is_default ? 'bg-brand-orange border-brand-orange' : 'border-gray-300'}`}>
            {form.is_default && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-gray-700 font-medium">Set as default address</span>
        </label>
        <button onClick={() => onSave(form)} disabled={saving}
          className="w-full mt-5 bg-brand-orange text-white font-bold py-3.5 rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </div>
  );
}

export function MyAddressesPage() {
  const navigate = useNavigate();
  const { token, addresses, fetchProfile, addAddress, deleteAddress } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  const handleSave = async (data) => {
    setSaving(true);
    await addAddress(data);
    setSaving(false);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Addresses" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold text-brand-orange">Saved Addresses</h2>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-bold text-white bg-brand-orange px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add New Address
          </button>
        </div>
        
        <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-blue-300" />
            </div>
            <p className="text-gray-500 font-semibold">No saved addresses</p>
            <p className="text-xs text-gray-400">Add an address for faster checkout</p>
            <button onClick={() => setShowForm(true)}
              className="bg-brand-orange text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors">
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative">
              {addr.is_default && (
                <span className="absolute top-3 right-12 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Default
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Home className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="flex-1 pr-8">
                  <p className="text-sm font-bold text-gray-900">{addr.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    📞 {addr.mobile}
                  </p>
                </div>
                <button onClick={() => deleteAddress(addr.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <AddressForm onClose={() => setShowForm(false)} onSave={handleSave} saving={saving} />}
      </div>
    </div>
  );
}
