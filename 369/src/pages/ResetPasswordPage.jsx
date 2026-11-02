import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const { resetPassword, verifyResetToken, loading } = useAuthStore();

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [associatedEmail, setAssociatedEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setErrorMsg('No password reset token was provided. Please check the link from your email.');
      return;
    }

    const checkToken = async () => {
      setVerifying(true);
      setErrorMsg('');
      const res = await verifyResetToken(token);
      setVerifying(false);
      if (res.success) {
        setTokenValid(true);
        setAssociatedEmail(res.email || '');
      } else {
        setTokenValid(false);
        setErrorMsg(res.error || 'This password reset link is invalid or has expired.');
      }
    };

    checkToken();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (form.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const res = await resetPassword(token, form.newPassword);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setErrorMsg(res.error || 'Failed to reset password. Please try again.');
    }
  };

  const inputClass = "w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 pl-11 text-[15px] text-gray-900 focus:outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white transition-all bg-gray-50 placeholder-gray-400 font-medium shadow-sm hover:border-gray-200";
  const btnClass = "w-full bg-brand-blue text-white font-bold py-4 rounded-2xl text-[15px] shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:bg-blue-700 hover:shadow-[0_8px_25px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-3 cursor-pointer";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Header */}
      <div className="relative flex flex-col items-center pt-14 pb-24 px-6 overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-gray-100" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <span className="text-3xl mb-3 select-none">🔐</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create New Password</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {associatedEmail ? `For account ${associatedEmail}` : 'Set a strong new password for your account'}
          </p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex items-start justify-center px-4 -mt-12 pb-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-8 sm:p-10 relative z-20">
          
          {/* Loading verification state */}
          {verifying && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <span className="w-8 h-8 border-3 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-600">Verifying your reset link...</p>
            </div>
          )}

          {/* Invalid or Expired Token State */}
          {!verifying && !tokenValid && !success && (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Link Unavailable</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {errorMsg || 'This password reset link is invalid or has already been used.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-brand-blue text-white font-bold py-3.5 rounded-2xl text-[14px] shadow-sm hover:bg-blue-700 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Request a New Link
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Password Reset Complete!</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your password has been successfully updated. You can now log in with your new credentials.
                </p>
              </div>
              <p className="text-xs text-gray-400">Redirecting to login in 3 seconds...</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 w-full bg-brand-blue text-white font-bold py-3.5 rounded-2xl text-[14px] shadow-sm hover:bg-blue-700 transition-all"
                >
                  Go to Login Now →
                </Link>
              </div>
            </div>
          )}

          {/* Form State */}
          {!verifying && tokenValid && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* New Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  name="newPassword"
                  type={showPass ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="New password (min. 6 characters)"
                  className={inputClass + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                  className={inputClass + ' pr-12'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Save New Password
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
export default ResetPasswordPage;

