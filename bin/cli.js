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
  bharat-utils redact "<text>"           Mask Aadhaar/PAN/GSTIN/mobile/email in text
                                         (or pipe text via stdin)
  bharat-utils format <amount>           Lakh/crore formatting
  bharat-utils compact <amount>          12.5 L / 1.5 Cr style
  bharat-utils words <amount> [--hi]     Amount in words (English or Hindi)
  bharat-utils gst <amount> [rate]       GST breakup (default 18%)
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
    } else if (cmd === 'words' && rest[0]) {
      console.log(b.amountInWords(b.parseINR(rest[0]) ?? rest[0], { lang: hi ? 'hi' : 'en' }));
    } else if (cmd === 'gst' && rest[0]) {
      console.log(JSON.stringify(b.calculateGST(Number(rest[0]), rest[1] ? Number(rest[1]) : 18), null, 2));
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
