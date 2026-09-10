/*
 * Brand name, tagline, contact details, city, support hours, WhatsApp link and
 * the commerce rules are NOT here - they are business data owned by the admin
 * panel. Read them with useSettings() from ../context/SettingsContext.
 *
 * Only genuinely static, structural copy belongs in this file.
 */

/* Primary links shown in the desktop header. Keep this list short - the bar has to
   share its width with the search, cart and account controls. */
export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Menu', to: '/menu' },
  { label: 'Snack Box', to: '/snack-box' },
  { label: 'Customize', to: '/customize' },
  { label: 'Contact', to: '/contact' },
];

/* Everything else lives in the footer, plus the mobile drawer where there is room. */
export const SECONDARY_NAV_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Nutrition', to: '/nutrition' },
  { label: 'Track Order', to: '/track-order' },
  { label: 'FAQ', to: '/faq' },
];

export const STATUS_COPY = {
  Confirmed: 'We have received your order and sent it to the kitchen.',
  Preparing: 'Your snack is being made fresh right now.',
  Packed: 'Packed, sealed and ready to leave the kitchen.',
  'Out for Delivery': 'On the way to you. Keep your phone handy!',
  Delivered: 'Delivered. Enjoy - and do tell us what you thought!',
  Cancelled: 'This order was cancelled.',
};

export const DIET_FILTERS = [
  { key: 'high-protein', label: 'High Protein' },
  { key: 'high-fibre', label: 'High Fibre' },
  { key: 'under-300-kcal', label: 'Under 300 kcal' },
  { key: 'oats-based', label: 'Oats Based' },
  { key: 'quinoa-based', label: 'Quinoa Based' },
  { key: 'fruit-based', label: 'Fruit Based' },
  { key: 'less-oil', label: 'Less Oil' },
  { key: 'whole-grain', label: 'Whole Grain' },
];

export const PRICE_BANDS = [
  { key: '100-150', label: 'Rs. 100 - Rs. 150' },
  { key: '150-200', label: 'Rs. 150 - Rs. 200' },
  { key: '200+', label: 'Rs. 200 and above' },
];

export const SORT_OPTIONS = [
  { key: 'popular', label: 'Most Popular' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'protein-desc', label: 'Highest Protein' },
  { key: 'calories-asc', label: 'Lowest Calories' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'newest', label: 'Newest First' },
];

export const NUTRITION_DISCLAIMER =
  'Nutrition values are approximate and may vary according to ingredients, preparation method and portion size.';

export const HOW_IT_WORKS = [
  { step: 'Explore', text: 'Browse six snack categories with full nutrition on every card.' },
  { step: 'Choose', text: 'Pick what you are craving - filter by protein, fibre, calories or price.' },
  { step: 'Customize', text: 'Swap the base, protein, veggies, seeds or sauces. Price updates live.' },
  { step: 'Order', text: 'Pick a delivery slot, pay by UPI, card or cash on delivery.' },
  { step: 'Enjoy', text: 'Track it to your door and rate it once it arrives.' },
];
