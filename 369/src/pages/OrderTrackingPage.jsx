import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Truck, MapPin, CreditCard, Clock, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const STATUS_STEPS = ['paid', 'processing', 'shipped', 'delivered'];
const STEP_LABELS = {
  pending: 'Order Placed',
  paid: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ready_to_ship: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fire a celebratory confetti burst on mount
    const end = Date.now() + 1.5 * 1000;
    const colors = ['#036e26', '#ff7b00', '#d4af37', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Fetch live order details from backend
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/general/orders/${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (res.ok && data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Unable to find order details');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to connect to server to fetch order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // Safely parse JSON items and address
  const items = React.useMemo(() => {
    if (!order?.items) return [];
    if (Array.isArray(order.items)) return order.items;
    try {
      return JSON.parse(order.items);
    } catch {
      return [];
    }
  }, [order?.items]);

  const address = React.useMemo(() => {
    if (!order?.address) return null;
    if (typeof order.address === 'object') return order.address;
    try {
      return JSON.parse(order.address);
    } catch {
      return null;
    }
  }, [order?.address]);

  // Calculate tracking step index
  const currentStepIdx = React.useMemo(() => {
    if (!order) return 0;
    if (order.status === 'paid' || order.status === 'pending') return 0;
    const idx = STATUS_STEPS.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  }, [order?.status]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans flex flex-col">
      <Header title="Order Confirmation" />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="w-12 h-12 text-brand-orange animate-spin" />
            <p className="text-gray-600 font-medium">Loading your order details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Notice</h2>
            <p className="text-gray-500 max-w-md mb-6">{error}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/my-orders')}
                className="bg-brand-orange text-white font-bold px-6 py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Go to My Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-100 text-gray-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Success Hero Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-orange-50/60 rounded-bl-full pointer-events-none" />
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 shadow-inner">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
                Order Placed Successfully!
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto mb-6">
                Thank you for shopping with ULMGH369. Your order is confirmed and being prepared for shipment.
              </p>

              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order No.</p>
                  <p className="text-sm font-bold text-brand-orange truncate">#{order.order_number || order.id}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                  <span className={`inline-block mt-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</p>
                  <p className="text-sm font-bold text-gray-900">₹{Number(order.total).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Tracking Stepper */}
            {order.status !== 'cancelled' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5">Order Progress</h3>
                <div className="max-w-xl mx-auto">
                  <div className="flex items-center justify-between relative">
                    {STATUS_STEPS.map((step, idx) => (
                      <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            idx <= currentStepIdx
                              ? 'bg-[#022A21] border-[#022A21] text-white shadow-md'
                              : 'bg-white border-gray-200 text-gray-400'
                          }`}
                        >
                          {idx < currentStepIdx ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] sm:text-xs font-bold capitalize mt-2 text-center ${
                            idx <= currentStepIdx ? 'text-[#022A21]' : 'text-gray-400'
                          }`}
                        >
                          {STEP_LABELS[step] || step}
                        </span>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute top-4.5 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                              idx < currentStepIdx ? 'bg-[#022A21]' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Vendor Packages / Shipments */}
            {order.fulfillments && order.fulfillments.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-orange" />
                    Shipment Tracking ({order.fulfillments.length} {order.fulfillments.length === 1 ? 'Package' : 'Packages'})
                  </h3>
                  <span className="text-xs font-semibold text-gray-400">Multi-Vendor Dispatch</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {order.fulfillments.map((ful, idx) => (
                    <div key={ful.id} className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">
                          📦 Package {idx + 1}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          ful.status === 'shipped' || ful.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          ful.status === 'ready_to_ship' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ful.status === 'ready_to_ship' ? 'Pickup Scheduled' : (ful.status || 'Processing')}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        Origin: <strong>{ful.vendor_name || ful.store_name || 'ULMGH Platform Store'}</strong>
                      </p>
                      {ful.awb_code ? (
                        <div className="pt-2 border-t border-orange-100/80 flex items-center justify-between">
                          <span className="text-gray-700">
                            Courier: <strong>{ful.courier_name || 'Assigned'}</strong> (AWB: {ful.awb_code})
                          </span>
                          {ful.tracking_url && (
                            <a
                              href={ful.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-brand-orange underline ml-2 hover:text-orange-700"
                            >
                              Track <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic pt-1">
                          Preparing package at warehouse for courier pickup
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Ordered */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-orange" />
                Items in this Order ({items.length})
              </h3>
              <div className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
                        {it.product?.image_url || it.image_url ? (
                          <img
                            src={it.product?.image_url || it.image_url}
                            alt={it.product?.name || it.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {it.product?.name || it.name || 'Product'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: <strong>{it.qty || it.quantity || 1}</strong>
                          {(it.variant?.size || it.size) && (
                            <span> • Size: <strong>{it.variant?.size || it.size}</strong></span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        ₹{Number((it.variant?.price || it.product?.price || it.price || 0) * (it.qty || it.quantity || 1)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Address */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-orange" />
                  Delivery Address
                </h3>
                {address ? (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="text-sm font-bold text-gray-900">{address.name || 'Recipient'}</p>
                    <p>{address.line1 || address.address_line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>
                      {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                    </p>
                    {address.mobile && (
                      <p className="text-gray-500 pt-1">Phone: <strong>{address.mobile}</strong></p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Address details available in account profile</p>
                )}
              </div>

              {/* Payment Summary */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-orange" />
                  Payment Summary
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Method:</span>
                    <span className="font-bold text-gray-900 uppercase">
                      {order.payment_method === 'razorpay' ? 'Razorpay Secure Online' : order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Status:</span>
                    <span className="font-bold text-emerald-600 capitalize">{order.status}</span>
                  </div>
                  {order.payment_method === 'cod' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Advance Paid:</span>
                      <span className="font-bold text-gray-900">₹{order.advance_paid || 1}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total Paid:</span>
                    <span className="text-brand-orange">₹{Number(order.total).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/my-orders"
                className="flex-1 bg-gradient-to-r from-brand-orange to-brand-maroon text-white font-bold py-3.5 px-6 rounded-2xl text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                View in My Orders
                <Package className="w-4 h-4" />
              </Link>
              <Link
                to="/category/all"
                className="flex-1 bg-white text-gray-800 font-bold py-3.5 px-6 rounded-2xl text-center border border-gray-200 hover:bg-gray-50 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Continue Shopping
                <ShoppingBag className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
