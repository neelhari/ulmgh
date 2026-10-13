import React, { useEffect, useState } from "react";
import {
  Package, CheckCircle, XCircle, X, Search, Clock, Store, Eye,
  Tag, Image, AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function ProductDetailModal({ product, onClose, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const images = Array.isArray(product.images) ? product.images : [];
  
  let customAttrs = product.custom_attributes || {};
  if (typeof customAttrs === 'string') {
    try { customAttrs = JSON.parse(customAttrs); } catch(e) {}
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{product.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Submitted by {product.store_name || product.vendor_name || "Vendor"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {(images.length > 0 || product.image_url) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" /> Images
              </p>
              <div className="flex gap-2 flex-wrap">
                {(images.length > 0 ? images : [product.image_url]).filter(Boolean).map((img, i) => (
                  <img key={i} src={img} alt={`Product ${i+1}`}
                    className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Category", value: product.category },
              { label: "Price", value: product.price ? `₹${product.price}` : "—" },
              { label: "MRP", value: product.mrp ? `₹${product.mrp}` : "—" },
              { label: "Stock", value: product.stock ?? "—" },
              { label: "Brand", value: product.brand || "—" },
              { label: "SKU", value: product.sku || "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {(product.short_description || product.description) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.short_description || product.description}</p>
            </div>
          )}

          {customAttrs && Object.keys(customAttrs).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Attributes
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(customAttrs).map(([key, val]) => {
                  const isUrl = String(val).startsWith('http');
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 overflow-hidden text-ellipsis">
                      <p className="text-[10px] text-gray-400 uppercase">{key.replace(/_/g, ' ')}</p>
                      {isUrl ? (
                        <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-orange hover:underline truncate block">
                          View Document
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-gray-700 truncate">{String(val)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          {rejecting ? (
            <div className="flex-1 flex items-center gap-3 flex-wrap">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-gray-700">Confirm reject?</p>
              <button onClick={() => { onReject(product.id); onClose(); }}
                className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors">
                Yes, Reject
              </button>
              <button onClick={() => setRejecting(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setRejecting(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-100">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => { onApprove(product.id); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#036e26] text-white font-semibold rounded-xl hover:bg-[#025a1f] transition-colors text-sm">
                <CheckCircle className="w-4 h-4" /> Approve & Publish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminProductRequestsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRequests = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/admin/product-requests`, { headers })
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => toast.error("Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    const res = await fetch(`${BACKEND_URL}/admin/product-requests/${id}/approve`, { method: "PUT", headers });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to approve");
    toast.success("✅ Product approved and published!");
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleReject = async (id) => {
    const res = await fetch(`${BACKEND_URL}/admin/product-requests/${id}/reject`, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Failed to reject");
    toast.info("Product rejected.");
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.store_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>
          {products.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {products.length} pending
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs">Review and approve or reject products submitted by vendors</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by product name, category, or vendor..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-100 text-gray-900 text-sm focus:outline-none focus:border-[#036e26]/30 shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">
            {search ? "No matching requests" : "All caught up!"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? "Try a different search term." : "No pending product requests from vendors."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <div key={product.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                {(product.image_url || (product.images && product.images[0])) ? (
                  <img
                    src={product.image_url || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {product.store_name || product.vendor_name || "Unknown Vendor"}
                  </span>
                  {product.category && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {product.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(product.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                {product.price > 0 && (
                  <p className="text-sm font-bold text-[#036e26] mt-1">₹{product.price}</p>
                )}
              </div>

              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                <Clock className="w-3 h-3" /> Pending
              </span>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedProduct(product)}
                  title="View Details"
                  className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-[#036e26]/10 hover:text-[#036e26] transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(product.id)}
                  title="Reject"
                  className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleApprove(product.id)}
                  title="Approve"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#036e26] text-white text-xs font-semibold hover:bg-[#025a1f] transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
