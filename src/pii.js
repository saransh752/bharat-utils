'use strict';

const { isAadhaar } = require('./aadhaar');
const { isPAN } = require('./pan');
const { isGSTIN } = require('./gstin');
const { isMobile, isIFSC } = require('./contact');
const { isUPI, isPassport, isVoterId } = require('./ids');
const {
  maskKeepLast, maskEmail, maskUPI, maskPassport, maskVoterId, maskCard, maskBankAccount,
} = require('./mask');

function isCard(value) {
  const digits = value.replace(/[ -]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const digit = Number(digits[i]);
    const doubled = (digits.length - 1 - i) % 2 ? digit * 2 : digit;
    sum += doubled > 9 ? doubled - 9 : doubled;
  }
  return sum % 10 === 0;
}

const isBankAccount = (value) => /^\d{9,18}$/.test(value);
const maskLast4 = (value) => maskKeepLast(value, 4);

// Priority order matters: earlier types win when matches overlap.
const DETECTORS = [
  { type: 'gstin', re: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi, ok: isGSTIN, mask: maskLast4 },
  { type: 'card', re: /(?<!\d[ -]?)(?:\d[ -]?){12,18}\d(?![ -]?\d)/g, ok: isCard, mask: maskCard },
  { type: 'aadhaar', re: /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g, ok: isAadhaar, mask: maskLast4 },
  { type: 'pan', re: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, ok: isPAN, mask: maskLast4 },
  { type: 'email', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ok: () => true, mask: maskEmail },
  { type: 'upi', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9]{1,63}(?![A-Za-z0-9])/g, ok: isUPI, mask: maskUPI },
  { type: 'passport', re: /\b[A-Z]\d{7}\b/gi, ok: isPassport, mask: maskPassport },
  { type: 'voterid', re: /\b[A-Z]{3}\d{7}\b/gi, ok: isVoterId, mask: maskVoterId },
  {
    type: 'bankaccount',
    re: /(?<![\p{L}\p{M}\p{N}_])(?:a\/c|acct|account|खाता)(?:[ \t]+(?:no\.?|number|संख्या))?[ \t]*(?:[:#-][ \t]*)?(\d{9,18})(?!\d)/giu,
    capture: 1,
    ok: isBankAccount,
    mask: maskBankAccount,
  },
  { type: 'mobile', re: /(?<!\d)(?:\+91[ -]?|91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g, ok: isMobile, mask: maskLast4 },
  { type: 'ifsc', re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, ok: isIFSC, mask: maskLast4 },
];

/**
 * Finds sensitive Indian identifiers inside free text.
 * Returns [{ type, value, start, end }] sorted by position.
 * Only values that pass real validation (checksums included) are reported.
 */
function findPII(text, options = {}) {
  const s = String(text == null ? '' : text);
  const wanted = options.types ? new Set(options.types) : null;
  const excluded = new Set(options.exclude);
  const taken = [];
  const occupied = new Uint8Array(s.length);
  for (const d of DETECTORS) {
    if (excluded.has(d.type) || (wanted ? !wanted.has(d.type) : d.type === 'ifsc')) continue;
    d.re.lastIndex = 0;
    let m;
    while ((m = d.re.exec(s)) !== null) {
      const value = m[d.capture || 0];
      const end = m.index + m[0].length;
      const start = end - value.length;
      if (!d.ok(value)) continue;
      if (occupied.subarray(start, end).includes(1)) continue;
      occupied.fill(1, start, end);
      taken.push({ type: d.type, value, start, end });
    }
  }
  return taken.sort((a, b) => a.start - b.start);
}

/**
 * Masks sensitive identifiers in text. Safe to use before logging.
 *   redactPII('PAN ABCPE1234F, call 98765 43210')
 *   -> 'PAN XXXXXX234F, call XXXXX X3210'
 */
function redactPII(text, options = {}) {
  let current = String(text == null ? '' : text);
  // A high-priority mask can expose an overlapping lower-priority identifier.
  // Every changing pass replaces original identifier characters with mask characters.
  while (true) {
    const found = findPII(current, options);
    if (!found.length) return current;
    let out = '';
    let cursor = 0;
    for (const f of found) {
      const det = DETECTORS.find((d) => d.type === f.type);
      out += current.slice(cursor, f.start) + det.mask(f.value);
      cursor = f.end;
    }
    out += current.slice(cursor);
    if (out === current) return current;
    current = out;
  }
}

module.exports = { findPII, redactPII };
