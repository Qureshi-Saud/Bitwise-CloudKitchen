import LegalShell from './LegalShell';

const SECTIONS = [
  {
    heading: 'Where we deliver',
    paragraphs: [
      'We currently deliver across {{city}}: {{areas}}. You can check whether we reach you by entering your pincode at checkout - if we do not serve your area yet, the checkout will tell you before you pay.',
      'We are expanding our radius steadily. If you are just outside our current areas, write to us and we will let you know when we reach you.',
    ],
  },
  {
    heading: 'Delivery slots',
    list: [
      'Breakfast: 8:00 AM to 10:00 AM',
      'Mid-morning: 10:00 AM to 12:00 PM',
      'Lunch: 12:00 PM to 3:00 PM',
      'Evening snack: 4:00 PM to 7:00 PM',
      'Dinner: 7:00 PM to 9:30 PM',
    ],
    paragraphs: [
      'You choose your delivery date and slot at checkout. Each slot closes shortly before it begins so our kitchen has time to cook your order fresh - a closed slot is shown as unavailable rather than hidden, so you always know why.',
      'Slots also have a daily capacity. Once a slot is fully booked it is marked as such, and you can pick the next available one.',
    ],
  },
  {
    heading: 'Delivery charges',
    list: [
      'A flat delivery charge of {{deliveryFee}} applies to most orders.',
      'Delivery is free on orders above {{freeDeliveryAbove}} (calculated after any coupon discount).',
      'The exact delivery charge for your order is always shown in the cart and again at checkout, before you pay.',
      'The minimum order value is {{minOrderValue}}.',
    ],
  },
  {
    heading: 'Preparation and delivery time',
    paragraphs: [
      'Most snacks are prepared in 15 to 25 minutes. Your order then leaves our kitchen and reaches you within your chosen slot. Overnight items such as oats jars are prepared ahead so they are ready at the start of your slot.',
      'Delivery times are estimates. Heavy rain, traffic and unusually high order volumes can cause delays, and we will keep you updated through the Track Order page if that happens.',
    ],
  },
  {
    heading: 'Tracking your order',
    paragraphs: [
      'Every order moves through five stages: Order Confirmed, Preparing Your Snack, Packed, Out for Delivery and Delivered. Open the Track Order page and enter your order number to follow it live - the status updates the moment our kitchen moves your order along, without you needing to refresh.',
    ],
  },
  {
    heading: 'Receiving your order',
    list: [
      'Please stay reachable on the phone number you gave at checkout during your slot.',
      'Our delivery partner will wait up to 5 minutes at your address before attempting to call you.',
      'If nobody can be reached, we may leave the order at the address given (for example at a reception or gate) or return it to the kitchen. Orders returned this way are not refundable.',
      'For Cash on Delivery orders, please have the exact amount ready where possible.',
    ],
  },
  {
    heading: 'Packaging',
    paragraphs: [
      'Snacks are sealed in tamper-evident, food-grade packaging. Salads and jars travel in leak-resistant containers, and wraps and sandwiches are wrapped to stay warm. If your packaging arrives damaged or open, do not eat the food - contact us within 4 hours and we will refund or resend it.',
    ],
  },
  {
    heading: 'Bulk and office orders',
    paragraphs: [
      'For 15 portions or more, please contact us at least 24 hours in advance through the Contact page or WhatsApp. We will confirm quantities, timing and pricing separately. Bulk orders are still single, one-time orders - we do not run office subscription plans.',
    ],
  },
];

export default function ShippingPolicy() {
  return (
    <LegalShell
      title="Shipping & Delivery Policy"
      updated="8 September 2026"
      intro="Where we deliver, when we deliver, what it costs and what happens if something goes wrong on the way to you."
      sections={SECTIONS}
    />
  );
}
