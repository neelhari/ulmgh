import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function VendorCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [categoryLimit, setCategoryLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('vendor_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, selRes] = await Promise.all([
          fetch(`${BACKEND_URL}/vendor/categories`, { headers }),
          fetch(`${BACKEND_URL}/vendor/categories/selected`, { headers })
        ]);
        
        const catsData = await catsRes.json();
        const selData = await selRes.json();
        
        if (catsRes.ok) setCategories(catsData.categories || []);
        if (selRes.ok) {
          const selected = selData.selected_categories || [];
          setSavedCategories(selected);
          setSelectedCategories(selected);
          setCategoryLimit(selData.category_limit);
        }
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isLocked = savedCategories.length > 0;
  const limitReached = categoryLimit && selectedCategories.length >= categoryLimit;

  const handleToggleCategory = (categoryName) => {
    if (isLocked) return;
    
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(prev => prev.filter(c => c !== categoryName));
    } else {
      if (limitReached) {
        toast.error(`You can only select up to ${categoryLimit} categories on your current plan.`);
        return;
      }
      setSelectedCategories(prev => [...prev, categoryName]);
    }
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category.');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendor/categories/selected`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selectedCategories })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || 'Categories saved successfully');
        setSavedCategories(selectedCategories);
      } else {
        toast.error(data.error || 'Failed to save categories');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Categories</h1>
          <p className="text-gray-500 mt-1.5 font-medium">
            {isLocked 
              ? 'Your selected categories are locked for your subscription.'
              : 'Select the categories you want to sell in.'}
          </p>
        </div>
        
        {categoryLimit && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 px-5 py-3 rounded-[16px] flex items-center gap-3 shadow-sm">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Plan Limit:</span>
            <span className="font-extrabold text-[#fe6603] text-lg">{categoryLimit} Categories</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            No categories available.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {categories.map(category => {
                const isSelected = selectedCategories.includes(category.name);
                return (
                  <div 
                    key={category.id} 
                    onClick={() => handleToggleCategory(category.name)}
                    className={`relative p-5 border rounded-[20px] transition-all group overflow-hidden ${isLocked ? 'cursor-default opacity-80' : 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1'} ${isSelected ? 'border-[#fe6603] bg-gradient-to-br from-orange-50 to-white shadow-[0_4px_20px_rgba(254,102,3,0.1)]' : 'border-gray-100 hover:border-[#fe6603]/30 bg-white'}`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-[#fe6603] text-white rounded-full p-1 shadow-md z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    <div className="relative w-full h-32 mb-4 rounded-[12px] overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-[#fe6603]/20 transition-colors">
                      <img src={category.image_url || '/placeholder.png'} alt={category.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 className={`font-extrabold text-center text-base tracking-tight ${isSelected ? 'text-[#fe6603]' : 'text-gray-900 group-hover:text-[#fe6603] transition-colors'}`}>{category.name}</h3>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-gray-100/80 pt-8">
              {isLocked ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-[16px] font-bold text-sm">
                  <Lock className="w-4 h-4" /> Categories Locked
                </div>
              ) : (
                <button 
                  onClick={handleSave} 
                  disabled={saving || selectedCategories.length === 0}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white font-bold rounded-[16px] text-sm hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  {saving ? 'Saving...' : 'Save Category Selection'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
