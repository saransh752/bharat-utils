'use strict';

const up = (v) => String(v == null ? '' : v).trim().toUpperCase();
const squash = (v) => up(v).replace(/[\s-]/g, '');

/** Voter ID (EPIC): 3 letters + 7 digits, e.g. ABC1234567 */
function isVoterId(value) {
  return /^[A-Z]{3}\d{7}$/.test(squash(value));
}

/** Indian passport number format: 1 letter + 7 digits, e.g. A1234567 */
function isPassport(value) {
  return /^[A-PR-WY][1-9]\d{5}[1-9]$/.test(squash(value));
}

/** Driving licence: state(2) + RTO(2) + year(4) + serial(7), e.g. RJ1420110012345 */
function isDrivingLicence(value) {
  return /^[A-Z]{2}\d{2}(?:19|20)\d{2}\d{7}$/.test(squash(value));
}

/** TAN (tax deduction account number): ABCD12345E */
function isTAN(value) {
  return /^[A-Z]{4}\d{5}[A-Z]$/.test(squash(value));
}

/** CIN (company identification number), 21 chars, e.g. L12345MH1995PLC123456 */
function isCIN(value) {
  return /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(squash(value));
}

/** Udyam registration number: UDYAM-RJ-17-0012345 */
function isUdyam(value) {
  return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(up(value).replace(/\s/g, ''));
}

/** UPI ID / VPA: name@handle */
function isUPI(value) {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(String(value == null ? '' : value).trim());
}

/** Splits a UPI ID into { username, handle } or returns null. */
function parseUPI(value) {
  if (!isUPI(value)) return null;
  const [username, handle] = String(value).trim().split('@');
  return { username, handle: handle.toLowerCase() };
}

module.exports = { isVoterId, isPassport, isDrivingLicence, isTAN, isCIN, isUdyam, isUPI, parseUPI };
