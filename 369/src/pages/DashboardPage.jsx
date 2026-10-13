import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Heart, MapPin, Tag, Bell, Settings,
  LogOut, ChevronRight, User, Plus, Trash2, Edit2, X, Check
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Header } from '../components/Header';

function AddressModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', line1: '', line2: '', city: '', state: '', pincode: '', mobile: '', is_default: false });
  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Add New Address</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          {[['name','Full Name'],['line1','Address Line 1'],['line2','Address Line 2 (optional)'],['city','City'],['state','State'],['pincode','Pincode'],['mobile','Mobile']].map(([field, label]) => (
            <div key={field}>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
              <input name={field} value={form[field]} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} className="accent-orange-500" />
            Set as default address
          </label>
        </div>
        <button onClick={() => onSave(form)}
          className="w-full mt-4 bg-brand-orange text-white font-bold py-3 rounded-xl text-sm hover:bg-orange-600 transition-colors">
          Save Address
        </button>
      </div>
    </div>
  );
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Edit Profile</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
        </div>
        <button onClick={() => onSave(form.name, form.phone)}
          className="w-full mt-4 bg-brand-orange text-white font-bold py-3 rounded-xl text-sm hover:bg-orange-600 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, addresses, orders, token, fetchProfile, updateProfile, addAddress, deleteAddress, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSaveAddress = async (data) => {
    await addAddress(data);
    setShowAddressModal(false);
  };

  const handleSaveProfile = async (name, phone) => {
    await updateProfile(name, phone);
    setShowEditModal(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'addresses', label: 'Addresses' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Global Header */}
      <Header title="Dashboard" />

      <div className="max-w-4xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-brand-orange text-white px-6 pt-8 pb-8 md:rounded-3xl md:mt-6 rounded-b-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 shrink-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg md:text-2xl font-bold">{user?.name || 'Loading...'}</h1>
              <p className="text-xs md:text-sm text-white/80 mt-0.5">{user?.phone || user?.email}</p>
              <button onClick={() => setShowEditModal(true)}
                className="mt-2 bg-white/20 hover:bg-white/30 text-white text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full border border-white/30 transition-colors flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 mt-6 bg-white mx-4 rounded-xl shadow-sm p-1.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs md:text-sm font-bold rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-brand-orange text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Orders', value: orders.length, color: 'bg-orange-50 text-brand-orange' },
                { label: 'Addresses', value: addresses.length, color: 'bg-blue-50 text-blue-600' },
                { label: 'Wishlist', value: 0, color: 'bg-pink-50 text-pink-600' },
              ].map((stat) => (
                <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {[
                { icon: Package, label: 'My Orders', action: () => navigate('/my-orders') },
                { icon: Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
                { icon: MapPin, label: 'Saved Addresses', action: () => navigate('/my-addresses') },
                { icon: Settings, label: 'Account Settings', action: () => navigate('/account-settings') },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors ${i !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
              <button onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors border-t border-gray-100">
                <div className="flex items-center gap-3 text-red-500">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-semibold">Logout</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">No orders yet</p>
                <Link to="/" className="mt-3 inline-block text-xs text-brand-orange font-bold">Start Shopping →</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900">#{order.order_number}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                    <p className="text-xs text-gray-600">{Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                    <p className="text-sm font-bold text-gray-900">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-3">
            <button onClick={() => setShowAddressModal(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-xl py-4 text-brand-orange text-sm font-semibold hover:bg-orange-50 transition-colors">
              <Plus className="w-4 h-4" /> Add New Address
            </button>
            {addresses.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No saved addresses</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">{addr.name}</p>
                        {addr.is_default && (
                          <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-xs text-gray-500 mt-1">{addr.mobile}</p>
                    </div>
                    <button onClick={() => deleteAddress(addr.id)} className="p-1.5 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </div>

      {showAddressModal && <AddressModal onClose={() => setShowAddressModal(false)} onSave={handleSaveAddress} />}
      {showEditModal && <EditProfileModal user={user} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />}
    </div>
  );
}

