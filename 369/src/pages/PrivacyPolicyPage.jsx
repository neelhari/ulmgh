import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-20 md:pb-0 font-sans">
      <Header variant="back" title="Privacy Policy" />

      {/* Hero Section */}
      <div className="bg-[#022A21] pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-orange/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-brand-orange/20 flex items-center justify-center mx-auto mb-6 border border-brand-orange/30">
            <ShieldCheck className="w-8 h-8 text-brand-orange" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Privacy Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-300 text-lg">
            How we protect your data at ULMGH369
          </motion.p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-12 relative z-20 pb-24">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-gray-700 leading-relaxed space-y-8">
          <p className="text-lg">
            At <strong>ULMGH369</strong>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">1. Information We Collect</h2>
            <p className="mb-3">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number.</li>
              <li><strong>Financial Data:</strong> Data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">2. Use of Your Information</h2>
            <p className="mb-3">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and manage your account.</li>
              <li>Process your transactions and send you related information, including purchase confirmations and invoices.</li>
              <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">3. Disclosure of Your Information</h2>
            <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
              <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">4. Account and Data Deletion</h2>
            <p className="mb-3">
              We respect your right to control your personal data. You can request the permanent deletion of your account and associated personal data at any time through our apps or website:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <strong>In-App Deletion:</strong> If you are signed in, you can delete your account immediately by visiting <Link to="/account-settings" className="text-brand-orange font-semibold hover:underline">Account Settings</Link> &gt; Danger Zone &gt; Delete Account.
              </li>
              <li>
                <strong>Public Web Request:</strong> You can submit a deletion request without logging in via our dedicated verification portal at <Link to="/delete-account" className="text-brand-orange font-semibold hover:underline">ulmgh-369.com/delete-account</Link> using your registered email address.
              </li>
            </ul>
            <p className="mb-2"><strong>Data Deleted upon request:</strong></p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Profile data (name, email, phone number, and profile picture).</li>
              <li>Saved delivery addresses and contact information.</li>
              <li>Authentication credentials, linked Google account tokens, and active login sessions.</li>
              <li>Push notification device tokens and OTP records.</li>
            </ul>
            <p className="mb-2"><strong>Data Retained for Legal Compliance:</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Order history, financial invoice totals, and payment gateway transaction references are retained in our database strictly as required for commercial accounting, taxation, and legal recordkeeping obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">5. Contact Us</h2>
            <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
            <div className="mt-4 p-6 bg-[#f9f9f9] rounded-2xl border border-gray-100">
              <p className="font-bold text-[#022A21] mb-1">ULMGH-369</p>
              <p className="text-gray-600 mb-1 leading-relaxed">
                D.No: 70/126-G-3-6-1,<br />
                Near Beerappa Swamy Temple, Raja Nagar, Kallur, Kurnool<br />
                Pin -518003<br />
                Andhra Pradesh, India
              </p>
              <p className="text-gray-600 mb-1">Phone: +91 90326 75205</p>
              <p className="text-brand-orange font-medium">Email: ulmgh369@gmail.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
