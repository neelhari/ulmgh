import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Megaphone, Target, Search, X, Image as ImageIcon, Video, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const AD_TYPES = [
  { value: 'homepage_top_banner', label: 'Homepage Top Banner', group: 'Banners' },
  { value: 'homepage_slider_banner', label: 'Homepage Slider Banner', group: 'Banners' },
  { value: 'category_page_banner', label: 'Category Page Banner', group: 'Banners' },
  { value: 'featured_vendor', label: 'Featured Vendor', group: 'Spotlights' },
  { value: 'featured_product', label: 'Featured Product', group: 'Spotlights' },
  { value: 'search_priority', label: 'Search Priority', group: 'Boosts' },
  { value: 'top_seller_badge', label: '"Top Seller" Badge', group: 'Badges' },
  { value: 'new_arrival_highlight', label: 'New Arrival Highlight', group: 'Badges' },
  { value: 'deal_of_the_day', label: 'Deal of the Day', group: 'Promotions' },
  { value: 'festival_promotion', label: 'Festival Promotion', group: 'Promotions' },
  { value: 'blog_article_promotion', label: 'Blog/Article Promotion', group: 'Content' },
  { value: 'video_advertisement', label: 'Video Advertisement', group: 'Content' },
  { value: 'sponsored_category', label: 'Sponsored Category', group: 'Spotlights' }
];

export function AdminAdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'homepage_top_banner',
    title: '',
    image_url: '',
    video_url: '',
    link_url: '',
    target_id: '',
    is_active: true,
    valid_from: '',
    valid_until: '',
  });

  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAds = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/advertisements`, { headers });
      const data = await res.json();
      if (res.ok) setAds(data.advertisements || []);
    } catch (err) {
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const formatLocalDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        type: ad.type,
        title: ad.title || '',
        image_url: ad.image_url || '',
        video_url: ad.video_url || '',
        link_url: ad.link_url || '',
        target_id: ad.target_id || '',
        is_active: ad.is_active,
        valid_from: formatLocalDateTime(ad.valid_from),
        valid_until: formatLocalDateTime(ad.valid_until),
      });
    } else {
      setEditingAd(null);
      setFormData({
        type: 'homepage_top_banner',
        title: '',
        image_url: '',
        video_url: '',
        link_url: '',
        target_id: '',
        is_active: true,
        valid_from: '',
        valid_until: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, [field]: data.url }));
        toast.success('Upload successful');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAd 
        ? `${BACKEND_URL}/advertisements/${editingAd.id}` 
        : `${BACKEND_URL}/advertisements`;
      const method = editingAd ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        target_id: formData.target_id ? parseInt(formData.target_id, 10) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save advertisement');
      
      toast.success(editingAd ? 'Advertisement updated' : 'Advertisement created');
      setIsModalOpen(false);
      fetchAds();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/advertisements/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        toast.success('Advertisement deleted');
        fetchAds();
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getTypeLabel = (typeValue) => {
    return AD_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  const isBannerType = ['homepage_top_banner', 'homepage_slider_banner', 'category_page_banner', 'festival_promotion', 'blog_article_promotion'].includes(formData.type);
  const isTargetType = ['featured_vendor', 'featured_product', 'sponsored_category', 'top_seller_badge', 'deal_of_the_day', 'new_arrival_highlight', 'search_priority'].includes(formData.type);
  const isVideoType = ['video_advertisement'].includes(formData.type);

  const getBannerDimensions = (type) => {
    switch (type) {
      case 'homepage_top_banner': return '1920 × 400 px';
      case 'homepage_slider_banner': return '1200 × 600 px';
      case 'category_page_banner': return '1200 × 300 px';
      default: return '1200 × 400 px';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Options</h1>
          <p className="text-gray-400 text-sm mt-1">Manage dynamic banners, boosts, and promotions across the platform.</p>
        </div>
        <button onClick={() => handleOpenModal()} 
          className="bg-[#036e26] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#025a1f] transition-colors flex items-center gap-2 shadow-sm shadow-[#036e26]/20">
          <Plus className="w-5 h-5" /> Add Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Megaphone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Advertisements</h3>
            <p className="text-gray-500">Create your first promotion to highlight products or vendors.</p>
          </div>
        ) : (
          ads.map(ad => (
            <div key={ad.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${ad.is_active ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
              
              {/* Preview Area */}
              <div className="h-40 bg-gray-50 relative flex items-center justify-center border-b border-gray-100 p-4">
                {ad.image_url ? (
                  <img src={ad.image_url} alt="" className="w-full h-full object-contain" />
                ) : ad.video_url ? (
                  <div className="text-center text-gray-400">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-semibold">Video Ad</span>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <span className="text-xs font-semibold">Target ID: {ad.target_id || 'N/A'}</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold mb-2">
                    {getTypeLabel(ad.type)}
                  </span>
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{ad.title || 'Untitled Promotion'}</h3>
                  {ad.link_url && <p className="text-xs text-blue-500 truncate mt-1">Link: {ad.link_url}</p>}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => handleOpenModal(ad)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors border border-gray-200">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors border border-red-100">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#036e26]" />
                {editingAd ? 'Edit Promotion' : 'Create New Promotion'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Advertisement Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent font-medium"
                    required
                  >
                    {Array.from(new Set(AD_TYPES.map(t => t.group))).map(group => (
                      <optgroup key={group} label={group}>
                        {AD_TYPES.filter(t => t.group === group).map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Internal Title / Name</label>
                  <input type="text" required
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Diwali Mega Sale Banner"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                </div>
              </div>

              {isBannerType && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-900">Upload Banner Image</label>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">Recommended: {getBannerDimensions(formData.type)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {formData.image_url && (
                        <div className="w-32 h-20 bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0">
                          <img src={formData.image_url} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-600">{uploading ? 'Uploading...' : 'Choose Image File'}</span>
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'image_url')} />
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Redirect Link (URL)</label>
                    <input type="url" 
                      value={formData.link_url} 
                      onChange={e => setFormData({...formData, link_url: e.target.value})}
                      placeholder="https://ulmgh369.com/category/electronics"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                  </div>
                </div>
              )}

              {isVideoType && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Video URL (YouTube/MP4)</label>
                    <input type="url" required
                      value={formData.video_url} 
                      onChange={e => setFormData({...formData, video_url: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Redirect Link (Optional)</label>
                    <input type="url" 
                      value={formData.link_url} 
                      onChange={e => setFormData({...formData, link_url: e.target.value})}
                      placeholder="https://ulmgh369.com/promo"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                  </div>
                </div>
              )}

              {isTargetType && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Target ID (Product / Vendor / Category ID)</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="number" required
                          value={formData.target_id} 
                          onChange={e => setFormData({...formData, target_id: e.target.value})}
                          placeholder={`Enter ${formData.type.includes('vendor') ? 'Vendor' : formData.type.includes('category') ? 'Category' : 'Product'} ID`}
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent" />
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 mt-2 font-medium">This ID connects the promotion directly to the specific entity in the database.</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">Promotion Status</h4>
                    <p className="text-xs text-gray-500">Toggle whether this ad is currently visible on the platform.</p>
                  </div>
                  <label className="relative flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#036e26]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#036e26]"></div>
                  </label>
                </div>
                
                <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Start Time (Optional)</label>
                    <input type="datetime-local" 
                      value={formData.valid_from} 
                      onChange={e => setFormData({...formData, valid_from: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">End Time (Optional)</label>
                    <input type="datetime-local" 
                      value={formData.valid_until} 
                      onChange={e => setFormData({...formData, valid_until: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#036e26] focus:border-transparent text-sm" />
                    <p className="text-xs text-gray-500 mt-1">Ad will automatically hide after this time</p>
                  </div>
                </div>
              </div>

            </form>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={uploading}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#036e26] hover:bg-[#025a1f] rounded-xl transition-colors shadow-sm shadow-[#036e26]/20 disabled:opacity-50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {editingAd ? 'Save Changes' : 'Publish Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
