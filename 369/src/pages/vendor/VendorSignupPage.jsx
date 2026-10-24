import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Store, ArrowRight, ShieldCheck, CheckCircle2, CreditCard, PlayCircle, X, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const STEP_LABELS = ['Personal', 'Store', 'Plan', 'Verify'];

const VENDOR_GUIDELINES = [
  { id: 1, title: "Stock Accuracy & Availability", text: "Vendors must fulfil orders using the exact stock quantity, product specifications, and availability status displayed on the platform. If a product becomes unavailable or the displayed stock is exhausted, the vendor must immediately update the product status as “Out of Stock” on the ULMGH-369 platform." },
  { id: 2, title: "Quality Assurance", text: "Vendors must maintain the quality, condition, and specifications represented on the platform and must inspect products before dispatch to ensure that they are free from defects, damage, or any significant quality issues. Vendors must not dispatch products that are defective, damaged, expired, or materially different from the product information displayed on the platform." },
  { id: 3, title: "Timely Order Processing & Dispatch", text: "Vendors must verify and process every order promptly and prepare the order for dispatch within the agreed SLA timeframe. The order must be properly packed and handed over to the designated delivery or logistics partner within the applicable SLA timeframe." },
  { id: 4, title: "Correct Product Shipment", text: "Vendors must ensure that the product, size, colour, quantity, variant, model, and specifications supplied exactly match the customer's order and the product details displayed on the ULMGH-369 platform. Vendors must carefully verify the order details before dispatch to prevent wrong, incomplete, or mismatched shipments." },
  { id: 5, title: "Secure & Professional Packaging", text: "Vendors must pack products securely, neatly, and appropriately using suitable packaging and protective materials to minimize the risk of damage, leakage, breakage, contamination, or deterioration during handling and transportation. Packaging must be appropriate to the nature, size, weight, and fragility of the product." },
  { id: 6, title: "Accurate Product Information", text: "Vendors must ensure that the product name, description, images, dimensions, weight, colour, material, specifications, variants, and other relevant information displayed on the ULMGH-369 platform accurately represent the actual product offered for sale. All product information must be clear, complete, current, and not misleading. Any changes to the product or its specifications must be updated promptly on the platform." },
  { id: 7, title: "Genuine & Legally Permitted Products", text: "Vendors must list and sell only genuine, authentic, and legally permitted products that comply with applicable laws, regulations, standards, and platform requirements. Vendors must not list or sell counterfeit, duplicate, unauthorized, stolen, prohibited, or otherwise unlawful products on the ULMGH-369 platform. Vendors are responsible for ensuring the authenticity and lawful sale of the products they offer." },
  { id: 8, title: "Returns & Replacements", text: "Vendors must cooperate fully with the applicable ULMGH-369 Return, Replacement, Exchange, and Refund Policies and must promptly respond to return or replacement requests, particularly in cases involving damaged, defective, incorrect, incomplete, or materially different products. Vendors must provide the necessary information and assistance to facilitate timely resolution of such cases." },
  { id: 9, title: "Communication & Responsiveness", text: "Vendors must respond promptly, professionally, and courteously to customer queries, ULMGH-369 customer support requests, order-related communications, and administrative communications. Vendors must provide accurate and necessary information and cooperate with ULMGH-369 support and administration teams to ensure timely resolution of customer and operational issues." },
  { id: 10, title: "Customer Data Privacy", text: "Vendors must protect all customer information received through ULMGH-369 and use it only for legitimate order fulfilment, delivery coordination, returns, replacements, and related customer service purposes. Vendors must not misuse, copy, retain unnecessarily, disclose, sell, share, or use customer information for any unauthorized personal or commercial purpose. Vendors must maintain the confidentiality and security of customer information and comply with applicable data protection and privacy requirements." },
  { id: 11, title: "Fair & Transparent Business Practices", text: "Vendors must provide truthful, accurate, and complete product information and maintain transparent and fair pricing on the ULMGH-369 platform. Vendors must not engage in misleading, deceptive, fraudulent, or unfair business practices, including false product claims, misleading offers, hidden charges, or inaccurate pricing or discounts." },
  { id: 12, title: "Legal & Regulatory Compliance", text: "Vendors are responsible for complying with all applicable laws, rules, regulations, tax requirements, licences, registrations, permits, certifications, and other regulatory requirements relating to their products and business activities. Vendors must obtain and maintain all legally required approvals and provide valid documentation when requested by ULMGH-369 or the relevant authorities." },
];

export function VendorSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [razorpayData, setRazorpayData] = useState({ order_id: '', payment_id: '', signature: '' });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', storeName: '', storeAddress: '', otp: ''
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/subscriptions/plans`)
      .then(r => r.json())
      .then(d => setPlans(d.plans || []))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePayment = async () => {
    if (!selectedPlan) return setError('Please select a plan');
    if (!acceptedGuidelines) return setError('Please review and accept the Vendor Guidelines to proceed with payment.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'ULMGH369',
        description: `${selectedPlan.name} Vendor Subscription`,
        order_id: data.order.id,
        handler: (response) => {
          setPaymentId(response.razorpay_payment_id);
          setRazorpayData({
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          setPaymentDone(true);
          toast.success('Payment successful!');
        },
        prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phone },
        theme: { color: '#fe6603' },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); });
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) return setStep(2);

    if (step === 2) return setStep(3);

    if (step === 3) {
      if (!acceptedGuidelines) return setError('You must accept the Vendor Guidelines to continue.');
      if (!paymentDone) return setError('Please complete payment to continue');
      // Submit signup + send OTP
      setLoading(true);
      try {
        const payload = {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email, phone: formData.phone,
          password: formData.password,
          store_name: formData.storeName, address: formData.storeAddress,
          plan_id: selectedPlan.id,
          payment_id: razorpayData.payment_id || paymentId,
          razorpay_order_id: razorpayData.order_id,
          razorpay_payment_id: razorpayData.payment_id || paymentId,
          razorpay_signature: razorpayData.signature,
        };
        const res = await fetch(`${BACKEND_URL}/vendorAuth/signup`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to sign up');
        setStep(4);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (step === 4) {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/vendorAuth/verify-otp`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
        toast.success('Application verified! We will review and notify you once approved.');
        navigate('/vendor-login');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <img src={logo} alt="ULMGH369" className="h-12 mx-auto mix-blend-multiply" />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Store className="w-6 h-6 text-[#fe6603]" />
            <h1 className="text-3xl font-bold text-gray-900">Become a Vendor</h1>
          </div>
          <p className="text-gray-500 mb-4">Apply to sell your products on ULMGH369</p>
          <button 
            onClick={() => setShowVideoModal(true)}
            className="inline-flex items-center gap-2 bg-[#fe6603]/10 hover:bg-[#fe6603]/20 text-[#fe6603] font-semibold px-4 py-2 rounded-full transition-colors text-sm"
          >
            <PlayCircle className="w-4 h-4" /> Watch Onboarding Demo
          </button>
        </div>

        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fe6603]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8 gap-1">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              const active = step >= n;
              return (
                <React.Fragment key={n}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${active ? 'bg-[#fe6603] text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</div>
                    <span className={`text-[10px] font-medium ${active ? 'text-[#fe6603]' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && <div className={`w-8 sm:w-12 h-1 rounded-full mb-4 transition-colors ${step > n ? 'bg-[#fe6603]' : 'bg-gray-100'}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {error && <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1 — Personal */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {['firstName', 'lastName'].map(f => (
                    <div key={f}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">{f === 'firstName' ? 'First Name' : 'Last Name'}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" name={f} value={formData[f]} onChange={handleChange} required
                          className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                          placeholder={f === 'firstName' ? 'John' : 'Doe'} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                      placeholder="vendor@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                      placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                      placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Store */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store / Business Name</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" name="storeName" value={formData.storeName} onChange={handleChange} required
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                      placeholder="My Awesome Store" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Store Address</label>
                  <textarea name="storeAddress" value={formData.storeAddress} onChange={handleChange} required rows={3}
                    className="block w-full p-4 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner resize-none"
                    placeholder="Enter complete business address" />
                </div>
              </div>
            )}

            {/* Step 3 — Subscription Plan */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <CreditCard className="w-10 h-10 text-[#fe6603] mx-auto mb-2" />
                  <h2 className="text-lg font-bold text-gray-900">Choose a Subscription Plan</h2>
                  <p className="text-gray-500 text-sm">Select a plan to activate your vendor account</p>
                </div>

                {loadingPlans ? (
                  <p className="text-center text-gray-400 py-4">Loading plans...</p>
                ) : plans.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No plans available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map(plan => {
                      const features = plan.features || {};
                      const featureList = [
                        { label: 'Products', value: features.product_limit || 'Unlimited' },
                        { label: 'Commission', value: `${features.commission_percent || '0'}%` },
                        { label: 'Images/Product', value: features.images_per_product || '—' },
                        features.seo_enabled ? { label: 'Advanced SEO' } : null,
                        features.analytics_enabled ? { label: 'Store Analytics' } : null,
                        features.verification_badge_enabled ? { label: 'Verification Badge' } : null,
                      ].filter(Boolean);

                      return (
                        <button key={plan.id} type="button"
                          onClick={() => { setSelectedPlan(plan); setPaymentDone(false); setPaymentId(''); }}
                          className={`relative p-5 rounded-[20px] border-2 text-left transition-all flex flex-col group ${
                            selectedPlan?.id === plan.id
                              ? 'border-[#fe6603] bg-gradient-to-br from-[#fe6603]/5 to-transparent shadow-[0_8px_20px_rgba(254,102,3,0.1)]'
                              : 'border-gray-100 hover:border-[#fe6603]/30 bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1'
                          }`}>
                          {selectedPlan?.id === plan.id && (
                            <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-[#fe6603]" />
                          )}
                          <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
                          <p className="text-[#fe6603] font-extrabold text-2xl mt-1">₹{plan.price}</p>
                          <p className="text-gray-500 text-sm mt-0.5 mb-4">{plan.months} month{plan.months > 1 ? 's' : ''} access</p>
                          
                          <ul className="space-y-2 mt-auto">
                            {featureList.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="w-4 h-4 text-[#fe6603] mt-0.5 flex-shrink-0" />
                                <span>{f.label}{f.value ? `: ${f.value}` : ''}</span>
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedPlan && !paymentDone && (
                  <div className="space-y-4 pt-2">
                    {/* Guidelines Acceptance Card */}
                    <div className="p-5 bg-orange-50/60 border border-orange-200/80 rounded-2xl">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#fe6603] shrink-0" />
                          <h4 className="font-bold text-gray-900 text-sm">Vendor Guidelines & Responsibilities</h4>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-200/70 text-[#fe6603] shrink-0">
                          Revised 21.09.2026
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        To maintain customer trust, all vendors must adhere to the 12 operational standards regarding stock accuracy, quality inspection, dispatch SLAs, data privacy, and genuine products.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowGuidelinesModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#fe6603] hover:text-[#e55c02] underline mb-3"
                      >
                        <span>Read all 12 Guidelines & Standards</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <label className="flex items-start gap-3 p-3 bg-white border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-50/40 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={acceptedGuidelines}
                          onChange={(e) => setAcceptedGuidelines(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#fe6603] focus:ring-[#fe6603]" 
                        />
                        <span className="text-xs text-gray-800 font-medium leading-snug">
                          I have read, understood, and agree to comply with the <strong>ULMGH-369 Vendor Registration & Operational Guidelines (Revised on 21.09.2026)</strong>.
                        </span>
                      </label>
                    </div>

                    <button type="button" onClick={handlePayment} disabled={loading || !acceptedGuidelines}
                      className="w-full flex items-center justify-center gap-2 bg-[#036e26] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#025a1f] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-900/10">
                      {loading ? 'Opening payment...' : `Pay ₹${selectedPlan.price} & Activate`}
                    </button>
                  </div>
                )}

                {paymentDone && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-green-700 font-semibold text-sm">Payment Successful!</p>
                      <p className="text-green-600 text-xs">ID: {paymentId}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — OTP */}
            {step === 4 && (
              <div className="space-y-4 text-center">
                <ShieldCheck className="w-16 h-16 text-[#fe6603] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Verify Your Email</h2>
                <p className="text-gray-500 text-sm">We've sent a 6-digit OTP to <strong>{formData.email}</strong></p>
                <div className="pt-4 max-w-xs mx-auto">
                  <input type="text" name="otp" value={formData.otp} onChange={handleChange} required maxLength={6}
                    className="block w-full text-center tracking-[0.5em] font-bold text-2xl py-3.5 bg-gray-50/50 border border-gray-200 rounded-[16px] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#fe6603]/30 focus:border-[#fe6603] transition-all shadow-inner"
                    placeholder="------" />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {step > 1 && step < 4 && (
                <button type="button" disabled={loading} onClick={() => setStep(s => s - 1)}
                  className="px-6 py-4 border border-gray-200 rounded-[16px] font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
                  Back
                </button>
              )}
              {step === 4 && (
                <button type="button" disabled={loading} onClick={() => setStep(3)}
                  className="px-6 py-4 border border-gray-200 rounded-[16px] font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading || (step === 3 && !paymentDone)}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white py-4 rounded-[16px] font-bold text-lg hover:shadow-[0_8px_20px_rgba(254,102,3,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none">
                {loading ? 'Processing...' : step === 1 ? 'Continue' : step === 2 ? 'Continue' : step === 3 ? 'Send OTP' : 'Verify & Submit'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>

          {step < 4 && (
            <p className="mt-8 text-center text-gray-600">
              Already have a vendor account?{' '}
              <Link to="/vendor-login" className="text-[#fe6603] font-medium hover:underline">Sign In</Link>
            </p>
          )}
          </div>
        </div>
      </div>

      {/* Video Modal Placeholder */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-3xl p-2 relative shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 bg-white/50 p-2 rounded-full backdrop-blur-md z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="w-20 h-20 rounded-full bg-[#fe6603]/20 animate-pulse flex items-center justify-center mb-6 relative z-10 cursor-pointer">
                  <PlayCircle className="w-10 h-10 text-[#fe6603] ml-1" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Vendor Onboarding Guide</h3>
                <p className="text-gray-400 max-w-md relative z-10">
                  The instructional video covering registration, business details, KYC, and dashboard navigation will be placed here once produced.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Vendor Guidelines Modal */}
        {showGuidelinesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowGuidelinesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl relative shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-[#fe6603]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-[#fe6603] text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                      Revised on 21.09.2026
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                      Vendor Registration & Operational Guidelines
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuidelinesModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-700 leading-relaxed">
                <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-2xl text-xs space-y-2 text-gray-600">
                  <p>
                    <strong>Purpose:</strong> The purpose of these guidelines is to ensure that every vendor understands and complies with their responsibilities regarding stock accuracy, product quality, accurate product information, timely order processing and dispatch, correct order fulfilment, appropriate packaging, customer service, returns and exchanges, and responsible business practices from the time of registration and throughout their association with ULMGH-369.
                  </p>
                  <p>
                    These guidelines are intended to maintain customer trust, product quality, operational efficiency, transparency, and a consistent shopping experience across the ULMGH-369 Website, Android Application, and iOS Application.
                  </p>
                </div>

                <div className="space-y-4">
                  {VENDOR_GUIDELINES.map((g) => (
                    <div key={g.id} className="p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors bg-white">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {g.id}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm">{g.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 pl-8 leading-normal">
                        {g.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="font-bold text-gray-900">ULMGH-369</p>
                  <p className="text-xs text-gray-500 italic mt-0.5">
                    “Your Product. Your Quality. Your Responsibility. Our Shared Trust.”
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGuidelinesModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedGuidelines(true);
                    setShowGuidelinesModal(false);
                    toast.success("Guidelines accepted!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#fe6603] text-white text-xs font-bold hover:bg-[#e55c02] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Read & Agree</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
