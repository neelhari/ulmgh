import React, { useEffect, useState } from "react";
import { Package, Plus, Trash2, Edit2, Search, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const STATUS_CONFIG = {
  approved: { label: 'Live',    cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending:  { label: 'Pending', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  draft:    { label: 'Draft',   cls: 'bg-gray-100  text-gray-600',  icon: FileText },
  rejected: { label: 'Rejected',cls: 'bg-red-100   text-red-600',   icon: XCircle },
};

export function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/products/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Product deleted");
      fetchProducts();
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-400 text-xs mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none w-full sm:w-56" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl text-sm px-3 py-2 focus:outline-none bg-white text-gray-700">
            <option value="all">All Status</option>
            <option value="approved">Live</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={() => navigate('/admin/products/new')}
            className="bg-[#036e26] text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#02561d] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Vendor</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const status = p.status || 'approved';
                const S = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                const SIcon = S.icon;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="w-full h-full object-contain p-1" />
                            : <Package className="w-5 h-5 text-gray-300" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1 max-w-[180px]">{p.name || 'Unnamed'}</p>
                          {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-gray-700 text-sm">{p.category || '—'}</p>
                        {p.subcategory && <p className="text-xs text-gray-400">{p.subcategory}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {p.vendor_id ? `Vendor #${p.vendor_id}` : 'Admin'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#036e26]">₹{p.price || 0}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.stock ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${S.cls}`}>
                        <SIcon className="w-3 h-3" /> {S.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                          className="p-1.5 text-gray-400 hover:text-[#036e26] bg-white border border-gray-200 rounded-lg shadow-sm transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p>No products found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
