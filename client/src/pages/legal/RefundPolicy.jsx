import LegalShell from './LegalShell';

const SECTIONS = [
  {
    heading: 'Our approach',
    paragraphs: [
      'Every snack is cooked fresh to order, which means we cannot restock or resell an item once preparation begins. At the same time, if something is genuinely wrong with your order, we will make it right. This policy explains exactly when you can cancel, and when a refund applies.',
      'Because we are an on-demand service with no subscriptions or recurring plans, there are no membership fees, renewal charges or plan cancellations to worry about. Each order stands on its own.',
    ],
  },
  {
    heading: 'Cancelling an order',
    list: [
      'You can cancel free of charge while your order status is Confirmed or Preparing. Open the order under Account > My Orders and cancel it there.',
      'Once the status reaches Packed, the food has already been made and sealed for you, so the order can no longer be cancelled.',
      'If we cancel an order ourselves - for example because an ingredient ran out or we cannot reach your address - you receive a full refund, including the delivery charge.',
    ],
  },
  {
    heading: 'Refund eligibility',
    paragraphs: ['We will refund an item in full, or resend it, in any of the following cases:'],
    list: [
      'The wrong item was delivered.',
      'An item was missing from your order.',
      'The food arrived spoiled, leaking, or in damaged packaging.',
      'A vegetarian order was fulfilled with a non-vegetarian item, or vice versa.',
      'Your order did not arrive at all.',
    ],
  },
  {
    heading: 'When a refund does not apply',
    list: [
      'A change of mind after the order has been packed.',
      'Not being available to receive the order at the delivery address during your chosen slot.',
      'An incorrect or incomplete delivery address supplied at checkout.',
      'A dislike of a flavour, spice level or texture that matches the published description.',
      'Nutrition values differing slightly from the approximate figures published, which are estimates by their nature.',
    ],
  },
  {
    heading: 'How to raise a refund request',
    list: [
      'Contact us within 4 hours of delivery through the Contact page, WhatsApp or our support phone number.',
      'Share your order number and, where relevant, a clear photograph of the item you received.',
      'Our team reviews every request individually and responds within 24 hours during support hours.',
    ],
  },
  {
    heading: 'How refunds are issued',
    list: [
      'Prepaid orders (UPI, card, netbanking or wallet) are refunded to the original payment method within 3 to 5 working days after approval. Your bank may take a further 2 to 3 days to display the credit.',
      'Cash on Delivery orders are refunded as store credit on your account, or by bank transfer to an account you nominate.',
      'Partial refunds are issued when only part of an order was affected - you are refunded for the affected items, not the whole order.',
      'If a coupon was applied, the refund is calculated on the amount you actually paid after the discount.',
    ],
  },
  {
    heading: 'Failed and duplicate payments',
    paragraphs: [
      'If money leaves your account but your order does not confirm, the amount is normally reversed automatically by your bank within 5 to 7 working days. If it has not been reversed after that, send us the transaction reference and we will trace it with Razorpay on your behalf.',
    ],
  },
];

export default function RefundPolicy() {
  return (
    <LegalShell
      title="Refund & Cancellation Policy"
      updated="8 September 2026"
      intro="Fresh food cannot be restocked, so our cancellation window is tied to how far along your order is. If something is wrong on our side, you are always covered."
      sections={SECTIONS}
    />
  );
}
