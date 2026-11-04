import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Wallet, IndianRupee, Send, Clock, ArrowUpRight, ArrowDownLeft, 
  AlertCircle, Download, Eye, Building2, CheckCircle2, AlertTriangle, 
  X, Filter, ShieldCheck, RefreshCw, Calendar, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function AdminVendorWalletsPage() {
  const [vendors, setVendors] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' | 'ledger'
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [bankStatusFilter, setBankStatusFilter] = useState('ALL');
  const [debtFilter, setDebtFilter] = useState('ALL');
  const [balanceFilter, setBalanceFilter] = useState('ALL');
  const [sortField, setSortField] = useState('balance');
  const [sortOrder, setSortOrder] = useState('desc');

  // Ledger Filters
  const [ledgerVendorFilter, setLedgerVendorFilter] = useState('ALL');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');
  const [ledgerSalesTypeFilter, setLedgerSalesTypeFilter] = useState('ALL');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  // Modals / Drawers
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedVendorForPayout, setSelectedVendorForPayout] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUtr, setPayoutUtr] = useState('');
  const [payoutConfirmed, setPayoutConfirmed] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null);
  const [updatingBankStatus, setUpdatingBankStatus] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vendorsRes, payoutsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/vendors`, { headers }).then(r => r.json()),
        fetch(`${BACKEND_URL}/admin/vendor-payouts`, { headers }).then(r => r.json())
      ]);

      if (vendorsRes.vendors) {
        setVendors(vendorsRes.vendors.filter(v => v.status === 'approved'));
      }
      if (payoutsRes.payouts) {
        setPayouts(payoutsRes.payouts);
      }
    } catch (error) {
      toast.error('Failed to load vendor financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary Metrics computed from actual backend vendor and transaction data
  const summaryMetrics = useMemo(() => {
    const totalGross = vendors.reduce((sum, v) => sum + parseFloat(v.total_gross_sales || 0), 0);
    const totalComm = vendors.reduce((sum, v) => sum + parseFloat(v.total_commission_earned || 0), 0);
    const totalNet = vendors.reduce((sum, v) => sum + parseFloat(v.total_net_earnings || 0), 0);
    const totalBalance = vendors.reduce((sum, v) => sum + parseFloat(v.wallet_balance || 0), 0);
    const totalDebt = vendors.reduce((sum, v) => sum + parseFloat(v.outstanding_debt || 0), 0);
    const totalPayouts = payouts.filter(p => p.type === 'debit').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return { totalGross, totalComm, totalNet, totalBalance, totalDebt, totalPayouts };
  }, [vendors, payouts]);

  // Unique plans list for filter
  const uniquePlans = useMemo(() => {
    const plans = new Set();
    vendors.forEach(v => {
      if (v.plan_name) plans.add(v.plan_name);
    });
    return Array.from(plans);
  }, [vendors]);

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    return vendors
      .filter(v => {
        const matchesSearch = 
          v.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPlan = planFilter === 'ALL' || (v.plan_name || 'No Active Plan') === planFilter;
        
        const bankStatus = v.bank_verification_status || 'not_provided';
        const matchesBank = bankStatusFilter === 'ALL' || bankStatus === bankStatusFilter;

        const debt = parseFloat(v.outstanding_debt || 0);
        const matchesDebt = debtFilter === 'ALL' || 
          (debtFilter === 'HAS_DEBT' ? debt > 0 : debt === 0);

        const balance = parseFloat(v.wallet_balance || 0);
        const matchesBalance = balanceFilter === 'ALL' || 
          (balanceFilter === 'POSITIVE' ? balance > 0 : balance === 0);

        return matchesSearch && matchesPlan && matchesBank && matchesDebt && matchesBalance;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortField === 'store') {
          valA = a.store_name?.toLowerCase() || '';
          valB = b.store_name?.toLowerCase() || '';
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (sortField === 'gross') {
          valA = parseFloat(a.total_gross_sales || 0);
          valB = parseFloat(b.total_gross_sales || 0);
        } else if (sortField === 'comm') {
          valA = parseFloat(a.total_commission_earned || 0);
          valB = parseFloat(b.total_commission_earned || 0);
        } else if (sortField === 'net') {
          valA = parseFloat(a.total_net_earnings || 0);
          valB = parseFloat(b.total_net_earnings || 0);
        } else if (sortField === 'debt') {
          valA = parseFloat(a.outstanding_debt || 0);
          valB = parseFloat(b.outstanding_debt || 0);
        } else {
          // Default: available balance
          valA = parseFloat(a.wallet_balance || 0);
          valB = parseFloat(b.wallet_balance || 0);
        }
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [vendors, searchTerm, planFilter, bankStatusFilter, debtFilter, balanceFilter, sortField, sortOrder]);

  // Filtered Ledger Transactions
  const filteredLedger = useMemo(() => {
    return payouts.filter(t => {
      const matchesVendor = ledgerVendorFilter === 'ALL' || String(t.vendor_id) === String(ledgerVendorFilter);
      const matchesType = ledgerTypeFilter === 'ALL' || t.type === ledgerTypeFilter;
      
      let matchesSalesType = true;
      if (ledgerSalesTypeFilter === 'LEGACY') {
        matchesSalesType = t.type === 'credit' && t.gross_amount == null;
      } else if (ledgerSalesTypeFilter === 'TRACKED') {
        matchesSalesType = t.type === 'credit' && t.gross_amount != null;
      }

      let matchesDate = true;
      if (ledgerStartDate) {
        matchesDate = matchesDate && new Date(t.created_at) >= new Date(ledgerStartDate);
      }
      if (ledgerEndDate) {
        const end = new Date(ledgerEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(t.created_at) <= end;
      }

      return matchesVendor && matchesType && matchesSalesType && matchesDate;
    });
  }, [payouts, ledgerVendorFilter, ledgerTypeFilter, ledgerSalesTypeFilter, ledgerStartDate, ledgerEndDate]);

  // Open Payout Drawer
  const openPayoutDrawer = (vendor) => {
    setSelectedVendorForPayout(vendor);
    setPayoutAmount(vendor.wallet_balance || '');
    setPayoutUtr('');
    setPayoutConfirmed(false);
    setPayoutModalOpen(true);
  };

  // Open Details Drawer
  const openDetailsDrawer = (vendor) => {
    setSelectedVendorDetails(vendor);
    setDetailDrawerOpen(true);
  };

  // Execute Payout with UTR / Reference
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendorForPayout) return;

    const amt = parseFloat(payoutAmount);
    const balance = parseFloat(selectedVendorForPayout.wallet_balance || 0);

    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid positive payout amount');
      return;
    }
    if (amt > balance) {
      toast.error(`Payout amount (₹${amt}) cannot exceed available balance (₹${balance})`);
      return;
    }
    if (!payoutUtr.trim()) {
      toast.error('Please enter the manual bank transfer reference number or UTR');
      return;
    }
    if (!payoutConfirmed) {
      toast.error('Please confirm that the bank transfer has been executed');
      return;
    }

    setPayoutLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payoutKey = `payout_${selectedVendorForPayout.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const res = await fetch(`${BACKEND_URL}/admin/vendors/${selectedVendorForPayout.id}/payout`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': payoutKey
        },
        body: JSON.stringify({ 
          amount: amt,
          reference: payoutUtr.trim(),
          idempotency_key: payoutKey 
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Payout of ₹${amt.toLocaleString()} recorded for ${selectedVendorForPayout.store_name}`);
        setPayoutModalOpen(false);
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to process payout');
      }
    } catch (err) {
      toast.error('Failed to communicate with payout service');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Update Bank Details Verification Status
  const handleVerifyBankStatus = async (vendorId, newStatus) => {
    setUpdatingBankStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/vendors/${vendorId}/verify-bank`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bank details status updated to ${newStatus}`);
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, bank_verification_status: newStatus } : v));
        if (selectedVendorDetails?.id === vendorId) {
          setSelectedVendorDetails(prev => ({ ...prev, bank_verification_status: newStatus }));
        }
      } else {
        toast.error(data.error || 'Failed to update bank status');
      }
    } catch (err) {
      toast.error('Failed to update bank verification status');
    } finally {
      setUpdatingBankStatus(false);
    }
  };

  // Export Vendors CSV
  const exportVendorsCSV = () => {
    const headers = [
      'Vendor ID', 'Store Name', 'Vendor Name', 'Email', 'Active Plan', 'Commission %',
      'Gross Sales', 'Legacy Sales', 'Tracked Sales', 'Platform Commission',
      'Net Earnings', 'Outstanding Debt', 'Available Balance', 'Total Payouts', 'Bank Status', 'Bank Account', 'Bank IFSC'
    ];

    const rows = filteredVendors.map(v => [
      v.id,
      `"${(v.store_name || '').replace(/"/g, '""')}"`,
      `"${(v.name || '').replace(/"/g, '""')}"`,
      `"${(v.email || '').replace(/"/g, '""')}"`,
      `"${(v.plan_name || 'No Active Plan').replace(/"/g, '""')}"`,
      v.commission_percent != null ? `${v.commission_percent}%` : 'N/A',
      parseFloat(v.total_gross_sales || 0).toFixed(2),
      parseFloat(v.legacy_sales || 0).toFixed(2),
      parseFloat(v.commission_tracked_sales || 0).toFixed(2),
      parseFloat(v.total_commission_earned || 0).toFixed(2),
      parseFloat(v.total_net_earnings || 0).toFixed(2),
      parseFloat(v.outstanding_debt || 0).toFixed(2),
      parseFloat(v.wallet_balance || 0).toFixed(2),
      parseFloat(v.total_payouts_processed || 0).toFixed(2),
      v.bank_verification_status || 'not_provided',
      `"${(v.bank_account_number || '').replace(/"/g, '""')}"`,
      `"${(v.bank_ifsc_code || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Vendors financial report exported');
  };

  // Export Ledger CSV
  const exportLedgerCSV = () => {
    const headers = [
      'Transaction ID', 'Date', 'Vendor ID', 'Store Name', 'Type', 'Order Number',
      'Gross Amount', 'Commission Rate %', 'Commission Deducted', 'Debt Recovered', 'Net Amount',
      'Bank Reference / UTR', 'Description'
    ];

    const rows = filteredLedger.map(t => [
      t.id,
      new Date(t.created_at).toISOString(),
      t.vendor_id,
      `"${(t.store_name || t.vendor_name || '').replace(/"/g, '""')}"`,
      t.type,
      `"${(t.order_number || '').replace(/"/g, '""')}"`,
      t.gross_amount != null ? parseFloat(t.gross_amount).toFixed(2) : '',
      t.commission_percent != null ? `${t.commission_percent}%` : '',
      t.commission_amount != null ? parseFloat(t.commission_amount).toFixed(2) : '',
      parseFloat(t.debt_recovered || 0).toFixed(2),
      parseFloat(t.amount || 0).toFixed(2),
      `"${(t.bank_reference || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transaction ledger exported');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-[#022A21]" />
            <span>Commission & Vendor Wallet Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise financial monitoring, subscription commission audit, and secure manual payout settlement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={activeTab === 'vendors' ? exportVendorsCSV : exportLedgerCSV}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#022A21] rounded-lg hover:bg-[#033c2f] transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 High-Impact Summary KPI Cards (Derived from Live Database) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Gross Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Gross Sales</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-slate-400">₹</span>
            <span className="text-xl font-extrabold text-slate-900 truncate">
              {loading ? '...' : summaryMetrics.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Lifetime customer orders</span>
        </div>

        {/* Platform Comm */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Platform Commission</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-emerald-600">₹</span>
            <span className="text-xl font-extrabold text-emerald-700 truncate">
              {loading ? '...' : summaryMetrics.totalComm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Snapshotted rate revenue</span>
        </div>

        {/* Net Earnings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Vendor Net Earnings</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-slate-400">₹</span>
            <span className="text-xl font-extrabold text-slate-900 truncate">
              {loading ? '...' : summaryMetrics.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Gross minus comm</span>
        </div>

        {/* Available Wallet Balances */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">Available Balances</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-blue-600">₹</span>
            <span className="text-xl font-extrabold text-blue-800 truncate">
              {loading ? '...' : summaryMetrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-blue-600 font-medium mt-1 block">Ready for payout</span>
        </div>

        {/* Outstanding Debt */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Outstanding Debt</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-amber-600">₹</span>
            <span className={`text-xl font-extrabold truncate ${summaryMetrics.totalDebt > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {loading ? '...' : summaryMetrics.totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium mt-1 block">Auto-recovering cancellations</span>
        </div>

        {/* Payouts Processed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Payouts</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xs font-medium text-slate-400">₹</span>
            <span className="text-xl font-extrabold text-slate-900 truncate">
              {loading ? '...' : summaryMetrics.totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Confirmed bank transfers</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${activeTab === 'vendors' ? 'text-[#fe6603] border-b-2 border-[#fe6603]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendor Financial Overview</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{vendors.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${activeTab === 'ledger' ? 'text-[#fe6603] border-b-2 border-[#fe6603]' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Platform Transaction Ledger & Reports</span>
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{payouts.length}</span>
        </button>
      </div>

      {/* TAB 1: VENDOR FINANCIAL MANAGEMENT TABLE */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor, store, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fe6603] text-slate-900"
              />
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Plan:</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Plans</option>
                {uniquePlans.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="No Active Plan">No Active Plan</option>
              </select>
            </div>

            {/* Bank Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Bank Status:</span>
              <select
                value={bankStatusFilter}
                onChange={(e) => setBankStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="not_provided">Not Provided</option>
              </select>
            </div>

            {/* Debt Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Debt:</span>
              <select
                value={debtFilter}
                onChange={(e) => setDebtFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All</option>
                <option value="HAS_DEBT">Has Debt</option>
                <option value="ZERO_DEBT">Zero Debt</option>
              </select>
            </div>

            {/* Balance Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Balance:</span>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All</option>
                <option value="POSITIVE">Balance &gt; 0</option>
                <option value="ZERO">Zero Balance</option>
              </select>
            </div>

            {/* Sort Field */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort By:</span>
              <select
                value={`${sortField}_${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split('_');
                  setSortField(f);
                  setSortOrder(o);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="balance_desc">Highest Balance</option>
                <option value="balance_asc">Lowest Balance</option>
                <option value="gross_desc">Highest Gross Sales</option>
                <option value="comm_desc">Highest Commission</option>
                <option value="debt_desc">Highest Debt</option>
                <option value="store_asc">Store Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5">Vendor / Store</th>
                    <th className="px-4 py-3.5">Active Plan & Rate</th>
                    <th className="px-4 py-3.5 text-right">Gross Sales</th>
                    <th className="px-4 py-3.5 text-right">Commission</th>
                    <th className="px-4 py-3.5 text-right">Net Earned</th>
                    <th className="px-4 py-3.5 text-right">Debt</th>
                    <th className="px-4 py-3.5 text-right">Available Balance</th>
                    <th className="px-4 py-3.5 text-center">Bank Status</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                        Loading financial records...
                      </td>
                    </tr>
                  ) : filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No matching vendors found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or search term.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map(vendor => {
                      const balance = parseFloat(vendor.wallet_balance || 0);
                      const gross = parseFloat(vendor.total_gross_sales || 0);
                      const legacy = parseFloat(vendor.legacy_sales || 0);
                      const comm = parseFloat(vendor.total_commission_earned || 0);
                      const net = parseFloat(vendor.total_net_earnings || 0);
                      const debt = parseFloat(vendor.outstanding_debt || 0);
                      const bankStatus = vendor.bank_verification_status || 'not_provided';

                      return (
                        <tr key={vendor.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Vendor / Store */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 text-sm">{vendor.store_name}</div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                              <span>{vendor.name}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 truncate max-w-[160px]">{vendor.email}</span>
                            </div>
                          </td>

                          {/* Active Plan & Rate */}
                          <td className="px-4 py-3.5">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {vendor.plan_name || 'No Plan'}
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                {vendor.commission_percent != null ? `${vendor.commission_percent}%` : '0%'}
                              </span>
                            </div>
                          </td>

                          {/* Gross Sales */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="font-semibold text-slate-900 text-xs">
                              ₹{gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {legacy > 0 && (
                              <div className="text-[10px] text-slate-400" title={`₹${legacy} uncommissioned legacy sales`}>
                                Inc. ₹{legacy.toLocaleString()} legacy
                              </div>
                            )}
                          </td>

                          {/* Platform Commission */}
                          <td className="px-4 py-3.5 text-right font-semibold text-emerald-700 text-xs">
                            ₹{comm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Net Earned */}
                          <td className="px-4 py-3.5 text-right font-semibold text-slate-900 text-xs">
                            ₹{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Debt */}
                          <td className="px-4 py-3.5 text-right">
                            {debt > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[11px]">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                ₹{debt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400">₹0.00</span>
                            )}
                          </td>

                          {/* Available Balance */}
                          <td className="px-4 py-3.5 text-right">
                            <span className={`font-bold text-sm ${balance > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                              ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Bank Details Status */}
                          <td className="px-4 py-3.5 text-center">
                            {bankStatus === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : bankStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                Not Provided
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openPayoutDrawer(vendor)}
                                disabled={balance <= 0}
                                title={balance <= 0 ? 'No available balance to pay' : 'Process manual bank transfer payout'}
                                className="inline-flex items-center gap-1 bg-[#fe6603] text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-[#e55c00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                              >
                                <Send className="w-3 h-3" />
                                <span>Pay</span>
                              </button>
                              <button
                                onClick={() => openDetailsDrawer(vendor)}
                                title="View vendor financial profile and transaction history"
                                className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLATFORM TRANSACTION LEDGER & REPORTS */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Ledger Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Vendor Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Vendor:</span>
              <select
                value={ledgerVendorFilter}
                onChange={(e) => setLedgerVendorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Vendors</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.store_name} (ID: {v.id})</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Tx Type:</span>
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="credit">Order Credits (+)</option>
                <option value="debit">Payouts (-)</option>
                <option value="reversal">Reversals (-)</option>
              </select>
            </div>

            {/* Sales Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sales Mode:</span>
              <select
                value={ledgerSalesTypeFilter}
                onChange={(e) => setLedgerSalesTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Orders</option>
                <option value="TRACKED">Commission-Tracked Orders</option>
                <option value="LEGACY">Legacy Uncommissioned Orders</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                placeholder="From Date"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                placeholder="To Date"
              />
              {(ledgerStartDate || ledgerEndDate) && (
                <button
                  onClick={() => { setLedgerStartDate(''); setLedgerEndDate(''); }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Clear dates"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Total matching */}
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{filteredLedger.length}</span> transaction(s)
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Vendor</th>
                    <th className="px-4 py-3.5">Type & Reference</th>
                    <th className="px-4 py-3.5 text-right">Gross Amount</th>
                    <th className="px-4 py-3.5 text-right">Commission Rate / Amt</th>
                    <th className="px-4 py-3.5 text-right">Debt Recovered</th>
                    <th className="px-4 py-3.5 text-right">Net Amount</th>
                    <th className="px-4 py-3.5">UTR / Bank Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                        Loading transaction ledger...
                      </td>
                    </tr>
                  ) : filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No transactions match the selected filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(tx => {
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
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                            {new Date(tx.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>

                          {/* Vendor */}
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800">{tx.store_name || tx.vendor_name || `Vendor #${tx.vendor_id}`}</span>
                          </td>

                          {/* Type & Order Reference */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isCredit ? 'bg-green-50 text-green-700 border border-green-200' : isReversal ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                {isCredit ? 'Credit' : isReversal ? 'Reversal' : 'Payout'}
                              </span>
                              {tx.order_number && (
                                <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                                  {tx.order_number}
                                </span>
                              )}
                            </div>
                            {tx.description && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[280px]">
                                {tx.description}
                              </div>
                            )}
                          </td>

                          {/* Gross Amount */}
                          <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                            {gross != null ? (
                              `₹${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            ) : isCredit ? (
                              <span className="text-[10px] text-slate-400 italic">Legacy ₹{amt.toLocaleString()}</span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Commission Rate / Amt */}
                          <td className="px-4 py-3.5 text-right">
                            {commAmt != null ? (
                              <div>
                                <span className="font-bold text-emerald-700">₹{commAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-slate-400 ml-1">({tx.commission_percent}%)</span>
                              </div>
                            ) : isCredit ? (
                              <span className="text-[10px] text-slate-400">Uncommissioned</span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Debt Recovered */}
                          <td className="px-4 py-3.5 text-right">
                            {debtRec > 0 ? (
                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">
                                ₹{debtRec.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Net Amount */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <span className={`font-bold text-xs ${isCredit ? 'text-green-700' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}₹{amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* UTR / Bank Reference */}
                          <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                            {tx.bank_reference ? (
                              <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                                {tx.bank_reference}
                              </span>
                            ) : isDebit ? (
                              <span className="text-slate-400 italic">Pre-UTR Payout</span>
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
        </div>
      )}

      {/* DETAILED PAYOUT DRAWER / MODAL */}
      {payoutModalOpen && selectedVendorForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fe6603]/10 flex items-center justify-center text-[#fe6603]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Record Bank Transfer Payout</h3>
                  <p className="text-xs text-slate-500">Manual payout settlement for {selectedVendorForPayout.store_name}</p>
                </div>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handlePayoutSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Balance & Debt Alert Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Available Balance</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    ₹{parseFloat(selectedVendorForPayout.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {parseFloat(selectedVendorForPayout.outstanding_debt || 0) > 0 && (
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Outstanding Debt</span>
                    <span className="text-sm font-bold text-amber-700">
                      ₹{parseFloat(selectedVendorForPayout.outstanding_debt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Bank Account Details Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-800 text-xs">Beneficiary Bank Account Details</span>
                  </div>
                  {selectedVendorForPayout.bank_verification_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Verified Account
                    </span>
                  ) : selectedVendorForPayout.bank_verification_status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pending Verification
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Not Provided
                    </span>
                  )}
                </div>

                {selectedVendorForPayout.bank_account_number ? (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Holder</span>
                      <span className="font-bold text-slate-800">{selectedVendorForPayout.bank_account_holder_name || selectedVendorForPayout.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bank Name</span>
                      <span className="font-bold text-slate-800">{selectedVendorForPayout.bank_name || 'Bank Account'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedVendorForPayout.bank_account_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900">{selectedVendorForPayout.bank_ifsc_code}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Bank details not submitted by vendor yet</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Please verify the vendor's bank account or UPI details directly via phone/email before executing your bank transfer.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Bank Transfer Notice */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Manual Bank-Transfer Workflow</span>
                </p>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  This system records off-platform bank transfers. Funds are not deducted from your corporate account automatically. First execute the transfer (NEFT / RTGS / IMPS / UPI) from your net banking portal, then record the transaction reference below to update the vendor's ledger.
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Payout Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedVendorForPayout.wallet_balance || 0}
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Available: ₹{parseFloat(selectedVendorForPayout.wallet_balance || 0).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bank Transfer Reference / UTR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR1234567890 / IMPS Ref ID"
                    value={payoutUtr}
                    onChange={(e) => setPayoutUtr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Mandatory audit reference from your bank transfer receipt
                  </span>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payoutConfirmed}
                      onChange={(e) => setPayoutConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#fe6603] focus:ring-[#fe6603]"
                    />
                    <span className="text-[11px] text-slate-700 font-medium select-none">
                      I confirm that I have transferred ₹{parseFloat(payoutAmount || 0).toLocaleString()} to this vendor from my bank portal, and the UTR / Reference provided above is genuine.
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading || !payoutConfirmed || !payoutUtr.trim()}
                  className="flex-1 bg-[#fe6603] text-white py-2.5 rounded-xl font-bold hover:bg-[#e55c00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs flex items-center justify-center gap-2"
                >
                  {payoutLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recording Payout...</span>
                    </>
                  ) : (
                    <span>Confirm & Record Payout</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR FINANCIAL DETAILS SLIDE-OVER DRAWER */}
      {detailDrawerOpen && selectedVendorDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedVendorDetails.store_name}</h3>
                <p className="text-xs text-slate-500">{selectedVendorDetails.name} • {selectedVendorDetails.email}</p>
              </div>
              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Available Balance</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-1">
                    ₹{parseFloat(selectedVendorDetails.wallet_balance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Sales</span>
                  <span className="text-xl font-extrabold text-slate-900 block mt-1">
                    ₹{parseFloat(selectedVendorDetails.total_gross_sales || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Platform Comm</span>
                  <span className="text-xl font-extrabold text-emerald-700 block mt-1">
                    ₹{parseFloat(selectedVendorDetails.total_commission_earned || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Subscription Plan & Snapshot info */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#fe6603]" />
                  <span>Subscription & Agreed Commission Rate</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active Plan</span>
                    <span className="font-semibold text-slate-800">{selectedVendorDetails.plan_name || 'No Active Plan'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Snapshotted Rate</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {selectedVendorDetails.commission_percent != null ? `${selectedVendorDetails.commission_percent}%` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Subscription Expires</span>
                    <span className="font-semibold text-slate-800">
                      {selectedVendorDetails.subscription_expires_at 
                        ? new Date(selectedVendorDetails.subscription_expires_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Account Verification Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span>Beneficiary Bank Account</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedVendorDetails.bank_verification_status !== 'verified' && (
                      <button
                        onClick={() => handleVerifyBankStatus(selectedVendorDetails.id, 'verified')}
                        disabled={updatingBankStatus}
                        className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                      >
                        Verify Account
                      </button>
                    )}
                    {selectedVendorDetails.bank_verification_status === 'verified' && (
                      <button
                        onClick={() => handleVerifyBankStatus(selectedVendorDetails.id, 'pending')}
                        disabled={updatingBankStatus}
                        className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200"
                      >
                        Mark Unverified
                      </button>
                    )}
                  </div>
                </div>

                {selectedVendorDetails.bank_account_number ? (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Holder Name</span>
                      <span className="font-bold text-slate-800">{selectedVendorDetails.bank_account_holder_name || selectedVendorDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bank Name</span>
                      <span className="font-bold text-slate-800">{selectedVendorDetails.bank_name || 'Bank Account'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Number</span>
                      <span className="font-mono font-bold text-slate-900">{selectedVendorDetails.bank_account_number}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IFSC Code</span>
                      <span className="font-mono font-bold text-slate-900">{selectedVendorDetails.bank_ifsc_code}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No bank details on file for this vendor.</p>
                )}
              </div>

              {/* Vendor Recent Ledger Transactions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Transaction History ({payouts.filter(p => p.vendor_id === selectedVendorDetails.id).length})</span>
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {payouts.filter(p => p.vendor_id === selectedVendorDetails.id).length === 0 ? (
                    <div className="p-6 text-center text-slate-400">No transactions recorded for this vendor.</div>
                  ) : (
                    payouts.filter(p => p.vendor_id === selectedVendorDetails.id).map(t => (
                      <div key={t.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-[11px]">
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.type === 'credit' ? 'bg-green-50 text-green-700' : t.type === 'reversal' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                              {t.type.toUpperCase()}
                            </span>
                            {t.order_number && <span className="font-mono text-slate-600">{t.order_number}</span>}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {t.bank_reference && ` • Ref: ${t.bank_reference}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-xs ${t.type === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                            {t.type === 'credit' ? '+' : '-'}₹{parseFloat(t.amount || 0).toLocaleString()}
                          </span>
                          {t.commission_amount != null && (
                            <div className="text-[10px] text-slate-400">
                              Gross: ₹{parseFloat(t.gross_amount || 0).toLocaleString()} | Comm: ₹{parseFloat(t.commission_amount || 0).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailDrawerOpen(false);
                  openPayoutDrawer(selectedVendorDetails);
                }}
                disabled={parseFloat(selectedVendorDetails.wallet_balance || 0) <= 0}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#fe6603] rounded-lg hover:bg-[#e55c00] disabled:opacity-50"
              >
                Process Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
