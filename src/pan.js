'use strict';

const HOLDER_TYPES = {
  P: 'Individual',
  C: 'Company',
  H: 'Hindu Undivided Family',
  F: 'Firm / LLP',
  A: 'Association of Persons',
  T: 'Trust',
  B: 'Body of Individuals',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government',
};

/** Validates PAN format, e.g. ABCPE1234F (4th letter must be a valid holder type). */
function isPAN(value) {
  const v = String(value == null ? '' : value).trim().toUpperCase();
  return /^[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]$/.test(v);
}

/** Returns the holder type of a PAN ("Individual", "Company", ...) or null if invalid. */
function panHolderType(value) {
  if (!isPAN(value)) return null;
  return HOLDER_TYPES[String(value).trim().toUpperCase()[3]];
}

module.exports = { isPAN, panHolderType };
