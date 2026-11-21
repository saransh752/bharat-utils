'use strict';

const { getEntry, TYPES } = require('./registry');

/**
 * Figures out what kind of Indian ID a string could be.
 *   detectType('ABCPE1234F')  -> ['pan']
 *   detectType('9876543210')  -> ['mobile']
 *   detectType('hello')       -> []
 * Some values are genuinely ambiguous, so an array is returned.
 */
function detectType(value) {
  if (value == null || String(value).trim() === '') return [];
  return TYPES.filter((type) => getEntry(type).test(value));
}

module.exports = { detectType };
