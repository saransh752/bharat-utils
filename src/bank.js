'use strict';

const { isIFSC } = require('./contact');

const BANKS = {
  SBIN: 'State Bank of India', HDFC: 'HDFC Bank', ICIC: 'ICICI Bank', UTIB: 'Axis Bank',
  PUNB: 'Punjab National Bank', BARB: 'Bank of Baroda', CNRB: 'Canara Bank', KKBK: 'Kotak Mahindra Bank',
  IDIB: 'Indian Bank', UBIN: 'Union Bank of India', BKID: 'Bank of India', YESB: 'Yes Bank',
  INDB: 'IndusInd Bank', IOBA: 'Indian Overseas Bank', CBIN: 'Central Bank of India',
  MAHB: 'Bank of Maharashtra', UCBA: 'UCO Bank', FDRL: 'Federal Bank', KARB: 'Karnataka Bank',
  SIBL: 'South Indian Bank', RATN: 'RBL Bank', IDFB: 'IDFC FIRST Bank', PYTM: 'Paytm Payments Bank',
  AIRP: 'Airtel Payments Bank', JAKA: 'Jammu & Kashmir Bank', KVBL: 'Karur Vysya Bank',
  TMBL: 'Tamilnad Mercantile Bank', CSBK: 'CSB Bank', DCBL: 'DCB Bank', HSBC: 'HSBC',
  // Indicative prefix lookup. Verify against the bank or the official IFSC directory.
  AUBL: 'AU Small Finance Bank', ESFB: 'Equitas Small Finance Bank',
  JSFB: 'Jana Small Finance Bank', UTKS: 'Utkarsh Small Finance Bank',
  TJSB: 'TJSB Sahakari Bank', SVCB: 'SVC Co-operative Bank',
  TGRB: 'Telangana Grameena Bank',
  FINO: 'Fino Payments Bank', IPOS: 'India Post Payments Bank',
  DEUT: 'Deutsche Bank', CHAS: 'JPMorgan Chase Bank',
  SCBL: 'Standard Chartered Bank', CITI: 'Citibank', DBSS: 'DBS Bank India',
};

/** Returns the bank name for an IFSC code ("SBIN0001234" -> "State Bank of India"), or null. */
function ifscBank(value) {
  if (!isIFSC(value)) return null;
  return BANKS[String(value).trim().toUpperCase().slice(0, 4)] || null;
}

module.exports = { ifscBank, BANKS };
