'use strict';
const nodemailer = require('nodemailer');
const env = require('../config/env');
const settingsService = require('../services/settings.service');
const logger = require('../config/logger');

let transporter = null;
const isConfigured = Boolean(env.mail.host && env.mail.user && env.mail.pass);

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: { user: env.mail.user, pass: env.mail.pass },
  });
} else {
  logger.warn('SMTP is not configured - transactional emails will be logged instead of sent.');
}

const layout = (title, body) => {
  const { general } = settingsService.snapshot();

  return [
  '<div style="margin:0;padding:24px;background:#f6f7f4;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1f2937">',
  '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e6e8e1">',
  '<div style="background:#166534;padding:20px 24px;color:#fff">',
  '<div style="font-size:18px;font-weight:700">' + general.siteName + '</div>',
  '<div style="font-size:12px;opacity:.85">' + general.tagline + '</div>',
  '</div><div style="padding:24px">',
  '<h2 style="margin:0 0 12px;font-size:20px">' + title + '</h2>',
  body,
  '</div><div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#6b7280">',
  'Need help? Write to ' + general.contactEmail + ' or call ' + general.contactNumber + '.',
  '</div></div></div>',
  ].join('');
};

const button = (href, label) =>
  '<p style="margin:20px 0"><a href="' + href +
  '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block">' +
  label + '</a></p>';

/**
 * Display name follows the store name set in the admin panel, then
 * MAIL_FROM_NAME, then nothing at all. The envelope address stays in env
 * because it is tied to the SMTP domain.
 */
function fromHeader() {
  const name = settingsService.snapshot().general.siteName || env.mail.fromName;
  return name ? '"' + name + '" <' + env.mail.fromEmail + '>' : env.mail.fromEmail;
}

async function sendMail({ to, subject, html, text }) {
  if (!isConfigured) {
    logger.info('[MAIL:DEV] to=' + to + ' subject=' + subject);
    return { queued: false, dev: true };
  }
  try {
    await transporter.sendMail({
      from: fromHeader(),
      to,
      subject,
      html,
      text: text || subject,
    });
    return { queued: true };
  } catch (err) {
    // Email must never break the main business transaction.
    logger.error('Failed to send email to ' + to + ': ' + err.message);
    return { queued: false, error: err.message };
  }
}

const templates = {
  verifyEmail: (name, link) => ({
    subject: 'Verify your email address',
    html: layout('Welcome, ' + name + '!',
      '<p>Confirm your email address to start ordering fresh, healthy snacks.</p>' +
      button(link, 'Verify Email') +
      '<p style="font-size:12px;color:#6b7280">This link expires in 24 hours.</p>'),
  }),
  resetPassword: (name, link) => ({
    subject: 'Reset your password',
    html: layout('Password reset requested',
      '<p>Hi ' + name + ', use the button below to set a new password.</p>' +
      button(link, 'Reset Password') +
      '<p style="font-size:12px;color:#6b7280">Valid for 30 minutes. Ignore this email if you did not request it.</p>'),
  }),
  orderPlaced: (name, order) => ({
    subject: 'Order ' + order.orderNumber + ' confirmed',
    html: layout('Your snacks are on the way!',
      '<p>Hi ' + name + ', we have received your order <b>' + order.orderNumber + '</b>.</p>' +
      '<p>Order total: <b>Rs. ' + order.pricing.total + '</b><br/>Payment method: ' +
      String(order.payment.method).toUpperCase() + '</p>' +
      '<p>You can follow the live status on the Track Order page any time.</p>'),
  }),
  orderStatus: (name, order) => ({
    subject: 'Order ' + order.orderNumber + ' is now ' + order.status,
    html: layout('Order status updated',
      '<p>Hi ' + name + ', your order <b>' + order.orderNumber + '</b> is now <b>' + order.status + '</b>.</p>'),
  }),
  contactAck: (name) => {
    const hours = settingsService.snapshot().general.supportHours;
    return {
      subject: 'We received your message',
      html: layout('Thanks for reaching out, ' + name,
        '<p>Our team replies' + (hours ? ' within support hours (' + hours + ')' : ' as soon as possible') + '.</p>'),
    };
  },
};

module.exports = { sendMail, templates, isConfigured };
