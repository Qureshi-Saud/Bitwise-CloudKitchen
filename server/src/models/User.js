'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, enum: ['home', 'work', 'hostel', 'other'], default: 'home' },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'] },
    line1: { type: String, required: true, trim: true, maxlength: 160 },
    line2: { type: String, trim: true, maxlength: 160 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    pincode: { type: String, required: true, match: [/^\d{6}$/, 'Enter a valid 6 digit pincode'] },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, match: [/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'] },
    password: { type: String, minlength: 8, select: false },
    avatar: { url: String, publicId: String },

    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer', index: true },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, index: { unique: true, sparse: true } },

    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    addresses: { type: [addressSchema], default: [] },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    dietPreference: { type: String, enum: ['veg', 'non-veg', 'both'], default: 'both' },

    referralCode: { type: String, unique: true, sparse: true, uppercase: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rewardPoints: { type: Number, default: 0, min: 0 },

    stats: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
    },

    passwordChangedAt: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.pre('save', function ensureReferralCode(next) {
  if (!this.referralCode) {
    this.referralCode = 'BW' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  next();
});

userSchema.pre('save', function ensureSingleDefaultAddress(next) {
  if (this.isModified('addresses') && this.addresses.length) {
    const defaults = this.addresses.filter((a) => a.isDefault);
    if (defaults.length === 0) this.addresses[0].isDefault = true;
    if (defaults.length > 1) {
      let seen = false;
      this.addresses.forEach((a) => {
        if (a.isDefault && seen) a.isDefault = false;
        else if (a.isDefault) seen = true;
      });
    }
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.passwordChangedAfter = function passwordChangedAfter(jwtIssuedAt) {
  if (!this.passwordChangedAt || !jwtIssuedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAt;
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return raw;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  return raw;
};

userSchema.virtual('defaultAddress').get(function defaultAddress() {
  return this.addresses?.find((a) => a.isDefault) || this.addresses?.[0] || null;
});

module.exports = mongoose.model('User', userSchema);
