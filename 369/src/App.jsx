import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { useStoreData } from './store/useStoreData';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { HomePage } from './pages/HomePage';
import { CategoryListingPage } from './pages/CategoryListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { MyAddressesPage } from './pages/MyAddressesPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { ShippingPolicyPage } from './pages/ShippingPolicyPage';
import { ReturnsPolicyPage } from './pages/ReturnsPolicyPage';
import { FAQPage } from './pages/FAQPage';
import { CollectionPage } from './pages/CollectionPage';
import { SearchPage } from './pages/SearchPage';
import { OffersPage } from './pages/OffersPage';
import { CouponsPage } from './pages/CouponsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { ReferPage } from './pages/ReferPage';
import { MeditationPage } from './pages/MeditationPage';

import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminVendorRequestsPage } from './pages/admin/AdminVendorRequestsPage';
import { AdminVendorProfilesPage } from './pages/admin/AdminVendorProfilesPage';
import { AdminVendorProductsPage } from './pages/admin/AdminVendorProductsPage';
import { AdminVendorWalletsPage } from './pages/admin/AdminVendorWalletsPage';
import { AdminVendorOrdersPage } from './pages/admin/AdminVendorOrdersPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminOffersPage } from './pages/admin/AdminOffersPage';
import { AdminAdvertisementsPage } from './pages/admin/AdminAdvertisementsPage';
import { AdminProductRequestsPage } from './pages/admin/AdminProductRequestsPage';
import { AdminFAQsPage } from './pages/admin/AdminFAQsPage';

import { SupportLayout } from './components/support/SupportLayout';
import { SupportLoginPage } from './pages/support/SupportLoginPage';
import { SupportDashboardPage } from './pages/support/SupportDashboardPage';
import { SupportOrdersPage } from './pages/support/SupportOrdersPage';
import { SupportProductsPage } from './pages/support/SupportProductsPage';
import { SupportCategoriesPage } from './pages/support/SupportCategoriesPage';

import { VendorLayout } from './components/vendor/VendorLayout';
import { VendorLoginPage } from './pages/vendor/VendorLoginPage';
import { VendorSignupPage } from './pages/vendor/VendorSignupPage';
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { VendorGuidelinesPage } from './pages/vendor/VendorGuidelinesPage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';
import { VendorCategoriesPage } from './pages/vendor/VendorCategoriesPage';
import { VendorWalletPage } from './pages/vendor/VendorWalletPage';
import { VendorProfilePage } from './pages/vendor/VendorProfilePage';
import { VendorSupportPage } from './pages/vendor/VendorSupportPage';
import { VendorOffersPage } from './pages/vendor/VendorOffersPage';
import { VendorProductFormPage } from './pages/vendor/VendorProductFormPage';

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedAppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/shipping-policy" element={<PageTransition><ShippingPolicyPage /></PageTransition>} />
        <Route path="/returns-policy" element={<PageTransition><ReturnsPolicyPage /></PageTransition>} />
        <Route path="/faqs" element={<PageTransition><FAQPage /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicyPage /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/offers" element={<PageTransition><OffersPage /></PageTransition>} />
        <Route path="/all-coupons" element={<PageTransition><CouponsPage /></PageTransition>} />
        <Route path="/refer" element={<PageTransition><ReferPage /></PageTransition>} />
        <Route path="/meditation" element={<PageTransition><MeditationPage /></PageTransition>} />
        <Route path="/collection/:type" element={<PageTransition><CollectionPage /></PageTransition>} />
        <Route path="/category/:categoryId" element={<PageTransition><CategoryListingPage /></PageTransition>} />
        <Route path="/product/:id" element={<PageTransition><ProductDetailPage /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><CartPage /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><CheckoutPage /></PageTransition>} />
        <Route path="/order-tracking/:orderId" element={<PageTransition><OrderTrackingPage /></PageTransition>} />
        <Route path="/vendor-login" element={<PageTransition><VendorLoginPage /></PageTransition>} />
        <Route path="/vendor-signup" element={<PageTransition><VendorSignupPage /></PageTransition>} />
        <Route path="/vendor-guidelines" element={<PageTransition><VendorGuidelinesPage /></PageTransition>} />
        <Route path="/vendor/dashboard/*" element={<PageTransition><VendorDashboardPage /></PageTransition>} />
        <Route path="/wishlist" element={<PageTransition><WishlistPage /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="/my-orders" element={<PageTransition><MyOrdersPage /></PageTransition>} />
        <Route path="/my-addresses" element={<PageTransition><MyAddressesPage /></PageTransition>} />
        <Route path="/account-settings" element={<PageTransition><AccountSettingsPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { fetchData } = useStoreData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div style={{ opacity: showSplash ? 0 : 1 }} className="transition-opacity duration-300">
        <BrowserRouter>
          <Routes>
            {/* Auth pages — no layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/vendor-login" element={<VendorLoginPage />} />
            <Route path="/vendor-signup" element={<VendorSignupPage />} />
            <Route path="/support-login" element={<SupportLoginPage />} />

            {/* Admin — using AdminLayout */}
            <Route path="/admin/*" element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboardPage />} />
                  <Route path="/orders" element={<AdminOrdersPage />} />
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="/coupons" element={<AdminCouponsPage />} />
                  <Route path="/reports" element={<AdminReportsPage />} />
                  <Route path="vendor-requests" element={<AdminVendorRequestsPage />} />
                  <Route path="vendor-profiles" element={<AdminVendorProfilesPage />} />
                  <Route path="vendor-products" element={<AdminVendorProductsPage />} />
                  <Route path="vendor-wallets" element={<AdminVendorWalletsPage />} />
                  <Route path="vendor-orders" element={<AdminVendorOrdersPage />} />
                  <Route path="support" element={<AdminSupportPage />} />
                  <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                  <Route path="offers" element={<AdminOffersPage />} />
                  <Route path="advertisements" element={<AdminAdvertisementsPage />} />
                  <Route path="product-requests" element={<AdminProductRequestsPage />} />
                  <Route path="faqs" element={<AdminFAQsPage />} />
                </Routes>
              </AdminLayout>
            } />

            {/* Support — using SupportLayout */}
            <Route path="/support/*" element={
              <SupportLayout>
                <Routes>
                  <Route path="/" element={<SupportDashboardPage />} />
                  <Route path="dashboard" element={<SupportDashboardPage />} />
                  <Route path="orders" element={<SupportOrdersPage />} />
                  <Route path="products" element={<SupportProductsPage />} />
                  <Route path="categories" element={<SupportCategoriesPage />} />
                  {/* Admin-scope support pages */}
                  <Route path="customers" element={<AdminCustomersPage />} />
                  <Route path="banners" element={<AdminBannersPage />} />
                  <Route path="coupons" element={<AdminCouponsPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="vendor-requests" element={<AdminVendorRequestsPage />} />
                  <Route path="vendor-profiles" element={<AdminVendorProfilesPage />} />
                  <Route path="vendor-products" element={<AdminVendorProductsPage />} />
                  <Route path="vendor-wallets" element={<AdminVendorWalletsPage />} />
                  <Route path="vendor-orders" element={<AdminVendorOrdersPage />} />
                  <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                  <Route path="offers" element={<AdminOffersPage />} />
                  <Route path="advertisements" element={<AdminAdvertisementsPage />} />
                  {/* Vendor-scope support pages */}
                  <Route path="wallet" element={<VendorWalletPage />} />
                  <Route path="profile" element={<VendorProfilePage />} />
                </Routes>
              </SupportLayout>
            } />

            {/* Vendor — using VendorLayout */}
            <Route path="/vendor/*" element={
              <VendorLayout>
                <Routes>
                  <Route path="/" element={<VendorDashboardPage />} />
                  <Route path="products" element={<VendorProductsPage />} />
                  <Route path="products/new" element={<VendorProductFormPage />} />
                  <Route path="products/:id/edit" element={<VendorProductFormPage />} />
                  <Route path="orders" element={<VendorOrdersPage />} />
                  <Route path="categories" element={<VendorCategoriesPage />} />
                  <Route path="wallet" element={<VendorWalletPage />} />
                  <Route path="profile" element={<VendorProfilePage />} />
                  <Route path="support" element={<VendorSupportPage />} />
                  <Route path="offers" element={<VendorOffersPage />} />
                </Routes>
              </VendorLayout>
            } />

            {/* App pages — with AppLayout and Page Transitions */}
            <Route path="/*" element={
              <AppLayout>
                <AnimatedAppRoutes />
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}

export default App;
