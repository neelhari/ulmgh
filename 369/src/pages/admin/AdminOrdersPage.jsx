import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ChevronDown, Printer, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const FROM_ADDRESS = {
  name: "ULMGH369",
  line1: "1-1-738, Vinayaka temple road",
  city: "Koratla",
  state: "Telangana",
  pincode: "",
  phone: "+91 90326 75205",
};

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tracking, setTracking] = useState({});
  const [shipping, setShipping] = useState({});

  useEffect(() => {
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
          d.orders.forEach(o => { t[o.id] = { id: o.tracking_id || "", link: o.tracking_link || "" }; });
          setTracking(t);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const createShipment = async (orderId) => {
    const token = localStorage.getItem("token");
    setShipping((p) => ({ ...p, [orderId]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${orderId}/ship`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed. Backend shipment route might not be configured yet.");
      
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, tracking_id: data.awb, tracking_link: data.tracking_link, status: "shipped" } : o));
      setTracking((p) => ({ ...p, [orderId]: { id: data.awb, link: data.tracking_link } }));
      alert(`Shipment created! AWB: ${data.awb}`);
    } catch (err) {
      alert(`Shipment status: ${err.message}`);
    } finally {
      setShipping((p) => ({ ...p, [orderId]: false }));
    }
  };

  const notifyWhatsApp = (order) => {
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
    
    const phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    const t = tracking[order.id];
    const trackMsg = t?.id ? ` Your tracking ID is ${t.id}.${t.link ? ` Track here: ${t.link}` : ""}` : "";
    const msg = encodeURIComponent(`Hi ${order.user_name || address.name || "Customer"}! Your order #${order.order_number || order.id} status is now: *${order.status}*.${trackMsg}`);
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
    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch(e) {}
    
    let address = {};
    try {
      address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {});
    } catch(e) {}

    const subtotal = items.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || 0) * item.qty), 0);
    const rows = items.map((item, idx) => `
      <tr class="${idx % 2 === 0 ? '' : 'alt-row'}">
        <td style="text-align: center;">${idx + 1}</td>
        <td><span style="font-weight: bold; color: #222222;">${escapeHtml(item.product?.name)}</span></td>
        <td style="text-align: center;">${escapeHtml((item.variant?.color ? item.variant.color + " / " : "") + (item.variant?.size || "-"))}</td>
        <td style="text-align: center;">${item.qty} </td>
        <td style="text-align: right;">₹${(item.variant?.price || item.product?.price || 0).toFixed(2)}</td>
      </tr>
    `).join("");

    return `<!doctype html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Invoice #${order.order_number || order.id}</title>
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
                          </div>
                      </td>
                      <td class="invoice-title-block">
                          <div class="invoice-title">Order Invoice</div>
                          <div class="invoice-meta">
                              <strong>Invoice No:</strong> #${order.order_number || order.id}<br>
                              <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}<br>
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
                          ${escapeHtml(address.line1 || "")}${address.line2 ? `, ${escapeHtml(address.line2)}` : ""}<br>
                          ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} — ${escapeHtml(address.pincode || "")}, India<br>
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
                      <tr><td class="label">Subtotal</td><td class="value">₹${subtotal.toFixed(2)}</td></tr>
                      ${Number(order.total) - subtotal > 0 ? `<tr><td class="label">Delivery Charges</td><td class="value">₹${(Number(order.total) - subtotal).toFixed(2)}</td></tr>` : ''}
                      <tr class="grand-total"><td class="label">TOTAL:</td><td class="value">₹${Number(order.total).toFixed(2)}</td></tr>
                      ${order.payment_method === 'cod' ? `<tr><td class="label" style="color: #059669; font-size: 9pt;">Advance Paid (Online)</td><td class="value" style="color: #059669; font-size: 9pt;">-₹${Number(order.advance_paid || 0).toFixed(2)}</td></tr>
                      <tr class="grand-total" style="background-color: #ecfdf5; border-color: #059669; color: #059669;"><td class="label" style="color: #059669;">CASH TO COLLECT:</td><td class="value">₹${(Number(order.total) - Number(order.advance_paid || 0)).toFixed(2)}</td></tr>` : ''}
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
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
    
    const phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    const itemsText = items.map((i) => `• ${i.product?.name} ×${i.qty} — ₹${(i.variant?.price || i.product?.price || 0) * i.qty}`).join("\n");
    const msg = encodeURIComponent(
      `Hi ${order.user_name || address.name || 'Customer'}! 🙏 Please find your *Invoice* for Order *#${order.order_number || order.id}* below:\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total: ₹${order.total}*\n\n` +
      `Thank you for shopping with ULMGH369!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const printLabel = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

    const itemRows = items.map((item) => {
      const unitStr = item.variant?.size ? ` (${escapeHtml(item.variant?.size)})` : '';
      return `<div style="display:flex;justify-content:space-between;padding:1.5mm 0;border-bottom:1px solid #eee;">
        <div style="font-size:8pt;font-weight:600;flex:1;padding-right:3mm;">${escapeHtml(item.product?.name)}${unitStr}</div>
        <div style="font-size:8pt;color:#555;white-space:nowrap;">x${item.qty}</div>
      </div>`;
    }).join('');

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
    <div class="val">${escapeHtml(address.name || '')}</div>
    <div class="sm">${escapeHtml(address.line1 || '')}${address.line2 ? ', ' + escapeHtml(address.line2) : ''}</div>
    <div class="sm">${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} - ${escapeHtml(address.pincode || '')}, India</div>
    ${address.mobile ? '<div class="sm" style="font-weight:700;margin-top:1mm;">Ph: ' + escapeHtml(address.mobile) + '</div>' : ''}
  </div>
 
  <div class="items">
    <div class="lbl" style="margin-bottom:2mm;">Order Items (${items.length})</div>
    ${itemRows}
  </div>
  <div class="ftr">
    <div class="dt">
      ${new Date(order.created_at).toLocaleDateString('en-IN')}
      ${order.tracking_id ? '<br>AWB: ' + escapeHtml(order.tracking_id) : ''}
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

    const w = window.open('', '_blank', 'width=440,height=640');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  const filtered = orders.filter(o => statusFilter === "all" || o.status === statusFilter);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-xs mt-0.5">{orders.length} total</p>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {["all", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              statusFilter === s
                ? "bg-[#fe6603] text-white hover:bg-[#e55c02] shadow-sm"
                : "bg-white border border-gray-200 text-gray-900/60 hover:border-brand-orange/40"
            }`}>
            {s === "all" ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 sm:p-12 text-center">
          <p className="text-gray-500 text-sm">
            {orders.length === 0 ? "No orders yet." : `No ${statusFilter} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 cursor-pointer hover:bg-white/30 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">#{order.order_number || order.id}</span>
                    <span className="text-gray-500 text-[10px] sm:text-xs font-sans">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-white text-gray-500"}`}>
                      {order.status}
                    </span>
                    {order.payment_method === 'cod' && (
                      <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        COD (₹{order.total - (order.advance_paid || 0)} Pending)
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900/60 text-[10px] sm:text-xs mt-0.5 truncate">
                    {order.user_name || "Guest"}
                  </p>
                </div>
                <span className="font-bold text-[#D4AF37] text-sm sm:text-base lg:text-lg flex-shrink-0">₹{order.total}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded === order.id ? "rotate-180" : ""}`} />
              </div>

              {expanded === order.id && (
                <div className="border-t border-brand-orange/5 p-3 sm:p-4 lg:p-5 space-y-4">

                  {/* Customer Details */}
                  {(() => {
                    let address = {};
                    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
                    return (
                      <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-bold">Customer</p>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">{order.user_name || address.name || 'Guest'}</p>
                            {order.user_email && <p className="text-xs text-gray-500">{order.user_email}</p>}
                            {(order.user_phone || address.mobile) && (
                              <a href={`tel:${order.user_phone || address.mobile}`} className="text-xs text-[#fe6603] font-medium hover:underline">
                                📞 {order.user_phone || address.mobile}
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-bold">Shipping Address</p>
                          <div className="text-xs text-gray-700 leading-relaxed">
                            {address.name && <p className="font-semibold">{address.name}</p>}
                            {address.line1 && <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>}
                            {address.city && <p>{address.city}{address.state ? `, ${address.state}` : ''} — {address.pincode}</p>}
                            {address.mobile && <p className="text-gray-500 mt-0.5">📱 {address.mobile}</p>}
                          </div>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-gray-200">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payment:</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ order.payment_method === 'cod' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700' }`}>
                            {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid / Online'}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">Total: <span className="font-bold text-gray-900">₹{order.total}</span></span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Update Status</p>
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-100 text-gray-900 text-sm focus:outline-none">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Shipment</p>
                      {order.tracking_id && order.tracking_id.trim() !== "" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            <span className="text-green-700 font-bold text-xs truncate">AWB: {order.tracking_id}</span>
                            {order.tracking_link && (
                              <a href={order.tracking_link} target="_blank" rel="noopener noreferrer"
                                className="ml-auto flex-shrink-0 text-gray-900 hover:opacity-80 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <button onClick={() => createShipment(order.id)} disabled={shipping[order.id]}
                            className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline">
                            Re-create shipment
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => createShipment(order.id)} disabled={shipping[order.id]}
                          className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-white/20 text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                          {shipping[order.id] ? "Creating..." : "🚚 Create Shipment"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-brand-orange/5">
                    <button onClick={() => printLabel(order)}
                      className="flex items-center justify-center gap-1.5 bg-[#fe6603] text-white hover:bg-[#e55c02] px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/80 transition-colors">
                      <Printer className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Print Label</span>
                    </button>
                    <button onClick={() => notifyWhatsApp(order)}
                      className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Notify WA</span>
                    </button>
                    <button onClick={() => openInvoice(order)}
                      className="flex items-center justify-center gap-1.5 bg-[#D4AF37] hover:bg-amber-500 text-gray-900 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Invoice</span>
                    </button>
                    <button onClick={() => sendInvoiceWhatsApp(order)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Send Invoice</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
