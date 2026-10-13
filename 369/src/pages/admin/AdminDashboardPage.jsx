import React, { useEffect, useState } from "react";
import { ShoppingBag, Users, TrendingUp, MessageCircle, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const WA_NUMBER = "919505550051";

export function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${BACKEND_URL}/admin/orders`, { headers: h }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/admin/users`, { headers: h }).then((r) => r.json()),
      fetch(`${BACKEND_URL}/admin/products`, { headers: h }).then((r) => r.json()),
    ]).then(([od, ud, pd]) => {
      if (od.orders) setOrders(od.orders);
      if (ud.users) setUsers(ud.users);
      if (pd.products) setProductsCount(pd.products.length);
    }).catch(() => {});
  }, []);

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const pending = orders.filter((o) => o.status === "paid" || o.status === "processing" || o.status === "pending").length;

  const stats = [
    { label: "Total Orders", value: orders.length, icon: <ShoppingBag className="w-6 h-6" />, color: "bg-gray-50 text-gray-900" },
    { label: "Total Revenue", value: `₹${revenue.toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: "bg-green-100 text-green-600" },
    { label: "Customers", value: users.length, icon: <Users className="w-6 h-6" />, color: "bg-blue-100 text-blue-600" },
    { label: "Pending Orders", value: pending, icon: <Clock className="w-6 h-6" />, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
    { label: "Products", value: productsCount, icon: <Package className="w-6 h-6" />, color: "bg-purple-100 text-purple-600" },
  ];

  const notifyWhatsApp = (order) => {
    const phone = order.address?.phone || order.address?.mobile || WA_NUMBER;
    const items = (order.items || []).map((i) => `${i.qty}x ${i.name}`).join(", ");
    const msg = encodeURIComponent(`Hi ${order.address?.name || "Customer"}! 🙏 Your order #${order.id} (${items}) is being prepared and will be delivered soon. Thank you for ordering!`);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-500 text-[10px] sm:text-xs font-sans">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders with WhatsApp Notify */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-3 sm:px-0">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-gray-500 text-[10px] sm:text-xs uppercase tracking-wider border-b border-brand-orange/5">
                    <th className="text-left py-3 pr-2 sm:pr-4">Order</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Customer</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Total</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Status</th>
                    <th className="text-left py-3">Notify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#036e26]/5">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="hover:bg-white/30 transition-colors">
                      <td className="py-3 pr-2 sm:pr-4 font-semibold text-gray-900 text-xs sm:text-sm">#{order.id}</td>
                      <td className="py-3 pr-2 sm:pr-4 text-gray-700 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{order.address?.name || "—"}</td>
                      <td className="py-3 pr-2 sm:pr-4 font-bold text-[#D4AF37] text-xs sm:text-sm">₹{order.total}</td>
                      <td className="py-3 pr-2 sm:pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                          order.status === "delivered" ? "bg-green-100 text-green-700" :
                          order.status === "paid" ? "bg-blue-100 text-blue-700" :
                          order.status === "shipped" ? "bg-purple-100 text-purple-700" : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        }`}>{order.status}</span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => notifyWhatsApp(order)}
                          className="flex items-center gap-1 text-[10px] sm:text-[11px] bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold transition-colors whitespace-nowrap">
                          <MessageCircle className="w-3 h-3" /> <span className="hidden sm:inline">WhatsApp</span><span className="sm:hidden">WA</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
