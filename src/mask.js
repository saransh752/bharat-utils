'use strict';

/** Masks every letter/digit except the last `keep`, preserving separators. */
function maskKeepLast(value, keep = 4) {
  const s = String(value == null ? '' : value);
  const total = (s.match(/[A-Za-z0-9]/g) || []).length;
  let seen = 0;
  return s.replace(/[A-Za-z0-9]/g, (ch) => (++seen > total - keep ? ch : 'X'));
}

/** "ABCPE1234F" -> "XXXXXX234F" */
const maskPAN = (v) => maskKeepLast(v, 4);
/** "27AAPFU0939F1ZV" -> "XXXXXXXXXXX1ZV"-style, last 4 kept */
const maskGSTIN = (v) => maskKeepLast(v, 4);
/** "+91 98765 43210" -> "+XX XXXXX X3210" style, last 4 digits kept */
const maskMobile = (v) => maskKeepLast(v, 4);

/** "rahul.sharma@gmail.com" -> "r***@gmail.com" */
function maskEmail(value) {
  const s = String(value == null ? '' : value);
  const at = s.lastIndexOf('@');
  if (at < 1) return s;
  return s[0] + '***' + s.slice(at);
}

module.exports = { maskKeepLast, maskPAN, maskGSTIN, maskMobile, maskEmail };
