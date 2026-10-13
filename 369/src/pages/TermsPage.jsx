import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Scale } from 'lucide-react';
import { motion } from 'framer-motion';

export function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-20 md:pb-0 font-sans">
      <Header variant="back" title="Terms of Service" />

      {/* Hero Section */}
      <div className="bg-[#022A21] pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-orange/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-brand-orange/20 flex items-center justify-center mx-auto mb-6 border border-brand-orange/30">
            <Scale className="w-8 h-8 text-brand-orange" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Terms & Conditions
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-gray-300 text-lg">
            Please read these terms carefully before using our services.
          </motion.p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-12 relative z-20 pb-24">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-gray-700 leading-relaxed space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">1. Acceptance of Terms</h2>
            <p>By accessing and using <strong>ULMGH369</strong>, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">2. Provision of Services</h2>
            <p className="mb-3">ULMGH369 is constantly innovating in order to provide the best possible experience for its users. You acknowledge and agree that the form and nature of the services which we provide may change from time to time without prior notice to you.</p>
            <p>As part of this continuing innovation, you acknowledge and agree that we may stop (permanently or temporarily) providing the services (or any features within the services) to you or to users generally at our sole discretion, without prior notice to you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">3. Use of the Services</h2>
            <p className="mb-3">In order to access certain services, you may be required to provide information about yourself (such as identification or contact details) as part of the registration process for the service, or as part of your continued use of the services.</p>
            <p>You agree that any registration information you give to ULMGH369 will always be accurate, correct and up to date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">4. Limitation of Liability</h2>
            <p>You expressly understand and agree that ULMGH369 shall not be liable to you for any direct, indirect, incidental, special consequential or exemplary damages which may be incurred by you, however caused and under any theory of liability. This shall include, but not be limited to, any loss of profit (whether incurred directly or indirectly), any loss of goodwill or business reputation, any loss of data suffered, cost of procurement of substitute goods or services, or other intangible loss.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">5. Changes to the Terms</h2>
            <p>ULMGH369 may make changes to the Universal Terms or Additional Terms from time to time. When these changes are made, we will make a new copy of the Universal Terms available and any new Additional Terms will be made available to you from within, or through, the affected services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#022A21] mb-4 font-serif">6. Governing Law & Jurisdiction</h2>
            <p className="mb-3">These Terms and Conditions shall be governed by and construed in accordance with the laws of India.</p>
            <p className="mb-3">Subject to applicable laws and statutory rights available to consumers, any dispute arising out of or relating to the operation of the ULMGH-369 platform, its services, vendor relationships, business operations, or these Terms shall be subject to the jurisdiction of the competent courts at Kurnool, Andhra Pradesh, India, to the extent legally permissible.</p>
            <p>Nothing in this clause shall restrict or exclude any statutory right of a consumer to approach a competent Consumer Commission, court, authority, or other forum having jurisdiction under applicable Indian law.</p>
          </section>
          
        </div>
      </div>
    </div>
  );
}
