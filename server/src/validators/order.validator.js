'use strict';
const { z } = require('zod');
const { objectId, addressBody } = require('./common.validator');

const customizationSelection = z.object({
  groupKey: z.string().trim().max(30),
  optionIds: z.array(objectId).max(10).default([]),
});

const cartItem = z.object({
  kind: z.enum(['product', 'snackbox']).default('product'),
  productId: objectId.optional(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
  customizations: z.array(customizationSelection).max(12).default([]),
  specialInstructions: z.string().trim().max(300).optional(),
  boxItems: z.array(z.object({
    productId: objectId,
    quantity: z.coerce.number().int().min(1).max(10),
  })).max(12).optional(),
  extras: z.array(z.string().trim().max(30)).max(10).optional(),
}).refine((v) => (v.kind === 'snackbox' ? Boolean(v.boxItems?.length) : Boolean(v.productId)), {
  message: 'Each cart line needs a product, and a snack box needs box items',
});

const items = z.array(cartItem).min(1, 'Your cart is empty').max(30);

module.exports = {
  quote: { body: z.object({ items, couponCode: z.string().trim().toUpperCase().max(20).optional() }) },
  create: {
    body: z.object({
      items,
      couponCode: z.string().trim().toUpperCase().max(20).optional(),
      addressId: objectId.optional(),
      address: addressBody.optional(),
      slotId: objectId,
      deliveryDate: z.coerce.date(),
      paymentMethod: z.enum(['cod', 'upi', 'razorpay']),
      customerNote: z.string().trim().max(300).optional(),
    }).refine((v) => Boolean(v.addressId || v.address), { message: 'A delivery address is required' }),
  },
  list: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
      status: z.string().trim().max(30).optional(),
      paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
      search: z.string().trim().max(40).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }),
  },
  updateStatus: {
    params: z.object({ id: objectId }),
    body: z.object({
      status: z.enum(['Confirmed', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled']),
      note: z.string().trim().max(200).optional(),
    }),
  },
  cancel: {
    params: z.object({ id: objectId }),
    body: z.object({ reason: z.string().trim().min(3).max(300) }),
  },
  track: { params: z.object({ orderNumber: z.string().trim().min(6).max(30) }) },
};
