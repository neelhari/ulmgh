import React, { useState, useEffect } from 'react';
import { Wallet, IndianRupee, Landmark, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function VendorWalletPage() {
  const [vendor, setVendor] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vendor_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchWallet = fetch(`${BACKEND_URL}/vendorAuth/me`, { headers }).then(r => r.json());
    const fetchTxns = fetch(`${BACKEND_URL}/vendor/transactions`, { headers }).then(r => r.json());

    Promise.all([fetchWallet, fetchTxns])
      .then(([walletData, txnData]) => {
        if (walletData.vendor) setVendor(walletData.vendor);
        setTransactions(txnData.transactions || []);
      })
      .catch(() => toast.error('Failed to load wallet data'))
      .finally(() => setLoading(false));
  }, []);

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Virtual Wallet</h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm font-medium">Track your earnings, payouts, and transaction history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#fe6603] to-[#e55c02] p-5 sm:p-8 rounded-2xl sm:rounded-[24px] text-white shadow-[0_8px_30px_rgba(254,102,3,0.3)] relative overflow-hidden group transition-all duration-300 hover:shadow-[0_12px_40px_rgba(254,102,3,0.4)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-sm sm:text-lg font-bold tracking-wide uppercase text-white/90">Available Balance</span>
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 opacity-90 shrink-0" />
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight truncate">
                {loading || !vendor ? '...' : parseFloat(vendor.wallet_balance || 0).toLocaleString()}
              </h2>
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="group bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-green-500/30 flex-shrink-0">
            <ArrowDownLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold text-gray-400 tracking-wide uppercase mb-0.5 sm:mb-1">Total Earned</p>
            <h3 className="text-xl sm:text-3xl font-extrabold text-green-600 tracking-tight truncate">
              {loading ? '...' : `₹${totalCredits.toLocaleString()}`}
            </h3>
          </div>
        </div>

        {/* Total Payouts */}
        <div className="group bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-3.5 sm:gap-5 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-500/30 flex-shrink-0">
            <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="z-10 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold text-gray-400 tracking-wide uppercase mb-0.5 sm:mb-1">Total Payouts</p>
            <h3 className="text-xl sm:text-3xl font-extrabold text-red-500 tracking-tight truncate">
              {loading ? '...' : `₹${totalDebits.toLocaleString()}`}
            </h3>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl sm:rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 overflow-hidden mt-6 sm:mt-8">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex items-center gap-2.5 sm:gap-3 bg-gradient-to-b from-gray-50/50 to-white">
          <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </div>
          <h3 className="text-base sm:text-xl font-bold text-gray-900">Transaction History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium text-sm">No transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">Earnings from customer orders will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map(txn => (
              <div key={txn.id} className="px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between gap-3 hover:bg-gray-50/80 active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${txn.type === 'credit' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-500'}`}>
                    {txn.type === 'credit' ? <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-xs sm:text-base mb-0.5 truncate">
                      {txn.type === 'credit' ? 'Order Earning' : 'Payout'}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                      {txn.order_number && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-bold text-[10px] sm:text-xs uppercase tracking-wider shrink-0">
                          {txn.order_number}
                        </span>
                      )}
                      <span className="truncate">{txn.description || ''}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-extrabold text-sm sm:text-xl tracking-tight ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{parseFloat(txn.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">
                    {new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
