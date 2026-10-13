import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function SupportCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("support_token");

  useEffect(() => {
    fetch(`${BACKEND_URL}/support/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-400 text-xs mt-0.5">{categories.length} total</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No categories found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
              {c.image
                ? <img src={c.image} alt={c.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-14 h-14 rounded-xl bg-[#036e26]/10 flex items-center justify-center flex-shrink-0 text-[#036e26] font-bold text-lg">
                    {c.name?.[0]?.toUpperCase()}
                  </div>}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                {c.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{c.description}</p>}
                {c.product_count !== undefined && (
                  <p className="text-[#036e26] text-xs font-semibold mt-1">{c.product_count} products</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
