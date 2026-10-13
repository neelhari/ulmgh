import React, { useState, useEffect } from 'react';
import { Search, Plus, PackageSearch, Edit2, Trash2, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const STATUS_CONFIG = {
  pending:  { label: 'Pending Review', icon: Clock,         cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Live',           icon: CheckCircle,   cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected',       icon: XCircle,       cls: 'bg-red-100 text-red-600' },
  draft:    { label: 'Draft',          icon: FileText,       cls: 'bg-gray-100 text-gray-600' },
};

export function VendorProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendor, setVendor] = useState(null);
  const [subStats, setSubStats] = useState(null);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('vendor_token');
      const res = await fetch(`${BACKEND_URL}/vendor/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        if (data.subscriptionStats) setSubStats(data.subscriptionStats);
      }
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('vendor_token')}` }
      });
      const data = await res.json();
      if (res.ok && data.vendor) setVendor(data.vendor);
    } catch {}
  };

  useEffect(() => { fetchProducts(); fetchProfile(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('vendor_token');
      const res = await fetch(`${BACKEND_URL}/vendor/products/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { toast.success('Product deleted'); fetchProducts(); }
    } catch { toast.error('Failed to delete'); }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let canAddProduct = true;
  let limitMessage = '';
  
  if (subStats && !subStats.isUnlimited) {
    if (subStats.remaining <= 0) {
      canAddProduct = false;
      limitMessage = `Subscription limit of ${subStats.max} products reached.`;
    }
  } else if (vendor?.sub_features?.product_limit) {
    // Fallback if subStats not present for some reason
    const limit = parseInt(vendor.sub_features.product_limit, 10);
    if (!isNaN(limit) && products.length >= limit) {
      canAddProduct = false;
      limitMessage = `Subscription limit of ${limit} products reached.`;
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#fe6603] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Products</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-xs font-bold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              {products.length} Added
            </span>
            {subStats && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                subStats.isUnlimited 
                  ? 'text-green-700 bg-green-50 border-green-200' 
                  : subStats.remaining === 0 
                    ? 'text-red-700 bg-red-50 border-red-200' 
                    : 'text-blue-700 bg-blue-50 border-blue-200'
              }`}>
                {subStats.isUnlimited ? 'Unlimited Plan' : `${subStats.remaining} Remaining in Plan`}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-[#fe6603]/50 focus:border-[#fe6603] w-full text-sm font-medium shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all"
            />
          </div>
          <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
            <button
              onClick={() => navigate('/vendor/products/new')}
              disabled={!canAddProduct}
              title={limitMessage}
              className="w-full sm:w-auto bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white px-5 py-3 rounded-[16px] text-sm font-bold hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              <Plus className="w-5 h-5" /> Add Product
            </button>
            {!canAddProduct && <span className="text-xs text-red-500 font-bold px-2">{limitMessage}</span>}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map(product => {
          const status = product.status || 'draft';
          const StatusIcon = STATUS_CONFIG[status]?.icon || FileText;
          const displayPrice = product.price || 0;

          return (
            <div key={product.id} className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-50/50 relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100/50">
                    <PackageSearch className="w-12 h-12" />
                  </div>
                )}
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100/50 uppercase tracking-wider">
                    {product.category || 'No Category'}
                  </span>
                </div>
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm border border-white/50 backdrop-blur-md ${STATUS_CONFIG[status]?.cls || 'bg-white/90 text-gray-600'}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {STATUS_CONFIG[status]?.label || status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col gap-2">
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{product.name}</h3>
                {product.brand && <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.brand}</p>}
                <div className="flex items-end justify-between mt-auto pt-4">
                  <p className="text-xl font-extrabold text-[#fe6603] tracking-tight">₹{displayPrice}</p>
                  {product.stock != null && (
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Stock: {product.stock}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => navigate(`/vendor/products/${product.id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-[12px] hover:bg-gray-50 hover:border-gray-300 hover:text-[#fe6603] transition-all"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 bg-white border border-red-100 rounded-[12px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <PackageSearch className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'No products match your search' : 'No products yet'}
          </h2>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try a different search term.' : 'Start selling by adding your first product!'}
          </p>
          {!searchTerm && canAddProduct && (
            <button onClick={() => navigate('/vendor/products/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#fe6603] text-white font-semibold rounded-xl hover:bg-[#e55c02] transition-colors">
              <Plus className="w-4 h-4" /> Add Your First Product
            </button>
          )}
        </div>
      )}
    </div>
  );
}
