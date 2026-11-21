#!/usr/bin/env node
'use strict';

const b = require('../src/index.js');

const args = process.argv.slice(2);
const cmd = args.shift();
const hi = args.includes('--hi');
const rest = args.filter((a) => a !== '--hi');

const help = `bharat-utils - Indian validation & formatting toolkit

Usage:
  bharat-utils validate <type> <value>   Types: ${b.SUPPORTED_TYPES.join(', ')}
  bharat-utils detect <value>            Guess what kind of ID a value is
  bharat-utils redact "<text>"           Mask sensitive identifiers in text
                                         (or pipe text via stdin)
  bharat-utils format <amount>           Lakh/crore formatting
  bharat-utils compact <amount>          12.5 L / 1.5 Cr style
  bharat-utils words <amount> [--lang <code>]  en, hi, mr, gu, ta, bn (--hi also works)
  bharat-utils gst <amount> [rate]       GST breakup (default 18%)
  bharat-utils tds <amount> <rate>       TDS estimate
  bharat-utils tax <income> <fy> [regime]  Income tax estimate
  bharat-utils due <fy> <type>           Indicative local dates
                                         gstr-1, gstr-3b, tds-deposit, tds-return, advance-tax
  bharat-utils hsn <code>                Check HSN format
  bharat-utils fy [date]                 Financial year info (default today)
`;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

(async () => {
  try {
    if (cmd === 'validate' && rest.length >= 2) {
      const ok = b.validate(rest[0], rest.slice(1).join(' '));
      console.log(ok ? '✔ valid' : '✘ invalid');
      process.exit(ok ? 0 : 1);
    } else if (cmd === 'detect' && rest[0]) {
      const t = b.detectType(rest.join(' '));
      console.log(t.length ? t.join(', ') : 'unknown');
    } else if (cmd === 'redact' && (rest.length || !process.stdin.isTTY)) {
      const text = rest.length ? rest.join(' ') : await readStdin();
      process.stdout.write(b.redactPII(text) + (rest.length ? '\n' : ''));
    } else if (cmd === 'format' && rest[0]) {
      console.log(b.formatINR(b.parseINR(rest[0]) ?? rest[0]));
    } else if (cmd === 'compact' && rest[0]) {
      console.log(b.formatCompactINR(b.parseINR(rest[0]) ?? rest[0]));
    } else if (cmd === 'words' && rest.length) {
      const langIndex = rest.indexOf('--lang');
      const lang = langIndex === -1 ? (hi ? 'hi' : 'en') : rest.splice(langIndex, 2)[1];
      if (!['en', 'hi', 'mr', 'gu', 'ta', 'bn'].includes(lang)) throw new Error('Unknown or missing language code');
      if (rest.length !== 1) throw new Error('words expects one amount');
      console.log(b.amountInWords(b.parseINR(rest[0]) ?? rest[0], { lang }));
    } else if (cmd === 'gst' && rest[0]) {
      console.log(JSON.stringify(b.calculateGST(Number(rest[0]), rest[1]), null, 2));
    } else if (cmd === 'tds' && rest.length === 2) {
      console.log(JSON.stringify(b.calculateTDS(Number(rest[0]), Number(rest[1])), null, 2));
    } else if (cmd === 'tax' && (rest.length === 2 || rest.length === 3)) {
      console.log(JSON.stringify(b.calculateIncomeTax(Number(rest[0]), { fy: rest[1], regime: rest[2] }), null, 2));
    } else if (cmd === 'due' && rest.length === 2) {
      for (const date of b.dueDates(rest[0], { type: rest[1] })) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        console.log(`${date.getFullYear()}-${month}-${day}`);
      }
    } else if (cmd === 'hsn' && rest.length === 1) {
      const ok = b.isHSN(rest[0]);
      console.log(ok ? '✔ valid' : '✘ invalid');
      process.exitCode = ok ? 0 : 1;
    } else if (cmd === 'fy') {
      const f = b.financialYear(rest[0]);
      console.log(`Financial Year: ${f.label} | Assessment Year: ${f.assessmentYear} | Quarter: Q${f.quarter}`);
    } else {
      console.log(help);
      if (cmd && !['--help', '-h', 'help', 'redact'].includes(cmd)) process.exitCode = 2;
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(2);
  }
})();
