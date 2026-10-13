import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Trash2, Upload, X, Plus, ChevronRight,
  Package, Image, DollarSign, Truck, Search, FileText, MapPin, AlertTriangle,
  Star, TrendingUp, Tag, CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const TABS = [
  { id: 'basic',    label: 'Basic Info',      icon: Package },
  { id: 'media',    label: 'Media',           icon: Image },
  { id: 'pricing',  label: 'Pricing & Stock', icon: DollarSign },
  { id: 'shipping', label: 'Shipping',        icon: Truck },
  { id: 'seo',      label: 'SEO & Tags',      icon: Search },
  { id: 'extra',    label: 'More Info',       icon: FileText },
  { id: 'admin',    label: 'Admin Controls',  icon: CheckCircle },
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

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#036e26]/30 focus:border-[#036e26] transition-colors';

function Input({ className = '', ...props }) {
  return <input className={`${inputCls} ${className}`} {...props} />;
}
function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputCls} resize-none ${className}`} {...props} />;
}
function Select({ className = '', children, ...props }) {
  return <select className={`${inputCls} ${className}`} {...props}>{children}</select>;
}
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
      {title && <h3 className="text-sm font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function AdminProductFormPage() {
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
    name: '', sku: '', barcode: '', product_code: '', brand: '', gender: 'Any',
    category: '', subcategory: '', product_type: 'Physical', condition: 'New',
    description: '', short_description: '',
    price: '', mrp: '', sale_price: '', cost_price: '', gst_percent: '',
    stock: '', stock_status: 'In Stock', min_order_qty: 1, max_order_qty: '',
    low_stock_alert: '', cod_available: true,
    weight: '', shipping_weight: '', length: '', width: '', height: '',
    material: '', free_shipping: false,
    seo_title: '', seo_keywords: '', meta_description: '', search_tags: [],
    warranty: '', return_policy: '', replacement_policy: '', refund_available: false,
    user_manual_url: '', brochure_url: '', certificate_urls: [],
    pickup_location: '', warehouse: '', available_cities: '',
    manufacturer_name: '', country_of_origin: '', hsn_code: '',
    gst_number: '', contact_number: '', whatsapp_number: '', vendor_email: '',
    return_eligible: true, exchange_available: true, replacement_only: false,
    return_shipping_applicable: false, seller_approval_required: false,
    return_window: '7', return_instructions: '',
    // Admin controls
    is_active: true, is_bestseller: false, is_trending: false, is_offer: false, status: 'approved',
    custom_attributes: {},
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const init = async () => {
      const cats = await fetchCategories();
      if (isEdit) fetchProduct(cats);
    };
    init();
  }, [id]);

  const fetchCategories = async () => {
    const res = await fetch(`${BACKEND_URL}/admin/categories`, { headers });
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(cats);
    return cats;
  };

  const fetchProduct = async (cats) => {
    const res = await fetch(`${BACKEND_URL}/admin/products`, { headers });
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

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BACKEND_URL}/admin/upload`, {
      method: 'POST', headers, body: fd
    });
    const data = await res.json();
    return data.url;
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingField('main');
    try { const url = await uploadFile(file); if (url) set('image_url', url); }
    catch { toast.error('Upload failed'); } finally { setUploadingField(null); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setUploadingImages(true);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      set('images', [...(form.images || []), ...urls.filter(Boolean)]);
    } catch { toast.error('Upload failed'); } finally { setUploadingImages(false); }
  };

  const handleDocUpload = async (e, field) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingField(field);
    try { const url = await uploadFile(file); if (url) set(field, url); }
    catch { toast.error('Upload failed'); } finally { setUploadingField(null); }
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingField('cert');
    try {
      const url = await uploadFile(file);
      if (url) set('certificate_urls', [...(form.certificate_urls || []), url]);
    } catch { toast.error('Upload failed'); } finally { setUploadingField(null); }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, '');
      if (tag && !form.search_tags.includes(tag)) set('search_tags', [...form.search_tags, tag]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Product name is required'); setActiveTab('basic'); return; }
    if (!form.category) { toast.error('Category is required'); setActiveTab('basic'); return; }
    setSaving(true);
    try {
      const extraAttrs = {
        ...form.custom_attributes,
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
        cod_available: form.cod_available, free_shipping: form.free_shipping,
        weight: form.weight, length: form.length, width: form.width, height: form.height,
        material: form.material, hsn_code: form.hsn_code,
        warranty: form.warranty, return_policy: form.return_policy,
        replacement_policy: form.replacement_policy,
        is_active: form.is_active, is_bestseller: form.is_bestseller,
        is_trending: form.is_trending, is_offer: form.is_offer,
        status: form.status,
        custom_attributes: JSON.stringify(extraAttrs),
      };

      const url = isEdit
        ? `${BACKEND_URL}/admin/products/${id}`
        : `${BACKEND_URL}/admin/products`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const resData = await res.json();
      if (!res.ok) { toast.error(resData.error || 'Save failed'); return; }
      toast.success(isEdit ? '✅ Product updated!' : '✅ Product created!');
      navigate('/admin/products');
    } catch { toast.error('An error occurred'); }
    finally { setSaving(false); }
  };

  const UploadBtn = ({ label, accept = 'image/*', onUpload, loading }) => (
    <label className="relative inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-green-50 hover:border-[#036e26] transition-colors">
      <input type="file" accept={accept} onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
      <Upload className="w-4 h-4" />
      {loading ? 'Uploading...' : label}
    </label>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return (
        <div className="space-y-5">
          <Section title="Product Identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Product Name" required><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Samsung Galaxy S24" /></Field>
              <Field label="Product SKU"><Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. SKU-001" /></Field>
              <Field label="Barcode (Optional)"><Input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="EAN / UPC" /></Field>
              <Field label="Product Code"><Input value={form.product_code} onChange={e => set('product_code', e.target.value)} placeholder="Internal code" /></Field>
              <Field label="Brand"><Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Samsung" /></Field>
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
              <Field label="Product Category" required>
                <Select value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
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
            <Field label="Short Description"><Input value={form.short_description} onChange={e => set('short_description', e.target.value)} placeholder="One-line summary..." /></Field>
            <Field label="Product Description"><Textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Full product details..." /></Field>
          </Section>
        </div>
      );

      case 'media': return (
        <div className="space-y-5">
          <Section title="Main Product Image">
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
                {form.image_url ? <img src={form.image_url} alt="Main" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-300" />}
              </div>
              <div className="space-y-2">
                <UploadBtn label="Upload Main Image" onUpload={handleMainImageUpload} loading={uploadingField === 'main'} />
                {form.image_url && <button onClick={() => set('image_url', '')} className="flex items-center gap-1 text-xs text-red-500"><X className="w-3 h-3" /> Remove</button>}
                <p className="text-xs text-gray-400">Recommended: 800×800px</p>
              </div>
            </div>
          </Section>
          <Section title="Gallery Images">
            <div className="flex flex-wrap gap-3 mb-3">
              {(form.images || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                  <button onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#036e26] hover:bg-green-50 transition-colors relative">
                <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Plus className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-400 mt-1">Add</span>
              </label>
            </div>
            {uploadingImages && <p className="text-xs text-[#036e26]">Uploading...</p>}
          </Section>
        </div>
      );

      case 'pricing': return (
        <div className="space-y-5">
          <Section title="Pricing">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Regular Price (₹)" required><Input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" /></Field>
              <Field label="MRP (₹)"><Input type="number" min="0" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00" /></Field>
            </div>
          </Section>
          <Section title="Stock & Inventory">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Stock Quantity"><Input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="0" /></Field>
              <Field label="Stock Status"><Select value={form.stock_status} onChange={e => set('stock_status', e.target.value)}>{STOCK_STATUS_OPTS.map(s => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Low Stock Alert"><Input type="number" min="0" value={form.low_stock_alert} onChange={e => set('low_stock_alert', e.target.value)} placeholder="e.g. 5" /></Field>
            </div>
          </Section>
        </div>
      );

      case 'shipping': return (
        <div className="space-y-5">
          <Section title="Physical Dimensions">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Weight (kg)"><Input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="0.5" /></Field>
              <Field label="Shipping Weight (kg)"><Input value={form.shipping_weight} onChange={e => set('shipping_weight', e.target.value)} placeholder="Packed weight" /></Field>
              <Field label="Material"><Input value={form.material} onChange={e => set('material', e.target.value)} placeholder="e.g. Plastic, Metal" /></Field>
              <Field label="Length (cm)"><Input value={form.length} onChange={e => set('length', e.target.value)} placeholder="cm" /></Field>
              <Field label="Width (cm)"><Input value={form.width} onChange={e => set('width', e.target.value)} placeholder="cm" /></Field>
              <Field label="Height (cm)"><Input value={form.height} onChange={e => set('height', e.target.value)} placeholder="cm" /></Field>
            </div>
          </Section>
        </div>
      );

      case 'seo': return (
        <div className="space-y-5">
          <Section title="SEO Details">
            <Field label="SEO Title" hint="Max 60 chars"><Input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} placeholder="SEO title..." maxLength={60} /></Field>
            <Field label="SEO Keywords"><Input value={form.seo_keywords} onChange={e => set('seo_keywords', e.target.value)} placeholder="keyword1, keyword2" /></Field>
            <Field label="Meta Description" hint="Max 160 chars"><Textarea rows={3} value={form.meta_description} onChange={e => set('meta_description', e.target.value)} maxLength={160} /></Field>
          </Section>
          <Section title="Search Tags">
            <Field label="Search Tags" hint="Press Enter to add">
              <div className="border border-gray-200 rounded-xl p-2 bg-white min-h-[48px] flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-[#036e26]/30">
                {form.search_tags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-[#036e26] rounded-lg text-xs font-semibold">
                    {tag}
                    <button onClick={() => set('search_tags', form.search_tags.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                  placeholder={form.search_tags.length === 0 ? 'Add tags...' : ''}
                  className="flex-1 min-w-[120px] text-sm outline-none border-none bg-transparent p-1" />
              </div>
            </Field>
          </Section>
        </div>
      );

      case 'extra': return (
        <div className="space-y-5">
          <Section title="Warranty & Policies">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Warranty Period"><Input value={form.warranty} onChange={e => set('warranty', e.target.value)} placeholder="e.g. 1 Year" /></Field>
              <Field label="Return Policy"><Input value={form.return_policy} onChange={e => set('return_policy', e.target.value)} placeholder="e.g. 7 Days" /></Field>
              <Field label="Replacement Policy"><Input value={form.replacement_policy} onChange={e => set('replacement_policy', e.target.value)} placeholder="e.g. 7 Days" /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.return_eligible} onChange={e => set('return_eligible', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <span className="text-sm font-medium text-gray-700">Return Eligible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.exchange_available} onChange={e => set('exchange_available', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <span className="text-sm font-medium text-gray-700">Exchange Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.replacement_only} onChange={e => set('replacement_only', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <span className="text-sm font-medium text-gray-700">Replacement Only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.return_shipping_applicable} onChange={e => set('return_shipping_applicable', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <span className="text-sm font-medium text-gray-700">Return Shipping Fee</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.seller_approval_required} onChange={e => set('seller_approval_required', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <span className="text-sm font-medium text-gray-700">Approval Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                <input type="checkbox" checked={form.refund_available} onChange={e => set('refund_available', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
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
          <Section title="Documents">
            <Field label="User Manual">
              <div className="flex items-center gap-3">
                {form.user_manual_url && <a href={form.user_manual_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">View</a>}
                <UploadBtn label="Upload Manual" accept="application/pdf,image/*" onUpload={e => handleDocUpload(e, 'user_manual_url')} loading={uploadingField === 'user_manual_url'} />
              </div>
            </Field>
            <Field label="Product Brochure">
              <div className="flex items-center gap-3">
                {form.brochure_url && <a href={form.brochure_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">View</a>}
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
          </Section>
          <Section title="Location & Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Pickup Location"><Input value={form.pickup_location} onChange={e => set('pickup_location', e.target.value)} placeholder="e.g. Mumbai Warehouse" /></Field>
              <Field label="Warehouse"><Input value={form.warehouse} onChange={e => set('warehouse', e.target.value)} placeholder="Warehouse name" /></Field>
              <Field label="Available Cities" hint="Comma-separated"><Input value={form.available_cities} onChange={e => set('available_cities', e.target.value)} placeholder="Mumbai, Delhi" /></Field>
              <Field label="Contact Number"><Input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} /></Field>
              <Field label="WhatsApp Number"><Input type="tel" value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} /></Field>
              <Field label="Email"><Input type="email" value={form.vendor_email} onChange={e => set('vendor_email', e.target.value)} /></Field>
            </div>
          </Section>
          <Section title="Manufacturer & Tax">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Manufacturer Name"><Input value={form.manufacturer_name} onChange={e => set('manufacturer_name', e.target.value)} /></Field>
              <Field label="Country of Origin"><Input value={form.country_of_origin} onChange={e => set('country_of_origin', e.target.value)} placeholder="e.g. India" /></Field>
              <Field label="HSN Code"><Input value={form.hsn_code} onChange={e => set('hsn_code', e.target.value)} /></Field>
              <Field label="GST Number"><Input value={form.gst_number} onChange={e => set('gst_number', e.target.value)} /></Field>
            </div>
          </Section>
          {categoryCustomFields.length > 0 && (
            <Section title={`Custom Fields (${form.category})`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryCustomFields.map((field, idx) => {
                  const val = form.custom_attributes?.[field.name] || '';
                  return (
                    <Field key={idx} label={field.name} required={field.required}>
                      {field.type === 'number' ? <Input type="number" value={val} onChange={e => setCustomAttr(field.name, e.target.value)} />
                      : field.type === 'long_text' ? <Textarea rows={3} value={val} onChange={e => setCustomAttr(field.name, e.target.value)} />
                      : field.type === 'upload' ? (
                        <div className="flex items-center gap-2">
                          {val && <a href={val} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">View</a>}
                          <label className="relative inline-flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-green-50 transition-colors">
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={async (e) => { const f = e.target.files[0]; if (!f) return; setUploadingField(field.name); const u = await uploadFile(f); if (u) setCustomAttr(field.name, u); setUploadingField(null); }} />
                            <Upload className="w-3.5 h-3.5" />{uploadingField === field.name ? 'Uploading...' : 'Upload'}
                          </label>
                        </div>
                      ) : <Input value={val} onChange={e => setCustomAttr(field.name, e.target.value)} />}
                    </Field>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      );

      case 'admin': return (
        <div className="space-y-5">
          <Section title="Publication Status">
            <Field label="Product Status">
              <Select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="approved">Approved (Live)</option>
                <option value="pending">Pending Review</option>
                <option value="draft">Draft</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          </Section>
          <Section title="Product Flags">
            <p className="text-xs text-gray-500 mb-3">These flags control where this product appears on the storefront.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded text-[#036e26]" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Active</p>
                  <p className="text-xs text-gray-400">Product is visible on the storefront</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_bestseller} onChange={e => set('is_bestseller', e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> Bestseller</p>
                  <p className="text-xs text-gray-400">Shows in Bestsellers section</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_trending} onChange={e => set('is_trending', e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Trending</p>
                  <p className="text-xs text-gray-400">Shows in Trending section</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={form.is_offer} onChange={e => set('is_offer', e.target.checked)} className="w-4 h-4 rounded" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-[#fe6603]" /> Special Offer</p>
                  <p className="text-xs text-gray-400">Shows in Offers section</p>
                </div>
              </label>
            </div>
          </Section>
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
            <button onClick={() => navigate('/admin/products')}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Admin Panel</p>
              <h1 className="text-base font-bold text-gray-900 truncate">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#036e26] text-white rounded-xl text-sm font-semibold hover:bg-[#02561d] transition-colors disabled:opacity-50 shadow-sm">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Product')}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-20">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-[#036e26]/10 text-[#036e26] font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile tabs */}
          <div className="md:hidden w-full mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === tab.id ? 'bg-[#036e26] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <main className="flex-1 min-w-0">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
