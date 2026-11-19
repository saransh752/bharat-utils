'use strict';

/** Validates an IFSC code, e.g. SBIN0001234 (4 letters, a zero, 6 alphanumerics). */
function isIFSC(value) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(value == null ? '' : value).trim().toUpperCase());
}

/** Validates a 6-digit Indian PIN code (cannot start with 0). */
function isPincode(value) {
  return /^[1-9]\d{5}$/.test(String(value == null ? '' : value).trim());
}

function stripPhone(value) {
  return String(value == null ? '' : value).replace(/[\s\-()]/g, '');
}

/** Validates an Indian mobile number; accepts +91, 91 or 0 prefixes. */
function isMobile(value) {
  return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(stripPhone(value));
}

/** Normalizes an Indian mobile number to "+91XXXXXXXXXX", or null if invalid. */
function normalizeMobile(value) {
  const v = stripPhone(value);
  if (!isMobile(v)) return null;
  return '+91' + v.slice(-10);
}

module.exports = { isIFSC, isPincode, isMobile, normalizeMobile };
