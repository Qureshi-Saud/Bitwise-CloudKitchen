'use strict';
const { z } = require('zod');

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/\d/, 'Include at least one number');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const name = z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long');
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number');

module.exports = {
  password,
  register: { body: z.object({ name, email, password, phone: phone.optional(), referralCode: z.string().trim().toUpperCase().max(12).optional() }) },
  login: { body: z.object({ email, password: z.string().min(1, 'Password is required') }) },
  googleLogin: { body: z.object({ idToken: z.string().min(20, 'Missing Google credential') }) },
  verifyEmail: { body: z.object({ token: z.string().min(10) }) },
  resendVerification: { body: z.object({ email }) },
  forgotPassword: { body: z.object({ email }) },
  resetPassword: { body: z.object({ token: z.string().min(10), password }) },
  changePassword: { body: z.object({ currentPassword: z.string().min(1), newPassword: password }) },
};
