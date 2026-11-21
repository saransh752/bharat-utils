'use strict';

const { getEntry } = require('./registry');

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function message(kind, lang, label) {
  if (lang === 'hi') return kind === 'required' ? `${label} आवश्यक है` : `अमान्य ${label}`;
  return kind === 'required' ? `${label} is required` : `Invalid ${label}`;
}

/**
 * Validates an object against a schema of Indian ID types.
 *
 *   validateData(
 *     { pan: 'abcpe1234f', phone: '98765 43210' },
 *     { pan: 'pan', phone: { type: 'mobile', required: false, label: 'Phone' } },
 *     { lang: 'en' }
 *   )
 *   -> { valid: true, errors: {}, data: { pan: 'ABCPE1234F', phone: '+919876543210' } }
 *
 * Fields are required unless `required: false`. `data` holds normalized values.
 */
function validateData(input, schema, options = {}) {
  const lang = options.lang === 'hi' ? 'hi' : 'en';
  const data = input && typeof input === 'object' ? input : {};
  const errors = {};
  const clean = {};

  for (const [field, rule] of Object.entries(schema || {})) {
    const spec = typeof rule === 'string' ? { type: rule } : rule || {};
    const entry = getEntry(spec.type);
    if (!entry) throw new Error(`Unknown type "${spec.type}" for field "${field}"`);
    const label = spec.label || entry[lang];
    const value = data[field];

    if (isEmpty(value)) {
      if (spec.required !== false) errors[field] = message('required', lang, label);
      continue;
    }
    if (typeof value === 'object' || !entry.test(value)) {
      errors[field] = message('invalid', lang, label);
      continue;
    }
    clean[field] = entry.normalize(value);
  }

  return { valid: Object.keys(errors).length === 0, errors, data: clean };
}

module.exports = { validateData };
