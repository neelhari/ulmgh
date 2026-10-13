import React from 'react';
import { Header } from '../components/Header';
import { 
  Calendar, AlertCircle, Ban, ArrowRightLeft, Truck, 
  CreditCard, XCircle, ShieldCheck, MapPin, CheckCircle, 
  Activity, Info
} from 'lucide-react';

export function ReturnsPolicyPage() {
  const policies = [
    {
      id: 1,
      title: "Return Window",
      icon: <Calendar className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">ULMGH-369 offers a 7-day return policy for most eligible products, calculated from the date of delivery.</p>
          <p className="mb-2">Return eligibility, applicable conditions, exclusions, and the permitted return period may vary by product or category. The applicable return and exchange conditions will be clearly displayed on the respective product page before the customer places an order.</p>
          <p>Customers are advised to review the product-specific return and exchange conditions before completing their purchase.</p>
        </>
      )
    },
    {
      id: 2,
      title: "Damaged / Defective / Wrong / Incomplete / Missing Products",
      icon: <AlertCircle className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">If a customer receives a damaged, defective, incorrect, incomplete, or missing product/item, the issue should be reported through the ULMGH-369 platform to the respective vendor/seller within 48 hours of delivery.</p>
          <p className="mb-2">Customers may be required to provide photographs, videos, an unboxing video, or other relevant information to support the return, replacement, exchange, or refund request.</p>
          <p className="mb-2">The respective vendor/seller is primarily responsible for verifying and resolving product-related issues, including applicable replacement, exchange, refund, or other appropriate resolution.</p>
          <p>ULMGH-369 will provide customer-support coordination and facilitate communication between the customer and the respective vendor/seller, where required.</p>
        </>
      )
    },
    {
      id: 3,
      title: "Non-Returnable Products",
      icon: <Ban className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">Return eligibility may vary depending on the product and category. Examples of products that may be non-returnable include:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Perishable goods</li>
            <li>Certain personal-care and hygiene products</li>
            <li>Hazardous materials</li>
            <li>Certain electronics after activation, installation, or use</li>
            <li>Customized or personalized products</li>
            <li>Products specifically marked as non-returnable on the respective product page</li>
          </ul>
          <p className="mb-2">The above examples are subject to applicable laws and product-specific conditions.</p>
          <p>Customers should carefully review the return eligibility, applicable conditions, exclusions, and return period displayed on the respective product page before placing an order.</p>
        </>
      )
    },
    {
      id: 4,
      title: "Exchange Facility",
      icon: <ArrowRightLeft className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">For eligible products, customers may request an exchange for reasons such as:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Wrong size</li>
            <li>Wrong colour</li>
            <li>Wrong product received</li>
            <li>Damaged or defective product</li>
          </ul>
          <p className="mb-2">Exchange requests are subject to product availability, applicable return and exchange conditions, verification requirements, and the product-specific policy displayed on the respective product page.</p>
          <p>If the requested replacement or exchange product is unavailable, an alternative resolution, including refund where applicable, may be provided in accordance with the applicable policy.</p>
        </>
      )
    },
    {
      id: 5,
      title: "Return Pickup & Shipping Charges",
      icon: <Truck className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">For verified damaged, defective, wrong, incomplete, or missing products, return pickup will generally be provided free of charge, subject to verification and applicable conditions.</p>
          <p className="mb-2">For eligible customer-initiated returns, such as a change of mind or certain size-related returns, an applicable return shipping or handling fee may be charged.</p>
          <p>Any applicable return shipping or handling fee will be clearly communicated to the customer before the return request is confirmed.</p>
        </>
      )
    },
    {
      id: 6,
      title: "Refund Processing",
      icon: <CreditCard className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">For approved returns or cancellations, eligible refunds will generally be processed to the original payment method used for the order, subject to the applicable payment method and refund conditions.</p>
          <p className="mb-2">Refund processing generally takes 5–7 business days after approval and completion of the applicable return verification process, subject to the processing timelines of the applicable payment gateway, bank, or financial service provider. Customers will be notified once the refund has been initiated.</p>
          <p>The time taken for the refund amount to reflect in the customer's account may vary depending on the payment gateway, bank, card issuer, or other applicable financial service provider.</p>
        </>
      )
    },
    {
      id: 7,
      title: "Order Cancellation",
      icon: <XCircle className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">Customers may request cancellation of an order before it is dispatched, subject to the order status, product-specific conditions, and applicable cancellation rules.</p>
          <p className="mb-2">Once an order has been dispatched, cancellation may not be available. In such cases, the customer may follow the applicable Returns & Exchanges Policy after delivery, subject to the eligibility conditions of the product.</p>
          <p>If a cancellation is successfully approved before dispatch, any eligible refund will be processed in accordance with the applicable refund terms and payment method.</p>
        </>
      )
    },
    {
      id: 8,
      title: "Manufacturer Warranty",
      icon: <ShieldCheck className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">For products covered by a manufacturer warranty, the applicable manufacturer's warranty terms, conditions, duration, exclusions, and service requirements shall apply.</p>
          <p className="mb-2">Where required, ULMGH-369 may provide reasonable customer-support assistance and relevant contact or communication options to help customers approach the respective seller or manufacturer for warranty-related service or claims.</p>
          <p>Unless otherwise expressly stated, ULMGH-369 does not provide or independently extend the manufacturer's warranty and is not responsible for warranty obligations that are the responsibility of the respective manufacturer or seller.</p>
        </>
      )
    },
    {
      id: 9,
      title: "Customer Return / Exchange Journey",
      icon: <MapPin className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2 font-semibold">Initiating a return or exchange is simple:</p>
          <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-[#022A21] font-medium text-center shadow-sm mb-4">
            My Account → My Orders → Select Order → Request Return / Exchange → Select Reason → Upload Photos/Video if Required → Submit Request → Verification & Approval → Return Pickup / Resolution
          </div>
          <p className="mb-2">Customers can view the status of their return or exchange request directly from the Order Details page.</p>
          <p className="mb-2">The status may include applicable stages such as:</p>
          <p className="font-medium text-sm text-gray-700 bg-gray-50 p-3 rounded mb-2 text-center">
            Request Submitted → Under Review → Approved / Rejected → Pickup Scheduled → Product Received → Verification → Replacement / Exchange / Refund Initiated → Completed
          </p>
          <p>All return or exchange requests are subject to the applicable eligibility conditions, product-specific return/exchange rules, and verification requirements stated in this Policy.</p>
        </>
      )
    },
    {
      id: 10,
      title: "Vendor / Seller Responsibility",
      icon: <CheckCircle className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">Since ULMGH-369 operates as a multi-vendor marketplace, return, exchange, replacement, refund, and warranty conditions may vary depending on the product category, applicable policy, and seller-specific terms.</p>
          <p className="mb-2">Sellers are responsible for providing accurate, complete, and up-to-date information regarding product-specific return eligibility, applicable return or exchange periods, warranty terms, exclusions, and other relevant conditions, subject to ULMGH-369 policies and applicable laws.</p>
          <p className="mb-2">Sellers are responsible for fulfilling eligible orders correctly and for addressing product-related issues, including defective, damaged, incorrect, incomplete, or misrepresented products, in accordance with applicable ULMGH-369 policies and seller obligations.</p>
          <p className="mb-2">Sellers shall cooperate with ULMGH-369 and customers in the timely verification and resolution of eligible return, exchange, replacement, refund, and product-related requests.</p>
          <p>ULMGH-369 may facilitate communication and coordinate customer-support processes between customers and sellers, but the respective seller remains responsible for its applicable product-related obligations.</p>
        </>
      )
    },
    {
      id: 11,
      title: "Administration & Vendor Monitoring",
      icon: <Activity className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">All return and exchange requests may be reviewed, monitored, and tracked by the ULMGH-369 Administration Team and relevant Vendor Teams to support timely processing, proper verification, transparency, and appropriate resolution.</p>
          <p className="mb-2">The Administration Team may:</p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li>Monitor the status of return and exchange requests</li>
            <li>Coordinate with customers and sellers where required</li>
            <li>Facilitate communication between the parties</li>
            <li>Monitor applicable verification and resolution processes</li>
            <li>Assist in resolving customer-support issues in accordance with applicable ULMGH-369 policies</li>
          </ul>
          <p>Customers can track the status of their return or exchange requests through their Order Details page.</p>
        </>
      )
    },
    {
      id: 12,
      title: "Customer Support & Resolution Coordination",
      icon: <Info className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">ULMGH-369 will provide a customer-support mechanism through the Website and Applications to enable customers to raise and track return, exchange, replacement, refund, and related product issues.</p>
          <p className="mb-2">Where a matter requires seller verification or action, ULMGH-369 may coordinate communication between the customer and the respective vendor/seller.</p>
          <p>The applicable resolution may include return, exchange, replacement, refund, repair, or another appropriate resolution, depending on the nature of the issue, product-specific conditions, verification results, seller obligations, and applicable policies.</p>
        </>
      )
    },
    {
      id: 13,
      title: "Final Implementation Scope",
      icon: <Info className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">This Returns & Exchanges Policy shall apply consistently across the ULMGH-369 Website, Android Application, and iOS Application.</p>
          <p className="mb-2">The applicable return, exchange, replacement, cancellation, refund, and warranty-related information shall be clearly accessible to customers across all three platforms.</p>
          <p className="mb-2">The return and exchange functionality shall include, where applicable:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>Return / exchange request submission</li>
              <li>Product and order eligibility verification</li>
              <li>Reason selection</li>
              <li>Photo / video upload</li>
              <li>Vendor notification</li>
              <li>Customer notifications</li>
              <li>Admin monitoring</li>
            </ul>
            <ul className="list-disc pl-5 space-y-1">
              <li>Return pickup coordination</li>
              <li>Request status tracking</li>
              <li>Verification workflow</li>
              <li>Exchange / replacement workflow</li>
              <li>Refund initiation and status tracking</li>
              <li>Customer communication</li>
              <li>Applicable resolution workflows</li>
            </ul>
          </div>
          <p>These functions shall be implemented consistently across the Website, Android Application, and iOS Application, subject to the respective product, category, seller, and applicable policy conditions stated in this Policy.</p>
        </>
      )
    },
    {
      id: 14,
      title: "Policy Updates",
      icon: <AlertCircle className="w-6 h-6 text-brand-orange" />,
      content: (
        <>
          <p className="mb-2">ULMGH-369 reserves the right to update or modify this Returns & Exchanges Policy from time to time to reflect changes in applicable laws, regulations, business processes, platform functionality, product categories, or seller requirements.</p>
          <p className="mb-2">Any updated version will be published on the ULMGH-369 Website and applicable Applications with the effective date or revised date.</p>
          <p>Customers are encouraged to review the latest version of this Policy before placing an order or submitting a return, exchange, replacement, cancellation, or refund request.</p>
        </>
      )
    }
  ];

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-24 md:pb-16 font-sans">
      <Header title="Returns & Exchanges Policy" />
      
      {/* Top Banner */}
      <div className="bg-[#022A21] text-white py-12 md:py-16 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">Returns & Exchanges Policy</h1>
          <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
            A clear, transparent, simple, and user-friendly process for returns, exchanges, replacements, cancellations, and refunds on the ULMGH-369 multi-vendor marketplace.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-12 space-y-10">
          
          <div className="space-y-10">
            {policies.map((policy) => (
              <section key={policy.id} className="relative pl-0 md:pl-12">
                <div className="hidden md:flex absolute left-0 top-0 w-10 h-10 bg-gray-50 rounded-full border border-gray-100 items-center justify-center">
                  {policy.icon}
                </div>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="md:hidden">
                    {policy.icon}
                  </div>
                  <h2 className="text-xl font-bold text-[#022A21] font-serif">
                    {policy.id}. {policy.title}
                  </h2>
                </div>
                <div className="text-gray-600 text-sm leading-relaxed">
                  {policy.content}
                </div>
              </section>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
