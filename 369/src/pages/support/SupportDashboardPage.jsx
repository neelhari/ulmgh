import React, { useEffect, useState } from "react";
import { ShoppingBag, Package, Layers, TrendingUp } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function SupportDashboardPage() {
  const [stats, setStats] = useState({ orders: 0, products: 0, categories: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("support_token");

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BACKEND_URL}/support/orders`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/support/products`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/support/categories`, { headers }).then(r => r.json()).catch(() => ({})),
    ]).then(([o, p, c]) => {
      const orders = o.orders || [];
      setStats({ orders: orders.length, products: (p.products || []).length, categories: (c.categories || []).length });
      setRecentOrders(orders.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = {
    pending: "bg-gray-100 text-gray-700",
    paid: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const STAT_CARDS = [
    { label: "Total Orders", value: stats.orders, icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
    { label: "Total Products", value: stats.products, icon: <Package className="w-5 h-5" />, color: "text-[#036e26] bg-[#036e26]/10" },
    { label: "Categories", value: stats.categories, icon: <Layers className="w-5 h-5" />, color: "text-[#fe6603] bg-[#fe6603]/10" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-xs mt-0.5">Support overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-gray-400 text-xs">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#036e26]" />
          <h2 className="font-bold text-gray-900 text-sm">Recent Orders</h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">#{order.order_number || order.id}</p>
                  <p className="text-gray-400 text-xs truncate">{order.user_name || "Guest"} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-[#D4AF37] text-sm">₹{order.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
