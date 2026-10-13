import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Layers, LogOut, Headphones, Menu, X, Users, ImageIcon, Tag, BarChart3, UserPlus, UserCircle, Store, Wallet, CreditCard, Percent, Megaphone } from "lucide-react";
import logo from '../../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const ALL_NAV = [
  { href: "/support/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/support/orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/support/customers", label: "Customers", icon: <Users className="w-4 h-4" /> },
  { href: "/support/products", label: "Products", icon: <Package className="w-4 h-4" /> },
  { href: "/support/categories", label: "Categories", icon: <Layers className="w-4 h-4" /> },
  { href: "/support/banners", label: "Banners", icon: <ImageIcon className="w-4 h-4" /> },
  { href: "/support/coupons", label: "Coupons", icon: <Tag className="w-4 h-4" /> },
  { href: "/support/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/support/vendor-requests", label: "Vendor Requests", icon: <UserPlus className="w-4 h-4" /> },
  { href: "/support/vendor-profiles", label: "Vendor Profiles", icon: <UserCircle className="w-4 h-4" /> },
  { href: "/support/vendor-products", label: "Vendor Products", icon: <Store className="w-4 h-4" /> },
  { href: "/support/vendor-wallets", label: "Vendor Wallets", icon: <Wallet className="w-4 h-4" /> },
  { href: "/support/vendor-orders", label: "Vendor Orders", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/support/subscriptions", label: "Subscriptions", icon: <CreditCard className="w-4 h-4" /> },
  { href: "/support/offers", label: "Offers", icon: <Percent className="w-4 h-4" /> },
  { href: "/support/advertisements", label: "Advertisements", icon: <Megaphone className="w-4 h-4" /> },
  { href: "/support/wallet", label: "Virtual Wallet", icon: <Wallet className="w-4 h-4" /> },
  { href: "/support/profile", label: "Profile", icon: <UserCircle className="w-4 h-4" /> },
];

export function SupportLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [agent, setAgent] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("support_token");
    if (!token) { navigate("/support-login"); return; }

    fetch(`${BACKEND_URL}/supportAuth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.agent) { navigate("/support-login"); return; }
        setAgent(d.agent);
      })
      .catch(() => navigate("/support-login"));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("support_token");
    navigate("/support-login");
  };

  if (!agent) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#036e26]/20 border-t-[#036e26] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#036e26]/10 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ULMGH369" className="h-8 object-contain mix-blend-multiply" />
          <span className="font-bold text-lg">
            <span className="text-[#fe6603]">Ind</span><span className="text-[#036e26]">basket</span>{' '}
            <span className="text-sm font-normal text-gray-500">Support</span>
          </span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[#036e26]">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-[#036e26]/10 flex flex-col fixed h-full z-50 transition-transform ${
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-5 border-b border-[#036e26]/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ULMGH369" className="h-10 object-contain mix-blend-multiply" />
            <div>
              <p className="font-bold text-xl tracking-tight leading-none">
                <span className="text-[#fe6603]">Ind</span><span className="text-[#036e26]">basket</span>
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Headphones className="w-3 h-3 text-[#036e26]" />
                <p className="text-[#036e26] text-[10px] font-sans font-semibold">Support Portal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-[#036e26]/10">
          <p className="font-sans font-semibold text-[#036e26] text-sm truncate">{agent.name}</p>
          <p className="text-[#036e26]/40 text-[10px] font-sans truncate">{agent.email}</p>
          {agent.scope === 'vendor' && (
            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#fe6603]/10 text-[#fe6603]">
              Vendor Support
            </span>
          )}
          {(!agent.scope || agent.scope === 'admin') && (
            <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#036e26]/10 text-[#036e26]">
              Admin Support
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {ALL_NAV.filter(item => {
            // Default allow dashboard if empty access pages
            if (item.href === "/support/dashboard" && (!agent.access_pages || agent.access_pages.length === 0)) return true;
            return agent.access_pages && agent.access_pages.includes(item.href);
          }).map(item => (
            <Link key={item.href} to={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-colors ${
                pathname === item.href
                  ? "bg-[#036e26]/10 text-[#036e26]"
                  : "text-[#036e26]/60 hover:text-[#036e26] hover:bg-[#FDFBF7]"
              }`}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#036e26]/10">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 sm:p-6 pt-16 md:pt-6 min-w-0">
        {children}
      </main>
    </div>
  );
}
