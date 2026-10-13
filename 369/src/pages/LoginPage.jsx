import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import logo from '../assets/logo.png';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, forgotPassword, verifyResetOtp, resetPassword, loginWithGoogle, handleGoogleCallback, loading, error } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [step, setStep] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', otp: '', newPassword: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Google OAuth callback token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    if (token) {
      try {
        const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
        handleGoogleCallback(token, user);
        navigate('/');
      } catch (e) {
        setLocalError('Google login failed. Please try again.');
      }
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const clearMessages = () => { setLocalError(''); setSuccessMsg(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); clearMessages();
    const res = await login(form.email, form.password);
    if (res.success) navigate(res.role === 'admin' ? '/admin' : '/');
    else setLocalError(res.error);
  };

  const handleForgotEmail = async (e) => {
    e.preventDefault(); clearMessages();
    if (!form.email) return setLocalError('Please enter your email');
    const res = await forgotPassword(form.email);
    if (res.success) { setSuccessMsg('OTP sent to your email.'); setStep('forgot_otp'); }
    else setLocalError(res.error);
  };

  const handleForgotOtp = async (e) => {
    e.preventDefault(); clearMessages();
    const res = await verifyResetOtp(form.email, form.otp);
    if (res.success) { setSuccessMsg('OTP verified. Set your new password.'); setStep('forgot_reset'); }
    else setLocalError(res.error);
  };

  const handleForgotReset = async (e) => {
    e.preventDefault(); clearMessages();
    if (form.newPassword !== form.confirmPassword) return setLocalError('Passwords do not match');
    if (form.newPassword.length < 6) return setLocalError('Password must be at least 6 characters');
    const res = await resetPassword(form.email, form.otp, form.newPassword);
    if (res.success) {
      setSuccessMsg('Password reset! You can now login.');
      setStep('login');
      setForm({ ...form, password: '', otp: '', newPassword: '', confirmPassword: '' });
    } else setLocalError(res.error);
  };

  const displayError = localError || (step === 'login' && error);

  const inputClass = "w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 pl-11 text-[15px] text-gray-900 focus:outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 focus:bg-white transition-all bg-gray-50 placeholder-gray-400 font-medium shadow-sm hover:border-gray-200";
  const btnClass = "w-full bg-brand-blue text-white font-bold py-4 rounded-2xl text-[15px] shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:bg-blue-700 hover:shadow-[0_8px_25px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2";

  const stepMeta = {
    login: { emoji: '👋', title: 'Welcome Back', sub: 'Sign in to your ULMGH369 account' },
    forgot_email: { emoji: '🔑', title: 'Reset Password', sub: 'Enter your registered email to get an OTP' },
    forgot_otp: { emoji: '📨', title: 'Verify OTP', sub: `Code sent to ${form.email}` },
    forgot_reset: { emoji: '🔒', title: 'New Password', sub: 'Set a strong new password for your account' },
  };
  const meta = stepMeta[step];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── HEADER STYLE HERO ── */}
      <div className="relative flex flex-col items-center pt-14 pb-24 px-6 overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-gray-100" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-3xl" />
        </div>

        <button onClick={() => step !== 'login' ? (setStep('login'), clearMessages()) : navigate(-1)}
          className="absolute top-5 left-5 z-10 flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors bg-white hover:bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
          <ArrowLeft className="w-3.5 h-3.5" /> {step !== 'login' ? 'Back' : 'Home'}
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-[90px] h-[90px] rounded-[1.75rem] bg-white border border-gray-100 flex items-center justify-center shadow-lg">
              <img src={logo} alt="ULMGH369" className="h-14 w-14 object-contain" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-brand-blue rounded-full border-[3px] border-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-gray-900 text-[22px] font-extrabold tracking-widest" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.18em' }}>ULMGH369</h1>
          <p className="text-brand-orange text-[10px] font-bold tracking-[0.28em] uppercase mt-1">Your Choice, From Anywhere.</p>
          <div className="flex items-center gap-5 mt-5">
            {['10K+ Members', '100% Secure', 'Free Replacements'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/70" />
                <span className="text-gray-500 text-[10px] font-bold">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHITE CARD ── */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] -mt-12 relative z-10 px-5 pt-8 pb-10 shadow-[0_-24px_60px_rgba(0,0,0,0.3)]">
        <div className="max-w-sm mx-auto">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#022A21]" style={{ fontFamily: 'Georgia, serif' }}>
              {meta.title} {meta.emoji}
            </h2>
            <p className="text-[13px] text-gray-500 mt-1.5">{meta.sub}</p>
          </div>

          {displayError && (
            <div className="mb-5 bg-red-50 text-red-600 text-[13px] font-semibold px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2">
              <span className="w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] font-black shrink-0">!</span>
              {displayError}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 bg-emerald-50 text-emerald-700 text-[13px] font-semibold px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-500 rounded-full text-white flex items-center justify-center text-[10px] shrink-0">✓</span>
              {successMsg}
            </div>
          )}

          {/* LOGIN */}
          {step === 'login' && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email address" className={inputClass} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} required placeholder="Password" className={inputClass + ' pr-12'} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={() => { setStep('forgot_email'); clearMessages(); }} className="text-[13px] font-semibold text-brand-orange hover:underline underline-offset-2">Forgot Password?</button>
                </div>
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging in...</> : 'Login Securely →'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 mt-5 mb-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-medium px-1">or continue with</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google Button */}
              <button onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-2xl text-[15px] transition-all shadow-sm hover:shadow-md active:scale-[0.98] mb-5">
                <GoogleIcon />
                Continue with Google
              </button>
              <Link to="/signup" className="flex items-center justify-center w-full border-2 border-brand-blue/25 text-brand-blue font-bold py-3.5 rounded-2xl text-[15px] hover:bg-brand-blue/5 hover:border-brand-blue/50 transition-all">
                Create Account
              </Link>
            </>
          )}

          {/* FORGOT EMAIL */}
          {step === 'forgot_email' && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Registered email address" className={inputClass} />
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</> : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* FORGOT OTP */}
          {step === 'forgot_otp' && (
            <form onSubmit={handleForgotOtp} className="space-y-5">
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input name="otp" type="text" value={form.otp} onChange={handleChange} required maxLength={6}
                  placeholder="Enter 6-digit OTP" className={inputClass + ' tracking-[0.5em] text-center text-lg font-bold pl-4'} />
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</> : 'Verify OTP →'}
              </button>
            </form>
          )}

          {/* FORGOT RESET */}
          {step === 'forgot_reset' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              {[
                { name: 'newPassword', show: showNewPass, toggle: () => setShowNewPass(!showNewPass), placeholder: 'New password' },
                { name: 'confirmPassword', show: showConfirmPass, toggle: () => setShowConfirmPass(!showConfirmPass), placeholder: 'Confirm new password' },
              ].map(f => (
                <div key={f.name} className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input name={f.name} type={f.show ? 'text' : 'password'} value={form[f.name]} onChange={handleChange} required minLength={6} placeholder={f.placeholder} className={inputClass + ' pr-12'} />
                  <button type="button" onClick={f.toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors">
                    {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</> : 'Reset Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
