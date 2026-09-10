'use strict';
const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');
const idParam = { params: z.object({ id: objectId }) };

const addressBody = z.object({
  label: z.enum(['home', 'work', 'hostel', 'other']).default('home'),
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'),
  line1: z.string().trim().min(4).max(160),
  line2: z.string().trim().max(160).optional().or(z.literal('')),
  landmark: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6 digit pincode'),
  isDefault: z.coerce.boolean().optional(),
});

const nutritionDelta = z.object({
  calories: z.coerce.number().default(0),
  protein: z.coerce.number().default(0),
  carbs: z.coerce.number().default(0),
  fat: z.coerce.number().default(0),
  fibre: z.coerce.number().default(0),
}).partial();

module.exports = { objectId, idParam, addressBody, nutritionDelta };
