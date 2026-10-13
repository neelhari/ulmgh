import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'react-toastify';

export function ReferPage() {
  const [copiedFriend, setCopiedFriend] = useState(false);
  const [copiedStore, setCopiedStore] = useState(false);
  const friendCode = "SWABHI501";
  const storeCode = "STORE501";

  const handleCopyFriend = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedFriend(true);
    toast.success("Friend referral code copied!");
    setTimeout(() => setCopiedFriend(false), 2000);
  };

  const handleCopyStore = () => {
    navigator.clipboard.writeText(storeCode);
    setCopiedStore(true);
    toast.success("Store referral code copied!");
    setTimeout(() => setCopiedStore(false), 2000);
  };

  const steps = [
    { title: "Share Code", desc: "Share your unique link or code with friends.", icon: Share2 },
    { title: "Friend Signs Up", desc: "They get a special discount on their first order.", icon: Users },
    { title: "Your Earnings ", desc: "Once they complete their order, you get rewards.", icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Banner */}
      <div className="bg-[#022A21] pt-12 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/20 to-yellow-500/20 opacity-50"></div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gift className="w-48 h-48 text-brand-orange" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10 text-center">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Gift className="w-16 h-16 text-brand-orange mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md">
              Refer by <span className="text-brand-orange">A 501</span>
            </h1>
            <p className="text-gray-300 text-lg">Give your friends a treat, and get rewarded when they shop with us.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-20">
        {/* Friend Referral Code Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Refer to your friend</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full bg-orange-50 border-2 border-dashed border-brand-orange/50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-2xl font-black text-brand-orange tracking-widest">{friendCode}</span>
              <button onClick={handleCopyFriend} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                {copiedFriend ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-gray-500" />}
              </button>
            </div>
            <button className="w-full md:w-auto bg-gradient-to-r from-brand-orange to-yellow-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" /> Share Link
            </button>
          </div>
        </motion.div>
        
        {/* Store Referral Code Card */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="mt-6 bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Refer to a new store</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full bg-green-50 border-2 border-dashed border-[#054335]/50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-2xl font-black text-[#054335] tracking-widest">{storeCode}</span>
              <button onClick={handleCopyStore} className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                {copiedStore ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-gray-500" />}
              </button>
            </div>
            <button className="w-full md:w-auto bg-gradient-to-r from-[#054335] to-[#0a6c56] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" /> Share Link
            </button>
          </div>
        </motion.div>
        

        {/* How it works */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-2xl shadow-md p-6 md:p-8 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">How It Works</h3>
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center shrink-0 border border-orange-100">
                  <step.icon className="w-6 h-6 text-brand-orange" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{step.title}</h4>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Stats */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Referrals</p>
            <p className="text-3xl font-black text-gray-800">0</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Earned</p>
            <p className="text-3xl font-black text-green-500">₹0</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
