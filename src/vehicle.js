'use strict';

const VEHICLE_STATES = {
  AN: 'Andaman & Nicobar Islands', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh', AS: 'Assam',
  BR: 'Bihar', CG: 'Chhattisgarh', CH: 'Chandigarh', DD: 'Daman & Diu', DL: 'Delhi',
  DN: 'Dadra & Nagar Haveli', GA: 'Goa', GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana',
  JH: 'Jharkhand', JK: 'Jammu & Kashmir', KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh',
  LD: 'Lakshadweep', MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur', MP: 'Madhya Pradesh',
  MZ: 'Mizoram', NL: 'Nagaland', OD: 'Odisha', OR: 'Odisha (old code)', PB: 'Punjab',
  PY: 'Puducherry', RJ: 'Rajasthan', SK: 'Sikkim', TN: 'Tamil Nadu', TR: 'Tripura',
  TS: 'Telangana', UA: 'Uttarakhand (old code)', UK: 'Uttarakhand', UP: 'Uttar Pradesh', WB: 'West Bengal',
};

const clean = (v) => String(v == null ? '' : v).toUpperCase().replace(/[\s-]/g, '');

/**
 * Parses an Indian vehicle registration number, e.g. "RJ14 AB 1234".
 * Supports standard plates and Bharat (BH) series. Returns null when invalid.
 */
function parseVehicleNumber(value) {
  const v = clean(value);

  const bh = /^(\d{2})BH(\d{4})([A-Z]{2})$/.exec(v);
  if (bh && bh[2] !== '0000') {
    return { type: 'bharat-series', registrationYear: 2000 + Number(bh[1]), number: bh[2], series: bh[3] };
  }

  const m = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/.exec(v);
  if (!m) return null;
  const [, stateCode, rto, series, number] = m;
  if (!VEHICLE_STATES[stateCode] || Number(rto) === 0 || Number(number) === 0) return null;
  return { type: 'standard', stateCode, state: VEHICLE_STATES[stateCode], rtoCode: rto, series, number };
}

/** True if the value is a well-formed Indian vehicle registration number. */
function isVehicleNumber(value) {
  return parseVehicleNumber(value) !== null;
}

module.exports = { isVehicleNumber, parseVehicleNumber, VEHICLE_STATES };
