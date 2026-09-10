/**
 * Long-form copy (FAQs, legal pages, About) refers to the business through
 * tokens rather than repeating the brand name, delivery areas or the money
 * rules — those live in the admin panel and would otherwise go stale the moment
 * an admin changed them.
 *
 * Supported tokens: {{brand}} {{city}} {{areas}} {{deliveryFee}}
 *                   {{freeDeliveryAbove}} {{minOrderValue}} {{supportHours}}
 */

const rupees = (n) => 'Rs. ' + (Number(n) || 0);

/** Joins delivery areas as "A, B and C". */
export const listAreas = (areas = []) =>
  areas.length > 1
    ? areas.slice(0, -1).join(', ') + ' and ' + areas[areas.length - 1]
    : areas[0] || '';

export function fillCopy(text, settings) {
  const tokens = {
    brand: settings.brandName,
    city: settings.city,
    areas: listAreas(settings.serviceAreas),
    deliveryFee: rupees(settings.deliveryFee),
    freeDeliveryAbove: rupees(settings.freeDeliveryAbove),
    minOrderValue: rupees(settings.minOrderValue),
    supportHours: settings.supportHours,
  };

  return String(text).replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in tokens ? tokens[key] : match
  );
}
