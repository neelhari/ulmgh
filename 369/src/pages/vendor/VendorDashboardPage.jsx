import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, IndianRupee, Clock, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function VendorDashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('vendor_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchStats = fetch(`${BACKEND_URL}/vendor/stats`, { headers }).then(r => r.json());
    const fetchOrders = fetch(`${BACKEND_URL}/vendor/orders`, { headers }).then(r => r.json());

    Promise.all([fetchStats, fetchOrders])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        setRecentOrders((ordersData.orders || []).slice(0, 5));
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s) => {
    const map = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    return map[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm font-medium">Welcome back! Here's how your store is performing today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Total Revenue */}
        <div className="group bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-[#fe6603]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#fe6603] to-[#e55c02] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#fe6603]/30 flex-shrink-0">
            <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold text-gray-400 tracking-wider uppercase mb-0.5">Total Revenue</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {loading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
            </h3>
          </div>
        </div>

        {/* Total Orders */}
        <div className="group bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold text-gray-400 tracking-wider uppercase mb-0.5">Total Orders</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {loading ? '...' : stats.totalOrders}
            </h3>
          </div>
        </div>

        {/* Active Products */}
        <div className="group bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#036e26] to-[#024f1b] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#036e26]/30 flex-shrink-0">
            <Package className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold text-gray-400 tracking-wider uppercase mb-0.5">Active Products</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {loading ? '...' : stats.totalProducts}
            </h3>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100/90 overflow-hidden mt-6 sm:mt-8">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-gray-50/50 to-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-gray-900">Recent Orders</h3>
          </div>
          <button
            onClick={() => navigate('/vendor/orders')}
            className="text-xs sm:text-sm font-bold text-[#fe6603] hover:text-[#e55c02] transition-colors flex items-center gap-1 group py-1.5 px-2 rounded-lg"
          >
            View All <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium text-sm">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Orders from customers will appear here.</p>
          </div>
        ) : (
          <>
            {/* 1. Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-3 font-medium">Order</th>
                    <th className="text-left px-6 py-3 font-medium">Customer</th>
                    <th className="text-left px-6 py-3 font-medium">Items</th>
                    <th className="text-left px-6 py-3 font-medium">Total</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(order => {
                    let items = [];
                    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
                    let addr = {};
                    try { addr = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded-md">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{addr.name || '-'}</p>
                          <p className="text-xs text-gray-400">{addr.mobile || ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {items.slice(0, 2).map((item, i) => (
                              <img key={i} src={item.product?.image_url || item.product?.images?.[0] || ''} alt="" className="w-8 h-8 rounded-md object-cover border border-gray-100" />
                            ))}
                            <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">₹{parseFloat(order.total || 0).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Mobile Responsive Order Cards (< md) */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentOrders.map(order => {
                let items = [];
                try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
                let addr = {};
                try { addr = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

                return (
                  <div
                    key={order.id}
                    onClick={() => navigate('/vendor/orders')}
                    className="p-4 active:bg-orange-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md">
                        #{order.order_number || order.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-2.5">
                      <p className="font-semibold text-gray-900 truncate">{addr.name || 'Customer'}</p>
                      <span className="flex-shrink-0">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {items.slice(0, 2).map((item, i) => (
                          <img
                            key={i}
                            src={item.product?.image_url || item.product?.images?.[0] || ''}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover border border-gray-100 flex-shrink-0"
                          />
                        ))}
                        <span className="text-[11px] text-gray-500 truncate">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-extrabold text-sm text-[#fe6603]">
                          ₹{parseFloat(order.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
