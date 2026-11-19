'use strict';

const { isPincode } = require('./contact');

const ZONES = {
  1: 'Northern (Delhi, Haryana, Punjab, Himachal Pradesh, J&K, Chandigarh)',
  2: 'Northern (Uttar Pradesh, Uttarakhand)',
  3: 'Western (Rajasthan, Gujarat, Daman & Diu, Dadra & Nagar Haveli)',
  4: 'Western (Maharashtra, Goa, Madhya Pradesh, Chhattisgarh)',
  5: 'Southern (Andhra Pradesh, Telangana, Karnataka)',
  6: 'Southern (Kerala, Tamil Nadu, Puducherry, Lakshadweep)',
  7: 'Eastern (West Bengal, Odisha, North-East, Sikkim, Andaman & Nicobar)',
  8: 'Eastern (Bihar, Jharkhand)',
  9: 'Army Postal Service (APS)',
};

// Exact 3-digit prefixes that differ from their 2-digit region
const SPECIAL3 = {
  160: 'Chandigarh', 403: 'Goa', 605: 'Puducherry', 682: 'Lakshadweep',
  737: 'Sikkim', 744: 'Andaman & Nicobar Islands',
};

// [from, to, region] by first two digits (approximate)
const RANGES = [
  [11, 11, 'Delhi'], [12, 13, 'Haryana'], [14, 16, 'Punjab'], [17, 17, 'Himachal Pradesh'],
  [18, 19, 'Jammu & Kashmir'], [20, 28, 'Uttar Pradesh / Uttarakhand'], [30, 34, 'Rajasthan'],
  [36, 39, 'Gujarat'], [40, 44, 'Maharashtra'], [45, 48, 'Madhya Pradesh'], [49, 49, 'Chhattisgarh'],
  [50, 53, 'Telangana / Andhra Pradesh'], [56, 59, 'Karnataka'], [60, 64, 'Tamil Nadu'],
  [67, 69, 'Kerala'], [70, 74, 'West Bengal'], [75, 77, 'Odisha'], [78, 78, 'Assam'],
  [79, 79, 'North-East India'], [80, 85, 'Bihar / Jharkhand'], [90, 99, 'Army Postal Service'],
];

/**
 * Offline PIN code lookup based on the PIN numbering scheme.
 * Returns { pincode, zone, zoneName, region, approximate } or null.
 * `region` is approximate: a few PIN prefixes straddle state borders.
 */
function pincodeInfo(value) {
  if (!isPincode(value)) return null;
  const pin = String(value).trim();
  const two = Number(pin.slice(0, 2));
  const three = Number(pin.slice(0, 3));
  const hit = RANGES.find(([a, b]) => two >= a && two <= b);
  const region = SPECIAL3[three] || (hit ? hit[2] : 'Unknown');
  return { pincode: pin, zone: Number(pin[0]), zoneName: ZONES[pin[0]], region, approximate: true };
}

module.exports = { pincodeInfo };
