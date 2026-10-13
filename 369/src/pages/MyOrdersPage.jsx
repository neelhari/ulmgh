import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, FileText, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { Header } from '../components/Header';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export function MyOrdersPage() {
  const navigate = useNavigate();
  const { token, orders, fetchProfile, user } = useAuthStore();
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, [token]);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const invoiceHtml = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

    const subtotal = items.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || item.price || 0) * item.qty), 0);
    const rows = items.map((item, idx) => `
      <tr class="${idx % 2 === 0 ? '' : 'alt-row'}">
        <td style="text-align: center;">${idx + 1}</td>
        <td><span style="font-weight: bold; color: #222222;">${escapeHtml(item.product?.name || item.name)}</span></td>
        <td style="text-align: center;">${escapeHtml(item.variant?.size || item.size || '-')}</td>
        <td style="text-align: center;">${item.qty} </td>
        <td style="text-align: right;">₹${Number(item.variant?.price || item.product?.price || item.price || 0).toFixed(2)}</td>
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
                              <strong style="font-size: 20px;"><span className="text-[#fe6603]">Ind</span><span className="text-brand-orange">basket</span></strong><br>
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
                          <strong><span className="text-[#fe6603]">Ind</span><span className="text-brand-orange">basket</span></strong><br>
                          1-1-738, Vinayaka temple road,<br>
                          Koratla, Telangana, India<br>
                          <strong>Phone:</strong> +91 90326 75205
                      </div>
                  </td>
                  <td class="ship-box">
                      <div class="section-heading">Shipping Address</div>
                      <div class="address-box">
                          <strong>${escapeHtml(address.name || user?.name || "")}</strong><br>
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

  const handleReorder = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    
    items.forEach(item => {
      // Reconstruct the product/variant object expected by addToCart
      const productObj = item.product || { id: item.id, name: item.name, price: item.price, image_url: item.image_url };
      const variantObj = item.variant || null;
      addToCart(productObj, variantObj, item.qty);
    });
    
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Orders" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-bold text-[#022A21]">Order History</h2>
          <span className="text-sm font-semibold text-[#022A21] bg-orange-50/50 px-3 py-1 rounded-full border border-brand-orange/20">{orders.length} Orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-brand-orange" />
            </div>
            <p className="text-[#022A21] font-bold text-lg font-serif">No orders yet</p>
            <p className="text-sm text-gray-500 text-center max-w-sm">Looks like you haven't made your first order. Explore our spiritual collection today!</p>
            <Link to="/" className="mt-4 bg-gradient-to-r from-brand-orange to-yellow-500 text-white text-sm font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              Start Shopping
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const stepIdx = STATUS_STEPS.indexOf(order.status);
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-[#054335] bg-[#022A21]">
                  <div>
                    <p className="text-sm font-bold text-brand-orange font-serif">Order #{order.order_number || order.id}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-4 py-1.5 rounded-full border capitalize shadow-sm ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.status}
                    </span>
                    {order.payment_method === 'cod' && (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                        COD (₹{order.total - (order.advance_paid || 0)} pending)
                      </span>
                    )}
                    <p className="text-lg font-bold text-[#D4AF37]">₹{Number(order.total).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {order.status !== 'cancelled' && (
                  <div className="px-6 py-6 border-b border-gray-100 bg-white">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="flex flex-col items-center flex-1 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all z-10 ${
                              i <= stepIdx ? 'bg-[#022A21] border-[#022A21] text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                              {i < stepIdx ? '✓' : i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${i < stepIdx ? 'bg-[#022A21]' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center mt-2">
                        {STATUS_STEPS.map((step, i) => (
                          <span key={step} className={`text-[10px] sm:text-xs font-bold capitalize flex-1 text-center ${i <= stepIdx ? 'text-[#022A21]' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(order.items) && order.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                          {item.image_url || item.product?.image_url ? (
                            <img src={item.image_url || item.product?.image_url} alt={item.name || item.product?.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-bold text-[#022A21] line-clamp-1 font-serif">{item.name || item.product?.name || 'Product'}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">Qty: {item.qty || 1}</span>
                            {(item.size || item.variant?.size) && (
                              <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">{item.size || item.variant?.size}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[#022A21] pt-1">₹{Number(item.price || item.variant?.price || item.product?.price || 0).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 bg-orange-50/50 border-t border-brand-orange/20">
                  <button onClick={() => openInvoice(order)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-brand-orange border border-brand-orange/30 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors shadow-sm">
                    <FileText className="w-4 h-4 text-brand-orange" /> Download Invoice
                  </button>
                  <button onClick={() => handleReorder(order)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#022A21] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#033429] transition-colors shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Reorder Items
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
