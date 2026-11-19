'use strict';

const aadhaar = require('./aadhaar');
const pan = require('./pan');
const gstin = require('./gstin');
const contact = require('./contact');
const ids = require('./ids');
const vehicle = require('./vehicle');

const upper = (v) => String(v == null ? '' : v).trim().toUpperCase();
const squash = (v) => upper(v).replace(/[\s-]/g, '');

/**
 * Central registry: one entry per ID type with its validator, normalizer
 * and human-readable labels (English + Hindi).
 */
const registry = {
  aadhaar: { test: aadhaar.isAadhaar, normalize: (v) => String(v).replace(/[\s-]/g, ''), en: 'Aadhaar number', hi: 'आधार संख्या' },
  pan: { test: pan.isPAN, normalize: upper, en: 'PAN', hi: 'पैन' },
  gstin: { test: gstin.isGSTIN, normalize: upper, en: 'GSTIN', hi: 'जीएसटीआईएन' },
  ifsc: { test: contact.isIFSC, normalize: upper, en: 'IFSC code', hi: 'आईएफएससी कोड' },
  pincode: { test: contact.isPincode, normalize: (v) => String(v).trim(), en: 'PIN code', hi: 'पिन कोड' },
  mobile: { test: contact.isMobile, normalize: (v) => contact.normalizeMobile(v), en: 'mobile number', hi: 'मोबाइल नंबर' },
  vehicle: { test: vehicle.isVehicleNumber, normalize: squash, en: 'vehicle number', hi: 'वाहन नंबर' },
  voterid: { test: ids.isVoterId, normalize: squash, en: 'Voter ID', hi: 'वोटर आईडी' },
  passport: { test: ids.isPassport, normalize: squash, en: 'passport number', hi: 'पासपोर्ट नंबर' },
  dl: { test: ids.isDrivingLicence, normalize: squash, en: 'driving licence number', hi: 'ड्राइविंग लाइसेंस नंबर' },
  tan: { test: ids.isTAN, normalize: squash, en: 'TAN', hi: 'टैन' },
  cin: { test: ids.isCIN, normalize: squash, en: 'CIN', hi: 'सीआईएन' },
  udyam: { test: ids.isUdyam, normalize: upper, en: 'Udyam number', hi: 'उद्यम नंबर' },
  upi: { test: ids.isUPI, normalize: (v) => String(v).trim().toLowerCase(), en: 'UPI ID', hi: 'यूपीआई आईडी' },
};

module.exports = { registry, TYPES: Object.keys(registry) };
