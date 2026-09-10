import LegalShell from './LegalShell';

const SECTIONS = [
  {
    heading: 'About these terms',
    paragraphs: [
      'These Terms & Conditions govern your use of the {{brand}} website and your orders placed through it. By browsing the site, creating an account or placing an order, you agree to these terms. If you do not agree with them, please do not use the service.',
      'We may update these terms from time to time. The "last updated" date at the top of this page always reflects the current version, and continuing to use the service after a change means you accept the updated terms.',
    ],
  },
  {
    heading: 'Our service model - no subscriptions',
    paragraphs: [
      '{{brand}} operates strictly as an on-demand snack ordering service. We do not offer, and this website does not sell, tiffin services, meal plans, or daily, weekly or monthly subscription packages of any kind.',
      'Every order you place is a single, one-time transaction. Nothing renews automatically, no recurring mandate is created on your payment instrument, and you will never be charged for food you did not actively order. Our "Build Your Own Snack Box" feature is a one-time bundle you assemble yourself for a single delivery - it is not a plan or a commitment of any kind.',
    ],
  },
  {
    heading: 'Eligibility and your account',
    list: [
      'You must be at least 18 years old, or have the consent of a parent or guardian, to place an order.',
      'You are responsible for keeping your account password confidential and for all activity that happens under your account.',
      'The information you give us - especially your delivery address and phone number - must be accurate and current. We are not liable for a failed delivery caused by incorrect details.',
      'We may suspend or close an account that is used for fraudulent activity, repeated non-acceptance of delivered orders, or abuse of our staff or delivery partners.',
    ],
  },
  {
    heading: 'Orders, pricing and availability',
    list: [
      'All prices are listed in Indian Rupees and are inclusive of the taxes shown at checkout. The minimum order value is {{minOrderValue}}.',
      'Prices, ingredients and availability can change without notice. The price applied to your order is the price displayed at the moment you complete checkout.',
      'Our menu depends on fresh ingredients, so an item may sell out for the day. If we cannot fulfil an item after you have paid, we will contact you and refund that item in full.',
      'Once an order reaches the "Packed" stage it cannot be modified, because the food has already been prepared fresh for you.',
      'Bulk orders of 15 portions or more require at least 24 hours notice and separate confirmation from our team.',
    ],
  },
  {
    heading: 'Food information, allergens and nutrition',
    paragraphs: [
      'We publish approximate nutrition information and an ingredient list for every item so you can make an informed choice. These values are estimates calculated from standard ingredient composition data against our recipes, and may vary according to ingredients, preparation method and portion size.',
      'Our kitchen handles common allergens including milk, gluten, nuts, sesame, soy and egg, as well as both vegetarian and non-vegetarian ingredients. While we use separate boards and stations for veg and non-veg preparation, we cannot guarantee an entirely allergen-free environment and cannot rule out cross-contact.',
      'Nothing on this website is medical, nutritional or therapeutic advice, and we make no claims about preventing, treating or curing any condition. If you have a food allergy, an intolerance, or any medical condition, please consult a qualified doctor or a registered dietitian before ordering.',
    ],
  },
  {
    heading: 'Payments',
    list: [
      'We accept UPI, credit and debit cards, netbanking and wallets through our payment partner Razorpay, and Cash on Delivery where it is offered.',
      'Card and banking details are collected and processed entirely by Razorpay. We never see, handle or store them.',
      'If a payment is deducted but your order does not confirm, the amount is normally reversed automatically by your bank within 5 to 7 working days. Contact us with your transaction reference if it does not.',
      'Cash on Delivery orders must be paid in full to the delivery partner at the time of handover.',
    ],
  },
  {
    heading: 'Delivery',
    paragraphs: [
      'We deliver within our published service areas in {{city}} during the delivery slots offered at checkout. Delivery times are estimates and can be affected by weather, traffic and order volume.',
      'Please be reachable on the phone number provided during your chosen slot. If our delivery partner cannot reach you or nobody is available to receive the order, we may leave it at the address given or return it, and the order may not be refundable. Full details are in our Shipping & Delivery Policy.',
    ],
  },
  {
    heading: 'Coupons, rewards and referrals',
    list: [
      'Coupons are single-use per customer unless the coupon itself states otherwise, and cannot be combined with another coupon on the same order.',
      'Reward points and referral credits have no cash value, cannot be transferred or withdrawn, and may expire.',
      'We may withdraw or modify any promotional offer at any time, and may cancel rewards obtained through misuse or fraud.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      'All content on this website - including our name, logo, recipe descriptions, photography, page copy and design - belongs to {{brand}} or our licensors. You may not copy, reproduce or use it commercially without our written permission.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, our total liability in connection with any order is limited to the amount you paid for that order. We are not liable for indirect or consequential losses, or for delays caused by events outside our reasonable control.',
      'Nothing in these terms limits any liability that cannot lawfully be limited, including liability for death or personal injury caused by our negligence.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of India, and any dispute arising from them is subject to the exclusive jurisdiction of the courts at {{city}}.',
    ],
  },
];

export default function Terms() {
  return (
    <LegalShell
      title="Terms & Conditions"
      updated="8 September 2026"
      intro="Please read these terms carefully before ordering. They explain how our on-demand snack service works, what you can expect from us, and what we ask of you."
      sections={SECTIONS}
    />
  );
}
