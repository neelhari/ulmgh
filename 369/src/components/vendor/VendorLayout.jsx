import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, LogOut, Store, Menu, X, Wallet, UserCircle, Layers, HeadphonesIcon, Tag } from "lucide-react";
import logo from '../../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const NAV = [
  { href: "/vendor", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/vendor/orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/vendor/products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { href: "/vendor/categories", label: "Categories", icon: <Layers className="w-4 h-4" /> },
  { href: "/vendor/wallet", label: "Virtual Wallet", icon: <Wallet className="w-4 h-4" /> },
    { href: "/vendor/offers", label: "Offers", icon: <Tag className="w-4 h-4" /> },
  { href: "/vendor/profile", label: "Profile", icon: <UserCircle className="w-4 h-4" /> },

  // { href: "/vendor/support", label: "Support", icon: <HeadphonesIcon className="w-4 h-4" /> },
  // { href: "/vendor/offers", label: "Offers", icon: <Tag className="w-4 h-4" /> },
];

export function VendorLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [vendor, setVendor] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vendor_token");
    if (!token) {
      navigate("/vendor-login");
      return;
    }

    fetch(`${BACKEND_URL}/vendorAuth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.vendor) { navigate("/vendor-login"); return; }
        setVendor(d.vendor);
      })
      .catch(() => navigate("/vendor-login"));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    navigate("/vendor-login");
  };

  if (!vendor) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#fe6603]/20 border-t-[#fe6603] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-[#fe6603]/10 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ULMGH369 Vendor" className="h-8 object-contain mix-blend-multiply" />
          <span className="font-bold text-lg"><span className="text-[#fe6603]">ULMGH369</span> <span className="text-[#036e26]">Shoppers</span></span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#fe6603]">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-gradient-to-b from-white to-[#FDFBF7] border-r border-[#fe6603]/10 flex flex-col fixed h-full z-50 transition-transform shadow-[4px_0_24px_rgba(254,102,3,0.03)] ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-6 border-b border-[#fe6603]/10 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#fe6603]/10 flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="ULMGH369" className="w-8 h-8 object-contain mix-blend-multiply" />
            </div>
            <div>
              <p className="font-extrabold text-xl tracking-tight leading-tight"><span className="text-[#fe6603]">ULMGH369</span><br/><span className="text-[#036e26]">Shoppers</span></p>
              <div className="flex items-center gap-1.5 mt-1.5 bg-[#fe6603]/10 w-fit px-2 py-0.5 rounded-md">
                <Store className="w-3 h-3 text-[#fe6603]" />
                <p className="text-[#fe6603] text-[10px] font-sans font-bold uppercase tracking-wider">Vendor Portal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-b border-[#fe6603]/5 bg-gradient-to-r from-transparent to-[#fe6603]/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fe6603] to-[#e55c02] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-bold text-gray-900 text-sm truncate">{vendor.name}</p>
              <p className="text-gray-500 text-xs font-sans truncate">{vendor.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-300 ${
                  isActive 
                    ? "bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white shadow-md shadow-[#fe6603]/20 translate-x-1" 
                    : "text-gray-600 hover:text-[#fe6603] hover:bg-orange-50 hover:translate-x-1"
                }`}>
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#fe6603]/10 bg-white">
          <button onClick={handleLogout}
            className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-sans font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all w-full border border-red-100 hover:border-transparent hover:shadow-md hover:shadow-red-500/20">
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 min-w-0 transition-all">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
