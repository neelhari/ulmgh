import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Send, Trash2, Upload, X, Plus, ChevronRight,
  Package, Image, DollarSign, Truck, Search, FileText, MapPin, Tag, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const TABS = [
  { id: 'basic',    label: 'Basic Info',    icon: Package },
  { id: 'media',    label: 'Media',         icon: Image },
  { id: 'pricing',  label: 'Pricing & Stock', icon: DollarSign },
  { id: 'shipping', label: 'Shipping',      icon: Truck },
  { id: 'seo',      label: 'SEO & Tags',    icon: Search },
  { id: 'extra',    label: 'More Info',     icon: FileText },
];

const STOCK_STATUS_OPTS = ['In Stock', 'Out of Stock', 'Pre Order', 'On Backorder'];
const CONDITION_OPTS = ['New', 'Used', 'Refurbished', 'Open Box'];
const PRODUCT_TYPE_OPTS = ['Physical', 'Digital', 'Service'];

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 border border-gray-200 rounded-[12px] text-sm text-gray-900 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-4 py-3 border border-gray-200 rounded-[12px] text-sm text-gray-900 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner resize-none ${className}`}
      {...props}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-4 py-3 border border-gray-200 rounded-[12px] text-sm text-gray-900 bg-gray-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
      {title && <h3 className="text-base font-extrabold text-gray-900 mb-6 pb-4 border-b border-gray-100/80 tracking-tight">{title}</h3>}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function VendorProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categoryCustomFields, setCategoryCustomFields] = useState([]);
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    // Basic
    name: '', sku: '', barcode: '', product_code: '', brand: '', gender: 'Any',
    category: '', subcategory: '', product_type: 'Physical', condition: 'New',
    description: '', short_description: '',
    // Media
    image_url: '', images: [], video_url: '', view_360_url: '',
    // Pricing & Stock
    price: '', mrp: '', sale_price: '', cost_price: '', gst_percent: '',
    stock: '', stock_status: 'In Stock', min_order_qty: 1, max_order_qty: '',
    low_stock_alert: '', cod_available: true,
    // Shipping & Physical
    weight: '', shipping_weight: '', length: '', width: '', height: '',
    material: '', free_shipping: false,
    // SEO & Tags
    seo_title: '', seo_keywords: '', meta_description: '', search_tags: [],
    status: 'draft',
    // Policies
    warranty: '', return_policy: '', replacement_policy: '', refund_available: false,
    // Docs & Files
    user_manual_url: '', brochure_url: '', certificate_urls: [],
    // Location & Contact
    pickup_location: '', warehouse: '', available_cities: '',
    manufacturer_name: '', country_of_origin: '', hsn_code: '',
    gst_number: '', contact_number: '', whatsapp_number: '', vendor_email: '',
    return_eligible: true, exchange_available: true, replacement_only: false,
    return_shipping_applicable: false, seller_approval_required: false,
    return_window: '7', return_instructions: '',
    // Category custom fields
    custom_attributes: {},
  });

  const token = localStorage.getItem('vendor_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const init = async () => {
      const cats = await fetchCategories();
      if (isEdit) fetchProduct(cats);
    };
    init();
  }, [id]);

  const fetchCategories = async () => {
    const res = await fetch(`${BACKEND_URL}/vendor/categories`, { headers });
    const data = await res.json();
    let cats = data.categories || [];

    try {
      const selRes = await fetch(`${BACKEND_URL}/vendor/categories/selected`, { headers });
      const selData = await selRes.json();
      if (selData.category_limit && selData.selected_categories) {
        cats = cats.filter(c => selData.selected_categories.includes(c.name));
      }
    } catch (e) {
      console.warn("Could not fetch selected categories");
    }

    setCategories(cats);
    return cats;
  };

  const fetchProduct = async (cats) => {
    const res = await fetch(`${BACKEND_URL}/vendor/products`, { headers });
    const data = await res.json();
    const product = (data.products || []).find(p => String(p.id) === String(id));
    if (product) {
      const attrs = typeof product.custom_attributes === 'string'
        ? JSON.parse(product.custom_attributes || '{}')
        : (product.custom_attributes || {});
      setForm(prev => ({
        ...prev, ...product,
        gender: product.gender || 'Any',
        images: Array.isArray(product.images) ? product.images : [],
        search_tags: attrs.search_tags || [],
        certificate_urls: attrs.certificate_urls || [],
        video_url: attrs.video_url || '',
        view_360_url: attrs.view_360_url || '',
        user_manual_url: attrs.user_manual_url || '',
        brochure_url: attrs.brochure_url || '',
        pickup_location: attrs.pickup_location || '',
        warehouse: attrs.warehouse || '',
        available_cities: attrs.available_cities || '',
        manufacturer_name: attrs.manufacturer_name || '',
        country_of_origin: attrs.country_of_origin || '',
        gst_number: attrs.gst_number || '',
        contact_number: attrs.contact_number || '',
        whatsapp_number: attrs.whatsapp_number || '',
        vendor_email: attrs.vendor_email || '',
        product_code: attrs.product_code || '',
        product_type: attrs.product_type || 'Physical',
        condition: attrs.condition || 'New',
        seo_title: attrs.seo_title || '',
        seo_keywords: attrs.seo_keywords || '',
        meta_description: attrs.meta_description || '',
        refund_available: attrs.refund_available || false,
        return_eligible: attrs.return_eligible ?? true,
        exchange_available: attrs.exchange_available ?? true,
        replacement_only: attrs.replacement_only || false,
        return_shipping_applicable: attrs.return_shipping_applicable || false,
        seller_approval_required: attrs.seller_approval_required || false,
        return_window: attrs.return_window || '7',
        return_instructions: attrs.return_instructions || '',
        shipping_weight: attrs.shipping_weight || '',
        custom_attributes: attrs,
      }));

      // Use the cats param (already loaded) — fixes race condition
      const cat = (cats || []).find(c => c.name === product.category);
      if (cat) {
        setSubcategories(cat.subcategories || []);
        setCategoryCustomFields(cat.custom_fields || []);
      }
    }
  };

  const handleCategoryChange = (catName) => {
    setForm(prev => ({ ...prev, category: catName, subcategory: '' }));
    const cat = categories.find(c => c.name === catName);
    setSubcategories(cat?.subcategories || []);
    setCategoryCustomFields(cat?.custom_fields || []);
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setCustomAttr = (field, value) => setForm(prev => ({
    ...prev, custom_attributes: { ...prev.custom_attributes, [field]: value }
  }));

  // Image Upload
  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BACKEND_URL}/admin/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    return data.url;
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField('main');
    try {
      const url = await uploadFile(file);
      if (url) set('image_url', url);
    } catch { toast.error('Upload failed'); }
    finally { setUploadingField(null); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      set('images', [...(form.images || []), ...urls.filter(Boolean)]);
    } catch { toast.error('Upload failed'); }
    finally { setUploadingImages(false); }
  };

  const handleDocUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadFile(file);
      if (url) set(field, url);
    } catch { toast.error('Upload failed'); }
    finally { setUploadingField(null); }
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingField('cert');
    try {
      const url = await uploadFile(file);
      if (url) set('certificate_urls', [...(form.certificate_urls || []), url]);
    } catch { toast.error('Upload failed'); }
    finally { setUploadingField(null); }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (tag && !form.search_tags.includes(tag)) {
        set('search_tags', [...form.search_tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleSave = async (publishStatus) => {
    if (!form.name) { toast.error('Product name is required'); setActiveTab('basic'); return; }
    if (!form.category) { toast.error('Category is required'); setActiveTab('basic'); return; }
    
    if (form.mrp && form.price && parseFloat(form.mrp) < parseFloat(form.price)) {
      toast.error('MRP cannot be less than the Regular Price');
      setActiveTab('pricing');
      return;
    }

    setSaving(publishStatus || 'saving');
    try {
      const extraAttrs = {
        ...form.custom_attributes,
        video_url: form.video_url, view_360_url: form.view_360_url,
        user_manual_url: form.user_manual_url, brochure_url: form.brochure_url,
        certificate_urls: form.certificate_urls, pickup_location: form.pickup_location,
        warehouse: form.warehouse, available_cities: form.available_cities,
        manufacturer_name: form.manufacturer_name, country_of_origin: form.country_of_origin,
        gst_number: form.gst_number, contact_number: form.contact_number,
        whatsapp_number: form.whatsapp_number, vendor_email: form.vendor_email,
        product_code: form.product_code, product_type: form.product_type,
        condition: form.condition, seo_title: form.seo_title,
        seo_keywords: form.seo_keywords, meta_description: form.meta_description,
        search_tags: form.search_tags, refund_available: form.refund_available,
        return_eligible: form.return_eligible, exchange_available: form.exchange_available,
        replacement_only: form.replacement_only, return_shipping_applicable: form.return_shipping_applicable,
        seller_approval_required: form.seller_approval_required, return_window: form.return_window,
        return_instructions: form.return_instructions,
        shipping_weight: form.shipping_weight,
      };

      const body = {
        name: form.name,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: form.sku, barcode: form.barcode, brand: form.brand, gender: form.gender,
        category: form.category, subcategory: form.subcategory,
        short_description: form.short_description, description: form.description,
        image_url: form.image_url || (form.images?.[0] || ''),
        images: form.images || [],
        price: parseFloat(form.price) || 0,
        mrp: parseFloat(form.mrp) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        gst_percent: parseFloat(form.gst_percent) || 0,
        stock: parseInt(form.stock) || 0,
        stock_status: form.stock_status,
        min_order_qty: parseInt(form.min_order_qty) || 1,
        max_order_qty: parseInt(form.max_order_qty) || null,
        low_stock_alert: parseInt(form.low_stock_alert) || null,
        cod_available: form.cod_available,
        free_shipping: form.free_shipping,
        weight: form.weight, length: form.length, width: form.width, height: form.height,
        material: form.material, hsn_code: form.hsn_code,
        warranty: form.warranty, return_policy: form.return_policy,
        replacement_policy: form.replacement_policy,
        custom_attributes: JSON.stringify(extraAttrs),
        status: publishStatus === 'publish' ? 'pending' : 'draft',
      };

      const url = isEdit
        ? `${BACKEND_URL}/vendor/products/${id}`
        : `${BACKEND_URL}/vendor/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Save failed'); return; }

      if (publishStatus === 'publish') {
        toast.success('🚀 Product submitted for admin approval!');
      } else {
        toast.success('💾 Draft saved successfully!');
      }
      navigate('/vendor/products');
    } catch { toast.error('An error occurred'); }
    finally { setSaving(false); }
  };

  const UploadBtn = ({ field, label, accept = 'image/*', onUpload, loading }) => (
    <label className="relative inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-orange-50 hover:border-[#fe6603] transition-colors">
      <input type="file" accept={accept} onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
      <Upload className="w-4 h-4" />
      {loading ? 'Uploading...' : label}
    </label>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-5">
            <Section title="Product Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name" required>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Samsung Galaxy S24" required />
                </Field>
                <Field label="Product SKU">
                  <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. SKU-001" />
                </Field>
                <Field label="Barcode (Optional)">
                  <Input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="EAN / UPC barcode" />
                </Field>
                <Field label="Product Code">
                  <Input value={form.product_code} onChange={e => set('product_code', e.target.value)} placeholder="Internal product code" />
                </Field>
                <Field label="Brand">
                  <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Samsung" />
                </Field>
                <Field label="Gender">
                  <Select value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Category">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Category" required hint={categories.length === 0 ? "You haven't selected any categories yet. Please go to Platform Categories to select them." : ""}>
                  <Select value={form.category} onChange={e => handleCategoryChange(e.target.value)} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Sub Category">
                  <Select value={form.subcategory} onChange={e => set('subcategory', e.target.value)}>
                    <option value="">Select Sub Category</option>
                    {subcategories.map((s, i) => <option key={i} value={typeof s === 'string' ? s : s.name}>{typeof s === 'string' ? s : s.name}</option>)}
                  </Select>
                </Field>
              </div>
            </Section>

            <Section title="Description">
              <Field label="Short Description">
                <Input value={form.short_description} onChange={e => set('short_description', e.target.value)} placeholder="One-line summary..." />
              </Field>
              <Field label="Product Description" hint="Full product details, features, specifications">
                <Textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Write a detailed product description..." />
              </Field>
            </Section>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-5">
            <Section title="Main Product Image">
              <div className="flex items-start gap-4">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
                  {form.image_url
                    ? <img src={form.image_url} alt="Main" className="w-full h-full object-cover" />
                    : <Package className="w-8 h-8 text-gray-300" />}
                </div>
                <div className="space-y-2">
                  <UploadBtn label="Upload Main Image" onUpload={handleMainImageUpload} loading={uploadingField === 'main'} />
                  {form.image_url && (
                    <button onClick={() => set('image_url', '')} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-400">Recommended: 800×800px, JPG/PNG/WEBP</p>
                </div>
              </div>
            </Section>

            <Section title="Gallery Images">
              <div className="flex flex-wrap gap-3 mb-3">
                {(form.images || []).map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Gallery ${i+1}`} className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#fe6603] hover:bg-orange-50 transition-colors relative">
                  <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Plus className="w-5 h-5 text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Add</span>
                </label>
              </div>
              {uploadingImages && <p className="text-xs text-[#fe6603]">Uploading images...</p>}
            </Section>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-5">
            <Section title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Regular Price (₹)" required>
                  <Input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                </Field>
                <Field label="MRP (₹)" hint="Maximum Retail Price">
                  <Input type="number" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00" />
                </Field>
              </div>
            </Section>

            <Section title="Stock & Inventory">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Stock Quantity">
                  <Input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" />
                </Field>
                <Field label="Stock Status">
                  <Select value={form.stock_status} onChange={e => set('stock_status', e.target.value)}>
                    {STOCK_STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </Field>
                <Field label="Low Stock Alert" hint="Alert when stock falls below this">
                  <Input type="number" min="0" value={form.low_stock_alert} onChange={e => set('low_stock_alert', e.target.value)} placeholder="e.g. 5" />
                </Field>
              </div>
            </Section>
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-5">
            <Section title="Physical Dimensions">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Weight (kg)">
                  <Input type="text" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="e.g. 0.5 kg" />
                </Field>
                <Field label="Shipping Weight (kg)">
                  <Input type="text" value={form.shipping_weight} onChange={e => set('shipping_weight', e.target.value)} placeholder="Packed weight" />
                </Field>
                <Field label="Material">
                  <Input value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. Plastic, Metal, Cotton" />
                </Field>
                <Field label="Length (cm)">
                  <Input type="text" value={form.length} onChange={e => set('length', e.target.value)} placeholder="cm" />
                </Field>
                <Field label="Width (cm)">
                  <Input type="text" value={form.width} onChange={e => set('width', e.target.value)} placeholder="cm" />
                </Field>
                <Field label="Height (cm)">
                  <Input type="text" value={form.height} onChange={e => set('height', e.target.value)} placeholder="cm" />
                </Field>
              </div>
            </Section>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-5">
            <Section title="SEO Details">
              <Field label="SEO Title" hint="Appears as the browser tab title (max 60 chars)">
                <Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="Product SEO title..." maxLength={60} />
              </Field>
              <Field label="SEO Keywords" hint="Comma-separated keywords for search engines">
                <Input value={form.seo_keywords} onChange={e => set('seo_keywords', e.target.value)} placeholder="keyword1, keyword2, keyword3" />
              </Field>
              <Field label="Meta Description" hint="Search engine result description (max 160 chars)">
                <Textarea rows={3} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="Brief description for search results..." maxLength={160} />
              </Field>
            </Section>

            <Section title="Search Tags">
              <Field label="Search Tags" hint="Press Enter or comma to add a tag">
                <div className="border border-gray-200 rounded-xl p-2 bg-white min-h-[48px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#fe6603]/30">
                  {form.search_tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-[#fe6603] rounded-lg text-xs font-semibold">
                      {tag}
                      <button type="button" onClick={() => set('search_tags', form.search_tags.filter((_, idx) => idx !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={form.search_tags.length === 0 ? 'Add tags...' : ''}
                    className="flex-1 min-w-[120px] text-sm outline-none border-none bg-transparent p-1"
                  />
                </div>
              </Field>
            </Section>

            <Section title="Publish Status">
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  Products are reviewed by admin before going live. Save as Draft to continue editing, or Submit for Approval to request publishing.
                </p>
              </div>
            </Section>
          </div>
        );

      case 'extra':
        return (
          <div className="space-y-5">
            <Section title="Warranty & Policies">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Warranty Period">
                  <Input value={form.warranty} onChange={e => set('warranty', e.target.value)} placeholder="e.g. 1 Year Manufacturer Warranty" />
                </Field>
                <Field label="Return Policy">
                  <Input value={form.return_policy} onChange={e => set('return_policy', e.target.value)} placeholder="e.g. 7 Days Return" />
                </Field>
                <Field label="Replacement Policy">
                  <Input value={form.replacement_policy} onChange={e => set('replacement_policy', e.target.value)} placeholder="e.g. 7 Days Replacement" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.return_eligible} onChange={e => set('return_eligible', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Return Eligible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.exchange_available} onChange={e => set('exchange_available', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Exchange Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.replacement_only} onChange={e => set('replacement_only', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Replacement Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.return_shipping_applicable} onChange={e => set('return_shipping_applicable', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Return Shipping Fee</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.seller_approval_required} onChange={e => set('seller_approval_required', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Approval Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-[12px] hover:bg-gray-50/50 shadow-sm">
                  <input type="checkbox" checked={form.refund_available} onChange={e => set('refund_available', e.target.checked)} className="w-4 h-4 rounded text-[#fe6603]" />
                  <span className="text-sm font-medium text-gray-700">Refund Available</span>
                </label>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Return Window (Days)"><Input type="number" min="0" value={form.return_window} onChange={e => set('return_window', e.target.value)} placeholder="e.g. 7" /></Field>
              </div>
              <div className="mt-4">
                <Field label="Product-Specific Return Instructions"><Textarea rows={2} value={form.return_instructions} onChange={e => set('return_instructions', e.target.value)} placeholder="Any special instructions for returns/exchanges..." /></Field>
              </div>
            </Section>

            <Section title="Documents & Certificates">
              <div className="space-y-4">
                <Field label="User Manual">
                  <div className="flex items-center gap-3">
                    {form.user_manual_url && <a href={form.user_manual_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline truncate max-w-[200px]">View Manual</a>}
                    <UploadBtn label="Upload Manual" accept="application/pdf,image/*" onUpload={e => handleDocUpload(e, 'user_manual_url')} loading={uploadingField === 'user_manual_url'} />
                  </div>
                </Field>
                <Field label="Product Brochure">
                  <div className="flex items-center gap-3">
                    {form.brochure_url && <a href={form.brochure_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline truncate max-w-[200px]">View Brochure</a>}
                    <UploadBtn label="Upload Brochure" accept="application/pdf,image/*" onUpload={e => handleDocUpload(e, 'brochure_url')} loading={uploadingField === 'brochure_url'} />
                  </div>
                </Field>
                <Field label="Certificates">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(form.certificate_urls || []).map((url, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1 text-xs">
                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 underline">Cert {i+1}</a>
                        <button onClick={() => set('certificate_urls', form.certificate_urls.filter((_, idx) => idx !== i))}><X className="w-3 h-3 text-red-400" /></button>
                      </div>
                    ))}
                  </div>
                  <UploadBtn label="Add Certificate" accept="application/pdf,image/*" onUpload={handleCertUpload} loading={uploadingField === 'cert'} />
                </Field>
              </div>
            </Section>

            <Section title="Location & Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Pickup Location">
                  <Input value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)} placeholder="e.g. Mumbai Warehouse" />
                </Field>
                <Field label="Warehouse">
                  <Input value={form.warehouse} onChange={e => set('warehouse', e.target.value)} placeholder="Warehouse name or address" />
                </Field>
                <Field label="Available Cities" hint="Comma-separated city names">
                  <Input value={form.available_cities} onChange={e => set('available_cities', e.target.value)} placeholder="Mumbai, Delhi, Bangalore" />
                </Field>
                <Field label="Contact Number">
                  <Input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="WhatsApp Number">
                  <Input type="tel" value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.vendor_email} onChange={e => set('vendor_email', e.target.value)} placeholder="support@yourstore.com" />
                </Field>
              </div>
            </Section>

            <Section title="Manufacturer & Tax">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Manufacturer Name">
                  <Input value={form.manufacturer_name} onChange={e => set('manufacturer_name', e.target.value)} placeholder="e.g. Samsung Electronics" />
                </Field>
                <Field label="Country of Origin">
                  <Input value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} placeholder="e.g. India, China" />
                </Field>
                <Field label="HSN Code">
                  <Input value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} placeholder="e.g. 8517" />
                </Field>
                <Field label="GST Number">
                  <Input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} placeholder="GST registration number" />
                </Field>
              </div>
            </Section>

            {/* Category Custom Fields */}
            {categoryCustomFields.length > 0 && (
              <Section title={`Custom Fields (${form.category || 'Category'})`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryCustomFields.map((field, idx) => {
                    const val = form.custom_attributes?.[field.name] || '';
                    return (
                      <Field key={idx} label={field.name} required={field.required}>
                        {field.type === 'number' ? (
                          <Input type="number" value={val} onChange={e => setCustomAttr(field.name, e.target.value)} required={field.required} />
                        ) : field.type === 'long_text' ? (
                          <Textarea rows={3} value={val} onChange={e => setCustomAttr(field.name, e.target.value)} required={field.required} />
                        ) : field.type === 'select' ? (
                          <Select value={val} onChange={e => setCustomAttr(field.name, e.target.value)}>
                            <option value="">Select...</option>
                            {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
                          </Select>
                        ) : field.type === 'boolean' ? (
                          <Select value={val} onChange={e => setCustomAttr(field.name, e.target.value)}>
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </Select>
                        ) : field.type === 'upload' ? (
                          <div className="flex items-center gap-3">
                            {val && <a href={val} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">View File</a>}
                            <label className="relative inline-flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-orange-50 hover:border-[#fe6603] transition-colors">
                              <input type="file" accept="image/*,application/pdf"
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  setUploadingField(field.name);
                                  const url = await uploadFile(file);
                                  if (url) setCustomAttr(field.name, url);
                                  setUploadingField(null);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer" />
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingField === field.name ? 'Uploading...' : 'Upload'}
                            </label>
                          </div>
                        ) : (
                          <Input type="text" value={val} onChange={e => setCustomAttr(field.name, e.target.value)} required={field.required} />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/vendor/products')}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Vendor Portal</p>
              <h1 className="text-xl font-extrabold text-gray-900 truncate tracking-tight">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => handleSave('draft')} disabled={!!saving}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-[12px] text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50">
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button onClick={() => handleSave('publish')} disabled={!!saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white rounded-[12px] text-sm font-bold hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none">
              <Send className="w-4 h-4" />
              {saving === 'publish' ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-20">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-[#fe6603]/10 text-[#fe6603] font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}

              {/* Mobile save draft */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => handleSave('draft')} disabled={!!saving}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Tabs */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === tab.id ? 'bg-[#fe6603] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
