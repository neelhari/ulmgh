import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  Store,
  Menu,
  X,
  Wallet,
  UserCircle,
  Layers,
  HeadphonesIcon,
  Tag,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import logo from '../../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Desktop primary sidebar navigation
const DESKTOP_NAV = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/categories", label: "Categories", icon: Layers },
  { href: "/vendor/wallet", label: "Virtual Wallet", icon: Wallet },
  { href: "/vendor/offers", label: "Offers & Coupons", icon: Tag },
  { href: "/vendor/profile", label: "Profile", icon: UserCircle },
  { href: "/vendor/guidelines", label: "Guidelines", icon: ShieldCheck },
  { href: "/vendor/support", label: "Support & Team", icon: HeadphonesIcon },
];

// Mobile bottom navigation tabs (4 primary app destinations)
const MOBILE_BOTTOM_NAV = [
  { href: "/vendor", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/vendor/categories", label: "Categories", icon: Layers },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/wallet", label: "Wallet", icon: Wallet },
];

// Mobile secondary menu items (accessible via hamburger drawer)
const MOBILE_SECONDARY_NAV = [
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag, badge: null },
  { href: "/vendor/offers", label: "Offers & Coupons", icon: Tag, badge: null },
  { href: "/vendor/guidelines", label: "Guidelines", icon: ShieldCheck, badge: null },
  { href: "/vendor/support", label: "Support & Team", icon: HeadphonesIcon, badge: null },
  { href: "/vendor/profile", label: "Profile & Subscription", icon: UserCircle, badge: null },
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

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    navigate("/vendor-login");
  };

  const isRouteActive = (href, exact = false) => {
    if (exact || href === "/vendor") {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  if (!vendor) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#fe6603]/20 border-t-[#fe6603] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE TOP HEADER (Fixed with Safe Area)
      ───────────────────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 pt-safe z-50 flex items-center justify-between h-14 shadow-sm">
        <Link to="/vendor" className="flex items-center gap-2.5 min-w-0" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="ULMGH369 Logo" className="w-6 h-6 object-contain mix-blend-multiply" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-extrabold text-base tracking-tight text-[#fe6603]">ULMGH369</span>
            <span className="text-gray-900 font-bold text-sm tracking-tight truncate">Vendor Portal</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-700 hover:text-[#fe6603] hover:bg-orange-50 active:bg-orange-100 transition-colors flex-shrink-0"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6 text-[#fe6603]" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE SIDEBAR DRAWER OVERLAY & MENU
      ───────────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`md:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out pt-safe pb-safe ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="ULMGH369" className="w-7 h-7 object-contain mix-blend-multiply" />
            <div>
              <p className="font-extrabold text-sm text-gray-900 leading-tight">
                <span className="text-[#fe6603]">ULMGH369</span> Vendor Portal
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Store Management</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vendor Profile Card */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#fe6603] to-[#e55c02] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : "V"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{vendor.store_name || vendor.name}</p>
              <p className="text-gray-500 text-xs truncate">{vendor.email}</p>
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#fe6603] bg-orange-100/80 px-2 py-0.5 rounded-md">
                {vendor.plan_name || "Active Vendor"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links Scroll Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 hide-scrollbar">
          {/* Secondary Features Section */}
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Store Operations
            </p>
            <div className="space-y-1">
              {MOBILE_SECONDARY_NAV.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                      active
                        ? "bg-[#fe6603] text-white shadow-sm shadow-[#fe6603]/30"
                        : "text-gray-700 hover:bg-orange-50 hover:text-[#fe6603] active:bg-orange-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-500"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${active ? "text-white/80" : "text-gray-400"}`} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Access to Main Sections */}
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Main Sections
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MOBILE_BOTTOM_NAV.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] border ${
                      active
                        ? "bg-orange-50 border-[#fe6603] text-[#fe6603]"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer (Logout) */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 active:bg-red-600 transition-all w-full border border-red-200 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout from Vendor Portal</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          3. DESKTOP SIDEBAR (Preserved and Untouched for >= md)
      ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-72 bg-gradient-to-b from-white to-[#FDFBF7] border-r border-[#fe6603]/10 flex-col fixed h-full z-40 transition-transform shadow-[4px_0_24px_rgba(254,102,3,0.03)]">
        <div className="p-6 border-b border-[#fe6603]/10 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#fe6603]/10 flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="ULMGH369" className="w-8 h-8 object-contain mix-blend-multiply" />
            </div>
            <div>
              <p className="font-extrabold text-xl tracking-tight leading-tight">
                <span className="text-[#fe6603]">ULMGH369</span><br />
                <span className="text-[#036e26]">Shoppers</span>
              </p>
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
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : "V"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-bold text-gray-900 text-sm truncate">{vendor.name}</p>
              <p className="text-gray-500 text-xs font-sans truncate">{vendor.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {DESKTOP_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href, item.href === "/vendor");
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-[#fe6603] to-[#ff7b23] text-white shadow-md shadow-[#fe6603]/20 translate-x-1"
                    : "text-gray-600 hover:text-[#fe6603] hover:bg-orange-50 hover:translate-x-1"
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#fe6603]/10 bg-white">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-sans font-bold text-red-500 hover:text-white hover:bg-red-500 transition-all w-full border border-red-100 hover:border-transparent hover:shadow-md hover:shadow-red-500/20"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT AREA (With Safe Area & Bottom Nav Clearance)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-72 p-3.5 sm:p-6 lg:p-8 pt-20 md:pt-8 pb-28 md:pb-8 min-w-0 transition-all">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. MOBILE FIXED BOTTOM NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Vendor bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe"
      >
        <div className="grid grid-cols-4 items-center h-16 max-w-lg mx-auto px-1">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all duration-200 ${
                  active ? "text-[#fe6603]" : "text-gray-500 hover:text-gray-800"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <div
                  className={`relative flex items-center justify-center px-3 py-1.5 rounded-xl transition-all ${
                    active ? "bg-[#fe6603]/10 scale-105" : ""
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fe6603]" />
                  )}
                </div>
                <span className={`text-[10.5px] mt-0.5 leading-none transition-all ${active ? "font-bold text-[#fe6603]" : "font-medium text-gray-500"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
