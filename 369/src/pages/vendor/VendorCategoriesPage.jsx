import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Lock, 
  Edit3, 
  ArrowRight, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Package, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function VendorCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [categoryLimit, setCategoryLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Replacement Workflow State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replacementStep, setReplacementStep] = useState(1); // 1: Select Old, 2: Select New, 3: Impact & Warning
  const [oldCategory, setOldCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [acknowledgementChecked, setAcknowledgementChecked] = useState(false);
  const [replacing, setReplacing] = useState(false);

  const token = localStorage.getItem('vendor_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const loadData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const isLocked = savedCategories.length > 0;
  const limitReached = categoryLimit && selectedCategories.length >= categoryLimit;

  // Initial Onboarding Category Selection
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

  const handleSaveInitial = async () => {
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
        toast.success(data.message || 'Categories saved successfully and are now locked.');
        setSavedCategories(selectedCategories);
      } else {
        toast.error(data.error || 'Failed to save categories');
      }
    } catch (err) {
      toast.error('An error occurred while saving categories');
    } finally {
      setSaving(false);
    }
  };

  // Replacement Workflow Handlers
  const openReplacementModal = () => {
    setOldCategory('');
    setNewCategory('');
    setPreviewData(null);
    setAcknowledgementChecked(false);
    setReplacementStep(1);
    setIsModalOpen(true);
  };

  const closeReplacementModal = () => {
    if (replacing) return;
    setIsModalOpen(false);
  };

  const proceedToNewCategoryStep = () => {
    if (!oldCategory) {
      toast.warning('Please select an existing category to replace.');
      return;
    }
    setReplacementStep(2);
  };

  const proceedToImpactStep = async () => {
    if (!newCategory) {
      toast.warning('Please select a replacement category.');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendor/categories/preview-replacement`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldCategory, newCategory })
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Unable to preview replacement impact');
        return;
      }

      setPreviewData(data);
      setAcknowledgementChecked(false);
      setReplacementStep(3);
    } catch (err) {
      toast.error('Failed to communicate with server');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteReplacement = async () => {
    if (!acknowledgementChecked) {
      toast.warning('Please confirm that you have read and accept the marketplace product removal terms.');
      return;
    }

    setReplacing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendor/categories/replace`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldCategory, newCategory, confirm: true })
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Category replacement failed');
        return;
      }

      toast.success(data.message || `Successfully replaced '${oldCategory}' with '${newCategory}'!`);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Network error during category replacement');
    } finally {
      setReplacing(false);
    }
  };

  // Filter available categories for replacement (marketplace categories not already selected)
  const availableForReplacement = categories.filter(c => !savedCategories.includes(c.name));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Platform Categories</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm font-medium">
            {isLocked 
              ? 'Your selected categories are locked for your subscription.'
              : 'Select the categories you want to sell in.'}
          </p>
        </div>
        
        {categoryLimit && (
          <div className="self-start sm:self-auto bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-[16px] flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <span className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider">Plan Limit:</span>
            <span className="font-extrabold text-[#fe6603] text-sm sm:text-lg">{categoryLimit} Categories</span>
          </div>
        )}
      </div>

      {/* Main Categories Card */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 p-4 sm:p-8">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#fe6603]/20 border-t-[#fe6603] rounded-full animate-spin mb-3"></div>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium">No marketplace categories available.</p>
          </div>
        ) : (
          <>
            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {categories.map(category => {
                const isSelected = selectedCategories.includes(category.name);
                return (
                  <div 
                    key={category.id} 
                    onClick={() => handleToggleCategory(category.name)}
                    className={`relative p-3 sm:p-5 border rounded-xl sm:rounded-[20px] transition-all group overflow-hidden ${
                      isLocked ? 'cursor-default' : 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 active:scale-[0.98]'
                    } ${
                      isSelected 
                        ? 'border-[#fe6603] bg-gradient-to-br from-orange-50/70 to-white shadow-[0_4px_20px_rgba(254,102,3,0.08)]' 
                        : 'border-gray-100 hover:border-[#fe6603]/30 bg-white opacity-60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 bg-[#fe6603] text-white rounded-full p-1 shadow-md z-10">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    )}
                    <div className="relative w-full h-24 sm:h-32 mb-2.5 sm:mb-4 rounded-lg sm:rounded-[12px] overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-[#fe6603]/20 transition-colors">
                      <img 
                        src={category.image_url || '/placeholder.png'} 
                        alt={category.name} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <h3 className={`font-extrabold text-center text-xs sm:text-base tracking-tight truncate ${
                      isSelected ? 'text-[#fe6603]' : 'text-gray-900 group-hover:text-[#fe6603] transition-colors'
                    }`}>
                      {category.name}
                    </h3>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="border-t border-gray-100/80 pt-5 sm:pt-8">
              {isLocked ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Control 1: LOCKED status indicator */}
                  <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2.5 px-5 py-3.5 bg-gray-50/90 border border-gray-200 text-gray-700 rounded-xl sm:rounded-[16px] font-bold text-xs sm:text-sm min-h-[46px] shadow-xs">
                    <Lock className="w-4 h-4 text-[#fe6603]" />
                    <span>Categories Locked</span>
                    <span className="hidden md:inline text-gray-400 font-normal">| Protected by subscription</span>
                  </div>

                  {/* Control 2: EDIT / Replace Category Action */}
                  <button 
                    type="button"
                    onClick={openReplacementModal}
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white font-bold rounded-xl sm:rounded-[16px] text-xs sm:text-sm hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all min-h-[46px] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Categories</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveInitial} 
                    disabled={saving || selectedCategories.length === 0}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white font-bold rounded-xl sm:rounded-[16px] text-xs sm:text-sm hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none min-h-[46px] flex items-center justify-center shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save Category Selection'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          CONTROLLED CATEGORY REPLACEMENT MODAL
      ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-[#fe6603] flex items-center justify-center font-bold">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900">Category Replacement</h2>
                  <p className="text-xs text-gray-500">Step {replacementStep} of 3</p>
                </div>
              </div>
              <button 
                onClick={closeReplacementModal}
                disabled={replacing}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* STEP 1: Select Old Category */}
              {replacementStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                      1. Select Category to Replace
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose which of your currently assigned categories you want to remove.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                    {savedCategories.map(catName => {
                      const isSelected = oldCategory === catName;
                      return (
                        <div
                          key={catName}
                          onClick={() => setOldCategory(catName)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'border-[#fe6603] bg-orange-50/50 shadow-xs font-bold text-[#fe6603]' 
                              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-semibold truncate">{catName}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#fe6603] bg-[#fe6603]' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Select Replacement Category */}
              {replacementStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                      2. Choose Replacement Category
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Replacing <span className="font-bold text-[#fe6603]">"{oldCategory}"</span> with an eligible marketplace category.
                    </p>
                  </div>

                  {availableForReplacement.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
                      <p className="text-sm font-medium">No other available marketplace categories to choose from.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                      {availableForReplacement.map(cat => {
                        const isSelected = newCategory === cat.name;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setNewCategory(cat.name)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'border-[#fe6603] bg-orange-50/50 shadow-xs font-bold text-[#fe6603]' 
                                : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={cat.image_url || '/placeholder.png'} 
                                alt="" 
                                className="w-8 h-8 rounded-lg object-cover bg-gray-100 flex-shrink-0" 
                              />
                              <span className="text-xs sm:text-sm font-semibold truncate">{cat.name}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ml-2 ${
                              isSelected ? 'border-[#fe6603] bg-[#fe6603]' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Impact Preview & Mandatory Destructive Warning */}
              {replacementStep === 3 && previewData && (
                <div className="space-y-4">
                  {/* Category Shift Comparison Banner */}
                  <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 border border-orange-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
                    <div className="text-left flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Removing</span>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate block">{oldCategory}</span>
                    </div>
                    <div className="px-3 text-[#fe6603]">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="text-right flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block">Adding</span>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate block">{newCategory}</span>
                    </div>
                  </div>

                  {/* Affected Products Indicator */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-xs sm:text-sm font-semibold">Active Products in "{oldCategory}":</span>
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm px-2.5 py-1 bg-red-100 text-red-700 rounded-lg">
                      {previewData.affectedProductsCount} Products
                    </span>
                  </div>

                  {previewData.sampleProducts && previewData.sampleProducts.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Products to be archived: </span>
                      {previewData.sampleProducts.map(p => p.name).join(', ')}
                      {previewData.affectedProductsCount > previewData.sampleProducts.length && ' and more...'}
                    </div>
                  )}

                  {/* Mandatory Destructive Action Warning Box */}
                  <div className="p-4 bg-red-50/90 border-2 border-red-200 rounded-xl text-red-900 space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>Destructive Action Warning</span>
                    </div>

                    <p className="text-xs leading-relaxed text-red-800">
                      Replacing this category will permanently remove your existing products under the selected category from the active marketplace.
                    </p>

                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                      All products belonging to this category will be removed from:
                    </p>

                    <ul className="text-xs space-y-1 list-disc list-inside text-red-800 pl-1">
                      <li>Customer marketplace listings.</li>
                      <li>Category browsing.</li>
                      <li>Customer search results.</li>
                      <li>Vendor product listings.</li>
                      <li>Active product links.</li>
                      <li>Relevant active inventory and product-category associations.</li>
                    </ul>

                    <p className="text-xs font-semibold text-red-900 pt-1">
                      This action cannot be undone through normal vendor editing.
                    </p>

                    <p className="text-[11px] text-gray-600 bg-white/70 p-2.5 rounded-lg border border-red-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-600 inline mr-1" />
                      Your previous orders, completed transactions, invoices and financial records will remain available in historical records.
                    </p>
                  </div>

                  {/* Explicit Confirmation Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={acknowledgementChecked}
                      onChange={(e) => setAcknowledgementChecked(e.target.checked)}
                      className="mt-0.5 rounded text-[#fe6603] focus:ring-[#fe6603]"
                    />
                    <span className="text-xs text-gray-800 font-medium">
                      I understand and confirm that replacing <strong className="text-red-700">"{oldCategory}"</strong> with <strong className="text-green-700">"{newCategory}"</strong> will permanently archive all {previewData.affectedProductsCount} active products under this category.
                    </span>
                  </label>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
              {replacementStep === 1 && (
                <>
                  <button 
                    type="button"
                    onClick={closeReplacementModal}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={proceedToNewCategoryStep}
                    disabled={!oldCategory}
                    className="px-6 py-2.5 bg-[#fe6603] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#e05800] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {replacementStep === 2 && (
                <>
                  <button 
                    type="button"
                    onClick={() => setReplacementStep(1)}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={proceedToImpactStep}
                    disabled={!newCategory || previewLoading}
                    className="px-6 py-2.5 bg-[#fe6603] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#e05800] transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {previewLoading ? 'Analyzing...' : 'Preview Impact'} <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {replacementStep === 3 && (
                <>
                  <button 
                    type="button"
                    onClick={() => setReplacementStep(2)}
                    disabled={replacing}
                    className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl disabled:opacity-30"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleExecuteReplacement}
                    disabled={!acknowledgementChecked || replacing}
                    className="px-6 py-2.5 bg-red-600 text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 shadow-sm flex items-center gap-2"
                  >
                    {replacing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Replacing Category...</span>
                      </>
                    ) : (
                      <span>Confirm Replacement</span>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
