import React from 'react';
import { Truck, RefreshCw, XCircle, ExternalLink, CheckCircle2 } from 'lucide-react';

export function VendorPackageDispatchBox({
  order,
  onDispatch,
  onCancel,
  onSync,
  dispatchingId,
  cancellingId,
  syncingId
}) {
  const fulId = order.fulfillment_id || order.id;
  const isDispatching = dispatchingId === fulId;
  const isCancelling = cancellingId === fulId;
  const isSyncing = syncingId === fulId;
  const isCancelled = order.status === 'cancelled';
  const isDispatched = Boolean(order.awb || order.status === 'ready_to_ship' || order.status === 'shipped');

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs space-y-3">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-[#fe6603]" />
          Package &amp; Dispatch
        </h4>
        {order.fulfillment_number && (
          <span className="text-[11px] bg-gray-100 text-gray-700 font-mono px-2 py-0.5 rounded font-semibold">
            #{order.fulfillment_number}
          </span>
        )}
      </div>

      <div className="text-xs space-y-2">
        {/* Warehouse Info */}
        {order.pickup_location_nickname && (
          <p className="text-gray-600 flex items-center justify-between flex-wrap gap-1">
            <span>Dispatch Warehouse:</span>
            <strong className="font-mono text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
              {order.pickup_location_nickname}
            </strong>
          </p>
        )}

        {/* Sync Error Alert */}
        {order.sync_error && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            ⚠️ {order.sync_error}
          </div>
        )}

        {/* 1. Cancelled Package */}
        {isCancelled ? (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>Package Cancelled (Inventory Restored)</span>
          </div>
        ) : isDispatched ? (
          /* 2. Dispatched Package (Pickup Scheduled or In Transit) */
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-200 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-bold text-green-800 text-xs truncate">
                  Already Dispatched • {order.courier || 'Courier'}: {order.awb || 'Pickup Scheduled'}
                </span>
              </div>
              {order.tracking_link && (
                <a
                  href={order.tracking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-900 underline font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <span>Track</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-[11px] text-blue-700 font-medium px-1">
              ✓ Courier collection arranged from your registered warehouse.
            </p>

            {/* Action Controls for Dispatched Package */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSync?.(order);
                }}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 min-h-[38px]"
                title="Sync live tracking status from Shiprocket"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Live Tracking Sync'}</span>
              </button>

              {order.status !== 'shipped' && order.status !== 'delivered' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel?.(order);
                  }}
                  disabled={isCancelling}
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50 min-h-[38px]"
                  title="Cancel shipment in Shiprocket"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 3. Awaiting Dispatch */
          <div className="space-y-2 pt-1">
            <p className="text-gray-500 text-xs italic">
              Package awaiting dispatch from your registered warehouse.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDispatch?.(order);
                }}
                disabled={isDispatching || isCancelling}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#fe6603] hover:bg-[#e55c02] text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 min-h-[42px]"
                title="Create shipment and schedule courier pickup via Shiprocket"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>{isDispatching ? 'Dispatching...' : '🚚 Dispatch Package'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel?.(order);
                }}
                disabled={isDispatching || isCancelling}
                className="px-3 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50 min-h-[42px]"
                title="Cancel package and restore inventory"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

