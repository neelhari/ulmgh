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

const ADMIN_PAGES = [
  { path: "/support/dashboard", label: "Dashboard" },
  { path: "/support/orders", label: "Orders" },
  { path: "/support/customers", label: "Customers" },
  { path: "/support/products", label: "Products" },
  { path: "/support/categories", label: "Categories" },
  { path: "/support/banners", label: "Banners" },
  { path: "/support/coupons", label: "Coupons" },
  { path: "/support/reports", label: "Reports" },
  { path: "/support/vendor-requests", label: "Vendor Requests" },
  { path: "/support/vendor-profiles", label: "Vendor Profiles" },
  { path: "/support/vendor-products", label: "Vendor Products" },
  { path: "/support/vendor-wallets", label: "Vendor Wallets" },
  { path: "/support/vendor-orders", label: "Vendor Orders" },
  { path: "/support/subscriptions", label: "Subscriptions" },
  { path: "/support/offers", label: "Offers" },
  { path: "/support/advertisements", label: "Advertisements" },
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
                placeholder={field === "email" ? "agent@ulmgh369.com" : field === "password" ? "••••••••" : "Full name"}
              />
            </div>
          ))}
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Page Access</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {ADMIN_PAGES.map(page => (
                <label key={page.path} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#036e26] focus:ring-[#036e26]"
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
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: accent }}>
            {loading ? "Adding..." : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminSupportPage() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const accent = "#036e26";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BACKEND_URL}/admin/orders`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/admin/products`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/admin/categories`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${BACKEND_URL}/admin/support-agents`, { headers }).then(r => r.json()).catch(() => ({})),
    ]).then(([o, p, c, a]) => {
      setOrders(o.orders || []);
      setProducts(p.products || []);
      setCategories(c.categories || []);
      setAgents(a.agents || []);
    }).finally(() => setLoading(false));
  }, []);

  const fetchAgents = () =>
    fetch(`${BACKEND_URL}/admin/support-agents`, { headers })
      .then(r => r.json()).then(d => setAgents(d.agents || []));

  const handleAdd = async (form) => {
    const res = await fetch(`${BACKEND_URL}/admin/support-agents`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); throw new Error(data.error); }
    toast.success("Support member added!");
    fetchAgents();
  };

  const handleToggle = async (id) => {
    const res = await fetch(`${BACKEND_URL}/admin/support-agents/${id}/toggle`, { method: "PUT", headers });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error);
    setAgents(prev => prev.map(a => a.id === id ? { ...a, is_active: data.agent.is_active } : a));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this support member?")) return;
    const res = await fetch(`${BACKEND_URL}/admin/support-agents/${id}`, { method: "DELETE", headers });
    if (!res.ok) return toast.error("Failed to delete");
    toast.success("Member removed");
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {showModal && <AddAgentModal onClose={() => setShowModal(false)} onAdd={handleAdd} accent={accent} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-400 text-xs mt-0.5">Manage support team and view orders, products, categories</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.key ? "border-[#036e26] text-[#036e26]" : "border-transparent text-gray-400 hover:text-gray-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? <p className="text-center text-gray-400 py-12">No orders found.</p>
                : orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm">#{order.order_number || order.id}</p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{order.user_name || "Guest"} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>{order.status}</span>
                      <span className="font-bold text-[#D4AF37] text-sm">₹{order.total}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "products" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.length === 0 ? <p className="text-center text-gray-400 py-12 col-span-full">No products found.</p>
                : products.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">₹{p.price}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "categories" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? <p className="text-center text-gray-400 py-12 col-span-full">No categories found.</p>
                : categories.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                    {c.image_url && <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "team" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{agents.length} member{agents.length !== 1 ? "s" : ""}</p>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#036e26] text-white rounded-xl text-sm font-semibold hover:bg-[#025a1f] transition-colors">
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No support members yet.</p>
                  <button onClick={() => setShowModal(true)}
                    className="mt-4 px-5 py-2 bg-[#036e26] text-white rounded-xl text-sm font-semibold hover:bg-[#025a1f] transition-colors">
                    Add First Member
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map(agent => (
                    <div key={agent.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#036e26]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#036e26] text-sm">
                        {agent.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{agent.name}</p>
                        <p className="text-gray-400 text-xs truncate">{agent.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${agent.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                        {agent.is_active ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => handleToggle(agent.id)} className="text-gray-400 hover:text-[#036e26] transition-colors flex-shrink-0" title="Toggle active">
                        {agent.is_active ? <ToggleRight className="w-5 h-5 text-[#036e26]" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleDelete(agent.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
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
