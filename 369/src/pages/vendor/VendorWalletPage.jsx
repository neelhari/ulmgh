import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, IndianRupee, Landmark, ArrowUpRight, ArrowDownLeft, 
  Clock, AlertCircle, Building2, CheckCircle2, AlertTriangle, 
  Search, Filter, X, ShieldCheck, RefreshCw, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function VendorWalletPage() {
  const [vendor, setVendor] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Bank Edit Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('vendor_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [walletRes, txRes] = await Promise.all([
        fetch(`${BACKEND_URL}/vendorAuth/me`, { headers }).then(r => r.json()),
        fetch(`${BACKEND_URL}/vendor/transactions`, { headers }).then(r => r.json())
      ]);

      if (walletRes.vendor) {
        setVendor(walletRes.vendor);
        setHolderName(walletRes.vendor.bank_account_holder_name || walletRes.vendor.name || '');
        setBankName(walletRes.vendor.bank_name || '');
        setAccountNumber(walletRes.vendor.bank_account_number || '');
        setConfirmAccountNumber(walletRes.vendor.bank_account_number || '');
        setIfscCode(walletRes.vendor.bank_ifsc_code || '');
      }
      if (txRes.transactions) {
        setTransactions(txRes.transactions);
      }
    } catch (err) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Summary Metrics computed from actual transactions
  const metrics = useMemo(() => {
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalCommission = transactions
      .filter(t => t.type === 'credit' && t.commission_amount != null)
      .reduce((sum, t) => sum + parseFloat(t.commission_amount || 0), 0);

    const totalGross = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.gross_amount || t.amount || 0), 0);

    return { totalCredits, totalDebits, totalCommission, totalGross };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (t.order_number && t.order_number.toLowerCase().includes(term)) ||
        (t.bank_reference && t.bank_reference.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term));
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, searchTerm]);

  // Open bank modal and pre-fill with saved details
  const openBankModal = () => {
    if (vendor) {
      setHolderName(vendor.bank_account_holder_name || vendor.name || '');
      setBankName(vendor.bank_name || '');
      setAccountNumber(vendor.bank_account_number || '');
      setConfirmAccountNumber(vendor.bank_account_number || '');
      setIfscCode(vendor.bank_ifsc_code || '');
    }
    setBankModalOpen(true);
  };

  // Handle Bank Details Submission
  const handleBankDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!accountNumber.trim() || !ifscCode.trim()) {
      toast.error('Account number and IFSC code are required');
      return;
    }
    if (accountNumber.trim() !== confirmAccountNumber.trim()) {
      toast.error('Bank account numbers do not match');
      return;
    }

    const cleanIfsc = ifscCode.trim().toUpperCase();

    setBankSubmitting(true);
    try {
      const token = localStorage.getItem('vendor_token');
      const res = await fetch(`${BACKEND_URL}/vendor/bank-details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bank_account_holder_name: holderName.trim(),
          bank_name: bankName.trim(),
          bank_account_number: accountNumber.trim(),
          bank_ifsc_code: cleanIfsc
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Bank details saved successfully');
        setBankModalOpen(false);
        await fetchWalletData();
      } else {
        toast.error(data.error || 'Failed to save bank details');
      }
    } catch (err) {
      toast.error('Failed to communicate with server');
    } finally {
      setBankSubmitting(false);
    }
  };

  const balance = parseFloat(vendor?.wallet_balance || 0);
  const debt = parseFloat(vendor?.outstanding_debt || 0);
  const bankStatus = vendor?.bank_verification_status || 'not_provided';

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-[#fe6603]" />
            <span>Virtual Wallet & Earnings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track order earnings, platform commission deductions, manual payout settlements, and bank details.
          </p>
        </div>
        <button
          onClick={fetchWalletData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Outstanding Debt Notice (if applicable) */}
      {debt > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-800">
              Outstanding Debt: ₹{debt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-amber-700 leading-relaxed">
              This balance arises from an order cancelled after its earnings were paid out. To keep your account clear, this amount will automatically be recovered from your next customer sales before funds credit to your available wallet balance.
            </p>
          </div>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance Card */}
        <div className="bg-gradient-to-br from-[#022A21] to-[#044a3b] p-5 rounded-2xl text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">Available Balance</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold opacity-80">₹</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight truncate">
                {loading ? '...' : balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <p className="text-[11px] text-white/70 mt-1">Available for payout settlement</p>
          </div>
        </div>

        {/* Total Net Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Earned</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-400">₹</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-green-700 tracking-tight truncate">
                {loading ? '...' : metrics.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Net credited after commission</p>
          </div>
        </div>

        {/* Total Platform Commission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Commission</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-400">₹</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight truncate">
                {loading ? '...' : metrics.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Agreed plan rate deductions</p>
          </div>
        </div>

        {/* Total Payouts Received */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Payouts Received</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-400">₹</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight truncate">
                {loading ? '...' : metrics.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Transferred to your bank account</p>
          </div>
        </div>
      </div>

      {/* Beneficiary Bank Account Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Payout Bank Account</h3>
            {vendor?.bank_account_number ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Linked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                Not Added
              </span>
            )}
          </div>
          {vendor?.bank_account_number ? (
            <p className="text-xs text-slate-600 font-mono">
              {vendor.bank_name || 'Bank'} •••• {vendor.bank_account_number.slice(-4)} (IFSC: {vendor.bank_ifsc_code}) • {vendor.bank_account_holder_name}
            </p>
          ) : (
            <p className="text-xs text-amber-700">
              You haven't provided your bank account details yet. Please add them below so the admin can settle your payouts.
            </p>
          )}
        </div>
        <button
          onClick={openBankModal}
          className="self-start md:self-auto px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
        >
          {vendor?.bank_account_number ? 'Update Bank Details' : 'Add Bank Account'}
        </button>
      </div>

      {/* Transaction History Ledger Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Detailed Transaction Ledger</h3>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {filteredTransactions.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search order # or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Filter:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Transactions</option>
                <option value="credit">Order Earnings (+)</option>
                <option value="debit">Payouts (-)</option>
                <option value="reversal">Order Reversals (-)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Type & Reference</th>
                <th className="px-5 py-3.5 text-right">Gross Order</th>
                <th className="px-5 py-3.5 text-right">Commission Rate & Amt</th>
                <th className="px-5 py-3.5 text-right">Debt Recovered</th>
                <th className="px-5 py-3.5 text-right">Net Credited / Debited</th>
                <th className="px-5 py-3.5">Details / Transfer Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Loading your ledger...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No transactions recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Earnings from customer purchases will appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isCredit = tx.type === 'credit';
                  const isDebit = tx.type === 'debit';
                  const isReversal = tx.type === 'reversal';
                  const amt = parseFloat(tx.amount || 0);
                  const gross = tx.gross_amount != null ? parseFloat(tx.gross_amount) : null;
                  const commAmt = tx.commission_amount != null ? parseFloat(tx.commission_amount) : null;
                  const debtRec = parseFloat(tx.debt_recovered || 0);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>

                      {/* Type & Order Reference */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isCredit ? 'bg-green-50 text-green-700 border border-green-200' : isReversal ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isCredit ? 'Order Earning' : isReversal ? 'Order Reversal' : 'Payout'}
                          </span>
                          {tx.order_number && (
                            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                              {tx.order_number}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gross Order */}
                      <td className="px-5 py-3.5 text-right font-medium text-slate-800">
                        {gross != null ? (
                          `₹${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : isCredit ? (
                          `₹${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Commission Rate & Amount */}
                      <td className="px-5 py-3.5 text-right">
                        {commAmt != null ? (
                          <div>
                            <span className="font-bold text-emerald-700">
                              -₹{commAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">({tx.commission_percent}%)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Debt Recovered */}
                      <td className="px-5 py-3.5 text-right">
                        {debtRec > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                            ₹{debtRec.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Net Amount */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className={`font-bold text-xs ${isCredit ? 'text-green-700' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Details / Bank Reference */}
                      <td className="px-5 py-3.5 text-slate-600 text-[11px]">
                        {tx.bank_reference ? (
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <span className="font-bold text-slate-500">UTR:</span>
                            <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{tx.bank_reference}</span>
                          </div>
                        ) : tx.description ? (
                          <span className="text-[10px] text-slate-400 truncate max-w-[220px] block">{tx.description}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPDATE BANK DETAILS MODAL */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Beneficiary Bank Account</h3>
              </div>
              <button
                onClick={() => setBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBankDetailsSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Enter your genuine bank account details where payout funds should be settled by the platform admin.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50100234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Bank Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter bank account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="flex-1 py-2 text-slate-700 font-bold border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankSubmitting}
                  className="flex-1 py-2 bg-[#fe6603] text-white font-bold rounded-lg hover:bg-[#e55c00] disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {bankSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Bank Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
