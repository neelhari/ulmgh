import React, { useState } from 'react';
import { Header } from '../components/Header';
import { RazorpayCheckoutButton } from '../components/RazorpayCheckoutButton';
import { CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export function RazorpayTestPage() {
  const [testAmount, setTestAmount] = useState(500); // in Rupees
  const [lastPayment, setLastPayment] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);

  const handleSuccess = (details) => {
    setLastPayment(details);
    setErrorDetails(null);
  };

  const handleError = (err) => {
    setErrorDetails(err.message || 'Payment failed');
  };

  const handleCancel = () => {
    console.log('Payment modal dismissed by user');
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen text-gray-800 font-sans pb-20">
      <Header variant="back" title="Razorpay Checkout Test" />

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#fe6603]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-serif">Razorpay Standard Web Checkout</h2>
              <p className="text-xs sm:text-sm text-gray-500">Test order creation, modal checkout, and HMAC-SHA256 signature verification</p>
            </div>
          </div>

          <div className="space-y-4 my-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Test Amount (INR ₹)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-700">₹</span>
                <input 
                  type="number"
                  min="1"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-900 focus:outline-none focus:border-[#fe6603]"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Paise equivalent: {testAmount * 100} paise</p>
            </div>
          </div>

          <div className="pt-2">
            <RazorpayCheckoutButton
              amount={testAmount}
              inRupees={true}
              name="ULMGH-369 Marketplace"
              description={`Test Checkout for ₹${testAmount}`}
              prefill={{
                name: "Test Customer",
                email: "customer@ulmgh-369.com",
                contact: "9876543210"
              }}
              buttonText={`Pay ₹${testAmount} via Razorpay`}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {lastPayment && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 sm:p-8 animate-in fade-in shadow-md">
            <div className="flex items-center gap-3 mb-4 text-green-700">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-extrabold">Payment & Signature Verified!</h3>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-gray-700 font-mono bg-white p-4 rounded-xl border border-green-100 overflow-x-auto">
              <div><strong>Payment ID:</strong> {lastPayment.paymentId}</div>
              <div><strong>Order ID:</strong> {lastPayment.orderId}</div>
              <div className="break-all"><strong>Signature:</strong> {lastPayment.signature}</div>
              <div className="text-green-600 font-bold mt-2">Status: 200 OK - HMAC-SHA256 Match Verified by Backend</div>
            </div>
          </div>
        )}

        {errorDetails && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 text-red-700 animate-in fade-in shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-extrabold">Payment Error</h3>
            </div>
            <p className="text-sm font-mono">{errorDetails}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RazorpayTestPage;

