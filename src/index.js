'use strict';

const aadhaar = require('./aadhaar');
const pan = require('./pan');
const gstin = require('./gstin');
const contact = require('./contact');
const ids = require('./ids');
const vehicle = require('./vehicle');
const bank = require('./bank');
const pincode = require('./pincode');
const currency = require('./currency');
const hindi = require('./hindi');
const fy = require('./fy');
const mask = require('./mask');
const pii = require('./pii');
const { detectType } = require('./detect');
const { validateData } = require('./schema');
const { getEntry, TYPES } = require('./registry');

/**
 * Validates any supported ID type by name.
 *   validate('pan', 'ABCPE1234F') -> true
 */
function validate(type, value) {
  const entry = getEntry(type);
  if (!entry) throw new Error(`Unknown type "${type}". Supported: ${TYPES.join(', ')}`);
  return entry.test(value);
}

module.exports = {
  ...aadhaar, ...pan, ...gstin, ...contact, ...ids, ...vehicle, ...bank, ...pincode,
  ...currency, ...hindi, ...fy, ...mask, ...pii,
  detectType, validateData, validate, SUPPORTED_TYPES: TYPES,
};
