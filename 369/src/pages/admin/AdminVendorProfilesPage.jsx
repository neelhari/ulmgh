import React, { useState, useEffect } from 'react';
import { Search, Store, MoreVertical, ShieldOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function AdminVendorProfilesPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState(null);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Show approved vendors, and maybe suspended ones if we add a suspended status later
        setVendors(data.vendors.filter(v => v.status === 'approved' || v.status === 'suspended'));
      }
    } catch (error) {
      toast.error('Failed to load vendor profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSyncPickup = async (vendorId) => {
    setSyncingId(vendorId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/vendors/${vendorId}/sync-pickup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Vendor synced with Shiprocket!');
        fetchVendors();
      } else {
        toast.error(data.error || 'Failed to sync with Shiprocket');
        fetchVendors();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to sync with Shiprocket');
    } finally {
      setSyncingId(null);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this vendor's status to ${newStatus}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/vendors/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Vendor ${newStatus} successfully!`);
        fetchVendors();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Profiles</h1>
        <p className="text-gray-500 mt-1">Manage approved vendor accounts and details.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors by store, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#fe6603]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Store</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Owner</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Contact</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Pickup Warehouse</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900">Status</th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading vendors...</td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No approved vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{vendor.store_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{vendor.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vendor.email}</div>
                      <div className="text-xs text-gray-500">{vendor.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.pickup_line1 ? (
                        <div className="text-xs text-gray-900 max-w-[240px] space-y-1">
                          <p className="font-semibold truncate">{vendor.pickup_line1}</p>
                          <p className="text-gray-500">{vendor.pickup_city}, {vendor.pickup_state} — <span className="font-bold text-gray-700">{vendor.pickup_pincode}</span></p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {vendor.is_pickup_synced ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> Synced ({vendor.shiprocket_pickup_id || 'Active'})
                              </span>
                            ) : vendor.pickup_sync_error ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200" title={vendor.pickup_sync_error}>
                                <AlertTriangle className="w-3 h-3" /> Error
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                                Unsynced
                              </span>
                            )}
                            <button
                              onClick={() => handleSyncPickup(vendor.id)}
                              disabled={syncingId === vendor.id}
                              className="inline-flex items-center gap-1 text-[11px] text-[#fe6603] hover:text-[#e55c02] font-bold hover:underline disabled:opacity-50 ml-auto"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingId === vendor.id ? 'animate-spin' : ''}`} />
                              {syncingId === vendor.id ? 'Syncing...' : vendor.is_pickup_synced ? 'Re-sync' : 'Sync SR'}
                            </button>
                          </div>
                          {vendor.pickup_sync_error && (
                            <p className="text-[10px] text-red-600 truncate" title={vendor.pickup_sync_error}>
                              {vendor.pickup_sync_error}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic max-w-[180px] truncate">
                          {vendor.address || 'Not configured'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${vendor.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {vendor.status === 'approved' ? (
                        <button
                          onClick={() => handleUpdateStatus(vendor.id, 'suspended')}
                          className="text-red-500 hover:text-red-700 font-medium text-sm inline-flex items-center gap-1"
                        >
                          <ShieldOff className="w-4 h-4" /> Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(vendor.id, 'approved')}
                          className="text-green-500 hover:text-green-700 font-medium text-sm inline-flex items-center gap-1"
                        >
                           Re-Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
