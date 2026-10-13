import React from 'react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ShieldCheck, Download } from 'lucide-react';

export function VendorGuidelinesPage() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen flex flex-col font-sans text-gray-800">
      <Header variant="back" title="Vendor Guidelines" />

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-6 py-12 md:py-16">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange/10 mb-6">
            <ShieldCheck className="w-8 h-8 text-brand-orange" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#fe6603] text-xs font-bold tracking-wide uppercase mb-3">
            Revised on 21.09.2026
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#022A21] mb-4 font-serif">
            Vendor Registration & Operational Guidelines
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            The purpose of these guidelines is to ensure that every vendor understands and complies with their responsibilities regarding stock accuracy, product quality, accurate product information, timely order processing and dispatch, correct order fulfilment, appropriate packaging, customer service, returns and exchanges, and responsible business practices from the time of registration and throughout their association with ULMGH-369.
          </p>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            These guidelines are intended to maintain customer trust, product quality, operational efficiency, transparency, and a consistent shopping experience across the ULMGH-369 Website, Android Application, and iOS Application.
          </p>
        </div>

        <div className="space-y-8">
          
          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">1</span>
              Stock Accuracy & Availability
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must fulfil orders using the exact stock quantity, product specifications, and availability status displayed on the platform. If a product becomes unavailable or the displayed stock is exhausted, the vendor must immediately update the product status as “Out of Stock” on the ULMGH-369 platform.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">2</span>
              Quality Assurance
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must maintain the quality, condition, and specifications represented on the platform and must inspect products before dispatch to ensure that they are free from defects, damage, or any significant quality issues. Vendors must not dispatch products that are defective, damaged, expired, or materially different from the product information displayed on the platform.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">3</span>
              Timely Order Processing & Dispatch
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must verify and process every order promptly and prepare the order for dispatch within the agreed SLA timeframe. The order must be properly packed and handed over to the designated delivery or logistics partner within the applicable SLA timeframe.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">4</span>
              Correct Product Shipment
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must ensure that the product, size, colour, quantity, variant, model, and specifications supplied exactly match the customer's order and the product details displayed on the ULMGH-369 platform. Vendors must carefully verify the order details before dispatch to prevent wrong, incomplete, or mismatched shipments.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">5</span>
              Secure & Professional Packaging
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must pack products securely, neatly, and appropriately using suitable packaging and protective materials to minimize the risk of damage, leakage, breakage, contamination, or deterioration during handling and transportation. Packaging must be appropriate to the nature, size, weight, and fragility of the product.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">6</span>
              Accurate Product Information
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must ensure that the product name, description, images, dimensions, weight, colour, material, specifications, variants, and other relevant information displayed on the ULMGH-369 platform accurately represent the actual product offered for sale. All product information must be clear, complete, current, and not misleading. Any changes to the product or its specifications must be updated promptly on the platform.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">7</span>
              Genuine & Legally Permitted Products
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must list and sell only genuine, authentic, and legally permitted products that comply with applicable laws, regulations, standards, and platform requirements. Vendors must not list or sell counterfeit, duplicate, unauthorized, stolen, prohibited, or otherwise unlawful products on the ULMGH-369 platform. Vendors are responsible for ensuring the authenticity and lawful sale of the products they offer.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">8</span>
              Returns & Replacements
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must cooperate fully with the applicable ULMGH-369 Return, Replacement, Exchange, and Refund Policies and must promptly respond to return or replacement requests, particularly in cases involving damaged, defective, incorrect, incomplete, or materially different products. Vendors must provide the necessary information and assistance to facilitate timely resolution of such cases.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">9</span>
              Communication & Responsiveness
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must respond promptly, professionally, and courteously to customer queries, ULMGH-369 customer support requests, order-related communications, and administrative communications. Vendors must provide accurate and necessary information and cooperate with ULMGH-369 support and administration teams to ensure timely resolution of customer and operational issues.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">10</span>
              Customer Data Privacy
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must protect all customer information received through ULMGH-369 and use it only for legitimate order fulfilment, delivery coordination, returns, replacements, and related customer service purposes. Vendors must not misuse, copy, retain unnecessarily, disclose, sell, share, or use customer information for any unauthorized personal or commercial purpose. Vendors must maintain the confidentiality and security of customer information and comply with applicable data protection and privacy requirements.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">11</span>
              Fair & Transparent Business Practices
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors must provide truthful, accurate, and complete product information and maintain transparent and fair pricing on the ULMGH-369 platform. Vendors must not engage in misleading, deceptive, fraudulent, or unfair business practices, including false product claims, misleading offers, hidden charges, or inaccurate pricing or discounts.
            </p>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#022A21] mb-3 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center text-sm shrink-0">12</span>
              Legal & Regulatory Compliance
            </h3>
            <p className="text-gray-600 leading-relaxed ml-11">
              Vendors are responsible for complying with all applicable laws, rules, regulations, tax requirements, licences, registrations, permits, certifications, and other regulatory requirements relating to their products and business activities. Vendors must obtain and maintain all legally required approvals and provide valid documentation when requested by ULMGH-369 or the relevant authorities.
            </p>
          </section>

        </div>

        <div className="mt-16 text-center border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">ULMGH-369</h2>
          <p className="text-lg text-gray-600 font-medium italic mb-2">
            “Your Product. Your Quality. Your Responsibility. Our Shared Trust.”
          </p>
          <div className="text-brand-orange font-bold uppercase tracking-widest mb-6">Local to Global</div>
          
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors shadow-sm font-medium mx-auto">
            <Download className="w-4 h-4" /> Download as PDF
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
