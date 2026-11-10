import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Trash2, Mail, KeyRound, CheckCircle2, AlertTriangle, ArrowLeft, FileText, Phone, MessageSquare, Store } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export function VendorDeleteAccountPage() {
  const isLoggedIn = Boolean(localStorage.getItem('vendor_token'));
  const [step, setStep] = useState(1); // 1: Email Form, 2: OTP Verification, 3: Success
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid registered vendor email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/deletion-request/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/deletion-request/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to resend verification code.');
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/vendorAuth/deletion-request/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          phone: phone.trim() || undefined,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Verification failed. Please check the code and try again.');
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] min-h-screen font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-[#022A21] pt-12 pb-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Store className="w-3.5 h-3.5" /> ULMGH-369 Vendor Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Vendor Account & Data Deletion
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Submit a verified request to permanently close your ULMGH Vendor account and delete associated seller personal data.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 relative z-20 space-y-8">
        {isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">You are currently signed in to your Vendor account.</span> You can also delete your account directly from{' '}
              <Link to="/vendor/profile" className="font-bold text-amber-700 underline hover:text-amber-800">
                Vendor Profile &gt; Danger Zone
              </Link>.
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fe6603] font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Step 1: Enter Your Registered Vendor Email</h2>
                  <p className="text-xs text-gray-500">We will send a 6-digit verification code to verify seller ownership.</p>
                </div>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Registered Vendor Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. store@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Contact Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Registered phone number"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Reason for Closing Account (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Optional feedback..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#fe6603] hover:bg-[#e55c02] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending Verification Code...' : 'Send Verification Code'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fe6603] font-bold">
                    2
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Step 2: Verify Email Ownership</h2>
                    <p className="text-xs text-gray-500">
                      Code sent to <span className="font-bold text-gray-800">{email}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrorMsg(''); }}
                  className="text-xs font-semibold text-gray-500 hover:text-[#fe6603] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit Email
                </button>
              </div>

              <form onSubmit={handleConfirmDeletion} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    6-Digit Verification Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Valid for 10 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || loading}
                      className="font-bold text-[#fe6603] hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {loading ? 'Verifying & Processing...' : 'Confirm & Delete Vendor Account'}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Account Deleted</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                Your email ownership has been verified and your vendor account for <strong className="text-gray-900">{email}</strong> has been closed and anonymized. A confirmation email has been sent to your inbox.
              </p>
              <Link
                to="/vendor-login"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#022A21] hover:bg-[#033429] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Back to Vendor Login
              </Link>
            </div>
          )}
        </div>

        {/* Data Deletion & Retention Disclosures */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <FileText className="w-5 h-5 text-[#fe6603]" />
            <h3 className="text-lg font-bold text-[#022A21]">Vendor Data Deletion & Retention Policy</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-red-50/60 border border-red-100 rounded-2xl p-5">
              <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                Data Deleted / Deactivated
              </h4>
              <ul className="text-red-950/80 space-y-1.5 list-disc pl-5 text-xs md:text-sm">
                <li>Vendor owner name, store name, contact email, and phone number.</li>
                <li>Pickup warehouse contact details and street address fields.</li>
                <li>Saved bank account holder name, account number, and IFSC details.</li>
                <li>Account password, active products (archived), vendor support agents, OTPs, and FCM notification tokens.</li>
              </ul>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
              <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Data Retained & Wallet Requirement
              </h4>
              <ul className="text-emerald-950/80 space-y-1.5 list-disc pl-5 text-xs md:text-sm">
                <li>
                  <strong>Active Wallet Balance:</strong> Accounts with a wallet balance above ₹0 cannot be closed until remaining funds are settled/withdrawn via admin support.
                </li>
                <li>
                  <strong>Business & Tax Records:</strong> Historical fulfilled orders, payout records, and subscription payment IDs are preserved strictly for commercial accounting and tax compliance.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 text-xs text-gray-500 leading-relaxed">
            Need assistance settling your wallet or closing your store? Contact{' '}
            <a href="mailto:ulmgh369@gmail.com" className="text-[#fe6603] font-bold hover:underline">
              ulmgh369@gmail.com
            </a>{' '}
            or call +91 90326 75205.
          </div>
        </div>
      </div>
    </div>
  );
}

