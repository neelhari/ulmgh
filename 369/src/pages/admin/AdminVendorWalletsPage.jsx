import React, { useState, useEffect } from 'react';
import { Search, Wallet, IndianRupee, Send, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function AdminVendorWalletsPage() {
  const [vendors, setVendors] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vendorsRes, payoutsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/vendors`, { headers }).then(r => r.json()),
        fetch(`${BACKEND_URL}/admin/vendor-payouts`, { headers }).then(r => r.json())
      ]);

      if (vendorsRes.vendors) setVendors(vendorsRes.vendors.filter(v => v.status === 'approved'));
      if (payoutsRes.payouts) setPayouts(payoutsRes.payouts);
    } catch (error) {
      toast.error('Failed to load vendor wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPayoutModal = (vendor) => {
    setSelectedVendor(vendor);
    setPayoutAmount(vendor.wallet_balance || '');
    setPayoutModalOpen(true);
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setPayoutLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/vendors/${selectedVendor.id}/payout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(payoutAmount) })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`₹${payoutAmount} payout processed for ${selectedVendor.store_name}`);
        setPayoutModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || 'Payout failed');
      }
    } catch (error) {
      toast.error('Failed to process payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Wallets & Payouts</h1>
        <p className="text-gray-500 mt-1">Manage vendor earnings and process payouts.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors by store name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-12 text-center text-gray-500">Loading wallets...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            No active vendors found.
          </div>
        ) : (
          filteredVendors.map(vendor => {
            const balance = parseFloat(vendor.wallet_balance || 0);
            return (
              <div key={vendor.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{vendor.store_name}</h3>
                    <p className="text-sm text-gray-500">{vendor.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-gray-900">₹{balance.toLocaleString()}</span>
                    <button
                      onClick={() => openPayoutModal(vendor)}
                      disabled={balance <= 0}
                      className="flex items-center gap-2 bg-[#fe6603] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#e55c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" /> Payout
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900">Payout History</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Send className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No payouts processed yet</p>
            <p className="text-sm text-gray-400 mt-1">Payouts will appear here once you process them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-medium">Vendor</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Description</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{p.vendor_name || p.store_name || `Vendor #${p.vendor_id}`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${p.type === 'debit' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {p.type === 'debit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {p.type === 'debit' ? 'Payout' : 'Credit'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${p.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                        {p.type === 'debit' ? '-' : '+'}₹{parseFloat(p.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {p.order_number && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium mr-1">{p.order_number}</span>}
                      {p.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {payoutModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Process Payout</h2>
            <p className="text-gray-500 text-sm mb-6">
              You are processing a payout for <strong>{selectedVendor.store_name}</strong>. 
              Their current balance is ₹{parseFloat(selectedVendor.wallet_balance || 0).toLocaleString()}.
            </p>
            
            <form onSubmit={handlePayout}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payout Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={selectedVendor.wallet_balance || 0}
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fe6603] focus:border-transparent" 
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={payoutLoading}
                  className="flex-1 bg-[#fe6603] text-white px-4 py-3 rounded-xl font-medium hover:bg-[#e55c00] disabled:opacity-50"
                >
                  {payoutLoading ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
