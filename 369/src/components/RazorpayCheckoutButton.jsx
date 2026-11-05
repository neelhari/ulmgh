import React, { useState } from 'react';

/**
 * Ensures Razorpay Checkout script is loaded in the DOM.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.onload = () => resolve(true);
      existing.onerror = () => resolve(false);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Razorpay Standard Web Checkout Button
 * 
 * @param {number} amount - Amount in paise (e.g. 50000 for ₹500.00) or rupees if inRupees is true
 * @param {boolean} inRupees - If true, amount is in Rupees and will be converted to paise
 * @param {string} currency - Currency code (default 'INR')
 * @param {string} name - Merchant/Store name
 * @param {string} description - Order description
 * @param {object} prefill - { name, email, contact }
 * @param {function} onSuccess - Callback when payment and verification succeed: ({ paymentId, orderId, signature })
 * @param {function} onError - Callback on payment failure or verification failure
 * @param {function} onCancel - Callback when user dismisses the modal
 * @param {string} buttonText - Text displayed on button
 * @param {string} className - Optional styling classes
 * @param {boolean} disabled - Disable button
 */
export function RazorpayCheckoutButton({
  amount = 10000, // 10000 paise = ₹100
  inRupees = false,
  currency = 'INR',
  name = 'ULMGH-369 Store',
  description = 'Online Purchase',
  prefill = {},
  onSuccess,
  onError,
  onCancel,
  buttonText = 'Pay with Razorpay',
  className = '',
  disabled = false
}) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);

      // 1. Ensure Razorpay checkout.js is available
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Convert rupees to paise if requested
      const amountInPaise = inRupees ? Math.round(Number(amount) * 100) : Math.round(Number(amount));

      if (amountInPaise < 100) {
        throw new Error('Minimum payment amount must be at least ₹1 (100 paise).');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

      // 2. STEP 1: BACKEND - Call /api/create-order
      const createOrderRes = await fetch(`${backendUrl}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}`
        })
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create payment order on server.');
      }

      // Key ID from backend response or environment variable
      const razorpayKeyId = orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error('Razorpay Key ID is not configured.');
      }

      // 3. STEP 2: FRONTEND - Open Razorpay Modal with order_id
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill.name || '',
          email: prefill.email || '',
          contact: prefill.contact || ''
        },
        theme: {
          color: '#fe6603' // Brand accent orange
        },
        // Handler on payment success in modal
        handler: async function (response) {
          try {
            setLoading(true);
            setStatusMessage('Verifying payment signature...');

            // STEP 3: BACKEND - Send razorpay_payment_id, razorpay_order_id, razorpay_signature to verify endpoint
            const verifyRes = await fetch(`${backendUrl}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setStatusMessage('Payment verified successfully!');
            if (onSuccess) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                verifiedData: verifyData
              });
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setStatusMessage(`Verification Error: ${verifyErr.message}`);
            if (onError) onError(verifyErr);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          // User closed/dismissed the modal
          ondismiss: function () {
            setLoading(false);
            setStatusMessage('Payment cancelled by user.');
            if (onCancel) onCancel();
          }
        }
      };

      const razorpayModal = new window.Razorpay(options);

      // Listen for payment failure event
      razorpayModal.on('payment.failed', function (failResponse) {
        console.error('Razorpay payment.failed:', failResponse.error);
        const errorDesc = failResponse.error?.description || failResponse.error?.reason || 'Payment could not be completed.';
        setStatusMessage(`Payment Failed: ${errorDesc}`);
        setLoading(false);
        if (onError) onError(failResponse.error);
      });

      razorpayModal.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setStatusMessage(`Error: ${err.message}`);
      setLoading(false);
      if (onError) onError(err);
    }
  };

  const defaultStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm md:text-base";

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || loading}
        className={className || defaultStyles}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        )}
        <span>{loading ? 'Processing Payment...' : buttonText}</span>
      </button>

      {statusMessage && (
        <span className={`text-xs mt-1 font-medium ${
          statusMessage.includes('successfully') ? 'text-green-600' : 'text-red-500'
        }`}>
          {statusMessage}
        </span>
      )}
    </div>
  );
}

export default RazorpayCheckoutButton;

