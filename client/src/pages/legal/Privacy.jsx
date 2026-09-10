import LegalShell from './LegalShell';

const SECTIONS = [
  {
    heading: 'What this policy covers',
    paragraphs: [
      'This Privacy Policy explains what personal information {{brand}} collects when you use our website, why we collect it, how we protect it and what choices you have. It applies to our website, our ordering system and our customer support channels.',
    ],
  },
  {
    heading: 'Information we collect',
    list: [
      'Account information: your name, email address, mobile number and password (stored only as a bcrypt hash, never in readable form).',
      'Delivery information: the addresses you save, including recipient name, phone number, landmark and pincode.',
      'Order information: what you ordered, your customization choices, delivery slot, order status history and the amount paid.',
      'Payment information: the payment method used and a transaction reference. Card numbers, CVV and banking credentials are collected and stored by Razorpay, never by us.',
      'Optional profile information: a profile photo and your vegetarian or non-vegetarian preference, if you choose to add them.',
      'Support and chat information: messages you send through our contact form or to Snack Buddy, our in-app assistant.',
      'Technical information: your IP address, browser and device type, and basic session details, used for security and to keep you signed in.',
    ],
  },
  {
    heading: 'How we use your information',
    list: [
      'To prepare, deliver and track the orders you place.',
      'To create and secure your account, and to keep you signed in across your devices.',
      'To send transactional emails such as order confirmations, status updates, email verification and password resets.',
      'To answer your questions through the contact form, WhatsApp, phone or Snack Buddy.',
      'To detect and prevent fraud, coupon abuse and misuse of our service.',
      'To understand which snacks are popular so we can improve our menu.',
    ],
    paragraphs: [
      'We do not sell your personal information, and we do not share it with advertisers.',
    ],
  },
  {
    heading: 'Who we share information with',
    list: [
      'Razorpay, our payment gateway, to process online payments securely.',
      'Cloudinary, which hosts the images used on our website and any photo you upload.',
      'Our email service provider, to send you transactional emails.',
      'Our delivery partners, who receive only the name, address and phone number needed to complete your delivery.',
      'Law enforcement or regulators, where we are legally required to disclose information.',
    ],
  },
  {
    heading: 'How we protect your information',
    list: [
      'Passwords are hashed with bcrypt and are never recoverable in readable form, even by us.',
      'Sessions use short-lived access tokens with rotating refresh tokens stored in secure, http-only cookies, so a token cannot be read by scripts in your browser.',
      'All traffic between your browser and our servers is encrypted in transit.',
      'Inputs are validated and sanitised on the server to protect against injection and cross-site scripting.',
      'Access to customer data inside our team is limited to the staff who need it to run the kitchen and support you.',
    ],
  },
  {
    heading: 'How long we keep your information',
    paragraphs: [
      'We keep your account and order history for as long as your account is active, because you may need it for reordering, receipts and support. Order records are retained after account closure only where tax or accounting law requires it.',
      'Chat transcripts with Snack Buddy are automatically deleted after 30 days. Notifications are automatically deleted after 90 days. Expired sign-in sessions are removed automatically.',
    ],
  },
  {
    heading: 'Your choices and rights',
    list: [
      'You can view and update your name, phone number, food preference and saved addresses from your account at any time.',
      'You can sign out from a single device, or from all devices at once, under Account > Security.',
      'You can ask us for a copy of the personal information we hold about you, or ask us to delete your account, by emailing our support address.',
      'You can opt out of promotional emails at any time. We will still send you transactional emails about orders you place.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    paragraphs: [
      'We use a secure, http-only cookie to keep you signed in. We use your browser local storage to remember your cart and your Snack Buddy chat session so you do not lose them if you refresh the page. We do not use advertising or cross-site tracking cookies.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Our service is not directed at children under 18. We do not knowingly collect personal information from children. If you believe a child has given us information, please contact us and we will delete it.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If we make a material change to how we handle your information, we will update this page and, where appropriate, notify you by email. The "last updated" date at the top always reflects the current version.',
    ],
  },
];

export default function Privacy() {
  return (
    <LegalShell
      title="Privacy Policy"
      updated="8 September 2026"
      intro="We collect the minimum information needed to cook and deliver your order, and we protect it carefully. Here is exactly what we hold and why."
      sections={SECTIONS}
    />
  );
}
