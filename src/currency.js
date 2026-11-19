'use strict';

const { numberToWordsHindi, amountInWordsHindi } = require('./hindi');

/**
 * Formats a number in the Indian digit-grouping system.
 *   formatINR(1234567.5) -> "₹12,34,567.50"
 */
function formatINR(amount, options = {}) {
  const { symbol = '₹', decimals = 2 } = options;
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new TypeError('formatINR expects a finite number');
  const negative = n < 0;
  const [intPart, decPart] = Math.abs(n).toFixed(decimals).split('.');
  let grouped;
  if (intPart.length <= 3) {
    grouped = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    grouped = rest + ',' + last3;
  }
  return (negative ? '-' : '') + symbol + grouped + (decPart ? '.' + decPart : '');
}

/**
 * Compact Indian style: 1250000 -> "₹12.5 L", 15000000 -> "₹1.5 Cr", 25000 -> "₹25 K".
 */
function formatCompactINR(amount, options = {}) {
  const { symbol = '₹' } = options;
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new TypeError('formatCompactINR expects a finite number');
  const abs = Math.abs(n);
  const trim = (v) => Number(v.toFixed(2)).toString();
  let body;
  if (abs >= 1e7) body = trim(abs / 1e7) + ' Cr';
  else if (abs >= 1e5) body = trim(abs / 1e5) + ' L';
  else if (abs >= 1e3) body = trim(abs / 1e3) + ' K';
  else body = trim(abs);
  return (n < 0 ? '-' : '') + symbol + body;
}

/**
 * Parses human-written rupee amounts into numbers.
 *   parseINR("₹12,34,567.50") -> 1234567.5
 *   parseINR("1.5 crore")     -> 15000000
 *   parseINR("50k")           -> 50000
 * Returns null if the text cannot be understood.
 */
function parseINR(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  let s = String(input == null ? '' : input).trim().toLowerCase();
  s = s.replace(/^(-?)\s*(?:₹|rs\.?|inr)\s*/, '$1').replace(/,/g, '').trim();
  const m = /^(-?\d*\.?\d+)\s*(k|thousand|l|lac|lacs|lakh|lakhs|cr|crore|crores)?$/.exec(s);
  if (!m) return null;
  const mult = { k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 };
  return Number((Number(m[1]) * (m[2] ? mult[m[2]] : 1)).toFixed(2));
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below100(n) {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}
function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? ONES[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? below100(r) : '');
}

/**
 * Integer to words in the Indian system. Pass { lang: 'hi' } for Hindi.
 */
function numberToWords(value, options = {}) {
  if (options.lang === 'hi') return numberToWordsHindi(value);
  const num = Number(value);
  if (!Number.isFinite(num)) throw new RangeError('Number out of range');
  let n = Math.trunc(Math.abs(num));
  if (n > Number.MAX_SAFE_INTEGER) throw new RangeError('Number out of range');
  if (n === 0) return 'Zero';
  const parts = [];
  for (const [size, name] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']]) {
    const q = Math.floor(n / size);
    if (q) {
      parts.push((size === 10000000 ? numberToWords(q) : below100(q)) + ' ' + name);
      n %= size;
    }
  }
  if (n) parts.push(below1000(n));
  return (num < 0 ? 'Minus ' : '') + parts.join(' ');
}

/**
 * Cheque / invoice style amount in words. Pass { lang: 'hi' } for Hindi.
 *   amountInWords(1250.5) -> "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only"
 */
function amountInWords(amount, options = {}) {
  if (options.lang === 'hi') return amountInWordsHindi(amount);
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new TypeError('amountInWords expects a finite number');
  const total = Math.round(Math.abs(n) * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  let out = 'Rupees ' + numberToWords(rupees);
  if (paise) out += ' and ' + below100(paise) + ' Paise';
  return (n < 0 ? 'Minus ' : '') + out + ' Only';
}

const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

/**
 * GST calculator for invoices.
 *   calculateGST(1000, 18)                      -> CGST 90 + SGST 90, total 1180
 *   calculateGST(1180, 18, { inclusive: true }) -> base 1000
 *   calculateGST(1000, 18, { interState: true })-> IGST 180
 */
function calculateGST(amount, rate = 18, options = {}) {
  const { inclusive = false, interState = false } = options;
  const a = Number(amount);
  const rt = Number(rate);
  if (!Number.isFinite(a) || a < 0) throw new TypeError('amount must be a non-negative number');
  if (!Number.isFinite(rt) || rt < 0 || rt > 100) throw new RangeError('rate must be between 0 and 100');
  const base = r2(inclusive ? a / (1 + rt / 100) : a);
  const totalTax = r2(inclusive ? a - base : (base * rt) / 100);
  let cgst = 0, sgst = 0, igst = 0;
  if (interState) {
    igst = totalTax;
  } else {
    cgst = r2(totalTax / 2);
    sgst = r2(totalTax - cgst);
  }
  return { base, rate: rt, cgst, sgst, igst, totalTax, total: r2(base + totalTax) };
}

module.exports = { formatINR, formatCompactINR, parseINR, numberToWords, amountInWords, calculateGST };
