const pool = require('./db');

const initialFaqs = [
  {
    question_en: "How do I place an order?",
    answer_en: "Placing an order is simple. Browse our product categories, select your desired products, add them to the cart, and proceed to checkout. Enter your delivery address and complete the payment to place your order.",
    sort_order: 1
  },
  {
    question_en: "Do you offer Cash on Delivery (COD)?",
    answer_en: "Currently, ULMGH-369 accepts prepaid orders only. Customers can securely pay using supported payment methods such as UPI, Credit/Debit Cards, and Net Banking.",
    sort_order: 2
  },
  {
    question_en: "How can I track my order?",
    answer_en: "Once your order is shipped, you will receive the available tracking details through SMS/Email or other registered communication channels. You can also log in to your account and check the 'My Orders' section for order status and tracking updates.",
    sort_order: 3
  },
  {
    question_en: "Can I cancel my order?",
    answer_en: "Orders may be cancelled before they are dispatched, subject to the applicable cancellation terms. Once an order has been shipped, cancellation may not be possible. Customers who wish to cancel an order should contact Customer Support as soon as possible.",
    sort_order: 4
  },
  {
    question_en: "Are your products authentic?",
    answer_en: "ULMGH-369 works with verified vendors and encourages vendors to provide genuine products with accurate product descriptions, specifications, images, and other relevant information. Customers can review the available product and vendor details before placing an order.",
    sort_order: 5
  },
  {
    question_en: "How can I contact ULMGH-369 Customer Support?",
    answer_en: "Customers should be able to contact ULMGH-369 Customer Support through the support/contact options provided on the website and mobile applications.",
    sort_order: 6
  },
  {
    question_en: "Can I return or exchange a product?",
    answer_en: "Returns and exchanges are subject to the ULMGH-369 Returns & Exchanges Policy and the applicable eligibility conditions for each product.",
    sort_order: 7
  },
  {
    question_en: "How long will delivery take?",
    answer_en: "Delivery time may vary depending on the product, vendor location, delivery destination, logistics partner, and other applicable factors. Estimated delivery information should be displayed or communicated wherever available.",
    sort_order: 8
  },
  {
    question_en: "Is my payment secure?",
    answer_en: "Customers should complete payments only through the official ULMGH-369 website or mobile application using the supported payment gateway and payment methods.",
    sort_order: 9
  }
];

async function seedFaqs() {
  try {
    for (const faq of initialFaqs) {
      await pool.query(
        `INSERT INTO faqs (question_en, answer_en, sort_order) VALUES ($1, $2, $3)`,
        [faq.question_en, faq.answer_en, faq.sort_order]
      );
    }
    console.log('✅ Seeded faqs successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed faqs:', error);
    process.exit(1);
  }
}

seedFaqs();
