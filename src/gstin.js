'use strict';

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
  '97': 'Other Territory', '99': 'Centre Jurisdiction',
};

/** Computes the GSTIN check character from the first 14 characters. */
function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const idx = CHARSET.indexOf(first14[i]);
    if (idx < 0) return null;
    const prod = idx * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(prod / 36) + (prod % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

/** Fully validates a GSTIN: structure, state code, embedded PAN and checksum. */
function isGSTIN(value) {
  const v = String(value == null ? '' : value).trim().toUpperCase();
  if (!/^\d{2}[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v)) return false;
  if (!STATE_CODES[v.slice(0, 2)]) return false;
  return gstinCheckChar(v.slice(0, 14)) === v[14];
}

/** Parses a valid GSTIN into its parts, or returns null. */
function parseGSTIN(value) {
  if (!isGSTIN(value)) return null;
  const v = String(value).trim().toUpperCase();
  const stateCode = v.slice(0, 2);
  return {
    gstin: v,
    stateCode,
    state: STATE_CODES[stateCode],
    pan: v.slice(2, 12),
    entityNumber: v[12],
    checkChar: v[14],
  };
}

module.exports = { isGSTIN, parseGSTIN, gstinCheckChar, STATE_CODES };
