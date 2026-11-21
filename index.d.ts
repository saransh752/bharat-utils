export type ValidatableType =
  | 'aadhaar' | 'pan' | 'gstin' | 'ifsc' | 'pincode' | 'mobile' | 'vehicle'
  | 'voterid' | 'passport' | 'dl' | 'tan' | 'cin' | 'udyam' | 'upi';

export interface FormatINROptions { symbol?: string; decimals?: number; }
export interface LangOptions { lang?: 'en' | 'hi'; extended?: boolean; }

export interface ParsedGSTIN {
  gstin: string; stateCode: string; state: string; pan: string; entityNumber: string; checkChar: string;
}
export interface ParsedVehicle {
  type: 'standard' | 'bharat-series';
  stateCode?: string; state?: string; rtoCode?: string; series: string; number: string;
  registrationYear?: number;
}
export interface PincodeInfo {
  pincode: string; zone: number; zoneName: string; region: string; approximate: boolean;
}
export interface FinancialYearInfo {
  startYear: number; endYear: number; label: string; assessmentYear: string;
  quarter: 1 | 2 | 3 | 4; start: Date; end: Date;
}
export interface ParsedFinancialYear {
  assessmentYear: string;
  startYear: number; endYear: number; label: string; start: Date; end: Date;
}
export interface GSTBreakup {
  base: number; rate: number; cgst: number; sgst: number; igst: number; totalTax: number; total: number;
}
export interface GSTOptions { inclusive?: boolean; interState?: boolean; }
export interface PIIMatch { type: 'gstin' | 'aadhaar' | 'pan' | 'mobile' | 'email' | 'upi' | 'passport' | 'voterid' | 'card' | 'bankaccount' | 'ifsc'; value: string; start: number; end: number; }
export interface PIIOptions { types?: Array<PIIMatch['type']>; exclude?: Array<PIIMatch['type']>; }

export type SchemaRule = ValidatableType | { type: ValidatableType; required?: boolean; label?: string };
export interface ValidationResult<T extends string = string> {
  valid: boolean;
  errors: Partial<Record<T, string>>;
  data: Partial<Record<T, string>>;
}

// Aadhaar / PAN / GSTIN
export function isAadhaar(value: string | number): boolean;
export function maskAadhaar(value: string | number): string;
export function verhoeffCheckDigit(digits: string | number): number;
export function isPAN(value: string): boolean;
export function panHolderType(value: string): string | null;
export function isGSTIN(value: string): boolean;
export function parseGSTIN(value: string): ParsedGSTIN | null;
export function gstinCheckChar(first14: string): string | null;
export const STATE_CODES: Record<string, string>;

// Contact & bank
export function isIFSC(value: string): boolean;
export function ifscBank(value: string): string | null;
export const BANKS: Record<string, string>;
export function isPincode(value: string | number): boolean;
export function pincodeInfo(value: string | number): PincodeInfo | null;
export function isMobile(value: string | number): boolean;
export function normalizeMobile(value: string | number): string | null;

// Other IDs
export function isVoterId(value: string): boolean;
export function isPassport(value: string): boolean;
export function isDrivingLicence(value: string): boolean;
export function isTAN(value: string): boolean;
export function isCIN(value: string): boolean;
export function isUdyam(value: string): boolean;
export function isUPI(value: string): boolean;
export function parseUPI(value: string): { username: string; handle: string } | null;
export function isVehicleNumber(value: string): boolean;
export function parseVehicleNumber(value: string): ParsedVehicle | null;
export const VEHICLE_STATES: Record<string, string>;

// Money
export function formatINR(amount: number | string, options?: FormatINROptions): string;
export function formatCompactINR(amount: number | string, options?: { symbol?: string }): string;
export function parseINR(input: string | number): number | null;
export function numberToWords(value: number, options?: LangOptions): string;
export function amountInWords(amount: number | string, options?: LangOptions): string;
export function numberToWordsHindi(value: number): string;
export function amountInWordsHindi(amount: number | string): string;
export function calculateGST(amount: number, rate?: number, options?: GSTOptions): GSTBreakup;

// Dates
export function financialYear(date?: Date | string | number): FinancialYearInfo;
export function parseFinancialYear(label: string): ParsedFinancialYear | null;

// Privacy
export function maskKeepLast(value: string, keep?: number): string;
export function maskPAN(value: string): string;
export function maskGSTIN(value: string): string;
export function maskMobile(value: string): string;
export function maskEmail(value: string): string;
export function maskUPI(value: string): string;
export function maskPassport(value: string): string;
export function maskVoterId(value: string): string;
export function maskCard(value: string): string;
export function maskBankAccount(value: string): string;
export function findPII(text: string, options?: PIIOptions): PIIMatch[];
export function redactPII(text: string, options?: PIIOptions): string;

// Generic helpers
export function detectType(value: string): ValidatableType[];
export function validate(type: ValidatableType, value: string | number): boolean;
export function validateData<S extends Record<string, SchemaRule>>(
  input: Record<string, unknown>, schema: S, options?: LangOptions
): ValidationResult<Extract<keyof S, string>>;
export const SUPPORTED_TYPES: ValidatableType[];

declare const bharat: typeof import('./index');
export default bharat;
