import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, MessageCircle, ChevronDown, Printer, FileText, PackageSearch } from 'lucide-react';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const FROM_ADDRESS = {
  name: "ULMGH369 (Vendor Portal)",
  line1: "1-1-738, Vinayaka temple road",
  city: "Koratla",
  state: "Telangana",
  pincode: "",
  phone: "+91 90326 75205",
};

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('vendor_token');
      const res = await fetch(`${BACKEND_URL}/vendor/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const notifyWhatsApp = (order) => {
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
    const phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    const msg = encodeURIComponent(`Hi ${order.user_name || address.name || "Customer"}! Your order #${order.order_number || order.id} containing our products has been updated to: *${order.status}*.`);
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
    let items = order.items || [];
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

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
          <title>Vendor Invoice #${order.order_number || order.id}</title>
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
              .items-table td { padding: 10px 12px; border-bottom: 1px solid #FFE4DE; font-size: 9.5pt; }
              .items-table tr.alt-row td { background-color: #FFFAF9; }
              .totals-table { width: 40%; float: right; border-collapse: collapse; margin-top: 15px; }
              .totals-table td { padding: 8px 12px; font-size: 9.5pt; }
              .totals-table tr.grand-total { background-color: #FFE4DE; font-weight: bold; color: #E63A12; font-size: 11pt; border-top: 2px solid #E63A12; }
              .clearfix::after { content: ""; clear: both; display: table; }
              .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #FFE4DE; text-align: center; font-size: 8.5pt; color: #888888; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
      </head>
      <body>
          <div class="invoice-container">
              <div class="invoice-header">
                  <table class="header-table">
                      <tr>
                          <td style="width: 50%;">
                              <!-- Brand Placeholder -->
                              <div style="font-size: 24pt; font-weight: 800; color: #E63A12; letter-spacing: -1px; line-height: 1;">ULMGH369</div>
                              <div style="font-size: 10pt; color: #666; margin-top: 4px; font-weight: 500;">Vendor Partner Invoice</div>
                          </td>
                          <td style="width: 50%;" class="invoice-title-block">
                              <h1 class="invoice-title">Tax Invoice</h1>
                              <div class="invoice-meta">
                                  <strong>Invoice Number:</strong> INV-${order.order_number || order.id}<br>
                                  <strong>Invoice Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
                                  <strong>Order Reference:</strong> ${order.order_number || order.id}
                              </div>
                          </td>
                      </tr>
                  </table>
              </div>
  
              <table class="addresses-table">
                  <tr>
                      <td class="from-box">
                          <div class="section-heading">Billed From</div>
                          <div class="address-box">
                              <strong>${FROM_ADDRESS.name}</strong><br>
                              ${FROM_ADDRESS.line1}<br>
                              ${FROM_ADDRESS.city}, ${FROM_ADDRESS.state} ${FROM_ADDRESS.pincode}<br>
                              Phone: ${FROM_ADDRESS.phone}
                          </div>
                      </td>
                      <td class="ship-box">
                          <div class="section-heading">Billed To (Customer)</div>
                          <div class="address-box">
                              <strong>${escapeHtml(address.name || order.user_name || "Customer")}</strong><br>
                              ${escapeHtml(address.addressLine1 || "")} ${escapeHtml(address.addressLine2 || "")}<br>
                              ${escapeHtml(address.city || "")}, ${escapeHtml(address.state || "")} ${escapeHtml(address.pincode || "")}<br>
                              Phone: ${escapeHtml(address.mobile || order.user_phone || "")}
                          </div>
                      </td>
                  </tr>
              </table>
  
              <table class="items-table">
                  <thead>
                      <tr>
                          <th style="width: 5%; text-align: center;">#</th>
                          <th style="width: 45%;">Item Description</th>
                          <th style="width: 20%; text-align: center;">Variant</th>
                          <th style="width: 10%; text-align: center;">Qty</th>
                          <th style="width: 20%; text-align: right;">Total Amount</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rows}
                  </tbody>
              </table>
  
              <div class="clearfix">
                  <table class="totals-table">
                      <tr>
                          <td style="text-align: right; color: #555;">Subtotal:</td>
                          <td style="text-align: right; font-weight: bold; width: 40%;">₹${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr class="grand-total">
                          <td style="text-align: right;">Grand Total:</td>
                          <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
                      </tr>
                  </table>
              </div>
  
              <div class="footer">
                  <p><strong>Thank you for shopping with ULMGH369!</strong></p>
                  <p>This is a computer-generated invoice and does not require a physical signature.</p>
              </div>
          </div>
      </body>
      </html>`;
  };

  const printInvoice = (order) => {
    const newWindow = window.open("", "_blank");
    newWindow.document.write(invoiceHtml(order));
    newWindow.document.close();
    setTimeout(() => {
      newWindow.print();
    }, 500);
  };

  const filteredOrders = orders.filter(o => 
    o.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-gray-500 mt-1.5 font-medium">Fulfill orders containing your products.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#fe6603]/50 focus:border-[#fe6603] transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500">Order ID</th>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500">Your Items</th>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500">Your Revenue</th>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500">Overall Status</th>
                <th className="px-8 py-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No orders have been placed for your products yet.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  let address = {};
                  try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e){}
                  
                  return (
                    <React.Fragment key={order.id}>
                      <tr 
                        className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                      >
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-900 group-hover:text-[#fe6603] transition-colors">{order.order_number || order.id}</div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#fe6603]/10 text-[#fe6603]">
                            {order.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-extrabold text-gray-900 text-lg tracking-tight">₹{parseFloat(order.total || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[order.status?.toLowerCase() || 'pending']}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center ml-auto group-hover:bg-[#fe6603]/10 group-hover:text-[#fe6603] transition-colors">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expanded === order.id ? "rotate-180 text-[#fe6603]" : "text-gray-400"}`} />
                          </div>
                        </td>
                      </tr>
                      
                      {expanded === order.id && (
                        <tr>
                          <td colSpan="6" className="p-0 border-b border-gray-100">
                            <div className="bg-gray-50/50 p-6 shadow-inner border-y border-gray-100">
                              <div className="flex flex-col xl:flex-row gap-6">
                                <div className="flex-1 space-y-6">
                                  {/* Customer Info */}
                                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">Customer Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Name</p>
                                        <p className="font-medium text-gray-900">{address.name || order.user_name || "Guest"}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</p>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium text-gray-900">{address.mobile || order.user_phone}</p>
                                          <button onClick={(e) => { e.stopPropagation(); notifyWhatsApp(order); }} className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors" title="Message on WhatsApp">
                                            <MessageCircle className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="md:col-span-2">
                                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Shipping Address</p>
                                        <p className="text-gray-900 font-medium">{address.addressLine1} {address.addressLine2}, {address.city}, {address.state} {address.pincode}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Items */}
                                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">Your Products in Order</h4>
                                    <div className="space-y-4">
                                      {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                          <div className="w-16 h-16 rounded-md bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                            {item.product?.image_url ? (
                                              <img src={item.product.image_url} alt="" className="w-full h-full object-contain p-1" />
                                            ) : (
                                              <PackageSearch className="w-6 h-6 text-gray-300" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{item.product?.name}</p>
                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                              <span>Variant: <strong className="text-gray-900">{item.variant?.color ? item.variant.color + " / " : ""}{item.variant?.size}</strong></span>
                                              <span>Qty: <strong className="text-gray-900">{item.qty}</strong></span>
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className="font-bold text-brand-orange">₹{((item.variant?.price || item.product?.price || 0) * item.qty).toLocaleString()}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="w-full xl:w-80 space-y-6">
                                  {/* Order Actions */}
                                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">Vendor Actions</h4>
                                    <div className="space-y-3">
                                      <button onClick={(e) => { e.stopPropagation(); printInvoice(order); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                                        <Printer className="w-4 h-4" /> Print Invoice
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
