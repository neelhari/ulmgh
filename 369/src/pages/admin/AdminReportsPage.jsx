import React, { useEffect, useState } from "react";
import { Download, TrendingUp, DollarSign, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Simulate fetching reports by just calling dashboard stats for now
    fetch(`${BACKEND_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = (type) => {
    alert(`Downloading ${type} report... (Feature coming soon)`);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-400 text-xs mt-0.5">Download data and view store performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-amber-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{stats?.totalRevenue || 0}</p>
            </div>
          </div>
          <button onClick={() => downloadReport('revenue')} className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-gray-900 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Download Sales Report
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
            </div>
          </div>
          <button onClick={() => downloadReport('orders')} className="w-full mt-2 flex items-center justify-center gap-2 bg-white text-gray-900 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Download Orders Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Export Data Center</h3>
        <div className="space-y-3">
          {[
            { title: "Products Inventory", desc: "Download full list of products, stock, and pricing", type: "products" },
            { title: "Customer Database", desc: "Download registered users and their details", type: "customers" },
            { title: "Coupon Usage", desc: "Download history of used discount codes", type: "coupons" }
          ].map((report, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-brand-orange/5">
              <div>
                <p className="font-bold text-gray-900">{report.title}</p>
                <p className="text-xs text-gray-500">{report.desc}</p>
              </div>
              <button onClick={() => downloadReport(report.type)} className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-white transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
