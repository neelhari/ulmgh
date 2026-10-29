import React, { useState, useEffect } from 'react';
import { Warehouse, RefreshCw, CheckCircle2, ShieldCheck, MapPin, Phone, Building2, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export function AdminWarehousePage() {
  const [locations, setLocations] = useState([]);
  const [selectedNickname, setSelectedNickname] = useState('suresh');
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWarehouseSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/warehouse-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLocations(data.locations || []);
        setSelectedNickname(data.selected_nickname || 'suresh');
        setActiveWarehouse(data.active_warehouse || null);
      } else {
        toast.error(data.error || 'Failed to load warehouse settings');
      }
    } catch (err) {
      toast.error(err.message || 'Error connecting to backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWarehouseSettings();
  }, []);

  const handleSave = async (nicknameToSave) => {
    const targetNickname = nicknameToSave || selectedNickname;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/warehouse-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname: targetNickname })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Default admin warehouse updated successfully!');
        setSelectedNickname(data.selected_nickname);
        setActiveWarehouse(data.warehouse || null);
        fetchWarehouseSettings();
      } else {
        toast.error(data.error || 'Failed to update warehouse');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating warehouse');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#036e26]/10 text-[#036e26] rounded-xl">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Warehouse Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure the primary pickup hub for platform & in-house products dispatched via Shiprocket
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchWarehouseSettings(); }}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Shiprocket Warehouses'}</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950">Multi-Vendor Warehouse Isolation Policy</p>
          <p className="text-blue-800 leading-relaxed">
            The warehouse selected here applies <strong>exclusively to admin-owned (platform) items</strong>. 
            Vendor packages are strictly dispatched from each vendor's own verified pickup address 
            and will never be replaced by the admin warehouse.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-[#036e26]/20 border-t-[#036e26] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 mt-3">Loading registered Shiprocket warehouses...</p>
        </div>
      ) : (
        <>
          {/* Active Default Warehouse Card */}
          <div className="bg-white rounded-2xl border-2 border-[#036e26]/30 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Active Default Admin Warehouse
                </span>
                <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                  {selectedNickname}
                </span>
              </div>
              <span className="text-[11px] text-gray-500">Persistent database setting</span>
            </div>

            {activeWarehouse ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-gray-400 font-semibold uppercase text-[10px]">Location Nickname</span>
                  <p className="font-bold text-gray-900 text-sm font-mono">{activeWarehouse.pickup_location || selectedNickname}</p>
                  <p className="text-gray-500">{activeWarehouse.name || 'Admin Primary'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-semibold uppercase text-[10px]">Pickup Address</span>
                  <p className="text-gray-800">{activeWarehouse.address || activeWarehouse.address_2 || 'Address on file'}</p>
                  <p className="font-medium text-gray-600">
                    {activeWarehouse.city}, {activeWarehouse.state} — <strong className="text-gray-900">{activeWarehouse.pin_code || activeWarehouse.pincode}</strong>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 font-semibold uppercase text-[10px]">Contact Info</span>
                  <p className="text-gray-800 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{activeWarehouse.phone || 'Phone verified'}</span>
                  </p>
                  <p className="text-green-700 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified & Ready for Couriers</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Current default nickname is <strong>"{selectedNickname}"</strong>. Please verify that this nickname matches one of your active Shiprocket locations below.
                </span>
              </div>
            )}
          </div>

          {/* Available Warehouses in Shiprocket */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Registered Shiprocket Pickup Warehouses</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select which verified warehouse will fulfill platform/in-house orders
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold">
                {locations.length} Locations Found
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {locations.map((loc, idx) => {
                const nickname = loc.pickup_location || loc.pickup_location_nickname || loc.nickname || '';
                const isSelected = nickname.toLowerCase() === selectedNickname.toLowerCase();
                const isVendorWarehouse = nickname.toLowerCase().startsWith('vnd_');

                return (
                  <div
                    key={idx}
                    className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected ? 'bg-green-50/50' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {nickname}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#036e26] text-white">
                            <CheckCircle2 className="w-3 h-3" /> Selected Default
                          </span>
                        )}
                        {isVendorWarehouse && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Vendor Warehouse
                          </span>
                        )}
                        {loc.name && <span className="text-xs text-gray-600 font-medium">({loc.name})</span>}
                      </div>

                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{loc.address || loc.address_2 || ''}, {loc.city}, {loc.state} — <strong>{loc.pin_code || loc.pincode}</strong></span>
                      </p>

                      {loc.phone && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>Contact: {loc.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isSelected ? (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-2 rounded-xl">
                          Active Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSave(nickname)}
                          disabled={saving}
                          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-gray-300 hover:border-[#036e26] hover:text-[#036e26] text-gray-700 transition-colors shadow-2xs disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Set as Admin Default'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

