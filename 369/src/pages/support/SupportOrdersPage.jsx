import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function SupportOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("support_token");

  useEffect(() => {
    fetch(`${BACKEND_URL}/support/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  const filtered = orders.filter(o => statusFilter === "all" || o.status === statusFilter);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-400 text-xs mt-0.5">{orders.length} total</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              statusFilter === s
                ? "bg-[#036e26] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#036e26]/40"
            }`}>
            {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{orders.length === 0 ? "No orders yet." : `No ${statusFilter} orders.`}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">#{order.order_number || order.id}</span>
                    <span className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString("en-IN")}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{order.user_name || "Guest"}</p>
                </div>
                <span className="font-bold text-[#D4AF37] text-sm flex-shrink-0">₹{order.total}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded === order.id ? "rotate-180" : ""}`} />
              </div>

              {expanded === order.id && (() => {
                let items = [];
                let address = {};
                try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
                try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
                return (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Address */}
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Shipping Address</p>
                      <p className="text-sm text-gray-700">{address.name}</p>
                      <p className="text-xs text-gray-400">{address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} — {address.pincode}</p>
                      {address.mobile && <p className="text-xs text-gray-400">📞 {address.mobile}</p>}
                    </div>
                    {/* Items */}
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Items</p>
                      <div className="space-y-1.5">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate">{item.product?.name}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0 ml-2">×{item.qty} · ₹{(item.variant?.price || item.product?.price || 0) * item.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Payment */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50 text-xs text-gray-400">
                      <span>Payment: <span className="font-semibold text-gray-700 uppercase">{order.payment_method}</span></span>
                      <span>Total: <span className="font-bold text-[#D4AF37]">₹{order.total}</span></span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
