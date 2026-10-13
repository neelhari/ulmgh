import React, { useEffect, useState } from "react";
import { ShoppingBag, Package, Layers, Users, Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { toast } from "react-toastify";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const TABS = [
  { key: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
  { key: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { key: "categories", label: "Categories", icon: <Layers className="w-4 h-4" /> },
  { key: "team", label: "Support Team", icon: <Users className="w-4 h-4" /> },
];

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const VENDOR_PAGES = [
  { path: "/support/dashboard", label: "Dashboard" },
  { path: "/support/orders", label: "Orders" },
  { path: "/support/products", label: "Products" },
  { path: "/support/categories", label: "Categories" },
  { path: "/support/wallet", label: "Virtual Wallet" },
  { path: "/support/profile", label: "Profile" },
  { path: "/support/offers", label: "Offers" },
];

function AddAgentModal({ onClose, onAdd, accent }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", access_pages: [] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Add Support Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["name", "email", "password"].map(field => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 capitalize">{field}</label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": accent }}
                placeholder={field === "email" ? "agent@vendor.com" : field === "password" ? "••••••••" : "Full name"}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Page Access</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {VENDOR_PAGES.map(page => (
                <label key={page.path} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#fe6603] focus:ring-[#fe6603]"
                    checked={form.access_pages.includes(page.path)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm(p => ({ ...p, access_pages: [...p.access_pages, page.path] }));
                      } else {
                        setForm(p => ({ ...p, access_pages: p.access_pages.filter(path => path !== page.path) }));
                      }
                    }}
                  />
                  {page.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[#fe6603] text-white text-sm font-semibold hover:bg-[#e55c02] transition-colors disabled:opacity-50">
            {loading ? "Adding..." : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function VendorSupportPage() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("vendor_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BACKEND_URL}/vendor/orders`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/vendor/products`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/vendor/categories`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/vendor/support-agents`, { headers }).then(r => r.json()).catch(() => ({})),
    ]).then(([o, p, c, a]) => {
      setOrders(o.orders || []);
      setProducts(p.products || []);
      setCategories(c.categories || []);
      setAgents(a.agents || []);
    }).finally(() => setLoading(false));
  }, []);

  const fetchAgents = () =>
    fetch(`${BACKEND_URL}/vendor/support-agents`, { headers })
      .then(r => r.json()).then(d => setAgents(d.agents || []));

  const handleAdd = async (form) => {
    const res = await fetch(`${BACKEND_URL}/vendor/support-agents`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); throw new Error(data.error); }
    toast.success("Support member added!");
    fetchAgents();
  };

  const handleToggle = async (id) => {
    const res = await fetch(`${BACKEND_URL}/vendor/support-agents/${id}/toggle`, { method: "PUT", headers });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    setAgents(prev => prev.map(a => a.id === id ? { ...a, is_active: data.agent.is_active } : a));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this support member?")) return;
    const res = await fetch(`${BACKEND_URL}/vendor/support-agents/${id}`, { method: "DELETE", headers });
    if (!res.ok) return toast.error("Failed to delete");
    toast.success("Member removed");
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {showModal && <AddAgentModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Support</h1>
          <p className="text-gray-500 mt-1.5 font-medium">Manage your support team and view orders, products, categories.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b border-gray-100 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all -mb-[5px] whitespace-nowrap ${
              tab === t.key ? "border-[#fe6603] text-[#fe6603]" : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-t-xl"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#fe6603] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? <p className="text-center text-gray-400 py-12">No orders found.</p>
                : orders.map(order => (
                  <div key={order.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-5 flex items-center justify-between gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all">
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 text-base">#{order.order_number || order.id}</p>
                      <p className="text-gray-500 font-medium text-sm mt-0.5 truncate">{order.user_name || "Guest"} · <span className="text-gray-400">{new Date(order.created_at).toLocaleDateString("en-IN")}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                      <span className="font-extrabold text-[#D4AF37] text-lg">₹{order.total}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "products" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.length === 0 ? <p className="text-center text-gray-400 py-12 col-span-full">No products found.</p>
                : products.map(p => (
                  <div key={p.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-4 flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="w-16 h-16 rounded-[12px] bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-gray-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-base truncate">{p.name}</p>
                      <p className="text-[#fe6603] font-bold mt-1">₹{p.price}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "categories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.length === 0 ? <p className="text-center text-gray-400 py-12 col-span-full">No categories found.</p>
                : categories.map(c => (
                  <div key={c.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-4 flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                    <div className="w-14 h-14 rounded-[12px] bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100">
                      {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <Layers className="w-6 h-6 text-gray-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-base truncate">{c.name}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "team" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-gray-500">{agents.length} member{agents.length !== 1 ? "s" : ""}</p>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white rounded-[12px] text-sm font-bold shadow-[0_4px_12px_rgba(254,102,3,0.3)] hover:shadow-[0_6px_16px_rgba(254,102,3,0.4)] hover:-translate-y-0.5 transition-all">
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-100 p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium mb-4">No support members yet.</p>
                  <button onClick={() => setShowModal(true)}
                    className="px-6 py-3 bg-[#fe6603] text-white rounded-xl text-sm font-bold hover:bg-[#e55c02] transition-colors">
                    Add First Member
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="bg-white rounded-[20px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-5 flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fe6603]/10 to-[#ff7b23]/10 flex items-center justify-center flex-shrink-0 font-extrabold text-[#fe6603] text-lg border border-[#fe6603]/20">
                        {agent.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-gray-900 text-base">{agent.name}</p>
                        <p className="text-gray-500 font-medium text-sm truncate">{agent.email}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${agent.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => handleToggle(agent.id)} className="text-gray-400 hover:text-[#fe6603] transition-colors p-2 hover:bg-orange-50 rounded-xl flex-shrink-0">
                        {agent.is_active ? <ToggleRight className="w-6 h-6 text-[#fe6603]" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="text-gray-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-xl flex-shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
