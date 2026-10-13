import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, IndianRupee, TrendingUp, Trash2,
  ArrowLeft, Shield, RefreshCw, ChevronDown, Search, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={`${color} rounded-2xl p-4 flex items-center gap-4`}>
      <div className="w-12 h-12 bg-white/40 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-semibold opacity-80">{label}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (user && user.role !== 'admin') { navigate('/'); return; }
  }, [token, user]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') loadStats();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'orders') loadOrders();
  }, [activeTab, token]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {}
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {}
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders);
    } catch {}
    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(users.filter(u => u.id !== id));
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrder(orderId);
    try {
      const { data } = await api.put(`/admin/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: data.order.status } : o));
    } catch {}
    setUpdatingOrder(null);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'users', label: '👥 Users' },
    { id: 'orders', label: '📦 Orders' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 text-white px-4 py-4 flex items-center gap-3 shadow-lg">
        <button onClick={() => navigate('/')} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5 text-white/80" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-300" />
          <h1 className="text-base font-bold">Admin Panel</h1>
        </div>
        <span className="ml-auto text-[11px] bg-white/20 px-2 py-1 rounded-full"><span className="text-[#fe6603]">Ind</span><span className="text-brand-orange">basket</span></span>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">Overview</h2>
              <button onClick={loadStats} className="p-1.5 text-gray-400 hover:text-gray-600">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {stats ? (
              <div className="grid grid-cols-1 gap-3">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers}
                  color="bg-gradient-to-br from-blue-500 to-blue-600 text-white" sub="Registered customers" />
                <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders}
                  color="bg-gradient-to-br from-orange-500 to-orange-600 text-white" sub="All time orders" />
                <StatCard icon={IndianRupee} label="Total Revenue"
                  value={`₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`}
                  color="bg-gradient-to-br from-green-500 to-green-600 text-white" sub="Excluding cancelled" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-xs font-bold text-gray-700 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Manage Users', action: () => setActiveTab('users'), color: 'bg-blue-50 text-blue-700' },
                  { label: 'Manage Orders', action: () => setActiveTab('orders'), color: 'bg-orange-50 text-orange-700' },
                ].map(({ label, action, color }) => (
                  <button key={label} onClick={action}
                    className={`${color} font-bold text-xs py-3 rounded-xl hover:opacity-80 transition-opacity`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
            </div>

            <p className="text-xs text-gray-500">{filteredUsers.length} users found</p>

            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {u.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                      {u.is_verified && <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">✓</span>}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  {u.role !== 'admin' && (
                    <button onClick={() => deleteUser(u.id)}
                      className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by order # or customer..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
            </div>

            <p className="text-xs text-gray-500">{filteredOrders.length} orders found</p>

            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders found</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900">#{order.order_number}</p>
                      <p className="text-[11px] text-gray-500">{order.user_name} · {order.user_email}</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={e => updateOrderStatus(order.id, e.target.value)}
                        disabled={updatingOrder === order.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white appearance-none cursor-pointer disabled:opacity-50">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
