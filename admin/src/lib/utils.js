export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export const formatDate = (value, opts = {}) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(new Date(value))
    : '-';

export const formatDateTime = (value) =>
  value ? formatDate(value, { hour: 'numeric', minute: '2-digit', hour12: true }) : '-';

/** "3 days ago" / "just now", used for last-updated hints. */
const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31536000000], ['month', 2592000000], ['day', 86400000],
  ['hour', 3600000], ['minute', 60000],
];

export const formatRelative = (value) => {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  const unit = UNITS.find(([, ms]) => Math.abs(diff) >= ms);
  return unit ? RELATIVE.format(Math.round(diff / unit[1]), unit[0]) : 'just now';
};

export const ORDER_STATUSES = ['Confirmed', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

/* -------------------------------------------------------------------------- */
/* Status vocabularies                                                        */
/*                                                                            */
/* Each domain gets its own explicitly named map. They used to be three        */
/* different things all called STATUS_COLOR, two of them shadowing this one    */
/* inside page files.                                                         */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS_COLOR = {
  Confirmed: 'info',
  Preparing: 'warning',
  Packed: 'secondary',
  'Out for Delivery': 'primary',
  Delivered: 'success',
  Cancelled: 'error',
};

export const PAYMENT_STATUS_COLOR = {
  paid: 'success',
  pending: 'warning',
  failed: 'error',
  refunded: 'info',
};

export const REVIEW_STATUS_COLOR = {
  published: 'success',
  pending: 'warning',
  hidden: 'default',
};

export const CONTACT_STATUS_COLOR = {
  new: 'error',
  'in-progress': 'warning',
  resolved: 'success',
};

export const REVIEW_STATUSES = ['published', 'pending', 'hidden'];
export const CONTACT_STATUSES = ['new', 'in-progress', 'resolved'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

/** The next status an admin can move an order to. */
export const nextStatus = (current) => {
  const flow = ORDER_STATUSES.slice(0, 5);
  const i = flow.indexOf(current);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

/** "3 items" / "1 item" — keeps count labels grammatical. */
export const plural = (count, singular, pluralForm) =>
  count + ' ' + (count === 1 ? singular : pluralForm || singular + 's');

/** Sentence-case a machine value for display: "in-progress" -> "In progress". */
export const humanize = (value = '') =>
  String(value).replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
