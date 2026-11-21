'use strict';

const { isAadhaar } = require('./aadhaar');
const { isPAN } = require('./pan');
const { isGSTIN } = require('./gstin');
const { isMobile } = require('./contact');
const { maskKeepLast, maskEmail } = require('./mask');

// Priority order matters: earlier types win when matches overlap.
const DETECTORS = [
  { type: 'gstin', re: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/gi, ok: isGSTIN, mask: (s) => maskKeepLast(s, 4) },
  { type: 'aadhaar', re: /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g, ok: isAadhaar, mask: (s) => maskKeepLast(s, 4) },
  { type: 'pan', re: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, ok: isPAN, mask: (s) => maskKeepLast(s, 4) },
  { type: 'mobile', re: /(?<!\d)(?:\+91[ -]?|91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?!\d)/g, ok: isMobile, mask: (s) => maskKeepLast(s, 4) },
  { type: 'email', re: /(?<![A-Za-z0-9._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ok: () => true, mask: maskEmail },
];

/**
 * Finds sensitive Indian identifiers inside free text.
 * Returns [{ type, value, start, end }] sorted by position.
 * Only values that pass real validation (checksums included) are reported.
 */
function findPII(text, options = {}) {
  const s = String(text == null ? '' : text);
  const wanted = options.types ? new Set(options.types) : null;
  const taken = [];
  const occupied = new Uint8Array(s.length);
  for (const d of DETECTORS) {
    if (wanted && !wanted.has(d.type)) continue;
    d.re.lastIndex = 0;
    let m;
    while ((m = d.re.exec(s)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (!d.ok(m[0])) continue;
      if (occupied.subarray(start, end).includes(1)) continue;
      occupied.fill(1, start, end);
      taken.push({ type: d.type, value: m[0], start, end });
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
  const s = String(text == null ? '' : text);
  const found = findPII(s, options);
  let out = '';
  let cursor = 0;
  for (const f of found) {
    const det = DETECTORS.find((d) => d.type === f.type);
    out += s.slice(cursor, f.start) + det.mask(f.value);
    cursor = f.end;
  }
  return out + s.slice(cursor);
}

module.exports = { findPII, redactPII };
