import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Check, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import { Header } from '../components/Header';

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { token, user, fetchProfile, updateProfile, logout } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [profileMsg, setProfileMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile(profileForm.name, profileForm.phone);
    setProfileMsg(res.success ? 'Profile updated!' : res.error);
    setSaving(false);
    setTimeout(() => setProfileMsg(''), 3000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) return setPassMsg('Passwords do not match');
    if (passForm.newPass.length < 6) return setPassMsg('Min 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.current, newPassword: passForm.newPass });
      setPassMsg('Password changed successfully!');
      setPassForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPassMsg(err.response?.data?.error || 'Failed to change password');
    }
    setSaving(false);
    setTimeout(() => setPassMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Account Settings" />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-brand-orange text-white text-2xl font-bold flex items-center justify-center shadow-md">
            {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
              {user?.role === 'admin' ? '👑 Admin' : '✓ Verified'}
            </span>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-orange" /> Personal Information
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Full Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
              <input value={user?.email || ''} disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50" />
            </div>
            {profileMsg && (
              <p className={`text-xs font-semibold ${profileMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{profileMsg}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-brand-orange text-white font-bold py-3 rounded-xl text-sm hover:bg-orange-600 transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-orange" /> Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {[
              { key: 'current', label: 'Current Password', show: showPass.current, toggle: () => setShowPass(p => ({ ...p, current: !p.current })) },
              { key: 'newPass', label: 'New Password', show: showPass.new, toggle: () => setShowPass(p => ({ ...p, new: !p.new })) },
              { key: 'confirm', label: 'Confirm New Password', show: showPass.new, toggle: null },
            ].map(({ key, label, show, toggle }) => (
              <div key={key}>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={passForm[key]}
                    onChange={(e) => setPassForm({ ...passForm, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 pr-10" />
                  {toggle && (
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {passMsg && (
              <p className={`text-xs font-semibold ${passMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{passMsg}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
              Change Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
          <h2 className="text-sm font-bold text-red-600 mb-3">Danger Zone</h2>
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 font-bold py-3 rounded-xl text-sm hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" /> Logout from all devices
          </button>
        </div>
      </div>
    </div>
  );
}
