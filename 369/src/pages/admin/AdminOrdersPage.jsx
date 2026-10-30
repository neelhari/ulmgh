import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  MessageCircle, 
  ChevronDown, 
  Printer, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  XCircle, 
  RotateCcw, 
  Truck, 
  Building2, 
  Store, 
  Search,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const FROM_ADDRESS = {
  name: "ULMGH369",
  line1: "1-1-738, Vinayaka temple road",
  city: "Koratla",
  state: "Telangana",
  pincode: "",
  phone: "+91 90326 75205",
};

const STATUSES = ["pending", "paid", "processing", "partially_shipped", "shipped", "delivered", "cancelled"];

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  partially_shipped: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "vendor" ? "vendor" : "admin";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tracking, setTracking] = useState({});
  const [shipping, setShipping] = useState({});
  const [cancelling, setCancelling] = useState({});
  const [syncing, setSyncing] = useState({});

  const fetchOrders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${BACKEND_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) {
          setOrders(d.orders);
          const t = {};
          d.orders.forEach((o) => {
            t[o.id] = { id: o.tracking_id || "", link: o.tracking_link || "" };
          });
          setTracking(t);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
    setStatusFilter("all");
    setVendorFilter("all");
  };

  const updateStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const createFulfillmentShipment = async (fulfillmentId, orderId) => {
    const token = localStorage.getItem("token");
    setShipping((p) => ({ ...p, [fulfillmentId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/fulfillments/${fulfillmentId}/ship`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create shipment");

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedFulfillments = (o.fulfillments || []).map((f) => {
            if (f.id !== fulfillmentId) return f;
            return {
              ...f,
              status: data.status || "ready_to_ship",
              awb_code: data.awb,
              courier_name: data.courier,
              tracking_url: data.tracking_link,
              label_url: data.label_url,
              pickup_token_number: data.pickup_token_number,
              pickup_scheduled_date: data.pickup_scheduled_date,
              sync_error: null,
            };
          });
          const allShipped = updatedFulfillments.every(
            (f) => f.status === "shipped" || f.status === "delivered"
          );
          return {
            ...o,
            status: allShipped
              ? "shipped"
              : updatedFulfillments.some((f) => f.status === "shipped")
              ? "partially_shipped"
              : o.status,
            fulfillments: updatedFulfillments,
          };
        })
      );
      const pickupMsg = data.pickup_token_number
        ? ` | Pickup Scheduled (Token: ${data.pickup_token_number})`
        : "";
      alert(`Shipment arranged! AWB: ${data.awb} (${data.courier || "Courier"})${pickupMsg}`);
    } catch (err) {
      alert(`Dispatch error: ${err.message}`);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          return {
            ...o,
            fulfillments: (o.fulfillments || []).map((f) =>
              f.id === fulfillmentId ? { ...f, sync_error: err.message } : f
            ),
          };
        })
      );
    } finally {
      setShipping((p) => ({ ...p, [fulfillmentId]: false }));
    }
  };

  const cancelFulfillmentShipment = async (fulfillmentId, orderId, fulNumber) => {
    const confirmed = window.confirm(
      `Confirm Cancellation: Cancel package #${
        fulNumber || fulfillmentId
      }?\n\nThis will cancel the shipment in Shiprocket and return item quantities to inventory.`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    setCancelling((p) => ({ ...p, [fulfillmentId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/fulfillments/${fulfillmentId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Admin cancelled package" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel shipment");

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedFulfillments = (o.fulfillments || []).map((f) => {
            if (f.id !== fulfillmentId) return f;
            return { ...f, status: "cancelled", sync_error: null };
          });
          const allCancelled = updatedFulfillments.every((f) => f.status === "cancelled");
          return {
            ...o,
            status: allCancelled ? "cancelled" : o.status,
            fulfillments: updatedFulfillments,
          };
        })
      );
      alert(data.message || "Package cancelled and inventory restored successfully.");
    } catch (err) {
      alert(`Cancellation error: ${err.message}`);
    } finally {
      setCancelling((p) => ({ ...p, [fulfillmentId]: false }));
    }
  };

  const syncFulfillmentStatus = async (fulfillmentId, orderId) => {
    const token = localStorage.getItem("token");
    setSyncing((p) => ({ ...p, [fulfillmentId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/fulfillments/${fulfillmentId}/sync-status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync status");

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const updatedFulfillments = (o.fulfillments || []).map((f) => {
            if (f.id !== fulfillmentId) return f;
            return {
              ...f,
              status: data.current_status || f.status,
              sync_error: null,
            };
          });
          return { ...o, fulfillments: updatedFulfillments };
        })
      );
      alert(`Live tracking synced: ${data.current_status}${data.activity ? ` (${data.activity})` : ""}`);
    } catch (err) {
      alert(`Sync error: ${err.message}`);
    } finally {
      setSyncing((p) => ({ ...p, [fulfillmentId]: false }));
    }
  };

  // Helper to get items partitioned by tab/fulfillment
  const getActiveItemsForOrder = (order) => {
    const activeItems = [];
    const targetFulfillments = activeTab === "admin" ? order.adminFulfillments : order.vendorFulfillments;

    targetFulfillments?.forEach((ful) => {
      if (ful.items && ful.items.length > 0) {
        ful.items.forEach((it) => {
          activeItems.push({
            product: {
              id: it.product_id,
              name: it.product_name,
              price: parseFloat(it.unit_price || 0),
              vendor_id: ful.vendor_id,
            },
            variant:
              typeof it.variant_details === "string"
                ? JSON.parse(it.variant_details)
                : it.variant_details || {},
            qty: it.quantity,
            price: parseFloat(it.unit_price || 0),
          });
        });
      }
    });

    if (activeItems.length > 0) return activeItems;

    // Fallback to order.items
    let allItems = [];
    try {
      allItems = typeof order.items === "string" ? JSON.parse(order.items) : order.items || [];
    } catch (e) {
      allItems = [];
    }

    if (activeTab === "admin") {
      return allItems.filter((i) => !i.product?.vendor_id);
    } else {
      if (vendorFilter !== "all") {
        return allItems.filter((i) => String(i.product?.vendor_id) === String(vendorFilter));
      }
      return allItems.filter((i) => !!i.product?.vendor_id);
    }
  };

  const notifyWhatsApp = (order) => {
    let address = {};
    try {
      address = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {};
    } catch (e) {}

    const phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    const t = tracking[order.id];
    const trackMsg = t?.id ? ` Your tracking ID is ${t.id}.${t.link ? ` Track here: ${t.link}` : ""}` : "";
    const msg = encodeURIComponent(
      `Hi ${order.user_name || address.name || "Customer"}! Your order #${
        order.order_number || order.id
      } status is now: *${order.status}*.${trackMsg}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const invoiceHtml = (order) => {
    const items = getActiveItemsForOrder(order);

    let address = {};
    try {
      address = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {};
    } catch (e) {}

    const subtotal = items.reduce(
      (sum, item) => sum + (item.variant?.price || item.product?.price || 0) * item.qty,
      0
    );
    const rows = items
      .map(
        (item, idx) => `
      <tr class="${idx % 2 === 0 ? "" : "alt-row"}">
        <td style="text-align: center;">${idx + 1}</td>
        <td><span style="font-weight: bold; color: #222222;">${escapeHtml(item.product?.name)}</span></td>
        <td style="text-align: center;">${escapeHtml(
          (item.variant?.color ? item.variant.color + " / " : "") + (item.variant?.size || "-")
        )}</td>
        <td style="text-align: center;">${item.qty} </td>
        <td style="text-align: right;">₹${(item.variant?.price || item.product?.price || 0).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `<!doctype html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Invoice #${order.order_number || order.id} (${activeTab === "admin" ? "Admin" : "Vendor"})</title>
          <style>
              *, *::before, *::after { box-sizing: border-box; }
              @page { size: A4; margin: 15mm 12mm 20mm 12mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; margin: 0; padding: 0; font-size: 10pt; line-height: 1.4; background-color: #ffffff; }
              .invoice-container { width: 100%; max-width: 100%; }
              .invoice-header { border-bottom: 3px solid #E63A12; padding-bottom: 18px; margin-bottom: 20px; }
              .header-table { width: 100%; border-collapse: collapse; }
              .header-table td { vertical-align: top; padding: 0; }
              .invoice-title-block { text-align: right; }
              .invoice-title { font-size: 22pt; font-weight: bold; color: #E63A12; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .invoice-meta { margin-top: 8px; font-size: 9.5pt; color: #444444; line-height: 1.5; }
              .addresses-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
              .addresses-table td { width: 50%; vertical-align: top; padding: 12px; border: 1px solid #FFE4DE; }
              .addresses-table td.from-box { background-color: #FFFDFD; }
              .addresses-table td.ship-box { background-color: #FFFAF9; }
              .section-heading { font-size: 9.5pt; font-weight: bold; color: #E63A12; text-transform: uppercase; border-bottom: 1px solid #FFE4DE; padding-bottom: 5px; margin-bottom: 8px; letter-spacing: 0.5px; }
              .address-box { font-size: 9.5pt; color: #555555; line-height: 1.5; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-top: 10px; }
              .items-table th { background-color: #E63A12; color: #ffffff; font-weight: bold; font-size: 9.5pt; text-align: left; padding: 10px 12px; text-transform: uppercase; }
              .items-table td { padding: 11px 12px; border-bottom: 1px solid #F6EFEF; font-size: 9.5pt; vertical-align: middle; }
              .items-table tr:nth-child(even) td { background-color: #FFFAF9; }
              .totals-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .totals-table td { padding: 0; vertical-align: top; }
              .terms-cell { width: 55%; padding-right: 25px; }
              .summary-cell { width: 45%; }
              .inner-summary-table { width: 100%; border-collapse: collapse; }
              .inner-summary-table td { padding: 8px 12px; font-size: 10pt; border-bottom: 1px solid #F6EFEF; }
              .inner-summary-table td.label { text-align: right; color: #555555; }
              .inner-summary-table td.value { text-align: right; font-weight: bold; width: 120px; }
              .inner-summary-table tr.grand-total td { background-color: #FFEBE7; border-top: 2px solid #E63A12; border-bottom: 2px double #E63A12; font-weight: bold; color: #E63A12; font-size: 12pt; }
              .print-btn { margin-top: 20px; text-align: center; }
              .print-btn button { padding: 8px 24px; margin: 0 8px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
              .btn-primary { background: #E63A12; color: white; }
              .btn-secondary { background: white; color: #E63A12; border: 1px solid #E63A12; }
              @media print { .print-btn { display: none !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
          </style>
      </head>
      <body>
      <div class="invoice-container">
          <div class="invoice-header">
              <table class="header-table">
                  <tr>
                      <td>
                          <div style="font-size: 9pt; color: #555555; margin-top: 8px; line-height: 1.5;">
                              <strong style="font-size: 20px;"><span style="color: #fe6603;">Ind</span><span style="color: #036e26;">basket</span></strong><br>
                              1-1-738, Vinayaka temple road<br>
                              Phone: +91 90326 75205 | Email: ulmgh369@gmail.com<br>
                              <small style="color: #888;">Scope: ${activeTab === "admin" ? "Platform / In-House Fulfillment" : "Vendor Fulfillment"}</small>
                          </div>
                      </td>
                      <td class="invoice-title-block">
                          <div class="invoice-title">Invoice</div>
                          <div class="invoice-meta">
                              <strong>Invoice No:</strong> #${order.order_number || order.id}<br>
                              <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}<br>
                              <strong>Status:</strong> ${escapeHtml(order.status)}
                          </div>
                      </td>
                  </tr>
              </table>
          </div>

          <table class="addresses-table">
              <tr>
                  <td class="from-box">
                      <div class="section-heading">From Address</div>
                      <div class="address-box">
                          <strong><span style="color: #fe6603;">Ind</span><span style="color: #036e26;">basket</span></strong><br>
                          1-1-738, Vinayaka temple road,<br>
                          Koratla, Telangana, India<br>
                          <strong>Phone:</strong> +91 90326 75205
                      </div>
                  </td>
                  <td class="ship-box">
                      <div class="section-heading">Shipping Address</div>
                      <div class="address-box">
                          <strong>${escapeHtml(address.name || "")}</strong><br>
                          ${escapeHtml(address.line1 || "")}${
                            address.line2 ? `, ${escapeHtml(address.line2)}` : ""
                          }<br>
                          ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} — ${escapeHtml(
                            address.pincode || ""
                          )}, India<br>
                          ${address.mobile ? `<strong>Mobile:</strong> ${escapeHtml(address.mobile)}` : ""}
                      </div>
                  </td>
              </tr>
          </table>

          <table class="items-table">
              <thead>
                  <tr>
                      <th style="width: 8%; text-align: center;">S.No.</th>
                      <th style="width: 44%;">Item Name</th>
                      <th style="width: 18%; text-align: center;">Pack Size</th>
                      <th style="width: 12%; text-align: center;">Quantity</th>
                      <th style="width: 18%; text-align: right;">Price (₹)</th>
                  </tr>
              </thead>
              <tbody>
                  ${rows}
              </tbody>
          </table>

      <table class="totals-table">
          <tr>
              <td class="terms-cell"></td>
              <td class="summary-cell">
                  <table class="inner-summary-table">
                      <tr><td class="label">Package Items Subtotal</td><td class="value">₹${subtotal.toFixed(2)}</td></tr>
                      <tr class="grand-total"><td class="label">PACKAGE TOTAL:</td><td class="value">₹${subtotal.toFixed(2)}</td></tr>
                      ${
                        order.payment_method === "cod"
                          ? `<tr><td class="label" style="color: #059669; font-size: 9pt;">Payment Mode</td><td class="value" style="color: #059669; font-size: 9pt;">Cash on Delivery</td></tr>`
                          : `<tr><td class="label" style="color: #2563eb; font-size: 9pt;">Payment Mode</td><td class="value" style="color: #2563eb; font-size: 9pt;">Prepaid / Online</td></tr>`
                      }
                  </table>
                  </td>
              </tr>
          </table>

          <div class="print-btn">
              <button class="btn-secondary" onclick="window.print()">🖨️ Print</button>
              <button class="btn-primary" onclick="window.print()">📥 Download PDF</button>
          </div>
      </div>
      </body>
      </html>`;
  };

  const openInvoice = (order) => {
    const invoiceWindow = window.open("", "_blank");
    if (invoiceWindow) {
      invoiceWindow.document.open();
      invoiceWindow.document.write(invoiceHtml(order));
      invoiceWindow.document.close();
    }
  };

  const sendInvoiceWhatsApp = (order) => {
    const items = getActiveItemsForOrder(order);
    let address = {};
    try {
      address = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {};
    } catch (e) {}

    const phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    const itemsText = items
      .map((i) => `• ${i.product?.name} ×${i.qty} — ₹${(i.variant?.price || i.product?.price || 0) * i.qty}`)
      .join("\n");
    const subtotal = items.reduce(
      (sum, item) => sum + (item.variant?.price || item.product?.price || 0) * item.qty,
      0
    );
    const msg = encodeURIComponent(
      `Hi ${order.user_name || address.name || "Customer"}! 🙏 Please find your *Invoice (${
        activeTab === "admin" ? "Admin Package" : "Vendor Package"
      })* for Order *#${order.order_number || order.id}* below:\n\n` +
        `*Items:*\n${itemsText}\n\n` +
        `*Package Total: ₹${subtotal.toFixed(2)}*\n\n` +
        `Thank you for shopping with ULMGH369!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const printLabel = (order) => {
    const items = getActiveItemsForOrder(order);
    let address = {};
    try {
      address = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {};
    } catch (e) {}

    const itemRows = items
      .map((item) => {
        const unitStr = item.variant?.size ? ` (${escapeHtml(item.variant?.size)})` : "";
        return `<div style="display:flex;justify-content:space-between;padding:1.5mm 0;border-bottom:1px solid #eee;">
        <div style="font-size:8pt;font-weight:600;flex:1;padding-right:3mm;">${escapeHtml(item.product?.name)}${unitStr}</div>
        <div style="font-size:8pt;color:#555;white-space:nowrap;">x${item.qty}</div>
      </div>`;
      })
      .join("");

    const activeFuls = activeTab === "admin" ? order.adminFulfillments : order.vendorFulfillments;
    const awbList = activeFuls
      ?.filter((f) => f.awb_code)
      .map((f) => `${f.fulfillment_number}: ${f.awb_code}`)
      .join("<br>");

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Shipping Label - #${order.order_number || order.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:100mm 160mm;margin:0}
  body{font-family:Arial,Helvetica,sans-serif;width:100mm;background:#fff;font-size:9pt}
  .box{border:2.5px solid #111;margin:3mm;border-radius:2mm;overflow:hidden}
  .hdr{background:#C8401A;color:#fff;padding:3.5mm 4mm;display:flex;justify-content:space-between;align-items:center}
  .brand{font-size:16pt;font-weight:900;letter-spacing:-0.5px}
  .oid{background:#fff;color:#C8401A;font-size:10pt;font-weight:900;padding:1px 8px;border-radius:999px}
  .sec{padding:2.5mm 4mm;border-bottom:1px dashed #bbb}
  .lbl{font-size:5.5pt;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:700;margin-bottom:1mm}
  .val{font-size:10.5pt;font-weight:700;color:#111;line-height:1.35}
  .sm{font-size:8pt;color:#444;line-height:1.5}
  .items{padding:2.5mm 4mm}
  .ftr{background:#fef6f3;padding:3mm 4mm;border-top:1px solid #ddd;display:flex;justify-content:flex-end;align-items:center}
  .dt{font-size:7pt;color:#aaa;text-align:right;line-height:1.6}
  .no-print{text-align:center;padding:10px}
  @media print{.no-print{display:none!important}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
</style>
</head>
<body>
<div class="box">
  <div class="hdr">
    <div class="brand"><span style="color: #fe6603;">Ind</span><span style="color: #036e26;">basket</span></div>
    <div class="oid">#${order.order_number || order.id}</div>
  </div>
  <div class="sec">
    <div class="lbl">Ship To</div>
    <div class="val">${escapeHtml(address.name || "")}</div>
    <div class="sm">${escapeHtml(address.line1 || "")}${address.line2 ? ", " + escapeHtml(address.line2) : ""}</div>
    <div class="sm">${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} - ${escapeHtml(
      address.pincode || ""
    )}, India</div>
    ${address.mobile ? '<div class="sm" style="font-weight:700;margin-top:1mm;">Ph: ' + escapeHtml(address.mobile) + "</div>" : ""}
  </div>
 
  <div class="items">
    <div class="lbl" style="margin-bottom:2mm;">Package Items (${items.length}) - ${
      activeTab === "admin" ? "Admin" : "Vendor"
    }</div>
    ${itemRows}
  </div>
  <div class="ftr">
    <div class="dt">
      ${new Date(order.created_at).toLocaleDateString("en-IN")}
      ${awbList ? "<br>" + awbList : order.tracking_id ? "<br>AWB: " + escapeHtml(order.tracking_id) : ""}
    </div>
  </div>
</div>
<div class="no-print">
  <button onclick="window.print()" style="background:#C8401A;color:#fff;border:none;padding:8px 28px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;">
    Print Label
  </button>
</div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=440,height=640");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  // Partition orders by fulfillment ownership
  const processedOrders = useMemo(() => {
    return orders.map((order) => {
      const allFuls = order.fulfillments || [];
      const adminFuls = allFuls.filter((f) => f.vendor_id === null);
      const vendorFuls = allFuls.filter((f) => f.vendor_id !== null);
      const isMixed = adminFuls.length > 0 && vendorFuls.length > 0;
      const activeFuls = activeTab === "admin" ? adminFuls : vendorFuls;

      return {
        ...order,
        adminFulfillments: adminFuls,
        vendorFulfillments: vendorFuls,
        activeFulfillments: activeFuls,
        isMixed,
      };
    });
  }, [orders, activeTab]);

  const adminOrdersCount = useMemo(
    () => orders.filter((o) => (o.fulfillments || []).some((f) => f.vendor_id === null)).length,
    [orders]
  );

  const vendorOrdersCount = useMemo(
    () => orders.filter((o) => (o.fulfillments || []).some((f) => f.vendor_id !== null)).length,
    [orders]
  );

  const vendorsInOrders = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      (o.fulfillments || []).forEach((f) => {
        if (f.vendor_id !== null && !map.has(f.vendor_id)) {
          map.set(f.vendor_id, f.vendor_name || `Vendor #${f.vendor_id}`);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filtered = useMemo(() => {
    return processedOrders.filter((order) => {
      // Must contain active fulfillments for this tab
      if (order.activeFulfillments.length === 0) return false;

      // In vendor tab, filter by selected vendor if applicable
      if (activeTab === "vendor" && vendorFilter !== "all") {
        const hasSelectedVendor = order.vendorFulfillments.some(
          (f) => String(f.vendor_id) === String(vendorFilter)
        );
        if (!hasSelectedVendor) return false;
      }

      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const orderNum = (order.order_number || String(order.id)).toLowerCase();
        const userName = (order.user_name || "").toLowerCase();
        const userPhone = (order.user_phone || "").toLowerCase();

        let address = {};
        try {
          address = typeof order.address === "string" ? JSON.parse(order.address) : order.address || {};
        } catch (e) {}
        const addressPhone = (address.mobile || "").toLowerCase();
        const addressName = (address.name || "").toLowerCase();
        const vendorNames = order.activeFulfillments
          .map((f) => (f.vendor_name || "").toLowerCase())
          .join(" ");

        const matches =
          orderNum.includes(term) ||
          userName.includes(term) ||
          userPhone.includes(term) ||
          addressPhone.includes(term) ||
          addressName.includes(term) ||
          vendorNames.includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [processedOrders, activeTab, vendorFilter, statusFilter, searchTerm]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {activeTab === "admin"
              ? `${adminOrdersCount} Platform / Admin Orders`
              : `${vendorOrdersCount} Vendor Orders`}
          </p>
        </div>
      </div>

      {/* 1. Two Compact Tabs at Top of Right-Side Content Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("admin")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "admin"
                ? "bg-[#fe6603] text-white shadow-sm ring-2 ring-[#fe6603]/20"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#fe6603]/40 hover:text-gray-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Admin Orders</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "admin" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {adminOrdersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("vendor")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "vendor"
                ? "bg-[#fe6603] text-white shadow-sm ring-2 ring-[#fe6603]/20"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#fe6603]/40 hover:text-gray-900"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Vendor Orders</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "vendor" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {vendorOrdersCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeTab === "admin"
                ? "Search order, customer..."
                : "Search order, vendor, customer..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#fe6603]"
          />
        </div>
      </div>

      {/* Vendor Filter in Vendor Orders tab */}
      {activeTab === "vendor" && vendorsInOrders.length > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
          <Store className="w-4 h-4 text-[#fe6603] shrink-0" />
          <span className="text-xs text-gray-700 font-semibold">Filter by Vendor:</span>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#fe6603]"
          >
            <option value="all">All Vendors ({vendorsInOrders.length})</option>
            {vendorsInOrders.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {vendorFilter !== "all" && (
            <button
              onClick={() => setVendorFilter("all")}
              className="text-xs text-[#fe6603] hover:underline font-medium ml-auto"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {["all", ...STATUSES].map((s) => {
          const tabOrders = processedOrders.filter((o) => o.activeFulfillments.length > 0);
          const count = s === "all" ? tabOrders.length : tabOrders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                statusFilter === s
                  ? "bg-[#fe6603] text-white hover:bg-[#e55c02] shadow-sm"
                  : "bg-white border border-gray-200 text-gray-900/60 hover:border-brand-orange/40"
              }`}
            >
              {s === "all" ? `All (${count})` : `${s} (${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-12 text-center">
          <p className="text-gray-500 text-sm">
            {activeTab === "admin"
              ? "No platform/admin orders found."
              : "No vendor orders found."}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((order, i) => {
            const displayFulfillments = order.activeFulfillments.filter((f) =>
              activeTab === "vendor" && vendorFilter !== "all"
                ? String(f.vendor_id) === String(vendorFilter)
                : true
            );

            // Compute tab subtotal for displayed packages
            const tabSubtotal = displayFulfillments.reduce(
              (sum, f) => sum + parseFloat(f.subtotal || f.total_amount || 0),
              0
            );

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm sm:text-base">
                        #{order.order_number || order.id}
                      </span>
                      <span className="text-gray-500 text-[10px] sm:text-xs font-sans">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[order.status] || "bg-white text-gray-500"
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.isMixed && (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            activeTab === "admin"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-purple-100 text-purple-800 border border-purple-200"
                          }`}
                        >
                          {activeTab === "admin"
                            ? "Mixed Order (Admin Portion)"
                            : "Mixed Order (Vendor Portion)"}
                        </span>
                      )}
                      {order.payment_method === "cod" && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          COD (₹{order.total - (order.advance_paid || 0)} Pending)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-gray-900/60 text-[10px] sm:text-xs truncate">
                        Customer: {order.user_name || "Guest"}
                      </p>
                      {activeTab === "vendor" && (
                        <p className="text-gray-500 text-[10px] sm:text-xs truncate">
                          • Vendor(s):{" "}
                          <strong className="text-gray-800">
                            {[
                              ...new Set(
                                displayFulfillments.map((f) => f.vendor_name || `Vendor #${f.vendor_id}`)
                              ),
                            ].join(", ")}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-[#D4AF37] text-sm sm:text-base lg:text-lg block">
                      ₹{tabSubtotal > 0 ? tabSubtotal.toLocaleString() : order.total}
                    </span>
                    {order.isMixed && (
                      <span className="text-[10px] text-gray-400">
                        Order Total: ₹{order.total}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                      expanded === order.id ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {expanded === order.id && (
                  <div className="border-t border-brand-orange/5 p-3 sm:p-4 lg:p-5 space-y-4">
                    {/* Customer Details */}
                    {(() => {
                      let address = {};
                      try {
                        address =
                          typeof order.address === "string"
                            ? JSON.parse(order.address)
                            : order.address || {};
                      } catch (e) {}
                      return (
                        <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-bold">
                              Customer
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {order.user_name || address.name || "Guest"}
                              </p>
                              {order.user_email && (
                                <p className="text-xs text-gray-500">{order.user_email}</p>
                              )}
                              {(order.user_phone || address.mobile) && (
                                <a
                                  href={`tel:${order.user_phone || address.mobile}`}
                                  className="text-xs text-[#fe6603] font-medium hover:underline"
                                >
                                  📞 {order.user_phone || address.mobile}
                                </a>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-bold">
                              Shipping Address
                            </p>
                            <div className="text-xs text-gray-700 leading-relaxed">
                              {address.name && <p className="font-semibold">{address.name}</p>}
                              {address.line1 && (
                                <p>
                                  {address.line1}
                                  {address.line2 ? `, ${address.line2}` : ""}
                                </p>
                              )}
                              {address.city && (
                                <p>
                                  {address.city}
                                  {address.state ? `, ${address.state}` : ""} — {address.pincode}
                                </p>
                              )}
                              {address.mobile && (
                                <p className="text-gray-500 mt-0.5">📱 {address.mobile}</p>
                              )}
                            </div>
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-200">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              Payment:
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                order.payment_method === "cod"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {order.payment_method === "cod"
                                ? "Cash on Delivery"
                                : "Prepaid / Online"}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              Package Subtotal:{" "}
                              <span className="font-bold text-gray-900">
                                ₹{tabSubtotal > 0 ? tabSubtotal.toLocaleString() : order.total}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">
                          Order Status
                        </p>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 text-gray-900 text-sm focus:outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fulfillment Packages partitioned by activeTab */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                            {activeTab === "admin" ? "Platform Packages" : "Vendor Packages"} (
                            {displayFulfillments.length})
                          </p>
                          {activeTab === "vendor" && (
                            <span className="text-[10px] text-gray-500 italic">
                              Admin dispatch on behalf of vendor
                            </span>
                          )}
                        </div>

                        {displayFulfillments.length > 0 ? (
                          <div className="space-y-3">
                            {displayFulfillments.map((ful) => (
                              <div
                                key={ful.id}
                                className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-xs space-y-2.5"
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {ful.vendor_id === null ? (
                                      <span className="font-bold text-gray-900 flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                        Platform (In-House)
                                      </span>
                                    ) : (
                                      <span className="font-bold text-[#fe6603] flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                        <Store className="w-3.5 h-3.5 text-[#fe6603]" />
                                        {ful.vendor_name || `Vendor #${ful.vendor_id}`}
                                      </span>
                                    )}
                                    <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                                      {ful.fulfillment_number}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      ful.status === "shipped" || ful.status === "delivered"
                                        ? "bg-green-100 text-green-700"
                                        : ful.status === "ready_to_ship"
                                        ? "bg-blue-100 text-blue-700"
                                        : ful.status === "failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {ful.status === "ready_to_ship"
                                      ? "Pickup Scheduled"
                                      : ful.status || "Pending"}
                                  </span>
                                </div>

                                {/* Items in this fulfillment */}
                                {ful.items && ful.items.length > 0 && (
                                  <div className="bg-white rounded-lg p-2 border border-gray-200/60 divide-y divide-gray-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">
                                      Package Items ({ful.items.length})
                                    </p>
                                    {ful.items.map((it) => (
                                      <div
                                        key={it.id || it.product_id}
                                        className="py-1 flex items-center justify-between text-[11px]"
                                      >
                                        <div className="truncate flex-1 pr-2">
                                          <span className="font-semibold text-gray-800">
                                            {it.product_name}
                                          </span>
                                          {it.variant_details && (
                                            <span className="text-gray-500 text-[10px] ml-1">
                                              {typeof it.variant_details === "string"
                                                ? it.variant_details
                                                : it.variant_details.size || it.variant_details.color || ""}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-gray-600 font-mono">
                                          x{it.quantity} (₹{parseFloat(it.unit_price || 0).toLocaleString()})
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Warehouse Info */}
                                <div className="text-[11px] text-gray-600 flex items-center justify-between">
                                  <span>
                                    Warehouse:{" "}
                                    <strong className="font-mono text-gray-800">
                                      {ful.pickup_location_nickname ||
                                        (ful.vendor_id === null
                                          ? "suresh (Admin Default)"
                                          : "Unassigned")}
                                    </strong>
                                  </span>
                                  <span className="font-bold text-gray-900">
                                    ₹
                                    {parseFloat(
                                      ful.subtotal || ful.total_amount || 0
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                {ful.sync_error && (
                                  <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                                    ⚠️ {ful.sync_error}
                                  </p>
                                )}

                                {ful.status === "cancelled" ? (
                                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                    <span>Package Cancelled (Inventory Restored)</span>
                                  </div>
                                ) : ful.awb_code ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                                      <span className="text-green-800 font-bold text-xs truncate">
                                        AWB: {ful.awb_code}{" "}
                                        {ful.courier_name ? `(${ful.courier_name})` : ""}
                                      </span>
                                      {ful.tracking_url && (
                                        <a
                                          href={ful.tracking_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ml-auto text-green-700 hover:text-green-900 flex items-center gap-0.5"
                                          title="Live Tracking"
                                        >
                                          <span className="text-[10px] font-bold underline">Track</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                    {(ful.pickup_token_number || ful.label_url) && (
                                      <div className="flex items-center justify-between text-[11px] text-gray-600 px-1 pt-0.5">
                                        {ful.pickup_token_number && (
                                          <span className="text-blue-700 font-medium">
                                            Pickup Token:{" "}
                                            <strong>{ful.pickup_token_number}</strong>
                                          </span>
                                        )}
                                        {ful.label_url && (
                                          <a
                                            href={ful.label_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-orange underline font-semibold ml-auto"
                                          >
                                            Print Courier Label
                                          </a>
                                        )}
                                      </div>
                                    )}

                                    {/* Dispatched actions */}
                                    <div className="flex items-center gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => syncFulfillmentStatus(ful.id, order.id)}
                                        disabled={syncing[ful.id]}
                                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:bg-white text-gray-700 text-[11px] font-semibold transition-colors disabled:opacity-50"
                                        title="Sync live courier tracking status from Shiprocket"
                                      >
                                        <RefreshCw
                                          className={`w-3 h-3 ${syncing[ful.id] ? "animate-spin" : ""}`}
                                        />
                                        <span>{syncing[ful.id] ? "Syncing..." : "Live Status"}</span>
                                      </button>

                                      {(ful.status === "failed" || ful.sync_error) && (
                                        <button
                                          type="button"
                                          onClick={() => createFulfillmentShipment(ful.id, order.id)}
                                          disabled={shipping[ful.id]}
                                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                                          title="Retry pickup booking"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Retry</span>
                                        </button>
                                      )}

                                      {ful.status !== "shipped" && ful.status !== "delivered" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            cancelFulfillmentShipment(
                                              ful.id,
                                              order.id,
                                              ful.fulfillment_number
                                            )
                                          }
                                          disabled={cancelling[ful.id]}
                                          className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors disabled:opacity-50"
                                          title="Cancel shipment in Shiprocket and return stock"
                                        >
                                          {cancelling[ful.id] ? "Cancelling..." : "Cancel"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => createFulfillmentShipment(ful.id, order.id)}
                                      disabled={shipping[ful.id] || cancelling[ful.id]}
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#fe6603] hover:bg-[#e55c02] text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                      <Truck className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {shipping[ful.id]
                                          ? "Dispatching..."
                                          : ful.vendor_id === null
                                          ? "🚚 Dispatch (Admin Warehouse)"
                                          : `🚚 Dispatch (On Behalf of ${ful.vendor_name || "Vendor"})`}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        cancelFulfillmentShipment(
                                          ful.id,
                                          order.id,
                                          ful.fulfillment_number
                                        )
                                      }
                                      disabled={shipping[ful.id] || cancelling[ful.id]}
                                      className="px-2.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50"
                                    >
                                      {cancelling[ful.id] ? "Cancelling..." : "Cancel"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            No matching packages found for this tab.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-brand-orange/5">
                      <button
                        onClick={() => printLabel(order)}
                        className="flex items-center justify-center gap-1.5 bg-[#fe6603] text-white hover:bg-[#e55c02] px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          Print Label ({activeTab === "admin" ? "Admin" : "Vendor"})
                        </span>
                      </button>
                      <button
                        onClick={() => notifyWhatsApp(order)}
                        className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">Notify WA</span>
                      </button>
                      <button
                        onClick={() => openInvoice(order)}
                        className="flex items-center justify-center gap-1.5 bg-[#D4AF37] hover:bg-amber-500 text-gray-900 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          Invoice ({activeTab === "admin" ? "Admin" : "Vendor"})
                        </span>
                      </button>
                      <button
                        onClick={() => sendInvoiceWhatsApp(order)}
                        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">Send Invoice</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
