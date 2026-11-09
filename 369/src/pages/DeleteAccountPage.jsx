import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Trash2, Mail, KeyRound, CheckCircle2, AlertTriangle, ArrowLeft, FileText, Phone, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

export function DeleteAccountPage() {
  const { token } = useAuthStore();
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
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/deletion-request/send-code', { email: cleanEmail });
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setErrorMsg('');
    setLoading(true);
    try {
      await api.post('/auth/deletion-request/send-code', { email: email.trim().toLowerCase() });
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend verification code.');
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
      await api.post('/auth/deletion-request/confirm', {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        phone: phone.trim() || undefined,
        reason: reason.trim() || undefined,
      });
      setStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] min-h-screen font-sans pb-20 md:pb-12">
      {/* Header Banner */}
      <div className="bg-[#022A21] pt-12 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-orange/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5 border border-red-500/30 text-red-400"
          >
            <ShieldAlert className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-white mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Request Account & Data Deletion
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed"
          >
            ULMGH-369 provides users full control over their personal data. Submit a verified request below to permanently delete your account.
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 relative z-20 space-y-8">
        {/* Logged in prompt */}
        {token && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-bold">You are currently logged in.</span> You can also delete your account instantly from your app or account settings:{' '}
              <Link to="/account-settings" className="font-bold text-amber-700 underline hover:text-amber-800">
                Go to Account Settings
              </Link>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-10">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Step 1: Enter Your Account Email</h2>
                  <p className="text-xs text-gray-500">We will send a 6-digit verification code to prove email ownership.</p>
                </div>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Registered Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Associated phone number"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
                    Reason for Deletion (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Let us know why you are leaving (optional feedback)..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
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
                  className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md hover:shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange font-bold">
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
                  className="text-xs font-semibold text-gray-500 hover:text-brand-orange flex items-center gap-1"
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
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:bg-white transition-all"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>Valid for 10 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || loading}
                      className="font-bold text-brand-orange hover:underline disabled:opacity-50 disabled:no-underline"
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md hover:shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying & Submitting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm & Submit Deletion Request
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                Your email ownership has been verified and your account deletion request for <strong className="text-gray-900">{email}</strong> has been received. A confirmation email has been sent to your inbox.
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-gray-600 space-y-1.5 mb-6">
                <p>• Account personal details and delivery addresses will be wiped.</p>
                <p>• Active authentication sessions and notification tokens will be revoked.</p>
                <p>• Statutory order records are preserved for commercial and tax compliance.</p>
              </div>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#022A21] hover:bg-[#033429] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
              >
                Return to Home
              </Link>
            </div>
          )}
        </div>

        {/* Data Deletion & Retention Disclosures */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <FileText className="w-5 h-5 text-brand-orange" />
            <h3 className="text-lg font-bold text-[#022A21]">Data Deletion & Retention Policy</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-red-50/60 border border-red-100 rounded-2xl p-5">
              <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                What Data is Permanently Deleted
              </h4>
              <ul className="text-red-950/80 space-y-1.5 list-disc pl-5 text-xs md:text-sm">
                <li>Your profile details (full name, email, phone number, avatar).</li>
                <li>Saved delivery addresses from your address book.</li>
                <li>Account credentials, passwords, and linked Google Sign-In associations.</li>
                <li>Active login sessions and push notification device tokens.</li>
                <li>Pending OTP verification codes.</li>
              </ul>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5">
              <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                What Data is Retained & Why
              </h4>
              <ul className="text-emerald-950/80 space-y-1.5 list-disc pl-5 text-xs md:text-sm">
                <li>
                  <strong>Commercial Order Records:</strong> Past completed order numbers, product purchased details, fulfillment logs, and amounts paid.
                </li>
                <li>
                  <strong>Statutory Tax Invoices & Financials:</strong> Invoices, tax records, and payment gateway transaction references (e.g. Razorpay payment IDs).
                </li>
                <li>
                  <strong>Purpose:</strong> Retained strictly to comply with applicable commercial, tax, and financial accounting laws and regulatory requirements.
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-2 text-xs text-gray-500 leading-relaxed">
            Need further assistance? Contact our data support desk at{' '}
            <a href="mailto:ulmgh369@gmail.com" className="text-brand-orange font-bold hover:underline">
              ulmgh369@gmail.com
            </a>{' '}
            or call us at +91 90326 75205.
          </div>
        </div>
      </div>
    </div>
  );
}

