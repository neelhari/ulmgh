import React from 'react';
import { Header } from '../components/Header';
import { 
  Truck, Clock, MapPin, AlertCircle, Package, 
  Boxes, CreditCard, Banknote, Navigation, Info, 
  Headphones, Globe, ShieldAlert, ArrowRightLeft
} from 'lucide-react';

export function ShippingPolicyPage() {
  const policies = [
    {
      id: 1,
      title: "Order Processing & Dispatch",
      icon: <Clock className="w-6 h-6 text-brand-orange" />,
      content: "Vendors should process and dispatch customer orders within the applicable processing period of 1–2 business days, wherever applicable. Customers should receive appropriate order confirmation, order status updates, and dispatch notifications through Email, SMS, and/or App Push Notifications, as applicable. The system should clearly display the order status, including Order Confirmed, Processing, Dispatched, and Delivered, wherever technically applicable."
    },
    {
      id: 2,
      title: "Multi-Vendor Shipments",
      icon: <Boxes className="w-6 h-6 text-brand-orange" />,
      content: "Products purchased from different vendors in a single checkout may be dispatched from different vendor locations and may arrive separately. Where applicable, the system should create and display separate shipment and tracking information for each vendor shipment, including the relevant order status and delivery updates. Customers should be clearly informed that items from different vendors may have different dispatch dates, delivery timelines, and tracking details."
    },
    {
      id: 3,
      title: "Shipping Charges & Delivery Estimates",
      icon: <Truck className="w-6 h-6 text-brand-orange" />,
      content: "Shipping charges and estimated delivery dates should be calculated and clearly displayed at checkout based on relevant factors, including product details, vendor location, customer PIN code, package weight and dimensions, selected delivery method, and logistics partner availability, wherever applicable. For multi-vendor orders, shipping charges and estimated delivery dates may vary for different vendor shipments. The applicable shipping charges, delivery estimates, and any other applicable fees or taxes should be clearly displayed to the customer before the order is placed."
    },
    {
      id: 4,
      title: "Cash on Delivery (COD)",
      icon: <Banknote className="w-6 h-6 text-brand-orange" />,
      content: "Cash on Delivery (COD) should be available only for eligible products, eligible orders, and serviceable PIN codes, subject to applicable vendor and logistics partner conditions. Any applicable COD or convenience fee should be clearly displayed to the customer before order confirmation. The system should clearly indicate whether COD is available or unavailable for each order at checkout."
    },
    {
      id: 5,
      title: "Order Tracking",
      icon: <Navigation className="w-6 h-6 text-brand-orange" />,
      content: "Customers should be able to easily track their orders through the My Orders section of the ULMGH-369 website and mobile applications. Where supported by the logistics partner, the system should display the shipment status, tracking number, courier/logistics partner details, and a direct tracking link for each shipment. For multi-vendor orders, separate tracking information should be displayed for each applicable vendor shipment."
    },
    {
      id: 6,
      title: "Address Accuracy & Undeliverable Orders",
      icon: <MapPin className="w-6 h-6 text-brand-orange" />,
      content: "Customers are responsible for providing accurate and complete delivery details, including the recipient's name, mobile number, address, city, state, and PIN code. Where an order becomes undeliverable due to an incorrect or incomplete address, repeated failed delivery attempts, or customer refusal to accept the shipment, the order may be returned to the respective vendor/seller or handled in accordance with the applicable policy. Any applicable re-shipping, return, or other related charges may be collected from the customer, where applicable and as communicated in the relevant policy."
    },
    {
      id: 7,
      title: "Damaged, Missing, or Incorrect Products",
      icon: <AlertCircle className="w-6 h-6 text-brand-orange" />,
      content: (
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>If a customer receives a damaged, missing, incorrect, or incomplete product, the customer should report the issue to ULMGH-369 Customer Support within 48 hours of delivery.</li>
          <li>ULMGH-369 Customer Support should record the complaint and coordinate with the concerned vendor/seller and, where applicable, the logistics partner for verification and appropriate resolution.</li>
          <li>Customers should be encouraged to provide clear photographs and, where possible, an unboxing video as supporting evidence.</li>
          <li>Any applicable replacement, refund, or claim should be processed in accordance with the Return, Refund & Cancellation Policy and the applicable product/vendor terms.</li>
          <li>For damaged, missing, incorrect, or incomplete products, the system should provide a clear complaint/support option linked to the relevant order wherever technically applicable.</li>
        </ul>
      )
    },
    {
      id: 8,
      title: "Delivery Delays",
      icon: <Clock className="w-6 h-6 text-brand-orange" />,
      content: "The system and delivery policy should accommodate reasonable delivery delays caused by severe weather conditions, festivals, public holidays, transportation disruptions, unusually high order volumes, or other circumstances beyond the reasonable control of ULMGH-369, its vendors, or logistics partners. In such circumstances, the estimated delivery time may be extended. Customers should be informed of significant delivery delays and updated delivery estimates through the website, mobile application, Email, SMS, and/or App Push Notifications, wherever reasonably possible."
    },
    {
      id: 9,
      title: "International Shipping",
      icon: <Globe className="w-6 h-6 text-brand-orange" />,
      content: "At present, ULMGH-369 supports shipping within India only. International shipping options may be introduced in the future, subject to applicable laws and regulations, customs requirements, import/export requirements, logistics arrangements, destination-country requirements, and ULMGH-369 business policies. If international shipping is introduced in the future, the applicable shipping charges, delivery timelines, customs duties, taxes, and other relevant terms will be communicated to customers before order confirmation."
    },
    {
      id: 10,
      title: "Return/Replacement Shipping Charges",
      icon: <ArrowRightLeft className="w-6 h-6 text-brand-orange" />,
      content: "Shipping charges relating to returns, replacements, or re-delivery should be handled in accordance with the applicable Return, Refund & Cancellation Policy and based on the verified reason and circumstances of the return or replacement. Where applicable, return, replacement, or re-delivery charges may be borne by the vendor/seller, ULMGH-369, logistics partner, or customer, depending on the nature and verified cause of the issue and the applicable policy."
    },
    {
      id: 11,
      title: "Customer Support Integration",
      icon: <Headphones className="w-6 h-6 text-brand-orange" />,
      content: "The ULMGH-369 website and mobile applications should provide clear, easy, and direct access to ULMGH-369 Customer Support for shipping-related complaints, delivery delays, order-tracking assistance, and other delivery-related queries. The Customer Support option should be easily accessible from the My Orders section and relevant order/shipment screens, wherever technically applicable, so that customers can conveniently raise and track shipping-related complaints."
    },
    {
      id: 12,
      title: "Important Multi-Vendor Responsibility Disclaimer",
      icon: <Info className="w-6 h-6 text-brand-orange" />,
      content: "Please ensure that the system and policy clearly state that ULMGH-369 operates as an online marketplace/platform and a customer-support coordination point connecting customers, vendors/sellers, and logistics partners. The respective vendor/seller remains responsible for applicable product fulfilment, product quality, accurate product information, proper packaging, stock availability, and other seller-side obligations applicable to the order. Logistics partners are responsible for transportation and physical delivery services, as applicable, including the handling of shipments after pickup from the respective vendor/seller. ULMGH-369 will provide platform-level coordination and customer support assistance for order-related issues and will facilitate communication among the customer, vendor/seller, and logistics partner, as applicable."
    }
  ];

  return (
    <div className="bg-[#f9f9f9] min-h-screen pb-24 md:pb-16 font-sans">
      <Header title="Shipping & Delivery Policy" />
      
      {/* Top Banner */}
      <div className="bg-[#022A21] text-white py-12 md:py-16 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-serif">Shipping & Delivery Policy</h1>
          <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
            Everything you need to know about how ULMGH-369 processes, ships, and delivers your orders across our multi-vendor platform, including shipping charges, delivery timelines, order tracking, delivery delays, and customer support.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-12 space-y-10">
          
          <div className="bg-orange-50 border border-brand-orange/20 p-4 md:p-6 rounded-xl flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-brand-orange shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-[#022A21] mb-2">Multi-Vendor Marketplace Notice</h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-2">
                Since ULMGH-369 operates as a multi-vendor marketplace, this Shipping & Delivery Policy clearly outlines the respective responsibilities of customers, vendors/sellers, ULMGH-369, and logistics partners, as applicable.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Customers are responsible for providing accurate order and delivery information, vendors/sellers are responsible for applicable product fulfilment and seller-side obligations, logistics partners are responsible for transportation and physical delivery services, and ULMGH-369 provides the marketplace platform, coordination, and customer support assistance.
              </p>
            </div>
          </div>

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
