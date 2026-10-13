import React, { useEffect, useState } from "react";
import { Ticket, Plus, Trash2, Edit2, X, Save, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const EMPTY = { code: "", type: "fixed", value: "", restriction_type: "min_amount", restriction_value: "", usage: "multiple", expires_at: "", is_active: true };

const inputCls = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:border-transparent";

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { coupon }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setForm(EMPTY); setModal({}); };
  const openEdit = (c) => {
    setForm({
      ...c,
      type: c.type || c.discount_type || "percentage",
      value: c.value || c.discount_value || "",
      restriction_type: c.restriction_type || "min_amount",
      restriction_value: c.restriction_value || c.min_order_value || "",
      usage: c.usage || "multiple",
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : ""
    });
    setModal(c);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete coupon?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/admin/coupons/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchCoupons();
  };

  const handleSave = async () => {
    if (!form.code || !form.value) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const isNew = !modal?.id;
      const url = isNew ? `${BACKEND_URL}/admin/coupons` : `${BACKEND_URL}/admin/coupons/${modal.id}`;
      await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setModal(null);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-400 text-xs mt-0.5">Manage discount codes</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-[#fe6603] hover:bg-[#e55c02] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Ticket className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">No coupons yet.</p>
          <button onClick={openAdd} className="px-5 py-2 bg-[#fe6603] text-white rounded-xl text-sm font-semibold hover:bg-[#e55c02]">
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon, i) => (
            <motion.div key={coupon.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden">
              {!coupon.is_active && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl">INACTIVE</div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                  <Ticket className="w-4 h-4" />
                  <span className="font-bold tracking-wider">{coupon.code}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(coupon)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(coupon.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">
                {(coupon.type || coupon.discount_type) === "percentage" ? `${coupon.value || coupon.discount_value}% OFF` : `₹${coupon.value || coupon.discount_value} OFF`}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Min Amount: ₹{coupon.restriction_value || coupon.min_order_value || 0}</p>
                <p>{coupon.usage === "one_time" ? "One-time use" : "Multiple uses"}</p>
                {coupon.expires_at && (
                  <p className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3.5 h-3.5" /> Expires: {new Date(coupon.expires_at).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modal?.id ? "Edit" : "Add"} Coupon</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Coupon Name</label>
                <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Discount Type</label>
                  <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                    <option value="fixed">Flat Rupees (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Value</label>
                  <div className="relative">
                    <input type="number" min="1" value={form.value} onChange={e => set("value", e.target.value)}
                      placeholder="e.g. 100" className={inputCls + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                      {form.type === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Restriction</label>
                  <select value={form.restriction_type} onChange={e => set("restriction_type", e.target.value)} className={inputCls}>
                    <option value="min_amount">Min. Amount (₹)</option>
                    <option value="min_qty">Min. Qty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {form.restriction_type === "min_qty" ? "Min. Qty" : "Min. Amount (₹)"}
                  </label>
                  <input type="number" min="0" value={form.restriction_value} onChange={e => set("restriction_value", e.target.value)}
                    placeholder={form.restriction_type === "min_qty" ? "e.g. 2" : "e.g. 500"} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Usage</label>
                  <select value={form.usage} onChange={e => set("usage", e.target.value)} className={inputCls}>
                    <option value="multiple">Multiple Times</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expiry Date (Optional)</label>
                  <input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 rounded accent-[#fe6603]" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.code || !form.value}
                className="flex-1 px-4 py-2.5 bg-[#fe6603] text-white hover:bg-[#e55c02] rounded-xl text-sm font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : <><Save className="w-4 h-4" /> {modal?.id ? "Update" : "Create"}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
