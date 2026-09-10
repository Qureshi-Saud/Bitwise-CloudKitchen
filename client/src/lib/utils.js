import clsx from 'clsx';

export const cn = (...args) => clsx(...args);

export const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export const formatDate = (value, opts = {}) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts }).format(new Date(value))
    : '';

export const formatDateTime = (value) =>
  value ? formatDate(value, { hour: 'numeric', minute: '2-digit', hour12: true }) : '';

const toISODate = (date) => {
  const d = new Date(date);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
};

/** Next `count` selectable delivery dates starting today. */
export const upcomingDates = (count = 5) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: toISODate(d),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDate(d, { weekday: 'short', year: undefined }),
      sub: formatDate(d, { year: undefined }),
    };
  });

export const round = (n, dp = 0) => {
  const f = 10 ** dp;
  return Math.round((Number(n) || 0) * f) / f;
};

/** A stable id for a cart line, so the same product with different options stays separate. */
export const cartLineId = (item) => {
  if (item.kind === 'snackbox') {
    const box = (item.boxItems || []).map((b) => b.productId + 'x' + b.quantity).sort().join('|');
    return 'box:' + box + ':' + (item.extras || []).slice().sort().join(',');
  }
  const opts = (item.customizations || [])
    .map((c) => c.groupKey + '=' + (c.optionIds || []).slice().sort().join('+'))
    .sort()
    .join('|');
  return item.productId + (opts ? ':' + opts : '');
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

export const truncate = (text = '', max = 90) => (text.length > max ? text.slice(0, max - 1) + '...' : text);
